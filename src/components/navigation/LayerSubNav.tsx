import type { CSSProperties } from "react";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { LayerSubNavConfig, LayerSubNavItem } from "./layerSubNavConfigs";

const css = `
  .lsn-wrap {
    position: sticky;
    top: 0;
    z-index: 24;
    margin: 0 0 14px;
  }

  .lsn-shell {
    display: flex;
    align-items: center;
    gap: 10px;
    border: 1px solid var(--border);
    border-radius: var(--card-radius, 16px);
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    backdrop-filter: blur(14px);
    -webkit-backdrop-filter: blur(14px);
    box-shadow: 0 8px 28px rgba(0, 0, 0, 0.22);
    padding: 8px;
  }

  .lsn-scroll-wrap {
    position: relative;
    flex: 1;
    min-width: 0;
  }

  .lsn-scroll {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
  }

  .lsn-item {
    border: 1px solid transparent;
    background: transparent;
    color: var(--text-dim);
    border-radius: var(--card-radius, 12px);
    padding: 8px 12px 8px 18px;
    font-family: var(--font-mono), "Space Mono", monospace;
    font-size: 10px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all 0.16s ease;
    position: relative;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .lsn-item:hover {
    border-color: var(--border);
    color: var(--text);
    background: var(--surface2);
  }

  .lsn-item.active {
    color: var(--text);
    border-color: color-mix(in srgb, var(--lsn-accent) 40%, var(--border));
    background: color-mix(in srgb, var(--lsn-accent) 18%, transparent);
  }

  .lsn-item.active::before {
    content: "";
    position: absolute;
    left: 8px;
    top: 50%;
    transform: translateY(-50%);
    width: 6px;
    height: 6px;
    border-radius: 999px;
    background: var(--lsn-accent);
    box-shadow: 0 0 12px var(--lsn-accent);
  }

  .lsn-item.disabled {
    opacity: 0.52;
    cursor: not-allowed;
  }

  .lsn-badge {
    border-radius: var(--card-radius, 999px);
    font-size: 9px;
    line-height: 1;
    padding: 3px 6px;
    border: 1px solid var(--border);
  }

  .lsn-badge.neutral {
    color: var(--text-dim);
    background: color-mix(in srgb, var(--surface2) 75%, transparent);
  }

  .lsn-badge.info {
    color: var(--ice);
    border-color: color-mix(in srgb, var(--ice) 25%, var(--border));
    background: color-mix(in srgb, var(--ice) 16%, transparent);
  }

  .lsn-badge.positive {
    color: var(--green);
    border-color: color-mix(in srgb, var(--green) 25%, var(--border));
    background: color-mix(in srgb, var(--green) 16%, transparent);
  }

  .lsn-badge.attention {
    color: var(--gold);
    border-color: color-mix(in srgb, var(--gold) 30%, var(--border));
    background: color-mix(in srgb, var(--gold) 16%, transparent);
  }

  .lsn-smart {
    min-width: 236px;
    border: 1px solid color-mix(in srgb, var(--lsn-accent) 35%, var(--border));
    border-radius: var(--card-radius, 16px);
    background: color-mix(in srgb, var(--lsn-accent) 14%, var(--surface));
    color: var(--text);
    padding: 7px 10px;
    cursor: pointer;
    transition: all 0.16s ease;
    text-align: left;
    flex-shrink: 0;
  }

  .lsn-smart:hover {
    border-color: var(--lsn-accent);
    transform: translateY(-1px);
    box-shadow: 0 5px 14px rgba(0, 0, 0, 0.22);
  }

  .lsn-smart-label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: var(--font-mono), "Space Mono", monospace;
    text-transform: uppercase;
    font-size: 10px;
    letter-spacing: 0.08em;
  }

  .lsn-smart-dot {
    width: 7px;
    height: 7px;
    border-radius: 999px;
    background: var(--lsn-accent);
    box-shadow: 0 0 10px var(--lsn-accent);
    flex-shrink: 0;
  }

  .lsn-smart-hint {
    margin-top: 4px;
    color: var(--text-dim);
    font-size: 11px;
    font-family: var(--font-body), "Syne", sans-serif;
    letter-spacing: 0.01em;
  }

  .lsn-subrow {
    margin-top: 8px;
    border: 1px solid var(--border);
    border-radius: var(--card-radius, 14px);
    background: color-mix(in srgb, var(--surface2) 80%, transparent);
    padding: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
    flex-wrap: wrap;
  }

  .lsn-subitem {
    border: 1px solid transparent;
    border-radius: var(--card-radius, 999px);
    background: transparent;
    color: var(--text-dim);
    padding: 7px 9px;
    font-family: var(--font-mono), "Space Mono", monospace;
    font-size: 9px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
  }

  .lsn-subitem:hover {
    border-color: var(--border);
    color: var(--text);
  }

  .lsn-subitem.active {
    color: var(--text);
    border-color: color-mix(in srgb, var(--lsn-accent) 40%, var(--border));
    background: color-mix(in srgb, var(--lsn-accent) 18%, transparent);
  }

  .lsn-mobile-smart {
    display: none;
  }

  .lsn-fade {
    display: none;
  }

  @media (max-width: 768px) {
    .lsn-shell {
      gap: 8px;
      padding: 6px;
    }

    .lsn-scroll {
      overflow-x: auto;
      padding-right: 8px;
      scrollbar-width: none;
    }

    .lsn-scroll::-webkit-scrollbar {
      display: none;
    }

    .lsn-item {
      flex: 0 0 auto;
      font-size: 9px;
      padding: 7px 10px 7px 16px;
    }

    .lsn-item.active::before {
      left: 7px;
      width: 5px;
      height: 5px;
    }

    .lsn-smart {
      display: none;
    }

    .lsn-fade {
      display: block;
      position: absolute;
      top: 0;
      bottom: 0;
      width: 16px;
      pointer-events: none;
      z-index: 1;
    }

    .lsn-fade.left {
      left: 0;
      background: linear-gradient(90deg, rgba(13, 24, 38, 1), rgba(13, 24, 38, 0));
    }

    .lsn-fade.right {
      right: 0;
      background: linear-gradient(270deg, rgba(13, 24, 38, 1), rgba(13, 24, 38, 0));
    }

    .lsn-mobile-smart {
      display: block;
      position: fixed;
      left: 12px;
      right: 12px;
      bottom: 68px;
      z-index: 52;
      border-radius: 14px;
      border: 1px solid color-mix(in srgb, var(--lsn-accent) 36%, var(--border));
      background: rgba(13, 24, 38, 0.94);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      padding: 8px 10px;
      color: var(--text);
      text-align: left;
      font-family: "Syne", sans-serif;
      font-size: 12px;
      cursor: pointer;
    }

    .lsn-mobile-smart strong {
      font-family: "Space Mono", monospace;
      font-size: 10px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--lsn-accent);
      margin-right: 6px;
    }
  }
`;

