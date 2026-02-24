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
    routePrefixes: ["/", "/landing", "/dashboard", "/search", "/activity", "/team", "/settings", "/profile", "/notifications"],
    accent: "#C9A84C",
    accentSoft: "rgba(201,168,76,0.16)",
    accentAlt: "#89C4E1",
  },
  {
    id: "community",
    label: "Community",
    routePrefixes: ["/community"],
    accent: "#89C4E1",
    accentSoft: "rgba(137,196,225,0.18)",
    accentAlt: "#2DD4A0",
  },
  {
    id: "academy",
    label: "Academy",
    routePrefixes: ["/academy", "/courses"],
    accent: "#C9A84C",
    accentSoft: "rgba(201,168,76,0.18)",
    accentAlt: "#E8C97A",
  },
  {
    id: "market",
    label: "Market",
    routePrefixes: ["/shop", "/market"],
    accent: "#9B6FFF",
    accentSoft: "rgba(155,111,255,0.18)",
    accentAlt: "#89C4E1",
  },
  {
    id: "work",
    label: "Work",
    routePrefixes: ["/freelance", "/work"],
    accent: "#2B5F8E",
    accentSoft: "rgba(43,95,142,0.2)",
    accentAlt: "#89C4E1",
  },
  {
    id: "ai",
    label: "AI",
    routePrefixes: ["/ai", "/ai-assistant"],
    accent: "#89C4E1",
    accentSoft: "rgba(137,196,225,0.22)",
    accentAlt: "#9B6FFF",
  },
  {
    id: "finance",
    label: "Finance",
    routePrefixes: ["/billing", "/stripe", "/referral"],
    accent: "#2DD4A0",
    accentSoft: "rgba(45,212,160,0.18)",
    accentAlt: "#C9A84C",
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

