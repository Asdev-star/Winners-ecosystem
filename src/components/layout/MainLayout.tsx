// src/components/layout/MainLayout.tsx

import { useEffect, useState, useCallback } from "react";
import { Outlet, useNavigate, useLocation, NavLink } from "react-router-dom";
import { Bell, BellOff } from "lucide-react";
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
import { useSuperAdminAccess } from "../../app/useSuperAdminAccess";
import ImpersonationBanner from "./ImpersonationBanner";
import { OMEGA_WELCOME_KEY, type OmegaLaunchWelcome } from "../../features/onboarding/omegaLaunchWelcome";
import { getOmegaProfileContext, getOmegaSidebarRank } from "../../features/onboarding/omegaProfileContext";
import { useEcosystemHealth } from "../../hooks/useEcosystemHealth";
import { usePushNotifications } from "../../hooks/usePushNotifications";

type AssistantKey = "aria" | "nova" | "sage" | "atlas" | "circuit" | "forge" | "nexus" | "herald" | "omega";

function getAssistantForPath(pathname: string): AssistantKey {
  if (pathname.startsWith("/admin") || pathname.startsWith("/ops")) return "omega";
  if (pathname.startsWith("/community"))    return "nova";
  if (pathname.startsWith("/academy"))      return "sage";
  if (pathname.startsWith("/market"))       return "atlas";
  if (pathname.startsWith("/work"))         return "circuit";
  if (pathname.startsWith("/intelligence")) return "forge";
  if (pathname.startsWith("/cloud"))        return "nexus";
  return "aria";
}

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
  .ml-nav-tag.entry   { background: rgba(45,212,160,0.14); color: var(--green); }
  .ml-nav-tag.hierarchy { background: rgba(201,168,76,0.14); color: var(--gold); }

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
  .ml-platform-card.sovereign {
    border-color: rgba(201,168,76,0.22);
    background: linear-gradient(135deg, rgba(201,168,76,0.14), rgba(13,24,38,0.92));
    color: var(--gold);
  }
  .ml-platform-card.sovereign:hover,
  .ml-platform-card.sovereign.active {
    border-color: rgba(201,168,76,0.4);
    background: linear-gradient(135deg, rgba(201,168,76,0.18), rgba(13,24,38,0.96));
    color: var(--gold);
  }
  .ml-platform-icon { font-size: 16px; width: 20px; text-align: center; flex-shrink: 0; }
  .ml-platform-info { flex: 1; min-width: 0; }
  .ml-platform-name { font-size: 12px; font-weight: 700; }
  .ml-platform-desc { font-family: 'Space Mono', monospace; font-size: 8px; color: var(--text-dim); margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ml-platform-card.sovereign .ml-platform-name { color: var(--gold); }
  .ml-platform-card.sovereign .ml-platform-desc { color: rgba(201,168,76,0.82); }
  .ml-platform-status { font-family: 'Space Mono', monospace; font-size: 7px; padding: 1px 5px; border-radius: 2px; flex-shrink: 0; }
  .ml-platform-status.live     { background: rgba(45,212,160,0.12);  color: var(--green);  }
  .ml-platform-status.building { background: rgba(201,168,76,0.10);  color: var(--gold);   }
  .ml-platform-status.soon     { background: rgba(137,196,225,0.1);  color: var(--ice);    }
  .ml-platform-status.planned  { background: rgba(155,111,255,0.1);  color: var(--purple); }
  .ml-platform-status.sovereign {
    background: rgba(201,168,76,0.14);
    border: 1px solid rgba(201,168,76,0.24);
    color: var(--gold);
  }
  .ml-platform-status.admin-only {
    background: rgba(201,168,76,0.14);
    border: 1px solid rgba(201,168,76,0.24);
    color: var(--gold);
    font-size: 0;
  }
  .ml-platform-status.admin-only::before {
    content: "ADMIN ONLY";
    font-size: 7px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

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
  
  .ml-offline-banner {
    background: var(--red);
    color: white;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    letter-spacing: 1px;
    animation: slideDown 0.3s ease;
  }
  
  @keyframes slideDown {
    from { height: 0; opacity: 0; }
    to { height: 24px; opacity: 1; }
  }

  .ml-root.admin-realm {
    --admin-accent: var(--gold);
  }
  .ml-root.admin-realm .ml-header {
    border-bottom-color: rgba(201,168,76,0.18);
    background:
      radial-gradient(circle at top right, rgba(201,168,76,0.12), transparent 28%),
      linear-gradient(135deg, rgba(16,24,37,0.98), rgba(11,18,29,0.96));
  }
  .ml-root.admin-realm .ml-content {
    background:
      radial-gradient(circle at top right, rgba(201,168,76,0.08), transparent 22%),
      radial-gradient(circle at left top, rgba(201,168,76,0.05), transparent 20%);
  }
  .ml-root.admin-realm .ml-status-text,
  .ml-root.admin-realm .ml-breadcrumb span {
    color: var(--gold);
  }
  .ml-root.admin-realm .ml-status-dot {
    background: var(--gold);
    box-shadow: 0 0 8px rgba(201,168,76,0.7);
  }
  .admin-card {
    position: relative;
    overflow: hidden;
  }
  .admin-card::before {
    content: "";
    position: absolute;
    inset: 0 auto auto 0;
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg, var(--gold), transparent);
    pointer-events: none;
  }
  .admin-badge {
    background: rgba(201,168,76,0.12);
    border: 1px solid rgba(201,168,76,0.3);
    color: var(--gold);
  }
  .admin-nav-item.active {
    color: var(--gold);
    border-bottom: 2px solid var(--gold);
  }
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
  .ml-mode-chip {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid rgba(201,168,76,0.18);
    background: rgba(201,168,76,0.08);
    color: var(--gold);
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }
  .ml-status { display: flex; align-items: center; gap: 6px; }
  .ml-status-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); box-shadow: 0 0 6px var(--green); }
  .ml-status-text { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); }
  .ml-content { flex: 1; overflow-y: auto; }
  .ml-utility-rail {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 12px;
    padding: 14px 20px 0;
  }
  .ml-utility-card {
    position: relative;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 18px;
    border-radius: 16px;
    border: 1px solid rgba(201,168,76,0.16);
    background:
      radial-gradient(circle at top right, rgba(201,168,76,0.14), transparent 32%),
      linear-gradient(135deg, rgba(19,29,43,0.98), rgba(11,18,29,0.96));
    box-shadow: 0 16px 40px rgba(0,0,0,0.18);
  }
  .ml-utility-card::before {
    content: "";
    position: absolute;
    inset: 0;
    border-radius: inherit;
    pointer-events: none;
    background: linear-gradient(135deg, rgba(255,255,255,0.04), transparent 38%);
  }
  .ml-utility-card.push-card {
    border-color: rgba(43,95,142,0.28);
    background:
      radial-gradient(circle at top right, rgba(43,95,142,0.18), transparent 34%),
      linear-gradient(135deg, rgba(17,31,47,0.98), rgba(11,18,29,0.96));
  }
  .ml-utility-kicker {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .ml-utility-icon {
    width: 34px;
    height: 34px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background: rgba(201,168,76,0.14);
    color: var(--gold);
  }
  .ml-utility-card.push-card .ml-utility-icon {
    background: rgba(43,95,142,0.18);
    color: var(--ice);
  }
  .ml-utility-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
  }
  .ml-utility-copy {
    margin: 0;
    color: var(--text-dim);
    font-size: 13px;
    line-height: 1.55;
  }
  .ml-utility-actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }
  .ml-utility-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    min-height: 36px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid rgba(201,168,76,0.24);
    background: rgba(201,168,76,0.12);
    color: var(--gold);
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    cursor: pointer;
    transition: transform 120ms ease, opacity 120ms ease, border-color 120ms ease;
  }
  .ml-utility-button:hover {
    transform: translateY(-1px);
    border-color: rgba(201,168,76,0.4);
  }
  .ml-utility-button.alt {
    border-color: rgba(43,95,142,0.28);
    background: rgba(43,95,142,0.14);
    color: var(--ice);
  }
  .ml-utility-button:disabled {
    cursor: progress;
    opacity: 0.7;
    transform: none;
  }
  .ml-utility-status {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .ml-omega-welcome {
    margin: 14px 20px 0;
    padding: 16px 18px;
    border-radius: 18px;
    border: 1px solid rgba(201,168,76,0.24);
    background:
      radial-gradient(circle at top right, rgba(201,168,76,0.18), transparent 36%),
      linear-gradient(135deg, rgba(23,34,50,0.98), rgba(13,20,33,0.96));
    box-shadow: 0 16px 44px rgba(0,0,0,0.28);
    animation: mlWelcomeIn 260ms ease;
  }
  .ml-omega-kicker {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--gold);
  }
  .ml-omega-kicker::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: var(--gold);
    box-shadow: 0 0 14px rgba(201,168,76,0.72);
  }
  .ml-omega-title {
    margin: 10px 0 6px;
    font-size: 20px;
    font-weight: 800;
    letter-spacing: -0.04em;
    color: var(--text);
  }
  .ml-omega-copy {
    margin: 0;
    max-width: 920px;
    font-size: 13px;
    line-height: 1.7;
    color: var(--text-dim);
  }
  .ml-omega-meta {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 12px;
  }
  .ml-omega-chip {
    display: inline-flex;
    align-items: center;
    min-height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: var(--text);
    font-family: 'Space Mono', monospace;
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
  .ml-omega-focus li::marker {
    color: var(--gold);
  }
  .ml-omega-dismiss {
    margin-top: 14px;
    min-height: 34px;
    padding: 0 12px;
    border-radius: 999px;
    border: 1px solid rgba(201,168,76,0.22);
    background: rgba(201,168,76,0.10);
    color: var(--gold);
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
  }

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
  @keyframes mlWelcomeIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

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
  { path: "/home",          icon: "⌂",  label: "User Home",      tag: "entry" },
  { path: "/settings",      icon: "⚙️", label: "Settings",       tag: "hierarchy" },
  { path: "/analytics",     icon: "📊", label: "Analytics",      tag: null },
  { path: "/search",        icon: "🔍", label: "Smart Search",   tag: null },
  { path: "/activity",      icon: "📋", label: "Activity Log",   tag: null },
];

