export const colors = {
  gold: "#C9A84C",
  blue: "#2B5F8E",
  ice: "#89C4E1",
  green: "#2DD4A0",
  red: "#E05A4E",
  purple: "#9B6FFF",
  bg: "#122033",
  surface: "#1A2A3D",
  surface2: "#223449",
  surface3: "#2B4460",
  border: "#3A5673",
  text: "#F4F8FC",
  textDim: "#A6BCCE",
} as const;

const colorChannels: Record<keyof typeof colors, string> = {
  gold: "201, 168, 76",
  blue: "43, 95, 142",
  ice: "137, 196, 225",
  green: "45, 212, 160",
  red: "224, 90, 78",
  purple: "155, 111, 255",
  bg: "18, 32, 51",
  surface: "26, 42, 61",
  surface2: "34, 52, 73",
  surface3: "43, 68, 96",
  border: "58, 86, 115",
  text: "244, 248, 252",
  textDim: "166, 188, 206",
};

export function withAlpha(color: keyof typeof colors, alpha: number) {
  return `rgba(${colorChannels[color]}, ${alpha})`;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 4,
  md: 6,
  lg: 12,
  xl: 20,
  full: 999,
} as const;

export const typography = {
  displayLg: { fontSize: 32, fontWeight: "700" as const, letterSpacing: -0.5 },
  displayMd: { fontSize: 24, fontWeight: "700" as const, letterSpacing: -0.3 },
  displaySm: { fontSize: 20, fontWeight: "700" as const },
  bodyLg: { fontSize: 16, fontWeight: "400" as const, lineHeight: 26 },
  bodyMd: { fontSize: 14, fontWeight: "400" as const, lineHeight: 22 },
  bodySm: { fontSize: 12, fontWeight: "400" as const, lineHeight: 18 },
  labelLg: { fontSize: 11, fontWeight: "700" as const, letterSpacing: 1.2, textTransform: "uppercase" as const },
  labelMd: { fontSize: 9, fontWeight: "700" as const, letterSpacing: 1, textTransform: "uppercase" as const },
  labelSm: { fontSize: 8, fontWeight: "700" as const, letterSpacing: 0.8, textTransform: "uppercase" as const },
} as const;

export const touch = {
  minimum: 44,
  comfortable: 52,
  large: 60,
} as const;
