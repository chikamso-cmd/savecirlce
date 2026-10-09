import { useEffect, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { Check, CheckCircle2, Eye, EyeOff, Loader2, X } from "lucide-react";
import AuthLayout from "../forgotpassword/api/AuthLayout";
import { resetPassword } from "../forgotpassword/api/Authapi";
const RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  {
    label: "An uppercase and a lowercase letter",
    test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p),
  },
  { label: "A number", test: (p: string) => /\d/.test(p) },
  {
    label: "A symbol, like ! or #",
    test: (p: string) => /[^A-Za-z0-9]/.test(p),
  },
];

const STRENGTH = [
  { label: "Too weak", bar: "bg-red-500", text: "text-red-600" },
  { label: "Weak", bar: "bg-red-500", text: "text-red-600" },
  { label: "Fair", bar: "bg-amber-500", text: "text-amber-700" },
  { label: "Good", bar: "bg-emerald-500", text: "text-emerald-700" },
  { label: "Strong", bar: "bg-emerald-700", text: "text-emerald-800" },
];

const inputCls =
  "w-full min-h-12 rounded-lg border border-slate-300 bg-white px-4 pr-12 text-[15px] focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 aria-[invalid=true]:border-red-400";

export default function ResetPasswordPage() {
  const resetToken = (useLocation().state as { resetToken?: string } | null)
    ?.resetToken;
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    document.title = "Reset password | SaveCircle";
  }, []);

  if (!resetToken && !done) return <Navigate to="/forgot-password" replace />;

  const passed = RULES.filter((r) => r.test(password)).length;
  const strength = STRENGTH[password ? passed : 0];
  const allRules = passed === RULES.length;
  const mismatch = confirm.length > 0 && confirm !== password;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!allRules || password !== confirm) return;
    setSaving(true);
    setError(null);
    try {
      await resetPassword(resetToken!, password);
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <AuthLayout
        title="Password updated"
        description="You can now sign in with your new password. For your security, other devices have been signed out."
      >
        <div className="space-y-5">
          <div className="flex justify-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2
                className="size-9 text-emerald-700"
                aria-hidden="true"
              />
            </span>
          </div>
          <Link
            to="/login"
            replace
            className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-emerald-700 px-6 text-sm font-bold text-white hover:bg-emerald-800"
          >
            Go to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create a new password"
      description="Choose a password you haven't used on SaveCircle before."
    >
      <form onSubmit={submit} noValidate className="space-y-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            New password
          </span>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              autoComplete="new-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={touched && !allRules}
              aria-describedby="pw-rules"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-slate-500 hover:text-emerald-700"
            >
              {show ? (
                <EyeOff className="size-5" />
              ) : (
                <Eye className="size-5" />
              )}
            </button>
          </div>
        </label>

        {password && (
          <div>
            <div className="flex gap-1.5" aria-hidden="true">
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full ${i <= passed ? strength.bar : "bg-slate-200"}`}
                />
              ))}
            </div>
            <p className={`mt-1.5 text-sm font-semibold ${strength.text}`}>
              {strength.label}
            </p>
          </div>
        )}

        <ul
          id="pw-rules"
          className="space-y-1.5"
          aria-label="Password requirements"
        >
          {RULES.map((r) => {
            const ok = r.test(password);
            return (
              <li
                key={r.label}
                className={`flex items-center gap-2 text-sm ${ok ? "text-emerald-700" : touched ? "text-red-600" : "text-slate-500"}`}
              >
                {ok ? (
                  <Check className="size-4" aria-hidden="true" />
                ) : (
                  <X className="size-4" aria-hidden="true" />
                )}
                {r.label}
                <span className="sr-only">{ok ? "(met)" : "(not met)"}</span>
              </li>
            );
          })}
        </ul>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Confirm new password
          </span>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              aria-invalid={mismatch || (touched && !confirm)}
              aria-describedby="pw-confirm-error"
              className={inputCls}
            />
          </div>
          {(mismatch || (touched && !confirm)) && (
            <span
              id="pw-confirm-error"
              className="mt-1.5 block text-sm text-red-600"
            >
              {mismatch
                ? "Passwords don't match."
                : "Enter your new password again."}
            </span>
          )}
        </label>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-800"
          >
            {error}{" "}
            <Link to="/forgot-password" className="font-semibold underline">
              Start again
            </Link>
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}{" "}
          {saving ? "Saving…" : "Reset password"}
        </button>
      </form>
    </AuthLayout>
  );
}
