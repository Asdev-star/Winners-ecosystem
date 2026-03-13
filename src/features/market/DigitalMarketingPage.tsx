// Phase 4B — Winners Market: Digital Marketing Hub
// AI-powered marketing strategy, content calendar, ad copy, SEO, email campaigns
// ATLAS AI supervisor — via /api/v1/chat/message backend route

import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";
import AssistantPanel from "../../components/ui/AssistantPanel";

const API_BASE = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || "http://localhost:3001/api/v1";

type ToolKey = "marketing-strategy" | "content-calendar" | "ad-copy" | "seo-optimizer" | "email-campaign" | "social-bio";

interface Tool {
  id: ToolKey;
  icon: string;
  label: string;
  tagline: string;
  color: string;
}

const TOOLS: Tool[] = [
  { id: "marketing-strategy",  icon: "🎯", label: "Marketing Strategy",   tagline: "Full go-to-market plan",            color: "var(--gold)" },
  { id: "content-calendar",    icon: "📅", label: "Content Calendar",     tagline: "30-day content plan per platform",  color: "var(--purple)" },
  { id: "ad-copy",             icon: "📣", label: "Ad Copy Generator",    tagline: "Facebook, Google, TikTok ready",    color: "var(--green)" },
  { id: "seo-optimizer",       icon: "🔎", label: "SEO Optimizer",        tagline: "Keywords, meta, content brief",     color: "var(--ice)" },
  { id: "email-campaign",      icon: "📧", label: "Email Campaign",       tagline: "Sequence, subject lines, CTAs",     color: "var(--gold)" },
  { id: "social-bio",          icon: "✨", label: "Brand Voice & Bio",    tagline: "Consistent identity across channels", color: "var(--purple)" },
];

