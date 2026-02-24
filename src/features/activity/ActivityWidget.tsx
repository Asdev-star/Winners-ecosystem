// src/features/activity/ActivityWidget.tsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";
import { API_BASE } from "../../lib/api";

const API = API_BASE;
const css = `
  .aw-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 6px; overflow: hidden;
  }
  .aw-header {
    padding: 12px 16px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .aw-title {
    font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; color: var(--text);
    display: flex; align-items: center; gap: 7px;
  }
  .aw-title-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--green); box-shadow: 0 0 6px var(--green); animation: aw-pulse 2s ease infinite; }
  .aw-view-all {
    font-family: 'Space Mono', monospace; font-size: 9px;
    color: var(--gold); cursor: pointer; background: none; border: none; padding: 0; transition: opacity 0.15s;
  }
  .aw-view-all:hover { opacity: 0.75; }

  .aw-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 16px; border-bottom: 1px solid var(--border); transition: background 0.1s;
  }
  .aw-item:last-child { border-bottom: none; }
  .aw-item:hover { background: rgba(43,95,142,0.04); }

  .aw-dot {
    width: 28px; height: 28px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; flex-shrink: 0;
  }
  .aw-dot.auth     { background: rgba(137,196,225,0.1); }
  .aw-dot.team     { background: rgba(45,212,160,0.1); }
  .aw-dot.billing  { background: rgba(201,168,76,0.1); }
  .aw-dot.export   { background: rgba(155,111,255,0.1); }
  .aw-dot.settings { background: rgba(201,168,76,0.08); }
  .aw-dot.stripe   { background: rgba(43,95,142,0.15); }

  .aw-body { flex: 1; min-width: 0; }
  .aw-action {
    font-size: 11px; font-weight: 600; color: var(--text);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-bottom: 2px;
  }
  .aw-cat {
    font-family: 'Space Mono', monospace; font-size: 8px; text-transform: uppercase;
    letter-spacing: 0.5px; color: var(--text-dim);
  }
  .aw-time {
    font-family: 'Space Mono', monospace; font-size: 9px;
    color: var(--text-dim); white-space: nowrap; flex-shrink: 0;
  }

  .aw-empty {
    padding: 28px 16px; text-align: center;
    font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); line-height: 1.8;
  }

  .aw-skeleton {
    height: 48px;
    background: linear-gradient(90deg, var(--surface2) 25%, var(--border) 50%, var(--surface2) 75%);
    background-size: 200% 100%; animation: aw-shimmer 1.2s infinite;
    border-bottom: 1px solid var(--border);
  }

  .aw-footer {
    padding: 9px 16px; border-top: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .aw-footer-label { font-family: 'Space Mono', monospace; font-size: 8px; color: var(--text-dim); letter-spacing: 1px; text-transform: uppercase; }
  .aw-footer-status { font-family: 'Space Mono', monospace; font-size: 8px; color: var(--green); display: flex; align-items: center; gap: 5px; }
  .aw-footer-status::before { content: ''; width: 4px; height: 4px; border-radius: 50%; background: var(--green); }

  @keyframes aw-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @keyframes aw-pulse   { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
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
          <span className="aw-title">
            <div className="aw-title-dot" />
            Recent Activity
          </span>
          <button className="aw-view-all" onClick={() => navigate("/activity")}>
            View all →
          </button>
        </div>

        {loading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="aw-skeleton" />)
          : logs.length === 0
            ? <div className="aw-empty">No activity yet.<br /><span style={{ fontSize: 9 }}>Events appear as your team uses the ecosystem.</span></div>
            : logs.map((log) => (
              <div key={log.id} className="aw-item">
                <div className={`aw-dot ${log.category}`}>
                  {CAT_ICONS[log.category] ?? "📋"}
                </div>
                <div className="aw-body">
                  <div className="aw-action">{log.action}</div>
                  <div className="aw-cat">{log.category}</div>
                </div>
                <span className="aw-time">{timeAgo(log.createdAt)}</span>
              </div>
            ))
        }

        <div className="aw-footer">
          <span className="aw-footer-label">Audit Trail · Core Engine</span>
          <span className="aw-footer-status">Live</span>
        </div>
      </div>
    </>
  );
}