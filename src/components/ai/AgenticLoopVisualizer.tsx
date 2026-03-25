// Level III — Shared Component Architecture
// Component: AgenticLoopVisualizer
// Animated 8-step loop diagram — current stage glows, completed stages green.
// Full visual diagram (vs AgenticLoopWidget which is the compact sidebar version).

import { useLoopTracking } from "../../hooks/useLoopTracking";

const STAGES = [
  { id: "community",    label: "Build Network",    sub: "Community",    emoji: "👥", color: "var(--ice)"    },
  { id: "academy",      label: "Certify Skills",   sub: "Academy",      emoji: "🎓", color: "var(--green)"  },
  { id: "work",         label: "Win Contracts",    sub: "Work",         emoji: "💼", color: "var(--blue)"   },
  { id: "market",       label: "Generate Revenue", sub: "Market",       emoji: "🛒", color: "var(--gold)"   },
  { id: "intelligence", label: "Optimise & Scale", sub: "Intelligence", emoji: "🤖", color: "var(--purple)" },
] as const;

type StageId = (typeof STAGES)[number]["id"];

interface AgenticLoopVisualizerProps {
  variant?: "horizontal" | "vertical" | "circular";
  showLabels?: boolean;
  showProgress?: boolean;
  interactive?: boolean;
  onStageClick?: (stageId: StageId) => void;
}

const css = `
/* ── Root ── */
.alv-root {
  font-family: 'Syne', sans-serif;
}

/* ── Horizontal layout ── */
.alv-horizontal {
  display: flex;
  align-items: center;
  gap: 0;
  overflow-x: auto;
  padding: 8px 0;
}

/* ── Vertical layout ── */
.alv-vertical {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Stage node ── */
.alv-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
  cursor: default;
  flex-shrink: 0;
}
.alv-stage.interactive { cursor: pointer; }
.alv-stage.interactive:hover .alv-node { transform: scale(1.08); }

/* ── Node pip ── */
.alv-node {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  position: relative;
  transition: all 0.3s ease;
  z-index: 1;
  flex-shrink: 0;
}

.alv-node.pending {
  background: var(--surface2);
  border: 2px solid var(--border);
  opacity: 0.45;
}

.alv-node.completed {
  background: rgba(45, 212, 160, 0.12);
  border: 2px solid var(--green);
}

.alv-node.active {
  border: 2px solid currentColor;
  background: color-mix(in srgb, currentColor 12%, transparent);
  box-shadow:
    0 0 0 4px color-mix(in srgb, currentColor 15%, transparent),
    0 0 20px color-mix(in srgb, currentColor 35%, transparent);
  animation: alv-pulse 2.4s ease infinite;
}

@keyframes alv-pulse {
  0%, 100% {
    box-shadow:
      0 0 0 4px color-mix(in srgb, currentColor 12%, transparent),
      0 0 16px color-mix(in srgb, currentColor 25%, transparent);
  }
  50% {
    box-shadow:
      0 0 0 8px color-mix(in srgb, currentColor 08%, transparent),
      0 0 32px color-mix(in srgb, currentColor 50%, transparent);
  }
}

/* ── Check mark overlay ── */
.alv-check {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--green);
  border: 2px solid var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  color: var(--bg);
  font-weight: 700;
}

/* ── Stage labels ── */
.alv-label {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 72px;
}

.alv-label-main {
  font-size: 11px;
  font-weight: 700;
  color: var(--text);
  line-height: 1.2;
  transition: color 0.2s;
}
.alv-label-main.pending { color: var(--text-dim); }
.alv-label-main.completed { color: var(--green); }

.alv-label-sub {
  font-family: 'Space Mono', monospace;
  font-size: 8px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--text-dim);
  transition: color 0.2s;
}
.alv-label-sub.active { color: currentColor; opacity: 0.8; }

/* ── Connector arrows (horizontal) ── */
.alv-connector-h {
  width: 40px;
  height: 2px;
  position: relative;
  flex-shrink: 0;
  margin: 0 -2px;
  top: -28px;
}

.alv-connector-h-fill {
  position: absolute;
  inset: 0;
  border-radius: 1px;
  background: var(--border);
  transition: background 0.4s ease;
}
.alv-connector-h-fill.done { background: var(--green); opacity: 0.5; }

.alv-connector-h-arrow {
  position: absolute;
  right: -4px;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid var(--border);
  border-top: 4px solid transparent;
  border-bottom: 4px solid transparent;
  transition: border-left-color 0.4s ease;
}
.alv-connector-h-fill.done + .alv-connector-h-arrow { border-left-color: var(--green); opacity: 0.5; }

/* ── Connector (vertical) ── */
.alv-connector-v {
  width: 2px;
  height: 28px;
  background: var(--border);
  margin: 0 auto;
  border-radius: 1px;
  transition: background 0.4s ease;
}
.alv-connector-v.done { background: var(--green); opacity: 0.5; }

/* ── OMEGA cap ── */
.alv-omega {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.alv-omega-node {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 26px;
  background: linear-gradient(135deg, rgba(45,212,160,0.12), rgba(240,180,41,0.12), rgba(155,111,255,0.12));
  border: 2px solid var(--gold);
  position: relative;
  transition: all 0.3s;
}

.alv-omega-node.loop-complete {
  box-shadow: 0 0 0 8px rgba(240,180,41,0.08), 0 0 32px rgba(240,180,41,0.3);
  animation: alv-omega-spin 6s linear infinite;
}

@keyframes alv-omega-spin {
  0%, 95%, 100% { box-shadow: 0 0 0 6px rgba(240,180,41,0.06), 0 0 20px rgba(240,180,41,0.2); }
  50%            { box-shadow: 0 0 0 10px rgba(240,180,41,0.12), 0 0 40px rgba(240,180,41,0.4); }
}

.alv-omega-label {
  font-family: 'Space Mono', monospace;
  font-size: 8px;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  color: var(--gold);
  text-align: center;
}

/* ── Progress bar (optional) ── */
.alv-progress-section {
  margin-top: 20px;
}
.alv-progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}
.alv-progress-text {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-dim);
}
.alv-progress-pct { color: var(--gold); }
.alv-progress-track {
  height: 3px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}
.alv-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--green), var(--gold));
  border-radius: 2px;
  transition: width 0.6s ease;
}

/* ── Velocity badge ── */
.alv-velocity {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-family: 'Space Mono', monospace;
  font-size: 8px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  padding: 3px 8px;
  border-radius: 3px;
}
.alv-velocity.fast    { background: rgba(45,212,160,0.12);  color: var(--green); }
.alv-velocity.normal  { background: rgba(240,180,41,0.12);  color: var(--gold);  }
.alv-velocity.slow    { background: rgba(137,196,225,0.12); color: var(--ice);   }
.alv-velocity.stalled { background: rgba(224,90,78,0.10);   color: var(--red);   }

/* ── Circular layout ── */
.alv-circular-wrap {
  position: relative;
  width: 280px;
  height: 280px;
  margin: 0 auto;
}
.alv-circular-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.alv-circular-node {
  position: absolute;
  transform: translate(-50%, -50%);
}
`;

