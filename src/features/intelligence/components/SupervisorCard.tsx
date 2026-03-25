// Phase 5 — Winners Intelligence — SupervisorCard.tsx
// Card showing supervisor identity + last action

import { useNavigate } from "react-router-dom";

const SUPERVISORS = [
  { id: "omega",   name: "OMEGA",   emoji: "🧠", role: "Master Orchestrator", color: "var(--purple)", layer: "All Layers" },
  { id: "aria",    name: "ARIA",    emoji: "⬡",  role: "Core Engine",         color: "var(--gold)",   layer: "Core" },
  { id: "nova",    name: "NOVA",    emoji: "👥", role: "Community",           color: "var(--ice)",    layer: "Community" },
  { id: "sage",    name: "SAGE",    emoji: "🎓", role: "Academy Tutor",       color: "var(--green)",  layer: "Academy" },
  { id: "atlas",   name: "ATLAS",   emoji: "🛒", role: "Market Intelligence", color: "var(--gold)",   layer: "Market" },
  { id: "circuit", name: "CIRCUIT", emoji: "💼", role: "Work Matchmaker",     color: "var(--blue)",   layer: "Work" },
  { id: "nexus",   name: "NEXUS",   emoji: "☁️", role: "Cloud Developer",     color: "var(--ice)",    layer: "Cloud" },
  { id: "forge",   name: "FORGE",   emoji: "🤖", role: "AI Platform",         color: "var(--purple)", layer: "Intelligence" },
  { id: "herald",  name: "HERALD",  emoji: "🧬", role: "AI Infrastructure",   color: "var(--purple)", layer: "AI Platform" },
];

interface Props {
  supervisorId: string;
  lastAction?: string;
  compact?: boolean;
}

export default function SupervisorCard({ supervisorId, lastAction, compact = false }: Props) {
  const navigate = useNavigate();
  const sup = SUPERVISORS.find((s) => s.id === supervisorId) ?? SUPERVISORS[0];

  if (compact) {
    return (
      <div
        style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", transition: "border-color 200ms ease" }}
        onClick={() => navigate(`/intelligence/agents/${supervisorId}`)}
        onMouseEnter={(e) => (e.currentTarget.style.borderColor = sup.color)}
        onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
      >
        <span style={{ fontSize: 18 }}>{sup.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: sup.color, letterSpacing: "0.08em" }}>{sup.name}</div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 11, color: "var(--text-dim)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {lastAction ?? sup.role}
          </div>
        </div>
        <span style={{ color: "var(--text-dim)", fontSize: 10 }}>→</span>
      </div>
    );
  }

  return (
    <div
      style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden", cursor: "pointer", transition: "border-color 200ms ease", position: "relative" }}
      onClick={() => navigate(`/intelligence/agents/${supervisorId}`)}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = sup.color)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${sup.color}, transparent)` }} />
      <div style={{ padding: "16px 16px 12px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: `${sup.color}18`, border: `1px solid ${sup.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>
            {sup.emoji}
          </div>
          <div>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 11, fontWeight: 700, color: sup.color, letterSpacing: "0.08em" }}>{sup.name}</div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, color: "var(--text-dim)" }}>{sup.role}</div>
          </div>
          <div style={{ marginLeft: "auto", fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--text-dim)", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 3, padding: "3px 7px" }}>
            {sup.layer}
          </div>
        </div>
        {lastAction && (
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 12, color: "var(--text-dim)", lineHeight: 1.4, borderTop: "1px solid var(--border)", paddingTop: 10 }}>
            {lastAction}
          </div>
        )}
        <div style={{ marginTop: 10, fontFamily: "'Space Mono', monospace", fontSize: 9, color: sup.color, letterSpacing: "0.06em" }}>
          → Talk to {sup.name}
        </div>
      </div>
    </div>
  );
}

export { SUPERVISORS };
