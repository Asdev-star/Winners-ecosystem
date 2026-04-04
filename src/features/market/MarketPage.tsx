// Phase 4 Layer: Winners Market
// Unified Economic Hub with 10 Verticals, AI Tools, and Commerce Catalog
// AI supervisor: ATLAS / OMEGA

import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";
import AIInsightBanner from "../../components/ui/AIInsightBanner";
import AssistantPanel from "../../components/ui/AssistantPanel";
import ContextBar from "../../components/ui/ContextBar";
import WinnersDropshipping from "./dropshipping/WinnersDropshipping";

// ─── Design Tokens ─────────────────────────────────────────────────────────
const T = {
  bg: "var(--bg)", 
  surface: "var(--surface)", 
  surface2: "var(--surface2)", 
  surface3: "var(--surface3)",
  border: "var(--border)", 
  border2: "rgba(30,50,72,0.5)",
  gold: "var(--gold)", 
  goldDim: "rgba(201,168,76,0.08)",
  ice: "var(--ice)", 
  blue: "var(--blue)", 
  green: "var(--green)", 
  purple: "var(--purple)",
  red: "var(--red)", 
  orange: "var(--gold)", 
  pink: "var(--purple)",
  teal: "var(--green)",
  text: "var(--text)", 
  dim: "var(--text-dim)", 
  faint: "var(--border)",
};

