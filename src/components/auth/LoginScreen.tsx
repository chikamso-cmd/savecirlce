import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import {
  AlertCircle,
  ArrowRight,
  ChartNoAxesCombined,
  Loader2,
  ShieldCheck,
  UserRound,
  UsersRound,
  Loader,
} from "lucide-react";
import loginImage from "../../assets/images/login.jpg";
import { signInWithGoogle, type AuthSession } from "../../services/Api";
import { preloadGoogle, requestGoogleCode } from "../../services/googleAuth";
import { api, tokenStore } from "../../services/Axios";
import { toast } from "react-toastify";
import { ThemeToggleButton } from "../../contexts/ThemeProvider";
import { getOrganisation } from "../../lib/OrgStore";
import { Turnstile } from "@marsidev/react-turnstile";

// const SESSION_KEY = "savecircle:session";

const fieldClass =
  "h-11 w-full rounded-lg border border-[#dce5eb] pl-10 pr-3.5 text-sm text-[#173b4b] outline-none placeholder:text-[#8a9dad] focus:border-[#087f5b] focus:ring-2 focus:ring-[#087f5b]/15";
const labelClass = "mb-2 block text-xs font-semibold text-[#61778a]";
const primaryBtn =
  "mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#07835e] text-sm font-bold text-white transition-colors hover:bg-[#066c4f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087f5b] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer";

function normalizeNgPhone(input: string): string | null {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("234")) digits = digits.slice(3);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return /^[789]\d{9}$/.test(digits) ? `+234${digits}` : null;
}

function ErrorText({ children }: { children: string }) {
  return (
    <div
      role="alert"
      className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 p-2 tounded-md text-[12px]"
    >
      <AlertCircle className="size-3.5 shrink-0" aria-hidden="true" />
      {children}
    </div>
  );
}

function saveSession({  accessToken }: AuthSession) {
  tokenStore.set(accessToken);
  try {
    // localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  } catch {
    /* storage blocked; the session still works for this visit */
  }
}

// Where to go after signing in: the protected page that bounced them here,
// else the dashboard, or onboarding if they haven't created an organisation yet.
// Only same-site paths are accepted so ?next= can't redirect off SaveCircle.
function useAfterLogin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  return () => {
    const next = params.get("next") ?? "";
    const safe = next.startsWith("/") && !next.startsWith("//");
    const home = getOrganisation() ? "/dashboard" : "/onboarding";
    navigate(safe ? next : home, { replace: true });
  };
}

function GoogleButton({ mode }: { mode: "login" | "signup" }) {
  const afterLogin = useAfterLogin();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(preloadGoogle, []);

  const handleClick = async () => {
    setBusy(true);
    setError(null);
    try {
      const code = await requestGoogleCode();
      saveSession(await signInWithGoogle(code, mode));
      afterLogin();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-4 py-1 text-xs text-[#708397]">
        <span className="h-px flex-1 bg-[#e2e9ed]" />
        or
        <span className="h-px flex-1 bg-[#e2e9ed]" />
      </div>
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#dce5eb] text-sm font-semibold  transition-colors hover:bg-[#f7faf944] disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <FcGoogle size={20} />
        )}
        {mode === "signup" ? "Sign up with Google" : "Continue with Google"}
      </button>
      {error && <ErrorText>{error}</ErrorText>}
    </>
  );
}

function LoginForm() {
  // const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phoneInput, setPhoneInput] = useState<string>("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  // const [password, setPassword] = useState<string>();
  const [error, setError] = useState("");
  // const afterLogin = useAfterLogin();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    console.log("btn clicked");
    if (!phoneInput) {
      toast.error("please enter phone number to continue");
    }
    if (!phoneInput) {
      setError("Please enter phone number to continue");
      return;
    }
    if (!turnstileToken) {
      alert("Please complete the security verification.");
      return;
    }
    try {
      const payload = {
        phoneInput,
        turnstileToken,
      };
      await api.post(``, payload);
      navigate(`/verify`);
      setTimeout(() => {
        setError("");
      }, 3000);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      {error && (
        <p className="bg-red-50 text-red-800 p-3 border-l-2 border-red-700 rounded-xs text-[14px]">
          {error}
        </p>
      )}
      <div>
        <label htmlFor="phone" className={labelClass}>
          Phone number
        </label>
        <div className="flex">
          <span className="inline-flex h-11 items-center rounded-l-lg border border-r-0 border-[#dce5eb] bg-[#f7faf9] px-3 text-sm font-medium text-[#24445b]">
            +234
          </span>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="0803 123 4567"
            className="h-11 w-full rounded-r-lg border border-[#dce5eb] px-3.5 text-sm outline-none focus:border-[#087f5b] focus:ring-2 focus:ring-[#087f5b]/15"
          />
        </div>
      </div>
      {/* </div> */}
      <div className="flex items-center justify-between gap-3 text-xs">
        <label className="flex items-center gap-2 ">
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={(event) => setRememberMe(event.target.checked)}
            className="size-4 rounded border-[#9aafbd] accent-[#087f5b] text-[#61778a]"
          />
          Remember me
        </label>
        {/* <button
          type="button"
          onClick={() => navigate("/forgot-password")}
          className="font-semibold text-[#087f5b] hover:underline"
        >
          Forgot password?
        </button> */}
      </div>
      {error && <ErrorText>{error}</ErrorText>}
      {/* cloudflare ui */}
      <div className="my-4">
        <Turnstile
          siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
          onSuccess={(token) => setTurnstileToken(token)}
          onExpire={() => setTurnstileToken(null)}
          onError={() => setTurnstileToken(null)}
        />
      </div>

      <button type="submit" disabled={busy} className={primaryBtn}>
        {busy ? (
          <div className="flex items-center gap-4 justify-cente">
            <Loader className="size-4 animate-spin text-white" />
            Sending code
          </div>
        ) : (
          <>Send Code</>
        )}
      </button>
      <GoogleButton mode="login" />
    </form>
  );
}

