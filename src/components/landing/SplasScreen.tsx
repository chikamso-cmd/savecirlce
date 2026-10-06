import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Users,
  Database,
  Calendar,
  TrendingUp,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import LoadingScreen from "./LoadingScreen";
import logoSymbol from "../../assets/images/savecircle_logo_symbol.jpg";
import heroArtwork from "../../assets/images/splash_hero_people.png";

export default function SaveCircleSplash() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get("preview") === "true";

  // Check if user has already visited
  const [hasVisited, setHasVisited] = useState<boolean>(() => {
    if (isPreview) return false;
    return localStorage.getItem("savecircle_has_visited") === "true";
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // If the user already visited and not previewing, redirect to dashboard
    if (hasVisited && !isPreview) {
      navigate("/login", { replace: true });
    }
  }, [hasVisited, isPreview, navigate]);

  const handleGetStarted = () => {
    localStorage.setItem("savecircle_has_visited", "true");
    setHasVisited(true);
    navigate("/login");
  };

  const handleLearnMore = () => {
    localStorage.setItem("savecircle_has_visited", "true");
    setHasVisited(true);
    navigate("/login");
  };

  // If already visited, render nothing while redirecting
  if (hasVisited && !isPreview) {
    return null;
  }

  // Task 1: Show Loading component first
  if (isLoading) {
    return (
      <LoadingScreen onFinish={() => setIsLoading(false)} durationMs={1800} />
    );
  }

  // Task 2: Show Pixel-Perfect Splash Screen
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-white via-[#f2faf6] to-[#e4f6ed] flex flex-col justify-between overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-900 animate-fadeIn">
      {/* Soft decorative background circles */}
      <div className="absolute -top-24 -left-24 size-96 rounded-full bg-emerald-100/40 blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -right-24 size-[500px] rounded-full bg-emerald-200/30 blur-3xl pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 pt-6 sm:pt-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-11 sm:size-12 rounded-full overflow-hidden shadow-2xs border border-emerald-100 bg-white p-0.5">
            <img
              src={logoSymbol}
              alt="SaveCircle"
              className="size-full rounded-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#087f5b] leading-tight">
              SaveCircle
            </h1>
            <p className="text-[11px] sm:text-xs text-gray-500 font-medium tracking-wide">
              Save Together. Grow Together.
            </p>
          </div>
        </div>

        {/* Development reset button (discreet top-right tag) */}
        <button
          onClick={() => {
            localStorage.removeItem("savecircle_has_visited");
            setIsLoading(true);
          }}
          title="Replay Loading & Splash animation"
          className="text-[10px] text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 border border-emerald-200/70 px-2.5 py-1 rounded-full font-medium transition-colors flex items-center gap-1"
        >
          <Sparkles className="size-3" /> Replay Flow
        </button>
      </header>

      {/* Main Hero Container */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-8 lg:py-12 flex flex-col lg:flex-row items-center justify-between gap-10 lg:gap-8">
        {/* Left Column: Content */}
        <div className="w-full lg:max-w-[540px] xl:max-w-[580px] flex flex-col items-start text-left">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 bg-[#e8f7f0] text-[#05825a] px-3.5 py-1.5 rounded-full text-xs font-semibold border border-emerald-100/80 shadow-2xs">
            <Users className="size-3.5 text-[#05825a]" />
            <span>Ajo Management Made Easy</span>
          </div>

          {/* Headline */}
          <div className="mt-4 sm:mt-5">
            <h2 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-[#11323f] tracking-tight leading-[1.12]">
              Your Ajo Group,
              <br />
              <span className="relative inline-block">
                Simpler &amp; Smarter.
                {/* Curved green accent squiggle */}
                <svg
                  className="absolute -bottom-2.5 left-0 w-24 sm:w-28 h-2.5 text-[#05825a]"
                  viewBox="0 0 100 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M3 8C28 2 72 2 97 8"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
            </h2>
          </div>

          {/* Subtitle */}
          <p className="text-sm sm:text-[15px] text-[#4a6b78] leading-relaxed mt-6 max-w-lg font-normal">
            SaveCircle helps you manage your Ajo groups with ease — track
            contributions, monitor members, set payout schedules, and keep
            everyone in the loop.
          </p>

          {/* 4 Feature Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 my-7 w-full max-w-lg">
            {/* Feature 1 */}
            <div className="flex flex-col items-start">
              <div className="size-11 sm:size-12 rounded-2xl bg-[#eaf7f1] text-[#05825a] flex items-center justify-center shadow-2xs border border-emerald-100/50">
                <Users className="size-5" />
              </div>
              <p className="text-xs font-bold text-[#11323f] leading-snug mt-2">
                Manage
                <br />
                Members
              </p>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col items-start">
              <div className="size-11 sm:size-12 rounded-2xl bg-[#eaf7f1] text-[#05825a] flex items-center justify-center shadow-2xs border border-emerald-100/50">
                <Database className="size-5" />
              </div>
              <p className="text-xs font-bold text-[#11323f] leading-snug mt-2">
                Track
                <br />
                Contributions
              </p>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col items-start">
              <div className="size-11 sm:size-12 rounded-2xl bg-[#eaf7f1] text-[#05825a] flex items-center justify-center shadow-2xs border border-emerald-100/50">
                <Calendar className="size-5" />
              </div>
              <p className="text-xs font-bold text-[#11323f] leading-snug mt-2">
                Set Payout
                <br />
                Schedules
              </p>
            </div>

            {/* Feature 4 */}
            <div className="flex flex-col items-start">
              <div className="size-11 sm:size-12 rounded-2xl bg-[#eaf7f1] text-[#05825a] flex items-center justify-center shadow-2xs border border-emerald-100/50">
                <TrendingUp className="size-5" />
              </div>
              <p className="text-xs font-bold text-[#11323f] leading-snug mt-2">
                View Reports
                <br />
                &amp; Insights
              </p>
            </div>
          </div>

          {/* Action CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3.5 w-full sm:w-auto">
            <button
              onClick={handleGetStarted}
              type="button"
              className="w-full sm:w-auto bg-[#056b4d] hover:bg-[#04553d] active:scale-98 text-white px-7 py-3.5 rounded-full text-sm font-semibold flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(5,107,77,0.25)] transition-all hover:gap-3 cursor-pointer"
            >
              Get Started <ArrowRight className="size-4" />
            </button>
            <button
              onClick={handleLearnMore}
              type="button"
              className="w-full sm:w-auto bg-white hover:bg-gray-50 active:scale-98 border border-gray-200 text-gray-700 hover:text-gray-900 px-7 py-3.5 rounded-full text-sm font-semibold shadow-2xs transition-all cursor-pointer text-center"
            >
              Learn More
            </button>
          </div>

          {/* Social Proof */}
          <div className="mt-8 flex items-center">
            <div className="flex -space-x-2 overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80"
                alt="Member"
                className="size-7 rounded-full object-cover ring-2 ring-white"
              />
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=80&h=80&q=80"
                alt="Member"
                className="size-7 rounded-full object-cover ring-2 ring-white"
              />
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=80&h=80&q=80"
                alt="Member"
                className="size-7 rounded-full object-cover ring-2 ring-white"
              />
              <img
                src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=80&h=80&q=80"
                alt="Member"
                className="size-7 rounded-full object-cover ring-2 ring-white"
              />
            </div>
            <p className="ml-3 text-xs text-gray-500 font-medium">
              Join thousands of people saving together.
            </p>
          </div>
        </div>

        {/* Right Column: Hero Graphic with Floating Cards */}
        <div className="w-full lg:flex-1 flex justify-center lg:justify-end">
          <div className="relative w-full max-w-[520px] lg:max-w-[580px] drop-shadow-xl hover:drop-shadow-2xl transition-all duration-500">
            <img
              src={heroArtwork}
              alt="SaveCircle Community Members"
              className="w-full h-auto object-contain rounded-3xl"
            />
          </div>
        </div>
      </main>

      {/* Clean Minimal Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} SaveCircle. All rights reserved.
      </footer>
    </div>
  );
}
