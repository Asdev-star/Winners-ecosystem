// Level I — Design System Enforcement
// Component: StatusDot
// Animated pip: live | active | building | planned
// Used in ContextBar, layer cards, sidebar nav dots.

export type DotStatus = "live" | "active" | "building" | "planned";

interface StatusDotProps {
  status: DotStatus;
  size?: number;
  showLabel?: boolean;
  label?: string;
}

const STATUS_CONFIG: Record<
  DotStatus,
  { color: string; pulse: boolean; label: string }
> = {
  live:     { color: "var(--green)",    pulse: true,  label: "Live" },
  active:   { color: "var(--gold)",     pulse: false, label: "Active" },
  building: { color: "var(--ice)",      pulse: false, label: "Building" },
  planned:  { color: "var(--text-dim)", pulse: false, label: "Planned" },
};

const css = `
@keyframes dot-pulse {
  0%, 100% { opacity: 1;   transform: scale(1); }
  50%       { opacity: 0.4; transform: scale(1.3); }
}
.status-dot-pulse {
  animation: dot-pulse 2s ease infinite;
}
`;

export default function StatusDot({
  status,
  size = 8,
  showLabel = false,
  label,
}: StatusDotProps) {
  const config = STATUS_CONFIG[status];
  const displayLabel = label ?? config.label;

  return (
    <>
      <style>{css}</style>
      <span
        style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        title={displayLabel}
        aria-label={`Status: ${displayLabel}`}
      >
        <span
          className={config.pulse ? "status-dot-pulse" : undefined}
          style={{
            display: "inline-block",
            width: size,
            height: size,
            borderRadius: "50%",
            backgroundColor: config.color,
            flexShrink: 0,
          }}
        />
        {showLabel && (
          <span
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 9,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: config.color,
            }}
          >
            {displayLabel}
          </span>
        )}
      </span>
    </>
  );
}