// v4 §4.1 step 1: sign up with phone + OTP, then continue to organisation onboarding
function SignUpForm({
  // stage,
  onStageChange,
}: {
  stage: "details" | "otp";
  onStageChange: (s: "details" | "otp") => void;
}) {
  // const afterLogin = useAfterLogin();
  const [full_Name, setFull_Name] = useState<string>("");
  const [phoneInput, setPhoneInput] = useState<string>("");
  const [agreed, setAgreed] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const errors = {
    name: full_Name.trim().length < 3 ? "Enter your full name." : null,
    phone: normalizeNgPhone(phoneInput)
      ? null
      : "Enter a valid Nigerian phone number, e.g. 0803 123 4567.",
    terms: agreed ? null : "Agree to the terms to continue.",
  };

  const handleSignup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    onStageChange("otp");

    if (!full_Name) {
      setError("please enter your full name!");
      return null;
    }
    if (!phoneInput) {
      setError("please fill all fields and agree to the terms to continue!");
      return null;
    }
    if (!agreed) {
      setError("please agree to the terms of use to continue!");
      return null;
    }
    if (!turnstileToken) {
      alert("Please complete the security verification.");
      return;
    }
    try {
      setBusy(true);
      setTimeout(() => {
        if (agreed) {
          setError("");
        }
      }, 3000);
      const payload = {
        phoneInput,
        full_Name,
        turnstileToken,
      };
      // await api.post(``, payload);
      setAttempted(true);
      sessionStorage.setItem("phone", phoneInput);
      console.log("btn clicked", payload);
      navigate("/signup/verify");
    } catch (err: any) {
      console.error("error navigating");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={handleSignup} noValidate className="mt-8 space-y-5">
      <div>
        <label htmlFor="full-name" className={labelClass}>
          Full name
        </label>
        <div className="relative">
          <UserRound className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 " />
          <input
            id="full-name"
            name="name"
            autoComplete="name"
            value={full_Name}
            onChange={(e) => setFull_Name(e.target.value)}
            placeholder="Enter your full name"
            className={fieldClass}
          />
        </div>
        {attempted && errors.name && <ErrorText>{errors.name}</ErrorText>}
      </div>

      <div>
        <label htmlFor="phone" className={labelClass}>
          Phone number
        </label>
        <div className="flex">
          <span className="inline-flex h-11 items-center rounded-l-lg border border-r-0 border-[#dce5eb] bg-[#f7faf9] px-3 text-sm font-medium text-[#24445b]">
            +234
          </span>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            value={phoneInput}
            onChange={(e) => setPhoneInput(e.target.value)}
            placeholder="0803 123 4567"
            className="h-11 w-full rounded-r-lg border border-[#dce5eb] px-3.5 text-sm  outline-none placeholder:text-[#8a9dad] focus:border-[#087f5b] focus:ring-2 focus:ring-[#087f5b]/15"
          />
        </div>
        {attempted && errors.phone ? (
          <ErrorText>{errors.phone}</ErrorText>
        ) : (
          <p className="mt-2 text-xs text-[#61778a]">
            We'll text you a 6-digit code to confirm it's you.
          </p>
        )}
      </div>

      <div>
        <label className="flex items-center gap-2 text-xs text-[#24445b]">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(event) => setAgreed(event.target.checked)}
            className="size-4 rounded border-[#9aafbd] accent-[#087f5b]"
          />
          <span className="">
            I agree to the{" "}
            <a
              href="#terms"
              className="font-semibold text-[#087f5b] hover:underline"
            >
              Terms of Service
            </a>{" "}
            and{" "}
            <a
              href="#privacy"
              className="font-semibold text-[#087f5b] hover:underline"
            >
              Privacy Policy
            </a>
          </span>
        </label>
        {attempted && errors.terms && <ErrorText>{errors.terms}</ErrorText>}
      </div>

      {error && <ErrorText>{error}</ErrorText>}

      {/* cloudflare ui */}
      <div className="my-4">
        <Turnstile
          siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
          onSuccess={(token) => setTurnstileToken(token)}
          onExpire={() => setTurnstileToken(null)}
          onError={() => setTurnstileToken(null)}
        />
      </div>

      <button type="submit" disabled={busy} className={primaryBtn}>
        {busy ? (
          <Loader className="size-4 animate-spin" />
        ) : (
          <>
            Send code <ArrowRight className="size-4" />
          </>
        )}
      </button>

      <GoogleButton mode="signup" />
    </form>
  );
}

