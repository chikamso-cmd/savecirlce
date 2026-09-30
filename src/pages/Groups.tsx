import { useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  ChartNoAxesColumnIncreasing,
  ChevronRight,
  CircleHelp,
  Lightbulb,
  MoreVertical,
  Plus,
  Search,
  Sprout,
  UsersRound,
  Wallet,
} from "lucide-react";

type GroupStatus = "Active" | "Paused" | "Archived";
type GroupFilter = "All Groups" | GroupStatus;

type SavingsGroup = {
  name: string;
  type: "Rotating" | "Fixed";
  status: GroupStatus;
  members: number;
  amount: string;
  cadence: string;
  payoutName: string;
  payoutDate: string;
  paid: number;
  total: number;
  arrears: number;
  image: string;
  iconStyle: string;
};

const groups: SavingsGroup[] = [
  {
    name: "St. John's Ajo",
    type: "Rotating",
    status: "Active",
    members: 15,
    amount: "₦20,000",
    cadence: "/ Month",
    payoutName: "Chinedu",
    payoutDate: "Oct 5, 2026",
    paid: 12,
    total: 15,
    arrears: 1,
    image:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=700&q=85",
    iconStyle: "bg-emerald-100 text-emerald-700",
  },
  {
    name: "Market Traders Cooperative",
    type: "Fixed",
    status: "Active",
    members: 24,
    amount: "₦10,000",
    cadence: "/ Week",
    payoutName: "Ngozi",
    payoutDate: "Oct 12, 2026",
    paid: 18,
    total: 24,
    arrears: 3,
    image:
      "https://images.unsplash.com/photo-1556742049-0a67dd371e71?auto=format&fit=crop&w=700&q=85",
    iconStyle: "bg-violet-100 text-violet-600",
  },
  {
    name: "Church Youth Thrift",
    type: "Fixed",
    status: "Active",
    members: 12,
    amount: "₦15,000",
    cadence: "/ Month",
    payoutName: "Group Payout",
    payoutDate: "Dec 1, 2026",
    paid: 10,
    total: 12,
    arrears: 2,
    image:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=700&q=85",
    iconStyle: "bg-orange-100 text-orange-600",
  },
];

const filters: GroupFilter[] = ["All Groups", "Active", "Paused", "Archived"];

