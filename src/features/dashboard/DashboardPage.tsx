import { startTransition, useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { API_BASE } from "../../lib/api";
import { getAuthHeaders, useAuthStore } from "../auth/authStore";
import { useSuperAdminAccess } from "../../app/useSuperAdminAccess";
import FourDocumentsBlueprint from "../../components/docs/FourDocumentsBlueprint";
import NotificationBell from "../notifications/NotificationBell";
import ThemeToggle from "../theme/ThemeToggle";
import AdminKPIRow from "./components/AdminKPIRow";
import ForgeIntelligencePanel from "./components/ForgeIntelligencePanel";
import PlatformStatusGrid from "./components/PlatformStatusGrid";
import BroadcastComposer from "./components/BroadcastComposer";
import RevenueBreakdownChart from "./components/RevenueBreakdownChart";
import SystemHealthPanel from "./components/SystemHealthPanel";
import SecurityAuditPanel from "./components/SecurityAuditPanel";

type HealthTone = "ok" | "attention";
type LayerStatus = "live" | "ready" | "locked" | "build";
type ChecklistState = "done" | "attention" | "blocked";

type AdminSignal = {
  id: string;
  supervisor: string;
  supervisorEmoji: string;
  layerName: string;
  adminPath: string;
  title: string;
  message: string;
  createdAt: string;
};

type OverviewLayer = {
  id: string;
  name: string;
  progress: number;
  status: LayerStatus;
  statusLabel: string;
  adminPath?: string;
  actionLabel: string;
  note: string;
};

type OverviewResponse = {
  kpis: {
    mrr: number;
    mrrDeltaPct: number;
    users: number;
    activeUsers: number;
    liveLayers: number;
    lockedLayers: number;
    loopsToday: number;
    loopsDeltaPct: number;
    healthLabel: string;
    healthTone: HealthTone;
    newUsers30d?: number;
    avgTrustScore?: number;
    loopComplete?: number;
  };
  layers: OverviewLayer[];
  signals: AdminSignal[];
  recentActions: Array<{ id: string; summary: string; createdAt: string }>;
};

type LoopFeedEntry = {
  id: string;
  userName: string;
  tenantName: string;
  stageLabel: string;
  status: "active" | "completed";
  summary: string;
  revenueImpact: number;
  updatedAt: string;
};

type LoopFeedResponse = {
  active: LoopFeedEntry[];
  completed: LoopFeedEntry[];
};

type RevenueBreakdownResponse = {
  chart: {
    series: Array<{
      key: string;
      label: string;
      fullLabel: string;
      actual: number | null;
      forecast: number | null;
      note?: string;
    }>;
  };
  layers: Array<{
    id: string;
    name: string;
    status: "live" | "locked";
    statusLabel: string;
    detail: string;
    amount: number;
    sharePct: number;
  }>;
  note?: string;
};

type AdminActivityEntry = {
  id: string;
  action?: string;
  summary?: string;
  createdAt: string;
};

type ChecklistResponse = {
  layerName: string;
  isReady: boolean;
  checklist: Array<{ item: string; status: ChecklistState; required: boolean }>;
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Syne:wght@400;500;700;800&display=swap');

  /* ─── Dashboard Shell ──────────────────────────────────────────────────────── */
  .db-root{min-height:100vh;background:radial-gradient(circle at top right,rgba(201,168,76,.12),transparent 28%),radial-gradient(circle at left top,rgba(137,196,225,.08),transparent 24%),linear-gradient(180deg,rgba(7,13,22,.99),rgba(10,17,28,.98));color:var(--text);font-family:'Syne',sans-serif;display:flex;flex-direction:column}
  .db-header{position:sticky;top:0;z-index:40;display:flex;justify-content:space-between;align-items:center;gap:16px;padding:0 24px;height:64px;border-bottom:1px solid rgba(201,168,76,.16);background:radial-gradient(circle at top right,rgba(201,168,76,.16),transparent 32%),linear-gradient(135deg,rgba(12,20,31,.96),rgba(10,17,27,.98));backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);flex-shrink:0}
  .db-brand{display:flex;align-items:center;gap:10px;min-width:0}
  .db-hex{color:var(--gold);font-size:20px;line-height:1}
  .db-brand-name{font-weight:800;font-size:16px;letter-spacing:-.02em;color:var(--text)}
  .db-sep{color:rgba(255,255,255,.2)}
  .db-page-title{color:var(--text-dim);font-size:13px;font-family:'Space Mono',monospace;letter-spacing:.04em}
  .db-header-right{display:flex;align-items:center;gap:10px;flex-shrink:0}
  .db-forge-btn{display:inline-flex;align-items:center;gap:6px;min-height:34px;padding:0 14px;border-radius:999px;border:1px solid rgba(201,168,76,.28);background:rgba(201,168,76,.1);color:var(--gold);font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;cursor:pointer}
  .db-user-pill{display:flex;align-items:center;gap:6px;padding:5px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);font-size:12px;color:var(--text-dim)}
  .db-badge{padding:5px 10px;border-radius:999px;border:1px solid rgba(201,168,76,.32);background:rgba(201,168,76,.12);color:var(--gold);font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase}
  .db-body{display:flex;flex:1;overflow:hidden}
  .db-sidebar{width:240px;flex-shrink:0;position:sticky;top:64px;height:calc(100vh - 64px);overflow-y:auto;border-right:1px solid rgba(201,168,76,.1);background:rgba(7,13,22,.92);display:flex;flex-direction:column;scrollbar-width:thin;scrollbar-color:rgba(201,168,76,.2) transparent}
  .db-nav{flex:1;padding-top:10px}
  .db-nav-item{display:flex;align-items:center;gap:10px;padding:10px 18px;font-size:13px;color:var(--text-dim);text-decoration:none;transition:background .15s,color .15s;border-left:3px solid transparent;width:100%;background:transparent;border-top:none;border-right:none;border-bottom:none;text-align:left;cursor:pointer}
  .db-nav-item:hover{background:rgba(255,255,255,.04);color:var(--text)}
  .db-nav-item.active{border-left-color:var(--gold);background:rgba(201,168,76,.06);color:var(--gold)}
  .db-nav-icon{width:20px;text-align:center;font-size:14px}
  .db-divider{height:1px;background:rgba(255,255,255,.06);margin:14px 12px}
  .db-eco{padding:14px 18px 20px}
  .db-eco-title{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim);margin-bottom:12px}
  .db-eco-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:7px;font-size:12px;color:var(--text-dim)}
  .db-eco-val{color:var(--text);font-weight:600}
  .db-main{flex:1;min-width:0;overflow-y:auto}

  /* ─── Overview Content ─────────────────────────────────────────────────────── */
  .aov{max-width:1200px;margin:0 auto;padding:24px 22px 80px;color:var(--text);font-family:'Syne',sans-serif}
  .aov-error{margin-bottom:16px;padding:14px 16px;border-radius:16px;border:1px solid rgba(224,90,78,.28);color:#ffcbc5;background:rgba(224,90,78,.08)}
  .aov-brief{margin-bottom:20px;padding:20px 22px;border-radius:22px;border:1px solid rgba(201,168,76,.18);border-left:6px solid var(--gold);background:radial-gradient(circle at left center,rgba(201,168,76,.12),transparent 30%),linear-gradient(135deg,rgba(20,28,40,.96),rgba(13,22,35,.98))}
  .aov-brief-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:8px;flex-wrap:wrap}
  .aov-kicker{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:8px}
  .aov-brief-head .aov-kicker{margin-bottom:0}
  .aov-brief-time{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-dim)}
  .aov-brief-copy{font-family:'Cormorant Garamond',serif;font-size:clamp(24px,2.4vw,36px);line-height:1.12;color:#f4f0df;min-height:96px}
  .aov-cursor{display:inline-block;width:8px;height:1em;margin-left:6px;background:var(--gold);vertical-align:-.08em;animation:aov-blink 1s steps(1) infinite}
  .aov-brief-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
  .aov-kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;margin-bottom:18px}
  .aov-kpi,.aov-panel{padding:18px;border-radius:22px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(18,28,40,.92),rgba(11,18,28,.92))}
  .aov-kpi-label{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim);margin-bottom:12px}
  .aov-kpi-value{font-family:'Cormorant Garamond',serif;font-size:32px;line-height:1;color:var(--text)}
  .aov-kpi-sub{margin-top:10px;font-size:12px;color:var(--text-dim)}
  .aov-positive{color:var(--green)} .aov-attention{color:var(--gold)}
  .aov-dot{display:inline-flex;width:10px;height:10px;border-radius:999px;margin-right:7px;background:var(--green);box-shadow:0 0 12px rgba(45,212,160,.34)}
  .aov-dot.attention{background:var(--gold);box-shadow:0 0 12px rgba(201,168,76,.32)}
  .aov-grid{display:grid;grid-template-columns:minmax(0,1.24fr) minmax(300px,.88fr);gap:18px}
  .aov-stack{display:grid;gap:18px}
  .aov-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:16px}
  .aov-title{margin:0;font-size:17px;font-weight:800;color:var(--text)}
  .aov-mini-link{color:var(--gold);font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.06em;text-transform:uppercase;background:transparent;border:none;padding:0;cursor:pointer}
  .aov-layers{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
  .aov-layer{padding:14px;border-radius:18px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);cursor:pointer;text-align:left}
  .aov-layer:hover{border-color:rgba(201,168,76,.26);background:rgba(255,255,255,.045)}
  .aov-layer-head{display:flex;justify-content:space-between;gap:8px;align-items:flex-start;margin-bottom:8px}
  .aov-layer-name{margin:0;font-size:14px;font-weight:800}
  .aov-pill{display:inline-flex;align-items:center;border-radius:999px;padding:4px 8px;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;border:1px solid rgba(255,255,255,.08)}
  .aov-pill.live{color:var(--green);border-color:rgba(45,212,160,.22);background:rgba(45,212,160,.08)}
  .aov-pill.ready{color:var(--gold);border-color:rgba(201,168,76,.22);background:rgba(201,168,76,.08)}
  .aov-pill.locked{color:var(--gold);border-color:rgba(201,168,76,.22);background:rgba(201,168,76,.08)}
  .aov-pill.build{color:var(--ice);border-color:rgba(137,196,225,.22);background:rgba(137,196,225,.08)}
  .aov-progress{margin-top:10px;height:8px;border-radius:999px;overflow:hidden;background:rgba(255,255,255,.08)}
  .aov-fill{height:100%;border-radius:inherit;background:linear-gradient(90deg,rgba(201,168,76,.96),rgba(137,196,225,.88))}
  .aov-layer-meta{display:flex;justify-content:space-between;gap:8px;margin-top:8px;color:var(--text-dim);font-size:11px}
  .aov-layer-note,.aov-copy{margin-top:8px;font-size:12px;line-height:1.55;color:var(--text-dim)}
  .aov-feed{display:grid;gap:10px}
  .aov-item{width:100%;text-align:left;padding:14px;border-radius:16px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);color:var(--text)}
  .aov-item.active{border-color:rgba(45,212,160,.26);background:rgba(45,212,160,.08)}
  .aov-item.completed{opacity:.88}
  .aov-item.loop{cursor:default}
  .aov-item-top{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:8px}
  .aov-item-title{font-size:14px;font-weight:700}
  .aov-time{font-family:'Space Mono',monospace;font-size:10px;color:var(--text-dim);white-space:nowrap}
  .aov-meta{margin-top:10px;display:flex;gap:8px;flex-wrap:wrap}
  .aov-chip{display:inline-flex;align-items:center;padding:4px 8px;border-radius:999px;border:1px solid rgba(201,168,76,.18);background:rgba(201,168,76,.08);color:var(--gold);font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.06em;text-transform:uppercase}
  .aov-actions-list{display:grid;gap:10px}
  .aov-row{display:grid;grid-template-columns:112px minmax(0,1fr);gap:12px;align-items:start;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.06)}
  .aov-row:last-child{padding-bottom:0;border-bottom:none}
  .aov-date{font-family:'Space Mono',monospace;font-size:11px;color:var(--text-dim)}
  .aov-empty{padding:20px;border-radius:18px;border:1px dashed rgba(255,255,255,.14);color:var(--text-dim);background:rgba(255,255,255,.02)}
  .aov-btn,.aov-link{display:inline-flex;align-items:center;justify-content:center;min-height:36px;padding:0 14px;border-radius:999px;border:1px solid rgba(201,168,76,.22);background:rgba(201,168,76,.08);color:var(--gold);font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;cursor:pointer}
  .aov-btn.ghost,.aov-link.ghost{border-color:rgba(255,255,255,.1);background:rgba(255,255,255,.03);color:var(--text-dim)}
  .aov-modal-back{position:fixed;inset:0;z-index:80;display:grid;place-items:center;padding:24px;background:rgba(3,6,11,.72);backdrop-filter:blur(8px)}
  .aov-modal{width:min(720px,100%);border-radius:24px;border:1px solid rgba(201,168,76,.18);background:linear-gradient(180deg,rgba(17,27,39,.98),rgba(10,17,27,.98));box-shadow:0 32px 80px rgba(0,0,0,.42);overflow:hidden}
  .aov-modal-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:22px 22px 16px;border-bottom:1px solid rgba(255,255,255,.06)}
  .aov-modal-title{margin:0;font-family:'Cormorant Garamond',serif;font-size:34px;color:#f4f0df}
  .aov-modal-sub{margin-top:8px;color:var(--text-dim);line-height:1.55;font-size:14px}
  .aov-close{width:40px;height:40px;border-radius:999px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);color:var(--text);cursor:pointer}
  .aov-modal-body{padding:18px 22px 22px}
  .aov-checks{display:grid;gap:12px}
  .aov-check{display:flex;gap:12px;align-items:flex-start;padding:14px;border-radius:16px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03)}
  .aov-state{width:30px;height:30px;border-radius:999px;display:grid;place-items:center;flex-shrink:0;font-size:14px;background:rgba(255,255,255,.06)}
  .aov-state.done{color:var(--green);background:rgba(45,212,160,.1)} .aov-state.attention{color:var(--gold);background:rgba(201,168,76,.1)} .aov-state.blocked{color:#ffbbb4;background:rgba(224,90,78,.1)}
  .aov-check-copy{font-size:14px;line-height:1.55} .aov-check-copy small{display:block;margin-top:4px;color:var(--text-dim)}
  .aov-layer-supervisor{margin-top:10px;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--ice)}
  .aov-chart-wrap{height:260px}
  .aov-chart-note{margin-top:10px;font-size:12px;line-height:1.6;color:var(--text-dim)}
  .aov-attribution{display:grid;gap:10px;margin-top:14px}
  .aov-attribution-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:10px;align-items:center;padding:10px 12px;border-radius:14px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03)}
  .aov-attribution-name{font-size:13px;font-weight:700;color:var(--text)}
  .aov-attribution-share{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-dim)}
  .aov-attribution-value{font-family:'Cormorant Garamond',serif;font-size:24px;line-height:1;color:var(--text)}
  .aov-load{display:grid;gap:18px;padding:24px} .aov-skel{min-height:120px;border-radius:22px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(90deg,rgba(255,255,255,.04),rgba(255,255,255,.08),rgba(255,255,255,.04));background-size:180% 100%;animation:aov-shimmer 1.4s linear infinite}
  @keyframes aov-shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}
  @keyframes aov-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
  @media(max-width:1400px){.aov-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}}
  @media(max-width:1100px){.aov-grid{grid-template-columns:1fr}.aov-layers{grid-template-columns:repeat(3,minmax(0,1fr))}}
  @media(max-width:900px){.db-sidebar{display:none}.aov-layers{grid-template-columns:repeat(2,minmax(0,1fr))}.aov-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}.db-header{padding:0 16px}}
  @media(max-width:580px){.aov-kpis{grid-template-columns:1fr}.aov-layers{grid-template-columns:1fr}.aov-row{grid-template-columns:1fr;gap:4px}}
