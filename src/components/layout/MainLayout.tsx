import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Activity, Bell, BellOff, Compass, Home, LayoutGrid, Search, Settings, Signal, Users } from "lucide-react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/authStore";
import TenantSwitcher from "../ui/TenantSwitcher";
import NotificationBell from "../../features/notifications/NotificationBell";
import { useNotificationStore } from "../../features/notifications/notificationStore";
import ThemeToggle from "../../features/theme/ThemeToggle";
import GlobalSearch from "../../features/search/GlobalSearch";
import LayerSubNav from "../navigation/LayerSubNav";
import { getLayerSubNavForPath } from "../navigation/layerSubNavConfigs";
import CommandPalette from "../ui/CommandPalette";
import AssistantPanel from "../ui/AssistantPanel";
import ImpersonationBanner from "./ImpersonationBanner";
import { OMEGA_WELCOME_KEY, type OmegaLaunchWelcome } from "../../features/onboarding/omegaLaunchWelcome";
import { getOmegaProfileContext, getOmegaSidebarRank } from "../../features/onboarding/omegaProfileContext";
import { useEcosystemHealth } from "../../hooks/useEcosystemHealth";
import { usePushNotifications } from "../../hooks/usePushNotifications";

type AssistantKey = "aria" | "nova" | "sage" | "atlas" | "circuit" | "forge" | "nexus" | "herald" | "omega";

const PRIMARY_NAV = [
  { path: "/home", label: "Home", icon: Home },
  { path: "/community", label: "Community", icon: Users },
  { path: "/academy", label: "Academy", icon: Compass },
  { path: "/market", label: "Market", icon: LayoutGrid },
  { path: "/intelligence", label: "AI", icon: Signal },
] as const;

const QUICK_NAV = [
  { path: "/search", label: "Search", icon: Search },
  { path: "/activity", label: "Activity", icon: Activity },
  { path: "/settings", label: "Settings", icon: Settings },
] as const;

function getAssistantForPath(pathname: string): AssistantKey {
  if (pathname.startsWith("/admin") || pathname.startsWith("/ops")) return "omega";
  if (pathname.startsWith("/community")) return "nova";
  if (pathname.startsWith("/academy")) return "sage";
  if (pathname.startsWith("/market")) return "atlas";
  if (pathname.startsWith("/work")) return "circuit";
  if (pathname.startsWith("/intelligence")) return "forge";
  if (pathname.startsWith("/cloud")) return "nexus";
  return "aria";
}

function getPageLabel(pathname: string) {
  const match = PRIMARY_NAV.find((item) => pathname === item.path || pathname.startsWith(`${item.path}/`));
  if (match) return match.label;
  if (pathname.startsWith("/settings/core")) return "Core Settings";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/notifications")) return "Notifications";
  if (pathname.startsWith("/activity")) return "Activity";
  if (pathname.startsWith("/team")) return "Team";
  if (pathname.startsWith("/billing")) return "Billing";
  if (pathname.startsWith("/export")) return "Export";
  if (pathname.startsWith("/email")) return "Email";
  if (pathname.startsWith("/profile")) return "Profile";
  return "Overview";
}

function getSystemLabel(status: ReturnType<typeof useEcosystemHealth>["health"]) {
  const core = status.core?.status;
  if (core === "live") return "System live";
  if (core === "active") return "System active";
  if (core === "building") return "System building";
  return "System planned";
}

