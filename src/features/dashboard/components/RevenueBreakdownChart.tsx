import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link } from "react-router-dom";

type RevenueSeriesItem = {
  label: string;
  core: number;
  community: number;
  academy: number;
  market: number;
  work: number;
  cloud: number;
};

type Props = {
  revenueSeries: RevenueSeriesItem[];
  note?: string;
  layers: Array<{ id: string; name: string; sharePct: number; amount: number }>;
  money: (value: number) => string;
};

function AdminRevenueTooltip({
  active,
  payload,
  label,
  money,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number }>;
  label?: string | number;
  money: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div style={{ borderRadius: 16, border: "1px solid rgba(255,255,255,.08)", background: "rgba(8,13,22,.96)", padding: "12px 14px", boxShadow: "0 18px 38px rgba(0,0,0,.34)" }}>
      <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 8 }}>
        {label}
      </div>
      {payload.map((entry) => (
        <div key={entry.name} style={{ display: "flex", justifyContent: "space-between", gap: 14, fontSize: 13, color: "var(--text)", marginTop: 6 }}>
          <span>{entry.name}</span>
          <strong>{money(entry.value ?? 0)}</strong>
        </div>
      ))}
    </div>
  );
}

export default function RevenueBreakdownChart({ revenueSeries, note, layers, money }: Props) {
  return (
    <div className="aov-panel">
      <div className="aov-head">
        <div>
          <div className="aov-kicker">Revenue Chart + Layer Attribution</div>
          <h2 className="aov-title">MRR trend with current layer share overlay</h2>
        </div>
        <Link className="aov-mini-link" to="/admin/revenue">Open Revenue</Link>
      </div>
      {revenueSeries.length === 0 ? (
        <div className="aov-empty">Revenue attribution is still calibrating.</div>
      ) : (
        <>
          <div className="aov-chart-wrap">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={260}>
              <AreaChart data={revenueSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,.08)" vertical={false} />
                <XAxis dataKey="label" stroke="var(--text-dim)" tick={{ fontSize: 10, fontFamily: "Space Mono, monospace" }} />
                <YAxis
                  stroke="var(--text-dim)"
                  tick={{ fontSize: 10, fontFamily: "Space Mono, monospace" }}
                  tickFormatter={(value) => {
                    const numeric = Number(value);
                    return numeric >= 1000 ? `$${Math.round(numeric / 1000)}k` : `$${numeric}`;
                  }}
                />
                <Tooltip content={<AdminRevenueTooltip money={money} />} />
                <Area type="monotone" dataKey="core" stackId="1" stroke="var(--gold)" fill="rgba(201,168,76,.28)" />
                <Area type="monotone" dataKey="community" stackId="1" stroke="var(--ice)" fill="rgba(137,196,225,.24)" />
                <Area type="monotone" dataKey="academy" stackId="1" stroke="var(--purple)" fill="rgba(155,111,255,.22)" />
                <Area type="monotone" dataKey="market" stackId="1" stroke="var(--green)" fill="rgba(45,212,160,.2)" />
                <Area type="monotone" dataKey="work" stackId="1" stroke="var(--blue)" fill="rgba(74,158,255,.18)" />
                <Area type="monotone" dataKey="cloud" stackId="1" stroke="var(--text-dim)" fill="rgba(90,122,150,.18)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="aov-chart-note">
            {note ?? "Revenue trend is stacked using the current live layer share until daily per-layer revenue telemetry is fully wired."}
          </div>
          <div className="aov-attribution">
            {layers.slice(0, 6).map((layer) => (
              <div key={layer.id} className="aov-attribution-row">
                <div className="aov-attribution-name">{layer.name}</div>
                <div className="aov-attribution-share">{layer.sharePct}% share</div>
                <div className="aov-attribution-value">{money(layer.amount)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
