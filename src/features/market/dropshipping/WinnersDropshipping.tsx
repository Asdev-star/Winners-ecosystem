import { useState, useEffect } from "react";
import { useAuthStore } from "../../auth/authStore";
import AssistantPanel from "../../../components/ai/AssistantPanel";

type DropshippingStore = {
  id: string;
  name: string;
  supplier: string;
  niche: string;
  monthlyRevenue: number;
  profitMargin: number;
  status: "active" | "inactive";
};

type Tab =
  | "overview"
  | "suppliers"
  | "niches"
  | "calculator"
  | "ai"
  | "blueprint";

export default function DropshippingPage() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [stores, setStores] = useState<DropshippingStore[]>([]);
  const [hasStore, setHasStore] = useState(false);
  const [selectedModel, setSelectedModel] = useState<
    "pod" | "general" | "premium"
  >("pod");
  const { user, token } = useAuthStore();

  const style = `
    :root {
      --gold:#C9A84C;--bg:#0D1520;--surface:#111D2E;
      --surface2:#172335;--border:#1E3248;--text:#E8EEF5;
      --text-dim:#5A7A96;--green:#2DD4A0;--red:#E05A4E;
    }
    .drop-page { min-height:100vh; background:var(--bg); color:var(--text); font-family:'Syne',sans-serif; }
    .drop-hero { padding:64px 32px 48px; text-align:center; position:relative; overflow:hidden; }
    .drop-hero::before { content:''; position:absolute; inset:0;
      background:radial-gradient(ellipse 80% 60% at 50% 0%, rgba(201,168,76,.08), transparent); }
    .drop-hero h1 { font-size:clamp(32px,5vw,56px); font-weight:800; letter-spacing:-.02em;
      margin:0 0 16px; background:linear-gradient(135deg,var(--text),var(--gold));
      -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
    .drop-hero p  { font-size:18px; color:var(--text-dim); max-width:560px; margin:0 auto 32px; }
    .drop-badges { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin-bottom:32px; }
    .drop-badge  { padding:5px 14px; border-radius:999px; font-size:11px; font-weight:700;
      font-family:'Space Mono',monospace; text-transform:uppercase; letter-spacing:.08em;
      background:rgba(201,168,76,.1); border:1px solid rgba(201,168,76,.25); color:var(--gold); }
    .cta-btn { background:var(--gold); color:#0D1520; padding:14px 32px; border-radius:6px;
      font-family:'Syne',sans-serif; font-size:15px; font-weight:800; border:none; cursor:pointer;
      transition:transform .15s,box-shadow .15s; }
    .cta-btn:hover { transform:translateY(-2px); box-shadow:0 8px 24px rgba(201,168,76,.25); }

    .drop-tabs  { display:flex; gap:2px; padding:0 32px; border-bottom:1px solid var(--border); }
    .drop-tab   { padding:12px 20px; background:none; border:none; color:var(--text-dim);
      cursor:pointer; font-size:13px; font-weight:600; border-bottom:2px solid transparent;
      transition:all .15s; }
    .drop-tab.active   { color:var(--gold); border-bottom-color:var(--gold); }
    .drop-tab.highlight{ color:var(--green); }
    .drop-tab.highlight.active { border-bottom-color:var(--green); }

    .drop-content { padding:32px; max-width:1200px; margin:0 auto; }

    /* Metrics row */
    .metrics-row { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; margin-bottom:48px; }
    .metric-card { background:var(--surface); border:1px solid var(--border); border-radius:6px;
      padding:24px; text-align:center; position:relative; overflow:hidden; }
    .metric-card::before { content:''; position:absolute; top:0;left:0;right:0;height:2px;
      background:linear-gradient(90deg,var(--gold),transparent); }
    .metric-value { font-size:32px; font-weight:800; color:var(--gold); margin-bottom:4px; }
    .metric-label { font-size:12px; color:var(--text-dim); }

    /* Model cards */
    .models-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:20px; }
    .model-card  { background:var(--surface); border:1px solid var(--border); border-radius:8px;
      padding:24px; cursor:pointer; transition:border-color .15s; }
    .model-card.selected  { border-color:var(--gold); }
    .model-card:hover     { border-color:rgba(201,168,76,.5); }
    .model-icon  { font-size:32px; margin-bottom:12px; }
    .model-name  { font-size:16px; font-weight:800; margin-bottom:4px; }
    .model-via   { font-size:11px; color:var(--text-dim); margin-bottom:12px; font-family:'Space Mono',monospace; }
    .model-best  { font-size:11px; color:var(--gold); margin-bottom:12px; font-weight:700; text-transform:uppercase; }
    .model-pros  li { color:var(--green); font-size:13px; list-style:none; padding:3px 0; }
    .model-pros  li::before { content:'✓ '; }
    .model-cons  li { color:var(--text-dim); font-size:13px; list-style:none; padding:3px 0; }
    .model-cons  li::before { content:'✗ '; }
    .model-margin { margin-top:16px; padding:10px 16px; border-radius:4px;
      background:rgba(201,168,76,.08); border:1px solid rgba(201,168,76,.2);
      font-family:'Space Mono',monospace; font-size:12px; color:var(--gold); font-weight:700; }

    /* How it works */
    .flow-steps { display:flex; gap:0; overflow-x:auto; padding-bottom:16px; }
    .flow-step  { flex-shrink:0; width:180px; text-align:center; position:relative; }
    .flow-step:not(:last-child)::after { content:'→'; position:absolute; right:-14px; top:20px;
      color:var(--gold); font-size:20px; }
    .flow-num   { width:40px; height:40px; border-radius:50%; background:rgba(201,168,76,.1);
      border:2px solid var(--gold); display:flex; align-items:center; justify-content:center;
      font-family:'Space Mono',monospace; font-size:13px; font-weight:700; color:var(--gold);
      margin:0 auto 12px; }
    .flow-icon  { font-size:28px; margin-bottom:8px; }
    .flow-title { font-size:13px; font-weight:700; margin-bottom:4px; }
    .flow-desc  { font-size:11px; color:var(--text-dim); line-height:1.5; }

    /* Supplier cards */
    .suppliers-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(320px,1fr)); gap:20px; }
    .supplier-card  { background:var(--surface); border:1px solid var(--border); border-radius:8px; padding:24px; }
    .supplier-card.recommended { border-color:var(--green); }
    .supplier-header { display:flex; align-items:center; gap:12px; margin-bottom:16px; }
    .supplier-emoji  { font-size:32px; }
    .supplier-type   { font-size:10px; font-family:'Space Mono',monospace; color:var(--text-dim);
      text-transform:uppercase; letter-spacing:.1em; }
    .supplier-tag    { font-size:9px; font-weight:700; padding:2px 8px; border-radius:999px;
      background:rgba(45,212,160,.1); color:var(--green); border:1px solid rgba(45,212,160,.2); }
    .supplier-stats  { display:grid; grid-template-columns:1fr 1fr; gap:8px; margin:12px 0; }
    .stat-item  { font-size:11px; }
    .stat-label { color:var(--text-dim); margin-bottom:2px; }
    .stat-val   { color:var(--text); font-weight:600; }
    .connect-btn { width:100%; padding:10px; border-radius:4px; border:1px solid var(--gold);
      background:transparent; color:var(--gold); font-family:'Space Mono',monospace; font-size:11px;
      text-transform:uppercase; letter-spacing:.08em; cursor:pointer; transition:all .15s; }
    .connect-btn:hover { background:rgba(201,168,76,.1); }
    .connect-btn.connected { background:rgba(45,212,160,.1); border-color:var(--green);
      color:var(--green); cursor:default; }
  `;

  return (
    <div className="drop-page">
      <style>{style}</style>

      {/* HERO */}
      <div className="drop-hero">
        <h1>
          Sell without stock.
          <br />
          Profit without limits.
        </h1>
        <p>
          The Winners dropshipping engine. 6 suppliers. AI product research.
          Automated fulfillment. African market ready.
        </p>
        <div className="drop-badges">
          {[
            "$0 to Start",
            "6 Supplier Integrations",
            "Zero Inventory Risk",
            "AI Product Research",
            "Auto-Fulfillment",
            "African Market Ready",
          ].map((b) => (
            <span key={b} className="drop-badge">
              {b}
            </span>
          ))}
        </div>
        <button className="cta-btn" onClick={() => setActiveTab("ai")}>
          Start with ATLAS AI →
        </button>
      </div>

      {/* TABS */}
      <div className="drop-tabs">
        {[
          { id: "overview", label: "Overview" },
          { id: "suppliers", label: "Suppliers" },
          { id: "niches", label: "Niches" },
          { id: "calculator", label: "Calculator" },
          { id: "ai", label: "🤖 AI Tools", highlight: true },
          { id: "blueprint", label: "Blueprint" },
        ].map((t) => (
          <button
            key={t.id}
            className={`drop-tab ${activeTab === t.id ? "active" : ""} ${t.highlight ? "highlight" : ""}`}
            onClick={() => setActiveTab(t.id as Tab)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* CONTENT */}
      <div className="drop-content">
        {activeTab === "overview" && (
          <OverviewTab
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
          />
        )}
        {activeTab === "suppliers" && <SuppliersTab />}
        {activeTab === "niches" && <NichesTab />}
        {activeTab === "calculator" && (
          <CalculatorTab userPlan={user?.plan ?? undefined} />
        )}
        {activeTab === "ai" && <AIToolsTab />}
        {activeTab === "blueprint" && <BlueprintTab model={selectedModel} />}
      </div>

      {/* ATLAS ASSISTANT */}
      <AssistantPanel
        assistant="atlas"
        context={{
          page: "dropshipping",
          layer: "market",
          stores,
          hasStore,
          model: selectedModel,
          userId: user?.id,
        }}
        initialMessage={
          !hasStore
            ? "Ready to build your first dropshipping store? Tell me your niche and I'll find 5 winning products in 30 seconds."
            : "ATLAS sees a trending opportunity in your niche. Want the full analysis?"
        }
      />
    </div>
  );
}

// Placeholder components - these would need to be implemented
function OverviewTab({
  selectedModel,
  setSelectedModel,
}: {
  selectedModel: string;
  setSelectedModel: (model: "pod" | "general" | "premium") => void;
}) {
  const models = [
    {
      id: "pod" as const,
      name: "Print-on-Demand",
      icon: "🖨️",
      description: "Custom products with zero inventory",
      bestFor: "T-shirts, mugs, phone cases",
      margin: "40-60%",
      suppliers: ["Printful", "Gelato"],
      features: [
        "No inventory risk",
        "Custom designs",
        "Global shipping",
        "Quality guaranteed",
      ],
    },
    {
      id: "general" as const,
      name: "General Dropshipping",
      icon: "📦",
      description: "Wide range of products from AliExpress",
      bestFor: "Electronics, home goods, fashion",
      margin: "30-50%",
      suppliers: ["CJ Dropshipping", "AliExpress"],
      features: [
        "Massive catalog",
        "Competitive pricing",
        "Fast shipping",
        "High volume",
      ],
    },
    {
      id: "premium" as const,
      name: "Premium Brands",
      icon: "💎",
      description: "High-end products with premium margins",
      bestFor: "Luxury items, niche products",
      margin: "50-80%",
      suppliers: ["Spocket", "SaleHoo"],
      features: [
        "Premium products",
        "High margins",
        "Quality focus",
        "Brand protection",
      ],
    },
  ];

  return (
    <div>
      {/* METRICS ROW */}
      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-value">6</div>
          <div className="metric-label">Supplier Integrations</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">AI</div>
          <div className="metric-label">Product Research</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">Auto</div>
          <div className="metric-label">Fulfillment</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">$0</div>
          <div className="metric-label">Starting Cost</div>
        </div>
      </div>

      {/* MODEL SELECTION */}
      <div style={{ marginBottom: 48 }}>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 8,
            color: "var(--gold)",
          }}
        >
          Choose Your Model
        </h2>
        <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 24 }}>
          Select the dropshipping model that fits your business goals
        </p>

        <div className="models-grid">
          {models.map((model) => (
            <div
              key={model.id}
              className={`model-card ${selectedModel === model.id ? "selected" : ""}`}
              onClick={() => setSelectedModel(model.id)}
            >
              <div className="model-icon">{model.icon}</div>
              <div className="model-name">{model.name}</div>
              <div className="model-via">{model.description}</div>
              <div className="model-best">Best for: {model.bestFor}</div>

              <ul className="model-pros">
                {model.features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>

              <div className="model-margin">Typical Margin: {model.margin}</div>
            </div>
          ))}
        </div>
      </div>

      {/* HOW IT WORKS */}
      <div>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 8,
            color: "var(--gold)",
          }}
        >
          How It Works
        </h2>
        <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 32 }}>
          From product research to automated fulfillment in 4 simple steps
        </p>

        <div className="flow-steps">
          <div className="flow-step">
            <div className="flow-num">1</div>
            <div className="flow-icon">🤖</div>
            <div className="flow-title">AI Research</div>
            <div className="flow-desc">
              ATLAS analyzes market trends and finds winning products in your
              niche
            </div>
          </div>

          <div className="flow-step">
            <div className="flow-num">2</div>
            <div className="flow-icon">📊</div>
            <div className="flow-title">Profit Calculator</div>
            <div className="flow-desc">
              Calculate margins, costs, and monthly projections before you start
            </div>
          </div>

          <div className="flow-step">
            <div className="flow-num">3</div>
            <div className="flow-icon">🛒</div>
            <div className="flow-title">List Products</div>
            <div className="flow-desc">
              Import products to your Winners store with automated pricing
            </div>
          </div>

          <div className="flow-step">
            <div className="flow-num">4</div>
            <div className="flow-icon">🚚</div>
            <div className="flow-title">Auto-Fulfill</div>
            <div className="flow-desc">
              Orders are automatically sent to suppliers and shipped to
              customers
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuppliersTab() {
  const suppliers = [
    {
      id: "printful",
      name: "Printful",
      emoji: "🖨️",
      type: "Print-on-Demand",
      products: "500K+",
      shipping: "5-15 days",
      margin: "40-60%",
      countries: "200+",
      bestFor: "Custom apparel, accessories",
      recommended: true,
      connected: false,
    },
    {
      id: "gelato",
      name: "Gelato",
      emoji: "🎨",
      type: "Print-on-Demand",
      products: "1M+",
      shipping: "3-10 days",
      margin: "35-55%",
      countries: "180+",
      bestFor: "Global POD marketplace",
      recommended: true,
      connected: false,
    },
    {
      id: "cj",
      name: "CJ Dropshipping",
      emoji: "🚀",
      type: "General",
      products: "20M+",
      shipping: "7-21 days",
      margin: "30-50%",
      countries: "200+",
      bestFor: "Electronics, fashion, home",
      recommended: false,
      connected: false,
    },
    {
      id: "aliexpress",
      name: "AliExpress",
      emoji: "🐉",
      type: "General",
      products: "100M+",
      shipping: "10-30 days",
      margin: "25-45%",
      countries: "220+",
      bestFor: "Everything under the sun",
      recommended: false,
      connected: false,
    },
    {
      id: "spocket",
      name: "Spocket",
      emoji: "💎",
      type: "Premium",
      products: "2M+",
      shipping: "3-7 days",
      margin: "50-80%",
      countries: "120+",
      bestFor: "US/EU suppliers only",
      recommended: true,
      connected: false,
    },
    {
      id: "zendrop",
      name: "Zendrop",
      emoji: "⚡",
      type: "Premium",
      products: "500K+",
      shipping: "2-5 days",
      margin: "45-70%",
      countries: "60+",
      bestFor: "Fast US shipping",
      recommended: false,
      connected: false,
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 8,
            color: "var(--gold)",
          }}
        >
          Supplier Integrations
        </h2>
        <p style={{ color: "var(--text-dim)", fontSize: 14 }}>
          Connect to 6 major dropshipping suppliers. All integrations are
          automated and require API keys.
        </p>
      </div>

      <div className="suppliers-grid">
        {suppliers.map((supplier) => (
          <div
            key={supplier.id}
            className={`supplier-card ${supplier.recommended ? "recommended" : ""}`}
          >
            <div className="supplier-header">
              <div className="supplier-emoji">{supplier.emoji}</div>
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--text)",
                    marginBottom: 2,
                  }}
                >
                  {supplier.name}
                </div>
                <div className="supplier-type">{supplier.type}</div>
              </div>
              {supplier.recommended && (
                <div className="supplier-tag">Recommended</div>
              )}
            </div>

            <div className="supplier-stats">
              <div className="stat-item">
                <div className="stat-label">Products</div>
                <div className="stat-val">{supplier.products}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Shipping</div>
                <div className="stat-val">{supplier.shipping}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Margin</div>
                <div className="stat-val">{supplier.margin}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Countries</div>
                <div className="stat-val">{supplier.countries}</div>
              </div>
            </div>

            <div
              style={{
                fontSize: 12,
                color: "var(--text-dim)",
                margin: "12px 0",
                lineHeight: 1.5,
              }}
            >
              <strong>Best for:</strong> {supplier.bestFor}
            </div>

            <button
              className={`connect-btn ${supplier.connected ? "connected" : ""}`}
            >
              {supplier.connected ? "✓ Connected" : "Connect API"}
            </button>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 48,
          padding: 24,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 24, marginBottom: 12 }}>🔑</div>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: 8,
          }}
        >
          API Key Setup Required
        </h3>
        <p style={{ color: "var(--text-dim)", fontSize: 14, marginBottom: 16 }}>
          To connect suppliers, you'll need to obtain API keys from their
          platforms and configure them in your Winners account settings.
        </p>
        <button
          style={{
            padding: "10px 20px",
            background: "var(--gold)",
            color: "var(--bg)",
            border: "none",
            borderRadius: 6,
            fontFamily: "'Syne', sans-serif",
            fontSize: 14,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Go to Settings →
        </button>
      </div>
    </div>
  );
}

