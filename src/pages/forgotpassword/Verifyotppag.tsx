import { useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import AuthLayout from "../forgotpassword/api/AuthLayout";
import OtpInput from "../forgotpassword/Otpinput";
import {
  MAX_OTP_ATTEMPTS,
  OTP_LENGTH,
  RESEND_SECONDS,
  requestReset,
  verifyOtp,
} from "../forgotpassword/api/Authapi"


interface FlowState {
  identifier: string;
  channel: "sms" | "email";
  masked: string;
}

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const flow = useLocation().state as FlowState | null;

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Enter code | SaveCircle";
  }, []);

  // Resend countdown
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [secondsLeft]);

  // Opened directly without a request: start the flow again
  // if (!flow?.identifier) return <Navigate to="/forgot-password" replace />;

  const locked = attempts >= MAX_OTP_ATTEMPTS;

  const verify = async (value = code) => {
    if (value.length !== OTP_LENGTH || verifying || locked) return;
    setVerifying(true);
    setError(null);
    try {
      // const { resetToken } = await verifyOtp(flow.identifier, value);
      // navigate("/reset-password", { replace: true, state: { resetToken } });
    } catch (e) {
      const next = attempts + 1;
      setAttempts(next);
      setCode("");
      setError(
        next >= MAX_OTP_ATTEMPTS
          ? "Too many wrong codes. Request a new code to try again."
          : (e as Error).message,
      );
    } finally {
      setVerifying(false);
    }
  };

  const resend = async () => {
    setResending(true);
    setError(null);
    // await requestReset(flow.identifier);
    setResending(false);
    setAttempts(0);
    setCode("");
    setSecondsLeft(RESEND_SECONDS);
    // setNotice(`A new code is on its way to ${flow.masked}.`);
  };

  return (
    <AuthLayout
      title="Enter the code"
      description={
        <>
          We sent a {OTP_LENGTH}-digit code by SMS
          {/* {flow.channel === "sms" ? "SMS" : "email"} to{" "} */}
          {/* <span className="font-semibold text-slate-900">{flow.masked}</span>. */}
        </>
      }
    >
      <div className="space-y-5">
        <OtpInput
          value={code}
          onChange={(v) => {
            setCode(v);
            setError(null);
          }}
          onComplete={verify}
          length={OTP_LENGTH}
          disabled={verifying || locked}
          invalid={!!error}
          describedBy={error ? "otp-error" : undefined}
        />

        <div aria-live="polite" className="min-h-5 text-sm">
          {error && (
            <p id="otp-error" className="text-red-600">
              {error}
            </p>
          )}
          {!error && notice && <p className="text-emerald-700">{notice}</p>}
        </div>

        <button
          type="button"
          onClick={() => verify()}
          disabled={code.length !== OTP_LENGTH || verifying || locked}
          className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-50"
        >
          {verifying && <Loader2 className="size-4 animate-spin" />}{" "}
          {verifying ? "Checking…" : "Verify code"}
        </button>

        <p className="text-center text-sm text-slate-600">
          Didn't get it?{" "}
          {secondsLeft > 0 && !locked ? (
            <span>
              Resend in{" "}
              <span className="font-semibold tabular-nums text-slate-900">
                0:{String(secondsLeft).padStart(2, "0")}
              </span>
            </span>
          ) : (
            <button
              type="button"
              onClick={resend}
              disabled={resending}
              className="inline-flex min-h-11 items-center gap-1 font-semibold text-emerald-700 hover:text-emerald-900 disabled:opacity-60"
            >
              {resending && <Loader2 className="size-3.5 animate-spin" />}{" "}
              Resend code
            </button>
          )}
        </p>

        <div className="flex flex-col items-center gap-1 border-t border-slate-100 pt-4">
          <Link
            to="/login"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
          >
            <ArrowLeft className="size-4" /> Back to sign in
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
}
