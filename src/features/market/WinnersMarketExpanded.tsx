// Phase 4 Layer: Winners Market
// Complete Market Hub with 10 Verticals + AI Tools
// Build sequence: 4A → 4B → 4C → 4E → 4F → 4D → 4G → 4H → 4I → 4J

import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";
import AIInsightBanner from "../../components/ui/AIInsightBanner";
import AssistantPanel from "../../components/ui/AssistantPanel";

// ─── Design Tokens ─────────────────────────────────────────────────────────
// Using CSS variables from global design system
const T = {
  bg: "var(--bg)", 
  surface: "var(--surface)", 
  surface2: "var(--surface2)", 
  surface3: "var(--surface3)",
  border: "var(--border)", 
  border2: "rgba(30,50,72,0.5)",
  gold: "var(--gold)", 
  gold2: "var(--gold)", 
  gold3: "var(--gold)", 
  goldDim: "rgba(201,168,76,0.08)",
  ice: "var(--ice)", 
  blue: "var(--blue)", 
  green: "var(--green)", 
  purple: "var(--purple)",
  red: "var(--red)", 
  orange: "var(--gold)", 
  teal: "var(--green)", 
  pink: "var(--purple)",
  text: "var(--text)", 
  dim: "var(--text-dim)", 
  faint: "var(--border)",
};

// ─── All 10 Winners Market Verticals ───────────────────────────────────────
const VERTICALS = [
  {
    id:"commerce", icon:"🛒", label:"Commerce Hub",
    color:T.green, badge:"V1 · Core",
    tagline:"Products · Dropshipping · Vendors",
    desc:"The original marketplace engine. Digital downloads, physical products, print-on-demand, and a full multi-vendor storefront system. Like Shopify + Amazon in one place.",
    revenue:["10–20% transaction commission","Vendor subscriptions $15–$49/mo","Featured listing fees","Print-on-demand margins"],
    features:["Product catalog (digital + physical)","Cart + Stripe checkout","Vendor onboarding & dashboard","Printful / Gelato / AliExpress integration","Order management + tracking","AI product description generator"],
    status:"planned", phase:"4A",
    stack:["Stripe","Printful API","Shippo","Cloudinary"],
  },
  {
    id:"digitalmarketing", icon:"📣", label:"Digital Marketing Hub",
    color:T.gold, badge:"V2 · Expansion",
    tagline:"Ads · SEO · Campaigns · Analytics",
    desc:"A full-service digital marketing platform. Sell marketing services, run paid ad campaigns, offer SEO audits, social media management packages, and email marketing automation — all inside the ecosystem.",
    revenue:["Marketing package sales 20% cut","Subscription tools $29–$99/mo","Ad budget management fee 5–10%","White-label marketing tools"],
    features:["Service marketplace for marketing agencies","Ad campaign builder (Meta, Google, TikTok)","SEO audit tool + keyword tracker","Social media scheduler + analytics","Email marketing automation suite","AI copywriting assistant","Lead generation tools","Client reporting dashboard"],
    status:"planned", phase:"4B",
    stack:["Meta Ads API","Google Ads API","Resend","Claude AI"],
  },
  {
    id:"streaming", icon:"📺", label:"Winners Stream",
    color:T.red, badge:"V2 · Expansion",
    tagline:"Live · VOD · Creator Monetization",
    desc:"A full streaming platform for creators, educators, musicians, and entertainers. Live streams, VOD content, pay-per-view events, channel subscriptions, and tipping — all monetized through the ecosystem.",
    revenue:["Channel subscription 15% cut","Pay-per-view event fees","Super Chat / tipping 10% cut","Ad revenue sharing","VOD rental & purchase commission"],
    features:["Live streaming with chat","VOD upload + hosting","Pay-per-view events","Channel subscription system","Super Chat tipping","Creator analytics dashboard","Multi-quality streaming (480p/720p/1080p)","Replay archive + clip creation","Scheduled stream calendar"],
    status:"planned", phase:"4C",
    stack:["Mux/Cloudflare Stream","HLS.js","WebRTC","Socket.io"],
  },
  {
    id:"trading", icon:"📈", label:"Winners Trading",
    color:T.purple, badge:"V3 · Advanced",
    tagline:"Stocks · Crypto · Forex · Copy Trading",
    desc:"An educational trading platform + paper trading simulator. Learn real market strategies, practice with virtual portfolios, follow top traders' moves, and eventually access real broker integrations. Knowledge before capital.",
    revenue:["Trading course subscriptions","Premium signals $49–$149/mo","Copy trading fee 10–20%","Data provider API resale","Broker referral commissions"],
    features:["Real-time market data (stocks, crypto, forex)","Paper trading simulator","Strategy backtesting engine","Copy trading — follow expert portfolios","Trading signals & alerts","Market analysis AI assistant","Risk management calculator","Community trading challenges","Broker API integration (Alpaca, Interactive Brokers)"],
    status:"planned", phase:"4D",
    stack:["Alpaca API","Polygon.io","TradingView charts","WebSocket"],
  },
  {
    id:"bizplan", icon:"📋", label:"Business Launcher",
    color:T.ice, badge:"V2 · Tools",
    tagline:"Business Plans · Strategy · Launch Kits",
    desc:"Everything you need to start and grow a business — AI-powered business plan generator, market research tools, financial projections, pitch deck builder, and legal document templates. From idea to investor-ready in minutes.",
    revenue:["Business plan generation credits","Premium plan templates $29–$99","Investor pitch review service","Legal template subscriptions","Launch kit bundles $49–$199"],
    features:["AI business plan generator (full document)","Market size & competitor analysis","Financial projection builder","Pitch deck slide generator","Legal templates (NDA, contracts, MOUs)","Brand name & domain checker","Revenue model calculator","Startup cost estimator","Investor-ready export (PDF, PPTX, DOCX)"],
    status:"planned", phase:"4E",
    stack:["Claude API","jsPDF","Chart.js","OpenCorporates"],
  },
  {
    id:"cv", icon:"📄", label:"CV & Career Tools",
    color:T.teal, badge:"V2 · Tools",
    tagline:"CV Generator · Cover Letters · Portfolio",
    desc:"Professional CV and career document generation powered by AI. Build ATS-optimized resumes, custom cover letters, LinkedIn profiles, and professional portfolios in the Winners Ecosystem design language.",
    revenue:["CV generation credits","Premium templates $9–$29","Career coach service marketplace","LinkedIn optimization service","Bulk CV builder for agencies"],
    features:["AI CV generator (15+ professional templates)","ATS score checker + optimization","Cover letter AI generator","LinkedIn profile optimizer","Professional bio writer","Skills assessment + gap analysis","Portfolio website builder","Interview preparation AI coach","One-click export (PDF, DOCX, JSON)"],
    status:"planned", phase:"4F",
    stack:["Claude API","Puppeteer PDF","React-PDF","LinkedIn API"],
  },
  {
    id:"realestate", icon:"🏠", label:"Winners Property",
    color:T.orange, badge:"V3 · Advanced",
    tagline:"Real Estate · Listings · Investment",
    desc:"A property marketplace for African and diaspora markets. List properties for sale and rent, connect with real estate agents, access mortgage calculators, and discover investment opportunities — starting with East Africa.",
    revenue:["Property listing fees","Agent subscription plans","Mortgage referral commission","Investment deal flow fees","Premium listing placement"],
    features:["Property listings (buy/rent/invest)","Agent + developer profiles","Virtual tour integration","Mortgage + affordability calculator","Investment ROI calculator","Neighborhood analytics","Legal due diligence checklist","Property alert notifications","Map-based search (Mapbox)"],
    status:"planned", phase:"4G",
    stack:["Mapbox","Stripe","Cloudinary","Calendar API"],
  },
  {
    id:"events", icon:"🎟", label:"Winners Events",
    color:T.pink, badge:"V2 · Expansion",
    tagline:"Events · Tickets · NFT Passes",
    desc:"Create, host, and monetize online and physical events. Conference tickets, workshop registrations, webinar access, live event streaming, and blockchain-verified NFT tickets — all from one dashboard.",
    revenue:["Ticket sales 5–10% commission","Event creation subscription","Premium event features","Sponsorship marketplace","NFT ticket minting fees"],
    features:["Event creation + management","Ticket tiers (free, paid, VIP)","QR code ticket scanning","Live streaming integration","Attendee networking (matchmaking)","Event analytics dashboard","Sponsorship packages","NFT ticket minting","Calendar integration + reminders"],
    status:"planned", phase:"4H",
    stack:["Stripe","QRCode.js","Mux","Polygon blockchain"],
  },
  {
    id:"health", icon:"💪", label:"Winners Health",
    color:"var(--green)", badge:"V3 · Advanced",
    tagline:"Fitness · Nutrition · Mental Wellness",
    desc:"A wellness marketplace where certified coaches sell workout programs, nutrition plans, and mental health content. AI-powered workout tracking, health analytics, and telehealth booking — built for the African wellness market.",
    revenue:["Coach program sales 20% cut","Wellness subscription plans","Telehealth booking commission","Supplement referral sales","Corporate wellness packages"],
    features:["Coach marketplace (fitness, nutrition, mental health)","AI workout plan generator","Nutrition tracker + meal planner","Progress tracking + body metrics","Telehealth appointment booking","Mindfulness + meditation library","Group challenges + leaderboards","Wearable device sync (Apple Health, Fitbit)","Corporate wellness dashboard"],
    status:"planned", phase:"4I",
    stack:["HealthKit API","Google Fit","Stripe","Claude AI"],
  },
  {
    id:"fintech", icon:"🏦", label:"Winners Finance",
    color:"var(--gold)", badge:"V3 · Advanced",
    tagline:"Payments · Savings · Micro-Loans",
    desc:"Embedded fintech for the ecosystem. Group savings (chamas), micro-investment pools, cross-border payment rails optimized for Africa, buy-now-pay-later for platform purchases, and financial literacy courses.",
    revenue:["Payment processing 1–2%","Savings pool management fee","Micro-loan interest 5–15%","BNPL service fee","Financial product referrals"],
    features:["Group savings (chama/investment clubs)","Cross-border payments (M-Pesa, Flutterwave)","Micro-investment pools","Buy-now-pay-later for ecosystem","Budget tracker + financial goals","Financial literacy courses","Credit score builder","Insurance marketplace","Remittance optimization engine"],
    status:"planned", phase:"4J",
    stack:["M-Pesa API","Flutterwave","Stripe","Plaid"],
  },
];