function pathMatches(pathname: string, to: string): boolean {
  return pathname === to || pathname.startsWith(`${to}/`);
}

function isItemActive(item: LayerSubNavItem, pathname: string): boolean {
  const ownTargets = [item.to, ...(item.aliases ?? [])].filter(Boolean) as string[];
  if (ownTargets.some((target) => pathMatches(pathname, target))) return true;
  if (!item.children?.length) return false;
  return item.children.some((child) => isItemActive(child, pathname));
}

function triggerCommandPalette() {
  window.dispatchEvent(
    new KeyboardEvent("keydown", {
      key: "k",
      ctrlKey: true,
      bubbles: true,
    }),
  );
}

type LayerSubNavProps = {
  config: LayerSubNavConfig;
};

export default function LayerSubNav({ config }: LayerSubNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const pathname = location.pathname;
  const action = useMemo(() => config.smartAction(pathname), [config, pathname]);

  const activeParentWithChildren = useMemo(
    () => config.items.find((item) => item.children?.length && isItemActive(item, pathname)),
    [config.items, pathname],
  );

  const subItems = activeParentWithChildren?.children ?? [];

  const styleVars = useMemo(
    () => ({ "--lsn-accent": config.accent }) as CSSProperties,
    [config.accent],
  );

  const handleSmartAction = () => {
    if (action.intent === "open-command-palette") {
      triggerCommandPalette();
      return;
    }
    if (action.to) navigate(action.to);
  };

  return (
    <div className="lsn-wrap" style={styleVars}>
      <style>{css}</style>

      <div className="lsn-shell">
        <div className="lsn-scroll-wrap">
          <div className="lsn-fade left" />
          <div className="lsn-scroll">
            {config.items.map((item) => {
              const active = isItemActive(item, pathname);
              const disabled = item.disabled || !item.to;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`lsn-item${active ? " active" : ""}${disabled ? " disabled" : ""}`}
                  onClick={() => {
                    if (disabled || !item.to) return;
                    navigate(item.to);
                  }}
                  aria-current={active ? "page" : undefined}
                  disabled={disabled}
                >
                  <span>{item.label}</span>
                  {item.badge ? (
                    <span className={`lsn-badge ${item.badgeTone ?? "neutral"}`}>{item.badge}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
          <div className="lsn-fade right" />
        </div>

        <button type="button" className="lsn-smart" onClick={handleSmartAction}>
          <div className="lsn-smart-label">
            <span className="lsn-smart-dot" />
            <span>{action.supervisor}: {action.title}</span>
          </div>
          <div className="lsn-smart-hint">{action.hint}</div>
        </button>
      </div>

      {subItems.length > 0 ? (
        <div className="lsn-subrow">
          {subItems.map((item) => {
            const active = isItemActive(item, pathname);
            const disabled = item.disabled || !item.to;

            return (
              <button
                key={item.id}
                type="button"
                className={`lsn-subitem${active ? " active" : ""}`}
                onClick={() => {
                  if (disabled || !item.to) return;
                  navigate(item.to);
                }}
                disabled={disabled}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      ) : null}

      <button type="button" className="lsn-mobile-smart" onClick={handleSmartAction}>
        <strong>{action.supervisor}</strong>
        {action.title}
      </button>
    </div>
  );
}
