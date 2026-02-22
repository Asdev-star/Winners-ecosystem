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
    root.style.setProperty("--bg",        "#EEF2F7");
    root.style.setProperty("--surface",   "#FFFFFF");
    root.style.setProperty("--surface2",  "#E4EBF4");
    root.style.setProperty("--border",    "#C2D0E0");
    root.style.setProperty("--text",      "#1A2B3C");
    root.style.setProperty("--text-dim",  "#5A7A96");
    root.style.setProperty("--gold",      "#B8912A");
    root.style.setProperty("--gold-dim",  "rgba(184,145,42,0.12)");
    root.style.setProperty("--gold-glow", "rgba(184,145,42,0.25)");
    root.style.setProperty("--blue",      "#2B5F8E");
    root.style.setProperty("--blue-dim",  "rgba(43,95,142,0.12)");
    root.style.setProperty("--ice",       "#89C4E1");
    root.style.setProperty("--red",       "#C0392B");
    root.style.setProperty("--green",     "#1A7A5E");
    root.style.setProperty("--purple",    "#6B4FA0");
    root.classList.add("light");
    root.classList.remove("dark");
  } else {
    // Dark mode — deep navy with logo gold/bronze
    root.style.setProperty("--bg",        "#0D1520");
    root.style.setProperty("--surface",   "#111D2E");
    root.style.setProperty("--surface2",  "#172335");
    root.style.setProperty("--border",    "#1E3248");
    root.style.setProperty("--text",      "#E8EEF5");
    root.style.setProperty("--text-dim",  "#5A7A96");
    root.style.setProperty("--gold",      "#C9A84C");
    root.style.setProperty("--gold-dim",  "rgba(201,168,76,0.12)");
    root.style.setProperty("--gold-glow", "rgba(201,168,76,0.25)");
    root.style.setProperty("--blue",      "#2B5F8E");
    root.style.setProperty("--blue-dim",  "rgba(43,95,142,0.15)");
    root.style.setProperty("--ice",       "#89C4E1");
    root.style.setProperty("--red",       "#E05A4E");
    root.style.setProperty("--green",     "#2DD4A0");
    root.style.setProperty("--purple",    "#9B6FFF");
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