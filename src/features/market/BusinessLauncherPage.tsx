// Phase 4E — Winners Market: Business Launcher
// AI-powered business plan generator, pitch deck builder, financial projections
// ATLAS AI supervisor — via /api/v1/chat/message backend route

import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";
import AssistantPanel from "../../components/ui/AssistantPanel";

const API_BASE = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || "http://localhost:3001/api/v1";

type ToolKey = "business-plan" | "pitch-deck" | "financial-projections" | "legal-templates" | "market-research";

interface Tool {
  id: ToolKey;
  icon: string;
  label: string;
  tagline: string;
  credits: string;
}

const TOOLS: Tool[] = [
  { id: "business-plan",          icon: "📋", label: "Business Plan",        tagline: "Full investor-ready document",  credits: "5 credits" },
  { id: "pitch-deck",             icon: "🎯", label: "Pitch Deck Outline",   tagline: "12-slide investor structure",   credits: "3 credits" },
  { id: "financial-projections",  icon: "📊", label: "Financial Projections", tagline: "3-year revenue model",         credits: "4 credits" },
  { id: "market-research",        icon: "🔍", label: "Market Research",       tagline: "Competitor & opportunity map",  credits: "4 credits" },
  { id: "legal-templates",        icon: "📄", label: "Legal Templates",       tagline: "NDA, MoU, Shareholder guides",  credits: "2 credits" },
];

const TOOL_PROMPTS: Record<ToolKey, (f: Record<string, string>) => string> = {
  "business-plan": (f) => `Generate a comprehensive, investor-ready business plan for:
- Business Name: ${f.name || "My Startup"}
- Industry: ${f.industry || "Technology"}
- Target Market: ${f.market || "East Africa, ages 18-35"}
- Starting Budget: ${f.budget || "$1,000"}
- Business Model: ${f.model || "Subscription SaaS"}

Structure it with: Executive Summary, Market Analysis (TAM/SAM/SOM), Competitive Advantage, Revenue Model, Financial Projections (Year 1-3), Go-to-Market Strategy, Team & Operations, Risk Mitigation, and Funding Ask. Be specific with numbers. Tailor for African/diaspora markets.`,

  "pitch-deck": (f) => `Create a compelling 12-slide investor pitch deck for:
- Startup: ${f.name || "My Startup"}
- Problem being solved: ${f.problem || "Lack of digital services in Africa"}
- Solution: ${f.solution || "A mobile-first platform"}
- Stage: ${f.stage || "Pre-seed"}
- Raising: ${f.budget || "$500,000"}
- Traction: ${f.traction || "500 beta users, $5K MRR"}

For each slide: provide the TITLE, KEY MESSAGE, and bullet points of what to include. Make it compelling for African-focused investors and global VCs.`,

  "financial-projections": (f) => `Build a 3-year financial projection model for:
- Business: ${f.name || "My Startup"}
- Revenue Model: ${f.model || "SaaS subscription $29/month"}
- Starting Customers: ${f.customers || "10 paying customers"}
- Growth Target: ${f.growth || "20% month-over-month"}
- Fixed Costs/Month: ${f.costs || "$2,000"}

Include: Monthly revenue projections (Year 1), Quarterly projections (Years 2-3), Customer acquisition assumptions, Gross margin, Operating expenses breakdown, Break-even analysis, and Key financial metrics (MRR, ARR, CAC, LTV). Format as structured tables.`,

  "market-research": (f) => `Conduct comprehensive market research for:
- Business/Product: ${f.name || "My Startup"}
- Industry: ${f.industry || "EdTech"}
- Target Geography: ${f.market || "Nigeria, Kenya, Ghana"}
- Target Customer: ${f.customer || "Young professionals 22-35"}

Provide: Market Size (TAM/SAM/SOM with actual figures), Top 5 competitors (strengths, weaknesses, pricing), Market gaps and opportunities, Customer pain points and buying behavior, Recommended pricing strategy, Key market entry barriers, and 3 quick-win opportunities to capture market share.`,

  "legal-templates": (f) => `Provide legal document templates for an African startup in ${f.industry || "Technology"} registered in ${f.country || "Kenya"}.

Generate: 
1. NDA template (Non-Disclosure Agreement) — concise, legally sound
2. Founder agreement key clauses — equity split, vesting, IP assignment
3. MoU template (Memorandum of Understanding) for partnerships
4. Simple service agreement outline for client work
5. Privacy policy key sections for a digital platform

Note any jurisdiction-specific considerations for ${f.country || "Kenya"}, Nigeria, or Ghana.`,
};

