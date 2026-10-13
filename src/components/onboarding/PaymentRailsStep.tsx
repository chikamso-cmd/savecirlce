import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  Copy,
  Eye,
  EyeOff,
  Info,
  Landmark,
  Loader2,
} from "lucide-react";
import {
  connectGateway,
  requestBankIntegration,
  type GatewayCheck,
} from "../../services/Api";
import {
  btnGhost,
  btnPrimary,
  btnSecondary,
  inputBase,
} from "./OnboardingLayout";
import {
  WEBHOOK_BASE_URL,
  moneyModeFor,
  type KybStatus,
  type OrgType,
  type Provider,
} from "../../types/types";

interface Props {
  orgType: OrgType;
  kybStatus: KybStatus;
  onBack: () => void;
  onContinue: (
    result:
      | { mode: "gateway"; provider: Provider }
      | { mode: "bank"; ticket: string }
      | { mode: "ledger" },
  ) => void;
}

const PROVIDERS: {
  id: Provider;
  name: string;
  blurb: string;
  keyHint: string;
}[] = [
  {
    id: "paystack",
    name: "Paystack",
    blurb: "Fast, secure and widely used in Nigeria.",
    keyHint: "Starts with sk_live_ (or sk_test_ while testing)",
  },
  {
    id: "flutterwave",
    name: "Flutterwave",
    blurb: "Reliable and trusted for African businesses.",
    keyHint: "Starts with FLWSECK-",
  },
];

