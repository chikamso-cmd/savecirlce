import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  RotateCcw,
  X,
} from "lucide-react";
// import { Pill } from "../components/widgets/DashboardWidgets";
import {
  CURRENT_USER,
  POLICY,
//   W_STATUS,
  approve,
  cancel,
  getWithdrawal,
  needsChecker,
  reject,
  retry,
  type Withdrawal,
} from "../services/Withdrawalsapi";

type Panel = "reject" | "cancel" | null;

const MAX_ATTEMPTS = 3;
const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-NG", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

const btnPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50";
const btnOutline =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:border-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50";
const btnDanger =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-5 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50";

// Lifecycle from v4 §6.2
const STEPS = ["Submitted", "Approved", "Scheduled", "Sent", "Paid"];
const stepIndex = (w: Withdrawal) =>
  ({
    submitted: 0,
    approved: 1,
    scheduled: 2,
    held: 2,
    failed: 3,
    executing: 3,
    completed: 4,
    cancelled: -1,
    rejected: -1,
  })[w.status];

export default function WithdrawalDetailsPage() {
  const { id } = useParams();
  const [w, setW] = useState<Withdrawal | null>(null);
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState<Panel>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getWithdrawal(id ?? "").then((res) => {
      if (cancelled) return;
      setW(res);
      setLoading(false);
      document.title = "Withdrawal | SaveCircle";
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

  if (loading) {
    return (
      <div
        className="mx-auto max-w-5xl space-y-4"
        aria-busy="true"
        aria-label="Loading"
      >
        <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-36 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (!w) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h1 className="text-xl font-extrabold">Withdrawal not found</h1>
        <Link to="/withdrawals" className={`${btnOutline} mt-5`}>
          Back to withdrawals
        </Link>
      </div>
    );
  }

  const maker = w.approvals.find((a) => a.stage === "maker");
  const checker = w.approvals.find((a) => a.stage === "checker");
  const isMaker = maker?.by === CURRENT_USER.name;
  const canApprove = w.status === "submitted" && !isMaker;
  const canCancel = ["submitted", "approved", "scheduled", "held"].includes(
    w.status,
  );
  const canRetry = w.status === "failed" && w.attempts < MAX_ATTEMPTS;
  const daysToDue = (new Date(w.dueDate).getTime() - Date.now()) / 86_400_000;
  const escalated = w.status === "submitted" && daysToDue <= 2;
  const current = stepIndex(w);
  const reasonOk = reason.trim().length >= 5;

  const act = async (
    key: string,
    fn: () => Promise<Withdrawal>,
    msg: string,
  ) => {
    setBusy(key);
    try {
      setW(await fn());
      setPanel(null);
      setReason("");
      setToast(msg);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-8xl space-y-6">
      <Link
        to="/withdrawals"
        className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
      >
        <ChevronLeft className="size-4" /> Withdrawals & payouts
      </Link>

      {/* Summary */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-500">
              {w.kind === "payout"
                ? "Rotating payout"
                : w.fullExit
                  ? "Full-balance withdrawal"
                  : "Thrift withdrawal"}
            </p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight">
              {naira(w.amount)}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              To{" "}
              <Link to="/members" className="font-semibold text-emerald-700">
                {w.member}
              </Link>
              , {w.group}
            </p>
          </div>
          {/* <Pill tone={W_STATUS[w.status].tone}>{W_STATUS[w.status].label}</Pill> */}
        </div>

        {current >= 0 ? (
          <ol className="mt-6 grid grid-cols-5 gap-1" aria-label="Progress">
            {STEPS.map((s, i) => {
              const done =
                i < current || (i === current && w.status === "completed");
              const now = i === current && w.status !== "completed";
              return (
                <li
                  key={s}
                  className="flex flex-col items-center gap-1.5 text-center"
                >
                  <span
                    className={`h-1.5 w-full rounded-full ${done ? "bg-emerald-600" : now ? (["failed", "held"].includes(w.status) ? "bg-amber-500" : "bg-emerald-300") : "bg-slate-200"}`}
                  />
                  <span
                    className={`text-[11px] sm:text-xs ${done || now ? "font-semibold text-slate-900" : "text-slate-500"}`}
                  >
                    {s}
                  </span>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="mt-4 text-sm text-slate-500">
            This notice was {w.status} and will not be paid.
          </p>
        )}
      </section>

      {/* Status messages */}
      {escalated && (
        <p className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="size-5 shrink-0" /> Due in under 2 days and
          still unapproved, so it's been escalated. It will never be paid
          without approval.
        </p>
      )}
      {w.status === "held" && (
        <p className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="size-5 shrink-0" /> Held because the
          organisation's balance can't cover today's withdrawals. Finance has
          been alerted; it goes out in due-date order once funded. Nothing is
          paid partially.
        </p>
      )}
      {w.status === "failed" && (
        <p className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="size-5 shrink-0" /> {w.failReason}. Attempt{" "}
          {w.attempts} of {MAX_ATTEMPTS}; it retries at 09:00 next morning.
        </p>
      )}

      {/* Actions */}
      {(canApprove ||
        canCancel ||
        canRetry ||
        (w.status === "submitted" && isMaker)) &&
        !panel && (
          <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:flex-wrap sm:items-center">
            {w.status === "submitted" && isMaker && (
              <p className="text-sm text-slate-600 sm:flex-1">
                You raised this, so someone else must give the second approval.
              </p>
            )}
            {canApprove && (
              <>
                <p className="text-sm text-slate-600 sm:flex-1">
                  Second approval needed. You're the checker.
                </p>
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() =>
                    act(
                      "approve",
                      () => approve(w, CURRENT_USER.name),
                      "Approved and scheduled.",
                    )
                  }
                  className={btnPrimary}
                >
                  {busy === "approve" ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}{" "}
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => setPanel("reject")}
                  className={btnOutline}
                >
                  <X className="size-4" /> Reject
                </button>
              </>
            )}
            {canRetry && (
              <button
                type="button"
                disabled={!!busy}
                onClick={() =>
                  act(
                    "retry",
                    () => retry(w, CURRENT_USER.name),
                    "Retry scheduled for tomorrow 09:00.",
                  )
                }
                className={btnOutline}
              >
                {busy === "retry" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <RotateCcw className="size-4" />
                )}{" "}
                Retry now
              </button>
            )}
            {canCancel && (
              <button
                type="button"
                onClick={() => setPanel("cancel")}
                className={`${btnOutline} sm:ml-auto`}
              >
                Cancel notice
              </button>
            )}
          </section>
        )}

      {panel && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="font-bold">
            {panel === "reject"
              ? "Reject this withdrawal"
              : "Cancel this notice"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            The member is told why. The money stays in their balance.
          </p>
          <label className="mt-4 block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Reason (saved to the audit log)
            </span>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-[15px] focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
              placeholder={
                panel === "reject"
                  ? "e.g. Payout account name does not match the member"
                  : "e.g. Member asked to cancel by phone"
              }
            />
          </label>
          <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => {
                setPanel(null);
                setReason("");
              }}
              className={btnOutline}
            >
              Back
            </button>
            <button
              type="button"
              disabled={!reasonOk || !!busy}
              className={btnDanger}
              onClick={() =>
                panel === "reject"
                  ? act(
                      "reject",
                      () => reject(w, CURRENT_USER.name, reason.trim()),
                      "Withdrawal rejected.",
                    )
                  : act(
                      "cancel",
                      () => cancel(w, CURRENT_USER.name, reason.trim()),
                      "Notice cancelled.",
                    )
              }
            >
              {busy && <Loader2 className="size-4 animate-spin" />}{" "}
              {panel === "reject" ? "Reject" : "Cancel notice"}
            </button>
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="font-bold">Details</h2>
          <dl className="mt-2 divide-y divide-slate-100 text-sm">
            {[
              ["Due date", `${fmtDay(w.dueDate)}, 09:00`],
              ["Pay to", `${w.payoutAccount.name}`],
              [
                "Account",
                `${w.payoutAccount.bank} ${w.payoutAccount.accountNumber}`,
              ],
              ["Raised by", `${w.createdBy}, ${fmtDateTime(w.createdAt)}`],
              ["Early-withdrawal fee", w.fee ? naira(w.fee) : "None"],
              ["Transfer attempts", `${w.attempts} of ${MAX_ATTEMPTS}`],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex flex-col gap-0.5 py-3 sm:flex-row sm:justify-between sm:gap-4"
              >
                <dt className="text-slate-500">{k}</dt>
                <dd className="font-semibold sm:text-right">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-xs text-slate-500">
            On the due date the balance, payout account name and organisation
            balance are re-checked before one transfer is sent.
          </p>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="font-bold">Approvals</h2>
          {needsChecker(w) ? (
            <>
              <p className="mt-1 text-sm text-slate-500">
                {w.kind === "payout"
                  ? "Payouts"
                  : `Amounts above ${naira(POLICY.twoPersonAbove)}`}{" "}
                need two different people.
              </p>
              <ul className="mt-4 space-y-3">
                {[
                  ["Maker", maker],
                  ["Checker", checker],
                ].map(([label, a]) => {
                  const ap = a as typeof maker;
                  return (
                    <li
                      key={label as string}
                      className="flex items-center gap-3 rounded-xl bg-slate-50 p-3"
                    >
                      {ap ? (
                        ap.decision === "approved" ? (
                          <CheckCircle2 className="size-5 text-emerald-600" />
                        ) : (
                          <X className="size-5 text-red-600" />
                        )
                      ) : (
                        <span className="size-5 rounded-full border-2 border-dashed border-slate-300" />
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold">
                          {label as string}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {ap
                            ? `${ap.by}, ${fmtDateTime(ap.at)}${ap.reason ? `: ${ap.reason}` : ""}`
                            : "Waiting"}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          ) : (
            <p className="mt-2 flex gap-2 text-sm text-slate-600">
              <CheckCircle2 className="size-4 shrink-0 translate-y-0.5 text-emerald-600" />{" "}
              Within limits, so it was approved automatically after the policy
              checks passed.
            </p>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="font-bold">History</h2>
        <ol className="mt-4 space-y-4 border-l-2 border-slate-100 pl-5">
          {w.history.map((e, i) => (
            <li key={i} className="relative">
              <span
                className="absolute -left-[27px] top-1 size-3 rounded-full border-2 border-white bg-emerald-600"
                aria-hidden="true"
              />
              <p className="text-sm font-semibold">{e.text}</p>
              <p className="text-xs text-slate-500">
                {fmtDateTime(e.at)}
                {e.by && `, by ${e.by}`}
              </p>
            </li>
          ))}
        </ol>
      </section>

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
