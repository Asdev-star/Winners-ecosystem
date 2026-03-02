// src/features/analytics/components/AnalyticsPage.tsx

import { useState, useMemo } from "react";
import type { ReactNode } from "react";
import {
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
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

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .an-root {
    background: var(--bg); color: var(--text);
    font-family: 'Syne', sans-serif;
    min-height: 100vh; padding: 28px 24px 80px;
  }

  .an-inner { max-width: 1200px; margin: 0 auto; }

  /* ── Header ── */
  .an-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    flex-wrap: wrap; gap: 16px; margin-bottom: 28px;
  }
  .an-title { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
  .an-title span { color: var(--gold); }
  .an-subtitle { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); margin-top: 4px; }

  /* ── Controls ── */
  .an-controls { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  .an-period-btn {
    background: var(--surface); border: 1px solid var(--border); color: var(--text-dim);
    padding: 7px 14px; border-radius: 3px; font-family: 'Space Mono', monospace;
    font-size: 10px; cursor: pointer; transition: all 0.15s; letter-spacing: 1px;
  }
  .an-period-btn:hover { border-color: var(--gold); color: var(--gold); }
  .an-period-btn.active { background: rgba(201,168,76,0.1); border-color: var(--gold); color: var(--gold); }

  .an-toggle {
    display: flex; align-items: center; gap: 8px; cursor: pointer;
    font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim);
    padding: 7px 12px; border: 1px solid var(--border); border-radius: 3px;
    background: var(--surface); transition: all 0.15s; user-select: none;
  }
  .an-toggle:hover { border-color: var(--ice); color: var(--ice); }
  .an-toggle.on { border-color: var(--purple); color: var(--purple); background: rgba(155,111,255,0.08); }
  .an-toggle-dot {
    width: 26px; height: 14px; border-radius: 7px; background: var(--border);
    position: relative; transition: background 0.2s; flex-shrink: 0;
  }
  .an-toggle.on .an-toggle-dot { background: var(--purple); }
  .an-toggle-dot::after {
    content: ''; position: absolute; width: 8px; height: 8px; border-radius: 50%;
    background: white; top: 3px; left: 3px; transition: left 0.2s;
  }
  .an-toggle.on .an-toggle-dot::after { left: 15px; }

  /* ── KPI Cards ── */
  .an-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
  .an-kpi {
    background: var(--surface); border: 1px solid var(--border); border-radius: 6px;
    padding: 16px 18px; position: relative; overflow: hidden; transition: border-color 0.15s;
  }
  .an-kpi:hover { border-color: rgba(201,168,76,0.2); }
  .an-kpi::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
  .an-kpi.gold::before   { background: linear-gradient(90deg, var(--gold), var(--gold2)); }
  .an-kpi.green::before  { background: linear-gradient(90deg, var(--green), #6EE7C7); }
  .an-kpi.blue::before   { background: linear-gradient(90deg, var(--blue), var(--ice)); }
  .an-kpi.purple::before { background: linear-gradient(90deg, var(--purple), #C4A8FF); }
  .an-kpi-label { font-family: 'Space Mono', monospace; font-size: 8px; color: var(--text-dim); letter-spacing: 2px; text-transform: uppercase; margin-bottom: 8px; }
  .an-kpi-value { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 6px; }
  .an-kpi.gold .an-kpi-value   { color: var(--gold); }
  .an-kpi.green .an-kpi-value  { color: var(--green); }
  .an-kpi.blue .an-kpi-value   { color: var(--ice); }
  .an-kpi.purple .an-kpi-value { color: var(--purple); }
  .an-kpi-growth {
    font-family: 'Space Mono', monospace; font-size: 9px;
    display: inline-flex; align-items: center; gap: 4px;
    padding: 2px 7px; border-radius: 2px;
  }
  .an-kpi-growth.up   { background: rgba(45,212,160,0.1);  color: var(--green); }
  .an-kpi-growth.down { background: rgba(224,90,78,0.1);   color: var(--red); }
  .an-kpi-growth.flat { background: rgba(90,122,150,0.12); color: var(--text-dim); }

  /* ── Chart Card ── */
  .an-chart-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 6px;
    padding: 20px 22px; margin-bottom: 16px;
  }
  .an-chart-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 18px; flex-wrap: wrap; gap: 8px;
  }
  .an-chart-title { font-size: 13px; font-weight: 700; }
  .an-chart-meta  { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); margin-top: 2px; }
  .an-legend { display: flex; gap: 14px; flex-wrap: wrap; }
  .an-legend-item { display: flex; align-items: center; gap: 5px; font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); }
  .an-legend-dot  { width: 7px; height: 7px; border-radius: 50%; }
  .an-legend-line { width: 14px; height: 2px; border-radius: 1px; }
  .an-legend-dash { width: 14px; height: 2px; border-top: 2px dashed; }

  /* ── Anomaly badge ── */
  .an-spike-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 2px 8px; border-radius: 2px; font-family: 'Space Mono', monospace;
    font-size: 8px; letter-spacing: 1px;
    background: rgba(224,90,78,0.1); color: var(--red); border: 1px solid rgba(224,90,78,0.2);
  }
  .an-spike-badge::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: var(--red); }

  /* ── AI Insight ── */
  .an-insight {
    background: var(--surface); border: 1px solid rgba(201,168,76,0.18);
    border-radius: 6px; padding: 20px 22px; margin-bottom: 16px;
    position: relative; overflow: hidden;
  }
  .an-insight::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--gold), var(--purple), var(--ice));
  }
  .an-insight-header { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
  .an-insight-badge {
    font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 2px;
    text-transform: uppercase; color: var(--gold);
    background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.2);
    padding: 3px 9px; border-radius: 2px;
  }
  .an-insight-trend { font-family: 'Space Mono', monospace; font-size: 9px; padding: 2px 8px; border-radius: 2px; }
  .an-insight-trend.up   { background: rgba(45,212,160,0.1);  color: var(--green); }
  .an-insight-trend.down { background: rgba(224,90,78,0.1);   color: var(--red); }
  .an-insight-trend.flat { background: rgba(90,122,150,0.12); color: var(--text-dim); }
  .an-insight-primary   { font-size: 14px; font-weight: 700; margin-bottom: 6px; line-height: 1.4; }
  .an-insight-secondary { font-size: 12px; color: var(--text-dim); line-height: 1.55; }
  .an-insight-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;
    margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border);
  }
  .an-insight-stat { text-align: center; }
  .an-insight-stat-val { font-size: 18px; font-weight: 800; color: var(--gold); }
  .an-insight-stat-lbl { font-family: 'Space Mono', monospace; font-size: 8px; color: var(--text-dim); margin-top: 3px; letter-spacing: 1px; text-transform: uppercase; }

  /* ── Grid ── */
  .an-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 16px; }

  /* ── Ecosystem context bar ── */
  .an-eco-bar {
    background: linear-gradient(135deg, rgba(43,95,142,0.1), rgba(201,168,76,0.05));
    border: 1px solid rgba(43,95,142,0.2); border-radius: 6px;
    padding: 12px 16px; margin-bottom: 20px;
    display: flex; align-items: center; gap: 16px; flex-wrap: wrap;
  }
  .an-eco-label { font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: var(--ice); flex-shrink: 0; }
  .an-eco-chips { display: flex; gap: 8px; flex-wrap: wrap; }
  .an-eco-chip {
    font-family: 'Space Mono', monospace; font-size: 8px; padding: 3px 10px;
    border-radius: 12px; border: 1px solid var(--border); color: var(--text-dim);
    display: flex; align-items: center; gap: 5px;
  }
  .an-eco-chip.active { border-color: rgba(45,212,160,0.3); color: var(--green); background: rgba(45,212,160,0.06); }
  .an-eco-chip.soon   { border-color: rgba(137,196,225,0.2); color: var(--ice); }

  /* ── Tooltip ── */
  .an-tooltip {
    background: var(--surface2); border: 1px solid var(--border); border-radius: 4px;
    padding: 10px 14px; font-family: 'Space Mono', monospace; font-size: 10px;
  }
  .an-tooltip-label { color: var(--gold); font-weight: 700; margin-bottom: 6px; }
  .an-tooltip-row   { display: flex; justify-content: space-between; gap: 16px; color: var(--text-dim); margin-top: 3px; }
  .an-tooltip-val   { color: var(--text); font-weight: 700; }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .an-kpis { grid-template-columns: repeat(2, 1fr); }
    .an-grid  { grid-template-columns: 1fr; }
  }
  @media (max-width: 600px) {
    .an-root  { padding: 14px 12px 80px; }
    .an-kpis  { grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .an-kpi   { padding: 12px 14px; }
    .an-kpi-value { font-size: 18px; }
    .an-title { font-size: 20px; }
    .an-header { flex-direction: column; gap: 12px; }
    .an-chart-card { padding: 14px 16px; }
    .an-insight-grid { grid-template-columns: 1fr; gap: 8px; }
  }
`;

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
            {p.dataKey.toLowerCase().includes("revenue") ||
            p.dataKey.toLowerCase().includes("bound") ||
            p.dataKey.toLowerCase().includes("forecast")
              ? `$${Number(p.value).toLocaleString()}`
              : Number(p.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
};

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

const ChartCard = ({
  title,
  meta,
  legend,
  children,
}: {
  title: string;
  meta?: ReactNode;
  legend?: ReactNode;
  children: ReactNode;
}) => (
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

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [showForecast, setForecast] = useState(false);
  const [showComparison, setComp] = useState(false);

  useState(() => {
    const id = "an-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id;
      tag.textContent = css;
      document.head.appendChild(tag);
    }
  });

  const currentData = useMemo(() => getMockData(period), [period]);
  const previousData = useMemo(() => getPreviousPeriodData(period), [period]);
  const forecastData = useMemo(
    () => generateForecast(currentData, 7),
    [currentData],
  );
  const insights = useMemo(
    () => generateInsights(currentData, previousData, period),
    [currentData, previousData, period],
  );
  const anomalySet = useMemo(() => detectAnomalies(currentData), [currentData]);

  const curRevTotal = calcTotal(currentData, "revenue");
  const prevRevTotal = calcTotal(previousData, "revenue");
  const curActTotal = calcTotal(currentData, "activity");
  const prevActTotal = calcTotal(previousData, "activity");
  const avgRevenue = calcAverage(currentData, "revenue");

  const comparisonData = currentData.map((d, i) => ({
    ...d,
    prevRevenue: previousData[i]?.revenue ?? 0,
  }));

  const revenueChartData: ForecastPoint[] = showForecast
    ? forecastData
    : currentData.map((d, i) => ({ ...d, isAnomaly: anomalySet.has(i) }));

  const anomalyPoints = revenueChartData
    .map((d, i) => ({ ...d, index: i }))
    .filter((d) => d.isAnomaly);
  const periodLabel =
    period === "7d" ? "7 Days" : period === "30d" ? "30 Days" : "90 Days";

  return (
    <div className="an-root">
      <div className="an-inner">
        {/* Header */}
        <div className="an-header">
          <div>
            <h1 className="an-title">
              Analytics <span>Intelligence</span>
            </h1>
            <p className="an-subtitle">
              Winners Ecosystem · Core Engine · {periodLabel} ·{" "}
              {currentData.length} data points
            </p>
          </div>
          <div className="an-controls">
            {(["7d", "30d", "90d"] as Period[]).map((p) => (
              <button
                key={p}
                className={`an-period-btn${period === p ? " active" : ""}`}
                onClick={() => setPeriod(p)}
              >
                {p}
              </button>
            ))}
            <div
              className={`an-toggle${showForecast ? " on" : ""}`}
              onClick={() => setForecast((v) => !v)}
            >
              <div className="an-toggle-dot" /> Forecast
            </div>
            <div
              className={`an-toggle${showComparison ? " on" : ""}`}
              onClick={() => setComp((v) => !v)}
            >
              <div className="an-toggle-dot" /> Compare
            </div>
          </div>
        </div>

        {/* Ecosystem context bar */}
        <div className="an-eco-bar">
          <div className="an-eco-label">Ecosystem Layers</div>
          <div className="an-eco-chips">
            <div className="an-eco-chip active">⬡ Core · Live</div>
            <div className="an-eco-chip active">🧑‍🤝‍🧑 Community · Live</div>
            <div className="an-eco-chip soon">🎓 Academy · Soon</div>
            <div className="an-eco-chip soon">🛒 Market · Soon</div>
            <div className="an-eco-chip">🤖 AI · Planned</div>
            <div className="an-eco-chip">💼 Work · Planned</div>
          </div>
        </div>

        {/* KPIs */}
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
            growth={calcGrowth(
              avgRevenue,
              calcAverage(previousData, "revenue"),
            )}
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

        {/* AI Insight */}
        <div className="an-insight">
          <div className="an-insight-header">
            <span className="an-insight-badge">🧠 AI Insight</span>
            <span className={`an-insight-trend ${insights.trend}`}>
              {insights.trend === "up"
                ? "▲ Trending Up"
                : insights.trend === "down"
                  ? "▼ Trending Down"
                  : "● Stable"}
            </span>
            {insights.anomalyCount > 0 && (
              <span className="an-spike-badge">
                {insights.anomalyCount} spike
                {insights.anomalyCount > 1 ? "s" : ""} detected
              </span>
            )}
          </div>
          <div className="an-insight-primary">{insights.topInsight}</div>
          <div className="an-insight-secondary">
            {insights.secondaryInsight}
          </div>
          <div className="an-insight-grid">
            <div className="an-insight-stat">
              <div className="an-insight-stat-val">
                {insights.revenueGrowth > 0 ? "+" : ""}
                {insights.revenueGrowth}%
              </div>
              <div className="an-insight-stat-lbl">Revenue Growth</div>
            </div>
            <div className="an-insight-stat">
              <div className="an-insight-stat-val">
                {insights.activityGrowth > 0 ? "+" : ""}
                {insights.activityGrowth}%
              </div>
              <div className="an-insight-stat-lbl">Activity Growth</div>
            </div>
            <div className="an-insight-stat">
              <div className="an-insight-stat-val">
                {insights.forecastGrowth > 0 ? "+" : ""}
                {insights.forecastGrowth}%
              </div>
              <div className="an-insight-stat-lbl">7-Day Forecast</div>
            </div>
          </div>
        </div>

        {/* Revenue Chart */}
        <ChartCard
          title="Revenue"
          meta={
            showForecast
              ? `${currentData.length} actual + 7 forecast days`
              : `${currentData.length} days actual`
          }
          legend={
            <div className="an-legend">
              <div className="an-legend-item">
                <div
                  className="an-legend-dot"
                  style={{ background: "var(--gold)" }}
                />
                Revenue
              </div>
              {showForecast && (
                <>
                  <div className="an-legend-item">
                    <div
                      className="an-legend-line"
                      style={{ background: "var(--purple)" }}
                    />
                    Forecast
                  </div>
                  <div className="an-legend-item">
                    <div
                      className="an-legend-line"
                      style={{ background: "var(--gold-glow-sm)" }}
                    />
                    Confidence
                  </div>
                </>
              )}
              {showComparison && (
                <div className="an-legend-item">
                  <div
                    className="an-legend-dash"
                    style={{ borderColor: "var(--ice)" }}
                  />
                  Prev Period
                </div>
              )}
              <div className="an-legend-item">
                <div
                  className="an-legend-dot"
                  style={{ background: "var(--red)" }}
                />
                Spike
              </div>
            </div>
          }
        >
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart
              data={showComparison ? comparisonData : revenueChartData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--gold)"
                    stopOpacity={0.15}
                  />
                  <stop offset="95%" stopColor="var(--gold)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="bandGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--purple)"
                    stopOpacity={0.1}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--purple)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="date"
                tick={{
                  fill: "var(--text-dim)",
                  fontSize: 9,
                  fontFamily: "Space Mono",
                }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{
                  fill: "var(--text-dim)",
                  fontSize: 9,
                  fontFamily: "Space Mono",
                }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              {showForecast && (
                <>
                  <Area
                    dataKey="upperBound"
                    fill="url(#bandGrad)"
                    stroke="none"
                    name="Upper Bound"
                  />
                  <Area
                    dataKey="lowerBound"
                    fill="var(--bg)"
                    stroke="none"
                    name="Lower Bound"
                  />
                </>
              )}
              {showComparison && (
                <Line
                  dataKey="prevRevenue"
                  stroke="#89C4E1"
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  dot={false}
                  name="Prev Revenue"
                />
              )}
              <Area
                dataKey="revenue"
                stroke="var(--gold)"
                strokeWidth={2}
                fill="url(#revGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "var(--gold)" }}
                name="Revenue"
              />
              {showForecast && (
                <Line
                  dataKey="forecastRevenue"
                  stroke="var(--purple)"
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                  name="Forecast"
                />
              )}
              {anomalyPoints.map((point) => (
                <ReferenceDot
                  key={point.date}
                  x={point.date}
                  y={point.revenue}
                  r={5}
                  fill="#E05A4E"
                  stroke="#E05A4E"
                  strokeOpacity={0.3}
                  strokeWidth={6}
                />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Activity + Comparison */}
        <div className="an-grid">
          <ChartCard title="Activity" meta="Daily engagement events">
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart
                data={currentData}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="actGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2B5F8E" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2B5F8E" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1E3248"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{
                    fill: "#5A7A96",
                    fontSize: 9,
                    fontFamily: "Space Mono",
                  }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{
                    fill: "#5A7A96",
                    fontSize: 9,
                    fontFamily: "Space Mono",
                  }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  dataKey="activity"
                  stroke="#89C4E1"
                  strokeWidth={2}
                  fill="url(#actGrad)"
                  dot={false}
                  name="Activity"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            title="Period Comparison"
            meta="Current vs previous period revenue"
          >
            <ResponsiveContainer width="100%" height={200}>
              <ComposedChart
                data={comparisonData.slice(0, 14)}
                margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1E3248"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{
                    fill: "#5A7A96",
                    fontSize: 9,
                    fontFamily: "Space Mono",
                  }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{
                    fill: "#5A7A96",
                    fontSize: 9,
                    fontFamily: "Space Mono",
                  }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="revenue"
                  fill="rgba(201,168,76,0.65)"
                  radius={[2, 2, 0, 0]}
                  name="Current"
                />
                <Bar
                  dataKey="prevRevenue"
                  fill="rgba(43,95,142,0.4)"
                  radius={[2, 2, 0, 0]}
                  name="Previous"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
