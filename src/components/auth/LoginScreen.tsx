import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import {
  ArrowRight,
  ChartNoAxesCombined,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UsersRound,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "../../contexts/useTheme";

interface AuthFormProps {
  mode: "login" | "signup";
}
const AuthForm = ({ mode }: AuthFormProps) => {
  const isSignup = mode === "signup";
  const { isDarkMode, toggleTheme } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConformPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="auth-page min-h-screen bg-[#e9f4f0] p-0 md:p-4 lg:p-6 flex items-center justify-center">
      <section className="auth-frame w-full max-w-[1400px] min-h-screen md:min-h-[min(820px,calc(100vh-2rem))] overflow-hidden bg-white md:rounded-xl md:shadow-[0_24px_70px_rgba(10,61,49,0.14)] grid md:grid-cols-2">
        <aside className="relative hidden md:flex flex-col overflow-hidden bg-[#064d3d] px-10 py-10 lg:px-14 lg:py-12 text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_88%_35%,rgba(16,144,101,0.45),transparent_40%),linear-gradient(145deg,#064d3d_0%,#053c33_72%,#07392f_100%)]" />
          <div className="relative z-10 flex items-center gap-3">
            <img
              src="/src/assets/images/SaveCircle_logo.png"
              alt="save circle logo"
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
            style={{ backgroundImage: "url('/src/assets/images/login.jpg')" }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-[#064d3d] via-transparent to-[#064d3d]/10" />
          </div>
        </aside>

        <div className="auth-content flex min-h-screen md:min-h-0 flex-col px-6 py-7 sm:px-10 sm:py-9 lg:px-14 lg:py-10">
          <div className="flex justify-between items-center text-xs sm:text-sm text-[#61778a]">
            {/* dark mode toggler button */}
            <div>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
                title={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
                className="mr-4 rounded-full p-2 text-[#fff] transition-colors hover:bg-[#103b4a]"
              >
                {isDarkMode ? (
                  <Sun className="size-4" />
                ) : (
                  <Moon className="size-4" />
                )}
              </button>
            </div>
            <div>
              <span>
                {isSignup
                  ? "Already have an account?"
                  : "Don't have an account?"}
              </span>
              <Link
                to={isSignup ? "/login" : "/signup"}
                className="ml-2 inline-flex items-center gap-1 font-bold text-[#087f5b] hover:text-[#056b4d]"
              >
                {isSignup ? "Log in" : "Sign up"}{" "}
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>

          <div className="m-auto w-full max-w-[440px] py-10">
            <h2 className="text-[30px] sm:text-[34px] font-bold leading-tight tracking-tight text-[#103b4a]">
              {submitted
                ? isSignup
                  ? "You’re on your way"
                  : "Welcome back"
                : isSignup
                  ? "Create your account"
                  : "Welcome Back"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-[#61778a]">
              {submitted
                ? "Your details have been received."
                : isSignup
                  ? "Get started with SaveCircle and be part of a trusted saving community."
                  : "Log in to your SaveCircle account to continue your savings journey."}
            </p>

            {submitted ? (
              <div
                className="auth-status mt-8 rounded-lg border border-[#cce9dc] bg-[#f1faf5] p-4 text-sm text-[#075c43]"
                role="status"
              >
                {isSignup
                  ? "Your account setup can continue once connected to your service."
                  : "Sign-in is ready to connect to your account service."}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                {isSignup && (
                  <div>
                    <label
                      htmlFor="full-name"
                      className="mb-2 block text-xs font-semibold text-[#24445b]"
                    >
                      Full name
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#557188]" />
                      <input
                        id="full-name"
                        name="name"
                        autoComplete="name"
                        required
                        placeholder="Enter your full name"
                        className="h-11 w-full pl-9.5 rounded-lg border border-[#dce5eb] px-7.5 text-sm text-[#173b4b] outline-none placeholder:text-[#8a9dad] focus:border-[#087f5b] focus:ring-2 focus:ring-[#087f5b]/15"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-xs font-semibold text-[#24445b]"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#557188]" />
                    <input
                      id="email"
                      name="email"
                      type="text"
                      autoComplete="username"
                      required
                      placeholder="Enter your email or phone number"
                      className="h-11 w-full rounded-lg border border-[#dce5eb] pl-10 pr-3.5 text-sm text-[#173b4b] outline-none placeholder:text-[#8a9dad] focus:border-[#087f5b] focus:ring-2 focus:ring-[#087f5b]/15"
                    />
                  </div>
                </div>
                {isSignup && (
                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-xs font-semibold text-[#24445b]"
                    >
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#557188]" />
                      <input
                        id="phone"
                        name="phone"
                        type="text"
                        autoComplete="username"
                        required
                        placeholder="Enter your phone number"
                        className="h-11 w-full rounded-lg border border-[#dce5eb] pl-10 pr-3.5 text-sm text-[#173b4b] outline-none placeholder:text-[#8a9dad] focus:border-[#087f5b] focus:ring-2 focus:ring-[#087f5b]/15"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-xs font-semibold text-[#24445b]"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#557188]" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={
                        isSignup ? "new-password" : "current-password"
                      }
                      required
                      placeholder="Enter your password"
                      className="h-11 w-full rounded-lg border border-[#dce5eb] pl-10 pr-11 text-sm text-[#173b4b] outline-none placeholder:text-[#8a9dad] focus:border-[#087f5b] focus:ring-2 focus:ring-[#087f5b]/15"
                    />
                    <button
                      type="button"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#61778a] hover:text-[#103b4a]"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>
                {isSignup && (
                  <div>
                    <label
                      htmlFor=" Confirm Password"
                      className="mb-2 block text-xs font-semibold text-[#24445b]"
                    >
                      Confirm Password
                    </label>
                    <div className="relative">
                      <LockKeyhole className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#557188]" />
                      <input
                        id="confirm_password"
                        name="password"
                        type={showConfirmPassword ? "text" : "password"}
                        autoComplete={
                          isSignup ? "new-password" : "current-password"
                        }
                        required
                        placeholder="Re-type your password"
                        className="h-11 w-full rounded-lg border border-[#dce5eb] pl-10 pr-11 text-sm text-[#173b4b] outline-none placeholder:text-[#8a9dad] focus:border-[#087f5b] focus:ring-2 focus:ring-[#087f5b]/15"
                      />
                      <button
                        type="button"
                        aria-label={
                          showConfirmPassword
                            ? "Hide password"
                            : "Show password"
                        }
                        onClick={() =>
                          setShowConformPassword((visible) => !visible)
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#61778a] hover:text-[#103b4a]"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {isSignup && (
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <label className="flex items-center gap-2 text-[#24445b]">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(event) =>
                          setRememberMe(event.target.checked)
                        }
                        className="size-4 rounded border-[#9aafbd] accent-[#087f5b]"
                      />
                      <span className="text-[10px]">
                        I Agree To The{" "}
                        <a
                          href="#"
                          className="font-semibold text-[#087f5b] hover:underline"
                        >
                          Terms of service
                        </a>{" "}
                        and{" "}
                        <a
                          href="#"
                          className="font-semibold text-[#087f5b] hover:underline"
                        >
                          Privacy Policy
                        </a>
                      </span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        window.alert("Password recovery is not connected yet.")
                      }
                      className="font-semibold text-[#087f5b] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
                {!isSignup && (
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <label className="flex items-center gap-2 text-[#24445b]">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(event) =>
                          setRememberMe(event.target.checked)
                        }
                        className="size-4 rounded border-[#9aafbd] accent-[#087f5b]"
                      />
                      Remember me
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        window.alert("Password recovery is not connected yet.")
                      }
                      className="font-semibold text-[#087f5b] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <button
                  disabled={isSignup}
                  type="submit"
                  className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#07835e] text-sm font-bold text-white transition-colors hover:bg-[#066c4f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087f5b] focus-visible:ring-offset-2"
                >
                  {isSignup ? "Create account" : "Log In"}{" "}
                  <ArrowRight className="size-4" />
                </button>

                {isSignup && (
                  <>
                    <div className="flex items-center gap-4 py-1 text-xs text-[#708397]">
                      <span className="h-px flex-1 bg-[#e2e9ed]" />
                      or
                      <span className="h-px flex-1 bg-[#e2e9ed]" />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        window.alert("Google sign-in is not connected yet.")
                      }
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#dce5eb] text-sm font-semibold text-[#24445b] transition-colors hover:bg-[#f7faf9]"
                    >
                      <FcGoogle size={20} />
                      Continue with Google
                    </button>
                  </>
                )}

                {!isSignup && (
                  <>
                    <div className="flex items-center gap-4 py-1 text-xs text-[#708397]">
                      <span className="h-px flex-1 bg-[#e2e9ed]" />
                      or
                      <span className="h-px flex-1 bg-[#e2e9ed]" />
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        window.alert("Google sign-in is not connected yet.")
                      }
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-[#dce5eb] text-sm font-semibold text-[#24445b] transition-colors hover:bg-[#f7faf9]"
                    >
                      <FcGoogle size={20} />
                      Continue with Google
                    </button>
                  </>
                )}
              </form>
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