const ADMIN_PLATFORM = {
  path:   "/dashboard",
  icon:   "⬡",
  name:   "Admin Dashboard",
  desc:   "Control Tower · FORGE · Admin Tools",
  status: "sovereign",
  tag:    "ADMIN ONLY",
  sub:    [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/settings/core", label: "Core Settings" },
    { path: "/admin/platform", label: "Platform" },
    { path: "/admin/tenants", label: "Tenants" },
    { path: "/admin/users", label: "Users" },
    { path: "/admin/revenue", label: "Revenue" },
    { path: "/admin/forge", label: "FORGE" },
    { path: "/admin/health", label: "System Health" },
    { path: "/admin/broadcast", label: "OMEGA Broadcast" },
    { path: "/admin/security", label: "Security" },
  ],
};

const FOUR_DOCUMENTS = [
  { path: "/dashboard", icon: "⬡", label: "Admin Dashboard", tag: "admin" },
  { path: "/settings/core", icon: "🧠", label: "Core Settings", tag: "admin" },
  { path: "/home", icon: "⌂", label: "User Home", tag: "user" },
  { path: "/settings", icon: "⚙️", label: "Settings", tag: "user" },
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
      { path: "/community/social-intelligence", label: "Social AI", icon: "🤖" },
      { path: "/community/social-accounts", label: "Connect Apps", icon: "🔗" },
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
      { path: "/academy/paths", label: "Learning Paths" },
      { path: "/academy/explore", label: "Explore Global" },
      { path: "/academy/study-groups", label: "Study Groups" },
      { path: "/academy/live-sessions", label: "Live Sessions" },
      { path: "/academy/instructor", label: "Instructor" },
      { path: "/academy/my-learning", label: "My Learning" },
    ],
  },
  {
    path:   "/market",
    icon:   "🛒",
    name:   "Winners Market",
    desc:   "Digital Products · AI Tools · Commerce",
    status: "building",
    tag:    "v4.0",
    sub:    [
      { path: "/market",                     label: "Market Hub",         icon: "🛒" },
      { path: "/market/dropshipping",        label: "Dropshipping",       icon: "📦" },
      { path: "/market/vendor",              label: "My Store",           icon: "🏪" },
      { path: "/market/cart",                label: "Cart",               icon: "🛍️" },
      { path: "/market/orders",              label: "Orders",             icon: "📋" },
      { path: "/market/finance",             label: "Finance",            icon: "💰" },
      { path: "/market/digital-marketing",   label: "Digital Marketing",  icon: "📣" },
      { path: "/market/business-launcher",   label: "Business Launcher",  icon: "🚀" },
      { path: "/market/cv-tools",            label: "CV Builder",         icon: "📄" },
      { path: "/market/stream",              label: "Streaming",          icon: "📺" },
      { path: "/market/trading",             label: "Trading",            icon: "📈" },
    ],
  },
  {
    path:   "/work",
    icon:   "💼",
    name:   "Winners Work",
    desc:   "Jobs · Freelancers · CIRCUIT AI",
    status: "building",
    tag:    "new",
    sub:    [
      { path: "/work",             label: "Browse Jobs",   icon: "🔍" },
      { path: "/work/freelancers", label: "Find Talent",   icon: "👤" },
      { path: "/work/contracts",   label: "My Contracts",  icon: "📄" },
      { path: "/work/profile",     label: "My Profile",    icon: "⚙️" },
    ],
  },
  {
    path:   "/cloud",
    icon:   "☁️",
    name:   "Winners Cloud",
    desc:   "APIs · Connectors · Automations · Agents",
    status: "building",
    tag:    "new",
    sub:    [
      { path: "/cloud",             label: "Developer Portal", icon: "☁️" },
      { path: "/cloud/keys",        label: "API Keys",         icon: "🔑" },
      { path: "/cloud/connectors",  label: "Connectors",       icon: "🔌" },
      { path: "/cloud/automations", label: "Automations",      icon: "⚡" },
      { path: "/cloud/agents",      label: "AI Agents",        icon: "🤖" },
      { path: "/cloud/webhooks",    label: "Webhooks",         icon: "🪝" },
      { path: "/cloud/usage",       label: "Usage",            icon: "📊" },
    ],
  },
  {
    path:   "/intelligence",
    icon:   "🤖",
    name:   "Winners Intelligence",
    desc:   "9 AI Supervisors · OMEGA · Streaming",
    status: "live",
    tag:    "v1.0",
    sub:    [
      { path: "/intelligence",         label: "AI Hub",           icon: "🤖" },
      { path: "/intelligence/aria",    label: "ARIA — Chat",      icon: "⬡"  },
      { path: "/intelligence/omega",   label: "OMEGA — Orchestrator", icon: "🧠" },
      { path: "/intelligence/platform", label: "AI Platform",    icon: "🧬" },
    ],
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
  { path: "/2fa",           icon: "🔐", label: "Security",       tag: null  },
  { path: "/profile",       icon: "👤", label: "Profile",        tag: null  },
];

