import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  Download,
  RefreshCw,
  Search,
  Wallet,
} from "lucide-react";
import { Pill } from "../components/widgets/DashboardWidgets";
import { STATUS, listPayments, type Payment } from "../services/Paymentapi";

type Filter = "all" | "transfer" | "cash" | "unmatched" | "reversed";
type Range = "today" | "7d" | "30d";

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

const formatWhen = (iso: string) => {
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString("en-NG", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("en-NG", { day: "numeric", month: "short" });
};

const inRange = (iso: string, range: Range) => {
  const d = new Date(iso);
  if (range === "today") return d.toDateString() === new Date().toDateString();
  const days = range === "7d" ? 7 : 30;
  return Date.now() - d.getTime() <= days * 86_400_000;
};

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "transfer", label: "Transfer" },
  { id: "cash", label: "Cash" },
  { id: "unmatched", label: "Unmatched" },
  { id: "reversed", label: "Reversed" },
];

export default function PaymentsPage() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [range, setRange] = useState<Range>("7d");
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    setPayments(await listPayments());
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Payments | SaveCircle";
    load();
  }, []);

  const inPeriod = useMemo(
    () => payments.filter((p) => inRange(p.receivedAt, range)),
    [payments, range],
  );

  const visible = inPeriod.filter((p) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      [
        p.member,
        p.senderName,
        p.providerRef,
        p.narration,
        p.accountNumber,
      ].some((v) => v?.toLowerCase().includes(q));
    const matchesFilter =
      filter === "all" ||
      (filter === "transfer" || filter === "cash"
        ? p.channel === filter
        : filter === "unmatched"
          ? p.status === "unmatched"
          : p.status === "reversed" || p.status === "reversal_pending");
    return matchesQuery && matchesFilter;
  });

  const totals = useMemo(() => {
    const counted = inPeriod.filter((p) => p.status !== "reversed");
    const total = counted.reduce((s, p) => s + p.amount, 0);
    const transfer = counted
      .filter((p) => p.channel === "transfer")
      .reduce((s, p) => s + p.amount, 0);
    const unmatched = inPeriod.filter((p) => p.status === "unmatched");
    return {
      total,
      transfer,
      cash: total - transfer,
      transferShare: total ? Math.round((transfer / total) * 100) : 0,
      unmatchedCount: unmatched.length,
      unmatchedAmount: unmatched.reduce((s, p) => s + p.amount, 0),
    };
  }, [inPeriod]);

  const exportCsv = () => {
    const header = [
      "Received",
      "Member",
      "Sender",
      "Channel",
      "Status",
      "Reference",
      "Amount",
    ];
    const rows = visible.map((p) => [
      new Date(p.receivedAt).toLocaleString("en-NG"),
      p.member ?? "",
      p.senderName ?? "",
      p.channel,
      STATUS[p.status].label,
      p.providerRef ?? "",
      String(p.amount),
    ]);
    const csv = [header, ...rows]
      .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `savecircle-payments-${range}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-8xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Payments
          </h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">
            Every transfer and cash payment, matched to members automatically.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold hover:border-emerald-600 disabled:opacity-60"
          >
            <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />{" "}
            Refresh
          </button>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!visible.length}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border-[1.5px] border-emerald-700 bg-white px-4 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-50"
          >
            <Download className="size-4" /> Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-600 sm:text-sm">
            Collected
          </p>
          <p className="mt-1 text-xl font-extrabold sm:text-2xl">
            {naira(totals.total)}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-600 sm:text-sm">
            By transfer
          </p>
          <p className="mt-1 text-xl font-extrabold sm:text-2xl">
            {totals.transferShare}%
          </p>
          <p className="text-xs text-slate-500">{naira(totals.transfer)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-600 sm:text-sm">
            Cash
          </p>
          <p className="mt-1 text-xl font-extrabold sm:text-2xl">
            {naira(totals.cash)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setFilter("unmatched")}
          className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-emerald-600"
        >
          <span className="block text-xs font-semibold text-slate-600 sm:text-sm">
            Unmatched
          </span>
          <span
            className={`mt-1 block text-xl font-extrabold sm:text-2xl ${totals.unmatchedCount ? "text-amber-700" : ""}`}
          >
            {totals.unmatchedCount}
          </span>
          <span className="block text-xs text-slate-500">
            {naira(totals.unmatchedAmount)} to assign
          </span>
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Filter payments"
          >
            {FILTERS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                aria-pressed={filter === f.id}
                className={`min-h-10 rounded-full border px-4 text-sm font-semibold ${filter === f.id ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-white text-slate-700 hover:border-emerald-600"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="flex h-11 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-500 focus-within:border-emerald-600 lg:w-80 lg:flex-none">
              <Search className="size-4 shrink-0" aria-hidden="true" />
              <span className="sr-only">Search payments</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Member, sender, narration or reference"
                className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
              />
            </label>
            <select
              value={range}
              onChange={(e) => setRange(e.target.value as Range)}
              aria-label="Date range"
              className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold focus:border-emerald-600 focus:outline-none"
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div
          className="space-y-2"
          aria-busy="true"
          aria-label="Loading payments"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl bg-slate-200"
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-semibold">No payments match</p>
          <p className="mt-1 text-sm text-slate-500">
            Try a longer date range or another filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilter("all");
              setQuery("");
              setRange("30d");
            }}
            className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:border-emerald-600"
          >
            Show everything from 30 days
          </button>
        </div>
      ) : (
        <>
          <ul className="space-y-3 md:hidden">
            {visible.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/payments/${p.id}`}
                  className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 hover:border-emerald-600"
                >
                  <span
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full ${p.channel === "cash" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}
                  >
                    {p.channel === "cash" ? (
                      <Wallet className="size-4" />
                    ) : (
                      <ArrowLeftRight className="size-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      {p.member ?? p.senderName ?? "Unknown sender"}
                    </span>
                    <span className="block truncate text-xs text-slate-500">
                      {formatWhen(p.receivedAt)},{" "}
                      {p.channel === "cash"
                        ? `Cash, ${p.loggedBy}`
                        : p.narration
                          ? `"${p.narration}"`
                          : "Transfer"}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span
                      className={`block font-extrabold ${p.status === "reversed" ? "text-slate-400 line-through" : ""}`}
                    >
                      {naira(p.amount)}
                    </span>
                    <Pill tone={STATUS[p.status].tone}>
                      {STATUS[p.status].label}
                    </Pill>
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white md:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Received</th>
                  <th className="px-4 py-3 font-semibold">Member / sender</th>
                  <th className="px-4 py-3 font-semibold">Channel</th>
                  <th className="px-4 py-3 font-semibold">Reference</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 text-right font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => navigate(`/payments/${p.id}`)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-5 py-3.5 text-slate-500">
                      {formatWhen(p.receivedAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        to={`/payments/${p.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-semibold hover:text-emerald-700"
                      >
                        {p.member ?? "Unknown sender"}
                      </Link>
                      {!p.member && p.senderName && (
                        <span className="block text-xs text-slate-500">
                          {p.senderName}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {p.channel === "cash"
                        ? `Cash, ${p.loggedBy}`
                        : "Transfer"}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                      {p.providerRef ?? "—"}
                    </td>
                    <td className="px-4 py-3.5">
                      <Pill tone={STATUS[p.status].tone}>
                        {STATUS[p.status].label}
                      </Pill>
                    </td>
                    <td
                      className={`px-5 py-3.5 text-right font-extrabold ${p.status === "reversed" ? "text-slate-400 line-through" : ""}`}
                    >
                      {naira(p.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
