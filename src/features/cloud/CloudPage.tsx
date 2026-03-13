// Phase 8 — Winners Cloud — CloudPage.tsx
// NEXUS Supervisor · Developer Portal Dashboard
// Cloud infrastructure overview · API keys · Connectors · Automations · Agents

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";
import AssistantPanel from "../../components/ui/AssistantPanel";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

interface CloudOverview {
  apiKeys: number;
  connectors: number;
  activeAutomations: number;
  activeAgents: number;
  creditsUsed30d: number;
  apiCalls30d: number;
}

const CLOUD_FEATURES = [
  {
    icon: "🔑",
    title: "API Keys",
    desc: "Generate and manage API keys with scoped permissions and rate limits",
    path: "/cloud/keys",
    color: "var(--gold)",
    badge: "Developer",
  },
  {
    icon: "🔌",
    title: "Connectors",
    desc: "50+ integrations — M-Pesa, Shopify, WhatsApp, Flutterwave, Stripe and more",
    path: "/cloud/connectors",
    color: "var(--purple)",
    badge: "Marketplace",
  },
  {
    icon: "⚡",
    title: "Automations",
    desc: "Visual workflow builder — connect triggers, actions, and conditions",
    path: "/cloud/automations",
    color: "var(--ice)",
    badge: "iPaaS",
  },
  {
    icon: "🤖",
    title: "AI Agents",
    desc: "Deploy autonomous OMEGA-class agents with goal-driven intelligence",
    path: "/cloud/agents",
    color: "var(--green)",
    badge: "Intelligence",
  },
  {
    icon: "🪝",
    title: "Webhooks",
    desc: "Subscribe to 15+ ecosystem events with HMAC-signed payloads",
    path: "/cloud/webhooks",
    color: "var(--blue)",
    badge: "Events",
  },
  {
    icon: "📊",
    title: "Usage & Billing",
    desc: "Credit consumption, API call volumes, cost breakdown by feature",
    path: "/cloud/usage",
    color: "var(--gold)",
    badge: "Metering",
  },
];

const WEBHOOK_EVENTS = [
  { event: "user.trust_score_changed",   layer: "Core",        desc: "Trust Score tier changes" },
  { event: "academy.certificate_issued", layer: "Academy",     desc: "User earns a certificate" },
  { event: "community.skill_detected",   layer: "Community",   desc: "NOVA detects skill in post" },
  { event: "work.contract_completed",    layer: "Work",        desc: "Escrow released" },
  { event: "loop.stage_advanced",        layer: "Intelligence",desc: "User advances Agentic Loop" },
  { event: "market.sale_completed",      layer: "Market",      desc: "Product purchase confirmed" },
  { event: "user.identity_verified",     layer: "Core",        desc: "KYC verification passes" },
  { event: "payment.received",           layer: "Billing",     desc: "Any payment settled" },
];

