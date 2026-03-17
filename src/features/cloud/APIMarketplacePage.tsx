// Level XI - Sovereign Infrastructure & API
// Page: APIMarketplacePage
// Winners becomes the layer others build on.
// Developers, partners, and third-party apps consume Winners data and capabilities via API.

import { useState } from "react";
import { Link } from "react-router-dom";
import AssistantPanel from "../../components/ui/AssistantPanel";
import ContextBar from "../../components/ui/ContextBar";
import { useAuthStore } from "../auth/authStore";

// ─── Types ────────────────────────────────────────────────────────────────────

interface APIProduct {
  id: string;
  name: string;
  description: string;
  category: "intelligence" | "community" | "work" | "market" | "academy" | "identity";
  endpoints: number;
  version: string;
  callsPerMonth: string;
  pricePerCall?: number;
  priceTier: "free" | "pay-per-use" | "subscription";
  monthlyPrice?: number;
  docsUrl: string;
  status: "ga" | "beta" | "preview";
  sdkLanguages: string[];
  usageStats: { calls: number; latency: number; uptime: number };
}

interface PartnerApp {
  id: string;
  name: string;
  description: string;
  category: string;
  logo: string;
  installs: number;
  rating: number;
  verified: boolean;
  builtWith: string[];
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

const API_PRODUCTS: APIProduct[] = [
  {
    id: "api_trust",
    name: "Trust Score API",
    description: "Portable reputation credentials. Verify any Winners member's Trust Score, tier, skill attestations, and certificate history. Use for hiring, lending, or access control.",
    category: "identity",
    endpoints: 8,
    version: "v2.1",
    callsPerMonth: "10,000 free · then $0.002/call",
    priceTier: "pay-per-use",
    pricePerCall: 0.002,
    docsUrl: "/cloud/docs/trust-score-api",
    status: "ga",
    sdkLanguages: ["TypeScript", "Python", "Go", "Ruby"],
    usageStats: { calls: 284000, latency: 42, uptime: 99.98 },
  },
  {
    id: "api_intelligence",
    name: "Intelligence API",
    description: "Access all 9 supervisors via API. Send any prompt, receive structured responses from OMEGA, ATLAS, CIRCUIT, SAGE, and others. Full context injection supported.",
    category: "intelligence",
    endpoints: 14,
    version: "v1.4",
    callsPerMonth: "1,000 free · then $0.005/call",
    priceTier: "pay-per-use",
    pricePerCall: 0.005,
    docsUrl: "/cloud/docs/intelligence-api",
    status: "ga",
    sdkLanguages: ["TypeScript", "Python", "JavaScript"],
    usageStats: { calls: 1200000, latency: 180, uptime: 99.95 },
  },
  {
    id: "api_market",
    name: "Market Intelligence API",
    description: "Live product trend data, margin benchmarks, supplier signals, and pricing intelligence across African and diaspora e-commerce markets.",
    category: "market",
    endpoints: 12,
    version: "v1.0",
    callsPerMonth: "500 free · then $0.008/call",
    priceTier: "pay-per-use",
    pricePerCall: 0.008,
    docsUrl: "/cloud/docs/market-api",
    status: "beta",
    sdkLanguages: ["TypeScript", "Python"],
    usageStats: { calls: 42000, latency: 95, uptime: 99.8 },
  },
  {
    id: "api_jobs",
    name: "Work & Jobs API",
    description: "Access the Winners Work layer programmatically. Post contracts, query freelancer profiles, retrieve Trust-verified applicants, and trigger CIRCUIT matching.",
    category: "work",
    endpoints: 18,
    version: "v2.0",
    callsPerMonth: "2,000 free · then $0.003/call",
    priceTier: "pay-per-use",
    pricePerCall: 0.003,
    docsUrl: "/cloud/docs/work-api",
    status: "ga",
    sdkLanguages: ["TypeScript", "Python", "Go"],
    usageStats: { calls: 680000, latency: 68, uptime: 99.97 },
  },
  {
    id: "api_community",
    name: "Community Intelligence API",
    description: "Skill detection, audience analytics, collaboration graph, and creator intelligence. Powered by NOVA. Embed Winners community data into any product.",
    category: "community",
    endpoints: 10,
    version: "v1.2",
    callsPerMonth: "5,000 free · then $0.001/call",
    priceTier: "pay-per-use",
    pricePerCall: 0.001,
    docsUrl: "/cloud/docs/community-api",
    status: "beta",
    sdkLanguages: ["TypeScript", "JavaScript", "Python"],
    usageStats: { calls: 340000, latency: 55, uptime: 99.9 },
  },
  {
    id: "api_academy",
    name: "Academy & Certification API",
    description: "Verify certificates, query learning paths, access course content metadata, and integrate SAGE tutoring into external LMS platforms.",
    category: "academy",
    endpoints: 9,
    version: "v1.0",
    callsPerMonth: "1,000 free · then $0.002/call",
    priceTier: "pay-per-use",
    pricePerCall: 0.002,
    docsUrl: "/cloud/docs/academy-api",
    status: "preview",
    sdkLanguages: ["TypeScript", "Python"],
    usageStats: { calls: 28000, latency: 72, uptime: 99.85 },
  },
];

const PARTNER_APPS: PartnerApp[] = [
  {
    id: "app_1",
    name: "HireVerified",
    description: "Talent acquisition platform using Winners Trust Score to pre-screen candidates for African and diaspora hiring.",
    category: "HR & Recruitment",
    logo: "🏢",
    installs: 234,
    rating: 4.8,
    verified: true,
    builtWith: ["Trust Score API", "Work & Jobs API"],
  },
  {
    id: "app_2",
    name: "AfriLend",
    description: "Micro-lending platform that uses Trust Score as a credit signal for diaspora borrowers without traditional credit history.",
    category: "Fintech",
    logo: "💳",
    installs: 89,
    rating: 4.6,
    verified: true,
    builtWith: ["Trust Score API"],
  },
  {
    id: "app_3",
    name: "CreatorOS",
    description: "All-in-one content management platform powered by NOVA's skill detection and ATLAS market intelligence.",
    category: "Creator Tools",
    logo: "🎨",
    installs: 567,
    rating: 4.9,
    verified: false,
    builtWith: ["Community Intelligence API", "Market Intelligence API"],
  },
];

// ─── CSS ───────────────────────────────────────────────────────────────────────

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

.mkt-root {
  min-height: 100vh;
  background:
    radial-gradient(ellipse 60% 40% at 5% 0%, rgba(74,158,255,0.04) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 95% 100%, rgba(155,111,255,0.04) 0%, transparent 50%),
    var(--bg);
  font-family: 'Syne', sans-serif;
  color: var(--text);
  padding: 28px 32px;
}

.mkt-header { margin-bottom: 32px; }

.mkt-eyebrow {
  font-family: 'Space Mono', monospace;
  font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--blue); margin-bottom: 6px;
}