// ─── All 10 Winners Market Verticals ───────────────────────────────────────
const VERTICALS = [
  {
    id: "commerce", icon: "🛒", label: "Commerce Hub",
    color: T.green, badge: "V1 · LIVE",
    tagline: "Products · Dropshipping · Vendors",
    desc: "The original marketplace engine. Digital downloads, physical products, print-on-demand, and a full multi-vendor storefront system. Like Shopify + Amazon in one place.",
    revenue: ["10–20% transaction commission", "Vendor subscriptions $15–$49/mo", "Featured listing fees", "Print-on-demand margins"],
    features: ["Product catalog (digital + physical)", "Cart + Stripe checkout", "Vendor onboarding & dashboard", "Printful / Gelato / AliExpress integration", "Order management + tracking", "AI product description generator"],
    status: "live", phase: "4A", path: "/market/commerce",
    stack: ["Stripe", "Printful API", "Shippo", "Cloudinary"],
  },
  {
    id: "digitalmarketing", icon: "📣", label: "Digital Marketing Hub",
    color: T.gold, badge: "V2 · LIVE",
    tagline: "Ads · SEO · Campaigns · Analytics",
    desc: "A full-service digital marketing platform. Sell marketing services, run paid ad campaigns, offer SEO audits, social media management packages, and email marketing automation — all inside the ecosystem.",
    revenue: ["Marketing package sales 20% cut", "Subscription tools $29–$99/mo", "Ad budget management fee 5–10%", "White-label marketing tools"],
    features: ["Service marketplace for marketing agencies", "Ad campaign builder (Meta, Google, TikTok)", "SEO audit tool + keyword tracker", "Social media scheduler + analytics", "Email marketing automation suite", "AI copywriting assistant", "Lead generation tools", "Client reporting dashboard"],
    status: "live", phase: "4B", path: "/market/digital-marketing",
    stack: ["Meta Ads API", "Google Ads API", "Resend", "Claude AI"],
  },
  {
    id: "streaming", icon: "📺", label: "Winners Stream",
    color: T.red, badge: "V2 · LIVE",
    tagline: "Live · VOD · Creator Monetization",
    desc: "A full streaming platform for creators, educators, musicians, and entertainers. Live streams, VOD content, pay-per-view events, channel subscriptions, and tipping — all monetized through the ecosystem.",
    revenue: ["Channel subscription 15% cut", "Pay-per-view event fees", "Super Chat / tipping 10% cut", "Ad revenue sharing", "VOD rental & purchase commission"],
    features: ["Live streaming with chat", "VOD upload + hosting", "Pay-per-view events", "Channel subscription system", "Super Chat tipping", "Creator analytics dashboard", "Multi-quality streaming (480p/720p/1080p)", "Replay archive + clip creation", "Scheduled stream calendar"],
    status: "live", phase: "4C", path: "/market/stream",
    stack: ["Mux/Cloudflare Stream", "HLS.js", "WebRTC", "Socket.io"],
  },
  {
    id: "trading", icon: "📈", label: "Winners Trading",
    color: T.purple, badge: "V3 · LIVE",
    tagline: "Stocks · Crypto · Forex · Copy Trading",
    desc: "An educational trading platform + paper trading simulator. Learn real market strategies, practice with virtual portfolios, follow top traders' moves, and eventually access real broker integrations.",
    revenue: ["Trading course subscriptions", "Premium signals $49–$149/mo", "Copy trading fee 10–20%", "Data provider API resale", "Broker referral commissions"],
    features: ["Real-time market data (stocks, crypto, forex)", "Paper trading simulator", "Strategy backtesting engine", "Copy trading — follow expert portfolios", "Trading signals & alerts", "Market analysis AI assistant", "Risk management calculator", "Community trading challenges", "Broker API integration (Alpaca, Interactive Brokers)"],
    status: "live", phase: "4D", path: "/market/trading",
    stack: ["Alpaca API", "Polygon.io", "TradingView charts", "WebSocket"],
  },
  {
    id: "bizplan", icon: "📋", label: "Business Launcher",
    color: T.ice, badge: "V2 · LIVE",
    tagline: "Business Plans · Strategy · Launch Kits",
    desc: "Everything you need to start and grow a business — AI-powered business plan generator, market research tools, financial projections, pitch deck builder, and legal document templates.",
    revenue: ["Business plan generation credits", "Premium plan templates $29–$99", "Investor pitch review service", "Legal template subscriptions", "Launch kit bundles $49–$199"],
    features: ["AI business plan generator (full document)", "Market size & competitor analysis", "Financial projection builder", "Pitch deck slide generator", "Legal templates (NDA, contracts, MOUs)", "Brand name & domain checker", "Revenue model calculator", "Startup cost estimator", "Investor-ready export (PDF, PPTX, DOCX)"],
    status: "live", phase: "4E", path: "/market/business-launcher",
    stack: ["Claude API", "jsPDF", "Chart.js", "OpenCorporates"],
  },
  {
    id: "cv", icon: "📄", label: "CV & Career Tools",
    color: T.teal, badge: "V2 · LIVE",
    tagline: "CV Generator · Cover Letters · Portfolio",
    desc: "Professional CV and career document generation powered by AI. Build ATS-optimized resumes, custom cover letters, LinkedIn profiles, and professional portfolios.",
    revenue: ["CV generation credits", "Premium templates $9–$29", "Career coach service marketplace", "LinkedIn optimization service", "Bulk CV builder for agencies"],
    features: ["AI CV generator (15+ professional templates)", "ATS score checker + optimization", "Cover letter AI generator", "LinkedIn profile optimizer", "Professional bio writer", "Skills assessment + gap analysis", "Portfolio website builder", "Interview preparation AI coach", "One-click export (PDF, DOCX, JSON)"],
    status: "live", phase: "4F", path: "/market/cv-tools",
    stack: ["Claude API", "Puppeteer PDF", "React-PDF", "LinkedIn API"],
  },
  {
    id: "realestate", icon: "🏠", label: "Winners Property",
    color: T.orange, badge: "V3 · LIVE",
    tagline: "Real Estate · Listings · Investment",
    desc: "A property marketplace for African and diaspora markets. List properties for sale and rent, connect with real estate agents, access mortgage calculators, and discover investment opportunities.",
    revenue: ["Property listing fees", "Agent subscription plans", "Mortgage referral commission", "Investment deal flow fees", "Premium listing placement"],
    features: ["Property listings (buy/rent/invest)", "Agent + developer profiles", "Virtual tour integration", "Mortgage + affordability calculator", "Investment ROI calculator", "Neighborhood analytics", "Legal due diligence checklist", "Property alert notifications", "Map-based search (Mapbox)"],
    status: "live", phase: "4G", path: "/market/property",
    stack: ["Mapbox", "Stripe", "Cloudinary", "Calendar API"],
  },
  {
    id: "events", icon: "🎟", label: "Winners Events",
    color: T.pink, badge: "V2 · LIVE",
    tagline: "Events · Tickets · NFT Passes",
    desc: "Create, host, and monetize online and physical events. Conference tickets, workshop registrations, webinar access, live event streaming, and blockchain-verified NFT tickets.",
    revenue: ["Ticket sales 5–10% commission", "Event creation subscription", "Premium event features", "Sponsorship marketplace", "NFT ticket minting fees"],
    features: ["Event creation + management", "Ticket tiers (free, paid, VIP)", "QR code ticket scanning", "Live streaming integration", "Attendee networking (matchmaking)", "Event analytics dashboard", "Sponsorship packages", "NFT ticket minting", "Calendar integration + reminders"],
    status: "live", phase: "4H", path: "/market/events",
    stack: ["Stripe", "QRCode.js", "Mux", "Polygon blockchain"],
  },
  {
    id: "health", icon: "💪", label: "Winners Health",
    color: "var(--green)", badge: "V3 · LIVE",
    tagline: "Fitness · Nutrition · Mental Wellness",
    desc: "A wellness marketplace where certified coaches sell workout programs, nutrition plans, and mental health content. AI-powered workout tracking, health analytics, and telehealth booking.",
    revenue: ["Coach program sales 20% cut", "Wellness subscription plans", "Telehealth booking commission", "Supplement referral sales", "Corporate wellness packages"],
    features: ["Coach marketplace (fitness, nutrition, mental health)", "AI workout plan generator", "Nutrition tracker + meal planner", "Progress tracking + body metrics", "Telehealth appointment booking", "Mindfulness + meditation library", "Group challenges + leaderboards", "Wearable device sync (Apple Health, Fitbit)", "Corporate wellness dashboard"],
    status: "live", phase: "4I", path: "/market/health",
    stack: ["HealthKit API", "Google Fit", "Stripe", "Claude AI"],
  },
  {
    id: "fintech", icon: "🏦", label: "Winners Finance",
    color: "var(--gold)", badge: "V3 · LIVE",
    tagline: "Payments · Savings · Micro-Loans",
    desc: "Embedded fintech for the ecosystem. Group savings (chamas), micro-investment pools, cross-border payment rails optimized for Africa, and buy-now-pay-later for platform purchases.",
    revenue: ["Payment processing 1–2%", "Savings pool management fee", "Micro-loan interest 5–15%", "BNPL service fee", "Financial product referrals"],
    features: ["Group savings (chama/investment clubs)", "Cross-border payments (M-Pesa, Flutterwave)", "Micro-investment pools", "Buy-now-pay-later for ecosystem", "Budget tracker + financial goals", "Financial literacy courses", "Credit score builder", "Insurance marketplace", "Remittance optimization engine"],
    status: "live", phase: "4J", path: "/market/finance",
    stack: ["M-Pesa API", "Flutterwave", "Stripe", "Plaid"],
  }
];

