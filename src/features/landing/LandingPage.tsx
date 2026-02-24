import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type Tile = {
  id: string;
  title: string;
  value: string;
  sub: string;
  trend: string;
  confidence: number;
  accent: "gold" | "ice";
};

const MAIN_TILES: Tile[] = [
  { id: "community", title: "Community", value: "509K", sub: "Members", trend: "+15%", confidence: 91, accent: "gold" },
  { id: "academy", title: "Academy", value: "15.7K", sub: "Students", trend: "+28%", confidence: 87, accent: "ice" },
  { id: "commerce", title: "Commerce", value: "$56.2K", sub: "Revenue", trend: "+12%", confidence: 84, accent: "gold" },
  { id: "work", title: "Work", value: "4.1K", sub: "Contracts", trend: "+24%", confidence: 82, accent: "ice" },
  { id: "ai", title: "AI Intelligence", value: "1.9M", sub: "Credits", trend: "+31%", confidence: 95, accent: "ice" },
  { id: "finance", title: "Finance", value: "$22.1K", sub: "Transactions", trend: "+9%", confidence: 79, accent: "gold" },
];

const RIGHT_KPIS = [
  { label: "Revenue Forecast", value: "$501M", delta: "+20%" },
  { label: "Users", value: "108.5K", delta: "+18%" },
  { label: "AI Credits", value: "1.9M", delta: "+16%" },
  { label: "Risk", value: "4.6%", delta: "-1.2%" },
];

const LEFT_MENU = [
  "Dashboard",
  "Community",
  "Academy",
  "Marketplace",
  "Work",
  "AI",
  "Metrics",
  "Revenue",
  "Settings",
];

const ACTIVITY = [
  "Optimize landing conversion",
  "Forecast next quarter growth",
  "Flag suspect transaction clusters",
  "Review enterprise onboarding",
];

const AI_SIGNALS = [
  { title: "Prediction", text: "Revenue likely to increase 14% in next 30 days." },
  { title: "Opportunity", text: "Academy-to-Work funnel has strongest compounding leverage." },
  { title: "Risk Alert", text: "Churn sensitivity detected in low-activation cohorts." },
  { title: "Action", text: "Push onboarding + community challenge this week." },
];

const VALUE_PILLARS = [
  { title: "Instant scaling", desc: "Scale from zero to thousands of instances with controlled burn." },
  { title: "Persistent state", desc: "Data continuity across app layers with long-term storage." },
  { title: "Secure execution", desc: "Isolated environments, encrypted secrets, SOC-aligned controls." },
  { title: "CLI & MCP access", desc: "Programmatic control and agent workflows without friction." },
  { title: "One-click templates", desc: "Launch full stacks with opinionated ecosystem presets." },
  { title: "Real-time observability", desc: "Live traces, metrics, and behavior diagnostics." },
  { title: "Instant rollbacks", desc: "Versioned deployments with fast recovery paths." },
  { title: "Team collaboration", desc: "Role-based access and auditable teamwork at scale." },
];

const AGENTS = [
  { name: "Claude Code", fit: "Code Generation", score: "9.4" },
  { name: "Codex", fit: "System Engineering", score: "9.2" },
  { name: "Cursor", fit: "Dev UX", score: "8.8" },
  { name: "OpenCode", fit: "Ops + Review", score: "8.6" },
];

