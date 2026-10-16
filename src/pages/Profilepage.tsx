import { useEffect, useState, type ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { DocUploadCard } from "../components/onboarding/KybStep";
import { fetchKybStatus, submitKyb, type AuthUser } from "../services/Api";
import { useOrganisation, type RailsRecord } from "../lib/OrgStore";
import {
  MONEY_MODE_INFO,
  ORG_TYPES,
  documentsFor,
  formatSize,
  moneyModeFor,
  type KybStatus,
} from "../types/types";

// Profile: the signed-in user, their organisation, and KYB verification.
// Documents moved here from onboarding so sign-up only asks for name and type.

const SESSION_KEY = "savecircle:session";

const inputCls =
  "w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3.5 text-[15px] focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 disabled:bg-slate-50 disabled:text-slate-500";

function loadUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "SC";

function Card({
  title,
  desc,
  action,
  children,
}: {
  title: string;
  desc?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-bold">{title}</h2>
          {desc && <p className="mt-1 text-sm text-slate-500">{desc}</p>}
        </div>
        {action}
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

const STATUS_BADGE: Record<KybStatus | "not_started", { label: string; cls: string }> = {
  not_started: { label: "Not verified", cls: "bg-slate-100 text-slate-700" },
  in_review: { label: "In review", cls: "bg-amber-50 text-amber-800" },
  approved: { label: "Verified", cls: "bg-emerald-50 text-emerald-800" },
  action_needed: { label: "Action needed", cls: "bg-red-50 text-red-700" },
};

function railsSummary(rails: RailsRecord | null) {
  if (!rails) return "Not connected";
  if (rails.mode === "gateway")
    return `${rails.provider === "paystack" ? "Paystack" : "Flutterwave"} connected`;
  if (rails.mode === "bank") return `Integration requested, ref ${rails.ticket}`;
  return "Ledger-only, no provider needed";
}

export default function ProfilePage() {
  const { organisation, updateOrganisation } = useOrganisation();
  const [user, setUser] = useState(() => loadUser());
  const [userDraft, setUserDraft] = useState({
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
  });
  const [files, setFiles] = useState<Record<string, File | undefined>>({});
  const [editingDocs, setEditingDocs] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Profile | SaveCircle";
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!organisation) return <Navigate to="/onboarding" replace />;

  const { kyb } = organisation;
  const slots = documentsFor(organisation.type);
  const missingRequired = slots.some((s) => s.required && !files[s.id]);
  const showUpload = !kyb || editingDocs;
  const status = kyb?.status ?? "not_started";
  const typeTitle =
    ORG_TYPES.find((t) => t.value === organisation.type)?.title ??
    organisation.type;
  const mode = MONEY_MODE_INFO[moneyModeFor(organisation.type)];

  const userDirty =
    userDraft.fullName !== (user?.fullName ?? "") ||
    userDraft.email !== (user?.email ?? "") ||
    userDraft.phone !== (user?.phone ?? "");

  // TODO: PATCH /me
  const saveUser = () => {
    const next: AuthUser = {
      userId: user?.userId ?? "local",
      fullName: userDraft.fullName.trim(),
      email: userDraft.email.trim() || undefined,
      phone: userDraft.phone.trim() || undefined,
    };
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    } catch {
      /* storage blocked; keep the in-memory copy */
    }
    setUser(next);
    setToast("Profile saved.");
  };

  const submitDocuments = async () => {
    setAttempted(true);
    if (missingRequired) {
      document.getElementById("kyb-error-summary")?.focus();
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitKyb({ documents: files });
      const documents = Object.fromEntries(
        Object.entries(files)
          .filter((e): e is [string, File] => !!e[1])
          .map(([id, f]) => [id, { name: f.name, size: f.size }]),
      );
      updateOrganisation({
        kyb: { status: "in_review", ...res, documents },
      });
      setFiles({});
      setAttempted(false);
      setEditingDocs(false);
      setToast("Documents submitted for verification.");
    } finally {
      setSubmitting(false);
    }
  };

  const refreshStatus = async () => {
    if (!kyb) return;
    setChecking(true);
    try {
      const next = await fetchKybStatus(kyb.reference);
      updateOrganisation({ kyb: { ...kyb, status: next } });
      setToast(
        next === "approved"
          ? "Verification approved."
          : "Still in review. We'll let you know by SMS.",
      );
    } finally {
      setChecking(false);
    }
  };

  const name = user?.fullName || "Your name";

  return (
    <div className="mx-auto max-w-8xl space-y-6 pb-24">
      <div className="flex flex-wrap items-center gap-4">
        <span className="flex size-16 items-center justify-center rounded-full bg-emerald-100 text-lg font-extrabold text-emerald-800">
          {initials(name)}
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
            {name}
          </h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">
            Owner, {organisation.name}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <Card
            title="Organisation verification"
            desc="Upload your organisation's documents so we can verify you. Your collection account number is issued once you're approved."
            action={
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${STATUS_BADGE[status].cls}`}
              >
                {status === "approved" ? (
                  <ShieldCheck className="size-3.5" aria-hidden="true" />
                ) : status === "in_review" ? (
                  <Clock className="size-3.5" aria-hidden="true" />
                ) : null}
                {STATUS_BADGE[status].label}
              </span>
            }
          >
            {kyb && !editingDocs && (
              <>
                <div className="rounded-xl bg-slate-50 p-4 text-sm">
                  <p>
                    Reference{" "}
                    <span className="font-mono font-semibold">
                      {kyb.reference}
                    </span>
                    , submitted{" "}
                    {new Date(kyb.submittedAt).toLocaleString("en-NG", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                  {kyb.status === "in_review" && (
                    <p className="mt-1 text-slate-600">
                      Reviews usually take 1 to 2 working days. You can keep
                      using SaveCircle in the meantime.
                    </p>
                  )}
                </div>
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {slots
                    .filter((s) => kyb.documents[s.id])
                    .map((s) => (
                      <li key={s.id} className="flex items-center gap-3 p-3">
                        <FileText
                          className="size-5 shrink-0 text-emerald-700"
                          aria-hidden="true"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold">{s.title}</p>
                          <p className="truncate text-xs text-slate-500">
                            {kyb.documents[s.id]!.name},{" "}
                            {formatSize(kyb.documents[s.id]!.size)}
                          </p>
                        </div>
                        <CheckCircle2
                          className="size-4 shrink-0 text-emerald-600"
                          aria-label="Received"
                        />
                      </li>
                    ))}
                  {Object.keys(kyb.documents).length === 0 && (
                    <li className="p-3 text-sm text-slate-500">
                      No documents uploaded.
                    </li>
                  )}
                </ul>
                <div className="flex flex-wrap gap-2">
                  {kyb.status !== "approved" && (
                    <button
                      type="button"
                      onClick={refreshStatus}
                      disabled={checking}
                      className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:border-emerald-600 disabled:opacity-60"
                    >
                      {checking ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        <RefreshCw className="size-4" />
                      )}
                      Check status
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingDocs(true)}
                    className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
                  >
                    Replace documents
                  </button>
                </div>
              </>
            )}

            {showUpload && (
              <>
                {attempted && missingRequired && (
                  <div
                    id="kyb-error-summary"
                    tabIndex={-1}
                    role="alert"
                    className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
                  >
                    <AlertCircle
                      className="size-5 shrink-0"
                      aria-hidden="true"
                    />
                    Upload every required document.
                  </div>
                )}
                <div className="grid gap-4 sm:grid-cols-2">
                  {slots.map((slot) => (
                    <DocUploadCard
                      key={slot.id}
                      slot={slot}
                      file={files[slot.id]}
                      showError={attempted}
                      onFile={(f) => setFiles((cur) => ({ ...cur, [slot.id]: f }))}
                    />
                  ))}
                </div>
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  {editingDocs && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDocs(false);
                        setFiles({});
                        setAttempted(false);
                      }}
                      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-slate-300 px-4 text-sm font-semibold hover:border-slate-400"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={submitDocuments}
                    disabled={submitting}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
                  >
                    {submitting && <Loader2 className="size-4 animate-spin" />}
                    {submitting ? "Submitting…" : "Submit for verification"}
                  </button>
                </div>
              </>
            )}
          </Card>

          <Card title="Your details" desc="How your team and SaveCircle reach you.">
            <Field label="Full name">
              <input
                className={inputCls}
                value={userDraft.fullName}
                autoComplete="name"
                onChange={(e) =>
                  setUserDraft({ ...userDraft, fullName: e.target.value })
                }
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Email">
                <input
                  type="email"
                  className={inputCls}
                  value={userDraft.email}
                  autoComplete="email"
                  onChange={(e) =>
                    setUserDraft({ ...userDraft, email: e.target.value })
                  }
                />
              </Field>
              <Field label="Phone">
                <input
                  type="tel"
                  className={inputCls}
                  value={userDraft.phone}
                  autoComplete="tel"
                  onChange={(e) =>
                    setUserDraft({ ...userDraft, phone: e.target.value })
                  }
                />
              </Field>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={saveUser}
                disabled={!userDirty || userDraft.fullName.trim().length < 2}
                className="inline-flex min-h-11 items-center rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
              >
                Save details
              </button>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Organisation">
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs font-semibold text-slate-500">Name</dt>
                <dd className="mt-0.5 font-semibold">{organisation.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">Type</dt>
                <dd className="mt-0.5 font-semibold">{typeTitle}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold text-slate-500">
                  Money mode
                </dt>
                <dd className="mt-0.5 font-semibold">{mode.title}</dd>
              </div>
            </dl>
            <Link
              to="/settings"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              Edit in Settings <ArrowRight className="size-4" />
            </Link>
          </Card>

          <Card title="Payment rails">
            <p className="flex items-start gap-2 text-sm">
              {organisation.rails ? (
                <CheckCircle2 className="size-4 shrink-0 translate-y-0.5 text-emerald-600" />
              ) : (
                <AlertCircle className="size-4 shrink-0 translate-y-0.5 text-amber-600" />
              )}
              {railsSummary(organisation.rails)}
            </p>
            <Link
              to="/settings?tab=rails"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              {organisation.rails ? "Manage payment rails" : "Set up payment rails"}{" "}
              <ArrowRight className="size-4" />
            </Link>
          </Card>
        </div>
      </div>

      {toast && (
        <div
          role="status"
          className="fixed inset-x-4 bottom-24 z-[60] mx-auto flex max-w-md items-center gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg sm:inset-x-auto sm:right-6"
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
