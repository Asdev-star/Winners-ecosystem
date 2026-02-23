// src/features/analytics/components/AIInsightPanel.tsx

import { useAnalyticsStore } from "../analyticsStore";

const css = `
  .aip-card {
    background: var(--surface); border: 1px solid rgba(201,168,76,0.15);
    border-radius: 6px; padding: 16px 18px; margin-top: 16px;
    font-family: 'Syne', sans-serif; color: var(--text);
    position: relative; overflow: hidden;
  }
  .aip-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--gold), var(--purple));
  }
  .aip-header { display: flex; align-items: center; gap: 8px; margin-bottom: 14px; }
  .aip-badge {
    font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 2px;
    text-transform: uppercase; color: var(--gold);
    background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.2);
    padding: 2px 8px; border-radius: 2px;
  }
  .aip-title  { font-size: 13px; font-weight: 700; }
  .aip-period { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); margin-left: auto; }

  .aip-insights { display: flex; flex-direction: column; gap: 8px; }
  .aip-insight {
    background: var(--surface2); border: 1px solid var(--border); border-radius: 4px;
    padding: 12px 14px; position: relative; overflow: hidden; transition: border-color 0.15s;
  }
  .aip-insight:hover { border-color: rgba(201,168,76,0.2); }
  .aip-insight::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; }
  .aip-insight.activity::before { background: var(--ice); }
  .aip-insight.revenue::before  { background: var(--gold); }
  .aip-insight-label {
    font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 1.5px;
    text-transform: uppercase; color: var(--text-dim); margin-bottom: 6px;
  }
  .aip-insight-text { font-size: 13px; color: var(--text); line-height: 1.5; }

  .aip-loading {
    display: flex; align-items: center; gap: 8px;
    font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); padding: 12px 0;
  }
  .aip-spinner {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid var(--border); border-top-color: var(--gold);
    animation: aip-spin 0.8s linear infinite; flex-shrink: 0;
  }
  @keyframes aip-spin { to { transform: rotate(360deg); } }
`;

if (typeof document !== "undefined" && !document.getElementById("aip-styles")) {
  const tag = document.createElement("style");
  tag.id = "aip-styles"; tag.textContent = css;
  document.head.appendChild(tag);
}

function analyzeTrend(values: number[]): string {
  if (values.length < 2) return "Not enough data.";
  const first  = values[0];
  const last   = values[values.length - 1];
  if (first === 0) return "Stable performance across the selected period.";
  const change = ((last - first) / first) * 100;
  if (change > 10)  return "📈 Strong upward growth trend detected.";
  if (change > 0)   return "📊 Moderate growth observed.";
  if (change < -10) return "📉 Significant decline detected.";
  if (change < 0)   return "⚠ Slight downward trend observed.";
  return "Stable performance across the selected period.";
}

export default function AIInsightPanel() {
  const data      = useAnalyticsStore((s) => s.data);
  const period    = useAnalyticsStore((s) => s.period);
  const isLoading = useAnalyticsStore((s) => s.isLoading);

  const activityInsight = analyzeTrend(data.map((d) => d.activity));
  const revenueInsight  = analyzeTrend(data.map((d) => d.revenue));

  return (
    <div className="aip-card">
      <div className="aip-header">
        <span className="aip-badge">🧠 AI</span>
        <span className="aip-title">Quick Insights</span>
        <span className="aip-period">{period}</span>
      </div>

      {isLoading ? (
        <div className="aip-loading">
          <div className="aip-spinner" /> Analyzing data…
        </div>
      ) : (
        <div className="aip-insights">
          <div className="aip-insight activity">
            <div className="aip-insight-label">User Activity</div>
            <div className="aip-insight-text">{activityInsight}</div>
          </div>
          <div className="aip-insight revenue">
            <div className="aip-insight-label">Revenue Trend</div>
            <div className="aip-insight-text">{revenueInsight}</div>
          </div>
        </div>
      )}
    </div>
  );
}