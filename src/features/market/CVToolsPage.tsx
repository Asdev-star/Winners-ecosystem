// Phase 4F — Winners Market: CV & Career Tools
// ATS-optimised CV builder, cover letter generator, interview prep, LinkedIn optimizer
// CIRCUIT AI supervisor (Work layer) — via /api/v1/chat/message backend route

import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";
import AssistantPanel from "../../components/ui/AssistantPanel";

const API_BASE = (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL || "http://localhost:3001/api/v1";

type ToolKey = "cv-builder" | "cover-letter" | "interview-prep" | "linkedin-optimizer" | "salary-negotiation";

interface Tool {
  id: ToolKey;
  icon: string;
  label: string;
  tagline: string;
  badge: string;
}

const TOOLS: Tool[] = [
  { id: "cv-builder",          icon: "📄", label: "ATS CV Builder",       tagline: "Passes applicant tracking systems",   badge: "HIGH DEMAND" },
  { id: "cover-letter",        icon: "✉️",  label: "Cover Letter",         tagline: "Personalised for each job role",       badge: "MOST USED" },
  { id: "interview-prep",      icon: "🎤", label: "Interview Prep",       tagline: "Role-specific Q&A training",           badge: "POPULAR" },
  { id: "linkedin-optimizer",  icon: "💼", label: "LinkedIn Optimizer",   tagline: "Profile headline & summary rewrite",   badge: "FAST" },
  { id: "salary-negotiation",  icon: "💰", label: "Salary Negotiation",   tagline: "Script & strategy for your market",    badge: "HIGH VALUE" },
];

const PROMPTS: Record<ToolKey, (f: Record<string, string>) => string> = {
  "cv-builder": (f) => `Create a professional, ATS-optimised CV for:
- Name: ${f.name || "John Doe"}
- Role Applying For: ${f.role || "Software Engineer"}
- Years Experience: ${f.experience || "3 years"}
- Current/Last Company: ${f.company || "Tech Company"}
- Key Skills: ${f.skills || "JavaScript, React, Node.js"}
- Education: ${f.education || "BSc Computer Science, University of Nairobi"}
- Location: ${f.location || "Nairobi, Kenya"}
- Target Market: ${f.market || "African tech companies and global remote roles"}

Generate: Contact section header, Professional Summary (3 sentences, achievement-focused), Core Skills section (keyword-optimised for ATS), Work Experience template (3 roles with bullet-point achievements using metrics), Education section, certifications placeholder, and ATS keyword recommendations for the role. Format clearly with section headers.`,

  "cover-letter": (f) => `Write a compelling, personalised cover letter for:
- Applicant: ${f.name || "Applicant Name"}
- Role: ${f.role || "Product Manager"}
- Company: ${f.company || "Target Company"}
- Company's main product/mission: ${f.mission || "Building Africa's leading fintech"}
- Key strength to highlight: ${f.strength || "3 years building products in African markets"}
- Specific achievement: ${f.achievement || "Grew user base from 0 to 10,000 in 6 months"}

Write a 4-paragraph cover letter: Hook opening (why this specific company), Value proposition (what you bring + key achievement), Alignment with company mission, Strong call to action. Tone: professional but warm. Max 350 words. Avoid clichés like "I am writing to express my interest."`,

  "interview-prep": (f) => `Create a comprehensive interview preparation guide for:
- Role: ${f.role || "Data Analyst"}
- Industry: ${f.industry || "FinTech"}
- Experience Level: ${f.level || "Mid-level (3-5 years)"}
- Interview Type: ${f.type || "Technical + Behavioural"}
- Target Companies: ${f.companies || "Flutterwave, Paystack, Chipper Cash"}

Generate: 
1. Top 5 Technical Questions (with model answers for this role)
2. Top 5 Behavioural Questions using STAR method (with example answers)
3. 3 Company-specific questions for these companies (research what they care about)
4. Questions YOU should ask the interviewer
5. Salary range guidance for this role in African tech markets
6. Common mistakes to avoid in ${f.industry || "FinTech"} interviews
7. A 60-second elevator pitch template for "Tell me about yourself"`,

  "linkedin-optimizer": (f) => `Optimise a LinkedIn profile for:
- Name: ${f.name || "Your Name"}
- Current Role/Title: ${f.role || "Software Engineer"}
- Industry: ${f.industry || "Technology"}
- Key Skills: ${f.skills || "Python, Machine Learning, Data Science"}
- Career Goal: ${f.goal || "Land a senior role at a top African tech company or remote global role"}
- Top Achievement: ${f.achievement || "Built an ML model that saved company $200K"}

Generate:
1. Optimised headline (120 chars, keyword-rich, value-focused)
2. 3 headline alternatives
3. About/Summary section (first-person, 300 words, story-driven)
4. Featured section suggestions
5. Skills to add for algorithm visibility
6. Top 10 keywords to sprinkle through profile for recruiters searching "${f.role || "your role"}"
7. Connection request message template to reach hiring managers`,

  "salary-negotiation": (f) => `Create a salary negotiation strategy and scripts for:
- Role: ${f.role || "Senior Engineer"}
- Location: ${f.location || "Lagos, Nigeria / Remote"}
- Current Salary: ${f.current || "$2,000/month"}
- Target Salary: ${f.target || "$4,000/month"}
- Years Experience: ${f.experience || "5 years"}
- Competing Offer: ${f.offer || "No competing offer yet"}
- Industry: ${f.industry || "Technology"}

Provide:
1. Realistic market salary range for this role in ${f.location || "Lagos/Remote"} (reference actual market data)
2. Initial negotiation script (word-for-word what to say)
3. Counter-offer response script
4. How to handle "what is your current salary?" (legal strategies)
5. Non-salary perks to negotiate if base is fixed
6. Email template to negotiate a written offer
7. When to walk away — red flags and walk-away point`,
};

export default function CVToolsPage() {
  const { token } = useAuthStore();
  const [activeTool, setActiveTool] = useState<ToolKey>("cv-builder");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");
  const [streaming, setStreaming] = useState(false);

  function setField(key: string, value: string) {
    setFields(prev => ({ ...prev, [key]: value }));
  }

  async function generate() {
    if (!token) { setOutput("⚠ Please sign in to use career tools."); return; }
    setOutput(""); setStreaming(true);
    const prompt = PROMPTS[activeTool](fields);
    try {
      const res = await fetch(`${API_BASE}/chat/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: prompt, assistant: "circuit", history: [] }),
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
        .cv-input {
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
        .cv-input:focus { outline: none; border-color: rgba(43,95,142,0.5); }
        .cv-label {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text-dim);
          margin-bottom: 6px;
          display: block;
        }
        .cv-tool-btn {
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
        .cv-tool-btn:hover { border-color: var(--ice); }
        .cv-tool-btn.active { background: rgba(137,196,225,0.07); border-color: var(--ice); }
        .cv-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          position: relative;
          overflow: hidden;
        }
        .cv-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--blue), transparent);
        }
        .cv-gen-btn {
          background: var(--blue);
          color: var(--text);
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
        .cv-gen-btn:hover { filter: brightness(1.15); }
        .cv-gen-btn:disabled { background: var(--border); cursor: not-allowed; }
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>

        {/* Context bar */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
          <span className="ctx-badge live">⬡ Core Engine</span>
          <span className="ctx-sep">›</span>
          <span className="ctx-badge building">🛒 Market</span>
          <span className="ctx-sep">›</span>
          <span className="ctx-badge active">📄 CV & Career Tools</span>
        </div>

        <div style={{ marginBottom: 32 }}>
          <Link to="/market" style={{ color: "var(--text-dim)", fontSize: 13, textDecoration: "none" }}>← Winners Market</Link>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "2.4rem", fontWeight: 300, color: "var(--ice)", marginTop: 12, marginBottom: 8 }}>
            CV & Career Tools
          </h1>
          <p style={{ color: "var(--text-dim)", fontSize: 14, lineHeight: 1.7, maxWidth: 600 }}>
            AI-powered career tools built for African professionals. ATS-optimised CVs, personalised cover letters, interview prep — all tailored to African and global remote job markets.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 24 }}>

          {/* Tool sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--text-dim)", marginBottom: 8 }}>
              Career Tools
            </div>
            {TOOLS.map(t => (
              <button key={t.id} className={`cv-tool-btn ${activeTool === t.id ? "active" : ""}`}
                onClick={() => { setActiveTool(t.id); setOutput(""); setFields({}); }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{t.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{t.label}</div>
                <div style={{ fontSize: 11, color: "var(--text-dim)", marginBottom: 6 }}>{t.tagline}</div>
                <span style={{ background: "rgba(137,196,225,0.1)", border: "1px solid rgba(137,196,225,0.2)", borderRadius: 3, padding: "2px 7px", fontFamily: "'Space Mono', monospace", fontSize: 8, color: "var(--ice)", letterSpacing: "0.1em" }}>
                  {t.badge}
                </span>
              </button>
            ))}
          </div>

          {/* Main panel */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div className="cv-card" style={{ padding: 28 }}>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 20, marginBottom: 4 }}>{tool.icon} {tool.label}</div>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--ice)", letterSpacing: "0.1em" }}>
                  CIRCUIT AI · PHASE 4F · POWERED BY WINNERS WORK LAYER
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

                {activeTool === "cv-builder" && <>
                  <div><label className="cv-label">Full Name</label><input className="cv-input" placeholder="e.g. Amara Osei" value={fields.name || ""} onChange={e => setField("name", e.target.value)} /></div>
                  <div><label className="cv-label">Role Applying For</label><input className="cv-input" placeholder="e.g. Senior Software Engineer" value={fields.role || ""} onChange={e => setField("role", e.target.value)} /></div>
                  <div><label className="cv-label">Years of Experience</label><input className="cv-input" placeholder="e.g. 4 years" value={fields.experience || ""} onChange={e => setField("experience", e.target.value)} /></div>
                  <div><label className="cv-label">Location</label><input className="cv-input" placeholder="e.g. Nairobi, Kenya / Remote" value={fields.location || ""} onChange={e => setField("location", e.target.value)} /></div>
                  <div><label className="cv-label">Key Skills</label><input className="cv-input" placeholder="e.g. React, Python, SQL, Leadership" value={fields.skills || ""} onChange={e => setField("skills", e.target.value)} /></div>
                  <div><label className="cv-label">Education</label><input className="cv-input" placeholder="e.g. BSc CS, University of Ghana" value={fields.education || ""} onChange={e => setField("education", e.target.value)} /></div>
                  <div style={{ gridColumn: "span 2" }}><label className="cv-label">Target Market</label><input className="cv-input" placeholder="e.g. African tech companies, EU remote roles" value={fields.market || ""} onChange={e => setField("market", e.target.value)} /></div>
                </>}

                {activeTool === "cover-letter" && <>
                  <div><label className="cv-label">Your Name</label><input className="cv-input" placeholder="e.g. Fatima Al-Hassan" value={fields.name || ""} onChange={e => setField("name", e.target.value)} /></div>
                  <div><label className="cv-label">Role Applying For</label><input className="cv-input" placeholder="e.g. Product Designer" value={fields.role || ""} onChange={e => setField("role", e.target.value)} /></div>
                  <div><label className="cv-label">Company Name</label><input className="cv-input" placeholder="e.g. Andela" value={fields.company || ""} onChange={e => setField("company", e.target.value)} /></div>
                  <div><label className="cv-label">Company Mission</label><input className="cv-input" placeholder="e.g. Connecting African talent globally" value={fields.mission || ""} onChange={e => setField("mission", e.target.value)} /></div>
                  <div><label className="cv-label">Your Key Strength</label><input className="cv-input" placeholder="e.g. 4 years UX design for mobile-first apps" value={fields.strength || ""} onChange={e => setField("strength", e.target.value)} /></div>
                  <div><label className="cv-label">Standout Achievement</label><input className="cv-input" placeholder="e.g. Redesigned onboarding, cut drop-off by 40%" value={fields.achievement || ""} onChange={e => setField("achievement", e.target.value)} /></div>
                </>}

                {activeTool === "interview-prep" && <>
                  <div><label className="cv-label">Role</label><input className="cv-input" placeholder="e.g. Backend Engineer" value={fields.role || ""} onChange={e => setField("role", e.target.value)} /></div>
                  <div><label className="cv-label">Industry</label><input className="cv-input" placeholder="e.g. FinTech, HealthTech" value={fields.industry || ""} onChange={e => setField("industry", e.target.value)} /></div>
                  <div><label className="cv-label">Experience Level</label><input className="cv-input" placeholder="e.g. Junior (0-2y), Mid (3-5y), Senior (6+y)" value={fields.level || ""} onChange={e => setField("level", e.target.value)} /></div>
                  <div><label className="cv-label">Interview Type</label><input className="cv-input" placeholder="e.g. Technical, Behavioural, Case study" value={fields.type || ""} onChange={e => setField("type", e.target.value)} /></div>
                  <div style={{ gridColumn: "span 2" }}><label className="cv-label">Target Companies</label><input className="cv-input" placeholder="e.g. Flutterwave, Safaricom, Kuda Bank" value={fields.companies || ""} onChange={e => setField("companies", e.target.value)} /></div>
                </>}

                {activeTool === "linkedin-optimizer" && <>
                  <div><label className="cv-label">Your Name</label><input className="cv-input" placeholder="e.g. David Mensah" value={fields.name || ""} onChange={e => setField("name", e.target.value)} /></div>
                  <div><label className="cv-label">Current Role/Title</label><input className="cv-input" placeholder="e.g. Data Scientist" value={fields.role || ""} onChange={e => setField("role", e.target.value)} /></div>
                  <div><label className="cv-label">Industry</label><input className="cv-input" placeholder="e.g. Financial Services" value={fields.industry || ""} onChange={e => setField("industry", e.target.value)} /></div>
                  <div><label className="cv-label">Key Skills</label><input className="cv-input" placeholder="e.g. Python, SQL, Machine Learning, PowerBI" value={fields.skills || ""} onChange={e => setField("skills", e.target.value)} /></div>
                  <div><label className="cv-label">Career Goal</label><input className="cv-input" placeholder="e.g. Head of Data at a top African bank" value={fields.goal || ""} onChange={e => setField("goal", e.target.value)} /></div>
                  <div><label className="cv-label">Top Achievement</label><input className="cv-input" placeholder="e.g. Built fraud detection model saving $500K/year" value={fields.achievement || ""} onChange={e => setField("achievement", e.target.value)} /></div>
                </>}

                {activeTool === "salary-negotiation" && <>
                  <div><label className="cv-label">Role</label><input className="cv-input" placeholder="e.g. Senior Product Manager" value={fields.role || ""} onChange={e => setField("role", e.target.value)} /></div>
                  <div><label className="cv-label">Industry</label><input className="cv-input" placeholder="e.g. FinTech" value={fields.industry || ""} onChange={e => setField("industry", e.target.value)} /></div>
                  <div><label className="cv-label">Location</label><input className="cv-input" placeholder="e.g. Lagos, Nigeria / Remote" value={fields.location || ""} onChange={e => setField("location", e.target.value)} /></div>
                  <div><label className="cv-label">Years of Experience</label><input className="cv-input" placeholder="e.g. 6 years" value={fields.experience || ""} onChange={e => setField("experience", e.target.value)} /></div>
                  <div><label className="cv-label">Current Salary</label><input className="cv-input" placeholder="e.g. ₦800,000/month or $2,500/month" value={fields.current || ""} onChange={e => setField("current", e.target.value)} /></div>
                  <div><label className="cv-label">Target Salary</label><input className="cv-input" placeholder="e.g. ₦1,500,000/month or $5,000/month" value={fields.target || ""} onChange={e => setField("target", e.target.value)} /></div>
                </>}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="cv-gen-btn" onClick={generate} disabled={streaming}>
                  {streaming ? "Generating..." : `Generate ${tool.label} →`}
                </button>
              </div>
            </div>

            {/* Output */}
            {(output || streaming) && (
              <div className="cv-card" style={{ padding: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--ice)", animation: streaming ? "pulse 1s infinite" : "none" }} />
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, color: "var(--ice)", letterSpacing: "0.14em" }}>
                    {streaming ? "CIRCUIT GENERATING..." : "GENERATION COMPLETE"}
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
                    const isHeading = /^[📄✉🎤💼💰📋✅1-9🎯🔑💡🌍]/.test(line) || /^#{1,3} /.test(line);
                    return (
                      <div key={i} style={{ marginBottom: isHeading ? 10 : 3, fontWeight: isHeading ? 700 : 400, color: isHeading ? "var(--text)" : "var(--text-dim)", fontSize: isHeading ? 14 : 13 }}>
                        {line.replace(/^#{1,3} /, "")}
                      </div>
                    );
                  })}
                  {streaming && <span style={{ display: "inline-block", width: 7, height: 14, background: "var(--ice)", animation: "pulse 0.7s step-end infinite", borderRadius: 1, verticalAlign: "middle" }} />}
                </div>
              </div>
            )}

            {!output && !streaming && (
              <div style={{ background: "rgba(43,95,142,0.06)", border: "1px solid rgba(43,95,142,0.2)", borderRadius: 6, padding: "16px 20px" }}>
                <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 8.5, color: "var(--ice)", letterSpacing: "0.12em", marginBottom: 8 }}>WINNERS WORK INTEGRATION</div>
                <p style={{ fontSize: 12.5, color: "var(--text-dim)", lineHeight: 1.7 }}>
                  Generated CVs and cover letters auto-link to your Winners Work freelancer profile. Apply to jobs directly from this page when Winners Work launches.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <AssistantPanel assistant="circuit" page="cv-tools" />
    </div>
  );
}
