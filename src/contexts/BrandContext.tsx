import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { buildBrandCss, DEFAULT_BRAND, isHex } from "../lib/brandPalette";

interface BrandContextValue {
  brandColour: string; // the saved colour
  activeColour: string; // what is showing (saved colour, or a live preview)
  setBrandColour: (hex: string) => void;
  previewBrandColour: (hex: string | null) => void; // null ends the preview
  resetBrandColour: () => void;
}

// index.html reads BRAND_CSS_KEY before React loads, so there is no flash of the default green.
const STORAGE_KEY = "savecircle:brand";
const BRAND_CSS_KEY = "savecircle:brand-css";
const STYLE_ID = "savecircle-brand";

const BrandContext = createContext<BrandContextValue | null>(null);

function readStoredBrand(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isHex(stored)) return stored;
  } catch {
    /* storage blocked: use the default */
  }
  return DEFAULT_BRAND;
}

function applyBrand(hex: string) {
  const root = document.documentElement;
  let style = document.getElementById(STYLE_ID);
  const isDefault = hex.toLowerCase() === DEFAULT_BRAND.toLowerCase();

  if (isDefault) {
    style?.remove(); // the stylesheet's own palette is the default
    delete root.dataset.brand;
  } else {
    if (!style) {
      style = document.createElement("style");
      style.id = STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = buildBrandCss(hex);
    root.dataset.brand = hex;
  }
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", isDefault ? "#064d3d" : hex);
}

export function BrandProvider({ children }: { children: ReactNode }) {
  const [brandColour, setBrandState] = useState(readStoredBrand);
  const [preview, setPreview] = useState<string | null>(null);
  const activeColour = preview ?? brandColour;

  useLayoutEffect(() => {
    applyBrand(activeColour);
  }, [activeColour]);

  // Keep several open tabs in step
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setBrandState(e.newValue && isHex(e.newValue) ? e.newValue : DEFAULT_BRAND);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // TODO: also PATCH /organisation { brandColour } so members see it on every device
  const setBrandColour = useCallback((hex: string) => {
    if (!isHex(hex)) return;
    setBrandState(hex);
    setPreview(null);
    try {
      if (hex.toLowerCase() === DEFAULT_BRAND.toLowerCase()) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(BRAND_CSS_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, hex);
        localStorage.setItem(BRAND_CSS_KEY, buildBrandCss(hex));
      }
    } catch {
      /* ignore: colour still applies for this session */
    }
  }, []);

  const previewBrandColour = useCallback((hex: string | null) => {
    setPreview(hex && isHex(hex) ? hex : null);
  }, []);

  const resetBrandColour = useCallback(() => setBrandColour(DEFAULT_BRAND), [setBrandColour]);

  const value = useMemo(
    () => ({ brandColour, activeColour, setBrandColour, previewBrandColour, resetBrandColour }),
    [brandColour, activeColour, setBrandColour, previewBrandColour, resetBrandColour],
  );

  return <BrandContext.Provider value={value}>{children}</BrandContext.Provider>;
}

export function useBrand() {
  const ctx = useContext(BrandContext);
  if (!ctx) throw new Error("useBrand must be used inside <BrandProvider>");
  return ctx;
}
