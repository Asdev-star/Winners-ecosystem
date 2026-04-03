export type LayerId =
  | "core"
  | "community"
  | "academy"
  | "market"
  | "work"
  | "ai"
  | "finance";

export type LayerConfig = {
  id: LayerId;
  label: string;
  routePrefixes: string[];
  accent: string;
  accentSoft: string;
  accentAlt: string;
};

export const LAYERS: LayerConfig[] = [
  {
    id: "core",
    label: "Core Engine",
    routePrefixes: ["/", "/landing", "/home", "/dashboard", "/search", "/activity", "/team", "/settings", "/profile", "/notifications"],
    accent: "var(--layer-core-accent, var(--gold))",
    accentSoft: "color-mix(in srgb, var(--layer-core-accent, var(--gold)) 16%, transparent)",
    accentAlt: "var(--layer-core-accent-alt, var(--ice))",
  },
  {
    id: "community",
    label: "Community",
    routePrefixes: ["/community"],
    accent: "var(--layer-community-accent, var(--ice))",
    accentSoft: "color-mix(in srgb, var(--layer-community-accent, var(--ice)) 18%, transparent)",
    accentAlt: "var(--layer-community-accent-alt, var(--green))",
  },
  {
    id: "academy",
    label: "Academy",
    routePrefixes: ["/academy", "/courses"],
    accent: "var(--layer-academy-accent, var(--gold))",
    accentSoft: "color-mix(in srgb, var(--layer-academy-accent, var(--gold)) 18%, transparent)",
    accentAlt: "color-mix(in srgb, var(--layer-academy-accent, var(--gold)) 75%, var(--layer-academy-accent-alt, var(--ice)) 25%)",
  },
  {
    id: "market",
    label: "Market",
    routePrefixes: ["/shop", "/market"],
    accent: "var(--layer-market-accent, var(--purple))",
    accentSoft: "color-mix(in srgb, var(--layer-market-accent, var(--purple)) 18%, transparent)",
    accentAlt: "var(--layer-market-accent-alt, var(--ice))",
  },
  {
    id: "work",
    label: "Work",
    routePrefixes: ["/freelance", "/work"],
    accent: "var(--layer-work-accent, var(--blue))",
    accentSoft: "color-mix(in srgb, var(--layer-work-accent, var(--blue)) 20%, transparent)",
    accentAlt: "var(--layer-work-accent-alt, var(--ice))",
  },
  {
    id: "ai",
    label: "AI",
    routePrefixes: ["/ai", "/ai-assistant"],
    accent: "var(--layer-ai-accent, var(--ice))",
    accentSoft: "color-mix(in srgb, var(--layer-ai-accent, var(--ice)) 22%, transparent)",
    accentAlt: "var(--layer-ai-accent-alt, var(--purple))",
  },
  {
    id: "finance",
    label: "Finance",
    routePrefixes: ["/billing", "/stripe", "/referral"],
    accent: "var(--layer-finance-accent, var(--green))",
    accentSoft: "color-mix(in srgb, var(--layer-finance-accent, var(--green)) 18%, transparent)",
    accentAlt: "var(--layer-finance-accent-alt, var(--gold))",
  },
];

export function resolveLayerFromPath(pathname: string): LayerConfig {
  // prefer longest prefix match so deep routes map correctly
  const candidates = LAYERS.flatMap((layer) =>
    layer.routePrefixes.map((prefix) => ({ layer, prefix })),
  )
    .filter(({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    .sort((a, b) => b.prefix.length - a.prefix.length);

  return candidates[0]?.layer ?? LAYERS[0];
}

