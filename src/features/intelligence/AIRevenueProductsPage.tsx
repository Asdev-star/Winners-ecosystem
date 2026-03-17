// Level X - AI-Native Revenue Products
// Page: AIRevenueProductsPage
// New income streams that only the AI layer makes possible:
//   1. Signal Subscriptions — curated AI market intelligence sold as a feed
//   2. Knowledge Sessions — live AI + human coaching at scale
//   3. Insight Packs — downloadable AI-generated research bundles

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AssistantPanel from "../../components/ui/AssistantPanel";
import ContextBar from "../../components/ui/ContextBar";
import { useAuthStore } from "../auth/authStore";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SignalSubscription {
  id: string;
  name: string;
  description: string;
  supervisor: string;
  category: string;
  priceMonthly: number;
  subscribers: number;
  lastSignal: string;
  signalCount: number;
  sampleSignals: string[];
  tier: "free" | "pro" | "elite";
}

interface KnowledgeSession {
  id: string;
  title: string;
  host: string;
  supervisor: string;
  scheduledFor: string;
  duration: number;
  capacity: number;
  enrolled: number;
  pricePerSeat: number;
  topics: string[];
  status: "upcoming" | "live" | "completed";
}

interface InsightPack {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  pages: number;
  downloads: number;
  generatedBy: string;
  publishedAt: string;
  tags: string[];
}

// ─── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_SIGNALS: SignalSubscription[] = [
  {
    id: "sig_1",
    name: "ATLAS Market Signals",
    description: "Daily product opportunities, margin alerts, and supplier intelligence curated by ATLAS across African and diaspora markets.",
    supervisor: "ATLAS",
    category: "Market",
    priceMonthly: 29,
    subscribers: 847,
    lastSignal: "2 hours ago",
    signalCount: 12,
    sampleSignals: [
      "Afroprint hoodies: 34% margin above average. Peak demand: Lagos, London, Toronto.",
      "Shea butter suppliers listing at -18% from last week. Window: 48 hrs.",
      "Digital products (templates) seeing 3x conversion vs physical in diaspora markets.",
    ],
    tier: "pro",
  },
  {
    id: "sig_2",
    name: "CIRCUIT Work Intelligence",
    description: "Real-time contract alerts, rate benchmarks, and skill-gap analysis for African freelancers and remote workers.",
    supervisor: "CIRCUIT",
    category: "Work",
    priceMonthly: 19,
    subscribers: 1204,
    lastSignal: "47 min ago",
    signalCount: 8,
    sampleSignals: [
      "React Developer contracts up 8% this week. Top rate: $85/hr on Toptal.",
      "3 companies actively headhunting for Lagos-based UX designers.",
      "AI integration skills now commanding 40% premium on contract platforms.",
    ],
    tier: "free",
  },
  {
    id: "sig_3",
    name: "OMEGA Cross-Layer Synthesis",
    description: "Elite weekly briefings that synthesise all 8 platform layers into a single strategic intelligence package.",
    supervisor: "OMEGA",
    category: "Ecosystem",
    priceMonthly: 79,
    subscribers: 312,
    lastSignal: "Yesterday",
    signalCount: 3,
    sampleSignals: [
      "Winners ecosystem users who complete 3+ courses earn 67% more on Work layer.",
      "Community creators with 500+ followers convert to Market sellers at 3x rate.",
      "Loop velocity: Users who advance stages within 14 days have 82% retention at 6 months.",
    ],
    tier: "elite",
  },
];

const MOCK_SESSIONS: KnowledgeSession[] = [
  {
    id: "sess_1",
    title: "Product Research with ATLAS: Find Winning Products in 60 Minutes",
    host: "Emmanuel K.",
    supervisor: "ATLAS",
    scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 90,
    capacity: 50,
    enrolled: 34,
    pricePerSeat: 25,
    topics: ["Market research", "Margin analysis", "Supplier sourcing", "ATLAS live demo"],
    status: "upcoming",
  },
  {
    id: "sess_2",
    title: "CIRCUIT Job Accelerator: Land Your First Remote Contract",
    host: "Amara N.",
    supervisor: "CIRCUIT",
    scheduledFor: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 120,
    capacity: 30,
    enrolled: 28,
    pricePerSeat: 35,
    topics: ["Proposal writing with AI", "Rate positioning", "Contract review", "Live CIRCUIT session"],
    status: "upcoming",
  },
  {
    id: "sess_3",
    title: "OMEGA Ecosystem Audit: Maximise Your Loop in 90 Minutes",
    host: "Kwame A.",
    supervisor: "OMEGA",
    scheduledFor: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    duration: 90,
    capacity: 20,
    enrolled: 20,
    pricePerSeat: 65,
    topics: ["Trust Score analysis", "Cross-layer optimisation", "Revenue forecasting"],
    status: "completed",
  },
];

