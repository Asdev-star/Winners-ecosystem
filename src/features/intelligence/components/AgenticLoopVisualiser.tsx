// Phase 5 — Winners Intelligence — AgenticLoopVisualiser.tsx
// Animated circular ring showing Agentic Loop progression

import { useEffect, useState } from "react";

const STAGES = [
  { id: "community", label: "Community", emoji: "👥", color: "var(--ice)" },
  { id: "academy",   label: "Academy",   emoji: "🎓", color: "var(--green)" },
  { id: "work",      label: "Work",      emoji: "💼", color: "var(--blue)" },
  { id: "market",    label: "Market",    emoji: "🛒", color: "var(--gold)" },
  { id: "intelligence", label: "Intelligence", emoji: "🧠", color: "var(--purple)" },
];

interface Props {
  currentStage: string;
  completedStages?: string[];
  loopCount?: number;
  pendingAction?: string;
  onStageClick?: (stage: string) => void;
  size?: number;
}

export default function AgenticLoopVisualiser({
  currentStage,
  completedStages = [],
  loopCount = 0,
  pendingAction,
  onStageClick,
  size = 280,
}: Props) {
  const [flash, setFlash] = useState(false);
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;

  useEffect(() => {
    if (loopCount > 0) {
      setFlash(true);
      const t = setTimeout(() => setFlash(false), 1500);
      return () => clearTimeout(t);
    }
  }, [loopCount]);

  const getNodePos = (idx: number) => {
    const angle = (idx * 2 * Math.PI) / STAGES.length - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const activeIdx = STAGES.findIndex((s) => s.id === currentStage);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(1); opacity: 1; }
          50%  { transform: scale(1.18); opacity: 0.6; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes flash-gold {
          0%,100% { filter: drop-shadow(0 0 0px transparent); }
          50%      { filter: drop-shadow(0 0 24px var(--gold)); }
        }
        .alv-stage-active { animation: pulse-ring 1.6s ease-in-out infinite; }
        .alv-flash        { animation: flash-gold 1.5s ease; }
        .alv-arc-segment  { transition: stroke-dashoffset 0.8s ease; }
      `}</style>

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className={flash ? "alv-flash" : ""}
        style={{ overflow: "visible" }}
      >
        {/* Background ring */}
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={2}
          strokeDasharray="4 6"
        />

        {/* Completed arc */}
        {activeIdx > 0 && (
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="var(--green)"
            strokeWidth={3}
            strokeOpacity={0.5}
            strokeDasharray={`${(activeIdx / STAGES.length) * 2 * Math.PI * r} ${2 * Math.PI * r}`}
            strokeDashoffset={-(((-Math.PI / 2) / (2 * Math.PI)) * 2 * Math.PI * r)}
            strokeLinecap="round"
            transform={`rotate(-90, ${cx}, ${cy})`}
            className="alv-arc-segment"
          />
        )}

        {/* Connector lines */}
        {STAGES.map((_, i) => {
          const from = getNodePos(i);
          const to   = getNodePos((i + 1) % STAGES.length);
          return (
            <line
              key={i}
              x1={from.x} y1={from.y}
              x2={to.x}   y2={to.y}
              stroke="var(--border)"
              strokeWidth={1}
              strokeOpacity={0.3}
            />
          );
        })}

        {/* Stage nodes */}
        {STAGES.map((stage, i) => {
          const { x, y } = getNodePos(i);
          const isActive    = stage.id === currentStage;
          const isCompleted = completedStages.includes(stage.id);
          const isFuture    = !isActive && !isCompleted;
          const nodeR       = isActive ? 26 : 20;

          return (
            <g
              key={stage.id}
              className={isActive ? "alv-stage-active" : ""}
              style={{ cursor: onStageClick ? "pointer" : "default", transformOrigin: `${x}px ${y}px` }}
              onClick={() => onStageClick?.(stage.id)}
            >
              <circle
                cx={x} cy={y} r={nodeR}
                fill={isCompleted ? "rgba(45,212,160,0.15)" : isActive ? `rgba(155,111,255,0.15)` : "var(--surface)"}
                stroke={isActive ? "var(--purple)" : isCompleted ? "var(--green)" : "var(--border)"}
                strokeWidth={isActive ? 2 : 1}
                opacity={isFuture ? 0.5 : 1}
              />
              {isActive && (
                <circle
                  cx={x} cy={y} r={nodeR + 4}
                  fill="none"
                  stroke="var(--purple)"
                  strokeWidth={1}
                  strokeOpacity={0.4}
                  strokeDasharray="3 5"
                />
              )}
              <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fontSize={isActive ? 16 : 13} opacity={isFuture ? 0.4 : 1}>
                {isCompleted ? "✓" : stage.emoji}
              </text>
              <text
                x={x} y={y + nodeR + 10}
                textAnchor="middle"
                fill={isActive ? "var(--purple)" : isCompleted ? "var(--green)" : "var(--text-dim)"}
                fontSize={9}
                fontFamily="'Space Mono', monospace"
                letterSpacing="0.05em"
                opacity={isFuture ? 0.4 : 1}
              >
                {stage.label.toUpperCase()}
              </text>
            </g>
          );
        })}

        {/* Centre: loop count */}
        <text x={cx} y={cy - 10} textAnchor="middle" fill="var(--gold)" fontSize={28} fontFamily="'Cormorant Garamond', serif" fontWeight={300}>
          {loopCount}
        </text>
        <text x={cx} y={cy + 14} textAnchor="middle" fill="var(--text-dim)" fontSize={9} fontFamily="'Space Mono', monospace" letterSpacing="0.1em">
          {loopCount === 1 ? "LOOP" : "LOOPS"}
        </text>
      </svg>

      {pendingAction && (
        <div style={{
          background: "rgba(155,111,255,0.08)",
          border: "1px solid rgba(155,111,255,0.2)",
          borderRadius: 6,
          padding: "8px 14px",
          fontFamily: "'Space Mono', monospace",
          fontSize: 10,
          color: "var(--purple)",
          maxWidth: size,
          textAlign: "center",
          letterSpacing: "0.04em",
        }}>
          ⚡ {pendingAction}
        </div>
      )}
    </div>
  );
}
