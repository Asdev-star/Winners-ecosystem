import type { CSSProperties, ReactNode } from "react";

type BadgeVariant = "layer" | "status" | "assistant" | "certificate" | "trust" | "plan";
type BadgeTone = "gold" | "blue" | "ice" | "green" | "purple" | "red" | "dim";

interface BadgeProps {
  label: string;
  icon?: ReactNode;
  variant?: BadgeVariant;
  tone?: BadgeTone;
  uppercase?: boolean;
  className?: string;
  style?: CSSProperties;
}

const toneColor: Record<BadgeTone, string> = {
  gold: "var(--gold)",
  blue: "var(--blue)",
  ice: "var(--ice)",
  green: "var(--green)",
  purple: "var(--purple)",
  red: "var(--red)",
  dim: "var(--text-dim)",
};

const variantDefaults: Record<BadgeVariant, BadgeTone> = {
  layer: "ice",
  status: "green",
  assistant: "purple",
  certificate: "gold",
  trust: "green",
  plan: "blue",
};

const variantFontSize: Record<BadgeVariant, number> = {
  layer: 8,
  status: 8,
  assistant: 8,
  certificate: 8,
  trust: 9,
  plan: 9,
};

export default function Badge({
  label,
  icon,
  variant = "status",
  tone,
  uppercase = true,
  className,
  style,
}: BadgeProps) {
  const resolvedTone = tone ?? variantDefaults[variant];
  const color = toneColor[resolvedTone];

  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontFamily: "'Space Mono', monospace",
        fontSize: variantFontSize[variant],
        letterSpacing: "0.12em",
        textTransform: uppercase ? "uppercase" : "none",
        borderRadius: 999,
        padding: variant === "trust" || variant === "plan" ? "4px 10px" : "3px 8px",
        color,
        border: `1px solid color-mix(in srgb, ${color} 28%, transparent)`,
        background: `color-mix(in srgb, ${color} 10%, transparent)`,
        lineHeight: 1.2,
        ...style,
      }}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{label}</span>
    </span>
  );
}

