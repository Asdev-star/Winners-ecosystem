// src/features/theme/ThemeToggle.tsx

import { useEffect } from "react";
import { useThemeStore, applyTheme } from "./themeStore";

const darkVars = `
  :root {
    --bg: #080B10; --surface: #0D1117; --surface2: #141B24;
    --border: #1E2A38; --text: #E8EDF2; --text-dim: #5A6878; --gold: #F5C842;
  }
`;

const lightVars = `
  :root {
    --bg: #F4F6FA; --surface: #FFFFFF; --surface2: #EDF0F7;
    --border: #D8DEE9; --text: #0F1923; --text-dim: #6B7A99; --gold: #D4A800;
  }
`;

const componentCss = `
  .tt-btn {
    width: 34px; height: 34px; border-radius: 4px;
    background: transparent; border: 1px solid var(--border, #1E2A38);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s; font-size: 16px;
  }
  .tt-btn:hover { border-color: var(--gold, #F5C842); background: rgba(245,200,66,0.06); }
  .tt-switch-wrap { display: flex; align-items: center; gap: 12px; }
  .tt-switch { position: relative; width: 44px; height: 24px; cursor: pointer; }
  .tt-switch input { opacity: 0; width: 0; height: 0; }
  .tt-slider {
    position: absolute; inset: 0; border-radius: 24px;
    background: var(--border, #1E2A38); transition: background 0.2s;
  }
  .tt-slider::before {
    content: ''; position: absolute; width: 18px; height: 18px; border-radius: 50%;
    left: 3px; top: 3px; background: var(--text-dim, #5A6878);
    transition: transform 0.2s, background 0.2s;
  }
  .tt-switch input:checked + .tt-slider { background: rgba(245,200,66,0.2); }
  .tt-switch input:checked + .tt-slider::before { transform: translateX(20px); background: var(--gold, #F5C842); }
  .tt-label { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim, #5A6878); }
`;

function injectStyles(theme: "dark" | "light") {
  // Inject component styles once
  if (!document.getElementById("tt-styles")) {
    const tag = document.createElement("style");
    tag.id = "tt-styles";
    tag.textContent = componentCss;
    document.head.appendChild(tag);
  }

  // Update theme vars — always replace
  let varTag = document.getElementById("tt-vars") as HTMLStyleElement | null;
  if (!varTag) {
    varTag = document.createElement("style");
    varTag.id = "tt-vars";
    document.head.appendChild(varTag);
  }
  varTag.textContent = theme === "light" ? lightVars : darkVars;
}

interface ThemeToggleProps {
  variant?: "icon" | "switch";
}

export default function ThemeToggle({ variant = "icon" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    injectStyles(theme);
  }, [theme]); // Re-runs every time theme changes

  if (variant === "switch") {
    return (
      <div className="tt-switch-wrap">
        <span className="tt-label">☀️ Light</span>
        <label className="tt-switch">
          <input type="checkbox" checked={theme === "dark"} onChange={toggleTheme} />
          <span className="tt-slider" />
        </label>
        <span className="tt-label">🌙 Dark</span>
      </div>
    );
  }

  return (
    <button
      className="tt-btn"
      onClick={toggleTheme}
      title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}