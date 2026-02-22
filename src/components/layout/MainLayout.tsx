// src/components/layout/MainLayout.tsx

import { useState } from "react";
import { Outlet, useNavigate, useLocation, NavLink } from "react-router-dom";
import { useAuthStore } from "../../features/auth/authStore";
import TenantSwitcher from "../ui/TenantSwitcher";
import NotificationBell from "../../features/notifications/NotificationBell";
import { useNotificationStore } from "../../features/notifications/notificationStore";
import ThemeToggle from "../../features/theme/ThemeToggle";
import GlobalSearch from "../../features/search/GlobalSearch";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .ml-root {
    display: flex; height: 100vh; background: var(--bg); color: var(--text);
    font-family: 'Syne', sans-serif; overflow: hidden;
  }

  /* ── Sidebar ── */
  .ml-sidebar {
    width: 220px; flex-shrink: 0;
    background: var(--surface); border-right: 1px solid var(--border);
    display: flex; flex-direction: column; padding: 0;
    overflow-y: auto; transition: transform 0.25s ease, width 0.25s ease;
    z-index: 100;
  }

  .ml-logo { padding: 20px 16px 16px; border-bottom: 1px solid var(--border); }
  .ml-logo-text {
    font-family: 'Space Mono', monospace; font-size: 9px;
    letter-spacing: 2px; text-transform: uppercase; color: var(--gold);
    display: flex; align-items: center; gap: 7px;
  }
  .ml-logo-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--gold); box-shadow: 0 0 6px var(--gold); }
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

  /* ── Main area ── */
  .ml-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
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

  /* ── Hamburger button ── */
  .ml-hamburger {
    display: none; flex-direction: column; justify-content: center; align-items: center;
    width: 36px; height: 36px; gap: 5px; cursor: pointer;
    background: transparent; border: 1px solid var(--border); border-radius: 4px;
    padding: 0; flex-shrink: 0;
  }
  .ml-hamburger span {
    display: block; width: 16px; height: 2px;
    background: var(--text); border-radius: 2px; transition: all 0.2s;
  }
  .ml-hamburger.open span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
  .ml-hamburger.open span:nth-child(2) { opacity: 0; }
  .ml-hamburger.open span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

  /* ── Overlay ── */
  .ml-overlay {
    display: none; position: fixed; inset: 0;
    background: rgba(0,0,0,0.6); z-index: 99;
  }

  /* ── Mobile bottom nav ── */
  .ml-bottom-nav {
    display: none; position: fixed; bottom: 0; left: 0; right: 0;
    background: var(--surface); border-top: 1px solid var(--border);
    z-index: 50; padding: 0;
  }
  .ml-bottom-nav-inner {
    display: flex; justify-content: space-around; align-items: center;
    height: 56px; padding: 0 4px;
  }
  .ml-bottom-link {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 2px; padding: 6px 12px; border-radius: 4px; text-decoration: none;
    color: var(--text-dim); transition: color 0.15s; font-size: 9px;
    font-family: 'Space Mono', monospace; letter-spacing: 0.5px; flex: 1;
    position: relative;
  }
  .ml-bottom-link.active { color: var(--gold); }
  .ml-bottom-link-icon { font-size: 18px; }
  .ml-bottom-badge {
    position: absolute; top: 4px; right: 8px;
    background: #FF5975; color: white; font-size: 8px; font-weight: 700;
    padding: 1px 4px; border-radius: 8px; min-width: 14px; text-align: center;
  }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .ml-sidebar {
      position: fixed; top: 0; left: 0; bottom: 0;
      transform: translateX(-100%); width: 260px;
    }
    .ml-sidebar.open { transform: translateX(0); box-shadow: 4px 0 24px rgba(0,0,0,0.4); }
    .ml-overlay.open { display: block; }
    .ml-hamburger { display: flex; }
    .ml-status-text { display: none; }
    .ml-header { padding: 0 16px; }
    .ml-bottom-nav { display: block; }
    .ml-content { padding-bottom: 56px; }
  }

  @media (max-width: 480px) {
    .ml-header { gap: 8px; }
    .ml-breadcrumb { font-size: 10px; }
  }
