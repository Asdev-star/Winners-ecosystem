// Level I (V3.0) - Design System Enforcement
// Component: AgenticLoopWidget
// 7-node loop visualizer - persistent in sidebar

import { useMemo } from "react";

interface AgenticLoopWidgetProps {
  currentStage: number; // 0-6
  stages?: LoopStage[];
  onStageClick?: (stage: number) => void;
  compact?: boolean;
}

interface LoopStage {
  name: string;
  emoji: string;
  description: string;
  completed: boolean;
  inProgress: boolean;
}

const DEFAULT_STAGES: LoopStage[] = [
  { name: "Community", emoji: "👥", description: "Post content", completed: false, inProgress: false },
  { name: "Skill Detect", emoji: "🔍", description: "NOVA identifies skills", completed: false, inProgress: false },
  { name: "Academy", emoji: "🎓", description: "Learn & certify", completed: false, inProgress: false },
  { name: "Certificate", emoji: "📜", description: "Earn credentials", completed: false, inProgress: false },
  { name: "Work Match", emoji: "💼", description: "Get matched to jobs", completed: false, inProgress: false },
  { name: "Contract", emoji: "✍️", description: "Win your first contract", completed: false, inProgress: false },
  { name: "Revenue", emoji: "💰", description: "First earnings", completed: false, inProgress: false },
];

export default function AgenticLoopWidget({ 
  currentStage = 0, 
  stages = DEFAULT_STAGES,
  onStageClick,
  compact = false 
}: AgenticLoopWidgetProps) {
  const processedStages = useMemo(() => {
    return stages.map((stage, index) => ({
      ...stage,
      completed: index < currentStage,
      inProgress: index === currentStage,
    }));
  }, [stages, currentStage]);

  if (compact) {
    return (
      <div className="loop-widget-compact">
        <div className="loop-progress-mini">
          <div 
            className="loop-progress-fill" 
            style={{ width: `${(currentStage / (processedStages.length - 1)) * 100}%` }}
          />
        </div>
        <span className="loop-stage-label">
          Stage {currentStage + 1} of {processedStages.length} · {processedStages[currentStage]?.name || "Start"}
        </span>
        
        <style>{`
          .loop-widget-compact {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 6px;
          }
          
          .loop-progress-mini {
            flex: 1;
            height: 4px;
            background: var(--border);
            border-radius: 2px;
            overflow: hidden;
          }
          
          .loop-progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--gold), var(--purple));
            border-radius: 2px;
            transition: width 0.5s ease;
          }
          
          .loop-stage-label {
            font-family: 'Space Mono', monospace;
            font-size: 9px;
            letter-spacing: 0.1em;
            text-transform: uppercase;
            color: var(--text-dim);
            white-space: nowrap;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="loop-widget">
      <div className="loop-header">
        <h3 className="loop-title">
          <span className="loop-icon">🔄</span>
          Your Journey
        </h3>
        <span className="loop-count">Loop {currentStage + 1}</span>
      </div>
      
      <div className="loop-stages">
        {processedStages.map((stage, index) => (
          <button
            key={index}
            className={`loop-stage ${stage.completed ? "completed" : ""} ${stage.inProgress ? "active" : ""}`}
            onClick={() => onStageClick?.(index)}
            disabled={index > currentStage + 1}
          >
            <div className="stage-node">
              {stage.completed ? (
                <span className="stage-check">✓</span>
              ) : stage.inProgress ? (
                <span className="stage-pulse">●</span>
              ) : (
                <span className="stage-dot">○</span>
              )}
            </div>
            <div className="stage-info">
              <span className="stage-emoji">{stage.emoji}</span>
              <span className="stage-name">{stage.name}</span>
              <span className="stage-desc">{stage.description}</span>
            </div>
            {stage.inProgress && <div className="stage-glow" />}
          </button>
        ))}
      </div>

      <style>{`
        .loop-widget {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          overflow: hidden;
        }

        .loop-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px;
          border-bottom: 1px solid var(--border);
          background: var(--surface2);
        }

        .loop-title {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 700;
          color: var(--text);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .loop-icon {
          font-size: 16px;
        }

        .loop-count {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--gold);
          background: rgba(201, 168, 76, 0.1);
          padding: 4px 8px;
          border-radius: 4px;
        }

        .loop-stages {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .loop-stage {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: transparent;
          border: 1px solid transparent;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          text-align: left;
        }

        .loop-stage:hover:not(:disabled) {
          background: var(--surface2);
          border-color: var(--border);
        }

        .loop-stage:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .loop-stage.completed .stage-node {
          background: var(--green);
          color: var(--bg);
        }

        .loop-stage.active {
          background: rgba(201, 168, 76, 0.08);
          border-color: rgba(201, 168, 76, 0.2);
        }

        .loop-stage.active .stage-node {
          background: var(--gold);
          color: var(--bg);
          animation: loopPulse 2s ease infinite;
        }

        @keyframes loopPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201, 168, 76, 0.4); }
          50% { box-shadow: 0 0 0 6px rgba(201, 168, 76, 0); }
        }

        .stage-node {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          flex-shrink: 0;
          background: var(--border);
          color: var(--text-dim);
          transition: all 0.3s ease;
        }

        .stage-check {
          font-weight: 700;
        }

        .stage-pulse {
          color: var(--bg);
          font-size: 8px;
        }

        .stage-dot {
          font-size: 10px;
          opacity: 0.5;
        }

        .stage-info {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 0;
        }

        .stage-emoji {
          font-size: 16px;
          flex-shrink: 0;
        }

        .stage-name {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          font-weight: 600;
          color: var(--text);
          white-space: nowrap;
        }

        .stage-desc {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          color: var(--text-dim);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .stage-glow {
          position: absolute;
          inset: -2px;
          border-radius: 8px;
          border: 2px solid var(--gold);
          opacity: 0.3;
          pointer-events: none;
        }

        @media (max-width: 640px) {
          .stage-info {
            flex-wrap: wrap;
          }
          
          .stage-desc {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
