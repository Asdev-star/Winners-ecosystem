// Phase 8 — Winners Cloud — CloudConnectorsPage.tsx
// NEXUS Supervisor · Connector Marketplace
// 50+ connectors — M-Pesa, Flutterwave, Shopify, WhatsApp, HubSpot, Stripe and more

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../auth/authStore";
import AssistantPanel from "../../components/ui/AssistantPanel";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

interface Connector {
  id: string;
  name: string;
  slug: string;
  description: string;
  logoUrl: string;
  category: string;
  authType: string;
  tier: string;
  price: number;
  installCount: number;
  rating: number;
  reviewCount: number;
  verified: boolean;
}

interface ConnectorInstall {
  id: string;
  connectorId: string;
  active: boolean;
  connector: Connector;
}

const CATALOG_CONNECTORS: Connector[] = [
  { id: "mpesa",       name: "M-Pesa",            slug: "mpesa",       description: "Kenya's leading mobile money — payments, STK Push, C2B, B2C", logoUrl: "", category: "Payments", authType: "oauth2", tier: "community", price: 0, installCount: 1240, rating: 4.9, reviewCount: 89, verified: true },
  { id: "flutterwave", name: "Flutterwave",        slug: "flutterwave", description: "Pan-African payment gateway — cards, mobile money, bank transfers", logoUrl: "", category: "Payments", authType: "api_key", tier: "community", price: 0, installCount: 980, rating: 4.8, reviewCount: 67, verified: true },
  { id: "stripe",      name: "Stripe",             slug: "stripe",      description: "Global payments — cards, subscriptions, Stripe Connect payouts", logoUrl: "", category: "Payments", authType: "api_key", tier: "community", price: 0, installCount: 2100, rating: 5.0, reviewCount: 145, verified: true },
  { id: "paystack",    name: "Paystack",           slug: "paystack",    description: "Nigeria's most trusted payment gateway — cards, USSD, bank transfers", logoUrl: "", category: "Payments", authType: "api_key", tier: "community", price: 0, installCount: 720, rating: 4.7, reviewCount: 54, verified: true },
  { id: "mtnmomo",     name: "MTN MoMo",           slug: "mtnmomo",     description: "MTN Mobile Money — 17 African countries, instant transfers", logoUrl: "", category: "Payments", authType: "oauth2", tier: "community", price: 0, installCount: 450, rating: 4.6, reviewCount: 38, verified: true },
  { id: "whatsapp",    name: "WhatsApp Business",  slug: "whatsapp",    description: "WhatsApp Business API — messages, templates, chatbots, media", logoUrl: "", category: "Communication", authType: "api_key", tier: "community", price: 0, installCount: 1800, rating: 4.8, reviewCount: 112, verified: true },
  { id: "twilio",      name: "Twilio SMS",         slug: "twilio",      description: "SMS, voice, and messaging — global reach including Africa", logoUrl: "", category: "Communication", authType: "api_key", tier: "community", price: 0, installCount: 890, rating: 4.7, reviewCount: 73, verified: true },
  { id: "shopify",     name: "Shopify",            slug: "shopify",     description: "E-commerce platform — orders, products, inventory, customers", logoUrl: "", category: "E-Commerce", authType: "oauth2", tier: "community", price: 0, installCount: 1350, rating: 4.9, reviewCount: 98, verified: true },
  { id: "hubspot",     name: "HubSpot CRM",        slug: "hubspot",     description: "CRM — contacts, deals, pipelines, marketing automation", logoUrl: "", category: "CRM", authType: "oauth2", tier: "community", price: 0, installCount: 760, rating: 4.8, reviewCount: 61, verified: true },
  { id: "anthropic",   name: "Anthropic Claude",   slug: "anthropic",   description: "Claude AI — text generation, analysis, code, multimodal", logoUrl: "", category: "AI & Data", authType: "api_key", tier: "community", price: 0, installCount: 2300, rating: 5.0, reviewCount: 189, verified: true },
  { id: "openai",      name: "OpenAI GPT-4o",      slug: "openai",      description: "GPT-4o — text, vision, audio, function calling, embeddings", logoUrl: "", category: "AI & Data", authType: "api_key", tier: "community", price: 0, installCount: 2050, rating: 4.9, reviewCount: 167, verified: true },
  { id: "googleworkspace", name: "Google Workspace", slug: "googleworkspace", description: "Gmail, Calendar, Drive, Sheets, Docs automation", logoUrl: "", category: "CRM", authType: "oauth2", tier: "community", price: 0, installCount: 1120, rating: 4.7, reviewCount: 84, verified: true },
  { id: "slack",       name: "Slack",              slug: "slack",       description: "Team messaging — send messages, create channels, manage users", logoUrl: "", category: "Communication", authType: "oauth2", tier: "community", price: 0, installCount: 940, rating: 4.8, reviewCount: 76, verified: true },
  { id: "notion",      name: "Notion",             slug: "notion",      description: "Workspace — create pages, databases, manage blocks", logoUrl: "", category: "CRM", authType: "oauth2", tier: "community", price: 0, installCount: 630, rating: 4.6, reviewCount: 45, verified: true },
  { id: "airtable",    name: "Airtable",           slug: "airtable",    description: "Database — create/update records, trigger on changes", logoUrl: "", category: "CRM", authType: "api_key", tier: "community", price: 0, installCount: 580, rating: 4.7, reviewCount: 42, verified: true },
  { id: "zoom",        name: "Zoom",               slug: "zoom",        description: "Video meetings — create meetings, manage webinars, cloud recordings", logoUrl: "", category: "Learning", authType: "oauth2", tier: "community", price: 0, installCount: 420, rating: 4.5, reviewCount: 34, verified: true },
  { id: "calendly",    name: "Calendly",           slug: "calendly",    description: "Scheduling — booking links, event creation, availability management", logoUrl: "", category: "Learning", authType: "oauth2", tier: "community", price: 0, installCount: 380, rating: 4.6, reviewCount: 29, verified: true },
  { id: "pinecone",    name: "Pinecone",           slug: "pinecone",    description: "Vector database — upsert, query, semantic search for AI apps", logoUrl: "", category: "AI & Data", authType: "api_key", tier: "pro", price: 0, installCount: 290, rating: 4.8, reviewCount: 22, verified: true },
];

