// src/features/admin/AdminPage.tsx

import { useState, useEffect } from "react";
import { useAuthStore } from "../auth/authStore";
import { API_BASE } from "../../lib/api";

const API = API_BASE;
const css = `
  .adm-root { padding: 24px 24px 80px; font-family: 'Syne', sans-serif; color: var(--text); max-width: 1100px; }

  .adm-header { margin-bottom: 20px; }
  .adm-title  { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 4px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
  .adm-title span { color: var(--gold); }
  .adm-badge  { font-family: 'Space Mono', monospace; font-size: 8px; padding: 2px 8px; border-radius: 2px; background: rgba(224,90,78,0.1); color: var(--red); border: 1px solid rgba(224,90,78,0.2); }
  .adm-subtitle { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }

  /* ── Ecosystem bar ── */
  .adm-eco-bar {
    background: linear-gradient(135deg, rgba(43,95,142,0.08), rgba(201,168,76,0.04));
    border: 1px solid rgba(43,95,142,0.18); border-radius: 6px;
    padding: 10px 16px; margin-bottom: 20px;
    display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  }
  .adm-eco-label { font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: var(--ice); flex-shrink: 0; }
  .adm-eco-chips { display: flex; gap: 6px; flex-wrap: wrap; }
  .adm-eco-chip  { font-family: 'Space Mono', monospace; font-size: 8px; padding: 2px 9px; border-radius: 10px; border: 1px solid var(--border); color: var(--text-dim); }
  .adm-eco-chip.active { border-color: rgba(45,212,160,0.3); color: var(--green); background: rgba(45,212,160,0.05); }

  /* ── Tabs ── */
  .adm-tabs { display: flex; gap: 2px; margin-bottom: 20px; border-bottom: 1px solid var(--border); }
  .adm-tab {
    padding: 9px 16px; font-family: 'Space Mono', monospace; font-size: 10px;
    cursor: pointer; color: var(--text-dim); border-bottom: 2px solid transparent;
    margin-bottom: -1px; transition: all 0.15s;
    background: none; border-top: none; border-left: none; border-right: none;
  }
  .adm-tab:hover { color: var(--text); }
  .adm-tab.active { color: var(--gold); border-bottom-color: var(--gold); }

  /* ── KPIs ── */
  .adm-kpis { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 18px; }
  .adm-kpi {
    background: var(--surface); border: 1px solid var(--border); border-radius: 6px;
    padding: 14px 16px; position: relative; overflow: hidden;
  }
  .adm-kpi::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--gold), var(--ice)); }
  .adm-kpi-label { font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 6px; }
  .adm-kpi-value { font-size: 22px; font-weight: 800; letter-spacing: -1px; color: var(--gold); }
  .adm-kpi-sub   { font-family: 'Space Mono', monospace; font-size: 8px; color: var(--text-dim); margin-top: 4px; }

  /* ── Charts ── */
  .adm-charts { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 18px; }
  .adm-chart-card { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 18px; }
  .adm-chart-title { font-size: 12px; font-weight: 700; margin-bottom: 14px; }

  .adm-plan-bar { margin-bottom: 10px; }
  .adm-plan-bar-label { display: flex; justify-content: space-between; font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); margin-bottom: 4px; }
  .adm-plan-bar-track { height: 5px; background: var(--surface2); border-radius: 3px; overflow: hidden; }
  .adm-plan-bar-fill  { height: 100%; border-radius: 3px; transition: width 0.6s ease; }

  .adm-sparkline { height: 72px; display: flex; align-items: flex-end; gap: 2px; }
  .adm-spark-bar { flex: 1; border-radius: 2px 2px 0 0; background: rgba(201,168,76,0.3); transition: background 0.15s; min-height: 2px; }
  .adm-spark-bar:hover { background: var(--gold); }

  /* ── Table ── */
  .adm-table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; overflow: hidden; margin-bottom: 14px; }
  .adm-table-header { padding: 12px 18px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .adm-table-title  { font-size: 12px; font-weight: 700; }
  .adm-search {
    background: var(--surface2); border: 1px solid var(--border); border-radius: 3px;
    padding: 6px 12px; font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text);
    outline: none; width: 200px;
  }
  .adm-search:focus { border-color: var(--gold); }
  .adm-search::placeholder { color: var(--text-dim); }

  table { width: 100%; border-collapse: collapse; }
  th {
    font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 1.5px;
    text-transform: uppercase; color: var(--text-dim); padding: 9px 18px;
    text-align: left; border-bottom: 1px solid var(--border); background: var(--surface2);
  }
  td { padding: 11px 18px; font-size: 12px; border-bottom: 1px solid var(--border); }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba(43,95,142,0.03); }

  .adm-plan-tag { font-family: 'Space Mono', monospace; font-size: 8px; padding: 2px 7px; border-radius: 2px; }
  .adm-plan-tag.FREE       { background: rgba(90,122,150,0.12); color: var(--text-dim); }
  .adm-plan-tag.PRO        { background: rgba(201,168,76,0.1);  color: var(--gold); }
  .adm-plan-tag.ENTERPRISE { background: rgba(155,111,255,0.1); color: var(--purple); }

  .adm-action-btn {
    background: transparent; border: 1px solid var(--border); border-radius: 3px;
    padding: 3px 9px; font-family: 'Space Mono', monospace; font-size: 8px;
    color: var(--text-dim); cursor: pointer; transition: all 0.15s; margin-right: 4px;
  }
  .adm-action-btn:hover        { border-color: var(--gold); color: var(--gold); }
  .adm-action-btn.danger:hover { border-color: var(--red);  color: var(--red); }

  .adm-pagination {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 18px; font-family: 'Space Mono', monospace; font-size: 9px;
    color: var(--text-dim); border-top: 1px solid var(--border);
  }
  .adm-page-btn {
    background: var(--surface2); border: 1px solid var(--border); border-radius: 3px;
    padding: 4px 12px; font-family: 'Space Mono', monospace; font-size: 9px;
    color: var(--text-dim); cursor: pointer; transition: all 0.15s;
  }
  .adm-page-btn:hover:not(:disabled) { border-color: var(--gold); color: var(--gold); }
  .adm-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── Modal ── */
  .adm-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 1000; display: flex; align-items: center; justify-content: center; }
  .adm-modal { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 24px; width: 340px; }
  .adm-modal-title { font-size: 15px; font-weight: 800; margin-bottom: 14px; }
  .adm-modal-select {
    width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 3px;
    padding: 9px 12px; font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text);
    outline: none; margin-bottom: 14px;
  }
  .adm-modal-btns { display: flex; gap: 8px; justify-content: flex-end; }
  .adm-btn { background: var(--gold); color: #080B10; border: none; border-radius: 3px; padding: 8px 18px; font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; cursor: pointer; }
  .adm-btn.ghost { background: transparent; border: 1px solid var(--border); color: var(--text-dim); }

  /* ── States ── */
  .adm-empty   { padding: 32px; text-align: center; font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }
  .adm-loading { padding: 40px; text-align: center; font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }
  .adm-error   { padding: 12px 16px; background: rgba(224,90,78,0.08); border: 1px solid rgba(224,90,78,0.2); border-radius: 4px; font-family: 'Space Mono', monospace; font-size: 10px; color: var(--red); margin-bottom: 14px; }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .adm-kpis   { grid-template-columns: repeat(3, 1fr); }
    .adm-charts { grid-template-columns: 1fr; }
    .adm-root   { padding: 14px 12px 80px; }
  }
  @media (max-width: 600px) {
    .adm-kpis   { grid-template-columns: repeat(2, 1fr); }
    .adm-search { width: 130px; }
  }
`;

