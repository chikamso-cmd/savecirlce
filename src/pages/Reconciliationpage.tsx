import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Loader2, Play, X } from "lucide-react";
import { Pill } from "../components/widgets/DashboardWidgets";

// v4 §5.5: each night the provider's settlement report is compared with the ledger.
// Any mismatch opens an exception for the finance approver; nothing is fixed silently.

type ExceptionKind =
  | "missing_in_ledger"
  | "missing_at_provider"
  | "amount_mismatch"
  | "provider_reversal";

interface ReconException {
  id: string;
  date: string;
  kind: ExceptionKind;
  providerRef: string;
  amount: number;
  detail: string;
  resolvedBy?: string;
  resolution?: string;
  resolvedAt?: string;
}

interface Run {
  date: string;
  providerTotal: number;
  ledgerTotal: number;
  transactions: number;
  exceptions: number;
}

const CURRENT_USER = "[Finance approver]"; // TODO: from auth

const KIND: Record<
  ExceptionKind,
  { label: string; action: string; help: string }
> = {
  missing_in_ledger: {
    label: "Missing from ledger",
    action: "Post to ledger",
    help: "The provider settled it but no webhook reached us. Posting it runs the normal matching and receipt.",
  },
  missing_at_provider: {
    label: "Not settled by provider",
    action: "Mark as pending settlement",
    help: "It is in the ledger but not in the settlement report. Usually it settles the next day; check with the provider if not.",
  },
  amount_mismatch: {
    label: "Amount differs",
    action: "Correct ledger by reversal",
    help: "The ledger amount differs from what settled. The wrong entry is reversed and the right amount posted, both logged.",
  },
  provider_reversal: {
    label: "Reversed by provider",
    action: "Post reversal",
    help: "The provider pulled the money back. A reversal is posted against the member, who is notified.",
  },
};

const day = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};

const RUNS: Run[] = [
  {
    date: day(1),
    providerTotal: 1_284_500,
    ledgerTotal: 1_264_500,
    transactions: 214,
    exceptions: 1,
  },
  {
    date: day(2),
    providerTotal: 1_102_000,
    ledgerTotal: 1_102_000,
    transactions: 188,
    exceptions: 0,
  },
  {
    date: day(3),
    providerTotal: 987_500,
    ledgerTotal: 992_500,
    transactions: 171,
    exceptions: 1,
  },
  {
    date: day(4),
    providerTotal: 1_350_000,
    ledgerTotal: 1_350_000,
    transactions: 230,
    exceptions: 0,
  },
  {
    date: day(5),
    providerTotal: 1_210_500,
    ledgerTotal: 1_210_500,
    transactions: 201,
    exceptions: 0,
  },
];

const EXCEPTIONS: ReconException[] = [
  {
    id: "e1",
    date: day(1),
    kind: "missing_in_ledger",
    providerRef: "PSK_3f9e22a1",
    amount: 20_000,
    detail:
      "Transfer to member account 9012 345 677 settled, no webhook received.",
  },
  {
    id: "e2",
    date: day(3),
    kind: "provider_reversal",
    providerRef: "PSK_88c01b7e",
    amount: 5_000,
    detail:
      "Sender’s bank reversed a transfer from [Member 12] after it was receipted.",
  },
  {
    id: "e3",
    date: day(9),
    kind: "amount_mismatch",
    providerRef: "PSK_0a71cc92",
    amount: 1_500,
    detail: "Ledger shows ₦11,500, provider settled ₦10,000.",
    resolvedBy: "[Finance approver]",
    resolution:
      "Correct ledger by reversal: fee deducted by sender bank, member informed",
    resolvedAt: day(8),
  },
];

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
const fmtDay = (d: string) =>
  new Date(d).toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

