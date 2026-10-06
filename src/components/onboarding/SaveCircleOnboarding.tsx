import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  FileCheck2,
  Landmark,
  Loader2,
  Plus,
  ShieldCheck,
  Upload,
  Users,
  WalletCards,
} from "lucide-react";

type Step = {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
};

const steps: Step[] = [
  {
    id: 1,
    title: "Organisation",
    description: "Tell us about your organisation",
    icon: Building2,
  },
  {
    id: 2,
    title: "Organisation Type",
    description: "Select your organisation type",
    icon: Landmark,
  },
  {
    id: 3,
    title: "KYB Verification",
    description: "Verify your organisation",
    icon: FileCheck2,
  },
  {
    id: 4,
    title: "Payment Rails",
    description: "Connect your payment provider",
    icon: WalletCards,
  },
  {
    id: 5,
    title: "Collection Account",
    description: "Set up your collection account",
    icon: Landmark,
  },
  {
    id: 6,
    title: "Policies",
    description: "Configure your savings policies",
    icon: ShieldCheck,
  },
  {
    id: 7,
    title: "Invite Staff",
    description: "Add your team members",
    icon: Users,
  },
  {
    id: 8,
    title: "First Group",
    description: "Create your first savings group",
    icon: Plus,
  },
];

const organisationTypes = [
  {
    value: "mfb",
    title: "Microfinance Bank",
    description: "Run savings and contribution products for your customers.",
  },
  {
    value: "bank",
    title: "Bank",
    description: "Manage contribution products at banking scale.",
  },
  {
    value: "cooperative",
    title: "Cooperative",
    description: "Manage members, contributions and payouts.",
  },
  {
    value: "business",
    title: "Business",
    description:
      "Run savings or contribution programmes for your organisation.",
  },
  {
    value: "informal",
    title: "Informal Group",
    description: "Keep a simple digital ledger for your group.",
  },
];

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-green-600 focus:ring-4 focus:ring-green-50";

