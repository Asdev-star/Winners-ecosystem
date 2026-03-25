// Phase 8 — Winners Cloud — CloudUsagePage.tsx
// NEXUS Supervisor · Usage Analytics & Credit Metering
// Credit consumption · API call volumes · Cost breakdown by feature

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../auth/authStore";
import AssistantPanel from "../../components/ui/AssistantPanel";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

interface UsageSummary {
  totalCredits: number;
  totalCalls: number;
  period: string;
  byAction: { action: string; credits: number; calls: number }[];
}

const PERIOD_OPTIONS = [
  { value: "7d",  label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

const ACTION_ICONS: Record<string, string> = {
  "ai.chat":              "🤖",
  "ai.analysis":          "🧠",
  "ai.skill-detection":   "🔍",
  "automation.run":       "⚡",
  "agent.run":            "🤖",
  "webhook.delivery":     "🪝",
  "connector.action":     "🔌",
  "api.call":             "🌐",
  "export.generate":      "📤",
  "certificate.verify":   "🎓",
};

const CREDIT_TIERS = [
  { name: "Starter",    credits: 1000,  price: 0,   badge: "Free",     color: "var(--text-dim)" },
  { name: "Developer",  credits: 10000, price: 9,   badge: "$9/mo",    color: "var(--ice)" },
  { name: "Pro",        credits: 50000, price: 29,  badge: "$29/mo",   color: "var(--gold)" },
  { name: "Scale",      credits: 200000,price: 99,  badge: "$99/mo",   color: "var(--green)" },
  { name: "Enterprise", credits: -1,    price: 499, badge: "Custom",   color: "var(--purple)" },
];

function formatNumber(n: number) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

export default function CloudUsagePage() {
  const token = useAuthStore((s) => s.token);
  const [period, setPeriod]   = useState("30d");
  const [usage, setUsage]     = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/cloud/usage?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsage(data.usage || null);
      }
    } catch { /* non-blocking */ }
    finally { setLoading(false); }
  }, [token, period]);

  useEffect(() => { fetchUsage(); }, [fetchUsage]);

  const maxCredits = usage?.byAction.reduce((m, a) => Math.max(m, a.credits), 0) || 1;

  return (
    <div style={{ padding: "32px 28px", maxWidth: 960, margin: "0 auto" }}>
      <style>{`
        .usage-ctx { display:flex; gap:8px; marginBottom:22px; flexWrap:wrap; }
        .ctx-badge { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:0.08em; padding:4px 10px; border-radius:3px; border:1px solid; }
        .ctx-badge.live   { background:rgba(45,212,160,0.08);  border-color:rgba(45,212,160,0.3);  color:var(--green); }
        .ctx-badge.active { background:rgba(155,111,255,0.15); border-color:var(--purple);         color:var(--purple); }
        .ctx-sep { color:var(--border); font-size:11px; display:flex; align-items:center; }

        .usage-header-row { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:28px; gap:16px; flex-wrap:wrap; }
        .usage-period-tabs { display:flex; gap:6px; }
        .usage-period-tab { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.06em; padding:6px 14px; border-radius:4px; border:1px solid var(--border); background:transparent; color:var(--text-dim); cursor:pointer; transition:all 200ms; }
        .usage-period-tab.active { background:rgba(155,111,255,0.1); border-color:var(--purple); color:var(--purple); }

        .usage-stats-row { display:grid; grid-template-columns:1fr 1fr 1fr; gap:16px; margin-bottom:28px; }
        @media(max-width:700px) { .usage-stats-row { grid-template-columns:1fr; } }
        .usage-stat-card { background:var(--surface); border:1px solid var(--border); border-radius:6px; padding:20px 22px; position:relative; overflow:hidden; }
        .usage-stat-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; border-radius:6px 6px 0 0; }
        .usage-stat-card.credits::before { background:linear-gradient(90deg,var(--purple),transparent); }
        .usage-stat-card.calls::before   { background:linear-gradient(90deg,var(--ice),transparent); }
        .usage-stat-card.cost::before    { background:linear-gradient(90deg,var(--gold),transparent); }
        .usage-stat-label { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.1em; color:var(--text-dim); margin-bottom:10px; }
        .usage-stat-value { font-family:'Syne',sans-serif; font-size:28px; font-weight:700; color:var(--text); line-height:1; }
        .usage-stat-sub { font-family:'Space Mono',monospace; font-size:9px; color:var(--text-dim); margin-top:6px; }

        .usage-section-title { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.1em; color:var(--text-dim); margin-bottom:14px; }

        .usage-breakdown-panel { background:var(--surface); border:1px solid var(--border); border-radius:6px; padding:24px; margin-bottom:28px; }
        .usage-action-row { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
        .usage-action-row:last-child { margin-bottom:0; }
        .usage-action-icon { font-size:14px; flex-shrink:0; width:24px; text-align:center; }
        .usage-action-name { font-family:'Space Mono',monospace; font-size:10px; color:var(--text); width:160px; flex-shrink:0; }
        .usage-bar-wrap { flex:1; background:var(--surface2); border-radius:2px; height:6px; overflow:hidden; }
        .usage-bar-fill { height:100%; border-radius:2px; transition:width 500ms ease; }
        .usage-action-credits { font-family:'Space Mono',monospace; font-size:10px; color:var(--text-dim); width:70px; text-align:right; flex-shrink:0; }
        .usage-action-calls { font-family:'Space Mono',monospace; font-size:9px; color:var(--text-dim); width:50px; text-align:right; flex-shrink:0; }

        /* Pricing Tiers */
        .usage-tiers-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; margin-bottom:28px; }
        @media(max-width:860px) { .usage-tiers-grid { grid-template-columns:repeat(2,1fr); } }
        .usage-tier-card { background:var(--surface); border:1px solid var(--border); border-radius:6px; padding:18px 16px; text-align:center; position:relative; overflow:hidden; transition:border-color 200ms; }
        .usage-tier-card:hover { border-color:var(--purple); }
        .usage-tier-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
        .usage-tier-name { font-family:'Syne',sans-serif; font-size:13px; font-weight:700; color:var(--text); margin-bottom:4px; }
        .usage-tier-badge { font-family:'Space Mono',monospace; font-size:10px; margin-bottom:10px; }
        .usage-tier-credits { font-family:'Space Mono',monospace; font-size:9px; color:var(--text-dim); margin-bottom:8px; }
        .usage-tier-cta { font-family:'Space Mono',monospace; font-size:8px; text-transform:uppercase; letter-spacing:0.08em; padding:5px 10px; border-radius:3px; border:1px solid var(--border); color:var(--text-dim); cursor:pointer; background:transparent; transition:all 200ms; }
        .usage-tier-cta:hover { border-color:var(--purple); color:var(--purple); }

        .skeleton { background:linear-gradient(90deg,var(--surface2) 25%,var(--surface3) 50%,var(--surface2) 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:4px; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      {/* Header */}
      <div className="usage-header-row">
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: "var(--text)", margin: 0 }}>
            📊 Usage & <span style={{ color: "var(--purple)", fontStyle: "italic" }}>Credits</span>
          </h1>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>
            Credit consumption · API call volumes · Cost per action
          </div>
        </div>
        <div className="usage-period-tabs">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p.value}
              className={`usage-period-tab ${period === p.value ? "active" : ""}`}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Context Bar */}
      <div className="usage-ctx">
        <span className="ctx-badge live">⬡ Core Engine</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge active">☁️ Cloud</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge active">📊 Usage</span>
      </div>

      {/* Stats Row */}
      <div className="usage-stats-row">
        <div className="usage-stat-card credits">
          <div className="usage-stat-label">Credits Used</div>
          {loading ? (
            <div className="skeleton" style={{ height: 32, width: "60%" }} />
          ) : (
            <>
              <div className="usage-stat-value" style={{ color: "var(--purple)" }}>
                {formatNumber(usage?.totalCredits ?? 0)}
              </div>
              <div className="usage-stat-sub">~${((usage?.totalCredits ?? 0) * 0.001).toFixed(2)} at $0.001/credit</div>
            </>
          )}
        </div>
        <div className="usage-stat-card calls">
          <div className="usage-stat-label">API Calls</div>
          {loading ? (
            <div className="skeleton" style={{ height: 32, width: "60%" }} />
          ) : (
            <>
              <div className="usage-stat-value" style={{ color: "var(--ice)" }}>
                {formatNumber(usage?.totalCalls ?? 0)}
              </div>
              <div className="usage-stat-sub">across all endpoints</div>
            </>
          )}
        </div>
        <div className="usage-stat-card cost">
          <div className="usage-stat-label">Estimated Cost</div>
          {loading ? (
            <div className="skeleton" style={{ height: 32, width: "60%" }} />
          ) : (
            <>
              <div className="usage-stat-value" style={{ color: "var(--gold)" }}>
                ${((usage?.totalCredits ?? 0) * 0.001).toFixed(2)}
              </div>
              <div className="usage-stat-sub">{PERIOD_OPTIONS.find((p) => p.value === period)?.label}</div>
            </>
          )}
        </div>
      </div>

      {/* Breakdown by Action */}
      <div className="usage-section-title">Breakdown by Action</div>
      <div className="usage-breakdown-panel">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="usage-action-row">
              <div className="skeleton" style={{ height: 14, width: 24 }} />
              <div className="skeleton" style={{ height: 10, width: 160 }} />
              <div className="skeleton" style={{ flex: 1, height: 6 }} />
              <div className="skeleton" style={{ height: 10, width: 60 }} />
            </div>
          ))
        ) : !usage || usage.byAction.length === 0 ? (
          <div style={{ color: "var(--text-dim)", fontFamily: "'Syne',sans-serif", fontSize: 13, padding: "20px 0", textAlign: "center" }}>
            No usage data for this period
          </div>
        ) : (
          usage.byAction
            .sort((a, b) => b.credits - a.credits)
            .map((a) => (
              <div key={a.action} className="usage-action-row">
                <div className="usage-action-icon">{ACTION_ICONS[a.action] ?? "⚡"}</div>
                <div className="usage-action-name">{a.action}</div>
                <div className="usage-bar-wrap">
                  <div
                    className="usage-bar-fill"
                    style={{
                      width: `${(a.credits / maxCredits) * 100}%`,
                      background: `linear-gradient(90deg, var(--purple), var(--ice))`,
                    }}
                  />
                </div>
                <div className="usage-action-credits">{formatNumber(a.credits)} cr</div>
                <div className="usage-action-calls">{formatNumber(a.calls)} calls</div>
              </div>
            ))
        )}
      </div>

      {/* Credit Pricing Tiers */}
      <div className="usage-section-title">Credit Plans</div>
      <div className="usage-tiers-grid">
        {CREDIT_TIERS.map((tier) => (
          <div key={tier.name} className="usage-tier-card">
            <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${tier.color}, transparent)` }} />
            <div className="usage-tier-name">{tier.name}</div>
            <div className="usage-tier-badge" style={{ color: tier.color }}>{tier.badge}</div>
            <div className="usage-tier-credits">
              {tier.credits === -1 ? "Unlimited" : `${formatNumber(tier.credits)} credits/mo`}
            </div>
            <button className="usage-tier-cta">Upgrade</button>
          </div>
        ))}
      </div>

      {/* Credit Pricing Table */}
      <div className="usage-section-title">Action Credit Costs</div>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-dim)", padding: "10px 16px", textAlign: "left", borderBottom: "1px solid var(--border)" }}>Action</th>
              <th style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-dim)", padding: "10px 16px", textAlign: "left", borderBottom: "1px solid var(--border)" }}>Credits</th>
              <th style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-dim)", padding: "10px 16px", textAlign: "left", borderBottom: "1px solid var(--border)" }}>USD Equivalent</th>
            </tr>
          </thead>
          <tbody>
            {[
              { action: "AI Chat (per message)",       credits: 10,   usd: "$0.01" },
              { action: "AI Analysis (per document)",  credits: 50,   usd: "$0.05" },
              { action: "Skill Detection (per post)",  credits: 5,    usd: "$0.005" },
              { action: "Automation Run (per trigger)",credits: 2,    usd: "$0.002" },
              { action: "Agent Run (per execution)",   credits: 20,   usd: "$0.02" },
              { action: "Webhook Delivery",            credits: 1,    usd: "$0.001" },
              { action: "Connector Action",            credits: 3,    usd: "$0.003" },
              { action: "Certificate Verify",          credits: 1,    usd: "$0.001" },
              { action: "Export Generate",             credits: 5,    usd: "$0.005" },
            ].map((row, i) => (
              <tr key={row.action} style={{ borderBottom: i < 8 ? "1px solid rgba(30,50,72,0.4)" : "none" }}>
                <td style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, color: "var(--text)", padding: "12px 16px" }}>{row.action}</td>
                <td style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "var(--purple)", padding: "12px 16px" }}>{row.credits} cr</td>
                <td style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "var(--text-dim)", padding: "12px 16px" }}>{row.usd}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AssistantPanel
        assistant="nexus"
        page="cloud/usage"
        context={{ layer: "cloud", view: "usage", description: "Usage analytics and credit metering — breakdown by action, cost per call, pricing tiers" }}
      />
    </div>
  );
}