export default function ReconciliationPage() {
  const [runs, setRuns] = useState<Run[]>(RUNS);
  const [exceptions, setExceptions] = useState<ReconException[]>(EXCEPTIONS);
  const [showResolved, setShowResolved] = useState(false);
  const [resolving, setResolving] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Reconciliation | SaveCircle";
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const open = exceptions.filter((e) => !e.resolvedBy);
  const visible = showResolved ? exceptions.filter((e) => e.resolvedBy) : open;
  const lastRun = runs[0];
  const lastDiff = lastRun.providerTotal - lastRun.ledgerTotal;

  // TODO: POST /reconciliation/run (normally a nightly job)
  const runNow = async () => {
    setRunning(true);
    await new Promise((r) => setTimeout(r, 1500));
    const today = new Date().toISOString().slice(0, 10);
    setRuns((r) => [
      {
        date: today,
        providerTotal: 412_000,
        ledgerTotal: 412_000,
        transactions: 63,
        exceptions: 0,
      },
      ...r.filter((x) => x.date !== today),
    ]);
    setRunning(false);
    setToast("Today so far: provider and ledger match.");
  };

  // TODO: POST /reconciliation/exceptions/:id/resolve
  const resolve = async (e: ReconException) => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 700));
    const resolution = `${KIND[e.kind].action}: ${note.trim()}`;
    setExceptions((list) =>
      list.map((x) =>
        x.id === e.id
          ? {
              ...x,
              resolvedBy: CURRENT_USER,
              resolution,
              resolvedAt: new Date().toISOString(),
            }
          : x,
      ),
    );
    setSaving(false);
    setResolving(null);
    setNote("");
    setToast("Exception resolved and logged.");
  };

  return (
    <div className="mx-auto max-w-8xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Reconciliation
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 sm:text-base">
            Each night we compare your provider's settlement report with the
            ledger. Anything that doesn't match waits here for a finance
            approver.
          </p>
        </div>
        <button
          type="button"
          onClick={runNow}
          disabled={running}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold hover:border-emerald-600 disabled:opacity-60"
        >
          {running ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Play className="size-4" />
          )}{" "}
          {running ? "Checking…" : "Check today so far"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-600 sm:text-sm">
            Open exceptions
          </p>
          <p
            className={`mt-1 text-2xl font-extrabold ${open.length ? "text-amber-700" : ""}`}
          >
            {open.length}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-600 sm:text-sm">
            Last run
          </p>
          <p className="mt-1 text-lg font-extrabold">{fmtDay(lastRun.date)}</p>
          <p className="text-xs text-slate-500">
            {lastRun.transactions} transactions
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-600 sm:text-sm">
            Provider settled
          </p>
          <p className="mt-1 text-lg font-extrabold">
            {naira(lastRun.providerTotal)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-600 sm:text-sm">
            Difference
          </p>
          <p
            className={`mt-1 text-lg font-extrabold ${lastDiff ? "text-amber-700" : "text-emerald-700"}`}
          >
            {lastDiff ? naira(Math.abs(lastDiff)) : "None"}
          </p>
          <p className="text-xs text-slate-500">
            {lastDiff > 0
              ? "Ledger is short"
              : lastDiff < 0
                ? "Ledger is over"
                : "Fully matched"}
          </p>
        </div>
      </div>

      {/* Exceptions */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">Exceptions</h2>
          <div className="flex gap-2">
            {(
              [
                [false, `Open (${open.length})`],
                [true, "Resolved"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={label}
                type="button"
                aria-pressed={showResolved === v}
                onClick={() => setShowResolved(v)}
                className={`min-h-10 rounded-full border px-4 text-sm font-semibold ${showResolved === v ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-white text-slate-700"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <CheckCircle2
              className="size-8 text-emerald-600"
              aria-hidden="true"
            />
            <p className="mt-3 font-semibold">
              {showResolved ? "Nothing resolved yet" : "Everything reconciles"}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {visible.map((e) => (
              <li
                key={e.id}
                className={`rounded-2xl border bg-white p-5 ${e.resolvedBy ? "border-slate-200" : "border-amber-300"}`}
              >
                <div className="flex flex-wrap items-start gap-3">
                  {!e.resolvedBy && (
                    <AlertTriangle
                      className="size-5 shrink-0 text-amber-600"
                      aria-hidden="true"
                    />
                  )}
                  <div className="min-w-0 flex-1 basis-56">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold">{KIND[e.kind].label}</p>
                      <Pill tone={e.resolvedBy ? "success" : "warning"}>
                        {e.resolvedBy ? "Resolved" : "Open"}
                      </Pill>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{e.detail}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      Run of {fmtDay(e.date)}, ref{" "}
                      <span className="font-mono">{e.providerRef}</span>
                    </p>
                    {e.resolvedBy && (
                      <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm">
                        {e.resolution}
                        <span className="block text-xs text-slate-500">
                          By {e.resolvedBy}, {fmtDay(e.resolvedAt!)}
                        </span>
                      </p>
                    )}
                  </div>
                  <p className="text-lg font-extrabold">{naira(e.amount)}</p>
                </div>

                {!e.resolvedBy && resolving !== e.id && (
                  <div className="mt-4 flex flex-wrap gap-2 sm:pl-8">
                    <button
                      type="button"
                      onClick={() => {
                        setResolving(e.id);
                        setNote("");
                      }}
                      className="inline-flex min-h-11 items-center rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800"
                    >
                      {KIND[e.kind].action}
                    </button>
                    <Link
                      to="/payments"
                      className="inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:border-emerald-600"
                    >
                      Find in payments
                    </Link>
                  </div>
                )}

                {resolving === e.id && (
                  <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4 sm:ml-8">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-slate-700">
                        {KIND[e.kind].help}
                      </p>
                      <button
                        type="button"
                        onClick={() => setResolving(null)}
                        aria-label="Close"
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-white"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-slate-700">
                        Note (saved to the audit log)
                      </span>
                      <textarea
                        rows={2}
                        value={note}
                        onChange={(ev) => setNote(ev.target.value)}
                        placeholder="What you checked and why"
                        className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-[15px] focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => resolve(e)}
                      disabled={note.trim().length < 5 || saving}
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                    >
                      {saving && <Loader2 className="size-4 animate-spin" />}{" "}
                      Confirm
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Run history */}
      <section className="rounded-2xl border border-slate-200 bg-white">
        <h2 className="px-5 pt-5 text-lg font-bold">Nightly runs</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 text-right font-semibold">
                  Transactions
                </th>
                <th className="px-4 py-3 text-right font-semibold">Provider</th>
                <th className="px-4 py-3 text-right font-semibold">Ledger</th>
                <th className="px-5 py-3 font-semibold">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {runs.map((r) => (
                <tr key={r.date}>
                  <td className="px-5 py-3.5 font-semibold">
                    {fmtDay(r.date)}
                  </td>
                  <td className="px-4 py-3.5 text-right">{r.transactions}</td>
                  <td className="px-4 py-3.5 text-right">
                    {naira(r.providerTotal)}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    {naira(r.ledgerTotal)}
                  </td>
                  <td className="px-5 py-3.5">
                    {r.exceptions ? (
                      <Pill tone="warning">
                        {r.exceptions} exception{r.exceptions > 1 ? "s" : ""}
                      </Pill>
                    ) : (
                      <Pill tone="success">Matched</Pill>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {toast && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg sm:inset-x-auto sm:right-6"
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
