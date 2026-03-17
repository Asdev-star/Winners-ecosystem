// Level V — Named Supervisor Deployment
// Component: AgenticLoopWidget
// 7-node loop visualizer — persistent in sidebar.
// Shows the Agentic Loop: Community → Academy → Work → Market → Intelligence → Scale → OMEGA
// Current stage glows, completed stages shown in green, future stages dimmed.

import { useLoopTracking } from "../../hooks/useLoopTracking";

const LOOP_NODES = [
  { id: "community",    label: "Community",    emoji: "👥", layer: "community" },
  { id: "academy",      label: "Academy",      emoji: "🎓", layer: "academy" },
  { id: "work",         label: "Work",         emoji: "💼", layer: "work" },
  { id: "market",       label: "Market",       emoji: "🛒", layer: "market" },
  { id: "intelligence", label: "Intelligence", emoji: "🤖", layer: "intelligence" },
  { id: "scale",        label: "Scale",        emoji: "📈", layer: "intelligence" },
  { id: "omega",        label: "OMEGA",        emoji: "🧠", layer: "intelligence" },
] as const;

type NodeId = (typeof LOOP_NODES)[number]["id"];

interface AgenticLoopWidgetProps {
  compact?: boolean;
}

const css = `
.alw-root {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 16px;
  font-family: 'Syne', sans-serif;
}

.alw-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.alw-eyebrow {
  font-family: 'Space Mono', monospace;
  font-size: 8px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--gold);
}

.alw-velocity {
  font-family: 'Space Mono', monospace;
  font-size: 8px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 3px;
}
.alw-velocity-fast    { background: rgba(45,212,160,0.12); color: var(--green); }
.alw-velocity-normal  { background: rgba(240,180,41,0.12); color: var(--gold);  }
.alw-velocity-slow    { background: rgba(137,196,225,0.12); color: var(--ice);  }
.alw-velocity-stalled { background: rgba(255,100,100,0.10); color: var(--red);  }

/* ── Node chain ─── */
.alw-nodes {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.alw-node-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  position: relative;
}

.alw-node-pip {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  flex-shrink: 0;
  transition: all 0.3s;
  position: relative;
  z-index: 1;
}

.alw-node-pip.completed {
  background: rgba(45,212,160,0.15);
  border: 1px solid var(--green);
}
.alw-node-pip.active {
  background: rgba(240,180,41,0.15);
  border: 2px solid var(--gold);
  box-shadow: 0 0 12px rgba(240,180,41,0.35);
  animation: alw-glow 2.5s ease infinite;
}
.alw-node-pip.pending {
  background: var(--surface2);
  border: 1px solid var(--border);
  opacity: 0.5;
}
.alw-node-pip.omega {
  background: linear-gradient(135deg, rgba(45,212,160,0.2), rgba(240,180,41,0.2), rgba(155,111,255,0.2));
  border: 1px solid var(--gold);
}

@keyframes alw-glow {
  0%, 100% { box-shadow: 0 0 8px rgba(240,180,41,0.3); }
  50%       { box-shadow: 0 0 20px rgba(240,180,41,0.6); }
}

.alw-connector {
  position: absolute;
  left: 15px;
  top: 37px;
  width: 2px;
  height: 10px;
  background: var(--border);
  z-index: 0;
}
.alw-connector.done { background: var(--green); opacity: 0.5; }

.alw-node-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-dim);
  transition: color 0.2s;
}
.alw-node-label.active    { color: var(--text); }
.alw-node-label.completed { color: var(--green); }

.alw-node-check {
  font-size: 11px;
  color: var(--green);
  margin-left: auto;
  flex-shrink: 0;
}

/* ── Progress bar ─── */
.alw-progress-track {
  height: 3px;
  background: var(--border);
  border-radius: 2px;
  margin-top: 14px;
  overflow: hidden;
}
.alw-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--green), var(--gold));
  border-radius: 2px;
  transition: width 0.6s ease;
}

.alw-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}
.alw-pct {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: var(--gold);
  letter-spacing: 0.06em;
}
.alw-eta {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: var(--text-dim);
  letter-spacing: 0.04em;
}
`;

export default function AgenticLoopWidget({ compact = false }: AgenticLoopWidgetProps) {
  const { allStageStatuses, loopVelocity, estimatedCompletion, completedStages } = useLoopTracking();

  const stageStatusMap = Object.fromEntries(
    allStageStatuses.map((s) => [s.stage, s.status])
  );

  function getNodeStatus(nodeId: NodeId): "completed" | "active" | "pending" {
    if (nodeId === "omega") {
      const allDone = allStageStatuses.every((s) => s.status === "completed");
      return allDone ? "completed" : "pending";
    }
    if (nodeId === "scale") {
      const intelligenceDone = stageStatusMap["intelligence"] === "completed";
      return intelligenceDone ? "completed" : stageStatusMap["intelligence"] === "active" ? "active" : "pending";
    }
    return (stageStatusMap[nodeId as keyof typeof stageStatusMap] ?? "pending") as "completed" | "active" | "pending";
  }

  const totalStages = 5;
  const completedStagesList = completedStages ?? [];
  const pct = Math.round((completedStagesList.length / totalStages) * 100);

  return (
    <>
      <style>{css}</style>
      <div className="alw-root">
        <div className="alw-header">
          <span className="alw-eyebrow">Agentic Loop</span>
          <span className={`alw-velocity alw-velocity-${loopVelocity}`}>
            {loopVelocity}
          </span>
        </div>

        <div className="alw-nodes">
          {LOOP_NODES.map((node, i) => {
            const status = getNodeStatus(node.id);
            const isLast = i === LOOP_NODES.length - 1;
            return (
              <div key={node.id} className="alw-node-row">
                {!isLast && (
                  <div className={`alw-connector${status === "completed" ? " done" : ""}`} />
                )}
                <span
                  className={`alw-node-pip ${status}${node.id === "omega" ? " omega" : ""}`}
                  title={node.label}
                >
                  {node.emoji}
                </span>
                {!compact && (
                  <span className={`alw-node-label ${status}`}>
                    {node.label}
                  </span>
                )}
                {status === "completed" && !compact && (
                  <span className="alw-node-check">✓</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="alw-progress-track">
          <div className="alw-progress-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="alw-footer">
          <span className="alw-pct">{pct}% complete</span>
          {estimatedCompletion && (
            <span className="alw-eta">ETA {estimatedCompletion}</span>
          )}
        </div>
      </div>
    </>
  );
}
