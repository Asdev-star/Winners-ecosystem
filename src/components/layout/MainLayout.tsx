// src/components/layout/MainLayout.tsx

import { useState } from "react";
import { Outlet, useNavigate, useLocation, NavLink } from "react-router-dom";
import { useAuthStore } from "../../features/auth/authStore";
import TenantSwitcher from "../ui/TenantSwitcher";
import NotificationBell from "../../features/notifications/NotificationBell";
import { useNotificationStore } from "../../features/notifications/notificationStore";
import ThemeToggle from "../../features/theme/ThemeToggle";
import GlobalSearch from "../../features/search/GlobalSearch";
import ContextBar from "../ui/ContextBar";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .ml-root {
    display: flex; height: 100vh; background: var(--bg); color: var(--text);
    font-family: 'Syne', sans-serif; overflow: hidden;
  }

  /* ── Sidebar ── */
  .ml-sidebar {
    width: 240px; flex-shrink: 0;
    background: var(--surface); border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
    overflow-y: auto; transition: transform 0.25s ease;
    z-index: 100;
  }

  /* Logo */
  .ml-logo {
    padding: 16px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 10px;
  }
  .ml-logo img { width: 38px; height: 38px; border-radius: 8px; object-fit: cover; border: 2px solid var(--gold); flex-shrink: 0; }
  .ml-logo-info {}
  .ml-logo-name { font-size: 13px; font-weight: 800; letter-spacing: -0.3px; color: var(--text); }
  .ml-logo-tag  { font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--gold); }

  /* AI status bar */
  .ml-ai-bar {
    margin: 10px 12px; padding: 8px 12px; border-radius: 6px;
    background: linear-gradient(135deg, rgba(43,95,142,0.15), rgba(201,168,76,0.08));
    border: 1px solid rgba(43,95,142,0.3);
    display: flex; align-items: center; gap: 8px;
  }
  .ml-ai-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); box-shadow: 0 0 6px var(--green); flex-shrink: 0; animation: pulse 2s ease infinite; }
  .ml-ai-text { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--ice); letter-spacing: 0.5px; }

  .ml-switcher-wrap { padding: 8px 12px; border-bottom: 1px solid var(--border); }

  /* Nav sections */
  .ml-nav { flex: 1; padding: 8px; overflow-y: auto; }
  .ml-nav-section {
    margin-bottom: 4px;
  }
  .ml-nav-section-header {
    display: flex; align-items: center; gap: 6px;
    padding: 10px 8px 4px;
  }
  .ml-nav-section-label {
    font-family: 'Space Mono', monospace; font-size: 8px;
    letter-spacing: 2px; text-transform: uppercase; color: var(--text-dim);
    flex: 1;
  }
  .ml-nav-section-badge {
    font-family: 'Space Mono', monospace; font-size: 7px;
    padding: 1px 5px; border-radius: 2px; letter-spacing: 0.5px;
  }
  .ml-nav-section-badge.live    { background: rgba(45,212,160,0.12); color: var(--green); border: 1px solid rgba(45,212,160,0.2); }
  .ml-nav-section-badge.soon    { background: rgba(137,196,225,0.1); color: var(--ice); border: 1px solid rgba(137,196,225,0.2); }
  .ml-nav-section-badge.planned { background: rgba(155,111,255,0.1); color: var(--purple); border: 1px solid rgba(155,111,255,0.2); }

  .ml-nav-link {
    display: flex; align-items: center; gap: 10px;
    padding: 8px 10px; border-radius: 4px; margin-bottom: 1px;
    font-size: 12px; font-weight: 600; color: var(--text-dim);
    text-decoration: none; transition: all 0.15s; cursor: pointer;
    position: relative;
  }
  .ml-nav-link:hover { background: rgba(201,168,76,0.06); color: var(--text); }
  .ml-nav-link.active { background: rgba(201,168,76,0.1); color: var(--gold); }
  .ml-nav-link.disabled { opacity: 0.4; cursor: not-allowed; pointer-events: none; }
  .ml-nav-icon { font-size: 14px; flex-shrink: 0; width: 18px; text-align: center; }
  .ml-nav-link.active .ml-nav-icon { filter: none; }
  .ml-nav-label { flex: 1; }
  .ml-nav-badge {
    background: var(--red); color: var(--text);
    font-family: 'Space Mono', monospace; font-size: 8px; font-weight: 700;
    padding: 1px 5px; border-radius: 8px; min-width: 14px; text-align: center;
  }
  .ml-nav-tag {
    font-family: 'Space Mono', monospace; font-size: 7px;
    padding: 1px 5px; border-radius: 2px;
  }
  .ml-nav-tag.soon    { background: rgba(137,196,225,0.1); color: var(--ice); }
  .ml-nav-tag.new     { background: rgba(201,168,76,0.15); color: var(--gold); }
  .ml-nav-tag.beta    { background: rgba(155,111,255,0.12); color: var(--purple); }

  /* Platform cards */
  .ml-platform-card {
    display: flex; align-items: center; gap: 10px;
    padding: 9px 10px; border-radius: 6px; margin-bottom: 3px;
    border: 1px solid transparent; text-decoration: none;
    transition: all 0.15s; cursor: pointer; color: var(--text-dim);
    font-size: 12px; font-weight: 600;
  }
  .ml-platform-card:hover { border-color: var(--border); background: var(--surface2); color: var(--text); }
  .ml-platform-card.active { border-color: rgba(201,168,76,0.3); background: rgba(201,168,76,0.06); color: var(--gold); }
  .ml-platform-icon { font-size: 16px; width: 20px; text-align: center; flex-shrink: 0; }
  .ml-platform-info { flex: 1; min-width: 0; }
  .ml-platform-name { font-size: 12px; font-weight: 700; }
  .ml-platform-desc { font-family: 'Space Mono', monospace; font-size: 8px; color: var(--text-dim); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ml-platform-status { font-family: 'Space Mono', monospace; font-size: 7px; padding: 1px 5px; border-radius: 2px; flex-shrink: 0; }
  .ml-platform-status.live    { background: rgba(45,212,160,0.12); color: var(--green); }
  .ml-platform-status.soon    { background: rgba(137,196,225,0.1); color: var(--ice); }
  .ml-platform-status.planned { background: rgba(155,111,255,0.1); color: var(--purple); }

  /* Divider */
  .ml-divider { height: 1px; background: var(--border); margin: 6px 8px; }

  /* Sidebar footer */
  .ml-sidebar-footer { padding: 12px; border-top: 1px solid var(--border); flex-shrink: 0; }
  .ml-user { display: flex; align-items: center; gap: 10px; padding: 8px 10px; border-radius: 6px; cursor: pointer; transition: background 0.15s; }
  .ml-user:hover { background: rgba(201,168,76,0.06); }
  .ml-user-avatar {
    width: 30px; height: 30px; border-radius: 50%;
    background: rgba(201,168,76,0.15); color: var(--gold);
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 800; flex-shrink: 0;
    border: 1px solid rgba(201,168,76,0.3);
  }
  .ml-user-name { font-size: 12px; font-weight: 700; }
  .ml-user-role { font-family: 'Space Mono', monospace; font-size: 8px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; }
  .ml-logout {
    width: 100%; background: transparent; border: 1px solid var(--border);
    border-radius: 4px; padding: 8px; font-family: 'Space Mono', monospace;
    font-size: 10px; color: var(--text-dim); cursor: pointer;
    transition: all 0.15s; margin-top: 8px; letter-spacing: 1px;
  }
  .ml-logout:hover { border-color: var(--red); color: var(--red); }

  /* ── Main area ── */
  .ml-main { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-width: 0; }
  .ml-header {
    height: 52px; border-bottom: 1px solid var(--border);
    background: var(--surface); display: flex; align-items: center;
    justify-content: space-between; padding: 0 20px; flex-shrink: 0;
    gap: 12px;
  }
  .ml-header-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
  .ml-breadcrumb { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); white-space: nowrap; }
  .ml-breadcrumb span { color: var(--gold); }
  .ml-header-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
  .ml-status { display: flex; align-items: center; gap: 6px; }
  .ml-status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); box-shadow: 0 0 6px var(--green); }
  .ml-status-text { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); }
  .ml-content { flex: 1; overflow-y: auto; }

  /* ── Hamburger ── */
  .ml-hamburger {
    display: none; flex-direction: column; justify-content: center; align-items: center;
    width: 34px; height: 34px; gap: 5px; cursor: pointer;
    background: transparent; border: 1px solid var(--border); border-radius: 4px;
    padding: 0; flex-shrink: 0;
  }
  .ml-hamburger span { display: block; width: 14px; height: 1.5px; background: var(--text); border-radius: 2px; transition: all 0.2s; }
  .ml-hamburger.open span:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
  .ml-hamburger.open span:nth-child(2) { opacity: 0; }
  .ml-hamburger.open span:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

  /* ── Overlay ── */
  .ml-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 99; }
  .ml-overlay.open { display: block; }

  /* ── Mobile bottom nav ── */
  .ml-bottom-nav {
    display: none; position: fixed; bottom: 0; left: 0; right: 0;
    background: var(--surface); border-top: 1px solid var(--border);
    z-index: 50;
  }
  .ml-bottom-nav-inner { display: flex; justify-content: space-around; align-items: center; height: 56px; padding: 0 4px; }
  .ml-bottom-link {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 2px; padding: 6px 10px; border-radius: 4px; text-decoration: none;
    color: var(--text-dim); transition: color 0.15s; font-size: 8px;
    font-family: 'Space Mono', monospace; letter-spacing: 0.5px; flex: 1;
    position: relative;
  }
  .ml-bottom-link.active { color: var(--gold); }
  .ml-bottom-link-icon { font-size: 18px; }
  .ml-bottom-badge {
    position: absolute; top: 4px; right: 8px;
    background: var(--red); color: var(--text); font-size: 7px; font-weight: 700;
    padding: 1px 4px; border-radius: 8px; min-width: 13px; text-align: center;
  }

  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

  /* ── Responsive ── */
  @media (max-width: 768px) {
    .ml-sidebar { position: fixed; top: 0; left: 0; bottom: 0; transform: translateX(-100%); }
    .ml-sidebar.open { transform: translateX(0); box-shadow: 4px 0 32px rgba(0,0,0,0.5); }
    .ml-hamburger { display: flex; }
    .ml-status-text { display: none; }
    .ml-header { padding: 0 14px; }
    .ml-bottom-nav { display: block; }
    .ml-content { padding-bottom: 56px; }
  }
  @media (max-width: 480px) {
    .ml-breadcrumb { display: none; }
  }
