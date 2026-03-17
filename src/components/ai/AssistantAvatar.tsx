// Level III — Shared Component Architecture
// Component: AssistantAvatar
// Named assistant avatar — emoji + name + personality tagline.
// Use inside panels, cards, and attribution labels.

export type AssistantKey =
  | "aria" | "nova" | "sage" | "atlas"
  | "circuit" | "forge" | "nexus" | "herald" | "omega";

interface AvatarConfig {
  emoji: string;
  name: string;
  tagline: string;
  color: string;
  gradient: string;
}

const CONFIGS: Record<AssistantKey, AvatarConfig> = {
  omega:   { emoji: "🧠", name: "OMEGA",   tagline: "Master Orchestrator",       color: "var(--gold)",   gradient: "linear-gradient(135deg, var(--green), var(--gold), var(--purple))" },
  aria:    { emoji: "⬡",  name: "ARIA",    tagline: "Core Engine Supervisor",    color: "var(--gold)",   gradient: "linear-gradient(135deg, var(--gold), var(--gold-dim))" },
  nova:    { emoji: "👥", name: "NOVA",    tagline: "Community Intelligence",    color: "var(--ice)",    gradient: "linear-gradient(135deg, var(--ice), var(--blue))" },
  sage:    { emoji: "🎓", name: "SAGE",    tagline: "Academy Tutor",             color: "var(--green)",  gradient: "linear-gradient(135deg, var(--green), var(--blue))" },
  atlas:   { emoji: "🛒", name: "ATLAS",   tagline: "Market Analyst",            color: "var(--gold)",   gradient: "linear-gradient(135deg, var(--gold), var(--red))" },
  circuit: { emoji: "💼", name: "CIRCUIT", tagline: "Work Matchmaker",           color: "var(--blue)",   gradient: "linear-gradient(135deg, var(--blue), var(--ice))" },
  forge:   { emoji: "🤖", name: "FORGE",   tagline: "Intelligence Optimizer",    color: "var(--purple)", gradient: "linear-gradient(135deg, var(--purple), var(--gold))" },
  nexus:   { emoji: "☁️", name: "NEXUS",   tagline: "Cloud Developer",           color: "var(--ice)",    gradient: "linear-gradient(135deg, var(--ice), var(--blue))" },
  herald:  { emoji: "🧬", name: "HERALD",  tagline: "AI Platform Manager",       color: "var(--purple)", gradient: "linear-gradient(135deg, var(--purple), var(--green))" },
};

interface AssistantAvatarProps {
  assistant: AssistantKey;
  size?: "sm" | "md" | "lg";
  showName?: boolean;
  showTagline?: boolean;
  orientation?: "horizontal" | "vertical";
}

const SIZE_MAP = {
  sm: { ring: 28, emoji: 14, namePx: 12, taglinePx: 8 },
  md: { ring: 40, emoji: 20, namePx: 14, taglinePx: 9 },
  lg: { ring: 56, emoji: 28, namePx: 18, taglinePx: 10 },
};

export default function AssistantAvatar({
  assistant,
  size = "md",
  showName = true,
  showTagline = false,
  orientation = "horizontal",
}: AssistantAvatarProps) {
  const cfg = CONFIGS[assistant];
  const sz = SIZE_MAP[size];

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: orientation === "horizontal" ? "center" : "flex-start",
        flexDirection: orientation === "horizontal" ? "row" : "column",
        gap: orientation === "horizontal" ? 8 : 4,
      }}
    >
      {/* Ring */}
      <span
        style={{
          width: sz.ring,
          height: sz.ring,
          borderRadius: "50%",
          background: cfg.gradient,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: sz.emoji,
          flexShrink: 0,
        }}
        aria-label={cfg.name}
      >
        {cfg.emoji}
      </span>

      {/* Text */}
      {(showName || showTagline) && (
        <span style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {showName && (
            <span
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: sz.namePx,
                fontWeight: 700,
                color: cfg.color,
                lineHeight: 1.2,
              }}
            >
              {cfg.name}
            </span>
          )}
          {showTagline && (
            <span
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: sz.taglinePx,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--text-dim)",
              }}
            >
              {cfg.tagline}
            </span>
          )}
        </span>
      )}
    </span>
  );
}

export { CONFIGS as ASSISTANT_CONFIGS };
export type { AvatarConfig };
