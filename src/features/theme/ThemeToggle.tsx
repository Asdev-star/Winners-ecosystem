// src/features/theme/ThemeToggle.tsx

import { useEffect } from "react";
import { useThemeStore, applyTheme } from "./themeStore";

const componentCss = `
  .tt-btn {
    width: 34px; height: 34px; border-radius: 4px;
    background: transparent; border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s; font-size: 16px;
  }
  .tt-btn:hover { border-color: var(--gold); background: var(--gold-dim); }

  .tt-switch-wrap { display: flex; align-items: center; gap: 12px; }
  .tt-switch { position: relative; width: 44px; height: 24px; cursor: pointer; }
  .tt-switch input { opacity: 0; width: 0; height: 0; }
  .tt-slider {
    position: absolute; inset: 0; border-radius: 24px;
    background: var(--border); transition: background 0.2s;
  }
  .tt-slider::before {
    content: ''; position: absolute; width: 18px; height: 18px; border-radius: 50%;
    left: 3px; top: 3px; background: var(--text-dim);
    transition: transform 0.2s, background 0.2s;
  }
  .tt-switch input:checked + .tt-slider { background: var(--blue-dim); }
  .tt-switch input:checked + .tt-slider::before { transform: translateX(20px); background: var(--gold); }
  .tt-label { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); }
`;

if (typeof document !== "undefined" && !document.getElementById("tt-styles")) {
  const tag = document.createElement("style");
  tag.id = "tt-styles"; tag.textContent = componentCss;
  document.head.appendChild(tag);
}

interface ThemeToggleProps {
  variant?: "icon" | "switch";
}

export default function ThemeToggle({ variant = "icon" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => { applyTheme(theme, false); }, [theme]);

  if (variant === "switch") {
    return (
      <div className="tt-switch-wrap">
        <span className="tt-label">☀️</span>
        <label className="tt-switch">
          <input type="checkbox" checked={theme === "dark"} onChange={toggleTheme} />
          <span className="tt-slider" />
        </label>
        <span className="tt-label">🌙</span>
      </div>
    );
  }

  return (
    <button className="tt-btn" onClick={toggleTheme} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}