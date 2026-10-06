import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeftRight,
  Check,
  CheckCircle2,
  ChevronLeft,
  Copy,
  Loader2,
  Send,
  ShieldCheck,
  Undo2,
  UserCheck,
  Wallet,
} from "lucide-react";
import { Pill } from "../components/widgets/DashboardWidgets";
import {
  MEMBERS,
  STATUS,
  assignPayment,
  getPayment,
  markForRefund,
  resendReceipt,
  reversePayment,
  type AllocationKind,
  type Payment,
} from "../services/Paymentapi";

type Panel = "assign" | "refund" | "reverse" | null;

const CURRENT_USER = "[Officer 1]"; // TODO: from your auth session
const GROUPS = ["[Market traders thrift]", "[Weekly ajo]", "[Teachers circle]"];
const REVERSAL_WINDOW_DAYS = 7;

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
const fmtAcct = (n: string) => n.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3");
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

const KIND_LABEL: Record<AllocationKind, string> = {
  arrears: "Past-due shortfall",
  current: "Contribution",
  thrift: "Thrift deposit",
  credit: "Member credit",
};

const inputCls =
  "w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3.5 text-[15px] focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";
const btnPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50";
const btnOutline =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:border-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50";
const btnDanger =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-bold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <dt className="text-sm text-slate-500">{label}</dt>
      <dd className="text-sm font-semibold text-slate-900 sm:text-right">
        {children}
      </dd>
    </div>
  );
}

