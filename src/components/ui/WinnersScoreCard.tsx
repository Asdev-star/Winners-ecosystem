// Level V - Named Supervisor Deployment
// Component: WinnersScoreCard
// Weekly OMEGA report card - displays user's ecosystem health score

import { useMemo } from "react";

// Type definitions
interface ScoreBreakdownItem {
  score: number;
  percentage: number;
  color: string;
}

interface ScoreBreakdown {
  community: ScoreBreakdownItem;
  academy: ScoreBreakdownItem;
  market: ScoreBreakdownItem;
  work: ScoreBreakdownItem;
  intelligence: ScoreBreakdownItem;
  engagement: ScoreBreakdownItem;
}

interface ScoreTrend {
  direction: "up" | "down" | "stable";
  change: number;
}

interface WinnersScoreCardProps {
  userId?: string;
  compact?: boolean;
  score?: number;
  breakdown?: ScoreBreakdown | null;
  trend?: ScoreTrend | null;
  loading?: boolean;
  onRefresh?: () => void;
}

export default function WinnersScoreCard({
  userId: _userId,
  compact = false,
  score: propScore,
  breakdown: propBreakdown,
  trend: propTrend,
  loading = false,
  onRefresh
}: WinnersScoreCardProps) {
  // Use props if provided, otherwise use defaults
  const score = propScore ?? 0;
  const breakdown = propBreakdown ?? null;
  const trend = propTrend ?? null;

  const scoreColor = useMemo(() => {
    if (score >= 80) return "var(--green)";
    if (score >= 60) return "var(--gold)";
    if (score >= 40) return "var(--blue)";
    return "var(--red)";
  }, [score]);

  if (loading) {
    return (
      <div className="wsc-card loading">
        <style>{css}</style>
        <div className="wsc-skeleton">
          <div className="wsc-skeleton-score"></div>
          <div className="wsc-skeleton-label"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`wsc-card ${compact ? "compact" : ""}`}>
      <style>{css}</style>
      
      {/* Header */}
      <div className="wsc-header">
        <div className="wsc-title">
          <span className="wsc-icon">📊</span>
          <span>Winners Score</span>
        </div>
        {onRefresh && (
          <button className="wsc-refresh" onClick={onRefresh} title="Refresh">
            ↻
          </button>
        )}
      </div>

      {/* Score Circle */}
      <div className="wsc-score-container">
        <svg className="wsc-ring" viewBox="0 0 100 100">
          <circle
            className="wsc-ring-bg"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="var(--surface2)"
            strokeWidth="8"
          />
          <circle
            className="wsc-ring-fill"
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={scoreColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 283} 283`}
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div className="wsc-score-value">
          <span className="wsc-score-number" style={{ color: scoreColor }}>
            {score}
          </span>
          <span className="wsc-score-label">/ 100</span>
        </div>
      </div>

      {/* Trend Indicator */}
      {trend && (
        <div className={`wsc-trend ${trend.direction === "up" ? "up" : "down"}`}>
          <span className="wsc-trend-icon">
            {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "→"}
          </span>
          <span>{trend.change}% this week</span>
        </div>
      )}

      {/* Breakdown - Only show if not compact */}
      {!compact && breakdown && (
        <div className="wsc-breakdown">
          {Object.entries(breakdown).map(([key, value]) => {
            const item = value as ScoreBreakdownItem;
            return (
              <div key={key} className="wsc-breakdown-item">
                <span className="wsc-breakdown-label">{formatLabel(key)}</span>
                <div className="wsc-breakdown-bar">
                  <div
                    className="wsc-breakdown-fill"
                    style={{
                      width: `${item.percentage}%`,
                      background: item.color || "var(--gold)"
                    }}
                  />
                </div>
                <span className="wsc-breakdown-value">{item.score}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Compact Footer */}
      {compact && (
        <div className="wsc-compact-footer">
          <span className="wsc-omega-brief">OMEGA: {getOmegaMessage(score)}</span>
        </div>
      )}
    </div>
  );
}

function formatLabel(key: string): string {
  const labels: Record<string, string> = {
    community: "Community",
    academy: "Academy",
    market: "Market",
    work: "Work",
    intelligence: "AI Usage",
    engagement: "Engagement"
  };
  return labels[key] || key;
}

function getOmegaMessage(score: number): string {
  if (score >= 80) return "Outstanding performance!";
  if (score >= 60) return "Great progress!";
  if (score >= 40) return "Good start this week.";
  return "Let's get moving!";
}

const css = `
  .wsc-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 20px;
    position: relative;
    overflow: hidden;
    min-width: 240px;
  }

  .wsc-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--gold), transparent);
  }

  .wsc-card.compact {
    padding: 12px;
    min-width: 160px;
  }

  .wsc-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }

  .wsc-title {
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    font-size: 14px;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .wsc-icon {
    font-size: 16px;
  }

  .wsc-refresh {
    background: none;
    border: none;
    color: var(--text-dim);
    cursor: pointer;
    font-size: 16px;
    padding: 4px 8px;
    border-radius: 4px;
    transition: all 0.2s ease;
  }

  .wsc-refresh:hover {
    background: var(--surface2);
    color: var(--text);
  }

  .wsc-score-container {
    position: relative;
    width: 120px;
    height: 120px;
    margin: 0 auto 16px;
  }

  .compact .wsc-score-container {
    width: 80px;
    height: 80px;
    margin-bottom: 8px;
  }

  .wsc-ring {
    width: 100%;
    height: 100%;
  }

  .wsc-ring-fill {
    transition: stroke-dasharray 0.8s ease;
  }

  .wsc-score-value {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
  }

  .wsc-score-number {
    font-family: 'Cormorant Garamond', serif;
    font-size: 36px;
    font-weight: 600;
    line-height: 1;
  }

  .compact .wsc-score-number {
    font-size: 24px;
  }

  .wsc-score-label {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .wsc-trend {
    text-align: center;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    padding: 6px 12px;
    border-radius: 4px;
    margin-bottom: 16px;
  }

  .wsc-trend.up {
    background: rgba(45, 212, 160, 0.1);
    color: var(--green);
  }

  .wsc-trend.down {
    background: rgba(224, 90, 78, 0.1);
    color: var(--red);
  }

  .wsc-trend-icon {
    margin-right: 4px;
  }

  .wsc-breakdown {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .wsc-breakdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .wsc-breakdown-label {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    width: 80px;
    flex-shrink: 0;
  }

  .wsc-breakdown-bar {
    flex: 1;
    height: 6px;
    background: var(--surface2);
    border-radius: 3px;
    overflow: hidden;
  }

  .wsc-breakdown-fill {
    height: 100%;
    border-radius: 3px;
    transition: width 0.6s ease;
  }

  .wsc-breakdown-value {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: var(--text);
    width: 24px;
    text-align: right;
  }

  .wsc-compact-footer {
    text-align: center;
    margin-top: 8px;
  }

  .wsc-omega-brief {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    color: var(--text-dim);
    font-style: italic;
  }

  .wsc-card.loading {
    min-height: 200px;
  }

  .wsc-skeleton {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 180px;
  }

  .wsc-skeleton-score {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(90deg, var(--surface2) 25%, var(--border) 50%, var(--surface2) 75%);
    background-size: 200% 100%;
    animation: wsc-shimmer 1.5s infinite;
  }

  .wsc-skeleton-label {
    width: 80px;
    height: 14px;
    margin-top: 16px;
    border-radius: 4px;
    background: linear-gradient(90deg, var(--surface2) 25%, var(--border) 50%, var(--surface2) 75%);
    background-size: 200% 100%;
    animation: wsc-shimmer 1.5s infinite;
  }

  @keyframes wsc-shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }
`;
