import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { ThemeProvider } from "./contexts/ThemeContext.tsx";
import { BrandProvider } from "./contexts/BrandContext.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <BrandProvider>
        <App />
      </BrandProvider>
    </ThemeProvider>
  </StrictMode>,
);
