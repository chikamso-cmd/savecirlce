import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Wallet,
  X,
} from "lucide-react";
import { Pill } from "../components/widgets/DashboardWidgets";
import AddMemberModal, {
  type NewMemberInput,
} from "../components/modals/AddMembers";

// ---------- types & sample data (replace with API data) ----------

type IdStatus = "verified" | "pending" | "unverified";
type AccountStatus = "active" | "setting_up" | "failed" | "none" | "blocked";
type Filter = "all" | "verified" | "pending" | "unverified" | "arrears";

interface Member {
  id: string;
  name: string;
  phone: string;
  groups: string[];
  idStatus: IdStatus;
  accountStatus: AccountStatus;
  accountNumber?: string;
  failReason?: string;
  savings: number;
  arrears: number;
  payoutAccount?: string;
  active: boolean;
  lastPayment?: string;
}

const GROUPS = [
  "[Market traders ajo]",
  "[Church thrift]",
  "[Teachers circle]",
  "[Artisans weekly]",
];

const SAMPLE: Member[] = [
  {
    id: "m1",
    name: "[Member 1]",
    phone: "08031234567",
    groups: ["[Market traders ajo]", "[Church thrift]"],
    idStatus: "verified",
    accountStatus: "active",
    accountNumber: "9012345671",
    savings: 84500,
    arrears: 0,
    payoutAccount: "GTBank ••••4321",
    active: true,
    lastPayment: "Today, 10:42",
  },
  {
    id: "m2",
    name: "[Member 2]",
    phone: "08059876543",
    groups: ["[Market traders ajo]"],
    idStatus: "verified",
    accountStatus: "active",
    accountNumber: "9012345672",
    savings: 0,
    arrears: 5000,
    active: true,
    lastPayment: "28 Sep",
  },
  {
    id: "m3",
    name: "[Member 3]",
    phone: "07061112233",
    groups: ["[Church thrift]"],
    idStatus: "pending",
    accountStatus: "setting_up",
    savings: 12000,
    arrears: 0,
    active: true,
    lastPayment: "Yesterday",
  },
  {
    id: "m4",
    name: "[Member 4]",
    phone: "08124445566",
    groups: ["[Teachers circle]"],
    idStatus: "verified",
    accountStatus: "failed",
    failReason: "BVN name does not match the name on file",
    savings: 0,
    arrears: 20000,
    active: true,
  },
  {
    id: "m5",
    name: "[Member 5]",
    phone: "09037778899",
    groups: ["[Artisans weekly]"],
    idStatus: "unverified",
    accountStatus: "none",
    savings: 6000,
    arrears: 3000,
    active: true,
    lastPayment: "Cash, 2 Oct",
  },
  {
    id: "m6",
    name: "[Member 6]",
    phone: "08022223344",
    groups: ["[Church thrift]"],
    idStatus: "verified",
    accountStatus: "blocked",
    accountNumber: "9012345676",
    savings: 0,
    arrears: 0,
    active: false,
    lastPayment: "Aug",
  },
];

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
const fmtAcct = (n: string) => n.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3");
const initials = (name: string) =>
  name
    .replace(/[[\]]/g, "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const inputCls =
  "w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3.5 text-[15px] placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 dark:bg-slate-900";
const btnPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60";
const btnOutline =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:border-emerald-600 hover:text-emerald-700 disabled:opacity-50";

function IdPill({ status }: { status: IdStatus }) {
  if (status === "verified") return <Pill tone="success">Verified</Pill>;
  if (status === "pending") return <Pill tone="info">Verifying</Pill>;
  return <Pill tone="neutral">Not verified</Pill>;
}

function AccountCell({ m }: { m: Member }) {
  if (m.accountStatus === "active" && m.accountNumber)
    return (
      <span className="font-mono text-sm">{fmtAcct(m.accountNumber)}</span>
    );
  if (m.accountStatus === "blocked")
    return <span className="text-sm text-slate-500">Blocked</span>;
  if (m.accountStatus === "setting_up")
    return <span className="text-sm text-sky-700">Setting up…</span>;
  if (m.accountStatus === "failed")
    return <span className="text-sm font-semibold text-red-600">Failed</span>;
  return <span className="text-sm text-slate-500">Cash only</span>;
}

// ---------- member detail drawer ----------

function MemberDrawer({
  member: m,
  onClose,
  onUpdate,
  notify,
}: {
  member: Member;
  onClose: () => void;
  onUpdate: (patch: Partial<Member>) => void;
  notify: (msg: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [idNumber, setIdNumber] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [cashOpen, setCashOpen] = useState(false);
  const [cashAmount, setCashAmount] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const run = async (key: string, fn: () => void, ms = 800) => {
    setBusy(key);
    await new Promise((r) => setTimeout(r, ms)); // TODO: call the matching API endpoint
    fn();
    setBusy(null);
  };

  const copy = async () => {
    if (!m.accountNumber) return;
    await navigator.clipboard.writeText(m.accountNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const verify = () =>
    run("verify", () => {
      onUpdate({ idStatus: "pending", accountStatus: "setting_up" });
      setVerifyOpen(false);
      notify(
        `Verification started for ${m.name}. They'll get their account number by SMS.`,
      );
    });

  const recordCash = () => {
    const amt = Number(cashAmount);
    if (!amt) return;
    run("cash", () => {
      const toArrears = Math.min(amt, m.arrears);
      onUpdate({
        arrears: m.arrears - toArrears,
        savings: m.savings + (amt - toArrears),
        lastPayment: "Cash, just now",
      });
      setCashOpen(false);
      setCashAmount("");
      notify(
        `${naira(amt)} cash recorded for ${m.name}. A receipt is on its way to them.`,
      );
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-900/40"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="flex h-full w-full flex-col bg-white shadow-xl sm:max-w-md"
      >
        <div className="flex items-start gap-3 border-b border-slate-200 p-5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-extrabold text-emerald-800">
            {initials(m.name)}
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="drawer-title" className="truncate text-lg font-bold">
              {m.name}
            </h2>
            <p className="text-sm text-slate-500">{m.phone}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <IdPill status={m.idStatus} />
              {!m.active && <Pill tone="neutral">Inactive</Pill>}
              {m.arrears > 0 && (
                <Pill tone="warning">Owes {naira(m.arrears)}</Pill>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* Account number */}
          <section className="rounded-xl border border-slate-200 p-4">
            <p className="text-sm font-semibold text-slate-600">
              Personal account number
            </p>
            {m.accountStatus === "active" && m.accountNumber && (
              <div className="mt-2 flex items-center gap-3">
                <span className="font-mono text-2xl font-bold tracking-wide">
                  {fmtAcct(m.accountNumber)}
                </span>
                <button
                  type="button"
                  onClick={copy}
                  aria-label="Copy account number"
                  className="rounded-lg border border-slate-200 p-2.5 text-emerald-700 hover:bg-emerald-50"
                >
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </button>
              </div>
            )}
            {m.accountStatus === "active" && (
              <p className="mt-1 text-xs text-slate-500">
                One number for all their groups in this organisation.
              </p>
            )}
            {m.accountStatus === "setting_up" && (
              <p className="mt-2 flex items-center gap-2 text-sm text-sky-800">
                <Loader2 className="size-4 animate-spin" /> Setting up their
                account number
              </p>
            )}
            {m.accountStatus === "blocked" && (
              <p className="mt-2 text-sm text-slate-600">
                Blocked because the member is inactive. Late transfers to{" "}
                {fmtAcct(m.accountNumber ?? "")} still identify them.
              </p>
            )}
            {m.accountStatus === "failed" && (
              <div className="mt-2 space-y-3">
                <p className="flex gap-2 text-sm text-red-700">
                  <AlertCircle className="size-4 shrink-0 translate-y-0.5" />{" "}
                  {m.failReason}
                </p>
                <button
                  type="button"
                  disabled={busy === "retry"}
                  className={btnOutline}
                  onClick={() =>
                    run("retry", () => {
                      onUpdate({
                        accountStatus: "setting_up",
                        failReason: undefined,
                      });
                      notify("Retrying account setup.");
                    })
                  }
                >
                  {busy === "retry" && (
                    <Loader2 className="size-4 animate-spin" />
                  )}{" "}
                  Fix and retry
                </button>
              </div>
            )}
            {m.accountStatus === "none" && (
              <div className="mt-2 space-y-3">
                <p className="text-sm text-slate-600">
                  No account number yet. This member pays cash to an officer
                  until they verify.
                </p>
                {!verifyOpen ? (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setVerifyOpen(true)}
                      className={btnOutline}
                    >
                      <ShieldCheck className="size-4" /> Capture BVN or NIN
                    </button>
                    <button
                      type="button"
                      disabled={busy === "invite"}
                      className={btnOutline}
                      onClick={() =>
                        run("invite", () =>
                          notify(`Verification link sent to ${m.phone}.`),
                        )
                      }
                    >
                      {busy === "invite" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}{" "}
                      Send verify link
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 rounded-lg bg-slate-50 p-3">
                    <input
                      className={inputCls}
                      inputMode="numeric"
                      maxLength={11}
                      placeholder="BVN or NIN, 11 digits"
                      aria-label="BVN or NIN"
                      value={idNumber}
                      onChange={(e) =>
                        setIdNumber(e.target.value.replace(/\D/g, ""))
                      }
                      autoComplete="off"
                    />
                    <label className="flex cursor-pointer gap-3 text-sm">
                      <input
                        type="checkbox"
                        checked={consent}
                        onChange={(e) => setConsent(e.target.checked)}
                        className="mt-0.5 size-4 accent-emerald-700"
                      />
                      The member agrees to share this for verification.
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setVerifyOpen(false)}
                        className={btnOutline}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={verify}
                        disabled={
                          idNumber.length !== 11 ||
                          !consent ||
                          busy === "verify"
                        }
                        className={btnPrimary}
                      >
                        {busy === "verify" && (
                          <Loader2 className="size-4 animate-spin" />
                        )}{" "}
                        Verify
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Money */}
          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold text-slate-500">
                Thrift savings
              </p>
              <p className="mt-1 text-xl font-extrabold">{naira(m.savings)}</p>
            </div>
            <div
              className={`rounded-xl p-4 ${m.arrears ? "bg-amber-50" : "bg-slate-50"}`}
            >
              <p className="text-xs font-semibold text-slate-500">Arrears</p>
              <p
                className={`mt-1 text-xl font-extrabold ${m.arrears ? "text-amber-800" : ""}`}
              >
                {naira(m.arrears)}
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold">Groups</h3>
            <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">
              {m.groups.map((g) => (
                <li key={g}>
                  <Link
                    to="/groups"
                    className="flex min-h-11 items-center px-4 text-sm font-medium hover:bg-slate-50"
                  >
                    {g}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Payout account</span>
              <span className="font-medium">
                {m.payoutAccount ?? "Not added yet"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Last payment</span>
              <span className="font-medium">{m.lastPayment ?? "None yet"}</span>
            </div>
          </section>

          {cashOpen && (
            <section className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Cash received
                </span>
                <input
                  className={inputCls}
                  inputMode="numeric"
                  autoFocus
                  placeholder="₦0"
                  value={cashAmount ? naira(Number(cashAmount)) : ""}
                  onChange={(e) =>
                    setCashAmount(e.target.value.replace(/\D/g, "").slice(0, 9))
                  }
                />
              </label>
              <p className="text-xs text-slate-600">
                Clears arrears first, then goes to savings. Logged to your cash
                in hand.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setCashOpen(false)}
                  className={btnOutline}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={recordCash}
                  disabled={!Number(cashAmount) || busy === "cash"}
                  className={btnPrimary}
                >
                  {busy === "cash" && (
                    <Loader2 className="size-4 animate-spin" />
                  )}{" "}
                  Record cash
                </button>
              </div>
            </section>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-slate-200 p-4">
          <button
            type="button"
            onClick={() => setCashOpen(true)}
            disabled={!m.active || cashOpen}
            className={btnPrimary}
          >
            <Wallet className="size-4" /> Record cash
          </button>
          <button
            type="button"
            disabled={busy === "active"}
            className={btnOutline}
            onClick={() =>
              run("active", () => {
                onUpdate(
                  m.active
                    ? {
                        active: false,
                        accountStatus: m.accountNumber
                          ? "blocked"
                          : m.accountStatus,
                      }
                    : {
                        active: true,
                        accountStatus: m.accountNumber
                          ? "active"
                          : m.accountStatus,
                      },
                );
                notify(
                  m.active
                    ? `${m.name} marked inactive.`
                    : `${m.name} reactivated.`,
                );
              })
            }
          >
            {busy === "active" && <Loader2 className="size-4 animate-spin" />}{" "}
            {m.active ? "Mark inactive" : "Reactivate"}
          </button>
        </div>
      </aside>
    </div>
  );
}

// ---------- page ----------

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>(SAMPLE);
  const [filter, setFilter] = useState<Filter>("all");
  const [group, setGroup] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Members | SaveCircle";
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // Simulates the async account issuance webhook landing a few seconds later
  useEffect(() => {
    const pending = members.filter((m) => m.accountStatus === "setting_up");
    if (!pending.length) return;
    const t = setTimeout(() => {
      setMembers((ms) =>
        ms.map((m) =>
          m.accountStatus === "setting_up"
            ? {
                ...m,
                idStatus: "verified",
                accountStatus: "active",
                accountNumber:
                  m.accountNumber ??
                  `90${Math.floor(1e7 + Math.random() * 9e7)}`,
              }
            : m,
        ),
      );
    }, 4000);
    return () => clearTimeout(t);
  }, [members]);

  const counts = useMemo(
    () => ({
      total: members.length,
      withAccount: members.filter((m) => m.accountStatus === "active").length,
      awaiting: members.filter(
        (m) => m.idStatus !== "verified" || m.accountStatus === "failed",
      ).length,
      arrears: members.filter((m) => m.arrears > 0).length,
    }),
    [members],
  );

  const visible = members.filter((m) => {
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      m.name.toLowerCase().includes(q) ||
      m.phone.includes(q) ||
      (m.accountNumber ?? "").includes(q);
    const matchesGroup = group === "all" || m.groups.includes(group);
    const matchesFilter =
      filter === "all" ||
      (filter === "arrears" ? m.arrears > 0 : m.idStatus === filter);
    return matchesQuery && matchesGroup && matchesFilter;
  });

  const selected = members.find((m) => m.id === selectedId) ?? null;
  const update = (id: string, patch: Partial<Member>) =>
    setMembers((ms) => ms.map((m) => (m.id === id ? { ...m, ...patch } : m)));

  const FILTERS: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "verified", label: "Verified" },
    { id: "pending", label: "Verifying" },
    { id: "unverified", label: "Not verified" },
    { id: "arrears", label: "In arrears" },
  ];

  return (
    <div className="mx-auto max-w-8xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Members
          </h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">
            Everyone saving with your organisation, across all groups.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAdding(true)}
          className={btnPrimary}
        >
          <Plus className="size-4" /> Add member
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Total members",
            value: counts.total,
            onClick: () => setFilter("all"),
          },
          {
            label: "With account number",
            value: counts.withAccount,
            onClick: () => setFilter("verified"),
          },
          {
            label: "Need verification",
            value: counts.awaiting,
            onClick: () => setFilter("unverified"),
            warn: counts.awaiting > 0,
          },
          {
            label: "In arrears",
            value: counts.arrears,
            onClick: () => setFilter("arrears"),
            warn: counts.arrears > 0,
          },
        ].map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={s.onClick}
            className="rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 p-4 text-left transition hover:border-emerald-600"
          >
            <span className="block text-xs font-semibold text-slate-600 sm:text-sm">
              {s.label}
            </span>
            <span
              className={`mt-1 block text-2xl font-extrabold ${s.warn ? "text-amber-700" : ""}`}
            >
              {s.value}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filter members"
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={filter === f.id}
              className={`min-h-10 rounded-full border px-4 text-sm font-semibold ${filter === f.id ? "border-emerald-700 bg-emerald-50 text-emerald-800 dark:bg-slate-600 dark:text-white" : "border-slate-300 bg-white dark:bg-slate-900 dark:text-white text-slate-700 hover:border-emerald-600"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="flex h-11 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white dark:bg-slate-900 px-3 text-slate-500 focus-within:border-emerald-600">
            <Search className="size-4 shrink-0" aria-hidden="true" />
            <span className="sr-only">Search members</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, phone or account number"
              className="w-full bg-transparent text-sm text-slate-900  dark:text-white placeholder:text-slate-400 focus:outline-none"
            />
          </label>
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            aria-label="Filter by group"
            className={`${inputCls} sm:w-60`}
          >
            <option value="all">All groups</option>
            {GROUPS.map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:bg-slate-900">
          <p className="font-semibold">No members match</p>
          <button
            type="button"
            onClick={() => {
              setFilter("all");
              setGroup("all");
              setQuery("");
            }}
            className={`${btnOutline} mt-4`}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <>
          {/* Phone: cards */}
          <ul className="space-y-3 md:hidden">
            {visible.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(m.id)}
                  className="w-full rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 p-4 text-left hover:border-emerald-600"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p
                        className={`truncate font-bold ${m.active ? "" : "text-slate-400"}`}
                      >
                        {m.name}
                      </p>
                      <p className="truncate text-sm text-slate-500">
                        {m.groups.join(", ")}
                      </p>
                    </div>
                    <IdPill status={m.idStatus} />
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <AccountCell m={m} />
                    {m.arrears > 0 ? (
                      <span className="text-sm font-bold text-amber-700">
                        Owes {naira(m.arrears)}
                      </span>
                    ) : (
                      <span className="text-sm text-slate-500">Up to date</span>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>

          {/* Tablet and up: table */}
          <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 md:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500 dark:bg-slate-800">
                <tr className="dark:text-white">
                  <th className="px-5 py-3 font-semibold">Member</th>
                  <th className="px-4 py-3 font-semibold">Groups</th>
                  <th className="px-4 py-3 font-semibold">Identity</th>
                  <th className="px-4 py-3 font-semibold">Account number</th>
                  <th className="px-4 py-3 text-right font-semibold">
                    Savings
                  </th>
                  <th className="px-5 py-3 text-right font-semibold">
                    Arrears
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((m) => (
                  <tr
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
                    className={`cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-600 ${m.active ? "" : "text-slate-400"}`}
                  >
                    <td className="px-5 py-3.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedId(m.id);
                        }}
                        className="flex items-center gap-3 text-left"
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-extrabold text-slate-600">
                          {initials(m.name)}
                        </span>
                        <span>
                          <span className="block font-semibold text-slate-900 hover:text-emerald-700 dark:text-white">
                            {m.name}
                          </span>
                          <span className="block text-xs text-slate-500 dark:text-white">
                            {m.phone}
                            {!m.active && ", inactive"}
                          </span>
                        </span>
                      </button>
                    </td>
                    <td className="max-w-56 truncate px-4 py-3.5 text-slate-600 dark:text-white">
                      {m.groups.join(", ")}
                    </td>
                    <td className="px-4 py-3.5">
                      <IdPill status={m.idStatus} />
                    </td>
                    <td className="px-4 py-3.5">
                      <AccountCell m={m} />
                    </td>
                    <td className="px-4 py-3.5 text-right font-medium">
                      {naira(m.savings)}
                    </td>
                    <td
                      className={`px-5 py-3.5 text-right font-bold ${m.arrears ? "text-amber-700" : "text-slate-400"}`}
                    >
                      {m.arrears ? naira(m.arrears) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {adding && (
        <AddMemberModal
          existingPhones={members.map((m) => m.phone)}
          onClose={() => setAdding(false)}
          groups={GROUPS}
          onAdd={(added: NewMemberInput[]) => {
            const created: Member[] = added.map((m) => ({
              id: crypto.randomUUID(),
              name: m.name,
              phone: m.phone,
              groups: m.groups,
              idStatus: m.idType ? "pending" : "unverified",
              accountStatus: m.idType ? "setting_up" : "none",
              savings: 0,
              arrears: 0,
              active: true,
            }));
            setMembers((ms) => [...created, ...ms]);
            setAdding(false);
            setFilter("all");
            setToast(
              created.length === 1
                ? `${created[0].name} added. Invite sent to ${created[0].phone}.`
                : `${created.length} members added. Invites sent.`,
            );
          }}
        />
      )}

      {selected && (
        <MemberDrawer
          key={selected.id}
          member={selected}
          onClose={() => setSelectedId(null)}
          onUpdate={(patch) => update(selected.id, patch)}
          notify={setToast}
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
