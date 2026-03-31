// src/features/analytics/ActivityChart.tsx

import {
  LineChart, Line, XAxis, YAxis, Tooltip,
  CartesianGrid, ResponsiveContainer,
} from "recharts";
import { useAnalyticsStore } from "../analyticsStore";

const css = `
  .ac2-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 6px; padding: 18px 20px; margin-top: 16px;
    font-family: 'Syne', sans-serif; color: var(--text);
    position: relative; overflow: hidden;
  }
  .ac2-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--blue), var(--ice));
  }
  .ac2-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 8px; }
  .ac2-title  { font-size: 13px; font-weight: 700; }
  .ac2-legend { display: flex; gap: 12px; }
  .ac2-legend-item { display: flex; align-items: center; gap: 5px; font-family: 'Space Mono', monospace; font-size: 8px; color: var(--text-dim); }
  .ac2-legend-line { width: 14px; height: 2px; border-radius: 1px; }
  .ac2-legend-dash { width: 14px; height: 0; border-top: 2px dashed; }

  .ac2-periods { display: flex; gap: 6px; margin-bottom: 14px; }
  .ac2-period-btn {
    padding: 5px 12px; border-radius: 3px; border: 1px solid var(--border);
    background: transparent; color: var(--text-dim);
    font-family: 'Space Mono', monospace; font-size: 9px;
    cursor: pointer; transition: all 0.15s;
  }
  .ac2-period-btn:hover { border-color: var(--gold); color: var(--gold); }
  .ac2-period-btn.active { border-color: var(--ice); color: var(--ice); background: rgba(137,196,225,0.08); }
  .ac2-period-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .ac2-chart { width: 100%; height: 240px; }

  .ac2-loading {
    width: 100%; height: 240px; display: flex; align-items: center; justify-content: center;
    font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim);
  }
  .ac2-loading-dot {
    width: 5px; height: 5px; border-radius: 50%; background: var(--ice);
    display: inline-block; margin: 0 2px;
    animation: ac2-bounce 1.2s ease infinite;
  }
  .ac2-loading-dot:nth-child(2) { animation-delay: 0.15s; }
  .ac2-loading-dot:nth-child(3) { animation-delay: 0.3s; }

  .ac2-tooltip {
    background: var(--surface2); border: 1px solid var(--border); border-radius: 4px;
    padding: 8px 12px; font-family: 'Space Mono', monospace; font-size: 10px;
  }
  .ac2-tooltip-label { color: var(--gold); font-weight: 700; margin-bottom: 4px; }
  .ac2-tooltip-val   { color: var(--text); }

  .ac2-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
  .ac2-footer-label { font-family: 'Space Mono', monospace; font-size: 8px; color: var(--text-dim); }
  .ac2-forecast-tag { font-family: 'Space Mono', monospace; font-size: 8px; padding: 2px 7px; border-radius: 2px; background: rgba(43,95,142,0.1); color: var(--ice); border: 1px solid rgba(43,95,142,0.2); }

  @keyframes ac2-bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
`;

if (typeof document !== "undefined" && !document.getElementById("ac2-styles")) {
  const tag = document.createElement("style");
  tag.id = "ac2-styles"; tag.textContent = css;
  document.head.appendChild(tag);
}

function generateForecast(data: { name: string; value: number }[]) {
  if (data.length < 2) return [];
  const first = data[0].value;
  const last  = data[data.length - 1].value;
  const slope = (last - first) / data.length;
  return Array.from({ length: 7 }).map((_, i) => ({
    name:  `F${i + 1}`,
    value: Math.max(0, Math.round(last + slope * (i + 1))),
  }));
}

interface ActivityTooltipRow {
  dataKey: string;
  name: string;
  value: number;
}

interface ActivityTooltipProps {
  active?: boolean;
  payload?: ActivityTooltipRow[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: ActivityTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="ac2-tooltip">
      <div className="ac2-tooltip-label">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="ac2-tooltip-val">{p.name}: {p.value.toLocaleString()}</div>
      ))}
    </div>
  );
};

export default function ActivityChart() {
  const period    = useAnalyticsStore((s) => s.period);
  const setPeriod = useAnalyticsStore((s) => s.setPeriod);
  const activityData = useAnalyticsStore((s) => s.data);
  const isLoading = useAnalyticsStore((s) => s.isLoading);
  const userData = activityData.map((p) => ({
    name: p.date,
    value: p.activity,
  }));

  const forecastData       = generateForecast(userData);
  const lastRealPoint      = userData.length > 0 ? userData[userData.length - 1] : null;
  const forecastWithBridge = lastRealPoint ? [lastRealPoint, ...forecastData] : [];

  return (
    <div className="ac2-card">
      <div className="ac2-header">
        <div className="ac2-title">Active Users</div>
        <div className="ac2-legend">
          <div className="ac2-legend-item">
            <div className="ac2-legend-line" style={{ background: "var(--ice)" }} />
            Actual
          </div>
          <div className="ac2-legend-item">
            <div className="ac2-legend-dash" style={{ borderColor: "var(--blue)" }} />
            Forecast
          </div>
        </div>
      </div>

      <div className="ac2-periods">
        {(["7d", "30d", "90d"] as const).map((p) => (
          <button
            key={p}
            disabled={isLoading}
            onClick={() => setPeriod(p)}
            className={`ac2-period-btn${period === p ? " active" : ""}`}
          >
            {p}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="ac2-loading">
          <span className="ac2-loading-dot" />
          <span className="ac2-loading-dot" />
          <span className="ac2-loading-dot" />
        </div>
      ) : (
        <div className="ac2-chart">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={240}>
            <LineChart margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: "var(--text-dim)", fontSize: 9, fontFamily: "Space Mono" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "var(--text-dim)", fontSize: 9, fontFamily: "Space Mono" }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line data={userData}           type="monotone" dataKey="value" name="Users"    stroke="var(--ice)"  strokeWidth={2} dot={false} activeDot={{ r: 3, fill: "var(--ice)" }} />
              <Line data={forecastWithBridge} type="monotone" dataKey="value" name="Forecast" stroke="var(--blue)" strokeWidth={2} strokeDasharray="5 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="ac2-footer">
        <span className="ac2-footer-label">Winners Ecosystem · User Activity · {period}</span>
        <span className="ac2-forecast-tag">7-day forecast</span>
      </div>
    </div>
  );
}
