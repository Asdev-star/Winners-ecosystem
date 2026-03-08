// src/features/activity/ActivityPage.tsx

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "../auth/authStore";
import { API_BASE } from "../../lib/api";
import AIInsightBanner from "../../components/ui/AIInsightBanner";
import AssistantPanel from "../../components/ui/AssistantPanel";
import ProgressRing from "../../components/ui/ProgressRing";
import CrossLayerHandoff from "../../components/ui/CrossLayerHandoff";
import { useAssistant } from "../../hooks/useAssistant";

const API = API_BASE;
const css = `
  .ac-root { padding: 24px 24px 80px; max-width: 960px; font-family: 'Syne', sans-serif; color: var(--text); }

  .ac-header { margin-bottom: 20px; }
  .ac-title   { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 4px; }
  .ac-title span { color: var(--gold); }
  .ac-subtitle { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }

  /* ── Ecosystem context bar ── */
  .ac-eco-bar {
    background: linear-gradient(135deg, rgba(43,95,142,0.08), rgba(201,168,76,0.04));
    border: 1px solid rgba(43,95,142,0.18); border-radius: 6px;
    padding: 10px 16px; margin-bottom: 18px;
    display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
  }
  .ac-eco-label { font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: var(--ice); flex-shrink: 0; }
  .ac-eco-chips { display: flex; gap: 6px; flex-wrap: wrap; }
  .ac-eco-chip {
    font-family: 'Space Mono', monospace; font-size: 8px; padding: 2px 9px;
    border-radius: 10px; border: 1px solid var(--border); color: var(--text-dim);
  }
  .ac-eco-chip.active { border-color: rgba(45,212,160,0.3); color: var(--green); background: rgba(45,212,160,0.05); }

  /* ── Tabs ── */
  .ac-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 16px; }
  .ac-tab {
    padding: 6px 14px; border-radius: 20px; border: 1px solid var(--border);
    background: transparent; color: var(--text-dim);
    font-family: 'Space Mono', monospace; font-size: 9px;
    cursor: pointer; transition: all 0.15s; text-transform: uppercase; letter-spacing: 0.5px;
  }
  .ac-tab:hover { border-color: var(--gold); color: var(--text); }
  .ac-tab.active { border-color: var(--gold); background: rgba(201,168,76,0.08); color: var(--gold); }

  /* ── Card ── */
  .ac-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 6px; overflow: hidden; margin-bottom: 16px;
  }
  .ac-card-header {
    padding: 14px 18px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .ac-card-title { font-size: 13px; font-weight: 700; }
  .ac-count { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); }

  /* ── Log rows ── */
  .ac-log-item {
    display: flex; align-items: flex-start; gap: 12px;
    padding: 12px 18px; border-bottom: 1px solid var(--border);
    transition: background 0.1s;
  }
  .ac-log-item:last-child { border-bottom: none; }
  .ac-log-item:hover { background: rgba(43,95,142,0.04); }

  .ac-icon {
    width: 32px; height: 32px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; flex-shrink: 0; margin-top: 1px;
  }
  .ac-icon.auth     { background: rgba(137,196,225,0.1); }
  .ac-icon.team     { background: rgba(45,212,160,0.1); }
  .ac-icon.billing  { background: rgba(201,168,76,0.1); }
  .ac-icon.export   { background: rgba(155,111,255,0.1); }
  .ac-icon.settings { background: rgba(201,168,76,0.08); }
  .ac-icon.stripe   { background: rgba(43,95,142,0.15); }

  .ac-log-body { flex: 1; min-width: 0; }
  .ac-log-action {
    font-size: 12px; font-weight: 600; color: var(--text); margin-bottom: 3px;
  }
  .ac-log-meta {
    font-family: 'Space Mono', monospace; font-size: 9px;
    color: var(--text-dim); display: flex; gap: 10px; flex-wrap: wrap; align-items: center;
  }
  .ac-log-time {
    font-family: 'Space Mono', monospace; font-size: 9px;
    color: var(--text-dim); white-space: nowrap; flex-shrink: 0;
  }

  .ac-cat-badge {
    display: inline-block; padding: 1px 7px; border-radius: 8px;
    font-family: 'Space Mono', monospace; font-size: 8px;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  .ac-cat-badge.auth     { background: rgba(137,196,225,0.1);  color: var(--ice); }
  .ac-cat-badge.team     { background: rgba(45,212,160,0.1);   color: var(--green); }
  .ac-cat-badge.billing  { background: rgba(201,168,76,0.1);   color: var(--gold); }
  .ac-cat-badge.export   { background: rgba(155,111,255,0.1);  color: var(--purple); }
  .ac-cat-badge.settings { background: rgba(201,168,76,0.08);  color: var(--gold); }
  .ac-cat-badge.stripe   { background: rgba(43,95,142,0.15);   color: var(--ice); }

  /* ── Empty ── */
  .ac-empty {
    padding: 48px; text-align: center;
    font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); line-height: 1.8;
  }

  /* ── Pagination ── */
  .ac-pagination {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 18px; border-top: 1px solid var(--border);
  }
  .ac-page-btn {
    padding: 6px 14px; border-radius: 4px; border: 1px solid var(--border);
    background: transparent; color: var(--text-dim);
    font-family: 'Space Mono', monospace; font-size: 9px; cursor: pointer; transition: all 0.15s;
  }
  .ac-page-btn:hover:not(:disabled) { border-color: var(--gold); color: var(--gold); }
  .ac-page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  .ac-clear-btn {
    padding: 5px 12px; border-radius: 4px; border: 1px solid rgba(224,90,78,0.3);
    background: transparent; color: rgba(224,90,78,0.7);
    font-family: 'Space Mono', monospace; font-size: 9px; cursor: pointer; transition: all 0.15s;
  }
  .ac-clear-btn:hover { border-color: var(--red); color: var(--red); }

  /* ── Skeleton ── */
  .ac-skeleton {
    height: 56px;
    background: linear-gradient(90deg, var(--surface2) 25%, var(--border) 50%, var(--surface2) 75%);
    background-size: 200% 100%; animation: ac-shimmer 1.2s infinite;
    border-bottom: 1px solid var(--border);
  }
  @keyframes ac-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  /* ── Stats row ── */
  .ac-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-bottom: 16px; }
  .ac-stat {
    background: var(--surface); border: 1px solid var(--border); border-radius: 6px;
    padding: 12px 16px; position: relative; overflow: hidden;
  }
  .ac-stat::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
  .ac-stat.gold::before   { background: var(--gold); }
  .ac-stat.green::before  { background: var(--green); }
  .ac-stat.blue::before   { background: var(--ice); }
  .ac-stat.purple::before { background: var(--purple); }
  .ac-stat-val { font-size: 20px; font-weight: 800; margin-bottom: 3px; }
  .ac-stat.gold .ac-stat-val   { color: var(--gold); }
  .ac-stat.green .ac-stat-val  { color: var(--green); }
  .ac-stat.blue .ac-stat-val   { color: var(--ice); }
  .ac-stat.purple .ac-stat-val { color: var(--purple); }
  .ac-stat-lbl { font-family: 'Space Mono', monospace; font-size: 8px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; }

  /* ── Responsive ── */
  @media (max-width: 700px) {
    .ac-root { padding: 14px 12px 80px; }
    .ac-stats { grid-template-columns: 1fr 1fr; gap: 8px; }
    .ac-log-meta { flex-direction: column; gap: 3px; }
    .ac-title { font-size: 18px; }
  }
  @media (max-width: 480px) {
    .ac-stats { grid-template-columns: 1fr 1fr; }
  }
`;