// ─── AI Tool Types ──────────────────────────────────────────────────────────
const AI_TOOLS = ["Business Plan Generator", "CV Generator", "Marketing Strategy", "Pitch Deck Outline"] as const;
type AiToolKey = (typeof AI_TOOLS)[number];

// ─── Components ────────────────────────────────────────────────────────────

function SectionLabel({text, color=T.gold}: {text: string, color?: string}) {
  return (
    <div style={{fontFamily:"'Space Mono',monospace", fontSize:8.5, letterSpacing:"0.25em",
      textTransform:"uppercase", color, marginBottom:14, display:"flex", alignItems:"center", gap:12}}>
      <div style={{height:1, width:24, background:`linear-gradient(90deg,${color},transparent)`}}/>
      {text}
      <div style={{height:1, flex:1, background:`linear-gradient(90deg,transparent,${T.faint})`}}/>
    </div>
  );
}

function VerticalCard({v, isActive, onClick}: {v: any, isActive: boolean, onClick: () => void}) {
  return (
    <div onClick={onClick} style={{
      background: isActive ? `${v.color}0C` : T.surface,
      border:`1px solid ${isActive ? v.color+"55" : T.border}`,
      borderRadius:16, padding:"18px 20px", cursor:"pointer",
      transition:"all 0.22s", position:"relative", overflow:"hidden",
      transform: isActive ? "translateY(-2px)" : "none",
      boxShadow: isActive ? `0 8px 32px ${v.color}18` : "none",
    }}>
      <div style={{position:"absolute",top:0,left:0,right:0,height:2,
        background:`linear-gradient(90deg,transparent,${v.color},transparent)`,
        opacity: isActive ? 1 : 0, transition:"opacity 0.2s"}}/>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
        <span style={{fontSize:26}}>{v.icon}</span>
        <span style={{fontFamily:"'Space Mono',monospace",fontSize:7.5,letterSpacing:"0.1em",
          padding:"3px 8px",borderRadius:2,
          background:`${v.color}14`,border:`1px solid ${v.color}33`,color:v.color}}>
          {v.badge}
        </span>
      </div>
      <div style={{fontSize:13.5,fontWeight:800,color:T.text,marginBottom:4}}>{v.label}</div>
      <div style={{fontFamily:"'Space Mono',monospace",fontSize:8.5,color:v.color,letterSpacing:"0.06em",marginBottom:8}}>
        {v.tagline}
      </div>
      <div style={{fontSize:11.5,color:T.dim,lineHeight:1.6}}>{v.desc.slice(0,90)}...</div>
    </div>
  );
}

