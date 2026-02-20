// src/features/landing/LandingPage.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800;900&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .lp {
    --gold: #F5C842; --gold2: #E8B820; --bg: #080B10; --surface: #0D1117;
    --surface2: #141B24; --border: #1E2A38; --text: #E8EDF2; --text-dim: #5A6878;
    --green: #2DD4A0; --blue: #4A9EFF; --red: #FF5975; --purple: #9B6FFF;
    background: var(--bg); color: var(--text);
    font-family: 'Syne', sans-serif; overflow-x: hidden; line-height: 1;
  }

  /* ── NAV ── */
  .lp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    background: rgba(8,11,16,0.85); backdrop-filter: blur(16px);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 48px; height: 64px;
  }
  .lp-nav-logo {
    display: flex; align-items: center; gap: 10px;
    font-family: 'Space Mono', monospace; font-size: 11px;
    letter-spacing: 3px; text-transform: uppercase; color: var(--gold);
  }
  .lp-nav-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); box-shadow: 0 0 8px var(--gold); }
  .lp-nav-links { display: flex; align-items: center; gap: 32px; }
  .lp-nav-link {
    font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim);
    text-decoration: none; letter-spacing: 0.5px; transition: color 0.15s; cursor: pointer; background: none; border: none;
  }
  .lp-nav-link:hover { color: var(--gold); }
  .lp-nav-cta {
    background: var(--gold); color: #080B10; border: none; border-radius: 3px;
    padding: 9px 22px; font-family: 'Syne', sans-serif; font-size: 13px;
    font-weight: 700; cursor: pointer; transition: opacity 0.15s;
  }
  .lp-nav-cta:hover { opacity: 0.88; }

  /* ── HERO ── */
  .lp-hero {
    min-height: 100vh; display: flex; align-items: center; justify-content: center;
    padding: 120px 48px 80px; position: relative; overflow: hidden;
    text-align: center;
  }
  .lp-hero-bg {
    position: absolute; inset: 0; pointer-events: none;
    background: radial-gradient(ellipse 80% 60% at 50% 40%, rgba(245,200,66,0.07) 0%, transparent 70%);
  }
  .lp-hero-grid {
    position: absolute; inset: 0; pointer-events: none; opacity: 0.04;
    background-image: linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: 48px 48px;
  }
  .lp-hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: rgba(245,200,66,0.08); border: 1px solid rgba(245,200,66,0.2);
    border-radius: 20px; padding: 6px 16px; margin-bottom: 28px;
    font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 2px;
    text-transform: uppercase; color: var(--gold);
  }
  .lp-hero-badge-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--green); box-shadow: 0 0 6px var(--green); animation: lp-pulse 2s infinite; }
  .lp-hero-title { font-size: clamp(48px, 8vw, 96px); font-weight: 900; letter-spacing: -3px; line-height: 0.95; margin-bottom: 24px; }
  .lp-hero-title .gold { color: var(--gold); }
  .lp-hero-subtitle { font-size: 18px; color: var(--text-dim); line-height: 1.6; max-width: 560px; margin: 0 auto 40px; font-weight: 400; }
  .lp-hero-actions { display: flex; align-items: center; justify-content: center; gap: 14px; flex-wrap: wrap; margin-bottom: 60px; }
  .lp-btn-primary {
    background: var(--gold); color: #080B10; border: none; border-radius: 4px;
    padding: 14px 32px; font-family: 'Syne', sans-serif; font-size: 15px;
    font-weight: 700; cursor: pointer; transition: all 0.15s;
    box-shadow: 0 0 32px rgba(245,200,66,0.2);
  }
  .lp-btn-primary:hover { opacity: 0.9; box-shadow: 0 0 48px rgba(245,200,66,0.35); transform: translateY(-1px); }
  .lp-btn-secondary {
    background: transparent; color: var(--text); border: 1px solid var(--border);
    border-radius: 4px; padding: 14px 32px; font-family: 'Syne', sans-serif;
    font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.15s;
  }
  .lp-btn-secondary:hover { border-color: var(--gold); color: var(--gold); }
  .lp-hero-stats { display: flex; align-items: center; justify-content: center; gap: 48px; flex-wrap: wrap; }
  .lp-hero-stat-val { font-size: 28px; font-weight: 800; color: var(--gold); letter-spacing: -1px; }
  .lp-hero-stat-label { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); letter-spacing: 1px; text-transform: uppercase; margin-top: 4px; }

  /* ── SECTION COMMON ── */
  .lp-section { padding: 100px 48px; }
  .lp-section-inner { max-width: 1100px; margin: 0 auto; }
  .lp-section-tag {
    font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 3px;
    text-transform: uppercase; color: var(--gold); margin-bottom: 14px;
  }
  .lp-section-title { font-size: clamp(32px, 4vw, 52px); font-weight: 800; letter-spacing: -1.5px; line-height: 1.05; margin-bottom: 16px; }
  .lp-section-desc  { font-size: 16px; color: var(--text-dim); line-height: 1.6; max-width: 540px; }
  .lp-divider { height: 1px; background: linear-gradient(90deg, transparent, var(--border), transparent); margin: 0 48px; }

  /* ── FEATURES ── */
  .lp-features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 60px; }
  .lp-feature-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 6px;
    padding: 28px 24px; position: relative; overflow: hidden; transition: border-color 0.2s, transform 0.2s;
  }
  .lp-feature-card:hover { border-color: rgba(245,200,66,0.25); transform: translateY(-3px); }
  .lp-feature-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
  .lp-feature-card:nth-child(1)::before { background: var(--gold); }
  .lp-feature-card:nth-child(2)::before { background: var(--blue); }
  .lp-feature-card:nth-child(3)::before { background: var(--green); }
  .lp-feature-card:nth-child(4)::before { background: var(--purple); }
  .lp-feature-card:nth-child(5)::before { background: var(--red); }
  .lp-feature-card:nth-child(6)::before { background: var(--gold); }
  .lp-feature-icon { font-size: 28px; margin-bottom: 14px; }
  .lp-feature-name { font-size: 15px; font-weight: 700; margin-bottom: 8px; }
  .lp-feature-desc { font-size: 13px; color: var(--text-dim); line-height: 1.6; font-family: 'Space Mono', monospace; }

  /* ── PRICING ── */
  .lp-pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 60px; }
  .lp-plan {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 6px; padding: 32px 28px; position: relative; overflow: hidden;
    transition: border-color 0.2s, transform 0.2s;
  }
  .lp-plan:hover { transform: translateY(-3px); }
  .lp-plan.featured {
    border-color: rgba(245,200,66,0.4);
    background: linear-gradient(180deg, rgba(245,200,66,0.05) 0%, var(--surface) 60%);
  }
  .lp-plan-popular {
    position: absolute; top: 16px; right: 16px;
    background: var(--gold); color: #080B10;
    font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 1px;
    text-transform: uppercase; padding: 3px 10px; border-radius: 2px; font-weight: 700;
  }
  .lp-plan-name  { font-size: 13px; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 2px; margin-bottom: 16px; font-family: 'Space Mono', monospace; }
  .lp-plan-price { font-size: 48px; font-weight: 900; letter-spacing: -2px; margin-bottom: 4px; }
  .lp-plan.featured .lp-plan-price { color: var(--gold); }
  .lp-plan-period { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); margin-bottom: 24px; }
  .lp-plan-features { list-style: none; margin-bottom: 28px; display: flex; flex-direction: column; gap: 10px; }
  .lp-plan-feature { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: var(--text-dim); line-height: 1.4; }
  .lp-plan-feature-check { color: var(--green); flex-shrink: 0; font-size: 12px; margin-top: 1px; }
  .lp-plan-feature-x { color: var(--border); flex-shrink: 0; font-size: 12px; margin-top: 1px; }
  .lp-plan-btn {
    width: 100%; padding: 12px; border-radius: 3px; font-family: 'Syne', sans-serif;
    font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.15s;
    border: 1px solid var(--border); background: transparent; color: var(--text);
  }
  .lp-plan-btn:hover { border-color: var(--gold); color: var(--gold); }
  .lp-plan.featured .lp-plan-btn { background: var(--gold); color: #080B10; border-color: var(--gold); }
  .lp-plan.featured .lp-plan-btn:hover { opacity: 0.88; }

  /* ── TESTIMONIALS ── */
  .lp-testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 60px; }
  .lp-testimonial {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 6px; padding: 28px 24px;
  }
  .lp-testimonial-quote { font-size: 13px; color: var(--text-dim); line-height: 1.7; margin-bottom: 20px; font-style: italic; }
  .lp-testimonial-quote::before { content: '"'; color: var(--gold); font-size: 28px; font-style: normal; display: block; margin-bottom: 8px; line-height: 1; }
  .lp-testimonial-author { display: flex; align-items: center; gap: 12px; }
  .lp-testimonial-avatar {
    width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center;
    justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0;
  }
  .lp-testimonial-name { font-size: 13px; font-weight: 700; }
  .lp-testimonial-role { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }
  .lp-stars { color: var(--gold); font-size: 12px; margin-bottom: 14px; letter-spacing: 2px; }

  /* ── FAQ ── */
  .lp-faq-list { margin-top: 60px; display: flex; flex-direction: column; gap: 2px; max-width: 740px; }
  .lp-faq-item { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; overflow: hidden; }
  .lp-faq-q {
    display: flex; align-items: center; justify-content: space-between;
    padding: 20px 24px; cursor: pointer; font-size: 14px; font-weight: 700;
    transition: color 0.15s; gap: 16px;
  }
  .lp-faq-q:hover { color: var(--gold); }
  .lp-faq-chevron { font-size: 12px; color: var(--text-dim); transition: transform 0.2s; flex-shrink: 0; }
  .lp-faq-chevron.open { transform: rotate(180deg); }
  .lp-faq-a {
    padding: 0 24px; max-height: 0; overflow: hidden;
    transition: max-height 0.3s ease, padding 0.3s ease;
    font-family: 'Space Mono', monospace; font-size: 12px; color: var(--text-dim); line-height: 1.7;
  }
  .lp-faq-a.open { max-height: 200px; padding: 0 24px 20px; }

  /* ── FOOTER ── */
  .lp-footer {
    background: var(--surface); border-top: 1px solid var(--border);
    padding: 60px 48px 32px;
  }
  .lp-footer-inner { max-width: 1100px; margin: 0 auto; }
  .lp-footer-top { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 40px; margin-bottom: 48px; }
  .lp-footer-brand-name {
    font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 3px;
    text-transform: uppercase; color: var(--gold); margin-bottom: 12px;
    display: flex; align-items: center; gap: 8px;
  }
  .lp-footer-brand-desc { font-size: 13px; color: var(--text-dim); line-height: 1.6; max-width: 260px; }
  .lp-footer-col-title { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 16px; }
  .lp-footer-links { display: flex; flex-direction: column; gap: 10px; }
  .lp-footer-link { font-size: 13px; color: var(--text-dim); text-decoration: none; cursor: pointer; background: none; border: none; text-align: left; transition: color 0.15s; }
  .lp-footer-link:hover { color: var(--gold); }
  .lp-footer-bottom {
    border-top: 1px solid var(--border); padding-top: 24px;
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
  }
  .lp-footer-copy { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }
  .lp-footer-legal { display: flex; gap: 20px; }

  /* ── CTA BANNER ── */
  .lp-cta {
    padding: 100px 48px; text-align: center; position: relative; overflow: hidden;
  }
  .lp-cta-bg {
    position: absolute; inset: 0;
    background: radial-gradient(ellipse 70% 80% at 50% 50%, rgba(245,200,66,0.06) 0%, transparent 70%);
  }
  .lp-cta-title { font-size: clamp(36px, 5vw, 64px); font-weight: 900; letter-spacing: -2px; margin-bottom: 16px; }
  .lp-cta-title span { color: var(--gold); }
  .lp-cta-desc { font-size: 16px; color: var(--text-dim); margin-bottom: 36px; }

  @keyframes lp-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }

  @media (max-width: 900px) {
    .lp-nav { padding: 0 24px; }
    .lp-nav-links { display: none; }
    .lp-section { padding: 70px 24px; }
    .lp-hero { padding: 120px 24px 60px; }
    .lp-features-grid, .lp-pricing-grid, .lp-testimonials-grid { grid-template-columns: 1fr; }
    .lp-footer-top { grid-template-columns: 1fr 1fr; }
    .lp-cta { padding: 70px 24px; }
  }