export default function CloudPage() {
  const token = useAuthStore((s) => s.token);
  const [overview, setOverview] = useState<CloudOverview | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/cloud/overview`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setOverview(data.overview);
        }
      } catch {
        // non-blocking
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  return (
    <div style={{ padding: "32px 28px", maxWidth: 1200, margin: "0 auto" }}>
      <style>{`
        .cloud-ctx-bar { display:flex; gap:8px; marginBottom:22px; flexWrap:wrap; }
        .ctx-badge { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:0.08em; padding:4px 10px; border-radius:3px; border:1px solid; transition:all 200ms ease; }
        .ctx-badge.live    { background:rgba(45,212,160,0.08);  border-color:rgba(45,212,160,0.3);  color:var(--green); }
        .ctx-badge.active  { background:rgba(155,111,255,0.15); border-color:var(--purple);         color:var(--purple); }
        .ctx-badge.building{ background:rgba(201,168,76,0.08);  border-color:rgba(201,168,76,0.25); color:var(--gold); }
        .ctx-badge.planned { background:rgba(43,95,142,0.08);   border-color:rgba(43,95,142,0.25);  color:var(--text-dim); }
        .ctx-sep { color:var(--border); font-size:11px; display:flex; align-items:center; }

        .cloud-stat-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:16px; margin-bottom:36px; }
        .cloud-stat-card { background:var(--surface); border:1px solid var(--border); border-radius:6px; padding:20px 16px; position:relative; overflow:hidden; }
        .cloud-stat-card::before { content:""; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,var(--purple),transparent); }
        .cloud-stat-label { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.12em; color:var(--text-dim); margin-bottom:8px; }
        .cloud-stat-value { font-family:'Syne',sans-serif; font-size:28px; font-weight:700; color:var(--text); }
        .cloud-stat-sub   { font-family:'Space Mono',monospace; font-size:10px; color:var(--text-dim); margin-top:4px; }

        .cloud-section-title { font-family:'Syne',sans-serif; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; color:var(--text-dim); margin-bottom:16px; }

        .cloud-feature-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:16px; margin-bottom:40px; }
        .cloud-feature-card { background:var(--surface); border:1px solid var(--border); border-radius:6px; padding:24px; position:relative; overflow:hidden; transition:border-color 200ms ease, transform 200ms ease; text-decoration:none; display:block; cursor:pointer; }
        .cloud-feature-card::before { content:""; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,var(--purple),transparent); }
        .cloud-feature-card:hover { border-color:var(--purple); transform:translateY(-2px); }
        .cloud-feature-icon { font-size:28px; margin-bottom:12px; }
        .cloud-feature-title { font-family:'Syne',sans-serif; font-size:15px; font-weight:700; color:var(--text); margin-bottom:6px; }
        .cloud-feature-desc  { font-family:'Syne',sans-serif; font-size:13px; color:var(--text-dim); line-height:1.5; }
        .cloud-feature-badge { position:absolute; top:16px; right:16px; font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.1em; padding:3px 8px; border-radius:3px; background:rgba(155,111,255,0.12); border:1px solid rgba(155,111,255,0.3); color:var(--purple); }

        .cloud-events-table { width:100%; border-collapse:collapse; margin-bottom:40px; }
        .cloud-events-table th { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.1em; color:var(--text-dim); padding:8px 12px; text-align:left; border-bottom:1px solid var(--border); }
        .cloud-events-table td { padding:10px 12px; border-bottom:1px solid rgba(30,50,72,0.5); font-family:'Space Mono',monospace; font-size:11px; }
        .cloud-events-table tr:last-child td { border-bottom:none; }
        .event-name  { color:var(--gold); }
        .event-layer { color:var(--purple); }
        .event-desc  { color:var(--text-dim); }

        .cloud-nexus-panel { background:var(--surface); border:1px solid rgba(155,111,255,0.3); border-radius:6px; padding:24px; position:relative; overflow:hidden; margin-bottom:32px; }
        .cloud-nexus-panel::before { content:""; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,var(--purple),var(--blue)); }
        .cloud-nexus-header { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
        .cloud-nexus-avatar { width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg,rgba(155,111,255,0.2),rgba(43,95,142,0.2)); border:1px solid rgba(155,111,255,0.4); display:flex; align-items:center; justify-content:center; font-size:18px; }
        .cloud-nexus-name   { font-family:'Syne',sans-serif; font-size:14px; font-weight:700; color:var(--purple); }
        .cloud-nexus-role   { font-family:'Space Mono',monospace; font-size:9px; color:var(--text-dim); text-transform:uppercase; letter-spacing:0.08em; }
        .cloud-nexus-msg    { font-family:'Syne',sans-serif; font-size:13px; color:var(--text-dim); line-height:1.6; }

        .cloud-quick-actions { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:32px; }
        .cloud-btn { font-family:'Space Mono',monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.08em; padding:10px 20px; border-radius:4px; border:none; cursor:pointer; transition:all 200ms ease; text-decoration:none; display:inline-flex; align-items:center; gap:8px; }
        .cloud-btn-primary { background:var(--purple); color:#fff; }
        .cloud-btn-primary:hover { opacity:0.85; }
        .cloud-btn-outline { background:transparent; border:1px solid var(--border); color:var(--text-dim); }
        .cloud-btn-outline:hover { border-color:var(--purple); color:var(--purple); }

        .skeleton { background:linear-gradient(90deg,var(--surface2) 25%,var(--surface3) 50%,var(--surface2) 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:4px; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        @media(max-width:768px) {
          .cloud-stat-grid { grid-template-columns:repeat(2,1fr); }
          .cloud-feature-grid { grid-template-columns:1fr; }
          .cloud-quick-actions { flex-direction:column; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: 28 }}>☁️</span>
          <div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 300, color: "var(--text)", margin: 0 }}>
              Winners <span style={{ color: "var(--purple)", fontStyle: "italic" }}>Cloud</span>
            </h1>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>
              Phase 8 · NEXUS · Developer Platform · iPaaS · AI Agents
            </div>
          </div>
        </div>
      </div>

      {/* Context Bar */}
      <div className="cloud-ctx-bar">
        <span className="ctx-badge live">⬡ Core Engine</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge live">🧑‍🤝‍🧑 Community</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge live">🎓 Academy</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge building">🛒 Market</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge live">🤖 Intelligence</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge building">💼 Work</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge active">☁️ Cloud</span>
      </div>

      {/* NEXUS Welcome Panel */}
      <div className="cloud-nexus-panel">
        <div className="cloud-nexus-header">
          <div className="cloud-nexus-avatar">☁️</div>
          <div>
            <div className="cloud-nexus-name">NEXUS — Cloud Supervisor</div>
            <div className="cloud-nexus-role">API-first · Developer-focused · African infrastructure expert</div>
          </div>
        </div>
        <p className="cloud-nexus-msg">
          Welcome to Winners Cloud — the infrastructure layer that transforms the ecosystem into a programmable platform.
          From here you manage API keys, deploy connectors, build automations, and deploy autonomous AI agents.
          Every African and diaspora builder can now access sovereign cloud infrastructure with M-Pesa, Flutterwave,
          and WhatsApp built in from day one.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="cloud-quick-actions">
        <Link to="/cloud/keys" className="cloud-btn cloud-btn-primary">🔑 Create API Key</Link>
        <Link to="/cloud/connectors" className="cloud-btn cloud-btn-outline">🔌 Browse Connectors</Link>
        <Link to="/cloud/automations" className="cloud-btn cloud-btn-outline">⚡ Build Automation</Link>
        <Link to="/cloud/agents" className="cloud-btn cloud-btn-outline">🤖 Deploy Agent</Link>
      </div>

      {/* Stats */}
      <div className="cloud-stat-grid">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="cloud-stat-card">
              <div className="skeleton" style={{ height: 12, width: "60%", marginBottom: 12 }} />
              <div className="skeleton" style={{ height: 32, width: "40%" }} />
            </div>
          ))
        ) : (
          <>
            <div className="cloud-stat-card">
              <div className="cloud-stat-label">API Keys</div>
              <div className="cloud-stat-value">{overview?.apiKeys ?? 0}</div>
              <div className="cloud-stat-sub">active keys</div>
            </div>
            <div className="cloud-stat-card">
              <div className="cloud-stat-label">Connectors</div>
              <div className="cloud-stat-value">{overview?.connectors ?? 0}</div>
              <div className="cloud-stat-sub">installed</div>
            </div>
            <div className="cloud-stat-card">
              <div className="cloud-stat-label">Automations</div>
              <div className="cloud-stat-value">{overview?.activeAutomations ?? 0}</div>
              <div className="cloud-stat-sub">active workflows</div>
            </div>
            <div className="cloud-stat-card">
              <div className="cloud-stat-label">AI Agents</div>
              <div className="cloud-stat-value">{overview?.activeAgents ?? 0}</div>
              <div className="cloud-stat-sub">deployed</div>
            </div>
            <div className="cloud-stat-card">
              <div className="cloud-stat-label">Credits Used</div>
              <div className="cloud-stat-value">{(overview?.creditsUsed30d ?? 0).toLocaleString()}</div>
              <div className="cloud-stat-sub">last 30 days</div>
            </div>
            <div className="cloud-stat-card">
              <div className="cloud-stat-label">API Calls</div>
              <div className="cloud-stat-value">{(overview?.apiCalls30d ?? 0).toLocaleString()}</div>
              <div className="cloud-stat-sub">last 30 days</div>
            </div>
          </>
        )}
      </div>

      {/* Feature Cards */}
      <div className="cloud-section-title">Cloud Features</div>
      <div className="cloud-feature-grid">
        {CLOUD_FEATURES.map((f) => (
          <Link key={f.title} to={f.path} className="cloud-feature-card" style={{ textDecoration: "none" }}>
            <span className="cloud-feature-badge">{f.badge}</span>
            <div className="cloud-feature-icon">{f.icon}</div>
            <div className="cloud-feature-title">{f.title}</div>
            <div className="cloud-feature-desc">{f.desc}</div>
          </Link>
        ))}
      </div>

      {/* Webhook Events Catalogue */}
      <div className="cloud-section-title">Webhook Event Catalogue</div>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden", marginBottom: 40 }}>
        <table className="cloud-events-table">
          <thead>
            <tr>
              <th>Event</th>
              <th>Layer</th>
              <th>Trigger</th>
            </tr>
          </thead>
          <tbody>
            {WEBHOOK_EVENTS.map((e) => (
              <tr key={e.event}>
                <td className="event-name">{e.event}</td>
                <td className="event-layer">{e.layer}</td>
                <td className="event-desc">{e.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SDK snippet */}
      <div className="cloud-section-title">Quick Start — JavaScript SDK</div>
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "20px 24px", marginBottom: 40 }}>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, color: "var(--text-dim)", lineHeight: 1.7, whiteSpace: "pre" }}>
          {`npm install @winners/sdk\n\nimport { WinnersSDK } from '@winners/sdk';\n\nconst winners = new WinnersSDK({ apiKey: 'wn_live_...' });\n\n// Subscribe to Agentic Loop events\nwinners.webhooks.on('loop.stage_advanced', (event) => {\n  console.log('User advanced to stage:', event.toStage);\n});\n\n// Trigger Academy recommendation\nawait winners.academy.recommend({ userId, skills: ['react', 'typescript'] });`}
        </div>
      </div>

      <AssistantPanel
        assistant="nexus"
        page="cloud"
        context={{ layer: "cloud", view: "portal", description: "Developer portal — API keys, connectors, automations, AI agents, webhooks, usage metering" }}
      />
    </div>
  );
}
