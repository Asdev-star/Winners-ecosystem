// src/components/ui/LayerSubNav.tsx
// Universal Sub-Navigation · All 8 Platform Layers
// Design: CSS variables only · sticky · AI Smart Action · keyboard nav

import React, { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { SubNavItem, SmartAction } from "./subnav";

export type { SubNavItem, SmartAction };

export interface LayerSubNavProps {
  items: SubNavItem[];
  layer: "community" | "academy" | "market" | "work" | "intelligence" | "core" | "cloud";
  smartAction?: SmartAction;
  className?: string;
}

const LAYER_CONFIG = {
  community:    { accent: "var(--ice)",    supervisor: "NOVA",    emoji: "🧑‍🤝‍🧑" },
  academy:      { accent: "var(--green)",  supervisor: "SAGE",    emoji: "🎓" },
  market:       { accent: "var(--gold)",   supervisor: "ATLAS",   emoji: "🛒" },
  work:         { accent: "var(--blue)",   supervisor: "CIRCUIT", emoji: "💼" },
  intelligence: { accent: "var(--purple)", supervisor: "OMEGA",   emoji: "🤖" },
  core:         { accent: "var(--gold)",   supervisor: "FORGE",   emoji: "⬡" },
  cloud:        { accent: "var(--ice)",    supervisor: "NEXUS",   emoji: "☁️" },
};

const SUPERVISOR_COLORS: Record<string, string> = {
  nova:    "var(--ice)",
  sage:    "var(--green)",
  atlas:   "var(--gold)",
  circuit: "var(--blue)",
  omega:   "var(--purple)",
  forge:   "var(--gold)",
  nexus:   "var(--ice)",
};

const css = `
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@600;700&display=swap');

.lsn-root {
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgba(13,21,32,0.94);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--border);
  padding: 0 24px;
  display: flex;
  align-items: center;
  gap: 2px;
  height: 46px;
  min-width: 0;
}
.lsn-item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 6px 13px;
  border-radius: 7px;
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dim);
  cursor: pointer;
  border: none;
  background: none;
  transition: color 0.16s, background 0.16s;
  white-space: nowrap;
  text-decoration: none;
  position: relative;
  flex-shrink: 0;
}
.lsn-item:hover { color: var(--text); background: rgba(255,255,255,0.04); }
.lsn-item.active { color: var(--text); background: rgba(255,255,255,0.06); }
.lsn-item.active::after {
  content: '';
  position: absolute;
  bottom: -1px; left: 50%;
  transform: translateX(-50%);
  width: 22px; height: 2px;
  border-radius: 1px;
  background: var(--lsn-accent, var(--gold));
}
.lsn-badge {
  font-family: 'Space Mono', monospace;
  font-size: 8px; font-weight: 700;
  min-width: 16px; height: 16px;
  padding: 0 4px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(255,255,255,0.07);
  color: var(--text-dim);
  transition: background 0.16s, color 0.16s;
}
.lsn-item.active .lsn-badge, .lsn-badge.alert {
  background: var(--lsn-accent, var(--gold));
  color: var(--bg);
}
.lsn-badge.streak {
  background: rgba(201,168,76,0.18); color: var(--gold);
  animation: lsnStreakPulse 1.8s ease-in-out infinite;
}
.lsn-badge.new {
  background: rgba(45,212,160,0.15); color: var(--green);
  font-size: 7px; letter-spacing: 0.08em;
}
@keyframes lsnStreakPulse {
  0%, 100% { opacity: 1; } 50% { opacity: 0.5; }
}
.lsn-shortcut {
  font-family: 'Space Mono', monospace; font-size: 8px;
  color: rgba(90,122,150,0.4);
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-radius: 3px; padding: 1px 4px;
}
.lsn-spacer { flex: 1; min-width: 8px; }
.lsn-action {
  display: flex; align-items: center; gap: 7px;
  padding: 5px 12px; border-radius: 7px;
  border: 1px solid rgba(255,255,255,0.07);
  background: rgba(255,255,255,0.02);
  font-family: 'Space Mono', monospace; font-size: 9px;
  color: var(--text-dim); letter-spacing: 0.05em;
  cursor: pointer; text-decoration: none;
  transition: all 0.18s; white-space: nowrap; flex-shrink: 0;
}
.lsn-action:hover {
  background: rgba(255,255,255,0.05);
  color: var(--lsn-action-color, var(--text));
  border-color: var(--lsn-action-color, var(--border));
}
.lsn-action-sup { font-weight: 700; letter-spacing: 0.1em; }
.lsn-action-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--lsn-action-color, var(--text-dim));
  flex-shrink: 0;
  animation: lsnDotPulse 2.2s ease-in-out infinite;
}
.lsn-action-dot.hot {
  background: var(--red);
  box-shadow: 0 0 6px rgba(224,90,78,0.5);
  animation: lsnDotHot 1.2s ease-in-out infinite;
}
.lsn-action-dot.streak { background: var(--gold); box-shadow: 0 0 6px rgba(201,168,76,0.5); }
@keyframes lsnDotPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.35; transform: scale(0.7); }
}
@keyframes lsnDotHot {
  0%, 100% { transform: scale(1); } 50% { transform: scale(1.35); }
}
@media (max-width: 768px) {
  .lsn-root {
    padding: 0 8px; overflow-x: auto;
    scrollbar-width: none; -ms-overflow-style: none; gap: 0;
  }
  .lsn-root::-webkit-scrollbar { display: none; }
  .lsn-spacer { display: none; }
  .lsn-action { display: none; }
  .lsn-shortcut { display: none; }
  .lsn-item { padding: 6px 10px; font-size: 12px; }
}
@media (max-width: 480px) {
  .lsn-item { padding: 5px 8px; font-size: 11px; }
}
`;

export default function LayerSubNav({ items, layer, smartAction, className = "" }: LayerSubNavProps): React.ReactElement {
  const navigate  = useNavigate();
  const location  = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const config    = LAYER_CONFIG[layer];
  const accent    = config.accent;

  useEffect(() => {
    const el = scrollRef.current?.querySelector(".lsn-item.active") as HTMLElement | null;
    if (el) el.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [location.pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === "INPUT") return;
      if ((e.target as HTMLElement)?.tagName === "TEXTAREA") return;
      items.forEach((item) => {
        if (item.shortcut && e.key.toLowerCase() === item.shortcut.toLowerCase() && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          navigate(item.href);
        }
      });
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [items, navigate]);

  function isActive(href: string) {
    const exact = ["/community", "/academy", "/work", "/market", "/intelligence", "/dashboard"];
    if (exact.includes(href)) return location.pathname === href;
    return location.pathname.startsWith(href);
  }

  function badgeLabel(item: SubNavItem): string {
    if (item.badgeType === "new") return "NEW";
    if (item.badge === undefined) return "";
    return item.badge > 99 ? "99+" : String(item.badge);
  }

  const supervisorColor = smartAction ? SUPERVISOR_COLORS[smartAction.supervisor] : accent;

  return (
    <>
      <style>{css}</style>
      <nav
        ref={scrollRef}
        className={`lsn-root ${className}`}
        style={{ "--lsn-accent": accent, "--lsn-action-color": supervisorColor } as React.CSSProperties}
        aria-label={`${config.emoji} ${layer} navigation`}
      >
        {items.map((item) => (
          <button
            key={item.id}
            className={`lsn-item${isActive(item.href) ? " active" : ""}`}
            onClick={() => navigate(item.href)}
            title={item.shortcut ? `${item.label} (${item.shortcut.toUpperCase()})` : item.label}
            aria-current={isActive(item.href) ? "page" : undefined}
          >
            {item.label}
            {(item.badge !== undefined && item.badge > 0) || item.badgeType === "new" ? (
              <span className={`lsn-badge ${item.badgeType ?? "normal"}`}>{badgeLabel(item)}</span>
            ) : null}
            {item.shortcut && !item.badge && item.badgeType !== "new" && (
              <span className="lsn-shortcut">{item.shortcut.toUpperCase()}</span>
            )}
          </button>
        ))}

        {smartAction && (
          <>
            <div className="lsn-spacer" />
            <a href={smartAction.href} className="lsn-action">
              <div className={`lsn-action-dot ${smartAction.urgency ?? "normal"}`} />
              <span className="lsn-action-sup">{smartAction.supervisor.toUpperCase()}</span>
              <span>{smartAction.label}</span>
            </a>
          </>
        )}
      </nav>
    </>
  );
}
