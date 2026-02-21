// src/features/activity/ActivityPage.tsx

import { useEffect, useState, useCallback } from "react";
import { useAuthStore } from "../auth/authStore";

const API = import.meta.env.VITE_API_URL ?? "";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .ac-root { padding: 32px; max-width: 960px; padding-bottom: 80px; }

  .ac-title {
    font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800;
    color: var(--text, #E8EDF2); margin: 0 0 6px;
  }
  .ac-subtitle {
    font-family: 'Space Mono', monospace; font-size: 11px;
    color: var(--text-dim, #5A6878); margin-bottom: 28px;
  }

  .ac-tabs {
    display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 20px;
  }
  .ac-tab {
    padding: 6px 14px; border-radius: 20px;
    border: 1px solid var(--border, #1E2A38);
    background: transparent; color: var(--text-dim, #5A6878);
    font-family: 'Space Mono', monospace; font-size: 10px;
    cursor: pointer; transition: all 0.15s; text-transform: uppercase; letter-spacing: 0.5px;
  }
  .ac-tab:hover { border-color: var(--gold, #F5C842); color: var(--text, #E8EDF2); }
  .ac-tab.active {
    border-color: var(--gold, #F5C842);
    background: rgba(245,200,66,0.08);
    color: var(--gold, #F5C842);
  }

  .ac-card {
    background: var(--surface, #0D1117);
    border: 1px solid var(--border, #1E2A38);
    border-radius: 12px; overflow: hidden; margin-bottom: 20px;
  }

  .ac-card-header {
    padding: 16px 20px; border-bottom: 1px solid var(--border, #1E2A38);
    display: flex; align-items: center; justify-content: space-between;
  }
  .ac-card-title {
    font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
    color: var(--text, #E8EDF2);
  }
  .ac-count {
    font-family: 'Space Mono', monospace; font-size: 10px;
    color: var(--text-dim, #5A6878);
  }

  .ac-log-item {
    display: flex; align-items: flex-start; gap: 14px;
    padding: 14px 20px; border-bottom: 1px solid var(--border, #1E2A38);
    transition: background 0.1s;
  }
  .ac-log-item:last-child { border-bottom: none; }
  .ac-log-item:hover { background: rgba(255,255,255,0.02); }

  .ac-icon {
    width: 34px; height: 34px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: 15px; flex-shrink: 0; margin-top: 1px;
  }
  .ac-icon.auth     { background: rgba(99,179,237,0.12); }
  .ac-icon.team     { background: rgba(154,230,180,0.12); }
  .ac-icon.billing  { background: rgba(245,200,66,0.12); }
  .ac-icon.export   { background: rgba(183,148,246,0.12); }
  .ac-icon.settings { background: rgba(246,173,85,0.12); }
  .ac-icon.stripe   { background: rgba(99,179,237,0.12); }

  .ac-log-body { flex: 1; min-width: 0; }
  .ac-log-action {
    font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600;
    color: var(--text, #E8EDF2); margin-bottom: 3px;
  }
  .ac-log-meta {
    font-family: 'Space Mono', monospace; font-size: 10px;
    color: var(--text-dim, #5A6878); display: flex; gap: 10px; flex-wrap: wrap;
  }
  .ac-log-meta span { display: flex; align-items: center; gap: 4px; }

  .ac-log-time {
    font-family: 'Space Mono', monospace; font-size: 10px;
    color: var(--text-dim, #5A6878); white-space: nowrap; flex-shrink: 0;
  }

  .ac-cat-badge {
    display: inline-block; padding: 2px 8px; border-radius: 10px;
    font-family: 'Space Mono', monospace; font-size: 9px;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  .ac-cat-badge.auth     { background: rgba(99,179,237,0.12);  color: #63b3ed; }
  .ac-cat-badge.team     { background: rgba(154,230,180,0.12); color: #9ae6b4; }
  .ac-cat-badge.billing  { background: rgba(245,200,66,0.12);  color: #F5C842; }
  .ac-cat-badge.export   { background: rgba(183,148,246,0.12); color: #b794f6; }
  .ac-cat-badge.settings { background: rgba(246,173,85,0.12);  color: #f6ad55; }
  .ac-cat-badge.stripe   { background: rgba(99,179,237,0.12);  color: #63b3ed; }

  .ac-empty {
    padding: 48px; text-align: center;
    font-family: 'Space Mono', monospace; font-size: 12px;
    color: var(--text-dim, #5A6878);
  }

  .ac-pagination {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 20px; border-top: 1px solid var(--border, #1E2A38);
  }
  .ac-page-btn {
    padding: 6px 14px; border-radius: 6px;
    border: 1px solid var(--border, #1E2A38);
    background: transparent; color: var(--text-dim, #5A6878);
    font-family: 'Space Mono', monospace; font-size: 10px;
    cursor: pointer; transition: all 0.15s;
  }
  .ac-page-btn:hover:not(:disabled) { border-color: var(--gold, #F5C842); color: var(--text, #E8EDF2); }
  .ac-page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

  .ac-clear-btn {
    padding: 7px 14px; border-radius: 6px;
    border: 1px solid rgba(239,68,68,0.3);
    background: transparent; color: rgba(239,68,68,0.7);
    font-family: 'Space Mono', monospace; font-size: 10px;
    cursor: pointer; transition: all 0.15s;
  }
  .ac-clear-btn:hover { border-color: rgb(239,68,68); color: rgb(239,68,68); }

  .ac-skeleton {
    height: 60px; background: linear-gradient(90deg, var(--surface2, #141B24) 25%, var(--border, #1E2A38) 50%, var(--surface2, #141B24) 75%);
    background-size: 200% 100%; animation: shimmer 1.2s infinite; border-bottom: 1px solid var(--border, #1E2A38);
  }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  @media (max-width: 640px) {
    .ac-root { padding: 16px 14px 80px; }
    .ac-log-meta { flex-direction: column; gap: 3px; }
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
  const diff = Date.now() - new Date(date).getTime();
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

  const [logs, setLogs]       = useState<Log[]>([]);
  const [total, setTotal]     = useState(0);
  const [page, setPage]       = useState(1);
  const [pages, setPages]     = useState(1);
  const [category, setCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (category !== "all") params.set("category", category);

      const res = await fetch(`${API}/activity?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
      await fetch(`${API}/activity`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setLogs([]);
      setTotal(0);
    } finally {
      setClearing(false);
    }
  };

  return (
    <>
      <style>{css}</style>
      <div className="ac-root">
        <h1 className="ac-title">Activity Feed</h1>
        <p className="ac-subtitle">Complete audit log of all workspace actions</p>

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
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="ac-count">{total} events</span>
              {user?.role === "owner" && total > 0 && (
                <button className="ac-clear-btn" onClick={handleClear} disabled={clearing}>
                  {clearing ? "Clearing..." : "🗑 Clear All"}
                </button>
              )}
            </div>
          </div>

          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="ac-skeleton" />
            ))
          ) : logs.length === 0 ? (
            <div className="ac-empty">
              No activity logged yet.<br />
              <span style={{ fontSize: 10 }}>Events will appear here as your team uses the app.</span>
            </div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="ac-log-item">
                <div className={`ac-icon ${log.category}`}>
                  {CAT_ICONS[log.category] ?? "📋"}
                </div>
                <div className="ac-log-body">
                  <div className="ac-log-action">{log.action}</div>
                  <div className="ac-log-meta">
                    {log.userName && <span>👤 {log.userName}</span>}
                    {log.userEmail && <span>✉️ {log.userEmail}</span>}
                    {log.ip && <span>🌐 {log.ip}</span>}
                    <span className={`ac-cat-badge ${log.category}`}>{log.category}</span>
                    {log.metadata && Object.keys(log.metadata).length > 0 && (
                      <span>
                        {Object.entries(log.metadata)
                          .slice(0, 2)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(" · ")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="ac-log-time">{timeAgo(log.createdAt)}</div>
              </div>
            ))
          )}

          {pages > 1 && (
            <div className="ac-pagination">
              <button className="ac-page-btn" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                ← Prev
              </button>
              <span className="ac-count">Page {page} of {pages}</span>
              <button className="ac-page-btn" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}