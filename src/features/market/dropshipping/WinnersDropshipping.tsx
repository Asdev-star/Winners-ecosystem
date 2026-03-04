// Phase 4A: Winners Dropshipping Hub
// Complete dropshipping module with supplier integration, niches, calculator, and AI tools

import { useState, useCallback, useRef } from "react";

// ─── Design Tokens ──────────────────────────────────────────────────────────
const T = {
  bg: "#0D1520", surface: "#111D2E", surface2: "#172335", surface3: "#1C2B40",
  border: "#1E3248", gold: "#C9A84C", gold2: "#E8C97A", ice: "#89C4E1",
  blue: "#2B5F8E", green: "#2DD4A0", purple: "#9B6FFF", red: "#E05A4E",
  orange: "#F08C3A", teal: "#0DBFAD", text: "#E8EEF5", dim: "#5A7A96", faint: "#2E4A64",
};

// ─── Supplier Catalog ────────────────────────────────────────────────────────
const SUPPLIERS = [
  {
    id: "printful", name: "Printful", icon: "🖨️", category: "Print-on-Demand",
    color: T.gold, region: "Global", delivery: "7–14 days", moq: "0 units",
    commission: "0%", platformFee: "Free",
    desc: "Premium print-on-demand for custom apparel, accessories, and homeware. No inventory. Your design ships globally.",
    products: ["T-Shirts", "Hoodies", "Mugs", "Phone Cases", "Posters", "Bags", "Hats", "Pillows"],
    pros: ["No minimum order", "White-label branding", "Global fulfillment centers", "Quality guarantee"],
    cons: ["Higher base cost", "Slower than dropship", "Limited product range"],
    margin: "25–45%", bestFor: "Branded merchandise, creator merch stores",
    apiSupport: true, autoFulfill: true,
  },
  {
    id: "gelato", name: "Gelato", icon: "🌍", category: "Print-on-Demand",
    color: T.green, region: "Global (32 countries)", delivery: "3–7 days", moq: "0 units",
    commission: "0%", platformFee: "Free",
    desc: "Local print fulfillment in 32+ countries. Faster delivery than Printful. Ideal for African diaspora markets.",
    products: ["T-Shirts", "Canvas Prints", "Calendars", "Notebooks", "Cards", "Hoodies", "Stickers"],
    pros: ["Fastest local delivery", "33% cheaper than import shipping", "Eco-friendly", "African market ready"],
    cons: ["Fewer product types", "Quality varies by location"],
    margin: "30–50%", bestFor: "East Africa + diaspora markets, sustainability brands",
    apiSupport: true, autoFulfill: true,
  },
  {
    id: "aliexpress", name: "AliExpress / DSers", icon: "🏭", category: "General Dropship",
    color: T.red, region: "China → Global", delivery: "10–25 days", moq: "1 unit",
    commission: "0%", platformFee: "Free–$499/yr",
    desc: "Millions of products. Near-zero inventory cost. DSers automates order placement. The classic dropshipping engine — high volume, lower margins per sale.",
    products: ["Electronics", "Fashion", "Beauty", "Home", "Sports", "Toys", "Tools", "Auto"],
    pros: ["Millions of products", "Ultra-low sourcing cost", "No MOQ", "Automated via DSers"],
    cons: ["Long shipping times", "Quality inconsistency", "No white-label", "Tracking unreliable"],
    margin: "15–40%", bestFor: "High-volume general stores, testing products quickly",
    apiSupport: true, autoFulfill: true,
  },
  {
    id: "spocket", name: "Spocket", icon: "🚀", category: "Premium Dropship",
    color: T.purple, region: "US, EU, India", delivery: "3–7 days", moq: "0 units",
    commission: "0%", platformFee: "$24–$99/mo",
    desc: "US and EU-based suppliers. Faster shipping, higher quality. Ideal for targeting Western markets with premium products.",
    products: ["Apparel", "Beauty", "Home Decor", "Pet Supplies", "Kids", "Accessories", "Food"],
    pros: ["Fast shipping (US/EU)", "Higher quality products", "Real supplier vetting", "Branded invoicing"],
    cons: ["Monthly fee", "Less variety than AliExpress", "Limited Africa coverage"],
    margin: "30–60%", bestFor: "Premium stores targeting US/UK/EU buyers",
    apiSupport: true, autoFulfill: true,
  },
  {
    id: "zendrop", name: "Zendrop", icon: "⚡", category: "Premium Dropship",
    color: T.ice, region: "US, China", delivery: "5–12 days", moq: "0 units",
    commission: "0%", platformFee: "Free–$49/mo",
    desc: "US-based warehouse + China sourcing. 1-click fulfillment. Auto-tracking. Subscription box builder. Fast-growing platform for serious dropshippers.",
    products: ["Beauty", "Health", "Electronics", "Fitness", "Supplements", "Fashion", "Gadgets"],
    pros: ["US warehouse = fast US shipping", "Subscription box feature", "Auto-fulfillment", "Real-time tracking"],
    cons: ["Smaller catalog", "US-centric", "Some products pricey"],
    margin: "35–55%", bestFor: "US health/beauty niche stores, subscription boxes",
    apiSupport: true, autoFulfill: true,
  },
  {
    id: "cjdropshipping", name: "CJ Dropshipping", icon: "🔗", category: "General Dropship",
    color: T.orange, region: "China + US + EU warehouses", delivery: "7–20 days", moq: "0 units",
    commission: "0%", platformFee: "Free",
    desc: "Free platform with warehouses in US, EU, and China. Product sourcing service — give them any product, they source and ship it. Strong for Africa-adjacent markets.",
    products: ["All categories", "Custom sourcing", "Private label", "Jewelry", "Electronics"],
    pros: ["Free to use", "Private label available", "Custom product sourcing", "US/EU warehouses"],
    cons: ["Inconsistent quality control", "Complex interface", "Variable shipping"],
    margin: "20–50%", bestFor: "Private label products, custom sourcing, African sellers",
    apiSupport: true, autoFulfill: true,
  },
];

