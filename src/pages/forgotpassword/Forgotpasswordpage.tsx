import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import AuthLayout from "../forgotpassword/api/AuthLayout";
import { requestReset } from "../forgotpassword/api/Authapi";
import { toast } from "react-toastify";

const PHONE_RE = /^(\+?234|0)\d{10}$/;
const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    document.title = "Forgot password | SaveCircle";
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const value = identifier.trim();
    if (!PHONE_RE.test(value.replace(/\s/g, "")) && !EMAIL_RE.test(value)) {
      setError("Enter the phone number or email you sign in with.");
      return;
    }
    setError(null);
    setSending(true);
    try {
      const res = await requestReset(value);
      navigate("/verify", {
        state: { identifier: value, ...res },
      });
    } catch (error:any){
      setError("We couldn't send a code right now. Try again in a moment.");
      toast.error("We couldn't send a code right now. Try again in a moment.", error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthLayout
      title="Forgot your password?"
      description="Enter the phone number or email on your account and we'll send you a code to reset it."
    >
      <form onSubmit={submit} className="space-y-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">
            Phone number or email
          </span>
          <input
            type="text"
            inputMode="email"
            autoComplete="username"
            autoFocus
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              setError(null);
            }}
            placeholder="0803 123 4567 or you@example.org"
            aria-invalid={!!error}
            aria-describedby={error ? "fp-error" : undefined}
            className="w-full min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-[15px] placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 aria-[invalid=true]:border-red-400"
          />
          {error && (
            <span
              id="fp-error"
              role="alert"
              className="mt-1.5 block text-sm text-red-600"
            >
              {error}
            </span>
          )}
        </label>

        <button
          type="submit"
          disabled={sending}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          {sending && <Loader2 className="size-4 animate-spin" />}{" "}
          {sending ? "Sending code…" : "Send reset code"}
        </button>

        <Link
          to="/login"
          className="flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
        >
          <ArrowLeft className="size-4" /> Back to sign in
        </Link>
      </form>
    </AuthLayout>
  );
}
