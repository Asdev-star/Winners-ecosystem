// src/features/theme/themeStore.ts

import { create } from "zustand";

type Theme = "dark" | "light";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const THEME_KEY = "winners_theme";

const getInitialTheme = (): Theme => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return "dark";
};

export function applyTheme(theme: Theme, animate = true) {
  const root = document.documentElement;

  if (animate) {
    root.style.setProperty("transition", "background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease");
    setTimeout(() => root.style.removeProperty("transition"), 300);
  }

  if (theme === "light") {
    // Light mode — steel blue tones with bronze gold
    root.style.setProperty("--bg",        "var(--theme-light-bg)");
    root.style.setProperty("--surface",   "var(--theme-light-surface)");
    root.style.setProperty("--surface2",  "var(--theme-light-surface2)");
    root.style.setProperty("--border",    "var(--theme-light-border)");
    root.style.setProperty("--text",      "var(--theme-light-text)");
    root.style.setProperty("--text-dim",  "var(--theme-light-text-dim)");
    root.style.setProperty("--gold",      "var(--theme-light-gold)");
    root.style.setProperty("--gold-dim",  "var(--theme-light-gold-dim)");
    root.style.setProperty("--gold-glow", "var(--theme-light-gold-glow)");
    root.style.setProperty("--blue",      "var(--theme-light-blue)");
    root.style.setProperty("--blue-dim",  "var(--theme-light-blue-dim)");
    root.style.setProperty("--ice",       "var(--theme-light-ice)");
    root.style.setProperty("--red",       "var(--theme-light-red)");
    root.style.setProperty("--green",     "var(--theme-light-green)");
    root.style.setProperty("--purple",    "var(--theme-light-purple)");
    root.classList.add("light");
    root.classList.remove("dark");
  } else {
    // Dark mode — deep navy with logo gold/bronze
    root.style.setProperty("--bg",        "var(--theme-dark-bg)");
    root.style.setProperty("--surface",   "var(--theme-dark-surface)");
    root.style.setProperty("--surface2",  "var(--theme-dark-surface2)");
    root.style.setProperty("--border",    "var(--theme-dark-border)");
    root.style.setProperty("--text",      "var(--theme-dark-text)");
    root.style.setProperty("--text-dim",  "var(--theme-dark-text-dim)");
    root.style.setProperty("--gold",      "var(--theme-dark-gold)");
    root.style.setProperty("--gold-dim",  "var(--theme-dark-gold-dim)");
    root.style.setProperty("--gold-glow", "var(--theme-dark-gold-glow)");
    root.style.setProperty("--blue",      "var(--theme-dark-blue)");
    root.style.setProperty("--blue-dim",  "var(--theme-dark-blue-dim)");
    root.style.setProperty("--ice",       "var(--theme-dark-ice)");
    root.style.setProperty("--red",       "var(--theme-dark-red)");
    root.style.setProperty("--green",     "var(--theme-dark-green)");
    root.style.setProperty("--purple",    "var(--theme-dark-purple)");
    root.classList.add("dark");
    root.classList.remove("light");
  }
}

// Apply immediately on load — prevents FOUC
applyTheme(getInitialTheme(), false);

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),

  toggleTheme: () =>
    set((s) => {
      const next = s.theme === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next, true);
      return { theme: next };
    }),

  setTheme: (theme) => {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme, true);
    set({ theme });
  },
}));