`;

// ── CORE PLATFORM NAV ─────────────────────────────────────────────────────────
const CORE_NAV = [
  { path: "/dashboard",     icon: "⬡",  label: "Control Center", tag: null },
  { path: "/analytics",     icon: "📊", label: "Analytics",      tag: null },
  { path: "/search",        icon: "🔍", label: "Smart Search",   tag: null },
  { path: "/activity",      icon: "📋", label: "Activity Log",   tag: null },
  { path: "/ops",           icon: "OPS",  label: "Core Ops",       tag: "new" },
];

// ── ECOSYSTEM PLATFORMS (each will become its own app/site) ──────────────────
const PLATFORMS = [
  {
    path:   "/community",
    icon:   "🧑‍🤝‍🧑",
    name:   "Winners Community",
    desc:   "Social feed · Chat · Profiles",
    status: "live",
    tag:    "v1.0",
    sub:    [
      { path: "/community", label: "Feed" },
      { path: "/community/groups", label: "Groups" },
      { path: "/community/spaces", label: "Live Spaces", icon: "📡" },
      { path: "/community/directory", label: "Directory", icon: "🌍" },
      { path: "/community/opportunities", label: "Opportunities", icon: "🔗" },
      { path: "/community/analytics", label: "Analytics", icon: "📊" },
      { path: "/community/creator", label: "Creator", icon: "💎" },
      { path: "/messages", label: "Messages" },
    ],
  },
  {
    path:   "/academy",
    icon:   "🎓",
    name:   "Winners Academy",
    desc:   "Courses · Certificates · AI Tutor",
    status: "live",
    tag:    "v1.0",
    sub:    [
      { path: "/academy", label: "Browse" },
      { path: "/academy/instructor", label: "Instructor" },
      { path: "/academy/my-learning", label: "My Learning" },
    ],
  },
  {
    path:   "/shop",
    icon:   "🛒",
    name:   "Winners Market",
    desc:   "Products · Dropshipping · Vendors",
    status: "soon",
    tag:    "v3.0",
  },
  {
    path:   "/intelligence",
    icon:   "🤖",
    name:   "Winners AI",
    desc:   "Agentic AI · Smart Automation",
    status: "live",
    tag:    "v1.0",
  },
  {
    path:   "/freelance",
    icon:   "💼",
    name:   "Winners Services",
    desc:   "Freelance Hub · Gigs · Booking",
    status: "planned",
    tag:    "v5.0",
  },
];

// ── TOOLS & MONETIZATION ─────────────────────────────────────────────────────
const TOOLS_NAV = [
  { path: "/stripe",        icon: "💳", label: "Revenue",        tag: null  },
  { path: "/billing",       icon: "💰", label: "Billing",        tag: null  },
  { path: "/referral",      icon: "🎁", label: "Referral",       tag: "new" },
  { path: "/export",        icon: "↓",  label: "Export",         tag: null  },
  { path: "/email",         icon: "📧", label: "Email Reports",  tag: null  },
  { path: "/slack",         icon: "💬", label: "Slack",          tag: null  },
];

// ── WORKSPACE NAV ─────────────────────────────────────────────────────────────
const WORKSPACE_NAV = [
  { path: "/team",          icon: "👥", label: "Team",           tag: null  },
  { path: "/notifications", icon: "🔔", label: "Notifications",  notif: true },
  { path: "/changelog",     icon: "🗞",  label: "What's New",     tag: "new" },
  { path: "/settings",      icon: "⚙️", label: "Settings",       tag: null  },
  { path: "/2fa",           icon: "🔐", label: "Security",       tag: null  },
  { path: "/profile",       icon: "👤", label: "Profile",        tag: null  },
  { path: "/admin",         icon: "🛡️", label: "Admin",          tag: null  },
];

// Mobile bottom — most used
const BOTTOM_NAV = [
  { path: "/dashboard",  icon: "⬡",  label: "Home",      notif: false },
  { path: "/community",  icon: "🧑‍🤝‍🧑", label: "Community", notif: false },
  { path: "/academy",    icon: "🎓",  label: "Learn",     notif: false },
  { path: "/intelligence",  icon: "🤖", label: "AI", notif: false },
  { path: "/analytics",  icon: "📊", label: "Analytics", notif: false },
  { path: "/notifications", icon: "🔔", label: "Alerts", notif: true  },
];

const ALL_NAV = [...CORE_NAV, ...TOOLS_NAV, ...WORKSPACE_NAV,
  ...PLATFORMS.map((p) => ({ path: p.path, label: p.name }))];

type NavEntry = {
  path: string;
  icon: string;
  label: string;
  tag?: string | null;
  notif?: boolean;
};

export default function MainLayout() {
  const user        = useAuthStore((s) => s.user);
  const logout      = useAuthStore((s) => s.logout);
  const navigate    = useNavigate();
  const location    = useLocation();
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initialsSource = `${user?.name ?? user?.email ?? ""}`.trim();
  const initials = initialsSource
    ? initialsSource.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";
  const pageName = ALL_NAV.find((n) => location.pathname.startsWith(n.path))?.label ?? "Dashboard";
  const closeSidebar = () => setSidebarOpen(false);

  const NavItem = ({ item }: { item: NavEntry }) => (
    <NavLink
      to={item.path}
      className={({ isActive }) => `ml-nav-link${isActive ? " active" : ""}`}
      onClick={closeSidebar}
    >
      <span className="ml-nav-icon">{item.icon}</span>
      <span className="ml-nav-label">{item.label}</span>
      {item.notif && unreadCount > 0 && (
        <span className="ml-nav-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>
      )}
      {item.tag && <span className={`ml-nav-tag ${item.tag}`}>{item.tag}</span>}
    </NavLink>
  );

  return (
    <div className="ml-root">
      <style>{css}</style>
      <div className={`ml-overlay${sidebarOpen ? " open" : ""}`} onClick={closeSidebar} />

      <aside className={`ml-sidebar${sidebarOpen ? " open" : ""}`}>
        {/* Logo */}
        <div className="ml-logo">
          <img src="/logo.jpg" alt="Winners Empire" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <div className="ml-logo-info">
            <div className="ml-logo-name">Winners Empire</div>
            <div className="ml-logo-tag">Digital Ecosystem</div>
          </div>
        </div>

        {/* AI Status */}
        <div className="ml-ai-bar">
          <div className="ml-ai-dot" />
          <div className="ml-ai-text">AI Core · Online · Monitoring</div>
        </div>

        {/* Tenant switcher */}
        <div className="ml-switcher-wrap">
          <TenantSwitcher onCreateNew={() => { navigate("/onboarding"); closeSidebar(); }} />
        </div>

        <nav className="ml-nav">
          {/* Core Platform */}
          <div className="ml-nav-section">
            <div className="ml-nav-section-header">
              <span className="ml-nav-section-label">Core Platform</span>
              <span className="ml-nav-section-badge live">Live</span>
            </div>
            {CORE_NAV.map((item) => <NavItem key={item.path} item={item} />)}
          </div>

          <div className="ml-divider" />

          {/* Ecosystem Platforms */}
          <div className="ml-nav-section">
            <div className="ml-nav-section-header">
              <span className="ml-nav-section-label">Ecosystem Platforms</span>
            </div>
            {PLATFORMS.map((p) => (
              <NavLink
                key={p.path}
                to={p.status === "live" ? p.path : "#"}
                className={({ isActive }) =>
                  `ml-platform-card${isActive && p.status === "live" ? " active" : ""}${p.status !== "live" ? " disabled" : ""}`
                }
                onClick={p.status === "live" ? closeSidebar : (e) => e.preventDefault()}
                style={{ pointerEvents: p.status !== "live" ? "none" : "auto", opacity: p.status !== "live" ? 0.55 : 1 }}
              >
                <span className="ml-platform-icon">{p.icon}</span>
                <div className="ml-platform-info">
                  <div className="ml-platform-name">{p.name}</div>
                  <div className="ml-platform-desc">{p.desc}</div>
                </div>
                <span className={`ml-platform-status ${p.status}`}>
                  {p.status === "live" ? "● Live" : p.status === "soon" ? "Soon" : "Planned"}
                </span>
              </NavLink>
            ))}
          </div>

          <div className="ml-divider" />

          {/* Tools & Revenue */}
          <div className="ml-nav-section">
            <div className="ml-nav-section-header">
              <span className="ml-nav-section-label">Tools & Revenue</span>
            </div>
            {TOOLS_NAV.map((item) => <NavItem key={item.path} item={item} />)}
          </div>

          <div className="ml-divider" />

          {/* Workspace */}
          <div className="ml-nav-section">
            <div className="ml-nav-section-header">
              <span className="ml-nav-section-label">Workspace</span>
            </div>
            {WORKSPACE_NAV.map((item) => <NavItem key={item.path} item={item} />)}
          </div>
        </nav>

        {/* User footer */}
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

      {/* Main content area */}
      <div className="ml-main">
        <header className="ml-header">
          <div className="ml-header-left">
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
            <div className="ml-status">
              <div className="ml-status-dot" />
              <span className="ml-status-text">All Systems Live</span>
            </div>
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>

        <main className="ml-content">
          <ContextBar showLabels={false} />
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
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
