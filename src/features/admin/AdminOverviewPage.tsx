import { startTransition, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE } from "../../lib/api";
import { getAuthHeaders, useAuthStore } from "../auth/authStore";

type HealthTone = "ok" | "attention";
type LayerStatus = "live" | "locked";
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
  adminPath: string;
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

type ChecklistResponse = {
  layerName: string;
  isReady: boolean;
  checklist: Array<{ item: string; status: ChecklistState; required: boolean }>;
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Syne:wght@400;500;700;800&display=swap');
  .aov{max-width:1320px;margin:0 auto;padding:28px 22px 92px;color:var(--text);font-family:'Syne',sans-serif}
  .aov-shell{border:1px solid rgba(201,168,76,.18);border-radius:28px;overflow:hidden;background:radial-gradient(circle at top right,rgba(201,168,76,.12),transparent 36%),linear-gradient(180deg,rgba(9,17,29,.98),rgba(12,22,36,.96));box-shadow:0 24px 80px rgba(0,0,0,.28)}
  .aov-top{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:16px 22px;border-bottom:1px solid rgba(201,168,76,.16);background:rgba(7,14,24,.82)}
  .aov-brand{display:flex;align-items:center;gap:10px;min-width:0}
  .aov-mark{width:34px;height:34px;border-radius:12px;display:grid;place-items:center;font-size:17px;color:var(--gold);border:1px solid rgba(201,168,76,.28);background:linear-gradient(180deg,rgba(201,168,76,.16),rgba(201,168,76,.04));flex-shrink:0}
  .aov-line{font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:rgba(232,238,245,.86);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .aov-line strong{color:var(--gold)}
  .aov-sub{margin-top:4px;color:var(--text-dim);font-size:13px}
  .aov-actions{display:flex;gap:10px;flex-wrap:wrap}
  .aov-btn,.aov-link{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 16px;border-radius:999px;border:1px solid rgba(201,168,76,.22);background:rgba(201,168,76,.08);color:var(--gold);font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;cursor:pointer}
  .aov-btn.ghost,.aov-link.ghost{border-color:var(--border);background:rgba(255,255,255,.03);color:var(--text-dim)}
  .aov-body{padding:24px}
  .aov-error{margin-bottom:16px;padding:14px 16px;border-radius:16px;border:1px solid rgba(224,90,78,.28);color:#ffcbc5;background:rgba(224,90,78,.08)}
  .aov-brief{margin-bottom:20px;padding:20px 22px;border-radius:22px;border:1px solid rgba(201,168,76,.18);border-left:6px solid var(--gold);background:radial-gradient(circle at left center,rgba(201,168,76,.12),transparent 30%),linear-gradient(135deg,rgba(20,28,40,.96),rgba(13,22,35,.98))}
  .aov-kicker{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin-bottom:8px}
  .aov-brief-copy{font-family:'Cormorant Garamond',serif;font-size:clamp(26px,2.6vw,38px);line-height:1.12;color:#f4f0df;min-height:112px}
  .aov-cursor{display:inline-block;width:8px;height:1em;margin-left:6px;background:var(--gold);vertical-align:-.08em;animation:aov-blink 1s steps(1) infinite}
  .aov-brief-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
  .aov-kpis{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px;margin-bottom:18px}
  .aov-kpi,.aov-panel{padding:18px;border-radius:22px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(18,28,40,.92),rgba(11,18,28,.92))}
  .aov-kpi-label{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);margin-bottom:12px}
  .aov-kpi-value{font-family:'Cormorant Garamond',serif;font-size:38px;line-height:1;color:var(--text)}
  .aov-kpi-sub{margin-top:10px;font-size:13px;color:var(--text-dim)}
  .aov-positive{color:var(--green)} .aov-attention{color:var(--gold)}
  .aov-dot{display:inline-flex;width:10px;height:10px;border-radius:999px;margin-right:7px;background:var(--green);box-shadow:0 0 12px rgba(45,212,160,.34)}
  .aov-dot.attention{background:var(--gold);box-shadow:0 0 12px rgba(201,168,76,.32)}
  .aov-grid{display:grid;grid-template-columns:minmax(0,1.24fr) minmax(320px,.88fr);gap:18px}
  .aov-stack{display:grid;gap:18px}
  .aov-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:16px}
  .aov-title{margin:0;font-size:18px;font-weight:800;color:var(--text)}
  .aov-mini-link{color:var(--gold);font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.06em;text-transform:uppercase;background:transparent;border:none;padding:0;cursor:pointer}
  .aov-layers{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
  .aov-layer{padding:16px;border-radius:18px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);cursor:pointer;text-align:left}
  .aov-layer:hover{border-color:rgba(201,168,76,.26);background:rgba(255,255,255,.045)}
  .aov-layer-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:10px}
  .aov-layer-name{margin:0;font-size:17px;font-weight:800}
  .aov-pill{display:inline-flex;align-items:center;border-radius:999px;padding:6px 10px;font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.1em;text-transform:uppercase;border:1px solid rgba(255,255,255,.08)}
  .aov-pill.live{color:var(--green);border-color:rgba(45,212,160,.22);background:rgba(45,212,160,.08)}
  .aov-pill.locked{color:var(--gold);border-color:rgba(201,168,76,.22);background:rgba(201,168,76,.08)}
  .aov-progress{margin-top:12px;height:10px;border-radius:999px;overflow:hidden;background:rgba(255,255,255,.08)}
  .aov-fill{height:100%;border-radius:inherit;background:linear-gradient(90deg,rgba(201,168,76,.96),rgba(137,196,225,.88))}
  .aov-layer-meta{display:flex;justify-content:space-between;gap:12px;margin-top:10px;color:var(--text-dim);font-size:12px}
  .aov-layer-note,.aov-copy{margin-top:10px;font-size:13px;line-height:1.55;color:var(--text-dim)}
  .aov-feed{display:grid;gap:12px}
  .aov-item{width:100%;text-align:left;padding:14px;border-radius:16px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);color:var(--text)}
  .aov-item.active{border-color:rgba(45,212,160,.26);background:rgba(45,212,160,.08)}
  .aov-item.completed{opacity:.88}
  .aov-item.loop{cursor:default}
  .aov-item-top{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:8px}
  .aov-item-title{font-size:14px;font-weight:700}
  .aov-time{font-family:'Space Mono',monospace;font-size:10px;color:var(--text-dim);white-space:nowrap}
  .aov-meta{margin-top:10px;display:flex;gap:8px;flex-wrap:wrap}
  .aov-chip{display:inline-flex;align-items:center;padding:4px 8px;border-radius:999px;border:1px solid rgba(201,168,76,.18);background:rgba(201,168,76,.08);color:var(--gold);font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.06em;text-transform:uppercase}
  .aov-actions-list{display:grid;gap:12px}
  .aov-row{display:grid;grid-template-columns:112px minmax(0,1fr);gap:12px;align-items:start;padding-bottom:12px;border-bottom:1px solid rgba(255,255,255,.06)}
  .aov-row:last-child{padding-bottom:0;border-bottom:none}
  .aov-date{font-family:'Space Mono',monospace;font-size:11px;color:var(--text-dim)}
  .aov-empty{padding:20px;border-radius:18px;border:1px dashed rgba(255,255,255,.14);color:var(--text-dim);background:rgba(255,255,255,.02)}
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
  .aov-load{display:grid;gap:18px} .aov-skel{min-height:120px;border-radius:22px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(90deg,rgba(255,255,255,.04),rgba(255,255,255,.08),rgba(255,255,255,.04));background-size:180% 100%;animation:aov-shimmer 1.4s linear infinite}
  @keyframes aov-shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}
  @keyframes aov-blink{0%,49%{opacity:1}50%,100%{opacity:0}}
  @media (max-width:1180px){.aov-kpis{grid-template-columns:repeat(3,minmax(0,1fr))}.aov-grid{grid-template-columns:1fr}}
  @media (max-width:820px){.aov-body{padding:16px}.aov-top{padding:14px 16px;align-items:flex-start;flex-direction:column}.aov-kpis,.aov-layers{grid-template-columns:1fr}.aov-brief-copy{min-height:0;font-size:30px}.aov-row{grid-template-columns:1fr;gap:6px}}
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

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: getAuthHeaders() });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((body as { message?: string; error?: string }).message ?? (body as { error?: string }).error ?? `Request failed (${res.status})`);
  return body as T;
}

