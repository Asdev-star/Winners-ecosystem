import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { API_BASE } from "../../lib/api";
import { getAuthHeaders } from "../auth/authStore";

type AppLayerStatus = "live" | "in_progress" | "planned" | "deprecated" | "suspended";

type AdminStatsResponse = {
  totals: {
    tenants: number;
    users: number;
    revenue: number;
    newThisMonth: number;
    newThisWeek: number;
  };
  planDistribution: Array<{ plan: string; count: number }>;
  revenueByDay: Array<{ date: string; amount: number }>;
  revenueByPlan: Record<string, number>;
};

type PlatformLayer = {
  id: string;
  name: string;
  phase: number;
  status: AppLayerStatus;
  version: string;
  description: string;
  frontendPath: string;
  dependencies: string[];
  features: string[];
  updatedAt?: string;
};

type PlatformStatusResponse = {
  layers: PlatformLayer[];
  health: Record<string, string>;
};

type AdminTenantStatus = "active" | "suspended";

type TenantListItem = {
  id: string;
  name: string;
  plan: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  status: AdminTenantStatus;
  statusLabel: string;
  totalRevenue: number;
  monthlyRevenue: number;
  lastActivityAt?: string | null;
  owner?: { name: string; email: string } | null;
  userCount?: number;
  _count?: { users?: number };
};

type TenantListResponse = {
  tenants: TenantListItem[];
  total: number;
  page: number;
  pages: number;
  summary: {
    planCounts: {
      FREE: number;
      PRO: number;
      ENTERPRISE: number;
    };
    statusCounts: {
      active: number;
      suspended: number;
    };
    staleFreeCount: number;
    topTenant: {
      id: string;
      name: string;
      plan: string;
      monthlyRevenue: number;
    } | null;
    upgradeSignalsThisWeek: number;
  };
};

type TenantDetailResponse = {
  tenant: {
    id: string;
    name: string;
    plan: string;
    createdAt: string;
    deletedAt?: string | null;
    timezone?: string;
    currency?: string;
    fiscalMonth?: number;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    totalRevenue: number;
    last30Revenue: number;
    users: Array<{
      id: string;
      name: string;
      email: string;
      role: string;
      createdAt: string;
      twoFactorEnabled: boolean;
    }>;
    revenueRecords: Array<{
      id: string;
      amount: number;
      currency: string;
      source: string;
      description?: string | null;
      recordedAt: string;
    }>;
    _count: {
      users: number;
      revenueRecords: number;
      posts: number;
      groups: number;
      orders: number;
    };
  };
};

type UserListResponse = {
  users: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    tenant?: { name: string; plan: string };
  }>;
  total: number;
  page: number;
  pages: number;
};

type UserDetailResponse = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
    twoFactorEnabled: boolean;
    country?: string | null;
    city?: string | null;
    bio?: string | null;
    skills?: string[];
    industry?: string | null;
    isPublicProfile?: boolean;
    profileViews?: number;
    tenant: {
      id: string;
      name: string;
      plan: string;
      createdAt: string;
    };
    _count: {
      posts: number;
      messages: number;
      groupMemberships: number;
      courseEnrollments: number;
      hostedBroadcasts: number;
      hostedLiveSessions: number;
    };
  };
};

type ChecklistResponse = {
  layerName: string;
  isReady: boolean;
  issues: Array<{ item: string; status: string; required: boolean }>;
  checklist: Array<{ item: string; status: string; required: boolean }>;
  confirmationText?: string;
  launchSummary?: string;
  launchEffects?: string[];
};

type ConsoleLink = {
  path: string;
  icon: string;
  title: string;
  desc: string;
};

const CONSOLE_LINKS: ConsoleLink[] = [
  { path: "/admin/overview", icon: "⬡", title: "Overview", desc: "Ecosystem command view" },
  { path: "/admin/platform", icon: "🚀", title: "Platform", desc: "Layer launch control" },
  { path: "/admin/tenants", icon: "🏢", title: "Tenants", desc: "Workspace management" },
  { path: "/admin/users", icon: "👥", title: "Users", desc: "Identity management" },
  { path: "/admin/revenue", icon: "💰", title: "Revenue", desc: "Cross-layer revenue" },
  { path: "/admin/forge", icon: "🤖", title: "FORGE", desc: "Supervisor panel" },
  { path: "/admin/health", icon: "🩺", title: "Health", desc: "System uptime and services" },
  { path: "/admin/broadcast", icon: "📢", title: "Broadcast", desc: "OMEGA-wide messages" },
  { path: "/admin/security", icon: "🛡", title: "Security", desc: "RLS, GDPR, audit" },
  { path: "/admin/settings", icon: "⚙", title: "Settings", desc: "Platform config" },
];

const AI_SUPERVISORS = [
  { name: "ARIA", role: "General Intelligence", model: "claude-3-5-sonnet", status: "active", calls: 1842 },
  { name: "NOVA", role: "Community Intelligence", model: "claude-3-5-sonnet", status: "active", calls: 934 },
  { name: "SAGE", role: "Academy Intelligence", model: "claude-3-5-sonnet", status: "active", calls: 621 },
  { name: "OMEGA", role: "Autonomous Supervisor", model: "claude-3-opus", status: "standby", calls: 312 },
  { name: "ATLAS", role: "Market Intelligence", model: "claude-3-5-haiku", status: "active", calls: 289 },
  { name: "CIRCUIT", role: "Engineering Supervisor", model: "claude-3-5-haiku", status: "standby", calls: 178 },
  { name: "PHANTOM", role: "Security Monitor", model: "claude-3-5-haiku", status: "active", calls: 99 },
  { name: "NEXUS", role: "Cloud Orchestrator", model: "claude-3-5-haiku", status: "standby", calls: 67 },
  { name: "HERALD", role: "Notification Engine", model: "claude-3-5-haiku", status: "active", calls: 445 },
];

