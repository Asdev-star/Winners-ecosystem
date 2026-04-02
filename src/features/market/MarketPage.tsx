// Phase 4 Layer: Winners Market
// Unified Economic Hub with 10 Verticals, Catalog, and Dropshipping
// AI supervisor: ATLAS / OMEGA

import { useState, useCallback, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
  ice: "var(--ice)", 
  blue: "var(--blue)", 
  green: "var(--green)", 
  purple: "var(--purple)",
  teal: "var(--ice)",
  orange: "var(--gold)",
  pink: "var(--purple)",
  red: "var(--red)", 
  text: "var(--text)", 
  dim: "var(--text-dim)", 
  faint: "var(--border)",
};

// ─── All 10 Winners Market Verticals ───────────────────────────────────────
const VERTICALS = [
  {
    id:"commerce", icon:"🛒", label:"Commerce Hub",
    color:T.green, badge:"V1 · LIVE",
    tagline:"Products · Dropshipping · Vendors",
    desc:"The original marketplace engine. Digital downloads, physical products, print-on-demand, and a full multi-vendor storefront system. Like Shopify + Amazon in one place.",
    revenue:["10–20% transaction commission","Vendor subscriptions $15–$49/mo","Featured listing fees","Print-on-demand margins"],
    features:["Product catalog (digital + physical)","Cart + Stripe checkout","Vendor onboarding & dashboard","Printful / Gelato / AliExpress integration","Order management + tracking","AI product description generator"],
    status:"live", phase:"4A", path:"/market/commerce"
  },
  {
    id:"digitalmarketing", icon:"📣", label:"Digital Marketing Hub",
    color:T.gold, badge:"V2 · LIVE",
    tagline:"Ads · SEO · Campaigns · Analytics",
    desc:"A full-service digital marketing platform. Sell marketing services, run paid ad campaigns, offer SEO audits, social media management packages, and email marketing automation — all inside the ecosystem.",
    revenue:["Marketing package sales 20% cut","Subscription tools $29–$99/mo","Ad budget management fee 5–10%","White-label marketing tools"],
    features:["Service marketplace for marketing agencies","Ad campaign builder (Meta, Google, TikTok)","SEO audit tool + keyword tracker","Social media scheduler + analytics","Email marketing automation suite","AI copywriting assistant","Lead generation tools","Client reporting dashboard"],
    status:"live", phase:"4B", path:"/market/digital-marketing"
  },
  {
    id:"streaming", icon:"📺", label:"Winners Stream",
    color:T.red, badge:"V2 · LIVE",
    tagline:"Live · VOD · Creator Monetization",
    desc:"A full streaming platform for creators, educators, musicians, and entertainers. Live streams, VOD content, pay-per-view events, channel subscriptions, and tipping — all monetized through the ecosystem.",
    revenue:["Channel subscription 15% cut","Pay-per-view event fees","Super Chat / tipping 10% cut","Ad revenue sharing","VOD rental & purchase commission"],
    features:["Live streaming with chat","VOD upload + hosting","Pay-per-view events","Channel subscription system","Super Chat tipping","Creator analytics dashboard","Multi-quality streaming (480p/720p/1080p)","Replay archive + clip creation","Scheduled stream calendar"],
    status:"live", phase:"4C", path:"/market/stream"
  },
  {
    id:"trading", icon:"📈", label:"Winners Trading",
    color:T.purple, badge:"V3 · LIVE",
    tagline:"Stocks · Crypto · Forex · Copy Trading",
    desc:"An educational trading platform + paper trading simulator. Learn real market strategies, practice with virtual portfolios, follow top traders' moves, and eventually access real broker integrations.",
    revenue:["Trading course subscriptions","Premium signals $49–$149/mo","Copy trading fee 10–20%","Data provider API resale","Broker referral commissions"],
    features:["Real-time market data (stocks, crypto, forex)","Paper trading simulator","Strategy backtesting engine","Copy trading — follow expert portfolios","Trading signals & alerts","Market analysis AI assistant","Risk management calculator","Community trading challenges","Broker API integration (Alpaca, Interactive Brokers)"],
    status:"live", phase:"4D", path:"/market/trading"
  },
  {
    id:"bizplan", icon:"📋", label:"Business Launcher",
    color:T.ice, badge:"V2 · LIVE",
    tagline:"Business Plans · Strategy · Launch Kits",
    desc:"Everything you need to start and grow a business — AI-powered business plan generator, market research tools, financial projections, pitch deck builder, and legal document templates.",
    revenue:["Business plan generation credits","Premium plan templates $29–$99","Investor pitch review service","Legal template subscriptions","Launch kit bundles $49–$199"],
    features:["AI business plan generator (full document)","Market size & competitor analysis","Financial projection builder","Pitch deck slide generator","Legal templates (NDA, contracts, MOUs)","Brand name & domain checker","Revenue model calculator","Startup cost estimator","Investor-ready export (PDF, PPTX, DOCX)"],
    status:"live", phase:"4E", path:"/market/business-launcher"
  },
  {
    id:"cv", icon:"📄", label:"CV & Career Tools",
    color:T.teal, badge:"V2 · LIVE",
    tagline:"CV Generator · Cover Letters · Portfolio",
    desc:"Professional CV and career document generation powered by AI. Build ATS-optimized resumes, custom cover letters, LinkedIn profiles, and professional portfolios.",
    revenue:["CV generation credits","Premium templates $9–$29","Career coach service marketplace","LinkedIn optimization service","Bulk CV builder for agencies"],
    features:["AI CV generator (15+ professional templates)","ATS score checker + optimization","Cover letter AI generator","LinkedIn profile optimizer","Professional bio writer","Skills assessment + gap analysis","Portfolio website builder","Interview preparation AI coach","One-click export (PDF, DOCX, JSON)"],
    status:"live", phase:"4F", path:"/market/cv-tools"
  },
  {
    id:"realestate", icon:"🏠", label:"Winners Property",
    color:T.orange, badge:"V3 · LIVE",
    tagline:"Real Estate · Listings · Investment",
    desc:"A property marketplace for African and diaspora markets. List properties for sale and rent, connect with real estate agents, access mortgage calculators, and discover investment opportunities.",
    revenue:["Property listing fees","Agent subscription plans","Mortgage referral commission","Investment deal flow fees","Premium listing placement"],
    features:["Property listings (buy/rent/invest)","Agent + developer profiles","Virtual tour integration","Mortgage + affordability calculator","Investment ROI calculator","Neighborhood analytics","Legal due diligence checklist","Property alert notifications","Map-based search (Mapbox)"],
    status:"live", phase:"4G", path:"/market/property"
  },
  {
    id:"events", icon:"🎟", label:"Winners Events",
    color:T.pink, badge:"V2 · LIVE",
    tagline:"Events · Tickets · NFT Passes",
    desc:"Create, host, and monetize online and physical events. Conference tickets, workshop registrations, webinar access, live event streaming, and blockchain-verified NFT tickets.",
    revenue:["Ticket sales 5–10% commission","Event creation subscription","Premium event features","Sponsorship marketplace","NFT ticket minting fees"],
    features:["Event creation + management","Ticket tiers (free, paid, VIP)","QR code ticket scanning","Live streaming integration","Attendee networking (matchmaking)","Event analytics dashboard","Sponsorship packages","NFT ticket minting","Calendar integration + reminders"],
    status:"live", phase:"4H", path:"/market/events"
  },
  {
    id:"health", icon:"💪", label:"Winners Health",
    color:"var(--green)", badge:"V3 · LIVE",
    tagline:"Fitness · Nutrition · Mental Wellness",
    desc:"A wellness marketplace where certified coaches sell workout programs, nutrition plans, and mental health content. AI-powered workout tracking, health analytics, and telehealth booking.",
    revenue:["Coach program sales 20% cut","Wellness subscription plans","Telehealth booking commission","Supplement referral sales","Corporate wellness packages"],
    features:["Coach marketplace (fitness, nutrition, mental health)","AI workout plan generator","Nutrition tracker + meal planner","Progress tracking + body metrics","Telehealth appointment booking","Mindfulness + meditation library","Group challenges + leaderboards","Wearable device sync (Apple Health, Fitbit)","Corporate wellness dashboard"],
    status:"live", phase:"4I", path:"/market/health"
  },
  {
    id:"fintech", icon:"🏦", label:"Winners Finance",
    color:"var(--gold)", badge:"V3 · LIVE",
    tagline:"Payments · Savings · Micro-Loans",
    desc:"Embedded fintech for the ecosystem. Group savings (chamas), micro-investment pools, cross-border payment rails optimized for Africa, and buy-now-pay-later for platform purchases.",
    revenue:["Payment processing 1–2%","Savings pool management fee","Micro-loan interest 5–15%","BNPL service fee","Financial product referrals"],
    features:["Group savings (chama/investment clubs)","Cross-border payments (M-Pesa, Flutterwave)","Micro-investment pools","Buy-now-pay-later for ecosystem","Budget tracker + financial goals","Financial literacy courses","Credit score builder","Insurance marketplace","Remittance optimization engine"],
    status:"live", phase:"4J", path:"/market/finance"
  }
];

