import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ChevronRight,
  Inbox,
  RefreshCw,
  Search,
} from "lucide-react";
import { Pill } from "../components/widgets/DashboardWidgets";
import { listUnmatched, type Payment } from "../services/Paymentapi";

type Tab = "open" | "escalated" | "resolved";

const ESCALATE_AFTER_DAYS = 3; // v4 §5.3
const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
const ageDays = (iso: string) =>
  (Date.now() - new Date(iso).getTime()) / 86_400_000;

const ageLabel = (iso: string) => {
  const hours = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (hours < 1) return "Just now";
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  const d = Math.floor(hours / 24);
  return `${d} day${d > 1 ? "s" : ""} ago`;
};

export default function UnmatchedPage() {
  const [items, setItems] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("open");
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    setItems(await listUnmatched());
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Unmatched payments | SaveCircle";
    load();
  }, []);

  const groups = useMemo(() => {
    const open = items.filter((p) => p.status === "unmatched");
    return {
      open: open.filter((p) => ageDays(p.receivedAt) <= ESCALATE_AFTER_DAYS),
      escalated: open.filter(
        (p) => ageDays(p.receivedAt) > ESCALATE_AFTER_DAYS,
      ),
      resolved: items
        .filter((p) => p.status !== "unmatched")
        .sort((a, b) => (b.resolvedAt ?? "").localeCompare(a.resolvedAt ?? "")),
    };
  }, [items]);

  const openAmount = [...groups.open, ...groups.escalated].reduce(
    (s, p) => s + p.amount,
    0,
  );

  const visible = groups[tab].filter((p) => {
    const q = query.trim().toLowerCase();
    return (
      !q ||
      [p.senderName, p.narration, p.providerRef, p.member].some((v) =>
        v?.toLowerCase().includes(q),
      )
    );
  });

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: "open", label: "To assign", count: groups.open.length },
    { id: "escalated", label: "Escalated", count: groups.escalated.length },
    { id: "resolved", label: "Resolved", count: groups.resolved.length },
  ];

  return (
    <div className="mx-auto max-w-8xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Unmatched payments
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 sm:text-base">
            Transfers into the organisation account or a blocked member account.
            Assign each one to a member or mark it for refund.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold hover:border-emerald-600 disabled:opacity-60"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />{" "}
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-600 sm:text-sm">
            Waiting to be assigned
          </p>
          <p className="mt-1 text-2xl font-extrabold">
            {groups.open.length + groups.escalated.length}
          </p>
          <p className="text-xs text-slate-500">{naira(openAmount)} in total</p>
        </div>
        <button
          type="button"
          onClick={() => setTab("escalated")}
          className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-emerald-600"
        >
          <span className="block text-xs font-semibold text-slate-600 sm:text-sm">
            Escalated
          </span>
          <span
            className={`mt-1 block text-2xl font-extrabold ${groups.escalated.length ? "text-amber-700" : ""}`}
          >
            {groups.escalated.length}
          </span>
          <span className="block text-xs text-slate-500">
            Older than {ESCALATE_AFTER_DAYS} days
          </span>
        </button>
        <button
          type="button"
          onClick={() => setTab("resolved")}
          className="col-span-2 rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-emerald-600 lg:col-span-1"
        >
          <span className="block text-xs font-semibold text-slate-600 sm:text-sm">
            Resolved
          </span>
          <span className="mt-1 block text-2xl font-extrabold">
            {groups.resolved.length}
          </span>
          <span className="block text-xs text-slate-500">
            Assigned or sent for refund
          </span>
        </button>
      </div>

      {groups.escalated.length > 0 && tab !== "escalated" && (
        <button
          type="button"
          onClick={() => setTab("escalated")}
          className="flex w-full items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-left text-sm text-amber-900 hover:border-amber-300"
        >
          <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
          <span className="flex-1">
            {groups.escalated.length} payment
            {groups.escalated.length > 1 ? "s have" : " has"} waited more than{" "}
            {ESCALATE_AFTER_DAYS} days and gone to the branch manager.
          </span>
          <ChevronRight className="size-4 shrink-0" aria-hidden="true" />
        </button>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div
          role="tablist"
          className="flex gap-1 overflow-x-auto border-b border-slate-200 md:border-0"
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
                {t.count}
              </span>
            </button>
          ))}
        </div>
        <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-500 focus-within:border-emerald-600 md:w-80">
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <span className="sr-only">Search unmatched payments</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sender, narration or reference"
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </label>
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
        <div className="flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Inbox className="size-8 text-slate-400" aria-hidden="true" />
          <p className="mt-3 font-semibold">
            {query
              ? "Nothing matches your search"
              : tab === "resolved"
                ? "Nothing resolved yet"
                : "All clear"}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {query
              ? "Try a different name or reference."
              : tab === "resolved"
                ? "Payments you assign or refund show up here."
                : "Every payment here has been assigned."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((p) => {
            const escalated =
              p.status === "unmatched" &&
              ageDays(p.receivedAt) > ESCALATE_AFTER_DAYS;
            return (
              <li key={p.id}>
                <Link
                  to={`/unmatched/${p.id}`}
                  className={`flex items-start gap-4 rounded-2xl border bg-white p-4 transition hover:border-emerald-600 sm:items-center sm:p-5 ${escalated ? "border-amber-300" : "border-slate-200"}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">
                      {p.senderName ?? "Unknown sender"}
                    </p>
                    <p className="mt-0.5 truncate text-sm text-slate-600">
                      {p.narration ? `"${p.narration}"` : "No narration"}, into{" "}
                      {p.accountOwner === "organisation"
                        ? "organisation account"
                        : "a blocked member account"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {p.status === "unmatched" &&
                        (escalated ? (
                          <Pill tone="warning">
                            Escalated, {ageLabel(p.receivedAt)}
                          </Pill>
                        ) : (
                          <Pill tone="neutral">{ageLabel(p.receivedAt)}</Pill>
                        ))}
                      {p.status === "matched" && (
                        <Pill tone="success">Assigned to {p.member}</Pill>
                      )}
                      {p.status === "refund_pending" && (
                        <Pill tone="info">Refund pending approval</Pill>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 text-right">
                    <span className="block text-lg font-extrabold">
                      {naira(p.amount)}
                    </span>
                    <ChevronRight
                      className="ml-auto mt-1 hidden size-5 text-slate-400 sm:block"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
