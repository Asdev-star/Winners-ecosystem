// src/features/dashboard/DashboardPage.tsx

import { useEffect, useState } from "react";
import { useDashboardStore } from "./dashboardStore";
import AIRecommendationCard from "../ai/AIRecommendationCard";
import ActivityWidget from "../activity/ActivityWidget";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .dash-root { padding: 28px 24px 80px; font-family: 'Syne', sans-serif; color: #E8EEF5; max-width: 1400px; }

  /* ── Header ── */
  .dash-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; }
  .dash-title { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; color: #E8EEF5; }
  .dash-title span { color: #C9A84C; }
  .dash-subtitle { font-family: 'Space Mono', monospace; font-size: 10px; color: #5A7A96; margin-top: 4px; }
  .dash-header-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

  .dash-live-pill {
    display: flex; align-items: center; gap: 6px;
    background: rgba(74,222,128,0.08); border: 1px solid rgba(74,222,128,0.2);
    border-radius: 20px; padding: 5px 12px;
    font-family: 'Space Mono', monospace; font-size: 9px; color: #4ade80;
  }
  .dash-live-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: #4ade80; box-shadow: 0 0 6px rgba(74,222,128,0.6);
    animation: dash-pulse 2s ease infinite;
  }

  /* ── Error banner ── */
  .dash-error {
    background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2);
    border-radius: 12px; padding: 12px 16px; margin-bottom: 16px;
    font-family: 'Space Mono', monospace; font-size: 10px; color: #f87171;
    display: flex; align-items: center; gap: 8px;
  }

  /* ── AI Bar ── */
  .dash-ai-bar {
    background: linear-gradient(135deg, rgba(43,95,142,0.14), rgba(201,168,76,0.06));
    border: 1px solid rgba(43,95,142,0.3); border-radius: 16px;
    padding: 16px 20px; margin-bottom: 22px;
    display: flex; align-items: center; gap: 14px;
    position: relative; overflow: hidden;
  }
  .dash-ai-bar::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, #89C4E1, #C9A84C, transparent);
  }
  .dash-ai-icon { font-size: 22px; flex-shrink: 0; }
  .dash-ai-content { flex: 1; min-width: 0; }
  .dash-ai-label { font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: #89C4E1; margin-bottom: 4px; }
  .dash-ai-text { font-size: 13px; color: #E8EEF5; line-height: 1.5; }
  .dash-ai-text strong { color: #C9A84C; }
  .dash-ai-actions { display: flex; gap: 8px; flex-shrink: 0; }
  .dash-ai-btn {
    background: transparent; border: 1px solid #1E3248; border-radius: 8px;
    padding: 7px 14px; font-family: 'Space Mono', monospace; font-size: 9px;
    color: #5A7A96; cursor: pointer; transition: all 0.15s; white-space: nowrap;
  }
  .dash-ai-btn:hover { border-color: #C9A84C; color: #C9A84C; }
  .dash-ai-btn.primary { background: #C9A84C; color: #0D1520; border-color: #C9A84C; font-weight: 700; }
  .dash-ai-btn.primary:hover { background: #E8C97A; }

  /* ── KPIs ── */
  .dash-kpis { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 22px; }
  .dash-kpi {
    background: linear-gradient(135deg, #0f1923 0%, #0D1520 100%);
    border: 1px solid rgba(137,196,225,0.1); border-radius: 16px;
    padding: 18px 20px; position: relative; overflow: hidden;
    transition: border-color 0.2s, transform 0.2s;
  }
  .dash-kpi:hover { border-color: rgba(201,168,76,0.2); transform: translateY(-1px); }
  .dash-kpi::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
  .dash-kpi.gold::before   { background: linear-gradient(90deg, transparent, #C9A84C, transparent); }
  .dash-kpi.green::before  { background: linear-gradient(90deg, transparent, #4ade80, transparent); }
  .dash-kpi.blue::before   { background: linear-gradient(90deg, transparent, #89C4E1, transparent); }
  .dash-kpi.purple::before { background: linear-gradient(90deg, transparent, #a78bfa, transparent); }
  .dash-kpi-label { font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: #5A7A96; margin-bottom: 10px; }
  .dash-kpi-value { font-size: 26px; font-weight: 800; letter-spacing: -1px; margin-bottom: 6px; color: #E8EEF5; }
  .dash-kpi-delta { font-family: 'Space Mono', monospace; font-size: 9px; }
  .dash-kpi-delta.up   { color: #4ade80; }
  .dash-kpi-delta.down { color: #f87171; }
  .dash-kpi-delta.flat { color: #5A7A96; }

  /* ── Section title ── */
  .dash-section-title {
    font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 2px;
    text-transform: uppercase; color: #C9A84C; margin-bottom: 14px;
    display: flex; align-items: center; gap: 8px;
  }
  .dash-section-title::after { content: ''; flex: 1; height: 1px; background: #1E3248; }

  /* ── Platforms ── */
  .dash-platforms { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 22px; }
  .dash-platform {
    background: linear-gradient(135deg, #0f1923 0%, #0D1520 100%);
    border: 1px solid rgba(137,196,225,0.1); border-radius: 14px;
    padding: 14px 16px; display: flex; align-items: center; gap: 12px;
    transition: all 0.2s; color: #E8EEF5; position: relative; overflow: hidden;
  }
  .dash-platform.clickable { cursor: pointer; }
  .dash-platform.clickable:hover { border-color: rgba(201,168,76,0.3); background: linear-gradient(135deg, #111a26, #0e1c2a); transform: translateY(-1px); }
  .dash-platform.disabled { opacity: 0.45; cursor: not-allowed; }
  .dash-platform-icon { font-size: 22px; flex-shrink: 0; }
  .dash-platform-info { flex: 1; min-width: 0; }
  .dash-platform-name { font-size: 12px; font-weight: 700; margin-bottom: 2px; color: #E8EEF5; }
  .dash-platform-desc { font-family: 'Space Mono', monospace; font-size: 8px; color: #5A7A96; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .dash-platform-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
  .dash-platform-status { font-family: 'Space Mono', monospace; font-size: 7px; padding: 2px 7px; border-radius: 6px; }
  .dash-platform-status.live    { background: rgba(74,222,128,0.1);  color: #4ade80; border: 1px solid rgba(74,222,128,0.2); }
  .dash-platform-status.soon    { background: rgba(137,196,225,0.08); color: #89C4E1; border: 1px solid rgba(137,196,225,0.15); }
  .dash-platform-status.planned { background: rgba(167,139,250,0.08); color: #a78bfa; border: 1px solid rgba(167,139,250,0.15); }
  .dash-platform-phase { font-family: 'Space Mono', monospace; font-size: 7px; color: #3A5470; }

  /* ── Bottom grid ── */
  .dash-bottom { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 22px; }

  /* ── Quick access ── */
  .dash-quick-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 22px; }
  .dash-quick-stat {
    background: linear-gradient(135deg, #0f1923 0%, #0D1520 100%);
    border: 1px solid rgba(137,196,225,0.1); border-radius: 14px;
    padding: 14px 16px; display: flex; align-items: center; gap: 12px;
    transition: border-color 0.15s;
  }
  .dash-quick-stat:hover { border-color: rgba(137,196,225,0.2); }
  .dash-quick-stat-icon { font-size: 18px; flex-shrink: 0; }
  .dash-quick-stat-label { font-family: 'Space Mono', monospace; font-size: 8px; color: #5A7A96; text-transform: uppercase; letter-spacing: 1px; }
  .dash-quick-stat-link { font-size: 13px; font-weight: 700; margin-top: 3px; cursor: pointer; transition: opacity 0.15s; }
  .dash-quick-stat-link:hover { opacity: 0.8; }
  .dash-quick-stat-link.gold   { color: #C9A84C; }
  .dash-quick-stat-link.ice    { color: #89C4E1; }
  .dash-quick-stat-link.purple { color: #a78bfa; }

  /* ── Insight ── */
  .dash-insight {
    background: linear-gradient(135deg, rgba(43,95,142,0.1), rgba(201,168,76,0.05));
    border: 1px solid rgba(201,168,76,0.15); border-radius: 14px;
    padding: 14px 18px; margin-bottom: 22px;
    display: flex; align-items: flex-start; gap: 10px;
  }
  .dash-insight-icon { font-size: 16px; flex-shrink: 0; margin-top: 1px; }
  .dash-insight-text { font-size: 12px; line-height: 1.6; color: #5A7A96; }
  .dash-insight-text strong { color: #E8EEF5; }

  /* ── Roadmap ── */
  .dash-roadmap {
    background: linear-gradient(135deg, #0f1923 0%, #0D1520 100%);
    border: 1px solid rgba(137,196,225,0.1); border-radius: 16px;
    padding: 18px 20px; margin-bottom: 22px;
  }
  .dash-roadmap-title { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: #5A7A96; margin-bottom: 16px; }
  .dash-roadmap-phases { display: flex; align-items: center; }
  .dash-phase { flex: 1; text-align: center; position: relative; }
  .dash-phase::after { content: ''; position: absolute; top: 10px; left: 50%; right: -50%; height: 2px; background: #1E3248; z-index: 0; }
  .dash-phase:last-child::after { display: none; }
  .dash-phase-dot {
    width: 20px; height: 20px; border-radius: 50%; margin: 0 auto 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 8px; position: relative; z-index: 1;
  }
  .dash-phase-dot.done    { background: #C9A84C; color: #0D1520; box-shadow: 0 0 8px rgba(201,168,76,0.4); }
  .dash-phase-dot.active  { background: #2B5F8E; color: white;   box-shadow: 0 0 10px rgba(43,95,142,0.6); }
  .dash-phase-dot.pending { background: #172335; border: 1px solid #1E3248; color: #3A5470; }
  .dash-phase-label { font-family: 'Space Mono', monospace; font-size: 7px; color: #3A5470; line-height: 1.3; }
  .dash-phase.done-phase   .dash-phase-label { color: #C9A84C; }
  .dash-phase.active-phase .dash-phase-label { color: #89C4E1; }

  /* ── Skeleton ── */
  .dash-skeleton {
    background: linear-gradient(90deg, #172335 25%, rgba(137,196,225,0.06) 50%, #172335 75%);
    background-size: 200% 100%; border-radius: 6px;
    animation: dash-shimmer 1.4s infinite;
  }

  @keyframes dash-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @keyframes dash-pulse   { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

  @media (max-width: 1100px) { .dash-platforms { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 900px)  {
    .dash-kpis { grid-template-columns: 1fr 1fr; }
    .dash-bottom { grid-template-columns: 1fr; }
    .dash-quick-stats { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 600px) {
    .dash-root { padding: 14px 12px 80px; }
    .dash-kpis { grid-template-columns: 1fr 1fr; gap: 8px; }
    .dash-kpi { padding: 14px; } .dash-kpi-value { font-size: 22px; }
    .dash-platforms { grid-template-columns: 1fr; }
    .dash-quick-stats { grid-template-columns: 1fr; }
    .dash-ai-actions { display: none; }
    .dash-header { flex-direction: column; gap: 8px; }
    .dash-title { font-size: 18px; }
    .dash-kpi:hover { transform: none; }
  }
`;

function fmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toLocaleString()}`;
}
function deltaClass(n: number) { return n > 0 ? "up" : n < 0 ? "down" : "flat"; }
function deltaLabel(n: number) {
  return `${n > 0 ? "▲" : n < 0 ? "▼" : "–"} ${Math.abs(n).toFixed(1)}% vs last period`;
}

const PLATFORMS = [
  { icon: "⬡",  name: "Core Engine",         desc: "Auth · Billing · Analytics · API",  status: "live",    phase: "Phase 1", path: "/dashboard" },
  { icon: "🧑‍🤝‍🧑", name: "Winners Community",   desc: "Social feed · Chat · Profiles",      status: "live",    phase: "Phase 2", path: "/community" },
  { icon: "🎓", name: "Winners Academy",      desc: "Courses · Certificates · AI Tutor", status: "soon",    phase: "Phase 3", path: null },
  { icon: "🛒", name: "Winners Market",       desc: "Products · Dropshipping · Vendors", status: "soon",    phase: "Phase 4", path: null },
  { icon: "🤖", name: "Winners Intelligence", desc: "Agentic AI · Smart Automation",     status: "planned", phase: "Phase 5", path: null },
  { icon: "💼", name: "Winners Work",         desc: "Freelance · Jobs · Escrow",         status: "planned", phase: "Phase 6", path: null },
];

const PHASES = [
  { label: "Core",      state: "done"    },
  { label: "Community", state: "active"  },
  { label: "Academy",   state: "pending" },
  { label: "Market",    state: "pending" },
  { label: "AI Core",   state: "pending" },
  { label: "Work",      state: "pending" },
  { label: "Mobile",    state: "pending" },
  { label: "Cloud",     state: "pending" },
];

export default function DashboardPage() {
  const { stats, isLoading, error, fetchStats } = useDashboardStore();
  const user     = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = "dash-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id; tag.textContent = css;
      document.head.appendChild(tag);
    }
    fetchStats();
    const interval = setInterval(() => setTime(new Date()), 60_000);
    return () => { clearInterval(interval); document.getElementById(id)?.remove(); };
  }, []);

  const loading = isLoading && !stats; // show skeleton only on first load; keep stale data visible on refresh

  const greeting = () => {
    const h = time.getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="dash-root">

      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">
            {greeting()}, <span>{user?.name?.split(" ")[0] ?? "Winner"}</span> 👋
          </h1>
          <p className="dash-subtitle">
            Winners Ecosystem · Control Center ·{" "}
            {time.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
          </p>
        </div>
        <div className="dash-header-right">
          <div className="dash-live-pill">
            <div className="dash-live-dot" />
            All Systems Live
          </div>
        </div>
      </div>

      {/* Error */}
      {error && !loading && (
        <div className="dash-error">⚠ {error} — showing last known data</div>
      )}

      {/* AI Command Bar */}
      <div className="dash-ai-bar">
        <div className="dash-ai-icon">🤖</div>
        <div className="dash-ai-content">
          <div className="dash-ai-label">Winners AI · Ecosystem Intelligence</div>
          <div className="dash-ai-text">
            <strong>Phase 2 active.</strong> Community Layer is live. Building social engagement engine.
            Next target: Winners Academy (Learning Platform).
          </div>
        </div>
        <div className="dash-ai-actions">
          <button className="dash-ai-btn" onClick={() => navigate("/community")}>Open Community</button>
          <button className="dash-ai-btn primary" onClick={() => navigate("/analytics")}>View Analytics</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="dash-kpis">
        <div className="dash-kpi gold">
          <div className="dash-kpi-label">Total Revenue</div>
          {loading
            ? <><div className="dash-skeleton" style={{ height: 28, width: "70%", marginBottom: 8 }} /><div className="dash-skeleton" style={{ height: 11, width: "50%" }} /></>
            : <><div className="dash-kpi-value">{fmt(stats!.totalRevenue)}</div><div className={`dash-kpi-delta ${deltaClass(stats!.revenueGrowth)}`}>{deltaLabel(stats!.revenueGrowth)}</div></>
          }
        </div>
        <div className="dash-kpi green">
          <div className="dash-kpi-label">Total Activity</div>
          {loading
            ? <><div className="dash-skeleton" style={{ height: 28, width: "70%", marginBottom: 8 }} /><div className="dash-skeleton" style={{ height: 11, width: "50%" }} /></>
            : <><div className="dash-kpi-value">{stats!.totalActivity.toLocaleString()}</div><div className={`dash-kpi-delta ${deltaClass(stats!.activityGrowth)}`}>{deltaLabel(stats!.activityGrowth)}</div></>
          }
        </div>
        <div className="dash-kpi blue">
          <div className="dash-kpi-label">Team Members</div>
          {loading
            ? <><div className="dash-skeleton" style={{ height: 28, width: "40%", marginBottom: 8 }} /><div className="dash-skeleton" style={{ height: 11, width: "60%" }} /></>
            : <><div className="dash-kpi-value">{stats!.teamMembers}</div><div className="dash-kpi-delta flat">Active workspace members</div></>
          }
        </div>
        <div className="dash-kpi purple">
          <div className="dash-kpi-label">Revenue Trend</div>
          {loading
            ? <><div className="dash-skeleton" style={{ height: 28, width: "50%", marginBottom: 8 }} /><div className="dash-skeleton" style={{ height: 11, width: "70%" }} /></>
            : <>
                <div className="dash-kpi-value" style={{ color: stats!.trend === "up" ? "#4ade80" : stats!.trend === "down" ? "#f87171" : "#E8EEF5" }}>
                  {stats!.trend === "up" ? "↑ Rising" : stats!.trend === "down" ? "↓ Falling" : "→ Stable"}
                </div>
                <div className="dash-kpi-delta flat">vs previous 30 days</div>
              </>
          }
        </div>
      </div>

      {/* Insight */}
      {stats?.topInsight && (
        <div className="dash-insight">
          <div className="dash-insight-icon">💡</div>
          <div className="dash-insight-text"><strong>AI Insight: </strong>{stats.topInsight}</div>
        </div>
      )}

      {/* Roadmap */}
      <div className="dash-roadmap">
        <div className="dash-roadmap-title">Ecosystem Build Progress · Phase 2 of 8</div>
        <div className="dash-roadmap-phases">
          {PHASES.map((p) => (
            <div key={p.label} className={`dash-phase ${p.state === "done" ? "done-phase" : p.state === "active" ? "active-phase" : ""}`}>
              <div className={`dash-phase-dot ${p.state}`}>
                {p.state === "done" ? "✓" : p.state === "active" ? "●" : "○"}
              </div>
              <div className="dash-phase-label">{p.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Platforms */}
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
                {p.status === "live" ? "● Live" : p.status === "soon" ? "Soon" : "Planned"}
              </span>
              <span className="dash-platform-phase">{p.phase}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Access */}
      <div className="dash-section-title">Quick Access</div>
      <div className="dash-quick-stats">
        <div className="dash-quick-stat">
          <div className="dash-quick-stat-icon">🎁</div>
          <div>
            <div className="dash-quick-stat-label">Referral Program</div>
            <div className="dash-quick-stat-link gold" onClick={() => navigate("/referral")}>View Program →</div>
          </div>
        </div>
        <div className="dash-quick-stat">
          <div className="dash-quick-stat-icon">🔐</div>
          <div>
            <div className="dash-quick-stat-label">Security</div>
            <div className="dash-quick-stat-link ice" onClick={() => navigate("/2fa")}>Manage 2FA →</div>
          </div>
        </div>
        <div className="dash-quick-stat">
          <div className="dash-quick-stat-icon">📋</div>
          <div>
            <div className="dash-quick-stat-label">What's New</div>
            <div className="dash-quick-stat-link purple" onClick={() => navigate("/changelog")}>See Updates →</div>
          </div>
        </div>
      </div>

      {/* AI + Activity */}
      <div className="dash-section-title">Intelligence & Activity</div>
      <div className="dash-bottom">
        <AIRecommendationCard />
        <ActivityWidget />
      </div>

    </div>
  );
}