// ─── Niche Categories ────────────────────────────────────────────────────────
const NICHES = [
  { id: "fashion", icon: "👗", name: "African Fashion", color: T.gold, demand: "Very High", competition: "Medium", margin: "40–65%", trend: "+34%", supplier: ["Printful", "Gelato", "CJ"] },
  { id: "beauty", icon: "💄", name: "Beauty & Skincare", color: "#E06AA0", demand: "Very High", competition: "High", margin: "35–70%", trend: "+28%", supplier: ["Spocket", "Zendrop", "CJ"] },
  { id: "merch", icon: "👕", name: "Creator Merch", color: T.purple, demand: "High", competition: "Low", margin: "30–50%", trend: "+45%", supplier: ["Printful", "Gelato"] },
  { id: "homeware", icon: "🏠", name: "Home & Living", color: T.green, demand: "High", competition: "Medium", margin: "35–55%", trend: "+19%", supplier: ["Spocket", "AliExpress"] },
  { id: "tech", icon: "📱", name: "Tech Accessories", color: T.ice, demand: "Very High", competition: "High", margin: "25–45%", trend: "+22%", supplier: ["CJ", "AliExpress", "Zendrop"] },
  { id: "fitness", icon: "💪", name: "Health & Fitness", color: "#5DD87A", demand: "High", competition: "Medium", margin: "40–60%", trend: "+38%", supplier: ["Zendrop", "Spocket"] },
  { id: "kids", icon: "🧸", name: "Kids & Education", color: T.orange, demand: "High", competition: "Low", margin: "35–55%", trend: "+15%", supplier: ["AliExpress", "CJ"] },
  { id: "digital", icon: "💾", name: "Digital Products", color: T.gold, demand: "Very High", competition: "Low", margin: "90–99%", trend: "+67%", supplier: ["Self-hosted via Winners"] },
];

// ─── Streaming AI hook ───────────────────────────────────────────────────────
function useStream() {
  const [out, setOut] = useState("");
  const [loading, setLoading] = useState(false);
  const abort = useRef(false);

  const run = useCallback(async (system, user) => {
    setOut(""); setLoading(true); abort.current = false;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1200, stream: true,
          system,
          messages: [{ role: "user", content: user }],
        }),
      });
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done || abort.current) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() || "";
        for (const ln of lines) {
          if (!ln.startsWith("data: ")) continue;
          const d = ln.slice(6).trim();
          if (d === "[DONE]") continue;
          try { const p = JSON.parse(d); if (p?.delta?.text) setOut(o => o + p.delta.text); } catch {}
        }
      }
    } catch { setOut("⚠ API connection failed. Ensure your Anthropic API key is configured."); }
    finally { setLoading(false); }
  }, []);

  return { out, loading, run, reset: () => setOut(""), stop: () => { abort.current = true; setLoading(false); } };
}