// ─── UI Components ──────────────────────────────────────────────────────────

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
      borderRadius:8, padding:"18px 20px", cursor:"pointer",
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
  const location = useLocation();
  const [activeVertical, setActiveVertical] = useState<string | null>(vertical || null);
  const [viewMode, setViewMode] = useState<'dashboard' | 'detail'>(vertical ? 'detail' : 'dashboard');
  const [commerceSubView, setCommerceSubView] = useState<'marketplace' | 'dropshipping'>('marketplace');

  useEffect(() => {
    if (vertical) {
      setActiveVertical(vertical);
      setViewMode('detail');
    } else {
      setActiveVertical(null);
      setViewMode('dashboard');
    }
  }, [vertical]);

  const currentV = VERTICALS.find(v => v.id === activeVertical || v.path.includes(activeVertical || ''));

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, padding: "0 0 80px", fontFamily: "'Syne', sans-serif" }}>
      
      {/* ── HERO HEADER ──────────────────────────────────────────────────── */}
      <div style={{ padding: "60px 24px 40px", textAlign: "center", borderBottom: `1px solid ${T.border}`, background: `linear-gradient(180deg, ${T.surface} 0%, ${T.bg} 100%)` }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16 }}>
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, letterSpacing: "0.18em", color: T.green }}>● CORE LIVE</span>
          <span style={{ color: T.faint }}>·</span>
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, letterSpacing: "0.18em", color: T.green }}>● COMMUNITY LIVE</span>
          <span style={{ color: T.faint }}>·</span>
          <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 8, letterSpacing: "0.18em", color: T.gold }}>● MARKET LIVE</span>
        </div>

        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 300, lineHeight: 1.1, marginBottom: 14 }}>
          {viewMode === 'dashboard' ? (
            <>Not a market.<br /><em style={{ fontStyle: "italic", color: T.gold }}>An economic empire.</em></>
          ) : (
            currentV?.label
          )}
        </h1>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 24 }}>
          {viewMode === 'detail' && (
            <button 
              onClick={() => navigate('/market')}
              style={{ background: T.surface2, border: `1px solid ${T.border}`, padding: '8px 20px', borderRadius: 6, color: T.gold, cursor: 'pointer', fontFamily: 'Space Mono', fontSize: 11, textTransform: 'uppercase' }}
            >
              ← Market Dashboard
            </button>
          )}
          {activeVertical === 'commerce' && (
            <div style={{ display: 'flex', background: T.surface2, borderRadius: 6, padding: 4, border: `1px solid ${T.border}` }}>
              <button 
                onClick={() => setCommerceSubView('marketplace')}
                style={{ background: commerceSubView === 'marketplace' ? T.surface3 : 'transparent', border: 'none', padding: '6px 16px', borderRadius: 4, color: commerceSubView === 'marketplace' ? T.gold : T.dim, cursor: 'pointer', fontSize: 11 }}
              >
                Marketplace
              </button>
              <button 
                onClick={() => setCommerceSubView('dropshipping')}
                style={{ background: commerceSubView === 'dropshipping' ? T.surface3 : 'transparent', border: 'none', padding: '6px 16px', borderRadius: 4, color: commerceSubView === 'dropshipping' ? T.gold : T.dim, cursor: 'pointer', fontSize: 11 }}
              >
                Dropshipping
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 24px" }}>
        <ContextBar platform="market" />

        {viewMode === 'dashboard' ? (
          <div style={{ marginTop: 40 }}>
            <SectionLabel text="10 Market Verticals — The Economic Foundation" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {VERTICALS.map(v => (
                <VerticalCard 
                  key={v.id} v={v} 
                  isActive={activeVertical === v.id} 
                  onClick={() => navigate(v.path)} 
                />
              ))}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: 20 }}>
            {activeVertical === 'commerce' && commerceSubView === 'dropshipping' ? (
              <WinnersDropshipping />
            ) : (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: 40, textAlign: 'center' }}>
                <div style={{ fontSize: 64, marginBottom: 24 }}>{currentV?.icon}</div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: T.gold, marginBottom: 16 }}>
                  {currentV?.label} Experience
                </h2>
                <p style={{ color: T.dim, maxWidth: 600, margin: '0 auto 32px', lineHeight: 1.6 }}>
                  {currentV?.desc}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, textAlign: 'left' }}>
                  <div style={{ background: T.surface2, padding: 20, borderRadius: 8, border: `1px solid ${T.border}` }}>
                    <h4 style={{ color: T.gold, fontSize: 12, fontFamily: 'Space Mono', marginBottom: 12 }}>REVENUE MODELS</h4>
                    {currentV?.revenue.map(r => <div key={r} style={{ fontSize: 13, marginBottom: 8 }}>• {r}</div>)}
                  </div>
                  <div style={{ background: T.surface2, padding: 20, borderRadius: 8, border: `1px solid ${T.border}` }}>
                    <h4 style={{ color: T.green, fontSize: 12, fontFamily: 'Space Mono', marginBottom: 12 }}>CORE FEATURES</h4>
                    {currentV?.features.slice(0, 4).map(f => <div key={f} style={{ fontSize: 13, marginBottom: 8 }}>• {f}</div>)}
                  </div>
                </div>
                <button 
                  onClick={() => navigate(currentV?.path || '/market')}
                  style={{ marginTop: 40, background: T.gold, border: 'none', padding: '12px 32px', borderRadius: 6, color: T.bg, fontWeight: 700, cursor: 'pointer' }}
                >
                  Enter {currentV?.label} Portal
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <AssistantPanel assistant="atlas" />
    </div>
  );
}
