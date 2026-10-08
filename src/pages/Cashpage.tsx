import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ChevronRight, RefreshCw } from "lucide-react";
import { Pill } from "../components//widgets/DashboardWidgets";
import {
  FLAG_AFTER_HOURS,
  ageHours,
  cashInHand,
  isFlagged,
  listOfficers,
  oldestUnbanked,
  type Officer,
} from "../services/Cashapi";

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
const ageText = (h: number) =>
  h < 1
    ? "under an hour"
    : h < 24
      ? `${Math.floor(h)}h`
      : `${Math.floor(h / 24)}d ${Math.floor(h % 24)}h`;

export default function CashPage() {
  const [officers, setOfficers] = useState<Officer[]>([]);
  const [loading, setLoading] = useState(true);
  const [branch, setBranch] = useState("all");
  const [onlyFlagged, setOnlyFlagged] = useState(false);

  const load = async () => {
    setLoading(true);
    setOfficers(await listOfficers());
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Cash in hand | SaveCircle";
    load();
  }, []);

  const branches = useMemo(
    () => [...new Set(officers.map((o) => o.branch))],
    [officers],
  );

  const visible = officers
    .filter((o) => branch === "all" || o.branch === branch)
    .filter((o) => !onlyFlagged || isFlagged(o))
    .sort(
      (a, b) =>
        Number(isFlagged(b)) - Number(isFlagged(a)) ||
        cashInHand(b) - cashInHand(a),
    );

  const total = officers.reduce((s, o) => s + cashInHand(o), 0);
  const flagged = officers.filter(isFlagged);
  const flaggedAmount = flagged.reduce((s, o) => s + cashInHand(o), 0);

  return (
    <div className="mx-auto max-w-8xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Cash in hand
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 sm:text-base">
            Cash officers have logged but not yet banked. Depositing it into the
            organisation account clears it.
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
            Total cash in hand
          </p>
          <p className="mt-1 text-2xl font-extrabold">{naira(total)}</p>
        </div>
        <button
          type="button"
          onClick={() => setOnlyFlagged(true)}
          className="rounded-2xl border border-slate-200 bg-white p-4 text-left hover:border-emerald-600"
        >
          <span className="block text-xs font-semibold text-slate-600 sm:text-sm">
            Over {FLAG_AFTER_HOURS} hours
          </span>
          <span
            className={`mt-1 block text-2xl font-extrabold ${flagged.length ? "text-amber-700" : ""}`}
          >
            {flagged.length} officer{flagged.length === 1 ? "" : "s"}
          </span>
          <span className="block text-xs text-slate-500">
            {naira(flaggedAmount)} held
          </span>
        </button>
        <div className="col-span-2 rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-1">
          <p className="text-xs font-semibold text-slate-600 sm:text-sm">
            Officers holding cash
          </p>
          <p className="mt-1 text-2xl font-extrabold">
            {officers.filter((o) => cashInHand(o) > 0).length} of{" "}
            {officers.length}
          </p>
        </div>
      </div>

      {flagged.length > 0 && (
        <p className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
          {flagged.length} officer{flagged.length > 1 ? "s have" : " has"} held
          cash for more than {FLAG_AFTER_HOURS} hours. Branch managers have been
          alerted.
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(
            [
              [false, "All officers"],
              [true, `Over ${FLAG_AFTER_HOURS}h`],
            ] as const
          ).map(([v, label]) => (
            <button
              key={label}
              type="button"
              aria-pressed={onlyFlagged === v}
              onClick={() => setOnlyFlagged(v)}
              className={`min-h-10 rounded-full border px-4 text-sm font-semibold ${onlyFlagged === v ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-slate-300 bg-white text-slate-700 hover:border-emerald-600"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <select
          value={branch}
          onChange={(e) => setBranch(e.target.value)}
          aria-label="Branch"
          className="h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold focus:border-emerald-600 focus:outline-none"
        >
          <option value="all">All branches</option>
          {branches.map((b) => (
            <option key={b}>{b}</option>
          ))}
        </select>
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
          <p className="font-semibold">
            {onlyFlagged ? "No one is over the limit" : "No officers found"}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((o) => {
            const held = cashInHand(o);
            const oldest = oldestUnbanked(o);
            const flag = isFlagged(o);
            return (
              <li key={o.id}>
                <Link
                  to={`/cash/${o.id}`}
                  className={`flex items-center gap-4 rounded-2xl border bg-white p-4 hover:border-emerald-600 sm:p-5 ${flag ? "border-amber-300" : "border-slate-200"}`}
                >
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-extrabold text-slate-600">
                    {o.name
                      .replace(/[^A-Z0-9]/gi, "")
                      .slice(-2)
                      .toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold">{o.name}</p>
                    <p className="truncate text-sm text-slate-500">
                      {o.branch},{" "}
                      {held
                        ? `${o.entries.filter((e) => e.remaining > 0).length} unbanked collections`
                        : "all banked"}
                    </p>
                    {oldest && (
                      <div className="mt-1.5">
                        {flag ? (
                          <Pill tone="warning">
                            Oldest {ageText(ageHours(oldest.loggedAt))} unbanked
                          </Pill>
                        ) : (
                          <Pill tone="neutral">
                            Oldest {ageText(ageHours(oldest.loggedAt))}
                          </Pill>
                        )}
                      </div>
                    )}
                  </div>
                  <span
                    className={`text-lg font-extrabold ${held ? "" : "text-slate-400"}`}
                  >
                    {naira(held)}
                  </span>
                  <ChevronRight
                    className="hidden size-5 shrink-0 text-slate-400 sm:block"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