const shellCss = `
  .ml-root {
    min-height: 100vh;
    display: flex;
    background:
      radial-gradient(circle at top left, rgba(137, 196, 225, 0.08), transparent 28%),
      radial-gradient(circle at top right, rgba(201, 168, 76, 0.08), transparent 24%),
      var(--bg);
    color: var(--text);
    overflow: hidden;
  }

  .ml-sidebar {
    width: 276px;
    flex: 0 0 auto;
    display: flex;
    flex-direction: column;
    background: color-mix(in srgb, var(--surface) 95%, transparent);
    border-right: 1px solid var(--border);
    backdrop-filter: blur(18px);
  }

  .ml-brand {
    padding: 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .ml-brand-mark {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: grid;
    place-items: center;
    background: linear-gradient(135deg, rgba(201,168,76,0.24), rgba(137,196,225,0.18));
    color: var(--gold);
    border: 1px solid rgba(201,168,76,0.22);
    font-size: 18px;
    font-weight: 800;
  }

  .ml-brand-name {
    font-size: 14px;
    font-weight: 800;
    letter-spacing: -0.03em;
    margin: 0;
  }

  .ml-brand-copy {
    margin: 2px 0 0;
    font-family: "Space Mono", monospace;
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-dim);
  }

  .ml-switcher {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
  }

  .ml-nav {
    padding: 16px;
    display: grid;
    gap: 6px;
  }

  .ml-section-label {
    margin: 10px 8px 2px;
    font-family: "Space Mono", monospace;
    font-size: 9px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--text-dim);
  }

  .ml-nav-link {
    display: flex;
    align-items: center;
    gap: 12px;
    min-height: 44px;
    padding: 0 12px;
    border-radius: 12px;
    color: var(--text-dim);
    text-decoration: none;
    border: 1px solid transparent;
    transition: background 160ms ease, border-color 160ms ease, color 160ms ease, transform 160ms ease;
  }

  .ml-nav-link:hover {
    background: color-mix(in srgb, var(--surface2) 78%, transparent);
    border-color: var(--border);
    color: var(--text);
    transform: translateY(-1px);
  }

  .ml-nav-link.active {
    background: color-mix(in srgb, var(--gold) 10%, transparent);
    border-color: color-mix(in srgb, var(--gold) 30%, var(--border));
    color: var(--text);
  }

  .ml-nav-icon {
    width: 18px;
    display: grid;
    place-items: center;
    flex: 0 0 auto;
  }

  .ml-nav-label {
    flex: 1;
    font-size: 13px;
    font-weight: 600;
  }

  .ml-nav-sub {
    font-family: "Space Mono", monospace;
    font-size: 8px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-dim);
  }

  .ml-quick-grid {
    display: grid;
    gap: 8px;
    padding: 0 16px 16px;
  }

  .ml-quick-link {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 40px;
    padding: 0 12px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: color-mix(in srgb, var(--surface2) 72%, transparent);
    color: var(--text);
    text-decoration: none;
    font-size: 12px;
    transition: border-color 160ms ease, transform 160ms ease, background 160ms ease;
  }

  .ml-quick-link:hover {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--blue) 35%, var(--border));
    background: color-mix(in srgb, var(--blue) 10%, var(--surface2));
  }

  .ml-footer {
    margin-top: auto;
    padding: 16px;
    border-top: 1px solid var(--border);
    display: grid;
    gap: 12px;
  }

  .ml-user {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 12px;
    background: color-mix(in srgb, var(--surface2) 68%, transparent);
    border: 1px solid var(--border);
  }

  .ml-user-avatar {
    width: 34px;
    height: 34px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: color-mix(in srgb, var(--gold) 16%, transparent);
    color: var(--gold);
    border: 1px solid color-mix(in srgb, var(--gold) 24%, var(--border));
    font-size: 12px;
    font-weight: 800;
  }

  .ml-user-name {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
  }

  .ml-user-role {
    margin: 2px 0 0;
    font-family: "Space Mono", monospace;
    font-size: 8px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
  }

  .ml-signout {
    min-height: 40px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text-dim);
    font-family: "Space Mono", monospace;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    cursor: pointer;
    transition: border-color 160ms ease, color 160ms ease, background 160ms ease;
  }

  .ml-signout:hover {
    border-color: color-mix(in srgb, var(--red) 32%, var(--border));
    color: var(--red);
    background: color-mix(in srgb, var(--red) 10%, transparent);
  }

  .ml-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  .ml-header {
    min-height: 64px;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    border-bottom: 1px solid var(--border);
    background: color-mix(in srgb, var(--surface) 92%, transparent);
    backdrop-filter: blur(18px);
  }

  .ml-header-left,
  .ml-header-right {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
  }

  .ml-menu-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--text);
    display: none;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    flex: 0 0 auto;
  }

  .ml-brandline {
    display: grid;
    gap: 2px;
    min-width: 0;
  }

  .ml-breadcrumb {
    font-family: "Space Mono", monospace;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ml-breadcrumb span {
    color: var(--gold);
  }

  .ml-chip {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: color-mix(in srgb, var(--surface2) 80%, transparent);
    font-family: "Space Mono", monospace;
    font-size: 9px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
    white-space: nowrap;
    cursor: default;
  }

  .ml-chip.primary {
    color: var(--gold);
    border-color: color-mix(in srgb, var(--gold) 24%, var(--border));
    background: color-mix(in srgb, var(--gold) 10%, transparent);
  }

  button.ml-chip {
    cursor: pointer;
  }

  .ml-status {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ml-status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--green);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--green) 15%, transparent);
  }

  .ml-status-text {
    font-family: "Space Mono", monospace;
    font-size: 9px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-dim);
  }

  .ml-content {
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 20px;
  }

  .ml-hero-grid {
    display: grid;
    grid-template-columns: minmax(0, 1.5fr) minmax(280px, 0.75fr);
    gap: 16px;
    margin-bottom: 16px;
  }

  .ml-surface-card {
    position: relative;
    border: 1px solid var(--border);
    border-radius: 18px;
    background: color-mix(in srgb, var(--surface) 96%, transparent);
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.18);
    overflow: hidden;
  }

  .ml-surface-card::before {
    content: "";
    position: absolute;
    inset: 0 auto auto 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, var(--gold), transparent);
  }

  .ml-omega-welcome,
  .ml-push-card {
    padding: 18px;
  }

  .ml-omega-kicker,
  .ml-utility-kicker {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: "Space Mono", monospace;
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--gold);
  }

  .ml-omega-title,
  .ml-utility-title {
    margin: 10px 0 8px;
    font-size: 18px;
    font-weight: 800;
    letter-spacing: -0.03em;
  }

  .ml-omega-copy,
  .ml-utility-copy {
    margin: 0;
    color: var(--text-dim);
    font-size: 13px;
    line-height: 1.55;
  }

  .ml-omega-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
  }

  .ml-omega-chip,
  .ml-utility-status {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid var(--border);
    background: color-mix(in srgb, var(--surface2) 78%, transparent);
    color: var(--text);
    font-family: "Space Mono", monospace;
    font-size: 9px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .ml-omega-focus {
    margin: 12px 0 0;
    padding-left: 18px;
    display: grid;
    gap: 6px;
    color: var(--text);
    font-size: 13px;
  }

  .ml-utility-rail {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 14px;
    margin-bottom: 16px;
  }

  .ml-utility-card {
    position: relative;
    border: 1px solid color-mix(in srgb, var(--blue) 18%, var(--border));
    border-radius: 18px;
    background:
      radial-gradient(circle at top right, rgba(137,196,225,0.12), transparent 30%),
      color-mix(in srgb, var(--surface) 94%, transparent);
    box-shadow: 0 20px 60px rgba(0,0,0,0.14);
    overflow: hidden;
  }

  .ml-utility-card::before {
    content: "";
    position: absolute;
    inset: 0 auto auto 0;
    width: 100%;
    height: 2px;
    background: linear-gradient(90deg, var(--blue), transparent);
  }

  .ml-utility-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-top: 12px;
  }

  .ml-utility-button,
  .ml-omega-dismiss {
    min-height: 40px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid color-mix(in srgb, var(--gold) 26%, var(--border));
    background: color-mix(in srgb, var(--gold) 10%, transparent);
    color: var(--gold);
    font-family: "Space Mono", monospace;
    font-size: 9px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    cursor: pointer;
    transition: transform 120ms ease, border-color 120ms ease, opacity 120ms ease;
  }

  .ml-utility-button:hover,
  .ml-omega-dismiss:hover {
    transform: translateY(-1px);
    border-color: color-mix(in srgb, var(--gold) 40%, var(--border));
  }

  .ml-utility-button.alt {
    border-color: color-mix(in srgb, var(--blue) 28%, var(--border));
    background: color-mix(in srgb, var(--blue) 10%, transparent);
    color: var(--ice);
  }

  .ml-omega-dismiss {
    margin-top: 14px;
  }

  .ml-offline-banner {
    min-height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--red);
    color: white;
    font-family: "Space Mono", monospace;
    font-size: 10px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .ml-bottom-nav {
    display: none;
    position: fixed;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 60;
    background: color-mix(in srgb, var(--surface) 96%, transparent);
    border-top: 1px solid var(--border);
    backdrop-filter: blur(18px);
  }

  .ml-bottom-nav-inner {
    min-height: 60px;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 4px;
    padding: 6px 8px;
  }

  .ml-bottom-link {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    min-height: 48px;
    border-radius: 12px;
    text-decoration: none;
    color: var(--text-dim);
    font-family: "Space Mono", monospace;
    font-size: 8px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .ml-bottom-link.active {
    color: var(--gold);
    background: color-mix(in srgb, var(--gold) 10%, transparent);
  }

  .ml-bottom-link-icon {
    font-size: 18px;
  }

  .ml-bottom-badge {
    position: absolute;
    top: 4px;
    right: 10px;
    min-width: 15px;
    height: 15px;
    padding: 0 4px;
    border-radius: 999px;
    background: var(--red);
    color: white;
    display: grid;
    place-items: center;
    font-size: 7px;
    font-weight: 700;
  }

  @media (max-width: 1024px) {
    .ml-sidebar {
      width: 248px;
    }
  }

  @media (max-width: 860px) {
    .ml-sidebar {
      position: fixed;
      inset: 0 auto 0 0;
      transform: translateX(-100%);
      transition: transform 220ms ease;
      z-index: 80;
    }

    .ml-sidebar.open {
      transform: translateX(0);
      box-shadow: 8px 0 40px rgba(0, 0, 0, 0.35);
    }

    .ml-menu-btn {
      display: inline-flex;
    }

    .ml-header {
      padding-inline: 14px;
    }

    .ml-content {
      padding: 16px 14px 84px;
    }

    .ml-hero-grid {
      grid-template-columns: 1fr;
    }

    .ml-bottom-nav {
      display: block;
    }
  }

  @media (max-width: 560px) {
    .ml-breadcrumb {
      display: none;
    }

    .ml-header-right .ml-chip,
    .ml-status-text {
      display: none;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .ml-nav-link,
    .ml-quick-link,
    .ml-utility-button,
    .ml-bottom-link {
      transition: none;
    }
  }
`;

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [omegaWelcome, setOmegaWelcome] = useState<OmegaLaunchWelcome | null>(null);
  const { health } = useEcosystemHealth();
  const {
    subscribed,
    subscribe,
    unsubscribe,
    loading: pushLoading,
    permission,
    error: pushError,
  } = usePushNotifications();

  const shellPath = location.pathname;
  const layerSubNav = useMemo(() => getLayerSubNavForPath(shellPath), [shellPath]);
  const profileContext = useMemo(() => getOmegaProfileContext(user?.onboardingProfileType), [user?.onboardingProfileType]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(OMEGA_WELCOME_KEY);
      if (saved) setOmegaWelcome(JSON.parse(saved) as OmegaLaunchWelcome);
    } catch {
      setOmegaWelcome(null);
    }
  }, []);

  useEffect(() => {
    if (!omegaWelcome) return;
    const t = window.setTimeout(() => {
      setOmegaWelcome(null);
      try {
        localStorage.removeItem(OMEGA_WELCOME_KEY);
      } catch {
        undefined;
      }
    }, 18_000);
    return () => window.clearTimeout(t);
  }, [omegaWelcome]);

  const initials = (user?.name ?? "Winner")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const pageName = getPageLabel(shellPath);
  const sidebarRank = getOmegaSidebarRank(user?.onboardingProfileType, shellPath);
  const modeLabel = `${user?.onboardingSelectedPlan ? String(user.onboardingSelectedPlan).replaceAll("_", " ") : "Focused mode"} · Rank ${sidebarRank}`;
  const systemStatusLabel = getSystemLabel(health);
  const aiStatusLabel = health.intelligence?.status === "live" || health.intelligence?.status === "active" ? "AI online" : "AI warming up";
  const assistant = getAssistantForPath(shellPath);
  const showPushBanner = shellPath === "/home" && Boolean(pushError || permission !== "unsupported");
  const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [shellPath]);

  const closeSidebar = () => setSidebarOpen(false);

  const signOut = () => {
    logout();
    navigate("/login");
  };

  const NavItem = ({
    path,
    label,
    icon: Icon,
  }: {
    path: string;
    label: string;
    icon: ComponentType<{ size?: number }>;
  }) => (
    <NavLink
      to={path}
      className={({ isActive }) => `ml-nav-link${isActive ? " active" : ""}`}
      onClick={closeSidebar}
    >
      <span className="ml-nav-icon"><Icon size={16} /></span>
      <span className="ml-nav-label">{label}</span>
    </NavLink>
  );

  return (
    <div className={`ml-root${shellPath.startsWith("/admin") ? " admin-realm" : ""}`}>
      <style>{shellCss}</style>
      <div className={`ml-sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="ml-brand">
          <div className="ml-brand-mark">⚔</div>
          <div style={{ minWidth: 0 }}>
            <div className="ml-brand-name">Winners Ecosystem</div>
            <div className="ml-brand-copy">Guide fast. Feel easy. Reward quickly.</div>
          </div>
        </div>

        <div className="ml-switcher">
          <TenantSwitcher
            onCreateNew={() => {
              navigate("/onboarding");
              closeSidebar();
            }}
          />
        </div>

        <div className="ml-nav">
          <div className="ml-section-label">Primary</div>
          {PRIMARY_NAV.map((item) => (
            <NavItem key={item.path} {...item} />
          ))}

          <div className="ml-section-label">Shortcuts</div>
          {QUICK_NAV.map((item) => (
            <NavItem key={item.path} {...item} />
          ))}
        </div>

        <div className="ml-footer">
          <div className="ml-user" onClick={() => { navigate("/profile"); closeSidebar(); }}>
            <div className="ml-user-avatar">{initials}</div>
            <div style={{ minWidth: 0 }}>
              <p className="ml-user-name">{user?.name ?? "Winner"}</p>
              <p className="ml-user-role">{user?.role ?? "Member"}</p>
            </div>
          </div>

          <button className="ml-signout" type="button" onClick={signOut}>
            Sign out
          </button>
        </div>
      </div>

      <div className="ml-main">
        {!isOnline && <div className="ml-offline-banner">Offline mode - syncing paused</div>}

        <header className="ml-header">
          <div className="ml-header-left">
            <button className="ml-menu-btn" type="button" onClick={() => setSidebarOpen((value) => !value)} aria-label="Toggle navigation">
              ☰
            </button>
            <GlobalSearch />
            <div className="ml-brandline">
              <div className="ml-breadcrumb">Winners <span>{pageName}</span></div>
              <div className="ml-status" aria-label="System status">
                <span className="ml-status-dot" />
                <span className="ml-status-text">{systemStatusLabel}</span>
              </div>
            </div>
          </div>

          <div className="ml-header-right">
            <div className="ml-chip primary">{modeLabel}</div>
            <div className="ml-chip">{aiStatusLabel}</div>
            <button type="button" className="ml-chip" onClick={() => setCommandPaletteOpen(true)}>
              / Command
            </button>
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>

        <ImpersonationBanner />

        {showPushBanner && (
          <section className="ml-utility-rail" aria-label="Device actions">
            <article className="ml-utility-card ml-push-card">
              <div className="ml-utility-kicker">
                <span>{subscribed ? <BellOff size={14} /> : <Bell size={14} />}</span>
                Real-time alerts
              </div>
              <div className="ml-utility-title">
                {subscribed ? "Push notifications are active" : "Stay ahead with push notifications"}
              </div>
              <p className="ml-utility-copy">
                Receive revenue, team, and intelligence alerts without keeping the tab open.
              </p>
              <div className="ml-utility-actions">
                <button
                  type="button"
                  className="ml-utility-button alt"
                  onClick={() => {
                    void (subscribed ? unsubscribe() : subscribe());
                  }}
                  disabled={pushLoading}
                >
                  {subscribed ? "Disable alerts" : permission === "granted" ? "Connect alerts" : "Enable alerts"}
                </button>
                <span className="ml-utility-status">{pushLoading ? "Updating..." : pushError ?? "Ready"}</span>
              </div>
            </article>
          </section>
        )}

        {omegaWelcome && (
          <section className="ml-surface-card ml-omega-welcome" aria-live="polite" style={{ margin: "0 0 16px" }}>
            <div className="ml-omega-kicker">{omegaWelcome.supervisor} welcome</div>
            <div className="ml-omega-title">{omegaWelcome.title}</div>
            <p className="ml-omega-copy">{omegaWelcome.message}</p>

            <div className="ml-omega-meta">
              <span className="ml-omega-chip">{omegaWelcome.profileType ?? profileContext?.profileType ?? "Assigned route"}</span>
              <span className="ml-omega-chip">{omegaWelcome.entryPath ?? profileContext?.entryPath ?? omegaWelcome.pathPrefix}</span>
              <span className="ml-omega-chip">{omegaWelcome.selectedPlan} plan</span>
            </div>

            {omegaWelcome.briefingFocus?.length ? (
              <ul className="ml-omega-focus">
                {omegaWelcome.briefingFocus.slice(0, 3).map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}

            {omegaWelcome.firstAction ? (
              <p className="ml-omega-copy" style={{ marginTop: 12 }}>
                First action: {omegaWelcome.firstAction}
              </p>
            ) : null}

            <button type="button" className="ml-omega-dismiss" onClick={() => setOmegaWelcome(null)}>
              Continue
            </button>
          </section>
        )}

        <main className="ml-content">
          <LayerSubNav config={layerSubNav} />
          <Outlet />
        </main>
      </div>

      <nav className="ml-bottom-nav" aria-label="Primary">
        <div className="ml-bottom-nav-inner">
          {PRIMARY_NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `ml-bottom-link${isActive ? " active" : ""}`}
            >
              <span className="ml-bottom-link-icon"><item.icon size={18} /></span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />

      <AssistantPanel assistant={assistant} page={shellPath} context={{ pathname: shellPath }} />
    </div>
  );
}