export default function PaymentDetailsPage() {
  const { id } = useParams();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState<Panel>(null);
  const [member, setMember] = useState("");
  const [group, setGroup] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPayment(id ?? "").then((p) => {
      if (cancelled) return;
      setPayment(p);
      setLoading(false);
      document.title = p
        ? `Payment ${naira(p.amount)} | SaveCircle`
        : "Payment not found | SaveCircle";
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
        aria-label="Loading payment"
      >
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h1 className="text-xl font-extrabold">Payment not found</h1>
        <p className="mt-2 text-slate-600">
          The link may be wrong, or the payment belongs to another organisation.
        </p>
        <Link to="/payments" className={`${btnOutline} mt-5`}>
          Back to payments
        </Link>
      </div>
    );
  }

  const p = payment;
  const transfer = p.channel === "transfer";
  const ageDays = (Date.now() - new Date(p.receivedAt).getTime()) / 86_400_000;
  const canReverse =
    (p.status === "matched" || p.status === "credit") &&
    ageDays <= REVERSAL_WINDOW_DAYS;
  const reasonOk = reason.trim().length >= 5;

  const openPanel = (next: Panel) => {
    setPanel(next);
    setReason("");
    setMember("");
    setGroup("");
  };

  const run = async (fn: () => Promise<Payment>, message: string) => {
    setSaving(true);
    try {
      setPayment(await fn());
      setPanel(null);
      setToast(message);
    } finally {
      setSaving(false);
    }
  };

  const copyRef = async () => {
    if (!p.providerRef) return;
    await navigator.clipboard.writeText(p.providerRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resend = async () => {
    setResending(true);
    setPayment(await resendReceipt(p));
    setResending(false);
    setToast(`Receipt re-sent to ${p.member}.`);
  };

  return (
    <div className="mx-auto max-w-8xl space-y-6">
      <Link
        to="/payments"
        className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
      >
        <ChevronLeft className="size-4" /> Payments
      </Link>

      {/* Summary */}
      <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 sm:flex-row sm:items-center sm:p-6">
        <span
          className={`flex size-12 shrink-0 items-center justify-center rounded-full ${transfer ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}
        >
          {transfer ? (
            <ArrowLeftRight className="size-6" />
          ) : (
            <Wallet className="size-6" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p
            className={`text-3xl font-extrabold tracking-tight ${p.status === "reversed" ? "text-slate-400 line-through" : ""}`}
          >
            {naira(p.amount)}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            {transfer ? "Bank transfer" : `Cash logged by ${p.loggedBy}`} from{" "}
            {p.member ?? p.senderName ?? "an unknown sender"},{" "}
            {fmtDateTime(p.receivedAt)}
          </p>
        </div>
        <Pill tone={STATUS[p.status].tone}>{STATUS[p.status].label}</Pill>
      </section>

      {/* Status-specific guidance and actions */}
      {p.status === "unmatched" && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <p className="flex gap-2 text-sm text-amber-900">
            <AlertCircle className="size-5 shrink-0" />
            {p.accountOwner === "organisation"
              ? "This was paid into the organisation account, so it can’t be tied to a member automatically. Assign it to the right member or mark it for refund."
              : "This was paid into a blocked member account. Assign it to the right member or mark it for refund."}
          </p>
          {ageDays > 3 && (
            <p className="mt-2 pl-7 text-sm font-semibold text-amber-900">
              Older than 3 days and escalated to the branch manager.
            </p>
          )}
          {!panel && (
            <div className="mt-4 flex flex-col gap-2 pl-0 sm:flex-row sm:pl-7">
              <button
                type="button"
                onClick={() => openPanel("assign")}
                className={btnPrimary}
              >
                <UserCheck className="size-4" /> Assign to member
              </button>
              <button
                type="button"
                onClick={() => openPanel("refund")}
                className={btnOutline}
              >
                Mark for refund
              </button>
            </div>
          )}
        </section>
      )}

      {p.status === "reversal_pending" && (
        <p className="flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertCircle className="size-5 shrink-0" /> This reversal is waiting
          for a second person to approve it. Transfer-funded reversals always
          need a checker.
        </p>
      )}
      {p.status === "refund_pending" && (
        <p className="flex gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertCircle className="size-5 shrink-0" /> Marked for refund. It goes
          out through the normal withdrawal approval flow.
        </p>
      )}

      {/* Action panels */}
      {panel && (
        <section
          className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
          aria-live="polite"
        >
          <h2 className="font-bold">
            {panel === "assign"
              ? "Assign to a member"
              : panel === "refund"
                ? "Mark for refund"
                : "Reverse this payment"}
          </h2>
          {panel === "reverse" && (
            <p className="mt-1 text-sm text-slate-600">
              The money doesn't move. The allocation is undone so you can record
              it correctly.
              {transfer &&
                " Because this came by transfer, a second person must approve the reversal."}
            </p>
          )}

          <div className="mt-4 space-y-4">
            {panel === "assign" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Member
                  </span>
                  <select
                    className={inputCls}
                    value={member}
                    onChange={(e) => setMember(e.target.value)}
                  >
                    <option value="">Select member</option>
                    {MEMBERS.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Group
                  </span>
                  <select
                    className={inputCls}
                    value={group}
                    onChange={(e) => setGroup(e.target.value)}
                  >
                    <option value="">Select group</option>
                    {GROUPS.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Reason (saved to the audit log)
              </span>
              <textarea
                rows={3}
                className={`${inputCls} py-2.5`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  panel === "assign"
                    ? "e.g. Sender name matches the member, confirmed by phone"
                    : panel === "refund"
                      ? "e.g. Not a member, sent by mistake"
                      : "e.g. Logged against the wrong member"
                }
              />
              {reason && !reasonOk && (
                <span className="mt-1 block text-sm text-red-600">
                  Add a little more detail.
                </span>
              )}
            </label>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setPanel(null)}
              disabled={saving}
              className={btnOutline}
            >
              Cancel
            </button>
            {panel === "assign" && (
              <button
                type="button"
                disabled={!member || !group || !reasonOk || saving}
                className={btnPrimary}
                onClick={() =>
                  run(
                    () =>
                      assignPayment(
                        p,
                        member,
                        group,
                        reason.trim(),
                        CURRENT_USER,
                      ),
                    `Assigned to ${member}. Receipt sent.`,
                  )
                }
              >
                {saving && <Loader2 className="size-4 animate-spin" />} Assign
                and send receipt
              </button>
            )}
            {panel === "refund" && (
              <button
                type="button"
                disabled={!reasonOk || saving}
                className={btnPrimary}
                onClick={() =>
                  run(
                    () => markForRefund(p, reason.trim(), CURRENT_USER),
                    "Marked for refund.",
                  )
                }
              >
                {saving && <Loader2 className="size-4 animate-spin" />} Mark for
                refund
              </button>
            )}
            {panel === "reverse" && (
              <button
                type="button"
                disabled={!reasonOk || saving}
                className={btnDanger}
                onClick={() =>
                  run(
                    () => reversePayment(p, reason.trim(), CURRENT_USER),
                    transfer
                      ? "Reversal sent for approval."
                      : "Payment reversed.",
                  )
                }
              >
                {saving && <Loader2 className="size-4 animate-spin" />}{" "}
                {transfer ? "Request reversal" : "Reverse payment"}
              </button>
            )}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Details */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <h2 className="font-bold">Details</h2>
          <dl className="mt-2 divide-y divide-slate-100">
            <Row label="Member">
              {p.member ? (
                <Link
                  to="/members"
                  className="text-emerald-700 hover:text-emerald-900"
                >
                  {p.member}
                </Link>
              ) : (
                <span className="text-amber-700">Not matched</span>
              )}
            </Row>
            {transfer && (
              <Row label="Sender name (from bank)">{p.senderName ?? "—"}</Row>
            )}
            {transfer && (
              <Row label="Narration">
                {p.narration ? `"${p.narration}"` : "—"}
              </Row>
            )}
            {p.accountNumber && (
              <Row label="Paid into">
                <span className="font-mono">{fmtAcct(p.accountNumber)}</span>
                <span className="block text-xs font-normal text-slate-500">
                  {p.accountOwner === "organisation"
                    ? "Organisation collection account"
                    : "Member account number"}
                </span>
              </Row>
            )}
            <Row label="Channel">{transfer ? "Bank transfer" : "Cash"}</Row>
            {!transfer && <Row label="Logged by">{p.loggedBy}</Row>}
            <Row label="Received">{fmtDateTime(p.receivedAt)}</Row>
            {p.providerRef && (
              <Row label="Provider reference">
                <button
                  type="button"
                  onClick={copyRef}
                  className="inline-flex items-center gap-2 font-mono hover:text-emerald-700"
                  aria-label="Copy provider reference"
                >
                  {p.providerRef}{" "}
                  {copied ? (
                    <Check className="size-4 text-emerald-700" />
                  ) : (
                    <Copy className="size-4 text-slate-400" />
                  )}
                </button>
              </Row>
            )}
            {transfer && (
              <Row label="Verification">
                <span className="inline-flex items-center gap-1.5 text-emerald-700">
                  <ShieldCheck className="size-4" /> Signature checked and
                  re-verified
                </span>
              </Row>
            )}
          </dl>
        </section>

        {/* Allocation + receipt */}
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="font-bold">Where it went</h2>
            {p.allocations.length ? (
              <>
                <ul className="mt-3 divide-y divide-slate-100">
                  {p.allocations.map((a, i) => (
                    <li key={i} className="flex items-center gap-3 py-3">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          {a.group}
                          {a.cycle && `, ${a.cycle}`}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {KIND_LABEL[a.kind]}
                        </span>
                      </span>
                      <span className="text-sm font-extrabold">
                        {naira(a.amount)}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-slate-500">
                  Oldest shortfall first, then current cycles. Anything left
                  becomes member credit for the next cycle.
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                {p.status === "reversed"
                  ? "Allocation was undone when this payment was reversed."
                  : "Not allocated yet."}
              </p>
            )}
          </section>

          {p.member && p.status !== "reversed" && (
            <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="min-w-0 flex-1">
                <h2 className="font-bold">Receipt</h2>
                <p className="text-sm text-slate-500">
                  {p.receiptSentAt
                    ? `Sent ${fmtDateTime(p.receiptSentAt)}`
                    : "Not sent yet"}
                </p>
              </div>
              <button
                type="button"
                onClick={resend}
                disabled={resending}
                className={btnOutline}
              >
                {resending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}{" "}
                Resend
              </button>
            </section>
          )}

          {canReverse && !panel && (
            <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="font-bold">Wrong member or group?</h2>
              <p className="mt-1 text-sm text-slate-500">
                You can reverse within {REVERSAL_WINDOW_DAYS} days of receipt,
                with a reason.
              </p>
              <button
                type="button"
                onClick={() => openPanel("reverse")}
                className={`${btnOutline} mt-3`}
              >
                <Undo2 className="size-4" /> Reverse payment
              </button>
            </section>
          )}
        </div>
      </div>

      {/* Audit trail */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="font-bold">History</h2>
        <ol className="mt-4 space-y-4 border-l-2 border-slate-100 pl-5">
          {p.audit.map((e, i) => (
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
