import { useAnalyticsStore } from "../analyticsStore";

function formatCurrency(value: number) {
  return `$${value.toLocaleString()}`;
}

const Growth = ({ value }: { value: number }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      fontSize: "12px",
      fontWeight: 600,
      letterSpacing: "0.05em",
      color: value >= 0 ? "#4ade80" : "#f87171",
    }}
  >
    <span style={{ fontSize: "10px" }}>{value >= 0 ? "▲" : "▼"}</span>
    {Math.abs(value).toFixed(1)}%{" "}
    <span style={{ color: "#6b7280", fontWeight: 400 }}>vs prev period</span>
  </span>
);

interface MetricCardProps {
  label: string;
  value: string;
  growth: number;
  icon: React.ReactNode;
  accentColor: string;
}

function MetricCard({ label, value, growth, icon, accentColor }: MetricCardProps) {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0f1923 0%, #0D1520 100%)",
        border: "1px solid rgba(137,196,225,0.12)",
        borderRadius: "16px",
        padding: "28px",
        position: "relative",
        overflow: "hidden",
        transition: "border-color 0.2s, transform 0.2s",
        cursor: "default",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = `${accentColor}40`;
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(137,196,225,0.12)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
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
          background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
          opacity: 0.7,
        }}
      />

      {/* Background radial glow */}
      <div
        style={{
          position: "absolute",
          top: "-40px",
          right: "-40px",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${accentColor}18 0%, transparent 70%)`,
          pointerEvents: "none",
        }}
      />

      {/* Icon badge */}
      <div
        style={{
          width: "40px",
          height: "40px",
          borderRadius: "10px",
          background: `${accentColor}18`,
          border: `1px solid ${accentColor}30`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "16px",
          color: accentColor,
        }}
      >
        {icon}
      </div>

      <p
        style={{
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#6b7280",
          marginBottom: "8px",
        }}
      >
        {label}
      </p>

      <p
        style={{
          fontSize: "32px",
          fontWeight: 700,
          color: "#f0f4f8",
          letterSpacing: "-0.02em",
          lineHeight: 1,
          marginBottom: "12px",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </p>

      <Growth value={growth} />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0f1923 0%, #0D1520 100%)",
        border: "1px solid rgba(137,196,225,0.08)",
        borderRadius: "16px",
        padding: "28px",
      }}
    >
      <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: "#1a2535", marginBottom: "16px" }} />
      <div style={{ width: "80px", height: "11px", borderRadius: "4px", background: "#1a2535", marginBottom: "12px" }} />
      <div style={{ width: "140px", height: "32px", borderRadius: "6px", background: "#1a2535", marginBottom: "12px" }} />
      <div style={{ width: "100px", height: "12px", borderRadius: "4px", background: "#1a2535" }} />
    </div>
  );
}

export default function AnalyticsSummary() {
  const { summary, isLoading } = useAnalyticsStore();

  if (isLoading || !summary) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
      <MetricCard
        label="Total Revenue"
        value={formatCurrency(summary.totalRevenue)}
        growth={summary.revenueGrowth}
        accentColor="#C9A84C"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="1" x2="12" y2="23" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        }
      />

      <MetricCard
        label="Total Activity"
        value={summary.totalActivity.toLocaleString()}
        growth={summary.activityGrowth}
        accentColor="#89C4E1"
        icon={
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        }
      />
    </div>
  );
}