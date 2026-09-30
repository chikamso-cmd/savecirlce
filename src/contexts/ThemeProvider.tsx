import { useEffect, useState, type ReactNode } from "react";
import { ThemeContext, type Theme } from "./ThemeContext";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    window.localStorage.getItem("theme") === "dark" ? "dark" : "light",
  );

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((currentTheme) => (currentTheme === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider
      value={{ theme, isDarkMode: theme === "dark", setTheme, toggleTheme }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