// ─── Components ─────────────────────────────────────────────────────────────
function Label({ text, color = T.gold }) {
  return (
    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, letterSpacing: "0.24em", textTransform: "uppercase", color, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ height: 1, width: 20, background: `linear-gradient(90deg,${color},transparent)` }} />
      {text}
      <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg,transparent,${T.faint})` }} />
    </div>
  );
}

function Tag({ children, color = T.dim, bg }) {
  return (
    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, padding: "3px 9px", borderRadius: 3, background: bg || `${color}14`, border: `1px solid ${color}33`, color }}>
      {children}
    </span>
  );
}

function Card({ children, color, style = {} }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${color ? color + "44" : T.border}`, borderRadius: 8, position: "relative", overflow: "hidden", ...style }}>
      {color && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${color},transparent)` }} />}
      {children}
    </div>
  );
}

// ─── Profit Calculator ───────────────────────────────────────────────────────
function ProfitCalculator() {
  const [vals, setVals] = useState({ sell: 49, cost: 18, ads: 8, shipping: 4, platform: 2.5, returns: 3 });
  const set = (k, v) => setVals(p => ({ ...p, [k]: parseFloat(v) || 0 }));
  const profit = vals.sell - vals.cost - vals.ads - vals.shipping - vals.platform - vals.returns;
  const margin = vals.sell > 0 ? ((profit / vals.sell) * 100).toFixed(1) : 0;
  const roas = vals.ads > 0 ? (vals.sell / vals.ads).toFixed(2) : "∞";
  const monthly = (profit * 100).toFixed(0);

  const fields = [
    { key: "sell", label: "Selling Price", prefix: "$", color: T.green },
    { key: "cost", label: "Product Cost", prefix: "$", color: T.red },
    { key: "ads", label: "Ad Spend / Order", prefix: "$", color: T.orange },
    { key: "shipping", label: "Shipping Cost", prefix: "$", color: T.dim },
    { key: "platform", label: "Platform Fee", prefix: "$", color: T.dim },
    { key: "returns", label: "Returns Allowance", prefix: "$", color: T.dim },
  ];

  return (
    <Card color={T.green} style={{ marginBottom: 0 }}>
      <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, color: T.green, letterSpacing: "0.18em", marginBottom: 2 }}>📊 PROFIT CALCULATOR</div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Per-Order Margin Analyzer</div>
      </div>
      <div style={{ padding: "20px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          {fields.map(f => (
            <div key={f.key}>
              <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: T.dim, letterSpacing: "0.1em", marginBottom: 5 }}>{f.label}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 0, background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 5, overflow: "hidden" }}>
                <span style={{ padding: "8px 10px", fontFamily: "'Space Mono',monospace", fontSize: 11, color: f.color, borderRight: `1px solid ${T.border}`, background: T.surface3 }}>{f.prefix}</span>
                <input type="number" value={vals[f.key]} onChange={e => set(f.key, e.target.value)}
                  style={{ flex: 1, background: "transparent", border: "none", outline: "none", padding: "8px 12px", color: T.text, fontFamily: "'Space Mono',monospace", fontSize: 13, fontWeight: 700 }} />
              </div>
            </div>
          ))}
        </div>
        {/* Results */}
        <div style={{ background: profit > 0 ? "rgba(45,212,160,0.06)" : "rgba(224,90,78,0.06)", border: `1px solid ${profit > 0 ? T.green : T.red}33`, borderRadius: 6, padding: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
            {[
              { label: "Net Profit", val: `$${profit.toFixed(2)}`, color: profit > 0 ? T.green : T.red },
              { label: "Margin", val: `${margin}%`, color: parseFloat(margin) > 20 ? T.green : T.gold },
              { label: "ROAS", val: `${roas}x`, color: T.purple },
              { label: "100 orders/mo", val: `$${parseInt(monthly).toLocaleString()}`, color: T.gold },
            ].map(r => (
              <div key={r.label} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 22, fontWeight: 600, color: r.color }}>{r.val}</div>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 7.5, color: T.dim, letterSpacing: "0.08em", marginTop: 2 }}>{r.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 10, fontFamily: "'Space Mono',monospace", fontSize: 8, color: T.dim, letterSpacing: "0.06em", textAlign: "center" }}>
          {profit >= 15 ? "✅ Healthy margin — proceed to test" : profit >= 5 ? "⚠ Thin margin — reduce ad cost or increase price" : "❌ Negative margin — re-evaluate pricing or supplier"}
        </div>
      </div>
    </Card>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function WinnersDropshipping() {
  const [tab, setTab] = useState("overview");
  const [activeSupplier, setActiveSupplier] = useState(null);
  const [activeNiche, setActiveNiche] = useState(null);
  const [aiTool, setAiTool] = useState(null);
  const [form, setForm] = useState({});
  const { out, loading, run, reset } = useStream();

  const sup = SUPPLIERS.find(s => s.id === activeSupplier);
  const niche = NICHES.find(n => n.id === activeNiche);

  const AI_TOOLS = [
    {
      id: "research", icon: "🔍", label: "Product Research AI",
      color: T.gold, desc: "Find winning products for any niche",
      fields: [
        { k: "niche", label: "Niche / Market", ph: "e.g. African fashion accessories, fitness gear, home decor" },
        { k: "budget", label: "Startup Budget", ph: "e.g. $200, $500, $1,000" },
        { k: "audience", label: "Target Audience", ph: "e.g. Kenyan women 25–40, African diaspora in UK" },
        { k: "supplier", label: "Preferred Supplier", ph: "e.g. Printful, AliExpress, or any" },
      ],
      system: `You are a dropshipping expert and product researcher for the Winners Ecosystem platform, specializing in African and emerging markets. You know what sells in Kenya, Nigeria, South Africa, and the diaspora markets (UK, US, Canada). You give concrete, actionable product recommendations with real supplier links and profit calculations.`,
      prompt: (f) => `Find me 5 winning dropshipping products for:
Niche: ${f.niche || "African fashion"}
Startup Budget: ${f.budget || "$300"}
Target Audience: ${f.audience || "East African women aged 25-40"}
Preferred Supplier: ${f.supplier || "any"}

For each product provide:
🏆 Product Name + exact description
💰 Sourcing cost / Selling price / Net margin
📦 Supplier + link to find it
📈 Why it sells (demand signals, trend data)
🎯 Target customer persona
📣 Best marketing channel (TikTok/Instagram/WhatsApp)
⚡ Quick launch tip

Focus on products that work in African markets and the diaspora. Be specific with real numbers.`,
    },
    {
      id: "store", icon: "🏪", label: "Store Strategy AI",
      color: T.purple, desc: "Complete dropshipping store setup plan",
      fields: [
        { k: "storeName", label: "Store Name / Brand", ph: "e.g. AfriqStyle, KenziBaby, NairobiTech" },
        { k: "niche", label: "Store Niche", ph: "e.g. African print fashion, natural skincare" },
        { k: "market", label: "Target Market", ph: "e.g. Kenya + Nigerian diaspora in UK" },
        { k: "budget", label: "Monthly Ad Budget", ph: "e.g. $100, $300, $500" },
      ],
      system: `You are a top dropshipping consultant and e-commerce strategist specializing in African markets and the global diaspora. You build stores that generate $5K–$50K/month. You understand Meta Ads, TikTok Shop, WhatsApp Commerce, and African payment gateways (M-Pesa, Flutterwave, Paystack).`,
      prompt: (f) => `Build a complete 90-day dropshipping store strategy for:
Store: ${f.storeName || "My Store"}
Niche: ${f.niche || "African fashion"}
Market: ${f.market || "Kenya + diaspora"}
Monthly Ad Budget: ${f.budget || "$200"}