const MOCK_PACKS: InsightPack[] = [
  {
    id: "pack_1",
    title: "African Dropshipping Opportunity Report Q1 2026",
    description: "87 pages of ATLAS-generated product intelligence covering 12 categories, 3 supplier tiers, and margin benchmarks across 8 African cities.",
    category: "Market",
    price: 49,
    pages: 87,
    downloads: 234,
    generatedBy: "ATLAS",
    publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["dropshipping", "africa", "Q1 2026", "market analysis"],
  },
  {
    id: "pack_2",
    title: "Diaspora Freelancer Rate Card 2026",
    description: "CIRCUIT-synthesised benchmarks across 40 skill categories, regional breakdowns (UK/US/Africa), and positioning strategies for diaspora professionals.",
    category: "Work",
    price: 29,
    pages: 52,
    downloads: 891,
    generatedBy: "CIRCUIT",
    publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["freelancing", "rates", "diaspora", "remote work"],
  },
  {
    id: "pack_3",
    title: "AI Learning Path: From Beginner to Certified in 90 Days",
    description: "SAGE-curated step-by-step playbook mapping 12 Academy courses to 47 Work opportunities. Includes daily schedule and milestone checkpoints.",
    category: "Academy",
    price: 19,
    pages: 34,
    downloads: 1203,
    generatedBy: "SAGE",
    publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    tags: ["learning", "AI", "career", "certification"],
  },
];

// ─── CSS ───────────────────────────────────────────────────────────────────────

const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

.rev-root {
  min-height: 100vh;
  background:
    radial-gradient(ellipse 70% 40% at 10% 0%, rgba(240,180,41,0.04) 0%, transparent 60%),
    radial-gradient(ellipse 60% 40% at 90% 100%, rgba(155,111,255,0.04) 0%, transparent 50%),
    var(--bg);
  font-family: 'Syne', sans-serif;
  color: var(--text);
  padding: 28px 32px;
}

.rev-header { margin-bottom: 32px; }

.rev-eyebrow {
  font-family: 'Space Mono', monospace;
  font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--gold); margin-bottom: 6px;
}

.rev-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 36px; font-weight: 300; letter-spacing: -0.02em;
  margin: 0 0 6px;
}

.rev-title em { font-style: italic; color: var(--purple); }

.rev-subtitle {
  font-size: 14px; color: var(--text-dim); max-width: 600px;
}

.rev-tabs {
  display: flex; gap: 4px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 4px;
  margin-bottom: 28px;
  width: fit-content;
}

.rev-tab {
  padding: 8px 18px; border-radius: 6px; border: none;
  background: none; cursor: pointer;
  font-family: 'Syne', sans-serif;
  font-size: 12px; font-weight: 600;
  color: var(--text-dim);
  transition: all 0.2s;
}

.rev-tab.active {
  background: var(--surface2);
  color: var(--text);
  box-shadow: 0 1px 4px rgba(0,0,0,0.3);
}

.rev-tab:hover:not(.active) { color: var(--text); }

.rev-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
}

.rev-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.2s, transform 0.2s;
  display: flex; flex-direction: column;
}

.rev-card:hover {
  border-color: var(--border-gold);
  transform: translateY(-2px);
}

.rev-card-top {
  padding: 18px 20px 0;
}

.rev-card-header {
  display: flex; align-items: flex-start;
  justify-content: space-between; gap: 10px;
  margin-bottom: 10px;
}

.rev-card-icon {
  width: 38px; height: 38px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; flex-shrink: 0;
}

.rev-card-title {
  font-size: 15px; font-weight: 700; color: var(--text);
  margin: 0 0 4px; line-height: 1.3;
}

.rev-card-desc {
  font-size: 12px; color: var(--text-dim);
  line-height: 1.6; margin: 0;
}

.rev-card-meta {
  display: flex; gap: 12px; flex-wrap: wrap;
  padding: 12px 20px; border-bottom: 1px solid var(--border);
  font-family: 'Space Mono', monospace; font-size: 9px;
}

