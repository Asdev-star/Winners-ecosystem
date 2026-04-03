// src/features/admin/AdminPage.tsx — CORE ENGINE v3
// Winners Ecosystem · Architect Command Center · Superadmin Only

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../auth/authStore";
import { useLocation, useNavigate } from "react-router-dom";

import { API_BASE } from "../../lib/api";

const API = API_BASE;

const ECOSYSTEM_PLATFORMS = [
  { icon: "⬡", name: "Core Engine",   path: "/admin",       color: "#F0B429", status: "live",     desc: "Auth · Billing · Analytics · 52 Routes",        routes: 52 },
  { icon: "🧑‍🤝‍🧑", name: "Community", path: "/community",   color: "#89C4E1", status: "live",     desc: "Feed · Groups · DMs · Studio · NOVA AI",        routes: 18 },
  { icon: "🎓", name: "Academy",       path: "/academy",     color: "#9B6FFF", status: "live",     desc: "Courses · Paths · Live Sessions · SAGE AI",     routes: 14 },
  { icon: "🛒", name: "Market",        path: "/market",      color: "#2DD4A0", status: "building", desc: "10 Verticals · Vendors · Cart · Escrow",         routes: 12 },
  { icon: "💼", name: "Work",          path: "/work",        color: "#F0B429", status: "building", desc: "Freelance · Contracts · Escrow · Profiles",      routes: 5  },
  { icon: "☁️", name: "Cloud",         path: "/cloud",       color: "#89C4E1", status: "live",     desc: "Connectors · Agents · API Keys · Webhooks",      routes: 8  },
  { icon: "🤖", name: "Intelligence",  path: "/intelligence",color: "#9B6FFF", status: "live",     desc: "9 Supervisors · OMEGA · SSE Streaming",          routes: 10 },
  { icon: "⚙️", name: "Ops",           path: "/ops",         color: "#E05A4E", status: "live",     desc: "Core Ops · Health · Config · System Control",    routes: 4  },
];

const AI_SUPERVISORS = [
  { name: "ARIA",    role: "General Intelligence",   model: "claude-3-5-sonnet", status: "active",  calls: 1842 },
  { name: "NOVA",    role: "Community Intelligence", model: "claude-3-5-sonnet", status: "active",  calls: 934  },
  { name: "SAGE",    role: "Academy Intelligence",   model: "claude-3-5-sonnet", status: "active",  calls: 621  },
  { name: "OMEGA",   role: "Autonomous Supervisor",  model: "claude-3-opus",     status: "standby", calls: 312  },
  { name: "ATLAS",   role: "Market Intelligence",    model: "claude-3-5-haiku",  status: "active",  calls: 289  },
  { name: "CIRCUIT", role: "Engineering Supervisor", model: "claude-3-5-haiku",  status: "standby", calls: 178  },
  { name: "PHANTOM", role: "Security Monitor",       model: "claude-3-5-haiku",  status: "active",  calls: 99   },
  { name: "NEXUS",   role: "Cloud Orchestrator",     model: "claude-3-5-haiku",  status: "standby", calls: 67   },
  { name: "HERALD",  role: "Notification Engine",    model: "claude-3-5-haiku",  status: "active",  calls: 445  },
];

const QUICK_ACTIONS = [
  { icon: "📢", label: "Broadcast Message",  sub: "All platform users" },
  { icon: "🔒", label: "Lock Platform",      sub: "Maintenance mode" },
  { icon: "💾", label: "Export Full Data",   sub: "All tenants + users" },
  { icon: "🔄", label: "Sync AI Agents",     sub: "Refresh supervisors" },
  { icon: "📊", label: "Generate Report",    sub: "Executive summary" },
  { icon: "🧹", label: "Purge Cache",        sub: "Clear system cache" },
  { icon: "🌐", label: "Deploy Update",      sub: "Push live changes" },
  { icon: "🔑", label: "Rotate Secrets",     sub: "API keys & tokens" },
];

