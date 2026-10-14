import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type ThemePreference } from "../contexts/ThemeContext";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

// Compact icon button for the header: switches between light and dark.
export function ThemeToggleButton() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const dark = resolvedTheme === "dark";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Light mode" : "Dark mode"}
      className="rounded-lg p-2.5 text-slate-600 hover:bg-slate-100"
    >
      {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </button>
  );
}

// Three-way picker (Light / Dark / System) for menus and the Settings page.
export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const on = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => setTheme(value)}
            className={`inline-flex min-h-10 items-center justify-center gap-1.5 rounded-md px-2 text-sm font-semibold transition ${
              on
                ? "bg-white text-emerald-800 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
