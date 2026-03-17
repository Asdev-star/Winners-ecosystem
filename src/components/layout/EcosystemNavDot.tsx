// Level III — Shared Component Architecture
// Component: EcosystemNavDot
// Individual layer dot used in ContextBar and sidebar nav.
// Encapsulates status color, pulse animation, and tooltip.

import { Link } from "react-router-dom";

export type DotStatus = "live" | "active" | "building" | "planned";

export interface EcosystemLayer {
  key: string;
  label: string;
  shortLabel: string;
  href: string;
  emoji: string;
  status: DotStatus;
}

interface EcosystemNavDotProps {
  layer: EcosystemLayer;
  isActive?: boolean;
  showLabel?: boolean;
  compact?: boolean;
  as?: "link" | "div";
  onClick?: () => void;
}

const STATUS_COLOR: Record<DotStatus, string> = {
  live:     "var(--green)",
  active:   "var(--gold)",
  building: "var(--ice)",
  planned:  "var(--text-dim)",
};

const STATUS_LABEL: Record<DotStatus, string> = {
  live:     "Live",
  active:   "Active",
  building: "Building",
  planned:  "Planned",
};

const css = `
@keyframes ecosys-dot-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.5; transform: scale(1.35); }
}

.ecosys-nav-dot {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface);
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-dim);
  text-decoration: none;
  transition: all 200ms ease;
  cursor: pointer;
  min-height: 28px;
  white-space: nowrap;
  position: relative;
}

.ecosys-nav-dot:hover {
  background: var(--surface2);
  border-color: var(--border2, var(--border));
  color: var(--text);
}

.ecosys-nav-dot.is-active {
  border-color: color-mix(in srgb, var(--gold) 30%, var(--border));
  color: var(--text);
  background: color-mix(in srgb, var(--gold) 5%, var(--surface));
}

.ecosys-nav-dot__pip {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-block;
}

.ecosys-nav-dot__pip.live {
  background: var(--green);
  box-shadow: 0 0 6px color-mix(in srgb, var(--green) 60%, transparent);
  animation: ecosys-dot-pulse 1800ms ease infinite;
}

.ecosys-nav-dot__pip.active {
  background: var(--gold);
}

.ecosys-nav-dot__pip.building {
  background: var(--ice);
}

.ecosys-nav-dot__pip.planned {
  background: var(--text-dim);
}

/* Status tooltip on hover */
.ecosys-nav-dot__status {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: var(--surface3);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 8px;
  letter-spacing: 0.1em;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 150ms ease;
  z-index: 50;
}

.ecosys-nav-dot:hover .ecosys-nav-dot__status {
  opacity: 1;
}

/* Compact: dot-only, no label */
.ecosys-nav-dot.compact {
  padding: 4px 6px;
  gap: 0;
  min-width: 20px;
  min-height: 20px;
  justify-content: center;
  border-radius: 50%;
}
`;

export default function EcosystemNavDot({
  layer,
  isActive = false,
  showLabel = true,
  compact = false,
  as = "link",
  onClick,
}: EcosystemNavDotProps) {
  const color = STATUS_COLOR[layer.status];
  const statusLabel = STATUS_LABEL[layer.status];

  const classNames = [
    "ecosys-nav-dot",
    isActive ? "is-active" : "",
    compact ? "compact" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const inner = (
    <>
      <span
        className={`ecosys-nav-dot__pip ${layer.status}`}
        aria-hidden="true"
        style={{ background: layer.status === "live" ? undefined : color } as React.CSSProperties}
      />
      {!compact && showLabel && (
        <span>{layer.shortLabel}</span>
      )}
      {compact && (
        <span
          className="ecosys-nav-dot__status"
          style={{ color } as React.CSSProperties}
        >
          {layer.label} · {statusLabel}
        </span>
      )}
      {!compact && (
        <span
          className="ecosys-nav-dot__status"
          style={{ color } as React.CSSProperties}
        >
          {statusLabel}
        </span>
      )}
    </>
  );

  return (
    <>
      <style>{css}</style>
      {as === "link" ? (
        <Link
          to={layer.href}
          className={classNames}
          aria-label={`${layer.label} — ${statusLabel}`}
          aria-current={isActive ? "page" : undefined}
          onClick={onClick}
          title={compact ? layer.label : undefined}
        >
          {inner}
        </Link>
      ) : (
        <div
          className={classNames}
          role={onClick ? "button" : undefined}
          tabIndex={onClick ? 0 : undefined}
          aria-label={`${layer.label} — ${statusLabel}`}
          onClick={onClick}
          onKeyDown={(e) => e.key === "Enter" && onClick?.()}
          title={compact ? layer.label : undefined}
        >
          {inner}
        </div>
      )}
    </>
  );
}

export { STATUS_COLOR, STATUS_LABEL };
