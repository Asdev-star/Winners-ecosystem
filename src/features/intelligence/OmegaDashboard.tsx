// Phase 5 — Winners Intelligence — OmegaDashboard.tsx
// OMEGA Master Orchestrator — Real Ecosystem Health Dashboard

import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";
import AssistantPanel from "../../components/ui/AssistantPanel";
import OMEGABriefingCard from "./components/OMEGABriefingCard";
import AgenticLoopVisualiser from "./components/AgenticLoopVisualiser";
import CreditMeter from "./components/CreditMeter";
import AutoActionCard from "./components/AutoActionCard";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

interface EcosystemStats {
  totalRevenue: number;
  revenueGrowth: number;
  totalActivity: number;
  activeUsers: number;
}

interface WorkStats {
  openJobs: number;
  availableFreelancers: number;
  completedContracts: number;
}

interface OmegaAnalysis {
  trustScore: number;
  currentStage: string;
  skills: { skill: string; confidence: number }[];
  certificates: number;
  enrollments: number;
  posts: number;
  followers: number;
  insights: {
    strengths: string[];
    opportunities: string[];
    nextBestAction: string;
    predictedOutcome: string;
    ecosystemHealth: string;
  };
}

interface ActivityEntry {
  id: string;
  action: string;
  category: string;
  createdAt: string;
  user?: { name: string };
}

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

.omega-root {
  min-height: 100vh;
  background:
    radial-gradient(ellipse 80% 50% at 20% 0%, rgba(155,111,255,0.05) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 80% 100%, rgba(201,168,76,0.04) 0%, transparent 50%),
    var(--bg);
  font-family: 'Syne', sans-serif;
  color: var(--text);
  padding: 28px 32px;
}

.omega-header {
  display: flex; align-items: flex-start; justify-content: space-between;
  margin-bottom: 8px; flex-wrap: wrap; gap: 12px;
}
.omega-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 36px; font-weight: 300; letter-spacing: -0.02em;
}
.omega-title em { font-style: italic; color: var(--purple); }
.omega-subtitle {
  font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim);
  letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 24px;
}
.omega-badge {
  display: flex; align-items: center; gap: 8px;
  background: rgba(155,111,255,0.1); border: 1px solid rgba(155,111,255,0.2);
  padding: 8px 16px; border-radius: 20px;
  font-family: 'Space Mono', monospace; font-size: 10px;
  text-transform: uppercase; letter-spacing: 0.1em; color: var(--purple);
}
.omega-badge-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--purple); animation: omegaPulse 2s ease-in-out infinite;
}
@keyframes omegaPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

/* Stats Row */
.omega-stats-row {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px;
}
.omega-stat-card {
  background: var(--surface); border: 1px solid var(--border); border-radius: 6px;
  padding: 18px 20px; position: relative; overflow: hidden;
  transition: border-color 200ms ease;
}
.omega-stat-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
}
.omega-stat-card.revenue::before { background: linear-gradient(90deg, var(--gold), transparent); }
.omega-stat-card.activity::before { background: linear-gradient(90deg, var(--ice), transparent); }
.omega-stat-card.jobs::before { background: linear-gradient(90deg, var(--blue), transparent); }
.omega-stat-card.contracts::before { background: linear-gradient(90deg, var(--green), transparent); }
.omega-stat-card:hover { border-color: var(--gold); }
.omega-stat-label {
  font-family: 'Space Mono', monospace; font-size: 9px; text-transform: uppercase;
  letter-spacing: 0.12em; color: var(--text-dim); margin-bottom: 8px;
}
.omega-stat-value {
  font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 800;
  color: var(--text); margin-bottom: 4px; line-height: 1;
}
.omega-stat-sub {
  font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim);
}
.omega-stat-sub.positive { color: var(--green); }
.omega-stat-sub.negative { color: var(--red); }

