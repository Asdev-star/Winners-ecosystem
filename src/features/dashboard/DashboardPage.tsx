// src/features/dashboard/DashboardPage.tsx
// Phase 1 — Core Engine | Control Center
// Fixed: shows real data, handles loading/error/empty states, ecosystem design system

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";
import { useDashboardStore } from "./dashboardStore";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&display=swap');

/* ── Root ──────────────────────────────────────────────────────────────────── */
.dash-root {
  min-height: 100vh; background: var(--bg); color: var(--text);
  font-family: 'Syne', sans-serif; padding: 28px 28px 80px;
}

/* ── Context Bar ───────────────────────────────────────────────────────────── */
.dash-context-bar {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 24px; flex-wrap: wrap;
}
.dash-ctx {
  font-family: 'Space Mono', monospace; font-size: 9px;
  letter-spacing: 0.15em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 2px;
}
.dash-ctx.live    { background: rgba(45,212,160,0.1); color: var(--green); border: 1px solid rgba(45,212,160,0.2); }
.dash-ctx.active  { background: rgba(43,95,142,0.15); color: var(--ice);   border: 1px solid rgba(43,95,142,0.3); }
.dash-ctx.planned { background: rgba(90,122,150,0.08); color: var(--text-dim); border: 1px solid var(--border); }
.dash-ctx-sep { color: var(--border); }

/* ── Header ────────────────────────────────────────────────────────────────── */
.dash-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 24px; gap: 16px; flex-wrap: wrap;
}
.dash-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(26px, 4vw, 38px); font-weight: 300;
  color: var(--text); margin: 0 0 4px; line-height: 1.1;
}
.dash-title em { font-style: italic; color: var(--gold); }
.dash-title strong { font-weight: 600; }
.dash-date {
  font-family: 'Space Mono', monospace; font-size: 10px;
  color: var(--text-dim); letter-spacing: 0.05em;
}
.dash-live-pill {
  display: flex; align-items: center; gap: 8px;
  background: rgba(45,212,160,0.08); border: 1px solid rgba(45,212,160,0.2);
  border-radius: 20px; padding: 6px 14px;
  font-family: 'Space Mono', monospace; font-size: 9px;
  color: var(--green); letter-spacing: 0.1em; text-transform: uppercase; white-space: nowrap;
}
.dash-live-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--green); box-shadow: 0 0 8px var(--green);
  animation: dash-pulse 2s infinite;
}
@keyframes dash-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

/* ── Error Banner ──────────────────────────────────────────────────────────── */
.dash-error-banner {
  background: rgba(224,90,78,0.08); border: 1px solid rgba(224,90,78,0.25);
  border-radius: 6px; padding: 12px 18px; margin-bottom: 20px;
  font-family: 'Space Mono', monospace; font-size: 11px; color: var(--red);
  display: flex; align-items: center; gap: 10px;
}
.dash-error-banner button {
  margin-left: auto; background: none; border: 1px solid rgba(224,90,78,0.3);
  border-radius: 3px; color: var(--red); font-family: 'Space Mono', monospace;
  font-size: 10px; padding: 4px 10px; cursor: pointer;
}
.dash-error-banner button:hover { background: rgba(224,90,78,0.1); }

/* ── AI Command Bar ────────────────────────────────────────────────────────── */
.dash-ai-bar {
  display: flex; align-items: flex-start; gap: 16px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 6px; padding: 18px 20px; margin-bottom: 20px;
  position: relative; overflow: hidden;
}
.dash-ai-bar::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, var(--purple), var(--ice));
}
.dash-ai-icon { font-size: 22px; flex-shrink: 0; margin-top: 1px; }
.dash-ai-content { flex: 1; min-width: 0; }
.dash-ai-label {
  font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.15em;
  text-transform: uppercase; color: var(--purple); margin-bottom: 5px;
}
.dash-ai-text { font-size: 13px; color: var(--text); line-height: 1.6; }
.dash-ai-text strong { color: var(--gold); }
.dash-ai-actions { display: flex; gap: 8px; flex-shrink: 0; flex-wrap: wrap; align-items: flex-start; }
.dash-ai-btn {
  background: transparent; border: 1px solid var(--border); border-radius: 4px;
  padding: 7px 14px; font-family: 'Space Mono', monospace; font-size: 9px;
  color: var(--text-dim); cursor: pointer; transition: all 0.15s; white-space: nowrap;
  letter-spacing: 0.05em;
}
.dash-ai-btn:hover { border-color: var(--gold); color: var(--gold); }
.dash-ai-btn.primary {
  background: var(--gold); color: #080B10; border-color: var(--gold); font-weight: 700;
}
.dash-ai-btn.primary:hover { opacity: 0.88; }

