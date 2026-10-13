import {  useState, type ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronLeft,
  // Clock,
  // Copy,
  // Info,
  Loader2,
  Plus,
  // Share2,
  ShieldCheck,
  Users,
  UsersRound,
  X,
} from "lucide-react";
import {
  completeSetup,
  // fetchCollectionAccount,
  // type CollectionAccount,
  type SetupInput,
} from "../../services/Api";
import { btnGhost, btnPrimary, inputBase } from "./OnboardingLayout";
// import type { KybStatus, MoneyMode } from "../../types/types";

interface Props {
  // moneyMode: MoneyMode;
  // kybStatus: KybStatus;
  onBack: () => void;
  onComplete: (summary: { invites: number; groupName: string | null }) => void;
}

type Role =
  | "admin"
  | "finance_approver"
  | "branch_manager"
  | "officer"
  | "auditor";
interface Invite {
  id: string;
  name: string;
  phone: string;
  role: Role;
}

const ROLES: Record<Role, string> = {
  admin: "Admin",
  finance_approver: "Finance approver",
  branch_manager: "Branch manager",
  officer: "Officer / treasurer",
  auditor: "Auditor",
};

const PHONE_RE = /^(\+?234|0)\d{10}$/;
const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
const newInvite = (role: Role = "officer"): Invite => ({
  id: crypto.randomUUID(),
  name: "",
  phone: "",
  role,
});

