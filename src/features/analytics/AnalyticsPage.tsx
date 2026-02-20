// src/features/analytics/AnalyticsPage.tsx

import { useState, useMemo } from "react";
import type { ReactNode } from "react";
import {
  ComposedChart, Area, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceDot,
} from "recharts";
import {
  getMockData,
  getPreviousPeriodData,
  generateForecast,
  generateInsights,
  calcTotal,
  calcGrowth,
  calcAverage,
  detectAnomalies,
} from "../../lib/analyticsEngine";
import type { Period, ForecastPoint } from "../../lib/analyticsEngine";

// ─── Styles ───────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .an-root {
    --gold: #F5C842;
    --bg: #080B10;
    --surface: #0D1117;
    --surface2: #141B24;
    --border: #1E2A38;
    --text: #E8EDF2;
    --text-dim: #5A6878;
    --green: #2DD4A0;
    --blue: #4A9EFF;
    --red: #FF5975;
    --purple: #9B6FFF;
    background: var(--bg);
    color: var(--text);
    font-family: 'Syne', sans-serif;
    min-height: 100vh;
    padding: 32px 24px 80px;
  }

  .an-inner { max-width: 1200px; margin: 0 auto; }

  /* Header */
  .an-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 32px;
  }

  .an-title {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.5px;
  }

  .an-title span { color: var(--gold); }
  .an-subtitle { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); margin-top: 4px; }

  /* Controls */
  .an-controls { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }

  .an-period-btn {
    background: var(--surface);
    border: 1px solid var(--border);
    color: var(--text-dim);
    padding: 7px 16px;
    border-radius: 3px;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    cursor: pointer;
    transition: all 0.15s;
    letter-spacing: 1px;
  }

  .an-period-btn:hover { border-color: var(--gold); color: var(--gold); }
  .an-period-btn.active { background: rgba(245,200,66,0.1); border-color: var(--gold); color: var(--gold); }

  .an-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: var(--text-dim);
    padding: 7px 14px;
    border: 1px solid var(--border);
    border-radius: 3px;
    background: var(--surface);
    transition: all 0.15s;
    user-select: none;
  }

  .an-toggle:hover { border-color: var(--purple); color: var(--purple); }
  .an-toggle.on { border-color: var(--purple); color: var(--purple); background: rgba(155,111,255,0.08); }

  .an-toggle-dot {
    width: 28px; height: 16px;
    border-radius: 8px;
    background: var(--border);
    position: relative;
    transition: background 0.2s;
  }

  .an-toggle.on .an-toggle-dot { background: var(--purple); }

  .an-toggle-dot::after {
    content: '';
    position: absolute;
    width: 10px; height: 10px;
    border-radius: 50%;
    background: white;
    top: 3px; left: 3px;
    transition: left 0.2s;
  }

  .an-toggle.on .an-toggle-dot::after { left: 15px; }

  /* KPI Cards */
  .an-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }

  .an-kpi {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 18px 20px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.2s;
  }

  .an-kpi::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
  }

  .an-kpi.gold::before   { background: var(--gold); }
  .an-kpi.green::before  { background: var(--green); }
  .an-kpi.blue::before   { background: var(--blue); }
  .an-kpi.purple::before { background: var(--purple); }

  .an-kpi-label { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
  .an-kpi-value { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 6px; }
  .an-kpi.gold .an-kpi-value   { color: var(--gold); }
  .an-kpi.green .an-kpi-value  { color: var(--green); }
  .an-kpi.blue .an-kpi-value   { color: var(--blue); }
  .an-kpi.purple .an-kpi-value { color: var(--purple); }

  .an-kpi-growth {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 7px;
    border-radius: 2px;
  }

  .an-kpi-growth.up   { background: rgba(45,212,160,0.1); color: var(--green); }
  .an-kpi-growth.down { background: rgba(255,89,117,0.1); color: var(--red); }
  .an-kpi-growth.flat { background: rgba(90,104,120,0.15); color: var(--text-dim); }

  /* Chart Card */
  .an-chart-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 24px;
    margin-bottom: 20px;
  }

  .an-chart-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 8px;
  }

  .an-chart-title {
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 0.2px;
  }

  .an-chart-meta { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }

  .an-legend { display: flex; gap: 16px; flex-wrap: wrap; }
  .an-legend-item { display: flex; align-items: center; gap: 6px; font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }
  .an-legend-dot { width: 8px; height: 8px; border-radius: 50%; }
  .an-legend-line { width: 16px; height: 2px; border-radius: 1px; }
  .an-legend-dash { width: 16px; height: 2px; border-top: 2px dashed; }

  /* Anomaly badge */
  .an-spike-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 9px;
    border-radius: 2px;
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 1px;
    background: rgba(255,89,117,0.1);
    color: var(--red);
    border: 1px solid rgba(255,89,117,0.25);
  }

  .an-spike-badge::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: var(--red); }

  /* AI Insight Card */
  .an-insight {
    background: var(--surface);
    border: 1px solid rgba(245,200,66,0.2);
    border-radius: 4px;
    padding: 22px 24px;
    margin-bottom: 20px;
    position: relative;
    overflow: hidden;
  }

  .an-insight::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--gold), var(--purple));
  }

  .an-insight-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 14px;
  }

  .an-insight-badge {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--gold);
    background: rgba(245,200,66,0.08);
    border: 1px solid rgba(245,200,66,0.2);
    padding: 3px 9px;
    border-radius: 2px;
  }

  .an-insight-trend {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    padding: 3px 9px;
    border-radius: 2px;
  }

  .an-insight-trend.up     { background: rgba(45,212,160,0.1);  color: var(--green); }
  .an-insight-trend.down   { background: rgba(255,89,117,0.1);  color: var(--red); }
  .an-insight-trend.flat   { background: rgba(90,104,120,0.15); color: var(--text-dim); }

  .an-insight-primary {
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 8px;
    line-height: 1.4;
  }

  .an-insight-secondary {
    font-size: 13px;
    color: var(--text-dim);
    line-height: 1.5;
  }

  .an-insight-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-top: 18px;
    padding-top: 18px;
    border-top: 1px solid var(--border);
  }

  .an-insight-stat { text-align: center; }
  .an-insight-stat-val { font-size: 18px; font-weight: 800; color: var(--gold); }
  .an-insight-stat-lbl { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); margin-top: 3px; letter-spacing: 1px; text-transform: uppercase; }

  /* Activity Chart */
  .an-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }

  /* Tooltip */
  .an-tooltip {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 12px 14px;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
  }

  .an-tooltip-label { color: var(--gold); font-weight: 700; margin-bottom: 6px; }
  .an-tooltip-row   { display: flex; justify-content: space-between; gap: 16px; color: var(--text-dim); margin-top: 3px; }
  .an-tooltip-val   { color: var(--text); font-weight: 700; }

  @media (max-width: 768px) {
    .an-kpis { grid-template-columns: repeat(2, 1fr); }
    .an-grid  { grid-template-columns: 1fr; }
  }

  @media (max-width: 480px) {
    .an-kpis { grid-template-columns: 1fr; }
  }