// ─── Main Unified Market Page ────────────────────────────────────────────────

export default function MarketPage() {
  const navigate = useNavigate();
  const { vertical } = useParams();
  const { token } = useAuthStore();
  
  const [activeVertical, setActiveVertical] = useState<string | null>(vertical || null);
  const [activeTool, setActiveTool] = useState<AiToolKey | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productCategory, setProductCategory] = useState("all");

  useEffect(() => {
    if (vertical) {
      setActiveVertical(vertical);
    } else {
      setActiveVertical(null);
    }
  }, [vertical]);

  const currentV = useMemo(() => VERTICALS.find(v => v.id === activeVertical || v.path.includes(activeVertical || '')), [activeVertical]);

  // AI Streaming Logic
  const runAI = useCallback(async (tool: AiToolKey) => {
    setOutput(""); setStreaming(true);
    const apiBase = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";
    
    const prompts: Record<AiToolKey, { sys: string, user: string }> = {
      "Business Plan Generator": {
        sys: "You are ATLAS, the Winners Market AI Business Strategist. Create professional, realistic business plans for the African market.",
        user: `Generate a one-page business plan for: ${formData.idea}\nMarket: ${formData.market}\nBudget: ${formData.budget}\nModel: ${formData.model}`
      },
      "CV Generator": {
        sys: "You are the Winners Career AI. Build professional CV content optimized for Applicant Tracking Systems (ATS).",
        user: `Name: ${formData.name}\nTarget: ${formData.jobTarget}\nExperience: ${formData.experience}\nSkills: ${formData.skills}\nEducation: ${formData.education}`
      },
      "Marketing Strategy": {
        sys: "You are the Winners Marketing AI. Create low-budget, high-impact marketing strategies for African SMEs.",
        user: `Business: ${formData.idea}\nAudience: ${formData.market}\nBudget: ${formData.budget}\nChannels: ${formData.channels}`
      },
      "Pitch Deck Outline": {
        sys: "You are the Winners Venture AI. Create compelling pitch deck outlines for startups.",
        user: `Idea: ${formData.idea}\nStage: ${formData.stage}\nAmount: ${formData.budget}\nTraction: ${formData.traction}`
      }
    };

    const { sys, user } = prompts[tool];

    try {
      const res = await fetch(`${apiBase}/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: `${sys}\n\nUser request:\n${user}`,
          assistant: "atlas",
          history: [],
        }),
      });
      if (!res.body) throw new Error("Missing response stream");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n"); buf = lines.pop() || "";
        for (const ln of lines) {
          if (!ln.startsWith("data: ")) continue;
          const raw = ln.slice(6).trim();
          if (raw === "[DONE]") continue;
          try {
            const p = JSON.parse(raw);
            if (p?.type === "text" && p.text) setOutput(o => o + p.text);
          } catch {}
        }
      }
    } catch (e) {
      setOutput("⚠ Generation failed. Please check your connection and try again.");
    } finally {
      setStreaming(false);
    }
  }, [formData, token]);

  const toolFields: Record<AiToolKey, Array<{ key: string, label: string, placeholder: string }>> = {
    "Business Plan Generator": [
      {key:"idea", label:"Business Idea", placeholder:"Tutoring platform for STEM in Kenya"},
      {key:"market", label:"Target Market", placeholder:"Students aged 13–22"},
      {key:"budget", label:"Budget", placeholder:"$500"},
      {key:"model", label:"Model", placeholder:"Subscription"}
    ],
    "CV Generator": [
      {key:"name", label:"Full Name", placeholder:"John Doe"},
      {key:"jobTarget", label:"Target Role", placeholder:"Software Engineer"},
      {key:"experience", label:"Experience", placeholder:"3 years in web development"},
      {key:"skills", label:"Skills", placeholder:"React, Node.js, Python"}
    ],
    "Marketing Strategy": [
      {key:"idea", label:"Product", placeholder:"E-commerce app"},
      {key:"market", label:"Audience", placeholder:"Young professionals"},
      {key:"budget", label:"Monthly Budget", placeholder:"$200"},
      {key:"channels", label:"Channels", placeholder:"Instagram, TikTok"}
    ],
    "Pitch Deck Outline": [
      {key:"idea", label:"Startup Name", placeholder:"WinnersPay"},
      {key:"stage", label:"Stage", placeholder:"Seed"},
      {key:"budget", label:"Amount Raising", placeholder:"$500,000"},
      {key:"traction", label:"Traction", placeholder:"1,000 users"}
    ]
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, padding: "0 0 80px", fontFamily: "'Syne', sans-serif" }}>
      
      {/* ── HERO HEADER ──────────────────────────────────────────────────── */}
      <div style={{ position: "relative", overflow: "hidden", padding: "60px 24px 44px", textAlign: "center", borderBottom: `1px solid ${T.border}`, background: `linear-gradient(180deg, ${T.surface} 0%, ${T.bg} 100%)` }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: `linear-gradient(rgba(43,95,142,0.02) 1px,transparent 1px),linear-gradient(90deg,rgba(43,95,142,0.02) 1px,transparent 1px)`, backgroundSize: "40px 40px" }} />
        
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, letterSpacing: "0.18em", color: T.green }}>● CORE LIVE</span>
          <span style={{ color: T.faint }}>·</span>
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, letterSpacing: "0.18em", color: T.green }}>● COMMUNITY LIVE</span>
          <span style={{ color: T.faint }}>·</span>
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, letterSpacing: "0.18em", color: T.gold }}>● MARKET LIVE</span>
        </div>

        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 800, lineHeight: 1.05, marginBottom: 14, letterSpacing: "-0.04em" }}>
          {!vertical ? (
            <>Not a market.<br /><em style={{ fontStyle: "italic", color: T.gold }}>An economic empire.</em></>
          ) : (
            currentV?.label
          )}
        </h1>
        
        <p style={{ fontSize: 14, color: T.dim, lineHeight: 1.8, maxWidth: 580, margin: "0 auto 28px" }}>
          {!vertical 
            ? "Winners Market is a multi-vertical economic engine where you can trade, sell, build, and grow across 10 independent industries under one identity."
            : currentV?.desc}
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          {vertical ? (
            <button onClick={() => navigate('/market')} style={{ background: T.surface2, border: `1px solid ${T.border}`, padding: '10px 20px', borderRadius: 14, color: T.gold, cursor: 'pointer', fontFamily: 'Space Mono', fontSize: 11, textTransform: 'uppercase' }}>
              ← Back to Dashboard
            </button>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
              {["10 Verticals", "AI-Powered", "Revenue Day 1", "African Market First"].map(s => (
                <span key={s} style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, letterSpacing: "0.06em", color: T.text, background: T.surface, border: `1px solid ${T.border}`, padding: "5px 12px", borderRadius: 20 }}>{s}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 24px" }}>
        <ContextBar platform="market" />

        {!vertical ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 48, marginTop: 40 }}>
            {/* 10 Verticals Grid */}
            <div>
              <SectionLabel text="Economic Foundation — 10 Market Verticals" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
                {VERTICALS.map(v => (
                  <VerticalCard key={v.id} v={v} isActive={false} onClick={() => navigate(v.path)} />
                ))}
              </div>
            </div>

            {/* AI Tools Promo */}
            <div>
              <SectionLabel text="AI Business Acceleration" />
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                {AI_TOOLS.map(tool => (
                  <div key={tool} onClick={() => { setActiveTool(tool); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, cursor: "pointer", transition: "all 0.2s" }}>
                    <div style={{ fontSize: 32, marginBottom: 12 }}>{tool === "Business Plan Generator" ? "📋" : tool === "CV Generator" ? "📄" : tool === "Marketing Strategy" ? "📣" : "🎯"}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{tool}</div>
                    <div style={{ fontSize: 12, color: T.dim }}>Generate professional assets in seconds with ATLAS AI.</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 20 }}>
            {vertical === 'dropshipping' ? (
              <WinnersDropshipping />
            ) : (
              <div style={{ background: T.surface, border: `1px solid ${currentV?.color}33`, borderRadius: 18, overflow: 'hidden' }}>
                <div style={{ padding: 40, borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                      <div style={{ fontSize: 64 }}>{currentV?.icon}</div>
                      <div>
                        <h2 style={{ fontSize: 32, fontWeight: 800 }}>{currentV?.label}</h2>
                        <div style={{ fontFamily: 'Space Mono', color: currentV?.color, fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                          Phase {currentV?.phase} · {currentV?.tagline}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <span style={{ background: `${currentV?.color}15`, color: currentV?.color, border: `1px solid ${currentV?.color}33`, padding: '6px 14px', borderRadius: 8, fontSize: 11, fontFamily: 'Space Mono' }}>
                        {currentV?.badge}
                      </span>
                    </div>
                  </div>

                  <p style={{ color: T.dim, fontSize: 15, lineHeight: 1.7, maxWidth: 800, marginBottom: 32 }}>
                    {currentV?.desc}
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                    <div style={{ background: T.surface2, padding: 24, borderRadius: 16, border: `1px solid ${T.border}` }}>
                      <h4 style={{ color: currentV?.color, fontSize: 12, fontFamily: 'Space Mono', marginBottom: 16, letterSpacing: '0.1em' }}>CORE FEATURES</h4>
                      {currentV?.features.map(f => (
                        <div key={f} style={{ fontSize: 13, marginBottom: 10, display: 'flex', gap: 10, color: T.dim }}>
                          <span style={{ color: currentV?.color }}>→</span> {f}
                        </div>
                      ))}
                    </div>
                    <div style={{ background: T.surface2, padding: 24, borderRadius: 16, border: `1px solid ${T.border}` }}>
                      <h4 style={{ color: T.gold, fontSize: 12, fontFamily: 'Space Mono', marginBottom: 16, letterSpacing: '0.1em' }}>REVENUE MODEL</h4>
                      {currentV?.revenue.map(r => (
                        <div key={r} style={{ fontSize: 13, marginBottom: 10, display: 'flex', gap: 10, color: T.dim }}>
                          <span style={{ color: T.gold }}>$</span> {r}
                        </div>
                      ))}
                    </div>
                    <div style={{ background: T.surface2, padding: 24, borderRadius: 16, border: `1px solid ${T.border}` }}>
                      <h4 style={{ color: T.ice, fontSize: 12, fontFamily: 'Space Mono', marginBottom: 16, letterSpacing: '0.1em' }}>TECH STACK</h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {currentV?.stack.map(s => (
                          <span key={s} style={{ background: T.bg, border: `1px solid ${T.border}`, padding: '4px 10px', borderRadius: 6, fontSize: 10, fontFamily: 'Space Mono', color: T.ice }}>{s}</span>
                        ))}
                      </div>
                      <div style={{ marginTop: 24, padding: 16, background: `${currentV?.color}08`, border: `1px solid ${currentV?.color}15`, borderRadius: 10 }}>
                         <div style={{ fontSize: 10, color: currentV?.color, fontWeight: 700, marginBottom: 6 }}>AGENTIC LOOP</div>
                         <div style={{ fontSize: 11, color: T.dim, lineHeight: 1.5 }}>AI-driven optimization and cross-layer value transfer active for this vertical.</div>
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: 40, display: 'flex', gap: 16 }}>
                    <button onClick={() => navigate(currentV?.path || '/market')} style={{ background: currentV?.color, border: 'none', padding: '14px 40px', borderRadius: 14, color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>
                      Enter {currentV?.label} Portal
                    </button>
                    {currentV?.id === 'commerce' && (
                       <button onClick={() => navigate('/market/dropshipping')} style={{ background: T.surface2, border: `1px solid ${T.border}`, padding: '14px 40px', borderRadius: 14, color: T.text, fontWeight: 800, cursor: 'pointer', fontSize: 14 }}>
                        View Dropshipping
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI Tools Section (Persistent at bottom for now or contextual) */}
        {activeTool && (
          <div style={{ marginTop: 60, animation: "fadeIn 0.4s ease" }}>
            <SectionLabel text={`AI TOOL: ${activeTool}`} />
            <div style={{ background: T.surface, border: `1px solid ${T.gold}44`, borderRadius: 20, overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                {/* Inputs */}
                <div style={{ padding: 40, background: T.surface }}>
                   <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                     {toolFields[activeTool].map(f => (
                       <div key={f.key}>
                         <label style={{ display: 'block', fontSize: 11, fontFamily: 'Space Mono', color: T.dim, marginBottom: 8, textTransform: 'uppercase' }}>{f.label}</label>
                         <input 
                           type="text" 
                           value={formData[f.key] || ""} 
                           onChange={e => setFormData(d => ({ ...d, [f.key]: e.target.value }))}
                           placeholder={f.placeholder}
                           style={{ width: '100%', background: T.surface2, border: `1px solid ${T.border}`, padding: '12px 16px', borderRadius: 12, color: T.text, fontSize: 14 }}
                         />
                       </div>
                     ))}
                   </div>
                   <button 
                     onClick={() => runAI(activeTool)} 
                     disabled={streaming}
                     style={{ marginTop: 32, width: '100%', background: T.gold, border: 'none', padding: '16px', borderRadius: 14, color: T.bg, fontWeight: 800, cursor: 'pointer', opacity: streaming ? 0.6 : 1 }}
                   >
                     {streaming ? "ATLAS is thinking..." : "Generate with AI →"}
                   </button>
                </div>

                {/* Output */}
                <div style={{ padding: 40, background: T.surface2, borderLeft: `1px solid ${T.border}`, minHeight: 400 }}>
                   {!output && !streaming ? (
                     <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.dim, textAlign: 'center' }}>
                       <div>
                         <div style={{ fontSize: 40, marginBottom: 16 }}>🤖</div>
                         <p>Fill in the details and click generate to see the AI output here.</p>
                       </div>
                     </div>
                   ) : (
                     <div style={{ whiteSpace: 'pre-wrap', fontSize: 14, lineHeight: 1.8, color: T.text }}>
                       {output}
                     </div>
                   )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AssistantPanel assistant="atlas" />
    </div>
  );
}
