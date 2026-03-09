import type { CSSProperties, ElementType, ReactNode } from "react";

type CardAccent = "gold" | "blue" | "ice" | "green" | "purple" | "red" | "omega" | "none";

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  accent?: CardAccent;
  ai?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  className?: string;
  style?: CSSProperties;
  as?: ElementType;
  onClick?: () => void;
}

const accentGradient: Record<Exclude<CardAccent, "none">, string> = {
  gold: "linear-gradient(90deg, var(--gold), transparent)",
  blue: "linear-gradient(90deg, var(--blue), transparent)",
  ice: "linear-gradient(90deg, var(--ice), transparent)",
  green: "linear-gradient(90deg, var(--green), transparent)",
  purple: "linear-gradient(90deg, var(--purple), transparent)",
  red: "linear-gradient(90deg, var(--red), transparent)",
  omega: "linear-gradient(90deg, var(--green), var(--gold), transparent)",
};

const baseStyle: CSSProperties = {
  position: "relative",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 6,
  overflow: "hidden",
  transition: "all 200ms ease",
};

const headerTitleStyle: CSSProperties = {
  fontSize: 14,
  fontWeight: 700,
  color: "var(--text)",
  marginBottom: 4,
  lineHeight: 1.3,
};

const headerSubtitleStyle: CSSProperties = {
  fontFamily: "'Space Mono', monospace",
  fontSize: 9,
  letterSpacing: "0.08em",
  color: "var(--text-dim)",
};

export default function Card({
  children,
  title,
  subtitle,
  accent = "gold",
  ai = false,
  hoverable = false,
  compact = false,
  className,
  style,
  as,
  onClick,
}: CardProps) {
  const Component = as ?? "section";

  return (
    <Component
      className={className}
      onClick={onClick}
      style={{
        ...baseStyle,
        cursor: onClick ? "pointer" : "default",
        ...(hoverable ? { background: "var(--surface)", borderColor: "var(--border)" } : {}),
        ...style,
      }}
    >
      {accent !== "none" && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: accentGradient[accent],
          }}
        />
      )}

      {ai && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            bottom: 0,
            width: 2,
            background: "var(--purple)",
            opacity: 0.9,
          }}
        />
      )}

      {(title || subtitle) && (
        <header
          style={{
            padding: compact ? "14px 16px 12px" : "20px 24px 16px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          {title && <div style={headerTitleStyle}>{title}</div>}
          {subtitle && <div style={headerSubtitleStyle}>{subtitle}</div>}
        </header>
      )}

      <div style={{ padding: compact ? "16px" : "24px" }}>{children}</div>
    </Component>
  );
}