export default function AdminOverviewPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const [dayKey, setDayKey] = useState(todayKey());
  const [overview, setOverview] = useState<OverviewResponse | null>(null);
  const [loops, setLoops] = useState<LoopFeedResponse | null>(null);
  const [signals, setSignals] = useState<AdminSignal[]>([]);
  const [briefing, setBriefing] = useState("");
  const [briefingStreaming, setBriefingStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const [checklist, setChecklist] = useState<{ layerName: string; loading: boolean; data: ChecklistResponse | null } | null>(null);

  const dismissKey = useMemo(() => `admin-overview-briefing-dismissed-${dayKey}`, [dayKey]);
  const loopFeed = useMemo(() => (loops ? [...loops.active, ...loops.completed] : []), [loops]);

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
        const [overviewData, loopsData] = await Promise.all([apiGet<OverviewResponse>("/admin/overview"), apiGet<LoopFeedResponse>("/admin/loops/live")]);
        if (cancelled) return;
        setOverview(overviewData);
        setLoops(loopsData);
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
      const [overviewData, loopsData] = await Promise.all([apiGet<OverviewResponse>("/admin/overview"), apiGet<LoopFeedResponse>("/admin/loops/live")]);
      setOverview(overviewData);
      setLoops(loopsData);
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
    navigate(layer.adminPath);
  }

  function dismissBriefing() {
    localStorage.setItem(dismissKey, "1");
    setDismissed(true);
  }

  if (loading && !overview) {
    return <div className="aov"><style>{css}</style><div className="aov-load"><div className="aov-skel" /><div className="aov-skel" /><div className="aov-skel" /></div></div>;
  }

  const nextLocked = overview?.layers.find((layer) => layer.status === "locked") ?? null;

  return (
    <div className="aov">
      <style>{css}</style>

      {checklist ? (
        <div className="aov-modal-back" onClick={() => setChecklist(null)}>
          <div className="aov-modal" onClick={(e) => e.stopPropagation()}>
            <div className="aov-modal-head">
              <div>
                <div className="aov-kicker">Pre-Launch Checklist</div>
                <h2 className="aov-modal-title">{checklist.layerName}</h2>
                <div className="aov-modal-sub">{checklist.loading ? "Pulling the latest launch blockers." : checklist.data?.isReady ? "This layer is clear for launch." : "This layer still has required checks to resolve before launch."}</div>
              </div>
              <button className="aov-close" onClick={() => setChecklist(null)} aria-label="Close checklist">x</button>
            </div>
            <div className="aov-modal-body">
              {checklist.loading ? (
                <div className="aov-empty">Loading checklist...</div>
              ) : (
                <div className="aov-checks">
                  {checklist.data?.checklist.map((item) => (
                    <div key={item.item} className="aov-check">
                      <div className={`aov-state ${item.status}`}>{item.status === "done" ? "OK" : item.status === "attention" ? "!" : "X"}</div>
                      <div className="aov-check-copy">{item.item}<small>{item.required ? "Required for launch" : "Recommended before launch"}</small></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="aov-shell">
        <div className="aov-top">
          <div className="aov-brand">
            <div className="aov-mark">+</div>
            <div>
              <div className="aov-line"><strong>Core Engine</strong> | Overview · Platform · Tenants · Users · Revenue · FORGE</div>
              <div className="aov-sub">Supervisor: FORGE (core engine) + OMEGA (cross-layer orchestrator)</div>
            </div>
          </div>
          <div className="aov-actions">
            <button className="aov-btn ghost" onClick={() => void refresh()} disabled={refreshing}>{refreshing ? "Refreshing" : "Refresh"}</button>
            <Link className="aov-link" to="/admin/platform">Platform Matrix</Link>
          </div>
        </div>

        <div className="aov-body">
          {error ? <div className="aov-error">{error}</div> : null}

          {!dismissed ? (
            <section className="aov-brief">
              <div className="aov-kicker">FORGE Morning Briefing</div>
              <div className="aov-brief-copy">"{briefing || "Preparing the sovereign daily briefing..."}"{briefingStreaming ? <span className="aov-cursor" /> : null}</div>
              <div className="aov-brief-actions">
                <Link className="aov-link" to="/admin/forge">Full Briefing</Link>
                <button className="aov-btn ghost" onClick={dismissBriefing}>Dismiss</button>
              </div>
            </section>
          ) : null}

          {overview ? (
            <>
              <section className="aov-kpis">
                <div className="aov-kpi"><div className="aov-kpi-label">MRR</div><div className="aov-kpi-value">{money(overview.kpis.mrr)}</div><div className={`aov-kpi-sub ${overview.kpis.mrrDeltaPct >= 0 ? "aov-positive" : "aov-attention"}`}>{pct(overview.kpis.mrrDeltaPct)} vs previous 30 days</div></div>
                <div className="aov-kpi"><div className="aov-kpi-label">Users</div><div className="aov-kpi-value">{overview.kpis.users.toLocaleString()}</div><div className="aov-kpi-sub">{overview.kpis.activeUsers.toLocaleString()} active in the last 30 days</div></div>
                <div className="aov-kpi"><div className="aov-kpi-label">Layers</div><div className="aov-kpi-value">{overview.kpis.liveLayers} live</div><div className="aov-kpi-sub">{overview.kpis.lockedLayers} locked for launch</div></div>
                <div className="aov-kpi"><div className="aov-kpi-label">Loops</div><div className="aov-kpi-value">{overview.kpis.loopsToday}</div><div className={`aov-kpi-sub ${overview.kpis.loopsDeltaPct >= 0 ? "aov-positive" : "aov-attention"}`}>{pct(overview.kpis.loopsDeltaPct)} vs yesterday</div></div>
                <div className="aov-kpi"><div className="aov-kpi-label">Health</div><div className="aov-kpi-value" style={{ fontSize: "30px" }}><span className={`aov-dot ${overview.kpis.healthTone === "attention" ? "attention" : ""}`} />{overview.kpis.healthTone === "ok" ? "All OK" : "Watch"}</div><div className="aov-kpi-sub">{overview.kpis.healthLabel}</div></div>
              </section>

              <section className="aov-grid">
                <div className="aov-stack">
                  <div className="aov-panel">
                    <div className="aov-head">
                      <div><div className="aov-kicker">Layer Status Grid</div><h2 className="aov-title">Eight-layer launch matrix</h2></div>
                      {nextLocked ? <button className="aov-mini-link" onClick={() => void openChecklist(nextLocked)}>Launch Next Layer</button> : null}
                    </div>
                    <div className="aov-layers">
                      {overview.layers.map((layer) => (
                        <button key={layer.id} type="button" className="aov-layer" onClick={() => handleLayer(layer)}>
                          <div className="aov-layer-head">
                            <div><h3 className="aov-layer-name">{layer.name}</h3></div>
                            <span className={`aov-pill ${layer.status}`}>{layer.statusLabel}</span>
                          </div>
                          <div className="aov-progress"><div className="aov-fill" style={{ width: `${layer.progress}%` }} /></div>
                          <div className="aov-layer-meta"><span>{layer.progress}%</span><span>{layer.actionLabel}</span></div>
                          <div className="aov-layer-note">{layer.note}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="aov-panel">
                    <div className="aov-head"><div><div className="aov-kicker">Agentic Loop Live Feed</div><h2 className="aov-title">Active loops first, completed loops below</h2></div></div>
                    {loopFeed.length === 0 ? <div className="aov-empty">No live loop activity is available yet.</div> : (
                      <div className="aov-feed">
                        {loopFeed.map((entry) => (
                          <div key={entry.id} className={`aov-item loop ${entry.status}`}>
                            <div className="aov-item-top"><div className="aov-item-title">{entry.status === "active" ? "[LIVE]" : "[DONE]"} {entry.userName}</div><div className="aov-time">{relativeTime(entry.updatedAt)}</div></div>
                            <div className="aov-copy">{entry.summary}</div>
                            <div className="aov-meta"><span className="aov-chip">{entry.stageLabel}</span><span className="aov-chip">{entry.tenantName}</span>{entry.revenueImpact > 0 ? <span className="aov-chip">{money(entry.revenueImpact)} unlocked</span> : null}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="aov-stack">
                  <div className="aov-panel">
                    <div className="aov-head"><div><div className="aov-kicker">OMEGA Cross-Layer Signals</div><h2 className="aov-title">Last five supervisor handoffs</h2></div></div>
                    {signals.length === 0 ? <div className="aov-empty">No ecosystem signals have fired yet.</div> : (
                      <div className="aov-feed">
                        {signals.map((signal) => (
                          <button key={signal.id} type="button" className="aov-item" onClick={() => navigate(signal.adminPath)}>
                            <div className="aov-item-top"><div className="aov-item-title">{signal.supervisorEmoji}</div><div className="aov-time">{relativeTime(signal.createdAt)}</div></div>
                            <div className="aov-copy"><strong style={{ color: "var(--text)" }}>{signal.title}</strong><div style={{ marginTop: 6 }}>{signal.message}</div></div>
                            <div className="aov-meta"><span className="aov-chip">{signal.layerName}</span><span className="aov-chip">{signal.supervisor}</span></div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="aov-panel">
                    <div className="aov-head"><div><div className="aov-kicker">Recent Admin Actions</div><h2 className="aov-title">Latest sovereign control events</h2></div></div>
                    {overview.recentActions.length === 0 ? <div className="aov-empty">No admin actions have been recorded yet.</div> : (
                      <div className="aov-actions-list">
                        {overview.recentActions.map((item) => (
                          <div key={item.id} className="aov-row"><div className="aov-date">{actionDate(item.createdAt)}</div><div>{item.summary}</div></div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </>
          ) : <div className="aov-empty">The admin overview is unavailable right now.</div>}
        </div>
      </div>
    </div>
  );
}