// Mobile bottom — most used
const BOTTOM_NAV = [
  { path: "/home",         icon: "⌂",   label: "Home",      notif: false },
  { path: "/community",    icon: "🧑‍🤝‍🧑",  label: "Community", notif: false },
  { path: "/academy",      icon: "🎓",  label: "Learn",     notif: false },
  { path: "/work",         icon: "💼",  label: "Work",      notif: false },
  { path: "/intelligence", icon: "🤖",  label: "AI",        notif: false },
  { path: "/notifications",icon: "🔔",  label: "Alerts",    notif: true  },
];

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
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [omegaWelcome, setOmegaWelcome] = useState<OmegaLaunchWelcome | null>(null);
  const { hasAccess: hasSuperAdminAccess } = useSuperAdminAccess();
  const profileContext = getOmegaProfileContext(user?.onboardingProfileType);

  const { health } = useEcosystemHealth();
  const { supported, permission, subscribed, loading: pushLoading, subscribe, unsubscribe, error: pushError } = usePushNotifications();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online",  handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online",  handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const aiPlatformStatus = health["ai-platform"]?.status || "building";
  const aiStatusLabel = aiPlatformStatus === "live" || aiPlatformStatus === "active" 
    ? "Online" 
    : aiPlatformStatus === "building" ? "Synchronizing" : "Offline";
  const shouldOfferPush = supported && Boolean(user) && permission !== "denied";
  const showMobileUtilityRail = shouldOfferPush;
  const pushStatus = pushError
    ? pushError
    : !supported
      ? "Push not supported on this device"
      : subscribed
        ? "Push alerts active"
        : permission === "granted"
          ? "Ready to subscribe"
          : "Enable browser permission to receive alerts";

  const coreNavItems = CORE_NAV;
  const orderedPlatforms = [...PLATFORMS].sort(
    (left, right) => getOmegaSidebarRank(user?.onboardingProfileType, left.path) - getOmegaSidebarRank(user?.onboardingProfileType, right.path),
  );
  const platformItems = hasSuperAdminAccess ? [ADMIN_PLATFORM, ...orderedPlatforms] : orderedPlatforms;
  const fourDocumentItems = hasSuperAdminAccess
    ? FOUR_DOCUMENTS
    : FOUR_DOCUMENTS.filter((item) => item.tag === "user");
  const adminNavItems = hasSuperAdminAccess
    ? [
        { path: "/dashboard", label: "Admin Dashboard" },
        { path: "/settings/core", label: "Core Settings" },
        { path: "/admin/platform", label: "Platform" },
        { path: "/admin/tenants", label: "Tenants" },
        { path: "/admin/users", label: "Users" },
        { path: "/admin/revenue", label: "Revenue" },
        { path: "/admin/forge", label: "FORGE" },
        { path: "/admin/health", label: "System Health" },
        { path: "/admin/broadcast", label: "OMEGA Broadcast" },
        { path: "/admin/security", label: "Security" },
        { path: "/ops", label: "System Health" },
      ]
    : [];
  const shellPath = location.pathname;
  const allNav = [
    ...adminNavItems,
    ...fourDocumentItems.map((item) => ({ path: item.path, label: item.label })),
    ...coreNavItems,
    ...TOOLS_NAV,
    ...WORKSPACE_NAV,
    ...platformItems.map((p) => ({ path: p.path, label: p.name })),
  ];
  const initialsSource = `${user?.name ?? user?.email ?? ""}`.trim();
  const initials = initialsSource
    ? initialsSource.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()
    : "??";
  const pageName = [...allNav]
    .sort((a, b) => b.path.length - a.path.length)
    .find((n) => shellPath.startsWith(n.path))?.label ?? "Home";
  const inAdminRealm = shellPath.startsWith("/settings/core");
  const modeLabel = inAdminRealm ? "Admin Realm" : "User Realm";
  const systemStatusLabel = inAdminRealm ? "Sovereign Controls Live" : "User Systems Live";
  const layerSubNav = getLayerSubNavForPath(shellPath);
  const closeSidebar = () => setSidebarOpen(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem(OMEGA_WELCOME_KEY);
    if (!raw) {
      setOmegaWelcome(null);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as OmegaLaunchWelcome;
      if (parsed?.pathPrefix && location.pathname.startsWith(parsed.pathPrefix)) {
        setOmegaWelcome(parsed);
        sessionStorage.removeItem(OMEGA_WELCOME_KEY);
        return;
      }
    } catch {
      sessionStorage.removeItem(OMEGA_WELCOME_KEY);
    }

    setOmegaWelcome(null);
  }, [location.pathname]);

  useEffect(() => {
    if (!omegaWelcome) return;
    const timeoutMs = omegaWelcome.dismissAfterMs ?? 12000;
    const timer = window.setTimeout(() => setOmegaWelcome(null), timeoutMs);
    return () => window.clearTimeout(timer);
  }, [omegaWelcome]);

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
          <div className="ml-ai-dot" style={{ background: aiPlatformStatus === "live" ? "var(--green)" : aiPlatformStatus === "building" ? "var(--gold)" : "var(--red)" }} />
          <div className="ml-ai-text">OMEGA · {aiStatusLabel}</div>
        </div>

        {/* Tenant switcher */}
        <div className="ml-switcher-wrap">
          <TenantSwitcher onCreateNew={() => { navigate("/onboarding"); closeSidebar(); }} />
        </div>

        <nav className="ml-nav">
          <div className="ml-nav-section">
            <div className="ml-nav-section-header">
              <span className="ml-nav-section-label">System Overview</span>
            </div>
            {fourDocumentItems.map((item) => <NavItem key={item.path} item={item} />)}
          </div>

          <div className="ml-divider" />

          {/* Core Platform */}
          <div className="ml-nav-section">
            <div className="ml-nav-section-header">
              <span className="ml-nav-section-label">Core Platform</span>
              <span className="ml-nav-section-badge live">Live</span>
            </div>
            {coreNavItems.map((item) => <NavItem key={item.path} item={item} />)}
          </div>

          <div className="ml-divider" />

          {/* Ecosystem Platforms */}
          <div className="ml-nav-section">
            <div className="ml-nav-section-header">
              <span className="ml-nav-section-label">Ecosystem Platforms</span>
            </div>
            {platformItems.map((p) => {
              const navigable = p.status !== "planned";
              return (
                <NavLink
                  key={p.path}
                  to={navigable ? p.path : "#"}
                  className={({ isActive }) =>
                    `ml-platform-card${p.status === "sovereign" ? " sovereign" : ""}${isActive && navigable ? " active" : ""}${!navigable ? " disabled" : ""}`
                  }
                  onClick={navigable ? closeSidebar : (e) => e.preventDefault()}
                  style={{ pointerEvents: !navigable ? "none" : "auto", opacity: !navigable ? 0.4 : 1 }}
                >
                  <span className="ml-platform-icon">{p.icon}</span>
                  <div className="ml-platform-info">
                    <div className="ml-platform-name">{p.name}</div>
                    <div className="ml-platform-desc">{p.desc}</div>
                  </div>
                  <span className={`ml-platform-status ${p.status}${p.status === "sovereign" ? " admin-only" : ""}`}>
                    {p.status === "sovereign" ? "Root" : p.status === "live" ? "● Live" : p.status === "building" ? "● Build" : "Planned"}
                  </span>
                </NavLink>
              );
            })}
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
        {!isOnline && (
          <div className="ml-offline-banner">
            OFFLINE MODE — Syncing paused
          </div>
        )}
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
            <div className="ml-mode-chip">{modeLabel}</div>
            <div className="ml-status">
              <div className="ml-status-dot" />
              <span className="ml-status-text">{systemStatusLabel}</span>
            </div>
            <ThemeToggle />
            <NotificationBell />
          </div>
        </header>

        <ImpersonationBanner />
        {showMobileUtilityRail ? (
          <section className="ml-utility-rail" aria-label="Device actions">
            {shouldOfferPush ? (
              <div className="ml-utility-card push-card">
                <div className="ml-utility-kicker">
                  <span className="ml-utility-icon">
                    {subscribed ? <BellOff size={16} /> : <Bell size={16} />}
                  </span>
                  Real-time Alerts
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
                    {subscribed ? <BellOff size={14} /> : <Bell size={14} />}
                    {subscribed ? "Disable Alerts" : permission === "granted" ? "Connect Alerts" : "Enable Alerts"}
                  </button>
                  <span className="ml-utility-status">{pushStatus}</span>
                </div>
              </div>
            ) : null}
          </section>
        ) : null}
        {omegaWelcome ? (
          <section className="ml-omega-welcome" aria-live="polite">
            <div className="ml-omega-kicker">{omegaWelcome.supervisor} Welcome</div>
            <div className="ml-omega-title">{omegaWelcome.title}</div>
            <p className="ml-omega-copy">{omegaWelcome.message}</p>
            {omegaWelcome.profileType || omegaWelcome.entryPath || profileContext ? (
              <div className="ml-omega-meta">
                <span className="ml-omega-chip">{omegaWelcome.profileType ?? profileContext?.profileType ?? "Assigned Route"}</span>
                <span className="ml-omega-chip">{omegaWelcome.entryPath ?? profileContext?.entryPath ?? omegaWelcome.pathPrefix}</span>
                <span className="ml-omega-chip">{omegaWelcome.selectedPlan} plan</span>
              </div>
            ) : null}
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
        ) : null}

        <main className="ml-content">
          <LayerSubNav config={layerSubNav} />
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

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      <AssistantPanel
        assistant={getAssistantForPath(shellPath)}
        page={shellPath}
        context={{ pathname: shellPath }}
      />
    </div>
  );
}
