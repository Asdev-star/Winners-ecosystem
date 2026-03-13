import { Fragment } from "react";
import { Link } from "react-router-dom";

type LayerStatus = "live" | "active" | "building" | "planned";
type LayerKey = "core" | "community" | "academy" | "market" | "intelligence" | "work" | "cloud";

interface LayerConfig {
  key: LayerKey;
  label: string;
  shortLabel: string;
  href: string;
  status: LayerStatus;
}

interface ContextBarProps {
  activeLayer?: LayerKey;
  statusOverrides?: Partial<Record<LayerKey, LayerStatus>>;
  compact?: boolean;
  showLabels?: boolean;
}

const LAYERS: LayerConfig[] = [
  { key: "core",         label: "Core Engine",   shortLabel: "CORE",  href: "/dashboard",           status: "live"     },
  { key: "community",   label: "Community",      shortLabel: "COMM",  href: "/community",           status: "live"     },
  { key: "academy",     label: "Academy",        shortLabel: "ACAD",  href: "/academy",             status: "live"     },
  { key: "market",      label: "Market",         shortLabel: "MKT",   href: "/market",              status: "building" },
  { key: "intelligence",label: "Intelligence",   shortLabel: "INTEL", href: "/intelligence",        status: "live"     },
  { key: "work",        label: "Work",           shortLabel: "WORK",  href: "/work",                status: "building" },
  { key: "cloud",       label: "Cloud",          shortLabel: "CLOUD", href: "/cloud",               status: "building" },
];

export default function ContextBar({
  activeLayer,
  statusOverrides,
  compact = false,
  showLabels = true,
}: ContextBarProps) {
  const resolved = LAYERS.map((layer) => ({
    ...layer,
    status: statusOverrides?.[layer.key] ?? layer.status,
  }));

  return (
    <div className="ctx-wrap" aria-label="Ecosystem context">
      <style>{`
        .ctx-wrap {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
          margin-bottom: 20px;
        }

        .ctx-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 4px 10px;
          border: 1px solid var(--border);
          border-radius: 6px;
          font-family: "Space Mono", monospace;
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          text-decoration: none;
          color: var(--text-dim);
          transition: all 200ms ease;
          background: var(--surface);
          min-height: 24px;
        }

        .ctx-badge:hover {
          background: var(--surface2);
          color: var(--text);
        }

        .ctx-badge.current {
          border-color: color-mix(in srgb, var(--gold) 35%, var(--border));
          color: var(--text);
        }

        .ctx-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
          background: var(--text-dim);
        }

        .ctx-badge.live .ctx-dot {
          background: var(--green);
          box-shadow: 0 0 8px color-mix(in srgb, var(--green) 50%, transparent);
          animation: ctx-pulse 1600ms ease infinite;
        }

        .ctx-badge.active .ctx-dot {
          background: var(--gold);
        }

        .ctx-badge.building .ctx-dot {
          background: var(--ice);
        }

        .ctx-badge.planned .ctx-dot {
          background: var(--text-dim);
        }

        .ctx-sep {
          color: var(--text-dim);
          font-family: "Space Mono", monospace;
          font-size: 11px;
          user-select: none;
        }

        .ctx-label-mobile { display: none; }

        @keyframes ctx-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.65; transform: scale(1.2); }
        }

        @media (max-width: 680px) {
          .ctx-label-desktop { display: none; }
          .ctx-label-mobile { display: inline; }
          .ctx-badge {
            padding: 4px 8px;
            font-size: 8px;
            letter-spacing: 0.11em;
          }
          .ctx-wrap {
            gap: 4px;
          }
          .ctx-sep {
            font-size: 9px;
          }
        }
      `}</style>

      {resolved.map((layer, index) => (
        <Fragment key={layer.key}>
          <Link
            to={layer.href}
            className={`ctx-badge ${layer.status} ${activeLayer === layer.key ? "current" : ""}`}
            aria-current={activeLayer === layer.key ? "page" : undefined}
            title={layer.label}
          >
            <span className="ctx-dot" aria-hidden="true" />
            <span className="ctx-label-desktop">
              {showLabels ? layer.label : layer.shortLabel}
            </span>
            <span className="ctx-label-mobile">{compact || !showLabels ? layer.shortLabel : layer.label}</span>
          </Link>
          {index < resolved.length - 1 && <span className="ctx-sep" aria-hidden="true">&gt;</span>}
        </Fragment>
      ))}
    </div>
  );
}