const css = `
  @keyframes adm-pulse  { 0%,100% { opacity:1; } 50% { opacity:0.45; } }
  @keyframes adm-fadeup { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
  @keyframes adm-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }

  .adm-root {
    padding: 24px 24px 100px;
    font-family: var(--font-body), 'Syne', sans-serif;
    color: var(--text);
    max-width: 1200px;
    animation: adm-fadeup 0.35s ease;
  }

  /* ── Command Header ── */
  .adm-header {
    margin-bottom: 20px; padding: 22px 26px;
    background: linear-gradient(135deg, rgba(13,24,38,0.95), rgba(20,35,55,0.95));
    border: 1px solid rgba(240,180,41,0.22); border-radius: var(--card-radius, 10px);
    position: relative; overflow: hidden;
  }
  .adm-header::before {
    content: ''; position: absolute; inset: 0; pointer-events: none;
    background: radial-gradient(ellipse 70% 60% at 100% 50%, rgba(240,180,41,0.05) 0%, transparent 70%);
  }
  .adm-header::after {
    content: 'CORE ENGINE'; position: absolute; right: 24px; top: 50%; transform: translateY(-50%);
    font-family: var(--font-mono), 'Space Mono', monospace; font-size: 64px; font-weight: 700; letter-spacing: -2px;
    color: rgba(240,180,41,0.03); pointer-events: none; user-select: none;
  }
  .adm-header-row { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; position: relative; z-index: 1; }
  .adm-title { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 6px; }
  .adm-title-gold { color: var(--gold); }
  .adm-badge { font-family: var(--font-mono), 'Space Mono', monospace; font-size: 7px; padding: 3px 10px; border-radius: var(--card-radius, 3px); background: rgba(224,90,78,0.12); color: var(--red); border: 1px solid rgba(224,90,78,0.25); letter-spacing: 2px; }
  .adm-badge-live { font-family: var(--font-mono), 'Space Mono', monospace; font-size: 7px; padding: 3px 10px; border-radius: var(--card-radius, 3px); background: rgba(45,212,160,0.1); color: var(--green); border: 1px solid rgba(45,212,160,0.25); letter-spacing: 2px; display: flex; align-items: center; gap: 5px; animation: adm-pulse 2.5s infinite; }
  .adm-badge-dot  { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
  .adm-subtitle { font-family: var(--font-mono), 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }
  .adm-header-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
  .adm-sys-time { font-family: var(--font-mono), 'Space Mono', monospace; font-size: 10px; color: var(--gold); }
  .adm-sys-user { font-family: var(--font-mono), 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); }

  /* ── Platform Status Bar ── */
  .adm-status-bar {
    display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
    padding: 10px 18px; margin-bottom: 20px;
    background: rgba(8,14,26,0.5); border: 1px solid var(--border); border-radius: var(--card-radius, 8px);
  }
  .adm-status-label { font-family: var(--font-mono), 'Space Mono', monospace; font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: var(--text-dim); margin-right: 6px; flex-shrink: 0; }
  .adm-status-chip { font-family: var(--font-mono), 'Space Mono', monospace; font-size: 8px; padding: 2px 10px; border-radius: var(--card-radius, 10px); border: 1px solid var(--border); color: var(--text-dim); display: flex; align-items: center; gap: 5px; }
  .adm-status-chip.live    { border-color: rgba(45,212,160,0.3); color: var(--green); background: rgba(45,212,160,0.06); }
  .adm-status-chip.building{ border-color: rgba(240,180,41,0.3); color: var(--gold);  background: rgba(240,180,41,0.06); }
  .adm-status-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; animation: adm-pulse 2s infinite; }

  /* ── Tabs ── */
  .adm-tabs { display: flex; gap: 0; margin-bottom: 24px; border-bottom: 1px solid var(--border); overflow-x: auto; scrollbar-width: none; }
  .adm-tabs::-webkit-scrollbar { display: none; }
  .adm-tab {
    padding: 11px 20px; font-family: var(--font-mono), 'Space Mono', monospace; font-size: 10px;
    cursor: pointer; color: var(--text-dim); border-bottom: 2px solid transparent;
    margin-bottom: -1px; transition: all 0.15s; white-space: nowrap;
    background: none; border-top: none; border-left: none; border-right: none;
  }
  .adm-tab:hover { color: var(--text); }
  .adm-tab.active { color: var(--gold); border-bottom-color: var(--gold); }

  /* ── KPIs ── */
  .adm-kpis { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px; }
  .adm-kpi {
    background: var(--surface); border: 1px solid var(--border); border-radius: var(--card-radius, 8px);
    padding: 16px 18px; position: relative; overflow: hidden; transition: border-color 0.2s, transform 0.2s;
  }
  .adm-kpi:hover { border-color: rgba(240,180,41,0.3); transform: translateY(-1px); }
  .adm-kpi::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--gold), var(--ice), var(--purple)); }
  .adm-kpi-icon  { font-size: 18px; margin-bottom: 8px; }
  .adm-kpi-label { font-family: var(--font-mono), 'Space Mono', monospace; font-size: 8px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 6px; }
  .adm-kpi-value { font-size: 24px; font-weight: 800; letter-spacing: -1px; color: var(--gold); }
  .adm-kpi-sub   { font-family: var(--font-mono), 'Space Mono', monospace; font-size: 8px; color: var(--text-dim); margin-top: 5px; }

  /* ── Charts ── */
  .adm-charts { display: grid; grid-template-columns: 1.4fr 1fr; gap: 14px; margin-bottom: 20px; }
  .adm-chart-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--card-radius, 8px); padding: 20px; }
  .adm-chart-title { font-size: 12px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .adm-chart-sub { font-family: var(--font-mono), 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); margin-left: auto; }
  .adm-sparkline { height: 80px; display: flex; align-items: flex-end; gap: 2px; }
  .adm-spark-bar { flex: 1; border-radius: 2px 2px 0 0; background: rgba(240,180,41,0.2); transition: background 0.15s; min-height: 2px; cursor: pointer; }
  .adm-spark-bar:hover { background: rgba(240,180,41,0.7); }
  .adm-plan-bar { margin-bottom: 12px; }
  .adm-plan-bar-label { display: flex; justify-content: space-between; font-family: var(--font-mono), 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); margin-bottom: 5px; }
  .adm-plan-bar-track { height: 5px; background: var(--surface2); border-radius: 3px; overflow: hidden; }
  .adm-plan-bar-fill  { height: 100%; border-radius: 3px; transition: width 0.9s cubic-bezier(0.4,0,0.2,1); }

  /* ── Platform Grid ── */
  .adm-platform-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
  .adm-platform-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: var(--card-radius, 8px);
    padding: 18px; cursor: pointer; transition: all 0.2s; position: relative; overflow: hidden;
  }
  .adm-platform-card:hover { transform: translateY(-3px); box-shadow: 0 8px 30px rgba(0,0,0,0.2); }
  .adm-platform-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
  .adm-platform-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 10px; }
  .adm-platform-icon { font-size: 22px; }
  .adm-plat-stat { font-family: var(--font-mono), 'Space Mono', monospace; font-size: 7px; padding: 2px 7px; border-radius: var(--card-radius, 8px); letter-spacing: 1px; }
  .adm-plat-stat.live    { background: rgba(45,212,160,0.1); color: var(--green); border: 1px solid rgba(45,212,160,0.2); }
  .adm-plat-stat.building{ background: rgba(240,180,41,0.1); color: var(--gold);  border: 1px solid rgba(240,180,41,0.2); }
  .adm-platform-name { font-size: 13px; font-weight: 700; margin-bottom: 5px; }
  .adm-platform-desc { font-family: var(--font-mono), 'Space Mono', monospace; font-size: 8px; color: var(--text-dim); line-height: 1.6; }
  .adm-platform-foot { font-family: var(--font-mono), 'Space Mono', monospace; font-size: 8px; color: var(--text-dim); margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border); display: flex; justify-content: space-between; }
  .adm-platform-foot b { color: var(--gold); }
  .adm-platform-nav { font-size: 10px; transition: transform 0.15s; }
  .adm-platform-card:hover .adm-platform-nav { transform: translateX(3px); }

  /* ── AI Supervisors ── */
  .adm-ai-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
  .adm-ai-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: var(--card-radius, 8px);
    padding: 16px; transition: border-color 0.2s;
  }
  .adm-ai-card:hover { border-color: rgba(155,111,255,0.3); }
  .adm-ai-top  { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
  .adm-ai-name { font-size: 13px; font-weight: 800; color: var(--purple); letter-spacing: 1px; }
  .adm-ai-stat { font-family: var(--font-mono), 'Space Mono', monospace; font-size: 7px; padding: 2px 8px; border-radius: var(--card-radius, 8px); }
  .adm-ai-stat.active  { background: rgba(45,212,160,0.1); color: var(--green); border: 1px solid rgba(45,212,160,0.2); animation: adm-pulse 2.5s infinite; }
  .adm-ai-stat.standby { background: rgba(90,122,150,0.1); color: var(--text-dim); border: 1px solid var(--border); }
  .adm-ai-role  { font-family: var(--font-mono), 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); margin-bottom: 4px; }
  .adm-ai-model { font-family: var(--font-mono), 'Space Mono', monospace; font-size: 8px; color: var(--ice); margin-bottom: 10px; }
  .adm-ai-bar-track { height: 3px; background: var(--surface2); border-radius: 2px; margin-top: 6px; overflow: hidden; }
  .adm-ai-bar-fill  { height: 100%; background: linear-gradient(90deg, var(--purple), var(--ice)); border-radius: 2px; transition: width 0.8s ease; }
  .adm-ai-calls { font-family: var(--font-mono), 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); display: flex; justify-content: space-between; align-items: center; }
  .adm-ai-calls-val { color: var(--gold); font-weight: 700; }

  /* ── Directives ── */
  .adm-dir-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 20px; }
  .adm-dir-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--card-radius, 8px); padding: 20px; }
  .adm-dir-title { font-size: 12px; font-weight: 700; margin-bottom: 14px; display: flex; align-items: center; gap: 8px; }
  .adm-dir-textarea {
    width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: var(--card-radius, 6px);
    padding: 12px 14px; font-family: var(--font-mono), 'Space Mono', monospace; font-size: 11px; color: var(--text);
    outline: none; resize: vertical; min-height: 90px; box-sizing: border-box; transition: border-color 0.15s;
  }
  .adm-dir-textarea:focus { border-color: var(--gold); }
  .adm-dir-textarea::placeholder { color: var(--text-dim); }
  .adm-dir-row { display: flex; gap: 8px; margin-top: 10px; }
  .adm-dir-select {
    flex: 1; background: var(--surface2); border: 1px solid var(--border); border-radius: var(--card-radius, 6px);
    padding: 8px 12px; font-family: var(--font-mono), 'Space Mono', monospace; font-size: 10px; color: var(--text); outline: none;
  }
  .adm-qa-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .adm-qa-btn {
    padding: 14px; background: var(--surface2); border: 1px solid var(--border); border-radius: var(--card-radius, 8px);
    font-family: var(--font-mono), 'Space Mono', monospace; font-size: 9px; color: var(--text-dim);
    cursor: pointer; transition: all 0.15s; text-align: left;
  }
  .adm-qa-btn:hover { border-color: var(--gold); color: var(--gold); background: rgba(240,180,41,0.04); }
  .adm-qa-icon  { font-size: 18px; display: block; margin-bottom: 6px; }
  .adm-qa-label { font-weight: 700; display: block; margin-bottom: 2px; }
  .adm-qa-sub   { font-size: 8px; opacity: 0.65; }

  /* ── Table ── */
  .adm-table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: var(--card-radius, 8px); overflow: hidden; margin-bottom: 14px; }
  .adm-table-hdr { padding: 14px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  .adm-table-title { font-size: 13px; font-weight: 700; }
  .adm-search {
    background: var(--surface2); border: 1px solid var(--border); border-radius: var(--card-radius, 6px);
    padding: 7px 14px; font-family: var(--font-mono), 'Space Mono', monospace; font-size: 10px; color: var(--text);
    outline: none; width: 220px; transition: border-color 0.15s;
  }
  .adm-search:focus { border-color: var(--gold); }
  .adm-search::placeholder { color: var(--text-dim); }
  table { width: 100%; border-collapse: collapse; }
  th {
    font-family: var(--font-mono), 'Space Mono', monospace; font-size: 8px; letter-spacing: 1.5px; text-transform: uppercase;
    color: var(--text-dim); padding: 10px 20px; text-align: left;
    border-bottom: 1px solid var(--border); background: rgba(8,14,26,0.5);
  }
  td { padding: 12px 20px; font-size: 12px; border-bottom: 1px solid var(--border); }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba(240,180,41,0.02); }
  .adm-plan-tag { font-family: var(--font-mono), 'Space Mono', monospace; font-size: 8px; padding: 2px 8px; border-radius: var(--card-radius, 3px); }
  .adm-plan-tag.FREE       { background: rgba(90,122,150,0.12); color: var(--text-dim); }
  .adm-plan-tag.PRO        { background: rgba(240,180,41,0.1);  color: var(--gold);   border: 1px solid rgba(240,180,41,0.15); }
  .adm-plan-tag.ENTERPRISE { background: rgba(155,111,255,0.1); color: var(--purple); border: 1px solid rgba(155,111,255,0.15); }
  .adm-action-btn {
    background: transparent; border: 1px solid var(--border); border-radius: var(--card-radius, 4px);
    padding: 4px 10px; font-family: var(--font-mono), 'Space Mono', monospace; font-size: 8px;
    color: var(--text-dim); cursor: pointer; transition: all 0.15s; margin-right: 4px;
  }
  .adm-action-btn:hover        { border-color: var(--gold); color: var(--gold); }
  .adm-action-btn.danger:hover { border-color: var(--red);  color: var(--red); }
  .adm-pagination {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 20px; font-family: var(--font-mono), 'Space Mono', monospace; font-size: 9px;
    color: var(--text-dim); border-top: 1px solid var(--border);
  }
  .adm-page-btn {
    background: var(--surface2); border: 1px solid var(--border); border-radius: var(--card-radius, 4px);
    padding: 5px 14px; font-family: var(--font-mono), 'Space Mono', monospace; font-size: 9px;
    color: var(--text-dim); cursor: pointer; transition: all 0.15s;
  }
  .adm-page-btn:hover:not(:disabled) { border-color: var(--gold); color: var(--gold); }
  .adm-page-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ── Modal ── */
  .adm-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 1000; display: flex; align-items: center; justify-content: center; backdrop-filter: blur(6px); }
  .adm-modal { background: var(--surface); border: 1px solid rgba(240,180,41,0.22); border-radius: var(--card-radius, 10px); padding: 28px; width: 380px; box-shadow: 0 24px 80px rgba(0,0,0,0.5); }
  .adm-modal-title { font-size: 15px; font-weight: 800; margin-bottom: 16px; }
  .adm-modal-select {
    width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: var(--card-radius, 6px);
    padding: 10px 14px; font-family: var(--font-mono), 'Space Mono', monospace; font-size: 11px; color: var(--text);
    outline: none; margin-bottom: 16px;
  }
  .adm-modal-select:focus { border-color: var(--gold); }
  .adm-modal-btns { display: flex; gap: 8px; justify-content: flex-end; }
  .adm-btn { background: var(--gold); color: var(--bg); border: none; border-radius: var(--card-radius, 6px); padding: 9px 22px; font-family: var(--font-body), 'Syne', sans-serif; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s; }
  .adm-btn:hover { filter: brightness(1.1); }
  .adm-btn.ghost { background: transparent; border: 1px solid var(--border); color: var(--text-dim); }
  .adm-btn.ghost:hover { border-color: var(--gold); color: var(--gold); }
  .adm-btn.danger { background: rgba(224,90,78,0.15); border: 1px solid rgba(224,90,78,0.3); color: var(--red); }
  .adm-btn.danger:hover { background: rgba(224,90,78,0.25); }

  /* ── States ── */
  .adm-empty   { padding: 40px; text-align: center; font-family: var(--font-mono), 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }
  .adm-loading { padding: 48px; text-align: center; font-family: var(--font-mono), 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }
  .adm-error   { padding: 12px 16px; background: rgba(224,90,78,0.08); border: 1px solid rgba(224,90,78,0.2); border-radius: var(--card-radius, 6px); font-family: var(--font-mono), 'Space Mono', monospace; font-size: 10px; color: var(--red); margin-bottom: 16px; }
  .adm-success { padding: 12px 16px; background: rgba(45,212,160,0.06); border: 1px solid rgba(45,212,160,0.18); border-radius: var(--card-radius, 6px); font-family: var(--font-mono), 'Space Mono', monospace; font-size: 10px; color: var(--green); margin-bottom: 16px; }

  /* ── Responsive ── */
  @media (max-width: 1100px) {
    .adm-platform-grid { grid-template-columns: repeat(3, 1fr); }
    .adm-ai-grid       { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 900px) {
    .adm-kpis          { grid-template-columns: repeat(3, 1fr); }
    .adm-charts        { grid-template-columns: 1fr; }
    .adm-platform-grid { grid-template-columns: repeat(2, 1fr); }
    .adm-dir-grid      { grid-template-columns: 1fr; }
  }
  @media (max-width: 600px) {
    .adm-kpis          { grid-template-columns: repeat(2, 1fr); }
    .adm-platform-grid { grid-template-columns: 1fr; }
    .adm-ai-grid       { grid-template-columns: 1fr; }
    .adm-root          { padding: 14px 12px 80px; }
  }
`;

