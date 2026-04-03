// Level V - Named Supervisor Deployment
// Component: LoopStageIndicator
// Compact loop stage badge showing user's position in the Agentic Loop

import { useMemo } from "react";

interface LoopStageIndicatorProps {
  stage: number; // 0-6 representing the 7 stages of the Agentic Loop
  showLabel?: boolean;
  compact?: boolean;
  interactive?: boolean;
  onStageClick?: (stage: number) => void;
}

// The 7 stages of the Agentic Loop
const LOOP_STAGES = [
  { id: 0, label: "Community", icon: "🧑‍🤝‍🧑", description: "Building presence" },
  { id: 1, label: "NOVA Detection", icon: "👁️", description: "Skills identified" },
  { id: 2, label: "Academy", icon: "🎓", description: "Learning" },
  { id: 3, label: "Certificate", icon: "📜", description: "Certified" },
  { id: 4, label: "Work Match", icon: "💼", description: "Opportunities" },
  { id: 5, label: "Proposal", icon: "📝", description: "Active pitch" },
  { id: 6, label: "Market", icon: "🛒", description: "Earning" },
];

export default function LoopStageIndicator({
  stage,
  showLabel = true,
  compact = false,
  interactive = false,
  onStageClick
}: LoopStageIndicatorProps) {
  const currentStage = useMemo(() => {
    return LOOP_STAGES.find(s => s.id === stage) || LOOP_STAGES[0];
  }, [stage]);

  const progressPercentage = useMemo(() => {
    return Math.min(((stage + 1) / LOOP_STAGES.length) * 100, 100);
  }, [stage]);

  const handleClick = () => {
    if (interactive && onStageClick) {
      onStageClick(stage);
    }
  };

  return (
    <div 
      className={`lsi-container ${compact ? "compact" : ""} ${interactive ? "interactive" : ""}`}
      onClick={handleClick}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onKeyDown={interactive ? (e) => e.key === "Enter" && handleClick() : undefined}
    >
      <style>{css}</style>

      {/* Progress Bar Background */}
      <div className="lsi-progress-track">
        <div 
          className="lsi-progress-fill"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Stage Dots */}
      <div className="lsi-stages">
        {LOOP_STAGES.map((s, index) => (
          <div 
            key={s.id}
            className={`lsi-stage ${index <= stage ? "completed" : ""} ${index === stage ? "current" : ""}`}
            title={s.description}
          >
            <span className="lsi-stage-icon">{s.icon}</span>
            {showLabel && !compact && (
              <span className="lsi-stage-label">{s.label}</span>
            )}
          </div>
        ))}
      </div>

      {/* Current Stage Info */}
      {!compact && (
        <div className="lsi-current-info">
          <span className="lsi-current-icon">{currentStage.icon}</span>
          <span className="lsi-current-label">{currentStage.label}</span>
          <span className="lsi-current-desc">{currentStage.description}</span>
        </div>
      )}

      {/* Compact Badge */}
      {compact && (
        <div className="lsi-compact-badge">
          <span className="lsi-compact-icon">{currentStage.icon}</span>
          <span className="lsi-compact-label">{currentStage.label}</span>
        </div>
      )}
    </div>
  );
}

// Mini version for inline display in headers/cards
export function LoopStageBadge({ stage }: { stage: number }) {
  const currentStage = LOOP_STAGES.find(s => s.id === stage) || LOOP_STAGES[0];
  
  return (
    <div className="lsb-badge" title={currentStage.description}>
      <span className="lsb-icon">{currentStage.icon}</span>
      <span className="lsb-label">{currentStage.label}</span>
    </div>
  );
}

const css = `
  .lsi-container {
    position: relative;
    padding: 12px 0;
    width: 100%;
  }

  .lsi-container.compact {
    padding: 6px 0;
  }

  .lsi-container.interactive {
    cursor: pointer;
  }

  .lsi-container.interactive:hover {
    opacity: 0.9;
  }

  .lsi-progress-track {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--surface2);
    transform: translateY(-50%);
    z-index: 0;
    border-radius: 1px;
  }

  .lsi-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--gold), var(--green));
    border-radius: 1px;
    transition: width 0.5s ease;
  }

  .lsi-stages {
    display: flex;
    justify-content: space-between;
    position: relative;
    z-index: 1;
  }

  .lsi-stage {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    transition: transform 0.2s ease;
  }

  .lsi-container.interactive .lsi-stage:hover {
    transform: scale(1.1);
  }

  .lsi-stage-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: var(--card-radius, 50%);
    font-size: 14px;
    transition: all 0.3s ease;
  }

  .compact .lsi-stage-icon {
    width: 24px;
    height: 24px;
    font-size: 10px;
  }

  .lsi-stage.completed .lsi-stage-icon {
    background: var(--gold);
    border-color: var(--gold);
    opacity: 0.6;
  }

  .lsi-stage.current .lsi-stage-icon {
    background: var(--gold);
    border-color: var(--gold);
    box-shadow: 0 0 12px rgba(201, 168, 76, 0.4);
    transform: scale(1.15);
  }

  .lsi-stage-label {
    font-family: var(--font-mono), 'Space Mono', monospace;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text-dim);
    text-align: center;
    max-width: 60px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .compact .lsi-stage-label {
    display: none;
  }

  .lsi-stage.current .lsi-stage-label {
    color: var(--gold);
  }

  .lsi-current-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 16px;
    padding: 12px;
    background: var(--surface2);
    border-radius: var(--card-radius, 6px);
    border: 1px solid var(--border);
  }

  .lsi-current-icon {
    font-size: 20px;
  }

  .lsi-current-label {
    font-family: var(--font-body), 'Syne', sans-serif;
    font-weight: 600;
    font-size: 14px;
    color: var(--text);
  }

  .lsi-current-desc {
    font-family: var(--font-mono), 'Space Mono', monospace;
    font-size: 10px;
    color: var(--text-dim);
    margin-left: auto;
  }

  .lsi-compact-badge {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--card-radius, 12px);
  }

  .lsi-compact-icon {
    font-size: 12px;
  }

  .lsi-compact-label {
    font-family: var(--font-mono), 'Space Mono', monospace;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text);
  }

  /* LoopStageBadge (mini inline version) */
  .lsb-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 8px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 10px;
    font-size: 11px;
  }

  .lsb-icon {
    font-size: 10px;
  }

  .lsb-label {
    font-family: var(--font-mono), 'Space Mono', monospace;
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--text);
  }
`;
