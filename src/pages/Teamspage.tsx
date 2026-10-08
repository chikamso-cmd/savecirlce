import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Mail,
  Plus,
  Search,
  X,
} from "lucide-react";
import { Pill } from "../components/widgets/DashboardWidgets";

// Staff roles from v4 §3.2. Members are managed on the Members page, not here.
// Sample data; replace with GET/POST/PATCH /organisation/staff.

type Role =
  | "owner"
  | "admin"
  | "finance_approver"
  | "branch_manager"
  | "officer"
  | "auditor";
type Status = "active" | "invited" | "suspended";

interface Staff {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: Role;
  branch?: string;
  groups: string[];
  status: Status;
  lastActive?: string;
}

const ROLES: Record<Role, { label: string; scope: string; can: string }> = {
  owner: {
    label: "Owner",
    scope: "Organisation",
    can: "Everything, including money settings, gateway keys and deleting the organisation.",
  },
  admin: {
    label: "Admin",
    scope: "Organisation",
    can: "Manage branches, staff, groups and policies. Approve withdrawals above the officer limit.",
  },
  finance_approver: {
    label: "Finance approver",
    scope: "Organisation",
    can: "Second approval (checker) on payouts and withdrawals. View reports. Cannot create groups.",
  },
  branch_manager: {
    label: "Branch manager",
    scope: "Branch",
    can: "Manage groups and officers in their branch. First approval on withdrawals.",
  },
  officer: {
    label: "Officer / treasurer",
    scope: "Assigned groups",
    can: "Add members, log cash, raise reversals and initiate payouts (maker).",
  },
  auditor: {
    label: "Auditor",
    scope: "Organisation",
    can: "Read everything, change nothing.",
  },
};

const ASSIGNABLE: Role[] = [
  "admin",
  "finance_approver",
  "branch_manager",
  "officer",
  "auditor",
];
const BRANCHES = ["[Branch A]", "[Branch B]"];
const GROUPS = [
  "[Market traders ajo]",
  "[Church thrift]",
  "[Teachers circle]",
  "[Artisans weekly]",
];
const CURRENT_USER_ID = "s1"; // TODO: from auth

const SAMPLE: Staff[] = [
  {
    id: "s1",
    name: "[Admin name]",
    phone: "08030000001",
    email: "owner@example.org",
    role: "owner",
    groups: [],
    status: "active",
    lastActive: "Now",
  },
  {
    id: "s2",
    name: "[Finance approver]",
    phone: "08030000002",
    email: "finance@example.org",
    role: "finance_approver",
    groups: [],
    status: "active",
    lastActive: "Today",
  },
  {
    id: "s3",
    name: "[Branch manager A]",
    phone: "08030000003",
    role: "branch_manager",
    branch: "[Branch A]",
    groups: [],
    status: "active",
    lastActive: "Yesterday",
  },
  {
    id: "s4",
    name: "[Officer 1]",
    phone: "08030001111",
    role: "officer",
    branch: "[Branch A]",
    groups: ["[Market traders ajo]", "[Artisans weekly]"],
    status: "active",
    lastActive: "Today",
  },
  {
    id: "s5",
    name: "[Officer 2]",
    phone: "08030002222",
    role: "officer",
    branch: "[Branch A]",
    groups: ["[Church thrift]"],
    status: "active",
    lastActive: "Today",
  },
  {
    id: "s6",
    name: "[Officer 3]",
    phone: "08030003333",
    role: "officer",
    branch: "[Branch B]",
    groups: ["[Teachers circle]"],
    status: "active",
    lastActive: "3 days ago",
  },
  {
    id: "s7",
    name: "[New officer]",
    phone: "08030005555",
    role: "officer",
    branch: "[Branch B]",
    groups: [],
    status: "invited",
  },
  {
    id: "s8",
    name: "[External auditor]",
    phone: "08030006666",
    email: "audit@example.org",
    role: "auditor",
    groups: [],
    status: "suspended",
    lastActive: "Last month",
  },
];

const PHONE_RE = /^(\+?234|0)\d{10}$/;
const needsBranch = (r: Role) => r === "branch_manager" || r === "officer";
const inputCls =
  "w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3.5 text-[15px] focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";
const btnPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50";
const btnOutline =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:border-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50";
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const initials = (name: string) =>
  name
    .replace(/[[\]]/g, "")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

interface FormState {
  name: string;
  phone: string;
  email: string;
  role: Role;
  branch: string;
  groups: string[];
}
const emptyForm: FormState = {
  name: "",
  phone: "",
  email: "",
  role: "officer",
  branch: "",
  groups: [],
};

