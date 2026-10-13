import { useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Eye,
  FileText,
  Loader2,
  // Plus,
  // Trash2,
  UploadCloud,
  X,
} from "lucide-react";
// import { resolveAccountName } from "../../services/Api";
import { btnGhost, btnPrimary } from "./OnboardingLayout";
import {
  ACCEPTED_TYPES,
  // BANKS,
  MAX_FILE_BYTES,
  documentsFor,
  type DocSlot,
  type KybData,
  type OrgType,
} from "../../types/types";

interface Props {
  orgType: OrgType;
  value: KybData;
  onChange: (next: KybData) => void;
  onBack: () => void;
  onSubmit: () => Promise<void>;
}

const formatSize = (b: number) =>
  b < 1024 * 1024
    ? `${Math.round(b / 1024)} KB`
    : `${(b / 1024 / 1024).toFixed(1)} MB`;

function DocUploadCard({
  slot,
  file,
  onFile,
  showError,
}: {
  slot: DocSlot;
  file?: File;
  onFile: (f?: File) => void;
  showError: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePick = (f?: File) => {
    if (!f) return;
    if (!ACCEPTED_TYPES.includes(f.type))
      return setError("Use a PDF, JPG or PNG file.");
    if (f.size > MAX_FILE_BYTES)
      return setError(
        "This file is over 5MB. Compress it or upload a smaller scan.",
      );
    setError(null);
    onFile(f);
  };

  const preview = () => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };

  const missing = showError && slot.required && !file;

  return (
    <div
      className={`flex flex-col rounded-xl border bg-white p-5 ${missing ? "border-red-300" : "border-slate-200"}`}
    >
      <div className="flex size-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
        <FileText className="size-5" aria-hidden="true" />
      </div>
      <h4 className="mt-3 text-[15px] font-semibold text-slate-900">
        {slot.title}
        {!slot.required && (
          <span className="font-normal text-slate-500"> (optional)</span>
        )}
      </h4>
      <p className="mt-1 text-sm text-slate-500">{slot.hint}</p>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="sr-only"
        aria-label={`Upload ${slot.title}`}
        onChange={(e) => {
          handlePick(e.target.files?.[0]);
          e.target.value = "";
        }}
      />

      <div className="mt-auto pt-4">
        {file ? (
          <div className="flex items-center gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <CheckCircle2
              className="size-5 shrink-0 text-emerald-700"
              aria-hidden="true"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-900">
                {file.name}
              </p>
              <p className="text-xs text-slate-600">{formatSize(file.size)}</p>
            </div>
            <button
              type="button"
              onClick={preview}
              aria-label={`Preview ${slot.title}`}
              className="rounded-md p-2 text-slate-600 hover:bg-white hover:text-emerald-700"
            >
              <Eye className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => onFile(undefined)}
              aria-label={`Remove ${slot.title}`}
              className="rounded-md p-2 text-slate-600 hover:bg-white hover:text-red-600"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handlePick(e.dataTransfer.files?.[0]);
            }}
            className="flex min-h-[72px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 px-3 py-3 text-emerald-700 transition hover:border-emerald-600 hover:bg-emerald-50/50"
          >
            <span className="inline-flex items-center gap-2 text-sm font-semibold">
              <UploadCloud className="size-4" aria-hidden="true" /> Upload file
            </span>
            <span className="mt-1 text-xs text-slate-500">
              PDF, JPG or PNG (max 5MB)
            </span>
          </button>
        )}
        {(error || missing) && (
          <p className="mt-2 text-xs font-medium text-red-600" role="alert">
            {error ?? "This document is required."}
          </p>
        )}
      </div>
    </div>
  );
}