.rev-meta-item {
  display: flex; flex-direction: column; gap: 2px;
}

.rev-meta-label { color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.06em; }
.rev-meta-value { color: var(--text); font-size: 11px; }

.rev-card-signals {
  padding: 12px 20px; flex: 1;
}

.rev-signal-item {
  display: flex; gap: 8px;
  font-size: 11px; color: var(--text-dim);
  line-height: 1.5; margin-bottom: 8px;
}

.rev-signal-item:last-child { margin-bottom: 0; }

.rev-signal-bullet {
  width: 4px; height: 4px; border-radius: 50%;
  background: var(--gold); margin-top: 5px; flex-shrink: 0;
}

.rev-card-footer {
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between;
  gap: 8px;
}

.rev-price {
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px; font-weight: 600;
  color: var(--gold);
}

.rev-price-label {
  font-family: 'Space Mono', monospace;
  font-size: 9px; color: var(--text-dim);
  margin-left: 3px;
}

.rev-price-free {
  font-family: 'Space Mono', monospace;
  font-size: 12px; color: var(--green); font-weight: 700;
}

.btn-subscribe {
  padding: 9px 18px;
  background: var(--gold);
  border: none; border-radius: 8px;
  color: var(--bg);
  font-family: 'Syne', sans-serif;
  font-size: 12px; font-weight: 700;
  cursor: pointer; transition: opacity 0.2s;
  white-space: nowrap;
}
.btn-subscribe:hover { opacity: 0.88; }

.btn-subscribe-free {
  padding: 9px 18px;
  background: rgba(45,212,160,0.12);
  border: 1px solid var(--green); border-radius: 8px;
  color: var(--green);
  font-family: 'Syne', sans-serif;
  font-size: 12px; font-weight: 700;
  cursor: pointer; transition: background 0.2s;
  white-space: nowrap;
}
.btn-subscribe-free:hover { background: rgba(45,212,160,0.2); }

.btn-enroll {
  padding: 9px 18px;
  background: var(--purple);
  border: none; border-radius: 8px;
  color: var(--text);
  font-family: 'Syne', sans-serif;
  font-size: 12px; font-weight: 700;
  cursor: pointer; transition: opacity 0.2s;
  white-space: nowrap;
}
.btn-enroll:hover { opacity: 0.88; }

.btn-enroll-full {
  padding: 9px 18px;
  background: var(--surface2);
  border: 1px solid var(--border); border-radius: 8px;
  color: var(--text-dim);
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  cursor: not-allowed; white-space: nowrap;
}

.btn-download {
  padding: 9px 18px;
  background: var(--surface2);
  border: 1px solid var(--border); border-radius: 8px;
  color: var(--text);
  font-family: 'Syne', sans-serif;
  font-size: 12px; font-weight: 600;
  cursor: pointer; transition: border-color 0.2s;
  white-space: nowrap;
}
.btn-download:hover { border-color: var(--gold); color: var(--gold); }

.tier-badge {
  font-family: 'Space Mono', monospace;
  font-size: 8px; letter-spacing: 0.08em; text-transform: uppercase;
  padding: 3px 8px; border-radius: 20px;
}

.tier-free  { background: rgba(45,212,160,0.1);  color: var(--green);  border: 1px solid rgba(45,212,160,0.3); }
.tier-pro   { background: rgba(240,180,41,0.1);   color: var(--gold);   border: 1px solid rgba(240,180,41,0.3); }
.tier-elite { background: rgba(155,111,255,0.1);  color: var(--purple); border: 1px solid rgba(155,111,255,0.3); }

.session-date {
  font-family: 'Space Mono', monospace;
  font-size: 10px; color: var(--blue);
  margin: 6px 0;
}

.session-topics {
  display: flex; gap: 6px; flex-wrap: wrap; padding: 10px 20px;
}

.topic-chip {
  font-family: 'Space Mono', monospace;
  font-size: 9px; padding: 3px 8px;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 20px; color: var(--text-dim);
}

.capacity-bar-track {
  height: 3px; background: var(--surface3); border-radius: 2px;
  overflow: hidden; margin: 4px 0;
}

.capacity-bar-fill {
  height: 100%; background: var(--blue); border-radius: 2px;
}

.pack-tags { display: flex; gap: 6px; flex-wrap: wrap; padding: 0 0 10px; }

.pack-tag {
  font-family: 'Space Mono', monospace;
  font-size: 9px; padding: 3px 8px;
  background: rgba(155,111,255,0.08);
  border: 1px solid rgba(155,111,255,0.15);
  border-radius: 20px; color: var(--purple);
}

