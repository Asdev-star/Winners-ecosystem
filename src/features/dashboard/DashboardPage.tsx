// src/features/dashboard/DashboardPage.tsx

import { useEffect } from "react";
import { useDashboardStore } from "./dashboardStore";
import AIRecommendationCard from "../ai/AIRecommendationCard";

const css = `
  .dash-root {
    padding: 28px 24px 60px; font-family: 'Syne', sans-serif; color: var(--text);
  }

  .dash-header { margin-bottom: 24px; }
  .dash-title { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
  .dash-title span { color: var(--gold); }
  .dash-subtitle { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); margin-top: 4px; }

  .dash-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }

  .dash-kpi {
    background: var(--surface); border: 1px solid var(--border); border-radius: 4px;
    padding: 18px 20px; position: relative; overflow: hidden; transition: border-color 0.15s;
  }
  .dash-kpi:hover { border-color: rgba(245,200,66,0.2); }
  .dash-kpi::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
  .dash-kpi.gold::before  { background: var(--gold); }
  .dash-kpi.green::before { background: #2DD4A0; }
  .dash-kpi.blue::before  { background: #4A9EFF; }
  .dash-kpi.red::before   { background: #FF5975; }

  .dash-kpi-label { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 10px; }
  .dash-kpi-value { font-size: 26px; font-weight: 800; letter-spacing: -1px; margin-bottom: 6px; }
  .dash-kpi-delta { font-family: 'Space Mono', monospace; font-size: 10px; }
  .dash-kpi-delta.up   { color: #2DD4A0; }
  .dash-kpi-delta.down { color: #FF5975; }
  .dash-kpi-delta.flat { color: var(--text-dim); }

  .dash-skeleton {
    background: linear-gradient(90deg, var(--surface2, #141B24) 25%, var(--surface) 50%, var(--surface2, #141B24) 75%);
    background-size: 200% 100%; border-radius: 3px;
    animation: dash-shimmer 1.4s infinite;
  }
  @keyframes dash-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  .dash-insight {
    background: var(--surface); border: 1px solid rgba(245,200,66,0.15);
    border-radius: 4px; padding: 14px 18px; margin-bottom: 24px;
    display: flex; align-items: flex-start; gap: 12px;
  }
  .dash-insight-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }
  .dash-insight-text { font-size: 13px; line-height: 1.5; color: var(--text-dim); }
  .dash-insight-text strong { color: var(--text); }

  .dash-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .dash-kpis { grid-template-columns: 1fr 1fr; gap: 12px; }
    .dash-kpi-value { font-size: 22px; }
  }

  @media (max-width: 600px) {
    .dash-root { padding: 16px 14px 80px; }
    .dash-kpis { grid-template-columns: 1fr 1fr; gap: 10px; }
    .dash-kpi { padding: 14px; }
    .dash-kpi-value { font-size: 20px; }
    .dash-kpi-label { font-size: 8px; }
    .dash-title { font-size: 20px; }
    .dash-subtitle { font-size: 10px; }
    .dash-insight { padding: 12px 14px; }
    .dash-insight-text { font-size: 12px; }
  }

  @media (max-width: 380px) {
    .dash-kpis { grid-template-columns: 1fr; }
  }
`;

function fmt(n: number) {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000)    return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}

function deltaClass(n: number) { return n > 0 ? "up" : n < 0 ? "down" : "flat"; }
function deltaLabel(n: number) {
  return `${n > 0 ? "▲" : n < 0 ? "▼" : "–"} ${Math.abs(n).toFixed(1)}% vs last period`;
}

export default function DashboardPage() {
  const { stats, isLoading, fetchStats } = useDashboardStore();

  useEffect(() => {
    const id = "dash-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id; tag.textContent = css;
      document.head.appendChild(tag);
    }
    fetchStats();
  }, []);

  const loading = isLoading || !stats;

  return (
    <div className="dash-root">

      <div className="dash-header">
        <h1 className="dash-title">Winners <span>Dashboard</span></h1>
        <p className="dash-subtitle">Last 30 days · Live data from your workspace</p>
      </div>

      {/* KPI Cards */}
      <div className="dash-kpis">

        <div className="dash-kpi gold">
          <div className="dash-kpi-label">Total Revenue</div>
          {loading
            ? <><div className="dash-skeleton" style={{ height: 32, width: "70%", marginBottom: 8 }} /><div className="dash-skeleton" style={{ height: 14, width: "50%" }} /></>
            : <>
                <div className="dash-kpi-value">{fmt(stats.totalRevenue)}</div>
                <div className={`dash-kpi-delta ${deltaClass(stats.revenueGrowth)}`}>{deltaLabel(stats.revenueGrowth)}</div>
              </>
          }
        </div>

        <div className="dash-kpi green">
          <div className="dash-kpi-label">Total Activity</div>
          {loading
            ? <><div className="dash-skeleton" style={{ height: 32, width: "70%", marginBottom: 8 }} /><div className="dash-skeleton" style={{ height: 14, width: "50%" }} /></>
            : <>
                <div className="dash-kpi-value">{stats.totalActivity.toLocaleString()}</div>
                <div className={`dash-kpi-delta ${deltaClass(stats.activityGrowth)}`}>{deltaLabel(stats.activityGrowth)}</div>
              </>
          }
        </div>

        <div className="dash-kpi blue">
          <div className="dash-kpi-label">Team Members</div>
          {loading
            ? <><div className="dash-skeleton" style={{ height: 32, width: "40%", marginBottom: 8 }} /><div className="dash-skeleton" style={{ height: 14, width: "60%" }} /></>
            : <>
                <div className="dash-kpi-value">{stats.teamMembers}</div>
                <div className="dash-kpi-delta flat">Active workspace members</div>
              </>
          }
        </div>

        <div className="dash-kpi gold">
          <div className="dash-kpi-label">Revenue Trend</div>
          {loading
            ? <><div className="dash-skeleton" style={{ height: 32, width: "50%", marginBottom: 8 }} /><div className="dash-skeleton" style={{ height: 14, width: "70%" }} /></>
            : <>
                <div className="dash-kpi-value" style={{ color: stats.trend === "up" ? "#2DD4A0" : stats.trend === "down" ? "#FF5975" : "var(--text)" }}>
                  {stats.trend === "up" ? "↑ Up" : stats.trend === "down" ? "↓ Down" : "→ Stable"}
                </div>
                <div className="dash-kpi-delta flat">vs previous period</div>
              </>
          }
        </div>

      </div>

      {/* Top Insight Banner */}
      {stats?.topInsight && (
        <div className="dash-insight">
          <div className="dash-insight-icon">💡</div>
          <div className="dash-insight-text"><strong>Insight: </strong>{stats.topInsight}</div>
        </div>
      )}

      {/* AI Card */}
      <div className="dash-grid">
        <AIRecommendationCard />
      </div>

    </div>
  );
}