const MENU_CONTEXT: Record<string, { focus: string; cta: string; score: string }> = {
  Dashboard: { focus: "Cross-platform command center", cta: "Open Live Dashboard", score: "94" },
  Community: { focus: "Creator growth and reputation loops", cta: "Launch Community", score: "91" },
  Academy: { focus: "Learning-to-revenue pathway", cta: "Open Academy", score: "89" },
  Marketplace: { focus: "Product monetization network", cta: "Explore Marketplace", score: "87" },
  Work: { focus: "Contract pipeline optimization", cta: "Open Work Hub", score: "85" },
  AI: { focus: "Agentic decision engine", cta: "Activate AI Orchestrator", score: "96" },
  Metrics: { focus: "Full-funnel observability", cta: "View Metrics", score: "88" },
  Revenue: { focus: "Financial intelligence stack", cta: "Open Revenue", score: "90" },
  Settings: { focus: "Security and governance controls", cta: "Open Settings", score: "86" },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState("Dashboard");
  const [logoError, setLogoError] = useState(false);
  const [signalIndex, setSignalIndex] = useState(0);

  const heroTile = useMemo(() => MAIN_TILES[0], []);
  const context = MENU_CONTEXT[active] ?? MENU_CONTEXT.Dashboard;

  useEffect(() => {
    const t = setInterval(() => {
      setSignalIndex((p) => (p + 1) % AI_SIGNALS.length);
    }, 2800);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <div className="wl-root">
        <div className="wl-stars" />

        <header className="wl-top">
          <div className="wl-brand-wrap">
            <div className="wl-logo" aria-hidden="true">
              {!logoError ? (
                <img
                  src="/logo.jpg"
                  alt="Winners Ecosystem"
                  className="wl-logo-img"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="wl-logo-fallback">W</div>
              )}
            </div>
            <div>
              <div className="wl-title">WINNERS ECOSYSTEM</div>
              <div className="wl-sub">ECOSYSTEM PLATFORM DASHBOARD</div>
            </div>
          </div>

          <div className="wl-top-kpis">
            <div><span>$124.3K</span><small>Revenue</small></div>
            <div><span>108.5K</span><small>Users</small></div>
            <div><span>1.9M</span><small>AI Credits</small></div>
          </div>

          <button className="wl-enter" onClick={() => navigate("/login")}>Enter Platform</button>
        </header>

        <section className="wl-shell">
          <aside className="wl-left neon-frame">
            <div className="wl-workspace">Project Winners Core</div>
            <ul>
              {LEFT_MENU.map((item) => (
                <li key={item}>
                  <button
                    className={active === item ? "on" : ""}
                    onClick={() => setActive(item)}
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
            <button className="wl-upgrade">Pro Upgrade</button>
          </aside>

          <main className="wl-main">
            <article className="wl-hero neon-frame">
              <div className="wl-hero-head">
                <h1>ECOSYSTEM SNAPSHOT</h1>
                <span>2030</span>
              </div>

              <div className="wl-hero-body">
                <div>
                  <p>Total Revenue</p>
                  <strong>$124,375</strong>
                </div>
                <div>
                  <p>Monthly Growth</p>
                  <strong className="ice">+32%</strong>
                </div>
              </div>

              <div className="wl-hero-chart" />

              <div className="wl-intel-row">
                <div className="wl-intel-signal">
                  <small>{AI_SIGNALS[signalIndex].title}</small>
                  <p>{AI_SIGNALS[signalIndex].text}</p>
                </div>
                <div className="wl-intel-score">
                  <small>AI Confidence</small>
                  <b>{context.score}%</b>
                </div>
              </div>

              <div className="wl-hero-foot">
                <div><small>MRR</small><b>$9,874</b></div>
                <div><small>Churn</small><b>$1,045</b></div>
                <div><small>New Signups</small><b>1,065</b></div>
              </div>
            </article>

            <section className="wl-grid">
              {MAIN_TILES.map((tile) => (
                <article key={tile.id} className={`wl-tile neon-frame ${tile.accent} wl-tile-${tile.id}`}>
                  <h3>{tile.title}</h3>
                  <div className="wl-v">{tile.value}</div>
                  <p>{tile.sub}</p>
                  <div className="wl-trend">
                    <span>{tile.trend}</span>
                    <small>{tile.confidence}% model confidence</small>
                  </div>
                  <div className="wl-bar">
                    <div style={{ width: `${tile.confidence}%` }} />
                  </div>
                  <button onClick={() => navigate("/login")}>Open</button>
                </article>
              ))}
            </section>
          </main>

          <aside className="wl-right">
            <article className="neon-frame wl-panel">
              <h2>KPI Stream</h2>
              <div className="wl-kpis">
                {RIGHT_KPIS.map((k) => (
                  <div key={k.label}>
                    <strong>{k.value}</strong>
                    <span>{k.label}</span>
                    <small>{k.delta}</small>
                  </div>
                ))}
              </div>
            </article>

            <article className="neon-frame wl-panel">
              <h2>AI Orchestrator</h2>
              <ul className="wl-activity">
                {ACTIVITY.map((a) => <li key={a}>{a}</li>)}
              </ul>
            </article>

            <article className="neon-frame wl-panel">
              <h2>Current Focus</h2>
              <p>{heroTile.title} is your highest-leverage entry point for Phase 1 acceleration.</p>
              <div className="wl-focus">
                <small>Selected Module</small>
                <strong>{active}</strong>
                <span>{context.focus}</span>
                <button onClick={() => navigate("/login")}>{context.cta}</button>
              </div>
            </article>
          </aside>
        </section>

        <section className="wl-intelligent">
          <article className="neon-frame wl-intelligent-head">
            <h2>Intelligent Infrastructure Advantages</h2>
            <p>Designed to attract founders, operators, and creators with clarity, control, and compounding outcomes.</p>
          </article>
          <div className="wl-pillars">
            {VALUE_PILLARS.map((item) => (
              <article key={item.title} className="neon-frame wl-pillar-card">
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="wl-agents-section">
          <article className="neon-frame wl-agents-wrap">
            <h2>Agent Directory</h2>
            <p>Compare AI execution layers and route users to the right experience instantly.</p>
            <div className="wl-agents-grid">
              {AGENTS.map((agent) => (
                <div key={agent.name} className="wl-agent-card">
                  <strong>{agent.name}</strong>
                  <span>{agent.fit}</span>
                  <small>Score {agent.score}/10</small>
                </div>
              ))}
            </div>
          </article>
        </section>
      </div>
    </>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@500;700;800&family=Space+Mono:wght@400;700&display=swap');

  :root {
    /* Founder brand tokens (driven by logo style) */
    --brand-gold-1: #e8cc84;
    --brand-gold-2: #d1b164;
    --brand-gold-3: #8b6a2c;
    --brand-charcoal-1: #060d1b;
    --brand-charcoal-2: #0d1628;
    --brand-charcoal-3: #121f35;
    --brand-ice: #87c7ee;
    --text: #e8eef5;
    --dim: #7f98b5;
    --line: #1f3550;
    --bg: var(--brand-charcoal-1);
    --surface: var(--brand-charcoal-2);
    --surface-2: var(--brand-charcoal-3);
    --gold: var(--brand-gold-2);
    --ice: var(--brand-ice);
  }

  * { box-sizing: border-box; }

  .wl-root {
    min-height: 100vh;
    color: var(--text);
    font-family: 'Syne', sans-serif;
    background:
      radial-gradient(800px 280px at 22% -4%, rgba(232,204,132,.22), transparent 70%),
      radial-gradient(700px 260px at 92% -2%, rgba(135,199,238,.22), transparent 70%),
      var(--bg);
    padding: 18px;
    position: relative;
    overflow-x: hidden;
  }

  .wl-stars {
    position: absolute;
    inset: 0;
    background-image: radial-gradient(rgba(255,255,255,.24) 1px, transparent 1px);
    background-size: 3px 3px;
    opacity: .15;
    pointer-events: none;
  }

  .neon-frame {
    position: relative;
    border: 1px solid var(--line);
    border-radius: 14px;
    background: linear-gradient(170deg, var(--surface-2), var(--surface));
    box-shadow: inset 0 0 0 1px rgba(255,255,255,.02), 0 0 0 1px rgba(0,0,0,.2);
  }

  .neon-frame::before {
    content: '';
    position: absolute;
    left: 12px;
    right: 12px;
    top: 0;
    height: 2px;
    border-radius: 2px;
    background: linear-gradient(90deg, transparent, rgba(232,204,132,.95), rgba(135,199,238,.95), transparent);
    pointer-events: none;
  }

  .wl-top {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: 1.4fr 1fr auto;
    gap: 16px;
    align-items: center;
    padding: 10px 12px 16px;
    border-bottom: 1px solid var(--line);
  }

  .wl-brand-wrap { display: flex; align-items: center; gap: 12px; }

  .wl-logo {
    width: 58px;
    height: 58px;
    border-radius: 12px;
    position: relative;
    display: grid;
    place-items: center;
    background: radial-gradient(circle at 30% 30%, #2a2010, #120f09 70%);
    border: 1px solid rgba(232,204,132,.75);
    box-shadow: 0 0 18px rgba(232,204,132,.26);
    flex-shrink: 0;
  }

  .wl-logo-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 10px;
    border: 1px solid rgba(232,204,132,.55);
  }

  .wl-logo-fallback {
    font-size: 24px;
    font-weight: 800;
    color: #f3d990;
    line-height: 1;
  }

  .wl-title {
    letter-spacing: .03em;
    font-size: clamp(20px, 2.4vw, 42px);
    font-weight: 800;
    color: var(--brand-gold-1);
  }

  .wl-sub {
    margin-top: 2px;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    letter-spacing: .2em;
    color: var(--dim);
  }

  .wl-top-kpis {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .wl-top-kpis > div {
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 8px;
    text-align: center;
    background: rgba(8, 14, 27, .75);
  }

  .wl-top-kpis span {
    display: block;
    font-size: 18px;
    font-weight: 700;
    color: var(--brand-gold-1);
  }

  .wl-top-kpis small {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--dim);
  }

  .wl-enter {
    border: 1px solid rgba(232,204,132,.7);
    background: linear-gradient(180deg, var(--brand-gold-1), var(--brand-gold-2));
    color: #22190a;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    padding: 10px 14px;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 700;
  }

  .wl-shell {
    position: relative;
    z-index: 1;
    display: grid;
    grid-template-columns: 220px 1fr 290px;
    gap: 12px;
    margin-top: 12px;
    min-height: calc(100vh - 130px);
  }

  .wl-left { padding: 12px; }
  .wl-workspace {
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 8px;
    margin-bottom: 12px;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--dim);
  }

  .wl-left ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
  .wl-left button {
    width: 100%;
    text-align: left;
    border: 1px solid transparent;
    border-radius: 10px;
    background: #0d1729;
    color: #b7c7da;
    padding: 10px 12px;
    cursor: pointer;
    font-size: 14px;
  }

  .wl-left button.on {
    border-color: rgba(232,204,132,.48);
    color: var(--brand-gold-1);
    box-shadow: inset 0 0 16px rgba(232,204,132,.1);
  }

  .wl-upgrade {
    margin-top: 12px;
    border-color: rgba(232,204,132,.58) !important;
    color: var(--brand-gold-1) !important;
  }

  .wl-main { display: grid; gap: 12px; }

  .wl-hero { padding: 14px; }
  .wl-hero-head { display: flex; justify-content: space-between; align-items: baseline; }
  .wl-hero-head h1 {
    font-size: clamp(20px, 2.2vw, 30px);
    margin: 0;
    letter-spacing: .04em;
  }
  .wl-hero-head span {
    color: var(--dim);
    font-family: 'Space Mono', monospace;
    font-size: 12px;
  }

  .wl-hero-body {
    margin-top: 10px;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .wl-hero-body p { margin: 0; font-family: 'Space Mono', monospace; font-size: 10px; color: var(--dim); }
  .wl-hero-body strong { font-size: clamp(24px, 3.8vw, 42px); color: var(--brand-gold-1); }
  .wl-hero-body strong.ice { color: #9cd6f7; }

  .wl-hero-chart {
    margin-top: 12px;
    height: 90px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background:
      linear-gradient(180deg, rgba(135,199,238,.12), transparent),
      linear-gradient(140deg, rgba(209,177,100,.18), rgba(135,199,238,.15));
    position: relative;
    overflow: hidden;
  }

  .wl-hero-chart::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: linear-gradient(rgba(255,255,255,.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 1px);
    background-size: 22px 22px;
    opacity: .25;
  }

  .wl-intel-row {
    margin-top: 10px;
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 8px;
  }

  .wl-intel-signal,
  .wl-intel-score {
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 8px;
    background: rgba(8, 15, 30, .72);
  }

  .wl-intel-signal small,
  .wl-intel-score small {
    display: block;
    font-family: 'Space Mono', monospace;
    color: var(--dim);
    font-size: 9px;
    letter-spacing: .08em;
    text-transform: uppercase;
  }

  .wl-intel-signal p {
    margin: 4px 0 0;
    font-size: 12px;
    color: #c8d8e9;
    line-height: 1.4;
  }

  .wl-intel-score b {
    font-size: 22px;
    color: var(--brand-gold-1);
  }

  .wl-hero-foot {
    margin-top: 10px;
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }

  .wl-hero-foot > div {
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 8px;
  }

  .wl-hero-foot small {
    display: block;
    font-family: 'Space Mono', monospace;
    color: var(--dim);
    font-size: 9px;
  }

  .wl-hero-foot b { font-size: 16px; color: var(--brand-gold-1); }

  .wl-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
  }

  .wl-tile { padding: 12px; min-height: 140px; display: grid; align-content: start; }
  .wl-tile::after {
    content: '';
    position: absolute;
    left: 10px;
    right: 10px;
    top: 0;
    height: 2px;
    border-radius: 2px;
    background: linear-gradient(90deg, transparent, var(--tile-accent, var(--brand-gold-1)), transparent);
    opacity: .9;
    pointer-events: none;
  }
  .wl-tile h3 { margin: 0; font-size: 18px; }
  .wl-tile .wl-v { margin-top: 8px; font-size: 34px; font-weight: 700; }
  .wl-tile p { margin-top: 2px; color: var(--dim); font-family: 'Space Mono', monospace; font-size: 10px; }

  .wl-trend {
    margin-top: 8px;
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }

  .wl-trend span {
    color: #7fe0b3;
    font-size: 14px;
    font-weight: 700;
  }

  .wl-trend small {
    font-family: 'Space Mono', monospace;
    color: var(--dim);
    font-size: 9px;
  }

  .wl-bar {
    margin-top: 6px;
    height: 5px;
    border-radius: 999px;
    background: #0a1324;
    border: 1px solid var(--line);
    overflow: hidden;
  }

  .wl-bar > div {
    height: 100%;
    background: linear-gradient(90deg, rgba(209,177,100,.75), rgba(135,199,238,.8));
  }
  .wl-tile button {
    margin-top: 10px;
    align-self: end;
    justify-self: start;
    border: 1px solid var(--line);
    background: rgba(8, 15, 30, .75);
    color: var(--text);
    border-radius: 9px;
    padding: 7px 10px;
    cursor: pointer;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
  }

  .wl-tile.gold .wl-v { color: var(--brand-gold-1); }
  .wl-tile.ice .wl-v { color: #9cd6f7; }

  .wl-tile-community { --tile-accent: #89C4E1; }
  .wl-tile-academy { --tile-accent: #C9A84C; }
  .wl-tile-commerce { --tile-accent: #E8C97A; }
  .wl-tile-work { --tile-accent: #2B5F8E; }
  .wl-tile-ai { --tile-accent: #9CD6F7; }
  .wl-tile-finance { --tile-accent: #2DD4A0; }

  .wl-right { display: grid; gap: 10px; }
  .wl-panel { padding: 12px; }
  .wl-panel h2 { margin: 0 0 10px; font-size: 16px; }

  .wl-kpis { display: grid; gap: 8px; }
  .wl-kpis > div {
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 9px;
    display: grid;
    gap: 2px;
  }

  .wl-kpis strong { color: var(--brand-gold-1); }
  .wl-kpis span { color: var(--dim); font-family: 'Space Mono', monospace; font-size: 10px; }
  .wl-kpis small { color: #92d5f7; font-family: 'Space Mono', monospace; font-size: 10px; }

  .wl-activity { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .wl-activity li {
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 8px;
    font-size: 13px;
    color: #bdd0e5;
  }

  .wl-panel p { margin: 0; color: var(--dim); line-height: 1.6; font-size: 13px; }

  .wl-focus {
    margin-top: 10px;
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 10px;
    display: grid;
    gap: 4px;
    background: rgba(8, 15, 30, .72);
  }

  .wl-focus small {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    color: var(--dim);
    text-transform: uppercase;
    letter-spacing: .1em;
  }

  .wl-focus strong { font-size: 15px; color: var(--brand-gold-1); }
  .wl-focus span { font-size: 12px; color: #c3d5e8; }

  .wl-focus button {
    margin-top: 6px;
    justify-self: start;
    border: 1px solid rgba(232,204,132,.55);
    background: transparent;
    color: var(--brand-gold-1);
    border-radius: 9px;
    padding: 7px 10px;
    cursor: pointer;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
  }

  .wl-intelligent,
  .wl-agents-section {
    position: relative;
    z-index: 1;
    margin-top: 12px;
  }

  .wl-intelligent-head,
  .wl-agents-wrap {
    padding: 14px;
  }

  .wl-intelligent-head h2,
  .wl-agents-wrap h2 {
    margin: 0;
    font-size: 22px;
  }

  .wl-intelligent-head p,
  .wl-agents-wrap p {
    margin: 6px 0 0;
    color: var(--dim);
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    line-height: 1.6;
  }

  .wl-pillars {
    margin-top: 10px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 10px;
  }

  .wl-pillar-card { padding: 12px; }
  .wl-pillar-card h3 {
    margin: 0;
    font-size: 15px;
    color: var(--brand-gold-1);
  }

  .wl-pillar-card p {
    margin: 6px 0 0;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--dim);
    line-height: 1.6;
  }

  .wl-agents-grid {
    margin-top: 10px;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 8px;
  }

  .wl-agent-card {
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 10px;
    display: grid;
    gap: 4px;
    background: rgba(8, 15, 30, .65);
  }

  .wl-agent-card strong { font-size: 13px; color: #d9e6f5; }
  .wl-agent-card span { font-size: 11px; color: var(--dim); }
  .wl-agent-card small {
    font-family: 'Space Mono', monospace;
    color: #9cd6f7;
    font-size: 10px;
  }

  @media (max-width: 1280px) {
    .wl-shell { grid-template-columns: 200px 1fr 260px; }
    .wl-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .wl-pillars { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .wl-agents-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  }

  @media (max-width: 980px) {
    .wl-top { grid-template-columns: 1fr; }
    .wl-shell { grid-template-columns: 1fr; }
    .wl-left { order: 1; }
    .wl-main { order: 2; }
    .wl-right { order: 3; grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .wl-left ul { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .wl-intel-row { grid-template-columns: 1fr; }
  }

  @media (max-width: 700px) {
    .wl-root { padding: 10px; }
    .wl-title { font-size: 22px; }
    .wl-sub { letter-spacing: .1em; }
    .wl-top-kpis { grid-template-columns: 1fr; }
    .wl-grid,
    .wl-hero-body,
    .wl-hero-foot,
    .wl-left ul,
    .wl-right,
    .wl-pillars,
    .wl-agents-grid { grid-template-columns: 1fr; }
  }
`;