export default function AgenticLoopVisualizer({
  variant = "horizontal",
  showLabels = true,
  showProgress = true,
  interactive = false,
  onStageClick,
}: AgenticLoopVisualizerProps) {
  const { allStageStatuses, stats } = useLoopTracking();
  const { completedStages, loopVelocity, estimatedCompletion, stageProgress } = stats;

  const statusMap = Object.fromEntries(
    allStageStatuses.map((s) => [s.stage, s.status])
  );

  const pct = Math.round((completedStages.length / STAGES.length) * 100);
  const allComplete = completedStages.length === STAGES.length;

  if (variant === "circular") {
    return (
      <>
        <style>{css}</style>
        <div className="alv-root">
          <div className="alv-circular-wrap">
            {/* SVG ring */}
            <svg
              width="280"
              height="280"
              style={{ position: "absolute", top: 0, left: 0 }}
            >
              <circle
                cx="140" cy="140" r="120"
                fill="none"
                stroke="var(--border)"
                strokeWidth="1"
                strokeDasharray="4 6"
              />
            </svg>

            {/* Stage nodes placed in a circle */}
            {STAGES.map((stage, i) => {
              const angle = (i / STAGES.length) * 2 * Math.PI - Math.PI / 2;
              const x = 140 + 120 * Math.cos(angle);
              const y = 140 + 120 * Math.sin(angle);
              const status = statusMap[stage.id] ?? "pending";
              return (
                <div
                  key={stage.id}
                  className={`alv-circular-node alv-stage${interactive ? " interactive" : ""}`}
                  style={{ left: x, top: y }}
                  onClick={() => interactive && onStageClick?.(stage.id)}
                >
                  <div
                    className={`alv-node ${status}`}
                    style={{ color: stage.color, width: 44, height: 44, fontSize: 18 } as React.CSSProperties}
                  >
                    {stage.emoji}
                    {status === "completed" && <span className="alv-check">✓</span>}
                  </div>
                </div>
              );
            })}

            {/* Center OMEGA node */}
            <div className="alv-circular-center">
              <div className={`alv-omega-node${allComplete ? " loop-complete" : ""}`} style={{ width: 56, height: 56, fontSize: 22 }}>
                🧠
              </div>
              <span className="alv-omega-label">OMEGA</span>
              <span className={`alv-velocity ${loopVelocity}`}>{loopVelocity}</span>
            </div>
          </div>

          {showProgress && (
            <div className="alv-progress-section">
              <div className="alv-progress-label">
                <span className="alv-progress-text">Loop Progress</span>
                <span className="alv-progress-text alv-progress-pct">{pct}%</span>
              </div>
              <div className="alv-progress-track">
                <div className="alv-progress-fill" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  if (variant === "vertical") {
    return (
      <>
        <style>{css}</style>
        <div className="alv-root alv-vertical">
          {STAGES.map((stage, i) => {
            const status = statusMap[stage.id] ?? "pending";
            const isLast = i === STAGES.length - 1;
            return (
              <div key={stage.id}>
                <div
                  className={`alv-stage${interactive ? " interactive" : ""}`}
                  style={{ flexDirection: "row", alignItems: "center", gap: 14, padding: "6px 0" }}
                  onClick={() => interactive && onStageClick?.(stage.id)}
                >
                  <div
                    className={`alv-node ${status}`}
                    style={{ color: stage.color, width: 44, height: 44, fontSize: 18 } as React.CSSProperties}
                  >
                    {stage.emoji}
                    {status === "completed" && <span className="alv-check">✓</span>}
                  </div>
                  {showLabels && (
                    <div className="alv-label" style={{ textAlign: "left", minWidth: 0 }}>
                      <span className={`alv-label-main ${status}`}>{stage.label}</span>
                      <span className={`alv-label-sub ${status}`} style={{ color: status === "active" ? stage.color : undefined } as React.CSSProperties}>
                        {stage.sub}
                      </span>
                    </div>
                  )}
                  {status === "active" && (
                    <span className={`alv-velocity ${loopVelocity}`} style={{ marginLeft: "auto" }}>
                      {loopVelocity}
                    </span>
                  )}
                </div>
                {!isLast && (
                  <div
                    className={`alv-connector-v${status === "completed" ? " done" : ""}`}
                    style={{ marginLeft: 21 }}
                  />
                )}
              </div>
            );
          })}

          {/* OMEGA cap */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "6px 0" }}>
            <div className={`alv-omega-node${allComplete ? " loop-complete" : ""}`} style={{ width: 44, height: 44, fontSize: 18 }}>
              🧠
            </div>
            {showLabels && (
              <div className="alv-label" style={{ textAlign: "left" }}>
                <span className="alv-label-main" style={{ color: "var(--gold)" }}>OMEGA Synthesis</span>
                <span className="alv-label-sub">Master Orchestrator</span>
              </div>
            )}
          </div>

          {showProgress && (
            <div className="alv-progress-section" style={{ marginTop: 12 }}>
              <div className="alv-progress-label">
                <span className="alv-progress-text">
                  {completedStages.length}/{STAGES.length} stages
                </span>
                <span className="alv-progress-text alv-progress-pct">{pct}%</span>
              </div>
              <div className="alv-progress-track">
                <div className="alv-progress-fill" style={{ width: `${pct}%` }} />
              </div>
              {estimatedCompletion && (
                <div style={{ marginTop: 6, fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.06em" }}>
                  ETA {estimatedCompletion}
                </div>
              )}
            </div>
          )}
        </div>
      </>
    );
  }

  // Default: horizontal
  return (
    <>
      <style>{css}</style>
      <div className="alv-root">
        <div className="alv-horizontal">
          {STAGES.map((stage, i) => {
            const status = statusMap[stage.id] ?? "pending";
            const isLast = i === STAGES.length - 1;
            return (
              <div key={stage.id} style={{ display: "flex", alignItems: "center", gap: 0 }}>
                <div
                  className={`alv-stage${interactive ? " interactive" : ""}`}
                  onClick={() => interactive && onStageClick?.(stage.id)}
                >
                  <div
                    className={`alv-node ${status}`}
                    style={{ color: stage.color } as React.CSSProperties}
                  >
                    {stage.emoji}
                    {status === "completed" && <span className="alv-check">✓</span>}
                  </div>
                  {showLabels && (
                    <div className="alv-label">
                      <span className={`alv-label-main ${status}`}>{stage.label}</span>
                      <span
                        className={`alv-label-sub ${status}`}
                        style={{ color: status === "active" ? stage.color : undefined } as React.CSSProperties}
                      >
                        {stage.sub}
                      </span>
                    </div>
                  )}
                </div>

                {!isLast && (
                  <div className="alv-connector-h" style={{ alignSelf: "flex-start", marginTop: showLabels ? 28 : 27 }}>
                    <div className={`alv-connector-h-fill${status === "completed" ? " done" : ""}`} />
                    <div className="alv-connector-h-arrow" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Arrow into OMEGA */}
          <div className="alv-connector-h" style={{ alignSelf: "flex-start", marginTop: showLabels ? 28 : 27 }}>
            <div className={`alv-connector-h-fill${allComplete ? " done" : ""}`} />
            <div className="alv-connector-h-arrow" />
          </div>

          {/* OMEGA synthesis node */}
          <div className="alv-omega">
            <div className={`alv-omega-node${allComplete ? " loop-complete" : ""}`}>
              🧠
            </div>
            {showLabels && <span className="alv-omega-label">OMEGA</span>}
          </div>
        </div>

        {showProgress && (
          <div className="alv-progress-section">
            <div className="alv-progress-label">
              <span className="alv-progress-text">
                Loop progress · {completedStages.length}/{STAGES.length} stages complete
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span className={`alv-velocity ${loopVelocity}`}>{loopVelocity}</span>
                <span className="alv-progress-text alv-progress-pct">{pct}%</span>
              </div>
            </div>
            <div className="alv-progress-track">
              <div className="alv-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            {estimatedCompletion && (
              <div style={{ marginTop: 5, fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.06em" }}>
                Estimated completion: {estimatedCompletion}
                {stageProgress > 0 && ` · Current stage ${stageProgress}% done`}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}
