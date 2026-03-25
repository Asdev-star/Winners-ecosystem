// src/components/docs/ArchitectureDiagram.tsx

import { useEffect } from "react";
import type { ReactNode } from "react";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .arch-root {
    --gold: var(--gold);
    --gold-dim: var(--gold-dim);
    --bg: var(--bg);
    --surface: var(--surface);
    --surface2: var(--surface2);
    --border: var(--border);
    --text: var(--text);
    --text-dim: var(--text-dim);
    --green: var(--green);
    --blue: var(--blue);
    --red: var(--red);
    --purple: var(--purple);
    background: var(--bg);
    color: var(--text);
    font-family: 'Syne', sans-serif;
    min-height: 100vh;
    overflow-x: hidden;
    position: relative;
  }

  .arch-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(245,200,66,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(245,200,66,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
    z-index: 0;
  }

  .arch-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 40px 24px 80px;
    position: relative;
    z-index: 1;
  }

  .arch-header {
    text-align: center;
    margin-bottom: 56px;
    animation: arch-fadeDown 0.6s ease forwards;
  }

  .arch-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(245,200,66,0.1);
    border: 1px solid rgba(245,200,66,0.25);
    border-radius: 2px;
    padding: 6px 14px;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: var(--gold);
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-bottom: 20px;
  }

  .arch-h1 {
    font-size: clamp(28px, 5vw, 48px);
    font-weight: 800;
    letter-spacing: -1px;
    line-height: 1.1;
    color: var(--text);
  }

  .arch-h1 span { color: var(--gold); }

  .arch-subtitle {
    margin-top: 12px;
    color: var(--text-dim);
    font-size: 14px;
    font-family: 'Space Mono', monospace;
    letter-spacing: 0.5px;
  }

  .arch-legend {
    display: flex;
    gap: 20px;
    justify-content: center;
    margin-bottom: 40px;
    flex-wrap: wrap;
    animation: arch-fadeIn 0.5s 0.8s ease forwards;
    opacity: 0;
  }

  .arch-legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--text-dim);
  }

  .arch-legend-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .arch-flow {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .arch-layer {
    display: grid;
    grid-template-columns: 160px 1fr;
    gap: 0;
    opacity: 0;
    animation: arch-fadeIn 0.5s ease forwards;
  }

  .arch-layer:nth-child(1) { animation-delay: 0.1s; }
  .arch-layer:nth-child(2) { animation-delay: 0.2s; }
  .arch-layer:nth-child(3) { animation-delay: 0.3s; }
  .arch-layer:nth-child(4) { animation-delay: 0.4s; }
  .arch-layer:nth-child(5) { animation-delay: 0.5s; }
  .arch-layer:nth-child(6) { animation-delay: 0.6s; }
  .arch-layer:nth-child(7) { animation-delay: 0.7s; }

  .arch-layer-label {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-end;
    padding: 24px 20px 24px 0;
    border-right: 2px solid var(--border);
    text-align: right;
    gap: 4px;
    position: relative;
  }

  .arch-layer-label::after {
    content: '';
    position: absolute;
    right: -7px;
    top: 50%;
    transform: translateY(-50%);
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--bg);
    border: 2px solid var(--border);
  }

  .arch-layer-label.active::after {
    border-color: var(--gold);
    background: var(--gold);
    box-shadow: 0 0 12px rgba(245,200,66,0.5);
  }

  .arch-layer-num {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--text-dim);
    letter-spacing: 1px;
  }

  .arch-layer-name {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    color: var(--text-dim);
  }

  .arch-layer-name.gold   { color: var(--gold); }
  .arch-layer-name.green  { color: var(--green); }
  .arch-layer-name.blue   { color: var(--blue); }
  .arch-layer-name.purple { color: var(--purple); }

  .arch-layer-content {
    padding: 20px 0 20px 28px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .arch-connector {
    display: grid;
    grid-template-columns: 160px 1fr;
    height: 32px;
  }

  .arch-connector-line { border-right: 2px solid var(--border); }

  .arch-connector-arrow {
    display: flex;
    align-items: center;
    padding-left: 28px;
    gap: 8px;
  }

  .arch-arrow-line {
    height: 1px;
    width: 48px;
    background: linear-gradient(90deg, var(--border), transparent);
  }

  .arch-arrow-label {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--text-dim);
    letter-spacing: 1px;
  }

  .arch-cards {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }

  .arch-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 14px 16px;
    min-width: 160px;
    flex: 1;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    overflow: hidden;
  }

  .arch-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
  }

  .arch-card.gold::before   { background: var(--gold); }
  .arch-card.green::before  { background: var(--green); }
  .arch-card.blue::before   { background: var(--blue); }
  .arch-card.purple::before { background: var(--purple); }

  .arch-card:hover { background: var(--surface2); transform: translateY(-2px); }
  .arch-card.gold:hover   { border-color: rgba(245,200,66,0.3); box-shadow: 0 4px 20px rgba(245,200,66,0.1); }
  .arch-card.green:hover  { border-color: rgba(45,212,160,0.3); box-shadow: 0 4px 20px rgba(45,212,160,0.1); }
  .arch-card.blue:hover   { border-color: rgba(74,158,255,0.3); box-shadow: 0 4px 20px rgba(74,158,255,0.1); }
  .arch-card.purple:hover { border-color: rgba(155,111,255,0.3); box-shadow: 0 4px 20px rgba(155,111,255,0.1); }

  .arch-card-title {
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 6px;
    letter-spacing: 0.3px;
  }

  .arch-card.gold .arch-card-title   { color: var(--gold); }
  .arch-card.green .arch-card-title  { color: var(--green); }
  .arch-card.blue .arch-card-title   { color: var(--blue); }
  .arch-card.purple .arch-card-title { color: var(--purple); }

  .arch-card-items {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 0;
    margin: 0;
  }

  .arch-card-items li {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--text-dim);
    display: flex;
    align-items: flex-start;
    gap: 6px;
  }

  .arch-card-items li::before { content: '›'; opacity: 0.5; flex-shrink: 0; }

  .arch-badge-tag {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 8px;
    border-radius: 2px;
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 1px;
    text-transform: uppercase;
    font-weight: 700;
    margin-top: 8px;
  }

  .arch-badge-tag::before {
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: currentColor;
  }

  .arch-badge-tag.built   { background: rgba(45,212,160,0.1); color: var(--green); border: 1px solid rgba(45,212,160,0.2); }
  .arch-badge-tag.next    { background: rgba(245,200,66,0.1);  color: var(--gold);  border: 1px solid rgba(245,200,66,0.2); }
  .arch-badge-tag.planned { background: rgba(90,104,120,0.15); color: var(--text-dim); border: 1px solid var(--border); }

  .arch-section {
    margin-top: 60px;
    opacity: 0;
    animation: arch-fadeIn 0.6s 0.9s ease forwards;
  }

  .arch-section-title {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .arch-section-title::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border);
  }

  .arch-tenant-grid {
    display: grid;
    grid-template-columns: 1fr auto 1fr auto 1fr;
    gap: 0;
    align-items: stretch;
    margin-bottom: 16px;
  }

  .arch-tenant-box {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 16px;
    text-align: center;
  }

  .arch-tenant-label {
    font-size: 10px;
    font-family: 'Space Mono', monospace;
    color: var(--text-dim);
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .arch-tenant-name { font-size: 13px; font-weight: 700; color: var(--blue); }
  .arch-tenant-id   { margin-top: 8px; font-size: 10px; font-family: 'Space Mono', monospace; color: var(--text-dim); }

  .arch-tenant-arrow {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 8px;
    color: var(--text-dim);
    font-size: 18px;
    font-family: 'Space Mono', monospace;
  }

  .arch-rls-label {
    text-align: center;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: var(--text-dim);
    margin: 8px 0;
  }

  .arch-db-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-top: 16px;
  }

  .arch-db-box {
    background: var(--surface2);
    border: 1px solid rgba(74,158,255,0.2);
    border-radius: 4px;
    padding: 12px;
    text-align: center;
  }

  .arch-db-name { font-size: 11px; font-weight: 700; color: var(--blue); margin-bottom: 4px; font-family: 'Space Mono', monospace; }
  .arch-db-desc { font-size: 10px; color: var(--text-dim); font-family: 'Space Mono', monospace; }

  .arch-shared-layer {
    background: var(--surface);
    border: 1px solid rgba(155,111,255,0.25);
    border-radius: 4px;
    padding: 16px 20px;
    margin-top: 16px;
  }

  .arch-shared-title {
    font-size: 11px;
    font-family: 'Space Mono', monospace;
    color: var(--purple);
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 12px;
  }

  .arch-shared-items { display: flex; gap: 10px; flex-wrap: wrap; }

  .arch-shared-item {
    background: rgba(155,111,255,0.08);
    border: 1px solid rgba(155,111,255,0.2);
    border-radius: 2px;
    padding: 6px 12px;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--purple);
  }

  .arch-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 16px;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
  }

  .arch-table th {
    background: var(--surface2);
    border: 1px solid var(--border);
    padding: 10px 14px;
    text-align: left;
    color: var(--gold);
    font-size: 10px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .arch-table td { border: 1px solid var(--border); padding: 10px 14px; color: var(--text-dim); }
  .arch-table tr:hover td { background: var(--surface2); color: var(--text); }

  .arch-check { color: var(--green); }
  .arch-cross  { color: var(--red); opacity: 0.5; }

  @keyframes arch-fadeIn {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes arch-fadeDown {
    from { opacity: 0; transform: translateY(-12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 640px) {
    .arch-layer         { grid-template-columns: 100px 1fr; }
    .arch-connector     { grid-template-columns: 100px 1fr; }
    .arch-layer-label   { padding: 16px 12px 16px 0; }
    .arch-layer-content { padding: 16px 0 16px 16px; }
    .arch-tenant-grid   { grid-template-columns: 1fr; }
    .arch-tenant-arrow  { display: none; }
    .arch-db-row        { grid-template-columns: 1fr; }
  }
`;

// ─── Types ────────────────────────────────────────────────────────────────────

type Color = "gold" | "green" | "blue" | "purple";
type BadgeType = "built" | "next" | "planned";

interface CardData {
  color: Color;
  title: string;
  items: string[];
  badge?: string;
  badgeType?: BadgeType;
}

interface LayerData {
  num: string;
  name: string;
  color: Color;
  isActive?: boolean;
  connector: string | null;
  cards: CardData[];
}

interface RbacRow {
  perm: string;
  owner: boolean;
  admin: boolean;
  member: boolean;
  viewer: boolean;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const Badge = ({ type, children }: { type: BadgeType; children: ReactNode }) => (
  <span className={`arch-badge-tag ${type}`}>{children}</span>
);

const Card = ({ color, title, items, badge, badgeType }: CardData) => (
  <div className={`arch-card ${color}`}>
    <div className="arch-card-title">{title}</div>
    <ul className="arch-card-items">
      {items.map((item, i) => <li key={i}>{item}</li>)}
    </ul>
    {badge && badgeType && <Badge type={badgeType}>{badge}</Badge>}
  </div>
);

const Layer = ({
  num, name, color, isActive, children,
}: {
  num: string; name: string; color: Color; isActive?: boolean; children: ReactNode;
}) => (
  <div className="arch-layer">
    <div className={`arch-layer-label${isActive ? " active" : ""}`}>
      <span className="arch-layer-num">{num}</span>
      <span className={`arch-layer-name ${color}`}>{name}</span>
    </div>
    <div className="arch-layer-content">
      <div className="arch-cards">{children}</div>
    </div>
  </div>
);

const Connector = ({ label }: { label: string }) => (
  <div className="arch-connector">
    <div className="arch-connector-line" />
    <div className="arch-connector-arrow">
      <div className="arch-arrow-line" />
      <span className="arch-arrow-label">{label}</span>
    </div>
  </div>
);

const SectionTitle = ({ children }: { children: ReactNode }) => (
  <div className="arch-section-title">{children}</div>
);

// ─── Data ─────────────────────────────────────────────────────────────────────

const LAYERS: LayerData[] = [
  {
    num: "L1", name: "Client", color: "gold", isActive: true,
    connector: "JWT + Tenant ID header",
    cards: [
      { color: "gold", title: "React Frontend", badge: "Built", badgeType: "built",
        items: ["Dashboard UI", "Revenue & Activity charts", "Forecast toggle", "Insight cards", "Period selector"] },
      { color: "gold", title: "Auth UI", badge: "Build Next", badgeType: "next",
        items: ["Login / Register", "Tenant onboarding flow", "Role switcher", "Invite members"] },
    ],
  },
  {
    num: "L2", name: "Auth", color: "green",
    connector: "Verified requests",
    cards: [
      { color: "green", title: "Auth Service", badge: "Build Next", badgeType: "next",
        items: ["JWT issue & verify", "Refresh token rotation", "Session management", "OAuth (Google / GitHub)"] },
      { color: "green", title: "RBAC Engine", badge: "Build Next", badgeType: "next",
        items: ["Owner / Admin / Member roles", "Permission middleware", "Tenant context resolver", "Invite token system"] },
    ],
  },
  {
    num: "L3", name: "API", color: "blue",
    connector: "Scoped data requests",
    cards: [
      { color: "blue", title: "Node.js API Gateway", badge: "Built (Extend)", badgeType: "built",
        items: ["Route /api/v1/*", "Tenant middleware injection", "Rate limiting per tenant", "Request validation", "Error handling"] },
      { color: "blue", title: "Tenant Resolver", badge: "Build Next", badgeType: "next",
        items: ["Subdomain → tenant_id", "DB schema selector", "Plan/quota checker", "Audit logger"] },
    ],
  },
  {
    num: "L4", name: "Engine", color: "green",
    connector: "Isolated DB queries",
    cards: [
      { color: "green", title: "analyticsEngine.ts", badge: "Built ✓", badgeType: "built",
        items: ["Growth calculator", "Period comparison", "Forecast generator", "Confidence bands", "Anomaly detection", "Insight generator"] },
      { color: "green", title: "Tenant Data Scope", badge: "Build Next", badgeType: "next",
        items: ["tenant_id scoped queries", "Isolated data pipelines", "Per-tenant caching", "Quota enforcement"] },
    ],
  },
  {
    num: "L5", name: "Data", color: "purple",
    connector: null,
    cards: [
      { color: "purple", title: "PostgreSQL (Primary)", badge: "Build Next", badgeType: "next",
        items: ["tenants table", "users table (tenant_id FK)", "analytics_events", "revenue_records", "Row-level security (RLS)"] },
      { color: "purple", title: "Redis (Cache)", badge: "Planned", badgeType: "planned",
        items: ["Session store", "Per-tenant cache keys", "Rate limit counters", "Forecast cache (TTL)"] },
    ],
  },
];

const RBAC_ROWS: RbacRow[] = [
  { perm: "View Dashboard", owner: true,  admin: true,  member: true,  viewer: true  },
  { perm: "View Forecasts", owner: true,  admin: true,  member: true,  viewer: false },
  { perm: "Invite Members", owner: true,  admin: true,  member: false, viewer: false },
  { perm: "Export Reports", owner: true,  admin: true,  member: true,  viewer: false },
  { perm: "Manage Billing", owner: true,  admin: false, member: false, viewer: false },
  { perm: "Delete Tenant",  owner: true,  admin: false, member: false, viewer: false },
];

const BUILD_STEPS: CardData[] = [
  { color: "gold",   title: "Step 1", badge: "Start Here", badgeType: "next",
    items: ["tenants + users DB schema", "Row Level Security (RLS)", "tenant_id FK everywhere"] },
  { color: "blue",   title: "Step 2", badge: "Then This", badgeType: "planned",
    items: ["Auth Service (JWT)", "Tenant resolver middleware", "Login / Register UI"] },
  { color: "green",  title: "Step 3", badge: "Then This", badgeType: "planned",
    items: ["RBAC middleware", "Scope analyticsEngine", "Per-tenant API routes"] },
  { color: "purple", title: "Step 4", badge: "Then This", badgeType: "planned",
    items: ["Invite system", "Tenant onboarding flow", "Multi-tenant dashboard"] },
];

const TENANTS = [
  { name: "Acme Corp",   id: "t_001" },
  { name: "StartupXYZ", id: "t_002" },
  { name: "Your Client", id: "t_N"  },
];

const DB_TABLES = [
  { name: "users",            desc: "tenant_id FK\nrole + permissions" },
  { name: "analytics_events", desc: "tenant_id FK\nisolated per org"   },
  { name: "revenue_records",  desc: "tenant_id FK\nisolated per org"   },
];

const SHARED_INFRA = [
  "analyticsEngine.ts", "Forecast Logic", "Anomaly Detector",
  "Auth Service", "API Gateway", "React UI Shell",
];

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ArchitectureDiagram() {
  useEffect(() => {
    const id = "arch-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id;
      tag.textContent = styles;
      document.head.appendChild(tag);
    }
    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);

  return (
    <div className="arch-root">
      <div className="arch-container">

        {/* Header */}
        <div className="arch-header">
          <div className="arch-badge">🏆 Winners Ecosystem</div>
          <h1 className="arch-h1">Multi-Tenant <span>Architecture</span></h1>
          <p className="arch-subtitle">React + Node.js · User Layer Design · v2.0</p>
        </div>

        {/* Legend */}
        <div className="arch-legend">
          {[
            { color: "var(--green)",    label: "Built" },
            { color: "var(--gold)",     label: "Build Next" },
            { color: "var(--text-dim)", label: "Planned" },
          ].map(({ color, label }) => (
            <div className="arch-legend-item" key={label}>
              <div className="arch-legend-dot" style={{ background: color }} />
              {label}
            </div>
          ))}
        </div>

        {/* Architecture Flow */}
        <div className="arch-flow">
          {LAYERS.map((layer) => (
            <div key={layer.num}>
              <Layer num={layer.num} name={layer.name} color={layer.color} isActive={layer.isActive}>
                {layer.cards.map((card) => (
                  <Card key={card.title} {...card} />
                ))}
              </Layer>
              {layer.connector && <Connector label={layer.connector} />}
            </div>
          ))}
        </div>

        {/* Multi-Tenant Isolation */}
        <div className="arch-section">
          <SectionTitle>Multi-Tenant Isolation Model</SectionTitle>
          <div className="arch-tenant-grid">
            {TENANTS.map((t, i) => (
              <>
                <div className="arch-tenant-box" key={t.id}>
                  <div className="arch-tenant-label">Tenant</div>
                  <div className="arch-tenant-name">{t.name}</div>
                  <div className="arch-tenant-id">tenant_id: {t.id}</div>
                </div>
                {i < TENANTS.length - 1 && (
                  <div className="arch-tenant-arrow" key={`arrow-${i}`}>→</div>
                )}
              </>
            ))}
          </div>

          <p className="arch-rls-label">↓ All queries scoped by tenant_id via Row Level Security (RLS)</p>

          <div className="arch-db-row">
            {DB_TABLES.map(({ name, desc }) => (
              <div className="arch-db-box" key={name}>
                <div className="arch-db-name">{name}</div>
                <div className="arch-db-desc" style={{ whiteSpace: "pre-line" }}>{desc}</div>
              </div>
            ))}
          </div>

          <div className="arch-shared-layer">
            <div className="arch-shared-title">Shared Infrastructure (no data crossing)</div>
            <div className="arch-shared-items">
              {SHARED_INFRA.map((item) => (
                <div className="arch-shared-item" key={item}>{item}</div>
              ))}
            </div>
          </div>
        </div>

        {/* RBAC Table */}
        <div className="arch-section">
          <SectionTitle>Role-Based Access (RBAC)</SectionTitle>
          <table className="arch-table">
            <thead>
              <tr>
                {["Permission", "Owner", "Admin", "Member", "Viewer"].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {RBAC_ROWS.map(({ perm, owner, admin, member, viewer }) => (
                <tr key={perm}>
                  <td>{perm}</td>
                  {[owner, admin, member, viewer].map((v, i) => (
                    <td key={i} className={v ? "arch-check" : "arch-cross"}>{v ? "✓" : "✗"}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Build Order */}
        <div className="arch-section">
          <SectionTitle>Recommended Build Order</SectionTitle>
          <div className="arch-cards">
            {BUILD_STEPS.map((step) => (
              <Card key={step.title} {...step} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