Deliver a full strategy:
🏪 STORE POSITIONING (USP, brand voice, color scheme)
🛍️ TOP 10 PRODUCTS TO LAUNCH WITH (with supplier sources)
💳 PAYMENT SETUP (M-Pesa, Stripe, Flutterwave recommendations)
📱 SOCIAL MEDIA STRATEGY (TikTok + Instagram content plan)
📣 FIRST 30-DAY AD PLAN ($${f.budget || "200"} budget allocation)
📦 FULFILLMENT WORKFLOW (order → supplier → customer)
📊 MONTH 1-2-3 REVENUE TARGETS
⚠️ TOP 3 MISTAKES TO AVOID

Include real numbers. Make it executable from day 1.`,
    },
    {
      id: "supplier", icon: "🤝", label: "Supplier Finder AI",
      color: T.green, desc: "Find the best supplier for your product",
      fields: [
        { k: "product", label: "Product You Want to Sell", ph: "e.g. custom hoodies with African prints" },
        { k: "volume", label: "Expected Monthly Volume", ph: "e.g. 50 orders, 200 orders/month" },
        { k: "quality", label: "Quality Tier", ph: "e.g. budget, mid-range, premium" },
        { k: "ships", label: "Ship To", ph: "e.g. Kenya only, USA + UK, global" },
      ],
      system: `You are a dropshipping supply chain expert. You know every major supplier platform — Printful, Gelato, AliExpress, DSers, Spocket, Zendrop, CJ Dropshipping, Modalyst, Tundra, Faire, and African-specific suppliers. You help dropshippers find the exact right supplier match for their product, volume, and market.`,
      prompt: (f) => `Find the best supplier(s) for:
Product: ${f.product || "custom printed t-shirts"}
Monthly Volume: ${f.volume || "50–100 orders"}
Quality: ${f.quality || "mid-range"}
Ships To: ${f.ships || "Kenya + global"}

Provide:
🏆 TOP 3 SUPPLIER RECOMMENDATIONS (ranked best to good)
For each supplier:
  → Platform name + how to sign up
  → Exact product category and typical pricing
  → Shipping time + tracking quality
  → Profit margin at your volume
  → Any Africa-specific advantages
  → Automation options (auto-fulfillment, DSers, etc.)

🔄 SUPPLIER BACKUP STRATEGY (what to do if main supplier runs out)
⚖️ COMPARISON TABLE (quality / speed / cost / ease)
🚀 FIRST ORDER CHECKLIST

Be specific. Include real platform names and real price ranges.`,
    },
    {
      id: "adcopy", icon: "📣", label: "Ad Copy Generator",
      color: T.red, desc: "Winning ad copy for your products",
      fields: [
        { k: "product", label: "Product Name + Description", ph: "e.g. Handmade Ankara print tote bag, premium cotton" },
        { k: "audience", label: "Target Audience", ph: "e.g. African women 25–45 who love fashion" },
        { k: "platform", label: "Ad Platform", ph: "e.g. Facebook/Instagram, TikTok, WhatsApp" },
        { k: "offer", label: "Current Offer / Promotion", ph: "e.g. 30% off, free shipping, limited stock" },
      ],
      system: `You are an expert performance marketing copywriter specializing in African consumer markets and diaspora audiences. You write ad copy that converts — hook-driven, culturally resonant, and designed for mobile-first audiences. You know what language works in Kenya, Nigeria, South Africa, and the diaspora communities.`,
      prompt: (f) => `Write winning ad copy for:
Product: ${f.product || "Ankara print tote bag"}
Audience: ${f.audience || "African women who love fashion"}
Platform: ${f.platform || "Instagram"}
Offer: ${f.offer || "30% off this week only"}

Deliver:
📣 3 x FACEBOOK/INSTAGRAM ADS
  Each includes: Headline (max 40 chars) + Primary text (3–4 lines) + CTA
  
🎬 2 x TIKTOK VIDEO SCRIPTS
  Hook (first 3 seconds) + Middle (problem/solution) + CTA

📱 3 x WHATSAPP CATALOGUE MESSAGES
  Short, conversational, includes price + scarcity

🔥 5 x SCROLL-STOPPING HOOKS
  Use these as post captions or video openers

🏷️ 10 x HASHTAG SETS
  Organized by: African market / diaspora / niche

