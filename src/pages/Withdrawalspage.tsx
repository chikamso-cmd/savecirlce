import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { Pill } from "../components/widgets/DashboardWidgets";
import NewWithdrawalModal from "../components/modals/Newwithdrawals";
import {
  CURRENT_USER,
  ORG_FLOAT,
//   W_STATUS,
  listWithdrawals,
  type Withdrawal,
} from "../services/Withdrawalsapi";

type Tab = "approval" | "upcoming" | "attention" | "done";

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

const TAB_STATUSES: Record<Tab, Withdrawal["status"][]> = {
  approval: ["submitted"],
  upcoming: ["approved", "scheduled", "executing"],
  attention: ["failed", "held"],
  done: ["completed", "cancelled", "rejected"],
};

export default function WithdrawalsPage() {
  const [items, setItems] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("approval");
  const [kind, setKind] = useState<"all" | "withdrawal" | "payout">("all");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setItems(await listWithdrawals());
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Withdrawals & payouts | SaveCircle";
    load();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Float check: can the organisation's balance cover everything due in the next 7 days? (v4 §6.2)
  const dueThisWeek = useMemo(() => {
    const limit = Date.now() + 7 * 86_400_000;
    return items
      .filter(
        (w) =>
          ["submitted", "approved", "scheduled", "held", "failed"].includes(
            w.status,
          ) && new Date(w.dueDate).getTime() <= limit,
      )
      .reduce((s, w) => s + w.amount, 0);
  }, [items]);
  const floatShort = dueThisWeek > ORG_FLOAT;

  const counts = Object.fromEntries(
    (Object.keys(TAB_STATUSES) as Tab[]).map((t) => [
      t,
      items.filter((w) => TAB_STATUSES[t].includes(w.status)).length,
    ]),
  ) as Record<Tab, number>;

  const visible = items
    .filter((w) => TAB_STATUSES[tab].includes(w.status))
    .filter((w) => kind === "all" || w.kind === kind)
    .filter((w) => {
      const q = query.trim().toLowerCase();
      return (
        !q ||
        w.member.toLowerCase().includes(q) ||
        w.group.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

  const TABS: { id: Tab; label: string }[] = [
    { id: "approval", label: "Needs approval" },
    { id: "upcoming", label: "Scheduled" },
    { id: "attention", label: "Failed or held" },
    { id: "done", label: "Done" },
  ];

  return (
    <div className="mx-auto max-w-8xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Withdrawals & payouts
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 sm:text-base">
            Notices go out automatically on their due date once approved and
            funded.
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
            onClick={() => setCreating(true)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800"
          >
            <Plus className="size-4" /> New notice
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => setTab("approval")}
          className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-emerald-600"
        >
          <span className="block text-xs font-semibold text-slate-600 sm:text-sm">
            Needs approval
          </span>
          <span
            className={`mt-1 block text-2xl font-extrabold ${counts.approval ? "text-amber-700" : ""}`}
          >
            {counts.approval}
          </span>
        </button>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-600 sm:text-sm">
            Due in 7 days
          </p>
          <p className="mt-1 text-2xl font-extrabold">{naira(dueThisWeek)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-600 sm:text-sm">
            Account balance
          </p>
          <p className="mt-1 text-2xl font-extrabold">{naira(ORG_FLOAT)}</p>
        </div>
        <button
          type="button"
          onClick={() => setTab("attention")}
          className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-emerald-600"
        >
          <span className="block text-xs font-semibold text-slate-600 sm:text-sm">
            Failed or held
          </span>
          <span
            className={`mt-1 block text-2xl font-extrabold ${counts.attention ? "text-amber-700" : ""}`}
          >
            {counts.attention}
          </span>
        </button>
      </div>

      {floatShort ? (
        <p className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
          The account is {naira(dueThisWeek - ORG_FLOAT)} short of what's due
          this week. Anything it can't cover is held and paid in due-date order
          once funded. Nothing is paid partially.
        </p>
      ) : (
        <p className="flex gap-3 rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900">
          <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" /> The
          account balance covers everything due this week.
        </p>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div
          role="tablist"
          className="flex gap-1 overflow-x-auto border-b border-slate-200 lg:border-0"
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`flex min-h-11 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-semibold ${tab === t.id ? "border-emerald-700 text-emerald-800" : "border-transparent text-slate-600 hover:text-slate-900"}`}
            >
              {t.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs ${tab === t.id ? "bg-emerald-100" : "bg-slate-100"}`}
              >
                {counts[t.id]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex h-11 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-500 focus-within:border-emerald-600 lg:w-64">
            <Search className="size-4 shrink-0" aria-hidden="true" />
            <span className="sr-only">Search</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Member or group"
              className="w-full bg-transparent text-sm text-slate-900 focus:outline-none"
            />
          </label>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
            aria-label="Type"
            className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold focus:border-emerald-600 focus:outline-none"
          >
            <option value="all">Withdrawals and payouts</option>
            <option value="withdrawal">Thrift withdrawals</option>
            <option value="payout">Rotating payouts</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2" aria-busy="true" aria-label="Loading">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-semibold">Nothing here</p>
          <p className="mt-1 text-sm text-slate-500">
            {query
              ? "No matches for that search."
              : "No withdrawals or payouts in this list."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((w) => (
            <li key={w.id}>
              <Link
                to={`/withdrawals/${w.id}`}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl border border-slate-200 bg-white p-4 hover:border-emerald-600 sm:p-5"
              >
                <div className="w-14 shrink-0 rounded-lg bg-slate-50 py-1.5 text-center">
                  <p className="text-[11px] font-semibold text-slate-500">
                    {new Date(w.dueDate).toLocaleDateString("en-NG", {
                      month: "short",
                    })}
                  </p>
                  <p className="text-lg font-extrabold leading-tight">
                    {new Date(w.dueDate).getDate()}
                  </p>
                </div>
                <div className="min-w-0 flex-1 basis-40">
                  <p className="truncate font-bold">{w.member}</p>
                  <p className="truncate text-sm text-slate-500">
                    {w.kind === "payout"
                      ? "Rotating payout"
                      : w.fullExit
                        ? "Full balance, leaving"
                        : "Thrift withdrawal"}
                    , {w.group}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {/* <Pill tone={W_STATUS[w.status].tone}>
                    {W_STATUS[w.status].label}
                  </Pill> */}
                  <span className="text-lg font-extrabold">
                    {naira(w.amount)}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {creating && (
        <NewWithdrawalModal
          createdBy={CURRENT_USER.name}
          onClose={() => setCreating(false)}
          onCreated={(w) => {
            setItems((list) => [w, ...list]);
            setCreating(false);
            setTab(w.status === "submitted" ? "approval" : "upcoming");
            setToast(
              `Notice created for ${w.member}, due ${fmtDate(w.dueDate)}.`,
            );
          }}
        />
      )}

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
