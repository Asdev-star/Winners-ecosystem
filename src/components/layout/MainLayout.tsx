// src/components/layout/MainLayout.tsx

import { Outlet, useNavigate, useLocation, NavLink } from "react-router-dom";
import { useAuthStore } from "../../features/auth/authStore";
import TenantSwitcher from "../ui/TenantSwitcher";
import NotificationBell from "../../features/notifications/NotificationBell";
import { useNotificationStore } from "../../features/notifications/notificationStore";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .ml-root {
    --gold: #F5C842; --bg: #080B10; --surface: #0D1117; --surface2: #141B24;
    --border: #1E2A38; --text: #E8EDF2; --text-dim: #5A6878;
    display: flex; height: 100vh; background: var(--bg); color: var(--text);
    font-family: 'Syne', sans-serif; overflow: hidden;
  }

  .ml-sidebar {
    width: 220px; flex-shrink: 0;
    background: var(--surface); border-right: 1px solid var(--border);
    display: flex; flex-direction: column; padding: 0;
    overflow-y: auto;
  }

  .ml-logo { padding: 20px 16px 16px; border-bottom: 1px solid var(--border); }

  .ml-logo-text {
    font-family: 'Space Mono', monospace; font-size: 9px;
    letter-spacing: 2px; text-transform: uppercase; color: var(--gold);
    display: flex; align-items: center; gap: 7px;
  }

  .ml-logo-dot {
    width: 5px; height: 5px; border-radius: 50%;
    background: var(--gold); box-shadow: 0 0 6px var(--gold);
  }

  .ml-switcher-wrap { padding: 12px 12px 8px; border-bottom: 1px solid var(--border); }

  .ml-nav { flex: 1; padding: 12px 8px; }

  .ml-nav-section-label {
    font-family: 'Space Mono', monospace; font-size: 9px;
    letter-spacing: 2px; text-transform: uppercase; color: var(--text-dim);
    padding: 8px 8px 4px;
  }

  .ml-nav-link {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 10px; border-radius: 4px; margin-bottom: 2px;
    font-size: 13px; font-weight: 600; color: var(--text-dim);
    text-decoration: none; transition: all 0.15s; cursor: pointer;
    position: relative;
  }

  .ml-nav-link:hover { background: rgba(245,200,66,0.06); color: var(--text); }
  .ml-nav-link.active { background: rgba(245,200,66,0.1); color: var(--gold); }

  .ml-nav-icon { font-size: 15px; opacity: 0.6; flex-shrink: 0; }
  .ml-nav-link.active .ml-nav-icon { opacity: 1; }

  .ml-nav-badge {
    margin-left: auto; background: #FF5975; color: white;
    font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 700;
    padding: 1px 6px; border-radius: 10px; min-width: 16px; text-align: center;
  }

  .ml-sidebar-footer { padding: 12px; border-top: 1px solid var(--border); }

  .ml-user { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 4px; cursor: pointer; transition: background 0.15s; }
  .ml-user:hover { background: rgba(245,200,66,0.06); }

  .ml-user-avatar {
    width: 28px; height: 28px; border-radius: 50%;
    background: rgba(245,200,66,0.15); color: var(--gold);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700; flex-shrink: 0;
  }

  .ml-user-name { font-size: 12px; font-weight: 700; }
  .ml-user-role { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; }

  .ml-logout {
    width: 100%; background: transparent; border: 1px solid var(--border);
    border-radius: 3px; padding: 8px; font-family: 'Space Mono', monospace;
    font-size: 10px; color: var(--text-dim); cursor: pointer;
    transition: all 0.15s; margin-top: 8px; letter-spacing: 1px;
  }
  .ml-logout:hover { border-color: #FF5975; color: #FF5975; }

  .ml-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

  .ml-header {
    height: 52px; border-bottom: 1px solid var(--border);
    background: var(--surface); display: flex; align-items: center;
    justify-content: space-between; padding: 0 24px; flex-shrink: 0;
  }

  .ml-breadcrumb { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); }
  .ml-breadcrumb span { color: var(--gold); }

  .ml-header-right { display: flex; align-items: center; gap: 12px; }

  .ml-status-dot { width: 6px; height: 6px; border-radius: 50%; background: #2DD4A0; box-shadow: 0 0 6px #2DD4A0; }
  .ml-status-text { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }

  .ml-content { flex: 1; overflow-y: auto; }
`;

const NAV = [
  { path: "/",             icon: "▦",  label: "Dashboard",     notif: false },
  { path: "/analytics",   icon: "📈", label: "Analytics",     notif: false },
  { path: "/export",      icon: "↓",  label: "Export",        notif: false },
  { path: "/team",        icon: "👥", label: "Team",          notif: false },
  { path: "/billing",     icon: "💳", label: "Billing",       notif: false },
  { path: "/email",       icon: "📧", label: "Email Reports", notif: false },
  { path: "/notifications", icon: "🔔", label: "Notifications", notif: true  },
];

const WORKSPACE_NAV = [
  { path: "/settings", icon: "⚙️", label: "Settings" },
  { path: "/profile",  icon: "👤", label: "Profile"  },
];

const ALL_NAV = [...NAV, ...WORKSPACE_NAV];

export default function MainLayout() {
  const user         = useAuthStore((s) => s.user);
  const logout       = useAuthStore((s) => s.logout);
  const navigate     = useNavigate();
  const location     = useLocation();
  const unreadCount  = useNotificationStore((s) => s.unreadCount);

  if (!document.getElementById("ml-styles")) {
    const tag = document.createElement("style");
    tag.id = "ml-styles"; tag.textContent = css;
    document.head.appendChild(tag);
  }

  const initials = user?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() ?? "??";
  const pageName = ALL_NAV.find((n) => n.path === location.pathname)?.label ?? "Dashboard";

  return (
    <div className="ml-root">

      <aside className="ml-sidebar">

        <div className="ml-logo">
          <div className="ml-logo-text">
            <div className="ml-logo-dot" />
            Winners Ecosystem
          </div>
        </div>

        <div className="ml-switcher-wrap">
          <TenantSwitcher onCreateNew={() => navigate("/onboarding")} />
        </div>

        <nav className="ml-nav">
          <div className="ml-nav-section-label">Main</div>
          {NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) => `ml-nav-link${isActive ? " active" : ""}`}
            >
              <span className="ml-nav-icon">{item.icon}</span>
              {item.label}
              {item.notif && unreadCount > 0 && (
                <span className="ml-nav-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </NavLink>
          ))}

          <div className="ml-nav-section-label" style={{ marginTop: 12 }}>Workspace</div>
          {WORKSPACE_NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `ml-nav-link${isActive ? " active" : ""}`}
            >
              <span className="ml-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-sidebar-footer">
          <div className="ml-user" onClick={() => navigate("/profile")}>
            <div className="ml-user-avatar">{initials}</div>
            <div>
              <div className="ml-user-name">{user?.name}</div>
              <div className="ml-user-role">{user?.role}</div>
            </div>
          </div>
          <button className="ml-logout" onClick={() => { logout(); navigate("/login"); }}>
            Sign Out
          </button>
        </div>

      </aside>

      <div className="ml-main">
        <header className="ml-header">
          <div className="ml-breadcrumb">
            Winners · <span>{pageName}</span>
          </div>
          <div className="ml-header-right">
            <div className="ml-status-dot" />
            <span className="ml-status-text">Live</span>
            <NotificationBell />
          </div>
        </header>

        <main className="ml-content">
          <Outlet />
        </main>
      </div>

    </div>
  );
}