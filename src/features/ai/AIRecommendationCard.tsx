// src/features/ai/AIRecommendationCard.tsx

import { useEffect, useState } from "react";
import { useAIStore } from "./aiStore";
import type { Recommendation, RecommendationType } from "./aiStore";

const css = `
  .ai-card {
    background: var(--surface); border: 1px solid rgba(201,168,76,0.15);
    border-radius: 6px; overflow: hidden; position: relative;
    font-family: 'Syne', sans-serif;
  }
  .ai-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--gold), var(--purple), var(--ice));
  }

  /* ── Header ── */
  .ai-card-header {
    padding: 14px 18px 12px;
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid var(--border); flex-wrap: wrap; gap: 8px;
  }
  .ai-card-title-row { display: flex; align-items: center; gap: 8px; }
  .ai-badge {
    font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 2px;
    text-transform: uppercase; color: var(--gold);
    background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.2);
    padding: 2px 8px; border-radius: 2px;
  }
  .ai-card-title { font-size: 13px; font-weight: 700; }

  .ai-controls { display: flex; gap: 6px; align-items: center; }
  .ai-period-btn {
    background: var(--surface2); border: 1px solid var(--border); border-radius: 2px;
    padding: 4px 9px; font-family: 'Space Mono', monospace; font-size: 9px;
    color: var(--text-dim); cursor: pointer; transition: all 0.15s;
  }
  .ai-period-btn:hover  { border-color: var(--gold); color: var(--gold); }
  .ai-period-btn.active { border-color: var(--gold); color: var(--gold); background: rgba(201,168,76,0.08); }
  .ai-refresh-btn {
    background: var(--gold); color: var(--bg); border: none; border-radius: 2px;
    padding: 4px 12px; font-family: 'Space Mono', monospace; font-size: 9px;
    cursor: pointer; font-weight: 700; transition: opacity 0.15s; letter-spacing: 0.5px;
  }
  .ai-refresh-btn:hover    { opacity: 0.88; }
  .ai-refresh-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* ── Summary ── */
  .ai-summary {
    padding: 12px 18px;
    background: rgba(201,168,76,0.03); border-bottom: 1px solid var(--border);
    font-size: 12px; line-height: 1.65; color: var(--text);
  }

  /* ── Streaming ── */
  .ai-streaming {
    padding: 14px 18px; font-family: 'Space Mono', monospace; font-size: 10px;
    color: var(--text-dim); line-height: 1.7; white-space: pre-wrap; word-break: break-word;
  }
  .ai-cursor {
    display: inline-block; width: 6px; height: 12px;
    background: var(--gold); margin-left: 2px;
    animation: ai-blink 0.8s step-end infinite;
  }

  /* ── Loading ── */
  .ai-loading {
    padding: 28px 18px; display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 10px;
  }
  .ai-spinner {
    width: 28px; height: 28px; border-radius: 50%;
    border: 2px solid var(--border); border-top-color: var(--gold);
    animation: ai-spin 0.8s linear infinite;
  }
  .ai-loading-text { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }

  /* ── Recommendations ── */
  .ai-recs { padding: 8px 10px 10px; display: flex; flex-direction: column; gap: 6px; }
  .ai-rec {
    background: var(--surface2); border: 1px solid var(--border); border-radius: 4px;
    padding: 12px 14px; display: grid; grid-template-columns: auto 1fr auto;
    gap: 10px; align-items: start; transition: border-color 0.15s;
    position: relative; overflow: hidden;
    animation: ai-fadeIn 0.3s ease forwards;
  }
  .ai-rec::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; }
  .ai-rec.high::before   { background: var(--red); }
  .ai-rec.medium::before { background: var(--gold); }
  .ai-rec.low::before    { background: var(--ice); }
  .ai-rec:hover { border-color: rgba(201,168,76,0.2); }

  .ai-rec-icon { font-size: 16px; margin-top: 1px; }
  .ai-rec-body { min-width: 0; }
  .ai-rec-title { font-size: 12px; font-weight: 700; margin-bottom: 4px; }
  .ai-rec-text  { font-size: 11px; color: var(--text-dim); line-height: 1.5; }

  .ai-rec-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
  .ai-rec-priority {
    font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 1px;
    text-transform: uppercase; padding: 2px 6px; border-radius: 2px;
  }
  .ai-rec-priority.high   { background: rgba(224,90,78,0.1);  color: var(--red);    border: 1px solid rgba(224,90,78,0.2); }
  .ai-rec-priority.medium { background: rgba(201,168,76,0.1); color: var(--gold);   border: 1px solid rgba(201,168,76,0.2); }
  .ai-rec-priority.low    { background: rgba(137,196,225,0.1);color: var(--ice);    border: 1px solid rgba(137,196,225,0.2); }
  .ai-rec-metric { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--gold); font-weight: 700; }
  .ai-rec-delta  { font-family: 'Space Mono', monospace; font-size: 9px;  color: var(--text-dim); }

  /* ── Empty / error ── */
  .ai-empty {
    padding: 28px 18px; text-align: center;
    font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim);
  }
  .ai-empty-icon { font-size: 28px; margin-bottom: 8px; }
  .ai-empty-btn {
    margin-top: 12px; background: var(--gold); color: var(--bg); border: none;
    border-radius: 3px; padding: 7px 18px; font-family: 'Syne', sans-serif;
    font-size: 12px; font-weight: 700; cursor: pointer; transition: opacity 0.15s;
  }
  .ai-empty-btn:hover { opacity: 0.88; }

  /* ── Footer ── */
  .ai-footer {
    padding: 7px 18px; border-top: 1px solid var(--border);
    font-family: 'Space Mono', monospace; font-size: 8px; color: var(--text-dim);
    display: flex; justify-content: space-between; align-items: center;
  }
  .ai-footer-left { display: flex; align-items: center; gap: 6px; }
  .ai-footer-dot  { width: 4px; height: 4px; border-radius: 50%; background: var(--green); box-shadow: 0 0 4px var(--green); animation: ai-pulse 2s ease infinite; }

  @keyframes ai-blink  { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
  @keyframes ai-spin   { to { transform: rotate(360deg); } }
  @keyframes ai-pulse  { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  @keyframes ai-fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
`;