if (typeof document !== "undefined" && !document.getElementById("adm-styles")) {
  const tag = document.createElement("style");
  tag.id = "adm-styles"; tag.textContent = css;
  document.head.appendChild(tag);
}

function fmt(n: number) {
  return `$${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const PLAN_COLORS: Record<string, string> = {
  FREE: "#5A7A96", PRO: "#C9A84C", ENTERPRISE: "#9B6FFF",
};

export default function AdminPage() {
  const token = useAuthStore((s) => s.token);

  const [tab, setTab]         = useState<"overview" | "tenants" | "users">("overview");
  const [stats, setStats]     = useState<any>(null);
  const [tenants, setTenants] = useState<any>(null);
  const [users, setUsers]     = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);
  const [modal, setModal]     = useState<{ tenantId: string; name: string; plan: string } | null>(null);
  const [newPlan, setNewPlan] = useState("PRO");

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (tab === "overview" && !stats) loadStats();
    if (tab === "tenants") loadTenants();
    if (tab === "users")   loadUsers();
  }, [tab, page, search]);

  const loadStats = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/admin/stats`, { headers });
      if (res.status === 403) { setError("Superadmin access required. Add your email to ADMIN_EMAILS in Railway."); return; }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStats(await res.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const loadTenants = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/admin/tenants?page=${page}&q=${encodeURIComponent(search)}`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTenants(await res.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const loadUsers = async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/admin/users?page=${page}&q=${encodeURIComponent(search)}`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setUsers(await res.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const changePlan = async () => {
    if (!modal) return;
    await fetch(`${API}/admin/tenants/${modal.tenantId}/plan`, {
      method: "PATCH", headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ plan: newPlan }),
    });
    setModal(null);
    loadTenants();
  };

  const deleteTenant = async (id: string) => {
    if (!confirm("Are you sure? This will soft-delete the tenant.")) return;
    await fetch(`${API}/admin/tenants/${id}`, { method: "DELETE", headers });
    loadTenants();
  };

  const maxRevenue    = stats ? Math.max(...(stats.revenueByDay?.map((d: any) => d.amount) ?? [1])) : 1;
  const totalPlanCount = stats ? stats.planDistribution.reduce((s: number, p: any) => s + p.count, 0) : 1;

  return (
    <div className="adm-root">

      {/* Header */}
      <div className="adm-header">
        <h1 className="adm-title">
          Admin <span>Super Dashboard</span>
          <span className="adm-badge">SUPERADMIN</span>
        </h1>
        <p className="adm-subtitle">Winners Ecosystem · Platform-wide visibility across all tenants, users and revenue</p>
      </div>

      {/* Ecosystem bar */}
      <div className="adm-eco-bar">
        <div className="adm-eco-label">Ecosystem Scope</div>
        <div className="adm-eco-chips">
          <div className="adm-eco-chip active">⬡ Core · All Tenants</div>
          <div className="adm-eco-chip active">🧑‍🤝‍🧑 Community · Live</div>
          <div className="adm-eco-chip">🎓 Academy · Soon</div>
          <div className="adm-eco-chip">🛒 Market · Soon</div>
          <div className="adm-eco-chip">🤖 AI · Planned</div>
        </div>
      </div>

      {error && <div className="adm-error">⚠ {error}</div>}

      {/* Tabs */}
      <div className="adm-tabs">
        {(["overview", "tenants", "users"] as const).map((t) => (
          <button
            key={t}
            className={`adm-tab${tab === t ? " active" : ""}`}
            onClick={() => { setTab(t); setPage(1); setSearch(""); }}
          >
            {t === "overview" ? "📊 Overview" : t === "tenants" ? "🏢 Tenants" : "👥 Users"}
          </button>
        ))}
      </div>

      {loading && <div className="adm-loading">Loading…</div>}

      {/* ── Overview ── */}
      {!loading && tab === "overview" && stats && (
        <>
          <div className="adm-kpis">
            {[
              { label: "Total Tenants",  value: stats.totals.tenants,       sub: `+${stats.totals.newThisWeek} this week` },
              { label: "Total Users",    value: stats.totals.users,         sub: "across all workspaces" },
              { label: "Total Revenue",  value: fmt(stats.totals.revenue),  sub: "all time" },
              { label: "New This Month", value: stats.totals.newThisMonth,  sub: "new workspaces" },
              { label: "New This Week",  value: stats.totals.newThisWeek,   sub: "new workspaces" },
            ].map((k) => (
              <div className="adm-kpi" key={k.label}>
                <div className="adm-kpi-label">{k.label}</div>
                <div className="adm-kpi-value">{k.value}</div>
                <div className="adm-kpi-sub">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="adm-charts">
            <div className="adm-chart-card">
              <div className="adm-chart-title">Revenue — Last 30 Days</div>
              <div className="adm-sparkline">
                {stats.revenueByDay.map((d: any) => (
                  <div
                    key={d.date} className="adm-spark-bar"
                    style={{ height: `${Math.max(4, (d.amount / maxRevenue) * 100)}%` }}
                    title={`${d.date}: ${fmt(d.amount)}`}
                  />
                ))}
              </div>
            </div>

            <div className="adm-chart-card">
              <div className="adm-chart-title">Plan Distribution</div>
              {stats.planDistribution.map((p: any) => (
                <div className="adm-plan-bar" key={p.plan}>
                  <div className="adm-plan-bar-label">
                    <span>{p.plan}</span>
                    <span>{p.count} workspace{p.count !== 1 ? "s" : ""} ({Math.round((p.count / totalPlanCount) * 100)}%)</span>
                  </div>
                  <div className="adm-plan-bar-track">
                    <div className="adm-plan-bar-fill" style={{ width: `${(p.count / totalPlanCount) * 100}%`, background: PLAN_COLORS[p.plan] ?? "#5A7A96" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── Tenants ── */}
      {!loading && tab === "tenants" && tenants && (
        <div className="adm-table-wrap">
          <div className="adm-table-header">
            <div className="adm-table-title">🏢 All Tenants ({tenants.total})</div>
            <input
              className="adm-search" placeholder="Search tenants…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <table>
            <thead>
              <tr><th>Workspace</th><th>Plan</th><th>Users</th><th>Revenue</th><th>Created</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {tenants.tenants.length === 0
                ? <tr><td colSpan={6}><div className="adm-empty">No tenants found</div></td></tr>
                : tenants.tenants.map((t: any) => (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.name}</strong><br />
                      <span style={{ fontFamily: "Space Mono, monospace", fontSize: 9, color: "var(--text-dim)" }}>{t.id}</span>
                    </td>
                    <td><span className={`adm-plan-tag ${t.plan}`}>{t.plan}</span></td>
                    <td>{t._count.users}</td>
                    <td>{fmt(t.totalRevenue)}</td>
                    <td style={{ fontFamily: "Space Mono, monospace", fontSize: 9 }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="adm-action-btn" onClick={() => { setModal({ tenantId: t.id, name: t.name, plan: t.plan }); setNewPlan(t.plan); }}>Change Plan</button>
                      <button className="adm-action-btn danger" onClick={() => deleteTenant(t.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
          <div className="adm-pagination">
            <span>Page {tenants.page} of {tenants.pages}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="adm-page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
              <button className="adm-page-btn" disabled={page >= tenants.pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Users ── */}
      {!loading && tab === "users" && users && (
        <div className="adm-table-wrap">
          <div className="adm-table-header">
            <div className="adm-table-title">👥 All Users ({users.total})</div>
            <input
              className="adm-search" placeholder="Search users…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Workspace</th><th>Plan</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {users.users.length === 0
                ? <tr><td colSpan={6}><div className="adm-empty">No users found</div></td></tr>
                : users.users.map((u: any) => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong></td>
                    <td style={{ fontFamily: "Space Mono, monospace", fontSize: 10 }}>{u.email}</td>
                    <td style={{ fontFamily: "Space Mono, monospace", fontSize: 10 }}>{u.role}</td>
                    <td>{u.tenant?.name ?? "—"}</td>
                    <td><span className={`adm-plan-tag ${u.tenant?.plan ?? "FREE"}`}>{u.tenant?.plan ?? "—"}</span></td>
                    <td style={{ fontFamily: "Space Mono, monospace", fontSize: 9 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
          <div className="adm-pagination">
            <span>Page {users.page} of {users.pages}</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="adm-page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
              <button className="adm-page-btn" disabled={page >= users.pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          </div>
        </div>
      )}

      {/* Change Plan Modal */}
      {modal && (
        <div className="adm-modal-overlay" onClick={() => setModal(null)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-title">Change Plan — {modal.name}</div>
            <select className="adm-modal-select" value={newPlan} onChange={(e) => setNewPlan(e.target.value)}>
              <option value="FREE">FREE</option>
              <option value="PRO">PRO</option>
              <option value="ENTERPRISE">ENTERPRISE</option>
            </select>
            <div className="adm-modal-btns">
              <button className="adm-btn ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="adm-btn" onClick={changePlan}>Save</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
