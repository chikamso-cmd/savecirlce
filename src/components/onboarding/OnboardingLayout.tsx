import type { ReactNode } from "react";
import { Check, Clock, History, Landmark, Moon, Sun } from "lucide-react";
import type { StepStatus } from "../../types/types";
import { useTheme } from "../../contexts/useTheme";

export const btnPrimary =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-6 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300";
export const btnSecondary =
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-[1.5px] border-emerald-700 bg-white px-5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 disabled:cursor-not-allowed disabled:opacity-50";
export const btnGhost =
  "inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-semibold text-emerald-700 hover:text-emerald-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-700";
export const inputBase =
  "w-full min-h-12 rounded-lg border border-slate-300 bg-white px-4 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";

const STEP_LABELS = [
  "Organisation",
  "KYB Verification",
  "Payment Rails",
  "Setup & Complete",
];

function Stepper({ statuses }: { statuses: StepStatus[] }) {
  const activeIdx = Math.max(
    0,
    statuses.findIndex((s) => s === "current" || s === "review"),
  );
  

  return (
    <nav aria-label="Onboarding progress">
      <p className="mb-3 text-sm font-medium text-slate-600 sm:hidden">
        Step {activeIdx + 1} of 4: {STEP_LABELS[activeIdx]}
        {statuses[activeIdx] === "review" && " (in review)"}
      </p>
      <ol className="grid grid-cols-4">
        {STEP_LABELS.map((label, i) => {
          const s = statuses[i];
          const leftOn = i > 0 && s !== "upcoming";
          const rightOn = i < 3 && statuses[i + 1] !== "upcoming";
          return (
            <li
              key={label}
              className="flex flex-col items-center gap-2"
              aria-current={s === "current" ? "step" : undefined}
            >
              <div className="flex w-full items-center">
                <span
                  className={`h-0.5 flex-1 ${i === 0 ? "" : leftOn ? "bg-emerald-700" : "bg-slate-200"}`}
                />
                <span
                  className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold sm:size-8 ${
                    s === "done"
                      ? "bg-emerald-700 text-white"
                      : s === "review"
                        ? "border-2 border-amber-500 bg-amber-50 text-amber-700"
                        : s === "current"
                          ? "border-2 border-emerald-700 bg-white text-emerald-700"
                          : "border-2 border-slate-200 bg-white text-slate-500"
                  }`}
                >
                  {s === "done" ? (
                    <Check className="size-4" strokeWidth={3} />
                  ) : s === "review" ? (
                    <Clock className="size-4" />
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className={`h-0.5 flex-1 ${i === 3 ? "" : rightOn ? "bg-emerald-700" : "bg-slate-200"}`}
                />
              </div>
              <span
                className={`hidden text-center text-sm sm:block ${
                  s === "review"
                    ? "font-semibold text-amber-800"
                    : s === "upcoming"
                      ? "text-slate-500"
                      : "font-medium text-emerald-700"
                } ${s === "current" ? "font-bold" : ""}`}
              >
                {label}
                {s === "review" && (
                  <span className="block text-xs font-semibold">In review</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-3">
      <img src="/src/assets/images/logo.png" alt="sacevircle logo" width={230} />
    </div>
  );
}

interface LayoutProps {
  badge: string;
  title: string;
  description: string;
  tagline: [string, string];
  statuses: StepStatus[];
  onSaveLater: () => void;
  illustrationSrc?: string; // reuse the illustrations from your MVP
  children: ReactNode;
}

export default function OnboardingLayout({
  badge,
  title,
  description,
  tagline,
  statuses,
  onSaveLater,
  illustrationSrc,
  children,
}: LayoutProps) {
  const { isDarkMode, toggleTheme } = useTheme();
  return (
    <div className="min-h-screen bg-white text-slate-900 lg:grid lg:grid-cols-[minmax(340px,420px)_1fr]">
      <aside className="relative overflow-hidden bg-emerald-50 px-5 pb-6 pt-5 sm:px-8 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col lg:px-12 lg:pt-12">
        <Logo />
        <div className="mt-6 lg:mt-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3.5 py-1.5 text-sm font-semibold text-emerald-800">
            <Landmark className="size-4" aria-hidden="true" />
            {badge}
          </span>
          <h1 className="mt-4 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl lg:text-[42px]">
            {title}
          </h1>
          <p className="mt-3 hidden max-w-sm text-base leading-relaxed text-slate-600 sm:block lg:text-[17px]">
            {description}
          </p>
        </div>
        {illustrationSrc && (
          <img
            src={illustrationSrc}
            alt=""
            className="mx-auto mt-10 hidden max-h-72 w-auto lg:block"
          />
        )}
        <div className="-mx-12 mt-auto hidden rounded-t-[50%_40px] bg-emerald-100 px-12 pb-12 pt-10 lg:block">
          <p
            className="-rotate-3 text-3xl leading-tight text-emerald-800"
            style={{ fontFamily: "'Caveat', cursive" }}
          >
            {tagline[0]}
            <br />
            {tagline[1]}
          </p>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-5xl px-5 pb-10 pt-4 sm:px-8 lg:px-14 lg:pt-8">
        <div className="flex items-center justify-between">
          {/* dark mode toggler button */}
          <div>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
              title={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
              className="mr-4 rounded-full p-2 text-[#615d5d] transition-colors hover:bg-[#103b4a]"
            >
              {isDarkMode ? (
                <Sun className="size-4" />
              ) : (
                <Moon className="size-4" />
              )}
            </button>
          </div>
          <div className="mb-4 flex justify-end lg:mb-8">
            <button
              type="button"
              onClick={onSaveLater}
              className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-slate-600 hover:text-emerald-700"
            >
              <History className="size-4" aria-hidden="true" />
              Save and continue later
            </button>
          </div>
        </div>
        <Stepper statuses={statuses} />
        <div className="mt-8 sm:mt-10">{children}</div>
      </main>
    </div>
  );
}