export default function SaveCircleOnboarding() {
  const [currentStep, setCurrentStep] = useState(1);

  const [formData, setFormData] = useState({
    organisationName: "",
    organisationType: "",
    registrationNumber: "",
    paymentProvider: "",
    noticePeriod: "7",
    instantLimit: "20000",
    withdrawalLimit: "100000",
    reminderSchedule: "2",
    groupName: "",
    groupType: "",
    contributionAmount: "",
    frequency: "weekly",
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepWrapper
            title="Create your organisation"
            description="Start by telling us a little about the organisation you'll be managing on SaveCircle."
          >
            <div className="space-y-5">
              <FormField label="Organisation name">
                <input
                  value={formData.organisationName}
                  onChange={(e) =>
                    updateField("organisationName", e.target.value)
                  }
                  placeholder="e.g. Grace Cooperative Society"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Registration number" optional>
                <input
                  value={formData.registrationNumber}
                  onChange={(e) =>
                    updateField("registrationNumber", e.target.value)
                  }
                  placeholder="Enter your registration number"
                  className={inputClass}
                />
              </FormField>

              <div className="rounded-xl border border-green-100 bg-green-50 p-4">
                <div className="flex gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />

                  <div>
                    <p className="text-sm font-medium text-green-900">
                      Your organisation's information is protected
                    </p>
                    <p className="mt-1 text-xs leading-5 text-green-700">
                      We'll use these details to set up your organisation and
                      begin verification.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </StepWrapper>
        );

      case 2:
        return (
          <StepWrapper
            title="What type of organisation are you?"
            description="This helps SaveCircle configure the right setup for your organisation."
          >
            <div className="space-y-3">
              {organisationTypes.map((type) => {
                const selected = formData.organisationType === type.value;

                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => updateField("organisationType", type.value)}
                    className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                      selected
                        ? "border-green-600 bg-green-50 ring-2 ring-green-100"
                        : "border-gray-200 bg-white hover:border-green-300 hover:bg-green-50/40"
                    }`}
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                        selected
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {type.value === "cooperative" ? (
                        <Users size={20} />
                      ) : (
                        <Building2 size={20} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {type.title}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-gray-500">
                        {type.description}
                      </p>
                    </div>

                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                        selected
                          ? "border-green-600 bg-green-600 text-white"
                          : "border-gray-300"
                      }`}
                    >
                      {selected && <Check size={12} strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          </StepWrapper>
        );

      case 3:
        return (
          <StepWrapper
            title="Verify your organisation"
            description="Upload the required documents so we can verify your organisation."
          >
            <div className="space-y-5">
              <UploadBox
                title="Organisation registration document"
                description="CAC certificate, cooperative certificate or relevant licence"
              />

              <UploadBox
                title="Director information"
                description="Add the required director information"
              />

              <div className="rounded-xl bg-gray-50 p-4">
                <div className="flex items-start gap-3">
                  <Loader2 className="mt-0.5 h-5 w-5 text-gray-500" />

                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Verification can continue in the background
                    </p>
                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      You can leave onboarding and return later. Your progress
                      will be saved.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </StepWrapper>
        );

      case 4:
        return (
          <StepWrapper
            title="Connect your payment rails"
            description="Choose how your organisation will receive and manage payments."
          >
            <div className="space-y-4">
              <ProviderCard
                selected={formData.paymentProvider === "paystack"}
                onClick={() => updateField("paymentProvider", "paystack")}
                title="Paystack"
                description="Connect your organisation's Paystack business account."
              />

              <ProviderCard
                selected={formData.paymentProvider === "flutterwave"}
                onClick={() => updateField("paymentProvider", "flutterwave")}
                title="Flutterwave"
                description="Connect your organisation's Flutterwave business account."
              />

              <ProviderCard
                selected={formData.paymentProvider === "bank"}
                onClick={() => updateField("paymentProvider", "bank")}
                title="Bank integration"
                description="Connect through your bank's supported core banking integration."
              />

              <p className="text-xs leading-5 text-gray-500">
                SaveCircle sends payment instructions and keeps the record.
                Funds remain with your organisation's licensed bank or gateway
                account.
              </p>
            </div>
          </StepWrapper>
        );

      case 5:
        return (
          <StepWrapper
            title="Your collection account"
            description="Your organisation's collection account will appear here once account setup is complete."
          >
            <div className="rounded-2xl border border-green-100 bg-green-50 p-6">
              <p className="text-xs font-medium uppercase tracking-wide text-green-700">
                Collection account
              </p>

              <div className="mt-5 space-y-4">
                <AccountRow label="Bank" value="Pending setup" />
                <AccountRow label="Account name" value="Pending setup" />
                <AccountRow label="Account number" value="Pending setup" />
              </div>

              <div className="mt-6 flex items-center gap-2 text-xs text-green-700">
                <Loader2 size={14} className="animate-spin" />
                <span>Account setup will be completed after verification.</span>
              </div>
            </div>
          </StepWrapper>
        );

      case 6:
        return (
          <StepWrapper
            title="Set your organisation policies"
            description="Configure the rules that will apply to withdrawals and member savings."
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <FormField label="Notice period">
                <div className="relative">
                  <input
                    value={formData.noticePeriod}
                    onChange={(e) =>
                      updateField("noticePeriod", e.target.value)
                    }
                    className={inputClass}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    days
                  </span>
                </div>
              </FormField>

              <FormField label="Instant withdrawal limit">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    ₦
                  </span>
                  <input
                    value={formData.instantLimit}
                    onChange={(e) =>
                      updateField("instantLimit", e.target.value)
                    }
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </FormField>

              <FormField label="Two-person approval above">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    ₦
                  </span>
                  <input
                    value={formData.withdrawalLimit}
                    onChange={(e) =>
                      updateField("withdrawalLimit", e.target.value)
                    }
                    className={`${inputClass} pl-9`}
                  />
                </div>
              </FormField>

              <FormField label="Reminder schedule">
                <select
                  value={formData.reminderSchedule}
                  onChange={(e) =>
                    updateField("reminderSchedule", e.target.value)
                  }
                  className={inputClass}
                >
                  <option value="1">1 day before due date</option>
                  <option value="2">2 days before due date</option>
                  <option value="3">3 days before due date</option>
                </select>
              </FormField>
            </div>

            <div className="mt-5 rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900">
                You can change these later
              </p>
              <p className="mt-1 text-xs leading-5 text-gray-500">
                These settings define the default withdrawal and approval
                behaviour for your organisation.
              </p>
            </div>
          </StepWrapper>
        );

      case 7:
        return (
          <StepWrapper
            title="Invite your team"
            description="Add the people who will help manage your organisation on SaveCircle."
          >
            <div className="space-y-4">
              <StaffInviteRow
                role="Admin"
                description="Manage branches, staff, groups and policies."
              />

              <StaffInviteRow
                role="Finance Approver"
                description="Review withdrawals, payouts and reconciliation."
              />

              <StaffInviteRow
                role="Branch Manager"
                description="Manage groups and officers within a branch."
              />

              <StaffInviteRow
                role="Officer / Treasurer"
                description="Manage members, groups and daily collections."
              />

              <StaffInviteRow
                role="Auditor"
                description="View organisation records without making changes."
              />

              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 transition hover:border-green-400 hover:bg-green-50 hover:text-green-700"
              >
                <Plus size={17} />
                Add another team member
              </button>
            </div>
          </StepWrapper>
        );

      case 8:
        return (
          <StepWrapper
            title="Create your first group"
            description="You're almost ready. Set up your first contribution group."
          >
            <div className="space-y-5">
              <FormField label="Group name">
                <input
                  value={formData.groupName}
                  onChange={(e) => updateField("groupName", e.target.value)}
                  placeholder="e.g. Grace Ajo Group"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Group type">
                <div className="grid gap-3 sm:grid-cols-2">
                  <GroupType
                    selected={formData.groupType === "rotating"}
                    onClick={() => updateField("groupType", "rotating")}
                    title="Rotating"
                    description="Members contribute toward scheduled payouts."
                  />

                  <GroupType
                    selected={formData.groupType === "thrift"}
                    onClick={() => updateField("groupType", "thrift")}
                    title="Thrift"
                    description="Members build savings balances over time."
                  />
                </div>
              </FormField>

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Contribution amount">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                      ₦
                    </span>

                    <input
                      value={formData.contributionAmount}
                      onChange={(e) =>
                        updateField("contributionAmount", e.target.value)
                      }
                      placeholder="20,000"
                      className={`${inputClass} pl-9`}
                    />
                  </div>
                </FormField>

                <FormField label="Frequency">
                  <select
                    value={formData.frequency}
                    onChange={(e) => updateField("frequency", e.target.value)}
                    className={inputClass}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </FormField>
              </div>
            </div>
          </StepWrapper>
        );

      default:
        return null;
    }
  };

  const completedSteps = currentStep - 1;

  return (
    <div className="min-h-screen bg-[#F7FEF9] text-gray-900">
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600 text-white">
              <WalletCards size={19} />
            </div>

            <span className="text-lg font-bold tracking-tight text-gray-950">
              Save<span className="text-green-600">Circle</span>
            </span>
          </div>

          <button
            type="button"
            className="text-sm font-medium text-gray-500 transition hover:text-gray-900"
          >
            Save & exit
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-8 rounded-2xl border border-gray-200 bg-white p-5">
              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-green-600">
                  Organisation setup
                </p>

                <h1 className="mt-2 text-lg font-bold text-gray-950">
                  Set up SaveCircle
                </h1>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Complete your setup to start managing contributions and
                  payouts.
                </p>
              </div>

              <div className="space-y-1">
                {steps.map((step) => {
                  const Icon = step.icon;
                  const completed = step.id < currentStep;
                  const active = step.id === currentStep;

                  return (
                    <button
                      key={step.id}
                      type="button"
                      onClick={() => {
                        if (step.id <= currentStep) {
                          setCurrentStep(step.id);
                        }
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl p-3 text-left transition ${
                        active ? "bg-green-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          completed
                            ? "bg-green-600 text-white"
                            : active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {completed ? (
                          <Check size={15} strokeWidth={3} />
                        ) : (
                          <Icon size={15} />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-xs font-semibold ${
                            active || completed
                              ? "text-gray-900"
                              : "text-gray-500"
                          }`}
                        >
                          {step.title}
                        </p>

                        <p className="mt-0.5 truncate text-[11px] text-gray-400">
                          {step.description}
                        </p>
                      </div>

                      {active && (
                        <ChevronRight size={15} className="text-green-600" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 border-t border-gray-100 pt-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Setup progress</span>
                  <span className="font-semibold text-green-700">
                    {Math.round((completedSteps / steps.length) * 100)}%
                  </span>
                </div>

                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-green-600 transition-all duration-300"
                    style={{
                      width: `${(completedSteps / steps.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <section className="min-w-0">
            {/* Mobile progress */}
            <div className="mb-6 lg:hidden">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900">
                  Step {currentStep} of {steps.length}
                </p>

                <p className="text-xs font-medium text-green-700">
                  {Math.round((completedSteps / steps.length) * 100)}%
                </p>
              </div>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-green-600 transition-all"
                  style={{
                    width: `${(completedSteps / steps.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-100 px-5 py-5 sm:px-8">
                <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                  <span>Setup</span>
                  <ChevronRight size={13} />
                  <span className="text-green-600">
                    {steps[currentStep - 1].title}
                  </span>
                </div>
              </div>

              <div className="px-5 py-7 sm:px-8 sm:py-9 lg:px-12">
                {renderStep()}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
                <button
                  type="button"
                  onClick={previousStep}
                  disabled={currentStep === 1}
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:pointer-events-none disabled:opacity-30"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>

                {currentStep < steps.length ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-100"
                  >
                    Continue
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => alert("Organisation setup completed")}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-100"
                  >
                    Complete setup
                    <Check size={16} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-gray-400">
              Your progress is saved automatically. You can continue setup
              later.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Small reusable UI pieces                                                    */
/* -------------------------------------------------------------------------- */

function StepWrapper({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-gray-950 sm:text-3xl">
          {title}
        </h2>

        <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">
          {description}
        </p>
      </div>

      {children}
    </div>
  );
}

function FormField({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-gray-800">
        {label}

        {optional && (
          <span className="ml-1 font-normal text-gray-400">(optional)</span>
        )}
      </label>

      {children}
    </div>
  );
}

function UploadBox({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-white p-5 text-left transition hover:border-green-400 hover:bg-green-50/30"
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
        <Upload size={20} />
      </div>

      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
      </div>

      <span className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600">
        Upload
      </span>
    </button>
  );
}

function ProviderCard({
  title,
  description,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-4 rounded-2xl border p-5 text-left transition ${
        selected
          ? "border-green-600 bg-green-50 ring-2 ring-green-100"
          : "border-gray-200 hover:border-green-300"
      }`}
    >
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
          selected ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500"
        }`}
      >
        <WalletCards size={19} />
      </div>

      <div className="flex-1">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
      </div>

      {selected && <CheckCircle2 className="text-green-600" size={20} />}
    </button>
  );
}

function AccountRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-green-100 pb-3 last:border-0 last:pb-0">
      <span className="text-xs text-green-700">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}

function StaffInviteRow({
  role,
  description,
}: {
  role: string;
  description: string;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 p-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
        <Users size={18} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">{role}</p>
        <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
      </div>

      <button
        type="button"
        className="shrink-0 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:border-green-300 hover:text-green-700"
      >
        Invite
      </button>
    </div>
  );
}

function GroupType({
  title,
  description,
  selected,
  onClick,
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        selected
          ? "border-green-600 bg-green-50 ring-2 ring-green-100"
          : "border-gray-200 hover:border-green-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900">{title}</p>

        {selected && <CheckCircle2 size={18} className="text-green-600" />}
      </div>

      <p className="mt-1 text-xs leading-5 text-gray-500">{description}</p>
    </button>
  );
}
