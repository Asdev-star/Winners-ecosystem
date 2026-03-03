// src/features/stripe/StripeDashboard.tsx

import { useState, useEffect } from "react";
import { getAuthHeaders } from "../auth/authStore";
import { API_BASE } from "../../lib/api";

const API = API_BASE;
const css = `
  .sd-wrap { padding: 32px; max-width: 1100px; margin: 0 auto; }
  .sd-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
  .sd-title { font-size: 28px; font-weight: 800; letter-spacing: -1px; }
  .sd-title span { color: var(--gold, var(--gold)); }
  .sd-tag { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--text-dim, var(--text-dim)); margin-bottom: 6px; }
  .sd-actions { display: flex; gap: 10px; flex-wrap: wrap; }
  .sd-btn {
    padding: 9px 18px; border-radius: 4px; font-family: 'Syne', sans-serif;
    font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s; border: none;
  }
  .sd-btn-gold { background: var(--gold, var(--gold)); color: var(--bg); }
  .sd-btn-gold:hover { opacity: 0.88; }
  .sd-btn-outline { background: transparent; border: 1px solid var(--border, var(--border)); color: var(--text, var(--text)); }
  .sd-btn-outline:hover { border-color: var(--gold, var(--gold)); color: var(--gold, var(--gold)); }
  .sd-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .sd-status {
    display: flex; align-items: center; gap: 8px; padding: 10px 16px;
    background: var(--surface, var(--surface)); border: 1px solid var(--border, var(--border));
    border-radius: 4px; margin-bottom: 24px;
    font-family: 'Space Mono', monospace; font-size: 11px;
  }
  .sd-status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

  .sd-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
  .sd-kpi {
    background: var(--surface, var(--surface)); border: 1px solid var(--border, var(--border));
    border-radius: 6px; padding: 20px; position: relative; overflow: hidden;
  }
  .sd-kpi::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: var(--gold, var(--gold)); }
  .sd-kpi:nth-child(2)::before { background: var(--green); }
  .sd-kpi:nth-child(3)::before { background: var(--blue); }
  .sd-kpi:nth-child(4)::before { background: #9B6FFF; }
  .sd-kpi-label { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: var(--text-dim, var(--text-dim)); margin-bottom: 8px; }
  .sd-kpi-val { font-size: 26px; font-weight: 800; letter-spacing: -1px; }
  .sd-kpi-sub { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim, var(--text-dim)); margin-top: 4px; }

  .sd-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .sd-card { background: var(--surface, var(--surface)); border: 1px solid var(--border, var(--border)); border-radius: 6px; padding: 20px; }
  .sd-card-title { font-size: 13px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }

  .sd-table { width: 100%; border-collapse: collapse; font-family: 'Space Mono', monospace; font-size: 11px; }
  .sd-table th { color: var(--text-dim, var(--text-dim)); text-align: left; padding: 6px 4px; border-bottom: 1px solid var(--border, var(--border)); font-weight: 400; }
  .sd-table td { padding: 10px 4px; border-bottom: 1px solid rgba(30,42,56,0.5); }
  .sd-table tr:last-child td { border-bottom: none; }

  .sd-badge {
    display: inline-block; padding: 2px 8px; border-radius: 3px;
    font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
  }
  .sd-badge-green { background: rgba(45,212,160,0.12); color: var(--green); }
  .sd-badge-test  { background: rgba(74,158,255,0.12); color: var(--blue); }

  .sd-plan-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 24px; }
  .sd-plan { background: var(--surface, var(--surface)); border: 1px solid var(--border, var(--border)); border-radius: 6px; padding: 24px; text-align: center; transition: border-color 0.2s; }
  .sd-plan:hover { border-color: rgba(245,200,66,0.3); }
  .sd-plan.current { border-color: var(--gold, var(--gold)); background: rgba(245,200,66,0.04); }
  .sd-plan-name { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--text-dim, var(--text-dim)); margin-bottom: 12px; }
  .sd-plan-price { font-size: 36px; font-weight: 900; letter-spacing: -2px; margin-bottom: 4px; }
  .sd-plan.current .sd-plan-price { color: var(--gold, var(--gold)); }
  .sd-plan-period { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim, var(--text-dim)); margin-bottom: 20px; }
  .sd-plan-btn { width: 100%; padding: 10px; border-radius: 3px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s; }

  .sd-empty { text-align: center; padding: 32px; font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim, var(--text-dim)); }

  @media (max-width: 900px) {
    .sd-kpis { grid-template-columns: repeat(2, 1fr); }
    .sd-grid  { grid-template-columns: 1fr; }
    .sd-plan-grid { grid-template-columns: 1fr; }
  }
`;