.mkt-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 36px; font-weight: 300; letter-spacing: -0.02em;
  margin: 0 0 6px;
}

.mkt-title em { font-style: italic; color: var(--blue); }

.mkt-subtitle {
  font-size: 14px; color: var(--text-dim); max-width: 600px;
}

.mkt-health-bar {
  display: flex; gap: 16px; flex-wrap: wrap;
  padding: 14px 20px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  margin-bottom: 28px;
}

.mkt-health-item {
  display: flex; flex-direction: column; gap: 2px;
}

.mkt-health-label {
  font-family: 'Space Mono', monospace;
  font-size: 8px; color: var(--text-dim);
  text-transform: uppercase; letter-spacing: 0.06em;
}

.mkt-health-value {
  font-size: 14px; font-weight: 700; color: var(--green);
}

.mkt-tabs {
  display: flex; gap: 4px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px; padding: 4px;
  margin-bottom: 24px; width: fit-content;
}

.mkt-tab {
  padding: 8px 16px; border-radius: 6px; border: none;
  background: none; cursor: pointer;
  font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 600;
  color: var(--text-dim); transition: all 0.2s;
}
.mkt-tab.active {
  background: var(--surface2); color: var(--text);
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
}
.mkt-tab:hover:not(.active) { color: var(--text); }

.api-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.api-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  display: flex; flex-direction: column;
  transition: border-color 0.2s, transform 0.2s;
}
.api-card:hover { border-color: var(--border-blue); transform: translateY(-2px); }

.api-card-header {
  padding: 18px 20px 12px;
  border-bottom: 1px solid var(--border);
}

.api-card-title-row {
  display: flex; align-items: flex-start;
  justify-content: space-between; gap: 10px;
  margin-bottom: 8px;
}

.api-card-name {
  font-size: 15px; font-weight: 700; margin: 0;
}

.api-status-badge {
  font-family: 'Space Mono', monospace;
  font-size: 8px; letter-spacing: 0.08em; text-transform: uppercase;
  padding: 3px 8px; border-radius: 20px; flex-shrink: 0;
}