/* ── KPIs ──────────────────────────────────────────────────────────────────── */
.dash-kpis {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 12px; margin-bottom: 20px;
}
.dash-kpi {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 6px; padding: 18px 20px;
  position: relative; overflow: hidden; transition: border-color 0.2s;
}
.dash-kpi:hover { border-color: rgba(201,168,76,0.25); }
.dash-kpi::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
}
.dash-kpi.gold::before   { background: linear-gradient(90deg, var(--gold),   rgba(201,168,76,0.3)); }
.dash-kpi.green::before  { background: linear-gradient(90deg, var(--green),  rgba(45,212,160,0.3)); }
.dash-kpi.blue::before   { background: linear-gradient(90deg, var(--blue),   var(--ice)); }
.dash-kpi.purple::before { background: linear-gradient(90deg, var(--purple), rgba(155,111,255,0.3)); }

.dash-kpi-label {
  font-family: 'Space Mono', monospace; font-size: 9px;
  letter-spacing: 0.15em; text-transform: uppercase;
  color: var(--text-dim); margin-bottom: 10px;
}
.dash-kpi-value {
  font-family: 'Cormorant Garamond', serif;
  font-size: 32px; font-weight: 600; letter-spacing: -1px;
  margin-bottom: 5px; line-height: 1;
}
.dash-kpi-delta { font-family: 'Space Mono', monospace; font-size: 10px; }
.dash-kpi-delta.up   { color: var(--green); }
.dash-kpi-delta.down { color: var(--red); }
.dash-kpi-delta.flat { color: var(--text-dim); }

/* ── Insight Strip ─────────────────────────────────────────────────────────── */
.dash-insight {
  display: flex; align-items: flex-start; gap: 12px;
  background: rgba(201,168,76,0.04); border: 1px solid rgba(201,168,76,0.15);
  border-left: 3px solid var(--gold);
  border-radius: 4px; padding: 12px 16px; margin-bottom: 20px;
  font-size: 13px; line-height: 1.6;
}
.dash-insight-icon { font-size: 16px; flex-shrink: 0; }
.dash-insight strong { color: var(--gold); }

/* ── Section Title ─────────────────────────────────────────────────────────── */
.dash-section-title {
  font-family: 'Space Mono', monospace; font-size: 9px;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--gold); margin-bottom: 12px; margin-top: 8px;
}

/* ── Roadmap Progress ──────────────────────────────────────────────────────── */
.dash-roadmap {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 6px; padding: 20px; margin-bottom: 20px;
  position: relative; overflow: hidden;
}
.dash-roadmap::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, var(--gold), var(--ice), var(--purple));
}
.dash-roadmap-title {
  font-family: 'Space Mono', monospace; font-size: 9px;
  letter-spacing: 0.15em; text-transform: uppercase;
  color: var(--text-dim); margin-bottom: 16px;
}
.dash-roadmap-phases {
  display: flex; gap: 0; overflow-x: auto;
  padding-bottom: 8px;
}
.dash-phase {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; flex: 1; min-width: 64px; position: relative;
}
.dash-phase:not(:last-child)::after {
  content: ''; position: absolute; top: 13px; left: calc(50% + 14px);
  width: calc(100% - 28px); height: 1px;
  background: var(--border);
}
.dash-phase.done-phase:not(:last-child)::after  { background: var(--gold); }
.dash-phase.active-phase:not(:last-child)::after { background: linear-gradient(90deg, var(--blue), var(--border)); }