function NichesTab() {
  const niches = [
    {
      id: "african-fashion",
      name: "African Fashion",
      emoji: "👗",
      marketSize: "$2.5B",
      competition: "Medium" as const,
      confidence: 95,
      recommendedSupplier: "Printful",
      market: "Africa",
      products: [
        { name: "Ankara Print Dresses", price: "$35-65", margin: "45%" },
        { name: "Kente Cloth Accessories", price: "$15-40", margin: "50%" },
        { name: "African Print T-shirts", price: "$20-35", margin: "40%" },
      ],
    },
    {
      id: "tech-accessories",
      name: "Tech Accessories",
      emoji: "📱",
      marketSize: "$850M",
      competition: "High" as const,
      confidence: 88,
      recommendedSupplier: "CJ Dropshipping",
      market: "Global",
      products: [
        { name: "Phone Cases", price: "$12-25", margin: "35%" },
        { name: "Wireless Chargers", price: "$18-35", margin: "42%" },
        { name: "Cable Organizers", price: "$8-15", margin: "38%" },
      ],
    },
    {
      id: "home-decor",
      name: "Home Decor",
      emoji: "🏠",
      marketSize: "$1.2B",
      competition: "Medium" as const,
      confidence: 92,
      recommendedSupplier: "AliExpress",
      market: "Africa",
      products: [
        { name: "Wall Art Prints", price: "$25-55", margin: "48%" },
        { name: "Decorative Pillows", price: "$30-60", margin: "45%" },
        { name: "Plant Pots", price: "$15-35", margin: "40%" },
      ],
    },
    {
      id: "fitness-gear",
      name: "Fitness Gear",
      emoji: "💪",
      marketSize: "$680M",
      competition: "High" as const,
      confidence: 85,
      recommendedSupplier: "Spocket",
      market: "Global",
      products: [
        { name: "Resistance Bands", price: "$15-30", margin: "38%" },
        { name: "Yoga Mats", price: "$25-45", margin: "42%" },
        { name: "Water Bottles", price: "$12-22", margin: "35%" },
      ],
    },
    {
      id: "beauty-products",
      name: "Beauty Products",
      emoji: "💄",
      marketSize: "$950M",
      competition: "High" as const,
      confidence: 90,
      recommendedSupplier: "CJ Dropshipping",
      market: "Africa",
      products: [
        { name: "Hair Care Sets", price: "$25-50", margin: "40%" },
        { name: "Skincare Tools", price: "$15-35", margin: "45%" },
        { name: "Makeup Brushes", price: "$12-25", margin: "38%" },
      ],
    },
    {
      id: "pet-supplies",
      name: "Pet Supplies",
      emoji: "🐕",
      marketSize: "$420M",
      competition: "Low" as const,
      confidence: 78,
      recommendedSupplier: "AliExpress",
      market: "Africa",
      products: [
        { name: "Pet Toys", price: "$8-20", margin: "35%" },
        { name: "Pet Bowls", price: "$12-25", margin: "40%" },
        { name: "Pet Beds", price: "$35-70", margin: "45%" },
      ],
    },
    {
      id: "kitchen-gadgets",
      name: "Kitchen Gadgets",
      emoji: "👨‍🍳",
      marketSize: "$580M",
      competition: "Medium" as const,
      confidence: 87,
      recommendedSupplier: "CJ Dropshipping",
      market: "Global",
      products: [
        { name: "Measuring Tools", price: "$8-18", margin: "32%" },
        { name: "Storage Containers", price: "$15-30", margin: "38%" },
        { name: "Cooking Utensils", price: "$12-25", margin: "35%" },
      ],
    },
    {
      id: "outdoor-gear",
      name: "Outdoor Gear",
      emoji: "🏕️",
      marketSize: "$350M",
      competition: "Low" as const,
      confidence: 82,
      recommendedSupplier: "AliExpress",
      market: "Africa",
      products: [
        { name: "Camping Lanterns", price: "$20-40", margin: "42%" },
        { name: "Cooler Bags", price: "$25-50", margin: "40%" },
        { name: "Hiking Backpacks", price: "$45-85", margin: "45%" },
      ],
    },
  ];

  const getCompetitionColor = (competition: string) => {
    switch (competition) {
      case "Low":
        return "var(--green)";
      case "Medium":
        return "var(--gold)";
      case "High":
        return "var(--red)";
      default:
        return "var(--text-dim)";
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "var(--green)";
    if (confidence >= 80) return "var(--gold)";
    return "var(--red)";
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 8,
            color: "var(--gold)",
          }}
        >
          Profitable Niches
        </h2>
        <p style={{ color: "var(--text-dim)", fontSize: 14 }}>
          Data-driven niche analysis for African and global markets. Find
          opportunities with growth potential.
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
          gap: 20,
        }}
      >
        {niches.map((niche) => (
          <div
            key={niche.id}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 20,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: `linear-gradient(90deg, ${getConfidenceColor(niche.confidence)}, transparent)`,
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div style={{ fontSize: 32 }}>{niche.emoji}</div>
              <div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: "var(--text)",
                    marginBottom: 2,
                  }}
                >
                  {niche.name}
                </h3>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-dim)",
                    fontFamily: "'Space Mono', monospace",
                  }}
                >
                  {niche.market} Market
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  padding: 8,
                  background: "var(--surface2)",
                  borderRadius: 4,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--gold)",
                  }}
                >
                  {niche.marketSize}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-dim)",
                    fontFamily: "'Space Mono', monospace",
                  }}
                >
                  Market Size
                </div>
              </div>
              <div
                style={{
                  textAlign: "center",
                  padding: 8,
                  background: "var(--surface2)",
                  borderRadius: 4,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: getCompetitionColor(niche.competition),
                  }}
                >
                  {niche.competition}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: "var(--text-dim)",
                    fontFamily: "'Space Mono', monospace",
                  }}
                >
                  Competition
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-dim)",
                    fontFamily: "'Space Mono', monospace",
                  }}
                >
                  Confidence Score
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: getConfidenceColor(niche.confidence),
                    fontFamily: "'Space Mono', monospace",
                  }}
                >
                  {niche.confidence}%
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: 4,
                  background: "var(--surface2)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${niche.confidence}%`,
                    height: "100%",
                    background: getConfidenceColor(niche.confidence),
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-dim)",
                  marginBottom: 4,
                  fontFamily: "'Space Mono', monospace",
                }}
              >
                Recommended Supplier
              </div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--gold)",
                  fontFamily: "'Space Mono', monospace",
                  textTransform: "uppercase",
                }}
              >
                {niche.recommendedSupplier}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-dim)",
                  marginBottom: 8,
                  fontFamily: "'Space Mono', monospace",
                }}
              >
                Top Products
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {niche.products.map((product, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: 6,
                      background: "var(--surface2)",
                      borderRadius: 4,
                    }}
                  >
                    <span
                      style={{ fontSize: 11, color: "var(--text)", flex: 1 }}
                    >
                      {product.name}
                    </span>
                    <div
                      style={{ display: "flex", gap: 8, alignItems: "center" }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          color: "var(--text-dim)",
                          fontFamily: "'Space Mono', monospace",
                        }}
                      >
                        {product.price}
                      </span>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: "var(--green)",
                          fontFamily: "'Space Mono', monospace",
                        }}
                      >
                        {product.margin}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              style={{
                width: "100%",
                marginTop: 16,
                padding: "10px",
                background: "var(--gold)",
                color: "var(--bg)",
                border: "none",
                borderRadius: 6,
                fontFamily: "'Syne', sans-serif",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                transition: "transform 0.15s",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "translateY(-1px)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "translateY(0)")
              }
            >
              Research with ATLAS →
            </button>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 48,
          padding: 32,
          background:
            "linear-gradient(135deg, rgba(201, 168, 76, 0.05), rgba(45, 212, 160, 0.05))",
          border: "1px solid rgba(201, 168, 76, 0.1)",
          borderRadius: 12,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
        <h3
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "var(--gold)",
            marginBottom: 12,
          }}
        >
          Niche Selection Strategy
        </h3>
        <p
          style={{
            color: "var(--text-dim)",
            fontSize: 16,
            lineHeight: 1.6,
            marginBottom: 24,
            maxWidth: 600,
            margin: "0 auto 24px",
          }}
        >
          Choose niches based on market size, competition level, and your
          supplier access. High-confidence niches have proven demand and
          supplier support.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
            maxWidth: 800,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              textAlign: "center",
              padding: 16,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>🎪</div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: 4,
              }}
            >
              Start Small
            </div>
            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
              Test 2-3 products in one niche
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: 16,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>📈</div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: 4,
              }}
            >
              Scale Winners
            </div>
            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
              Expand successful products
            </div>
          </div>
          <div
            style={{
              textAlign: "center",
              padding: 16,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 24, marginBottom: 8 }}>🔄</div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: 4,
              }}
            >
              Rotate Niches
            </div>
            <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
              Test new opportunities quarterly
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CalculatorTab({ userPlan }: { userPlan?: string }) {
  const [formData, setFormData] = useState({
    productCost: 10,
    sellingPrice: 25,
    shippingToCharge: 5,
    supplierShipping: 3,
    monthlySales: 50,
  });
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculateProfit = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/v1/dropship/calculate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to calculate profit");
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: string, value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 8,
            color: "var(--gold)",
          }}
        >
          Profit Calculator
        </h2>
        <p style={{ color: "var(--text-dim)", fontSize: 14 }}>
          Calculate your dropshipping margins and monthly profits. Plan:{" "}
          {userPlan || "FREE"}
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32 }}>
        {/* INPUT FORM */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: 24,
          }}
        >
          <h3
            style={{
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 20,
              color: "var(--text)",
            }}
          >
            Product Details
          </h3>

          <div style={{ display: "grid", gap: 16 }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "var(--text-dim)",
                  marginBottom: 4,
                  fontFamily: "'Space Mono', monospace",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Product Cost ($)
              </label>
              <input
                type="number"
                value={formData.productCost}
                onChange={(e) =>
                  updateFormData("productCost", parseFloat(e.target.value) || 0)
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  color: "var(--text)",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "var(--text-dim)",
                  marginBottom: 4,
                  fontFamily: "'Space Mono', monospace",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Selling Price ($)
              </label>
              <input
                type="number"
                value={formData.sellingPrice}
                onChange={(e) =>
                  updateFormData(
                    "sellingPrice",
                    parseFloat(e.target.value) || 0,
                  )
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  color: "var(--text)",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "var(--text-dim)",
                  marginBottom: 4,
                  fontFamily: "'Space Mono', monospace",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Shipping to Charge ($)
              </label>
              <input
                type="number"
                value={formData.shippingToCharge}
                onChange={(e) =>
                  updateFormData(
                    "shippingToCharge",
                    parseFloat(e.target.value) || 0,
                  )
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  color: "var(--text)",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "var(--text-dim)",
                  marginBottom: 4,
                  fontFamily: "'Space Mono', monospace",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Supplier Shipping ($)
              </label>
              <input
                type="number"
                value={formData.supplierShipping}
                onChange={(e) =>
                  updateFormData(
                    "supplierShipping",
                    parseFloat(e.target.value) || 0,
                  )
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  color: "var(--text)",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "var(--text-dim)",
                  marginBottom: 4,
                  fontFamily: "'Space Mono', monospace",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Monthly Sales (units)
              </label>
              <input
                type="number"
                value={formData.monthlySales}
                onChange={(e) =>
                  updateFormData(
                    "monthlySales",
                    parseFloat(e.target.value) || 0,
                  )
                }
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 4,
                  color: "var(--text)",
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 14,
                }}
              />
            </div>

            <button
              onClick={calculateProfit}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "var(--gold)",
                color: "var(--bg)",
                border: "none",
                borderRadius: 6,
                fontFamily: "'Syne', sans-serif",
                fontSize: 14,
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                marginTop: 8,
              }}
            >
              {loading ? "Calculating..." : "Calculate Profit"}
            </button>

            {error && (
              <div
                style={{
                  padding: 12,
                  background: "rgba(224, 90, 78, 0.1)",
                  border: "1px solid rgba(224, 90, 78, 0.2)",
                  borderRadius: 4,
                  color: "var(--red)",
                  fontSize: 12,
                }}
              >
                {error}
              </div>
            )}
          </div>
        </div>

        {/* RESULTS */}
        <div>
          {results ? (
            <div style={{ display: "grid", gap: 16 }}>
              {/* PER SALE METRICS */}
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: 24,
                }}
              >
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 16,
                    color: "var(--text)",
                  }}
                >
                  Per Sale Analysis
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <div className="metric-card">
                    <div className="metric-value">
                      ${results.perSale.revenue}
                    </div>
                    <div className="metric-label">Revenue</div>
                  </div>
                  <div className="metric-card">
                    <div
                      className="metric-value"
                      style={{
                        color:
                          results.perSale.netProfit >= 0
                            ? "var(--green)"
                            : "var(--red)",
                      }}
                    >
                      ${results.perSale.netProfit}
                    </div>
                    <div className="metric-label">Net Profit</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-value">
                      {results.perSale.marginPercent}%
                    </div>
                    <div className="metric-label">Margin</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-value">
                      ${results.perSale.platformFee}
                    </div>
                    <div className="metric-label">Platform Fee</div>
                  </div>
                </div>
              </div>

              {/* MONTHLY PROJECTION */}
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: 24,
                }}
              >
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 16,
                    color: "var(--text)",
                  }}
                >
                  Monthly Projection
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  <div className="metric-card">
                    <div className="metric-value">
                      ${results.monthly.revenue}
                    </div>
                    <div className="metric-label">Revenue</div>
                  </div>
                  <div className="metric-card">
                    <div
                      className="metric-value"
                      style={{
                        color:
                          results.monthly.profit >= 0
                            ? "var(--green)"
                            : "var(--red)",
                      }}
                    >
                      ${results.monthly.profit}
                    </div>
                    <div className="metric-label">Profit</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-value">{results.monthly.units}</div>
                    <div className="metric-label">Units Sold</div>
                  </div>
                  <div className="metric-card">
                    <div className="metric-value">
                      {results.commissionRate * 100}%
                    </div>
                    <div className="metric-label">Commission Rate</div>
                  </div>
                </div>
              </div>

              {/* BREAKDOWN */}
              <div
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: 24,
                }}
              >
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    marginBottom: 16,
                    color: "var(--text)",
                  }}
                >
                  Cost Breakdown (%)
                </h3>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      textAlign: "center",
                      padding: 12,
                      background: "var(--surface2)",
                      borderRadius: 4,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: "var(--text)",
                      }}
                    >
                      {results.breakdown.productCostPct}%
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-dim)",
                        fontFamily: "'Space Mono', monospace",
                      }}
                    >
                      Product Cost
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: "center",
                      padding: 12,
                      background: "var(--surface2)",
                      borderRadius: 4,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: "var(--text)",
                      }}
                    >
                      {results.breakdown.shippingPct}%
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-dim)",
                        fontFamily: "'Space Mono', monospace",
                      }}
                    >
                      Shipping
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: "center",
                      padding: 12,
                      background: "var(--surface2)",
                      borderRadius: 4,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color: "var(--text)",
                      }}
                    >
                      {results.breakdown.platformFeePct}%
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-dim)",
                        fontFamily: "'Space Mono', monospace",
                      }}
                    >
                      Platform Fee
                    </div>
                  </div>
                  <div
                    style={{
                      textAlign: "center",
                      padding: 12,
                      background: "var(--surface2)",
                      borderRadius: 4,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 700,
                        color:
                          results.breakdown.yourProfitPct >= 0
                            ? "var(--green)"
                            : "var(--red)",
                      }}
                    >
                      {results.breakdown.yourProfitPct}%
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "var(--text-dim)",
                        fontFamily: "'Space Mono', monospace",
                      }}
                    >
                      Your Profit
                    </div>
                  </div>
                </div>
              </div>

              {/* PLAN UPGRADE SUGGESTION */}
              {results.planAdvantage && (
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(201, 168, 76, 0.1), rgba(201, 168, 76, 0.05))",
                    border: "1px solid rgba(201, 168, 76, 0.2)",
                    borderRadius: 8,
                    padding: 20,
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: "var(--gold)",
                      marginBottom: 8,
                    }}
                  >
                    💡 Upgrade Opportunity
                  </div>
                  <div style={{ color: "var(--text)", fontSize: 14 }}>
                    {results.planAdvantage}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: 48,
                textAlign: "center",
                color: "var(--text-dim)",
              }}
            >
              <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
                Ready to Calculate
              </div>
              <div>
                Enter your product details and click "Calculate Profit" to see
                your margins
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AIToolsTab() {
  const tools = [
    {
      id: "research",
      icon: "🔍",
      title: "Product Research",
      description:
        "Find winning products in any niche with AI-powered market analysis",
      endpoint: "/atlas/dropshipping-research",
      color: "var(--gold)",
    },
    {
      id: "description",
      icon: "📝",
      title: "Product Descriptions",
      description:
        "Generate compelling, conversion-optimized product descriptions",
      endpoint: "/atlas/description",
      color: "var(--green)",
    },
    {
      id: "competitor",
      icon: "⚔️",
      title: "Competitor Analysis",
      description: "Analyze competitors and find market opportunities",
      endpoint: "/atlas/competitor",
      color: "var(--ice)",
    },
    {
      id: "brand",
      icon: "🎨",
      title: "Brand Strategy",
      description: "Develop complete brand identity and marketing strategy",
      endpoint: "/atlas/brand",
      color: "var(--purple)",
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 8,
            color: "var(--gold)",
          }}
        >
          🤖 ATLAS AI Tools
        </h2>
        <p style={{ color: "var(--text-dim)", fontSize: 14 }}>
          AI-powered tools to research products, analyze markets, and optimize
          your dropshipping business
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
        }}
      >
        {tools.map((tool) => (
          <div
            key={tool.id}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 24,
              cursor: "pointer",
              transition: "all 0.15s",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = tool.color;
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = `0 8px 24px ${tool.color}20`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 3,
                background: `linear-gradient(90deg, ${tool.color}, transparent)`,
              }}
            />

            <div style={{ fontSize: 32, marginBottom: 12 }}>{tool.icon}</div>

            <h3
              style={{
                fontSize: 18,
                fontWeight: 700,
                color: "var(--text)",
                marginBottom: 8,
              }}
            >
              {tool.title}
            </h3>

            <p
              style={{
                color: "var(--text-dim)",
                fontSize: 14,
                lineHeight: 1.5,
                marginBottom: 16,
              }}
            >
              {tool.description}
            </p>

            <div
              style={{
                fontSize: 11,
                color: tool.color,
                fontFamily: "'Space Mono', monospace",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                fontWeight: 700,
              }}
            >
              {tool.endpoint}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: 48,
          padding: 32,
          background:
            "linear-gradient(135deg, rgba(201, 168, 76, 0.05), rgba(45, 212, 160, 0.05))",
          border: "1px solid rgba(201, 168, 76, 0.1)",
          borderRadius: 12,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🧠</div>
        <h3
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "var(--gold)",
            marginBottom: 12,
          }}
        >
          ATLAS Market Intelligence
        </h3>
        <p
          style={{
            color: "var(--text-dim)",
            fontSize: 16,
            lineHeight: 1.6,
            marginBottom: 24,
            maxWidth: 600,
            margin: "0 auto 24px",
          }}
        >
          ATLAS is your AI market research assistant, trained on African and
          diaspora market dynamics. Get data-driven insights, not generic
          advice. Every recommendation is backed by real market analysis.
        </p>

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              padding: "8px 16px",
              background: "rgba(201, 168, 76, 0.1)",
              border: "1px solid rgba(201, 168, 76, 0.2)",
              borderRadius: 20,
              fontSize: 12,
              color: "var(--gold)",
              fontFamily: "'Space Mono', monospace",
              fontWeight: 700,
            }}
          >
            🇰🇪 Kenya Focus
          </div>
          <div
            style={{
              padding: "8px 16px",
              background: "rgba(201, 168, 76, 0.1)",
              border: "1px solid rgba(201, 168, 76, 0.2)",
              borderRadius: 20,
              fontSize: 12,
              color: "var(--gold)",
              fontFamily: "'Space Mono', monospace",
              fontWeight: 700,
            }}
          >
            🇳🇬 Nigeria Focus
          </div>
          <div
            style={{
              padding: "8px 16px",
              background: "rgba(201, 168, 76, 0.1)",
              border: "1px solid rgba(201, 168, 76, 0.2)",
              borderRadius: 20,
              fontSize: 12,
              color: "var(--gold)",
              fontFamily: "'Space Mono', monospace",
              fontWeight: 700,
            }}
          >
            🇬🇭 Ghana Focus
          </div>
          <div
            style={{
              padding: "8px 16px",
              background: "rgba(201, 168, 76, 0.1)",
              border: "1px solid rgba(201, 168, 76, 0.2)",
              borderRadius: 20,
              fontSize: 12,
              color: "var(--gold)",
              fontFamily: "'Space Mono', monospace",
              fontWeight: 700,
            }}
          >
            🌍 Diaspora Ready
          </div>
        </div>
      </div>
    </div>
  );
}

