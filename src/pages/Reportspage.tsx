import { useEffect, useState } from "react";
import { CheckCircle2, Download, FileText, Loader2 } from "lucide-react";

// Reports from v4 §7.1 (exports) and the pilot success metrics in §10.3.
// Sample figures; replace with GET /reports?period=

type Period = "week" | "month" | "quarter";

interface Metrics {
  transferShare: number;
  reconcileSeconds: number;
  cashAgeHours: number;
  neverRemitted: number;
  onTimeWithdrawals: number;
  complaintsPer100: number;
  missedPayments: number;
  disputes: number;
  weeks: { label: string; transfer: number; cash: number }[];
}

const DATA: Record<Period, Metrics> = {
  week: {
    transferShare: 82,
    reconcileSeconds: 38,
    cashAgeHours: 19,
    neverRemitted: 0,
    onTimeWithdrawals: 96,
    complaintsPer100: 1.2,
    missedPayments: 27,
    disputes: 0,
    weeks: [
      { label: "Mon", transfer: 410, cash: 90 },
      { label: "Tue", transfer: 380, cash: 120 },
      { label: "Wed", transfer: 520, cash: 80 },
      { label: "Thu", transfer: 470, cash: 140 },
      { label: "Fri", transfer: 600, cash: 110 },
      { label: "Sat", transfer: 300, cash: 190 },
      { label: "Sun", transfer: 180, cash: 60 },
    ],
  },
  month: {
    transferShare: 78,
    reconcileSeconds: 41,
    cashAgeHours: 23,
    neverRemitted: 0,
    onTimeWithdrawals: 94,
    complaintsPer100: 1.8,
    missedPayments: 96,
    disputes: 1,
    weeks: [
      { label: "Wk 1", transfer: 2100, cash: 820 },
      { label: "Wk 2", transfer: 2350, cash: 700 },
      { label: "Wk 3", transfer: 2600, cash: 640 },
      { label: "Wk 4", transfer: 2860, cash: 790 },
    ],
  },
  quarter: {
    transferShare: 71,
    reconcileSeconds: 47,
    cashAgeHours: 31,
    neverRemitted: 12_000,
    onTimeWithdrawals: 91,
    complaintsPer100: 2.4,
    missedPayments: 310,
    disputes: 4,
    weeks: [
      { label: "Aug", transfer: 7200, cash: 4100 },
      { label: "Sep", transfer: 8900, cash: 3300 },
      { label: "Oct", transfer: 9900, cash: 2950 },
    ],
  },
};

const REPORTS = [
  {
    id: "collections",
    title: "Collections summary",
    desc: "Every payment by day, channel, group and officer.",
  },
  {
    id: "group-ledger",
    title: "Group ledgers",
    desc: "Contributions, payouts and arrears per group and cycle. Useful for the AGM.",
  },
  {
    id: "withdrawals",
    title: "Withdrawals and payouts",
    desc: "Notices, approvals, due dates and transfer results.",
  },
  {
    id: "cash",
    title: "Cash remittance",
    desc: "Cash logged and deposited per officer, with ages.",
  },
  {
    id: "audit",
    title: "Audit log",
    desc: "Every approval, reversal, assignment and override, with who and why.",
  },
];

