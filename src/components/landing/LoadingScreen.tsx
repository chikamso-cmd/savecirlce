import { useState, useEffect } from "react";
import logoSymbol from "../../assets/images/savecircle_logo_symbol.jpg";

interface LoadingScreenProps {
  onFinish?: () => void;
  durationMs?: number;
}

export default function LoadingScreen({
  onFinish,
  durationMs = 2000,
}: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = performance.now();

    const interval = setInterval(() => {
      const elapsed = performance.now() - startTime;
      const pct = Math.min(Math.round((elapsed / durationMs) * 10), 100);
      setProgress(pct);

      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          onFinish?.();
        }, 300);
      }
    }, 25);

    return () => clearInterval(interval);
  }, [durationMs, onFinish]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-[#f8fbf9] to-[#edf7f2] px-6 select-none transition-opacity duration-500">
      {/* Ambient background glow */}
      <div className="absolute size-72 rounded-full bg-emerald-200/40 blur-3xl pointer-events-none animate-pulse" />

      {/* Main Logo Container */}
      <div className="relative flex flex-col items-center">
        {/* Animated Ripple Rings */}
        <div className="relative flex items-center justify-center">
          <span className="absolute size-36 rounded-full border-2 border-emerald-400/30 animate-ping" />
          <span className="absolute size-40 rounded-full border border-emerald-300/40 animate-pulse" />

          {/* Logo Badge */}
          <div className="relative size-28 sm:size-32 rounded-full p-1 bg-white shadow-[0_8px_30px_rgba(5,107,77,0.18)] flex items-center justify-center overflow-hidden transition-transform duration-700 hover:scale-105">
            <img
              src={logoSymbol}
              alt="SaveCircle Logo"
              className="size-full rounded-full object-cover animate-spin-once"
            />
          </div>
        </div>

        {/* Brand Name & Tagline */}
        <div className="mt-7 text-center">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#11323f]">
            Save<span className="text-[#056b4d]">Circle</span>
          </h1>
          <p className="mt-1 text-xs font-semibold tracking-wider text-emerald-700 uppercase">
            Save Together. Grow Together.
          </p>
        </div>

        {/* Progress Bar Container */}
        <div className="mt-8 w-56 sm:w-64">
          <div className="h-1.5 w-full bg-emerald-100 rounded-full overflow-hidden shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700 rounded-full transition-all duration-75 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] font-medium text-gray-400">
            <span>Loading...</span>
            <span className="font-semibold text-emerald-700">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
