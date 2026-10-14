import { useEffect, useState } from "react";
import { ArrowLeftRight, Loader2, Wallet, X } from "lucide-react";
import {
  DIRECTORY,
  recordPayment,
  type Channel,
  type Payment,
} from "../../services/Paymentapi";

interface Props {
  recordedBy: string;
  onClose: () => void;
  onCreated: (p: Payment) => void;
}

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
const inputCls =
  "w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3.5 text-[15px] focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";

// <input type="datetime-local"> wants local time without a zone
const toLocalInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const CHANNELS: { id: Channel; label: string; icon: typeof Wallet }[] = [
  { id: "cash", label: "Cash", icon: Wallet },
  { id: "transfer", label: "Bank transfer", icon: ArrowLeftRight },
];

export default function AddPaymentModal({
  recordedBy,
  onClose,
  onCreated,
}: Props) {
  const [memberName, setMemberName] = useState("");
  const [group, setGroup] = useState("");
  const [amount, setAmount] = useState("");
  const [channel, setChannel] = useState<Channel>("cash");
  const [openedAt] = useState(() => new Date());
  const [receivedAt, setReceivedAt] = useState(() => toLocalInput(openedAt));
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const member = DIRECTORY.find((m) => m.name === memberName);
  const amountNum = Number(amount) || 0;
  const when = new Date(receivedAt);
  const future = when.getTime() > openedAt.getTime();
  const canSave =
    !!member && !!group && amountNum > 0 && !isNaN(when.getTime()) && !future;

  const pickMember = (name: string) => {
    setMemberName(name);
    const m = DIRECTORY.find((x) => x.name === name);
    setGroup(m?.groups.length === 1 ? m.groups[0] : "");
  };

  const submit = async () => {
    if (!canSave || !member) return;
    setSaving(true);
    setError(null);
    try {
      const p = await recordPayment({
        member: member.name,
        group,
        amount: amountNum,
        channel,
        receivedAt: when.toISOString(),
        reference: reference.trim(),
        note: note.trim(),
        by: recordedBy,
      });
      onCreated(p);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save the payment.");
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ap-title"
        className="flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5">
          <div>
            <h2 id="ap-title" className="text-lg font-bold">
              Add payment
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Record a payment received outside the app. It's matched to the
              member straight away.
            </p>
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

        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          <fieldset>
            <legend className="mb-1.5 text-sm font-medium text-slate-700">
              How was it paid?
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {CHANNELS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={channel === id}
                  onClick={() => setChannel(id)}
                  className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border text-sm font-semibold ${channel === id ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-slate-300 text-slate-700 hover:border-emerald-600"}`}
                >
                  <Icon className="size-4" aria-hidden="true" /> {label}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Member
            </span>
            <select
              className={inputCls}
              value={memberName}
              onChange={(e) => pickMember(e.target.value)}
              autoFocus
            >
              <option value="">Select member</option>
              {DIRECTORY.map((m) => (
                <option key={m.name} value={m.name}>
                  {m.name}, {m.phone}
                </option>
              ))}
            </select>
          </label>

          {member && (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Group
              </span>
              <select
                className={inputCls}
                value={group}
                onChange={(e) => setGroup(e.target.value)}
              >
                {member.groups.length > 1 && (
                  <option value="">Select group</option>
                )}
                {member.groups.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Amount
              </span>
              <input
                className={inputCls}
                inputMode="numeric"
                placeholder="₦0"
                value={amount ? naira(amountNum) : ""}
                onChange={(e) =>
                  setAmount(e.target.value.replace(/\D/g, "").slice(0, 9))
                }
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Received
              </span>
              <input
                type="datetime-local"
                className={inputCls}
                value={receivedAt}
                max={toLocalInput(openedAt)}
                onChange={(e) => setReceivedAt(e.target.value)}
              />
              {future && (
                <span className="mt-1 block text-xs font-semibold text-red-700">
                  Can't be in the future.
                </span>
              )}
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              {channel === "transfer" ? "Bank reference" : "Receipt number"}{" "}
              <span className="font-normal text-slate-500">(optional)</span>
            </span>
            <input
              className={`${inputCls} font-mono`}
              value={reference}
              onChange={(e) => setReference(e.target.value.slice(0, 40))}
              placeholder={channel === "transfer" ? "e.g. FBN2604…" : "e.g. 0142"}
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Note <span className="font-normal text-slate-500">(optional)</span>
            </span>
            <textarea
              className={`${inputCls} min-h-20 py-2.5`}
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 200))}
              placeholder="e.g. Paid at the Saturday meeting"
            />
          </label>

          {canSave && (
            <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
              {naira(amountNum)} will be credited to {member?.name} in {group},
              and they'll get a receipt by WhatsApp. This is recorded in the
              audit log under your name.
            </p>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800"
            >
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-200 p-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:border-slate-400"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSave || saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Loader2 className="size-4 animate-spin" />} Save
            payment
          </button>
        </div>
      </div>
    </div>
  );
}
