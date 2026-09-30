import { createContext } from "react";

export type Theme = "light" | "dark";

export interface ThemeContextValue {
  theme: Theme;
  isDarkMode: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | undefined>(
  undefined,
);