const TYPE_ICONS: Record<RecommendationType, string> = {
  revenue_trend:      "📈",
  anomaly:            "⚠️",
  growth_opportunity: "🚀",
  team_performance:   "👥",
  churn_risk:         "🔴",
  action_item:        "✅",
};

type Period = "7d" | "30d" | "90d";

export default function AIRecommendationCard() {
  const { insight, isLoading, isStreaming, streamText, error, fetchInsights, streamInsights } = useAIStore();
  const [period, setPeriod] = useState<Period>("30d");

  useEffect(() => {
    const id = "ai-card-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id; tag.textContent = css;
      document.head.appendChild(tag);
    }
  }, []);

  useEffect(() => { fetchInsights(period); }, [period]);

  const isActive = isLoading || isStreaming;

  return (
    <div className="ai-card">

      {/* Header */}
      <div className="ai-card-header">
        <div className="ai-card-title-row">
          <span className="ai-badge">🧠 AI Insights</span>
          <span className="ai-card-title">Recommendations</span>
        </div>
        <div className="ai-controls">
          {(["7d", "30d", "90d"] as Period[]).map((p) => (
            <button key={p} className={`ai-period-btn${period === p ? " active" : ""}`} onClick={() => setPeriod(p)} disabled={isActive}>{p}</button>
          ))}
          <button className="ai-refresh-btn" onClick={() => streamInsights(period)} disabled={isActive}>
            {isStreaming ? "Thinking…" : "↺ Refresh"}
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && !streamText && (
        <div className="ai-loading">
          <div className="ai-spinner" />
          <div className="ai-loading-text">Analyzing your data with Claude…</div>
        </div>
      )}

      {/* Streaming */}
      {isStreaming && streamText && (
        <div className="ai-streaming">
          {streamText}<span className="ai-cursor" />
        </div>
      )}

      {/* Error */}
      {error && !isActive && (
        <div className="ai-empty">
          <div className="ai-empty-icon">⚠️</div>
          <div>Failed to load insights</div>
          <button className="ai-empty-btn" onClick={() => fetchInsights(period)}>Try Again</button>
        </div>
      )}

      {/* Results */}
      {insight && !isActive && (
        <>
          <div className="ai-summary">{insight.summary}</div>
          <div className="ai-recs">
            {insight.recommendations.map((rec: Recommendation, i: number) => (
              <div key={rec.id ?? i} className={`ai-rec ${rec.priority}`}>
                <div className="ai-rec-icon">{TYPE_ICONS[rec.type] ?? "💡"}</div>
                <div className="ai-rec-body">
                  <div className="ai-rec-title">{rec.title}</div>
                  <div className="ai-rec-text">{rec.body}</div>
                </div>
                <div className="ai-rec-right">
                  <span className={`ai-rec-priority ${rec.priority}`}>{rec.priority}</span>
                  {rec.metric && <span className="ai-rec-metric">{rec.metric}</span>}
                  {rec.delta  && <span className="ai-rec-delta">{rec.delta}</span>}
                </div>
              </div>
            ))}
          </div>
          <div className="ai-footer">
            <div className="ai-footer-left">
              <div className="ai-footer-dot" />
              Powered by Claude · {insight.recommendations.length} recommendations
            </div>
            <span>Generated {new Date(insight.generatedAt).toLocaleTimeString()}</span>
          </div>
        </>
      )}

      {/* Empty */}
      {!insight && !isActive && !error && (
        <div className="ai-empty">
          <div className="ai-empty-icon">🧠</div>
          <div>No insights yet</div>
          <button className="ai-empty-btn" onClick={() => fetchInsights(period)}>Generate Insights</button>
        </div>
      )}

    </div>
  );
}
