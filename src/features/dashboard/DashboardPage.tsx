// src/features/dashboard/DashboardPage.tsx
// Phase 1 — Core Engine | Control Center
// Self-contained: fetches its own data, no store dependency crash risk
// CSS injected via <style> tag in JSX — guaranteed to render

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, getAuthHeaders } from "../auth/authStore";
import { API_BASE } from "../../lib/api";
import AIInsightBanner from "../../components/ui/AIInsightBanner";
import TrustScoreBadge from "../../components/ui/TrustScoreBadge";
import AgenticLoopWidget from "../../components/ui/AgenticLoopWidget";
import AssistantPanel from "../../components/ui/AssistantPanel";
import ProgressRing from "../../components/ui/ProgressRing";
import CrossLayerHandoff from "../../components/ui/CrossLayerHandoff";
import { useAssistant } from "../../hooks/useAssistant";

// AI Components - Level II & III imports
// (Available for future use: AIInsightBanner, AssistantPanel, AgenticLoopWidget, TrustScoreBadge)

const API = API_BASE;
// ─── Types ────────────────────────────────────────────────────────────────────
interface Stats {
  totalRevenue: number;
  revenueGrowth: number;
  totalActivity: number;
  activityGrowth: number;
  teamMembers: number;
  topInsight: string;
  trend: "up" | "down" | "flat";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtMoney(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}
function deltaSign(n: number) {
  return n > 0 ? "▲" : n < 0 ? "▼" : "–";
}
function deltaColor(n: number) {
  return n > 0 ? "var(--green)" : n < 0 ? "var(--red)" : "var(--text-dim)";
}

// ─── Static data ──────────────────────────────────────────────────────────────
const PLATFORMS = [
  {
    icon: "⬡",
    name: "Core Engine",
    desc: "Auth · Billing · Analytics",
    status: "live",
    path: "/dashboard",
  },
  {
    icon: "🧑‍🤝‍🧑",
    name: "Winners Community",
    desc: "Feed · Posts · Groups",
    status: "live",
    path: "/community",
  },
  {
    icon: "🎓",
    name: "Winners Academy",
    desc: "Courses · Certificates · AI",
    status: "live",
    path: "/academy",
  },
  {
    icon: "🛒",
    name: "Winners Market",
    desc: "Products · Vendors",
    status: "soon",
    path: null,
  },
  {
    icon: "🤖",
    name: "Winners Intelligence",
    desc: "AI Agents · ARIA · Multimodal",
    status: "live",
    path: "/intelligence",
  },
  {
    icon: "💼",
    name: "Winners Work",
    desc: "Freelance · Jobs · Escrow",
    status: "planned",
    path: null,
  },
];

const PHASES = [
  { n: 1, label: "Core", state: "done" },
  { n: 2, label: "Community", state: "done" },
  { n: 3, label: "Academy", state: "active" },
  { n: 4, label: "Market", state: "pending" },
  { n: 5, label: "AI", state: "active" },
  { n: 6, label: "Work", state: "pending" },
  { n: 7, label: "Mobile", state: "pending" },
  { n: 8, label: "Cloud", state: "pending" },
];

const NAV_LINKS = [
  {
    icon: "📊",
    label: "Analytics",
    path: "/analytics",
    sub: "Charts · Forecasts",
  },
  { icon: "🧑‍🤝‍🧑", label: "Community", path: "/community", sub: "Feed · Posts" },
  { icon: "👥", label: "Team", path: "/team", sub: "Members · Roles" },
  { icon: "💳", label: "Billing", path: "/billing", sub: "Plans · Invoices" },
  { icon: "⚙️", label: "Settings", path: "/settings", sub: "Workspace config" },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());

  // Level 4 AI Assistant hook
  const { sendMessage, messages, isLoading } = useAssistant({
    supervisor: "ARIA",
    autoGreeting: true,
  });

  // Greeting
  const greeting = () => {
    const h = now.getHours();
    return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  };

  // Safe individual fetch — never throws
  async function safeFetch(url: string) {
    try {
      const r = await fetch(url, { headers: getAuthHeaders() });
      if (!r.ok) {
        console.warn(`[Dashboard] ${url} → ${r.status}`);
        return null;
      }
      return await r.json();
    } catch (e) {
      console.warn(`[Dashboard] ${url} failed:`, e);
      return null;
    }
  }

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch in parallel — each independent, one failure doesn't block others
      const [revenue, summary, members] = await Promise.all([
        safeFetch(`${API}/analytics/revenue?period=30d`),
        safeFetch(`${API}/analytics/summary`),
        safeFetch(`${API}/tenants/me/members`),
      ]);

