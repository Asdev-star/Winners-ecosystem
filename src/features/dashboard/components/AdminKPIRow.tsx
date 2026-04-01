type Props = {
  kpis: {
    users: number;
    activeUsers: number;
    mrr: number;
    mrrDeltaPct: number;
    liveLayers: number;
    newUsers30d?: number;
    avgTrustScore?: number;
    loopComplete?: number;
    loopsToday: number;
    loopsDeltaPct: number;
  };
  money: (value: number) => string;
  pct: (value: number) => string;
};

export default function AdminKPIRow({ kpis, money, pct }: Props) {
  return (
    <section className="aov-kpis">
      <div className="aov-kpi">
        <div className="aov-kpi-label">Users</div>
        <div className="aov-kpi-value">{kpis.users.toLocaleString()}</div>
        <div className="aov-kpi-sub">{kpis.activeUsers.toLocaleString()} active (7d)</div>
      </div>
      <div className="aov-kpi">
        <div className="aov-kpi-label">MRR</div>
        <div className="aov-kpi-value">{money(kpis.mrr)}</div>
        <div className={`aov-kpi-sub ${kpis.mrrDeltaPct >= 0 ? "aov-positive" : "aov-attention"}`}>
          {kpis.mrrDeltaPct > 0 ? "↑" : "↓"} {pct(kpis.mrrDeltaPct)} vs last month
        </div>
      </div>
      <div className="aov-kpi">
        <div className="aov-kpi-label">Active Layers</div>
        <div className="aov-kpi-value">{kpis.liveLayers}/9</div>
        <div className="aov-kpi-sub">platform layers live</div>
      </div>
      <div className="aov-kpi">
        <div className="aov-kpi-label">New (30d)</div>
        <div className="aov-kpi-value">{(kpis.newUsers30d ?? 0).toLocaleString()}</div>
        <div className="aov-kpi-sub">user registrations</div>
      </div>
      <div className="aov-kpi">
        <div className="aov-kpi-label">Trust Score Avg</div>
        <div className="aov-kpi-value">{kpis.avgTrustScore ?? "—"}</div>
        <div className="aov-kpi-sub">across all users</div>
      </div>
      <div className="aov-kpi">
        <div className="aov-kpi-label">Loop Completions</div>
        <div className="aov-kpi-value">{(kpis.loopComplete ?? kpis.loopsToday).toLocaleString()}</div>
        <div className={`aov-kpi-sub ${kpis.loopsDeltaPct >= 0 ? "aov-positive" : "aov-attention"}`}>
          Agentic Loop cycles (90d)
        </div>
      </div>
    </section>
  );
}
