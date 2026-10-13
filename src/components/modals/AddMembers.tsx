import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileUp,
  Loader2,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";

export type IdType = "bvn" | "nin";

export interface NewMemberInput {
  name: string;
  phone: string; // normalised, no spaces
  groups: string[];
  idType?: IdType; // set only when captured with consent
  idNumber?: string; // send to the API, never keep it in client state afterwards
}

interface Props {
  groups: string[];
  existingPhones: string[];
  onClose: () => void;
  onAdd: (members: NewMemberInput[]) => void;
}

type Mode = "single" | "bulk";
interface CsvRow {
  name: string;
  phone: string;
  error?: string;
}

const PHONE_RE = /^(\+?234|0)\d{10}$/;
const normalisePhone = (p: string) => p.replace(/[\s-]/g, "");

const inputCls =
  "w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3.5 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 aria-[invalid=true]:border-red-400 dark:bg-slate-900 dark:text-white";
const btnPrimary =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-5 text-sm font-bold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60";
const btnOutline =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 hover:border-emerald-600 hover:text-emerald-700";

function FieldError({ id, msg }: { id: string; msg?: string }) {
  return msg ? (
    <p id={id} className="mt-1.5 text-sm text-red-600">
      {msg}
    </p>
  ) : null;
}

export default function AddMemberModal({
  groups,
  existingPhones,
  onClose,
  onAdd,
}: Props) {
  const [mode, setMode] = useState<Mode>("single");
  const [saving, setSaving] = useState(false);

  // single
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [idType, setIdType] = useState<IdType | "later">("later");
  const [idNumber, setIdNumber] = useState("");
  const [consent, setConsent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // bulk
  const fileRef = useRef<HTMLInputElement>(null);
  const [bulkGroup, setBulkGroup] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const dialogRef = useRef<HTMLDivElement>(null);

  // Escape to close, lock page scroll, return focus to the opener on close
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      opener?.focus();
    };
  }, [onClose, saving]);

  const clear = (key: string) =>
    setErrors((e) => {
      const { [key]: _, ...rest } = e;
      return rest;
    });

  const toggleGroup = (g: string) => {
    setSelectedGroups((cur) =>
      cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g],
    );
    clear("groups");
  };

  // ---------- single ----------
  const validateSingle = () => {
    const e: Record<string, string> = {};
    const p = normalisePhone(phone);
    if (name.trim().length < 3) e.name = "Enter the member’s full name.";
    if (!PHONE_RE.test(p))
      e.phone = "Enter a valid Nigerian phone number, e.g. 0803 123 4567.";
    else if (existingPhones.includes(p))
      e.phone = "A member with this phone number already exists.";
    if (!selectedGroups.length) e.groups = "Pick at least one group.";
    if (idType !== "later") {
      if (!/^\d{11}$/.test(idNumber))
        e.idNumber = `${idType.toUpperCase()} must be 11 digits.`;
      if (!consent)
        e.consent = "The member must agree before you capture their ID.";
    }
    return e;
  };

  const submitSingle = async () => {
    const e = validateSingle();
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) {
      dialogRef.current
        ?.querySelector<HTMLElement>(`[data-field="${first}"]`)
        ?.focus();
      return;
    }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600)); // TODO: POST /members
    onAdd([
      {
        name: name.trim(),
        phone: normalisePhone(phone),
        groups: selectedGroups,
        ...(idType !== "later" ? { idType, idNumber } : {}),
      },
    ]);
    setSaving(false);
  };

  // ---------- bulk ----------
  const parseCsv = (file?: File) => {
    if (!file) return;
    if (!/\.csv$/i.test(file.name)) {
      setBulkError("Upload a .csv file.");
      return;
    }
    setFileName(file.name);
    setBulkError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const seen = new Set<string>();
      const parsed = String(reader.result)
        .split(/\r?\n/)
        .map((line) =>
          line.split(",").map((c) => c.trim().replace(/^"|"$/g, "")),
        )
        .filter((c) => c[0] && !/^name$/i.test(c[0]))
        .map(([rowName, rowPhone = ""]): CsvRow => {
          const p = normalisePhone(rowPhone);
          let error: string | undefined;
          if (rowName.length < 3) error = "Name too short";
          else if (!PHONE_RE.test(p)) error = "Invalid phone";
          else if (existingPhones.includes(p)) error = "Already a member";
          else if (seen.has(p)) error = "Duplicate in file";
          seen.add(p);
          return { name: rowName, phone: p, error };
        });
      if (!parsed.length)
        setBulkError("No rows found. Use two columns: name, phone.");
      setRows(parsed);
    };
    reader.readAsText(file);
  };

  const validRows = rows.filter((r) => !r.error);

  const submitBulk = async () => {
    if (!bulkGroup)
      return setBulkError("Pick the group these members are joining.");
    if (!validRows.length)
      return setBulkError("There are no valid rows to add.");
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900)); // TODO: POST /members/bulk
    onAdd(
      validRows.map((r) => ({
        name: r.name,
        phone: r.phone,
        groups: [bulkGroup],
      })),
    );
    setSaving(false);
  };

  const downloadTemplate = () => {
    const url = URL.createObjectURL(
      new Blob(["name,phone\nAdaeze Okafor,08031234567\n"], {
        type: "text/csv",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "savecircle-members-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 sm:items-center sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-member-title"
        className="flex max-h-[92vh] w-full flex-col rounded-t-2xl bg-white shadow-xl sm:max-w-xl sm:rounded-2xl dark:bg-slate-900"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5 sm:px-6">
          <div>
            <h2 id="add-member-title" className="text-lg font-bold">
              Add members
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Each person gets an invite by SMS or WhatsApp to set a PIN.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="px-5 pt-4 sm:px-6">
          <div
            role="tablist"
            aria-label="How to add"
            className="grid grid-cols-2 rounded-lg bg-slate-100 p-1"
          >
            {(
              [
                ["single", "One member"],
                ["bulk", "Upload CSV"],
              ] as const
            ).map(([m, label]) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={`min-h-10 rounded-md text-sm font-semibold transition ${mode === m ? "bg-white text-emerald-800 shadow-sm dark:bg-slate-900" : "text-slate-600 dark:bg-slate-900 dark:text-white"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:px-6">
          {mode === "single" ? (
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="am-name"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Full name
                </label>
                <input
                  id="am-name"
                  data-field="name"
                  autoFocus
                  className={inputCls}
                  value={name}
                  placeholder="As on their BVN or NIN"
                  aria-invalid={!!errors.name}
                  aria-describedby="am-name-err"
                  onChange={(e) => {
                    setName(e.target.value);
                    clear("name");
                  }}
                />
                <FieldError id="am-name-err" msg={errors.name} />
              </div>

              <div>
                <label
                  htmlFor="am-phone"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Phone number
                </label>
                <input
                  id="am-phone"
                  data-field="phone"
                  type="tel"
                  inputMode="tel"
                  className={inputCls}
                  value={phone}
                  placeholder="0803 123 4567"
                  aria-invalid={!!errors.phone}
                  aria-describedby="am-phone-err"
                  onChange={(e) => {
                    setPhone(e.target.value);
                    clear("phone");
                  }}
                />
                <FieldError id="am-phone-err" msg={errors.phone} />
              </div>

              <fieldset>
                <legend className="mb-1.5 text-sm font-medium text-slate-700">
                  Groups
                </legend>
                <p className="mb-2 text-sm text-slate-500">
                  They keep one account number across all their groups.
                </p>
                <div className="flex flex-wrap gap-2">
                  {groups.map((g, i) => {
                    const on = selectedGroups.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        data-field={i === 0 ? "groups" : undefined}
                        onClick={() => toggleGroup(g)}
                        aria-pressed={on}
                        className={`min-h-10 rounded-full border px-4 text-sm font-semibold transition ${on ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-slate-300 text-slate-700 hover:border-emerald-500"}`}
                      >
                        {g}
                      </button>
                    );
                  })}
                </div>
                <FieldError id="am-groups-err" msg={errors.groups} />
              </fieldset>

              <fieldset className="rounded-xl border border-slate-200 p-4">
                <legend className="flex items-center gap-2 px-1 text-sm font-medium text-slate-700">
                  <ShieldCheck
                    className="size-4 text-emerald-700"
                    aria-hidden="true"
                  />{" "}
                  Identity
                </legend>
                <p className="text-sm text-slate-500">
                  A BVN or NIN gets them a personal account number. Without it
                  they can still pay cash to an officer.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(
                    [
                      ["later", "They’ll verify later"],
                      ["bvn", "Capture BVN"],
                      ["nin", "Capture NIN"],
                    ] as const
                  ).map(([v, label]) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={idType === v}
                      onClick={() => {
                        setIdType(v);
                        clear("idNumber");
                        clear("consent");
                      }}
                      className={`min-h-10 rounded-full border px-4 text-sm font-semibold transition ${idType === v ? "border-emerald-700 bg-emerald-50 text-emerald-800" : "border-slate-300 text-slate-700 hover:border-emerald-500"}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {idType !== "later" && (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label
                        htmlFor="am-id"
                        className="mb-1.5 block text-sm font-medium text-slate-700"
                      >
                        {idType.toUpperCase()}
                      </label>
                      <input
                        id="am-id"
                        data-field="idNumber"
                        className={inputCls}
                        inputMode="numeric"
                        maxLength={11}
                        autoComplete="off"
                        placeholder="11 digits"
                        value={idNumber}
                        aria-invalid={!!errors.idNumber}
                        aria-describedby="am-id-err"
                        onChange={(e) => {
                          setIdNumber(e.target.value.replace(/\D/g, ""));
                          clear("idNumber");
                        }}
                      />
                      <FieldError id="am-id-err" msg={errors.idNumber} />
                    </div>
                    <label className="flex cursor-pointer gap-3 text-sm">
                      <input
                        type="checkbox"
                        data-field="consent"
                        checked={consent}
                        className="mt-0.5 size-4 shrink-0 accent-emerald-700"
                        onChange={(e) => {
                          setConsent(e.target.checked);
                          clear("consent");
                        }}
                      />
                      <span>
                        The member agrees to share their {idType.toUpperCase()}{" "}
                        so SaveCircle can verify them and set up their account
                        number.
                      </span>
                    </label>
                    <FieldError id="am-consent-err" msg={errors.consent} />
                  </div>
                )}
              </fieldset>
            </div>
          ) : (
            <div className="space-y-5">
              <div>
                <label
                  htmlFor="am-bulk-group"
                  className="mb-1.5 block text-sm font-medium text-slate-700"
                >
                  Group they're joining
                </label>
                <select
                  id="am-bulk-group"
                  className={inputCls}
                  value={bulkGroup}
                  onChange={(e) => {
                    setBulkGroup(e.target.value);
                    setBulkError(null);
                  }}
                >
                  <option value="">Select group</option>
                  {groups.map((g) => (
                    <option key={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    parseCsv(e.dataTransfer.files?.[0]);
                  }}
                  className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-300 px-4 py-8 text-center hover:border-emerald-600 hover:bg-emerald-50/40"
                >
                  <FileUp
                    className="size-6 text-emerald-700"
                    aria-hidden="true"
                  />
                  <span className="text-sm font-semibold text-emerald-800">
                    {fileName ?? "Choose or drop a CSV file"}
                  </span>
                  <span className="text-xs text-slate-500">
                    Two columns: name, phone
                  </span>
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="sr-only"
                  tabIndex={-1}
                  onChange={(e) => {
                    parseCsv(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                <button
                  type="button"
                  onClick={downloadTemplate}
                  className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-emerald-700 hover:text-emerald-900"
                >
                  Download template
                </button>
              </div>

              {bulkError && (
                <p
                  className="flex gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-800"
                  role="alert"
                >
                  <AlertCircle className="size-4 shrink-0 translate-y-0.5" />{" "}
                  {bulkError}
                </p>
              )}

              {rows.length > 0 && (
                <div>
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="font-semibold">
                      {validRows.length} ready
                      {rows.length > validRows.length && (
                        <span className="text-amber-700">
                          , {rows.length - validRows.length} skipped
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setRows([]);
                        setFileName(null);
                      }}
                      className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-slate-600 hover:text-red-600"
                    >
                      <Trash2 className="size-4" /> Clear
                    </button>
                  </div>
                  <ul className="max-h-60 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
                    {rows.map((r, i) => (
                      <li
                        key={`${r.phone}-${i}`}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm"
                      >
                        {r.error ? (
                          <AlertCircle
                            className="size-4 shrink-0 text-amber-600"
                            aria-hidden="true"
                          />
                        ) : (
                          <CheckCircle2
                            className="size-4 shrink-0 text-emerald-600"
                            aria-hidden="true"
                          />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">
                            {r.name}
                          </span>
                          <span className="block text-xs text-slate-500">
                            {r.phone || "No phone"}
                          </span>
                        </span>
                        {r.error && (
                          <span className="shrink-0 text-xs font-semibold text-amber-700">
                            {r.error}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-slate-500">
                    Bulk-added members verify their own BVN or NIN from the
                    invite link.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 p-5 sm:flex-row sm:justify-end sm:px-6">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className={btnOutline}
          >
            Cancel
          </button>
          {mode === "single" ? (
            <button
              type="button"
              onClick={submitSingle}
              disabled={saving}
              className={btnPrimary}
            >
              {saving && <Loader2 className="size-4 animate-spin" />}{" "}
              {saving ? "Adding…" : "Add and send invite"}
            </button>
          ) : (
            <button
              type="button"
              onClick={submitBulk}
              disabled={saving || !validRows.length}
              className={btnPrimary}
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {saving
                ? "Adding…"
                : `Add ${validRows.length || ""} member${validRows.length === 1 ? "" : "s"}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
