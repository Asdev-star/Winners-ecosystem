// src/features/theme/ThemeToggle.tsx

import { useEffect } from "react";
import { useThemeStore, applyTheme } from "../../features/theme/themeStore";

const css = `
  .tt-btn {
    width: 34px; height: 34px; border-radius: 4px;
    background: transparent; border: 1px solid var(--border, #1E2A38);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s; font-size: 16px;
  }
  .tt-btn:hover { border-color: var(--gold, #F5C842); background: rgba(245,200,66,0.06); }

  .tt-switch-wrap {
    display: flex; align-items: center; gap: 12px;
  }
  .tt-switch {
    position: relative; width: 44px; height: 24px; cursor: pointer;
  }
  .tt-switch input { opacity: 0; width: 0; height: 0; }
  .tt-slider {
    position: absolute; inset: 0; border-radius: 24px;
    background: var(--border, #1E2A38); transition: background 0.2s;
  }
  .tt-slider::before {
    content: ''; position: absolute;
    width: 18px; height: 18px; border-radius: 50%;
    left: 3px; top: 3px;
    background: var(--text-dim, #5A6878);
    transition: transform 0.2s, background 0.2s;
  }
  .tt-switch input:checked + .tt-slider { background: rgba(245,200,66,0.2); }
  .tt-switch input:checked + .tt-slider::before {
    transform: translateX(20px);
    background: var(--gold, #F5C842);
  }
  .tt-label {
    font-family: 'Space Mono', monospace; font-size: 11px;
    color: var(--text-dim, #5A6878);
  }
`;

interface ThemeToggleProps {
  variant?: "icon" | "switch";
}

export default function ThemeToggle({ variant = "icon" }: ThemeToggleProps) {
  const { theme, toggleTheme } = useThemeStore();

  useEffect(() => {
    const id = "tt-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id; tag.textContent = css;
      document.head.appendChild(tag);
    }
    // Apply theme on mount
    applyTheme(theme);
  }, []);

  if (variant === "switch") {
    return (
      <div className="tt-switch-wrap">
        <span className="tt-label">☀️ Light</span>
        <label className="tt-switch">
          <input
            type="checkbox"
            checked={theme === "dark"}
            onChange={toggleTheme}
          />
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