      const totalRevenue = revenue?.summary?.totalRevenue ?? 0;
      const revenueGrowth = revenue?.summary?.revenueGrowth ?? 0;
      const totalActivity = revenue?.summary?.totalActivity ?? 0;
      const activityGrowth = revenue?.summary?.activityGrowth ?? 0;
      const teamMembers =
        members?.total ??
        (Array.isArray(members?.members) ? members.members.length : 1);
      const topInsight = summary?.topInsight ?? "";
      const trend: "up" | "down" | "flat" =
        summary?.trend ??
        (revenueGrowth > 2 ? "up" : revenueGrowth < -2 ? "down" : "flat");

      setStats({
        totalRevenue,
        revenueGrowth,
        totalActivity,
        activityGrowth,
        teamMembers,
        topInsight,
        trend,
      });
    } catch (e: any) {
      setError(e?.message ?? "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    const tick = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(tick);
  }, []);

  const firstName = user?.name?.split(" ")[0] ?? "Winner";

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Inline styles — guaranteed to mount before any component paint */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&display=swap');

        .db { min-height:100vh; background:var(--bg); color:var(--text); font-family:'Syne',sans-serif; padding:28px 28px 80px; }

        /* Context bar */
        .db-ctx-bar { display:flex; gap:8px; flex-wrap:wrap; margin-bottom:22px; align-items:center; }
        .db-ctx { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:.15em; text-transform:uppercase; padding:4px 10px; border-radius:2px; }
        .db-ctx.live { background:rgba(45,212,160,.1); color:var(--green); border:1px solid rgba(45,212,160,.2); }
        .db-ctx.active { background:rgba(43,95,142,.15); color:var(--ice); border:1px solid rgba(43,95,142,.3); }
        .db-ctx.planned { background:rgba(90,122,150,.08); color:var(--text-dim); border:1px solid var(--border); }
        .db-ctx-sep { color:var(--border); font-size:10px; }

        /* Header */
        .db-hdr { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:22px; gap:12px; flex-wrap:wrap; }
        .db-title { font-family:'Cormorant Garamond',serif; font-size:clamp(24px,4vw,38px); font-weight:300; margin:0 0 4px; line-height:1.1; }
        .db-title em { font-style:italic; color:var(--gold); }
        .db-date { font-family:'Space Mono',monospace; font-size:10px; color:var(--text-dim); }
        .db-pill { display:flex; align-items:center; gap:8px; background:rgba(45,212,160,.08); border:1px solid rgba(45,212,160,.2); border-radius:20px; padding:6px 14px; font-family:'Space Mono',monospace; font-size:9px; color:var(--green); letter-spacing:.1em; text-transform:uppercase; white-space:nowrap; }
        .db-dot { width:6px; height:6px; border-radius:50%; background:var(--green); box-shadow:0 0 8px var(--green); animation:db-pulse 2s infinite; }
        @keyframes db-pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

        /* Error */
        .db-err { background:rgba(224,90,78,.08); border:1px solid rgba(224,90,78,.25); border-radius:6px; padding:12px 18px; margin-bottom:18px; font-family:'Space Mono',monospace; font-size:11px; color:var(--red); display:flex; align-items:center; gap:12px; }
        .db-err-btn { margin-left:auto; background:none; border:1px solid rgba(224,90,78,.3); border-radius:3px; color:var(--red); font-family:'Space Mono',monospace; font-size:10px; padding:4px 10px; cursor:pointer; }

        /* AI bar */
        .db-ai { display:flex; align-items:flex-start; gap:14px; background:var(--surface); border:1px solid var(--border); border-radius:6px; padding:16px 20px; margin-bottom:18px; position:relative; overflow:hidden; }
        .db-ai::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,var(--purple),var(--ice)); }
        .db-ai-icon { font-size:20px; flex-shrink:0; margin-top:2px; }
        .db-ai-body { flex:1; min-width:0; }
        .db-ai-lbl { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:.15em; text-transform:uppercase; color:var(--purple); margin-bottom:4px; }
        .db-ai-txt { font-size:13px; line-height:1.6; }
        .db-ai-txt strong { color:var(--gold); }
        .db-ai-acts { display:flex; gap:8px; flex-shrink:0; flex-wrap:wrap; }
        .db-ai-btn { background:transparent; border:1px solid var(--border); border-radius:4px; padding:6px 13px; font-family:'Space Mono',monospace; font-size:9px; color:var(--text-dim); cursor:pointer; transition:all .15s; white-space:nowrap; }
        .db-ai-btn:hover { border-color:var(--gold); color:var(--gold); }
        .db-ai-btn.p { background:var(--gold); color:var(--bg); border-color:var(--gold); font-weight:700; }
        .db-ai-btn.p:hover { opacity:.88; }

        /* KPI grid */
        .db-kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:18px; }
        .db-kpi { background:var(--surface); border:1px solid var(--border); border-radius:6px; padding:18px 20px; position:relative; overflow:hidden; transition:border-color .2s; }
        .db-kpi:hover { border-color:rgba(201,168,76,.3); }
        .db-kpi::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
        .db-kpi.g::before  { background:linear-gradient(90deg,var(--gold),rgba(201,168,76,.2)); }
        .db-kpi.gr::before { background:linear-gradient(90deg,var(--green),rgba(45,212,160,.2)); }
        .db-kpi.b::before  { background:linear-gradient(90deg,var(--blue),var(--ice)); }
        .db-kpi.p::before  { background:linear-gradient(90deg,var(--purple),rgba(155,111,255,.2)); }
        .db-kpi-lbl { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:.15em; text-transform:uppercase; color:var(--text-dim); margin-bottom:10px; }
        .db-kpi-val { font-family:'Cormorant Garamond',serif; font-size:32px; font-weight:600; margin-bottom:4px; line-height:1; }
        .db-kpi-delta { font-family:'Space Mono',monospace; font-size:10px; color:var(--text-dim); }

        /* Insight */
        .db-insight { display:flex; align-items:flex-start; gap:10px; background:var(--surface); border:1px solid var(--border); border-left:3px solid var(--gold); border-radius:4px; padding:12px 16px; margin-bottom:18px; font-size:13px; line-height:1.6; }
        .db-insight strong { color:var(--gold); }

        /* Roadmap */
        .db-road { background:var(--surface); border:1px solid var(--border); border-radius:6px; padding:20px; margin-bottom:18px; position:relative; overflow:hidden; }
        .db-road::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,var(--gold),var(--ice),var(--purple)); }
        .db-road-ttl { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:.15em; text-transform:uppercase; color:var(--text-dim); margin-bottom:16px; }
        .db-phases { display:flex; gap:0; overflow-x:auto; padding-bottom:4px; }
        .db-phase { display:flex; flex-direction:column; align-items:center; gap:8px; flex:1; min-width:60px; position:relative; }
        .db-phase:not(:last-child)::after { content:''; position:absolute; top:14px; left:calc(50% + 15px); width:calc(100% - 30px); height:1px; background:var(--border); }
        .db-phase.done:not(:last-child)::after   { background:var(--gold); }
        .db-phase.active:not(:last-child)::after { background:linear-gradient(90deg,var(--blue),var(--border)); }
        .db-phase-dot { width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-family:'Space Mono',monospace; font-size:9px; font-weight:700; position:relative; z-index:1; flex-shrink:0; }
        .db-phase-dot.done   { background:var(--gold); color:var(--bg); }
        .db-phase-dot.active { background:var(--blue); color:white; box-shadow:var(--blue-glow); }
        .db-phase-dot.pending{ background:var(--surface2); border:1px solid var(--border); color:var(--text-dim); }
        .db-phase-lbl { font-family:'Space Mono',monospace; font-size:8px; color:var(--text-dim); text-align:center; }
        .db-phase.done .db-phase-lbl   { color:var(--gold); }
        .db-phase.active .db-phase-lbl { color:var(--ice); }

        /* Section label */
        .db-sec-lbl { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:.2em; text-transform:uppercase; color:var(--gold); margin-bottom:12px; margin-top:4px; }

        /* Platforms */
        .db-platforms { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:18px; }
        .db-plat { background:var(--surface); border:1px solid var(--border); border-radius:6px; padding:14px 16px; display:flex; align-items:center; gap:12px; transition:all .2s; }
        .db-plat.click { cursor:pointer; }
        .db-plat.click:hover { border-color:rgba(201,168,76,.3); transform:translateY(-1px); }
        .db-plat.dim { opacity:.5; }
        .db-plat-icon { font-size:20px; flex-shrink:0; }
        .db-plat-name { font-size:13px; font-weight:700; margin-bottom:2px; }
        .db-plat-desc { font-family:'Space Mono',monospace; font-size:9px; color:var(--text-dim); }
        .db-plat-right { margin-left:auto; flex-shrink:0; }
        .db-badge { font-family:'Space Mono',monospace; font-size:9px; padding:3px 8px; border-radius:2px; }
        .db-badge.live    { background:rgba(45,212,160,.1); color:var(--green); border:1px solid rgba(45,212,160,.2); }
        .db-badge.soon    { background:rgba(201,168,76,.08); color:var(--gold); border:1px solid rgba(201,168,76,.2); }
        .db-badge.planned { background:rgba(90,122,150,.08); color:var(--text-dim); border:1px solid var(--border); }

        /* Bottom grid */
        .db-bottom { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
        .db-card { background:var(--surface); border:1px solid var(--border); border-radius:6px; padding:20px; position:relative; overflow:hidden; }
        .db-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; }
        .db-card.gold-top::before { background:linear-gradient(90deg,var(--gold),transparent); }
        .db-card.blue-top::before { background:linear-gradient(90deg,var(--blue),transparent); }
        .db-card-ttl { font-size:13px; font-weight:700; margin-bottom:14px; }
        .db-row { display:flex; align-items:center; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border); }
        .db-row:last-child { border-bottom:none; }
        .db-row-lbl { font-family:'Space Mono',monospace; font-size:10px; color:var(--text-dim); }
        .db-row-val { font-family:'Space Mono',monospace; font-size:11px; font-weight:700; }
        .db-row-click { cursor:pointer; }
        .db-row-click:hover .db-row-lbl,
        .db-row-click:hover .db-row-val { color:var(--gold); }
        .db-row-ico { font-size:14px; margin-right:6px; }

        /* Skeleton */
        .db-skel { background:linear-gradient(90deg,var(--surface2) 25%,var(--border) 50%,var(--surface2) 75%); background-size:200% 100%; border-radius:4px; animation:db-shim 1.4s infinite; }
        @keyframes db-shim { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* Responsive */
        @media(max-width:1100px){ .db-platforms{grid-template-columns:1fr 1fr;} }
        @media(max-width:900px) { .db-kpis{grid-template-columns:1fr 1fr;} .db-bottom{grid-template-columns:1fr;} }
        @media(max-width:640px) {
          .db{padding:14px 14px 80px;}
          .db-kpis{gap:8px;}
          .db-kpi-val{font-size:24px;}
          .db-platforms{grid-template-columns:1fr;}
          .db-ai-acts{display:none;}
          .db-hdr{flex-direction:column;}
          .db-wealth-grid{grid-template-columns:1fr 1fr;}
        }

        /* Journey Map */
        .db-journey { background:var(--surface); border:1px solid var(--border); border-radius:6px; padding:20px; margin-bottom:18px; position:relative; overflow:hidden; }
        .db-journey::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,var(--gold),var(--green),var(--ice)); }
        .db-journey-ttl { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:.15em; text-transform:uppercase; color:var(--text-dim); margin-bottom:16px; display:flex; align-items:center; gap:8px; }
        .db-journey-ttl span { font-size:14px; }
        .db-journey-track { display:flex; align-items:center; gap:4px; overflow-x:auto; padding:8px 0; }
        .db-journey-step { display:flex; flex-direction:column; align-items:center; gap:6px; min-width:70px; position:relative; }
        .db-journey-step:not(:last-child)::after { content:''; position:absolute; top:16px; left:calc(50% + 18px); width:calc(100% - 36px); height:2px; background:var(--border); }
        .db-journey-step.done:not(:last-child)::after { background:var(--gold); }
        .db-journey-dot { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:14px; position:relative; z-index:1; flex-shrink:0; border:2px solid transparent; transition:all .2s; }
        .db-journey-dot.done { background:var(--gold); border-color:var(--gold); color:var(--bg); }
        .db-journey-dot.active { background:transparent; border-color:var(--green); color:var(--green); animation:db-pulse 2s infinite; }
        .db-journey-dot.pending { background:var(--surface2); border-color:var(--border); color:var(--text-dim); }
        .db-journey-lbl { font-family:'Space Mono',monospace; font-size:8px; color:var(--text-dim); text-align:center; white-space:nowrap; }
        .db-journey-step.done .db-journey-lbl { color:var(--gold); }
        .db-journey-step.active .db-journey-lbl { color:var(--green); }

        /* Achievements */
        .db-achievements { background:var(--surface); border:1px solid var(--border); border-radius:6px; padding:20px; margin-bottom:18px; position:relative; overflow:hidden; }
        .db-achievements::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,var(--purple),var(--gold)); }
        .db-achievements-ttl { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:.15em; text-transform:uppercase; color:var(--text-dim); margin-bottom:16px; display:flex; align-items:center; justify-content:space-between; }
        .db-achievements-ttl span { display:flex; align-items:center; gap:8px; }
        .db-achievements-ttl span:first-child { font-size:14px; }
        .db-achievements-all { font-size:10px; color:var(--gold); cursor:pointer; }
        .db-achievements-grid { display:flex; gap:12px; flex-wrap:wrap; }
        .db-achievement { display:flex; align-items:center; gap:10px; padding:10px 14px; background:var(--surface2); border-radius:6px; border:1px solid var(--border); flex:1; min-width:140px; max-width:200px; transition:all .2s; }
        .db-achievement:hover { border-color:var(--gold); transform:translateY(-1px); }
        .db-achievement.locked { opacity:.5; }
        .db-achievement-icon { font-size:24px; width:36px; height:36px; display:flex; align-items:center; justify-content:center; background:rgba(201,168,76,.1); border-radius:50%; flex-shrink:0; }
        .db-achievement.locked .db-achievement-icon { background:rgba(90,122,150,.1); }
        .db-achievement-info { flex:1; min-width:0; }
        .db-achievement-name { font-size:11px; font-weight:700; margin-bottom:2px; }
        .db-achievement-desc { font-family:'Space Mono',monospace; font-size:8px; color:var(--text-dim); }

        /* Wealth Dashboard */
        .db-wealth { background:var(--surface); border:1px solid var(--border); border-radius:6px; padding:20px; margin-bottom:18px; position:relative; overflow:hidden; }
        .db-wealth::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,var(--green),var(--gold)); }
        .db-wealth-ttl { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:.15em; text-transform:uppercase; color:var(--text-dim); margin-bottom:16px; display:flex; align-items:center; gap:8px; }
        .db-wealth-ttl span { font-size:14px; }
        .db-wealth-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; }
        .db-wealth-card { background:var(--surface2); border-radius:6px; padding:14px; text-align:center; border:1px solid var(--border); transition:all .2s; }
        .db-wealth-card:hover { border-color:var(--green); }
        .db-wealth-card-icon { font-size:20px; margin-bottom:8px; }
        .db-wealth-card-label { font-family:'Space Mono',monospace; font-size:8px; color:var(--text-dim); margin-bottom:6px; text-transform:uppercase; letter-spacing:.1em; }
        .db-wealth-card-value { font-family:'Cormorant Garamond',serif; font-size:22px; font-weight:600; }
        .db-wealth-card-value.gold { color:var(--gold); }
        .db-wealth-card-value.green { color:var(--green); }
        .db-wealth-card-value.ice { color:var(--ice); }
        .db-wealth-card-value.purple { color:var(--purple); }
        .db-wealth-card-sub { font-family:'Space Mono',monospace; font-size:8px; color:var(--text-dim); margin-top:4px; }
      `}</style>

      <div className="db">
        {/* ── Context Bar ── */}
        <div className="db-ctx-bar">
          <span className="db-ctx live">⬡ Core Engine</span>
          <span className="db-ctx-sep">›</span>
          <span className="db-ctx live">🧑‍🤝‍🧑 Community</span>
          <span className="db-ctx-sep">›</span>
          <span className="db-ctx active">🎓 Academy</span>
          <span className="db-ctx-sep">›</span>
          <span className="db-ctx planned">🛒 Market</span>
          <span className="db-ctx-sep">›</span>
          <span className="db-ctx active">🤖 Intelligence</span>
        </div>

        {/* ── Header ── */}
        <div className="db-hdr">
          <div>
            <h1 className="db-title">
              {greeting()}, <em>{firstName}</em>
            </h1>
            <AIInsightBanner page="dashboard" assistant="aria" />
            <TrustScoreBadge score={75} />
            <ProgressRing progress={75} size={64} label="Trust Score" />
            <AgenticLoopWidget currentStage={1} />
            <AssistantPanel page="dashboard" assistant="aria" />
            <CrossLayerHandoff
              type="academy"
              title="Ready to learn?"
              subtitle="NOVA detected your interest in skills"
              details={<p>Explore courses that match your profile and earn certificates to boost your trust score.</p>}
              actionLabel="Browse Academy"
              loopStage={2}
            />
            <div className="db-date">
              Winners Ecosystem · Control Center ·{" "}
              {now.toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>
          <div className="db-pill">
            <span className="db-dot" />
            All Systems Live
          </div>
        </div>

        {/* ── Error banner (non-fatal — shows alongside data) ── */}
        {error && (
          <div className="db-err">
            ⚠ {error}
            <button className="db-err-btn" onClick={loadStats}>
              Retry
            </button>
          </div>
        )}

        {/* ── AI Bar ── */}
        <div className="db-ai">
          <span className="db-ai-icon">🤖</span>
          <div className="db-ai-body">
            <div className="db-ai-lbl">Winners Intelligence · Ecosystem AI</div>
            <div className="db-ai-txt">
              <strong>Phase 3 active.</strong>{" "}
              {stats?.topInsight ||
                "Academy is live. Start building courses and earning certificates. AI Intelligence available at /intelligence"}
            </div>
          </div>
          <div className="db-ai-acts">
            <button className="db-ai-btn" onClick={() => navigate("/academy")}>
              Academy →
            </button>
            <button
              className="db-ai-btn"
              onClick={() => navigate("/intelligence")}
            >
              AI →
            </button>
            <button
              className="db-ai-btn p"
              onClick={() => navigate("/analytics")}
            >
              Analytics →
            </button>
          </div>
        </div>

        {/* ── KPIs ── */}
        <div className="db-kpis">
          {/* Revenue */}
          <div className="db-kpi g">
            <div className="db-kpi-lbl">Total Revenue</div>
            {loading ? (
              <>
                <div
                  className="db-skel"
                  style={{ height: 36, width: "65%", marginBottom: 8 }}
                />
                <div className="db-skel" style={{ height: 12, width: "50%" }} />
              </>
            ) : (
              <>
                <div className="db-kpi-val">
                  {fmtMoney(stats?.totalRevenue ?? 0)}
                </div>
                <div
                  className="db-kpi-delta"
                  style={{ color: deltaColor(stats?.revenueGrowth ?? 0) }}
                >
                  {deltaSign(stats?.revenueGrowth ?? 0)}{" "}
                  {Math.abs(stats?.revenueGrowth ?? 0).toFixed(1)}% vs last 30d
                </div>
              </>
            )}
          </div>

          {/* Activity */}
          <div className="db-kpi gr">
            <div className="db-kpi-lbl">Total Activity</div>
            {loading ? (
              <>
                <div
                  className="db-skel"
                  style={{ height: 36, width: "60%", marginBottom: 8 }}
                />
                <div className="db-skel" style={{ height: 12, width: "55%" }} />
              </>
            ) : (
              <>
                <div className="db-kpi-val">
                  {(stats?.totalActivity ?? 0).toLocaleString()}
                </div>
                <div
                  className="db-kpi-delta"
                  style={{ color: deltaColor(stats?.activityGrowth ?? 0) }}
                >
                  {deltaSign(stats?.activityGrowth ?? 0)}{" "}
                  {Math.abs(stats?.activityGrowth ?? 0).toFixed(1)}% vs last 30d
                </div>
              </>
            )}
          </div>

          {/* Team */}
          <div className="db-kpi b">
            <div className="db-kpi-lbl">Team Members</div>
            {loading ? (
              <>
                <div
                  className="db-skel"
                  style={{ height: 36, width: "35%", marginBottom: 8 }}
                />
                <div className="db-skel" style={{ height: 12, width: "60%" }} />
              </>
            ) : (
              <>
                <div className="db-kpi-val">{stats?.teamMembers ?? 1}</div>
                <div className="db-kpi-delta">Active workspace members</div>
              </>
            )}
          </div>

          {/* Trend */}
          <div className="db-kpi p">
            <div className="db-kpi-lbl">Revenue Trend</div>
            {loading ? (
              <>
                <div
                  className="db-skel"
                  style={{ height: 36, width: "55%", marginBottom: 8 }}
                />
                <div className="db-skel" style={{ height: 12, width: "65%" }} />
              </>
            ) : (
              <>
                <div
                  className="db-kpi-val"
                  style={{
                    fontSize: 24,
                    color:
                      stats?.trend === "up"
                        ? "var(--green)"
                        : stats?.trend === "down"
                          ? "var(--red)"
                          : "var(--text)",
                  }}
                >
                  {stats?.trend === "up"
                    ? "↑ Rising"
                    : stats?.trend === "down"
                      ? "↓ Falling"
                      : "→ Stable"}
                </div>
                <div className="db-kpi-delta">vs previous 30 days</div>
              </>
            )}
          </div>
        </div>

        {/* ── AI Insight ── */}
        {!loading && stats?.topInsight && (
          <div className="db-insight">
            <span>💡</span>
            <span>
              <strong>AI Insight:</strong> {stats.topInsight}
            </span>
          </div>
        )}

        {/* ── Roadmap Progress ── */}
        <div className="db-road">
          <div className="db-road-ttl">
            Ecosystem Build Progress · Phase 3 of 8 Active
          </div>
          <div className="db-phases">
            {PHASES.map((ph) => (
              <div key={ph.n} className={`db-phase ${ph.state}`}>
                <div className={`db-phase-dot ${ph.state}`}>
                  {ph.state === "done" ? "✓" : ph.n}
                </div>
                <div className="db-phase-lbl">{ph.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Growth Insights - AI Weekly Report */}
        <div
          className="db-insight"
          style={{
            background: "rgba(155,111,255,0.04)",
            borderLeftColor: "var(--purple)",
          }}
        >
          <div style={{ fontSize: "18px", marginRight: "8px" }}>📈</div>
          <div>
            <div
              style={{
                fontFamily: "Space Mono, monospace",
                fontSize: "9px",
                letterSpacing: "0.15em",
                color: "var(--purple)",
                marginBottom: "4px",
              }}
            >
              WEEKLY GROWTH REPORT
            </div>
            <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
              Your{" "}
              <strong style={{ color: "var(--gold)" }}>
                community following grew 18%
              </strong>{" "}
              this week.
              <strong>OMEGA recommends</strong> launching a course on your
              expertise to monetize your growing audience.
            </div>
          </div>
        </div>

        {/* ── Journey Map ── */}
        <div className="db-journey">
          <div className="db-journey-ttl">
            <span>🗺️</span> Your Journey Across the Ecosystem
          </div>
          <div className="db-journey-track">
            <div className="db-journey-step done">
              <div className="db-journey-dot done">✓</div>
              <div className="db-journey-lbl">Core Engine</div>
            </div>
            <div className="db-journey-step done">
              <div className="db-journey-dot done">✓</div>
              <div className="db-journey-lbl">Community</div>
            </div>
            <div className="db-journey-step active">
              <div className="db-journey-dot active">🎓</div>
              <div className="db-journey-lbl">Academy</div>
            </div>
            <div className="db-journey-step pending">
              <div className="db-journey-dot pending">🛒</div>
              <div className="db-journey-lbl">Market</div>
            </div>
            <div className="db-journey-step pending">
              <div className="db-journey-dot pending">🤖</div>
              <div className="db-journey-lbl">Intelligence</div>
            </div>
            <div className="db-journey-step pending">
              <div className="db-journey-dot pending">💼</div>
              <div className="db-journey-lbl">Work</div>
            </div>
          </div>
        </div>

        {/* ── Achievements ── */}
        <div className="db-achievements">
          <div className="db-achievements-ttl">
            <span>🏆</span> Your Achievements
            <span className="db-achievements-all">View All →</span>
          </div>
          <div className="db-achievements-grid">
            <div className="db-achievement">
              <div className="db-achievement-icon">🚀</div>
              <div className="db-achievement-info">
                <div className="db-achievement-name">First Steps</div>
                <div className="db-achievement-desc">Complete onboarding</div>
              </div>
            </div>
            <div className="db-achievement">
              <div className="db-achievement-icon">👥</div>
              <div className="db-achievement-info">
                <div className="db-achievement-name">Community Builder</div>
                <div className="db-achievement-desc">
                  Create your first post
                </div>
              </div>
            </div>
            <div className="db-achievement">
              <div className="db-achievement-icon">🎓</div>
              <div className="db-achievement-info">
                <div className="db-achievement-name">Scholar</div>
                <div className="db-achievement-desc">Enroll in a course</div>
              </div>
            </div>
            <div className="db-achievement locked">
              <div className="db-achievement-icon">🏅</div>
              <div className="db-achievement-info">
                <div className="db-achievement-name">Certificate</div>
                <div className="db-achievement-desc">Earn your first cert</div>
              </div>
            </div>
            <div className="db-achievement locked">
              <div className="db-achievement-icon">📈</div>
              <div className="db-achievement-info">
                <div className="db-achievement-name">Master Trader</div>
                <div className="db-achievement-desc">$1K trading volume</div>
              </div>
            </div>
            <div className="db-achievement locked">
              <div className="db-achievement-icon">💎</div>
              <div className="db-achievement-info">
                <div className="db-achievement-name">Elite Freelancer</div>
                <div className="db-achievement-desc">Complete 10 contracts</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Wealth Dashboard ── */}
        <div className="db-wealth">
          <div className="db-wealth-ttl">
            <span>💰</span> Earnings Across Ecosystem
          </div>
          <div className="db-wealth-grid">
            <div className="db-wealth-card">
              <div className="db-wealth-card-icon">💳</div>
              <div className="db-wealth-card-label">Subscriptions</div>
              <div className="db-wealth-card-value gold">
                {fmtMoney(stats?.totalRevenue ?? 0)}
              </div>
              <div className="db-wealth-card-sub">Monthly recurring</div>
            </div>
            <div className="db-wealth-card">
              <div className="db-wealth-card-icon">🎓</div>
              <div className="db-wealth-card-label">Academy</div>
              <div className="db-wealth-card-value green">$0</div>
              <div className="db-wealth-card-sub">Course sales</div>
            </div>
            <div className="db-wealth-card">
              <div className="db-wealth-card-icon">🛒</div>
              <div className="db-wealth-card-label">Market</div>
              <div className="db-wealth-card-value ice">$0</div>
              <div className="db-wealth-card-sub">Product revenue</div>
            </div>
            <div className="db-wealth-card">
              <div className="db-wealth-card-icon">💼</div>
              <div className="db-wealth-card-label">Work</div>
              <div className="db-wealth-card-value purple">$0</div>
              <div className="db-wealth-card-sub">Freelance earnings</div>
            </div>
          </div>
        </div>

        {/* ── Platforms ── */}
        <div className="db-sec-lbl">Ecosystem Platforms</div>
        <div className="db-platforms">
          {PLATFORMS.map((p) => (
            <div
              key={p.name}
              className={`db-plat ${p.path ? "click" : "dim"}`}
              onClick={() => p.path && navigate(p.path)}
            >
              <span className="db-plat-icon">{p.icon}</span>
              <div>
                <div className="db-plat-name">{p.name}</div>
                <div className="db-plat-desc">{p.desc}</div>
              </div>
              <div className="db-plat-right">
                <span className={`db-badge ${p.status}`}>
                  {p.status === "live"
                    ? "● Live"
                    : p.status === "soon"
                      ? "◎ Soon"
                      : "○ Planned"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Bottom Row ── */}
        <div className="db-bottom">
          {/* 30-day snapshot */}
          <div className="db-card gold-top">
            <div className="db-card-ttl">30-Day Snapshot</div>
            {loading ? (
              [1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="db-row">
                  <div
                    className="db-skel"
                    style={{ height: 11, width: "40%" }}
                  />
                  <div
                    className="db-skel"
                    style={{ height: 11, width: "22%" }}
                  />
                </div>
              ))
            ) : (
              <>
                <div className="db-row">
                  <span className="db-row-lbl">Total Revenue</span>
                  <span className="db-row-val" style={{ color: "var(--gold)" }}>
                    {fmtMoney(stats?.totalRevenue ?? 0)}
                  </span>
                </div>
                <div className="db-row">
                  <span className="db-row-lbl">Revenue Growth</span>
                  <span
                    className="db-row-val"
                    style={{ color: deltaColor(stats?.revenueGrowth ?? 0) }}
                  >
                    {(stats?.revenueGrowth ?? 0) >= 0 ? "+" : ""}
                    {(stats?.revenueGrowth ?? 0).toFixed(1)}%
                  </span>
                </div>
                <div className="db-row">
                  <span className="db-row-lbl">Activity Events</span>
                  <span className="db-row-val" style={{ color: "var(--text)" }}>
                    {(stats?.totalActivity ?? 0).toLocaleString()}
                  </span>
                </div>
                <div className="db-row">
                  <span className="db-row-lbl">Activity Growth</span>
                  <span
                    className="db-row-val"
                    style={{ color: deltaColor(stats?.activityGrowth ?? 0) }}
                  >
                    {(stats?.activityGrowth ?? 0) >= 0 ? "+" : ""}
                    {(stats?.activityGrowth ?? 0).toFixed(1)}%
                  </span>
                </div>
                <div className="db-row">
                  <span className="db-row-lbl">Team Size</span>
                  <span className="db-row-val" style={{ color: "var(--gold)" }}>
                    {stats?.teamMembers ?? 1} member
                    {(stats?.teamMembers ?? 1) !== 1 ? "s" : ""}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Quick Navigation */}
          <div className="db-card blue-top">
            <div className="db-card-ttl">Quick Navigation</div>
            {NAV_LINKS.map((lnk) => (
              <div
                key={lnk.label}
                className="db-row db-row-click"
                onClick={() => navigate(lnk.path)}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span className="db-row-ico">{lnk.icon}</span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700 }}>
                      {lnk.label}
                    </div>
                    <div
                      style={{
                        fontFamily: "Space Mono, monospace",
                        fontSize: 9,
                        color: "var(--text-dim)",
                        marginTop: 1,
                      }}
                    >
                      {lnk.sub}
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    fontFamily: "Space Mono, monospace",
                    fontSize: 10,
                    color: "var(--text-dim)",
                  }}
                >
                  →
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