const css = `
  .act-root {
    max-width: 1160px;
    margin: 0 auto;
    padding: 24px 20px 80px;
    font-family: 'Syne', sans-serif;
    color: var(--text);
  }
  .act-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 18px;
    padding: 22px 24px;
    border-radius: 12px;
    border: 1px solid rgba(201, 168, 76, 0.18);
    background: linear-gradient(135deg, rgba(13, 24, 38, 0.94), rgba(17, 29, 46, 0.92));
  }
  .act-eyebrow {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 8px;
  }
  .act-title {
    margin: 0;
    font-size: 32px;
    font-weight: 800;
    letter-spacing: -0.04em;
  }
  .act-subtitle {
    margin: 8px 0 0;
    max-width: 760px;
    line-height: 1.6;
    color: var(--text-dim);
    font-size: 14px;
  }
  .act-header-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }
  .act-button,
  .act-link-button {
    border: 1px solid rgba(201, 168, 76, 0.28);
    background: rgba(201, 168, 76, 0.08);
    color: var(--gold);
    border-radius: 8px;
    padding: 10px 14px;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    cursor: pointer;
    text-decoration: none;
  }
  .act-button.ghost,
  .act-link-button.ghost {
    border-color: var(--border);
    color: var(--text-dim);
    background: var(--surface);
  }
  .act-button.danger {
    border-color: rgba(224, 90, 78, 0.26);
    color: var(--red);
    background: rgba(224, 90, 78, 0.08);
  }
  .act-button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .act-alert {
    margin-bottom: 14px;
    padding: 12px 14px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: rgba(13, 24, 38, 0.72);
    font-size: 13px;
  }
  .act-alert.error {
    border-color: rgba(224, 90, 78, 0.24);
    color: #ffbbb4;
  }
  .act-alert.success {
    border-color: rgba(45, 212, 160, 0.24);
    color: #a7f3d0;
  }
  .act-section {
    margin-top: 18px;
    padding: 18px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: rgba(13, 24, 38, 0.62);
  }
  .act-section-title {
    margin: 0 0 14px;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--gold);
  }
  .act-grid {
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    gap: 14px;
  }
  .act-card {
    grid-column: span 3;
    padding: 16px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface);
  }
  .act-card.wide {
    grid-column: span 6;
  }
  .act-card.full {
    grid-column: 1 / -1;
  }
  .act-kpi-label {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--text-dim);
    margin-bottom: 8px;
  }
  .act-kpi-value {
    font-size: 28px;
    font-weight: 800;
    letter-spacing: -0.05em;
    color: var(--gold);
  }
  .act-kpi-sub {
    margin-top: 6px;
    color: var(--text-dim);
    font-size: 12px;
  }
  .act-command-grid {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 12px;
  }
  .act-command {
    padding: 14px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface);
    text-decoration: none;
    color: var(--text);
  }
  .act-command-icon {
    font-size: 18px;
    margin-bottom: 10px;
  }
  .act-command-title {
    font-weight: 700;
    margin-bottom: 4px;
  }
  .act-command-desc {
    color: var(--text-dim);
    font-size: 12px;
    line-height: 1.5;
  }
  .act-layer-grid,
  .act-forge-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }
  .act-layer-card,
  .act-forge-card {
    padding: 16px;
    border-radius: 10px;
    border: 1px solid var(--border);
    background: var(--surface);
    text-decoration: none;
    color: var(--text);
  }
  .act-layer-top,
  .act-forge-top {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    align-items: flex-start;
    margin-bottom: 10px;
  }
  .act-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 8px;
    border-radius: 999px;
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    border: 1px solid var(--border);
  }
  .act-pill.live,
  .act-pill.ok,
  .act-pill.active {
    color: var(--green);
    border-color: rgba(45, 212, 160, 0.24);
    background: rgba(45, 212, 160, 0.08);
  }
  .act-pill.in_progress,
  .act-pill.attention,
  .act-pill.standby,
  .act-pill.suspended {
    color: var(--gold);
    border-color: rgba(201, 168, 76, 0.24);
    background: rgba(201, 168, 76, 0.08);
  }
  .act-pill.planned,
  .act-pill.info {
    color: var(--ice);
    border-color: rgba(137, 196, 225, 0.24);
    background: rgba(137, 196, 225, 0.08);
  }
  .act-pill.danger {
    color: var(--red);
    border-color: rgba(224, 90, 78, 0.24);
    background: rgba(224, 90, 78, 0.08);
  }
  .act-layer-name,
  .act-forge-name {
    font-size: 18px;
    font-weight: 800;
    margin: 0;
  }
  .act-layer-desc,
  .act-forge-desc,
  .act-body-copy {
    color: var(--text-dim);
    font-size: 13px;
    line-height: 1.6;
  }
  .act-meta {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 10px;
  }
  .act-meta-chip,
  .act-tag {
    display: inline-flex;
    align-items: center;
    padding: 4px 8px;
    border-radius: 999px;
    background: rgba(201, 168, 76, 0.08);
    border: 1px solid rgba(201, 168, 76, 0.14);
    color: var(--gold);
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.06em;
  }
  .act-table-wrap {
    overflow: hidden;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: var(--surface);
  }
  .act-table-header {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
  }
  .act-search {
    min-width: 240px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: rgba(13, 24, 38, 0.86);
    color: var(--text);
    padding: 10px 12px;
  }
  .act-table {
    width: 100%;
    border-collapse: collapse;
  }
  .act-table th,
  .act-table td {
    padding: 12px 14px;
    border-bottom: 1px solid var(--border);
    text-align: left;
    vertical-align: top;
    font-size: 13px;
  }
  .act-table th {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-dim);
  }
  .act-table tbody tr:last-child td {
    border-bottom: 0;
  }
  .act-pagination {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    padding: 14px 16px;
    border-top: 1px solid var(--border);
  }
  .act-mini-row {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  }
  .act-mini-row:last-child {
    border-bottom: 0;
  }
  .act-mini-label {
    color: var(--text-dim);
    font-size: 12px;
  }
  .act-mini-value {
    text-align: right;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
  }
  .act-sparkline {
    display: flex;
    align-items: end;
    gap: 6px;
    height: 200px;
    padding-top: 14px;
  }
  .act-spark-bar {
    flex: 1;
    border-radius: 999px 999px 4px 4px;
    background: linear-gradient(180deg, rgba(201, 168, 76, 0.95), rgba(201, 168, 76, 0.18));
    min-height: 8px;
  }
  .act-progress {
    height: 10px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.06);
    overflow: hidden;
    margin-top: 8px;
  }
  .act-progress-fill {
    height: 100%;
    border-radius: inherit;
    background: linear-gradient(90deg, var(--gold), var(--ice));
  }
  .act-list {
    margin: 0;
    padding-left: 18px;
    color: var(--text-dim);
  }
  .act-list li + li {
    margin-top: 8px;
  }
  .act-textarea,
  .act-select {
    width: 100%;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: rgba(13, 24, 38, 0.86);
    color: var(--text);
    padding: 10px 12px;
    font-family: inherit;
  }
  .act-textarea {
    min-height: 140px;
    resize: vertical;
  }
  .act-row {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    align-items: center;
  }
  .act-muted {
    color: var(--text-dim);
  }
  .atm-signal {
    margin-bottom: 18px;
    padding: 18px 20px;
    border-radius: 14px;
    border: 1px solid rgba(201, 168, 76, 0.22);
    background:
      radial-gradient(circle at top right, rgba(137, 196, 225, 0.12), transparent 34%),
      linear-gradient(135deg, rgba(17, 29, 46, 0.94), rgba(13, 24, 38, 0.92));
  }
  .atm-kicker {
    margin-bottom: 10px;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--gold);
  }
  .atm-signal-copy {
    margin: 0;
    color: #f4f0df;
    font-size: 15px;
    line-height: 1.7;
  }
  .atm-signal-copy strong {
    color: var(--gold);
  }
  .atm-stats {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 14px;
    margin-bottom: 18px;
  }
  .atm-stat {
    padding: 16px;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: linear-gradient(180deg, rgba(17, 29, 46, 0.88), rgba(13, 24, 38, 0.86));
  }
  .atm-stat-label {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .atm-stat-value {
    margin-top: 10px;
    font-size: 32px;
    font-weight: 800;
    letter-spacing: -0.05em;
    color: var(--gold);
  }
  .atm-stat-sub {
    margin-top: 8px;
    color: var(--text-dim);
    font-size: 12px;
  }
  .atm-toolbar {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    align-items: center;
    flex-wrap: wrap;
    margin-bottom: 18px;
  }
  .atm-filters {
    display: flex;
    gap: 10px;
    align-items: center;
    flex-wrap: wrap;
    flex: 1 1 720px;
  }
  .atm-select {
    min-width: 160px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: rgba(13, 24, 38, 0.86);
    color: var(--text);
    padding: 10px 12px;
    font-family: inherit;
  }
  .atm-table-wrap {
    overflow: hidden;
    border-radius: 14px;
    border: 1px solid var(--border);
    background: linear-gradient(180deg, rgba(17, 29, 46, 0.74), rgba(13, 24, 38, 0.78));
  }
  .atm-table-name {
    font-weight: 700;
    color: var(--text);
  }
  .atm-subcopy {
    margin-top: 4px;
    color: var(--text-dim);
    font-size: 12px;
    line-height: 1.5;
  }
  .atm-badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 96px;
    padding: 5px 10px;
    border-radius: 999px;
    border: 1px solid var(--border);
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .atm-badge.free {
    color: var(--ice);
    border-color: rgba(137, 196, 225, 0.26);
    background: rgba(137, 196, 225, 0.08);
  }
  .atm-badge.pro {
    color: var(--gold);
    border-color: rgba(201, 168, 76, 0.24);
    background: rgba(201, 168, 76, 0.08);
  }
  .atm-badge.enterprise {
    color: #d7c6ff;
    border-color: rgba(155, 111, 255, 0.28);
    background: rgba(155, 111, 255, 0.12);
  }
  .atm-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .atm-status::before {
    content: "";
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: currentColor;
    box-shadow: 0 0 10px currentColor;
  }
  .atm-status.active {
    color: var(--green);
  }
  .atm-status.suspended {
    color: var(--red);
  }
  .atm-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .atm-actions .act-button {
    padding: 8px 10px;
    font-size: 10px;
  }
  .atm-modal-backdrop {
    position: fixed;
    inset: 0;
    z-index: 90;
    display: grid;
    place-items: center;
    padding: 24px;
    background: rgba(3, 8, 15, 0.72);
    backdrop-filter: blur(8px);
  }
  .atm-modal {
    width: min(420px, 100%);
    padding: 22px;
    border-radius: 16px;
    border: 1px solid rgba(201, 168, 76, 0.22);
    background: linear-gradient(180deg, rgba(17, 29, 46, 0.98), rgba(11, 19, 31, 0.98));
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.42);
  }
  .atm-modal-title {
    margin: 0 0 8px;
    font-size: 22px;
    font-weight: 800;
  }
  .atm-modal-copy {
    margin: 0 0 16px;
    color: var(--text-dim);
    line-height: 1.6;
    font-size: 13px;
  }
  .act-empty {
    padding: 18px;
    border: 1px dashed var(--border);
    border-radius: 10px;
    color: var(--text-dim);
    background: rgba(13, 24, 38, 0.38);
  }
  @media (max-width: 1024px) {
    .atm-stats {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
    .act-card,
    .act-card.wide,
    .act-layer-card,
    .act-forge-card {
      grid-column: span 6;
    }
    .act-command-grid,
    .act-layer-grid,
    .act-forge-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
  @media (max-width: 720px) {
    .atm-stats {
      grid-template-columns: 1fr;
    }
    .act-grid {
      grid-template-columns: 1fr;
    }
    .act-card,
    .act-card.wide,
    .act-card.full,
    .act-layer-card,
    .act-forge-card {
      grid-column: auto;
    }
    .act-command-grid,
    .act-layer-grid,
    .act-forge-grid {
      grid-template-columns: 1fr;
    }
    .act-table-header,
    .act-pagination,
    .act-row {
      align-items: stretch;
      flex-direction: column;
    }
    .act-search {
      min-width: 0;
      width: 100%;
    }
  }
`;