const CATEGORIES = [
  { id: "all",      label: "All",      icon: "📋" },
  { id: "auth",     label: "Auth",     icon: "🔐" },
  { id: "team",     label: "Team",     icon: "👥" },
  { id: "billing",  label: "Billing",  icon: "💳" },
  { id: "stripe",   label: "Stripe",   icon: "💰" },
  { id: "export",   label: "Exports",  icon: "📦" },
  { id: "settings", label: "Settings", icon: "⚙️" },
];

const CAT_ICONS: Record<string, string> = {
  auth: "🔐", team: "👥", billing: "💳", stripe: "💰", export: "📦", settings: "⚙️",
};

function timeAgo(date: string): string {
  const diff  = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)   return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

interface Log {
  id: string;
  action: string;
  category: string;
  userName?: string;
  userEmail?: string;
  ip?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export default function ActivityPage() {
  const token = useAuthStore((s) => s.token);
  const user  = useAuthStore((s) => s.user);

  const [logs, setLogs]         = useState<Log[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [pages, setPages]       = useState(1);
  const [category, setCategory] = useState("all");
  const [loading, setLoading]   = useState(true);
  const [clearing, setClearing] = useState(false);

  // Level 4 AI Assistant hook
  const { sendMessage, messages, isLoading: aiLoading } = useAssistant({
    supervisor: "ARIA",
    autoGreeting: true,
  });

  // Per-category counts derived from logs for stat cards
  const catCounts = logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.category] = (acc[l.category] ?? 0) + 1;
    return acc;
  }, {});

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (category !== "all") params.set("category", category);
      const res  = await fetch(`${API}/activity?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setLogs(data.logs ?? []);
      setTotal(data.total ?? 0);
      setPages(data.pages ?? 1);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [token, page, category]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleClear = async () => {
    if (!confirm("Clear all activity logs? This cannot be undone.")) return;
    setClearing(true);
    try {
      await fetch(`${API}/activity`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      setLogs([]); setTotal(0);
    } finally { setClearing(false); }
  };

  return (
    <>
      <style>{css}</style>
      <div className="ac-root">

        {/* Header */}
        <div className="ac-header">
          <h1 className="ac-title">Activity <span>Log</span></h1>
          <p className="ac-subtitle">Winners Ecosystem · Core Engine · Complete audit trail of workspace actions</p>
        </div>

        {/* Ecosystem context bar */}
        <div className="ac-eco-bar">
          <div className="ac-eco-label">Tracking Layer</div>
          <div className="ac-eco-chips">
            <div className="ac-eco-chip active">⬡ Core · Live</div>
            <div className="ac-eco-chip active">🧑‍🤝‍🧑 Community · Live</div>
            <div className="ac-eco-chip">🎓 Academy · Soon</div>
            <div className="ac-eco-chip">🛒 Market · Soon</div>
          </div>
        </div>

        {/* AI Components */}
        <AIInsightBanner page="dashboard" assistant="aria" />
        <AssistantPanel page="activity" assistant="aria" />
        <CrossLayerHandoff
          type="market"
          title="Explore the Market"
          subtitle="Discover products and services"
          details={<p>Browse the Winners Market to find tools, courses, and services to grow your business.</p>}
          actionLabel="Visit Market"
          actionHref="/market/dropshipping"
          loopStage={6}
        />

        {/* Stats */}
        <div className="ac-stats">
          <div className="ac-stat gold">
            <div className="ac-stat-val">{total}</div>
            <div className="ac-stat-lbl">Total Events</div>
          </div>
          <div className="ac-stat green">
            <div className="ac-stat-val">{catCounts["auth"] ?? 0}</div>
            <div className="ac-stat-lbl">Auth Events</div>
          </div>
          <div className="ac-stat blue">
            <div className="ac-stat-val">{catCounts["team"] ?? 0}</div>
            <div className="ac-stat-lbl">Team Events</div>
          </div>
          <div className="ac-stat purple">
            <div className="ac-stat-val">{(catCounts["billing"] ?? 0) + (catCounts["stripe"] ?? 0)}</div>
            <div className="ac-stat-lbl">Billing Events</div>
          </div>
        </div>

        {/* Category tabs */}
        <div className="ac-tabs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`ac-tab${category === cat.id ? " active" : ""}`}
              onClick={() => { setCategory(cat.id); setPage(1); }}
            >
              {cat.icon} {cat.label}
            </button>
          ))}
        </div>

        {/* Log list */}
        <div className="ac-card">
          <div className="ac-card-header">
            <span className="ac-card-title">
              {CATEGORIES.find((c) => c.id === category)?.icon}{" "}
              {CATEGORIES.find((c) => c.id === category)?.label} Activity
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span className="ac-count">{total} events</span>
              {user?.role === "owner" && total > 0 && (
                <button className="ac-clear-btn" onClick={handleClear} disabled={clearing}>
                  {clearing ? "Clearing..." : "🗑 Clear All"}
                </button>
              )}
            </div>
          </div>

          {loading
            ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="ac-skeleton" />)
            : logs.length === 0
              ? (
                <div className="ac-empty">
                  No activity logged yet.<br />
                  <span style={{ fontSize: 9 }}>Events will appear here as your team uses the ecosystem.</span>
                </div>
              )
              : logs.map((log) => (
                <div key={log.id} className="ac-log-item">
                  <div className={`ac-icon ${log.category}`}>
                    {CAT_ICONS[log.category] ?? "📋"}
                  </div>
                  <div className="ac-log-body">
                    <div className="ac-log-action">{log.action}</div>
                    <div className="ac-log-meta">
                      {log.userName  && <span>👤 {log.userName}</span>}
                      {log.userEmail && <span>✉️ {log.userEmail}</span>}
                      {log.ip        && <span>🌐 {log.ip}</span>}
                      <span className={`ac-cat-badge ${log.category}`}>{log.category}</span>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <span>{Object.entries(log.metadata).slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(" · ")}</span>
                      )}
                    </div>
                  </div>
                  <div className="ac-log-time">{timeAgo(log.createdAt)}</div>
                </div>
              ))
          }

          {pages > 1 && (
            <div className="ac-pagination">
              <button className="ac-page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
              <span className="ac-count">Page {page} of {pages}</span>
              <button className="ac-page-btn" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
