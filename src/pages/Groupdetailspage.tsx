import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeftRight,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Pause,
  Play,
  Search,
  UserPlus,
  Wallet,
  X,
} from "lucide-react";
import { Pill } from "../components/widgets/DashboardWidgets";
import AddMemberModal, {
  type NewMemberInput,
} from "../components/modals/AddMembers";

// ---------- local types & sample data (replace with GET /groups/:id/...) ----------

interface Group {
  id: string;
  name: string;
  type: "rotating" | "thrift";
  branch: string;
  officer: string;
  amount: number;
  frequency: "Daily" | "Weekly" | "Monthly";
  memberCount: number;
  status: "active" | "paused" | "invites_sent";
  cycle?: number;
  cycles?: number;
  nextPayout?: string;
  noticePeriod?: string;
}

const SAMPLE_GROUPS: Group[] = [
  {
    id: "g1",
    name: "[Market traders ajo]",
    type: "rotating",
    branch: "[Branch A]",
    officer: "[Officer 1]",
    amount: 5000,
    frequency: "Weekly",
    memberCount: 12,
    status: "active",
    cycle: 4,
    cycles: 12,
    nextPayout: "Fri 9 Oct",
  },
  {
    id: "g2",
    name: "[Church thrift]",
    type: "thrift",
    branch: "[Branch A]",
    officer: "[Officer 2]",
    amount: 2000,
    frequency: "Daily",
    memberCount: 38,
    status: "active",
    noticePeriod: "7 days",
  },
  {
    id: "g3",
    name: "[Teachers circle]",
    type: "rotating",
    branch: "[Branch B]",
    officer: "[Officer 3]",
    amount: 20000,
    frequency: "Monthly",
    memberCount: 10,
    status: "active",
    cycle: 7,
    cycles: 10,
    nextPayout: "Thu 29 Oct",
  },
  {
    id: "g4",
    name: "[Artisans weekly]",
    type: "rotating",
    branch: "[Branch B]",
    officer: "[Officer 1]",
    amount: 3000,
    frequency: "Weekly",
    memberCount: 8,
    status: "paused",
    cycle: 2,
    cycles: 8,
  },
];

// TODO: replace with GET /groups/:id
async function fetchGroup(id: string): Promise<Group | null> {
  await new Promise((r) => setTimeout(r, 400));
  return SAMPLE_GROUPS.find((g) => g.id === id) ?? null;
}

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;

type PayStatus = "paid" | "part" | "unpaid" | "credit";
type Tab = "members" | "rotation" | "withdrawals" | "activity";
type PayoutState = "idle" | "choosing" | "submitting" | "awaiting_checker";

interface GroupMember {
  id: string;
  name: string;
  phone: string;
  paidThisCycle: number;
  savings: number; // thrift balance
  hasAccount: boolean;
}

interface Activity {
  id: string;
  when: string;
  member: string;
  channel: "Transfer" | "Cash";
  amount: number;
  note?: string;
}

const sampleMembers = (g: Group): GroupMember[] =>
  Array.from({ length: Math.min(g.memberCount, 12) }, (_, i) => {
    const pattern = [1, 1, 0.5, 0, 1, 1.4, 1, 0, 1, 1, 1, 0.5][i % 12];
    return {
      id: `${g.id}-m${i + 1}`,
      name: `[Member ${i + 1}]`,
      phone: `080${String(30000000 + i * 1111111).slice(0, 8)}`,
      paidThisCycle:
        g.status === "invites_sent" ? 0 : Math.round(g.amount * pattern),
      savings: g.type === "thrift" ? 20000 + i * 7350 : 0,
      hasAccount: i % 5 !== 4,
    };
  });

const sampleActivity = (g: Group): Activity[] => [
  {
    id: "a1",
    when: "Today, 10:42",
    member: "[Member 1]",
    channel: "Transfer",
    amount: g.amount,
  },
  {
    id: "a2",
    when: "Today, 09:58",
    member: "[Member 5]",
    channel: "Cash",
    amount: g.amount,
    note: "Logged by " + g.officer,
  },
  {
    id: "a3",
    when: "Yesterday",
    member: "[Member 6]",
    channel: "Transfer",
    amount: Math.round(g.amount * 1.4),
    note: "Extra kept as member credit",
  },
  {
    id: "a4",
    when: "Yesterday",
    member: "[Member 3]",
    channel: "Transfer",
    amount: Math.round(g.amount / 2),
    note: "Part payment",
  },
];

