import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { createOrganisation } from "../services/Api";
import OnboardingLayout from "../components/onboarding/OnboardingLayout";
import OrganisationStep from "../components/onboarding/OrganisationStep";
import { useOrganisation } from "../lib/OrgStore";
import type { OrgDetails } from "../types/types";

// Fast onboarding: name and type only. Verification documents are uploaded
// from the profile page, and payment rails are connected in Settings.
export default function OnboardingFlow() {
  const navigate = useNavigate();
  const { organisation, saveOrganisation } = useOrganisation();
  const [org, setOrg] = useState<OrgDetails>({ name: "", type: null });

  // Already onboarded: nothing to do here
  if (organisation) return <Navigate to="/dashboard" replace />;

  return (
    <OnboardingLayout
      badge="Organisation onboarding"
      title="Let's set up your organisation"
      description="Just a name and type to get you started. You can verify your organisation and connect payments later."
      tagline={["Save together.", "Grow together."]}
    >
      <OrganisationStep
        value={org}
        onChange={setOrg}
        onSubmit={async () => {
          if (!org.type) return;
          const name = org.name.trim();
          const { organisationId } = await createOrganisation({
            name,
            type: org.type,
          });
          saveOrganisation({ id: organisationId, name, type: org.type });
          navigate("/dashboard", { replace: true });
        }}
      />
    </OnboardingLayout>
  );
}
