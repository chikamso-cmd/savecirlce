import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, X } from "lucide-react";
import {
  POLICY,
  createWithdrawal,
  listBalances,
  policyChecks,
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

export default function NewWithdrawalModal({
  createdBy,
  onClose,
  onCreated,
}: Props) {
  const [balances, setBalances] = useState<MemberBalance[]>([]);
  const [memberName, setMemberName] = useState("");
  const [fullExit, setFullExit] = useState(false);
  const [amount, setAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [saving, setSaving] = useState(false);

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
  const checks = b ? policyChecks(b, amountNum, accountNumber) : [];
  const allOk = !!b && checks.every((c) => c.ok);
  const instant = amountNum > 0 && amountNum <= POLICY.instantLimit;

  const arrival = new Date();
  if (!instant) arrival.setDate(arrival.getDate() + POLICY.noticeDays);

  const pickMember = (name: string) => {
    setMemberName(name);
    const m = balances.find((x) => x.member === name);
    setAccountNumber(m?.payoutAccounts[0]?.accountNumber ?? "");
    setAmount("");
    setFullExit(false);
  };

  const submit = async () => {
    if (!b || !allOk) return;
    setSaving(true);
    const w = await createWithdrawal({
      balance: b,
      amount: amountNum,
      fullExit,
      accountNumber,
      by: createdBy,
    });
    setSaving(false);
    onCreated(w);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="nw-title"
        className="flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-w-lg sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5">
          <div>
            <h2 id="nw-title" className="text-lg font-bold">
              New withdrawal notice
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Raised on the member's behalf from their thrift balance.
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
                {b.pending > 0 && (
                  <p className="col-span-2 text-xs text-slate-500">
                    {naira(b.pending)} already pending in other notices.
                  </p>
                )}
              </div>

              <fieldset>
                <legend className="mb-1.5 text-sm font-medium text-slate-700">
                  Amount
                </legend>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      [false, "Part of balance"],
                      [true, "Full balance (leaves group)"],
                    ] as const
                  ).map(([v, label]) => (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={fullExit === v}
                      onClick={() => setFullExit(v)}
                      className={`min-h-10 rounded-full border px-4 text-sm font-semibold ${fullExit === v ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-slate-300 text-slate-700"}`}
                    >
                      {label}
                    </button>
                  ))}
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
              </fieldset>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-slate-700">
                  Pay to
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
                <span className="mt-1 block text-xs text-slate-500">
                  Only name-checked accounts are listed.
                </span>
              </label>

              {amountNum > 0 && (
                <ul className="space-y-2 rounded-xl border border-slate-200 p-4">
                  {checks.map((c) => (
                    <li key={c.label} className="flex gap-2 text-sm">
                      {c.ok ? (
                        <CheckCircle2 className="size-4 shrink-0 translate-y-0.5 text-emerald-600" />
                      ) : (
                        <AlertCircle className="size-4 shrink-0 translate-y-0.5 text-red-600" />
                      )}
                      <span
                        className={c.ok ? "" : "font-semibold text-red-700"}
                      >
                        {c.label}
                      </span>
                    </li>
                  ))}
                </ul>
              )}

              {amountNum > 0 && allOk && (
                <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-900">
                  {instant
                    ? `Under ${naira(POLICY.instantLimit)}, so it skips the notice period and goes out today.`
                    : `Arrives ${arrival.toLocaleDateString("en-NG", { weekday: "long", day: "numeric", month: "long" })} after the ${POLICY.noticeDays}-day notice.`}
                  {amountNum > POLICY.twoPersonAbove &&
                    " Needs a second approval first."}
                </p>
              )}
            </>
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
            disabled={!allOk || amountNum <= 0 || saving}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving && <Loader2 className="size-4 animate-spin" />} Submit
            notice
          </button>
        </div>
      </div>
    </div>
  );
}
