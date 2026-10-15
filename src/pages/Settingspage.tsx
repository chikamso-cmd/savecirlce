import { useEffect, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  ImageUp,
  Loader2,
  Mail,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
import { useBrand } from "../contexts/BrandContext";
import { useHelpBot } from "../contexts/HelpBotContext";
import { ThemeSelector } from "../contexts/ThemeProvider";
import { HelpChat } from "../components/support/HelpBot";
import { BRAND_PRESETS, DEFAULT_BRAND } from "../lib/brandPalette";
import { SUPPORT } from "../lib/helpBotKnowledge";

// Organisation settings from v4 §3.1 (type, money mode, branding, policies) and §6.1 (withdrawal policy).
// Sample values; replace with GET/PATCH /organisation.

type Tab = "organisation" | "branding" | "policies" | "rails" | "help";
const TAB_IDS: Tab[] = ["organisation", "branding", "policies", "rails", "help"];

interface Settings {
  name: string;
  email: string;
  phone: string;
  address: string;
  useBranches: boolean;
  brandColour: string;
  senderId: string;
  logoUrl: string | null;
  noticeDays: number;
  instantLimit: number;
  lockInDays: number;
  minBalance: number;
  feeType: "off" | "percent" | "flat";
  feeValue: number;
  perMonth: number;
  twoPersonAbove: number;
  reminderDaysBefore: number;
  reminderTime: string;
}

const INITIAL: Settings = {
  name: "[Organisation name]",
  email: "admin@example.org",
  phone: "08030000000",
  address: "[Office address]",
  useBranches: true,
  brandColour: "#047857",
  senderId: "SaveCircle",
  logoUrl: null,
  noticeDays: 7,
  instantLimit: 20_000,
  lockInDays: 90,
  minBalance: 0,
  feeType: "off",
  feeValue: 0,
  perMonth: 2,
  twoPersonAbove: 100_000,
  reminderDaysBefore: 1,
  reminderTime: "08:00",
};

const ORG = {
  type: "Cooperative",
  moneyMode: "Gateway-hosted",
  provider: "Paystack",
  collectionAccount: "0123456789",
  bank: "[Issuing bank]",
};

const inputCls =
  "w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3.5 text-[15px] focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 disabled:bg-slate-50 disabled:text-slate-500";
const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
      {error ? (
        <span className="mt-1 block text-sm text-red-600">{error}</span>
      ) : (
        hint && (
          <span className="mt-1 block text-xs text-slate-500">{hint}</span>
        )
      )}
    </label>
  );
}