`;

const NAV = [
  { path: "/dashboard",     icon: "▦",  label: "Dashboard",     notif: false },
  { path: "/analytics",     icon: "📈", label: "Analytics",     notif: false },
  { path: "/search",        icon: "🔍", label: "Search",        notif: false },
  { path: "/stripe",        icon: "💰", label: "Stripe",        notif: false },
  { path: "/export",        icon: "↓",  label: "Export",        notif: false },
  { path: "/team",          icon: "👥", label: "Team",          notif: false },
  { path: "/billing",       icon: "💳", label: "Billing",       notif: false },
  { path: "/email",         icon: "📧", label: "Email Reports", notif: false },
  { path: "/notifications", icon: "🔔", label: "Notifications", notif: true  },
  { path: "/slack",         icon: "💬", label: "Slack",         notif: false },
  { path: "/activity",      icon: "📋", label: "Activity",      notif: false },
  { path: "/referral", icon: "🎁", label: "Referral", notif: false },
  { path: "/changelog", icon: "📋", label: "What's New", notif: false },
];

const WORKSPACE_NAV = [
  { path: "/settings", icon: "⚙️", label: "Settings" },
  { path: "/profile",  icon: "👤", label: "Profile"  },
  { path: "/admin", icon: "🛡️", label: "Admin", notif: false },
];

const ALL_NAV = [...NAV, ...WORKSPACE_NAV];

// Bottom nav — most important 5
const BOTTOM_NAV = [
  { path: "/dashboard",     icon: "▦",  label: "Home",    notif: false },
  { path: "/analytics",     icon: "📈", label: "Stats",   notif: false },
  { path: "/stripe",        icon: "💰", label: "Stripe",  notif: false },
  { path: "/notifications", icon: "🔔", label: "Alerts",  notif: true  },
  { path: "/settings",      icon: "⚙️", label: "Settings",notif: false },
  
];

export default function MainLayout() {
  const user        = useAuthStore((s) => s.user);
  const logout      = useAuthStore((s) => s.logout);
  const navigate    = useNavigate();
  const location    = useLocation();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!document.getElementById("ml-styles")) {
    const tag = document.createElement("style");
    tag.id = "ml-styles"; tag.textContent = css;
    document.head.appendChild(tag);
  }

  const initials = user?.name?.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase() ?? "??";
  const pageName = ALL_NAV.find((n) => n.path === location.pathname)?.label ?? "Dashboard";

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="ml-root">

      {/* Mobile overlay */}
      <div className={`ml-overlay${sidebarOpen ? " open" : ""}`} onClick={closeSidebar} />

      <aside className={`ml-sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="ml-logo">
          <div className="ml-logo-text">
            <div className="ml-logo-dot" />
            Winners Ecosystem
          </div>
        </div>

        <div className="ml-switcher-wrap">
          <TenantSwitcher onCreateNew={() => { navigate("/onboarding"); closeSidebar(); }} />
        </div>

        <nav className="ml-nav">
          <div className="ml-nav-section-label">Main</div>
          {NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `ml-nav-link${isActive ? " active" : ""}`}
              onClick={closeSidebar}
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
              onClick={closeSidebar}
            >
              <span className="ml-nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-sidebar-footer">
          <div className="ml-user" onClick={() => { navigate("/profile"); closeSidebar(); }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className={`ml-hamburger${sidebarOpen ? " open" : ""}`}
              onClick={() => setSidebarOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              <span /><span /><span />
            </button>
            <GlobalSearch />
            <div className="ml-breadcrumb">
              Winners · <span>{pageName}</span>
            </div>
          </div>
          <div className="ml-header-right">
            <div className="ml-status-dot" />
            <span className="ml-status-text">Live</span>
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>

        <main className="ml-content">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav className="ml-bottom-nav">
        <div className="ml-bottom-nav-inner">
          {BOTTOM_NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `ml-bottom-link${isActive ? " active" : ""}`}
            >
              <span className="ml-bottom-link-icon">{item.icon}</span>
              {item.label}
              {item.notif && unreadCount > 0 && (
                <span className="ml-bottom-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

    </div>
  );
}