Make the copy culturally authentic. Include local phrases where appropriate.`,
    },
  ];

  const activeTool = AI_TOOLS.find(t => t.id === aiTool);
  const handleGenerate = () => {
    if (!activeTool) return;
    run(activeTool.system, activeTool.prompt(form));
  };

  const TABS = [
    { id: "overview", label: "Overview" },
    { id: "suppliers", label: "Suppliers" },
    { id: "niches", label: "Niches" },
    { id: "calculator", label: "Calculator" },
    { id: "ai", label: "🤖 AI Tools" },
    { id: "blueprint", label: "Blueprint" },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${T.bg};}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        input:focus,textarea:focus{outline:none;border-color:rgba(201,168,76,0.45)!important;}
        input,textarea{transition:border-color 0.2s;}
        .sup-card:hover{border-color:rgba(201,168,76,0.3)!important;transform:translateY(-2px);}
        .niche-card:hover{transform:translateY(-2px);}
        .tab-btn:hover{color:${T.text}!important;}
        .ai-tool:hover{border-color:rgba(201,168,76,0.35)!important;}
        .gen-btn:hover:not(:disabled){filter:brightness(1.1);transform:translateY(-1px);}
      `}</style>

      <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: "'Syne',sans-serif" }}>

        {/* ── HEADER ── */}
        <div style={{ position: "relative", overflow: "hidden", borderBottom: `1px solid ${T.border}` }}>
          <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(43,95,142,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(43,95,142,0.025) 1px,transparent 1px)`, backgroundSize: "48px 48px", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 600, height: 200, background: "radial-gradient(ellipse,rgba(45,212,160,0.07),transparent 70%)", pointerEvents: "none" }} />
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "44px 28px 36px", textAlign: "center", position: "relative" }}>
            {/* Platform breadcrumb */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: "5px 14px", marginBottom: 20 }}>
              {["Winners Ecosystem", "Phase 4", "Winners Market", "Dropshipping Hub"].map((b, i, a) => (
                <span key={b} style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: i === a.length - 1 ? T.green : T.dim, letterSpacing: "0.1em" }}>
                  {b}{i < a.length - 1 && <span style={{ margin: "0 6px", color: T.faint }}>→</span>}
                </span>
              ))}
            </div>
            <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: T.green, marginBottom: 12 }}>
              📦 Winners Dropshipping Hub · Phase 4A V1.1
            </div>
            <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(34px,5.5vw,66px)", fontWeight: 300, lineHeight: 0.95, marginBottom: 12 }}>
              Sell without stock.<br /><em style={{ fontStyle: "italic", color: T.green }}>Profit without limits.</em>
            </h1>
            <p style={{ fontSize: 14, color: T.dim, lineHeight: 1.8, maxWidth: 540, margin: "0 auto 24px" }}>
              The Winners Ecosystem dropshipping engine connects you to global suppliers, AI product research, automated fulfillment, and profit optimization — all from one dashboard.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {["6 Supplier Integrations", "Zero Inventory Risk", "AI Product Research", "Auto-Fulfillment", "African Market Ready", "$0 to Start"].map(s => (
                <Tag key={s} color={T.green}>{s}</Tag>
              ))}
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ borderBottom: `1px solid ${T.border}`, background: T.surface, position: "sticky", top: 0, zIndex: 50 }}>
          <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 28px", display: "flex", gap: 0, overflowX: "auto" }}>
            {TABS.map(t => (
              <button key={t.id} className="tab-btn" onClick={() => setTab(t.id)} style={{
                padding: "14px 20px", background: "transparent", border: "none",
                borderBottom: `2px solid ${tab === t.id ? T.green : "transparent"}`,
                color: tab === t.id ? T.green : T.dim, cursor: "pointer",
                fontFamily: "'Space Mono',monospace", fontSize: 9.5, letterSpacing: "0.1em",
                transition: "all 0.2s", whiteSpace: "nowrap",
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 28px", display: "flex", flexDirection: "column", gap: 28 }}>

          {/* ══ OVERVIEW TAB ══════════════════════════════════════════════ */}
          {tab === "overview" && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <Label text="How Winners Dropshipping Works" />
              {/* Flow diagram */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 0, marginBottom: 28 }}>
                {[
                  { step: "01", icon: "🔍", label: "Find Product", desc: "AI research tool finds winning products for your niche", color: T.gold },
                  { step: "02", icon: "🏪", label: "List on Store", desc: "Add to your Winners Market storefront in 1 click", color: T.green },
                  { step: "03", icon: "🛒", label: "Customer Buys", desc: "Buyer purchases from your store at your price", color: T.ice },
                  { step: "04", icon: "⚡", label: "Auto-Fulfill", desc: "Order sent to supplier automatically. Zero manual work", color: T.purple },
                  { step: "05", icon: "📦", label: "Ships Direct", desc: "Supplier ships directly to your customer worldwide", color: T.orange },
                  { step: "06", icon: "💰", label: "You Keep Margin", desc: "Platform fee deducted. Profit hits your wallet.", color: T.green },
                ].map((s, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "stretch" }}>
                    <div style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, padding: "18px 14px", textAlign: "center", borderLeft: i > 0 ? "none" : undefined }}>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 7.5, color: s.color, letterSpacing: "0.15em", marginBottom: 8 }}>{s.step}</div>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>{s.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 5 }}>{s.label}</div>
                      <div style={{ fontSize: 10.5, color: T.dim, lineHeight: 1.55 }}>{s.desc}</div>
                    </div>
                    {i < 5 && <div style={{ width: 1, background: T.border, flexShrink: 0 }} />}
                  </div>
                ))}
              </div>

              {/* Key stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 28 }}>
                {[
                  { val: "$0", label: "Inventory Required", sub: "Pay only when you sell", color: T.green },
                  { val: "6", label: "Supplier Integrations", sub: "Printful · Gelato · AliExpress + more", color: T.gold },
                  { val: "25–99%", label: "Margin Range", sub: "Depending on product & supplier", color: T.purple },
                  { val: "24hr", label: "Time to First Sale", sub: "Setup → live → first order possible", color: T.ice },
                ].map(s => (
                  <Card key={s.label} color={s.color} style={{ padding: "18px 20px", textAlign: "center" }}>
                    <div style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 28, fontWeight: 600, color: s.color, marginBottom: 4 }}>{s.val}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 3 }}>{s.label}</div>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: T.dim, letterSpacing: "0.04em" }}>{s.sub}</div>
                  </Card>
                ))}
              </div>

              {/* Model comparison */}
              <Label text="Dropshipping Models — Which One Fits You?" color={T.ice} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {[
                  { model: "Print-on-Demand", icon: "🖨️", color: T.gold, best: "Creators, influencers, brands", pros: ["Custom branded products", "Zero inventory", "White-label packaging", "No design limits"], cons: ["Higher base cost", "Slower fulfillment"], revenue: "$15–45/item profit", eg: "Printful, Gelato" },
                  { model: "General Dropship", icon: "📦", color: T.red, best: "High volume, testing markets", pros: ["Millions of products", "Ultra-low cost", "Fast to test niches", "No upfront cost"], cons: ["Long shipping (10–25d)", "No branding"], revenue: "$5–30/item profit", eg: "AliExpress + DSers" },
                  { model: "Premium Dropship", icon: "⭐", color: T.purple, best: "Quality brands, US/EU buyers", pros: ["Fast shipping (3–7d)", "Vetted quality", "US/EU suppliers", "Better reviews"], cons: ["Monthly platform fee", "Less variety"], revenue: "$20–60/item profit", eg: "Spocket, Zendrop" },
                ].map(m => (
                  <Card key={m.model} color={m.color} style={{ padding: "20px 22px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <span style={{ fontSize: 24 }}>{m.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800 }}>{m.model}</div>
                        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: m.color, letterSpacing: "0.08em" }}>via {m.eg}</div>
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 7.5, color: T.dim, marginBottom: 8 }}>BEST FOR: {m.best}</div>
                    {m.pros.map(p => <div key={p} style={{ display: "flex", gap: 6, marginBottom: 4 }}><span style={{ color: T.green, fontSize: 9 }}>✓</span><span style={{ fontSize: 11, color: T.dim }}>{p}</span></div>)}
                    {m.cons.map(c => <div key={c} style={{ display: "flex", gap: 6, marginBottom: 4 }}><span style={{ color: T.red, fontSize: 9 }}>✗</span><span style={{ fontSize: 11, color: T.dim }}>{c}</span></div>)}
                    <div style={{ marginTop: 12, padding: "8px 12px", background: `${m.color}0A`, border: `1px solid ${m.color}22`, borderRadius: 4 }}>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: m.color }}>💰 {m.revenue}</div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* ══ SUPPLIERS TAB ═════════════════════════════════════════════ */}
          {tab === "suppliers" && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <Label text="Integrated Supplier Network" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
                {SUPPLIERS.map(s => (
                  <div key={s.id} className="sup-card" onClick={() => setActiveSupplier(activeSupplier === s.id ? null : s.id)}
                    style={{ background: activeSupplier === s.id ? `${s.color}0A` : T.surface, border: `1px solid ${activeSupplier === s.id ? s.color + "55" : T.border}`, borderRadius: 8, padding: "18px 20px", cursor: "pointer", transition: "all 0.22s", position: "relative", overflow: "hidden" }}>
                    {activeSupplier === s.id && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${s.color},transparent)` }} />}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 22 }}>{s.icon}</span>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 800 }}>{s.name}</div>
                          <Tag color={s.color}>{s.category}</Tag>
                        </div>
                      </div>
                      {s.autoFulfill && <Tag color={T.green}>Auto-Fulfill</Tag>}
                    </div>
                    <div style={{ fontSize: 11.5, color: T.dim, lineHeight: 1.6, marginBottom: 10 }}>{s.desc.slice(0, 80)}...</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                      {[
                        { label: "Delivery", val: s.delivery },
                        { label: "MOQ", val: s.moq },
                        { label: "Margin", val: s.margin },
                        { label: "Fee", val: s.platformFee },
                      ].map(r => (
                        <div key={r.label} style={{ background: T.surface2, borderRadius: 4, padding: "6px 9px" }}>
                          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 7, color: T.dim, letterSpacing: "0.08em" }}>{r.label}</div>
                          <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: T.text, fontWeight: 700 }}>{r.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Supplier detail */}
              {sup && (
                <Card color={sup.color} style={{ animation: "fadeIn 0.3s ease" }}>
                  <div style={{ padding: "22px 28px", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                      <span style={{ fontSize: 32 }}>{sup.icon}</span>
                      <div>
                        <div style={{ fontSize: 18, fontWeight: 800 }}>{sup.name}</div>
                        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, color: sup.color, letterSpacing: "0.1em" }}>{sup.category} · {sup.region}</div>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, color: T.dim, lineHeight: 1.7 }}>{sup.desc}</p>
                  </div>
                  <div style={{ padding: "20px 28px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
                    <div>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: T.green, letterSpacing: "0.14em", marginBottom: 10 }}>PRODUCTS</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {sup.products.map(p => <Tag key={p} color={T.ice}>{p}</Tag>)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: T.green, letterSpacing: "0.14em", marginBottom: 10 }}>PROS</div>
                      {sup.pros.map(p => <div key={p} style={{ display: "flex", gap: 6, marginBottom: 5 }}><span style={{ color: T.green }}>✓</span><span style={{ fontSize: 12, color: T.dim }}>{p}</span></div>)}
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: T.red, letterSpacing: "0.14em", marginBottom: 10 }}>CONS + BEST FOR</div>
                      {sup.cons.map(c => <div key={c} style={{ display: "flex", gap: 6, marginBottom: 5 }}><span style={{ color: T.red }}>✗</span><span style={{ fontSize: 12, color: T.dim }}>{c}</span></div>)}
                      <div style={{ marginTop: 12, padding: "10px 12px", background: `${sup.color}0A`, border: `1px solid ${sup.color}22`, borderRadius: 4 }}>
                        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: sup.color, marginBottom: 4 }}>BEST FOR</div>
                        <div style={{ fontSize: 11.5, color: T.text }}>{sup.bestFor}</div>
                      </div>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ══ NICHES TAB ════════════════════════════════════════════════ */}
          {tab === "niches" && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <Label text="Profitable Niches for African & Diaspora Markets" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10 }}>
                {NICHES.map(n => (
                  <div key={n.id} className="niche-card" onClick={() => setActiveNiche(activeNiche === n.id ? null : n.id)}
                    style={{ background: activeNiche === n.id ? `${n.color}0A` : T.surface, border: `1px solid ${activeNiche === n.id ? n.color + "55" : T.border}`, borderRadius: 8, padding: "18px 18px", cursor: "pointer", transition: "all 0.22s", position: "relative", overflow: "hidden" }}>
                    {activeNiche === n.id && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${n.color},transparent)` }} />}
                    <div style={{ fontSize: 26, marginBottom: 10 }}>{n.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 6 }}>{n.name}</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: T.dim }}>Demand</span>
                        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: n.demand === "Very High" ? T.green : T.gold }}>{n.demand}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: T.dim }}>Margin</span>
                        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: n.color }}>{n.margin}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: T.dim }}>Trend</span>
                        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: T.green }}>{n.trend}</span>
                      </div>
                    </div>
                    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {n.supplier.slice(0, 2).map(s => <Tag key={s} color={n.color}>{s}</Tag>)}
                    </div>
                  </div>
                ))}
              </div>
              {niche && (
                <div style={{ animation: "fadeIn 0.3s ease", background: T.surface, border: `1px solid ${niche.color}44`, borderRadius: 8, padding: "22px 28px", marginTop: 16, position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${niche.color},transparent)` }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                    <span style={{ fontSize: 28 }}>{niche.icon}</span>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800 }}>{niche.name}</div>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, color: niche.color, letterSpacing: "0.1em" }}>
                        Demand: {niche.demand} · Margin: {niche.margin} · Growth: {niche.trend}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: T.dim, marginBottom: 8 }}>RECOMMENDED SUPPLIERS:</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {niche.supplier.map(s => <Tag key={s} color={niche.color}>{s}</Tag>)}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ CALCULATOR TAB ════════════════════════════════════════════ */}
          {tab === "calculator" && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <Label text="Profit & Margin Calculator" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                <ProfitCalculator />
                {/* Scaling projections */}
                <Card color={T.purple} style={{ padding: "20px 24px" }}>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, color: T.purple, letterSpacing: "0.18em", marginBottom: 2 }}>📈 SCALE PROJECTIONS</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 16 }}>Revenue at Different Volumes</div>
                  {[
                    { orders: 10, label: "Starter", color: T.dim },
                    { orders: 50, label: "Growing", color: T.ice },
                    { orders: 100, label: "Established", color: T.gold },
                    { orders: 500, label: "Scaling", color: T.green },
                    { orders: 1000, label: "Empire", color: T.purple },
                  ].map(row => {
                    const profit = (row.orders * 15).toLocaleString();
                    const pct = Math.min(100, (row.orders / 1000) * 100);
                    return (
                      <div key={row.orders} style={{ marginBottom: 12 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: row.color }}>{row.orders} orders/mo — {row.label}</span>
                          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: T.text }}>~${profit} profit</span>
                        </div>
                        <div style={{ height: 5, background: T.surface2, borderRadius: 3, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${row.color},${row.color}99)`, borderRadius: 3, transition: "width 0.8s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ marginTop: 14, padding: "10px 14px", background: "rgba(155,111,255,0.06)", border: "1px solid rgba(155,111,255,0.2)", borderRadius: 5 }}>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 7.5, color: T.purple, letterSpacing: "0.08em" }}>Based on: $49 sell price · $15 margin · adjust in calculator ←</div>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ══ AI TOOLS TAB ══════════════════════════════════════════════ */}
          {tab === "ai" && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <Label text="AI-Powered Dropshipping Tools" color={T.purple} />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 20 }}>
                {AI_TOOLS.map(t => (
                  <button key={t.id} className="ai-tool" onClick={() => { setAiTool(aiTool === t.id ? null : t.id); reset(); setForm({}); }}
                    style={{ background: aiTool === t.id ? `${t.color}0A` : T.surface, border: `1px solid ${aiTool === t.id ? t.color + "55" : T.border}`, borderRadius: 8, padding: "18px 16px", cursor: "pointer", textAlign: "left", transition: "all 0.22s", position: "relative", overflow: "hidden" }}>
                    {aiTool === t.id && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,transparent,${t.color},transparent)` }} />}
                    <div style={{ fontSize: 24, marginBottom: 10 }}>{t.icon}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 800, color: aiTool === t.id ? T.text : T.text, marginBottom: 4 }}>{t.label}</div>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, color: aiTool === t.id ? t.color : T.dim, letterSpacing: "0.06em" }}>{t.desc}</div>
                  </button>
                ))}
              </div>

              {activeTool && (
                <Card color={activeTool.color} style={{ animation: "fadeIn 0.3s ease" }}>
                  <div style={{ padding: "18px 24px", borderBottom: `1px solid ${T.border}`, background: `linear-gradient(135deg,rgba(23,35,53,0.8),${T.surface})` }}>
                    <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 2 }}>{activeTool.icon} {activeTool.label}</div>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: activeTool.color, letterSpacing: "0.1em" }}>WINNERS DROPSHIPPING · AI TOOLS · Claude Powered</div>
                  </div>
                  <div style={{ padding: "20px 24px", borderBottom: `1px solid ${T.border}`, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    {activeTool.fields.map(f => (
                      <div key={f.k}>
                        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, color: T.dim, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 6 }}>{f.label}</div>
                        <input value={form[f.k] || ""} onChange={e => setForm(p => ({ ...p, [f.k]: e.target.value }))} placeholder={f.ph}
                          style={{ width: "100%", background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 5, padding: "10px 13px", color: T.text, fontFamily: "'Syne',sans-serif", fontSize: 13 }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: "14px 24px", display: "flex", justifyContent: "flex-end", borderBottom: out ? `1px solid ${T.border}` : "none" }}>
                    <button className="gen-btn" onClick={handleGenerate} disabled={loading}
                      style={{ background: loading ? T.faint : activeTool.color, color: T.bg, border: "none", borderRadius: 4, padding: "10px 28px", fontFamily: "'Space Mono',monospace", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
                      {loading ? "AI Researching..." : "Generate →"}
                    </button>
                  </div>
                  {(out || loading) && (
                    <div style={{ padding: "22px 24px", maxHeight: 480, overflowY: "auto" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: activeTool.color, animation: loading ? "blink 1s infinite" : "none" }} />
                        <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, color: activeTool.color, letterSpacing: "0.14em" }}>{loading ? "GENERATING..." : "COMPLETE"}</span>
                      </div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, lineHeight: 1.8, color: T.text, whiteSpace: "pre-wrap" }}>
                        {out.split("\n").map((ln, i) => {
                          const isH = /^[🏆💰📦📈🎯📣⚡🏪💳📱📊⚠️🔄⚖️🚀📣🎬📱🔥🏷️🔍🌍🔑🎁]/u.test(ln);
                          return <div key={i} style={{ marginBottom: isH ? 6 : 2, color: isH ? T.text : T.dim, fontWeight: isH ? 700 : 400, fontSize: isH ? 13.5 : 13 }}>{ln}</div>;
                        })}
                        {loading && <span style={{ display: "inline-block", width: 7, height: 14, background: activeTool.color, animation: "blink 0.7s step-end infinite", borderRadius: 1, verticalAlign: "middle" }} />}
                      </div>
                    </div>
                  )}
                </Card>
              )}
            </div>
          )}

          {/* ══ BLUEPRINT TAB ════════════════════════════════════════════ */}
          {tab === "blueprint" && (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <Label text="Technical Build Blueprint — Phase 4A V1.1" />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
                {/* Prisma schema */}
                <Card color={T.ice}>
                  <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, color: T.ice, letterSpacing: "0.14em" }}>PRISMA SCHEMA — NEW MODELS</div>
                  </div>
                  <div style={{ padding: "16px 18px" }}>
                    <pre style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: T.dim, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{`model DropshippingStore {
  id        String   @id @default(uuid())
  tenantId  String
  name      String
  supplier  String   // printful | gelato | ali
  status    String   // active | paused
  products  DropProduct[]
  orders    DropOrder[]
  createdAt DateTime @default(now())
}

model DropProduct {
  id           String  @id
  storeId      String
  supplierId   String  // external product ID
  title        String
  cost         Float   // supplier cost
  price        Float   // your sell price
  margin       Float   // calculated
  variants     Json    // sizes, colors
  images       Json    // image URLs
  autoFulfill  Boolean @default(true)
}

model DropOrder {
  id            String   @id
  orderId       String   // links to Order
  supplierRef   String   // supplier order ID
  status        String   // pending→shipped→done
  trackingNum   String?
  fulfilledAt   DateTime?
}`}</pre>
                  </div>
                </Card>
                {/* Backend routes */}
                <Card color={T.gold}>
                  <div style={{ padding: "14px 18px", borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, color: T.gold, letterSpacing: "0.14em" }}>BACKEND ROUTES — Server/routes/</div>
                  </div>
                  <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 7 }}>
                    {[
                      { file: "dropshippingRoutes.ts", routes: ["POST /store/create", "GET /store/:id", "POST /product/import", "POST /order/fulfill", "GET /order/:id/track"], color: T.gold },
                      { file: "supplierRoutes.ts", routes: ["GET /supplier/printful/products", "POST /supplier/printful/order", "GET /supplier/ali/search", "POST /supplier/gelato/order"], color: T.green },
                    ].map(r => (
                      <div key={r.file} style={{ background: T.surface2, borderRadius: 5, padding: "12px 14px" }}>
                        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, color: r.color, marginBottom: 7 }}>{r.file}</div>
                        {r.routes.map(rt => (
                          <div key={rt} style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: T.dim, marginBottom: 3 }}>→ {rt}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Build checklist */}
              <Card color={T.green}>
                <div style={{ padding: "14px 20px", borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, color: T.green, letterSpacing: "0.14em" }}>BUILD CHECKLIST — DROPSHIPPING ENGINE</div>
                </div>
                <div style={{ padding: "18px 20px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
                  {[
                    { phase: "V1.1 Core", items: ["Prisma schema (DropStore, DropProduct, DropOrder)", "dropshippingRoutes.ts (store CRUD)", "Printful API integration (products + orders)", "Gelato API integration", "Auto-fulfill trigger on order paid (Stripe webhook)", "Order status tracking loop"] },
                    { phase: "V1.2 AliExpress", items: ["DSers API integration", "AliExpress product search + import", "Auto-order via DSers on purchase", "Inventory sync (quantity webhook)", "Shippo shipping rate calculator", "Tracking number push to customer email"] },
                    { phase: "V1.3 Intelligence", items: ["AI product description generator (Claude)", "Profit margin AI optimizer", "AI niche + product research endpoint", "Competitor price monitoring", "Demand forecasting model", "Winning product alert notifications"] },
                  ].map(col => (
                    <div key={col.phase}>
                      <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 8.5, color: T.green, letterSpacing: "0.14em", marginBottom: 10 }}>{col.phase}</div>
                      {col.items.map(item => (
                        <div key={item} style={{ display: "flex", gap: 7, marginBottom: 7 }}>
                          <span style={{ color: T.faint, fontSize: 9, flexShrink: 0, marginTop: 1 }}>◌</span>
                          <span style={{ fontSize: 11, color: T.dim, lineHeight: 1.5 }}>{item}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