function fmtMoney(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value >= 1000 ? 0 : 2,
  }).format(value ?? 0);
}

function fmtDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function fmtRelativeDay(value?: string | null) {
  if (!value) return "No activity";
  const date = new Date(value);
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  if (days <= 0) return "Today";
  if (days === 1) return "1d ago";
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = {
    ...getAuthHeaders(),
    ...(init.body ? { "Content-Type": "application/json" } : {}),
    ...(init.headers ?? {}),
  };
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((body as { message?: string; error?: string }).message ?? (body as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return body as T;
}

function AdminConsoleShell({
  eyebrow,
  title,
  subtitle,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="act-root">
      <style>{css}</style>
      <div className="act-header">
        <div>
          <div className="act-eyebrow">{eyebrow}</div>
          <h1 className="act-title">{title}</h1>
          <p className="act-subtitle">{subtitle}</p>
        </div>
        {actions ? <div className="act-header-actions">{actions}</div> : null}
      </div>
      {children}
    </div>
  );
}

function MessageBanner({ error, success }: { error?: string; success?: string }) {
  return (
    <>
      {error ? <div className="act-alert error">{error}</div> : null}
      {success ? <div className="act-alert success">{success}</div> : null}
    </>
  );
}

function CommandDeck() {
  return (
    <div className="act-command-grid">
      {CONSOLE_LINKS.map((item) => (
        <Link key={item.path} to={item.path} className="act-command">
          <div className="act-command-icon">{item.icon}</div>
          <div className="act-command-title">{item.title}</div>
          <div className="act-command-desc">{item.desc}</div>
        </Link>
      ))}
    </div>
  );
}

function RevenueBars({ data }: { data: Array<{ date: string; amount: number }> }) {
  const maxRevenue = Math.max(...data.map((entry) => entry.amount), 1);

  return (
    <div className="act-sparkline">
      {data.map((entry) => (
        <div
          key={entry.date}
          className="act-spark-bar"
          style={{ height: `${Math.max(8, (entry.amount / maxRevenue) * 100)}%` }}
          title={`${entry.date}: ${fmtMoney(entry.amount)}`}
        />
      ))}
    </div>
  );
}

export function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [platforms, setPlatforms] = useState<PlatformStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        const [statsData, platformData] = await Promise.all([
          apiRequest<AdminStatsResponse>("/admin/stats"),
          apiRequest<PlatformStatusResponse>("/admin/platform/status"),
        ]);
        if (!cancelled) {
          setStats(statsData);
          setPlatforms(platformData);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load overview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminConsoleShell
      eyebrow="Admin Control Tower"
      title="Ecosystem Command View"
      subtitle="One sovereign surface for layer launches, workspace oversight, operator broadcasts, and platform-wide intelligence."
      actions={<Link className="act-link-button ghost" to="/admin/platform">Open layer matrix</Link>}
    >
      <MessageBanner error={error} />

      {loading || !stats || !platforms ? (
        <div className="act-empty">Loading sovereign overview…</div>
      ) : (
        <>
          <div className="act-grid">
            <div className="act-card">
              <div className="act-kpi-label">Tenants</div>
              <div className="act-kpi-value">{stats.totals.tenants}</div>
              <div className="act-kpi-sub">{stats.totals.newThisWeek} new this week</div>
            </div>
            <div className="act-card">
              <div className="act-kpi-label">Users</div>
              <div className="act-kpi-value">{stats.totals.users}</div>
              <div className="act-kpi-sub">All identities across the ecosystem</div>
            </div>
            <div className="act-card">
              <div className="act-kpi-label">Revenue</div>
              <div className="act-kpi-value">{fmtMoney(stats.totals.revenue)}</div>
              <div className="act-kpi-sub">Cross-layer lifetime revenue</div>
            </div>
            <div className="act-card">
              <div className="act-kpi-label">Layers</div>
              <div className="act-kpi-value">{platforms.layers.length}</div>
              <div className="act-kpi-sub">{platforms.layers.filter((layer) => layer.status === "live").length} live now</div>
            </div>
          </div>

          <div className="act-section">
            <h2 className="act-section-title">Sovereign Routes</h2>
            <CommandDeck />
          </div>

          <div className="act-section">
            <h2 className="act-section-title">Layer Pulse</h2>
            <div className="act-layer-grid">
              {platforms.layers.map((layer) => (
                <Link key={layer.id} to={`/admin/platform/${layer.id}`} className="act-layer-card">
                  <div className="act-layer-top">
                    <div>
                      <div className="act-eyebrow">Phase {layer.phase}</div>
                      <h3 className="act-layer-name">{layer.name}</h3>
                    </div>
                    <span className={`act-pill ${layer.status}`}>{layer.status.replace("_", " ")}</span>
                  </div>
                  <div className="act-layer-desc">{layer.description}</div>
                  <div className="act-meta">
                    <span className="act-meta-chip">{layer.features.length} features</span>
                    <span className="act-meta-chip">{layer.dependencies.length} deps</span>
                    <span className="act-meta-chip">{layer.version}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="act-grid">
            <div className="act-card wide">
              <div className="act-section-title">Revenue Momentum</div>
              <RevenueBars data={stats.revenueByDay.slice(-14)} />
            </div>
            <div className="act-card wide">
              <div className="act-section-title">Service Health</div>
              {Object.entries(platforms.health).map(([service, state]) => (
                <div key={service} className="act-mini-row">
                  <span className="act-mini-label">{service}</span>
                  <span className="act-mini-value">{state}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </AdminConsoleShell>
  );
}

export function AdminPlatformPage() {
  const [data, setData] = useState<PlatformStatusResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await apiRequest<PlatformStatusResponse>("/admin/platform/status");
        if (!cancelled) {
          setData(response);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load platform layers");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AdminConsoleShell
      eyebrow="Admin / Platform"
      title="Layer Launch Control"
      subtitle="Inspect readiness, dependencies, and sovereign launch status for every ecosystem layer."
    >
      <MessageBanner error={error} />

      {!data ? (
        <div className="act-empty">Loading layer registry…</div>
      ) : (
        <div className="act-layer-grid">
          {data.layers.map((layer) => (
            <Link key={layer.id} to={`/admin/platform/${layer.id}`} className="act-layer-card">
              <div className="act-layer-top">
                <div>
                  <div className="act-eyebrow">{layer.id}</div>
                  <h2 className="act-layer-name">{layer.name}</h2>
                </div>
                <span className={`act-pill ${layer.status}`}>{layer.status.replace("_", " ")}</span>
              </div>
              <div className="act-layer-desc">{layer.description}</div>
              <div className="act-meta">
                <span className="act-meta-chip">Phase {layer.phase}</span>
                <span className="act-meta-chip">{layer.dependencies.length} dependencies</span>
                <span className="act-meta-chip">{layer.features.length} features</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </AdminConsoleShell>
  );
}

export function AdminRevenuePage() {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await apiRequest<AdminStatsResponse>("/admin/stats");
        if (!cancelled) {
          setStats(response);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load revenue");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const maxPlan = Math.max(...Object.values(stats?.revenueByPlan ?? { total: 1 }), 1);

  return (
    <AdminConsoleShell
      eyebrow="Admin / Revenue"
      title="Revenue Across All Layers"
      subtitle="Monitor sovereign revenue totals, plan distribution, and the latest multi-tenant revenue movement."
    >
      <MessageBanner error={error} />

      {!stats ? (
        <div className="act-empty">Loading revenue telemetry…</div>
      ) : (
        <>
          <div className="act-grid">
            <div className="act-card"><div className="act-kpi-label">Total Revenue</div><div className="act-kpi-value">{fmtMoney(stats.totals.revenue)}</div><div className="act-kpi-sub">Lifetime ecosystem revenue</div></div>
            <div className="act-card"><div className="act-kpi-label">New Tenants</div><div className="act-kpi-value">{stats.totals.newThisMonth}</div><div className="act-kpi-sub">Joined this month</div></div>
            <div className="act-card"><div className="act-kpi-label">New This Week</div><div className="act-kpi-value">{stats.totals.newThisWeek}</div><div className="act-kpi-sub">Latest growth window</div></div>
            <div className="act-card"><div className="act-kpi-label">Workspaces</div><div className="act-kpi-value">{stats.totals.tenants}</div><div className="act-kpi-sub">Billing entities</div></div>
          </div>

          <div className="act-grid">
            <div className="act-card wide">
              <div className="act-section-title">Revenue Trend</div>
              <RevenueBars data={stats.revenueByDay} />
            </div>
            <div className="act-card wide">
              <div className="act-section-title">Revenue By Plan</div>
              {Object.entries(stats.revenueByPlan).map(([plan, amount]) => (
                <div key={plan} style={{ marginBottom: 12 }}>
                  <div className="act-mini-row" style={{ padding: 0, borderBottom: 0, marginBottom: 8 }}>
                    <span className="act-mini-label">{plan}</span>
                    <span className="act-mini-value">{fmtMoney(amount)}</span>
                  </div>
                  <div className="act-progress">
                    <div className="act-progress-fill" style={{ width: `${(amount / maxPlan) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </AdminConsoleShell>
  );
}

export function AdminPlatformLayerPage() {
  const navigate = useNavigate();
  const { layerId = "" } = useParams();
  const [data, setData] = useState<PlatformStatusResponse | null>(null);
  const [checklist, setChecklist] = useState<ChecklistResponse | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);

  const layer = useMemo(() => data?.layers.find((entry) => entry.id === layerId) ?? null, [data, layerId]);

  async function refresh() {
    const response = await apiRequest<PlatformStatusResponse>("/admin/platform/status");
    setData(response);
  }

  async function runChecklist() {
    if (!layerId) return;
    try {
      setBusy(true);
      const response = await apiRequest<ChecklistResponse>(`/admin/platform/${layerId}/checklist`, {
        method: "POST",
      });
      setChecklist(response);
      setSuccess(`Checklist completed for ${response.layerName}.`);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run checklist");
    } finally {
      setBusy(false);
    }
  }

  async function launchLayer() {
    if (!layerId) return;
    const confirmationText = checklist?.confirmationText ?? `LAUNCH ${layerId.toUpperCase()}`;
    const launchSummary = checklist?.launchSummary ?? `Launch ${layer?.name ?? layerId} from admin.`;
    const typed = window.prompt(
      `${launchSummary}\n\nType "${confirmationText}" to launch ${layer?.name ?? layerId}.`,
      "",
    );
    if (typed === null) return;

    try {
      setBusy(true);
      await apiRequest(`/admin/platform/${layerId}/launch`, {
        method: "POST",
        body: JSON.stringify({ confirmationText: typed }),
      });
      await refresh();
      setSuccess(`${layerId} launch command issued.`);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to launch layer");
    } finally {
      setBusy(false);
    }
  }

  async function suspendLayer() {
    if (!layerId) return;
    const reason = window.prompt("Why are you suspending this layer?") ?? "";
    try {
      setBusy(true);
      await apiRequest(`/admin/platform/${layerId}/suspend`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      });
      await refresh();
      setSuccess(`${layerId} suspend command issued.`);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to suspend layer");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await apiRequest<PlatformStatusResponse>("/admin/platform/status");
        if (!cancelled) {
          setData(response);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load layer");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [layerId]);

  return (
    <AdminConsoleShell
      eyebrow={`Admin / Platform / ${layerId || "layer"}`}
      title={layer?.name ?? "Layer Deep-Dive"}
      subtitle={layer?.description ?? "Inspect readiness, dependencies, launch state, and the sovereign actions available for this layer."}
      actions={
        <>
          <button className="act-button ghost" onClick={() => navigate("/admin/platform")}>Back to layers</button>
          <button className="act-button ghost" onClick={runChecklist} disabled={busy || !layer}>Run checklist</button>
          <button className="act-button" onClick={launchLayer} disabled={busy || !layer}>Launch</button>
          <button className="act-button danger" onClick={suspendLayer} disabled={busy || !layer}>Suspend</button>
        </>
      }
    >
      <MessageBanner error={error} success={success} />

      {!layer ? (
        <div className="act-empty">This layer was not found in the registry.</div>
      ) : (
        <>
          <div className="act-grid">
            <div className="act-card">
              <div className="act-kpi-label">Status</div>
              <div className="act-kpi-value">{layer.status}</div>
              <div className="act-kpi-sub">Current sovereign state</div>
            </div>
            <div className="act-card">
              <div className="act-kpi-label">Phase</div>
              <div className="act-kpi-value">{layer.phase}</div>
              <div className="act-kpi-sub">Roadmap stage</div>
            </div>
            <div className="act-card">
              <div className="act-kpi-label">Dependencies</div>
              <div className="act-kpi-value">{layer.dependencies.length}</div>
              <div className="act-kpi-sub">Must be live before launch</div>
            </div>
            <div className="act-card">
              <div className="act-kpi-label">Features</div>
              <div className="act-kpi-value">{layer.features.length}</div>
              <div className="act-kpi-sub">Registered capabilities</div>
            </div>
          </div>

          <div className="act-grid">
            <div className="act-card wide">
              <div className="act-section-title">Dependencies</div>
              {layer.dependencies.length ? (
                <div className="act-meta">
                  {layer.dependencies.map((dependency) => (
                    <span key={dependency} className="act-meta-chip">{dependency}</span>
                  ))}
                </div>
              ) : (
                <div className="act-empty">This layer has no upstream dependencies.</div>
              )}
            </div>
            <div className="act-card wide">
              <div className="act-section-title">Registered Features</div>
              <div className="act-meta">
                {layer.features.map((feature) => (
                  <span key={feature} className="act-tag">{feature}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="act-grid">
            <div className="act-card wide">
              <div className="act-section-title">Layer Target</div>
              <div className="act-mini-row">
                <span className="act-mini-label">Frontend path</span>
                <span className="act-mini-value">{layer.frontendPath}</span>
              </div>
              <div className="act-mini-row">
                <span className="act-mini-label">Version</span>
                <span className="act-mini-value">{layer.version}</span>
              </div>
              <div className="act-mini-row">
                <span className="act-mini-label">Updated</span>
                <span className="act-mini-value">{fmtDate(layer.updatedAt)}</span>
              </div>
            </div>
            <div className="act-card wide">
              <div className="act-section-title">Shared Service Health</div>
              {Object.entries(data?.health ?? {}).map(([service, status]) => (
                <div key={service} className="act-mini-row">
                  <span className="act-mini-label">{service}</span>
                  <span className="act-mini-value">{status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="act-section">
            <h2 className="act-section-title">Checklist</h2>
            {checklist ? (
              <div className="act-grid">
                <div className="act-card wide">
                  <div className="act-kpi-label">Readiness</div>
                  <div className="act-kpi-value">{checklist.isReady ? "Ready" : "Blocked"}</div>
                  <div className="act-kpi-sub">{checklist.isReady ? "No required blockers remain." : `${checklist.issues.length} required issue(s) must be resolved.`}</div>
                </div>
                <div className="act-card wide">
                  <div className="act-section-title">Checklist Items</div>
                  {checklist.launchSummary ? (
                    <div className="act-mini-row">
                      <span className="act-mini-label">Launch summary</span>
                      <span className="act-mini-value">{checklist.launchSummary}</span>
                    </div>
                  ) : null}
                  {checklist.confirmationText ? (
                    <div className="act-mini-row">
                      <span className="act-mini-label">Confirmation</span>
                      <span className="act-mini-value">{checklist.confirmationText}</span>
                    </div>
                  ) : null}
                  {checklist.checklist.map((item) => (
                    <div key={item.item} className="act-mini-row">
                      <span className="act-mini-label">{item.item}</span>
                      <span className="act-mini-value">{item.status}</span>
                    </div>
                  ))}
                  {checklist.launchEffects?.map((effect) => (
                    <div key={effect} className="act-mini-row">
                      <span className="act-mini-label">Launch effect</span>
                      <span className="act-mini-value">{effect}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="act-empty">Run the checklist to inspect launch blockers for this layer.</div>
            )}
          </div>
        </>
      )}
    </AdminConsoleShell>
  );
}

export function AdminTenantsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<TenantListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await apiRequest<TenantListResponse>(`/admin/tenants?page=${page}&q=${encodeURIComponent(search)}`);
        if (!cancelled) {
          setData(response);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load tenants");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [page, search]);

  return (
    <AdminConsoleShell
      eyebrow="Admin / Tenants"
      title="Workspace Management"
      subtitle="Inspect every tenant in the ecosystem, monitor revenue, and step into a single workspace for sovereign action."
    >
      <MessageBanner error={error} />

      {!data ? (
        <div className="act-empty">Loading tenants…</div>
      ) : (
        <div className="act-table-wrap">
          <div className="act-table-header">
            <strong>{data.total} workspaces</strong>
            <input
              className="act-search"
              placeholder="Search workspace name…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <table className="act-table">
            <thead>
              <tr>
                <th>Workspace</th>
                <th>Plan</th>
                <th>Users</th>
                <th>Revenue</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.tenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td>
                    <strong>{tenant.name}</strong>
                    <div className="act-muted">{tenant.id}</div>
                  </td>
                  <td>{tenant.plan}</td>
                  <td>{tenant._count?.users ?? 0}</td>
                  <td>{fmtMoney(tenant.totalRevenue)}</td>
                  <td>{fmtDate(tenant.createdAt)}</td>
                  <td>
                    <button className="act-button ghost" onClick={() => navigate(`/admin/tenants/${tenant.id}`)}>
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="act-pagination">
            <span>Page {data.page} of {data.pages || 1}</span>
            <div className="act-row">
              <button className="act-button ghost" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Prev</button>
              <button className="act-button ghost" disabled={page >= (data.pages || 1)} onClick={() => setPage((current) => current + 1)}>Next</button>
            </div>
          </div>
        </div>
      )}
    </AdminConsoleShell>
  );
}

export function AdminUsersPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<UserListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await apiRequest<UserListResponse>(`/admin/users?page=${page}&q=${encodeURIComponent(search)}`);
        if (!cancelled) {
          setData(response);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load users");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [page, search]);

  return (
    <AdminConsoleShell
      eyebrow="Admin / Users"
      title="All User Management"
      subtitle="Browse every identity in the ecosystem, inspect tenant assignment, and drill into a specific user profile."
    >
      <MessageBanner error={error} />

      {!data ? (
        <div className="act-empty">Loading users…</div>
      ) : (
        <div className="act-table-wrap">
          <div className="act-table-header">
            <strong>{data.total} users</strong>
            <input
              className="act-search"
              placeholder="Search name or email…"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </div>
          <table className="act-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Workspace</th>
                <th>Plan</th>
                <th>Joined</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {data.users.map((user) => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>{user.tenant?.name ?? "—"}</td>
                  <td>{user.tenant?.plan ?? "—"}</td>
                  <td>{fmtDate(user.createdAt)}</td>
                  <td>
                    <button className="act-button ghost" onClick={() => navigate(`/admin/users/${user.id}`)}>
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="act-pagination">
            <span>Page {data.page} of {data.pages || 1}</span>
            <div className="act-row">
              <button className="act-button ghost" disabled={page <= 1} onClick={() => setPage((current) => current - 1)}>Prev</button>
              <button className="act-button ghost" disabled={page >= (data.pages || 1)} onClick={() => setPage((current) => current + 1)}>Next</button>
            </div>
          </div>
        </div>
      )}
    </AdminConsoleShell>
  );
}

export function AdminTenantDetailPage() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const [data, setData] = useState<TenantDetailResponse | null>(null);
  const [newPlan, setNewPlan] = useState("PRO");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function load() {
    const response = await apiRequest<TenantDetailResponse>(`/admin/tenants/${id}`);
    setData(response);
    setNewPlan(response.tenant.plan);
  }

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const response = await apiRequest<TenantDetailResponse>(`/admin/tenants/${id}`);
        if (!cancelled) {
          setData(response);
          setNewPlan(response.tenant.plan);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load tenant");
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [id]);

  async function changePlan() {
    try {
      await apiRequest(`/admin/tenants/${id}/plan`, {
        method: "PATCH",
        body: JSON.stringify({ plan: newPlan }),
      });
      await load();
      setSuccess(`Plan updated to ${newPlan}.`);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update plan");
    }
  }

  async function deleteTenant() {
    if (!window.confirm("Soft-delete this tenant?")) return;
    try {
      await apiRequest(`/admin/tenants/${id}`, { method: "DELETE" });
      navigate("/admin/tenants");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete tenant");
    }
  }

  const tenant = data?.tenant;

  return (
    <AdminConsoleShell
      eyebrow={`Admin / Tenants / ${id || "tenant"}`}
      title={tenant?.name ?? "Tenant Detail"}
      subtitle="Sovereign view of a single workspace, including members, billing context, and recent revenue activity."
      actions={
        <>
          <button className="act-button ghost" onClick={() => navigate("/admin/tenants")}>Back to tenants</button>
          <button className="act-button danger" onClick={deleteTenant} disabled={!tenant}>Delete tenant</button>
        </>
      }
    >
      <MessageBanner error={error} success={success} />

      {!tenant ? (
        <div className="act-empty">Loading tenant detail…</div>
      ) : (
        <>
          <div className="act-grid">
            <div className="act-card">
              <div className="act-kpi-label">Plan</div>
              <div className="act-kpi-value">{tenant.plan}</div>
              <div className="act-kpi-sub">Current billing tier</div>
            </div>
            <div className="act-card">
              <div className="act-kpi-label">Members</div>
              <div className="act-kpi-value">{tenant._count.users}</div>
              <div className="act-kpi-sub">Active users in workspace</div>
            </div>
            <div className="act-card">
              <div className="act-kpi-label">Lifetime Revenue</div>
              <div className="act-kpi-value">{fmtMoney(tenant.totalRevenue, tenant.currency ?? "USD")}</div>
              <div className="act-kpi-sub">All recorded revenue</div>
            </div>
            <div className="act-card">
              <div className="act-kpi-label">Last 30 Days</div>
              <div className="act-kpi-value">{fmtMoney(tenant.last30Revenue, tenant.currency ?? "USD")}</div>
              <div className="act-kpi-sub">Recent revenue window</div>
            </div>
          </div>

          <div className="act-grid">
            <div className="act-card wide">
              <div className="act-section-title">Workspace Config</div>
              <div className="act-mini-row"><span className="act-mini-label">Timezone</span><span className="act-mini-value">{tenant.timezone ?? "UTC"}</span></div>
              <div className="act-mini-row"><span className="act-mini-label">Currency</span><span className="act-mini-value">{tenant.currency ?? "USD"}</span></div>
              <div className="act-mini-row"><span className="act-mini-label">Fiscal Month</span><span className="act-mini-value">{tenant.fiscalMonth ?? 1}</span></div>
              <div className="act-mini-row"><span className="act-mini-label">Created</span><span className="act-mini-value">{fmtDate(tenant.createdAt)}</span></div>
              <div className="act-mini-row"><span className="act-mini-label">Stripe Customer</span><span className="act-mini-value">{tenant.stripeCustomerId ?? "—"}</span></div>
              <div className="act-mini-row"><span className="act-mini-label">Stripe Subscription</span><span className="act-mini-value">{tenant.stripeSubscriptionId ?? "—"}</span></div>
            </div>
            <div className="act-card wide">
              <div className="act-section-title">Workspace Footprint</div>
              <div className="act-mini-row"><span className="act-mini-label">Revenue records</span><span className="act-mini-value">{tenant._count.revenueRecords}</span></div>
              <div className="act-mini-row"><span className="act-mini-label">Posts</span><span className="act-mini-value">{tenant._count.posts}</span></div>
              <div className="act-mini-row"><span className="act-mini-label">Groups</span><span className="act-mini-value">{tenant._count.groups}</span></div>
              <div className="act-mini-row"><span className="act-mini-label">Orders</span><span className="act-mini-value">{tenant._count.orders}</span></div>
              <div className="act-row" style={{ marginTop: 14 }}>
                <select className="act-select" value={newPlan} onChange={(event) => setNewPlan(event.target.value)}>
                  <option value="FREE">FREE</option>
                  <option value="PRO">PRO</option>
                  <option value="ENTERPRISE">ENTERPRISE</option>
                </select>
                <button className="act-button" onClick={changePlan}>Save plan</button>
              </div>
            </div>
          </div>

          <div className="act-section">
            <h2 className="act-section-title">Members</h2>
            <table className="act-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>2FA</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {tenant.users.map((member) => (
                  <tr key={member.id}>
                    <td>{member.name}</td>
                    <td>{member.email}</td>
                    <td>{member.role}</td>
                    <td>{member.twoFactorEnabled ? "Enabled" : "Off"}</td>
                    <td>{fmtDate(member.createdAt)}</td>
                    <td>
                      <button className="act-button ghost" onClick={() => navigate(`/admin/users/${member.id}`)}>
                        Open user
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="act-section">
            <h2 className="act-section-title">Recent Revenue Records</h2>
            {tenant.revenueRecords.length ? (
              <table className="act-table">
                <thead>
                  <tr>
                    <th>Recorded</th>
                    <th>Source</th>
                    <th>Description</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {tenant.revenueRecords.map((record) => (
                    <tr key={record.id}>
                      <td>{fmtDate(record.recordedAt)}</td>
                      <td>{record.source}</td>
                      <td>{record.description ?? "—"}</td>
                      <td>{fmtMoney(record.amount, record.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="act-empty">No revenue records have been recorded for this tenant yet.</div>
            )}
          </div>
        </>
      )}
    </AdminConsoleShell>
  );
}

export function AdminUserDetailPage() {
  const navigate = useNavigate();
  const { id = "" } = useParams();
  const [data, setData] = useState<UserDetailResponse | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await apiRequest<UserDetailResponse>(`/admin/users/${id}`);
        if (!cancelled) {
          setData(response);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load user");
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const user = data?.user;

  return (
    <AdminConsoleShell
      eyebrow={`Admin / Users / ${id || "user"}`}
      title={user?.name ?? "User Detail"}
      subtitle="Sovereign identity view including tenant placement, profile metadata, and ecosystem activity signals."
      actions={
        <>
          <button className="act-button ghost" onClick={() => navigate("/admin/users")}>Back to users</button>
          {user ? <button className="act-button ghost" onClick={() => navigate(`/admin/tenants/${user.tenant.id}`)}>Open tenant</button> : null}
        </>
      }
    >
      <MessageBanner error={error} />

      {!user ? (
        <div className="act-empty">Loading user detail…</div>
      ) : (
        <>
          <div className="act-grid">
            <div className="act-card">
              <div className="act-kpi-label">Role</div>
              <div className="act-kpi-value">{user.role}</div>
              <div className="act-kpi-sub">Current platform role</div>
            </div>
            <div className="act-card">
              <div className="act-kpi-label">2FA</div>
              <div className="act-kpi-value">{user.twoFactorEnabled ? "On" : "Off"}</div>
              <div className="act-kpi-sub">Multi-factor status</div>
            </div>
            <div className="act-card">
              <div className="act-kpi-label">Profile Views</div>
              <div className="act-kpi-value">{user.profileViews ?? 0}</div>
              <div className="act-kpi-sub">Visibility count</div>
            </div>
            <div className="act-card">
              <div className="act-kpi-label">Public Profile</div>
              <div className="act-kpi-value">{user.isPublicProfile ? "Yes" : "No"}</div>
              <div className="act-kpi-sub">Directory visibility</div>
            </div>
          </div>

          <div className="act-grid">
            <div className="act-card wide">
              <div className="act-section-title">Identity</div>
              <div className="act-mini-row"><span className="act-mini-label">Email</span><span className="act-mini-value">{user.email}</span></div>
              <div className="act-mini-row"><span className="act-mini-label">Joined</span><span className="act-mini-value">{fmtDate(user.createdAt)}</span></div>
              <div className="act-mini-row"><span className="act-mini-label">Industry</span><span className="act-mini-value">{user.industry ?? "—"}</span></div>
              <div className="act-mini-row"><span className="act-mini-label">Location</span><span className="act-mini-value">{[user.city, user.country].filter(Boolean).join(", ") || "—"}</span></div>
            </div>
            <div className="act-card wide">
              <div className="act-section-title">Tenant</div>
              <div className="act-mini-row"><span className="act-mini-label">Workspace</span><span className="act-mini-value">{user.tenant.name}</span></div>
              <div className="act-mini-row"><span className="act-mini-label">Plan</span><span className="act-mini-value">{user.tenant.plan}</span></div>
              <div className="act-mini-row"><span className="act-mini-label">Tenant Created</span><span className="act-mini-value">{fmtDate(user.tenant.createdAt)}</span></div>
            </div>
          </div>

          <div className="act-section">
            <h2 className="act-section-title">Activity Footprint</h2>
            <div className="act-grid">
              <div className="act-card"><div className="act-kpi-label">Posts</div><div className="act-kpi-value">{user._count.posts}</div></div>
              <div className="act-card"><div className="act-kpi-label">Messages</div><div className="act-kpi-value">{user._count.messages}</div></div>
              <div className="act-card"><div className="act-kpi-label">Groups</div><div className="act-kpi-value">{user._count.groupMemberships}</div></div>
              <div className="act-card"><div className="act-kpi-label">Enrollments</div><div className="act-kpi-value">{user._count.courseEnrollments}</div></div>
            </div>
          </div>

          <div className="act-section">
            <h2 className="act-section-title">Skills & Bio</h2>
            <div className="act-body-copy">{user.bio ?? "No bio has been added for this user."}</div>
            <div className="act-meta" style={{ marginTop: 12 }}>
              {(user.skills ?? []).length ? (user.skills ?? []).map((skill) => <span key={skill} className="act-tag">{skill}</span>) : <span className="act-muted">No skills recorded.</span>}
            </div>
          </div>
        </>
      )}
    </AdminConsoleShell>
  );
}

export function AdminForgePage() {
  const maxCalls = Math.max(...AI_SUPERVISORS.map((agent) => agent.calls), 1);

  return (
    <AdminConsoleShell
      eyebrow="Admin / FORGE"
      title="FORGE Supervisor Panel"
      subtitle="Technical sovereignty for the ecosystem AI layer, with supervisor visibility, model mix, and routing posture."
      actions={<Link className="act-link-button" to="/intelligence/platform">Open AI Platform</Link>}
    >
      <div className="act-grid">
        <div className="act-card"><div className="act-kpi-label">Supervisors</div><div className="act-kpi-value">{AI_SUPERVISORS.length}</div><div className="act-kpi-sub">Registered AI supervisors</div></div>
        <div className="act-card"><div className="act-kpi-label">Active</div><div className="act-kpi-value">{AI_SUPERVISORS.filter((agent) => agent.status === "active").length}</div><div className="act-kpi-sub">Online right now</div></div>
        <div className="act-card"><div className="act-kpi-label">Model Families</div><div className="act-kpi-value">{new Set(AI_SUPERVISORS.map((agent) => agent.model)).size}</div><div className="act-kpi-sub">Distinct configured models</div></div>
        <div className="act-card"><div className="act-kpi-label">API Calls</div><div className="act-kpi-value">{AI_SUPERVISORS.reduce((sum, agent) => sum + agent.calls, 0).toLocaleString()}</div><div className="act-kpi-sub">Session total</div></div>
      </div>

      <div className="act-section">
        <h2 className="act-section-title">Supervisor Fleet</h2>
        <div className="act-forge-grid">
          {AI_SUPERVISORS.map((agent) => (
            <div key={agent.name} className="act-forge-card">
              <div className="act-forge-top">
                <div>
                  <div className="act-eyebrow">{agent.model}</div>
                  <div className="act-forge-name">{agent.name}</div>
                </div>
                <span className={`act-pill ${agent.status}`}>{agent.status}</span>
              </div>
              <div className="act-forge-desc">{agent.role}</div>
              <div className="act-mini-row" style={{ marginTop: 12 }}>
                <span className="act-mini-label">Calls</span>
                <span className="act-mini-value">{agent.calls.toLocaleString()}</span>
              </div>
              <div className="act-progress">
                <div className="act-progress-fill" style={{ width: `${(agent.calls / maxCalls) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminConsoleShell>
  );
}

export function AdminBroadcastPage() {
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("all");
  const [success, setSuccess] = useState("");

  return (
    <AdminConsoleShell
      eyebrow="Admin / Broadcast"
      title="OMEGA Ecosystem Broadcast"
      subtitle="Issue high-priority sovereign announcements and operational directives across the ecosystem."
    >
      <MessageBanner success={success} />

      <div className="act-grid">
        <div className="act-card wide">
          <div className="act-section-title">Compose Broadcast</div>
          <textarea
            className="act-textarea"
            placeholder="Write the ecosystem-wide message or directive…"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <div className="act-row" style={{ marginTop: 12 }}>
            <select className="act-select" value={target} onChange={(event) => setTarget(event.target.value)}>
              <option value="all">All layers</option>
              <option value="community">Community</option>
              <option value="academy">Academy</option>
              <option value="market">Market</option>
              <option value="work">Work</option>
              <option value="cloud">Cloud</option>
              <option value="intelligence">Intelligence</option>
            </select>
            <button
              className="act-button"
              disabled={!message.trim()}
              onClick={() => {
                setSuccess(`OMEGA queued a sovereign broadcast for ${target === "all" ? "all layers" : target}.`);
                setMessage("");
              }}
            >
              Dispatch
            </button>
          </div>
        </div>
        <div className="act-card wide">
          <div className="act-section-title">Broadcast Targets</div>
          <CommandDeck />
        </div>
      </div>
    </AdminConsoleShell>
  );
}

export function AdminSecurityPage() {
  return (
    <AdminConsoleShell
      eyebrow="Admin / Security"
      title="Security Governance"
      subtitle="Central sovereignty view for hidden admin access, GDPR posture, rate-limit surfaces, and audit-sensitive control paths."
    >
      <div className="act-layer-grid">
        <div className="act-layer-card">
          <div className="act-layer-top">
            <h2 className="act-layer-name">RLS & Tenant Boundaries</h2>
            <span className="act-pill active">Guarded</span>
          </div>
          <div className="act-layer-desc">Workspace data remains tenant-scoped by default, while sovereign routes stay hidden behind super-admin checks.</div>
          <ul className="act-list">
            <li><code>superAdminMiddleware</code> returns 404 for unauthorized admin access.</li>
            <li>Regular workspace APIs remain tenant-bounded.</li>
          </ul>
        </div>
        <div className="act-layer-card">
          <div className="act-layer-top">
            <h2 className="act-layer-name">Rate Limits</h2>
            <span className="act-pill attention">Monitored</span>
          </div>
          <div className="act-layer-desc">Authentication and posting surfaces use dedicated throttles to reduce brute force and abuse risk.</div>
          <ul className="act-list">
            <li><code>/auth/login</code> and <code>/auth/register</code> are behind the auth limiter.</li>
            <li>Posts are guarded by a post-specific limiter.</li>
          </ul>
        </div>
        <div className="act-layer-card">
          <div className="act-layer-top">
            <h2 className="act-layer-name">GDPR & Audit</h2>
            <span className="act-pill info">Tracked</span>
          </div>
          <div className="act-layer-desc">Privacy acknowledgments, admin-only changelog controls, and route gating feed the platform governance story.</div>
          <ul className="act-list">
            <li>GDPR routes are mounted under <code>/api/v1/gdpr</code>.</li>
            <li>Changelog writes are protected with sovereign checks.</li>
          </ul>
        </div>
      </div>
    </AdminConsoleShell>
  );
}

export function AdminSettingsPage() {
  return (
    <AdminConsoleShell
      eyebrow="Admin / Settings"
      title="Platform Configuration"
      subtitle="Jump to the admin-adjacent control surfaces that influence billing, notifications, and operator-facing platform behavior."
    >
      <div className="act-grid">
        <div className="act-card wide">
          <div className="act-section-title">Connected Surfaces</div>
          <div className="act-command-grid">
            <Link to="/settings" className="act-command">
              <div className="act-command-icon">⚙</div>
              <div className="act-command-title">Workspace Settings</div>
              <div className="act-command-desc">Brand, tenant, and primary workspace controls.</div>
            </Link>
            <Link to="/stripe" className="act-command">
              <div className="act-command-icon">💳</div>
              <div className="act-command-title">Stripe</div>
              <div className="act-command-desc">Billing status and revenue integrations.</div>
            </Link>
            <Link to="/slack" className="act-command">
              <div className="act-command-icon">💬</div>
              <div className="act-command-title">Slack</div>
              <div className="act-command-desc">Operator channel delivery and alerts.</div>
            </Link>
            <Link to="/changelog" className="act-command">
              <div className="act-command-icon">🗞</div>
              <div className="act-command-title">Changelog</div>
              <div className="act-command-desc">Platform release notes and governance messaging.</div>
            </Link>
            <Link to="/cloud/keys" className="act-command">
              <div className="act-command-icon">🔑</div>
              <div className="act-command-title">API Keys</div>
              <div className="act-command-desc">Developer platform credentials and key inventory.</div>
            </Link>
          </div>
        </div>
        <div className="act-card wide">
          <div className="act-section-title">Admin Surface</div>
          <div className="act-mini-row"><span className="act-mini-label">Canonical base route</span><span className="act-mini-value">/admin</span></div>
          <div className="act-mini-row"><span className="act-mini-label">Overview route</span><span className="act-mini-value">/admin/overview</span></div>
          <div className="act-mini-row"><span className="act-mini-label">API base</span><span className="act-mini-value">{API_BASE}</span></div>
          <div className="act-mini-row"><span className="act-mini-label">Sovereign boundary</span><span className="act-mini-value">ADMIN_EMAILS + 404 concealment</span></div>
        </div>
      </div>
    </AdminConsoleShell>
  );
}