export default function TeamPage() {
  const [staff, setStaff] = useState<Staff[]>(SAMPLE);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<Role | "all">("all");
  const [editing, setEditing] = useState<Staff | "new" | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [showRoles, setShowRoles] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Team & roles | SaveCircle";
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!editing) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setEditing(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [editing]);

  const activeApprovers = staff.filter(
    (s) => s.role === "finance_approver" && s.status === "active",
  ).length;

  const visible = staff.filter((s) => {
    const q = query.trim().toLowerCase();
    return (
      (roleFilter === "all" || s.role === roleFilter) &&
      (!q ||
        s.name.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        (s.email ?? "").toLowerCase().includes(q))
    );
  });

  const openNew = () => {
    setForm(emptyForm);
    setErrors({});
    setConfirmRemove(false);
    setEditing("new");
  };

  const openEdit = (s: Staff) => {
    setForm({
      name: s.name,
      phone: s.phone,
      email: s.email ?? "",
      role: s.role,
      branch: s.branch ?? "",
      groups: s.groups,
    });
    setErrors({});
    setConfirmRemove(false);
    setEditing(s);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    const phone = form.phone.replace(/\s/g, "");
    if (form.name.trim().length < 3) e.name = "Enter their full name.";
    if (!PHONE_RE.test(phone)) e.phone = "Enter a valid Nigerian phone number.";
    else if (
      staff.some(
        (s) => s.phone === phone && (editing === "new" || s.id !== editing?.id),
      )
    )
      e.phone = "Someone on the team already uses this number.";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email))
      e.email = "Enter a valid email or leave it blank.";
    if (needsBranch(form.role) && !form.branch) e.branch = "Pick their branch.";
    return e;
  };

  // TODO: POST /organisation/staff (invite) or PATCH /organisation/staff/:id
  const save = async () => {
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;
    setBusy("save");
    await wait(700);
    const data = {
      name: form.name.trim(),
      phone: form.phone.replace(/\s/g, ""),
      email: form.email.trim() || undefined,
      role: form.role,
      branch: needsBranch(form.role) ? form.branch : undefined,
      groups: form.role === "officer" ? form.groups : [],
    };
    if (editing === "new") {
      setStaff((list) => [
        ...list,
        { id: crypto.randomUUID(), status: "invited", ...data },
      ]);
      setToast(`Invite sent to ${data.name}.`);
    } else if (editing) {
      setStaff((list) =>
        list.map((s) => (s.id === editing.id ? { ...s, ...data } : s)),
      );
      setToast(`${data.name} updated.`);
    }
    setBusy(null);
    setEditing(null);
  };

  const update = async (
    s: Staff,
    patch: Partial<Staff>,
    message: string,
    key: string,
  ) => {
    setBusy(key);
    await wait(600);
    setStaff((list) =>
      list.map((x) => (x.id === s.id ? { ...x, ...patch } : x)),
    );
    setBusy(null);
    setEditing(null);
    setToast(message);
  };

  const remove = async (s: Staff) => {
    setBusy("remove");
    await wait(600);
    setStaff((list) => list.filter((x) => x.id !== s.id));
    setBusy(null);
    setEditing(null);
    setToast(`${s.name} removed from the team.`);
  };

  const resendInvite = async (s: Staff) => {
    setBusy(`resend-${s.id}`);
    await wait(600);
    setBusy(null);
    setToast(`Invite re-sent to ${s.phone}.`);
  };

  const current = editing && editing !== "new" ? editing : null;
  const isSelf = current?.id === CURRENT_USER_ID;
  const isOwner = current?.role === "owner";
  const lockedRole = isSelf || isOwner;

  return (
    <div className="mx-auto max-w-8xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            Team & roles
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 sm:text-base">
            Invite staff and choose what each person can do. Nobody can approve
            their own request.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <button
            type="button"
            onClick={() => setShowRoles((v) => !v)}
            aria-expanded={showRoles}
            className={btnOutline}
          >
            {showRoles ? "Hide roles" : "What roles can do"}
          </button>
          <button type="button" onClick={openNew} className={btnPrimary}>
            <Plus className="size-4" /> Invite staff
          </button>
        </div>
      </div>

      {activeApprovers === 0 && (
        <p className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="size-5 shrink-0" aria-hidden="true" />
          No active finance approver. Payouts and large withdrawals can't get
          their second approval until you add one.
        </p>
      )}

      {showRoles && (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(Object.keys(ROLES) as Role[]).map((r) => (
            <div
              key={r}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold">{ROLES[r].label}</p>
                <span className="text-xs text-slate-500">{ROLES[r].scope}</span>
              </div>
              <p className="mt-1.5 text-sm text-slate-600">{ROLES[r].can}</p>
            </div>
          ))}
        </section>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex h-11 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-500 focus-within:border-emerald-600">
          <Search className="size-4 shrink-0" aria-hidden="true" />
          <span className="sr-only">Search staff</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name, phone or email"
            className="w-full bg-transparent text-sm text-slate-900 focus:outline-none"
          />
        </label>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value as Role | "all")}
          aria-label="Filter by role"
          className={`${inputCls} sm:w-56`}
        >
          <option value="all">All roles</option>
          {(Object.keys(ROLES) as Role[]).map((r) => (
            <option key={r} value={r}>
              {ROLES[r].label}
            </option>
          ))}
        </select>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-semibold">No staff match</p>
        </div>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
          {visible.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center gap-x-4 gap-y-3 p-4 sm:px-5"
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-full text-xs font-extrabold ${s.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}
              >
                {initials(s.name)}
              </span>
              <div className="min-w-0 flex-1 basis-48">
                <p
                  className={`truncate font-bold ${s.status === "suspended" ? "text-slate-400" : ""}`}
                >
                  {s.name}
                  {s.id === CURRENT_USER_ID && (
                    <span className="font-normal text-slate-500"> (you)</span>
                  )}
                </p>
                <p className="truncate text-sm text-slate-500">
                  {ROLES[s.role].label}
                  {s.branch && `, ${s.branch}`}
                  {s.role === "officer" &&
                    `, ${s.groups.length ? `${s.groups.length} group${s.groups.length > 1 ? "s" : ""}` : "no groups yet"}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {s.status === "invited" && <Pill tone="info">Invited</Pill>}
                {s.status === "suspended" && (
                  <Pill tone="neutral">Suspended</Pill>
                )}
                {s.status === "active" && (
                  <span className="hidden text-xs text-slate-500 sm:inline">
                    Active {s.lastActive?.toLowerCase()}
                  </span>
                )}
                {s.status === "invited" && (
                  <button
                    type="button"
                    onClick={() => resendInvite(s)}
                    disabled={busy === `resend-${s.id}`}
                    className={btnOutline}
                  >
                    {busy === `resend-${s.id}` ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Mail className="size-4" />
                    )}
                    <span className="hidden sm:inline">Resend</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openEdit(s)}
                  className={btnOutline}
                >
                  Manage
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Invite / manage drawer */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-slate-900/40"
          onMouseDown={(e) => e.target === e.currentTarget && setEditing(null)}
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="staff-title"
            className="flex h-full w-full flex-col bg-white shadow-xl sm:max-w-md"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5">
              <div>
                <h2 id="staff-title" className="text-lg font-bold">
                  {editing === "new"
                    ? "Invite staff"
                    : `Manage ${current?.name}`}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {editing === "new"
                    ? "They get a link by SMS or WhatsApp to sign in with their phone and OTP."
                    : current &&
                      `${ROLES[current.role].label}, ${current.status}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label="Close"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-5">
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Full name
                </span>
                <input
                  className={inputCls}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  autoFocus={editing === "new"}
                />
                {errors.name && (
                  <span className="mt-1 block text-sm text-red-600">
                    {errors.name}
                  </span>
                )}
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Phone number
                </span>
                <input
                  className={inputCls}
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  placeholder="0803 123 4567"
                  disabled={editing !== "new"}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                {errors.phone ? (
                  <span className="mt-1 block text-sm text-red-600">
                    {errors.phone}
                  </span>
                ) : (
                  editing !== "new" && (
                    <span className="mt-1 block text-xs text-slate-500">
                      Used to sign in, so it can't be changed here.
                    </span>
                  )
                )}
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Email (optional)
                </span>
                <input
                  className={inputCls}
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {errors.email && (
                  <span className="mt-1 block text-sm text-red-600">
                    {errors.email}
                  </span>
                )}
              </label>

              <fieldset disabled={lockedRole}>
                <legend className="mb-1.5 text-sm font-medium text-slate-700">
                  Role
                </legend>
                {lockedRole ? (
                  <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                    {ROLES[form.role].label}.{" "}
                    {isOwner
                      ? "The owner role can only be handed over by the owner."
                      : "You can't change your own role."}
                  </p>
                ) : (
                  <div className="space-y-2">
                    {ASSIGNABLE.map((r) => (
                      <label
                        key={r}
                        className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${form.role === r ? "border-emerald-700 bg-emerald-50/60" : "border-slate-200 hover:border-emerald-400"}`}
                      >
                        <input
                          type="radio"
                          name="role"
                          checked={form.role === r}
                          onChange={() => setForm({ ...form, role: r })}
                          className="mt-1 size-4 accent-emerald-700"
                        />
                        <span>
                          <span className="block text-sm font-bold">
                            {ROLES[r].label}
                          </span>
                          <span className="block text-xs text-slate-600">
                            {ROLES[r].can}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </fieldset>

              {needsBranch(form.role) && (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Branch
                  </span>
                  <select
                    className={inputCls}
                    value={form.branch}
                    onChange={(e) =>
                      setForm({ ...form, branch: e.target.value })
                    }
                  >
                    <option value="">Select branch</option>
                    {BRANCHES.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                  {errors.branch && (
                    <span className="mt-1 block text-sm text-red-600">
                      {errors.branch}
                    </span>
                  )}
                </label>
              )}

              {form.role === "officer" && (
                <fieldset>
                  <legend className="mb-1.5 text-sm font-medium text-slate-700">
                    Groups they handle
                  </legend>
                  <p className="mb-2 text-xs text-slate-500">
                    Officers only see the groups assigned to them. You can add
                    groups later.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {GROUPS.map((g) => {
                      const on = form.groups.includes(g);
                      return (
                        <button
                          key={g}
                          type="button"
                          aria-pressed={on}
                          onClick={() =>
                            setForm({
                              ...form,
                              groups: on
                                ? form.groups.filter((x) => x !== g)
                                : [...form.groups, g],
                            })
                          }
                          className={`min-h-10 rounded-full border px-4 text-sm font-semibold ${on ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-slate-300 text-slate-700"}`}
                        >
                          {g}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              {/* Access controls for existing staff */}
              {current && !isSelf && !isOwner && (
                <section className="space-y-3 border-t border-slate-200 pt-5">
                  <h3 className="text-sm font-bold">Access</h3>
                  {current.status === "invited" && (
                    <button
                      type="button"
                      onClick={() => remove(current)}
                      disabled={!!busy}
                      className={`${btnOutline} w-full`}
                    >
                      {busy === "remove" && (
                        <Loader2 className="size-4 animate-spin" />
                      )}{" "}
                      Cancel invite
                    </button>
                  )}
                  {current.status === "active" && (
                    <button
                      type="button"
                      disabled={!!busy}
                      className={`${btnOutline} w-full`}
                      onClick={() =>
                        update(
                          current,
                          { status: "suspended" },
                          `${current.name} suspended. They can't sign in.`,
                          "suspend",
                        )
                      }
                    >
                      {busy === "suspend" && (
                        <Loader2 className="size-4 animate-spin" />
                      )}{" "}
                      Suspend access
                    </button>
                  )}
                  {current.status === "suspended" && (
                    <button
                      type="button"
                      disabled={!!busy}
                      className={`${btnOutline} w-full`}
                      onClick={() =>
                        update(
                          current,
                          { status: "active" },
                          `${current.name} reactivated.`,
                          "reactivate",
                        )
                      }
                    >
                      {busy === "reactivate" && (
                        <Loader2 className="size-4 animate-spin" />
                      )}{" "}
                      Reactivate
                    </button>
                  )}
                  {current.status !== "invited" &&
                    (!confirmRemove ? (
                      <button
                        type="button"
                        onClick={() => setConfirmRemove(true)}
                        className="inline-flex min-h-11 w-full items-center justify-center rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        Remove from team
                      </button>
                    ) : (
                      <div className="space-y-2 rounded-xl bg-red-50 p-4">
                        <p className="text-sm text-red-900">
                          Remove {current.name}? Their past actions stay in the
                          audit log.
                          {current.role === "officer" &&
                            " Reassign their groups and bank any cash in hand first."}
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmRemove(false)}
                            className={btnOutline}
                          >
                            Keep
                          </button>
                          <button
                            type="button"
                            onClick={() => remove(current)}
                            disabled={!!busy}
                            className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            {busy === "remove" && (
                              <Loader2 className="size-4 animate-spin" />
                            )}{" "}
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                </section>
              )}
            </div>

            <div className="flex gap-2 border-t border-slate-200 p-4">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className={`${btnOutline} flex-1`}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={save}
                disabled={busy === "save"}
                className={`${btnPrimary} flex-[2]`}
              >
                {busy === "save" && <Loader2 className="size-4 animate-spin" />}{" "}
                {editing === "new" ? "Send invite" : "Save changes"}
              </button>
            </div>
          </aside>
        </div>
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
