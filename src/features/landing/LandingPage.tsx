// src/features/landing/LandingPage.tsx
// Phase 1 — Core Engine · Public Landing Page
// UPGRADED: Cinematic hero, animated platform cards, agentic loop, immersive design

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const PLATFORMS = [
  {
    icon: "⬡", name: "Core Engine", phase: "Phase 1", status: "live", color: "#2DD4A0",
    domain: "winnersempire.io",
    desc: "The foundation. Multi-tenant auth, billing, analytics, AI insights, and API gateway powering the entire ecosystem.",
    tags: ["Auth + 2FA", "Billing", "Analytics", "Admin"],
    progress: 90,
  },
  {
    icon: "🧑‍🤝‍🧑", name: "Winners Community", phase: "Phase 2", status: "building", color: "#89C4E1",
    domain: "community.winnersempire.io",
    desc: "Full social platform. Posts, comments, groups, real-time feed, creator tools, and direct messaging.",
    tags: ["Social Feed", "Groups", "Real-Time", "Creators"],
    progress: 55,
  },
  {
    icon: "🎓", name: "Winners Academy", phase: "Phase 3", status: "building", color: "#C9A84C",
    domain: "learn.winnersempire.io",
    desc: "Complete LMS. Video courses, progress tracking, AI tutor, certificates, and instructor dashboards.",
    tags: ["Courses", "Certificates", "AI Tutor", "Progress"],
    progress: 30,
  },
  {
    icon: "🛒", name: "Winners Market", phase: "Phase 4", status: "planned", color: "#9B6FFF",
    domain: "shop.winnersempire.io",
    desc: "Multi-vendor marketplace. Digital products, dropshipping, vendor dashboards, and AI recommendations.",
    tags: ["Products", "Vendors", "Dropship", "Commerce"],
    progress: 0,
  },
  {
    icon: "🤖", name: "Winners Intelligence", phase: "Phase 5", status: "planned", color: "#E05A4E",
    domain: "ai.winnersempire.io",
    desc: "The agentic AI core. Personal AI agents, semantic search, cross-platform recommendations, voice interface.",
    tags: ["AI Agents", "Search", "Automation", "Predictions"],
    progress: 5,
  },
  {
    icon: "💼", name: "Winners Work", phase: "Phase 6", status: "planned", color: "#2B5F8E",
    domain: "work.winnersempire.io",
    desc: "Freelance hub. Job board, AI skill matching, escrow payments, contracts, and portfolios.",
    tags: ["Jobs", "Freelance", "Escrow", "Matching"],
    progress: 0,
  },
];

const FEATURES = [
  { icon: "🔐", title: "Sovereign Identity",    desc: "One login governs your entire digital life across all six platforms. JWT + 2FA + Google OAuth." },
  { icon: "🧠", title: "Agentic AI Core",       desc: "Claude-powered intelligence that learns from every interaction and proactively guides your growth." },
  { icon: "⚡", title: "Real-Time Everything",  desc: "WebSocket-powered live feed, notifications, presence indicators, and instant collaboration." },
  { icon: "💳", title: "Unified Billing",       desc: "One subscription. Stripe + LemonSqueezy. Upgrade once, unlock the entire ecosystem." },
  { icon: "🏢", title: "Multi-Tenant Security", desc: "Enterprise-grade workspace isolation. Row-level security. Each team's data is completely sovereign." },
  { icon: "📊", title: "Deep Analytics",        desc: "Revenue forecasting, activity tracking, AI insights, and anomaly detection across every platform." },
];

const LOOP_STEPS = [
  { icon: "🧑‍🤝‍🧑", platform: "Community",    color: "#89C4E1", action: "Post knowledge. Build reputation.", result: "AI detects your skills" },
  { icon: "🎓",       platform: "Academy",      color: "#C9A84C", action: "Complete the recommended course.", result: "Earn verified certificate" },
  { icon: "💼",       platform: "Work",         color: "#2B5F8E", action: "AI matches you to freelance jobs.", result: "Land the contract" },
  { icon: "🛒",       platform: "Market",       color: "#9B6FFF", action: "Buy tools. Sell your products.", result: "Revenue compounds" },
  { icon: "🤖",       platform: "Intelligence", color: "#E05A4E", action: "AI optimizes your entire journey.", result: "Loop repeats. You win." },
];

const PLANS = [
  {
    id: "free", icon: "🌱", name: "Free", tagline: "The Starting Line",
    price: "0", per: "forever · no card required",
    desc: "For individuals exploring the ecosystem.",
    cta: "Start Free", ctaStyle: "outline",
    features: ["Up to 3 seats", "30-day analytics", "CSV & JSON export", "Basic AI insights", "Community access"],
  },
  {
    id: "pro", icon: "⚡", name: "Pro", tagline: "The Growth Engine",
    price: "99", per: "/month · billed monthly",
    desc: "For serious operators and growing teams.", popular: true,
    cta: "Upgrade to Pro", ctaStyle: "gold",
    features: ["Up to 10 seats", "90-day analytics", "All export formats", "AI forecasting + insights", "Full creator tools", "Academy enrollment", "Priority support"],
  },
  {
    id: "enterprise", icon: "🏢", name: "Enterprise", tagline: "The Sovereign Stack",
    price: "299", per: "/month · billed monthly",
    desc: "For businesses that run entirely inside Winners.",
    cta: "Go Enterprise", ctaStyle: "ice",
    features: ["Unlimited seats", "Unlimited history", "AI agents + automation", "Custom integrations + API", "White-label option", "Dedicated account manager", "SLA guarantee"],
  },
];