export default function Groups() {
  const [activeFilter, setActiveFilter] = useState<GroupFilter>("All Groups");
  const [query, setQuery] = useState("");

  const visibleGroups = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return groups.filter((group) => {
      const matchesFilter =
        activeFilter === "All Groups" || group.status === activeFilter;
      const matchesQuery = group.name.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, query]);

  const countForFilter = (filter: GroupFilter) =>
    filter === "All Groups"
      ? groups.length
      : groups.filter((group) => group.status === filter).length;

  return (
    <div className="grid min-h-full grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_238px]">
      <section className="min-w-0">
        <div className="flex min-h-12 flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            {filters.map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setActiveFilter(filter)}
                aria-pressed={activeFilter === filter}
                className={`h-8 whitespace-nowrap rounded-lg px-3 text-[11px] font-semibold transition-colors ${
                  activeFilter === filter
                    ? "bg-emerald-700 text-white shadow-sm"
                    : "border border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-100"
                }`}
              >
                {filter} ({countForFilter(filter)})
              </button>
            ))}
          </div>
          <label className="flex h-9 w-full items-center gap-2 rounded-lg border border-gray-200 bg-white px-2.5 text-gray-500 sm:ml-auto sm:w-44">
            <Search className="size-4 shrink-0" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search groups..."
              aria-label="Search groups"
              className="min-w-0 flex-1 bg-transparent text-[11px] text-gray-800 outline-none placeholder:text-gray-400"
            />
          </label>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          {visibleGroups.map((group) => {
            const progress = Math.round((group.paid / group.total) * 100);
            return (
              <article
                key={group.name}
                className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-[0_2px_10px_rgba(16,45,62,0.06)]"
              >
                <div className="relative h-11 overflow-hidden">
                  <img
                    src={group.image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/40 to-transparent" />
                  <div
                    className={`absolute -bottom-3 left-3 z-10 flex size-10 items-center justify-center rounded-full border-2 border-white ${group.iconStyle}`}
                  >
                    <UsersRound className="size-5" aria-hidden="true" />
                  </div>
                  <button
                    type="button"
                    aria-label={`More options for ${group.name}`}
                    className="absolute right-3 top-8 z-10 flex size-7 items-center justify-center rounded-lg border border-gray-100 bg-white text-gray-600 shadow-sm hover:bg-gray-50"
                  >
                    <MoreVertical className="size-4" />
                  </button>
                </div>

                <div className="px-3.5 pb-3 pt-5">
                  <div className="min-h-12">
                    <h2 className="truncate text-sm font-bold text-gray-900">
                      {group.name}
                    </h2>
                    <span
                      className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-[9px] font-semibold ${
                        group.type === "Rotating"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {group.type}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-[0.75fr_1fr_1.1fr] divide-x divide-gray-100 border-y border-gray-100 py-2 text-[9px] text-gray-500">
                    <div className="flex items-start gap-1.5 pr-2">
                      <UsersRound className="mt-0.5 size-3.5 shrink-0 text-[#42617b]" />
                      <div>
                        <p className="font-semibold text-gray-800">
                          {group.members}
                        </p>
                        <p>Members</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5 px-2">
                      <Wallet className="mt-0.5 size-3.5 shrink-0 text-[#42617b]" />
                      <div>
                        <p className="whitespace-nowrap font-semibold text-gray-800">
                          {group.amount}
                        </p>
                        <p>{group.cadence}</p>
                      </div>
                    </div>
                    <div className="flex min-w-0 items-start gap-1.5 pl-2">
                      <CalendarDays className="mt-0.5 size-3.5 shrink-0 text-[#42617b]" />
                      <div className="min-w-0">
                        <p>Next Payout</p>
                        <p className="truncate font-semibold text-gray-800">
                          {group.payoutName}
                        </p>
                        <p className="whitespace-nowrap">{group.payoutDate}</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2.5 grid grid-cols-[1fr_0.9fr] gap-2">
                    <div className="flex min-h-12.5 items-center gap-2 rounded-lg bg-emerald-50 px-2.5">
                      <div
                        className="relative size-8 shrink-0 rounded-full"
                        style={{
                          background: `conic-gradient(#07966d ${progress}%, #d8eee6 ${progress}% 100%)`,
                        }}
                        aria-label={`${progress}% of contributions received`}
                      >
                        <span className="absolute inset-1 rounded-full bg-emerald-50" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-gray-800">
                          {group.paid} / {group.total}
                        </p>
                        <p className="truncate text-[8px] text-gray-500">
                          Contributions received
                        </p>
                      </div>
                    </div>
                    <div className="flex min-h-12.5 items-center gap-2 rounded-lg bg-red-50 px-2.5">
                      <AlertTriangle className="size-3.5 shrink-0 text-red-500" />
                      <div>
                        <p className="text-[10px] font-bold text-red-600">
                          {group.arrears}
                        </p>
                        <p className="text-[8px] text-red-500">
                          {group.arrears === 1 ? "Member" : "Members"} with
                          arrears
                        </p>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="mt-2.5 flex h-8 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 text-[10px] font-semibold text-white transition-colors hover:bg-emerald-800"
                  >
                    View Group <ArrowRight className="size-3.5" />
                  </button>
                </div>
              </article>
            );
          })}

          {visibleGroups.length === 0 && (
            <p className="col-span-full rounded-xl border border-gray-100 bg-white px-4 py-10 text-center text-sm text-gray-500">
              No groups match your search.
            </p>
          )}
        </div>
      </section>

      <aside className="space-y-4">
        <section className="relative min-h-44.75 overflow-hidden rounded-xl bg-linear-to-br from-emerald-700 to-emerald-800 p-4 text-white shadow-sm">
          <Sprout className="absolute -right-2 top-2 size-32 rotate-12 text-emerald-200/25" />
          <div className="relative z-10 flex size-8 items-center justify-center rounded-full bg-white text-emerald-700">
            <Plus className="size-5" />
          </div>
          <h2 className="relative z-10 mt-3 text-sm font-bold">
            Create a New Group
          </h2>
          <p className="relative z-10 mt-1 max-w-47.5 text-[10px] leading-4 text-emerald-50">
            Start a new ajo or esusu group and invite members.
          </p>
          <button
            type="button"
            className="relative z-10 mt-3 inline-flex h-8 items-center gap-2 rounded-full bg-white px-4 text-[10px] font-semibold text-emerald-800 transition-colors hover:bg-emerald-50"
          >
            <Plus className="size-3.5" /> Create Group
          </button>
        </section>

        <section className="rounded-xl border border-gray-100 bg-white px-3.5 py-3.5 shadow-[0_2px_10px_rgba(16,45,62,0.05)]">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="flex items-center gap-2 text-xs font-bold text-gray-900">
              <ChartNoAxesColumnIncreasing className="size-4 text-emerald-700" />
              Group Summary
            </h2>
            <ChevronRight className="size-4 text-gray-500" />
          </div>
          <SummaryRow
            icon={UsersRound}
            label="Total Groups"
            value="3"
            tone="green"
          />
          <SummaryRow
            icon={UsersRound}
            label="Total Members"
            value="51"
            tone="blue"
          />
          <SummaryRow
            icon={Wallet}
            label="Total Expected Pool"
            value="₦1,260,000"
            tone="orange"
          />
        </section>

        <section className="rounded-xl bg-emerald-50 px-4 py-3.5 text-gray-800">
          <h2 className="flex items-center gap-2 text-xs font-bold text-[#155b48]">
            <Lightbulb className="size-4 text-emerald-700" /> Quick Tips
          </h2>
          <p className="mt-2 pl-6 text-[10px] leading-4 text-gray-600">
            Keep your group active, record contributions on time, and remind
            members before due dates.
          </p>
          <a
            href="#help"
            className="mt-3 inline-flex items-center gap-2 pl-6 text-[10px] font-semibold text-[#155b48] underline underline-offset-2"
          >
            <CircleHelp className="size-3.5" /> View Help & FAQs
            <ArrowRight className="size-3" />
          </a>
        </section>
      </aside>
    </div>
  );
}

function SummaryRow({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof UsersRound;
  label: string;
  value: string;
  tone: "green" | "blue" | "orange";
}) {
  const iconClasses = {
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-500",
  };

  return (
    <div className="flex min-h-12.25 items-center justify-between border-b border-gray-100 last:border-b-0">
      <div className="flex min-w-0 items-center gap-2.5">
        <span
          className={`flex size-7 shrink-0 items-center justify-center rounded-lg ${iconClasses[tone]}`}
        >
          <Icon className="size-4" />
        </span>
        <span className="truncate text-[10px] text-gray-500">{label}</span>
      </div>
      <span className="ml-2 whitespace-nowrap text-[10px] font-bold text-gray-900">
        {value}
      </span>
    </div>
  );
}
