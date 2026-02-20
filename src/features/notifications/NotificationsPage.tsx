// src/features/notifications/NotificationsPage.tsx

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotificationStore } from "./notificationStore";
import type { NotificationType } from "./notificationStore";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .np-root {
    --gold: #F5C842; --bg: #080B10; --surface: #0D1117; --surface2: #141B24;
    --border: #1E2A38; --text: #E8EDF2; --text-dim: #5A6878;
    --green: #2DD4A0; --red: #FF5975; --blue: #4A9EFF; --purple: #9B6FFF;
    background: var(--bg); color: var(--text);
    font-family: 'Syne', sans-serif; min-height: 100vh; padding: 32px 24px 80px;
  }

  .np-inner { max-width: 740px; margin: 0 auto; }

  .np-header { margin-bottom: 28px; display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
  .np-title { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
  .np-title span { color: var(--gold); }
  .np-subtitle { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); margin-top: 4px; }

  .np-actions { display: flex; gap: 8px; }
  .np-action-btn {
    background: transparent; border: 1px solid var(--border); border-radius: 3px;
    padding: 7px 14px; font-family: 'Space Mono', monospace; font-size: 10px;
    color: var(--text-dim); cursor: pointer; transition: all 0.15s; letter-spacing: 0.5px;
  }
  .np-action-btn:hover { border-color: var(--gold); color: var(--gold); }
  .np-action-btn.danger:hover { border-color: var(--red); color: var(--red); }

  /* Filters */
  .np-filters { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
  .np-filter {
    background: var(--surface); border: 1px solid var(--border); border-radius: 3px;
    padding: 6px 14px; font-family: 'Space Mono', monospace; font-size: 10px;
    color: var(--text-dim); cursor: pointer; transition: all 0.15s;
  }
  .np-filter:hover  { border-color: var(--gold); color: var(--gold); }
  .np-filter.active { background: rgba(245,200,66,0.1); border-color: var(--gold); color: var(--gold); }

  /* Notification items */
  .np-list { display: flex; flex-direction: column; gap: 8px; }

  .np-item {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 6px; padding: 16px 18px;
    display: flex; gap: 14px; align-items: flex-start;
    cursor: pointer; transition: border-color 0.15s; position: relative; overflow: hidden;
  }
  .np-item:hover { border-color: rgba(245,200,66,0.2); }
  .np-item.unread { border-color: rgba(245,200,66,0.15); background: rgba(245,200,66,0.02); }
  .np-item.unread::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; }
  .np-item.unread.anomaly::before  { background: #FF5975; }
  .np-item.unread.team::before     { background: #2DD4A0; }
  .np-item.unread.billing::before  { background: #9B6FFF; }
  .np-item.unread.system::before   { background: #F5C842; }
  .np-item.unread.revenue::before  { background: #4A9EFF; }

  .np-item-icon { font-size: 22px; flex-shrink: 0; margin-top: 2px; }

  .np-item-body { flex: 1; min-width: 0; }
  .np-item-title { font-size: 14px; font-weight: 700; margin-bottom: 5px; }
  .np-item.unread .np-item-title { color: var(--text); }
  .np-item:not(.unread) .np-item-title { color: var(--text-dim); }
  .np-item-text  { font-size: 12px; color: var(--text-dim); line-height: 1.5; margin-bottom: 8px; }
  .np-item-meta  { display: flex; align-items: center; gap: 10px; }
  .np-item-time  { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }
  .np-item-type  {
    font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 1px;
    text-transform: uppercase; padding: 2px 7px; border-radius: 2px;
  }
  .np-item-type.anomaly { background: rgba(255,89,117,0.1);  color: #FF5975; border: 1px solid rgba(255,89,117,0.2); }
  .np-item-type.team    { background: rgba(45,212,160,0.1);  color: #2DD4A0; border: 1px solid rgba(45,212,160,0.2); }
  .np-item-type.billing { background: rgba(155,111,255,0.1); color: #9B6FFF; border: 1px solid rgba(155,111,255,0.2); }
  .np-item-type.system  { background: rgba(245,200,66,0.1);  color: #F5C842; border: 1px solid rgba(245,200,66,0.2); }
  .np-item-type.revenue { background: rgba(74,158,255,0.1);  color: #4A9EFF; border: 1px solid rgba(74,158,255,0.2); }

  .np-item-right { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0; }
  .np-unread-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--gold); box-shadow: 0 0 6px var(--gold); }
  .np-delete-btn {
    background: none; border: none; cursor: pointer; color: var(--text-dim);
    font-size: 16px; padding: 2px; opacity: 0; transition: all 0.15s;
  }
  .np-item:hover .np-delete-btn { opacity: 1; }
  .np-delete-btn:hover { color: var(--red); }

  /* Empty */
  .np-empty { text-align: center; padding: 60px 20px; }
  .np-empty-icon { font-size: 48px; margin-bottom: 16px; }
  .np-empty-title { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
  .np-empty-desc  { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); }

  /* Section label */
  .np-section-label {
    font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 2px;
    text-transform: uppercase; color: var(--text-dim); margin: 20px 0 10px;
    display: flex; align-items: center; gap: 10px;
  }
  .np-section-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }
`;

const TYPE_ICONS: Record<NotificationType, string> = {
  anomaly: "⚠️", team: "👥", billing: "💳", system: "🔔", revenue: "📈",
};

const FILTERS = ["all", "unread", "anomaly", "team", "billing", "revenue", "system"] as const;
type Filter = typeof FILTERS[number];

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

import { useState } from "react";

export default function NotificationsPage() {
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotificationStore();
  const [filter, setFilter] = useState<Filter>("all");
  const navigate = useNavigate();

  useEffect(() => {
    const id = "np-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id; tag.textContent = css;
      document.head.appendChild(tag);
    }
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  useEffect(() => { fetchNotifications(); }, []);

  const filtered = notifications.filter((n) => {
    if (filter === "all")    return true;
    if (filter === "unread") return !n.read;
    return n.type === filter;
  });

  const today    = filtered.filter((n) => isToday(n.createdAt));
  const earlier  = filtered.filter((n) => !isToday(n.createdAt));

  const handleClick = (n: typeof notifications[0]) => {
    markAsRead(n.id);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="np-root">
      <div className="np-inner">

        <div className="np-header">
          <div>
            <h1 className="np-title">Notifications {unreadCount > 0 && <span>({unreadCount})</span>}</h1>
            <p className="np-subtitle">Stay up to date with your workspace activity</p>
          </div>
          <div className="np-actions">
            {unreadCount > 0 && <button className="np-action-btn" onClick={markAllAsRead}>Mark all read</button>}
            {notifications.length > 0 && <button className="np-action-btn danger" onClick={clearAll}>Clear all</button>}
          </div>
        </div>

        {/* Filters */}
        <div className="np-filters">
          {FILTERS.map((f) => (
            <div key={f} className={`np-filter${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>
              {f === "all" ? `All (${notifications.length})` :
               f === "unread" ? `Unread (${unreadCount})` :
               f.charAt(0).toUpperCase() + f.slice(1)}
            </div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="np-empty">
            <div className="np-empty-icon">🔔</div>
            <div className="np-empty-title">No notifications</div>
            <div className="np-empty-desc">
              {filter === "unread" ? "You're all caught up!" : `No ${filter} notifications yet.`}
            </div>
          </div>
        ) : (
          <div className="np-list">
            {today.length > 0 && <div className="np-section-label">Today</div>}
            {today.map((n) => (
              <div key={n.id} className={`np-item${!n.read ? ` unread ${n.type}` : ""}`} onClick={() => handleClick(n)}>
                <div className="np-item-icon">{TYPE_ICONS[n.type]}</div>
                <div className="np-item-body">
                  <div className="np-item-title">{n.title}</div>
                  <div className="np-item-text">{n.body}</div>
                  <div className="np-item-meta">
                    <span className="np-item-time">{timeAgo(n.createdAt)}</span>
                    <span className={`np-item-type ${n.type}`}>{n.type}</span>
                  </div>
                </div>
                <div className="np-item-right">
                  {!n.read && <div className="np-unread-dot" />}
                  <button className="np-delete-btn" onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}>×</button>
                </div>
              </div>
            ))}

            {earlier.length > 0 && <div className="np-section-label">Earlier</div>}
            {earlier.map((n) => (
              <div key={n.id} className={`np-item${!n.read ? ` unread ${n.type}` : ""}`} onClick={() => handleClick(n)}>
                <div className="np-item-icon">{TYPE_ICONS[n.type]}</div>
                <div className="np-item-body">
                  <div className="np-item-title">{n.title}</div>
                  <div className="np-item-text">{n.body}</div>
                  <div className="np-item-meta">
                    <span className="np-item-time">{timeAgo(n.createdAt)}</span>
                    <span className={`np-item-type ${n.type}`}>{n.type}</span>
                  </div>
                </div>
                <div className="np-item-right">
                  {!n.read && <div className="np-unread-dot" />}
                  <button className="np-delete-btn" onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}>×</button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}