const FAQS = [
  { q: "What exactly is Winners Ecosystem?", a: "A single platform that replaces 6 separate tools — social community, LMS, marketplace, freelance hub, AI assistant, and developer cloud — all connected by one identity and one AI core." },
  { q: "How is this different from Notion, Teachable, or Upwork?", a: "Those are isolated tools. Winners Ecosystem is infrastructure. Every action in one platform feeds intelligence to all others. Your Academy certificate unlocks Work opportunities. Community reputation boosts Market reach. Nothing is siloed." },
  { q: "Is my data safe?", a: "Enterprise-grade security from day one. JWT authentication, 2FA (TOTP + Email OTP), Row-Level Security at the database, Helmet headers, rate limiting, and GDPR compliance built in." },
  { q: "Can I use just one platform?", a: "Yes. Start with Community or Academy. But the more layers you activate, the more the AI connects the dots and compounds your results." },
  { q: "When will Market and Work launch?", a: "Market follows Academy V1 stability. Work follows Market. Each layer is built methodically — quality over speed." },
];

const TESTIMONIALS = [
  { text: "We stopped using five separate tools the week we joined. The ecosystem thinking is exactly what growing teams need.", name: "Marcus Chen", role: "Founder, Apex Digital", avatar: "M", color: "#C9A84C" },
  { text: "The AI layer is what sold me. It doesn't just show data — it tells you what to do next. That's a different product.", name: "Sarah Okonkwo", role: "COO, Meridian SaaS", avatar: "S", color: "#89C4E1" },
  { text: "I joined for the analytics. I stayed for the community and the roadmap. This team is building something real.", name: "James Whitfield", role: "CEO, Pinnacle Commerce", avatar: "J", color: "#9B6FFF" },
];

