// src/features/notifications/NotificationBell.tsx

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotificationStore } from "./notificationStore";
import type { Notification, NotificationType } from "./notificationStore";

const css = `
  .nb-wrap { position: relative; }

  .nb-btn {
    width: 34px; height: 34px; border-radius: 4px;
    background: transparent; border: 1px solid var(--border);
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; transition: all 0.15s; position: relative;
    font-size: 16px;
  }
  .nb-btn:hover { border-color: var(--gold); background: rgba(245,200,66,0.06); }
  .nb-btn.has-unread { border-color: rgba(245,200,66,0.3); }

  .nb-badge {
    position: absolute; top: -5px; right: -5px;
    width: 17px; height: 17px; border-radius: 50%;
    background: var(--red); color: white;
    font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid var(--surface);
    animation: nb-pop 0.2s ease;
  }

  .nb-dropdown {
    position: absolute; top: calc(100% + 8px); right: 0;
    width: 340px; background: var(--surface);
    border: 1px solid var(--border); border-radius: 6px;
    overflow: hidden; z-index: 200;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    animation: nb-drop 0.15s ease;
  }

  .nb-header {
    padding: 12px 16px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
  }
  .nb-header-title { font-size: 13px; font-weight: 700; }
  .nb-header-actions { display: flex; gap: 8px; }
  .nb-header-btn {
    font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.5px;
    color: var(--text-dim); background: none; border: none;
    cursor: pointer; transition: color 0.15s; padding: 2px 6px;
    border-radius: 2px;
  }
  .nb-header-btn:hover { color: var(--gold); }

  .nb-list { max-height: 360px; overflow-y: auto; }

  .nb-item {
    display: flex; gap: 10px; padding: 12px 16px;
    border-bottom: 1px solid var(--border);
    cursor: pointer; transition: background 0.12s; position: relative;
  }
  .nb-item:last-child { border-bottom: none; }
  .nb-item:hover { background: rgba(245,200,66,0.04); }
  .nb-item.unread { background: rgba(245,200,66,0.03); }
  .nb-item.unread::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: var(--gold); }

  .nb-icon { font-size: 18px; flex-shrink: 0; margin-top: 1px; }

  .nb-content { flex: 1; min-width: 0; }
  .nb-title { font-size: 12px; font-weight: 700; margin-bottom: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .nb-body  { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .nb-time  { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); margin-top: 4px; }

  .nb-delete {
    background: none; border: none; cursor: pointer; color: var(--text-dim);
    font-size: 14px; padding: 2px; border-radius: 2px; opacity: 0; transition: all 0.15s;
    flex-shrink: 0; align-self: flex-start;
  }
  .nb-item:hover .nb-delete { opacity: 1; }
  .nb-delete:hover { color: var(--red); }

  .nb-empty {
    padding: 28px 16px; text-align: center;
    font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim);
  }
  .nb-empty-icon { font-size: 28px; margin-bottom: 8px; }

  .nb-footer {
    padding: 10px 16px; border-top: 1px solid var(--border); text-align: center;
  }
  .nb-footer-btn {
    font-family: 'Space Mono', monospace; font-size: 10px; color: var(--gold);
    background: none; border: none; cursor: pointer; letter-spacing: 0.5px;
  }
  .nb-footer-btn:hover { text-decoration: underline; }

  @keyframes nb-pop  { from { transform: scale(0); } to { transform: scale(1); } }
  @keyframes nb-drop { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
`;

const TYPE_ICONS: Record<NotificationType, string> = {
  anomaly: "⚠️", team: "👥", billing: "💳", system: "🔔", revenue: "📈",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell() {
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead, deleteNotification } = useNotificationStore();
  const [open, setOpen] = useState(false);
  const ref             = useRef<HTMLDivElement>(null);
  const navigate        = useNavigate();

  useEffect(() => {
    const id = "nb-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id; tag.textContent = css;
      document.head.appendChild(tag);
    }
  }, []);

  useEffect(() => { fetchNotifications(); }, []);

  // Poll every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleClick = (n: Notification) => {
    markAsRead(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  return (
    <div className="nb-wrap" ref={ref}>
      <button className={`nb-btn${unreadCount > 0 ? " has-unread" : ""}`} onClick={() => setOpen((v) => !v)}>
        🔔
        {unreadCount > 0 && <span className="nb-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
      </button>

      {open && (
        <div className="nb-dropdown">
          <div className="nb-header">
            <div className="nb-header-title">Notifications {unreadCount > 0 && `(${unreadCount})`}</div>
            <div className="nb-header-actions">
              {unreadCount > 0 && <button className="nb-header-btn" onClick={markAllAsRead}>Mark all read</button>}
              <button className="nb-header-btn" onClick={() => { setOpen(false); navigate("/notifications"); }}>View all</button>
            </div>
          </div>

          <div className="nb-list">
            {notifications.length === 0 ? (
              <div className="nb-empty">
                <div className="nb-empty-icon">🔔</div>
                <div>No notifications yet</div>
              </div>
            ) : (
              notifications.slice(0, 6).map((n) => (
                <div key={n.id} className={`nb-item${!n.read ? " unread" : ""}`} onClick={() => handleClick(n)}>
                  <div className="nb-icon">{TYPE_ICONS[n.type]}</div>
                  <div className="nb-content">
                    <div className="nb-title">{n.title}</div>
                    <div className="nb-body">{n.body}</div>
                    <div className="nb-time">{timeAgo(n.createdAt)}</div>
                  </div>
                  <button className="nb-delete" onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}>×</button>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="nb-footer">
              <button className="nb-footer-btn" onClick={() => { setOpen(false); navigate("/notifications"); }}>
                View all {notifications.length} notifications →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}