// ─── AI Tool Types ──────────────────────────────────────────────────────────
const AI_TOOLS = ["Business Plan Generator", "CV Generator", "Marketing Strategy", "Pitch Deck Outline"] as const;

type AiToolKey = (typeof AI_TOOLS)[number];
type Vertical = (typeof VERTICALS)[number];

interface StreamPrompt {
  sys: string;
  user: string;
}

interface SectionLabelProps {
  text: string;
  color?: string;
}

interface VerticalCardProps {
  v: Vertical;
  isActive: boolean;
  onClick: () => void;
}

interface MarketFormData {
  idea?: string;
  market?: string;
  budget?: string;
  model?: string;
  name?: string;
  jobTarget?: string;
  experience?: string;
  education?: string;
  skills?: string;
  location?: string;
  channels?: string;
  stage?: string;
  traction?: string;
}

type MarketFormKey = keyof MarketFormData;

interface ToolField {
  key: MarketFormKey;
  label: string;
  placeholder: string;
}

// ─── Streaming hook ─────────────────────────────────────────────────────────
function useStream() {
  const [output, setOutput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [done, setDone] = useState(false);
  const { token } = useAuthStore();

  const run = useCallback(async (prompt: string, systemPrompt: string) => {
    setOutput(""); setDone(false); setStreaming(true);
    const apiBase = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || "http://localhost:3001/api/v1";
    try {
      const res = await fetch(`${apiBase}/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: `${systemPrompt}\n\nUser request:\n${prompt}`,
          assistant: "atlas",
          history: [],
        }),
      });
      if (!res.body) throw new Error("Missing response stream body");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done: d, value } = await reader.read();
        if (d) break;
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
      setOutput("⚠ Generation failed. Please sign in and try again.");
    } finally {
      setStreaming(false);
      setDone(true);
    }
  }, [token]);

  return { output, streaming, done, run, reset: () => { setOutput(""); setDone(false); } };
}

// ─── Section label component ────────────────────────────────────────────────
function SectionLabel({text, color=T.gold}: SectionLabelProps) {
  return (
    <div style={{fontFamily:"'Space Mono',monospace", fontSize:8.5, letterSpacing:"0.25em",
      textTransform:"uppercase", color, marginBottom:14, display:"flex", alignItems:"center", gap:12}}>
      <div style={{height:1, width:24, background:`linear-gradient(90deg,${color},transparent)`}}/>
      {text}
      <div style={{height:1, flex:1, background:`linear-gradient(90deg,transparent,${T.faint})`}}/>
    </div>
  );
}

// ─── Vertical Card ──────────────────────────────────────────────────────────
function VerticalCard({v, isActive, onClick}: VerticalCardProps) {
  return (
    <div onClick={onClick} style={{
      background: isActive ? `${v.color}0C` : T.surface,
      border:`1px solid ${isActive ? v.color+"55" : T.border}`,
      borderRadius:8, padding:"18px 20px", cursor:"pointer",
      transition:"all 0.22s", position:"relative", overflow:"hidden",
      transform: isActive ? "translateY(-2px)" : "none",
      boxShadow: isActive ? `0 8px 32px ${v.color}18` : "none",
    }}>
      {/* Top border */}
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
      {isActive && <div style={{position:"absolute",bottom:0,right:0,fontSize:48,opacity:0.04,lineHeight:1}}>{v.icon}</div>}
    </div>
  );
}

// ─── Product interface for catalog ──────────────────────────────────────────
interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  comparePrice?: number;
  images?: Array<{ url: string; alt?: string }>;
  category?: string;
  vendor?: { storeName?: string; isVerified?: boolean };
  stock?: number;
}

// ─── Main App ───────────────────────────────────────────────────────────────
export default function WinnersMarketExpanded() {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [activeVertical, setActiveVertical] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<AiToolKey | null>(null);
  const [formData, setFormData] = useState<MarketFormData>({});
  const {output, streaming, done, run, reset} = useStream();

  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productSearch, setProductSearch] = useState("");
  const [productCategory, setProductCategory] = useState("all");

  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        const res = await fetch("/api/v1/products?limit=12", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || data || []);
        }
      } catch {
        // no products from API — show empty state
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, [token]);

  const filteredProducts = products.filter(p => {
    const matchSearch = !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase());
    const matchCat = productCategory === "all" || p.category?.toLowerCase() === productCategory.toLowerCase();
    return matchSearch && matchCat;
  });

  const categories = ["all", ...Array.from(new Set(products.map(p => p.category || "").filter(Boolean)))];

  const v = VERTICALS.find(x=>x.id===activeVertical);

  // ── Tool prompts ──────────────────────────────────────────────────────────
  const buildPrompt = (tool: AiToolKey): StreamPrompt => {
    const sys = `You are the Winners Ecosystem AI — an expert business advisor, career consultant, and strategist embedded in the Winners Market platform. You help entrepreneurs in Africa and globally start businesses, create professional documents, and build digital income streams. Be specific, structured, and actionable. Use clear sections with emojis as headers. Provide real numbers and realistic advice.`;

    const prompts: Record<AiToolKey, StreamPrompt> = {
      "Business Plan Generator": {
        sys,
        user: `Generate a professional business plan for:
Business Idea: ${formData.idea || "an online tutoring service in Nairobi"}
Target Market: ${formData.market || "East African students aged 15-25"}
Starting Budget: ${formData.budget || "$500"}
Business Model: ${formData.model || "subscription-based"}

Create a complete, investor-ready business plan with:
1. 🎯 Executive Summary
2. 🔍 Market Analysis & Opportunity Size
3. 💼 Business Model & Revenue Streams
4. 📊 Financial Projections (Year 1, 2, 3)
5. 🚀 Go-to-Market Strategy
6. 👥 Team & Operations
7. ⚠️ Risk Analysis & Mitigation
8. 💰 Funding Requirements

Be specific with numbers. Make it realistic for the African market.`,
      },
      "CV Generator": {
        sys,
        user: `Create a professional, ATS-optimized CV for:
Name: ${formData.name || "Your Full Name"}
Job Target: ${formData.jobTarget || "Digital Marketing Manager"}
Experience: ${formData.experience || "3 years in social media management and content creation"}
Education: ${formData.education || "Bachelor's in Business Administration"}
Key Skills: ${formData.skills || "Social media, SEO, copywriting, analytics, Canva, Meta Ads"}
Location: ${formData.location || "Nairobi, Kenya"}

Generate a complete professional CV with:
📋 PERSONAL SUMMARY (3 powerful lines)
💼 PROFESSIONAL EXPERIENCE (3 roles with bullet points + measurable achievements)
🎓 EDUCATION
🛠 TECHNICAL SKILLS (organized by category)
🏆 ACHIEVEMENTS & CERTIFICATIONS
📌 KEY PROJECTS
💡 Include ATS optimization tips at the end

Make it stand out for remote and international opportunities.`,
      },
      "Marketing Strategy": {
        sys,
        user: `Create a complete 90-day digital marketing strategy for:
Business: ${formData.idea || "Online fashion brand selling African-inspired clothing"}
Target Audience: ${formData.market || "African diaspora aged 25-40 in UK and USA"}
Monthly Budget: ${formData.budget || "$300"}
Channels Available: ${formData.channels || "Instagram, TikTok, Email, WhatsApp"}

Deliver:
📣 BRAND POSITIONING STATEMENT
🎯 TARGET AUDIENCE PERSONAS (2 detailed personas)
📱 CHANNEL STRATEGY (what to post, when, how often on each platform)
📅 30-60-90 DAY CONTENT CALENDAR FRAMEWORK
💰 BUDGET ALLOCATION BREAKDOWN
📊 KPIs & METRICS TO TRACK
🤖 AI TOOLS TO USE (specific tools with use cases)
🔑 TOP 5 QUICK WINS IN FIRST 2 WEEKS

Focus on low-budget, high-impact strategies that work for African businesses.`,
      },
      "Pitch Deck Outline": {
        sys,
        user: `Create a compelling investor pitch deck outline for:
Startup: ${formData.idea || "A digital lending platform for African SMEs"}
Stage: ${formData.stage || "Pre-seed / Seed"}
Seeking: ${formData.budget || "$250,000"}
Traction: ${formData.traction || "500 beta users, $15,000 in loan disbursements"}

Generate a 12-slide pitch deck with:
🎯 Slide 1: Cover + Hook (the one sentence that captures everything)
📊 Slide 2: Problem (with data)
💡 Slide 3: Solution
🌍 Slide 4: Market Size (TAM/SAM/SOM)
📈 Slide 5: Business Model (how you make money)
🚀 Slide 6: Traction & Validation
🗺️ Slide 7: Go-to-Market Strategy
⚔️ Slide 8: Competitive Landscape
👥 Slide 9: Team
💰 Slide 10: Financials & Projections
📋 Slide 11: Use of Funds
🤝 Slide 12: The Ask

For each slide: tell me WHAT to put on it + KEY MESSAGE to convey.`,
      },
    };
    return prompts[tool];
  };

  const handleGenerate = () => {
    if (!activeTool) return;
    const {sys, user} = buildPrompt(activeTool);
    run(user, sys);
  };

  const toolFields: Record<AiToolKey, ToolField[]> = {
    "Business Plan Generator": [
      {key:"idea", label:"Business Idea", placeholder:"e.g. Online tutoring platform for STEM subjects in East Africa"},
      {key:"market", label:"Target Market", placeholder:"e.g. Students aged 13–22 in Kenya, Uganda, Tanzania"},
      {key:"budget", label:"Starting Budget", placeholder:"e.g. $500 or $2,000"},
      {key:"model", label:"Business Model", placeholder:"e.g. Subscription, marketplace commission, freemium"},
    ],
    "CV Generator": [
      {key:"name", label:"Full Name", placeholder:"Your full name"},
      {key:"jobTarget", label:"Target Role", placeholder:"e.g. Software Engineer, Product Manager, Digital Marketer"},
      {key:"experience", label:"Work Experience Summary", placeholder:"e.g. 3 years in web development, built 5 production apps"},
      {key:"skills", label:"Key Skills", placeholder:"e.g. React, Node.js, Python, leadership, Figma"},
      {key:"education", label:"Education", placeholder:"e.g. BSc Computer Science, University of Nairobi"},
      {key:"location", label:"Location", placeholder:"e.g. Nairobi, Kenya / Remote"},
    ],
    "Marketing Strategy": [
      {key:"idea", label:"Business / Product", placeholder:"What are you marketing?"},
      {key:"market", label:"Target Audience", placeholder:"Who are your ideal customers?"},
      {key:"budget", label:"Monthly Marketing Budget", placeholder:"e.g. $200, $1,000"},
      {key:"channels", label:"Available Channels", placeholder:"e.g. Instagram, TikTok, WhatsApp, Email"},
    ],
    "Pitch Deck Outline": [
      {key:"idea", label:"Startup Name & Idea", placeholder:"What does your startup do in one line?"},
      {key:"stage", label:"Funding Stage", placeholder:"e.g. Pre-seed, Seed, Series A"},
      {key:"budget", label:"Amount Raising", placeholder:"e.g. $500,000"},
      {key:"traction", label:"Current Traction", placeholder:"e.g. 1,000 users, $10K MRR, 3 pilot customers"},
    ],
  };

  return (
    <>
      <AIInsightBanner page="market" assistant="atlas" />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        html,body{background:${T.bg};}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-track{background:transparent;}
        ::-webkit-scrollbar-thumb{background:${T.border};border-radius:2px;}
        @keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes shimmer{0%,100%{opacity:0.6}50%{opacity:1}}
        .vc-hover:hover{background:${T.surface2}!important;border-color:${T.border}!important;}
        .tool-btn:hover{border-color:rgba(201,168,76,0.5)!important;color:${T.gold}!important;}
        .gen-btn:hover{filter:brightness(1.1);transform:translateY(-1px);}
        textarea:focus,input:focus{outline:none;border-color:rgba(201,168,76,0.4)!important;}
        textarea,input{transition:border-color 0.2s;}
      `}</style>

      <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'Syne',sans-serif"}}>

        {/* ── HERO HEADER ────────────────────────────────────────────────── */}
        <div style={{position:"relative",overflow:"hidden",padding:"52px 32px 44px",textAlign:"center",borderBottom:`1px solid ${T.border}`}}>
          <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(rgba(43,95,142,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(43,95,142,0.025) 1px,transparent 1px)`,backgroundSize:"48px 48px"}}/>
          <div style={{position:"absolute",top:"30%",left:"50%",transform:"translate(-50%,-50%)",width:800,height:400,background:"radial-gradient(ellipse,rgba(43,95,142,0.12),transparent 70%)",pointerEvents:"none"}}/>

          {/* Context bar */}
          <div style={{display:"inline-flex",alignItems:"center",gap:8,marginBottom:24,background:T.surface,border:`1px solid ${T.border}`,borderRadius:4,padding:"6px 14px"}}>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:8,letterSpacing:"0.18em",color:T.dim}}>WINNERS ECOSYSTEM</span>
            <span style={{color:T.faint}}>·</span>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:8,letterSpacing:"0.18em",color:T.green}}>● CORE LIVE</span>
            <span style={{color:T.faint}}>·</span>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:8,letterSpacing:"0.18em",color:T.gold}}>⟳ COMMUNITY BUILDING</span>
            <span style={{color:T.faint}}>·</span>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:8,letterSpacing:"0.18em",color:T.ice}}>MARKET PLANNED</span>
          </div>

          <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:"0.3em",textTransform:"uppercase",color:T.gold,marginBottom:16}}>
            🛒 Phase 4 · Winners Market — Expanded Vision
          </div>
          <h1 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:"clamp(36px,6vw,72px)",fontWeight:300,lineHeight:0.95,marginBottom:14}}>
            Not a market.<br/><em style={{fontStyle:"italic",color:T.gold}}>An economic empire.</em>
          </h1>
          <p style={{fontSize:14,color:T.dim,lineHeight:1.8,maxWidth:580,margin:"0 auto 28px"}}>
            Winners Market is 10 verticals in one platform. Commerce, digital marketing, streaming, trading, business tools, career tools, real estate, events, health, and fintech — all under one identity, one billing system, one AI core.
          </p>

          {/* Revenue stat pills */}
          <div style={{display:"flex",flexWrap:"wrap",gap:8,justifyContent:"center"}}>
            {["10 Market Verticals","$0 → Revenue Day 1 possible","AI-Powered Every Layer","African Market First","One Identity. All Markets"].map(s=>(
              <span key={s} style={{fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:"0.06em",color:T.text,background:T.surface,border:`1px solid ${T.border}`,padding:"5px 12px",borderRadius:20}}>{s}</span>
            ))}
          </div>
        </div>

        <div style={{maxWidth:1200,margin:"0 auto",padding:"32px 24px",display:"flex",flexDirection:"column",gap:40}}>

          {/* ── 10 VERTICALS GRID ─────────────────────────────────────────── */}
          <div>
            <SectionLabel text="10 Market Verticals — Select to Explore"/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10}}>
              {VERTICALS.map(vrt=>(
                <VerticalCard key={vrt.id} v={vrt}
                  isActive={activeVertical===vrt.id}
                  onClick={()=>setActiveVertical(activeVertical===vrt.id?null:vrt.id)}/>
              ))}
            </div>
          </div>

          {/* ── VERTICAL DETAIL PANEL ─────────────────────────────────────── */}
          {v && (
            <div style={{animation:"fadeIn 0.3s ease",background:T.surface,border:`1px solid ${v.color}44`,borderRadius:10,overflow:"hidden",position:"relative"}}>
              <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${v.color},transparent)`}}/>
              <div style={{padding:"28px 32px",borderBottom:`1px solid ${T.border}`,background:`linear-gradient(135deg,rgba(23,35,53,0.8),${T.surface})`}}>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",flexWrap:"wrap",gap:16}}>
                  <div style={{display:"flex",alignItems:"center",gap:14}}>
                    <div style={{width:52,height:52,borderRadius:14,background:`${v.color}14`,border:`1.5px solid ${v.color}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>
                      {v.icon}
                    </div>
                    <div>
                      <div style={{fontSize:20,fontWeight:800,marginBottom:3}}>{v.label}</div>
                      <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:v.color,letterSpacing:"0.1em"}}>
                        Phase {v.phase} · {v.tagline}
                      </div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    <span style={{fontFamily:"'Space Mono',monospace",fontSize:8,padding:"4px 12px",borderRadius:3,background:`${v.color}14`,border:`1px solid ${v.color}33`,color:v.color}}>
                      {v.badge}
                    </span>
                    {v.id==="bizplan" && (
                      <button onClick={()=>navigate("/market/business-launcher")}
                        style={{fontFamily:"'Space Mono',monospace",fontSize:8,padding:"4px 14px",borderRadius:3,background:"rgba(201,168,76,0.12)",border:`1px solid ${T.gold}55`,color:T.gold,cursor:"pointer"}}>
                        Open Business Launcher →
                      </button>
                    )}
                    {v.id==="cv" && (
                      <button onClick={()=>navigate("/market/cv-tools")}
                        style={{fontFamily:"'Space Mono',monospace",fontSize:8,padding:"4px 14px",borderRadius:3,background:"rgba(45,212,160,0.1)",border:`1px solid rgba(45,212,160,0.3)`,color:T.green,cursor:"pointer"}}>
                        Open CV Tools →
                      </button>
                    )}
                    {v.id==="digitalmarketing" && (
                      <button onClick={()=>navigate("/market/digital-marketing")}
                        style={{fontFamily:"'Space Mono',monospace",fontSize:8,padding:"4px 14px",borderRadius:3,background:"rgba(155,111,255,0.1)",border:`1px solid rgba(155,111,255,0.3)`,color:T.purple,cursor:"pointer"}}>
                        Open Marketing Hub →
                      </button>
                    )}
                    {v.id==="commerce" && (
                      <button onClick={()=>navigate("/market/dropshipping")}
                        style={{fontFamily:"'Space Mono',monospace",fontSize:8,padding:"4px 14px",borderRadius:3,background:"rgba(45,212,160,0.1)",border:`1px solid rgba(45,212,160,0.3)`,color:T.green,cursor:"pointer"}}>
                        Dropshipping Hub →
                      </button>
                    )}
                    <span style={{fontFamily:"'Space Mono',monospace",fontSize:8,padding:"4px 12px",borderRadius:3,background:"rgba(90,122,150,0.1)",border:`1px solid ${T.border}`,color:T.dim}}>
                      ◌ Planned
                    </span>
                  </div>
                </div>
                <p style={{fontSize:13.5,color:T.dim,lineHeight:1.75,maxWidth:680,marginTop:16}}>{v.desc}</p>
              </div>

              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",padding:"24px 32px",gap:24,borderBottom:`1px solid ${T.border}`}}>
                {/* Features */}
                <div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:8.5,color:v.color,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:12}}>
                    Core Features
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:7}}>
                    {v.features.map(f=>(
                      <div key={f} style={{display:"flex",alignItems:"flex-start",gap:7}}>
                        <span style={{color:v.color,fontSize:10,marginTop:2,flexShrink:0}}>→</span>
                        <span style={{fontSize:11.5,color:T.dim,lineHeight:1.5}}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Revenue */}
                <div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:8.5,color:T.green,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:12}}>
                    Revenue Streams
                  </div>
                  <div style={{display:"flex",flexDirection:"column",gap:8}}>
                    {v.revenue.map(r=>(
                      <div key={r} style={{padding:"8px 12px",background:"rgba(45,212,160,0.05)",border:"1px solid rgba(45,212,160,0.12)",borderRadius:4}}>
                        <span style={{fontSize:11.5,color:T.text,lineHeight:1.5}}>💰 {r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tech Stack */}
                <div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:8.5,color:T.ice,letterSpacing:"0.16em",textTransform:"uppercase",marginBottom:12}}>
                    Tech Stack
                  </div>
                  <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                    {v.stack.map(s=>(
                      <span key={s} style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:T.ice,background:"rgba(137,196,225,0.07)",border:"1px solid rgba(137,196,225,0.15)",padding:"4px 10px",borderRadius:3}}>
                        {s}
                      </span>
                    ))}
                  </div>
                  <div style={{marginTop:16,padding:"12px 14px",background:`rgba(${v.color === T.purple ? "155,111,255" : "201,168,76"},0.05)`,border:`1px solid ${v.color}20`,borderRadius:5}}>
                    <div style={{fontFamily:"'Space Mono',monospace",fontSize:8,color:v.color,marginBottom:6,letterSpacing:"0.1em"}}>AGENTIC LOOP CONNECTION</div>
                    <div style={{fontSize:11,color:T.dim,lineHeight:1.6}}>
                      {v.id==="commerce" && "Learn in Academy → sell products here → earn revenue → AI optimizes your store"}
                      {v.id==="digitalmarketing" && "Community audience → Market your services here → grow clients → Work matches more"}
                      {v.id==="streaming" && "Community followers → become streaming subscribers → recurring creator revenue"}
                      {v.id==="trading" && "Academy trading courses → practice here → earn in real markets → build wealth"}
                      {v.id==="bizplan" && "Idea generated → Business plan here → Academy skill courses → Community launch"}
                      {v.id==="cv" && "Academy certificates → CV built here → Work matches you to jobs → earn income"}
                      {v.id==="realestate" && "Earn via ecosystem → invest in property here → build long-term wealth"}
                      {v.id==="events" && "Community audience → sell event tickets here → grow your brand → recurring income"}
                      {v.id==="health" && "Community wellness posts → sell coaching here → Academy certification → scale"}
                      {v.id==="fintech" && "Earn in all verticals → save and invest here → financial independence achieved"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── COMMERCE HUB — PRODUCT CATALOG ───────────────────────────── */}
          <div>
            <SectionLabel text="Commerce Hub — Product Catalog (4A Live)"/>

            {/* Search + filter bar */}
            <div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
              <input value={productSearch} onChange={e=>setProductSearch(e.target.value)}
                placeholder="Search products..."
                style={{flex:1,minWidth:200,background:T.surface,border:`1px solid ${T.border}`,borderRadius:5,padding:"9px 14px",color:T.text,fontFamily:"'Syne',sans-serif",fontSize:13}}/>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {categories.slice(0,6).map(cat=>(
                  <button key={cat} onClick={()=>setProductCategory(cat)}
                    style={{background:productCategory===cat?"rgba(45,212,160,0.1)":T.surface,
                      border:`1px solid ${productCategory===cat?"rgba(45,212,160,0.35)":T.border}`,
                      borderRadius:4,padding:"7px 14px",color:productCategory===cat?T.green:T.dim,
                      fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:"0.08em",cursor:"pointer",
                      textTransform:"capitalize" as const}}>
                    {cat}
                  </button>
                ))}
              </div>
              <button onClick={()=>navigate("/market/vendor")}
                style={{background:T.goldDim,border:`1px solid ${T.gold}44`,borderRadius:5,padding:"9px 18px",color:T.gold,fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:"0.1em",cursor:"pointer",whiteSpace:"nowrap" as const}}>
                + List Product
              </button>
            </div>

            {productsLoading ? (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12}}>
                {Array.from({length:6}).map((_,i)=>(
                  <div key={i} style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,overflow:"hidden",height:280}}>
                    <div style={{width:"100%",height:160,background:T.surface2,animation:"shimmer 1.5s infinite"}}/>
                    <div style={{padding:14}}>
                      <div style={{height:12,background:T.surface2,borderRadius:3,marginBottom:8,width:"80%"}}/>
                      <div style={{height:10,background:T.surface2,borderRadius:3,width:"50%"}}/>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))",gap:12}}>
                {filteredProducts.map(p=>{
                  const discount = p.comparePrice ? Math.round(((p.comparePrice-p.price)/p.comparePrice)*100) : 0;
                  return (
                    <div key={p.id} onClick={()=>navigate(`/market/product/${p.id}`)}
                      style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:6,overflow:"hidden",cursor:"pointer",position:"relative",transition:"all 0.2s"}}
                      onMouseEnter={e=>{(e.currentTarget as HTMLDivElement).style.borderColor=T.gold+"66"; (e.currentTarget as HTMLDivElement).style.transform="translateY(-2px)";}}
                      onMouseLeave={e=>{(e.currentTarget as HTMLDivElement).style.borderColor=T.border; (e.currentTarget as HTMLDivElement).style.transform="none";}}>
                      <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${T.green},transparent)`,opacity:0.6}}/>
                      <div style={{width:"100%",height:160,background:T.surface2,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center",fontSize:40}}>
                        {p.images?.[0]?.url ? (
                          <img src={p.images[0].url} alt={p.images[0].alt||p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                        ) : "📦"}
                      </div>
                      <div style={{padding:14}}>
                        {p.category && (
                          <div style={{fontFamily:"'Space Mono',monospace",fontSize:8,color:T.dim,letterSpacing:"0.1em",textTransform:"uppercase" as const,marginBottom:5}}>
                            {p.category}
                          </div>
                        )}
                        <div style={{fontSize:13,fontWeight:700,color:T.text,lineHeight:1.4,marginBottom:6,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical" as const}}>
                          {p.name}
                        </div>
                        {p.vendor?.storeName && (
                          <div style={{fontSize:11,color:T.dim,marginBottom:8,display:"flex",alignItems:"center",gap:4}}>
                            {p.vendor.isVerified && <span style={{color:T.green,fontSize:9}}>✓</span>}
                            {p.vendor.storeName}
                          </div>
                        )}
                        <div style={{display:"flex",alignItems:"center",gap:8}}>
                          <span style={{fontFamily:"'Space Mono',monospace",fontSize:14,fontWeight:700,color:T.gold}}>
                            ${(p.price/100).toFixed(2)}
                          </span>
                          {p.comparePrice && (
                            <span style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:T.dim,textDecoration:"line-through"}}>
                              ${(p.comparePrice/100).toFixed(2)}
                            </span>
                          )}
                          {discount > 0 && (
                            <span style={{fontFamily:"'Space Mono',monospace",fontSize:8,background:"rgba(45,212,160,0.1)",border:"1px solid rgba(45,212,160,0.25)",color:T.green,padding:"2px 6px",borderRadius:3}}>
                              -{discount}%
                            </span>
                          )}
                        </div>
                        {p.stock !== undefined && p.stock <= 5 && p.stock > 0 && (
                          <div style={{fontFamily:"'Space Mono',monospace",fontSize:8,color:T.orange,marginTop:6}}>Only {p.stock} left</div>
                        )}
                        {p.stock === 0 && (
                          <div style={{fontFamily:"'Space Mono',monospace",fontSize:8,color:T.red,marginTop:6}}>Out of stock</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"40px 32px",textAlign:"center"}}>
                <div style={{fontSize:40,marginBottom:12}}>🛒</div>
                <div style={{fontSize:15,fontWeight:700,marginBottom:8}}>No products yet</div>
                <div style={{fontSize:13,color:T.dim,marginBottom:20}}>Be the first vendor to list products in Winners Market.</div>
                <button onClick={()=>navigate("/market/vendor")}
                  style={{background:T.gold,color:T.bg,border:"none",borderRadius:5,padding:"10px 24px",fontFamily:"'Space Mono',monospace",fontSize:10,fontWeight:700,letterSpacing:"0.12em",cursor:"pointer"}}>
                  Become a Vendor →
                </button>
              </div>
            )}

            {products.length > 0 && (
              <div style={{marginTop:14,display:"flex",justifyContent:"center"}}>
                <button onClick={()=>navigate("/market/dropshipping")}
                  style={{background:"transparent",border:`1px solid ${T.border}`,borderRadius:5,padding:"9px 22px",color:T.dim,fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:"0.1em",cursor:"pointer"}}>
                  Explore Dropshipping Catalog →
                </button>
              </div>
            )}
          </div>

          {/* ── AI TOOLS SECTION ──────────────────────────────────────────── */}
          <div>
            <SectionLabel text="AI-Powered Business Tools — Live Demo"/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:20}}>
              {AI_TOOLS.map(tool=>(
                <button key={tool} className="tool-btn"
                  onClick={()=>{setActiveTool(activeTool===tool?null:tool); reset(); setFormData({});}}
                  style={{
                    background: activeTool===tool ? T.goldDim : T.surface,
                    border:`1px solid ${activeTool===tool ? T.gold+"66" : T.border}`,
                    borderRadius:7, padding:"14px 16px", cursor:"pointer",
                    textAlign:"left", transition:"all 0.2s",
                    color: activeTool===tool ? T.gold : T.dim,
                    fontFamily:"'Syne',sans-serif", fontSize:13, fontWeight:700,
                    position:"relative", overflow:"hidden",
                  }}>
                  {activeTool===tool && <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${T.gold},transparent)`}}/>}
                  <div style={{fontSize:22,marginBottom:8}}>
                    {tool==="Business Plan Generator"?"📋":tool==="CV Generator"?"📄":tool==="Marketing Strategy"?"📣":"🎯"}
                  </div>
                  <div style={{fontSize:12.5,lineHeight:1.4}}>{tool}</div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:8,marginTop:4,opacity:0.7,letterSpacing:"0.06em"}}>AI · Claude Powered</div>
                </button>
              ))}
            </div>

            {/* Tool interface */}
            {activeTool && (
              <div style={{animation:"fadeIn 0.3s ease",background:T.surface,border:`1px solid ${T.border}`,borderRadius:10,overflow:"hidden"}}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,transparent,${T.gold},transparent)`,borderRadius:"10px 10px 0 0"}}/>
                <div style={{padding:"22px 28px",borderBottom:`1px solid ${T.border}`,background:`linear-gradient(135deg,rgba(23,35,53,0.8),${T.surface})`}}>
                  <div style={{fontSize:15,fontWeight:800,marginBottom:3}}>{activeTool}</div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:8.5,color:T.gold,letterSpacing:"0.12em"}}>
                    WINNERS MARKET · AI TOOLS · PHASE 4E/4F
                  </div>
                </div>

                <div style={{padding:"24px 28px",display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,borderBottom:`1px solid ${T.border}`}}>
                  {(toolFields[activeTool]||[]).map(f=>(
                    <div key={f.key} style={{display:"flex",flexDirection:"column",gap:6}}>
                      <label style={{fontFamily:"'Space Mono',monospace",fontSize:9,letterSpacing:"0.12em",textTransform:"uppercase",color:T.dim}}>
                        {f.label}
                      </label>
                      <input value={formData[f.key]||""} onChange={e=>setFormData(d=>({...d,[f.key]:e.target.value}))}
                        placeholder={f.placeholder}
                        style={{background:T.surface2,border:`1px solid ${T.border}`,borderRadius:5,padding:"10px 13px",color:T.text,fontFamily:"'Syne',sans-serif",fontSize:13,width:"100%"}}/>
                    </div>
                  ))}
                </div>

                <div style={{padding:"16px 28px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${T.border}`}}>
                  <span style={{fontFamily:"'Space Mono',monospace",fontSize:8.5,color:T.dim,letterSpacing:"0.08em"}}>
                    Fill in details above, then generate ↓
                  </span>
                  <button className="gen-btn" onClick={handleGenerate} disabled={streaming}
                    style={{background:streaming?T.faint:T.gold,color:T.bg,border:"none",borderRadius:4,
                      padding:"10px 28px",fontFamily:"'Space Mono',monospace",fontSize:10,letterSpacing:"0.14em",
                      textTransform:"uppercase",fontWeight:700,cursor:streaming?"not-allowed":"pointer",
                      transition:"all 0.2s"}}>
                    {streaming?"Generating...":"Generate with AI →"}
                  </button>
                </div>

                {/* Output */}
                {(output || streaming) && (
                  <div style={{padding:"24px 28px",maxHeight:480,overflowY:"auto"}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16}}>
                      <div style={{width:5,height:5,borderRadius:"50%",background:T.gold,animation:streaming?"shimmer 1s infinite":"none"}}/>
                      <span style={{fontFamily:"'Space Mono',monospace",fontSize:8.5,color:T.gold,letterSpacing:"0.14em"}}>
                        {streaming?"AI GENERATING...":"GENERATION COMPLETE"}
                      </span>
                    </div>
                    <div style={{fontFamily:"'Syne',sans-serif",fontSize:13,lineHeight:1.8,color:T.text,whiteSpace:"pre-wrap"}}>
                      {output.split("\n").map((ln,i)=>{
                        const isH = ln.match(/^[🎯🔍💼📊🚀👥⚡💰📋💡🌍📣📅📌🏆🛠✅🔑]/u);
                        return <div key={i} style={{marginBottom:isH?8:3,color:isH?T.text:T.dim,fontWeight:isH?700:400,fontSize:isH?14:13}}>{ln}</div>;
                      })}
                      {streaming && <span style={{display:"inline-block",width:7,height:14,background:T.gold,animation:"pulse 0.7s step-end infinite",borderRadius:1,verticalAlign:"middle"}}/>}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── MARKET ARCHITECTURE ───────────────────────────────────────── */}
          <div>
            <SectionLabel text="Market Architecture — Build Sequence"/>
            <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,overflow:"hidden"}}>
              <div style={{height:2,background:`linear-gradient(90deg,transparent,${T.gold},${T.green},transparent)`}}/>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}>
                  <thead>
                    <tr style={{background:T.surface2}}>
                      {["Phase","Vertical","Revenue Model","Stack","Priority","Build After"].map(h=>(
                        <th key={h} style={{padding:"10px 16px",textAlign:"left",fontFamily:"'Space Mono',monospace",fontSize:8,letterSpacing:"0.14em",textTransform:"uppercase",color:T.dim,borderBottom:`1px solid ${T.border}`,whiteSpace:"nowrap"}}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      {phase:"4A",v:"🛒 Commerce Hub",rev:"10-20% commission",stack:"Stripe, Printful",pri:"HIGH",after:"Academy V1 stable"},
                      {phase:"4B",v:"📣 Digital Marketing",rev:"Package sales 20%",stack:"Meta API, Claude",pri:"HIGH",after:"Commerce live"},
                      {phase:"4C",v:"📺 Winners Stream",rev:"Sub 15%, PPV",stack:"Mux, HLS.js",pri:"HIGH",after:"Community stable"},
                      {phase:"4E",v:"📋 Business Launcher",rev:"Credits, templates",stack:"Claude, jsPDF",pri:"HIGH",after:"Intelligence layer"},
                      {phase:"4F",v:"📄 CV & Career",rev:"Credits, premium",stack:"Claude, React-PDF",pri:"HIGH",after:"Intelligence layer"},
                      {phase:"4D",v:"📈 Winners Trading",rev:"Signals $49-149/mo",stack:"Alpaca, TradingView",pri:"MED",after:"4B + 4C stable"},
                      {phase:"4H",v:"🎟 Winners Events",rev:"Ticket 5-10%",stack:"Stripe, QR, Mux",pri:"MED",after:"Community V2"},
                      {phase:"4G",v:"🏠 Winners Property",rev:"Listing fees",stack:"Mapbox, Stripe",pri:"MED",after:"4A stable"},
                      {phase:"4I",v:"💪 Winners Health",rev:"Coach cut 20%",stack:"HealthKit, Claude",pri:"LOW",after:"4F stable"},
                      {phase:"4J",v:"🏦 Winners Finance",rev:"1-2% payments",stack:"M-Pesa, Flutterwave",pri:"LOW",after:"Regulation ready"},
                    ].map((row,i)=>(
                      <tr key={i} style={{borderBottom:`1px solid ${T.border}`,transition:"background 0.15s"}}
                        onMouseEnter={e=>e.currentTarget.style.background=T.surface2}
                        onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                        <td style={{padding:"10px 16px",fontFamily:"'Space Mono',monospace",fontSize:9,color:T.gold}}>{row.phase}</td>
                        <td style={{padding:"10px 16px",fontSize:12.5,fontWeight:600}}>{row.v}</td>
                        <td style={{padding:"10px 16px",fontFamily:"'Space Mono',monospace",fontSize:9,color:T.green}}>{row.rev}</td>
                        <td style={{padding:"10px 16px",fontFamily:"'Space Mono',monospace",fontSize:9,color:T.ice}}>{row.stack}</td>
                        <td style={{padding:"10px 16px"}}>
                          <span style={{fontFamily:"'Space Mono',monospace",fontSize:8,padding:"2px 8px",borderRadius:2,
                            background:row.pri==="HIGH"?"rgba(45,212,160,0.1)":row.pri==="MED"?"rgba(201,168,76,0.1)":"rgba(90,122,150,0.1)",
                            color:row.pri==="HIGH"?T.green:row.pri==="MED"?T.gold:T.dim,
                            border:`1px solid ${row.pri==="HIGH"?"rgba(45,212,160,0.2)":row.pri==="MED"?"rgba(201,168,76,0.2)":"rgba(90,122,150,0.2)"}`}}>
                            {row.pri}
                          </span>
                        </td>
                        <td style={{padding:"10px 16px",fontSize:11,color:T.dim}}>{row.after}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── REVENUE POTENTIAL ─────────────────────────────────────────── */}
          <div style={{background:T.surface,border:`1px solid ${T.border}`,borderRadius:8,padding:"28px 32px"}}>
            <SectionLabel text="Revenue Potential — All 10 Verticals Active"/>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:1,background:T.border,borderRadius:6,overflow:"hidden",marginBottom:20}}>
              {[
                {label:"Commerce",est:"$50K–$500K",unit:"MRR at scale",color:T.green},
                {label:"Streaming",est:"$20K–$200K",unit:"MRR at scale",color:T.red},
                {label:"Mktg Hub",est:"$15K–$150K",unit:"MRR at scale",color:T.gold},
                {label:"Trading",est:"$30K–$300K",unit:"MRR at scale",color:T.purple},
                {label:"Biz Tools",est:"$10K–$100K",unit:"MRR at scale",color:T.ice},
              ].map(r=>(
                <div key={r.label} style={{background:T.surface,padding:"18px 16px",textAlign:"center"}}>
                  <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:600,color:r.color,marginBottom:4}}>{r.est}</div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:7.5,color:T.dim,letterSpacing:"0.08em"}}>{r.unit}</div>
                  <div style={{fontFamily:"'Space Mono',monospace",fontSize:8,color:T.faint,marginTop:4}}>{r.label}</div>
                </div>
              ))}
            </div>
            <div style={{textAlign:"center",padding:"16px",background:"rgba(201,168,76,0.04)",border:`1px solid ${T.gold}22`,borderRadius:6}}>
              <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:36,fontWeight:600,color:T.gold}}>$1M+ ARR</div>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:T.dim,letterSpacing:"0.1em",marginTop:4}}>COMBINED POTENTIAL ACROSS ALL 10 MARKET VERTICALS AT SCALE</div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div style={{borderTop:`1px solid ${T.border}`,padding:"20px 32px",display:"flex",alignItems:"center",justifyContent:"space-between",background:T.surface}}>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:8.5,color:T.dim,letterSpacing:"0.08em"}}>
            Winners Ecosystem · Phase 4 · Winners Market · 10 Verticals · Digital Sovereign Infrastructure
          </div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:8,color:T.faint}}>
            Select a vertical above · Use AI tools · Build the empire
          </div>
        </div>
      </div>
      <AssistantPanel assistant="atlas" page="market" />
    </>
  );
}
