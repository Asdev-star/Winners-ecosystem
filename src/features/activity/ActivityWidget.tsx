// src/features/activity/ActivityWidget.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";

const API = import.meta.env.VITE_API_URL ?? "";

const css = `
  .aw-card {
    background: var(--surface, #0D1117);
    border: 1px solid var(--border, #1E2A38);
    border-radius: 12px; overflow: hidden;
  }
  .aw-header {
    padding: 14px 18px; border-bottom: 1px solid var(--border, #1E2A38);
    display: flex; align-items: center; justify-content: space-between;
  }
  .aw-title {
    font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
    color: var(--text, #E8EDF2);
  }
  .aw-view-all {
    font-family: 'Space Mono', monospace; font-size: 10px;
    color: var(--gold, #F5C842); cursor: pointer; background: none;
    border: none; padding: 0;
  }
  .aw-view-all:hover { text-decoration: underline; }

  .aw-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 18px; border-bottom: 1px solid var(--border, #1E2A38);
  }
  .aw-item:last-child { border-bottom: none; }

  .aw-dot {
    width: 28px; height: 28px; border-radius: 7px;
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; flex-shrink: 0;
  }
  .aw-dot.auth     { background: rgba(99,179,237,0.12); }
  .aw-dot.team     { background: rgba(154,230,180,0.12); }
  .aw-dot.billing  { background: rgba(245,200,66,0.12); }
  .aw-dot.export   { background: rgba(183,148,246,0.12); }
  .aw-dot.settings { background: rgba(246,173,85,0.12); }
  .aw-dot.stripe   { background: rgba(99,179,237,0.12); }

  .aw-action {
    font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 600;
    color: var(--text, #E8EDF2); flex: 1;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .aw-time {
    font-family: 'Space Mono', monospace; font-size: 10px;
    color: var(--text-dim, #5A6878); white-space: nowrap;
  }
  .aw-empty {
    padding: 24px; text-align: center;
    font-family: 'Space Mono', monospace; font-size: 11px;
    color: var(--text-dim, #5A6878);
  }
  .aw-skeleton {
    height: 48px;
    background: linear-gradient(90deg, var(--surface2, #141B24) 25%, var(--border, #1E2A38) 50%, var(--surface2, #141B24) 75%);
    background-size: 200% 100%; animation: aw-shimmer 1.2s infinite;
    border-bottom: 1px solid var(--border, #1E2A38);
  }
  @keyframes aw-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
`;

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
  return `${days}d ago`;
}

export default function ActivityWidget() {
  const token    = useAuthStore((s) => s.token);
  const navigate = useNavigate();
  const [logs, setLogs]       = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/activity/recent?limit=5`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <>
      <style>{css}</style>
      <div className="aw-card">
        <div className="aw-header">
          <span className="aw-title">📋 Recent Activity</span>
          <button className="aw-view-all" onClick={() => navigate("/activity")}>
            View all →
          </button>
        </div>

        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="aw-skeleton" />)
        ) : logs.length === 0 ? (
          <div className="aw-empty">No activity yet</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="aw-item">
              <div className={`aw-dot ${log.category}`}>
                {CAT_ICONS[log.category] ?? "📋"}
              </div>
              <span className="aw-action">{log.action}</span>
              <span className="aw-time">{timeAgo(log.createdAt)}</span>
            </div>
          ))
        )}
      </div>
    </>
  );
}