`;

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const rows = payload.filter((p: any) => p.value != null && p.value !== 0);
  return (
    <div className="an-tooltip">
      <div className="an-tooltip-label">{label}</div>
      {rows.map((p: any) => (
        <div className="an-tooltip-row" key={p.dataKey}>
          <span>{p.name}</span>
          <span className="an-tooltip-val">
            {p.dataKey.toLowerCase().includes("revenue") || p.dataKey.toLowerCase().includes("bound") || p.dataKey.toLowerCase().includes("forecast")
              ? `$${p.value.toLocaleString()}`
              : p.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiProps {
  label: string;
  value: string;
  growth: number;
  color: "gold" | "green" | "blue" | "purple";
}

const KpiCard = ({ label, value, growth, color }: KpiProps) => {
  const dir = growth > 1 ? "up" : growth < -1 ? "down" : "flat";
  return (
    <div className={`an-kpi ${color}`}>
      <div className="an-kpi-label">{label}</div>
      <div className="an-kpi-value">{value}</div>
      <span className={`an-kpi-growth ${dir}`}>
        {dir === "up" ? "▲" : dir === "down" ? "▼" : "●"} {Math.abs(growth)}%
      </span>
    </div>
  );
};

// ─── Section wrapper ──────────────────────────────────────────────────────────

const ChartCard = ({ title, meta, legend, children }: { title: string; meta?: ReactNode; legend?: ReactNode; children: ReactNode }) => (
  <div className="an-chart-card">
    <div className="an-chart-header">
      <div>
        <div className="an-chart-title">{title}</div>
        {meta && <div className="an-chart-meta">{meta}</div>}
      </div>
      {legend}
    </div>
    {children}
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod]           = useState<Period>("30d");
  const [showForecast, setForecast]   = useState(false);
  const [showComparison, setComparison] = useState(false);

  // Inject styles
  useState(() => {
    const id = "an-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id;
      tag.textContent = css;
      document.head.appendChild(tag);
    }
  });

  const currentData  = useMemo(() => getMockData(period), [period]);
  const previousData = useMemo(() => getPreviousPeriodData(period), [period]);
  const forecastData = useMemo(() => generateForecast(currentData, 7), [currentData]);
  const insights     = useMemo(() => generateInsights(currentData, previousData, period), [currentData, previousData, period]);
  const anomalySet   = useMemo(() => detectAnomalies(currentData), [currentData]);

  const curRevTotal  = calcTotal(currentData, "revenue");
  const prevRevTotal = calcTotal(previousData, "revenue");
  const curActTotal  = calcTotal(currentData, "activity");
  const prevActTotal = calcTotal(previousData, "activity");
  const avgRevenue   = calcAverage(currentData, "revenue");

  // Merge comparison data (align by index, label by current date)
  const comparisonData = currentData.map((d, i) => ({
    ...d,
    prevRevenue: previousData[i]?.revenue ?? 0,
  }));

  // Chart data: use forecast when toggled, else current
  const revenueChartData: ForecastPoint[] = showForecast
    ? forecastData
    : currentData.map((d, i) => ({ ...d, isAnomaly: anomalySet.has(i) }));

  const anomalyPoints = revenueChartData
    .map((d, i) => ({ ...d, index: i }))
    .filter((d) => d.isAnomaly);

  const periodLabel = period === "7d" ? "7 Days" : period === "30d" ? "30 Days" : "90 Days";

  return (
    <div className="an-root">
      <div className="an-inner">

        {/* Header */}
        <div className="an-header">
          <div>
            <h1 className="an-title">Analytics <span>Intelligence</span></h1>
            <p className="an-subtitle">Winners Ecosystem · {periodLabel} · {currentData.length} data points</p>
          </div>

          <div className="an-controls">
            {/* Period Selector */}
            {(["7d", "30d", "90d"] as Period[]).map((p) => (
              <button
                key={p}
                className={`an-period-btn${period === p ? " active" : ""}`}
                onClick={() => setPeriod(p)}
              >
                {p}
              </button>
            ))}

            {/* Forecast Toggle */}
            <div
              className={`an-toggle${showForecast ? " on" : ""}`}
              onClick={() => setForecast((v) => !v)}
            >
              <div className="an-toggle-dot" />
              Forecast
            </div>

            {/* Comparison Toggle */}
            <div
              className={`an-toggle${showComparison ? " on" : ""}`}
              onClick={() => setComparison((v) => !v)}
            >
              <div className="an-toggle-dot" />
              Compare
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="an-kpis">
          <KpiCard
            label="Total Revenue"
            value={`$${curRevTotal.toLocaleString()}`}
            growth={calcGrowth(curRevTotal, prevRevTotal)}
            color="gold"
          />
          <KpiCard
            label="Avg Daily Revenue"
            value={`$${avgRevenue.toLocaleString()}`}
            growth={calcGrowth(avgRevenue, calcAverage(previousData, "revenue"))}
            color="green"
          />
          <KpiCard
            label="Total Activity"
            value={curActTotal.toLocaleString()}
            growth={calcGrowth(curActTotal, prevActTotal)}
            color="blue"
          />
          <KpiCard
            label="Forecast Growth"
            value={`${insights.forecastGrowth > 0 ? "+" : ""}${insights.forecastGrowth}%`}
            growth={insights.forecastGrowth}
            color="purple"
          />
        </div>

        {/* AI Insight Summary Card */}
        <div className="an-insight">
          <div className="an-insight-header">
            <span className="an-insight-badge">🧠 AI Insight</span>
            <span className={`an-insight-trend ${insights.trend}`}>
              {insights.trend === "up" ? "▲ Trending Up" : insights.trend === "down" ? "▼ Trending Down" : "● Stable"}
            </span>
            {insights.anomalyCount > 0 && (
              <span className="an-spike-badge">{insights.anomalyCount} spike{insights.anomalyCount > 1 ? "s" : ""} detected</span>
            )}
          </div>
          <div className="an-insight-primary">{insights.topInsight}</div>
          <div className="an-insight-secondary">{insights.secondaryInsight}</div>
          <div className="an-insight-grid">
            <div className="an-insight-stat">
              <div className="an-insight-stat-val">{insights.revenueGrowth > 0 ? "+" : ""}{insights.revenueGrowth}%</div>
              <div className="an-insight-stat-lbl">Revenue Growth</div>
            </div>
            <div className="an-insight-stat">
              <div className="an-insight-stat-val">{insights.activityGrowth > 0 ? "+" : ""}{insights.activityGrowth}%</div>
              <div className="an-insight-stat-lbl">Activity Growth</div>
            </div>
            <div className="an-insight-stat">
              <div className="an-insight-stat-val">{insights.forecastGrowth > 0 ? "+" : ""}{insights.forecastGrowth}%</div>
              <div className="an-insight-stat-lbl">7-Day Forecast</div>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <ChartCard
          title="Revenue"
          meta={showForecast ? `${currentData.length} actual + 7 forecast days` : `${currentData.length} days actual`}
          legend={
            <div className="an-legend">
              <div className="an-legend-item"><div className="an-legend-dot" style={{ background: "#F5C842" }} />Revenue</div>
              {showForecast && <>
                <div className="an-legend-item"><div className="an-legend-line" style={{ background: "#9B6FFF" }} />Forecast</div>
                <div className="an-legend-item"><div className="an-legend-line" style={{ background: "rgba(155,111,255,0.3)" }} />Confidence Band</div>
              </>}
              {showComparison && <div className="an-legend-item"><div className="an-legend-dash" style={{ borderColor: "#4A9EFF" }} />Prev Period</div>}
              <div className="an-legend-item"><div className="an-legend-dot" style={{ background: "#FF5975" }} />Spike</div>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={320}>
            <ComposedChart data={showComparison ? comparisonData : revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F5C842" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#F5C842" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9B6FFF" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="#9B6FFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E2A38" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#5A6878", fontSize: 10, fontFamily: "Space Mono" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "#5A6878", fontSize: 10, fontFamily: "Space Mono" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />

              {/* Confidence Band */}
              {showForecast && (
                <>
                  <Area dataKey="upperBound" fill="url(#bandGrad)" stroke="none" name="Upper Bound" />
                  <Area dataKey="lowerBound" fill="#080B10" stroke="none" name="Lower Bound" />
                </>
              )}

              {/* Previous Period Overlay */}
              {showComparison && (
                <Line dataKey="prevRevenue" stroke="#4A9EFF" strokeWidth={1.5} strokeDasharray="5 3" dot={false} name="Prev Revenue" />
              )}

              {/* Actual Revenue */}
              <Area
                dataKey="revenue"
                stroke="#F5C842"
                strokeWidth={2}
                fill="url(#revGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#F5C842" }}
                name="Revenue"
              />

              {/* Forecast Line */}
              {showForecast && (
                <Line dataKey="forecastRevenue" stroke="#9B6FFF" strokeWidth={2} strokeDasharray="6 3" dot={false} name="Forecast" />
              )}

              {/* Anomaly Spike Dots */}
              {anomalyPoints.map((point) => (
                <ReferenceDot
                  key={point.date}
                  x={point.date}
                  y={point.revenue}
                  r={5}
                  fill="#FF5975"
                  stroke="#FF5975"
                  strokeOpacity={0.3}
                  strokeWidth={6}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Activity + Comparison Grid */}
        <div className="an-grid">

          {/* Activity Chart */}
          <ChartCard title="Activity" meta="Daily engagement events">
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={currentData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4A9EFF" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#4A9EFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2A38" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#5A6878", fontSize: 10, fontFamily: "Space Mono" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: "#5A6878", fontSize: 10, fontFamily: "Space Mono" }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area dataKey="activity" stroke="#4A9EFF" strokeWidth={2} fill="url(#actGrad)" dot={false} name="Activity" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Period Comparison Bar Chart */}
          <ChartCard title="Period Comparison" meta="Current vs previous period revenue">
            <ResponsiveContainer width="100%" height={220}>
              <ComposedChart data={comparisonData.slice(0, 14)} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E2A38" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#5A6878", fontSize: 10, fontFamily: "Space Mono" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: "#5A6878", fontSize: 10, fontFamily: "Space Mono" }} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue"     fill="rgba(245,200,66,0.7)"  radius={[2, 2, 0, 0]} name="Current" />
                <Bar dataKey="prevRevenue" fill="rgba(74,158,255,0.35)" radius={[2, 2, 0, 0]} name="Previous" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

        </div>

      </div>
    </div>
  );
}