/* Layer Grid */
.omega-grid {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 28px;
}
.omega-layer-card {
  background: var(--surface); border: 1px solid var(--border); border-radius: 6px;
  padding: 18px; position: relative; overflow: hidden;
  transition: border-color 200ms ease; text-decoration: none; color: var(--text);
  display: block;
}
.omega-layer-card:hover { border-color: var(--gold); }
.omega-layer-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
}
.omega-layer-card.core::before       { background: linear-gradient(90deg, var(--gold), transparent); }
.omega-layer-card.community::before  { background: linear-gradient(90deg, var(--ice), transparent); }
.omega-layer-card.academy::before    { background: linear-gradient(90deg, var(--gold), var(--ice), transparent); }
.omega-layer-card.market::before     { background: linear-gradient(90deg, var(--green), transparent); }
.omega-layer-card.intelligence::before { background: linear-gradient(90deg, var(--purple), transparent); }
.omega-layer-card.work::before       { background: linear-gradient(90deg, var(--blue), transparent); }
.omega-layer-card.mobile::before     { background: linear-gradient(90deg, var(--ice), var(--purple), transparent); }
.omega-layer-card.cloud::before      { background: linear-gradient(90deg, var(--blue), var(--purple), transparent); }
.omega-layer-icon  { font-size: 22px; margin-bottom: 10px; }
.omega-layer-name  { font-family: 'Space Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.15em; color: var(--text-dim); margin-bottom: 3px; }
.omega-layer-title { font-size: 13px; font-weight: 700; margin-bottom: 12px; }
.omega-layer-progress { height: 3px; background: var(--border); border-radius: 2px; overflow: hidden; margin-bottom: 8px; }
.omega-layer-progress-fill { height: 100%; border-radius: 2px; transition: width 1s ease; }
.omega-layer-status {
  display: flex; align-items: center; gap: 5px;
  font-family: 'Space Mono', monospace; font-size: 8px;
  text-transform: uppercase; letter-spacing: 0.1em;
}
.omega-layer-status-dot { width: 5px; height: 5px; border-radius: 50%; }
.omega-layer-status.live .omega-layer-status-dot     { background: var(--green); }
.omega-layer-status.building .omega-layer-status-dot { background: var(--gold); }
.omega-layer-status.planned .omega-layer-status-dot  { background: var(--text-dim); }
.omega-layer-status.live     { color: var(--green); }
.omega-layer-status.building { color: var(--gold); }
.omega-layer-status.planned  { color: var(--text-dim); }

/* Agentic Loop */
.omega-loop-section {
  background: var(--surface); border: 1px solid var(--border); border-radius: 6px;
  padding: 24px 28px; margin-bottom: 28px; position: relative; overflow: hidden;
}
.omega-loop-section::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, var(--purple), var(--gold), var(--ice), transparent);
}
.omega-loop-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.omega-loop-title {
  font-family: 'Space Mono', monospace; font-size: 10px; text-transform: uppercase;
  letter-spacing: 0.15em; color: var(--text-dim);
}
.omega-loop-badge {
  font-family: 'Space Mono', monospace; font-size: 9px; padding: 3px 10px;
  border-radius: 3px; background: rgba(155,111,255,0.1);
  border: 1px solid rgba(155,111,255,0.2); color: var(--purple);
}
.omega-loop-visual {
  display: flex; align-items: center; justify-content: space-between;
  position: relative; padding: 12px 0;
}
.omega-loop-visual::before {
  content: ''; position: absolute; top: 50%; left: 36px; right: 36px;
  height: 1px; background: var(--border); z-index: 0;
}
.omega-loop-node {
  display: flex; flex-direction: column; align-items: center;
  gap: 8px; z-index: 1; position: relative;
}
.omega-loop-node-icon {
  width: 44px; height: 44px; border-radius: 50%;
  background: var(--surface2); border: 2px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; transition: all 200ms ease;
}
.omega-loop-node.completed .omega-loop-node-icon { border-color: var(--green); background: rgba(45,212,160,0.08); }
.omega-loop-node.current .omega-loop-node-icon {
  border-color: var(--gold); background: rgba(201,168,76,0.12);
  box-shadow: 0 0 16px rgba(201,168,76,0.2); animation: loopPulse 2s ease-in-out infinite;
}
@keyframes loopPulse { 0%,100%{box-shadow:0 0 16px rgba(201,168,76,0.2)} 50%{box-shadow:0 0 28px rgba(201,168,76,0.35)} }
.omega-loop-node-label {
  font-family: 'Space Mono', monospace; font-size: 8px; text-transform: uppercase;
  letter-spacing: 0.08em; color: var(--text-dim); text-align: center; max-width: 56px;
}

