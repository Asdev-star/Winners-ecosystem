// src/features/theme/themeStore.ts

import { create } from "zustand";

type Theme = "dark" | "light";

type RuntimeThemeTokens = {
  brandColor?: string;
  accentColor?: string;
  defaultTheme?: "light" | "dark" | "auto";
  palette?: Partial<{
    gold: string;
    blue: string;
    ice: string;
    green: string;
    red: string;
    purple: string;
    bg: string;
    surface: string;
    surface2: string;
    border: string;
    text: string;
    textDim: string;
  }>;
  typography?: Partial<{
    heading: string;
    display: string;
    mono: string;
    body: string;
    scale: number;
  }>;
  card?: Partial<{
    borderRadius: number;
    topBorderWidth: number;
    topBorderStyle: "gradient" | "solid" | "none";
    shadowIntensity: "none" | "subtle" | "medium" | "strong";
  }>;
  density?: "compact" | "comfortable" | "spacious";
  animation?: Partial<{
    reducedMotion: boolean;
    speed: number;
  }>;
  layerAccentOverrides?: Array<{ layerId: string; accentColor: string }>;
};

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

let currentTheme: Theme = getInitialTheme();
let runtimeThemeTokens: RuntimeThemeTokens | null = null;

export function applyTheme(theme: Theme, animate = true) {
  currentTheme = theme;
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

  if (runtimeThemeTokens) {
    applyRuntimeThemeTokens(root, runtimeThemeTokens);
  }
}

function applyRuntimeThemeTokens(root: HTMLElement, tokens: RuntimeThemeTokens) {
  const palette = tokens.palette ?? {};

  const colorMap: Array<[string, string | undefined]> = [
    ["--gold", tokens.brandColor ?? palette.gold],
    ["--blue", palette.blue],
    ["--ice", tokens.accentColor ?? palette.ice],
    ["--green", palette.green],
    ["--red", palette.red],
    ["--purple", palette.purple],
    ["--bg", palette.bg],
    ["--surface", palette.surface],
    ["--surface2", palette.surface2],
    ["--border", palette.border],
    ["--text", palette.text],
    ["--text-dim", palette.textDim],
  ];

  for (const [name, value] of colorMap) {
    if (value) {
      root.style.setProperty(name, value);
    }
  }

  const typography = tokens.typography ?? {};
  if (typography.heading) root.style.setProperty("--font-heading", typography.heading);
  if (typography.display) root.style.setProperty("--font-display", typography.display);
  if (typography.mono) root.style.setProperty("--font-mono", typography.mono);
  if (typography.body) root.style.setProperty("--font-body", typography.body);
  if (typeof typography.scale === "number") root.style.setProperty("--font-scale", String(typography.scale));

  const card = tokens.card ?? {};
  if (typeof card.borderRadius === "number") root.style.setProperty("--card-radius", `${card.borderRadius}px`);
  if (typeof card.topBorderWidth === "number") root.style.setProperty("--card-top-border-width", `${card.topBorderWidth}px`);
  if (card.topBorderStyle) root.style.setProperty("--card-top-border-style", card.topBorderStyle);
  if (card.shadowIntensity) root.style.setProperty("--card-shadow-intensity", card.shadowIntensity);

  if (tokens.density) {
    root.style.setProperty("--density", tokens.density);
  }

  if (tokens.animation) {
    if (typeof tokens.animation.speed === "number") {
      root.style.setProperty("--animation-speed", String(tokens.animation.speed));
    }
    if (typeof tokens.animation.reducedMotion === "boolean") {
      root.style.setProperty("--reduced-motion", String(tokens.animation.reducedMotion));
    }
  }

  if (tokens.layerAccentOverrides?.length) {
    for (const layer of tokens.layerAccentOverrides) {
      if (layer.layerId && layer.accentColor) {
        root.style.setProperty(`--layer-${layer.layerId}-accent`, layer.accentColor);
      }
    }
  }
}

export function applyRuntimeTheme(tokens: RuntimeThemeTokens | null, animate = false) {
  runtimeThemeTokens = tokens;
  applyTheme(currentTheme, animate);
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
