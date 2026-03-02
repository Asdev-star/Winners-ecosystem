// Phase 1 - Core Engine
// Layer: Analytics UI

import {
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { useAnalyticsStore } from "../analyticsStore";

interface TooltipEntry {
  dataKey?: string;
  value?: number | string;
}

interface RevenueTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: RevenueTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "6px",
        padding: "12px 16px",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
      }}
    >
      <p style={{ color: "var(--text-dim)", fontSize: "11px", marginBottom: "6px", letterSpacing: "0.05em" }}>
        {label}
      </p>
      {payload.map((entry) => (
        <p
          key={entry.dataKey}
          style={{
            color: entry.dataKey === "revenue" ? "var(--gold)" : "var(--ice)",
            fontSize: "14px",
            fontWeight: 700,
            margin: 0,
          }}
        >
          {entry.dataKey === "revenue"
            ? `$${Number(entry.value).toLocaleString()}`
            : Number(entry.value).toLocaleString()}{" "}
          <span style={{ color: "var(--text-dim)", fontWeight: 400, fontSize: "11px" }}>
            {entry.dataKey}
          </span>
        </p>
      ))}
    </div>
  );
};

export default function RevenueChart() {
  const data = useAnalyticsStore((state) => state.data);
  const isLoading = useAnalyticsStore((state) => state.isLoading);

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "6px",
        padding: "28px",
        marginTop: "32px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: "linear-gradient(90deg, var(--gold), transparent)",
          opacity: 0.7,
        }}
      />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: "4px" }}>
            Performance
          </p>
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "var(--text)", margin: 0 }}>
            Revenue Trend
          </h3>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "16px" }}>
          {[
            { color: "var(--gold)", label: "Revenue" },
            { color: "var(--ice)", label: "Activity" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
              <span style={{ fontSize: "11px", color: "var(--text-dim)", fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: "100%", height: "280px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                border: "2px solid var(--gold-glow-sm)",
                borderTop: "2px solid var(--gold)",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p style={{ color: "var(--text-dim)", fontSize: "13px" }}>Loading revenue data...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : data.length === 0 ? (
          <p style={{ color: "var(--text-dim)", fontSize: "13px" }}>No data for this period</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--gold)" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="var(--gold)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--ice)" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="var(--ice)" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(137, 196, 225, 0.06)" vertical={false} />

              <XAxis
                dataKey="date"
                tick={{ fill: "var(--text-dim)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(val: string) => {
                  const d = new Date(val);
                  return isNaN(d.getTime()) ? val : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                }}
              />

              <YAxis
                yAxisId="revenue"
                orientation="left"
                tick={{ fill: "var(--text-dim)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
              />

              <YAxis
                yAxisId="activity"
                orientation="right"
                tick={{ fill: "var(--text-dim)", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                stroke="var(--gold)"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                dot={false}
                activeDot={{ r: 4, fill: "var(--gold)", strokeWidth: 0 }}
              />

              <Area
                yAxisId="activity"
                type="monotone"
                dataKey="activity"
                stroke="var(--ice)"
                strokeWidth={2}
                fill="url(#activityGradient)"
                dot={false}
                activeDot={{ r: 4, fill: "var(--ice)", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