function BlueprintTab({ model }: { model: string }) {
  const blueprintSteps = [
    {
      phase: "Phase 1",
      title: "Foundation Setup",
      duration: "1-2 Weeks",
      steps: [
        "Choose your niche using ATLAS research",
        "Set up your Winners Academy store",
        "Connect supplier accounts (CJ, AliExpress, Printful)",
        "Configure payment processing with Stripe",
        "Set up email marketing (Mailchimp/Klaviyo)",
      ],
      color: "var(--blue)",
      icon: "🏗️",
    },
    {
      phase: "Phase 2",
      title: "Product Launch",
      duration: "2-4 Weeks",
      steps: [
        "Research trending products in your niche",
        "Create compelling product listings",
        "Set up automated fulfillment workflows",
        "Launch with initial marketing campaign",
        "Monitor first sales and customer feedback",
      ],
      color: "var(--gold)",
      icon: "🚀",
    },
    {
      phase: "Phase 3",
      title: "Optimization",
      duration: "4-8 Weeks",
      steps: [
        "Analyze sales data and customer behavior",
        "Optimize product descriptions and images",
        "Refine pricing strategy using profit calculator",
        "Scale marketing spend on winning products",
        "Implement customer retention strategies",
      ],
      color: "var(--green)",
      icon: "⚡",
    },
    {
      phase: "Phase 4",
      title: "Scale & Automate",
      duration: "8-16 Weeks",
      steps: [
        "Expand product catalog in proven niches",
        "Automate order processing and customer service",
        "Build email marketing sequences",
        "Hire virtual assistants for scaling tasks",
        "Diversify into complementary niches",
      ],
      color: "var(--purple)",
      icon: "📈",
    },
  ];

  const successMetrics = [
    { label: "Monthly Revenue", target: "$10K+", current: "$0", icon: "💰" },
    { label: "Profit Margin", target: "30%+", current: "0%", icon: "📊" },
    { label: "Conversion Rate", target: "3%+", current: "0%", icon: "🎯" },
    { label: "Customer Retention", target: "25%+", current: "0%", icon: "🔄" },
  ];

  const commonPitfalls = [
    {
      title: "Poor Product Research",
      description: "Launching products without market validation",
      solution: "Use ATLAS AI for competitor analysis and trend research",
    },
    {
      title: "Supplier Reliability Issues",
      description: "Choosing suppliers with poor fulfillment",
      solution: "Start with proven suppliers and monitor performance",
    },
    {
      title: "Pricing Too High/Low",
      description: "Not accounting for all costs and competition",
      solution: "Use the profit calculator for accurate pricing",
    },
    {
      title: "No Marketing Strategy",
      description: "Expecting organic traffic to drive sales",
      solution: "Invest in targeted Facebook/Instagram ads from day one",
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 32 }}>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 800,
            marginBottom: 8,
            color: "var(--gold)",
          }}
        >
          Dropshipping Blueprint
        </h2>
        <p style={{ color: "var(--text-dim)", fontSize: 14 }}>
          Step-by-step roadmap to build a profitable dropshipping business.
          Follow the phases for systematic growth.
        </p>
      </div>

      {/* Blueprint Timeline */}
      <div style={{ marginBottom: 48 }}>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: 24,
          }}
        >
          16-Week Success Blueprint
        </h3>

        <div style={{ display: "grid", gap: 24 }}>
          {blueprintSteps.map((phase, index) => (
            <div
              key={phase.phase}
              style={{
                display: "flex",
                gap: 20,
                alignItems: "flex-start",
                padding: 24,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 24,
                  left: 24,
                  width: 48,
                  height: 48,
                  borderRadius: "50%",
                  background: phase.color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  color: "var(--bg)",
                  fontWeight: 700,
                }}
              >
                {index + 1}
              </div>

              <div style={{ marginLeft: 76, flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 12,
                  }}
                >
                  <div style={{ fontSize: 24 }}>{phase.icon}</div>
                  <div>
                    <h4
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: "var(--text)",
                        marginBottom: 2,
                      }}
                    >
                      {phase.title}
                    </h4>
                    <div
                      style={{
                        fontSize: 12,
                        color: phase.color,
                        fontWeight: 700,
                        fontFamily: "'Space Mono', monospace",
                        textTransform: "uppercase",
                      }}
                    >
                      {phase.phase} • {phase.duration}
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  {phase.steps.map((step, stepIndex) => (
                    <div
                      key={stepIndex}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: 8,
                        background: "var(--surface2)",
                        borderRadius: 6,
                      }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: phase.color,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: 13, color: "var(--text)" }}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Success Metrics */}
      <div style={{ marginBottom: 48 }}>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: 24,
          }}
        >
          Success Metrics Dashboard
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 16,
          }}
        >
          {successMetrics.map((metric) => (
            <div
              key={metric.label}
              style={{
                padding: 20,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>{metric.icon}</div>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "var(--text)",
                  marginBottom: 4,
                }}
              >
                {metric.label}
              </div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: "var(--gold)",
                  marginBottom: 2,
                }}
              >
                {metric.current}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--text-dim)",
                  fontFamily: "'Space Mono', monospace",
                }}
              >
                Target: {metric.target}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Common Pitfalls */}
      <div style={{ marginBottom: 48 }}>
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: "var(--text)",
            marginBottom: 24,
          }}
        >
          Common Pitfalls & Solutions
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 20,
          }}
        >
          {commonPitfalls.map((pitfall, index) => (
            <div
              key={index}
              style={{
                padding: 20,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  marginBottom: 12,
                  color: "var(--red)",
                  fontWeight: 700,
                }}
              >
                ⚠️ {pitfall.title}
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-dim)",
                  marginBottom: 12,
                  lineHeight: 1.5,
                }}
              >
                {pitfall.description}
              </p>
              <div
                style={{
                  padding: 12,
                  background: "rgba(45, 212, 160, 0.1)",
                  border: "1px solid rgba(45, 212, 160, 0.2)",
                  borderRadius: 6,
                }}
              >
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: "var(--green)",
                    marginBottom: 4,
                    fontFamily: "'Space Mono', monospace",
                    textTransform: "uppercase",
                  }}
                >
                  Solution
                </div>
                <div style={{ fontSize: 12, color: "var(--text)" }}>
                  {pitfall.solution}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Items */}
      <div
        style={{
          padding: 32,
          background:
            "linear-gradient(135deg, rgba(201, 168, 76, 0.1), rgba(45, 212, 160, 0.1))",
          border: "1px solid rgba(201, 168, 76, 0.2)",
          borderRadius: 12,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
        <h3
          style={{
            fontSize: 24,
            fontWeight: 800,
            color: "var(--gold)",
            marginBottom: 12,
          }}
        >
          Ready to Start?
        </h3>
        <p
          style={{
            color: "var(--text-dim)",
            fontSize: 16,
            lineHeight: 1.6,
            marginBottom: 24,
            maxWidth: 600,
            margin: "0 auto 24px",
          }}
        >
          Follow this blueprint to build a sustainable dropshipping business.
          Start with Phase 1 and use ATLAS AI to accelerate your research and
          decision-making.
        </p>

        <div
          style={{
            display: "flex",
            gap: 16,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            style={{
              padding: "12px 24px",
              background: "var(--gold)",
              color: "var(--bg)",
              border: "none",
              borderRadius: 8,
              fontFamily: "'Syne', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              transition: "transform 0.15s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "translateY(-1px)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = "translateY(0)")
            }
          >
            Start Phase 1 Setup →
          </button>

          <button
            style={{
              padding: "12px 24px",
              background: "transparent",
              color: "var(--gold)",
              border: "1px solid var(--gold)",
              borderRadius: 8,
              fontFamily: "'Syne', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--gold)";
              e.currentTarget.style.color = "var(--bg)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "var(--gold)";
            }}
          >
            Get ATLAS Research →
          </button>
        </div>
      </div>
    </div>
  );
}