`;

const FEATURES = [
  { icon: "🧠", name: "AI-Powered Insights",     desc: "Claude analyzes your data in real-time and delivers actionable recommendations tailored to your workspace." },
  { icon: "📊", name: "Advanced Analytics",       desc: "Revenue trends, activity charts, anomaly detection, and forecasting — all in one unified dashboard." },
  { icon: "👥", name: "Multi-Tenant Teams",       desc: "Invite teammates, assign roles, and manage permissions across multiple workspaces seamlessly." },
  { icon: "📤", name: "Flexible Export",          desc: "Export your data as PDF, XLSX, CSV, or JSON with one click. Perfect for stakeholder reports." },
  { icon: "📧", name: "Automated Reports",        desc: "Schedule weekly and monthly email reports. Get instant anomaly alerts when your data spikes." },
  { icon: "🔒", name: "Enterprise Security",      desc: "JWT auth, RBAC with 4 permission levels, tenant isolation, and audit logging built in." },
];

const PLANS = [
  {
    name: "Free", price: "$0", period: "/month", featured: false,
    features: [
      { text: "3 team members",           check: true  },
      { text: "30-day analytics history", check: true  },
      { text: "CSV & JSON export",        check: true  },
      { text: "Basic dashboard",          check: true  },
      { text: "AI recommendations",       check: false },
      { text: "Email reports",            check: false },
    ],
  },
  {
    name: "Pro", price: "$99", period: "/month", featured: true,
    features: [
      { text: "10 team members",          check: true },
      { text: "90-day analytics history", check: true },
      { text: "All export formats",       check: true },
      { text: "AI recommendations",       check: true },
      { text: "Automated email reports",  check: true },
      { text: "Revenue forecasting",      check: true },
    ],
  },
  {
    name: "Enterprise", price: "$299", period: "/month", featured: false,
    features: [
      { text: "Unlimited members",        check: true },
      { text: "Unlimited history",        check: true },
      { text: "All export formats",       check: true },
      { text: "AI + custom models",       check: true },
      { text: "Priority support + SLA",   check: true },
      { text: "Custom integrations",      check: true },
    ],
  },
];

const TESTIMONIALS = [
  { quote: "Winners Ecosystem transformed how we track revenue. The AI insights saved us 10 hours a week that we used to spend building manual reports.", name: "Sarah K.", role: "CEO, GrowthLab", initials: "SK", color: "#F5C842" },
  { quote: "The anomaly detection caught a billing error we would have missed for months. Paid for itself in the first week.", name: "Marcus T.", role: "CFO, Nexus Ventures", initials: "MT", color: "#4A9EFF" },
  { quote: "Best SaaS analytics platform I've used. The multi-tenant setup was flawless for our agency clients.", name: "Priya M.", role: "Director, DataForge", initials: "PM", color: "#2DD4A0" },
];

const FAQS = [
  { q: "How does the AI recommendation engine work?", a: "We use Claude by Anthropic to analyze your real revenue and activity data from your database. It generates personalized insights covering revenue trends, anomalies, growth opportunities, team performance, and specific action items." },
  { q: "Can I export my data at any time?", a: "Yes. You can export your analytics in PDF, Excel (XLSX), CSV, or JSON format at any time. The export page lets you choose your dataset and date range." },
  { q: "How does multi-tenant access work?", a: "Each workspace is fully isolated. You can invite team members and assign roles: Owner, Admin, Member, or Viewer. Each role has specific permissions for what they can view or modify." },
  { q: "Is there a free trial for Pro?", a: "You can start on the Free plan immediately with no credit card required. When you're ready to upgrade, the Pro plan unlocks AI insights, all export formats, and automated email reports." },
  { q: "What happens to my data if I cancel?", a: "Your data is retained for 30 days after cancellation, giving you time to export everything. After that, it's permanently deleted from our servers." },
];

export default function LandingPage() {
  const navigate  = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Inject styles
  if (typeof document !== "undefined" && !document.getElementById("lp-styles")) {
    const tag = document.createElement("style");
    tag.id = "lp-styles"; tag.textContent = css;
    document.head.appendChild(tag);
  }

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <div className="lp">

      {/* NAV */}
      <nav className="lp-nav">
        <div className="lp-nav-logo">
          <div className="lp-nav-dot" />
          Winners Ecosystem
        </div>
        <div className="lp-nav-links">
          <button className="lp-nav-link" onClick={() => scrollTo("features")}>Features</button>
          <button className="lp-nav-link" onClick={() => scrollTo("pricing")}>Pricing</button>
          <button className="lp-nav-link" onClick={() => scrollTo("faq")}>FAQ</button>
          <button className="lp-nav-link" onClick={() => navigate("/login")}>Sign In</button>
        </div>
        <button className="lp-nav-cta" onClick={() => navigate("/login")}>Get Started →</button>
      </nav>

      {/* HERO */}
      <section className="lp-hero">
        <div className="lp-hero-bg" />
        <div className="lp-hero-grid" />
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="lp-hero-badge">
            <div className="lp-hero-badge-dot" />
            AI-Powered Analytics Platform
          </div>
          <h1 className="lp-hero-title">
            The Intelligence<br />
            Layer for <span className="gold">Winners</span>
          </h1>
          <p className="lp-hero-subtitle">
            Real-time revenue analytics, Claude-powered insights, and automated reporting — built for teams that move fast.
          </p>
          <div className="lp-hero-actions">
            <button className="lp-btn-primary" onClick={() => navigate("/login")}>Start Free Today →</button>
            <button className="lp-btn-secondary" onClick={() => scrollTo("features")}>See Features</button>
          </div>
          <div className="lp-hero-stats">
            {[["$2.4M+", "Revenue tracked"], ["98%", "Uptime SLA"], ["6 min", "Avg setup time"], ["3×", "Faster reporting"]].map(([val, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div className="lp-hero-stat-val">{val}</div>
                <div className="lp-hero-stat-label">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="lp-divider" />

      {/* FEATURES */}
      <section className="lp-section" id="features">
        <div className="lp-section-inner">
          <div className="lp-section-tag">Features</div>
          <h2 className="lp-section-title">Everything you need<br />to grow faster</h2>
          <p className="lp-section-desc">A complete intelligence platform — from real-time analytics to AI-generated recommendations.</p>
          <div className="lp-features-grid">
            {FEATURES.map((f) => (
              <div className="lp-feature-card" key={f.name}>
                <div className="lp-feature-icon">{f.icon}</div>
                <div className="lp-feature-name">{f.name}</div>
                <div className="lp-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="lp-divider" />

      {/* PRICING */}
      <section className="lp-section" id="pricing">
        <div className="lp-section-inner">
          <div className="lp-section-tag">Pricing</div>
          <h2 className="lp-section-title">Simple, transparent<br />pricing</h2>
          <p className="lp-section-desc">Start free. Upgrade when you need more. No hidden fees.</p>
          <div className="lp-pricing-grid">
            {PLANS.map((plan) => (
              <div key={plan.name} className={`lp-plan${plan.featured ? " featured" : ""}`}>
                {plan.featured && <div className="lp-plan-popular">Most Popular</div>}
                <div className="lp-plan-name">{plan.name}</div>
                <div className="lp-plan-price">{plan.price}</div>
                <div className="lp-plan-period">{plan.period}</div>
                <ul className="lp-plan-features">
                  {plan.features.map((f) => (
                    <li className="lp-plan-feature" key={f.text}>
                      <span className={f.check ? "lp-plan-feature-check" : "lp-plan-feature-x"}>{f.check ? "✓" : "×"}</span>
                      <span style={{ color: f.check ? "var(--text)" : "var(--text-dim)" }}>{f.text}</span>
                    </li>
                  ))}
                </ul>
                <button className="lp-plan-btn" onClick={() => navigate("/login")}>
                  {plan.name === "Free" ? "Get Started Free" : `Start ${plan.name}`} →
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="lp-divider" />

      {/* TESTIMONIALS */}
      <section className="lp-section" id="testimonials">
        <div className="lp-section-inner">
          <div className="lp-section-tag">Testimonials</div>
          <h2 className="lp-section-title">Trusted by teams<br />that win</h2>
          <div className="lp-testimonials-grid">
            {TESTIMONIALS.map((t) => (
              <div className="lp-testimonial" key={t.name}>
                <div className="lp-stars">★★★★★</div>
                <div className="lp-testimonial-quote">{t.quote}</div>
                <div className="lp-testimonial-author">
                  <div className="lp-testimonial-avatar" style={{ background: `${t.color}18`, color: t.color }}>{t.initials}</div>
                  <div>
                    <div className="lp-testimonial-name">{t.name}</div>
                    <div className="lp-testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="lp-divider" />

      {/* FAQ */}
      <section className="lp-section" id="faq">
        <div className="lp-section-inner">
          <div className="lp-section-tag">FAQ</div>
          <h2 className="lp-section-title">Common questions</h2>
          <div className="lp-faq-list">
            {FAQS.map((faq, i) => (
              <div className="lp-faq-item" key={i}>
                <div className="lp-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {faq.q}
                  <span className={`lp-faq-chevron${openFaq === i ? " open" : ""}`}>▼</span>
                </div>
                <div className={`lp-faq-a${openFaq === i ? " open" : ""}`}>{faq.a}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="lp-divider" />

      {/* CTA BANNER */}
      <section className="lp-cta">
        <div className="lp-cta-bg" />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 className="lp-cta-title">Ready to build your<br /><span>winning edge?</span></h2>
          <p className="lp-cta-desc">Join hundreds of teams using Winners Ecosystem to grow faster.</p>
          <button className="lp-btn-primary" onClick={() => navigate("/login")}>Start Free Today →</button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-top">
            <div>
              <div className="lp-footer-brand-name">
                <div className="lp-nav-dot" style={{ width: 5, height: 5 }} />
                Winners Ecosystem
              </div>
              <div className="lp-footer-brand-desc">The AI-powered intelligence platform for revenue analytics and team performance.</div>
            </div>
            <div>
              <div className="lp-footer-col-title">Product</div>
              <div className="lp-footer-links">
                {["Features", "Pricing", "Changelog", "Roadmap"].map((l) => <button key={l} className="lp-footer-link" onClick={() => scrollTo(l.toLowerCase())}>{l}</button>)}
              </div>
            </div>
            <div>
              <div className="lp-footer-col-title">Company</div>
              <div className="lp-footer-links">
                {["About", "Blog", "Careers", "Contact"].map((l) => <button key={l} className="lp-footer-link">{l}</button>)}
              </div>
            </div>
            <div>
              <div className="lp-footer-col-title">Legal</div>
              <div className="lp-footer-links">
                {["Privacy Policy", "Terms of Service", "Cookie Policy", "Security"].map((l) => <button key={l} className="lp-footer-link">{l}</button>)}
              </div>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <div className="lp-footer-copy">© {new Date().getFullYear()} Winners Ecosystem. All rights reserved.</div>
            <div className="lp-footer-legal">
              <button className="lp-footer-link">Privacy</button>
              <button className="lp-footer-link">Terms</button>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}