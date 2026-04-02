import type { CSSProperties, ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  actionSlot?: ReactNode;
  align?: "left" | "center";
  maxWidth?: number | string;
  style?: CSSProperties;
}

const rootBase: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
  flexWrap: "wrap",
  marginBottom: 24,
};

const eyebrowStyle: CSSProperties = {
  fontFamily: "'Space Mono', monospace",
  fontSize: 9,
  letterSpacing: "0.22em",
  textTransform: "uppercase",
  color: "var(--gold)",
  marginBottom: 8,
};

const titleStyle: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: "clamp(30px, 4.5vw, 52px)",
  fontWeight: 800,
  letterSpacing: "-0.04em",
  color: "var(--text)",
  margin: 0,
  lineHeight: 1.05,
};

const subtitleStyle: CSSProperties = {
  fontFamily: "'Syne', sans-serif",
  fontSize: 14,
  lineHeight: 1.5,
  color: "var(--text-dim)",
  marginTop: 10,
};

export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  actionSlot,
  align = "left",
  maxWidth = 1280,
  style,
}: PageHeaderProps) {
  const textAlign = align === "center" ? "center" : "left";

  return (
    <header
      style={{
        ...rootBase,
        maxWidth,
        marginLeft: "auto",
        marginRight: "auto",
        ...style,
      }}
    >
      <div style={{ flex: 1, minWidth: 260, textAlign }}>
        {eyebrow && <div style={eyebrowStyle}>{eyebrow}</div>}
        <h1 style={titleStyle}>{title}</h1>
        {subtitle && <p style={subtitleStyle}>{subtitle}</p>}
      </div>
      {actionSlot && <div style={{ marginLeft: align === "center" ? 0 : "auto" }}>{actionSlot}</div>}
    </header>
  );
}

