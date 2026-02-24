import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const LAYERS = [
  { id: "community", title: "Community", metric: "509K", subtitle: "Members", glow: "var(--glow-blue)" },
  { id: "academy", title: "Academy", metric: "15.7K", subtitle: "Students", glow: "var(--glow-gold)" },
  { id: "market", title: "Marketplace", metric: "$56.2K", subtitle: "Revenue", glow: "var(--glow-gold)" },
  { id: "work", title: "Work", metric: "4.4K", subtitle: "Contracts", glow: "var(--glow-ice)" },
  { id: "ai", title: "AI Core", metric: "1.9M", subtitle: "Credits Used", glow: "var(--glow-ice)" },
  { id: "finance", title: "Finance", metric: "$22.1K", subtitle: "Transactions", glow: "var(--glow-gold)" },
];

const TIMELINE = [
  { year: "2026", phase: "Phase 1", label: "Core Engine Live" },
  { year: "2027", phase: "Phase 2", label: "Community Expansion" },
  { year: "2028", phase: "Phase 3", label: "Academy + Market" },
  { year: "2029", phase: "Phase 4", label: "Work + Intelligence" },
  { year: "2030", phase: "Vision", label: "Unified Sovereign Ecosystem" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setActive((v) => (v + 1) % LAYERS.length), 2500);
    return () => clearInterval(timer);
  }, []);

  const activeLayer = useMemo(() => LAYERS[active], [active]);

  return (
    <>
      <style>{css}</style>
      <main className="lp">
        <div className="lp-stars" />
        <header className="lp-nav">
          <div className="lp-brand">WINNERS ECOSYSTEM</div>
          <nav className="lp-links">
            <a href="#layers">Layers</a>
            <a href="#vision">Vision</a>
            <a href="#roadmap">Roadmap</a>
          </nav>
          <button className="lp-cta" onClick={() => navigate("/login")}>Enter Platform</button>
        </header>

        <section className="lp-hero">
          <p className="lp-kicker">INTELLIGENT AGENTIC ECOSYSTEM</p>
          <h1>One Ecosystem, Six Engines, One AI Core</h1>
          <p className="lp-sub">
            Replace fragmented tools with one premium stack for community, learning, commerce, work, finance, and AI orchestration.
          </p>
          <div className="lp-hero-actions">
            <button className="lp-primary" onClick={() => navigate("/login")}>Start Free</button>
            <button className="lp-secondary" onClick={() => document.getElementById("layers")?.scrollIntoView({ behavior: "smooth" })}>
              Explore Layers
            </button>
          </div>
        </section>

        <section className="lp-section" id="layers">
          <h2>Ecosystem Snapshot</h2>
          <div className="lp-grid">
            {LAYERS.map((layer, i) => (
              <article
                key={layer.id}
                className={`lp-card ${active === i ? "lp-card-active" : ""}`}
                onMouseEnter={() => setActive(i)}
              >
                <div className="lp-card-bar" style={{ background: layer.glow }} />
                <h3>{layer.title}</h3>
                <p className="lp-metric">{layer.metric}</p>
                <p className="lp-label">{layer.subtitle}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="lp-section" id="vision">
          <div className="lp-ai">
            <div className="lp-orbit" />
            <div className="lp-orbit lp-orbit-2" />
            <div className="lp-core">AI</div>
          </div>
          <div className="lp-vision-copy">
            <h2>Live Focus: {activeLayer.title}</h2>
            <p>
              The AI core continuously routes signals across every layer, turning activity into recommendations, growth loops, and measurable outcomes.
            </p>
            <ul>
              <li>Unified identity, billing, and access control.</li>
              <li>Cross-layer insights from one analytics brain.</li>
              <li>Premium visual identity aligned with Winners vision.</li>
            </ul>
          </div>
        </section>

        <section className="lp-section" id="roadmap">
          <h2>Roadmap to 2030</h2>
          <div className="lp-roadmap">
            {TIMELINE.map((step) => (
              <div className="lp-step" key={step.year}>
                <span>{step.year}</span>
                <strong>{step.phase}</strong>
                <p>{step.label}</p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@500;700;800&display=swap');
  * { box-sizing: border-box; }
  :root {
    --bg:#050A14;
    --surface:#0C1628;
    --surface-2:#121F35;
    --text:#E7EDF7;
    --dim:#8DA2BD;
    --gold:#D6B25E;
    --ice:#7BC2FF;
    --glow-gold: linear-gradient(90deg,#6E4E16,#D6B25E,#6E4E16);
    --glow-blue: linear-gradient(90deg,#1E3965,#7BC2FF,#1E3965);
    --glow-ice: linear-gradient(90deg,#2A4A7E,#9DD9FF,#2A4A7E);
  }
  .lp {
    min-height: 100vh;
    background:
      radial-gradient(1200px 500px at 15% -10%, rgba(214,178,94,0.14), transparent 60%),
      radial-gradient(900px 400px at 100% 0%, rgba(123,194,255,0.16), transparent 55%),
      var(--bg);
    color: var(--text);
    font-family: 'Syne', sans-serif;
    padding-bottom: 80px;
    position: relative;
    overflow-x: hidden;
  }
  .lp-stars {
    position: absolute; inset: 0; pointer-events: none;
    background-image: radial-gradient(rgba(255,255,255,.22) 1px, transparent 1px);
    background-size: 3px 3px;
    opacity: .2;
  }
  .lp-nav {
    position: sticky; top: 0; z-index: 5;
    display: flex; align-items: center; justify-content: space-between;
    padding: 18px 28px; backdrop-filter: blur(8px);
    border-bottom: 1px solid rgba(214,178,94,.25);
    background: rgba(5,10,20,.75);
  }
  .lp-brand { font-weight: 800; letter-spacing: .06em; color: var(--gold); }
  .lp-links { display: flex; gap: 18px; }
  .lp-links a { color: var(--dim); text-decoration: none; font-family: 'Space Mono', monospace; font-size: 12px; }
  .lp-links a:hover { color: var(--gold); }
  .lp-cta, .lp-primary, .lp-secondary {
    border-radius: 10px; padding: 10px 16px; cursor: pointer; border: 1px solid transparent;
    font-family: 'Space Mono', monospace; font-size: 12px;
  }
  .lp-cta, .lp-primary { background: linear-gradient(180deg,#F2D088,#D6B25E); color: #241805; }
  .lp-secondary { background: transparent; color: var(--ice); border-color: rgba(123,194,255,.5); }
  .lp-hero {
    max-width: 980px; margin: 56px auto 30px; padding: 0 24px; text-align: center; position: relative; z-index: 1;
  }
  .lp-kicker { color: var(--ice); letter-spacing: .2em; font-family: 'Space Mono', monospace; font-size: 11px; }
  h1 { font-size: clamp(38px,7vw,70px); margin: 18px 0 10px; line-height: .98; }
  .lp-sub { color: var(--dim); max-width: 700px; margin: 0 auto; }
  .lp-hero-actions { display: flex; justify-content: center; gap: 12px; margin-top: 22px; flex-wrap: wrap; }

  .lp-section { max-width: 1100px; margin: 38px auto 0; padding: 0 24px; position: relative; z-index: 1; }
  .lp-section h2 { margin-bottom: 14px; font-size: 30px; }
  .lp-grid { display: grid; grid-template-columns: repeat(3,minmax(0,1fr)); gap: 14px; }
  .lp-card {
    background: linear-gradient(165deg,var(--surface-2),var(--surface));
    border: 1px solid rgba(133,157,184,.24); border-radius: 14px; padding: 16px;
    transition: transform .2s ease, border-color .2s ease;
  }
  .lp-card:hover, .lp-card-active { transform: translateY(-2px); border-color: rgba(214,178,94,.45); }
  .lp-card-bar { height: 2px; border-radius: 2px; margin-bottom: 12px; }
  .lp-card h3 { margin: 0; font-size: 20px; }
  .lp-metric { color: var(--gold); font-size: 34px; margin: 8px 0 4px; }
  .lp-label { color: var(--dim); margin: 0; }

  .lp-ai { width: 240px; height: 240px; border-radius: 50%; position: relative; margin: 10px auto 0; }
  .lp-orbit {
    position: absolute; inset: 0; border-radius: 50%; border: 1px solid rgba(214,178,94,.35);
    animation: spin 10s linear infinite;
  }
  .lp-orbit-2 { inset: 26px; border-color: rgba(123,194,255,.4); animation-direction: reverse; }
  .lp-core {
    position: absolute; inset: 72px; border-radius: 50%;
    display: grid; place-items: center; font-weight: 800; font-size: 36px;
    background: radial-gradient(circle at 30% 30%, rgba(123,194,255,.34), rgba(31,56,93,.9));
    border: 1px solid rgba(123,194,255,.5);
  }
  .lp-vision-copy { max-width: 760px; margin: 20px auto 0; color: var(--dim); }
  .lp-vision-copy ul { margin-top: 12px; }
  .lp-vision-copy li { margin: 6px 0; }

  .lp-roadmap { display: grid; grid-template-columns: repeat(5,minmax(0,1fr)); gap: 10px; }
  .lp-step {
    background: #0C1628; border: 1px solid rgba(133,157,184,.25); border-radius: 12px; padding: 12px;
  }
  .lp-step span { color: var(--ice); font-family: 'Space Mono', monospace; font-size: 12px; }
  .lp-step strong { display: block; margin: 6px 0; }
  .lp-step p { margin: 0; color: var(--dim); font-size: 13px; }

  @keyframes spin { to { transform: rotate(360deg); } }
  @media (max-width: 950px) {
    .lp-grid, .lp-roadmap { grid-template-columns: repeat(2,minmax(0,1fr)); }
    .lp-links { display: none; }
  }
  @media (max-width: 640px) {
    .lp-grid, .lp-roadmap { grid-template-columns: 1fr; }
    .lp-nav { padding: 14px; gap: 8px; }
    .lp-brand { font-size: 13px; }
  }
`;
