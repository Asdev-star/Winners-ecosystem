// src/features/analytics/components/AnalyticsSummary.tsx
// Phase 1 — Core Engine · Analytics Layer
// Full ecosystem design — NO Tailwind, CSS variables only

import { useAnalyticsStore } from "../analyticsStore";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .as-root {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
    margin-top: 24px;
  }

  @media (max-width: 640px) {
    .as-root { grid-template-columns: 1fr; }
  }

  /* ── Card ── */
  .as-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 22px 24px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.2s, transform 0.2s;
  }
  .as-card:hover {
    transform: translateY(-2px);
  }
  .as-card:hover.as-card--gold  { border-color: rgba(201,168,76,0.35); }
  .as-card:hover.as-card--ice   { border-color: rgba(137,196,225,0.35); }
  .as-card:hover.as-card--green { border-color: rgba(45,212,160,0.35); }
  .as-card:hover.as-card--blue  { border-color: rgba(43,95,142,0.35); }

  /* 2px gradient top border — the ecosystem card pattern */
  .as-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
  }
  .as-card--gold::before  { background: linear-gradient(90deg, transparent, var(--gold), transparent); }
  .as-card--ice::before   { background: linear-gradient(90deg, transparent, var(--ice), transparent); }
  .as-card--green::before { background: linear-gradient(90deg, transparent, var(--green), transparent); }
  .as-card--blue::before  { background: linear-gradient(90deg, transparent, var(--blue), transparent); }

  /* Glow radial behind value */
  .as-card::after {
    content: '';
    position: absolute; bottom: -20px; right: -20px;
    width: 120px; height: 120px; border-radius: 50%;
    pointer-events: none; opacity: 0.06;
  }
  .as-card--gold::after  { background: var(--gold); }
  .as-card--ice::after   { background: var(--ice); }
  .as-card--green::after { background: var(--green); }
  .as-card--blue::after  { background: var(--blue); }

  /* ── Header row ── */
  .as-card-header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 16px;
  }
  .as-card-label {
    font-family: 'Space Mono', monospace;
    font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--text-dim, #5A7A96);
  }
  .as-card-icon {
    width: 32px; height: 32px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; flex-shrink: 0;
  }
  .as-card-icon--gold  { background: var(--gold-glow-sm);  color: var(--gold); }
  .as-card-icon--ice   { background: var(--blue-glow-sm); color: var(--ice); }
  .as-card-icon--green { background: rgba(45,212,160,0.1);  color: var(--green, #2DD4A0); }
  .as-card-icon--blue  { background: rgba(43,95,142,0.15);  color: var(--ice); }

  /* ── Value ── */
  .as-card-value {
    font-family: 'Syne', sans-serif;
    font-size: 30px; font-weight: 800;
    letter-spacing: -0.8px; line-height: 1;
    margin-bottom: 10px;
  }
  .as-card--gold  .as-card-value { color: var(--gold); }
  .as-card--ice   .as-card-value { color: var(--ice); }
  .as-card--green .as-card-value { color: var(--green, #2DD4A0); }
  .as-card--blue  .as-card-value { color: var(--text); }

  /* ── Growth pill ── */
  .as-growth {
    display: inline-flex; align-items: center; gap: 5px;
    font-family: 'Space Mono', monospace;
    font-size: 10px; font-weight: 700;
    padding: 3px 9px; border-radius: 3px;
  }
  .as-growth--up {
    background: rgba(45,212,160,0.1);
    color: var(--green, #2DD4A0);
    border: 1px solid rgba(45,212,160,0.2);
  }
  .as-growth--down {
    background: rgba(224,90,78,0.1);
    color: var(--red, #E05A4E);
    border: 1px solid rgba(224,90,78,0.2);
  }
  .as-growth--flat {
    background: rgba(90,122,150,0.1);
    color: var(--text-dim, #5A7A96);
    border: 1px solid rgba(90,122,150,0.2);
  }

  /* ── Sparkline bar ── */
  .as-sparkline {
    display: flex; align-items: flex-end; gap: 3px;
    height: 28px; margin-top: 14px;
  }
  .as-spark-bar {
    flex: 1; border-radius: 2px; opacity: 0.4;
    transition: opacity 0.2s;
  }
  .as-card:hover .as-spark-bar { opacity: 0.7; }

  /* ── Skeleton loader ── */
  .as-skeleton {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px; padding: 22px 24px;
    animation: as-shimmer 1.5s ease-in-out infinite;
  }
  .as-skel-line {
    border-radius: 4px;
    background: var(--surface2);
    margin-bottom: 10px;
  }

  @keyframes as-shimmer {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.55; }
  }

  /* ── Loading state full row ── */
  .as-loading {
    grid-column: 1 / -1;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    padding: 32px;
    font-family: 'Space Mono', monospace; font-size: 10px;
    letter-spacing: 0.15em; text-transform: uppercase;
    color: var(--text-dim, #5A7A96);
    border: 1px solid var(--border);
    border-radius: 6px; background: var(--surface);
  }
  .as-loading-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--gold);
    animation: as-pulse 1.2s ease-in-out infinite;
  }
  .as-loading-dot:nth-child(2) { animation-delay: 0.2s; background: var(--ice); }
  .as-loading-dot:nth-child(3) { animation-delay: 0.4s; background: var(--green); }

  @keyframes as-pulse {
    0%, 100% { opacity: 0.3; transform: scale(0.8); }
    50%       { opacity: 1;   transform: scale(1.2); }
  }
`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toLocaleString()}`;
}

function formatGrowth(value: number): string {
  const abs = Math.abs(value).toFixed(1);
  if (value > 0)  return `▲ ${abs}%`;
  if (value < 0)  return `▼ ${abs}%`;
  return `— 0%`;
}

function growthClass(value: number): string {
  if (value > 0)  return "as-growth as-growth--up";
  if (value < 0)  return "as-growth as-growth--down";
  return "as-growth as-growth--flat";
}

// Mini sparkline — uses normalised random-ish bars based on a seed
function Sparkline({ color, seed }: { color: string; seed: number }) {
  const bars = Array.from({ length: 10 }, (_, i) => {
    // deterministic-ish heights from seed + index
    const h = 30 + ((seed * 13 + i * 37) % 60);
    return Math.max(15, h);
  });
  const max = Math.max(...bars);
  return (
    <div className="as-sparkline">
      {bars.map((h, i) => (
        <div
          key={i}
          className="as-spark-bar"
          style={{ height: `${(h / max) * 100}%`, background: color }}
        />
      ))}
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="as-skeleton">
      <div className="as-skel-line" style={{ width: "55%", height: 10 }} />
      <div className="as-skel-line" style={{ width: "40%", height: 32, marginBottom: 14 }} />
      <div className="as-skel-line" style={{ width: "30%", height: 18 }} />
    </div>
  );
}

// ─── Metric Card ─────────────────────────────────────────────────────────────

interface MetricCardProps {
  label:    string;
  value:    string;
  growth:   number;
  icon:     string;
  variant:  "gold" | "ice" | "green" | "blue";
  sparkSeed:number;
}

function MetricCard({ label, value, growth, icon, variant, sparkSeed }: MetricCardProps) {
  const colorMap: Record<string, string> = {
    gold:  "var(--gold)",
    ice:   "var(--ice)",
    green: "var(--green)",
    blue:  "var(--ice)",
  };

  return (
    <div className={`as-card as-card--${variant}`}>
      <div className="as-card-header">
        <div className="as-card-label">{label}</div>
        <div className={`as-card-icon as-card-icon--${variant}`}>{icon}</div>
      </div>

      <div className="as-card-value">{value}</div>

      <span className={growthClass(growth)}>
        {formatGrowth(growth)}
        <span style={{ fontSize: 8, opacity: 0.7, fontWeight: 400, marginLeft: 2 }}>vs prev period</span>
      </span>

      <Sparkline color={colorMap[variant]} seed={sparkSeed} />
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AnalyticsSummary() {
  const { summary, isLoading } = useAnalyticsStore();

  return (
    <>
      <style>{css}</style>
      <div className="as-root">

        {isLoading || !summary ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <MetricCard
              label="Total Revenue"
              value={formatCurrency(summary.totalRevenue)}
              growth={summary.revenueGrowth}
              icon="💰"
              variant="gold"
              sparkSeed={summary.totalRevenue % 97}
            />

            <MetricCard
              label="Platform Activity"
              value={summary.totalActivity.toLocaleString()}
              growth={summary.activityGrowth}
              icon="📊"
              variant="ice"
              sparkSeed={summary.totalActivity % 83}
            />
          </>
        )}

      </div>
    </>
  );
}