`;

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: value >= 1000 ? 0 : 2 }).format(value);
}

function pct(value: number) {
  if (value > 0) return `+${value}%`;
  if (value < 0) return `${value}%`;
  return "0%";
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${`${d.getMonth() + 1}`.padStart(2, "0")}-${`${d.getDate()}`.padStart(2, "0")}`;
}

function relativeTime(value: string) {
  const date = new Date(value);
  const diffMs = date.getTime() - Date.now();
  const abs = Math.abs(diffMs);
  const fmt = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (abs < 60 * 1000) return fmt.format(Math.round(diffMs / 1000), "second");
  if (abs < 60 * 60 * 1000) return fmt.format(Math.round(diffMs / (60 * 1000)), "minute");
  if (abs < 24 * 60 * 60 * 1000) return fmt.format(Math.round(diffMs / (60 * 60 * 1000)), "hour");
  return fmt.format(Math.round(diffMs / (24 * 60 * 60 * 1000)), "day");
}

function actionDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((today - target) / 86400000);
  if (diffDays === 0) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Yesterday";
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

const FORGE_BRIEFING_CADENCE = "Today, 06:00 UTC";

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: getAuthHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { message?: string; error?: string }).message ?? (body as { error?: string }).error ?? `Request failed (${res.status})`);
  return body as T;
}