if (typeof document !== "undefined" && !document.getElementById("adm-styles")) {
  const tag = document.createElement("style");
  tag.id = "adm-styles";
  tag.textContent = css;
  document.head.appendChild(tag);
}

function fmt(n: number) {
  return `$${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

const PLAN_COLORS: Record<string, string> = {
  FREE: "var(--text-dim)", PRO: "var(--gold)", ENTERPRISE: "var(--purple)",
};

type Tab = "overview" | "platforms" | "users" | "tenants" | "ai" | "directives";

const TAB_ROUTE_MAP: Record<Tab, string> = {
  overview: "/admin/revenue",
  platforms: "/admin/platform-launch",
  tenants: "/admin/tenants",
  users: "/admin/users",
  ai: "/admin/forge-intelligence",
  directives: "/admin/omega-broadcast",
};

function getTabForPath(pathname: string): Tab {
  if (pathname.startsWith("/admin/platform-launch")) return "platforms";
  if (pathname.startsWith("/admin/tenants")) return "tenants";
  if (pathname.startsWith("/admin/users")) return "users";
  if (pathname.startsWith("/admin/revenue")) return "overview";
  if (pathname.startsWith("/admin/forge-intelligence")) return "ai";
  if (pathname.startsWith("/admin/omega-broadcast")) return "directives";
  return "platforms";
}

export default function AdminPage() {
  const token = useAuthStore((s) => s.token);
  const user  = useAuthStore((s) => s.user);
  const location = useLocation();
  const navigate = useNavigate();
  const launchedUserRealmPlatforms = ECOSYSTEM_PLATFORMS.filter((platform) => !["/admin", "/ops"].includes(platform.path));

  const [tab, setTab]         = useState<Tab>(() => getTabForPath(location.pathname));
  const [stats, setStats]     = useState<any>(null);
  const [tenants, setTenants] = useState<any>(null);
  const [users, setUsers]     = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch]   = useState("");
  const [page, setPage]       = useState(1);
  const [modal, setModal]     = useState<{ tenantId: string; name: string; plan: string } | null>(null);
  const [newPlan, setNewPlan] = useState("PRO");
  const [directive, setDirective] = useState("");
  const [directTarget, setDirectTarget] = useState("all");
  const [now, setNow] = useState(new Date());

  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const nextTab = getTabForPath(location.pathname);
    setTab((currentTab) => (currentTab === nextTab ? currentTab : nextTab));
    setPage(1);
    setSearch("");
  }, [location.pathname]);

  useEffect(() => {
    if (tab === "overview" && !stats) loadStats();
    if (tab === "tenants") loadTenants();
    if (tab === "users")   loadUsers();
  }, [tab, page, search]);

  const loadStats = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/admin/stats`, { headers });
      if ([401, 403, 404].includes(res.status)) {
        setError("Admin sovereign boundary rejected this identity. Verify ADMIN_EMAILS before entering the Core Engine.");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStats(await res.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [token]);

  const loadTenants = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/admin/tenants?page=${page}&q=${encodeURIComponent(search)}`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setTenants(await res.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [token, page, search]);

  const loadUsers = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/admin/users?page=${page}&q=${encodeURIComponent(search)}`, { headers });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setUsers(await res.json());
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [token, page, search]);

  const changePlan = async () => {
    if (!modal) return;
    await fetch(`${API}/admin/tenants/${modal.tenantId}/plan`, {
      method: "PATCH", headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ plan: newPlan }),
    });
    setModal(null);
    loadTenants();
    setSuccess(`Plan updated to ${newPlan} successfully.`);
    setTimeout(() => setSuccess(""), 3000);
  };

  const deleteTenant = async (id: string) => {
    if (!confirm("This will soft-delete the tenant. Continue?")) return;
    await fetch(`${API}/admin/tenants/${id}`, { method: "DELETE", headers });
    loadTenants();
  };

  const handleDirective = () => {
    if (!directive.trim()) return;
    setSuccess(`Directive queued for ${directTarget === "all" ? "all platforms" : directTarget}.`);
    setDirective("");
    setTimeout(() => setSuccess(""), 4000);
  };

  const maxRevenue    = stats ? Math.max(...(stats.revenueByDay?.map((d: any) => d.amount) ?? [1]), 1) : 1;
  const totalPlanCount = stats ? Math.max(stats.planDistribution.reduce((s: number, p: any) => s + p.count, 0), 1) : 1;
  const maxCalls = Math.max(...AI_SUPERVISORS.map((a) => a.calls), 1);

  const TABS: { id: Tab; label: string }[] = [
    { id: "platforms",  label: "🚀 Platform Launch"   },
    { id: "tenants",    label: "🏢 Tenants"           },
    { id: "users",      label: "👥 Users"             },
    { id: "overview",   label: "💰 Revenue"           },
    { id: "ai",         label: "🤖 FORGE Intelligence" },
    { id: "directives", label: "📢 OMEGA Broadcast"   },
  ];

  return (
    <div className="adm-root">

      {/* ── Command Header ── */}
      <div className="adm-header">
        <div className="adm-header-row">
          <div>
            <h1 className="adm-title">
              ⬡ <span className="adm-title-gold">Admin Control Tower</span>
              <span className="adm-badge">SUPERADMIN</span>
              <span className="adm-badge-live"><span className="adm-badge-dot" />LIVE</span>
            </h1>
            <p className="adm-subtitle">
              Full sovereign control panel for the sole ecosystem operator. Users never enter this realm.
            </p>
          </div>
          <div className="adm-header-right">
            <div className="adm-sys-time">
              {now.toLocaleTimeString("en-US", { hour12: false })} UTC
            </div>
            <div className="adm-sys-user">
              {user?.email ?? "architect@winners.eco"}
            </div>
          </div>
        </div>
      </div>

      {/* ── Platform Status Bar ── */}
      <div className="adm-status-bar">
        <div className="adm-status-label">User Realm</div>
        {launchedUserRealmPlatforms.map((p) => (
          <div key={p.name} className={`adm-status-chip ${p.status}`}>
            <span className="adm-status-dot" />
            {p.icon} {p.name}
          </div>
        ))}
      </div>

      {error   && <div className="adm-error">⚠ {error}</div>}
      {success && <div className="adm-success">✓ {success}</div>}

      {/* ── Tabs ── */}
      <div className="adm-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`adm-tab${tab === t.id ? " active" : ""}`}
            onClick={() => {
              setPage(1);
              setSearch("");
              navigate(TAB_ROUTE_MAP[t.id]);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div className="adm-loading">Loading…</div>}

      {/* ══════════════════════════════════════════════════════
          OVERVIEW TAB
      ══════════════════════════════════════════════════════ */}
      {!loading && tab === "overview" && stats && (
        <>
          <div className="adm-kpis">
            {[
              { icon: "🏢", label: "Total Tenants",  value: stats.totals.tenants,      sub: `+${stats.totals.newThisWeek} this week`   },
              { icon: "👥", label: "Total Users",     value: stats.totals.users,        sub: "across all workspaces"                     },
              { icon: "💰", label: "Total Revenue",   value: fmt(stats.totals.revenue), sub: "lifetime value"                            },
              { icon: "📅", label: "New This Month",  value: stats.totals.newThisMonth, sub: "new workspaces"                            },
              { icon: "⚡", label: "New This Week",   value: stats.totals.newThisWeek,  sub: "growth rate"                               },
            ].map((k) => (
              <div className="adm-kpi" key={k.label}>
                <div className="adm-kpi-icon">{k.icon}</div>
                <div className="adm-kpi-label">{k.label}</div>
                <div className="adm-kpi-value">{k.value}</div>
                <div className="adm-kpi-sub">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="adm-charts">
            <div className="adm-chart-card">
              <div className="adm-chart-title">
                Revenue Trend
                <span className="adm-chart-sub">Last 30 days</span>
              </div>
              <div className="adm-sparkline">
                {stats.revenueByDay.map((d: any) => (
                  <div
                    key={d.date} className="adm-spark-bar"
                    style={{ height: `${Math.max(4, (d.amount / maxRevenue) * 100)}%` }}
                    title={`${d.date}: ${fmt(d.amount)}`}
                  />
                ))}
              </div>
            </div>

            <div className="adm-chart-card">
              <div className="adm-chart-title">Plan Distribution</div>
              {stats.planDistribution.map((p: any) => (
                <div className="adm-plan-bar" key={p.plan}>
                  <div className="adm-plan-bar-label">
                    <span>{p.plan}</span>
                    <span>{p.count} ws ({Math.round((p.count / totalPlanCount) * 100)}%)</span>
                  </div>
                  <div className="adm-plan-bar-track">
                    <div className="adm-plan-bar-fill" style={{ width: `${(p.count / totalPlanCount) * 100}%`, background: PLAN_COLORS[p.plan] ?? "var(--text-dim)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          PLATFORMS TAB
      ══════════════════════════════════════════════════════ */}
      {!loading && tab === "platforms" && (
        <div className="adm-platform-grid">
          {launchedUserRealmPlatforms.map((p) => (
            <div
              key={p.name}
              className="adm-platform-card"
              onClick={() => navigate(p.path)}
              style={{ cursor: "pointer" }}
            >
              <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: p.color }} />
              <div className="adm-platform-top">
                <span className="adm-platform-icon">{p.icon}</span>
                <span className={`adm-plat-stat ${p.status}`}>{p.status.toUpperCase()}</span>
              </div>
              <div className="adm-platform-name">{p.name}</div>
              <div className="adm-platform-desc">{p.desc}</div>
              <div className="adm-platform-foot">
                <span><b>{p.routes}</b> routes</span>
                <span className="adm-platform-nav">→</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          TENANTS TAB
      ══════════════════════════════════════════════════════ */}
      {!loading && tab === "tenants" && tenants && (
        <div className="adm-table-wrap">
          <div className="adm-table-hdr">
            <div className="adm-table-title">🏢 All Tenants ({tenants.total})</div>
            <input
              className="adm-search" placeholder="Search tenants…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <table>
            <thead>
              <tr>
                <th>Workspace</th><th>Plan</th><th>Users</th>
                <th>Revenue</th><th>Created</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tenants.tenants.length === 0
                ? <tr><td colSpan={6}><div className="adm-empty">No tenants found</div></td></tr>
                : tenants.tenants.map((t: any) => (
                  <tr key={t.id}>
                    <td>
                      <strong>{t.name}</strong><br />
                      <span style={{ fontFamily: "Space Mono, monospace", fontSize: 9, color: "var(--text-dim)" }}>{t.id}</span>
                    </td>
                    <td><span className={`adm-plan-tag ${t.plan}`}>{t.plan}</span></td>
                    <td>{t._count?.users ?? 0}</td>
                    <td>{fmt(t.totalRevenue)}</td>
                    <td style={{ fontFamily: "Space Mono, monospace", fontSize: 9 }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="adm-action-btn" onClick={() => { setModal({ tenantId: t.id, name: t.name, plan: t.plan }); setNewPlan(t.plan); }}>Plan</button>
                      <button className="adm-action-btn danger" onClick={() => deleteTenant(t.id)}>Delete</button>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
          <div className="adm-pagination">
            <span>Page {tenants.page} of {tenants.pages} · {tenants.total} total</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="adm-page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
              <button className="adm-page-btn" disabled={page >= tenants.pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          USERS TAB
      ══════════════════════════════════════════════════════ */}
      {!loading && tab === "users" && users && (
        <div className="adm-table-wrap">
          <div className="adm-table-hdr">
            <div className="adm-table-title">👥 All Users ({users.total})</div>
            <input
              className="adm-search" placeholder="Search users…" value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Workspace</th><th>Plan</th><th>Joined</th></tr>
            </thead>
            <tbody>
              {users.users.length === 0
                ? <tr><td colSpan={6}><div className="adm-empty">No users found</div></td></tr>
                : users.users.map((u: any) => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong></td>
                    <td style={{ fontFamily: "Space Mono, monospace", fontSize: 10 }}>{u.email}</td>
                    <td style={{ fontFamily: "Space Mono, monospace", fontSize: 10, color: "var(--text-dim)" }}>{u.role}</td>
                    <td>{u.tenant?.name ?? "—"}</td>
                    <td><span className={`adm-plan-tag ${u.tenant?.plan ?? "FREE"}`}>{u.tenant?.plan ?? "—"}</span></td>
                    <td style={{ fontFamily: "Space Mono, monospace", fontSize: 9 }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
          <div className="adm-pagination">
            <span>Page {users.page} of {users.pages} · {users.total} total</span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="adm-page-btn" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Prev</button>
              <button className="adm-page-btn" disabled={page >= users.pages} onClick={() => setPage((p) => p + 1)}>Next →</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          AI SYSTEMS TAB
      ══════════════════════════════════════════════════════ */}
      {!loading && tab === "ai" && (
        <>
          <div className="adm-kpis" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
            {[
              { icon: "🤖", label: "Total Supervisors", value: AI_SUPERVISORS.length,                                                   sub: "ecosystem-wide"      },
              { icon: "✅", label: "Active Now",         value: AI_SUPERVISORS.filter((a) => a.status === "active").length,             sub: "online agents"       },
              { icon: "⚡", label: "Total API Calls",    value: AI_SUPERVISORS.reduce((s, a) => s + a.calls, 0).toLocaleString(),       sub: "session total"       },
              { icon: "🧠", label: "Models Used",        value: [...new Set(AI_SUPERVISORS.map((a) => a.model))].length,               sub: "distinct models"     },
            ].map((k) => (
              <div className="adm-kpi" key={k.label}>
                <div className="adm-kpi-icon">{k.icon}</div>
                <div className="adm-kpi-label">{k.label}</div>
                <div className="adm-kpi-value">{k.value}</div>
                <div className="adm-kpi-sub">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="adm-ai-grid">
            {AI_SUPERVISORS.map((a) => (
              <div className="adm-ai-card" key={a.name}>
                <div className="adm-ai-top">
                  <div className="adm-ai-name">{a.name}</div>
                  <div className={`adm-ai-stat ${a.status}`}>{a.status.toUpperCase()}</div>
                </div>
                <div className="adm-ai-role">{a.role}</div>
                <div className="adm-ai-model">⚙ {a.model}</div>
                <div className="adm-ai-calls">
                  <span>API Calls</span>
                  <span className="adm-ai-calls-val">{a.calls.toLocaleString()}</span>
                </div>
                <div className="adm-ai-bar-track">
                  <div className="adm-ai-bar-fill" style={{ width: `${(a.calls / maxCalls) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════
          DIRECTIVES TAB
      ══════════════════════════════════════════════════════ */}
      {!loading && tab === "directives" && (
        <div className="adm-dir-grid">
          <div className="adm-dir-card">
            <div className="adm-dir-title">⚡ Issue Platform Directive</div>
            <textarea
              className="adm-dir-textarea"
              placeholder="Type a system-wide directive, announcement, or instruction for the platform…"
              value={directive}
              onChange={(e) => setDirective(e.target.value)}
            />
            <div className="adm-dir-row">
              <select
                className="adm-dir-select"
                value={directTarget}
                onChange={(e) => setDirectTarget(e.target.value)}
              >
                <option value="all">All Platforms</option>
                {launchedUserRealmPlatforms.map((p) => (
                  <option key={p.name} value={p.name}>{p.icon} {p.name}</option>
                ))}
              </select>
              <button
                className="adm-btn"
                onClick={handleDirective}
                disabled={!directive.trim()}
                style={{ flexShrink: 0 }}
              >
                Deploy
              </button>
            </div>
          </div>

          <div className="adm-dir-card">
            <div className="adm-dir-title">🚀 Quick Actions</div>
            <div className="adm-qa-grid">
              {QUICK_ACTIONS.map((qa) => (
                <button
                  key={qa.label}
                  className="adm-qa-btn"
                  onClick={() => {
                    setSuccess(`${qa.label} initiated.`);
                    setTimeout(() => setSuccess(""), 3000);
                  }}
                >
                  <span className="adm-qa-icon">{qa.icon}</span>
                  <span className="adm-qa-label">{qa.label}</span>
                  <span className="adm-qa-sub">{qa.sub}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="adm-dir-card" style={{ gridColumn: "1 / -1" }}>
            <div className="adm-dir-title">🗂 Platform Navigation</div>
            <div className="adm-platform-grid" style={{ marginBottom: 0 }}>
              {launchedUserRealmPlatforms.map((p) => (
                <button
                  key={p.name}
                  className="adm-qa-btn"
                  onClick={() => navigate(p.path)}
                  style={{ textAlign: "left" }}
                >
                  <span className="adm-qa-icon">{p.icon}</span>
                  <span className="adm-qa-label">{p.name}</span>
                  <span className="adm-qa-sub">{p.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Change Plan Modal ── */}
      {modal && (
        <div className="adm-modal-overlay" onClick={() => setModal(null)}>
          <div className="adm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="adm-modal-title">Change Plan — {modal.name}</div>
            <select className="adm-modal-select" value={newPlan} onChange={(e) => setNewPlan(e.target.value)}>
              <option value="FREE">FREE</option>
              <option value="PRO">PRO</option>
              <option value="ENTERPRISE">ENTERPRISE</option>
            </select>
            <div className="adm-modal-btns">
              <button className="adm-btn ghost" onClick={() => setModal(null)}>Cancel</button>
              <button className="adm-btn" onClick={changePlan}>Save Plan</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
