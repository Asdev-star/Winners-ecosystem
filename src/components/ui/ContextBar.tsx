// Level I - Design System Enforcement
// Component: ContextBar
// Required on every authenticated page - shows live ecosystem status

interface LayerStatus {
  key: string;
  label: string;
  emoji: string;
  status: "live" | "active" | "building" | "planned";
  href?: string;
}

interface ContextBarProps {
  activeLayer?: string;
  showLabels?: boolean;
}

const LAYERS: LayerStatus[] = [
  { key: "core", label: "Core Engine", emoji: "⬡", status: "live", href: "/dashboard" },
  { key: "community", label: "Community", emoji: "👥", status: "active", href: "/community" },
  { key: "academy", label: "Academy", emoji: "🎓", status: "active", href: "/academy" },
  { key: "market", label: "Market", emoji: "🛒", status: "planned", href: "/market" },
  { key: "intelligence", label: "Intelligence", emoji: "🤖", status: "active", href: "/intelligence" },
  { key: "work", label: "Work", emoji: "💼", status: "planned", href: "/work" },
];

export default function ContextBar({ activeLayer, showLabels = true }: ContextBarProps) {
  return (
    <div className="eco-bar" role="navigation" aria-label="Ecosystem platforms">
      {LAYERS.map((layer, index) => (
        <a
          key={layer.key}
          href={layer.href}
          className={`eco-bar-item ${layer.status} ${activeLayer === layer.key ? "current" : ""}`}
          aria-current={activeLayer === layer.key ? "page" : undefined}
        >
          <span className="dot" />
          {showLabels && (
            <>
              <span className="layer-emoji">{layer.emoji}</span>
              <span className="layer-label">{layer.label}</span>
            </>
          )}
        </a>
      ))}
      
      <style>{`
        .eco-bar {
          display: flex;
          align-items: center;
          gap: 0;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 0;
          overflow: hidden;
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 28px;
        }

        .eco-bar-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 10px 14px;
          border-right: 1px solid var(--border);
          color: var(--text-dim);
          white-space: nowrap;
          transition: all 0.15s ease;
          flex: 1;
          justify-content: center;
          text-decoration: none;
          position: relative;
        }

        .eco-bar-item:last-child {
          border-right: none;
        }

        .eco-bar-item:hover {
          background: var(--surface2);
          color: var(--text);
        }

        .eco-bar-item.current {
          background: rgba(155, 111, 255, 0.08);
        }

        .eco-bar-item .dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--text-faint);
          flex-shrink: 0;
          transition: all 0.2s ease;
        }

        .eco-bar-item.live .dot {
          background: var(--green);
          box-shadow: 0 0 6px rgba(45, 212, 160, 0.6);
          animation: pulse-dot 2s ease-in-out infinite;
        }

        .eco-bar-item.active .dot {
          background: var(--gold);
          box-shadow: 0 0 6px rgba(240, 180, 41, 0.6);
          animation: pulse-dot 2s ease-in-out infinite;
        }

        .eco-bar-item.building .dot {
          background: var(--ice);
          box-shadow: 0 0 6px rgba(137, 196, 225, 0.6);
          animation: pulse-dot 2s 0.5s ease-in-out infinite;
        }

        .eco-bar-item.planned .dot {
          background: var(--text-faint);
        }

        .eco-bar-item.live {
          color: var(--green);
        }

        .eco-bar-item.active {
          color: var(--gold);
        }

        .eco-bar-item.building {
          color: var(--ice);
        }

        .layer-emoji {
          font-size: 12px;
          line-height: 1;
        }

        .layer-label {
          font-size: 9px;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }

        @media (max-width: 768px) {
          .eco-bar {
            flex-wrap: wrap;
            gap: 1px;
          }

          .eco-bar-item {
            flex: 1 1 calc(33.333% - 1px);
            min-width: 80px;
            padding: 8px 6px;
          }

          .eco-bar-item:nth-child(3n) {
            border-right: none;
          }

          .layer-label {
            display: none;
          }

          .layer-emoji {
            font-size: 16px;
          }
        }

        @media (max-width: 480px) {
          .eco-bar-item {
            flex: 1 1 50%;
          }

          .eco-bar-item:nth-child(2n) {
            border-right: none;
          }
        }
      `}</style>
    </div>
  );
}
