import { useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import {
  MANUAL_METHOD,
  listBalances,
  recordManualWithdrawal,
  type ManualMethod,
  type MemberBalance,
  type Withdrawal,
} from "../../services/Withdrawalsapi";

interface Props {
  createdBy: string;
  onClose: () => void;
  onCreated: (w: Withdrawal) => void;
}

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
const inputCls =
  "w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3.5 text-[15px] focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";
const chipCls = (on: boolean) =>
  `min-h-10 rounded-full border px-4 text-sm font-semibold ${on ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-slate-300 text-slate-700 hover:border-emerald-600"}`;

// <input type="date"> wants a local yyyy-mm-dd
const toDateInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export default function ManualWithdrawalModal({
  createdBy,
  onClose,
  onCreated,
}: Props) {
  const [today] = useState(() => toDateInput(new Date()));
  const [balances, setBalances] = useState<MemberBalance[]>([]);
  const [memberName, setMemberName] = useState("");
  const [alreadyPaid, setAlreadyPaid] = useState(true);
  const [method, setMethod] = useState<ManualMethod>("cash");
  const [fullExit, setFullExit] = useState(false);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(today);
  const [accountNumber, setAccountNumber] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listBalances().then(setBalances);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const b = balances.find((x) => x.member === memberName);
  const available = b ? b.savings - b.pending : 0;
  const amountNum = fullExit ? available : Number(amount) || 0;
  const overBalance = amountNum > available;
  // Paid: today or earlier. Scheduled: today or later.
  const dateOk = !!date && (alreadyPaid ? date <= today : date >= today);
  const accountOk = method !== "transfer" || !!accountNumber;
  const canSave =
    !!b && amountNum > 0 && !overBalance && dateOk && accountOk;

  const pickMember = (name: string) => {
    setMemberName(name);
    const m = balances.find((x) => x.member === name);
    setAccountNumber(m?.payoutAccounts[0]?.accountNumber ?? "");
    setAmount("");
    setFullExit(false);
  };

  const pickTiming = (paid: boolean) => {
    setAlreadyPaid(paid);
    // Keep the date valid for the new choice
    if (paid ? date > today : date < today) setDate(today);
  };

  const submit = async () => {
    if (!b || !canSave) return;
    setSaving(true);
    setError(null);
    try {
      // Paid today keeps the current time; any other day is stamped 09:00
      const when =
        alreadyPaid && date === today
          ? new Date()
          : new Date(`${date}T09:00:00`);
      const w = await recordManualWithdrawal({
        balance: b,
        amount: amountNum,
        fullExit,
        method,
        date: when.toISOString(),
        alreadyPaid,
        accountNumber: method === "transfer" ? accountNumber : undefined,
        reference: reference.trim(),
        note: note.trim(),
        by: createdBy,
      });
      onCreated(w);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Couldn't save the withdrawal.",
      );
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
        aria-labelledby="mw-title"
        className="flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5">
          <div>
            <h2 id="mw-title" className="text-lg font-bold">
              Manual withdrawal
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              For money paid to a member outside SaveCircle. Nothing is sent
              from the app; the member's balance and history are updated.
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
              Has the member been paid?
            </legend>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={alreadyPaid}
                onClick={() => pickTiming(true)}
                className={chipCls(alreadyPaid)}
              >
                Already paid
              </button>
              <button
                type="button"
                aria-pressed={!alreadyPaid}
                onClick={() => pickTiming(false)}
                className={chipCls(!alreadyPaid)}
              >
                Schedule for a date
              </button>
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
              <option value="">
                {balances.length ? "Select member" : "Loading…"}
              </option>
              {balances.map((m) => (
                <option key={m.member} value={m.member}>
                  {m.member}, {m.group}
                </option>
              ))}
            </select>
          </label>

          {b && (
            <>
              <div className="grid grid-cols-2 gap-3 rounded-xl bg-slate-50 p-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">Savings</p>
                  <p className="font-bold">{naira(b.savings)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Available</p>
                  <p className="font-bold">{naira(available)}</p>
                </div>
              </div>

              <fieldset>
                <legend className="mb-1.5 text-sm font-medium text-slate-700">
                  Amount
                </legend>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    aria-pressed={!fullExit}
                    onClick={() => setFullExit(false)}
                    className={chipCls(!fullExit)}
                  >
                    Part of balance
                  </button>
                  <button
                    type="button"
                    aria-pressed={fullExit}
                    onClick={() => setFullExit(true)}
                    className={chipCls(fullExit)}
                  >
                    Full balance (leaves group)
                  </button>
                </div>
                {!fullExit ? (
                  <input
                    className={`${inputCls} mt-3`}
                    inputMode="numeric"
                    placeholder="₦0"
                    aria-label="Amount"
                    value={amount ? naira(Number(amount)) : ""}
                    onChange={(e) =>
                      setAmount(e.target.value.replace(/\D/g, "").slice(0, 9))
                    }
                  />
                ) : (
                  <p className="mt-3 rounded-lg border border-slate-200 p-3 text-sm">
                    {naira(available)}. The member's exit from the group is
                    scheduled with it.
                  </p>
                )}
                {overBalance && (
                  <p className="mt-1 text-xs font-semibold text-red-700">
                    More than the member's available balance.
                  </p>
                )}
              </fieldset>

              <fieldset>
                <legend className="mb-1.5 text-sm font-medium text-slate-700">
                  {alreadyPaid ? "Paid by" : "Will be paid by"}
                </legend>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(MANUAL_METHOD) as ManualMethod[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      aria-pressed={method === m}
                      onClick={() => setMethod(m)}
                      className={chipCls(method === m)}
                    >
                      {MANUAL_METHOD[m]}
                    </button>
                  ))}
                </div>
              </fieldset>

              {method === "transfer" && (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Paid to
                  </span>
                  <select
                    className={inputCls}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  >
                    {b.payoutAccounts.map((a) => (
                      <option key={a.accountNumber} value={a.accountNumber}>
                        {a.name}, {a.bank} {a.accountNumber.slice(-4)}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    {alreadyPaid ? "Date paid" : "Pay on"}
                  </span>
                  <input
                    type="date"
                    className={inputCls}
                    value={date}
                    min={alreadyPaid ? undefined : today}
                    max={alreadyPaid ? today : undefined}
                    onChange={(e) => setDate(e.target.value)}
                  />
                  {!dateOk && date && (
                    <span className="mt-1 block text-xs font-semibold text-red-700">
                      {alreadyPaid
                        ? "Can't be in the future."
                        : "Can't be in the past."}
                    </span>
                  )}
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Reference{" "}
                    <span className="font-normal text-slate-500">
                      (optional)
                    </span>
                  </span>
                  <input
                    className={`${inputCls} font-mono`}
                    value={reference}
                    onChange={(e) => setReference(e.target.value.slice(0, 40))}
                    placeholder={
                      method === "cash" ? "Receipt no." : "Bank reference"
                    }
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Note{" "}
                  <span className="font-normal text-slate-500">(optional)</span>
                </span>
                <textarea
                  className={`${inputCls} min-h-20 py-2.5`}
                  value={note}
                  onChange={(e) => setNote(e.target.value.slice(0, 200))}
                  placeholder="e.g. Paid at the group meeting, signed for"
                />
              </label>

              {canSave && (
                <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
                  {alreadyPaid
                    ? `${naira(amountNum)} comes off ${b.member}'s balance now and they get a receipt.`
                    : `${naira(amountNum)} is set aside from ${b.member}'s balance. Mark it as paid from the withdrawal once the money has gone out.`}{" "}
                  It's recorded in the audit log under your name.
                </p>
              )}
            </>
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
            {saving && <Loader2 className="size-4 animate-spin" />}{" "}
            {alreadyPaid ? "Record withdrawal" : "Schedule withdrawal"}
          </button>
        </div>
      </div>
    </div>
  );
}
