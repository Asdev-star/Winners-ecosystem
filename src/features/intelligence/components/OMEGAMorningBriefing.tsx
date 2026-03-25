// Level VII - Predictive & Autonomous OMEGA
// Component: OMEGAMorningBriefing
// Daily autonomous intelligence report — what OMEGA did while the user slept,
// what's pending approval, and the strategic message for the day.

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  fetchMorningBriefing,
  fetchPendingActions,
  approveAction,
  declineAction,
  approveAll,
  getCategoryIcon,
  getCategoryLabel,
  getLayerColor,
  type MorningBriefing,
  type AutonomousAction,
} from "../../../services/omegaAutonomousService";

const css = `
.briefing-root {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  font-family: 'Syne', sans-serif;
}

.briefing-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 20px 24px 16px;
  background: linear-gradient(135deg,
    rgba(155,111,255,0.08) 0%,
    rgba(240,180,41,0.05) 100%
  );
  border-bottom: 1px solid var(--border);
  gap: 12px;
}

.briefing-omega-avatar {
  width: 44px; height: 44px; border-radius: 50%;
  background: linear-gradient(135deg, var(--green), var(--gold), var(--purple));
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; flex-shrink: 0;
}

.briefing-title-block { flex: 1; min-width: 0; }

.briefing-eyebrow {
  font-family: 'Space Mono', monospace;
  font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase;
  color: var(--gold); margin: 0 0 3px;
}

.briefing-title {
  font-size: 18px; font-weight: 700; color: var(--text);
  margin: 0 0 2px;
}

.briefing-date {
  font-size: 11px; color: var(--text-dim); margin: 0;
}

.briefing-status-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 8px var(--green);
  margin-top: 6px; flex-shrink: 0;
}

.briefing-omega-message {
  margin: 0;
  padding: 16px 24px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text);
  background: rgba(155,111,255,0.04);
  border-bottom: 1px solid var(--border);
  font-style: italic;
}

.briefing-omega-message::before {
  content: '"';
  color: var(--purple);
  font-size: 18px;
  line-height: 0;
  vertical-align: -4px;
  margin-right: 3px;
}

.briefing-omega-message::after {
  content: '"';
  color: var(--purple);
  font-size: 18px;
  line-height: 0;
  vertical-align: -4px;
  margin-left: 3px;
}

.briefing-stats {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 1px; background: var(--border);
  border-bottom: 1px solid var(--border);
}

.briefing-stat {
  background: var(--surface);
  padding: 14px 16px;
  text-align: center;
}

.briefing-stat-value {
  font-size: 22px; font-weight: 700;
  background: var(--grad-gold-text);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: block; margin-bottom: 3px;
}

.briefing-stat-label {
  font-family: 'Space Mono', monospace;
  font-size: 9px; color: var(--text-dim);
  text-transform: uppercase; letter-spacing: 0.08em;
}

.briefing-section {
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
}

.briefing-section:last-child { border-bottom: none; }

.briefing-section-title {
  font-family: 'Space Mono', monospace;
  font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--text-dim); margin: 0 0 12px;
  display: flex; align-items: center; gap: 8px;
}

.briefing-section-title-dot {
  width: 6px; height: 6px; border-radius: 50%;
}

.action-card {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 8px;
  transition: border-color 0.2s;
}

.action-card:last-child { margin-bottom: 0; }

.action-card.pending { border-left: 3px solid var(--gold); }
.action-card.completed { border-left: 3px solid var(--green); opacity: 0.85; }
.action-card.failed { border-left: 3px solid var(--red); opacity: 0.75; }

.action-card-top {
  display: flex; align-items: flex-start; gap: 10px; margin-bottom: 6px;
}

.action-icon {
  font-size: 18px; flex-shrink: 0; line-height: 1;
}

.action-meta { flex: 1; min-width: 0; }

.action-title {
  font-size: 13px; font-weight: 600; color: var(--text);
  margin: 0 0 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}

.action-desc {
  font-size: 11px; color: var(--text-dim); line-height: 1.5; margin: 0;
}

.action-tags {
  display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px;
}

.action-tag {
  font-family: 'Space Mono', monospace;
  font-size: 9px; letter-spacing: 0.05em;
  padding: 3px 7px; border-radius: 20px;
  border: 1px solid var(--border);
  background: var(--surface3);
}

.action-impact {
  font-size: 11px; color: var(--green); font-weight: 600;
}

.action-confidence {
  font-family: 'Space Mono', monospace; font-size: 9px;
  color: var(--text-dim);
}

.action-buttons {
  display: flex; gap: 6px; margin-top: 10px;
}

.btn-approve {
  flex: 1;
  padding: 7px 12px;
  background: var(--green);
  border: none; border-radius: 6px;
  color: var(--bg);
  font-family: 'Syne', sans-serif;
  font-size: 11px; font-weight: 700;
  cursor: pointer; transition: opacity 0.2s;
}
.btn-approve:hover { opacity: 0.85; }
.btn-approve:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-decline {
  padding: 7px 12px;
  background: none;
  border: 1px solid var(--border); border-radius: 6px;
  color: var(--text-dim);
  font-family: 'Syne', sans-serif;
  font-size: 11px;
  cursor: pointer; transition: all 0.2s;
}
.btn-decline:hover { border-color: var(--red); color: var(--red); }

.approve-all-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px;
  background: rgba(45,212,160,0.05);
  border: 1px solid rgba(45,212,160,0.15);
  border-radius: 8px;
  margin-bottom: 12px;
}

.approve-all-label {
  font-size: 12px; color: var(--green);
}

.btn-approve-all {
  padding: 6px 14px;
  background: rgba(45,212,160,0.15);
  border: 1px solid var(--green); border-radius: 6px;
  color: var(--green);
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  cursor: pointer; transition: background 0.2s;
}
.btn-approve-all:hover { background: rgba(45,212,160,0.25); }

.insight-list {
  display: flex; flex-direction: column; gap: 8px;
}

.insight-item {
  display: flex; align-items: flex-start; gap: 8px;
  font-size: 12px; color: var(--text); line-height: 1.5;
}

.insight-bullet {
  width: 5px; height: 5px; border-radius: 50%;
  background: var(--purple); margin-top: 5px; flex-shrink: 0;
}

.progress-bar-track {
  height: 4px; background: var(--surface3); border-radius: 2px;
  overflow: hidden; margin-top: 8px;
}

.progress-bar-fill {
  height: 100%; border-radius: 2px;
  background: linear-gradient(90deg, var(--green), var(--blue));
  transition: width 0.6s ease;
}

.loop-info {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 6px; font-size: 11px; color: var(--text-dim);
}

.briefing-footer {
  padding: 12px 24px;
  border-top: 1px solid var(--border);
  display: flex; justify-content: center;
}

.briefing-footer-link {
  font-family: 'Space Mono', monospace;
  font-size: 10px; letter-spacing: 0.06em;
  color: var(--purple); text-decoration: none;
  opacity: 0.8; transition: opacity 0.2s;
}
.briefing-footer-link:hover { opacity: 1; }

.skeleton-line {
  height: 12px; background: var(--surface2);
  border-radius: 6px; margin-bottom: 8px;
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0%   { opacity: 0.5; }
  50%  { opacity: 1; }
  100% { opacity: 0.5; }
}
`;