const PROMPTS: Record<ToolKey, (f: Record<string, string>) => string> = {
  "marketing-strategy": (f) => `Create a comprehensive digital marketing strategy for:
- Business: ${f.name || "My Business"}
- Product/Service: ${f.product || "Mobile app for small businesses"}
- Target Audience: ${f.audience || "Small business owners in West Africa, 25-45"}
- Budget: ${f.budget || "$500/month"}
- Key Goal: ${f.goal || "Get first 1,000 paying customers"}
- Timeline: ${f.timeline || "3 months"}

Generate a full go-to-market strategy covering:
1. Ideal Customer Profile (ICP) — demographics, psychographics, pain points
2. Channel mix recommendation (which platforms and why)
3. Month-by-month execution plan for ${f.timeline || "3 months"}
4. Content pillars (4 themes to build authority)
5. Paid vs organic budget split recommendation
6. Key performance metrics to track (CTR, CAC, ROAS, etc.)
7. Africa-specific marketing tactics (WhatsApp marketing, influencer tiers, etc.)
8. Quick wins to implement in Week 1`,

  "content-calendar": (f) => `Build a 30-day social media content calendar for:
- Brand: ${f.name || "My Brand"}
- Industry: ${f.industry || "Technology"}
- Platforms: ${f.platforms || "Instagram, LinkedIn, Twitter/X, TikTok"}
- Tone: ${f.tone || "Professional yet approachable"}
- Primary Goal: ${f.goal || "Build brand awareness and grow following"}
- Target Audience: ${f.audience || "African entrepreneurs and professionals"}

Create a 30-day calendar with:
- Daily content theme (what to post)
- Content type (video, carousel, single image, text, story)
- Caption angle/hook
- Hashtag strategy (niche + broad mix)
- Best posting time per platform for African audiences
- 5 viral content ideas specific to ${f.industry || "your industry"}
- Weekly content pattern (Mon-Sun rhythm)
- 3 content series ideas to maintain consistency`,

  "ad-copy": (f) => `Generate high-converting ad copy for:
- Product/Service: ${f.product || "Online business course"}
- Target Audience: ${f.audience || "Aspiring entrepreneurs in Nigeria and Ghana, 22-35"}
- Key Benefit: ${f.benefit || "Start earning online in 30 days"}
- Offer/CTA: ${f.cta || "Enroll now — limited spots"}
- Budget Level: ${f.budget || "Small ($10-50/day)"}
- Platforms: ${f.platforms || "Facebook/Instagram, TikTok"}

Generate complete ad sets:
1. Facebook/Instagram — 3 headline variants + 3 primary text variants + 3 CTAs
2. Google Search — 3 RSA headlines (30 chars) + 3 descriptions (90 chars)  
3. TikTok — 3 hook scripts (first 3 seconds) + full video script outline
4. WhatsApp broadcast message template
5. Retargeting ad (for people who visited but didn't buy)
6. A/B testing recommendations — what to test first
7. Best audience targeting parameters for African markets`,

  "seo-optimizer": (f) => `Perform SEO optimization for:
- Business/Page: ${f.name || "My Website"}
- Industry: ${f.industry || "EdTech"}
- Primary Keyword: ${f.keyword || "online courses africa"}
- Location Focus: ${f.location || "Nigeria, Kenya, South Africa"}
- Page Type: ${f.page || "Homepage / Service page"}

Deliver complete SEO brief:
1. Primary keyword analysis + difficulty estimate
2. 15 related long-tail keywords to target
3. Optimised page title (60 chars) — 3 variants
4. Meta description (155 chars) — 3 variants
5. H1, H2, H3 structure recommendation
6. Content brief — what to include, minimum word count, LSI keywords
7. Internal linking opportunities
8. 5 backlink acquisition strategies for African websites
9. Technical SEO checklist (Core Web Vitals, schema markup, etc.)
10. Local SEO tips for ${f.location || "African"} markets`,

  "email-campaign": (f) => `Create a complete email marketing campaign for:
- Brand: ${f.name || "My Brand"}
- Product/Offer: ${f.product || "New course launch"}
- List Size: ${f.listsize || "500 subscribers"}
- Campaign Goal: ${f.goal || "Convert 5% to paying customers"}
- Audience Temperature: ${f.temp || "Warm — they signed up 2-4 weeks ago"}

Build a 7-email nurture sequence:
Email 1 — Welcome/Value bomb (Day 0): subject line + full copy
Email 2 — Story/Problem (Day 2): subject line + copy outline
Email 3 — Solution intro (Day 4): subject + copy
Email 4 — Social proof (Day 6): testimonial format + copy
Email 5 — Objection handler (Day 8): top 3 objections + responses
Email 6 — Urgency/Offer (Day 10): scarcity framing + copy
Email 7 — Last chance (Day 11): FOMO email + copy

Also include:
- 5 A/B subject line test pairs
- Optimal send times for African audiences
- Re-engagement email for non-openers`,

  "social-bio": (f) => `Create a cohesive brand voice and bio package for:
- Brand Name: ${f.name || "My Brand"}
- Industry: ${f.industry || "Technology"}
- What you do: ${f.product || "Help African businesses grow online"}
- Target Customer: ${f.audience || "Small business owners in Africa"}
- Brand Personality: ${f.tone || "Bold, approachable, pan-African"}
- Key Differentiator: ${f.diff || "Africa-first approach, understands local markets"}

Generate complete brand identity package:
1. Brand voice guide — 3 adjectives + 3 things we never say
2. Instagram bio (150 chars) — 3 variants
3. Twitter/X bio (160 chars) — 3 variants
4. LinkedIn company page tagline + about section (300 words)
5. TikTok bio (80 chars) + link-in-bio strategy
6. WhatsApp Business description
7. Brand hashtag strategy — 1 branded + 10 community hashtags
8. Tone guide for: customer complaints, wins/celebrations, educational content`,
};