const MEMBERS = [
  "[Member 1]",
  "[Member 2]",
  "[Member 4]",
  "[Member 5]",
  "[Member 7]",
];
const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
const PERIOD_LABEL: Record<Period, string> = {
  week: "this week",
  month: "this month",
  quarter: "the last 3 months",
};

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [period, setPeriod] = useState<Period>("month");
  const [busy, setBusy] = useState<string | null>(null);
  const [member, setMember] = useState("");
  const [consent, setConsent] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Reports | SaveCircle";
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  const m = DATA[period];
  const max = Math.max(...m.weeks.map((w) => w.transfer + w.cash));

  // TODO: GET /reports/:id/export?period= (server builds the real file)
  const exportReport = async (id: string, title: string, extra?: string) => {
    setBusy(id);
    await new Promise((r) => setTimeout(r, 600));
    downloadCsv(`savecircle-${id}-${period}.csv`, [
      ["Report", title + (extra ? ` (${extra})` : "")],
      ["Period", PERIOD_LABEL[period]],
      ["Generated", new Date().toLocaleString("en-NG")],
      [],
      ["Sample data: replace with the API export"],
    ]);
    setBusy(null);
    setToast(`${title} downloaded.`);
  };

  const metricCards = [
    {
      label: "Paid by transfer",
      value: `${m.transferShare}%`,
      hint: "Share of collections not in cash",
    },
    {
      label: "Time to reconcile",
      value: `${m.reconcileSeconds}s`,
      hint: "Average, payment to ledger (target under 1 min)",
    },
    {
      label: "Average cash age",
      value: `${m.cashAgeHours}h`,
      hint: "Logged until banked",
    },
    {
      label: "Never remitted",
      value: naira(m.neverRemitted),
      hint: "Cash logged but not banked",
      warn: m.neverRemitted > 0,
    },
    {
      label: "Withdrawals on time",
      value: `${m.onTimeWithdrawals}%`,
      hint: "Paid on their due date",
    },
    {
      label: "Complaints",
      value: `${m.complaintsPer100}`,
      hint: "Per 100 withdrawals",
    },
    {
      label: "Missed payments",
      value: String(m.missedPayments),
      hint: "Member-cycles unpaid at due date",
    },
    { label: "Disputes", value: String(m.disputes), hint: "Raised by members" },
  ];

  return (
    <div className="mx-auto max-w-8xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Reports
          </h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">
            How collections are going, and exports for your records.
          </p>
        </div>
        <div
          role="group"
          aria-label="Period"
          className="grid grid-cols-3 rounded-lg bg-slate-100 p-1"
        >
          {(
            [
              ["week", "Week"],
              ["month", "Month"],
              ["quarter", "3 months"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              aria-pressed={period === v}
              onClick={() => setPeriod(v)}
              className={`min-h-10 rounded-md px-4 text-sm font-semibold ${period === v ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {metricCards.map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-slate-200 bg-white p-4"
          >
            <p className="text-xs font-semibold text-slate-600 sm:text-sm">
              {c.label}
            </p>
            <p
              className={`mt-1 text-2xl font-extrabold ${c.warn ? "text-amber-700" : ""}`}
            >
              {c.value}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">{c.hint}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-bold">Collections, {PERIOD_LABEL[period]}</h2>
          <div className="flex gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-emerald-700" /> Transfer
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-sm bg-emerald-200" /> Cash
            </span>
          </div>
        </div>
        <ul className="mt-5 flex h-48 items-end gap-3 border-b border-slate-200 sm:gap-6">
          {m.weeks.map((w) => (
            <li
              key={w.label}
              className="flex h-full flex-1 flex-col justify-end gap-0.5"
              title={`${w.label}: ${naira(w.transfer * 1000)} transfer, ${naira(w.cash * 1000)} cash`}
            >
              <span className="sr-only">{`${w.label}: ${naira(w.transfer * 1000)} by transfer, ${naira(w.cash * 1000)} cash`}</span>
              <span
                className="rounded-t bg-emerald-200"
                style={{ height: `${(w.cash / max) * 100}%` }}
              />
              <span
                className="rounded-sm bg-emerald-700"
                style={{ height: `${(w.transfer / max) * 100}%` }}
              />
            </li>
          ))}
        </ul>
        <div className="mt-2 flex gap-3 sm:gap-6" aria-hidden="true">
          {m.weeks.map((w) => (
            <span
              key={w.label}
              className="flex-1 text-center text-xs text-slate-500"
            >
              {w.label}
            </span>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold">Exports</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {REPORTS.map((r) => (
            <li
              key={r.id}
              className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-5"
            >
              <FileText
                className="size-5 shrink-0 translate-y-0.5 text-emerald-700"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold">{r.title}</p>
                <p className="mt-0.5 text-sm text-slate-500">{r.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => exportReport(r.id, r.title)}
                disabled={busy === r.id}
                aria-label={`Download ${r.title}`}
                className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm font-semibold hover:border-emerald-600 hover:text-emerald-700 disabled:opacity-60"
              >
                {busy === r.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}
                <span className="hidden sm:inline">CSV</span>
              </button>
            </li>
          ))}

          {/* Member statement + savings history (v4 §10.1 #15) */}
          <li className="rounded-2xl border border-slate-200 bg-white p-5 md:col-span-2">
            <div className="flex items-start gap-4">
              <FileText
                className="size-5 shrink-0 translate-y-0.5 text-emerald-700"
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold">
                  Member statement and savings history
                </p>
                <p className="mt-0.5 text-sm text-slate-500">
                  One member's contributions, withdrawals and balance. The
                  savings history can support a loan application.
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-center sm:pl-9">
              <select
                value={member}
                onChange={(e) => {
                  setMember(e.target.value);
                  setConsent(false);
                }}
                aria-label="Member"
                className="min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-emerald-600 focus:outline-none"
              >
                <option value="">Select member</option>
                {MEMBERS.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={!member || busy === "statement"}
                onClick={() =>
                  exportReport("statement", "Member statement", member)
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:border-emerald-600 disabled:opacity-50"
              >
                {busy === "statement" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}{" "}
                Statement
              </button>
              <button
                type="button"
                disabled={!member || !consent || busy === "history"}
                onClick={() =>
                  exportReport(
                    "savings-history",
                    "Savings history for lending",
                    member,
                  )
                }
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                {busy === "history" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}{" "}
                Savings history
              </button>
            </div>
            {member && (
              <label className="mt-3 flex cursor-pointer gap-3 text-sm sm:pl-9">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 size-4 accent-emerald-700"
                />
                {member} has agreed to share their savings history with the
                credit team.
              </label>
            )}
          </li>
        </ul>
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
