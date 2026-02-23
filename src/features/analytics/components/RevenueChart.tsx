import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { useAnalyticsStore } from "../analyticsStore";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#0f1923",
        border: "1px solid rgba(201,168,76,0.3)",
        borderRadius: "10px",
        padding: "12px 16px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      <p style={{ color: "#6b7280", fontSize: "11px", marginBottom: "6px", letterSpacing: "0.05em" }}>
        {label}
      </p>
      {payload.map((entry: any) => (
        <p
          key={entry.dataKey}
          style={{
            color: entry.dataKey === "revenue" ? "#C9A84C" : "#89C4E1",
            fontSize: "14px",
            fontWeight: 700,
            margin: 0,
          }}
        >
          {entry.dataKey === "revenue"
            ? `$${Number(entry.value).toLocaleString()}`
            : Number(entry.value).toLocaleString()}{" "}
          <span style={{ color: "#6b7280", fontWeight: 400, fontSize: "11px" }}>
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
        background: "linear-gradient(135deg, #0f1923 0%, #0D1520 100%)",
        border: "1px solid rgba(137,196,225,0.12)",
        borderRadius: "16px",
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
          background: "linear-gradient(90deg, transparent, #C9A84C, transparent)",
          opacity: 0.7,
        }}
      />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "#6b7280", marginBottom: "4px" }}>
            Performance
          </p>
          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#f0f4f8", margin: 0 }}>
            Revenue Trend
          </h3>
        </div>

        {/* Legend */}
        <div style={{ display: "flex", gap: "16px" }}>
          {[
            { color: "#C9A84C", label: "Revenue" },
            { color: "#89C4E1", label: "Activity" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
              <span style={{ fontSize: "11px", color: "#6b7280", fontWeight: 500 }}>{label}</span>
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
                border: "2px solid rgba(201,168,76,0.2)",
                borderTop: "2px solid #C9A84C",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p style={{ color: "#6b7280", fontSize: "13px" }}>Loading revenue data...</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : data.length === 0 ? (
          <p style={{ color: "#6b7280", fontSize: "13px" }}>No data for this period</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#C9A84C" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#C9A84C" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#89C4E1" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#89C4E1" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(137,196,225,0.06)" vertical={false} />

              <XAxis
                dataKey="date"
                tick={{ fill: "#6b7280", fontSize: 11 }}
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
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
              />

              <YAxis
                yAxisId="activity"
                orientation="right"
                tick={{ fill: "#6b7280", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip content={<CustomTooltip />} />

              <Area
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                stroke="#C9A84C"
                strokeWidth={2}
                fill="url(#revenueGradient)"
                dot={false}
                activeDot={{ r: 4, fill: "#C9A84C", strokeWidth: 0 }}
              />

              <Area
                yAxisId="activity"
                type="monotone"
                dataKey="activity"
                stroke="#89C4E1"
                strokeWidth={2}
                fill="url(#activityGradient)"
                dot={false}
                activeDot={{ r: 4, fill: "#89C4E1", strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}