export default function LandingPage() {
  const navigate  = useNavigate();
  const [openFaq, setOpenFaq]       = useState<number | null>(null);
  const [activeLoop, setActiveLoop] = useState(0);
  const [scrolled, setScrolled]     = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setActiveLoop((p) => (p + 1) % LOOP_STEPS.length), 2400);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add("lp-visible"); }),
      { threshold: 0.08 }
    );
    document.querySelectorAll(".lp-reveal").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <div className="lp">

        {/* ── NAV ── */}
        <nav className={`lp-nav${scrolled ? " lp-nav-scrolled" : ""}`}>
          <a href="#" className="lp-nav-brand">
            <div className="lp-nav-hex">⬡</div>
            <div>
              <div className="lp-nav-name">Winners Empire</div>
              <div className="lp-nav-sub">Digital Ecosystem</div>
            </div>
          </a>
          <ul className="lp-nav-links">
            <li><a href="#platforms">Platforms</a></li>
            <li><a href="#loop">How It Works</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
          <button className="lp-nav-cta" onClick={() => navigate("/login")}>Enter Ecosystem →</button>
        </nav>

        {/* ── HERO ── */}
        <section className="lp-hero" ref={heroRef}>
          <div className="lp-hero-grid" />
          <div className="lp-hero-glow-1" />
          <div className="lp-hero-glow-2" />
          <div className="lp-hero-glow-3" />
          <div className="lp-orb lp-orb-1" />
          <div className="lp-orb lp-orb-2" />
          <div className="lp-orb lp-orb-3" />

          <div className="lp-hero-content">
            <div className="lp-hero-badge">
              <span className="lp-hero-badge-dot" />
              Digital Sovereign Infrastructure · Est. 2026
            </div>

            <h1 className="lp-hero-title">
              One <em>Ecosystem</em>
            </h1>
            <div className="lp-hero-sub">Six Platforms · One AI · Infinite Leverage</div>

            <p className="lp-hero-desc">
              Replace six separate subscriptions with one intelligent platform that learns from
              every action across every layer — community, learning, commerce, work, and AI.
            </p>

            <div className="lp-hero-actions">
              <button className="lp-btn-primary" onClick={() => navigate("/login")}>
                <span>Join Free Today</span>
                <span className="lp-btn-arrow">→</span>
              </button>
              <button className="lp-btn-ghost" onClick={() => document.getElementById("platforms")?.scrollIntoView({ behavior: "smooth" })}>
                Explore Platforms
              </button>
            </div>

            <div className="lp-hero-stats">
              {[
                { val: "6",  label: "Platform Layers"  },
                { val: "1",  label: "Unified Identity"  },
                { val: "AI", label: "Powered Core"      },
                { val: "∞",  label: "Possibilities"     },
              ].map((s) => (
                <div className="lp-stat" key={s.label}>
                  <div className="lp-stat-val">{s.val}</div>
                  <div className="lp-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="lp-scroll-indicator">
            <div className="lp-scroll-line" />
            <span>Scroll</span>
          </div>
        </section>

        {/* ── TICKER ── */}
        <div className="lp-ticker">
          <div className="lp-ticker-track">
            {[...Array(2)].map((_, ri) => (
              <span key={ri} style={{ display: "contents" }}>
                {["Community", "Academy", "Marketplace", "AI Agents", "Freelance Work", "Developer Cloud", "Multi-Tenant", "Real-Time", "Stripe Billing", "2FA Security", "GDPR Compliant", "Open API"].map((item) => (
                  <span key={`${ri}-${item}`} className="lp-ticker-item">
                    <span className="lp-ticker-dot" />{item}
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

        {/* ── PLATFORMS ── */}
        <section className="lp-section lp-reveal" id="platforms">
          <div className="lp-section-header">
            <div className="lp-eyebrow">The Six Layers</div>
            <h2 className="lp-section-title">One ecosystem.<br /><em>Infinite leverage.</em></h2>
            <p className="lp-section-desc">Each platform is a standalone product. Together they're unstoppable.</p>
          </div>
          <div className="lp-platforms-grid">
            {PLATFORMS.map((p, i) => (
              <div key={p.name} className="lp-platform-card lp-reveal"
                style={{ "--card-color": p.color, transitionDelay: `${i * 0.07}s` } as React.CSSProperties}>
                <div className="lp-pc-top-bar" />
                <div className="lp-pc-phase">{p.phase}</div>
                <div className="lp-pc-icon">{p.icon}</div>
                <div className="lp-pc-name">{p.name}</div>
                <div className="lp-pc-domain">{p.domain}</div>
                <div className="lp-pc-desc">{p.desc}</div>
                <div className="lp-pc-tags">
                  {p.tags.map((t) => <span key={t} className="lp-pc-tag">{t}</span>)}
                </div>
                <div className="lp-pc-progress-bar">
                  <div className="lp-pc-progress-fill" style={{ width: `${p.progress}%`, background: p.color }} />
                </div>
                <div className="lp-pc-status-row">
                  <span className="lp-pc-dot" style={{ background: p.status === "live" ? "#2DD4A0" : p.status === "building" ? p.color : "#1E3248" }} />
                  <span className="lp-pc-status-text" style={{ color: p.status === "live" ? "#2DD4A0" : p.status === "building" ? p.color : "#5A7A96" }}>
                    {p.status === "live" ? "Live" : p.status === "building" ? "Building" : "Planned"} · {p.progress}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="lp-divider" />

        {/* ── THE LOOP ── */}
        <section className="lp-section lp-reveal" id="loop">
          <div className="lp-section-header">
            <div className="lp-eyebrow">The Agentic Loop</div>
            <h2 className="lp-section-title">Every action feeds<br /><em>the next opportunity.</em></h2>
            <p className="lp-section-desc">The AI connects every layer. Your growth compounds automatically.</p>
          </div>
          <div className="lp-loop-wrap">
            <div className="lp-loop-steps">
              {LOOP_STEPS.map((step, i) => (
                <div key={i}
                  className={`lp-loop-step${activeLoop === i ? " active" : ""}`}
                  style={{ "--step-color": step.color } as React.CSSProperties}
                  onClick={() => setActiveLoop(i)}>
                  <div className="lp-loop-icon">{step.icon}</div>
                  <div className="lp-loop-body">
                    <div className="lp-loop-platform">{step.platform}</div>
                    <div className="lp-loop-action">{step.action}</div>
                    <div className="lp-loop-result">→ {step.result}</div>
                  </div>
                  <div className="lp-loop-num">{String(i + 1).padStart(2, "0")}</div>
                </div>
              ))}
            </div>
            <div className="lp-loop-visual">
              <div className="lp-loop-center">
                <div className="lp-loop-center-ring lp-loop-ring-1" />
                <div className="lp-loop-center-ring lp-loop-ring-2" />
                <div className="lp-loop-center-ring lp-loop-ring-3" />
                <div className="lp-loop-center-icon">🤖</div>
                <div className="lp-loop-center-label">AI Core</div>
              </div>
              <div className="lp-loop-active-card" style={{ "--step-color": LOOP_STEPS[activeLoop].color } as React.CSSProperties}>
                <div className="lp-loop-active-icon">{LOOP_STEPS[activeLoop].icon}</div>
                <div className="lp-loop-active-platform">{LOOP_STEPS[activeLoop].platform}</div>
                <div className="lp-loop-active-action">{LOOP_STEPS[activeLoop].action}</div>
                <div className="lp-loop-active-result">{LOOP_STEPS[activeLoop].result}</div>
                <div className="lp-loop-dots">
                  {LOOP_STEPS.map((_, i) => (
                    <div key={i} className={`lp-loop-dot${activeLoop === i ? " active" : ""}`}
                      style={{ "--step-color": LOOP_STEPS[activeLoop].color } as React.CSSProperties} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="lp-divider" />

        {/* ── FEATURES ── */}
        <section className="lp-section lp-reveal" id="features">
          <div className="lp-section-header">
            <div className="lp-eyebrow">Core Capabilities</div>
            <h2 className="lp-section-title">Built for dominance,<br /><em>engineered for scale.</em></h2>
          </div>
          <div className="lp-features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="lp-feature-card lp-reveal"
                style={{ transitionDelay: `${i * 0.06}s` }}>
                <div className="lp-feature-num">0{i + 1}</div>
                <div className="lp-feature-icon">{f.icon}</div>
                <div className="lp-feature-title">{f.title}</div>
                <div className="lp-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <div className="lp-divider" />

        {/* ── PRICING ── */}
        <section className="lp-section lp-reveal" id="pricing">
          <div className="lp-section-header">
            <div className="lp-eyebrow">Access Plans</div>
            <h2 className="lp-section-title">Start free.<br /><em>Scale sovereign.</em></h2>
            <p className="lp-section-desc">One subscription unlocks the entire ecosystem.</p>
          </div>
          <div className="lp-pricing-grid">
            {PLANS.map((plan) => (
              <div key={plan.id} className={`lp-plan-card${plan.popular ? " lp-plan-popular" : ""}`}>
                {plan.popular && <div className="lp-plan-badge">Most Popular</div>}
                <div className="lp-plan-top-bar" />
                <div className="lp-plan-icon">{plan.icon}</div>
                <div className="lp-plan-name">{plan.name}</div>
                <div className="lp-plan-tagline">{plan.tagline}</div>
                <div className="lp-plan-price-row">
                  {plan.price !== "0" && <span className="lp-plan-dollar">$</span>}
                  <span className="lp-plan-amount">{plan.price === "0" ? "Free" : plan.price}</span>
                </div>
                <div className="lp-plan-per">{plan.per}</div>
                <div className="lp-plan-desc">{plan.desc}</div>
                <ul className="lp-plan-features">
                  {plan.features.map((f) => (
                    <li key={f}><span className="lp-plan-check">✓</span>{f}</li>
                  ))}
                </ul>
                <button className={`lp-plan-btn lp-plan-btn-${plan.ctaStyle}`} onClick={() => navigate("/login")}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="lp-divider" />

        {/* ── TESTIMONIALS ── */}
        <section className="lp-section lp-reveal">
          <div className="lp-section-header">
            <div className="lp-eyebrow">Social Proof</div>
            <h2 className="lp-section-title">Built for winners<br /><em>who demand more.</em></h2>
          </div>
          <div className="lp-testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="lp-testimonial lp-reveal" style={{ transitionDelay: `${i * 0.1}s` }}>
                <div className="lp-testimonial-stars">★★★★★</div>
                <div className="lp-testimonial-text">"{t.text}"</div>
                <div className="lp-testimonial-author">
                  <div className="lp-testimonial-avatar" style={{ background: `${t.color}20`, border: `1px solid ${t.color}40`, color: t.color }}>{t.avatar}</div>
                  <div>
                    <div className="lp-testimonial-name">{t.name}</div>
                    <div className="lp-testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="lp-divider" />

        {/* ── FAQ ── */}
        <section className="lp-section lp-reveal" id="faq">
          <div className="lp-faq-layout">
            <div className="lp-faq-left">
              <div className="lp-eyebrow" style={{ justifyContent: "flex-start" }}>FAQ</div>
              <h2 className="lp-section-title" style={{ textAlign: "left" }}>Common<br /><em>questions.</em></h2>
              <p className="lp-section-desc" style={{ textAlign: "left", marginLeft: 0 }}>Everything you need to know before joining the ecosystem.</p>
              <button className="lp-btn-primary" style={{ marginTop: 32 }} onClick={() => navigate("/login")}>
                <span>Join Free Today</span>
                <span className="lp-btn-arrow">→</span>
              </button>
            </div>
            <div className="lp-faq-right">
              {FAQS.map((faq, i) => (
                <div key={i} className="lp-faq-item">
                  <button className="lp-faq-q" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span>{faq.q}</span>
                    <span className={`lp-faq-icon${openFaq === i ? " open" : ""}`}>+</span>
                  </button>
                  <div className={`lp-faq-a${openFaq === i ? " open" : ""}`}>{faq.a}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA BAND ── */}
        <div className="lp-cta-band lp-reveal">
          <div className="lp-cta-glow" />
          <div className="lp-cta-content">
            <div className="lp-eyebrow" style={{ justifyContent: "center" }}>Ready?</div>
            <h2 className="lp-cta-title">Enter the<br /><em>Ecosystem.</em></h2>
            <p className="lp-cta-sub">One account. Six platforms. The AI does the rest.</p>
            <div className="lp-cta-actions">
              <button className="lp-btn-primary lp-btn-large" onClick={() => navigate("/login")}>
                <span>Start Free — No Card Required</span>
                <span className="lp-btn-arrow">→</span>
              </button>
              <div className="lp-cta-proof">
                <span className="lp-cta-proof-dot" />
                Free forever · Upgrade anytime · Cancel in 1 click
              </div>
            </div>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="lp-footer">
          <div className="lp-footer-inner">
            <div className="lp-footer-top">
              <div>
                <div className="lp-footer-brand">
                  <span className="lp-footer-hex">⬡</span>
                  <div>
                    <div className="lp-footer-brand-name">Winners Empire</div>
                    <div className="lp-footer-brand-tag">Digital Ecosystem</div>
                  </div>
                </div>
                <p className="lp-footer-tagline">One AI-powered core governing community, learning, commerce, and intelligence — all connected.</p>
              </div>
              <div>
                <div className="lp-footer-col-title">Platforms</div>
                <ul className="lp-footer-links">
                  {["Community", "Academy", "Market", "Intelligence", "Work", "Cloud"].map((p) => (
                    <li key={p}><a href="#platforms">{p}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="lp-footer-col-title">Product</div>
                <ul className="lp-footer-links">
                  {[["Features", "#features"], ["Pricing", "#pricing"], ["FAQ", "#faq"], ["Dashboard", "/login"]].map(([label, href]) => (
                    <li key={label}><a href={href}>{label}</a></li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="lp-footer-col-title">Company</div>
                <ul className="lp-footer-links">
                  {["About", "Roadmap", "Contact", "Security"].map((p) => (
                    <li key={p}><a href="#">{p}</a></li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="lp-footer-bottom">
              <div className="lp-footer-copy">© {new Date().getFullYear()} Winners Empire Inc. All rights reserved.</div>
              <div className="lp-footer-legal">
                <a href="#">Privacy</a>
                <a href="#">Terms</a>
                <a href="#">Cookies</a>
              </div>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .lp {
    background: #080E18; color: #E8EEF5;
    font-family: 'Syne', sans-serif; overflow-x: hidden;
    --gold: #C9A84C; --gold2: #E8C97A; --ice: #89C4E1; --green: #2DD4A0;
    --purple: #9B6FFF; --red: #E05A4E; --blue: #2B5F8E;
    --bg: #080E18; --surface: #0D1520; --s2: #111D2E;
    --border: #1E3248; --text: #E8EEF5; --dim: #5A7A96;
  }

  /* ── REVEAL ── */
  .lp-reveal { opacity: 0; transform: translateY(32px); transition: opacity 0.75s ease, transform 0.75s ease; }
  .lp-visible { opacity: 1 !important; transform: translateY(0) !important; }

  /* ── NAV ── */
  .lp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    height: 70px; display: flex; align-items: center; justify-content: space-between;
    padding: 0 48px; transition: background 0.3s, border-color 0.3s, backdrop-filter 0.3s;
    border-bottom: 1px solid transparent;
  }
  .lp-nav-scrolled { background: rgba(8,14,24,0.94); backdrop-filter: blur(20px); border-bottom-color: #1E3248; }
  .lp-nav-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: inherit; }
  .lp-nav-hex { font-size: 28px; color: var(--gold); animation: hex-pulse 3s ease-in-out infinite; }
  @keyframes hex-pulse { 0%,100% { text-shadow: none; } 50% { text-shadow: 0 0 20px rgba(201,168,76,0.5); } }
  .lp-nav-name { font-size: 14px; font-weight: 800; letter-spacing: -0.3px; }
  .lp-nav-sub  { font-family: 'Space Mono', monospace; font-size: 8px; color: var(--dim); letter-spacing: 1px; text-transform: uppercase; }
  .lp-nav-links { display: flex; gap: 32px; list-style: none; }
  .lp-nav-links a { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--dim); text-decoration: none; transition: color 0.2s; }
  .lp-nav-links a:hover { color: var(--gold); }
  .lp-nav-cta { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; padding: 9px 20px; background: transparent; border: 1px solid rgba(201,168,76,0.4); color: var(--gold); cursor: pointer; border-radius: 4px; transition: all 0.2s; }
  .lp-nav-cta:hover { background: var(--gold); color: #080E18; }

  /* ── HERO ── */
  .lp-hero {
    position: relative; min-height: 100vh;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 130px 48px 100px; text-align: center; overflow: hidden;
  }
  .lp-hero-grid {
    position: absolute; inset: 0;
    background-image: linear-gradient(rgba(30,50,72,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(30,50,72,0.25) 1px, transparent 1px);
    background-size: 60px 60px;
    mask-image: radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 80%);
    pointer-events: none;
  }
  .lp-hero-glow-1 {
    position: absolute; width: 900px; height: 500px;
    background: radial-gradient(ellipse, rgba(201,168,76,0.07) 0%, transparent 70%);
    top: 30%; left: 50%; transform: translate(-50%, -50%);
    pointer-events: none; animation: glow-breathe 5s ease-in-out infinite;
  }
  .lp-hero-glow-2 {
    position: absolute; width: 600px; height: 600px;
    background: radial-gradient(circle, rgba(43,95,142,0.07) 0%, transparent 70%);
    top: 70%; right: -100px; pointer-events: none;
    animation: glow-breathe 7s ease-in-out infinite reverse;
  }
  .lp-hero-glow-3 {
    position: absolute; width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(137,196,225,0.05) 0%, transparent 70%);
    top: 10%; left: -50px; pointer-events: none;
    animation: glow-breathe 6s ease-in-out infinite 1s;
  }
  @keyframes glow-breathe {
    0%,100% { opacity:0.5; }
    50%      { opacity:1; }
  }
  .lp-orb { position: absolute; border-radius: 50%; pointer-events: none; filter: blur(40px); }
  .lp-orb-1 { width:200px; height:200px; background:rgba(201,168,76,0.04); top:20%; left:10%; animation: float 8s ease-in-out infinite; }
  .lp-orb-2 { width:150px; height:150px; background:rgba(137,196,225,0.04); top:60%; right:15%; animation: float 10s ease-in-out infinite 2s; }
  .lp-orb-3 { width:100px; height:100px; background:rgba(155,111,255,0.04); bottom:20%; left:30%; animation: float 7s ease-in-out infinite 4s; }
  @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-20px); } }

  .lp-hero-content { position: relative; z-index: 2; max-width: 820px; }

  .lp-hero-badge {
    display: inline-flex; align-items: center; gap: 8px;
    font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--gold);
    border: 1px solid rgba(201,168,76,0.25); background: rgba(201,168,76,0.05);
    padding: 7px 18px; border-radius: 100px; margin-bottom: 36px;
    animation: fadeUp 0.6s ease both;
  }
  .lp-hero-badge-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); animation: blink 2s infinite; }
  @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0.2; } }

  .lp-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(64px, 10vw, 130px);
    font-weight: 300; line-height: 0.9; letter-spacing: -3px;
    color: var(--text); margin-bottom: 16px;
    animation: fadeUp 0.7s ease 0.1s both;
  }
  .lp-hero-title em { font-style: italic; color: var(--gold); }

  .lp-hero-sub {
    font-size: clamp(13px, 1.8vw, 17px); font-weight: 700;
    letter-spacing: 4px; text-transform: uppercase; color: var(--dim);
    margin-bottom: 28px; animation: fadeUp 0.7s ease 0.2s both;
  }
  .lp-hero-desc {
    font-size: 16px; color: var(--dim); line-height: 1.8;
    max-width: 520px; margin: 0 auto 48px;
    animation: fadeUp 0.7s ease 0.3s both;
  }
  .lp-hero-actions {
    display: flex; align-items: center; gap: 16px; justify-content: center; flex-wrap: wrap;
    margin-bottom: 56px; animation: fadeUp 0.7s ease 0.4s both;
  }

  /* ── BUTTONS ── */
  .lp-btn-primary {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 15px 36px; background: var(--gold); color: #080E18;
    font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 800;
    border: none; cursor: pointer; border-radius: 4px; transition: all 0.2s;
    position: relative; overflow: hidden;
  }
  .lp-btn-primary::before {
    content: ''; position: absolute; inset: 0;
    background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.18) 60%, transparent 70%);
    transform: translateX(-100%); transition: transform 0.4s;
  }
  .lp-btn-primary:hover::before { transform: translateX(100%); }
  .lp-btn-primary:hover { background: var(--gold2); transform: translateY(-2px); box-shadow: 0 8px 30px rgba(201,168,76,0.3); }
  .lp-btn-arrow { font-size: 16px; transition: transform 0.2s; }
  .lp-btn-primary:hover .lp-btn-arrow { transform: translateX(4px); }
  .lp-btn-large { padding: 18px 44px; font-size: 15px; }

  .lp-btn-ghost {
    padding: 15px 32px; background: transparent; color: var(--dim);
    font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600;
    border: 1px solid var(--border); cursor: pointer; border-radius: 4px; transition: all 0.2s;
  }
  .lp-btn-ghost:hover { border-color: var(--gold); color: var(--gold); }

  /* Stats bar */
  .lp-hero-stats {
    display: flex; align-items: center; justify-content: center;
    border: 1px solid var(--border); border-radius: 12px; overflow: hidden;
    background: rgba(13,21,32,0.7); backdrop-filter: blur(12px);
    animation: fadeUp 0.7s ease 0.5s both;
  }
  .lp-stat { flex: 1; padding: 20px 24px; text-align: center; border-right: 1px solid var(--border); transition: background 0.2s; }
  .lp-stat:last-child { border-right: none; }
  .lp-stat:hover { background: rgba(201,168,76,0.04); }
  .lp-stat-val { font-family: 'Cormorant Garamond', serif; font-size: 36px; font-weight: 600; color: var(--gold); line-height: 1; }
  .lp-stat-label { font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--dim); margin-top: 5px; }

  /* Scroll indicator */
  .lp-scroll-indicator {
    position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%);
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: var(--dim);
    animation: fadeUp 1s ease 1s both;
  }
  .lp-scroll-line {
    width: 1px; height: 40px;
    background: linear-gradient(to bottom, transparent, var(--gold));
    animation: scroll-pulse 1.5s ease-in-out infinite;
  }
  @keyframes scroll-pulse { 0%,100% { opacity:0.3; transform:scaleY(0.5); } 50% { opacity:1; transform:scaleY(1); } }

  /* ── TICKER ── */
  .lp-ticker { border-top: 1px solid var(--border); border-bottom: 1px solid var(--border); padding: 16px 0; overflow: hidden; background: rgba(13,21,32,0.4); }
  .lp-ticker-track { display: flex; gap: 40px; width: max-content; animation: ticker-scroll 28s linear infinite; }
  @keyframes ticker-scroll { from { transform:translateX(0); } to { transform:translateX(-50%); } }
  .lp-ticker-item { display: flex; align-items: center; gap: 8px; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--dim); white-space: nowrap; }
  .lp-ticker-dot { width: 4px; height: 4px; border-radius: 50%; background: var(--gold); flex-shrink: 0; }

  /* ── SECTIONS ── */
  .lp-section { padding: 100px 48px; max-width: 1280px; margin: 0 auto; }
  .lp-divider  { height: 1px; background: linear-gradient(90deg, transparent, var(--border) 20%, var(--border) 80%, transparent); }
  .lp-section-header { text-align: center; margin-bottom: 64px; }

  .lp-eyebrow {
    display: inline-flex; align-items: center; gap: 10px;
    font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: var(--gold);
    margin-bottom: 16px;
  }
  .lp-eyebrow::before, .lp-eyebrow::after { content: ''; width: 28px; height: 1px; background: rgba(201,168,76,0.4); }
  .lp-section-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(36px, 5vw, 64px); font-weight: 300; line-height: 1.05; margin-bottom: 16px; }
  .lp-section-title em { font-style: italic; color: var(--gold); }
  .lp-section-desc { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--dim); line-height: 1.9; max-width: 480px; margin: 0 auto; }

  /* ── PLATFORMS ── */
  .lp-platforms-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
  .lp-platform-card {
    background: linear-gradient(135deg, #0D1520, #080E18);
    border: 1px solid var(--border); border-radius: 16px; padding: 28px 24px;
    position: relative; overflow: hidden;
    transition: border-color 0.3s, transform 0.3s, box-shadow 0.3s;
  }
  .lp-platform-card:hover {
    border-color: color-mix(in srgb, var(--card-color) 40%, transparent);
    transform: translateY(-4px);
    box-shadow: 0 20px 60px rgba(0,0,0,0.3), 0 0 40px color-mix(in srgb, var(--card-color) 5%, transparent);
  }
  .lp-pc-top-bar {
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, var(--card-color), transparent);
    opacity: 0.5; transition: opacity 0.3s;
  }
  .lp-platform-card:hover .lp-pc-top-bar { opacity: 1; }
  .lp-pc-phase { font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: var(--dim); margin-bottom: 16px; }
  .lp-pc-icon  { font-size: 32px; margin-bottom: 12px; filter: drop-shadow(0 0 10px color-mix(in srgb, var(--card-color) 40%, transparent)); }
  .lp-pc-name  { font-size: 16px; font-weight: 800; margin-bottom: 4px; }
  .lp-pc-domain { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--card-color); margin-bottom: 12px; opacity: 0.7; }
  .lp-pc-desc  { font-family: 'Space Mono', monospace; font-size: 10px; line-height: 1.8; color: var(--dim); margin-bottom: 16px; }
  .lp-pc-tags  { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 18px; }
  .lp-pc-tag   {
    font-family: 'Space Mono', monospace; font-size: 8px; padding: 3px 8px; border-radius: 4px;
    border: 1px solid color-mix(in srgb, var(--card-color) 25%, transparent);
    color: color-mix(in srgb, var(--card-color) 80%, var(--dim));
    background: color-mix(in srgb, var(--card-color) 5%, transparent);
  }
  .lp-pc-progress-bar  { height: 2px; background: var(--border); border-radius: 1px; overflow: hidden; margin-bottom: 8px; }
  .lp-pc-progress-fill { height: 100%; border-radius: 1px; }
  .lp-pc-status-row    { display: flex; align-items: center; gap: 6px; }
  .lp-pc-dot           { width: 5px; height: 5px; border-radius: 50%; }
  .lp-pc-status-text   { font-family: 'Space Mono', monospace; font-size: 9px; }

  /* ── LOOP ── */
  .lp-loop-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center; }
  .lp-loop-steps { display: flex; flex-direction: column; gap: 8px; }
  .lp-loop-step {
    display: flex; align-items: center; gap: 16px;
    padding: 16px 20px; border-radius: 12px; border: 1px solid var(--border);
    background: var(--surface); cursor: pointer; transition: all 0.25s; position: relative; overflow: hidden;
  }
  .lp-loop-step.active { border-color: color-mix(in srgb, var(--step-color) 50%, transparent); background: color-mix(in srgb, var(--step-color) 5%, #0D1520); }
  .lp-loop-step.active::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px; background: var(--step-color); }
  .lp-loop-icon   { font-size: 24px; flex-shrink: 0; }
  .lp-loop-body   { flex: 1; }
  .lp-loop-platform { font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: var(--dim); margin-bottom: 3px; }
  .lp-loop-step.active .lp-loop-platform { color: var(--step-color); }
  .lp-loop-action { font-size: 13px; font-weight: 700; margin-bottom: 2px; }
  .lp-loop-result { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--dim); }
  .lp-loop-num    { font-family: 'Cormorant Garamond', serif; font-size: 28px; font-weight: 300; color: var(--border); transition: color 0.2s; }
  .lp-loop-step.active .lp-loop-num { color: var(--step-color); }

  .lp-loop-visual { display: flex; flex-direction: column; align-items: center; gap: 28px; }
  .lp-loop-center { position: relative; width: 160px; height: 160px; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  .lp-loop-center-ring { position: absolute; border-radius: 50%; }
  .lp-loop-ring-1 { width:100%; height:100%; border: 1px solid rgba(201,168,76,0.15); animation: ring-spin 8s linear infinite; }
  .lp-loop-ring-2 { width:75%; height:75%; border: 1px solid rgba(137,196,225,0.1); animation: ring-spin 12s linear infinite reverse; }
  .lp-loop-ring-3 { width:50%; height:50%; border: 1px solid rgba(155,111,255,0.15); animation: ring-spin 6s linear infinite; }
  @keyframes ring-spin { from { transform:rotate(0); } to { transform:rotate(360deg); } }
  .lp-loop-center-icon  { font-size: 36px; z-index: 1; }
  .lp-loop-center-label { font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: var(--gold); margin-top: 4px; z-index: 1; }

  .lp-loop-active-card {
    width: 100%; background: color-mix(in srgb, var(--step-color) 5%, #0D1520);
    border: 1px solid color-mix(in srgb, var(--step-color) 30%, transparent);
    border-radius: 16px; padding: 28px; text-align: center; transition: all 0.4s;
    position: relative; overflow: hidden;
  }
  .lp-loop-active-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, var(--step-color), transparent);
  }
  .lp-loop-active-icon     { font-size: 44px; margin-bottom: 10px; }
  .lp-loop-active-platform { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: var(--step-color); margin-bottom: 8px; }
  .lp-loop-active-action   { font-size: 15px; font-weight: 700; margin-bottom: 6px; }
  .lp-loop-active-result   { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--dim); margin-bottom: 18px; }
  .lp-loop-dots  { display: flex; justify-content: center; gap: 6px; }
  .lp-loop-dot   { width: 6px; height: 6px; border-radius: 50%; background: var(--border); transition: background 0.3s; }
  .lp-loop-dot.active { background: var(--step-color); }

  /* ── FEATURES ── */
  .lp-features-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
  .lp-feature-card {
    background: linear-gradient(135deg, #0D1520, #080E18);
    border: 1px solid var(--border); border-radius: 16px; padding: 32px 24px;
    position: relative; overflow: hidden; transition: border-color 0.2s, transform 0.2s;
  }
  .lp-feature-card:hover { border-color: rgba(201,168,76,0.2); transform: translateY(-2px); }
  .lp-feature-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent); opacity: 0; transition: opacity 0.2s;
  }
  .lp-feature-card:hover::before { opacity: 1; }
  .lp-feature-num   { font-family: 'Cormorant Garamond', serif; font-size: 56px; font-weight: 300; color: rgba(201,168,76,0.06); position: absolute; top: 8px; right: 16px; line-height: 1; }
  .lp-feature-icon  { font-size: 28px; margin-bottom: 16px; }
  .lp-feature-title { font-size: 15px; font-weight: 800; margin-bottom: 10px; }
  .lp-feature-desc  { font-family: 'Space Mono', monospace; font-size: 10px; line-height: 1.8; color: var(--dim); }

  /* ── PRICING ── */
  .lp-pricing-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
  .lp-plan-card {
    background: linear-gradient(135deg, #0D1520, #080E18);
    border: 1px solid var(--border); border-radius: 20px; padding: 36px 28px;
    position: relative; overflow: hidden; transition: transform 0.2s;
  }
  .lp-plan-card:hover { transform: translateY(-4px); }
  .lp-plan-card.lp-plan-popular { border-color: rgba(201,168,76,0.3); }
  .lp-plan-top-bar { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, rgba(90,122,150,0.5), transparent); }
  .lp-plan-card.lp-plan-popular .lp-plan-top-bar { background: linear-gradient(90deg, transparent, var(--gold), transparent); }
  .lp-plan-badge { position: absolute; top: 16px; right: 16px; font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 1px; text-transform: uppercase; padding: 4px 10px; border-radius: 6px; background: rgba(201,168,76,0.1); color: var(--gold); border: 1px solid rgba(201,168,76,0.25); }
  .lp-plan-icon    { font-size: 36px; margin-bottom: 16px; }
  .lp-plan-name    { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: var(--dim); margin-bottom: 6px; }
  .lp-plan-tagline { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-style: italic; color: var(--text); margin-bottom: 20px; }
  .lp-plan-price-row { display: flex; align-items: baseline; gap: 2px; margin-bottom: 4px; }
  .lp-plan-dollar  { font-family: 'Cormorant Garamond', serif; font-size: 24px; color: var(--gold); }
  .lp-plan-amount  { font-family: 'Cormorant Garamond', serif; font-size: 56px; font-weight: 600; color: var(--gold); line-height: 1; }
  .lp-plan-per     { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--dim); margin-bottom: 12px; }
  .lp-plan-desc    { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--dim); line-height: 1.7; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid var(--border); }
  .lp-plan-features { list-style: none; margin-bottom: 28px; display: flex; flex-direction: column; gap: 10px; }
  .lp-plan-features li { display: flex; align-items: flex-start; gap: 10px; font-size: 12px; color: var(--dim); }
  .lp-plan-check { color: var(--green); flex-shrink: 0; font-size: 11px; margin-top: 1px; }
  .lp-plan-btn { width: 100%; padding: 13px; border-radius: 6px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 800; cursor: pointer; transition: all 0.2s; border: none; }
  .lp-plan-btn-outline { background: transparent; border: 1px solid var(--border); color: var(--dim); }
  .lp-plan-btn-outline:hover { border-color: var(--gold); color: var(--gold); }
  .lp-plan-btn-gold { background: var(--gold); color: #080E18; }
  .lp-plan-btn-gold:hover { background: var(--gold2); transform: translateY(-1px); }
  .lp-plan-btn-ice  { background: var(--ice); color: #080E18; }
  .lp-plan-btn-ice:hover { opacity: 0.88; }

  /* ── TESTIMONIALS ── */
  .lp-testimonials-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 20px; }
  .lp-testimonial { background: linear-gradient(135deg, #0D1520, #080E18); border: 1px solid var(--border); border-radius: 16px; padding: 32px 24px; transition: border-color 0.2s; }
  .lp-testimonial:hover { border-color: rgba(201,168,76,0.15); }
  .lp-testimonial-stars { color: var(--gold); font-size: 11px; letter-spacing: 3px; margin-bottom: 16px; }
  .lp-testimonial-text  { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-style: italic; font-weight: 300; color: var(--text); line-height: 1.6; margin-bottom: 24px; }
  .lp-testimonial-author { display: flex; align-items: center; gap: 12px; }
  .lp-testimonial-avatar { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 800; flex-shrink: 0; }
  .lp-testimonial-name { font-size: 13px; font-weight: 700; }
  .lp-testimonial-role { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--dim); margin-top: 2px; }

  /* ── FAQ ── */
  .lp-faq-layout { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: start; }
  .lp-faq-item { border-bottom: 1px solid var(--border); }
  .lp-faq-q { width: 100%; padding: 20px 0; display: flex; align-items: center; justify-content: space-between; background: none; border: none; cursor: pointer; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600; color: var(--text); text-align: left; gap: 20px; transition: color 0.2s; }
  .lp-faq-q:hover { color: var(--gold); }
  .lp-faq-icon { font-family: 'Cormorant Garamond', serif; font-size: 24px; color: var(--gold); flex-shrink: 0; transition: transform 0.25s; line-height: 1; }
  .lp-faq-icon.open { transform: rotate(45deg); }
  .lp-faq-a { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--dim); line-height: 1.9; max-height: 0; overflow: hidden; transition: max-height 0.35s ease, padding 0.35s ease; }
  .lp-faq-a.open { max-height: 300px; padding-bottom: 20px; }

  /* ── CTA BAND ── */
  .lp-cta-band {
    position: relative; padding: 120px 48px; text-align: center;
    border-top: 1px solid var(--border); overflow: hidden;
    background: linear-gradient(180deg, #080E18 0%, #0D1520 50%, #080E18 100%);
  }
  .lp-cta-glow {
    position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
    width: 900px; height: 500px;
    background: radial-gradient(ellipse, rgba(201,168,76,0.07) 0%, transparent 70%);
    pointer-events: none; animation: glow-breathe 5s ease-in-out infinite;
  }
  .lp-cta-content { position: relative; z-index: 1; }
  .lp-cta-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(48px, 7vw, 96px); font-weight: 300; line-height: 0.95; margin-bottom: 20px; }
  .lp-cta-title em { font-style: italic; color: var(--gold); }
  .lp-cta-sub { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--dim); letter-spacing: 2px; margin-bottom: 48px; }
  .lp-cta-actions { display: flex; flex-direction: column; align-items: center; gap: 16px; }
  .lp-cta-proof { display: flex; align-items: center; gap: 8px; font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 1px; color: var(--dim); }
  .lp-cta-proof-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--green); animation: blink 2s infinite; }

  /* ── FOOTER ── */
  .lp-footer { border-top: 1px solid var(--border); padding: 60px 0 36px; }
  .lp-footer-inner { max-width: 1280px; margin: 0 auto; padding: 0 48px; }
  .lp-footer-top { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 40px; }
  .lp-footer-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .lp-footer-hex { font-size: 24px; color: var(--gold); }
  .lp-footer-brand-name { font-size: 14px; font-weight: 800; }
  .lp-footer-brand-tag  { font-family: 'Space Mono', monospace; font-size: 8px; color: var(--dim); letter-spacing: 1px; text-transform: uppercase; }
  .lp-footer-tagline    { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--dim); line-height: 1.8; max-width: 280px; }
  .lp-footer-col-title  { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: var(--gold); margin-bottom: 18px; }
  .lp-footer-links { list-style: none; display: flex; flex-direction: column; gap: 10px; }
  .lp-footer-links a { font-size: 12px; color: var(--dim); text-decoration: none; transition: color 0.2s; }
  .lp-footer-links a:hover { color: var(--gold); }
  .lp-footer-bottom { display: flex; align-items: center; justify-content: space-between; padding-top: 20px; border-top: 1px solid var(--border); flex-wrap: wrap; gap: 12px; }
  .lp-footer-copy { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--dim); }
  .lp-footer-legal { display: flex; gap: 24px; }
  .lp-footer-legal a { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--dim); text-decoration: none; }
  .lp-footer-legal a:hover { color: var(--gold); }

  /* ── ANIMATIONS ── */
  @keyframes fadeUp { from { opacity:0; transform:translateY(24px); } to { opacity:1; transform:translateY(0); } }

  /* ── RESPONSIVE ── */
  @media (max-width: 1024px) {
    .lp-platforms-grid { grid-template-columns: repeat(2,1fr); }
    .lp-features-grid  { grid-template-columns: repeat(2,1fr); }
    .lp-loop-wrap { grid-template-columns: 1fr; }
    .lp-loop-visual { display: none; }
  }
  @media (max-width: 900px) {
    .lp-nav { padding: 0 24px; }
    .lp-nav-links { display: none; }
    .lp-section { padding: 70px 24px; }
    .lp-hero { padding: 110px 24px 80px; }
    .lp-pricing-grid { grid-template-columns: 1fr; max-width: 420px; margin: 0 auto; }
    .lp-testimonials-grid { grid-template-columns: 1fr; }
    .lp-faq-layout { grid-template-columns: 1fr; gap: 40px; }
    .lp-footer-top { grid-template-columns: 1fr 1fr; }
    .lp-footer-inner { padding: 0 24px; }
    .lp-cta-band { padding: 80px 24px; }
  }
  @media (max-width: 600px) {
    .lp-platforms-grid { grid-template-columns: 1fr; }
    .lp-features-grid  { grid-template-columns: 1fr; }
    .lp-hero-stats { flex-direction: column; }
    .lp-stat { border-right: none; border-bottom: 1px solid var(--border); }
    .lp-hero-actions { flex-direction: column; align-items: stretch; }
    .lp-btn-primary, .lp-btn-ghost { text-align: center; justify-content: center; }
    .lp-footer-top { grid-template-columns: 1fr; }
  }
`;