.dash-phase-dot {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Space Mono', monospace; font-size: 9px;
  font-weight: 700; position: relative; z-index: 1; flex-shrink: 0;
}
.dash-phase-dot.done    { background: var(--gold); color: #080B10; }
.dash-phase-dot.active  { background: var(--blue); color: white; box-shadow: 0 0 12px rgba(43,95,142,0.5); }
.dash-phase-dot.pending { background: var(--surface2); border: 1px solid var(--border); color: var(--text-dim); }

.dash-phase-label {
  font-family: 'Space Mono', monospace; font-size: 8px;
  color: var(--text-dim); text-align: center; line-height: 1.4;
}
.dash-phase.done-phase .dash-phase-label   { color: var(--gold); }
.dash-phase.active-phase .dash-phase-label { color: var(--ice); }

/* ── Platforms Grid ────────────────────────────────────────────────────────── */
.dash-platforms {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 10px; margin-bottom: 20px;
}
.dash-platform {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 6px; padding: 16px; display: flex;
  align-items: center; gap: 14px; transition: all 0.2s;
}
.dash-platform.clickable { cursor: pointer; }
.dash-platform.clickable:hover {
  border-color: rgba(201,168,76,0.3); transform: translateY(-1px);
}
.dash-platform.disabled { opacity: 0.55; cursor: default; }
.dash-platform-icon { font-size: 22px; flex-shrink: 0; }
.dash-platform-name { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
.dash-platform-desc { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); line-height: 1.4; }
.dash-platform-right { margin-left: auto; flex-shrink: 0; }
.dash-platform-status {
  font-family: 'Space Mono', monospace; font-size: 9px;
  padding: 3px 8px; border-radius: 2px; letter-spacing: 0.08em;
}
.dash-platform-status.live    { background: rgba(45,212,160,0.1);  color: var(--green); border: 1px solid rgba(45,212,160,0.2); }
.dash-platform-status.soon    { background: rgba(201,168,76,0.08); color: var(--gold);  border: 1px solid rgba(201,168,76,0.2); }
.dash-platform-status.planned { background: rgba(90,122,150,0.08); color: var(--text-dim); border: 1px solid var(--border); }

/* ── Bottom Row ────────────────────────────────────────────────────────────── */
.dash-bottom {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.dash-quick-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 6px; padding: 20px;
  position: relative; overflow: hidden;
}
.dash-quick-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
}
.dash-quick-card.gold-card::before { background: linear-gradient(90deg, var(--gold), transparent); }
.dash-quick-card.blue-card::before { background: linear-gradient(90deg, var(--blue), transparent); }

.dash-quick-title { font-size: 13px; font-weight: 700; margin-bottom: 14px; }
.dash-quick-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 0; border-bottom: 1px solid var(--border);
  font-size: 12px;
}
.dash-quick-row:last-child { border-bottom: none; }
.dash-quick-label { color: var(--text-dim); font-family: 'Space Mono', monospace; font-size: 10px; }
.dash-quick-val   { font-weight: 700; font-family: 'Space Mono', monospace; font-size: 11px; }
.dash-quick-val.up   { color: var(--green); }
.dash-quick-val.flat { color: var(--text-dim); }
.dash-quick-val.gold { color: var(--gold); }

