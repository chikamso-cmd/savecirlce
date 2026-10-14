import {
  AlertCircle,
  ArrowLeft,
  // Key,
  Loader,
  MessageSquareText,
  // Phone,
} from "lucide-react";
import AuthLayout from "../../pages/forgotpassword/api/AuthLayout";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
// import { api } from "../../services/Axios";
import { toast } from "react-toastify";

const fieldClass =
  "h-11 w-full rounded-lg border border-[#dce5eb] pl-10 pr-3.5 text-sm text-[#173b4b] outline-none placeholder:text-[#8a9dad] focus:border-[#087f5b] focus:ring-2 focus:ring-[#087f5b]/15";
const labelClass = "mb-2 block text-xs font-semibold text-[#24445b]";
const primaryBtn =
  "mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#07835e] text-sm font-bold text-white transition-colors hover:bg-[#066c4f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087f5b] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer";

const maskPhone = (e164: any) =>
  `${e164.slice(0, 4)} ${e164.slice(4, 5)} **** ${e164.slice(-5)}`;

function ErrorText({ children }: { children: string }) {
  return (
    <p
      role="alert"
      className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600"
    >
      <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
      {children}
    </p>
  );
}
export default function Verifyotp() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendIn, setResendIn] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const phone = sessionStorage.getItem("phone");
  const sendCode = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        phone,
        code,
      };
      // await api.post(``, payload);
      console.log(payload, "load");
      // setPhone(to);
      setCode("");
      setResendIn(60);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setLoading(true);
      const payload = {
        phone,
        code,
      };
      // await api.post(``, payload);
      setTimeout(() => {
        navigate("/dashboard");
      }, 3500);
      setError("");
      toast.success("verification successful redirecting to dashboard");
      console.log("btn clickrd", payload);
    } catch (err: any) {
      setError("");
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <AuthLayout
      title="Enter the code "
      description={`Check your phone, We sent a 6-digit code by SMS to ${maskPhone(phone)}`}
    >
      <form onSubmit={handleVerify} className="mt-8 space-y-5">
        <p className="rounded-lg border border-[#cce9dc] bg-[#f1faf5] p-3 text-sm text-[#075c43]">
          Code sent to <span className="font-semibold">{maskPhone(phone)}</span>
        </p>
        <div>
          <label htmlFor="otp" className={labelClass}>
            6-digit code
          </label>
          <div className="relative">
            <MessageSquareText className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#557188]" />
            <input
              id="otp"
              name="otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              autoFocus
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="••••••"
              className={`${fieldClass} tracking-[0.5em]`}
            />
          </div>
          {error && <ErrorText>{error}</ErrorText>}
        </div>

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className={primaryBtn}
        >
          {loading && <Loader size={20} className=" animate-spin" />}
          {loading ? "Verifying" : "Verify and continue"}
        </button>

        <div className="flex items-center justify-between gap-3 text-xs">
          <Link to="/signup">
            <button
              type="button"
              onClick={() => {
                setError("");
              }}
              className="inline-flex items-center gap-1 font-semibold text-[#087f5b] hover:underline"
            >
              <ArrowLeft className="size-3.5" /> Change number
            </button>
          </Link>
          {resendIn > 0 ? (
            <span className="text-[#61778a]" aria-live="polite">
              Resend code in {resendIn}s
            </span>
          ) : (
            <button
              type="button"
              // disabled={loading}
              onClick={() => sendCode}
              className="font-semibold text-[#087f5b] hover:underline disabled:opacity-50"
            >
              Resend code
            </button>
          )}
        </div>
      </form>
    </AuthLayout>
  );
}