const CATEGORIES = ["All", "Payments", "Communication", "E-Commerce", "CRM", "AI & Data", "Learning"];

const CATEGORY_ICONS: Record<string, string> = {
  Payments: "💳",
  Communication: "📣",
  "E-Commerce": "🛒",
  CRM: "🏢",
  "AI & Data": "🧠",
  Learning: "🎓",
};

export default function CloudConnectorsPage() {
  const token = useAuthStore((s) => s.token);
  const [connectors, setConnectors]   = useState<Connector[]>(CATALOG_CONNECTORS);
  const [installed, setInstalled]     = useState<ConnectorInstall[]>([]);
  const [category, setCategory]       = useState("All");
  const [search, setSearch]           = useState("");
  const [installing, setInstalling]   = useState<string | null>(null);
  const [activeTab, setActiveTab]     = useState<"browse" | "installed">("browse");
  const [loading, setLoading]         = useState(false);

  const fetchInstalled = useCallback(async () => {
    try {
      const res = await fetch(`${API}/cloud/connectors/installed`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInstalled(data.installs || []);
      }
    } catch {
      // non-blocking
    }
  }, [token]);

  useEffect(() => {
    fetchInstalled();
  }, [fetchInstalled]);

  const handleInstall = async (connectorId: string) => {
    setInstalling(connectorId);
    try {
      const res = await fetch(`${API}/cloud/connectors/${connectorId}/install`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) await fetchInstalled();
    } catch {
      // non-blocking
    } finally {
      setInstalling(null);
    }
  };

  const handleUninstall = async (installId: string) => {
    try {
      await fetch(`${API}/cloud/connectors/installed/${installId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchInstalled();
    } catch {
      // non-blocking
    }
  };

  const installedIds = new Set(installed.map((i) => i.connectorId));

  const filtered = connectors.filter((c) => {
    const matchCat  = category === "All" || c.category === category;
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{ padding: "32px 28px", maxWidth: 1200, margin: "0 auto" }}>
      <style>{`
        .conn-ctx-bar { display:flex; gap:8px; marginBottom:22px; flexWrap:wrap; }
        .ctx-badge { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:0.08em; padding:4px 10px; border-radius:3px; border:1px solid; transition:all 200ms ease; }
        .ctx-badge.live    { background:rgba(45,212,160,0.08);  border-color:rgba(45,212,160,0.3);  color:var(--green); }
        .ctx-badge.active  { background:rgba(155,111,255,0.15); border-color:var(--purple);         color:var(--purple); }
        .ctx-badge.building{ background:rgba(201,168,76,0.08);  border-color:rgba(201,168,76,0.25); color:var(--gold); }
        .ctx-sep { color:var(--border); font-size:11px; display:flex; align-items:center; }

        .conn-tabs { display:flex; gap:0; border-bottom:1px solid var(--border); margin-bottom:24px; }
        .conn-tab { font-family:'Space Mono',monospace; font-size:10px; text-transform:uppercase; letter-spacing:0.08em; padding:10px 20px; cursor:pointer; background:transparent; border:none; color:var(--text-dim); border-bottom:2px solid transparent; transition:all 200ms ease; }
        .conn-tab.active { color:var(--purple); border-bottom-color:var(--purple); }

        .conn-filters { display:flex; gap:12px; margin-bottom:24px; flex-wrap:wrap; align-items:center; }
        .conn-search { flex:1; min-width:200px; background:var(--surface2); border:1px solid var(--border); border-radius:4px; padding:10px 14px; font-family:'Syne',sans-serif; font-size:13px; color:var(--text); outline:none; }
        .conn-search:focus { border-color:var(--purple); }
        .conn-search::placeholder { color:var(--text-dim); }
        .conn-cat-btn { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.08em; padding:8px 14px; border-radius:4px; border:1px solid var(--border); background:transparent; color:var(--text-dim); cursor:pointer; transition:all 200ms ease; white-space:nowrap; }
        .conn-cat-btn.active { background:rgba(155,111,255,0.12); border-color:rgba(155,111,255,0.4); color:var(--purple); }

        .conn-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:16px; margin-bottom:32px; }
        .conn-card { background:var(--surface); border:1px solid var(--border); border-radius:6px; padding:20px; position:relative; overflow:hidden; transition:border-color 200ms ease; }
        .conn-card::before { content:""; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,var(--purple),transparent); }
        .conn-card:hover { border-color:rgba(155,111,255,0.4); }
        .conn-card-header { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:10px; }
        .conn-logo { width:40px; height:40px; border-radius:8px; background:var(--surface2); border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
        .conn-card-meta { display:flex; flex-direction:column; gap:4px; align-items:flex-end; }
        .conn-verified { font-family:'Space Mono',monospace; font-size:8px; text-transform:uppercase; letter-spacing:0.1em; padding:2px 7px; border-radius:3px; background:rgba(45,212,160,0.1); border:1px solid rgba(45,212,160,0.3); color:var(--green); }
        .conn-tier { font-family:'Space Mono',monospace; font-size:8px; text-transform:uppercase; letter-spacing:0.1em; padding:2px 7px; border-radius:3px; background:rgba(155,111,255,0.1); border:1px solid rgba(155,111,255,0.25); color:var(--purple); }
        .conn-name { font-family:'Syne',sans-serif; font-size:14px; font-weight:700; color:var(--text); margin-bottom:6px; }
        .conn-desc { font-family:'Syne',sans-serif; font-size:12px; color:var(--text-dim); line-height:1.5; margin-bottom:14px; }
        .conn-stats { display:flex; gap:12px; margin-bottom:14px; }
        .conn-stat { font-family:'Space Mono',monospace; font-size:9px; color:var(--text-dim); }
        .conn-stat span { color:var(--text); }
        .conn-footer { display:flex; justify-content:space-between; align-items:center; }
        .conn-category { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-dim); }
        .conn-install-btn { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.08em; padding:7px 14px; border-radius:4px; border:none; cursor:pointer; transition:all 200ms ease; }
        .conn-install-btn.install { background:var(--purple); color:#fff; }
        .conn-install-btn.install:hover { opacity:0.85; }
        .conn-install-btn.installed { background:rgba(45,212,160,0.1); border:1px solid rgba(45,212,160,0.3); color:var(--green); cursor:default; }
        .conn-install-btn.loading { background:var(--surface2); color:var(--text-dim); cursor:default; }

        .conn-empty { text-align:center; padding:60px 20px; }
        .conn-empty-icon { font-size:40px; margin-bottom:12px; }
        .conn-empty-text { font-family:'Syne',sans-serif; font-size:14px; color:var(--text-dim); }

        .inst-card { background:var(--surface); border:1px solid var(--border); border-radius:6px; padding:16px 20px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .inst-card::before { content:none; }
        .inst-info { display:flex; align-items:center; gap:12px; }
        .inst-icon { font-size:20px; width:36px; height:36px; background:var(--surface2); border-radius:6px; display:flex; align-items:center; justify-content:center; border:1px solid var(--border); flex-shrink:0; }
        .inst-name { font-family:'Syne',sans-serif; font-size:14px; font-weight:600; color:var(--text); }
        .inst-cat  { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; color:var(--text-dim); margin-top:2px; }
        .inst-actions { display:flex; gap:8px; align-items:center; }
        .inst-status { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.08em; padding:4px 10px; border-radius:3px; background:rgba(45,212,160,0.1); border:1px solid rgba(45,212,160,0.3); color:var(--green); }
        .inst-remove-btn { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.08em; padding:6px 12px; border-radius:3px; background:transparent; border:1px solid rgba(224,90,78,0.3); color:var(--red); cursor:pointer; transition:all 200ms ease; }
        .inst-remove-btn:hover { background:rgba(224,90,78,0.1); }

        .conn-count { font-family:'Space Mono',monospace; font-size:9px; color:var(--text-dim); margin-bottom:16px; }

        @media(max-width:768px) {
          .conn-grid { grid-template-columns:1fr; }
          .conn-filters { flex-direction:column; }
        }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: "var(--text)", margin: 0 }}>
          ☁️ Connector <span style={{ color: "var(--purple)", fontStyle: "italic" }}>Marketplace</span>
        </h1>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>
          50+ integrations · Africa-first · M-Pesa · Flutterwave · WhatsApp native
        </div>
      </div>

      {/* Context Bar */}
      <div className="conn-ctx-bar" style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
        <span className="ctx-badge live">⬡ Core Engine</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge active">☁️ Cloud</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge active">🔌 Connectors</span>
      </div>

      {/* Tabs */}
      <div className="conn-tabs">
        <button className={`conn-tab ${activeTab === "browse" ? "active" : ""}`} onClick={() => setActiveTab("browse")}>
          Browse ({CATALOG_CONNECTORS.length})
        </button>
        <button className={`conn-tab ${activeTab === "installed" ? "active" : ""}`} onClick={() => setActiveTab("installed")}>
          Installed ({installed.length})
        </button>
      </div>

      {activeTab === "browse" && (
        <>
          {/* Filters */}
          <div className="conn-filters">
            <input
              className="conn-search"
              placeholder="Search connectors…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={`conn-cat-btn ${category === cat ? "active" : ""}`}
                onClick={() => setCategory(cat)}
              >
                {CATEGORY_ICONS[cat] ? `${CATEGORY_ICONS[cat]} ` : ""}{cat}
              </button>
            ))}
          </div>

          <div className="conn-count">{filtered.length} connectors</div>

          <div className="conn-grid">
            {filtered.map((c) => {
              const isInstalled  = installedIds.has(c.id);
              const isInstalling = installing === c.id;
              const installEntry = installed.find((i) => i.connectorId === c.id);
              return (
                <div key={c.id} className="conn-card">
                  <div className="conn-card-header">
                    <div className="conn-logo">{CATEGORY_ICONS[c.category] ?? "🔌"}</div>
                    <div className="conn-card-meta">
                      {c.verified && <span className="conn-verified">✓ Verified</span>}
                      <span className="conn-tier">{c.tier}</span>
                    </div>
                  </div>
                  <div className="conn-name">{c.name}</div>
                  <div className="conn-desc">{c.description}</div>
                  <div className="conn-stats">
                    <div className="conn-stat">Installs: <span>{c.installCount.toLocaleString()}</span></div>
                    <div className="conn-stat">Rating: <span>⭐ {c.rating}</span></div>
                    <div className="conn-stat">Auth: <span>{c.authType}</span></div>
                  </div>
                  <div className="conn-footer">
                    <span className="conn-category">{CATEGORY_ICONS[c.category]} {c.category}</span>
                    {isInstalled ? (
                      <button className="conn-install-btn installed">✓ Installed</button>
                    ) : (
                      <button
                        className={`conn-install-btn ${isInstalling ? "loading" : "install"}`}
                        onClick={() => !isInstalling && handleInstall(c.id)}
                        disabled={isInstalling}
                      >
                        {isInstalling ? "Installing…" : "Install"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="conn-empty">
              <div className="conn-empty-icon">🔌</div>
              <div className="conn-empty-text">No connectors found for "{search}"</div>
            </div>
          )}
        </>
      )}

      {activeTab === "installed" && (
        <>
          {installed.length === 0 ? (
            <div className="conn-empty">
              <div className="conn-empty-icon">🔌</div>
              <div className="conn-empty-text">No connectors installed yet. Browse the marketplace to get started.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {installed.map((inst) => (
                <div key={inst.id} className="inst-card">
                  <div className="inst-info">
                    <div className="inst-icon">{CATEGORY_ICONS[inst.connector?.category] ?? "🔌"}</div>
                    <div>
                      <div className="inst-name">{inst.connector?.name ?? "Unknown"}</div>
                      <div className="inst-cat">{inst.connector?.category ?? ""}</div>
                    </div>
                  </div>
                  <div className="inst-actions">
                    <span className="inst-status">● Active</span>
                    <button className="inst-remove-btn" onClick={() => handleUninstall(inst.id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <AssistantPanel
        assistant="nexus"
        context="Winners Cloud connector marketplace. Help developer understand which connectors to use for African payments (M-Pesa, Flutterwave, MTN MoMo), communication (WhatsApp Business), CRM, e-commerce (Shopify), and AI integrations. Explain authentication types and installation process."
      />
    </div>
  );
}
