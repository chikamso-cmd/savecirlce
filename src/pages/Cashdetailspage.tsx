import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Send,
} from "lucide-react";
import { Pill } from "../components/widgets/DashboardWidgets";
import {
  FLAG_AFTER_HOURS,
  ageHours,
  cashInHand,
  getOfficer,
  isFlagged,
  recordDeposit,
  sendReminder,
  type Officer,
} from "../services/Cashapi";

type Tab = "unbanked" | "banked" | "deposits";

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
const ageText = (h: number) =>
  h < 1
    ? "Under an hour"
    : h < 24
      ? `${Math.floor(h)}h ago`
      : `${Math.floor(h / 24)}d ${Math.floor(h % 24)}h ago`;

const inputCls =
  "w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3.5 text-[15px] focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";
const btnPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50";
const btnOutline =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:border-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50";

export default function CashDetailsPage() {
  const { id } = useParams();
  const [officer, setOfficer] = useState<Officer | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("unbanked");
  const [depositOpen, setDepositOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState<"deposit" | "remind" | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getOfficer(id ?? "").then((o) => {
      if (cancelled) return;
      setOfficer(o);
      setLoading(false);
      document.title = o
        ? `${o.name} cash in hand | SaveCircle`
        : "Cash in hand | SaveCircle";
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  if (loading) {
    return (
      <div
        className="mx-auto max-w-5xl space-y-4"
        aria-busy="true"
        aria-label="Loading"
      >
        <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (!officer) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h1 className="text-xl font-extrabold">Officer not found</h1>
        <Link to="/cash" className={`${btnOutline} mt-5`}>
          Back to cash in hand
        </Link>
      </div>
    );
  }

  const o = officer;
  const held = cashInHand(o);
  const flagged = isFlagged(o);
  const logged = o.entries.reduce((s, e) => s + e.amount, 0);
  const deposited = o.deposits.reduce((s, d) => s + d.amount, 0);
  const unbanked = o.entries
    .filter((e) => e.remaining > 0)
    .sort((a, b) => a.loggedAt.localeCompare(b.loggedAt));
  const banked = o.entries
    .filter((e) => e.remaining === 0)
    .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt));
  const amountNum = Number(amount) || 0;
  const amountOk = amountNum > 0 && amountNum <= held;

  const submitDeposit = async () => {
    setBusy("deposit");
    const next = await recordDeposit(o, amountNum, reference.trim());
    setOfficer(next);
    setBusy(null);
    setDepositOpen(false);
    setAmount("");
    setReference("");
    setToast(
      `${naira(amountNum)} deposit recorded. Oldest cash cleared first.`,
    );
  };

  const remind = async () => {
    setBusy("remind");
    setOfficer(await sendReminder(o));
    setBusy(null);
    setToast(`Reminder sent to ${o.name}.`);
  };

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: "unbanked", label: "Unbanked", count: unbanked.length },
    { id: "banked", label: "Banked", count: banked.length },
    { id: "deposits", label: "Deposits", count: o.deposits.length },
  ];

  return (
    <div className="mx-auto max-w-8xl space-y-6">
      <Link
        to="/cash"
        className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
      >
        <ChevronLeft className="size-4" /> Cash in hand
      </Link>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{o.name}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {o.branch}, {o.phone}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              onClick={remind}
              disabled={!held || busy === "remind"}
              className={btnOutline}
            >
              {busy === "remind" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}{" "}
              Remind
            </button>
            <button
              type="button"
              onClick={() => setDepositOpen(true)}
              disabled={!held || depositOpen}
              className={btnPrimary}
            >
              <Banknote className="size-4" /> Record deposit
            </button>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-5">
          <div>
            <dt className="text-xs font-semibold text-slate-500">
              Cash in hand
            </dt>
            <dd
              className={`mt-0.5 text-xl font-extrabold sm:text-2xl ${flagged ? "text-amber-700" : ""}`}
            >
              {naira(held)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-slate-500">Logged</dt>
            <dd className="mt-0.5 text-xl font-extrabold sm:text-2xl">
              {naira(logged)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-slate-500">Deposited</dt>
            <dd className="mt-0.5 text-xl font-extrabold sm:text-2xl">
              {naira(deposited)}
            </dd>
          </div>
        </dl>
        {o.lastReminderAt && (
          <p className="mt-3 text-xs text-slate-500">
            Last reminder sent {fmtDateTime(o.lastReminderAt)}.
          </p>
        )}
      </section>

      {flagged && (
        <p className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
          Some of this cash has been held for more than {FLAG_AFTER_HOURS}{" "}
          hours. The branch manager has been alerted. Members already got
          receipts, so they know it was paid.
        </p>
      )}
      {!held && (
        <p className="flex gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
          <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" /> All
          cash collected by {o.name} has been banked.
        </p>
      )}

      {depositOpen && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="font-bold">Record a deposit</h2>
          <p className="mt-1 text-sm text-slate-600">
            Transfers from the officer into the organisation account clear
            automatically. Use this for deposits made another way, like a branch
            deposit slip.
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Amount deposited
              </span>
              <input
                className={inputCls}
                inputMode="numeric"
                placeholder={naira(held)}
                autoFocus
                value={amount ? naira(Number(amount)) : ""}
                onChange={(e) =>
                  setAmount(e.target.value.replace(/\D/g, "").slice(0, 9))
                }
              />
              {amountNum > held && (
                <span className="mt-1 block text-sm text-red-600">
                  More than the {naira(held)} in hand.
                </span>
              )}
              <button
                type="button"
                onClick={() => setAmount(String(held))}
                className="mt-1 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
              >
                Use full amount
              </button>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Reference
              </span>
              <input
                className={inputCls}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. Deposit slip number"
              />
            </label>
          </div>
          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setDepositOpen(false)}
              className={btnOutline}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submitDeposit}
              disabled={
                !amountOk || reference.trim().length < 3 || busy === "deposit"
              }
              className={btnPrimary}
            >
              {busy === "deposit" && (
                <Loader2 className="size-4 animate-spin" />
              )}{" "}
              Save deposit
            </button>
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white">
        <div
          role="tablist"
          className="flex gap-1 overflow-x-auto border-b border-slate-200 px-2"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex min-h-12 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-semibold ${tab === t.id ? "border-emerald-700 text-emerald-800" : "border-transparent text-slate-600 hover:text-slate-900"}`}
            >
              {t.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${tab === t.id ? "bg-emerald-100" : "bg-slate-100"}`}
              >
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {tab !== "deposits" ? (
          <ul className="divide-y divide-slate-100">
            {(tab === "unbanked" ? unbanked : banked).map((e) => {
              const h = ageHours(e.loggedAt);
              return (
                <li
                  key={e.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3.5"
                >
                  <div className="min-w-0 flex-1 basis-40">
                    <p className="truncate font-semibold">{e.member}</p>
                    <p className="truncate text-xs text-slate-500">
                      {e.group}, {fmtDateTime(e.loggedAt)}
                    </p>
                  </div>
                  {tab === "unbanked" &&
                    (h > FLAG_AFTER_HOURS ? (
                      <Pill tone="warning">{ageText(h)}</Pill>
                    ) : (
                      <Pill tone="neutral">{ageText(h)}</Pill>
                    ))}
                  <span className="text-right">
                    <span className="block font-extrabold">
                      {naira(tab === "unbanked" ? e.remaining : e.amount)}
                    </span>
                    {tab === "unbanked" && e.remaining < e.amount && (
                      <span className="block text-xs text-slate-500">
                        of {naira(e.amount)}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
            {(tab === "unbanked" ? unbanked : banked).length === 0 && (
              <li className="p-8 text-center text-sm text-slate-500">
                {tab === "unbanked"
                  ? "Nothing waiting to be banked."
                  : "Nothing banked yet."}
              </li>
            )}
          </ul>
        ) : (
          <ul className="divide-y divide-slate-100">
            {o.deposits.map((d) => (
              <li key={d.id} className="flex items-center gap-4 px-5 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{d.reference}</p>
                  <p className="text-xs text-slate-500">{fmtDateTime(d.at)}</p>
                </div>
                <span className="font-extrabold text-emerald-700">
                  {naira(d.amount)}
                </span>
              </li>
            ))}
            {o.deposits.length === 0 && (
              <li className="p-8 text-center text-sm text-slate-500">
                No deposits yet.
              </li>
            )}
          </ul>
        )}
      </section>
    </div>
  );
}