function Card({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="font-bold">{title}</h2>
      {desc && <p className="mt-1 text-sm text-slate-500">{desc}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

export default function SettingsPage() {
  const [params, setParams] = useSearchParams();
  const tabParam = params.get("tab") as Tab | null;
  const tab: Tab = tabParam && TAB_IDS.includes(tabParam) ? tabParam : "organisation";
  const setTab = (t: Tab) => setParams({ tab: t }, { replace: true });

  const { brandColour, setBrandColour, previewBrandColour } = useBrand();
  const { setLauncher } = useHelpBot();
  const [saved, setSaved] = useState<Settings>(() => ({ ...INITIAL, brandColour }));
  const [draft, setDraft] = useState<Settings>(() => ({ ...INITIAL, brandColour }));
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  // payment rails (local only)
  const [testing, setTesting] = useState(false);
  const [checks, setChecks] = useState({
    keys: true,
    webhook: true,
    transfers: true,
    testedAt: new Date().toISOString(),
  });
  const [newKey, setNewKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [keySaving, setKeySaving] = useState(false);

  useEffect(() => {
    document.title = "Settings | SaveCircle";
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));
  const num =
    (key: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement>) =>
      set(key, Number(e.target.value.replace(/\D/g, "")) as never);

  const errors: Partial<Record<keyof Settings, string>> = {};
  if (draft.name.trim().length < 3)
    errors.name = "Enter your organisation name.";
  if (!/^\S+@\S+\.\S+$/.test(draft.email))
    errors.email = "Enter a valid email.";
  if (!/^[A-Za-z0-9]{3,11}$/.test(draft.senderId))
    errors.senderId = "3 to 11 letters or numbers, no spaces.";
  if (draft.twoPersonAbove <= draft.instantLimit)
    errors.twoPersonAbove = "Must be higher than the instant limit.";
  if (draft.feeType === "percent" && draft.feeValue > 20)
    errors.feeValue = "Keep percentage fees at 20% or less.";
  if (draft.perMonth < 1) errors.perMonth = "Allow at least 1 a month.";

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const valid = Object.keys(errors).length === 0;
  const saveBarShown = dirty && tab !== "rails" && tab !== "help";

  // Preview an unsaved brand colour across the whole app; drop the preview when leaving
  useEffect(() => {
    previewBrandColour(draft.brandColour !== saved.brandColour ? draft.brandColour : null);
  }, [draft.brandColour, saved.brandColour, previewBrandColour]);
  useEffect(() => () => previewBrandColour(null), [previewBrandColour]);

  // The help tab already shows the chat, so hide the floating button there,
  // and lift it above the save bar when that is showing
  useEffect(() => {
    setLauncher(tab === "help" ? "hidden" : saveBarShown ? "raised" : "normal");
  }, [tab, saveBarShown, setLauncher]);
  useEffect(() => () => setLauncher("normal"), [setLauncher]);

  // TODO: PATCH /organisation
  const save = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    setSaved(draft);
    setBrandColour(draft.brandColour);
    setSaving(false);
    setToast("Settings saved.");
  };

  const pickLogo = (file?: File) => {
    if (!file) return;
    if (
      !/^image\/(png|jpeg|svg\+xml)$/.test(file.type) ||
      file.size > 1024 * 1024
    ) {
      setToast("Use a PNG, JPG or SVG under 1MB.");
      return;
    }
    set("logoUrl", URL.createObjectURL(file)); // TODO: upload, then store the returned URL
  };

  // TODO: POST /organisation/rails/test
  const testConnection = async () => {
    setTesting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setChecks({
      keys: true,
      webhook: true,
      transfers: true,
      testedAt: new Date().toISOString(),
    });
    setTesting(false);
    setToast("Connection looks good.");
  };

  // TODO: PUT /organisation/rails/keys (owner only; encrypted server-side)
  const replaceKey = async () => {
    setKeySaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setKeySaving(false);
    setNewKey("");
    setToast("Secret key replaced. Run a connection test to confirm.");
  };

  const TABS: { id: Tab; label: string }[] = [
    { id: "organisation", label: "Organisation" },
    { id: "branding", label: "Branding" },
    { id: "policies", label: "Policies" },
    { id: "rails", label: "Payment rails" },
    { id: "help", label: "Help & support" },
  ];

  const keyValid = /^sk_(live|test)_\w{8,}/.test(newKey);

  return (
    <div className="mx-auto max-w-8xl space-y-6 pb-24">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">
          Your organisation's details, branding and money rules.
        </p>
      </div>

      <div
        role="tablist"
        className="flex gap-1 overflow-x-auto border-b border-slate-200"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`min-h-11 shrink-0 border-b-2 px-4 text-sm font-semibold ${tab === t.id ? "border-emerald-700 text-emerald-800" : "border-transparent text-slate-600 hover:text-slate-900"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "organisation" && (
        <>
          <Card title="Organisation details">
            <Field label="Organisation name" error={errors.name}>
              <input
                className={inputCls}
                value={draft.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email" error={errors.email}>
                <input
                  type="email"
                  className={inputCls}
                  value={draft.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
              <Field label="Phone">
                <input
                  type="tel"
                  className={inputCls}
                  value={draft.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </Field>
            </div>
            <Field label="Address">
              <input
                className={inputCls}
                value={draft.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Organisation type"
                hint="Set during verification. Contact support to change it."
              >
                <input className={inputCls} value={ORG.type} disabled />
              </Field>
              <Field
                label="Money mode"
                hint="Funds sit in your own gateway account, never with SaveCircle."
              >
                <input className={inputCls} value={ORG.moneyMode} disabled />
              </Field>
            </div>
          </Card>
          <Card
            title="Branches"
            desc="Single-office organisations can turn branches off; groups then sit directly under the organisation."
          >
            <label className="flex cursor-pointer items-center justify-between gap-4">
              <span className="text-sm font-medium">Use branches</span>
              <input
                type="checkbox"
                role="switch"
                checked={draft.useBranches}
                onChange={(e) => set("useBranches", e.target.checked)}
                className="size-5 accent-emerald-700"
              />
            </label>
          </Card>
        </>
      )}

      {tab === "branding" && (
        <>
          <Card
            title="Logo and colour"
            desc="Shown to members in the app and on receipts."
          >
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex size-20 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                {draft.logoUrl ? (
                  <img
                    src={draft.logoUrl}
                    alt="Organisation logo"
                    className="size-full object-contain"
                  />
                ) : (
                  <ImageUp
                    className="size-7 text-slate-400"
                    aria-hidden="true"
                  />
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => logoRef.current?.click()}
                  className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:border-emerald-600"
                >
                  {draft.logoUrl ? "Replace logo" : "Upload logo"}
                </button>
                {draft.logoUrl && (
                  <button
                    type="button"
                    onClick={() => set("logoUrl", null)}
                    className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-slate-600 hover:text-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={logoRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                className="sr-only"
                tabIndex={-1}
                onChange={(e) => {
                  pickLogo(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>
            <fieldset>
              <legend className="mb-1 text-sm font-medium text-slate-700">
                Brand colour
              </legend>
              <p className="mb-3 text-xs text-slate-500">
                Re-colours the whole app: menus, buttons, links and highlights.
                You'll see a preview straight away; save to keep it.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {BRAND_PRESETS.map(({ hex, name }) => {
                  const on = draft.brandColour.toLowerCase() === hex.toLowerCase();
                  return (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => set("brandColour", hex)}
                      aria-label={name}
                      title={name}
                      aria-pressed={on}
                      className={`flex size-10 items-center justify-center rounded-full ring-offset-2 ${on ? "ring-2 ring-slate-900" : ""}`}
                      style={{ background: hex }}
                    >
                      {on && <Check className="size-5 text-white" aria-hidden="true" />}
                    </button>
                  );
                })}
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="color"
                    value={draft.brandColour}
                    onChange={(e) => set("brandColour", e.target.value)}
                    aria-label="Custom colour"
                    className="h-10 w-14 cursor-pointer rounded-lg border border-slate-300"
                  />
                  Custom
                </label>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                <span className="font-mono text-slate-600">
                  {draft.brandColour.toUpperCase()}
                </span>
                {draft.brandColour.toLowerCase() !== DEFAULT_BRAND.toLowerCase() && (
                  <button
                    type="button"
                    onClick={() => set("brandColour", DEFAULT_BRAND)}
                    className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-emerald-700"
                  >
                    <RotateCcw className="size-4" aria-hidden="true" /> Reset to
                    SaveCircle green
                  </button>
                )}
              </div>
            </fieldset>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Preview</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="inline-flex min-h-10 items-center rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white">
                  Primary button
                </span>
                <span className="inline-flex min-h-10 items-center rounded-lg border border-emerald-700 px-4 text-sm font-semibold text-emerald-700">
                  Secondary
                </span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  Paid
                </span>
                <span className="text-sm font-semibold text-emerald-700 underline">
                  A link
                </span>
              </div>
            </div>
          </Card>
          <Card
            title="Appearance"
            desc="Light or dark mode for this device. Your brand colour works with both."
          >
            <div className="max-w-sm">
              <ThemeSelector />
            </div>
          </Card>
          <Card
            title="SMS sender ID"
            desc="The name members see on SMS reminders and receipts. Sender IDs need approval from the SMS provider before use."
          >
            <Field
              label="Sender ID"
              error={errors.senderId}
              hint="3 to 11 letters or numbers."
            >
              <input
                className={inputCls}
                value={draft.senderId}
                maxLength={11}
                onChange={(e) =>
                  set("senderId", e.target.value.replace(/\s/g, ""))
                }
              />
            </Field>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">Preview</p>
              <div className="mt-2 max-w-xs rounded-2xl rounded-bl-sm bg-white p-3 text-sm shadow-sm">
                <p
                  className="text-xs font-bold"
                  style={{ color: draft.brandColour }}
                >
                  {draft.senderId || "SenderID"}
                </p>
                <p className="mt-1">
                  {draft.name}: we received {naira(5000)} for [Weekly ajo],
                  cycle 4. Nothing outstanding. Thank you.
                </p>
              </div>
            </div>
          </Card>
        </>
      )}

      {tab === "policies" && (
        <>
          <Card
            title="Withdrawal policy"
            desc="Applies to thrift balances across the organisation. Each group can override it."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Notice period (days)" hint="0 means same-day.">
                <input
                  className={inputCls}
                  inputMode="numeric"
                  value={draft.noticeDays}
                  onChange={num("noticeDays")}
                />
              </Field>
              <Field
                label="Instant limit"
                hint="Below this, notice and second approval are skipped."
              >
                <input
                  className={inputCls}
                  inputMode="numeric"
                  value={naira(draft.instantLimit)}
                  onChange={num("instantLimit")}
                />
              </Field>
              <Field label="Lock-in from first deposit (days)">
                <input
                  className={inputCls}
                  inputMode="numeric"
                  value={draft.lockInDays}
                  onChange={num("lockInDays")}
                />
              </Field>
              <Field
                label="Minimum balance"
                hint="Must stay unless the member is leaving."
              >
                <input
                  className={inputCls}
                  inputMode="numeric"
                  value={naira(draft.minBalance)}
                  onChange={num("minBalance")}
                />
              </Field>
              <Field label="Withdrawals per month" error={errors.perMonth}>
                <input
                  className={inputCls}
                  inputMode="numeric"
                  value={draft.perMonth}
                  onChange={num("perMonth")}
                />
              </Field>
              <Field
                label="Two-person approval above"
                error={errors.twoPersonAbove}
                hint="Maker and checker, never the same person."
              >
                <input
                  className={inputCls}
                  inputMode="numeric"
                  value={naira(draft.twoPersonAbove)}
                  onChange={num("twoPersonAbove")}
                />
              </Field>
            </div>
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium text-slate-700">
                Early-withdrawal fee
              </legend>
              <p className="mb-2 text-xs text-slate-500">
                Only charged if a member asks to shorten the notice.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    ["off", "Off"],
                    ["percent", "%"],
                    ["flat", "Flat ₦"],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={draft.feeType === v}
                    onClick={() => set("feeType", v)}
                    className={`min-h-10 rounded-full border px-4 text-sm font-semibold ${draft.feeType === v ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-slate-300 text-slate-700"}`}
                  >
                    {label}
                  </button>
                ))}
                {draft.feeType !== "off" && (
                  <input
                    className={`${inputCls} w-32`}
                    inputMode="numeric"
                    aria-label="Fee value"
                    value={draft.feeValue}
                    onChange={num("feeValue")}
                  />
                )}
              </div>
              {errors.feeValue && (
                <p className="mt-1 text-sm text-red-600">{errors.feeValue}</p>
              )}
            </fieldset>
          </Card>
          <Card
            title="Payment reminders"
            desc="Sent by WhatsApp or SMS. Members who have paid, or whose credit covers the cycle, are skipped."
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Send reminder">
                <select
                  className={inputCls}
                  value={draft.reminderDaysBefore}
                  onChange={(e) =>
                    set("reminderDaysBefore", Number(e.target.value))
                  }
                >
                  <option value={0}>On the due date</option>
                  <option value={1}>1 day before</option>
                  <option value={2}>2 days before</option>
                  <option value={3}>3 days before</option>
                </select>
              </Field>
              <Field label="At">
                <input
                  type="time"
                  className={inputCls}
                  value={draft.reminderTime}
                  onChange={(e) => set("reminderTime", e.target.value)}
                />
              </Field>
            </div>
          </Card>
        </>
      )}

      {tab === "rails" && (
        <>
          <Card
            title="Connection"
            desc="Your own gateway account. SaveCircle only sends instructions and keeps the record."
          >
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold text-slate-500">
                  Provider
                </dt>
                <dd className="mt-0.5 font-semibold">{ORG.provider}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">
                  Collection account
                </dt>
                <dd className="mt-0.5 font-mono font-semibold">
                  {ORG.collectionAccount.replace(
                    /(\d{4})(\d{3})(\d{3})/,
                    "$1 $2 $3",
                  )}
                </dd>
                <dd className="text-xs text-slate-500">{ORG.bank}</dd>
              </div>
            </dl>
            <ul className="space-y-2 rounded-xl bg-slate-50 p-4">
              {[
                ["Secret key works", checks.keys],
                ["Payment notifications (webhook) connected", checks.webhook],
                ["Automatic transfers allowed", checks.transfers],
              ].map(([label, ok]) => (
                <li key={label as string} className="flex gap-2 text-sm">
                  {ok ? (
                    <CheckCircle2 className="size-4 shrink-0 translate-y-0.5 text-emerald-600" />
                  ) : (
                    <AlertCircle className="size-4 shrink-0 translate-y-0.5 text-amber-600" />
                  )}
                  {label as string}
                </li>
              ))}
              <li className="pt-1 text-xs text-slate-500">
                Last tested{" "}
                {new Date(checks.testedAt).toLocaleString("en-NG", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </li>
            </ul>
            <button
              type="button"
              onClick={testConnection}
              disabled={testing}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:border-emerald-600 disabled:opacity-60"
            >
              {testing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RefreshCw className="size-4" />
              )}{" "}
              Test connection
            </button>
          </Card>
          <Card
            title="Replace secret key"
            desc="Only the owner can do this. Keys are encrypted and never shown again after saving."
          >
            <Field
              label={`New ${ORG.provider} secret key`}
              hint="Starts with sk_live_"
            >
              <div className="relative">
                <input
                  className={`${inputCls} pr-12 font-mono text-sm`}
                  type={showKey ? "text" : "password"}
                  value={newKey}
                  autoComplete="off"
                  spellCheck={false}
                  onChange={(e) => setNewKey(e.target.value.trim())}
                />
                <button
                  type="button"
                  onClick={() => setShowKey((v) => !v)}
                  aria-label={showKey ? "Hide key" : "Show key"}
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 hover:text-emerald-700"
                >
                  {showKey ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </Field>
            <button
              type="button"
              onClick={replaceKey}
              disabled={!keyValid || keySaving}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
            >
              {keySaving && <Loader2 className="size-4 animate-spin" />} Replace
              key
            </button>
          </Card>
        </>
      )}

      {tab === "help" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <HelpChat />
          <div className="space-y-6">
            <Card
              title="How this works"
              desc="The assistant answers simple questions about using SaveCircle. For anything about missing money, disputes, errors or your account, it hands you to a customer representative."
            >
              <p className="text-sm text-slate-600">
                You can also open the assistant from the chat button on any page.
              </p>
            </Card>
            <Card title="Contact support">
              <a
                href={`mailto:${SUPPORT.email}`}
                className="flex items-center gap-3 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
              >
                <Mail className="size-4 shrink-0" aria-hidden="true" />
                {SUPPORT.email}
              </a>
              <p className="flex items-start gap-3 text-sm text-slate-600">
                <Clock className="size-4 shrink-0 translate-y-0.5" aria-hidden="true" />
                {SUPPORT.hours}. We usually reply {SUPPORT.replyTime}.
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* Save bar for the form tabs */}
      {saveBarShown && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 backdrop-blur lg:left-64">
          <div className="mx-auto flex max-w-4xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-slate-600">
              {valid
                ? "You have unsaved changes."
                : "Fix the highlighted fields to save."}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button
                type="button"
                onClick={() => setDraft(saved)}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:border-slate-400"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={save}
                disabled={!valid || saving}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {saving && <Loader2 className="size-4 animate-spin" />} Save
                changes
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-24 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg sm:inset-x-auto sm:right-6"
        >
          <CheckCircle2
            className="size-5 shrink-0 text-emerald-400"
            aria-hidden="true"
          />{" "}
          {toast}
        </div>
      )}
    </div>
  );
}