interface AuthFormProps {
  mode: "login" | "signup";
}
const AuthForm = ({ mode }: AuthFormProps) => {
  const isSignup = mode === "signup";
  const [signupStage, setSignupStage] = useState<"details" | "otp">("details");
  const onOtp = isSignup && signupStage === "otp";

  return (
    <main className="auth-page min-h-screen bg-[#e9f4f0] p-0 md:p-4 lg:p-6 flex items-center justify-center">
      <section className="auth-frame w-full max-w-[1400px] min-h-screen md:min-h-[min(820px,calc(100vh-2rem))] overflow-hidden bg-white md:rounded-xl md:shadow-[0_24px_70px_rgba(10,61,49,0.14)] grid md:grid-cols-2">
        <aside className="relative hidden md:flex flex-col overflow-hidden bg-[#064d3d] px-10 py-10 lg:px-14 lg:py-12 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_88%_35%,rgba(16,144,101,0.45),transparent_40%),linear-gradient(145deg,#064d3d_0%,#053c33_72%,#07392f_100%)]" />
          <div className="relative z-10 flex items-center gap-3">
            <img
              src="/src/assets/images/SaveCircle_logo.png"
              alt="sacevircle logo"
              width={230}
            />
          </div>

          <div className="relative z-10 mt-10 lg:mt-14 max-w-md">
            <h1 className="text-3xl lg:text-[40px] font-bold leading-[1.08]">
              Stronger
              <br />
              Together
            </h1>
            <p className="mt-4 max-w-sm text-sm lg:text-base leading-relaxed text-white/85">
              Join trusted groups, contribute regularly, and reach your
              financial goals together.
            </p>
            <ul className="mt-7 space-y-4 text-sm font-medium">
              <li className="flex items-center gap-3">
                <ShieldCheck className="size-5 text-[#51d8a0]" />
                Secure &amp; Transparent
              </li>
              <li className="flex items-center gap-3">
                <UsersRound className="size-5 text-[#51d8a0]" />
                Trusted Communities
              </li>
              <li className="flex items-center gap-3">
                <ChartNoAxesCombined className="size-5 text-[#51d8a0]" />
                Track Your Progress
              </li>
            </ul>
          </div>

          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${loginImage})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#064d3d] via-transparent to-[#064d3d]/10" />
          </div>
        </aside>

        <div className="auth-content flex min-h-screen md:min-h-0 flex-col px-6 py-7 sm:px-10 sm:py-9 lg:px-14 lg:py-10">
          <div className="flex justify-between items-center text-xs sm:text-sm text-[#61778a]">
            {/* dark mode toggler button */}
            <div>
              <ThemeToggleButton />
            </div>
            <div>
              <span className="">
                {isSignup
                  ? "Already have an account?"
                  : "Don't have an account?"}
              </span>
              <Link
                to={isSignup ? "/login" : "/signup"}
                className="ml-2 inline-flex items-center gap-1 font-bold text-[#087f5b] hover:text-[#12f5b1]"
              >
                {isSignup ? "Log in" : "Sign up"}{" "}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="m-auto w-full max-w-[440px] py-10">
            <h2 className="text-[30px] sm:text-[34px] font-bold leading-tight tracking-tight text-[#103b4a]">
              {onOtp
                ? "Check your phone"
                : isSignup
                  ? "Create your account"
                  : "Welcome Back"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#61778a]">
              {onOtp
                ? "Enter the 6-digit code we just sent you by SMS."
                : isSignup
                  ? "Get started with SaveCircle and be part of a trusted saving community."
                  : "Log in to your SaveCircle account to continue your savings journey."}
            </p>

            {isSignup ? (
              <SignUpForm stage={signupStage} onStageChange={setSignupStage} />
            ) : (
              <LoginForm />
            )}
          </div>

          <p className="mx-auto max-w-sm text-center text-[10px] leading-relaxed text-[#72869a]">
            By continuing, you agree to our{" "}
            <a
              href="#terms"
              className="font-semibold text-[#087f5b] hover:underline"
            >
              Terms of Service
            </a>
            <br className="hidden sm:block" /> and{" "}
            <a
              href="#privacy"
              className="font-semibold text-[#087f5b] hover:underline"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
};

export const LoginScreen = () => <AuthForm mode="login" />;
export const SignUpScreen = () => <AuthForm mode="signup" />;