/* ── Skeleton ──────────────────────────────────────────────────────────────── */
.dash-skeleton {
  background: linear-gradient(90deg, var(--surface2) 25%, var(--border) 50%, var(--surface2) 75%);
  background-size: 200% 100%; border-radius: 4px;
  animation: dash-shimmer 1.4s infinite;
}
@keyframes dash-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ── Responsive ────────────────────────────────────────────────────────────── */
@media (max-width: 1100px) { .dash-platforms { grid-template-columns: 1fr 1fr; } }
@media (max-width: 900px)  {
  .dash-kpis { grid-template-columns: 1fr 1fr; }
  .dash-bottom { grid-template-columns: 1fr; }
}
@media (max-width: 640px)  {
  .dash-root { padding: 14px 14px 80px; }
  .dash-kpis { grid-template-columns: 1fr 1fr; gap: 8px; }
  .dash-kpi-value { font-size: 26px; }
  .dash-platforms { grid-template-columns: 1fr; }
  .dash-ai-actions { display: none; }
  .dash-header { flex-direction: column; gap: 8px; }
}
`;

function fmtRevenue(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}
function deltaClass(n: number) { return n > 0 ? "up" : n < 0 ? "down" : "flat"; }
function deltaLabel(n: number) {
  if (n === 0) return "— No change vs last period";
  return `${n > 0 ? "▲" : "▼"} ${Math.abs(n).toFixed(1)}% vs last 30 days`;
}

const PLATFORMS = [
  { icon: "⬡",   name: "Core Engine",          desc: "Auth · Billing · Analytics",      status: "live",    path: "/dashboard" },
  { icon: "🧑‍🤝‍🧑", name: "Winners Community",    desc: "Social feed · Posts · Profiles",   status: "live",    path: "/community" },
  { icon: "🎓",  name: "Winners Academy",       desc: "Courses · Certificates · AI Tutor", status: "soon",  path: null },
  { icon: "🛒",  name: "Winners Market",        desc: "Products · Vendors · Commerce",   status: "soon",    path: null },
  { icon: "🤖",  name: "Winners Intelligence",  desc: "Agentic AI · Automation",         status: "planned", path: null },
  { icon: "💼",  name: "Winners Work",          desc: "Freelance · Jobs · Escrow",       status: "planned", path: null },
];

const PHASES = [
  { label: "Core Engine",  state: "done"    },
  { label: "Community",    state: "active"  },
  { label: "Academy",      state: "pending" },
  { label: "Market",       state: "pending" },
  { label: "AI Agents",    state: "pending" },
  { label: "Work",         state: "pending" },
  { label: "Mobile",       state: "pending" },
  { label: "Cloud API",    state: "pending" },
];

export default function DashboardPage() {
  const { stats, isLoading, error, fetchStats, invalidate } = useDashboardStore();
  const user     = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Inject styles
    const id = "dash-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id; tag.textContent = css;
      document.head.appendChild(tag);
    }

    // Fetch dashboard data
    fetchStats();

    // Clock tick every minute
    const tick = setInterval(() => setTime(new Date()), 60_000);

    return () => {
      clearInterval(tick);
      document.getElementById("dash-styles")?.remove();
    };
  }, []);

  const greeting = () => {
    const h = time.getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  const firstName = user?.name?.split(" ")[0] ?? "Winner";

  // Show skeleton only on first load (no data yet)
  const showSkeleton = isLoading && !stats;

  return (
    <div className="dash-root">
      {/* ── Context Bar ── */}
      <div className="dash-context-bar">
        <span className="dash-ctx live">⬡ Core Engine</span>
        <span className="dash-ctx-sep">›</span>
        <span className="dash-ctx active">🧑‍🤝‍🧑 Community</span>
        <span className="dash-ctx-sep">›</span>
        <span className="dash-ctx planned">🎓 Academy</span>
        <span className="dash-ctx-sep">›</span>
        <span className="dash-ctx planned">🛒 Market</span>
        <span className="dash-ctx-sep">›</span>
        <span className="dash-ctx planned">🤖 Intelligence</span>
      </div>

      {/* ── Header ── */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">
            {greeting()}, <em>{firstName}</em>
          </h1>
          <div className="dash-date">
            Winners Ecosystem · Control Center · {time.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </div>
        </div>
        <div className="dash-live-pill">
          <div className="dash-live-dot" />
          All Systems Live
        </div>
      </div>

      {/* ── Error Banner (non-destructive — shows alongside stale data) ── */}
      {error && stats && (
        <div className="dash-error-banner">
          ⚠ {error} — showing last cached data
          <button onClick={() => { invalidate(); fetchStats(); }}>Retry</button>
        </div>
      )}

      {/* ── Error State (no data at all) ── */}
      {error && !stats && !showSkeleton && (
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 6, padding: 40, textAlign: "center", marginBottom: 20,
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "var(--red)" }} />
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠</div>
          <div style={{ fontFamily: "Space Mono, monospace", fontSize: 11, color: "var(--red)", marginBottom: 8 }}>
            Could not load dashboard data
          </div>
          <div style={{ fontFamily: "Space Mono, monospace", fontSize: 10, color: "var(--text-dim)", marginBottom: 20, lineHeight: 1.7 }}>
            {error}<br />
            Check that your backend is running and VITE_API_URL is correct.
          </div>
          <button
            onClick={() => { invalidate(); fetchStats(); }}
            style={{
              background: "var(--gold)", color: "#080B10", border: "none",
              borderRadius: 4, padding: "9px 22px",
              fontFamily: "Syne, sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >
            Retry →
          </button>
        </div>
      )}

      {/* ── AI Command Bar ── */}
      <div className="dash-ai-bar">
        <div className="dash-ai-icon">🤖</div>
        <div className="dash-ai-content">
          <div className="dash-ai-label">Winners Intelligence · Ecosystem AI</div>
          <div className="dash-ai-text">
            <strong>Phase 2 active.</strong>{" "}
            {stats?.topInsight
              ? stats.topInsight
              : "Community Layer is live. Building social engagement engine. Next target: Winners Academy."
            }
          </div>
        </div>
        <div className="dash-ai-actions">
          <button className="dash-ai-btn" onClick={() => navigate("/community")}>Open Community</button>
          <button className="dash-ai-btn primary" onClick={() => navigate("/analytics")}>View Analytics</button>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="dash-kpis">
        {/* Revenue */}
        <div className="dash-kpi gold">
          <div className="dash-kpi-label">Total Revenue</div>
          {showSkeleton ? (
            <>
              <div className="dash-skeleton" style={{ height: 36, width: "70%", marginBottom: 8 }} />
              <div className="dash-skeleton" style={{ height: 12, width: "50%" }} />
            </>
          ) : (
            <>
              <div className="dash-kpi-value">{fmtRevenue(stats?.totalRevenue ?? 0)}</div>
              <div className={`dash-kpi-delta ${deltaClass(stats?.revenueGrowth ?? 0)}`}>
                {deltaLabel(stats?.revenueGrowth ?? 0)}
              </div>
            </>
          )}
        </div>

        {/* Activity */}
        <div className="dash-kpi green">
          <div className="dash-kpi-label">Total Activity</div>
          {showSkeleton ? (
            <>
              <div className="dash-skeleton" style={{ height: 36, width: "60%", marginBottom: 8 }} />
              <div className="dash-skeleton" style={{ height: 12, width: "55%" }} />
            </>
          ) : (
            <>
              <div className="dash-kpi-value">{(stats?.totalActivity ?? 0).toLocaleString()}</div>
              <div className={`dash-kpi-delta ${deltaClass(stats?.activityGrowth ?? 0)}`}>
                {deltaLabel(stats?.activityGrowth ?? 0)}
              </div>
            </>
          )}
        </div>

        {/* Team */}
        <div className="dash-kpi blue">
          <div className="dash-kpi-label">Team Members</div>
          {showSkeleton ? (
            <>
              <div className="dash-skeleton" style={{ height: 36, width: "40%", marginBottom: 8 }} />
              <div className="dash-skeleton" style={{ height: 12, width: "65%" }} />
            </>
          ) : (
            <>
              <div className="dash-kpi-value">{stats?.teamMembers ?? 1}</div>
              <div className="dash-kpi-delta flat">Active workspace members</div>
            </>
          )}
        </div>

        {/* Trend */}
        <div className="dash-kpi purple">
          <div className="dash-kpi-label">Revenue Trend</div>
          {showSkeleton ? (
            <>
              <div className="dash-skeleton" style={{ height: 36, width: "55%", marginBottom: 8 }} />
              <div className="dash-skeleton" style={{ height: 12, width: "70%" }} />
            </>
          ) : (
            <>
              <div className="dash-kpi-value" style={{
                color: stats?.trend === "up" ? "var(--green)" : stats?.trend === "down" ? "var(--red)" : "var(--text)",
                fontSize: 26,
              }}>
                {stats?.trend === "up" ? "↑ Rising" : stats?.trend === "down" ? "↓ Falling" : "→ Stable"}
              </div>
              <div className="dash-kpi-delta flat">vs previous 30 days</div>
            </>
          )}
        </div>
      </div>

      {/* ── AI Insight ── */}
      {stats?.topInsight && (
        <div className="dash-insight">
          <div className="dash-insight-icon">💡</div>
          <div><strong>AI Insight:</strong> {stats.topInsight}</div>
        </div>
      )}

      {/* ── Roadmap Progress ── */}
      <div className="dash-roadmap">
        <div className="dash-roadmap-title">Ecosystem Build Progress · Phase 2 of 8 Active</div>
        <div className="dash-roadmap-phases">
          {PHASES.map((p) => (
            <div key={p.label} className={`dash-phase${p.state === "done" ? " done-phase" : p.state === "active" ? " active-phase" : ""}`}>
              <div className={`dash-phase-dot ${p.state}`}>
                {p.state === "done" ? "✓" : p.state === "active" ? "2" : "○"}
              </div>
              <div className="dash-phase-label">{p.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Ecosystem Platforms ── */}
      <div className="dash-section-title">Ecosystem Platforms</div>
      <div className="dash-platforms">
        {PLATFORMS.map((p) => (
          <div
            key={p.name}
            className={`dash-platform ${p.path ? "clickable" : "disabled"}`}
            onClick={() => p.path && navigate(p.path)}
          >
            <div className="dash-platform-icon">{p.icon}</div>
            <div className="dash-platform-info">
              <div className="dash-platform-name">{p.name}</div>
              <div className="dash-platform-desc">{p.desc}</div>
            </div>
            <div className="dash-platform-right">
              <span className={`dash-platform-status ${p.status}`}>
                {p.status === "live" ? "● Live" : p.status === "soon" ? "◎ Soon" : "○ Planned"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Quick Stats + Quick Links ── */}
      <div className="dash-bottom">
        {/* Quick Stats */}
        <div className="dash-quick-card gold-card">
          <div className="dash-quick-title">30-Day Snapshot</div>
          {showSkeleton ? (
            [1,2,3,4].map(i => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                <div className="dash-skeleton" style={{ height: 12, width: "40%" }} />
                <div className="dash-skeleton" style={{ height: 12, width: "25%" }} />
              </div>
            ))
          ) : (
            <>
              <div className="dash-quick-row">
                <span className="dash-quick-label">Total Revenue</span>
                <span className={`dash-quick-val ${(stats?.totalRevenue ?? 0) > 0 ? "gold" : "flat"}`}>{fmtRevenue(stats?.totalRevenue ?? 0)}</span>
              </div>
              <div className="dash-quick-row">
                <span className="dash-quick-label">Revenue Growth</span>
                <span className={`dash-quick-val ${deltaClass(stats?.revenueGrowth ?? 0)}`}>{(stats?.revenueGrowth ?? 0) > 0 ? "+" : ""}{(stats?.revenueGrowth ?? 0).toFixed(1)}%</span>
              </div>
              <div className="dash-quick-row">
                <span className="dash-quick-label">Activity Events</span>
                <span className={`dash-quick-val ${(stats?.totalActivity ?? 0) > 0 ? "up" : "flat"}`}>{(stats?.totalActivity ?? 0).toLocaleString()}</span>
              </div>
              <div className="dash-quick-row">
                <span className="dash-quick-label">Team Size</span>
                <span className="dash-quick-val gold">{stats?.teamMembers ?? 1} member{(stats?.teamMembers ?? 1) !== 1 ? "s" : ""}</span>
              </div>
              <div className="dash-quick-row">
                <span className="dash-quick-label">Trend</span>
                <span className={`dash-quick-val ${stats?.trend === "up" ? "up" : stats?.trend === "down" ? "down" : "flat"}`}>
                  {stats?.trend === "up" ? "↑ Rising" : stats?.trend === "down" ? "↓ Falling" : "→ Stable"}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Quick Navigation */}
        <div className="dash-quick-card blue-card">
          <div className="dash-quick-title">Quick Navigation</div>
          {[
            { icon: "📊", label: "Analytics",   path: "/analytics",    sub: "Revenue charts · Forecasts" },
            { icon: "🧑‍🤝‍🧑", label: "Community",  path: "/community",    sub: "Feed · Posts · Members" },
            { icon: "👥", label: "Team",         path: "/team",         sub: "Members · Roles · Invites" },
            { icon: "💳", label: "Billing",      path: "/billing",      sub: "Plans · Invoices · Usage" },
            { icon: "⚙️", label: "Settings",     path: "/settings",     sub: "Workspace · Integrations" },
          ].map((item) => (
            <div
              key={item.label}
              className="dash-quick-row"
              onClick={() => navigate(item.path)}
              style={{ cursor: "pointer" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 15 }}>{item.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700 }}>{item.label}</div>
                  <div style={{ fontFamily: "Space Mono, monospace", fontSize: 9, color: "var(--text-dim)", marginTop: 1 }}>{item.sub}</div>
                </div>
              </div>
              <span style={{ fontFamily: "Space Mono, monospace", fontSize: 10, color: "var(--text-dim)" }}>→</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}