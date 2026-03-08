import { useEffect, useState } from "react";
import {
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import SkeletonLoader from "../../../components/ui/SkeletonLoader";
import { useAnalyticsStore } from "../analyticsStore";

interface TooltipEntry {
  dataKey?: string;
  value?: number | string;
}

interface RevenueTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  theme: ChartTheme;
}

interface ChartTheme {
  surface: string;
  border: string;
  textDim: string;
  gold: string;
  ice: string;
}

const DEFAULT_THEME: ChartTheme = {
  surface: "var(--surface)",
  border: "var(--border)",
  textDim: "var(--text-dim)",
  gold: "var(--gold)",
  ice: "var(--ice)",
};

function readCssToken(root: CSSStyleDeclaration, token: string, fallback: string) {
  const value = root.getPropertyValue(token).trim();
  return value || fallback;
}

function RevenueTooltip({ active, payload, label, theme }: RevenueTooltipProps) {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: "6px",
        padding: "12px 16px",
      }}
    >
      <p style={{ color: theme.textDim, fontSize: "11px", marginBottom: "6px", letterSpacing: "0.05em" }}>
        {label}
      </p>
      {payload.map((entry) => (
        <p
          key={entry.dataKey}
          style={{
            color: entry.dataKey === "revenue" ? theme.gold : theme.ice,
            fontSize: "14px",
            fontWeight: 700,
            margin: 0,
          }}
        >
          {entry.dataKey === "revenue"
            ? `$${Number(entry.value).toLocaleString()}`
            : Number(entry.value).toLocaleString()}{" "}
          <span style={{ color: theme.textDim, fontWeight: 400, fontSize: "11px" }}>{entry.dataKey}</span>
        </p>
      ))}
    </div>
  );
}

export default function RevenueChart() {
  const data = useAnalyticsStore((state) => state.data);
  const isLoading = useAnalyticsStore((state) => state.isLoading);
  const [theme, setTheme] = useState<ChartTheme>(DEFAULT_THEME);

  useEffect(() => {
    const root = getComputedStyle(document.documentElement);
    setTheme({
      surface: readCssToken(root, "--surface", DEFAULT_THEME.surface),
      border: readCssToken(root, "--border", DEFAULT_THEME.border),
      textDim: readCssToken(root, "--text-dim", DEFAULT_THEME.textDim),
      gold: readCssToken(root, "--gold", DEFAULT_THEME.gold),
      ice: readCssToken(root, "--ice", DEFAULT_THEME.ice),
    });
  }, []);

  return (
    <div
      style={{
        background: theme.surface,
        border: `1px solid ${theme.border}`,
        borderRadius: "6px",
        padding: "28px",
        marginTop: "32px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: `linear-gradient(90deg, ${theme.gold}, transparent)`,
          opacity: 0.7,
        }}
      />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <p style={{ fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: theme.textDim, marginBottom: "4px" }}>
            Performance
          </p>
          <h3 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Revenue Trend</h3>
        </div>

        <div style={{ display: "flex", gap: "16px" }}>
          {[
            { color: theme.gold, label: "Revenue" },
            { color: theme.ice, label: "Activity" },
          ].map(({ color, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color }} />
              <span style={{ fontSize: "11px", color: theme.textDim, fontWeight: 500 }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ width: "100%", minHeight: "280px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {isLoading ? (
          <div style={{ width: "100%" }}>
            <SkeletonLoader variant="chart" count={1} />
            <p style={{ color: theme.textDim, fontSize: "13px", marginTop: "12px", textAlign: "center" }}>
              Loading revenue data...
            </p>
          </div>
        ) : data.length === 0 ? (
          <p style={{ color: theme.textDim, fontSize: "13px" }}>No data for this period</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.gold} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={theme.gold} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={theme.ice} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={theme.ice} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke={theme.border} vertical={false} opacity={0.3} />

              <XAxis
                dataKey="date"
                tick={{ fill: theme.textDim, fontSize: 11 }}
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
                tick={{ fill: theme.textDim, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}`}
              />

              <YAxis yAxisId="activity" orientation="right" tick={{ fill: theme.textDim, fontSize: 11 }} axisLine={false} tickLine={false} />

              <Tooltip content={<RevenueTooltip theme={theme} />} />

              <Area
                yAxisId="revenue"
                type="monotone"
                dataKey="revenue"
                stroke={theme.gold}
                strokeWidth={2}
                fill="url(#revenueGradient)"
                dot={false}
                activeDot={{ r: 4, fill: theme.gold, strokeWidth: 0 }}
              />

              <Area
                yAxisId="activity"
                type="monotone"
                dataKey="activity"
                stroke={theme.ice}
                strokeWidth={2}
                fill="url(#activityGradient)"
                dot={false}
                activeDot={{ r: 4, fill: theme.ice, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