/* Feed & Actions */
.omega-feed { display: grid; grid-template-columns: 1fr 340px; gap: 20px; margin-bottom: 28px; }
.omega-feed-main {
  background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 22px;
}
.omega-feed-title {
  font-family: 'Space Mono', monospace; font-size: 9px; text-transform: uppercase;
  letter-spacing: 0.15em; color: var(--text-dim); margin-bottom: 16px;
}
.omega-feed-item {
  display: flex; gap: 12px; padding: 12px 0;
  border-bottom: 1px solid var(--border); transition: background 150ms ease;
}
.omega-feed-item:last-child { border-bottom: none; }
.omega-feed-icon {
  width: 34px; height: 34px; border-radius: 6px; background: var(--surface2);
  display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0;
}
.omega-feed-content { flex: 1; min-width: 0; }
.omega-feed-text { font-size: 13px; color: var(--text); margin-bottom: 3px; line-height: 1.45; }
.omega-feed-meta { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.05em; }
.omega-feed-empty { color: var(--text-dim); font-size: 13px; padding: 12px 0; }

.omega-actions {
  background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 22px;
}
.omega-actions-title {
  font-family: 'Space Mono', monospace; font-size: 9px; text-transform: uppercase;
  letter-spacing: 0.15em; color: var(--text-dim); margin-bottom: 16px;
}
.omega-action-item {
  display: flex; align-items: center; justify-content: space-between; gap: 10px;
  padding: 12px 0; border-bottom: 1px solid var(--border);
}
.omega-action-item:last-child { border-bottom: none; }
.omega-action-text { font-size: 12px; color: var(--text); line-height: 1.4; flex: 1; }
.omega-action-btn {
  background: rgba(155,111,255,0.12); border: 1px solid rgba(155,111,255,0.25);
  color: var(--purple); font-family: 'Space Mono', monospace; font-size: 9px;
  text-transform: uppercase; letter-spacing: 0.08em; padding: 5px 10px;
  border-radius: 3px; cursor: pointer; transition: all 150ms ease; white-space: nowrap;
}
.omega-action-btn:hover { background: rgba(155,111,255,0.2); border-color: var(--purple); }