function GatewayRails({ onReady }: { onReady: (p: Provider | null) => void }) {
  const [provider, setProvider] = useState<Provider>("paystack");
  const [secretKey, setSecretKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<GatewayCheck | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const webhookUrl = `${WEBHOOK_BASE_URL}/${provider}`;
  const current = PROVIDERS.find((p) => p.id === provider)!;

  const reset = () => {
    setResult(null);
    setError(null);
    onReady(null);
  };

  const test = async () => {
    setTesting(true);
    setError(null);
    try {
      // Secret key goes straight to the API, which encrypts it per organisation (KMS). Never persist it client-side.
      const r = await connectGateway(provider, secretKey.trim());
      setResult(r);
      onReady(r.keysValid && r.transfersEnabled ? provider : null);
    } catch (e) {
      setResult(null);
      setError((e as Error).message);
      onReady(null);
    } finally {
      setTesting(false);
    }
  };

  const copyWebhook = async () => {
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const checks: { label: string; ok: boolean; fix: string }[] = result
    ? [
        { label: "Secret key works", ok: result.keysValid, fix: "" },
        {
          label: "Payment notifications connected",
          ok: result.webhookRegistered,
          fix: "Add the webhook URL above in your dashboard, then test again.",
        },
        {
          label: "Automatic transfers allowed",
          ok: result.transfersEnabled,
          fix: `Turn on API transfers in your ${current.name} dashboard, then test again.`,
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      <fieldset>
        <legend className="text-lg font-bold">Payment provider</legend>
        <p className="mt-1 text-sm text-slate-500">
          Use your own business account. Funds settle to your bank, never to
          SaveCircle.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {PROVIDERS.map((p) => {
            const selected = p.id === provider;
            return (
              <label
                key={p.id}
                className={`flex cursor-pointer gap-3 rounded-xl border p-5 transition ${selected ? "border-[1.5px] border-emerald-700 bg-emerald-50/50" : "border-slate-200 bg-white hover:border-emerald-400"}`}
              >
                <input
                  type="radio"
                  name="provider"
                  value={p.id}
                  checked={selected}
                  onChange={() => {
                    setProvider(p.id);
                    setSecretKey("");
                    reset();
                  }}
                  className="mt-1 size-4 accent-emerald-700"
                />
                <span>
                  <span className="block text-lg font-bold">{p.name}</span>
                  <span className="mt-1 block text-sm text-slate-600">
                    {p.blurb}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div>
          <h3 className="text-lg font-bold">
            Connect your {current.name} account
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Find your secret key in your {current.name} dashboard under
            Settings, API keys.
          </p>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Secret key
          </span>
          <div className="relative">
            <input
              className={`${inputBase} pr-12 font-mono text-sm`}
              type={showKey ? "text" : "password"}
              value={secretKey}
              onChange={(e) => {
                setSecretKey(e.target.value);
                if (result || error) reset();
              }}
              placeholder={current.keyHint}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              aria-label={showKey ? "Hide secret key" : "Show secret key"}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 hover:text-emerald-700"
            >
              {showKey ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </label>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Webhook URL
          </span>
          <div className="flex gap-2">
            <code className="flex min-h-12 min-w-0 flex-1 items-center overflow-x-auto whitespace-nowrap rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-700">
              {webhookUrl}
            </code>
            <button
              type="button"
              onClick={copyWebhook}
              className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:border-emerald-600 hover:text-emerald-700"
            >
              {copied ? (
                <Check className="size-4" />
              ) : (
                <Copy className="size-4" />
              )}
              <span className="hidden sm:inline">
                {copied ? "Copied" : "Copy"}
              </span>
            </button>
          </div>
          <p className="mt-1.5 text-xs text-slate-500">
            This is how we hear about payments the moment they land.
          </p>
        </div>

        <button
          type="button"
          onClick={test}
          disabled={testing || secretKey.trim().length < 8}
          className={btnSecondary}
        >
          {testing && <Loader2 className="size-4 animate-spin" />}
          {testing ? "Testing connection…" : "Test connection"}
        </button>

        {error && (
          <p
            className="flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800"
            role="alert"
          >
            <AlertCircle className="size-4 shrink-0 translate-y-0.5" /> {error}
          </p>
        )}

        {result && (
          <ul
            className="space-y-2 rounded-lg bg-slate-50 p-4"
            aria-live="polite"
          >
            {checks.map((c) => (
              <li key={c.label} className="flex gap-2 text-sm">
                {c.ok ? (
                  <CheckCircle2 className="size-4 shrink-0 translate-y-0.5 text-emerald-700" />
                ) : (
                  <AlertCircle className="size-4 shrink-0 translate-y-0.5 text-amber-600" />
                )}
                <span>
                  <span className="font-semibold">{c.label}</span>
                  {!c.ok && (
                    <span className="block text-slate-600">{c.fix}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function BankRails({ onReady }: { onReady: (ticket: string | null) => void }) {
  const [form, setForm] = useState({
    contactName: "",
    email: "",
    coreBanking: "",
  });
  const [sending, setSending] = useState(false);
  const [ticket, setTicket] = useState<string | null>(null);

  const valid =
    form.contactName.trim().length > 2 &&
    /^\S+@\S+\.\S+$/.test(form.email) &&
    form.coreBanking.trim().length > 1;

  const send = async () => {
    setSending(true);
    try {
      const r = await requestBankIntegration(form);
      setTicket(r.ticket);
      onReady(r.ticket);
    } finally {
      setSending(false);
    }
  };

  if (ticket) {
    return (
      <div
        className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
        role="status"
      >
        <CheckCircle2 className="size-6 shrink-0 text-emerald-700" />
        <div>
          <p className="font-bold text-emerald-900">
            Request sent, ref {ticket}
          </p>
          <p className="mt-1 text-sm text-emerald-900/80">
            Our integration team will contact {form.email} to connect your core
            banking system. You can finish setup in the meantime.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
          <Landmark className="size-5" />
        </span>
        <div>
          <h3 className="text-lg font-bold">
            Connect your core banking system
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            Member accounts are issued from your own books. Our integration team
            sets this up with your IT team.
          </p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Technical contact name
          </span>
          <input
            className={inputBase}
            value={form.contactName}
            onChange={(e) => setForm({ ...form, contactName: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Contact email
          </span>
          <input
            className={inputBase}
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </label>
        <label className="block sm:col-span-2">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Core banking software
          </span>
          <input
            className={inputBase}
            value={form.coreBanking}
            onChange={(e) => setForm({ ...form, coreBanking: e.target.value })}
            placeholder="e.g. the system your bank runs on"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={send}
        disabled={!valid || sending}
        className={btnSecondary}
      >
        {sending && <Loader2 className="size-4 animate-spin" />}
        Request integration
      </button>
    </section>
  );
}

export default function PaymentRailsStep({
  orgType,
  kybStatus,
  onBack,
  onContinue,
}: Props) {
  const mode = moneyModeFor(orgType);
  const [readyProvider, setReadyProvider] = useState<Provider | null>(null);
  const [ticket, setTicket] = useState<string | null>(null);

  const canContinue =
    mode === "ledger" ||
    (mode === "gateway" && !!readyProvider) ||
    (mode === "bank" && !!ticket);

  const handleContinue = () => {
    if (mode === "gateway" && readyProvider)
      onContinue({ mode, provider: readyProvider });
    else if (mode === "bank" && ticket) onContinue({ mode, ticket });
    else onContinue({ mode: "ledger" });
  };

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl dark:text-white">
          Connect payment rails
        </h2>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-white">
          {mode === "ledger"
            ? "Informal groups use the free ledger-only plan. Members pay cash or transfer, and officers record it."
            : "Members pay into account numbers on these rails, and every payment is matched to them automatically."}
        </p>
      </header>

      {kybStatus === "in_review" && mode !== "ledger" && (
        <p className="flex gap-3 rounded-xl bg-sky-50 p-4 text-sm text-sky-900">
          <Info className="size-5 shrink-0" aria-hidden="true" />
          Your verification is still in review. Connect now and your collection
          account number is issued the moment you're approved.
        </p>
      )}

      {mode === "gateway" && <GatewayRails onReady={setReadyProvider} />}
      {mode === "bank" && <BankRails onReady={setTicket} />}
      {mode === "ledger" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-relaxed text-slate-600 sm:p-6">
          No payment provider needed. You can switch to automatic collections
          later by registering your group and connecting a provider in Settings.
        </div>
      )}

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={onBack} className={btnGhost}>
          <ChevronLeft className="size-4" /> Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          disabled={!canContinue}
          className={btnPrimary}
        >
          Continue to Setup <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}
