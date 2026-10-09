import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { createOrganisation, submitKyb } from "../services/Api";
import KybStep from "../components/onboarding/KybStep";
import OnboardingLayout from "../components/onboarding/OnboardingLayout";
import OrganisationStep from "../components/onboarding/OrganisationStep";
import PaymentRailsStep from "../components/onboarding/PaymentRailsStep";
import VerificationPending from "../components/onboarding/VerificationPending";
import {
  emptyKyb,
  type KybData,
  type KybStatus,
  type OrgDetails,
  type StepStatus,
} from "../types/types"

type Screen = "org" | "kyb" | "pending" | "rails";

interface Props {
  onGoToDashboard?: () => void;
  onCreateGroup?: () => void;
  onInviteTeam?: () => void;
  onComplete?: () => void; // → Setup & Complete (step 4)
}

const DRAFT_KEY = "savecircle:onboarding-draft";

const ASIDE: Record<
  Screen,
  {
    badge: string;
    title: string;
    description: string;
    tagline: [string, string];
  }
> = {
  org: {
    badge: "Organisation onboarding",
    title: "Let's set up your organisation",
    description:
      "Tell us who you are. You can stop after any step and pick up where you left off.",
    tagline: ["Save together.", "Grow together."],
  },
  kyb: {
    badge: "Organisation onboarding",
    title: "Let's verify your organisation",
    description:
      "This keeps your platform secure and compliant. You need a few documents and basic details about your organisation and key people.",
    tagline: ["Trusted records.", "Stronger communities."],
  },
  pending: {
    badge: "Organisation onboarding",
    title: "We're reviewing your documents",
    description:
      "You don't need to wait here. Keep setting up; everything you do now carries over once you're approved.",
    tagline: ["Set up now.", "Go live when approved."],
  },
  rails: {
    badge: "Connect payment rails",
    title: "Secure & reliable payment rails",
    description:
      "Connect your payment provider so members can pay easily and contributions reconcile automatically.",
    tagline: ["More options.", "More flexibility."],
  },
};

export default function OnboardingFlow({
  onGoToDashboard,
  onCreateGroup,
  onInviteTeam,
  onComplete,
}: Props) {
  const [screen, setScreen] = useState<Screen>("org");
  const [org, setOrg] = useState<OrgDetails>({ name: "", type: null });
  const [organisationId, setOrganisationId] = useState<string | null>(null);
  const orgType = org.type;
  const [kyb, setKyb] = useState<KybData>(emptyKyb);
  const [submission, setSubmission] = useState<{
    reference: string;
    submittedAt: string;
  } | null>(null);
  const [kybStatus, setKybStatus] = useState<KybStatus>("in_review");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Restore non-file progress. Files can't live in localStorage; the real version should load the draft from your API.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const draft = JSON.parse(raw);
      if (draft.org) setOrg(draft.org);
      if (draft.organisationId && draft.org?.type) {
        setOrganisationId(draft.organisationId);
        setScreen("kyb");
      }
      if (draft.submission) {
        setSubmission(draft.submission);
        setScreen(draft.screen === "kyb" ? "pending" : draft.screen);
      }
      if (draft.directors?.length)
        setKyb((k) => ({
          ...k,
          directors: draft.directors,
          settlement: draft.settlement ?? k.settlement,
        }));
    } catch {
      /* ignore a corrupt draft */
    }
  }, []);

  const saveLater = () => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          screen,
          org,
          organisationId,
          submission,
          directors: kyb.directors,
          settlement: kyb.settlement,
        }),
      );
      setToast("Progress saved. Pick up where you left off any time.");
    } catch {
      setToast(
        "Couldn't save on this device. Check your browser storage settings.",
      );
    }
  };

  const go = (next: Screen) => {
    setScreen(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const statuses: StepStatus[] =
    screen === "org"
      ? ["current", "upcoming", "upcoming", "upcoming"]
      : screen === "kyb"
      ? ["done", "current", "upcoming", "upcoming"]
      : screen === "pending"
        ? ["done", "review", "upcoming", "upcoming"]
        : [
            "done",
            kybStatus === "approved" ? "done" : "review",
            "current",
            "upcoming",
          ];

  const notReady = (what: string) => () =>
    setToast(`${what} isn't wired up yet.`);

  return (
    <>
      <OnboardingLayout
        {...ASIDE[screen]}
        statuses={statuses}
        onSaveLater={saveLater}
      >
        {screen === "otionStep
            value={org}
            onChange={setOrg}
            onSubmit={async () => {
              // Real version: update the existing organisation instead of skipping
              if (!organisationId && org.type) {
                const res = await createOrganisation({
                  name: org.name.trim(),
                  type: org.type,
                });
                setOrganisationId(res.organisationId);
              }
              go("kyb");
            }}
          />
        )}

        {screen === "kyb" && orgType && (
          <KybStep
            orgType={orgType}
            value={kyb}
            onChange={setKyb}
            onBack={() => go("org")}
            onSubmit={async () => {
              const res = await submitKyb(kyb);
              setSubmission(res);
              setKybStatus("in_review");
              go("pending");
            }}
          />
        )}

        {screen === "pending" && submission && orgType && (
          <VerificationPending
            orgType={orgType}
            kyb={kyb}
            reference={submission.reference}
            submittedAt={submission.submittedAt}
            onEditDocuments={() => go("kyb")}
            onContinue={() => go("rails")}
            onApproved={() => {
              setKybStatus("approved");
              setToast("Verification approved.");
            }}
            onGoToDashboard={onGoToDashboard ?? notReady("Dashboard")}
            onCreateGroup={onCreateGroup ?? notReady("Group creation")}
            onInviteTeam={onInviteTeam ?? notReady("Team invites")}
          />
        )}

        {screen === "rails" && orgType && (
          <PaymentRailsStep
            orgType={orgType}
            kybStatus={kybStatus}
            onBack={() => go(submission ? "pending" : "kyb")}
            onContinue={() => {
              setToast("Payment rails connected.");
              onComplete?.();
            }}
          />
        )}
      </OnboardingLayout>

      {toast && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg sm:inset-x-auto sm:right-6"
        >
          <CheckCircle2
            className="size-5 shrink-0 text-emerald-400"
            aria-hidden="true"
          />
          {toast}
        </div>
      )}
    </>
  );
}