const statusOf = (paid: number, due: number): PayStatus =>
  paid > due ? "credit" : paid === due ? "paid" : paid > 0 ? "part" : "unpaid";

const STATUS_PILL: Record<
  PayStatus,
  { tone: "success" | "warning" | "info" | "neutral"; label: string }
> = {
  paid: { tone: "success", label: "Paid" },
  part: { tone: "warning", label: "Part paid" },
  unpaid: { tone: "warning", label: "Unpaid" },
  credit: { tone: "info", label: "Paid + credit" },
};

const btnPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50";
const btnOutline =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:border-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50";
const inputCls =
  "w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3.5 text-[15px] focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";

function GroupDetails({ id }: { id?: string }) {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("members");
  const [members, setMembers] = useState<GroupMember[]>([]);
  const [activity, setActivity] = useState<Activity[]>([]);
  const [query, setQuery] = useState("");
  const [cashOpen, setCashOpen] = useState(false);
  const [cashMember, setCashMember] = useState("");
  const [cashAmount, setCashAmount] = useState("");
  const [cashSaving, setCashSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [payout, setPayout] = useState<PayoutState>("idle");
  const [pausing, setPausing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchGroup(id ?? "").then((g) => {
      if (cancelled) return;
      setGroup(g);
      if (g) {
        setMembers(sampleMembers(g));
        setActivity(sampleActivity(g));
        document.title = `${g.name} | SaveCircle`;
      }
      setLoading(false);
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

  const cycleTotals = useMemo(() => {
    if (!group) return { due: 0, collected: 0, unpaid: 0 };
    const due = group.amount * members.length;
    const collected = members.reduce(
      (s, m) => s + Math.min(m.paidThisCycle, group.amount),
      0,
    );
    return {
      due,
      collected,
      unpaid: members.filter((m) => m.paidThisCycle < group.amount).length,
    };
  }, [group, members]);

  if (loading) {
    return (
      <div
        className="mx-auto max-w-8xl space-y-4"
        aria-busy="true"
        aria-label="Loading group"
      >
        <div className="h-8 w-64 animate-pulse rounded-lg bg-slate-200" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-2xl bg-slate-200"
            />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h1 className="text-xl font-extrabold">Group not found</h1>
        <p className="mt-2 text-slate-600">
          It may have been removed, or the link is wrong.
        </p>
        <Link to="/groups" className={`${btnOutline} mt-5`}>
          Back to groups
        </Link>
      </div>
    );
  }

  const rotating = group.type === "rotating";
  const paused = group.status === "paused";
  const fullyFunded =
    cycleTotals.collected >= cycleTotals.due && cycleTotals.due > 0;
  const currentSlot = group.cycle ?? 1;
  const totalSavings = members.reduce((s, m) => s + m.savings, 0);

  const visibleMembers = members.filter(
    (m) =>
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.phone.includes(query),
  );

  const TABS: { id: Tab; label: string }[] = [
    {
      id: "members",
      label: rotating ? `Cycle ${currentSlot} payments` : "Members",
    },
    rotating
      ? { id: "rotation", label: "Rotation" }
      : { id: "withdrawals", label: "Withdrawals" },
    { id: "activity", label: "Activity" },
  ];

  // ---------- actions ----------

  const recordCash = async () => {
    const amt = Number(cashAmount);
    const m = members.find((x) => x.id === cashMember);
    if (!m || !amt) return;
    setCashSaving(true);
    await new Promise((r) => setTimeout(r, 600)); // TODO: POST /payments { channel: 'cash' }
    setMembers((ms) =>
      ms.map((x) =>
        x.id === m.id
          ? rotating
            ? { ...x, paidThisCycle: x.paidThisCycle + amt }
            : { ...x, savings: x.savings + amt }
          : x,
      ),
    );
    setActivity((a) => [
      {
        id: crypto.randomUUID(),
        when: "Just now",
        member: m.name,
        channel: "Cash",
        amount: amt,
        note: `Logged by ${group.officer}`,
      },
      ...a,
    ]);
    setCashSaving(false);
    setCashOpen(false);
    setCashMember("");
    setCashAmount("");
    setToast(`${naira(amt)} cash recorded for ${m.name}. Receipt sent.`);
  };

  const submitPayout = async (choice: "now" | "wait") => {
    if (choice === "wait") {
      setPayout("idle");
      setToast(
        "Payout will be created automatically once the cycle is fully funded.",
      );
      return;
    }
    setPayout("submitting");
    await new Promise((r) => setTimeout(r, 800)); // TODO: POST /payouts (maker step)
    setPayout("awaiting_checker");
    setToast(`Payout sent to a finance approver for the second approval.`);
  };

  const togglePause = async () => {
    setPausing(true);
    await new Promise((r) => setTimeout(r, 600)); // TODO: PATCH /groups/:id
    setGroup({ ...group, status: paused ? "active" : "paused" });
    setPausing(false);
    setToast(
      paused
        ? "Group resumed. Reminders and cycles restart."
        : "Group paused. Reminders stop until you resume.",
    );
  };

  const addMembers = (added: NewMemberInput[]) => {
    setMembers((ms) => [
      ...ms,
      ...added.map((m) => ({
        id: crypto.randomUUID(),
        name: m.name,
        phone: m.phone,
        paidThisCycle: 0,
        savings: 0,
        hasAccount: false,
      })),
    ]);
    setGroup({ ...group, memberCount: group.memberCount + added.length });
    setAddOpen(false);
    setToast(
      `${added.length} member${added.length > 1 ? "s" : ""} added. Invites sent.`,
    );
  };

  return (
    <div className="mx-auto max-w-8xl space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/groups"
          className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
        >
          <ChevronLeft className="size-4" /> Groups
        </Link>
        <div className="mt-1 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
                {group.name}
              </h1>
              <Pill tone={rotating ? "info" : "neutral"}>
                {rotating ? "Rotating" : "Thrift"}
              </Pill>
              {paused && <Pill tone="warning">Paused</Pill>}
            </div>
            <p className="mt-1 text-sm text-slate-600 sm:text-base">
              {naira(group.amount)} {group.frequency.toLowerCase()},{" "}
              {group.branch}, officer {group.officer}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <button
              type="button"
              onClick={() => setCashOpen(true)}
              disabled={paused}
              className={btnPrimary}
            >
              <Wallet className="size-4" /> Record cash
            </button>
            {rotating ? (
              <button
                type="button"
                onClick={() => setPayout("choosing")}
                disabled={paused || payout !== "idle"}
                className={btnOutline}
              >
                <Banknote className="size-4" />{" "}
                {payout === "awaiting_checker"
                  ? "Awaiting approval"
                  : "Initiate payout"}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setTab("withdrawals")}
                className={btnOutline}
              >
                <Banknote className="size-4" /> Withdrawals
              </button>
            )}
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className={btnOutline}
            >
              <UserPlus className="size-4" /> Add members
            </button>
            <button
              type="button"
              onClick={togglePause}
              disabled={pausing}
              className={btnOutline}
            >
              {pausing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : paused ? (
                <Play className="size-4" />
              ) : (
                <Pause className="size-4" />
              )}
              {paused ? "Resume" : "Pause"}
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {rotating ? (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-slate-600 sm:text-sm">
                Cycle
              </p>
              <p className="mt-1 text-2xl font-extrabold">
                {currentSlot} of {group.cycles}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-slate-600 sm:text-sm">
                Collected this cycle
              </p>
              <p className="mt-1 text-2xl font-extrabold">
                {naira(cycleTotals.collected)}
              </p>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-emerald-600"
                  style={{
                    width: `${Math.min(100, (cycleTotals.collected / (cycleTotals.due || 1)) * 100)}%`,
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                of {naira(cycleTotals.due)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-slate-600 sm:text-sm">
                Next payout
              </p>
              <p className="mt-1 text-lg font-extrabold">
                {paused ? "Paused" : (group.nextPayout ?? "Not set")}
              </p>
              <p className="text-xs text-slate-500">
                to [Member {currentSlot}]
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-slate-600 sm:text-sm">
                Total savings
              </p>
              <p className="mt-1 text-2xl font-extrabold">
                {naira(totalSavings)}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-slate-600 sm:text-sm">
                Withdrawal notice
              </p>
              <p className="mt-1 text-2xl font-extrabold">
                {group.noticePeriod ?? "Org default"}
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-xs font-semibold text-slate-600 sm:text-sm">
                Pending withdrawals
              </p>
              <p className="mt-1 text-2xl font-extrabold">2</p>
            </div>
          </>
        )}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-semibold text-slate-600 sm:text-sm">
            Members
          </p>
          <p className="mt-1 text-2xl font-extrabold">{members.length}</p>
          <p
            className={`text-xs font-semibold ${cycleTotals.unpaid ? "text-amber-700" : "text-emerald-700"}`}
          >
            {rotating
              ? cycleTotals.unpaid
                ? `${cycleTotals.unpaid} still to pay`
                : "Everyone has paid"
              : `${members.filter((m) => !m.hasAccount).length} without account number`}
          </p>
        </div>
      </div>

      {/* Payout decision (v4 §6.3) */}
      {payout === "choosing" && (
        <section
          className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-bold">
                Pay out cycle {currentSlot} to [Member {currentSlot}]
              </h2>
              {fullyFunded ? (
                <p className="mt-1 text-sm text-slate-700">
                  The cycle is fully funded. {naira(cycleTotals.due)} will go to
                  their verified payout account after a finance approver signs
                  off.
                </p>
              ) : (
                <p className="mt-1 flex gap-2 text-sm text-amber-900">
                  <AlertCircle className="size-4 shrink-0 translate-y-0.5" />
                  Only {naira(cycleTotals.collected)} of{" "}
                  {naira(cycleTotals.due)} is in. Pay what's collected now and
                  top up automatically as arrears arrive, or wait.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setPayout("idle")}
              aria-label="Cancel payout"
              className="rounded-lg p-2 text-slate-500 hover:bg-white"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {fullyFunded ? (
              <button
                type="button"
                onClick={() => submitPayout("now")}
                className={btnPrimary}
              >
                Send for approval
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => submitPayout("now")}
                  className={btnPrimary}
                >
                  Pay {naira(cycleTotals.collected)} now, top up later
                </button>
                <button
                  type="button"
                  onClick={() => submitPayout("wait")}
                  className={btnOutline}
                >
                  Wait until fully funded
                </button>
              </>
            )}
          </div>
        </section>
      )}
      {payout === "submitting" && (
        <p className="flex items-center gap-2 rounded-2xl bg-slate-100 p-4 text-sm">
          <Loader2 className="size-4 animate-spin" /> Creating payout…
        </p>
      )}

      {/* Record cash panel */}
      {cashOpen && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Record cash</h2>
            <button
              type="button"
              onClick={() => setCashOpen(false)}
              aria-label="Close"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_200px_auto] sm:items-end">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Member
              </span>
              <select
                className={inputCls}
                value={cashMember}
                onChange={(e) => setCashMember(e.target.value)}
              >
                <option value="">Select member</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Amount
              </span>
              <input
                className={inputCls}
                inputMode="numeric"
                placeholder={naira(group.amount)}
                value={cashAmount ? naira(Number(cashAmount)) : ""}
                onChange={(e) =>
                  setCashAmount(e.target.value.replace(/\D/g, "").slice(0, 9))
                }
              />
            </label>
            <button
              type="button"
              onClick={recordCash}
              disabled={!cashMember || !Number(cashAmount) || cashSaving}
              className={btnPrimary}
            >
              {cashSaving && <Loader2 className="size-4 animate-spin" />} Save
            </button>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Added to {group.officer}'s cash in hand until it's banked. The
            member gets a receipt.
          </p>
        </section>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div role="tablist" className="-mb-px flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={`min-h-11 shrink-0 border-b-2 px-4 text-sm font-semibold transition ${tab === t.id ? "border-emerald-700 text-emerald-800" : "border-transparent text-slate-600 hover:text-slate-900"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "members" && (
        <section className="space-y-4">
          <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-500 focus-within:border-emerald-600 sm:max-w-sm">
            <Search className="size-4 shrink-0" aria-hidden="true" />
            <span className="sr-only">Search members</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or phone"
              className="w-full bg-transparent text-sm text-slate-900 focus:outline-none"
            />
          </label>
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
            {visibleMembers.map((m) => {
              const st = statusOf(m.paidThisCycle, group.amount);
              return (
                <li
                  key={m.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:px-5"
                >
                  <div className="min-w-0 flex-1 basis-40">
                    <Link
                      to="/members"
                      className="block truncate font-semibold hover:text-emerald-700"
                    >
                      {m.name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {m.phone}
                      {!m.hasAccount && ", cash only"}
                    </p>
                  </div>
                  {rotating ? (
                    <>
                      <span className="text-sm text-slate-600">
                        {st === "unpaid"
                          ? `Owes ${naira(group.amount)}`
                          : st === "part"
                            ? `Owes ${naira(group.amount - m.paidThisCycle)}`
                            : `Paid ${naira(m.paidThisCycle)}`}
                      </span>
                      <Pill tone={STATUS_PILL[st].tone}>
                        {STATUS_PILL[st].label}
                      </Pill>
                    </>
                  ) : (
                    <span className="text-sm font-bold">
                      {naira(m.savings)}
                    </span>
                  )}
                </li>
              );
            })}
            {visibleMembers.length === 0 && (
              <li className="p-6 text-center text-sm text-slate-500">
                No members match.
              </li>
            )}
          </ul>
        </section>
      )}

      {tab === "rotation" && rotating && (
        <section className="rounded-2xl border border-slate-200 bg-white">
          <ol className="divide-y divide-slate-100">
            {Array.from({ length: group.cycles ?? 0 }, (_, i) => {
              const slot = i + 1;
              const done = slot < currentSlot;
              const current = slot === currentSlot;
              return (
                <li
                  key={slot}
                  className={`flex items-center gap-4 px-4 py-3.5 sm:px-5 ${current ? "bg-emerald-50/50" : ""}`}
                >
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${done ? "bg-emerald-700 text-white" : current ? "border-2 border-emerald-700 text-emerald-800" : "bg-slate-100 text-slate-500"}`}
                  >
                    {done ? <CheckCircle2 className="size-4" /> : slot}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">
                      [Member {slot}]
                    </span>
                    <span className="block text-xs text-slate-500">
                      {naira(group.amount * (group.cycles ?? 0))} payout
                    </span>
                  </span>
                  {done && <Pill tone="success">Paid out</Pill>}
                  {current && (
                    <Pill
                      tone={payout === "awaiting_checker" ? "info" : "warning"}
                    >
                      {payout === "awaiting_checker"
                        ? "Awaiting approval"
                        : "Collecting"}
                    </Pill>
                  )}
                  {!done && !current && <Pill tone="neutral">Upcoming</Pill>}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {tab === "withdrawals" && !rotating && (
        <section className="rounded-2xl border border-slate-200 bg-white">
          <ul className="divide-y divide-slate-100">
            {[
              {
                m: "[Member 2]",
                amt: 45000,
                due: "Wed 7 Oct",
                status: "Needs checker",
                tone: "warning" as const,
              },
              {
                m: "[Member 7]",
                amt: 15000,
                due: "Fri 9 Oct",
                status: "Scheduled",
                tone: "success" as const,
              },
            ].map((w) => (
              <li
                key={w.m}
                className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 sm:px-5"
              >
                <span className="min-w-0 flex-1 basis-40">
                  <span className="block font-semibold">{w.m}</span>
                  <span className="block text-xs text-slate-500">
                    Due {w.due}
                  </span>
                </span>
                <span className="text-sm font-bold">{naira(w.amt)}</span>
                <Pill tone={w.tone}>{w.status}</Pill>
              </li>
            ))}
          </ul>
          <p className="border-t border-slate-100 p-4 text-sm text-slate-500">
            Notices follow the {group.noticePeriod ?? "organisation"} notice
            period. Amounts above the approval limit need a second approver.{" "}
            <Link to="/withdrawals" className="font-semibold text-emerald-700">
              Open withdrawals
            </Link>
          </p>
        </section>
      )}

      {tab === "activity" && (
        <section className="rounded-2xl border border-slate-200 bg-white">
          <ul className="divide-y divide-slate-100">
            {activity.map((a) => (
              <li
                key={a.id}
                className="flex items-start gap-3 px-4 py-3.5 sm:px-5"
              >
                <span
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full ${a.channel === "Cash" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}
                >
                  {a.channel === "Cash" ? (
                    <Wallet className="size-4" />
                  ) : (
                    <ArrowLeftRight className="size-4" />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{a.member}</span>
                  <span className="block text-xs text-slate-500">
                    {a.when}, {a.channel}
                    {a.note && `, ${a.note}`}
                  </span>
                </span>
                <span className="text-sm font-bold">{naira(a.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {addOpen && (
        <AddMemberModal
          groups={[group.name]}
          existingPhones={members.map((m) => m.phone)}
          onClose={() => setAddOpen(false)}
          onAdd={addMembers}
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

// Keyed by id so local state resets when you move between groups
export default function GroupDetailsPage() {
  const { id } = useParams();
  return <GroupDetails key={id} id={id} />;
}