const NAV_ITEMS = [
  { icon: "📊", label: "Overview",           path: "/dashboard",       end: true  },
  { icon: "🚀", label: "Platform Control",   path: "/admin/platform",  end: false },
  { icon: "👥", label: "Tenants",            path: "/admin/tenants",   end: false },
  { icon: "👤", label: "Users",              path: "/admin/users",     end: false },
  { icon: "💰", label: "Revenue",            path: "/admin/revenue",   end: false },
  { icon: "🧠", label: "FORGE Intelligence", path: "/admin/forge",     end: false },
  { icon: "❤️", label: "System Health",      path: "/admin/health",    end: false },
  { icon: "📢", label: "Broadcast",          path: "/admin/broadcast", end: false },
  { icon: "🔐", label: "Security",           path: "/admin/security",  end: false },
];

const LAYER_CHROME: Record<string, { icon: string; supervisor: string }> = {
  "Core Engine": { icon: "⬡", supervisor: "FORGE" },
  "Community": { icon: "👥", supervisor: "NOVA" },
  "Academy": { icon: "🎓", supervisor: "SAGE" },
  "Intelligence": { icon: "🤖", supervisor: "OMEGA" },
  "Market": { icon: "🛒", supervisor: "ATLAS" },
  "Work": { icon: "💼", supervisor: "CIRCUIT" },
  "Mobile": { icon: "📱", supervisor: "HERALD" },
  "Cloud": { icon: "☁️", supervisor: "NEXUS" },
  "AI Platform": { icon: "🧬", supervisor: "HERALD" },
};