export default function BusinessLauncherPage() {
  const { token } = useAuthStore();
  const [activeTool, setActiveTool] = useState<ToolKey>("business-plan");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");
  const [streaming, setStreaming] = useState(false);

  function setField(key: string, value: string) {
    setFields(prev => ({ ...prev, [key]: value }));
  }

  async function generate() {
    if (!token) {
      setOutput("⚠ Please sign in to use AI tools.");
      return;
    }
    setOutput(""); setStreaming(true);
    const prompt = TOOL_PROMPTS[activeTool](fields);

    try {
      const res = await fetch(`${API_BASE}/chat/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: prompt,
          assistant: "atlas",
          history: [],
        }),
      });

      if (!res.body) throw new Error("No stream body");
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
    } catch {
      setOutput("⚠ Generation failed. Please try again.");
    } finally {
      setStreaming(false);
    }
  }

  const tool = TOOLS.find(t => t.id === activeTool)!;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "'Syne', sans-serif" }}>
      <style>{`
        .bl-input {
          width: 100%;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 5px;
          padding: 10px 13px;
          color: var(--text);
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          transition: border-color 200ms ease;
        }
        .bl-input:focus { outline: none; border-color: rgba(201,168,76,0.4); }
        .bl-label {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 6px;
          display: block;
        }
        .bl-tool-btn {
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
        .bl-tool-btn:hover { border-color: var(--gold); }
        .bl-tool-btn.active { background: rgba(201,168,76,0.08); border-color: var(--gold); }
        .bl-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          position: relative;
          overflow: hidden;
        }
        .bl-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--ice), transparent);
        }
        .bl-gen-btn {
          background: var(--gold);
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
        .bl-gen-btn:hover { filter: brightness(1.1); }
        .bl-gen-btn:disabled { background: var(--border); cursor: not-allowed; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* Context bar */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          <span className="ctx-badge live">⬡ Core Engine</span>
          <span className="ctx-sep">›</span>
          <span className="ctx-badge building">🛒 Market</span>
          <span className="ctx-sep">›</span>
          <span className="ctx-badge active">📋 Business Launcher</span>
        </div>

        <div style={{ marginBottom: 32 }}>
          <Link to="/market" style={{ color: "var(--text-dim)", fontSize: 13, textDecoration: "none" }}>← Winners Market</Link>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.4rem", fontWeight: 300, color: "var(--gold)", marginTop: 12, marginBottom: 8 }}>
            Business Launcher
          </h1>
          <p style={{ color: "var(--text-dim)", fontSize: 14, lineHeight: 1.7, maxWidth: 600 }}>
            AI-powered tools to convert your idea into an investor-ready business. Generate business plans, pitch decks, financial projections, and legal templates in minutes — powered by ATLAS.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 24 }}>

          {/* Tool selector */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: 8 }}>
              AI Tools
            </div>
            {TOOLS.map(t => (
              <button key={t.id} className={`bl-tool-btn ${activeTool === t.id ? "active" : ""}`}
                onClick={() => { setActiveTool(t.id); setOutput(""); setFields({}); }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{t.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>{t.label}</div>
                <div style={{ fontSize: 11, color: "var(--text-dim)" }}>{t.tagline}</div>
                <div style={{ marginTop: 6, fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--gold)" }}>{t.credits}</div>
              </button>
            ))}
          </div>

          {/* Main content */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Tool form */}
            <div className="bl-card" style={{ padding: 28 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{tool.icon} {tool.label}</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--ice)", letterSpacing: "0.1em" }}>
                  ATLAS AI · PHASE 4E · {tool.credits.toUpperCase()}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

                {activeTool === "business-plan" && <>
                  <div><label className="bl-label">Business Name</label><input className="bl-input" placeholder="e.g. AgriConnect Kenya" value={fields.name || ""} onChange={e => setField("name", e.target.value)} /></div>
                  <div><label className="bl-label">Industry</label><input className="bl-input" placeholder="e.g. AgriTech, EdTech, FinTech" value={fields.industry || ""} onChange={e => setField("industry", e.target.value)} /></div>
                  <div><label className="bl-label">Target Market</label><input className="bl-input" placeholder="e.g. Smallholder farmers in East Africa" value={fields.market || ""} onChange={e => setField("market", e.target.value)} /></div>
                  <div><label className="bl-label">Starting Budget</label><input className="bl-input" placeholder="e.g. $5,000" value={fields.budget || ""} onChange={e => setField("budget", e.target.value)} /></div>
                  <div style={{ gridColumn: "span 2" }}><label className="bl-label">Business Model</label><input className="bl-input" placeholder="e.g. Subscription SaaS, marketplace, freemium" value={fields.model || ""} onChange={e => setField("model", e.target.value)} /></div>
                </>}

                {activeTool === "pitch-deck" && <>
                  <div><label className="bl-label">Startup Name</label><input className="bl-input" placeholder="e.g. LendFast Africa" value={fields.name || ""} onChange={e => setField("name", e.target.value)} /></div>
                  <div><label className="bl-label">Funding Stage</label><input className="bl-input" placeholder="e.g. Pre-seed, Seed, Series A" value={fields.stage || ""} onChange={e => setField("stage", e.target.value)} /></div>
                  <div><label className="bl-label">Problem</label><input className="bl-input" placeholder="e.g. SMEs can't access quick business loans" value={fields.problem || ""} onChange={e => setField("problem", e.target.value)} /></div>
                  <div><label className="bl-label">Solution</label><input className="bl-input" placeholder="e.g. Mobile-first credit scoring" value={fields.solution || ""} onChange={e => setField("solution", e.target.value)} /></div>
                  <div><label className="bl-label">Amount Raising</label><input className="bl-input" placeholder="e.g. $500,000" value={fields.budget || ""} onChange={e => setField("budget", e.target.value)} /></div>
                  <div><label className="bl-label">Current Traction</label><input className="bl-input" placeholder="e.g. 200 users, $8K MRR" value={fields.traction || ""} onChange={e => setField("traction", e.target.value)} /></div>
                </>}

                {activeTool === "financial-projections" && <>
                  <div><label className="bl-label">Business Name</label><input className="bl-input" placeholder="e.g. My SaaS Platform" value={fields.name || ""} onChange={e => setField("name", e.target.value)} /></div>
                  <div><label className="bl-label">Revenue Model</label><input className="bl-input" placeholder="e.g. $29/mo subscription" value={fields.model || ""} onChange={e => setField("model", e.target.value)} /></div>
                  <div><label className="bl-label">Starting Customers</label><input className="bl-input" placeholder="e.g. 10 paying customers" value={fields.customers || ""} onChange={e => setField("customers", e.target.value)} /></div>
                  <div><label className="bl-label">Monthly Growth Target</label><input className="bl-input" placeholder="e.g. 15-20% MoM" value={fields.growth || ""} onChange={e => setField("growth", e.target.value)} /></div>
                  <div style={{ gridColumn: "span 2" }}><label className="bl-label">Fixed Monthly Costs</label><input className="bl-input" placeholder="e.g. $2,000 (rent, salaries, tools)" value={fields.costs || ""} onChange={e => setField("costs", e.target.value)} /></div>
                </>}

                {activeTool === "market-research" && <>
                  <div><label className="bl-label">Business / Product</label><input className="bl-input" placeholder="e.g. Online tutoring platform" value={fields.name || ""} onChange={e => setField("name", e.target.value)} /></div>
                  <div><label className="bl-label">Industry</label><input className="bl-input" placeholder="e.g. EdTech" value={fields.industry || ""} onChange={e => setField("industry", e.target.value)} /></div>
                  <div><label className="bl-label">Target Geography</label><input className="bl-input" placeholder="e.g. Nigeria, Kenya, Ghana" value={fields.market || ""} onChange={e => setField("market", e.target.value)} /></div>
                  <div><label className="bl-label">Target Customer</label><input className="bl-input" placeholder="e.g. University students 18-25" value={fields.customer || ""} onChange={e => setField("customer", e.target.value)} /></div>
                </>}

                {activeTool === "legal-templates" && <>
                  <div><label className="bl-label">Industry</label><input className="bl-input" placeholder="e.g. Technology, Health, Finance" value={fields.industry || ""} onChange={e => setField("industry", e.target.value)} /></div>
                  <div><label className="bl-label">Country of Registration</label><input className="bl-input" placeholder="e.g. Kenya, Nigeria, Ghana, UK" value={fields.country || ""} onChange={e => setField("country", e.target.value)} /></div>
                </>}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="bl-gen-btn" onClick={generate} disabled={streaming}>
                  {streaming ? "Generating..." : `Generate ${tool.label} →`}
                </button>
              </div>
            </div>

            {/* Output */}
            {(output || streaming) && (
              <div className="bl-card" style={{ padding: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--gold)", animation: streaming ? "pulse 1s infinite" : "none" }} />
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--gold)", letterSpacing: "0.14em" }}>
                    {streaming ? "ATLAS GENERATING..." : "GENERATION COMPLETE"}
                  </span>
                  {!streaming && (
                    <button onClick={() => navigator.clipboard?.writeText(output)}
                      style={{ marginLeft: "auto", background: "transparent", border: "1px solid var(--border)", borderRadius: 4, padding: "4px 12px", color: "var(--text-dim)", fontSize: 11, cursor: "pointer", fontFamily: "'Space Mono', monospace" }}>
                      Copy
                    </button>
                  )}
                </div>
                <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 13.5, lineHeight: 1.85, color: "var(--text)", whiteSpace: "pre-wrap", maxHeight: 600, overflowY: "auto" }}>
                  {output.split("\n").map((line, i) => {
                    const isHeading = /^[🎯🔍💼📊🚀👥⚡💰📋💡🌍📣📅📌🏆🛠✅🔑1-9]/u.test(line);
                    return (
                      <div key={i} style={{ marginBottom: isHeading ? 10 : 3, fontWeight: isHeading ? 700 : 400, color: isHeading ? "var(--text)" : "var(--text-dim)", fontSize: isHeading ? 14 : 13 }}>
                        {line}
                      </div>
                    );
                  })}
                  {streaming && <span style={{ display: "inline-block", width: 7, height: 14, background: "var(--gold)", animation: "pulse 0.7s step-end infinite", borderRadius: 1, verticalAlign: "middle" }} />}
                </div>
              </div>
            )}

            {/* Agentic Loop connection */}
            {!output && !streaming && (
              <div style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.15)", borderRadius: 6, padding: "16px 20px" }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8.5, color: "var(--gold)", letterSpacing: "0.12em", marginBottom: 8 }}>AGENTIC LOOP CONNECTION</div>
                <p style={{ fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.7 }}>
                  Generate your business plan → take Academy courses to fill skill gaps → post in Community to find co-founders → use Winners Work to hire your first team member → sell through Winners Market.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AssistantPanel assistant="atlas" page="business-launcher" />
    </div>
  );
}