.rev-empty {
  grid-column: 1 / -1;
  text-align: center; padding: 48px 24px;
  color: var(--text-dim); font-size: 13px;
}

.status-live { color: var(--red); }
.status-completed { color: var(--text-dim); }
.status-upcoming { color: var(--green); }

@media (max-width: 768px) {
  .rev-root { padding: 20px 16px; }
  .rev-title { font-size: 28px; }
  .rev-grid { grid-template-columns: 1fr; }
}
`;

// ─── Sub-components ────────────────────────────────────────────────────────────

function SupervisorBadge({ name }: { name: string }) {
  const colors: Record<string, string> = {
    ATLAS: "var(--gold)",
    CIRCUIT: "var(--blue)",
    OMEGA: "var(--purple)",
    NOVA: "var(--ice)",
    SAGE: "var(--green)",
    FORGE: "var(--purple)",
    NEXUS: "var(--ice)",
  };
  const emojis: Record<string, string> = {
    ATLAS: "🛒", CIRCUIT: "💼", OMEGA: "🧠",
    NOVA: "👥", SAGE: "🎓", FORGE: "🤖", NEXUS: "☁️",
  };
  return (
    <span
      style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 9,
        letterSpacing: "0.06em",
        color: colors[name] ?? "var(--text-dim)",
        background: `${colors[name] ?? "var(--text-dim)"}18`,
        border: `1px solid ${colors[name] ?? "var(--text-dim)"}30`,
        padding: "2px 7px",
        borderRadius: 20,
      }}
    >
      {emojis[name] ?? "🤖"} {name}
    </span>
  );
}

function SignalCard({ signal }: { signal: SignalSubscription }) {
  return (
    <div className="rev-card">
      <div className="rev-card-top">
        <div className="rev-card-header">
          <div>
            <p className="rev-card-title">{signal.name}</p>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
              <SupervisorBadge name={signal.supervisor} />
              <span className={`tier-badge tier-${signal.tier}`}>{signal.tier}</span>
            </div>
          </div>
        </div>
        <p className="rev-card-desc">{signal.description}</p>
      </div>
      <div className="rev-card-meta">
        <div className="rev-meta-item">
          <span className="rev-meta-label">Subscribers</span>
          <span className="rev-meta-value">{signal.subscribers.toLocaleString()}</span>
        </div>
        <div className="rev-meta-item">
          <span className="rev-meta-label">Signals Today</span>
          <span className="rev-meta-value">{signal.signalCount}</span>
        </div>
        <div className="rev-meta-item">
          <span className="rev-meta-label">Last Signal</span>
          <span className="rev-meta-value">{signal.lastSignal}</span>
        </div>
      </div>
      <div className="rev-card-signals">
        {signal.sampleSignals.map((s, i) => (
          <div key={i} className="rev-signal-item">
            <span className="rev-signal-bullet" />
            <span>{s}</span>
          </div>
        ))}
      </div>
      <div className="rev-card-footer">
        {signal.tier === "free" ? (
          <span className="rev-price-free">FREE</span>
        ) : (
          <div>
            <span className="rev-price">${signal.priceMonthly}</span>
            <span className="rev-price-label">/month</span>
          </div>
        )}
        {signal.tier === "free" ? (
          <button className="btn-subscribe-free">Subscribe Free</button>
        ) : (
          <button className="btn-subscribe">Subscribe</button>
        )}
      </div>
    </div>
  );
}

function SessionCard({ session }: { session: KnowledgeSession }) {
  const isFull = session.enrolled >= session.capacity;
  const capacityPct = Math.round((session.enrolled / session.capacity) * 100);
  const dateStr = new Date(session.scheduledFor).toLocaleString("en-GB", {
    weekday: "short", day: "numeric", month: "short",
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="rev-card">
      <div className="rev-card-top">
        <div className="rev-card-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="rev-card-title">{session.title}</p>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
              <SupervisorBadge name={session.supervisor} />
              <span
                className={`status-${session.status}`}
                style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, textTransform: "uppercase" }}
              >
                {session.status === "live" ? "● LIVE" : session.status}
              </span>
            </div>
          </div>
        </div>
        <p className="session-date">{dateStr} · {session.duration} min</p>
        <p className="rev-card-desc" style={{ marginTop: 4 }}>
          Hosted by {session.host}
        </p>
      </div>
      <div className="session-topics">
        {session.topics.map((t) => (
          <span key={t} className="topic-chip">{t}</span>
        ))}
      </div>
      <div className="rev-card-meta">
        <div className="rev-meta-item" style={{ flex: 1 }}>
          <span className="rev-meta-label">Seats</span>
          <div className="capacity-bar-track" style={{ width: "100%" }}>
            <div className="capacity-bar-fill" style={{ width: `${capacityPct}%` }} />
          </div>
          <span className="rev-meta-value">
            {session.enrolled}/{session.capacity} enrolled
          </span>
        </div>
      </div>
      <div className="rev-card-footer">
        <div>
          <span className="rev-price">${session.pricePerSeat}</span>
          <span className="rev-price-label">/seat</span>
        </div>
        {session.status === "completed" ? (
          <button className="btn-download">Watch Replay</button>
        ) : isFull ? (
          <button className="btn-enroll-full">Full — Join Waitlist</button>
        ) : (
          <button className="btn-enroll">Enrol Now</button>
        )}
      </div>
    </div>
  );
}

function InsightPackCard({ pack }: { pack: InsightPack }) {
  const dateStr = new Date(pack.publishedAt).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className="rev-card">
      <div className="rev-card-top">
        <div className="rev-card-header">
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="rev-card-title">{pack.title}</p>
            <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
              <SupervisorBadge name={pack.generatedBy} />
              <span
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 9, color: "var(--text-dim)",
                }}
              >
                {dateStr}
              </span>
            </div>
          </div>
        </div>
        <p className="rev-card-desc">{pack.description}</p>
        <div className="pack-tags" style={{ marginTop: 8 }}>
          {pack.tags.map((t) => (
            <span key={t} className="pack-tag">{t}</span>
          ))}
        </div>
      </div>
      <div className="rev-card-meta">
        <div className="rev-meta-item">
          <span className="rev-meta-label">Pages</span>
          <span className="rev-meta-value">{pack.pages}</span>
        </div>
        <div className="rev-meta-item">
          <span className="rev-meta-label">Downloads</span>
          <span className="rev-meta-value">{pack.downloads.toLocaleString()}</span>
        </div>
        <div className="rev-meta-item">
          <span className="rev-meta-label">Category</span>
          <span className="rev-meta-value">{pack.category}</span>
        </div>
      </div>
      <div className="rev-card-footer">
        <div>
          <span className="rev-price">${pack.price}</span>
          <span className="rev-price-label"> one-time</span>
        </div>
        <button className="btn-download">Download PDF</button>
      </div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────

type Tab = "signals" | "sessions" | "packs";

export default function AIRevenueProductsPage() {
  const [tab, setTab] = useState<Tab>("signals");
  const user = useAuthStore((s) => s.user);

  return (
    <div className="rev-root">
      <style>{css}</style>

      <ContextBar />

      <div className="rev-header">
        <p className="rev-eyebrow">Level X · AI-Native Revenue Products</p>
        <h1 className="rev-title">
          Intelligence That <em>Earns</em>
        </h1>
        <p className="rev-subtitle">
          New income streams built on the AI layer. Subscribe to live market signals,
          attend AI-powered knowledge sessions, or download supervisor-generated research packs.
        </p>
      </div>

      {/* Tabs */}
      <div className="rev-tabs">
        {(["signals", "sessions", "packs"] as Tab[]).map((t) => (
          <button
            key={t}
            className={`rev-tab${tab === t ? " active" : ""}`}
            onClick={() => setTab(t)}
          >
            {t === "signals" && "📡 Market Signals"}
            {t === "sessions" && "🎤 Live Sessions"}
            {t === "packs" && "📦 Insight Packs"}
          </button>
        ))}
      </div>

      {/* Cards grid */}
      <div className="rev-grid">
        {tab === "signals" &&
          MOCK_SIGNALS.map((s) => <SignalCard key={s.id} signal={s} />)}

        {tab === "sessions" &&
          MOCK_SESSIONS.map((s) => <SessionCard key={s.id} session={s} />)}

        {tab === "packs" &&
          MOCK_PACKS.map((p) => <InsightPackCard key={p.id} pack={p} />)}
      </div>

      {/* AI Panel */}
      <AssistantPanel
        assistant="atlas"
        page="ai-revenue-products"
        userId={user?.id}
        context={{ section: tab }}
        initialMessage="What AI-native revenue products are available for my profile?"
      />
    </div>
  );
}