function layerChrome(name: string) {
  return LAYER_CHROME[name] ?? { icon: "⬡", supervisor: "OMEGA" };
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [dayKey, setDayKey] = useState(todayKey());
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [loops, setLoops] = useState<LoopFeedResponse | null>(null);
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdownResponse | null>(null);
  const [adminActivity, setAdminActivity] = useState<AdminActivityEntry[]>([]);
  const [signals, setSignals] = useState<AdminSignal[]>([]);
  const [briefing, setBriefing] = useState("");
  const [briefingStreaming, setBriefingStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const [checklist, setChecklist] = useState<{ layerName: string; loading: boolean; data: ChecklistResponse | null } | null>(null);

  const { hasAccess, isChecking } = useSuperAdminAccess();

  const dismissKey = useMemo(() => `admin-overview-briefing-dismissed-${dayKey}`, [dayKey]);
  const loopFeed = useMemo(() => (loops ? [...loops.active, ...loops.completed] : []), [loops]);
  const activityFeed = useMemo(
    () =>
      adminActivity.length
        ? adminActivity.slice(0, 20).map((entry) => ({
            id: entry.id,
            summary: entry.summary ?? entry.action ?? "Admin action recorded",
            createdAt: entry.createdAt,
          }))
        : overview?.recentActions ?? [],
    [adminActivity, overview],
  );
  const revenueSeries = useMemo(() => {
    if (!revenueBreakdown?.chart.series?.length || !revenueBreakdown.layers.length) return [];
    const share = Object.fromEntries(
      revenueBreakdown.layers.map((layer) => [layer.id, Math.max(layer.sharePct, 0) / 100]),
    );

    return revenueBreakdown.chart.series.map((entry) => {
      const actual = entry.actual ?? 0;
      return {
        label: entry.label,
        core: actual * (share.core ?? 0),
        community: actual * (share.community ?? 0),
        academy: actual * (share.academy ?? 0),
        market: actual * (share.market ?? 0),
        work: actual * (share.work ?? 0),
        cloud: actual * (share.cloud ?? 0),
      };
    });
  }, [revenueBreakdown]);

  useEffect(() => {
    if (!isChecking && !hasAccess) {
      navigate("/home", { replace: true });
    }
  }, [hasAccess, isChecking, navigate]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const next = todayKey();
      setDayKey((current) => (current === next ? current : next));
    }, 60000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setDismissed(localStorage.getItem(dismissKey) === "1");
  }, [dismissKey]);

  useEffect(() => {
    let cancelled = false;
    async function load(initial = false) {
      try {
        if (initial) setLoading(true); else setRefreshing(true);
        const [overviewData, loopsData, revenueData, actionsData] = await Promise.all([
          apiGet<OverviewResponse>("/admin/overview"),
          apiGet<LoopFeedResponse>("/admin/loops/live"),
          apiGet<RevenueBreakdownResponse>("/admin/revenue/breakdown"),
          apiGet<AdminActivityEntry[]>("/admin/actions"),
        ]);
        if (cancelled) return;
        setOverview(overviewData);
        setLoops(loopsData);
        setRevenueBreakdown(revenueData);
        setAdminActivity(actionsData);
        setSignals(overviewData.signals);
        setError("");
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load admin overview");
      } finally {
        if (!cancelled) { setLoading(false); setRefreshing(false); }
      }
    }
    void load(true);
    const id = window.setInterval(() => { void load(false); }, 30000);
    return () => { cancelled = true; window.clearInterval(id); };
  }, []);

  useEffect(() => {
    if (dismissed) return;
    const controller = new AbortController();
    let active = true;
    async function streamBriefing() {
      try {
        setBriefing("");
        setBriefingStreaming(true);
        const res = await fetch(`${API_BASE}/admin/forge/briefing`, { method: "POST", headers: { Accept: "text/event-stream", ...getAuthHeaders() }, signal: controller.signal });
        if (!res.ok || !res.body) throw new Error("Failed to load FORGE briefing");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (active) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const raw = line.slice(6).trim();
            if (raw === "[DONE]") { setBriefingStreaming(false); return; }
            try {
              const parsed = JSON.parse(raw) as { token?: string };
              if (parsed.token) setBriefing((current) => current + parsed.token);
            } catch {}
          }
        }
      } catch (err) {
        if (active) setError((current) => current || (err instanceof Error ? err.message : "Failed to load briefing"));
      } finally {
        if (active) setBriefingStreaming(false);
      }
    }
    void streamBriefing();
    return () => { active = false; controller.abort(); };
  }, [dismissed]);

  useEffect(() => {
    if (!token) return;
    const url = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws?token=${token}`;
    const socket = new WebSocket(url);
    socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as { event?: string; signal?: AdminSignal };
        if (parsed.event !== "admin:ecosystem-signal" || !parsed.signal) return;
        startTransition(() => {
          setSignals((current) => [parsed.signal!, ...current.filter((item) => item.id !== parsed.signal!.id)].slice(0, 5));
        });
      } catch {}
    };
    return () => socket.close();
  }, [token]);

  async function refresh() {
    try {
      setRefreshing(true);
      const [overviewData, loopsData, revenueData, actionsData] = await Promise.all([
        apiGet<OverviewResponse>("/admin/overview"),
        apiGet<LoopFeedResponse>("/admin/loops/live"),
        apiGet<RevenueBreakdownResponse>("/admin/revenue/breakdown"),
        apiGet<AdminActivityEntry[]>("/admin/actions"),
      ]);
      setOverview(overviewData);
      setLoops(loopsData);
      setRevenueBreakdown(revenueData);
      setAdminActivity(actionsData);
      setSignals(overviewData.signals);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to refresh admin overview");
    } finally {
      setRefreshing(false);
    }
  }

  async function openChecklist(layer: OverviewLayer) {
    setChecklist({ layerName: layer.name, loading: true, data: null });
    try {
      const res = await fetch(`${API_BASE}/admin/platform/${layer.id}/checklist`, { method: "POST", headers: getAuthHeaders() });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((body as { message?: string; error?: string }).message ?? (body as { error?: string }).error ?? "Failed to load checklist");
      setChecklist({ layerName: layer.name, loading: false, data: body as ChecklistResponse });
    } catch (err) {
      setChecklist({
        layerName: layer.name,
        loading: false,
        data: { layerName: layer.name, isReady: false, checklist: [{ item: err instanceof Error ? err.message : "Unable to load checklist", status: "blocked", required: true }] },
      });
    }
  }

  function handleLayer(layer: OverviewLayer) {
    if (layer.status === "locked") { void openChecklist(layer); return; }
    if (!layer.adminPath) return;
    navigate(layer.adminPath);
  }

  function dismissBriefing() {
    localStorage.setItem(dismissKey, "1");
    setDismissed(true);
  }

  if (isChecking) {
    return <div className="db-root"><style>{css}</style></div>;
  }

  if (loading && !overview) {
    return (
      <div className="db-root">
        <style>{css}</style>
        <div className="aov-load">
          <div className="aov-skel" />
          <div className="aov-skel" />
          <div className="aov-skel" />
        </div>
      </div>
    );
  }

  const nextLocked = overview?.layers.find((layer) => layer.status === "locked") ?? null;

  return (
    <div className="db-root">
      <style>{css}</style>

      {checklist ? (
        <div className="aov-modal-back" onClick={() => setChecklist(null)}>
          <div className="aov-modal" onClick={(e) => e.stopPropagation()}>
            <div className="aov-modal-head">
              <div>
                <div className="aov-kicker">Pre-Activation Checklist</div>
                <h2 className="aov-modal-title">{checklist.layerName}</h2>
                <div className="aov-modal-sub">
                  {checklist.loading
                    ? "Pulling the latest activation blockers."
                    : checklist.data?.isReady
                    ? "This layer is clear to activate for users."
                    : "This layer still has required checks to resolve before activation."}
                </div>
              </div>
              <button className="aov-close" onClick={() => setChecklist(null)} aria-label="Close checklist">×</button>
            </div>
            <div className="aov-modal-body">
              {checklist.loading ? (
                <div className="aov-empty">Loading checklist...</div>
              ) : (
                <div className="aov-checks">
                  {checklist.data?.checklist.map((item) => (
                    <div key={item.item} className="aov-check">
                      <div className={`aov-state ${item.status}`}>
                        {item.status === "done" ? "✓" : item.status === "attention" ? "!" : "✕"}
                      </div>
                      <div className="aov-check-copy">
                        {item.item}
                        <small>{item.required ? "Required for activation" : "Recommended before activation"}</small>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      {/* ─── Sticky Header ───────────────────────────────────────────────────── */}
      <header className="db-header">
        <div className="db-brand">
          <span className="db-hex">⬡</span>
          <span className="db-brand-name">Winners</span>
          <span className="db-sep">|</span>
          <span className="db-page-title">Admin Dashboard</span>
        </div>
        <div className="db-header-right">
          <button className="db-forge-btn" onClick={() => navigate("/admin/forge")}>
            🧠 FORGE AI
          </button>
          <NotificationBell />
          <ThemeToggle />
          <div className="db-user-pill">
            👤 {user?.name ?? user?.email ?? "Admin"}
          </div>
          <span className="db-badge">SUPERADMIN</span>
        </div>
      </header>

      {/* ─── Body: Sidebar + Main ────────────────────────────────────────────── */}
      <div className="db-body">

        {/* Left Sidebar */}
        <nav className="db-sidebar">
          <div className="db-nav">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) => `db-nav-item${isActive ? " active" : ""}`}
              >
                <span className="db-nav-icon">{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="db-divider" />

          <div className="db-eco">
            <div className="db-eco-title">Ecosystem Status</div>
            <div className="db-eco-row">
              <span>Layers</span>
              <span className="db-eco-val">{overview?.kpis.liveLayers ?? 0}/9 live</span>
            </div>
            <div className="db-eco-row">
              <span>MRR</span>
              <span className="db-eco-val">{overview ? money(overview.kpis.mrr) : "—"}</span>
            </div>
            <div className="db-eco-row">
              <span>Users</span>
              <span className="db-eco-val">{overview?.kpis.users.toLocaleString() ?? "—"}</span>
            </div>
            <div className="db-eco-row">
              <span>System</span>
              <span className="db-eco-val">
                {overview?.kpis.healthTone === "ok" ? "✅ All OK" : "⚠️ Watch"}
              </span>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="db-main">
          <div className="aov">
            {error ? <div className="aov-error">{error}</div> : null}

            <FourDocumentsBlueprint current="admin-dashboard" adminEnabled />
            {/* FORGE Morning Briefing */}
            <ForgeIntelligencePanel
              briefing={briefing}
              briefingStreaming={briefingStreaming}
              cadenceLabel={FORGE_BRIEFING_CADENCE}
              dismissed={dismissed}
              onDismiss={dismissBriefing}
              onSchedule={() => navigate("/admin/broadcast")}
            />

            {overview ? (
              <>
                <AdminKPIRow kpis={overview.kpis} money={money} pct={pct} />

                <section className="aov-grid">
                  <div className="aov-stack">

                    <PlatformStatusGrid
                      layers={overview.layers}
                      nextLocked={nextLocked}
                      onReviewNext={() => nextLocked && void openChecklist(nextLocked)}
                      onSelectLayer={handleLayer}
                      getLayerChrome={layerChrome}
                    />

                    <BroadcastComposer
                      loopFeed={loopFeed}
                      refreshing={refreshing}
                      onRefresh={() => void refresh()}
                      relativeTime={relativeTime}
                      money={money}
                    />
                  </div>

                  <div className="aov-stack">
                    <RevenueBreakdownChart
                      revenueSeries={revenueSeries}
                      note={revenueBreakdown?.note}
                      layers={revenueBreakdown?.layers ?? []}
                      money={money}
                    />

                    <SystemHealthPanel
                      signals={signals}
                      relativeTime={relativeTime}
                      onOpenSignal={(path) => navigate(path)}
                    />

                    <SecurityAuditPanel activityFeed={activityFeed} actionDate={actionDate} />
                  </div>
                </section>
              </>
            ) : (
              <div className="aov-empty">The admin overview is unavailable right now.</div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