function fmt(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export default function StripeDashboard() {
  const [stats, setStats]       = useState<any>(null);
  const [status, setStatus]     = useState<any>(null);
  const [loading, setLoading]   = useState(true);
  const [syncing, setSyncing]   = useState(false);
  const [toast, setToast]       = useState("");

  useEffect(() => {
    if (!document.getElementById("sd-styles")) {
      const tag = document.createElement("style");
      tag.id = "sd-styles"; tag.textContent = css;
      document.head.appendChild(tag);
    }
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [statsRes, statusRes] = await Promise.all([
        fetch(`${API}/stripe/stats`, { headers: getAuthHeaders() }),
        fetch(`${API}/stripe/status`, { headers: getAuthHeaders() }),
      ]);
      if (statsRes.ok)  setStats(await statsRes.json());
      if (statusRes.ok) setStatus(await statusRes.json());
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  async function syncRevenue() {
    setSyncing(true);
    try {
      const res = await fetch(`${API}/stripe/sync`, {
        method: "POST", headers: getAuthHeaders(),
      });
      const data = await res.json();
      setToast(data.message ?? "Synced!");
      setTimeout(() => setToast(""), 3000);
      fetchData();
    } catch { setToast("Sync failed"); }
    setSyncing(false);
  }

  async function checkout(plan: string) {
    try {
      const res = await fetch(`${API}/stripe/checkout`, {
        method:  "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body:    JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else setToast(data.message ?? "Error");
    } catch { setToast("Checkout failed"); }
  }

  return (
    <div className="sd-wrap">
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, zIndex: 999, background: "var(--green)", color: "var(--bg)", padding: "10px 20px", borderRadius: 4, fontFamily: "Space Mono", fontSize: 12, fontWeight: 700 }}>
          {toast}
        </div>
      )}

      <div className="sd-header">
        <div>
          <div className="sd-tag">Payments</div>
          <div className="sd-title">Stripe <span>Dashboard</span></div>
        </div>
        <div className="sd-actions">
          <button className="sd-btn sd-btn-outline" onClick={syncRevenue} disabled={syncing}>
            {syncing ? "Syncing..." : "⟳ Sync Revenue"}
          </button>
          <button className="sd-btn sd-btn-gold" onClick={fetchData}>Refresh</button>
        </div>
      </div>

      {status && (
        <div className="sd-status">
          <div className="sd-status-dot" style={{ background: status.configured ? "var(--green)" : "var(--red)", boxShadow: `0 0 6px ${status.configured ? "var(--green)" : "var(--red)"}` }} />
          <span style={{ color: status.configured ? "var(--green)" : "var(--red)" }}>{status.message}</span>
          {status.configured && (
            <span style={{ marginLeft: 8, color: "var(--text-dim)" }}>
              · Mode: <span style={{ color: status.mode === "live" ? "var(--green)" : "var(--blue)" }}>{status.mode}</span>
            </span>
          )}
        </div>
      )}

      {loading ? (
        <div className="sd-empty">Loading Stripe data...</div>
      ) : !stats ? (
        <div className="sd-empty">⚠️ Could not load Stripe data. Check your STRIPE_SECRET_KEY.</div>
      ) : (
        <>
          {/* KPIs */}
          <div className="sd-kpis">
            <div className="sd-kpi">
              <div className="sd-kpi-label">30-Day Revenue</div>
              <div className="sd-kpi-val">{fmt(stats.last30Days.revenue)}</div>
              <div className="sd-kpi-sub">{stats.last30Days.transactions} transactions</div>
            </div>
            <div className="sd-kpi">
              <div className="sd-kpi-label">MRR</div>
              <div className="sd-kpi-val">{fmt(stats.subscriptions.mrr)}</div>
              <div className="sd-kpi-sub">{stats.subscriptions.active} active subs</div>
            </div>
            <div className="sd-kpi">
              <div className="sd-kpi-label">Available Balance</div>
              <div className="sd-kpi-val">{fmt(stats.balance.available)}</div>
              <div className="sd-kpi-sub">{fmt(stats.balance.pending)} pending</div>
            </div>
            <div className="sd-kpi">
              <div className="sd-kpi-label">New Customers</div>
              <div className="sd-kpi-val">{stats.last30Days.newCustomers}</div>
              <div className="sd-kpi-sub">{stats.last30Days.refunds} refunds</div>
            </div>
          </div>

          {/* Recent charges + subscriptions */}
          <div className="sd-grid">
            <div className="sd-card">
              <div className="sd-card-title">💳 Recent Charges</div>
              {stats.recentCharges.length === 0 ? (
                <div className="sd-empty">No charges yet</div>
              ) : (
                <table className="sd-table">
                  <thead>
                    <tr>
                      <th>Description</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentCharges.map((c: any) => (
                      <tr key={c.id}>
                        <td style={{ color: "var(--text)" }}>{c.description.slice(0, 20)}</td>
                        <td style={{ color: "var(--gold)" }}>{fmt(c.amount)}</td>
                        <td><span className="sd-badge sd-badge-green">{c.status}</span></td>
                        <td style={{ color: "var(--text-dim)" }}>{new Date(c.date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="sd-card">
              <div className="sd-card-title">📊 Account Summary</div>
              <table className="sd-table">
                <tbody>
                  {[
                    ["Active Subscriptions", stats.subscriptions.active],
                    ["Monthly Recurring Revenue", fmt(stats.subscriptions.mrr)],
                    ["30-Day Transactions", stats.last30Days.transactions],
                    ["30-Day Refunds", stats.last30Days.refunds],
                    ["Available Balance", fmt(stats.balance.available)],
                    ["Pending Balance", fmt(stats.balance.pending)],
                  ].map(([label, value]) => (
                    <tr key={String(label)}>
                      <td style={{ color: "var(--text-dim)" }}>{label}</td>
                      <td style={{ color: "var(--text)", textAlign: "right", fontWeight: 700 }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Upgrade plans */}
          <div style={{ marginTop: 24 }}>
            <div className="sd-tag" style={{ marginBottom: 8 }}>Subscription Plans</div>
            <div className="sd-plan-grid">
              {[
                { name: "Free",       price: "$0",   plan: null,         features: "3 members · 30 days · CSV export" },
                { name: "Pro",        price: "$99",  plan: "PRO",        features: "10 members · 90 days · AI insights" },
                { name: "Enterprise", price: "$299", plan: "ENTERPRISE", features: "Unlimited · AI + custom · Priority support" },
              ].map((p) => (
                <div key={p.name} className={`sd-plan${p.name === "Free" ? " current" : ""}`}>
                  <div className="sd-plan-name">{p.name}</div>
                  <div className="sd-plan-price">{p.price}</div>
                  <div className="sd-plan-period">/month</div>
                  <div style={{ fontFamily: "Space Mono", fontSize: 10, color: "var(--text-dim)", marginBottom: 16, lineHeight: 1.6 }}>{p.features}</div>
                  {p.plan ? (
                    <button
                      className="sd-plan-btn sd-btn-gold"
                      style={{ border: "none" }}
                      onClick={() => checkout(p.plan!)}
                    >
                      Upgrade to {p.name} →
                    </button>
                  ) : (
                    <button className="sd-plan-btn sd-btn-outline" disabled style={{ border: "1px solid var(--border)" }}>
                      Current Plan
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
