// Turns one brand hex into a full Tailwind-style colour ladder.
// The app styles its accent with `emerald-*` classes, which Tailwind v4 compiles to
// `var(--color-emerald-*)`. Overriding those variables re-colours every screen at once.

export const DEFAULT_BRAND = "#047857"; // Tailwind emerald-700, the original SaveCircle green

export const BRAND_PRESETS = [
  { hex: "#047857", name: "Emerald" },
  { hex: "#0F766E", name: "Teal" },
  { hex: "#1D4ED8", name: "Blue" },
  { hex: "#4338CA", name: "Indigo" },
  { hex: "#7C3AED", name: "Violet" },
  { hex: "#BE185D", name: "Pink" },
  { hex: "#BE123C", name: "Rose" },
  { hex: "#B45309", name: "Amber" },
  { hex: "#334155", name: "Slate" },
];

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

// Lightness and chroma of Tailwind's emerald ladder (OKLCH). Keeping the lightness fixed
// means white text on `bg-emerald-700` stays readable whatever colour is picked.
const LADDER: Record<(typeof STEPS)[number], [number, number]> = {
  50: [0.979, 0.021],
  100: [0.95, 0.052],
  200: [0.905, 0.093],
  300: [0.845, 0.143],
  400: [0.765, 0.177],
  500: [0.696, 0.17],
  600: [0.596, 0.145],
  700: [0.508, 0.118],
  800: [0.432, 0.095],
  900: [0.378, 0.077],
  950: [0.262, 0.051],
};

// Dark-mode neutrals (card, page, borders, text), tinted with the brand hue.
const DARK_NEUTRALS: [string, number, number][] = [
  ["white", 0.245, 0.025],
  ["slate-50", 0.195, 0.02],
  ["slate-100", 0.27, 0.028],
  ["slate-200", 0.315, 0.03],
  ["slate-300", 0.385, 0.03],
  ["slate-400", 0.57, 0.03],
  ["slate-500", 0.7, 0.025],
  ["slate-600", 0.79, 0.02],
  ["slate-700", 0.86, 0.015],
  ["slate-800", 0.92, 0.01],
  ["slate-900", 0.962, 0.007],
  ["slate-950", 0.98, 0.004],
];

export const isHex = (v: string) => /^#[0-9a-f]{6}$/i.test(v);

export function hexToOklch(hex: string): { l: number; c: number; h: number } {
  const n = parseInt(hex.slice(1), 16);
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const r = lin((n >> 16) & 255);
  const g = lin((n >> 8) & 255);
  const b = lin(n & 255);

  const l_ = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m_ = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s_ = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const A = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const B = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  const h = (Math.atan2(B, A) * 180) / Math.PI;
  return { l: L, c: Math.hypot(A, B), h: h < 0 ? h + 360 : h };
}

const oklch = (l: number, c: number, h: number) =>
  `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(2)})`;

// CSS that re-themes the app. Injected as a <style> tag, so it beats Tailwind's layered theme.
export function buildBrandCss(hex: string): string {
  const { c, h } = hexToOklch(hex);
  const ratio = Math.min(c / LADDER[700][1], 2); // how saturated the pick is vs. emerald
  const tint = Math.min(ratio, 1); // greys get grey dark surfaces

  const accent = STEPS.map((s) => {
    const [l, base] = LADDER[s];
    const r = s <= 300 ? Math.min(ratio, 1.3) : ratio; // keep pale tints soft
    return `--color-emerald-${s}: ${oklch(l, Math.min(base * r, 0.26), h)};`;
  }).join("");

  const dark = DARK_NEUTRALS.map(
    ([name, l, base]) => `--color-${name}: ${oklch(l, base * tint, h)};`,
  ).join("");

  return (
    `:root{${accent}}` +
    `:root.dark{${dark}--color-emerald-50: ${oklch(0.3, 0.05 * tint, h)};}`
  );
}
