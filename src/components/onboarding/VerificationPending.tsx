import { useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  Clock,
  Link2,
  Loader2,
  Mail,
  RefreshCw,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { fetchKybStatus } from "../../services/Api";
import { btnGhost, btnPrimary, btnSecondary } from "./OnboardingLayout";
import {
  documentsFor,
  type KybData,
  type KybStatus,
  type OrgType,
} from "../../types/types";
import { useNavigate } from "react-router-dom";

interface Props {
  orgType: OrgType;
  kyb: KybData;
  reference: string;
  submittedAt: string;
  onEditDocuments: () => void;
  onContinue: () => void; // → Payment Rails
  onApproved: () => void;
  onGoToDashboard: () => void;
  onCreateGroup: () => void;
  onInviteTeam: () => void;
}

type CheckState = "received" | "checking";

function StatusPill({ state }: { state: CheckState }) {
  return state === "received" ? (
    <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-800">
      Received
    </span>
  ) : (
    <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800">
      Checking
    </span>
  );
}

function ActionCard({
  icon: Icon,
  title,
  text,
  onClick,
  recommended,
}: {
  icon: LucideIcon;
  title: string;
  text: string;
  onClick: () => void;
  recommended?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full gap-3.5 rounded-xl bg-white p-4 text-left transition hover:border-emerald-600 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700 ${
        recommended
          ? "border-[1.5px] border-emerald-700"
          : "border border-slate-200"
      }`}
    >
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${recommended ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="flex flex-wrap items-center gap-2 text-[15px] font-bold text-slate-900">
          {title}
          {recommended && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-800">
              Recommended
            </span>
          )}
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-slate-600">
          {text}
        </span>
      </span>
    </button>
  );
}

export default function VerificationPending(props: Props) {
  const { orgType, kyb, reference, submittedAt } = props;
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<KybStatus>("in_review");
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const navigate = useNavigate()

  // TODO: per-check statuses should come from your API; these mirror what was submitted.
  const uploadedDocs = documentsFor(orgType).filter((s) => kyb.documents[s.id]);
  const checks: { title: string; detail: string; state: CheckState }[] = [
    ...uploadedDocs.map((s) => ({
      title: s.title,
      detail: kyb.documents[s.id]!.name,
      state: "received" as const,
    })),
    // ...(orgType !== "informal"
    //   ? [
    //       {
    //         title: "Directors' identity",
    //         detail: `BVN check for ${kyb.directors.length} director${kyb.directors.length > 1 ? "s" : ""}`,
    //         state: "checking" as const,
    //       },
    //       {
    //         title: "Settlement bank account",
    //         detail: "Name match with your registered organisation",
    //         state: "checking" as const,
    //       },
    //     ]
    //   : []),
  ];

  const refresh = async () => {
    setRefreshing(true);
    try {
      const next = await fetchKybStatus(reference);
      setStatus(next);
      setLastChecked(new Date());
      if (next === "approved") props.onApproved();
    } finally {
      setRefreshing(false);
    }
  };

  const submitted = new Date(submittedAt).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight sm:text-3xl">
          Verification in progress
        </h2>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-600">
          We've received your documents. We'll send you an SMS and email when
          the review is done, or if anything needs fixing.
        </p>
      </header>

      <div className="flex flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-5 sm:flex-row sm:items-center">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
          <Clock className="size-6" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1" aria-live="polite">
          <p className="text-base font-bold text-amber-900">
            {status === "action_needed"
              ? "Action needed"
              : "Documents submitted, in review"}
          </p>
          <p className="mt-0.5 text-sm text-amber-900/80">
            Submitted {submitted}. Ref {reference}
            {lastChecked &&
              `. Last checked ${lastChecked.toLocaleTimeString("en-NG", { timeStyle: "short" })}`}
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-amber-300 bg-white px-4 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60"
        >
          {refreshing ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Check status
        </button>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section
          aria-labelledby="checks-heading"
          className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6"
        >
          <h3 id="checks-heading" className="text-lg font-bold">
            What we're checking
          </h3>
          <ul className="mt-3 divide-y divide-slate-100">
            {checks.map((c) => (
              <li key={c.title} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold">{c.title}</p>
                  <p className="truncate text-sm text-slate-500">{c.detail}</p>
                </div>
                <StatusPill state={c.state} />
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={props.onEditDocuments}
            className={`${btnGhost} mt-2`}
          >
            Replace or add a document
          </button>
        </section>

        <section
          aria-labelledby="wait-heading"
          className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 sm:p-6"
        >
          <h3 id="wait-heading" className="text-lg font-bold">
            While you wait
          </h3>
          <div className="mt-4 space-y-3">
            <ActionCard
              icon={Link2}
              recommended
              title="Connect your payment rails"
              text="Your collection account number is issued as soon as verification passes and rails are connected."
              onClick={props.onContinue}
            />
            <ActionCard
              icon={Users}
              title="Create groups in ledger-only mode"
              text="Add members and log cash now. Records carry over when transfers go live."
              onClick={() => navigate("/groups/new")} 
            />
            <ActionCard
              icon={Mail}
              title="Invite your team"
              text="Admins, finance approvers and officers can accept invites before approval."
              onClick={() => navigate("/members")}
            />
          </div>
        </section>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={props.onEditDocuments}
          className={btnGhost}
        >
          <ChevronLeft className="size-4" /> Back
        </button>
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <button
            type="button"
            onClick={props.onGoToDashboard}
            className={btnSecondary}
          >
            Go to dashboard
          </button>
          <button
            type="button"
            onClick={props.onContinue}
            className={btnPrimary}
          >
            Continue to Payment Rails <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
