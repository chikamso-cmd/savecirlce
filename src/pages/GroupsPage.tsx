import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CheckCircle2, Plus, Search, X } from "lucide-react";
import { Pill } from "../components/widgets/DashboardWidgets";
import { naira, useGroups, type Group } from "../lib/GroupStore";

type Filter = "all" | "rotating" | "thrift" | "arrears";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "rotating", label: "Rotating" },
  { id: "thrift", label: "Thrift" },
  { id: "arrears", label: "In arrears" },
];

function GroupCard({ group: g }: { group: Group }) {
  const rotating = g.type === "rotating";
  return (
    <Link
      to={`/groups/${g.id}`}
      className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-base font-bold text-slate-900">{g.name}</h2>
        <Pill tone={rotating ? "info" : "neutral"}>
          {rotating ? "Rotating" : "Thrift"}
        </Pill>
      </div>
      <p className="mt-1 text-sm text-slate-500">
        {naira(g.amount)} {g.frequency.toLowerCase()}, {g.memberCount} members,{" "}
        {g.officer}
      </p>

      <div className="mt-4">
        {rotating ? (
          <>
            <div className="flex justify-between text-sm">
              <span className="font-medium">
                Cycle {g.cycle} of {g.cycles}
              </span>
              <span className="text-slate-500">
                {g.status === "paused"
                  ? "Paused"
                  : `Next payout ${g.nextPayout}`}
              </span>
            </div>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100"
              role="progressbar"
              aria-valuenow={g.cycle}
              aria-valuemin={0}
              aria-valuemax={g.cycles}
            >
              <div
                className="h-full rounded-full bg-emerald-600"
                style={{
                  width: `${((g.cycle ?? 0) / (g.cycles || 1)) * 100}%`,
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex justify-between text-sm">
            <span className="font-medium">Total savings</span>
            <span className="font-bold">{naira(g.balance ?? 0)}</span>
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {g.status === "paused" && <Pill tone="neutral">Paused</Pill>}
        {g.status === "invites_sent" ? (
          <Pill tone="info">Invites sent</Pill>
        ) : g.arrearsCount > 0 ? (
          <Pill tone="warning">{g.arrearsCount} in arrears</Pill>
        ) : (
          <Pill tone="success">All paid up</Pill>
        )}
      </div>
    </Link>
  );
}

export default function GroupsPage() {
  const { groups } = useGroups();
  const location = useLocation();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [flash, setFlash] = useState<string | null>(
    (location.state as { flash?: string } | null)?.flash ?? null,
  );

  useEffect(() => {
    document.title = "Groups | SaveCircle";
    // Clear router state so the banner doesn't come back on refresh
    if (location.state)
      navigate(location.pathname, { replace: true, state: null });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const visible = useMemo(
    () =>
      groups.filter((g) => {
        const matchesFilter =
          filter === "all" ||
          (filter === "arrears" ? g.arrearsCount > 0 : g.type === filter);
        return (
          matchesFilter &&
          g.name.toLowerCase().includes(query.trim().toLowerCase())
        );
      }),
    [groups, filter, query],
  );

  const totalMembers = groups.reduce((sum, g) => sum + g.memberCount, 0);

  return (
    <div className="mx-auto max-w-8xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Groups
          </h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">
            {groups.length} groups, {totalMembers} members
          </p>
        </div>
        <Link
          to="/groups/new"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white hover:bg-emerald-800"
        >
          <Plus className="size-4" /> Create group
        </Link>
      </div>

      {flash && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-900"
        >
          <CheckCircle2 className="size-5 shrink-0" aria-hidden="true" />
          <span className="flex-1">{flash}</span>
          <button
            type="button"
            onClick={() => setFlash(null)}
            aria-label="Dismiss"
            className="rounded-md p-1 hover:bg-emerald-100"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter groups"
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`min-h-10 rounded-full border px-4 text-sm font-semibold transition ${
                filter === f.id
                  ? "border-emerald-700 bg-emerald-50 text-emerald-800"
                  : "border-slate-300 bg-white text-slate-700 hover:border-emerald-600"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-500 focus-within:border-emerald-600 md:w-72">
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <span className="sr-only">Search groups</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search groups"
            className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
          />
        </label>
      </div>

      {visible.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((g) => (
            <GroupCard key={g.id} group={g} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-semibold">No groups match</p>
          <p className="mt-1 text-sm text-slate-500">
            Try another filter or search term.
          </p>
          <button
            type="button"
            onClick={() => {
              setFilter("all");
              setQuery("");
            }}
            className="mt-4 inline-flex min-h-11 items-center rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:border-emerald-600"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
