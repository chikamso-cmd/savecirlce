import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Loader2,
  Search,
  Sparkles,
  Undo2,
  UserCheck,
} from "lucide-react";
import { Pill } from "../components/widgets/DashboardWidgets";
import {
  BANKS,
  DIRECTORY,
  assignPayment,
  getPayment,
  markForRefund,
  resolveAccountName,
  type DirectoryMember,
  type Payment,
} from "../services/Paymentapi";

type Mode = "assign" | "refund";

const CURRENT_USER = "[Officer 1]"; // TODO: from your auth session
const ESCALATE_AFTER_DAYS = 3;

const naira = (n: number) => `₦${Math.round(n).toLocaleString("en-NG")}`;
const fmtAcct = (n: string) => n.replace(/(\d{4})(\d{3})(\d{3})/, "$1 $2 $3");
const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
const words = (s = "") =>
  s
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2);

// Simple name overlap between the bank's sender name and member names
function suggest(p: Payment): DirectoryMember[] {
  const sender = new Set([...words(p.senderName), ...words(p.narration)]);
  return DIRECTORY.map((m) => ({
    m,
    score: words(m.name).filter((w) => sender.has(w)).length,
  }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.m);
}

const inputCls =
  "w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3.5 text-[15px] focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";
const btnPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50";
const btnOutline =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:border-emerald-600 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-50";

export default function UnmatchedDetailsPage() {
  const { id } = useParams();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<Mode>("assign");
  const [saving, setSaving] = useState(false);
  const [reason, setReason] = useState("");

  // assign
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<DirectoryMember | null>(null);
  const [group, setGroup] = useState("");

  // refund
  const [bank, setBank] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState<string | null>(null);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getPayment(id ?? "").then((p) => {
      if (cancelled) return;
      setPayment(p?.fromUnmatched ? p : null);
      setLoading(false);
      document.title = "Unmatched payment | SaveCircle";
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const suggestions = useMemo(
    () => (payment ? suggest(payment) : []),
    [payment],
  );

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return suggestions.length ? suggestions : DIRECTORY.slice(0, 4);
    return DIRECTORY.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.phone.includes(q) ||
        (m.accountNumber ?? "").includes(q),
    );
  }, [search, suggestions]);

  if (loading) {
    return (
      <div
        className="mx-auto max-w-8xl space-y-4"
        aria-busy="true"
        aria-label="Loading"
      >
        <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200" />
        <div className="h-28 animate-pulse rounded-2xl bg-slate-200" />
        <div className="h-72 animate-pulse rounded-2xl bg-slate-200" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
        <h1 className="text-xl font-extrabold">Not in the unmatched queue</h1>
        <p className="mt-2 text-slate-600">
          This payment doesn't exist or was never unmatched.
        </p>
        <Link to="/unmatched" className={`${btnOutline} mt-5`}>
          Back to unmatched
        </Link>
      </div>
    );
  }

  const p = payment;
  const open = p.status === "unmatched";
  const age = (Date.now() - new Date(p.receivedAt).getTime()) / 86_400_000;
  const escalated = open && age > ESCALATE_AFTER_DAYS;
  const reasonOk = reason.trim().length >= 5;

  const pickMember = (m: DirectoryMember) => {
    setSelected(m);
    setGroup(m.groups[0] ?? "");
  };

  const verifyAccount = async () => {
    setResolving(true);
    setResolveError(null);
    try {
      setAccountName(await resolveAccountName(bank, accountNumber));
    } catch (e) {
      setResolveError((e as Error).message);
    } finally {
      setResolving(false);
    }
  };

  const submit = async () => {
    setSaving(true);
    try {
      const next =
        mode === "assign" && selected
          ? await assignPayment(
              p,
              selected.name,
              group,
              reason.trim(),
              CURRENT_USER,
            )
          : await markForRefund(p, reason.trim(), CURRENT_USER, {
              bank,
              accountNumber,
              accountName: accountName ?? "",
            });
      setPayment(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  const canSubmit =
    mode === "assign"
      ? !!selected && !!group && reasonOk
      : !!accountName && reasonOk;

  return (
    <div className="mx-auto max-w-8xl space-y-6">
      <Link
        to="/unmatched"
        className="inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
      >
        <ChevronLeft className="size-4" /> Unmatched payments
      </Link>

      {/* Summary */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-3xl font-extrabold tracking-tight">
              {naira(p.amount)}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Transfer from{" "}
              <span className="font-semibold text-slate-900">
                {p.senderName ?? "an unknown sender"}
              </span>
              , {fmtDateTime(p.receivedAt)}
            </p>
          </div>
          {open ? (
            escalated ? (
              <Pill tone="warning">Escalated to branch manager</Pill>
            ) : (
              <Pill tone="warning">Waiting to be assigned</Pill>
            )
          ) : p.status === "matched" ? (
            <Pill tone="success">Assigned</Pill>
          ) : (
            <Pill tone="info">Refund pending approval</Pill>
          )}
        </div>
        <dl className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <dt className="text-xs font-semibold text-slate-500">Narration</dt>
            <dd className="mt-0.5 text-sm font-semibold">
              {p.narration ? `"${p.narration}"` : "None"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-slate-500">Paid into</dt>
            <dd className="mt-0.5 text-sm font-semibold">
              {p.accountNumber && (
                <span className="font-mono">{fmtAcct(p.accountNumber)}</span>
              )}
              <span className="block text-xs font-normal text-slate-500">
                {p.accountOwner === "organisation"
                  ? "Organisation collection account"
                  : "Blocked member account"}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-slate-500">
              Provider reference
            </dt>
            <dd className="mt-0.5 font-mono text-sm">{p.providerRef ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-slate-500">Verified</dt>
            <dd className="mt-0.5 text-sm font-semibold text-emerald-700">
              Re-checked with provider
            </dd>
          </div>
        </dl>
      </section>

      {/* Resolved state */}
      {!open && (
        <section className="flex gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <CheckCircle2
            className="size-6 shrink-0 text-emerald-700"
            aria-hidden="true"
          />
          <div>
            {p.status === "matched" ? (
              <>
                <p className="font-bold text-emerald-900">
                  Assigned to {p.member}
                </p>
                <p className="mt-1 text-sm text-emerald-900/80">
                  Allocated to {p.allocations.map((a) => a.group).join(", ")}{" "}
                  and a receipt was sent.
                </p>
              </>
            ) : (
              <>
                <p className="font-bold text-emerald-900">Marked for refund</p>
                <p className="mt-1 text-sm text-emerald-900/80">
                  {p.refundTo
                    ? `To ${p.refundTo.accountName}, ${p.refundTo.bank} ${fmtAcct(p.refundTo.accountNumber)}. `
                    : ""}
                  It goes out once a finance approver signs off.
                </p>
              </>
            )}
            <Link
              to={`/payments/${p.id}`}
              className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-emerald-800 hover:text-emerald-950"
            >
              View full payment record
            </Link>
          </div>
        </section>
      )}

      {/* Resolve */}
      {open && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          {escalated && (
            <p className="mb-5 flex gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="size-4 shrink-0 translate-y-0.5" />{" "}
              Waiting {Math.floor(age)} days. The branch manager has been
              alerted.
            </p>
          )}

          <div
            role="tablist"
            aria-label="Resolve payment"
            className="grid grid-cols-2 rounded-lg bg-slate-100 p-1 sm:inline-grid sm:w-96"
          >
            {(
              [
                ["assign", "Assign to member"],
                ["refund", "Refund sender"],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => {
                  setMode(m);
                  setReason("");
                }}
                className={`min-h-10 rounded-md text-sm font-semibold ${mode === m ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === "assign" ? (
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div>
                <label className="flex h-11 items-center gap-2 rounded-lg border border-slate-300 px-3 text-slate-500 focus-within:border-emerald-600">
                  <Search className="size-4 shrink-0" aria-hidden="true" />
                  <span className="sr-only">Find member</span>
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Name, phone or account number"
                    className="w-full bg-transparent text-sm text-slate-900 focus:outline-none"
                  />
                </label>
                {!search && suggestions.length > 0 && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                    <Sparkles className="size-3.5" aria-hidden="true" />{" "}
                    Suggested from the sender name
                  </p>
                )}
                <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {results.map((m) => {
                    const on = selected?.phone === m.phone;
                    return (
                      <li key={m.phone}>
                        <button
                          type="button"
                          onClick={() => pickMember(m)}
                          aria-pressed={on}
                          className={`flex w-full items-center gap-3 px-4 py-3 text-left ${on ? "bg-emerald-50" : "hover:bg-slate-50"}`}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">
                              {m.name}
                            </span>
                            <span className="block truncate text-xs text-slate-500">
                              {m.phone}, {m.groups.join(", ")}
                            </span>
                          </span>
                          {!m.verified && (
                            <Pill tone="neutral">Not verified</Pill>
                          )}
                          {on && (
                            <CheckCircle2
                              className="size-5 shrink-0 text-emerald-700"
                              aria-hidden="true"
                            />
                          )}
                        </button>
                      </li>
                    );
                  })}
                  {results.length === 0 && (
                    <li className="p-4 text-center text-sm text-slate-500">
                      No member found.{" "}
                      <Link
                        to="/members"
                        className="font-semibold text-emerald-700"
                      >
                        Add a member
                      </Link>
                    </li>
                  )}
                </ul>
              </div>

              <div className="space-y-4">
                {selected ? (
                  <>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold text-slate-500">
                        Assigning to
                      </p>
                      <p className="mt-0.5 font-bold">{selected.name}</p>
                      {!selected.verified && (
                        <p className="mt-1 text-xs text-slate-600">
                          Not verified yet, which may be why they paid into the
                          organisation account.
                        </p>
                      )}
                    </div>
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium text-slate-700">
                        Group
                      </span>
                      <select
                        className={inputCls}
                        value={group}
                        onChange={(e) => setGroup(e.target.value)}
                      >
                        {selected.groups.map((g) => (
                          <option key={g}>{g}</option>
                        ))}
                      </select>
                      <span className="mt-1 block text-xs text-slate-500">
                        Oldest shortfall is paid first; anything extra becomes
                        member credit.
                      </span>
                    </label>
                  </>
                ) : (
                  <p className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                    Pick a member on the left.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-6 space-y-4 lg:max-w-xl">
              <p className="text-sm text-slate-600">
                Refund to the account that sent it. The name must match the
                sender before it can go out.
              </p>
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Bank
                  </span>
                  <select
                    className={inputCls}
                    value={bank}
                    onChange={(e) => {
                      setBank(e.target.value);
                      setAccountName(null);
                    }}
                  >
                    <option value="">Select bank</option>
                    {BANKS.map((b) => (
                      <option key={b}>{b}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Account number
                  </span>
                  <input
                    className={inputCls}
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10 digits"
                    value={accountNumber}
                    onChange={(e) => {
                      setAccountNumber(e.target.value.replace(/\D/g, ""));
                      setAccountName(null);
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={verifyAccount}
                  disabled={resolving || !bank || accountNumber.length !== 10}
                  className={btnOutline}
                >
                  {resolving && <Loader2 className="size-4 animate-spin" />}{" "}
                  {accountName ? "Verified" : "Verify"}
                </button>
              </div>
              {resolveError && (
                <p className="text-sm text-red-600" role="alert">
                  {resolveError}
                </p>
              )}
              {accountName && (
                <p className="flex items-center gap-2 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">
                  <CheckCircle2 className="size-4" aria-hidden="true" />{" "}
                  {accountName}
                  <span className="font-normal text-emerald-900/70">
                    (sender: {p.senderName})
                  </span>
                </p>
              )}
            </div>
          )}

          <label className="mt-6 block lg:max-w-xl">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Reason (saved to the audit log)
            </span>
            <textarea
              rows={3}
              className={`${inputCls} py-2.5`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                mode === "assign"
                  ? "e.g. Sender name matches, confirmed by phone"
                  : "e.g. Not a member, sent to us by mistake"
              }
            />
            {reason && !reasonOk && (
              <span className="mt-1 block text-sm text-red-600">
                Add a little more detail.
              </span>
            )}
          </label>

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
            <Link to="/unmatched" className={btnOutline}>
              Cancel
            </Link>
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit || saving}
              className={btnPrimary}
            >
              {saving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : mode === "assign" ? (
                <UserCheck className="size-4" />
              ) : (
                <Undo2 className="size-4" />
              )}
              {mode === "assign"
                ? "Assign and send receipt"
                : "Send refund for approval"}
            </button>
          </div>
        </section>
      )}

      {/* History */}
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
    </div>
  );
}