function Section({
  icon,
  title,
  desc,
  children,
  badge,
}: {
  icon: ReactNode;
  title: string;
  desc: string;
  children: ReactNode;
  badge?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white dark:bg-slate-900 p-5 sm:p-6">
      <div className="flex gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold dark:text-white">{title}</h3>
            {badge}
          </div>
          <p className="mt-0.5 text-sm text-slate-500 dark:text-white">{desc}</p>
        </div>
      </div>
      <div className="mt-5 dark:text-white">{children}</div>
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4">
      <span>
        <span className="block text-sm font-semibold dark:text-white">{label}</span>
        <span className="block text-sm text-slate-500 dark:text-white">{hint}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition ${checked ? "bg-emerald-600" : "bg-slate-300"}`}
      >
        <span
          className={`absolute top-0.5 size-6 rounded-full bg-white shadow transition ${checked ? "left-[22px]" : "left-0.5"}`}
        />
      </button>
    </label>
  );
}

export default function SetupStep({
  // moneyMode,
  // kybStatus,
  onBack,
  onComplete,
}: Props) {
  // collection account
  // const [account, setAccount] = useState<CollectionAccount | null>(null);
  // const [copied, setCopied] = useState(false);

  // policies (v4 §6.1 defaults; all placeholders the organisation sets)
  const [noticeDays, setNoticeDays] = useState(7);
  const [instantLimit, setInstantLimit] = useState(20_000);
  const [twoPersonAbove, setTwoPersonAbove] = useState(100_000);
  const [allowWithdrawals, setAllowWithdrawals] = useState(true);
  const [reminderDaysBefore, setReminderDaysBefore] = useState(1);

  // team
  const [invites, setInvites] = useState<Invite[]>([
    newInvite("finance_approver"),
    newInvite("officer"),
  ]);

  // first group
  const [groupOpen, setGroupOpen] = useState(false);
  const [group, setGroup] = useState({
    name: "",
    type: "rotating" as "rotating" | "thrift",
    amount: "",
    frequency: "Weekly",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // const approved = kybStatus === "approved";

  // useEffect(() => {
  //   if (approved && moneyMode !== "ledger")
  //     fetchCollectionAccount().then(setAccount);
  // }, [approved, moneyMode]);

  // const copyAccount = async () => {
  //   if (!account) return;
  //   await navigator.clipboard.writeText(
  //     `${account.accountName}\n${account.bank}\n${account.accountNumber}`,
  //   );
  //   setCopied(true);
  //   setTimeout(() => setCopied(false), 2000);
  // };

  // const shareAccount = async () => {
  //   if (!account) return;
  //   const text = `Pay to ${account.accountName}, ${account.bank}, account ${account.accountNumber}`;
  //   if (navigator.share)
  //     await navigator
  //       .share({ title: "Our collection account", text })
  //       .catch(() => undefined);
  //   else
  //     window.open(
  //       `https://wa.me/?text=${encodeURIComponent(text)}`,
  //       "_blank",
  //       "noopener",
  //     );
  // };

  const updateInvite = (id: string, patch: Partial<Invite>) => {
    setInvites((list) =>
      list.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    );
    setErrors((e) => ({ ...e, team: "" }));
  };

  const filledInvites = invites.filter((i) => i.name.trim() || i.phone.trim());
  const hasApprover = filledInvites.some((i) => i.role === "finance_approver");

  const submit = async () => {
    const e: Record<string, string> = {};
    if (allowWithdrawals && twoPersonAbove <= instantLimit)
      e.policy = "Two-person approval must start above the instant limit.";
    const phones = filledInvites.map((i) => i.phone.replace(/\s/g, ""));
    if (
      filledInvites.some(
        (i) =>
          i.name.trim().length < 3 ||
          !PHONE_RE.test(i.phone.replace(/\s/g, "")),
      )
    )
      e.team = "Each invite needs a name and a valid Nigerian phone number.";
    else if (new Set(phones).size !== phones.length)
      e.team = "The same phone number is invited twice.";
    if (groupOpen) {
      if (group.name.trim().length < 3)
        e.group = "Give your group a name, or skip it for now.";
      else if (Number(group.amount) < 100)
        e.group = "Enter a contribution of at least ₦100.";
    }
    setErrors(e);
    if (Object.keys(e).some((k) => e[k])) {
      document
        .getElementById(`setup-${Object.keys(e).find((k) => e[k])}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const input: SetupInput = {
      policy: {
        noticeDays,
        instantLimit,
        twoPersonAbove,
        allowWithdrawals,
        reminderDaysBefore,
      },
      invites: filledInvites.map((i) => ({
        name: i.name.trim(),
        phone: i.phone.replace(/\s/g, ""),
        role: i.role,
      })),
      firstGroup: groupOpen
        ? {
            name: group.name.trim(),
            type: group.type,
            amount: Number(group.amount),
            frequency: group.frequency,
          }
        : null,
    };
    setSaving(true);
    try {
      await completeSetup(input);
      onComplete({
        invites: input.invites.length,
        groupName: input.firstGroup?.name ?? null,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl dark:text-white">
          Set up your organisation
        </h2>
        <p className="mt-2 max-w-2xl text-base leading-relaxed dark:text-white  text-slate-600">
          Set your rules, invite your team and create your first group. You can
          change all of this later in Settings.
        </p>
      </header>

      {/* Collection account (v4 §4.1 step 5) */}
      {/* {moneyMode === "ledger" ? (
        <p className="flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
          <Info className="size-5 shrink-0 text-slate-500" aria-hidden="true" />
          You're on the free ledger-only plan: members pay cash or transfer as
          usual and officers record it.
        </p>
      ) : !approved ? (
        <p className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <Clock className="size-5 shrink-0" aria-hidden="true" />
          Your verification is still in review. Your collection account number
          is issued as soon as it's approved. Until then you work in ledger-only
          mode.
        </p>
      ) : (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5 sm:p-6">
          <p className="text-xs font-bold tracking-wide text-emerald-800">
            YOUR COLLECTION ACCOUNT IS READY
          </p>
          {account ? (
            <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="font-mono text-3xl font-extrabold tracking-wider">
                  {account.accountNumber.replace(
                    /(\d{4})(\d{3})(\d{3})/,
                    "$1 $2 $3",
                  )}
                </p>
                <p className="mt-1 text-sm text-slate-700">
                  {account.bank}, {account.accountName}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <button
                  type="button"
                  onClick={copyAccount}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
                >
                  {copied ? (
                    <Check className="size-4" />
                  ) : (
                    <Copy className="size-4" />
                  )}{" "}
                  {copied ? "Copied" : "Copy"}
                </button>
                <button
                  type="button"
                  onClick={shareAccount}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-emerald-300 bg-white px-4 text-sm font-semibold text-emerald-800 hover:bg-emerald-50"
                >
                  <Share2 className="size-4" /> Share
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-3 flex items-center gap-2 text-sm text-emerald-900">
              <Loader2 className="size-4 animate-spin" /> Fetching your account
              number…
            </p>
          )}
          <p className="mt-3 text-xs text-slate-600">
            For payments that can't be tied to a member yet. Each verified
            member gets their own number automatically.
          </p>
        </section>
      )} */}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Policies */}
        <Section
          icon={<ShieldCheck className="size-5" />}
          title="Organisation policies"
          desc="Rules for withdrawals and reminders. Groups can override them."
        >
          <div id="setup-policy" className="space-y-5">
            <Toggle
              checked={allowWithdrawals}
              onChange={setAllowWithdrawals}
              label="Allow member withdrawals"
              hint="Members can request withdrawals from their thrift balance."
            />
            {allowWithdrawals && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-white">
                    Withdrawal notice period
                  </span>
                  <select
                    className={inputBase}
                    value={noticeDays}
                    onChange={(e) => setNoticeDays(Number(e.target.value))}
                  >
                    {[0, 3, 7, 14, 30].map((d) => (
                      <option key={d} value={d}>
                        {d === 0 ? "Same day" : `${d} days`}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-white">
                    Instant limit
                  </span>
                  <input
                    className={inputBase}
                    inputMode="numeric"
                    value={naira(instantLimit)}
                    onChange={(e) =>
                      setInstantLimit(Number(e.target.value.replace(/\D/g, "")))
                    }
                  />
                  <span className="mt-1 block text-xs text-slate-500 dark:text-white">
                    Below this, no notice or second approval.
                  </span>
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-white">
                    Two-person approval above
                  </span>
                  <input
                    className={inputBase}
                    inputMode="numeric"
                    value={naira(twoPersonAbove)}
                    onChange={(e) =>
                      setTwoPersonAbove(
                        Number(e.target.value.replace(/\D/g, "")),
                      )
                    }
                  />
                  <span className="mt-1 block text-xs text-slate-500 dark:text-white">
                    A maker and a checker, never the same person.
                  </span>
                </label>
              </div>
            )}
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-white">
                Payment reminders
              </span>
              <select
                className={inputBase}
                value={reminderDaysBefore}
                onChange={(e) => setReminderDaysBefore(Number(e.target.value))}
              >
                <option value={0}>On the due date</option>
                <option value={1}>1 day before</option>
                <option value={2}>2 days before</option>
              </select>
            </label>
            {errors.policy && (
              <p className="text-sm text-red-600">{errors.policy}</p>
            )}
          </div>
        </Section>

        {/* Team */}
        <Section
          icon={<Users className="size-5" />}
          title="Add your team"
          desc="They get an invite by SMS or WhatsApp. You can add more later."
        >
          <div id="setup-team" className="space-y-3">
            {invites.map((inv, i) => (
              <div
                key={inv.id}
                className="space-y-2 rounded-xl border border-slate-200 p-3"
              >
                <div className="flex gap-2">
                  <input
                    aria-label={`Invite ${i + 1} name`}
                    className={inputBase}
                    placeholder="Full name"
                    value={inv.name}
                    onChange={(e) =>
                      updateInvite(inv.id, { name: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setInvites((l) => l.filter((x) => x.id !== inv.id))
                    }
                    aria-label={`Remove invite ${i + 1}`}
                    className="inline-flex min-h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-600"
                  >
                    <X className="size-4" />
                  </button>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <input
                    aria-label={`Invite ${i + 1} phone`}
                    className={inputBase}
                    type="tel"
                    inputMode="tel"
                    placeholder="0803 123 4567"
                    value={inv.phone}
                    onChange={(e) =>
                      updateInvite(inv.id, { phone: e.target.value })
                    }
                  />
                  <select
                    aria-label={`Invite ${i + 1} role`}
                    className={inputBase}
                    value={inv.role}
                    onChange={(e) =>
                      updateInvite(inv.id, { role: e.target.value as Role })
                    }
                  >
                    {(Object.keys(ROLES) as Role[]).map((r) => (
                      <option key={r} value={r}>
                        {ROLES[r]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setInvites((l) => [...l, newInvite()])}
              className={btnGhost}
            >
              <Plus className="size-4" /> Add another person
            </button>
            {errors.team && (
              <p className="text-sm text-red-600">{errors.team}</p>
            )}
            {allowWithdrawals && !hasApprover && (
              <p className="flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
                <AlertCircle className="size-4 shrink-0 translate-y-0.5" />
                Add a finance approver so payouts and large withdrawals can get
                their second approval.
              </p>
            )}
          </div>
        </Section>
      </div>

      {/* First group */}
      <Section
        icon={<UsersRound className="size-5" />}
        title="Create your first group"
        desc="Set up a savings group to start collecting contributions."
        badge={
          <span className="text-xs text-slate-400 dark:text-white">
            Optional
          </span>
        }
      >
        <div id="setup-group">
          {!groupOpen ? (
            <button
              type="button"
              onClick={() => setGroupOpen(true)}
              className="flex w-full flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-slate-300 px-4 py-8 text-emerald-700 hover:border-emerald-600  hover:bg-emerald-50/40 dark:text-emerald-500"
            >
              <span className="inline-flex items-center gap-2 font-semibold">
                <Plus className="size-5" /> Add first group
              </span>
              <span className="text-sm text-slate-500 dark:text-white">
                You can create more groups later.
              </span>
            </button>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:max-w-md">
                {(
                  [
                    ["rotating", "Rotating (ajo)"],
                    ["thrift", "Thrift"],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={group.type === v}
                    onClick={() => setGroup({ ...group, type: v })}
                    className={`min-h-11 rounded-lg border text-sm font-semibold ${group.type === v ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-slate-300 text-slate-700 dark:text-white"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="block sm:col-span-3 lg:col-span-1">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-white">
                    Group name
                  </span>
                  <input
                    className={inputBase}
                    value={group.name}
                    placeholder="Market traders weekly"
                    onChange={(e) => {
                      setGroup({ ...group, name: e.target.value });
                      setErrors((x) => ({ ...x, group: "" }));
                    }}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-white">
                    {group.type === "rotating"
                      ? "Amount per member"
                      : "Suggested deposit"}
                  </span>
                  <input
                    className={inputBase}
                    inputMode="numeric"
                    placeholder="₦5,000"
                    value={group.amount ? naira(Number(group.amount)) : ""}
                    onChange={(e) => {
                      setGroup({
                        ...group,
                        amount: e.target.value.replace(/\D/g, "").slice(0, 9),
                      });
                      setErrors((x) => ({ ...x, group: "" }));
                    }}
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-white">
                    Frequency
                  </span>
                  <select
                    className={inputBase}
                    value={group.frequency}
                    onChange={(e) =>
                      setGroup({ ...group, frequency: e.target.value })
                    }
                  >
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </label>
              </div>
              <p className="text-sm text-slate-500 dark:text-white">
                You'll add members and set the rotation order from the group
                page.
              </p>
              {errors.group && (
                <p className="text-sm text-red-600">{errors.group}</p>
              )}
              <button
                type="button"
                onClick={() => {
                  setGroupOpen(false);
                  setErrors((x) => ({ ...x, group: "" }));
                }}
                className={btnGhost}
              >
                Skip for now
              </button>
            </div>
          )}
        </div>
      </Section>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={onBack} className={btnGhost}>
          <ChevronLeft className="size-4" /> Back
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className={btnPrimary}
        >
          {saving ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          {saving ? "Finishing setup…" : "Complete setup"}
          {!saving && <ArrowRight className="size-4" />}
        </button>
      </div>
    </div>
  );
}