/* Quick Links */
.omega-links {
  display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px;
}
.omega-link-card {
  background: var(--surface); border: 1px solid var(--border); border-radius: 6px;
  padding: 16px; text-decoration: none; color: var(--text-dim);
  transition: all 150ms ease; text-align: center;
}
.omega-link-card:hover { border-color: var(--gold); color: var(--text); background: var(--surface2); }
.omega-link-icon { font-size: 22px; margin-bottom: 6px; }
.omega-link-label { font-family: 'Space Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.1em; }

/* Skeleton */
.omega-skeleton { background: var(--surface2); border-radius: 4px; animation: shimmer 1.5s ease infinite; }
@keyframes shimmer { 0%,100%{opacity:0.6} 50%{opacity:1} }

@media (max-width:1200px) {
  .omega-grid { grid-template-columns: repeat(2,1fr); }
  .omega-stats-row { grid-template-columns: repeat(2,1fr); }
  .omega-feed { grid-template-columns: 1fr; }
  .omega-links { grid-template-columns: repeat(2,1fr); }
  .omega-insights-grid { grid-template-columns: 1fr !important; }
}
@media (max-width:768px) {
  .omega-root { padding: 16px; }
  .omega-grid { grid-template-columns: 1fr; }
  .omega-loop-visual { flex-wrap: wrap; gap: 14px; justify-content: center; }
  .omega-loop-visual::before { display: none; }
  .omega-links { grid-template-columns: repeat(2,1fr); }
}
`;

const LAYERS = [
  { id: "core",         icon: "⬡",   name: "Core Engine",    title: "Core Engine",         path: "/dashboard",            progress: 92, status: "live",     className: "core" },
  { id: "community",   icon: "🧑‍🤝‍🧑",  name: "Community",      title: "Winners Community",   path: "/community",            progress: 80, status: "live",     className: "community" },
  { id: "academy",     icon: "🎓",  name: "Academy",         title: "Winners Academy",     path: "/academy",              progress: 72, status: "live",     className: "academy" },
  { id: "market",      icon: "🛒",  name: "Market",          title: "Winners Market",      path: "/market",               progress: 55, status: "building", className: "market" },
  { id: "intelligence",icon: "🤖",  name: "Intelligence",    title: "Winners Intelligence",path: "/intelligence",         progress: 75, status: "live",     className: "intelligence" },
  { id: "work",        icon: "💼",  name: "Work",            title: "Winners Work",        path: "/work",                 progress: 35, status: "building", className: "work" },
  { id: "mobile",      icon: "📱",  name: "Mobile",          title: "Mobile App",          path: null,                    progress: 25, status: "building", className: "mobile" },
  { id: "cloud",       icon: "☁️",  name: "Cloud",           title: "Winners Cloud",       path: "/cloud",                progress: 40, status: "building", className: "cloud" },
  { id: "aiplatform",  icon: "🧬",  name: "AI Platform",     title: "Universal AI Platform",path: "/intelligence/platform",progress: 60, status: "building", className: "cloud" },
];

const LOOP_STAGES = [
  { id: "community",   icon: "👥", label: "Post",        desc: "Community" },
  { id: "nova",        icon: "🤖", label: "NOVA",        desc: "Skill detect" },
  { id: "academy",     icon: "🎓", label: "Learn",       desc: "Academy" },
  { id: "certificate", icon: "📜", label: "Certify",     desc: "Certificate" },
  { id: "work",        icon: "💼", label: "Match",       desc: "Work" },
  { id: "contract",    icon: "🤝", label: "Earn",        desc: "Contract" },
  { id: "market",      icon: "🛒", label: "Scale",       desc: "Market" },
];

const ACTION_ITEMS = [
  { text: "Wire Market multi-vendor checkout with Stripe webhook inventory decrement", supervisor: "ATLAS",   path: "/market/checkout" },
  { text: "Build CIRCUIT AI escrow + contract milestone tracking in Work", supervisor: "CIRCUIT", path: "/work" },
  { text: "Wire Ollama / Whisper / ComfyUI to HERALD AI Platform FastAPI", supervisor: "HERALD",  path: "/intelligence/platform" },
  { text: "Activate Firebase FCM push notifications for mobile PWA", supervisor: "FORGE",   path: "/settings" },
  { text: "Wire Cloud connector OAuth auth flow with Nango credential lifecycle", supervisor: "NEXUS",  path: "/cloud/connectors" },
  { text: "Run PostgreSQL RLS application-layer verification across all tenants", supervisor: "ARIA",   path: "/ops" },
];

const CATEGORY_ICONS: Record<string, string> = {
  AUTH:     "🔐",
  BILLING:  "💳",
  TEAM:     "👥",
  CONTENT:  "📝",
  AI:       "🤖",
  EXPORT:   "📤",
  SETTINGS: "⚙️",
  SECURITY: "🛡️",
};

function fmt(n: number): string {
  if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`;
  return `$${n}`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const STAGE_INDEX: Record<string, number> = {
  community: 0, nova: 1, academy: 2, certificate: 3, work: 4, contract: 5, market: 6,
};

const HEALTH_COLOR: Record<string, string> = {
  excellent: "var(--green)", good: "var(--gold)", needs_attention: "var(--red)", developing: "var(--text-dim)",
};

interface PendingAction {
  id: string;
  assistant: string;
  actionType: string;
  description: string;
  payload?: Record<string, unknown>;
  createdAt: string;
}

export default function OmegaDashboard() {
  const { user, token } = useAuthStore();
  const navigate = useNavigate();

  const [stats, setStats]             = useState<EcosystemStats | null>(null);
  const [workStats, setWorkStats]     = useState<WorkStats | null>(null);
  const [activity, setActivity]       = useState<ActivityEntry[]>([]);
  const [analysis, setAnalysis]       = useState<OmegaAnalysis | null>(null);
  const [loading, setLoading]         = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [pendingActions, setPendingActions]   = useState<PendingAction[]>([]);
  const [loopState, setLoopState]             = useState<{ stage: string; stageIndex: number; loopCount: number; completedStages: string[] } | null>(null);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [revRes, workRes, actRes, actionsRes, loopRes] = await Promise.allSettled([
        fetch(`${API}/analytics/revenue?period=30d`, { headers }),
        fetch(`${API}/work/stats`, { headers }),
        fetch(`${API}/activity?limit=6`, { headers }),
        fetch(`${API}/agentic/actions/${user.id}`, { headers }),
        fetch(`${API}/agentic/loop/${user.id}`, { headers }),
      ]);

      if (revRes.status === "fulfilled" && revRes.value.ok) {
        const d = await revRes.value.json();
        setStats({
          totalRevenue:  d.summary?.totalRevenue ?? 0,
          revenueGrowth: d.summary?.revenueGrowth ?? 0,
          totalActivity: d.summary?.totalActivity ?? 0,
          activeUsers:   d.summary?.activeUsers ?? 0,
        });
      }

      if (workRes.status === "fulfilled" && workRes.value.ok) {
        setWorkStats(await workRes.value.json());
      }

      if (actRes.status === "fulfilled" && actRes.value.ok) {
        const d = await actRes.value.json();
        setActivity(d.activities ?? d.items ?? []);
      }

      if (actionsRes.status === "fulfilled" && actionsRes.value.ok) {
        const d = await actionsRes.value.json();
        setPendingActions(d.actions ?? []);
      }

      if (loopRes.status === "fulfilled" && loopRes.value.ok) {
        const d = await loopRes.value.json();
        const stageOrder = ["community", "academy", "work", "market", "intelligence"];
        const completedStages = stageOrder.slice(0, d.stageIndex ?? 0);
        setLoopState({ stage: d.stage ?? "community", stageIndex: d.stageIndex ?? 0, loopCount: d.loopCount ?? 0, completedStages });
      }
    } finally {
      setLoading(false);
    }
  }, [token, user]);

  const loadAnalysis = useCallback(async () => {
    setAnalysisLoading(true);
    try {
      const res = await fetch(`${API}/omega/analyze`, { headers });
      if (res.ok) setAnalysis(await res.json());
    } catch { /* silent */ } finally {
      setAnalysisLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); loadAnalysis(); }, [load, loadAnalysis]);

  const loopStageActive = analysis ? (STAGE_INDEX[analysis.currentStage] ?? 2) : 2;

  return (
    <>
      <style>{css}</style>
      <div className="omega-root">

        {/* Header */}
        <div className="omega-header">
          <div>
            <h1 className="omega-title">OMEGA <em>Dashboard</em></h1>
            <div className="omega-subtitle">Master Orchestrator · Cross-Layer Intelligence · Agentic Loop Monitor</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <CreditMeter compact onClick={() => navigate("/intelligence/credits")} />
            <div className="omega-badge">
              <span className="omega-badge-dot" />
              Master Orchestrator Active
            </div>
          </div>
        </div>

        {/* OMEGA Briefing */}
        <OMEGABriefingCard />

        {/* Ecosystem Stats */}
        <div className="omega-stats-row">
          <div className="omega-stat-card revenue">
            <div className="omega-stat-label">30-Day Revenue</div>
            <div className="omega-stat-value">
              {loading ? <div className="omega-skeleton" style={{ width: 80, height: 26 }} /> : fmt(stats?.totalRevenue ?? 0)}
            </div>
            <div className={`omega-stat-sub ${(stats?.revenueGrowth ?? 0) >= 0 ? "positive" : "negative"}`}>
              {loading ? "—" : `${(stats?.revenueGrowth ?? 0) >= 0 ? "+" : ""}${(stats?.revenueGrowth ?? 0).toFixed(1)}% vs prior period`}
            </div>
          </div>
          <div className="omega-stat-card activity">
            <div className="omega-stat-label">Platform Activity</div>
            <div className="omega-stat-value">
              {loading ? <div className="omega-skeleton" style={{ width: 60, height: 26 }} /> : (stats?.totalActivity ?? 0).toLocaleString()}
            </div>
            <div className="omega-stat-sub">Actions across all layers</div>
          </div>
          <div className="omega-stat-card jobs">
            <div className="omega-stat-label">Open Jobs</div>
            <div className="omega-stat-value">
              {loading ? <div className="omega-skeleton" style={{ width: 50, height: 26 }} /> : (workStats?.openJobs ?? 0)}
            </div>
            <div className="omega-stat-sub">{workStats?.availableFreelancers ?? 0} freelancers available</div>
          </div>
          <div className="omega-stat-card contracts">
            <div className="omega-stat-label">Contracts Completed</div>
            <div className="omega-stat-value">
              {loading ? <div className="omega-skeleton" style={{ width: 50, height: 26 }} /> : (workStats?.completedContracts ?? 0)}
            </div>
            <div className="omega-stat-sub positive">Work layer live</div>
          </div>
        </div>

        {/* Layer Health Grid */}
        <div className="omega-grid">
          {LAYERS.map((layer) => {
            const card = (
              <div className={`omega-layer-card ${layer.className}`}>
                <div className="omega-layer-icon">{layer.icon}</div>
                <div className="omega-layer-name">{layer.name}</div>
                <div className="omega-layer-title">{layer.title}</div>
                <div className="omega-layer-progress">
                  <div
                    className="omega-layer-progress-fill"
                    style={{
                      width: `${layer.progress}%`,
                      background: layer.status === "live" ? "var(--green)" : layer.status === "building" ? "var(--gold)" : "var(--text-dim)",
                    }}
                  />
                </div>
                <div className={`omega-layer-status ${layer.status}`}>
                  <span className="omega-layer-status-dot" />
                  {layer.status === "live" ? "Live" : layer.status === "building" ? "Building" : "Planned"} · {layer.progress}%
                </div>
              </div>
            );
            return layer.path ? (
              <Link key={layer.id} to={layer.path} style={{ textDecoration: "none" }}>{card}</Link>
            ) : (
              <div key={layer.id}>{card}</div>
            );
          })}
        </div>

        {/* Agentic Loop */}
        <div className="omega-loop-section">
          <div className="omega-loop-header">
            <div className="omega-loop-title">Agentic Loop — Ecosystem Compounding Engine</div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {analysis && (
                <span style={{
                  fontFamily: "'Space Mono', monospace", fontSize: 9, padding: "3px 10px",
                  borderRadius: 3, border: "1px solid",
                  color: HEALTH_COLOR[analysis.insights.ecosystemHealth] ?? "var(--text-dim)",
                  borderColor: HEALTH_COLOR[analysis.insights.ecosystemHealth] ?? "var(--border)",
                  background: "rgba(0,0,0,0.2)", textTransform: "uppercase", letterSpacing: "0.1em",
                }}>
                  {analysis.insights.ecosystemHealth.replace("_", " ")} health
                </span>
              )}
              <Link to="/intelligence/loop" style={{ textDecoration: "none" }}>
                <div className="omega-loop-badge">View Full Loop →</div>
              </Link>
            </div>
          </div>
          <div style={{ display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
            <AgenticLoopVisualiser
              currentStage={loopState?.stage ?? analysis?.currentStage ?? "community"}
              completedStages={loopState?.completedStages ?? []}
              loopCount={loopState?.loopCount ?? 0}
              size={260}
              onStageClick={(stage) => {
                const paths: Record<string, string> = { community: "/community", academy: "/academy", work: "/work", market: "/market", intelligence: "/intelligence" };
                if (paths[stage]) navigate(paths[stage]);
              }}
            />
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 12, color: "var(--text-dim)", fontFamily: "'Space Mono', monospace", marginBottom: 8 }}>
                Active stage: <span style={{ color: "var(--gold)", textTransform: "capitalize" }}>
                  {loopState?.stage ?? analysis?.currentStage ?? "community"}
                </span>
              </div>
              {analysis && (
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--text-dim)", marginBottom: 12 }}>
                  Trust Score: <span style={{ color: "var(--gold)" }}>{analysis.trustScore}/100</span>
                </div>
              )}
              {analysis?.insights.nextBestAction && (
                <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.6, padding: "10px 14px", background: "rgba(155,111,255,0.05)", border: "1px solid rgba(155,111,255,0.15)", borderRadius: 6 }}>
                  <span style={{ color: "var(--purple)", fontFamily: "'Space Mono', monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", display: "block", marginBottom: 4 }}>🧠 OMEGA Recommends</span>
                  {analysis.insights.nextBestAction}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* OMEGA Insights Panel */}
        {(analysis || analysisLoading) && (
          <div className="omega-insights-grid" style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 28,
          }}>
            <div className="omega-feed-main" style={{ borderColor: "rgba(45,212,160,0.2)" }}>
              <div className="omega-feed-title" style={{ color: "var(--green)" }}>✦ Strengths</div>
              {analysisLoading ? [0,1,2].map(i => (
                <div key={i} className="omega-skeleton" style={{ height: 11, borderRadius: 3, marginBottom: 10, width: `${70+i*10}%` }} />
              )) : analysis?.insights.strengths.map((s, i) => (
                <div key={i} style={{ fontSize: 12, color: "var(--text)", padding: "6px 0", borderBottom: "1px solid var(--border)", lineHeight: 1.5 }}>
                  <span style={{ color: "var(--green)", marginRight: 6 }}>✓</span>{s}
                </div>
              ))}
            </div>
            <div className="omega-feed-main" style={{ borderColor: "rgba(201,168,76,0.2)" }}>
              <div className="omega-feed-title" style={{ color: "var(--gold)" }}>⬡ Opportunities</div>
              {analysisLoading ? [0,1,2].map(i => (
                <div key={i} className="omega-skeleton" style={{ height: 11, borderRadius: 3, marginBottom: 10, width: `${60+i*12}%` }} />
              )) : analysis?.insights.opportunities.map((o, i) => (
                <div key={i} style={{ fontSize: 12, color: "var(--text)", padding: "6px 0", borderBottom: "1px solid var(--border)", lineHeight: 1.5 }}>
                  <span style={{ color: "var(--gold)", marginRight: 6 }}>→</span>{o}
                </div>
              ))}
            </div>
            <div className="omega-feed-main" style={{ borderColor: "rgba(155,111,255,0.2)" }}>
              <div className="omega-feed-title" style={{ color: "var(--purple)" }}>🧠 OMEGA Recommends</div>
              {analysisLoading ? (
                <div className="omega-skeleton" style={{ height: 50, borderRadius: 4 }} />
              ) : (
                <>
                  <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.6, marginBottom: 12 }}>
                    {analysis?.insights.nextBestAction}
                  </div>
                  <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--text-dim)", lineHeight: 1.5 }}>
                    Predicted outcome: {analysis?.insights.predictedOutcome}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Intelligence Feed + Action Queue */}
        <div className="omega-feed">
          <div className="omega-feed-main">
            <div className="omega-feed-title">Cross-Layer Activity Feed</div>
            {loading && [0,1,2,3,4].map(i => (
              <div key={i} className="omega-feed-item">
                <div className="omega-skeleton" style={{ width: 34, height: 34, borderRadius: 6, flexShrink: 0 }} />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div className="omega-skeleton" style={{ height: 13, width: "80%", borderRadius: 3 }} />
                  <div className="omega-skeleton" style={{ height: 9, width: "40%", borderRadius: 3 }} />
                </div>
              </div>
            ))}
            {!loading && activity.length === 0 && (
              <div className="omega-feed-empty">No activity yet — start using the ecosystem to see cross-layer signals here.</div>
            )}
            {!loading && activity.map((item) => (
              <div key={item.id} className="omega-feed-item">
                <div className="omega-feed-icon">{CATEGORY_ICONS[item.category] ?? "📋"}</div>
                <div className="omega-feed-content">
                  <div className="omega-feed-text">{item.action}</div>
                  <div className="omega-feed-meta">{timeAgo(item.createdAt)} · {item.category}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="omega-actions">
            <div className="omega-actions-title">OMEGA Priority Queue</div>
            {pendingActions.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                {pendingActions.map((action) => (
                  <AutoActionCard
                    key={action.id}
                    action={action}
                    onActioned={() => setPendingActions((prev) => prev.filter((a) => a.id !== action.id))}
                  />
                ))}
              </div>
            )}
            {ACTION_ITEMS.map((item, idx) => (
              <div key={idx} className="omega-action-item">
                <div className="omega-action-text">{item.text}</div>
                <Link to={item.path}>
                  <button className="omega-action-btn">Go →</button>
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="omega-links">
          {[
            { icon: "🧑‍🤝‍🧑", label: "Community",    path: "/community"       },
            { icon: "🎓",   label: "Academy",       path: "/academy"         },
            { icon: "💼",   label: "Work Board",    path: "/work"            },
            { icon: "🤖",   label: "ARIA Chat",     path: "/intelligence/aria" },
            { icon: "🔁",   label: "Loop Tracker",  path: "/intelligence/loop" },
            { icon: "🧠",   label: "Memory",        path: "/intelligence/memory" },
            { icon: "⚡",   label: "Credits",       path: "/intelligence/credits" },
            { icon: "📊",   label: "Reports",       path: "/intelligence/reports" },
          ].map((link) => (
            <Link key={link.path} to={link.path} className="omega-link-card">
              <div className="omega-link-icon">{link.icon}</div>
              <div className="omega-link-label">{link.label}</div>
            </Link>
          ))}
        </div>

      </div>

      <AssistantPanel
        assistant="omega"
        page="omega-dashboard"
        context={{
          totalRevenue: stats?.totalRevenue,
          revenueGrowth: stats?.revenueGrowth,
          openJobs: workStats?.openJobs,
          completedContracts: workStats?.completedContracts,
          userName: user?.name,
        }}
      />
    </>
  );
}
