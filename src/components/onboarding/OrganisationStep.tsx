import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  Check,
  Info,
  // Landmark,
  Loader2,
  Users,
} from "lucide-react";
import { btnPrimary, inputBase } from "./OnboardingLayout";
import {
  MONEY_MODE_INFO,
  ORG_TYPES,
  moneyModeFor,
  type OrgDetails,
  type OrgType,
} from "../../types/types";

interface Props {
  value: OrgDetails;
  onChange: (next: OrgDetails) => void;
  onSubmit: () => Promise<void>;
}

const ICONS: Record<OrgType, typeof Building2> = {
  // mfb: Landmark,
  // bank: Landmark,
  cooperative: Users,
  business: Building2,
  informal: Users,
};

export default function OrganisationStep({ value, onChange, onSubmit }: Props) {
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const errors = {
    name: value.name.trim().length < 3,
    type: !value.type,
  };
  const hasErrors = errors.name || errors.type;
  const mode = value.type ? moneyModeFor(value.type) : null;

  const handleSubmit = async () => {
    setAttempted(true);
    if (hasErrors) {
      document.getElementById("org-error-summary")?.focus();
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-10">
      <header>
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          Create your organisation
        </h2>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-600">
          Name your organisation and tell us what kind it is. We use the type
          to pick the right documents and the right way to move money.
        </p>
      </header>

      {attempted && hasErrors && (
        <div
          id="org-error-summary"
          tabIndex={-1}
          role="alert"
          className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
          <ul className="space-y-1">
            {errors.name && <li>Enter your organisation's name.</li>}
            {errors.type && <li>Pick your organisation type.</li>}
          </ul>
        </div>
      )}

      <section aria-labelledby="org-name-heading">
        <h3 id="org-name-heading" className="text-lg font-bold text-emerald-800">
          Organisation name
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Use your registered name. Members see it on their account numbers.
        </p>
        <label className="mt-5 block max-w-xl">
          <span className="sr-only">Organisation name</span>
          <input
            className={`${inputBase} ${attempted && errors.name ? "border-red-300" : ""}`}
            value={value.name}
            onChange={(e) => onChange({ ...value, name: e.target.value })}
            placeholder="e.g. Grace Cooperative Society"
            autoComplete="organization"
          />
        </label>
      </section>

      <section aria-labelledby="org-type-heading">
        <h3 id="org-type-heading" className="text-lg font-bold text-emerald-800">
          Organisation type
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          This decides which documents we ask for during verification.
        </p>
        <div
          role="radiogroup"
          aria-labelledby="org-type-heading"
          className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
        >
          {ORG_TYPES.map((t) => {
            const selected = value.type === t.value;
            const Icon = ICONS[t.value];
            return (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onChange({ ...value, type: t.value })}
                className={`flex items-start gap-4 rounded-xl border bg-white p-4 text-left transition ${
                  selected
                    ? "border-emerald-700 ring-2 ring-emerald-600/20"
                    : attempted && errors.type
                      ? "border-red-300"
                      : "border-slate-200 hover:border-emerald-600"
                }`}
              >
                <span
                  className={`flex size-10 shrink-0 items-center justify-center rounded-full ${
                    selected
                      ? "bg-emerald-700 text-white"
                      : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[15px] font-semibold text-slate-900">
                    {t.title}
                  </span>
                  <span className="mt-1 block text-sm text-slate-500">
                    {t.description}
                  </span>
                </span>
                <span
                  className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                    selected
                      ? "border-emerald-700 bg-emerald-700 text-white"
                      : "border-slate-300"
                  }`}
                >
                  {selected && <Check className="size-3" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>

        {mode && (
          <div className="mt-5 flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <Info
              className="size-5 shrink-0 text-emerald-700"
              aria-hidden="true"
            />
            <div className="text-sm">
              <p className="font-semibold text-emerald-900">
                Suggested money mode: {MONEY_MODE_INFO[mode].title}
              </p>
              <p className="mt-1 text-emerald-800">
                {MONEY_MODE_INFO[mode].description} SaveCircle never holds your
                funds.
              </p>
            </div>
          </div>
        )}
      </section>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className={btnPrimary}
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitting ? "Creating…" : "Continue"}
          {!submitting && <ArrowRight className="size-4" />}
        </button>
      </div>
    </div>
  );
}