export default function KybStep({
  orgType,
  value,
  onChange,
  onBack,
  onSubmit,
}: Props) {
  const slots = documentsFor(orgType);
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);

  // const { directors, settlement } = value;
  const needsCompanyChecks = orgType !== "informal";

  // const setDirector = (
  //   id: string,
  //   patch: Partial<{ fullName: string; bvn: string }>,
  // ) =>
  //   onChange({
  //     ...value,
  //     directors: directors.map((d) => (d.id === id ? { ...d, ...patch } : d)),
  //   });

  // const setSettlement = (patch: Partial<typeof settlement>) =>
  //   onChange({
  //     ...value,
  //     settlement: { ...settlement, accountName: null, ...patch },
  //   });

  // const verifyAccount = async () => {
  //   setResolving(true);
  //   setResolveError(null);
  //   try {
  //     const name = await resolveAccountName(
  //       // settlement.bankCode,
  //       // settlement.accountNumber,
  //     );
  //     // onChange({ ...value, settlement: { ...settlement, accountName: name } });
  //   } catch (e) {
  //     setResolveError((e as Error).message);
  //   } finally {
  //     setResolving(false);
  //   }
  // };

  const errors = {
    docs: slots.some((s) => s.required && !value.documents[s.id]),
    needsCompanyChecks,
  };
  const hasErrors = errors.docs;

  const handleSubmit = async () => {
    setAttempted(true);
    if (hasErrors) {
      document.getElementById("kyb-error-summary")?.focus();
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
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl dark:text-white text-slate-800">
          Know your organisation (KYB)
        </h2>
        <p className="mt-2 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-white">
          Upload your documents and tell us about your directors and settlement
          account. This helps us verify your organisation and keep the platform
          secure.
        </p>
      </header>

      {attempted && (
        <div
          id="kyb-error-summary"
          tabIndex={-1}
          role="alert"
          className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
          <ul className="space-y-1">
            {errors.docs && <li>Upload every required document.</li>}
            {/* {errors.directors && (
              <li>Add each director's full name and 11-digit BVN.</li>
            )}
            {errors.settlement && <li>Verify your settlement bank account.</li>} */}
          </ul>
        </div>
      )}

      <section aria-labelledby="docs-heading">
        <h3 id="docs-heading" className="text-lg font-bold text-emerald-800 dark:text-emerald-600">
          Organisation documents
        </h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-white">
          Clear, valid copies. PDF, JPG or PNG.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {slots.map((slot) => (
            <DocUploadCard
              key={slot.id}
              slot={slot}
              file={value.documents[slot.id]}
              showError={attempted}
              onFile={(f) =>
                onChange({
                  ...value,
                  documents: { ...value.documents, [slot.id]: f },
                })
              }
            />
          ))}
        </div>
      </section>

      {/* {needsCompanyChecks && (
        <section aria-labelledby="directors-heading">
          <h3
            id="directors-heading"
            className="text-lg font-bold text-emerald-800"
          >
            Directors
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            We check each director's BVN. It's stored securely and never shown
            in full.
          </p>
          <div className="mt-5 space-y-3">
            {directors.map((d, i) => (
              <div
                key={d.id}
                className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_220px_auto] sm:items-end"
              >
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    Director {i + 1} full name
                  </span>
                  <input
                    className={inputBase}
                    value={d.fullName}
                    onChange={(e) =>
                      setDirector(d.id, { fullName: e.target.value })
                    }
                    placeholder="As it appears on their BVN"
                    autoComplete="off"
                  />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-slate-700">
                    BVN
                  </span>
                  <input
                    className={inputBase}
                    inputMode="numeric"
                    maxLength={11}
                    value={d.bvn}
                    onChange={(e) =>
                      setDirector(d.id, {
                        bvn: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    placeholder="11 digits"
                    autoComplete="off"
                  />
                </label>
                <button
                  type="button"
                  disabled={directors.length === 1}
                  onClick={() =>
                    onChange({
                      ...value,
                      directors: directors.filter((x) => x.id !== d.id),
                    })
                  }
                  aria-label={`Remove director ${i + 1}`}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:invisible"
                >
                  <Trash2 className="size-4" />{" "}
                  <span className="sm:hidden">Remove</span>
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              onChange({
                ...value,
                directors: [
                  ...directors,
                  { id: crypto.randomUUID(), fullName: "", bvn: "" },
                ],
              })
            }
            className={`${btnGhost} mt-3`}
          >
            <Plus className="size-4" /> Add another director
          </button>
        </section>
      )} */}

      {/* {needsCompanyChecks && (
        <section aria-labelledby="settlement-heading">
          <h3
            id="settlement-heading"
            className="text-lg font-bold text-emerald-800"
          >
            Settlement bank account
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Where your collected funds settle. The account name must match your
            registered organisation.
          </p>
          <div className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Bank
              </span>
              <select
                className={inputBase}
                value={settlement.bankCode}
                onChange={(e) => setSettlement({ bankCode: e.target.value })}
              >
                <option value="">Select bank</option>
                {BANKS.map((b) => (
                  <option key={b.code} value={b.code}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Account number
              </span>
              <input
                className={inputBase}
                inputMode="numeric"
                maxLength={10}
                value={settlement.accountNumber}
                onChange={(e) =>
                  setSettlement({
                    accountNumber: e.target.value.replace(/\D/g, ""),
                  })
                }
                placeholder="10 digits"
              />
            </label>
            <button
              type="button"
              onClick={verifyAccount}
              disabled={
                resolving ||
                !settlement.bankCode ||
                settlement.accountNumber.length !== 10
              }
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-[1.5px] border-emerald-700 px-5 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:border-slate-300 disabled:text-slate-400"
            >
              {resolving && <Loader2 className="size-4 animate-spin" />}
              {settlement.accountName ? "Verified" : "Verify account"}
            </button>
            {settlement.accountName && (
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-800 sm:col-span-3">
                <CheckCircle2 className="size-4" aria-hidden="true" />{" "}
                {settlement.accountName}
              </p>
            )}
            {resolveError && (
              <p
                className="text-sm font-medium text-red-600 sm:col-span-3"
                role="alert"
              >
                {resolveError}
              </p>
            )}
          </div>
        </section>
      )} */}

      <div className="flex flex-col-reverse gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button type="button" onClick={onBack} className={btnGhost}>
          <ChevronLeft className="size-4" /> Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className={btnPrimary}
        >
          {submitting ? <Loader2 className="size-4 animate-spin" /> : null}
          {submitting ? "Submitting…" : "Submit for verification"}
          {!submitting && <ArrowRight className="size-4" />}
        </button>
      </div>
    </div>
  );
}
