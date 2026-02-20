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

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),

  toggleTheme: () =>
    set((s) => {
      const next = s.theme === "dark" ? "light" : "dark";
      localStorage.setItem(THEME_KEY, next);
      applyTheme(next);
      return { theme: next };
    }),

  setTheme: (theme) => {
    localStorage.setItem(THEME_KEY, theme);
    applyTheme(theme);
    set({ theme });
  },
}));

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "light") {
    root.style.setProperty("--bg",       "#F4F6FA");
    root.style.setProperty("--surface",  "#FFFFFF");
    root.style.setProperty("--surface2", "#EDF0F7");
    root.style.setProperty("--border",   "#D8DEE9");
    root.style.setProperty("--text",     "#0F1923");
    root.style.setProperty("--text-dim", "#6B7A99");
    root.style.setProperty("--gold",     "#D4A800");
    root.classList.add("light");
    root.classList.remove("dark");
  } else {
    root.style.setProperty("--bg",       "#080B10");
    root.style.setProperty("--surface",  "#0D1117");
    root.style.setProperty("--surface2", "#141B24");
    root.style.setProperty("--border",   "#1E2A38");
    root.style.setProperty("--text",     "#E8EDF2");
    root.style.setProperty("--text-dim", "#5A6878");
    root.style.setProperty("--gold",     "#F5C842");
    root.classList.add("dark");
    root.classList.remove("light");
  }
}

// Initialize theme on load
applyTheme(getInitialTheme());