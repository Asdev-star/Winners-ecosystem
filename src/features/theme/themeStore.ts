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

  // Smooth transition on toggle, instant on initial load
  if (animate) {
    root.style.setProperty("transition", "background-color 0.25s ease, color 0.25s ease, border-color 0.25s ease");
    setTimeout(() => root.style.removeProperty("transition"), 300);
  }

  if (theme === "light") {
    root.style.setProperty("--bg",        "#F4F6FA");
    root.style.setProperty("--surface",   "#FFFFFF");
    root.style.setProperty("--surface2",  "#EDF0F7");
    root.style.setProperty("--border",    "#D8DEE9");
    root.style.setProperty("--text",      "#0F1923");
    root.style.setProperty("--text-dim",  "#6B7A99");
    root.style.setProperty("--gold",      "#C9960A");
    root.style.setProperty("--gold-dim",  "rgba(201,150,10,0.12)");
    root.style.setProperty("--gold-glow", "rgba(201,150,10,0.25)");
    root.style.setProperty("--red",       "#E53E5A");
    root.style.setProperty("--green",     "#1A9E78");
    root.style.setProperty("--blue",      "#2979D4");
    root.style.setProperty("--purple",    "#7B4FD4");
    root.classList.add("light");
    root.classList.remove("dark");
  } else {
    root.style.setProperty("--bg",        "#080B10");
    root.style.setProperty("--surface",   "#0D1117");
    root.style.setProperty("--surface2",  "#141B24");
    root.style.setProperty("--border",    "#1E2A38");
    root.style.setProperty("--text",      "#E8EDF2");
    root.style.setProperty("--text-dim",  "#5A6878");
    root.style.setProperty("--gold",      "#F5C842");
    root.style.setProperty("--gold-dim",  "rgba(245,200,66,0.12)");
    root.style.setProperty("--gold-glow", "rgba(245,200,66,0.25)");
    root.style.setProperty("--red",       "#FF5975");
    root.style.setProperty("--green",     "#2DD4A0");
    root.style.setProperty("--blue",      "#4A9EFF");
    root.style.setProperty("--purple",    "#9B6FFF");
    root.classList.add("dark");
    root.classList.remove("light");
  }
}

// Apply theme immediately on module load — prevents FOUC
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