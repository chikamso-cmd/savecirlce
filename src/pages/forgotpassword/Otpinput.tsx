import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  disabled?: boolean;
  invalid?: boolean;
  describedBy?: string;
}

// One box per digit. Typing moves forward, Backspace moves back, pasting fills every box,
// and phones can autofill the code from the SMS (autocomplete="one-time-code").
export default function OtpInput({
  value,
  onChange,
  onComplete,
  length = 6,
  disabled,
  invalid,
  describedBy,
}: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  const focus = (i: number) =>
    refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  const commit = (next: string) => {
    const clean = next.replace(/\D/g, "").slice(0, length);
    onChange(clean);
    if (clean.length === length) onComplete?.(clean);
  };

  const handleInput = (i: number, raw: string) => {
    const typed = raw.replace(/\D/g, "");
    if (!typed) return;
    // A multi-character value here means SMS autofill or a paste into one box
    if (typed.length > 1) {
      commit(typed);
      focus(typed.length);
      return;
    }
    const arr = digits.slice();
    arr[i] = typed;
    commit(arr.join(""));
    focus(i + 1);
  };

  const handleKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      const arr = digits.slice();
      if (arr[i]) {
        arr[i] = "";
      } else if (i > 0) {
        arr[i - 1] = "";
        focus(i - 1);
      }
      onChange(arr.join("").slice(0, length));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focus(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focus(i + 1);
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    commit(pasted);
    focus(pasted.length);
  };

  return (
    <div
      className="flex justify-between gap-2 sm:gap-3"
      role="group"
      aria-label={`${length}-digit code`}
    >
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={i === 0 ? length : 1}
          value={d}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={`size-12 min-w-0 flex-1 rounded-xl border bg-white text-center text-xl font-bold text-slate-900 transition focus:outline-none focus:ring-2 sm:size-14 sm:text-2xl ${
            invalid
              ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
              : d
                ? "border-emerald-600 focus:border-emerald-600 focus:ring-emerald-600/20"
                : "border-slate-300 focus:border-emerald-600 focus:ring-emerald-600/20"
          } disabled:bg-slate-50 disabled:text-slate-400`}
        />
      ))}
    </div>
  );
}
