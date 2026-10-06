import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ChevronLeft,
  Loader2,
  Plus,
  Upload,
  X,
} from "lucide-react";
import {
  BRANCHES,
  OFFICERS,
  naira,
  useGroups,
  type Frequency,
  type GroupType,
  type NewMember,
  type RotationOrder,
} from "../lib/GroupStore";

const input =
  "w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 aria-[invalid=true]:border-red-400";

type Errors = Partial<
  Record<
    "name" | "branch" | "officer" | "amount" | "firstDueDate" | "members",
    string
  >
>;

const PHONE_RE = /^(\+?234|0)\d{10}$/;
const today = () => new Date().toISOString().slice(0, 10);

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-base font-bold text-slate-900">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-1.5 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>
      {children}
      {error && (
        <p id={`${htmlFor}-error`} className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export default function CreateGroupPage() {
  const navigate = useNavigate();
  const { groups, createGroup } = useGroups();
  const fileRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<GroupType>("rotating");
  const [name, setName] = useState("");
  const [branch, setBranch] = useState("");
  const [officer, setOfficer] = useState("");
  const [amount, setAmount] = useState(""); // digits only
  const [frequency, setFrequency] = useState<Frequency>("Weekly");
  const [firstDueDate, setFirstDueDate] = useState("");
  const [rotationOrder, setRotationOrder] = useState<RotationOrder>("join");
  const [requireGuarantor, setRequireGuarantor] = useState(true);
  const [noticePeriod, setNoticePeriod] = useState("Organisation default");
  const [members, setMembers] = useState<NewMember[]>([
    { name: "", phone: "" },
    { name: "", phone: "" },
  ]);
  const [csvMessage, setCsvMessage] = useState<string | null>(null);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.title = "Create group | SaveCircle";
  }, []);

  const clear = (key: keyof Errors) =>
    setErrors((e) => ({ ...e, [key]: undefined }));

  const filledMembers = members.filter((m) => m.name.trim() || m.phone.trim());
  const amountNum = Number(amount) || 0;
  const namedCount = members.filter((m) => m.name.trim()).length;

  const updateMember = (i: number, patch: Partial<NewMember>) => {
    setMembers((ms) =>
      ms.map((m, idx) => (idx === i ? { ...m, ...patch } : m)),
    );
    clear("members");
  };

  const handleCsv = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const rows = String(reader.result)
        .split(/\r?\n/)
        .map((line) => line.split(","))
        .filter((cols) => cols[0]?.trim() && !/^name$/i.test(cols[0].trim()))
        .map((cols) => ({
          name: cols[0].trim(),
          phone: (cols[1] ?? "").trim(),
        }));
      if (!rows.length) {
        setCsvMessage("No members found. Use two columns: name, phone.");
        return;
      }
      setMembers((ms) => [
        ...ms.filter((m) => m.name.trim() || m.phone.trim()),
        ...rows,
      ]);
      setCsvMessage(`Added ${rows.length} members from ${file.name}.`);
      clear("members");
    };
    reader.readAsText(file);
  };

  const validate = (): Errors => {
    const e: Errors = {};
    if (name.trim().length < 3) e.name = "Enter a group name.";
    else if (
      groups.some((g) => g.name.toLowerCase() === name.trim().toLowerCase())
    )
      e.name = "That name is already taken. Try another.";
    if (!branch) e.branch = "Pick a branch.";
    if (!officer) e.officer = "Pick an officer.";
    if (amountNum < 100) e.amount = "Enter at least ₦100.";
    if (!firstDueDate) e.firstDueDate = "Pick the first due date.";
    else if (firstDueDate < today())
      e.firstDueDate = "Pick today or a later date.";
    const min = type === "rotating" ? 2 : 1;
    if (filledMembers.length < min)
      e.members =
        type === "rotating"
          ? "Add at least 2 members for a rotation."
          : "Add at least 1 member.";
    else if (
      filledMembers.some(
        (m) => !m.name.trim() || !PHONE_RE.test(m.phone.replace(/\s/g, "")),
      )
    )
      e.members = "Each member needs a name and a valid Nigerian phone number.";
    return e;
  };

  const submit = async () => {
    const e = validate();
    setErrors(e);
    const firstKey = Object.keys(e)[0];
    if (firstKey) {
      document.getElementById(`f-${firstKey}`)?.focus();
      return;
    }
    setSaving(true);
    try {
      const group = await createGroup({
        type,
        name: name.trim(),
        branch,
        officer,
        amount: amountNum,
        frequency,
        firstDueDate,
        rotationOrder,
        requireGuarantor,
        noticePeriod,
        members: filledMembers.map((m) => ({
          name: m.name.trim(),
          phone: m.phone.replace(/\s/g, ""),
        })),
      });
      const n = group.memberCount;
      navigate("/groups", {
        state: {
          flash: `${group.name} created. Invites sent to ${n} member${n > 1 ? "s" : ""}.`,
        },
      });
    } finally {
      setSaving(false);
    }
  };

  const errorCount = Object.values(errors).filter(Boolean).length;

  return (
    <div className="mx-auto max-w-8xl space-y-6">
      <div>
        <Link
          to="/groups"
          className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
        >
          <ChevronLeft className="size-4" /> Groups
        </Link>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
          Create group
        </h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">
          Members get an invite to verify and receive their own account number.
        </p>
      </div>

      {errorCount > 0 && (
        <div
          role="alert"
          className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
          Fix {errorCount} {errorCount === 1 ? "field" : "fields"} below to
          create the group.
        </div>
      )}

      <Section title="Group details">
        <fieldset>
          <legend className="mb-2 text-sm font-medium text-slate-700">
            Group type
          </legend>
          <div className="grid gap-3 sm:grid-cols-2">
            {(
              [
                [
                  "rotating",
                  "Rotating (ajo)",
                  "Members take turns collecting the pot",
                ],
                ["thrift", "Thrift", "Members save to their own balance"],
              ] as const
            ).map(([value, title, hint]) => (
              <label
                key={value}
                className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${
                  type === value
                    ? "border-[1.5px] border-emerald-700 bg-emerald-50/60"
                    : "border-slate-200 hover:border-emerald-400"
                }`}
              >
                <input
                  type="radio"
                  name="type"
                  value={value}
                  checked={type === value}
                  onChange={() => setType(value)}
                  className="mt-1 size-4 accent-emerald-700"
                />
                <span>
                  <span className="block text-sm font-bold">{title}</span>
                  <span className="block text-sm text-slate-600">{hint}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Field label="Group name" htmlFor="f-name" error={errors.name}>
          <input
            id="f-name"
            className={input}
            value={name}
            placeholder="Market traders weekly"
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "f-name-error" : undefined}
            onChange={(e) => {
              setName(e.target.value);
              clear("name");
            }}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Branch" htmlFor="f-branch" error={errors.branch}>
            <select
              id="f-branch"
              className={input}
              value={branch}
              aria-invalid={!!errors.branch}
              onChange={(e) => {
                setBranch(e.target.value);
                clear("branch");
              }}
            >
              <option value="">Select branch</option>
              {BRANCHES.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </Field>
          <Field label="Officer" htmlFor="f-officer" error={errors.officer}>
            <select
              id="f-officer"
              className={input}
              value={officer}
              aria-invalid={!!errors.officer}
              onChange={(e) => {
                setOfficer(e.target.value);
                clear("officer");
              }}
            >
              <option value="">Select officer</option>
              {OFFICERS.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </Field>
        </div>
      </Section>

      <Section title="Contributions">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label={
              type === "rotating" ? "Amount per member" : "Suggested deposit"
            }
            htmlFor="f-amount"
            error={errors.amount}
          >
            <input
              id="f-amount"
              className={input}
              inputMode="numeric"
              placeholder="₦5,000"
              value={amount ? naira(Number(amount)) : ""}
              aria-invalid={!!errors.amount}
              onChange={(e) => {
                setAmount(e.target.value.replace(/\D/g, "").slice(0, 9));
                clear("amount");
              }}
            />
          </Field>
          <Field label="Frequency" htmlFor="f-frequency">
            <select
              id="f-frequency"
              className={input}
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as Frequency)}
            >
              <option>Daily</option>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </Field>
        </div>
        <Field
          label="First due date"
          htmlFor="f-firstDueDate"
          error={errors.firstDueDate}
        >
          <input
            id="f-firstDueDate"
            type="date"
            min={today()}
            className={input}
            value={firstDueDate}
            aria-invalid={!!errors.firstDueDate}
            onChange={(e) => {
              setFirstDueDate(e.target.value);
              clear("firstDueDate");
            }}
          />
        </Field>
        {amountNum > 0 && namedCount > 0 && (
          <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
            {type === "rotating"
              ? `Each payout: ${naira(amountNum * namedCount)} (${namedCount} members x ${naira(amountNum)}), over ${namedCount} cycles.`
              : `Expected deposits: ${naira(amountNum * namedCount)} ${frequency.toLowerCase()}.`}
          </p>
        )}
      </Section>

      {type === "rotating" ? (
        <Section title="Rotation order">
          <Field label="Who collects first" htmlFor="f-order">
            <select
              id="f-order"
              className={input}
              value={rotationOrder}
              onChange={(e) =>
                setRotationOrder(e.target.value as RotationOrder)
              }
            >
              <option value="join">Order members were added</option>
              <option value="history">By payment history</option>
              <option value="random">Random draw</option>
              <option value="manual">Set manually after invites</option>
            </select>
          </Field>
          <label className="flex cursor-pointer gap-3 text-sm">
            <input
              type="checkbox"
              checked={requireGuarantor}
              onChange={(e) => setRequireGuarantor(e.target.checked)}
              className="mt-0.5 size-4 accent-emerald-700"
            />
            <span>
              <span className="block font-medium">
                Require a guarantor for early payout slots
              </span>
              <span className="block text-slate-500">
                Reduces the risk of a member stopping after they collect.
              </span>
            </span>
          </label>
        </Section>
      ) : (
        <Section title="Withdrawal policy">
          <Field label="Notice period" htmlFor="f-notice">
            <select
              id="f-notice"
              className={input}
              value={noticePeriod}
              onChange={(e) => setNoticePeriod(e.target.value)}
            >
              <option>Organisation default</option>
              <option>Same day</option>
              <option>3 days</option>
              <option>7 days</option>
              <option>14 days</option>
            </select>
          </Field>
          <p className="text-sm text-slate-500">
            Approval limits and lock-in follow your organisation policy.
          </p>
        </Section>
      )}

      <Section title={`Members (${filledMembers.length})`}>
        <ul className="space-y-3">
          {members.map((m, i) => (
            <li
              key={i}
              className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[1.2fr_1fr_auto]"
            >
              <input
                aria-label={`Member ${i + 1} name`}
                className={input}
                placeholder="Full name"
                value={m.name}
                onChange={(e) => updateMember(i, { name: e.target.value })}
              />
              <input
                aria-label={`Member ${i + 1} phone`}
                className={`${input} col-start-1 sm:col-start-auto`}
                inputMode="tel"
                placeholder="0803 123 4567"
                value={m.phone}
                onChange={(e) => updateMember(i, { phone: e.target.value })}
              />
              <button
                type="button"
                aria-label={`Remove member ${i + 1}`}
                disabled={members.length === 1}
                onClick={() =>
                  setMembers((ms) => ms.filter((_, idx) => idx !== i))
                }
                className="col-start-2 row-span-2 row-start-1 inline-flex min-h-11 w-11 items-center justify-center self-start rounded-lg border border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-600 disabled:invisible sm:col-start-auto sm:row-span-1"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
        {errors.members && (
          <p id="f-members" tabIndex={-1} className="text-sm text-red-600">
            {errors.members}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMembers((ms) => [...ms, { name: "", phone: "" }])}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:border-emerald-600 hover:text-emerald-700"
          >
            <Plus className="size-4" /> Add member
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:border-emerald-600 hover:text-emerald-700"
          >
            <Upload className="size-4" /> Upload CSV
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            tabIndex={-1}
            onChange={(e) => {
              handleCsv(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </div>
        <p className="text-sm text-slate-500" aria-live="polite">
          {csvMessage ?? "CSV columns: name, phone."}
        </p>
      </Section>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => navigate("/groups")}
          className="inline-flex min-h-12 items-center justify-center rounded-lg border-[1.5px] border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 hover:border-slate-400"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={saving}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {saving ? "Creating…" : "Create group"}
        </button>
      </div>
    </div>
  );
}