export default function DigitalMarketingPage() {
  const { token } = useAuthStore();
  const [activeTool, setActiveTool] = useState<ToolKey>("marketing-strategy");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");
  const [streaming, setStreaming] = useState(false);

  function setField(key: string, value: string) {
    setFields(prev => ({ ...prev, [key]: value }));
  }

  async function generate() {
    if (!token) { setOutput("⚠ Please sign in to use marketing tools."); return; }
    setOutput(""); setStreaming(true);
    const prompt = PROMPTS[activeTool](fields);
    try {
      const res = await fetch(`${API_BASE}/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: prompt, assistant: "atlas", history: [] }),
      });
      if (!res.body) throw new Error("No stream");
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
    } catch { setOutput("⚠ Generation failed. Please try again."); }
    finally { setStreaming(false); }
  }

  const tool = TOOLS.find(t => t.id === activeTool)!;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "'Syne', sans-serif" }}>
      <style>{`
        .dm-input {
          width: 100%;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 5px;
          padding: 10px 13px;
          color: var(--text);
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          transition: border-color 200ms ease;
          box-sizing: border-box;
        }
        .dm-input:focus { outline: none; border-color: rgba(201,168,76,0.4); }
        .dm-label {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 6px;
          display: block;
        }
        .dm-tool-btn {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 14px 16px;
          cursor: pointer;
          text-align: left;
          transition: all 200ms ease;
          width: 100%;
          color: var(--text);
          font-family: 'Syne', sans-serif;
        }
        .dm-tool-btn:hover { border-color: rgba(201,168,76,0.4); }
        .dm-tool-btn.active { background: rgba(201,168,76,0.07); border-color: var(--gold); }
        .dm-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          position: relative;
          overflow: hidden;
        }
        .dm-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--purple), transparent);
        }
        .dm-gen-btn {
          background: linear-gradient(135deg, var(--gold), #a07030);
          color: var(--bg);
          border: none;
          border-radius: 5px;
          padding: 12px 32px;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 700;
          cursor: pointer;
          transition: all 200ms ease;
        }
        .dm-gen-btn:hover { filter: brightness(1.1); }
        .dm-gen-btn:disabled { background: var(--border); cursor: not-allowed; color: var(--text-dim); }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
        .dm-stat {
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 16px;
          text-align: center;
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* Context bar */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          <span className="ctx-badge live">⬡ Core Engine</span>
          <span className="ctx-sep">›</span>
          <span className="ctx-badge building">🛒 Market</span>
          <span className="ctx-sep">›</span>
          <span className="ctx-badge active">📣 Digital Marketing</span>
        </div>

        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <Link to="/market" style={{ color: "var(--text-dim)", fontSize: 13, textDecoration: "none" }}>← Winners Market</Link>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.4rem", fontWeight: 300, color: "var(--purple)", marginTop: 12, marginBottom: 8 }}>
            Digital Marketing Hub
          </h1>
          <p style={{ color: "var(--text-dim)", fontSize: 14, lineHeight: 1.7, maxWidth: 620 }}>
            AI marketing tools built for African businesses. Strategy, content calendars, ad copy, SEO, email campaigns — all customised for African and diaspora markets.
          </p>
        </div>

        {/* Stats bar */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 32 }}>
          {[
            { label: "Africa's Social Users", value: "570M+", sub: "growing 10% YoY" },
            { label: "WhatsApp Penetration", value: "90%+", sub: "in key markets" },
            { label: "Mobile-First Users", value: "96%", sub: "of African internet" },
            { label: "Avg CPM Savings vs EU", value: "8x", sub: "lower ad costs" },
          ].map(s => (
            <div key={s.label} className="dm-stat">
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "1.8rem", fontWeight: 600, color: "var(--gold)", lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8.5, color: "var(--text-dim)", letterSpacing: "0.08em", marginTop: 4 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 24 }}>

          {/* Tool sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: 8 }}>
              Marketing Tools
            </div>
            {TOOLS.map(t => (
              <button key={t.id} className={`dm-tool-btn ${activeTool === t.id ? "active" : ""}`}
                onClick={() => { setActiveTool(t.id); setOutput(""); setFields({}); }}>
                <div style={{ fontSize: 18, marginBottom: 5 }}>{t.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3, color: activeTool === t.id ? t.color : "var(--text)" }}>{t.label}</div>
                <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{t.tagline}</div>
              </button>
            ))}
          </div>

          {/* Main panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="dm-card" style={{ padding: 28 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 22, marginBottom: 4 }}>{tool.icon} <span style={{ color: tool.color }}>{tool.label}</span></div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--text-dim)", letterSpacing: "0.1em" }}>
                  ATLAS AI · PHASE 4B · DIGITAL MARKETING HUB
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

                {activeTool === "marketing-strategy" && <>
                  <div><label className="dm-label">Business Name</label><input className="dm-input" placeholder="e.g. Kojo's Tailoring Studio" value={fields.name || ""} onChange={e => setField("name", e.target.value)} /></div>
                  <div><label className="dm-label">Product / Service</label><input className="dm-input" placeholder="e.g. Custom African print clothing" value={fields.product || ""} onChange={e => setField("product", e.target.value)} /></div>
                  <div><label className="dm-label">Target Audience</label><input className="dm-input" placeholder="e.g. Diaspora Africans in UK, 25-40" value={fields.audience || ""} onChange={e => setField("audience", e.target.value)} /></div>
                  <div><label className="dm-label">Monthly Budget</label><input className="dm-input" placeholder="e.g. $200/month" value={fields.budget || ""} onChange={e => setField("budget", e.target.value)} /></div>
                  <div><label className="dm-label">Key Goal</label><input className="dm-input" placeholder="e.g. 50 orders/month" value={fields.goal || ""} onChange={e => setField("goal", e.target.value)} /></div>
                  <div><label className="dm-label">Timeline</label><input className="dm-input" placeholder="e.g. 90 days" value={fields.timeline || ""} onChange={e => setField("timeline", e.target.value)} /></div>
                </>}

                {activeTool === "content-calendar" && <>
                  <div><label className="dm-label">Brand Name</label><input className="dm-input" placeholder="e.g. AfriCraft" value={fields.name || ""} onChange={e => setField("name", e.target.value)} /></div>
                  <div><label className="dm-label">Industry</label><input className="dm-input" placeholder="e.g. Fashion, Food, Tech" value={fields.industry || ""} onChange={e => setField("industry", e.target.value)} /></div>
                  <div><label className="dm-label">Platforms</label><input className="dm-input" placeholder="e.g. Instagram, TikTok, LinkedIn" value={fields.platforms || ""} onChange={e => setField("platforms", e.target.value)} /></div>
                  <div><label className="dm-label">Brand Tone</label><input className="dm-input" placeholder="e.g. Fun and educational" value={fields.tone || ""} onChange={e => setField("tone", e.target.value)} /></div>
                  <div><label className="dm-label">Goal</label><input className="dm-input" placeholder="e.g. Grow to 10K followers" value={fields.goal || ""} onChange={e => setField("goal", e.target.value)} /></div>
                  <div><label className="dm-label">Target Audience</label><input className="dm-input" placeholder="e.g. Young African creatives" value={fields.audience || ""} onChange={e => setField("audience", e.target.value)} /></div>
                </>}

                {activeTool === "ad-copy" && <>
                  <div><label className="dm-label">Product / Service</label><input className="dm-input" placeholder="e.g. Skincare subscription box" value={fields.product || ""} onChange={e => setField("product", e.target.value)} /></div>
                  <div><label className="dm-label">Target Audience</label><input className="dm-input" placeholder="e.g. African women in diaspora, 25-40" value={fields.audience || ""} onChange={e => setField("audience", e.target.value)} /></div>
                  <div><label className="dm-label">Key Benefit</label><input className="dm-input" placeholder="e.g. Products made for dark skin tones" value={fields.benefit || ""} onChange={e => setField("benefit", e.target.value)} /></div>
                  <div><label className="dm-label">Offer / CTA</label><input className="dm-input" placeholder="e.g. First box 50% off — use WINNERS" value={fields.cta || ""} onChange={e => setField("cta", e.target.value)} /></div>
                  <div><label className="dm-label">Daily Budget</label><input className="dm-input" placeholder="e.g. $20/day" value={fields.budget || ""} onChange={e => setField("budget", e.target.value)} /></div>
                  <div><label className="dm-label">Platforms</label><input className="dm-input" placeholder="e.g. Facebook, Instagram, TikTok" value={fields.platforms || ""} onChange={e => setField("platforms", e.target.value)} /></div>
                </>}

                {activeTool === "seo-optimizer" && <>
                  <div><label className="dm-label">Business / Page Name</label><input className="dm-input" placeholder="e.g. Winners Academy Homepage" value={fields.name || ""} onChange={e => setField("name", e.target.value)} /></div>
                  <div><label className="dm-label">Industry</label><input className="dm-input" placeholder="e.g. EdTech, HealthTech" value={fields.industry || ""} onChange={e => setField("industry", e.target.value)} /></div>
                  <div><label className="dm-label">Primary Keyword</label><input className="dm-input" placeholder="e.g. online courses nigeria" value={fields.keyword || ""} onChange={e => setField("keyword", e.target.value)} /></div>
                  <div><label className="dm-label">Target Location</label><input className="dm-input" placeholder="e.g. Nigeria, Kenya, South Africa" value={fields.location || ""} onChange={e => setField("location", e.target.value)} /></div>
                  <div style={{ gridColumn: "span 2" }}><label className="dm-label">Page Type</label><input className="dm-input" placeholder="e.g. Homepage, Blog post, Product page, Service page" value={fields.page || ""} onChange={e => setField("page", e.target.value)} /></div>
                </>}

                {activeTool === "email-campaign" && <>
                  <div><label className="dm-label">Brand Name</label><input className="dm-input" placeholder="e.g. AfriLearn" value={fields.name || ""} onChange={e => setField("name", e.target.value)} /></div>
                  <div><label className="dm-label">Product / Offer</label><input className="dm-input" placeholder="e.g. Digital Marketing Masterclass" value={fields.product || ""} onChange={e => setField("product", e.target.value)} /></div>
                  <div><label className="dm-label">List Size</label><input className="dm-input" placeholder="e.g. 1,200 subscribers" value={fields.listsize || ""} onChange={e => setField("listsize", e.target.value)} /></div>
                  <div><label className="dm-label">Conversion Goal</label><input className="dm-input" placeholder="e.g. Sell 50 course slots at $99" value={fields.goal || ""} onChange={e => setField("goal", e.target.value)} /></div>
                  <div style={{ gridColumn: "span 2" }}><label className="dm-label">Audience Temperature</label><input className="dm-input" placeholder="e.g. Cold (new subscribers) / Warm (engaged 30 days) / Hot (cart abandoners)" value={fields.temp || ""} onChange={e => setField("temp", e.target.value)} /></div>
                </>}

                {activeTool === "social-bio" && <>
                  <div><label className="dm-label">Brand Name</label><input className="dm-input" placeholder="e.g. Nkemdirim Studio" value={fields.name || ""} onChange={e => setField("name", e.target.value)} /></div>
                  <div><label className="dm-label">Industry</label><input className="dm-input" placeholder="e.g. Photography, Coaching, SaaS" value={fields.industry || ""} onChange={e => setField("industry", e.target.value)} /></div>
                  <div><label className="dm-label">What You Do</label><input className="dm-input" placeholder="e.g. Help African brands tell their story visually" value={fields.product || ""} onChange={e => setField("product", e.target.value)} /></div>
                  <div><label className="dm-label">Target Customer</label><input className="dm-input" placeholder="e.g. Growing African-owned businesses" value={fields.audience || ""} onChange={e => setField("audience", e.target.value)} /></div>
                  <div><label className="dm-label">Brand Personality</label><input className="dm-input" placeholder="e.g. Bold, creative, authentic" value={fields.tone || ""} onChange={e => setField("tone", e.target.value)} /></div>
                  <div><label className="dm-label">Key Differentiator</label><input className="dm-input" placeholder="e.g. 10 years shooting African culture globally" value={fields.diff || ""} onChange={e => setField("diff", e.target.value)} /></div>
                </>}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="dm-gen-btn" onClick={generate} disabled={streaming}>
                  {streaming ? "Generating..." : `Generate ${tool.label} →`}
                </button>
              </div>
            </div>

            {/* Output */}
            {(output || streaming) && (
              <div className="dm-card" style={{ padding: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--purple)", animation: streaming ? "pulse 1s infinite" : "none" }} />
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--purple)", letterSpacing: "0.14em" }}>
                    {streaming ? "ATLAS GENERATING..." : "GENERATION COMPLETE"}
                  </span>
                  {!streaming && (
                    <button onClick={() => navigator.clipboard?.writeText(output)}
                      style={{ marginLeft: "auto", background: "transparent", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 12px", color: "var(--text-dim)", fontSize: 11, cursor: "pointer", fontFamily: "'Space Mono', monospace" }}>
                      Copy All
                    </button>
                  )}
                </div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13.5, lineHeight: 1.85, color: "var(--text)", whiteSpace: "pre-wrap", maxHeight: 640, overflowY: "auto" }}>
                  {output.split("\n").map((line, i) => {
                    const isHeading = /^[🎯📅📣🔎📧✨📊💡🌍✅🏆1-9🔑📌⚡]/.test(line) || /^[A-Z][A-Z ]{3,}:/.test(line);
                    return (
                      <div key={i} style={{ marginBottom: isHeading ? 10 : 3, fontWeight: isHeading ? 700 : 400, color: isHeading ? "var(--text)" : "var(--text-dim)", fontSize: isHeading ? 14 : 13 }}>
                        {line}
                      </div>
                    );
                  })}
                  {streaming && <span style={{ display: "inline-block", width: 7, height: 14, background: "var(--purple)", animation: "pulse 0.7s step-end infinite", borderRadius: 1, verticalAlign: "middle" }} />}
                </div>
              </div>
            )}

            {!output && !streaming && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                {[
                  { icon: "📱", label: "WhatsApp-First", desc: "90%+ of African users are on WhatsApp. Every strategy starts here." },
                  { icon: "🌍", label: "Local Context", desc: "Naira, Cedi, Shilling pricing. Local cultural references that convert." },
                  { icon: "📊", label: "ROI-Focused", desc: "Every tool gives you metrics to measure. No vanity metrics." },
                  { icon: "⚡", label: "Copy-Paste Ready", desc: "All output is formatted and ready to deploy immediately." },
                ].map(tip => (
                  <div key={tip.label} style={{ background: "rgba(155,111,255,0.04)", border: "1px solid rgba(155,111,255,0.12)", borderRadius: 6, padding: "14px 16px" }}>
                    <div style={{ fontSize: 20, marginBottom: 6 }}>{tip.icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{tip.label}</div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)", lineHeight: 1.6 }}>{tip.desc}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AssistantPanel assistant="atlas" page="digital-marketing" />
    </div>
  );
}