.api-status-ga      { background: rgba(45,212,160,0.1);  color: var(--green);  border: 1px solid rgba(45,212,160,0.3); }
.api-status-beta    { background: rgba(240,180,41,0.1);   color: var(--gold);   border: 1px solid rgba(240,180,41,0.3); }
.api-status-preview { background: rgba(155,111,255,0.1);  color: var(--purple); border: 1px solid rgba(155,111,255,0.3); }

.api-card-desc {
  font-size: 12px; color: var(--text-dim); line-height: 1.6; margin: 0;
}

.api-card-stats {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 1px; background: var(--border);
}

.api-stat {
  background: var(--surface);
  padding: 10px 12px; text-align: center;
}

.api-stat-value {
  font-family: 'Space Mono', monospace;
  font-size: 13px; color: var(--text); display: block;
  margin-bottom: 2px;
}

.api-stat-label {
  font-family: 'Space Mono', monospace;
  font-size: 8px; color: var(--text-dim);
  text-transform: uppercase; letter-spacing: 0.05em;
}

.api-card-pricing {
  padding: 12px 20px;
  background: rgba(74,158,255,0.04);
  border-bottom: 1px solid var(--border);
  font-size: 11px; color: var(--text-dim);
}

.api-card-pricing strong { color: var(--text); }

.api-card-sdks {
  display: flex; gap: 6px; flex-wrap: wrap;
  padding: 10px 20px; flex: 1;
}

.sdk-chip {
  font-family: 'Space Mono', monospace;
  font-size: 9px; padding: 3px 7px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 20px; color: var(--text-dim);
}

.api-card-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border);
  display: flex; gap: 8px;
}

.btn-docs {
  flex: 1;
  padding: 9px 16px;
  background: var(--surface2);
  border: 1px solid var(--border); border-radius: 8px;
  color: var(--text);
  font-family: 'Syne', sans-serif; font-size: 11px;
  cursor: pointer; transition: border-color 0.2s;
  text-decoration: none; text-align: center;
}
.btn-docs:hover { border-color: var(--blue); color: var(--blue); }

.btn-get-key {
  flex: 1;
  padding: 9px 16px;
  background: var(--blue);
  border: none; border-radius: 8px;
  color: var(--bg);
  font-family: 'Syne', sans-serif; font-size: 11px; font-weight: 700;
  cursor: pointer; transition: opacity 0.2s;
  text-decoration: none; text-align: center;
}
.btn-get-key:hover { opacity: 0.88; }

.partner-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.partner-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 20px;
  transition: border-color 0.2s, transform 0.2s;
}
.partner-card:hover { border-color: var(--border-gold); transform: translateY(-2px); }

.partner-card-top {
  display: flex; gap: 14px; align-items: flex-start; margin-bottom: 12px;
}

.partner-logo {
  width: 44px; height: 44px; border-radius: 10px;
  background: var(--surface2); border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; flex-shrink: 0;
}

.partner-name { font-size: 15px; font-weight: 700; margin: 0 0 3px; }

.partner-category {
  font-family: 'Space Mono', monospace;
  font-size: 9px; color: var(--text-dim); text-transform: uppercase;
}

.partner-desc { font-size: 12px; color: var(--text-dim); line-height: 1.6; margin-bottom: 12px; }

.partner-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }

.partner-tag {
  font-family: 'Space Mono', monospace; font-size: 9px;
  padding: 3px 7px; background: var(--surface2);
  border: 1px solid var(--border); border-radius: 20px;
  color: var(--blue);
}

.partner-meta {
  display: flex; gap: 16px; align-items: center;
  font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim);
}

.verified-badge {
  display: flex; align-items: center; gap: 4px;
  color: var(--green); font-size: 9px;
  font-family: 'Space Mono', monospace; text-transform: uppercase;
}

.cta-section {
  margin-top: 36px;
  padding: 32px;
  background: linear-gradient(135deg,
    rgba(74,158,255,0.06) 0%,
    rgba(155,111,255,0.06) 100%
  );
  border: 1px solid var(--border-blue);
  border-radius: 16px;
  text-align: center;
}

.cta-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 28px; font-weight: 300;
  margin: 0 0 8px;
}

.cta-sub { font-size: 13px; color: var(--text-dim); margin-bottom: 20px; }

.cta-buttons { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; }