export default function OMEGAMorningBriefing() {
  const [briefing, setBriefing] = useState<MorningBriefing | null>(null);
  const [pendingActions, setPendingActions] = useState<AutonomousAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [b, actions] = await Promise.all([
        fetchMorningBriefing(),
        fetchPendingActions(),
      ]);
      setBriefing(b);
      setPendingActions(actions);
      setLoading(false);
    }
    load();
  }, []);

  const handleApprove = async (actionId: string) => {
    setApprovingId(actionId);
    const ok = await approveAction(actionId);
    if (ok) {
      setPendingActions((prev) =>
        prev.map((a) =>
          a.id === actionId ? { ...a, status: "approved" } : a
        )
      );
    }
    setApprovingId(null);
  };

  const handleDecline = async (actionId: string) => {
    const ok = await declineAction(actionId);
    if (ok) {
      setPendingActions((prev) => prev.filter((a) => a.id !== actionId));
    }
  };

  const handleApproveAll = async () => {
    const ids = pendingActions
      .filter((a) => a.status === "pending_approval")
      .map((a) => a.id);
    const ok = await approveAll(ids);
    if (ok) {
      setPendingActions((prev) =>
        prev.map((a) =>
          a.status === "pending_approval" ? { ...a, status: "approved" } : a
        )
      );
    }
  };

  const pendingCount = pendingActions.filter(
    (a) => a.status === "pending_approval"
  ).length;

  if (loading) {
    return (
      <div className="briefing-root" style={{ padding: 24 }}>
        <style>{css}</style>
        {[1, 2, 3].map((i) => (
          <div key={i} className="skeleton-line" style={{ width: `${70 + i * 10}%` }} />
        ))}
      </div>
    );
  }

  if (!briefing) return null;

  return (
    <div className="briefing-root">
      <style>{css}</style>

      {/* Header */}
      <div className="briefing-header">
        <div className="briefing-omega-avatar">🧠</div>
        <div className="briefing-title-block">
          <p className="briefing-eyebrow">OMEGA · Morning Intelligence</p>
          <h2 className="briefing-title">Good Morning Briefing</h2>
          <p className="briefing-date">{briefing.date}</p>
        </div>
        <div className="briefing-status-dot" title="OMEGA Active" />
      </div>

      {/* OMEGA Message */}
      <p className="briefing-omega-message">{briefing.omegaMessage}</p>

      {/* Stats row */}
      <div className="briefing-stats">
        <div className="briefing-stat">
          <span className="briefing-stat-value">
            {briefing.executedActions.length}
          </span>
          <span className="briefing-stat-label">Done</span>
        </div>
        <div className="briefing-stat">
          <span className="briefing-stat-value">{pendingCount}</span>
          <span className="briefing-stat-label">Awaiting</span>
        </div>
        <div className="briefing-stat">
          <span className="briefing-stat-value">
            {briefing.revenueActivity.opportunities}
          </span>
          <span className="briefing-stat-label">Opportunities</span>
        </div>
      </div>

      {/* Pending Actions */}
      {pendingActions.length > 0 && (
        <div className="briefing-section">
          <p className="briefing-section-title">
            <span
              className="briefing-section-title-dot"
              style={{ background: "var(--gold)" }}
            />
            Awaiting Your Approval
          </p>

          {pendingCount > 1 && (
            <div className="approve-all-bar">
              <span className="approve-all-label">
                Approve all {pendingCount} actions at once
              </span>
              <button className="btn-approve-all" onClick={handleApproveAll}>
                Approve All
              </button>
            </div>
          )}

          {pendingActions.map((action) => (
            <div
              key={action.id}
              className={`action-card ${
                action.status === "approved" ? "completed" : "pending"
              }`}
            >
              <div className="action-card-top">
                <span className="action-icon">
                  {getCategoryIcon(action.category)}
                </span>
                <div className="action-meta">
                  <p className="action-title">{action.title}</p>
                  <p className="action-desc">{action.description}</p>
                </div>
              </div>
              <div className="action-tags">
                <span
                  className="action-tag"
                  style={{ color: getLayerColor(action.layer) }}
                >
                  {action.layer}
                </span>
                <span className="action-tag">
                  {getCategoryLabel(action.category)}
                </span>
                <span className="action-impact">{action.estimatedImpact}</span>
                <span className="action-confidence">
                  {action.confidence}% match
                </span>
              </div>

              {action.status === "pending_approval" && (
                <div className="action-buttons">
                  <button
                    className="btn-approve"
                    onClick={() => handleApprove(action.id)}
                    disabled={approvingId === action.id}
                  >
                    {approvingId === action.id ? "Approving…" : "✓ Approve"}
                  </button>
                  <button
                    className="btn-decline"
                    onClick={() => handleDecline(action.id)}
                  >
                    Skip
                  </button>
                </div>
              )}

              {action.status === "approved" && (
                <p
                  style={{
                    marginTop: 8,
                    fontSize: 11,
                    color: "var(--green)",
                    fontWeight: 600,
                  }}
                >
                  ✓ Approved — executing shortly
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Executed Actions */}
      {briefing.executedActions.length > 0 && (
        <div className="briefing-section">
          <p className="briefing-section-title">
            <span
              className="briefing-section-title-dot"
              style={{ background: "var(--green)" }}
            />
            Completed While You Slept
          </p>
          {briefing.executedActions.map((action) => (
            <div key={action.id} className="action-card completed">
              <div className="action-card-top">
                <span className="action-icon">
                  {getCategoryIcon(action.category)}
                </span>
                <div className="action-meta">
                  <p className="action-title">{action.title}</p>
                  <p className="action-desc">
                    {action.result ?? action.description}
                  </p>
                </div>
              </div>
              <div className="action-tags">
                <span
                  className="action-tag"
                  style={{ color: getLayerColor(action.layer) }}
                >
                  {action.layer}
                </span>
                <span className="action-impact">{action.estimatedImpact}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Insights */}
      {briefing.insights.length > 0 && (
        <div className="briefing-section">
          <p className="briefing-section-title">
            <span
              className="briefing-section-title-dot"
              style={{ background: "var(--purple)" }}
            />
            Overnight Intelligence
          </p>
          <div className="insight-list">
            {briefing.insights.map((insight, i) => (
              <div key={i} className="insight-item">
                <span className="insight-bullet" />
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loop Progress */}
      <div className="briefing-section">
        <p className="briefing-section-title">
          <span
            className="briefing-section-title-dot"
            style={{ background: "var(--blue)" }}
          />
          Agentic Loop Progress
        </p>
        <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
          {briefing.loopProgress.nextMilestone}
        </div>
        <div className="progress-bar-track">
          <div
            className="progress-bar-fill"
            style={{ width: `${briefing.loopProgress.progress}%` }}
          />
        </div>
        <div className="loop-info">
          <span style={{ textTransform: "capitalize", color: "var(--text)" }}>
            Stage: {briefing.loopProgress.stage}
          </span>
          <span>{briefing.loopProgress.progress}% complete</span>
        </div>
      </div>

      {/* Footer */}
      <div className="briefing-footer">
        <Link to="/intelligence/omega" className="briefing-footer-link">
          View Full OMEGA Dashboard →
        </Link>
      </div>
    </div>
  );
}