.btn-cta-primary {
  padding: 12px 28px;
  background: var(--blue);
  border: none; border-radius: 8px;
  color: var(--bg);
  font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: opacity 0.2s;
  text-decoration: none; display: inline-block;
}
.btn-cta-primary:hover { opacity: 0.88; }

.btn-cta-ghost {
  padding: 12px 28px;
  background: none;
  border: 1px solid var(--border); border-radius: 8px;
  color: var(--text);
  font-family: 'Syne', sans-serif; font-size: 13px;
  cursor: pointer; transition: border-color 0.2s;
  text-decoration: none; display: inline-block;
}
.btn-cta-ghost:hover { border-color: var(--blue); color: var(--blue); }

@media (max-width: 768px) {
  .mkt-root { padding: 20px 16px; }
  .mkt-title { font-size: 28px; }
  .api-grid, .partner-grid { grid-template-columns: 1fr; }
}
`;

// ─── Sub-components ────────────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  intelligence: "var(--purple)",
  community:    "var(--ice)",
  work:         "var(--blue)",
  market:       "var(--gold)",
  academy:      "var(--green)",
  identity:     "var(--red)",
};

function APICard({ api }: { api: APIProduct }) {
  return (
    <div className="api-card">
      <div className="api-card-header">
        <div className="api-card-title-row">
          <h3
            className="api-card-name"
            style={{ color: CATEGORY_COLORS[api.category] }}
          >
            {api.name}
          </h3>
          <span className={`api-status-badge api-status-${api.status}`}>
            {api.status === "ga" ? "GA" : api.status}
          </span>
        </div>
        <p className="api-card-desc">{api.description}</p>
      </div>

      <div className="api-card-stats">
        <div className="api-stat">
          <span className="api-stat-value">{api.endpoints}</span>
          <span className="api-stat-label">Endpoints</span>
        </div>
        <div className="api-stat">
          <span className="api-stat-value">{api.usageStats.latency}ms</span>
          <span className="api-stat-label">P50 Latency</span>
        </div>
        <div className="api-stat">
          <span className="api-stat-value">{api.usageStats.uptime}%</span>
          <span className="api-stat-label">Uptime</span>
        </div>
      </div>

      <div className="api-card-pricing">
        <strong>{api.version}</strong> · {api.callsPerMonth}
      </div>

      <div className="api-card-sdks">
        {api.sdkLanguages.map((lang) => (
          <span key={lang} className="sdk-chip">{lang}</span>
        ))}
      </div>

      <div className="api-card-footer">
        <Link to={api.docsUrl} className="btn-docs">View Docs</Link>
        <Link to="/cloud/keys" className="btn-get-key">Get API Key</Link>
      </div>
    </div>
  );
}

function PartnerCard({ app }: { app: PartnerApp }) {
  return (
    <div className="partner-card">
      <div className="partner-card-top">
        <div className="partner-logo">{app.logo}</div>
        <div>
          <p className="partner-name">{app.name}</p>
          <p className="partner-category">{app.category}</p>
        </div>
      </div>
      <p className="partner-desc">{app.description}</p>
      <div className="partner-tags">
        {app.builtWith.map((api) => (
          <span key={api} className="partner-tag">{api}</span>
        ))}
      </div>
      <div className="partner-meta">
        <span>{app.installs} installs</span>
        <span>★ {app.rating}</span>
        {app.verified && (
          <span className="verified-badge">✓ Verified</span>
        )}
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

type Tab = "apis" | "partners" | "docs";

const totalCalls = API_PRODUCTS.reduce((s, a) => s + a.usageStats.calls, 0);

export default function APIMarketplacePage() {
  const [tab, setTab] = useState<Tab>("apis");
  const user = useAuthStore((s) => s.user);

  return (
    <div className="mkt-root">
      <style>{css}</style>

      <ContextBar />

      <div className="mkt-header">
        <p className="mkt-eyebrow">Level XI · Sovereign Infrastructure</p>
        <h1 className="mkt-title">
          Winners as a <em>Platform</em>
        </h1>
        <p className="mkt-subtitle">
          Build on the Winners ecosystem. Access Trust Scores, Intelligence, Work matching,
          and Market data via API — and bring your product into the most powerful
          African digital infrastructure layer ever built.
        </p>
      </div>

      {/* Platform health */}
      <div className="mkt-health-bar">
        <div className="mkt-health-item">
          <span className="mkt-health-label">API Status</span>
          <span className="mkt-health-value">● All Systems Go</span>
        </div>
        <div className="mkt-health-item">
          <span className="mkt-health-label">Total API Products</span>
          <span className="mkt-health-value">{API_PRODUCTS.length}</span>
        </div>
        <div className="mkt-health-item">
          <span className="mkt-health-label">Total API Calls</span>
          <span className="mkt-health-value">{(totalCalls / 1_000_000).toFixed(1)}M</span>
        </div>
        <div className="mkt-health-item">
          <span className="mkt-health-label">Partner Apps</span>
          <span className="mkt-health-value">{PARTNER_APPS.length}</span>
        </div>
        <div className="mkt-health-item">
          <span className="mkt-health-label">Avg Uptime</span>
          <span className="mkt-health-value">99.95%</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="mkt-tabs">
        {(["apis", "partners", "docs"] as Tab[]).map((t) => (
          <button
            key={t}
            className={`mkt-tab${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "apis" && "🔌 API Products"}
            {t === "partners" && "🤝 Partner Apps"}
            {t === "docs" && "📖 Documentation"}
          </button>
        ))}
      </div>

      {/* API Products */}
      {tab === "apis" && (
        <div className="api-grid">
          {API_PRODUCTS.map((api) => (
            <APICard key={api.id} api={api} />
          ))}
        </div>
      )}

      {/* Partner Apps */}
      {tab === "partners" && (
        <>
          <div className="partner-grid">
            {PARTNER_APPS.map((app) => (
              <PartnerCard key={app.id} app={app} />
            ))}
          </div>
          <div style={{ marginTop: 24, padding: "16px 20px", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 10 }}>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-dim)" }}>
              Building on Winners?{" "}
              <Link to="/cloud/keys" style={{ color: "var(--blue)", textDecoration: "none" }}>
                Get your API key
              </Link>{" "}
              and{" "}
              <a href="mailto:developers@winners-ecosystem.com" style={{ color: "var(--gold)", textDecoration: "none" }}>
                apply to be listed
              </a>
              .
            </p>
          </div>
        </>
      )}

      {/* Documentation overview */}
      {tab === "docs" && (
        <div style={{ maxWidth: 720 }}>
          {[
            { title: "Authentication", desc: "API keys, OAuth 2.0 flows, and JWT handling for all endpoints.", href: "/cloud/docs/auth", icon: "🔐" },
            { title: "Rate Limits & Quotas", desc: "Request limits by tier, burst allowances, and how to monitor usage.", href: "/cloud/docs/limits", icon: "⚡" },
            { title: "Webhooks Guide", desc: "Subscribe to real-time events from any layer. Trust changes, job matches, loop milestones.", href: "/cloud/webhooks", icon: "🔔" },
            { title: "SDK Quick Start", desc: "Get running in under 5 minutes with TypeScript, Python, or Go.", href: "/cloud/docs/sdk", icon: "🚀" },
            { title: "Error Codes Reference", desc: "Complete list of error codes, causes, and resolution steps.", href: "/cloud/docs/errors", icon: "🔧" },
            { title: "Trust Score Integration Guide", desc: "How to read, display, and act on Winners Trust Scores in your product.", href: "/cloud/docs/trust-score-api", icon: "🏆" },
          ].map((doc) => (
            <Link
              key={doc.title}
              to={doc.href}
              style={{ textDecoration: "none" }}
            >
              <div
                style={{
                  display: "flex", gap: 14, alignItems: "flex-start",
                  padding: "14px 18px", marginBottom: 8,
                  background: "var(--surface)",
                  border: "1px solid var(--border)", borderRadius: 10,
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--blue)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)"; }}
              >
                <span style={{ fontSize: 22, flexShrink: 0 }}>{doc.icon}</span>
                <div>
                  <p style={{ margin: "0 0 3px", fontWeight: 700, color: "var(--text)", fontSize: 14 }}>{doc.title}</p>
                  <p style={{ margin: 0, fontSize: 12, color: "var(--text-dim)" }}>{doc.desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* CTA */}
      <div className="cta-section">
        <h2 className="cta-title">Ready to build on Winners?</h2>
        <p className="cta-sub">
          10,000 free API calls per month. No credit card required to start.
        </p>
        <div className="cta-buttons">
          <Link to="/cloud/keys" className="btn-cta-primary">Get API Key Free</Link>
          <Link to="/cloud" className="btn-cta-ghost">View Developer Console</Link>
        </div>
      </div>

      <AssistantPanel
        assistant="nexus"
        page="api-marketplace"
        userId={user?.id}
        initialMessage="Show me how to integrate the Trust Score API"
      />
    </div>
  );
}
