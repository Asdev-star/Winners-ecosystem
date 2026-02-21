// src/features/landing/LandingPage.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --black:   #03050A;
    --dark:    #080B10;
    --surface: #0D1117;
    --card:    #111720;
    --border:  #1A2330;
    --gold:    #C9A84C;
    --gold2:   #F5D680;
    --gold3:   #8B6914;
    --text:    #E8EAF0;
    --dim:     #6B7A8D;
    --radius:  4px;
  }

  html { scroll-behavior: smooth; }

  .lp {
    background: var(--black);
    color: var(--text);
    font-family: 'Syne', sans-serif;
    overflow-x: hidden;
    min-height: 100vh;
  }

  /* ── Subtle grain overlay ── */
  .lp::before {
    content: '';
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(255,255,255,0.01) 2px,
      rgba(255,255,255,0.01) 4px
    );
    opacity: 0.6;
  }

  /* ── NAV ── */
  .lp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 48px; height: 72px;
    background: rgba(3,5,10,0.85);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(201,168,76,0.1);
  }

  .lp-nav-logo {
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px; font-weight: 600; letter-spacing: 0.1em;
    color: var(--gold); text-decoration: none;
    display: flex; align-items: center; gap: 10px;
  }

  .lp-nav-logo-icon {
    width: 32px; height: 32px; border: 1px solid var(--gold);
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
  }

  .lp-nav-links {
    display: flex; align-items: center; gap: 36px; list-style: none;
  }

  .lp-nav-links a {
    font-family: 'Space Mono', monospace; font-size: 11px; letter-spacing: 0.08em;
    color: var(--dim); text-decoration: none; text-transform: uppercase;
    transition: color 0.2s;
  }
  .lp-nav-links a:hover { color: var(--gold); }

  .lp-nav-cta {
    padding: 10px 24px;
    border: 1px solid var(--gold);
    background: transparent; color: var(--gold);
    font-family: 'Space Mono', monospace; font-size: 11px;
    letter-spacing: 0.1em; text-transform: uppercase;
    cursor: pointer; transition: all 0.2s; text-decoration: none;
    display: inline-block;
  }
  .lp-nav-cta:hover { background: var(--gold); color: var(--black); }

  /* ── HERO ── */
  .lp-hero {
    position: relative; min-height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 120px 48px 80px; text-align: center; overflow: hidden;
  }

  /* Gold radial glow */
  .lp-hero::after {
    content: '';
    position: absolute; top: 20%; left: 50%; transform: translateX(-50%);
    width: 600px; height: 600px; border-radius: 50%;
    background: radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  .lp-hero-eyebrow {
    font-family: 'Space Mono', monospace; font-size: 11px;
    letter-spacing: 0.3em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 28px;
    display: flex; align-items: center; gap: 16px;
  }
  .lp-hero-eyebrow::before,
  .lp-hero-eyebrow::after {
    content: ''; width: 40px; height: 1px; background: var(--gold3);
  }

  .lp-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(56px, 8vw, 112px);
    font-weight: 300; line-height: 0.95;
    letter-spacing: -0.01em;
    color: var(--text);
    margin-bottom: 12px;
  }

  .lp-hero-title em {
    font-style: italic; color: var(--gold);
  }

  .lp-hero-title-sub {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(40px, 5vw, 72px);
    font-weight: 300; font-style: italic;
    color: var(--dim); line-height: 1.1;
    margin-bottom: 36px;
  }

  .lp-hero-desc {
    font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 400;
    color: var(--dim); line-height: 1.7; max-width: 520px;
    margin: 0 auto 52px;
  }

  .lp-hero-actions {
    display: flex; align-items: center; gap: 20px; justify-content: center;
    flex-wrap: wrap;
  }

  .lp-btn-primary {
    padding: 16px 40px;
    background: var(--gold); color: var(--black);
    font-family: 'Space Mono', monospace; font-size: 12px;
    letter-spacing: 0.12em; text-transform: uppercase;
    border: none; cursor: pointer; transition: all 0.2s;
    font-weight: 700;
  }
  .lp-btn-primary:hover { background: var(--gold2); transform: translateY(-1px); }

  .lp-btn-ghost {
    padding: 15px 40px;
    background: transparent; color: var(--dim);
    font-family: 'Space Mono', monospace; font-size: 12px;
    letter-spacing: 0.12em; text-transform: uppercase;
    border: 1px solid var(--border); cursor: pointer; transition: all 0.2s;
  }
  .lp-btn-ghost:hover { border-color: var(--dim); color: var(--text); }

  .lp-hero-metrics {
    display: flex; gap: 48px; justify-content: center;
    margin-top: 72px; padding-top: 48px;
    border-top: 1px solid var(--border); flex-wrap: wrap;
  }

  .lp-metric {
    text-align: center;
  }
  .lp-metric-value {
    font-family: 'Cormorant Garamond', serif;
    font-size: 42px; font-weight: 600;
    color: var(--gold); line-height: 1;
    margin-bottom: 6px;
  }
  .lp-metric-label {
    font-family: 'Space Mono', monospace; font-size: 10px;
    letter-spacing: 0.15em; text-transform: uppercase;
    color: var(--dim);
  }

  /* ── SECTION BASE ── */
  .lp-section {
    position: relative; z-index: 1;
    padding: 120px 48px;
    max-width: 1200px; margin: 0 auto;
  }

  .lp-section-header {
    margin-bottom: 72px;
  }

  .lp-section-eyebrow {
    font-family: 'Space Mono', monospace; font-size: 10px;
    letter-spacing: 0.3em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 16px;
  }

  .lp-section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(36px, 4vw, 56px); font-weight: 300;
    line-height: 1.1; color: var(--text);
  }

  .lp-section-title em { font-style: italic; color: var(--gold); }

  .lp-section-desc {
    font-family: 'Syne', sans-serif; font-size: 15px;
    color: var(--dim); line-height: 1.7; max-width: 480px;
    margin-top: 16px;
  }

  /* ── DIVIDER ── */
  .lp-divider {
    width: 100%; height: 1px;
    background: linear-gradient(90deg, transparent, var(--border), transparent);
  }

  /* ── FEATURES ── */
  .lp-features-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
  }

  .lp-feature {
    background: var(--card); padding: 40px 32px;
    transition: background 0.2s;
    position: relative; overflow: hidden;
  }

  .lp-feature::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, var(--gold3), transparent);
    opacity: 0; transition: opacity 0.3s;
  }

  .lp-feature:hover { background: #141C27; }
  .lp-feature:hover::before { opacity: 1; }

  .lp-feature-num {
    font-family: 'Cormorant Garamond', serif; font-size: 48px;
    font-weight: 300; color: var(--border);
    margin-bottom: 20px; line-height: 1;
  }

  .lp-feature-icon {
    font-size: 28px; margin-bottom: 16px;
  }

  .lp-feature-title {
    font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700;
    color: var(--text); margin-bottom: 10px;
  }

  .lp-feature-desc {
    font-family: 'Syne', sans-serif; font-size: 13px;
    color: var(--dim); line-height: 1.7;
  }

  /* ── PRICING ── */
  .lp-pricing-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
  }

  .lp-plan {
    border: 1px solid var(--border); padding: 40px 32px;
    position: relative; transition: border-color 0.2s;
    background: var(--card);
  }

  .lp-plan:hover { border-color: var(--gold3); }

  .lp-plan.featured {
    border-color: var(--gold);
    background: linear-gradient(160deg, #141C27 0%, #0D1420 100%);
  }

  .lp-plan-badge {
    position: absolute; top: -1px; left: 50%; transform: translateX(-50%);
    background: var(--gold); color: var(--black);
    font-family: 'Space Mono', monospace; font-size: 9px;
    letter-spacing: 0.15em; text-transform: uppercase;
    padding: 4px 16px; font-weight: 700;
  }

  .lp-plan-name {
    font-family: 'Cormorant Garamond', serif; font-size: 24px;
    font-weight: 400; color: var(--text); margin-bottom: 8px;
  }

  .lp-plan-desc {
    font-family: 'Space Mono', monospace; font-size: 10px;
    color: var(--dim); margin-bottom: 28px; letter-spacing: 0.05em;
  }

  .lp-plan-price {
    margin-bottom: 32px; padding-bottom: 32px;
    border-bottom: 1px solid var(--border);
  }

  .lp-plan-amount {
    font-family: 'Cormorant Garamond', serif; font-size: 56px;
    font-weight: 600; color: var(--gold); line-height: 1;
  }

  .lp-plan-amount sup {
    font-size: 24px; vertical-align: top; margin-top: 10px;
    display: inline-block;
  }

  .lp-plan-period {
    font-family: 'Space Mono', monospace; font-size: 10px;
    color: var(--dim); letter-spacing: 0.1em;
    margin-top: 4px;
  }

  .lp-plan-features {
    list-style: none; margin-bottom: 36px;
  }

  .lp-plan-features li {
    font-family: 'Syne', sans-serif; font-size: 13px;
    color: var(--dim); padding: 8px 0;
    border-bottom: 1px solid rgba(26,35,48,0.5);
    display: flex; align-items: center; gap: 10px;
  }

  .lp-plan-features li::before {
    content: '—'; color: var(--gold3); flex-shrink: 0;
  }

  .lp-plan-features li.highlight { color: var(--text); }
  .lp-plan-features li.highlight::before { content: '✦'; color: var(--gold); }

  .lp-plan-btn {
    width: 100%; padding: 14px;
    font-family: 'Space Mono', monospace; font-size: 11px;
    letter-spacing: 0.1em; text-transform: uppercase;
    cursor: pointer; transition: all 0.2s; border: none;
  }

  .lp-plan-btn.outline {
    background: transparent; border: 1px solid var(--border); color: var(--dim);
  }
  .lp-plan-btn.outline:hover { border-color: var(--gold); color: var(--gold); }

  .lp-plan-btn.gold {
    background: var(--gold); color: var(--black); font-weight: 700;
  }
  .lp-plan-btn.gold:hover { background: var(--gold2); }

  /* ── TESTIMONIALS ── */
  .lp-testimonials-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;
  }

  .lp-testimonial {
    border: 1px solid var(--border); padding: 36px 28px;
    background: var(--card); position: relative;
  }

  .lp-testimonial::before {
    content: '\C201';
    font-family: 'Cormorant Garamond', serif; font-size: 80px;
    color: var(--gold3); line-height: 0.8;
    position: absolute; top: 20px; left: 24px;
    pointer-events: none;
  }

  .lp-testimonial-text {
    font-family: 'Cormorant Garamond', serif; font-size: 18px;
    font-style: italic; font-weight: 300;
    color: var(--text); line-height: 1.6;
    margin-bottom: 24px; padding-top: 32px;
  }

  .lp-testimonial-author {
    display: flex; align-items: center; gap: 12px;
  }

  .lp-testimonial-avatar {
    width: 38px; height: 38px; border-radius: 0;
    border: 1px solid var(--gold3);
    background: var(--dark);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Cormorant Garamond', serif; font-size: 16px;
    color: var(--gold); flex-shrink: 0;
  }

  .lp-testimonial-name {
    font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
    color: var(--text);
  }

  .lp-testimonial-role {
    font-family: 'Space Mono', monospace; font-size: 10px;
    color: var(--dim); margin-top: 2px;
  }

  .lp-testimonial-stars {
    color: var(--gold); font-size: 12px; letter-spacing: 2px;
    margin-bottom: 16px;
  }

  /* ── FAQ ── */
  .lp-faq-list {
    max-width: 720px;
  }

  .lp-faq-item {
    border-bottom: 1px solid var(--border);
  }

  .lp-faq-question {
    width: 100%; padding: 24px 0;
    display: flex; align-items: center; justify-content: space-between;
    background: none; border: none; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 600;
    color: var(--text); text-align: left; gap: 20px;
    transition: color 0.2s;
  }
  .lp-faq-question:hover { color: var(--gold); }

  .lp-faq-icon {
    font-family: 'Cormorant Garamond', serif; font-size: 24px;
    color: var(--gold); flex-shrink: 0; transition: transform 0.2s;
    line-height: 1;
  }
  .lp-faq-icon.open { transform: rotate(45deg); }

  .lp-faq-answer {
    font-family: 'Syne', sans-serif; font-size: 14px;
    color: var(--dim); line-height: 1.8;
    max-height: 0; overflow: hidden;
    transition: max-height 0.3s ease, padding 0.3s ease;
  }
  .lp-faq-answer.open {
    max-height: 300px; padding-bottom: 24px;
  }

  /* ── CTA BAND ── */
  .lp-cta-band {
    position: relative; z-index: 1;
    padding: 100px 48px; text-align: center;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    background: linear-gradient(180deg, var(--black) 0%, #0A0F18 50%, var(--black) 100%);
    overflow: hidden;
  }

  .lp-cta-band::before {
    content: '';
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 800px; height: 400px;
    background: radial-gradient(ellipse, rgba(201,168,76,0.06) 0%, transparent 70%);
    pointer-events: none;
  }

  .lp-cta-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(40px, 5vw, 72px); font-weight: 300;
    color: var(--text); line-height: 1.1; margin-bottom: 20px;
  }
  .lp-cta-title em { font-style: italic; color: var(--gold); }

  .lp-cta-sub {
    font-family: 'Space Mono', monospace; font-size: 12px;
    color: var(--dim); letter-spacing: 0.1em; margin-bottom: 48px;
  }

  /* ── FOOTER ── */
  .lp-footer {
    position: relative; z-index: 1;
    padding: 60px 48px 40px;
    border-top: 1px solid var(--border);
  }

  .lp-footer-top {
    display: grid; grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 48px; margin-bottom: 48px;
  }

  .lp-footer-brand {
    font-family: 'Cormorant Garamond', serif; font-size: 20px;
    font-weight: 600; color: var(--gold); margin-bottom: 12px;
    letter-spacing: 0.1em;
  }

  .lp-footer-tagline {
    font-family: 'Syne', sans-serif; font-size: 13px;
    color: var(--dim); line-height: 1.7; max-width: 280px;
  }

  .lp-footer-col-title {
    font-family: 'Space Mono', monospace; font-size: 10px;
    letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 20px;
  }

  .lp-footer-links {
    list-style: none; display: flex; flex-direction: column; gap: 10px;
  }

  .lp-footer-links a {
    font-family: 'Syne', sans-serif; font-size: 13px;
    color: var(--dim); text-decoration: none; transition: color 0.2s;
  }
  .lp-footer-links a:hover { color: var(--gold); }

  .lp-footer-bottom {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 24px; border-top: 1px solid var(--border);
    flex-wrap: wrap; gap: 12px;
  }

  .lp-footer-copy {
    font-family: 'Space Mono', monospace; font-size: 10px;
    color: var(--dim); letter-spacing: 0.05em;
  }

  .lp-footer-legal {
    display: flex; gap: 24px;
  }
  .lp-footer-legal a {
    font-family: 'Space Mono', monospace; font-size: 10px;
    color: var(--dim); text-decoration: none; transition: color 0.2s;
  }
  .lp-footer-legal a:hover { color: var(--gold); }

  /* ── MOBILE ── */
  @media (max-width: 900px) {
    .lp-nav { padding: 0 24px; }
    .lp-nav-links { display: none; }
    .lp-hero { padding: 100px 24px 60px; }
    .lp-section { padding: 80px 24px; }
    .lp-features-grid { grid-template-columns: 1fr; }
    .lp-pricing-grid { grid-template-columns: 1fr; }
    .lp-testimonials-grid { grid-template-columns: 1fr; }
    .lp-footer-top { grid-template-columns: 1fr 1fr; }
    .lp-cta-band { padding: 72px 24px; }
    .lp-footer { padding: 48px 24px 32px; }
  }

  @media (max-width: 600px) {
    .lp-hero-metrics { gap: 28px; }
    .lp-footer-top { grid-template-columns: 1fr; }
    .lp-hero-actions { flex-direction: column; align-items: stretch; }
    .lp-btn-primary, .lp-btn-ghost { text-align: center; }
  }

  /* ── ANIMATIONS ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .lp-hero-eyebrow  { animation: fadeUp 0.6s ease 0.1s both; }
  .lp-hero-title    { animation: fadeUp 0.6s ease 0.2s both; }
  .lp-hero-title-sub{ animation: fadeUp 0.6s ease 0.3s both; }
  .lp-hero-desc     { animation: fadeUp 0.6s ease 0.4s both; }
  .lp-hero-actions  { animation: fadeUp 0.6s ease 0.5s both; }
  .lp-hero-metrics  { animation: fadeUp 0.6s ease 0.6s both; }
`;

const FEATURES = [
  { icon: "📊", title: "Analytics Engine", desc: "Real-time revenue tracking, anomaly detection, and AI-powered forecasting that surfaces insights before you need to ask." },
  { icon: "🤖", title: "AI Insights", desc: "Powered by Claude. Ask questions about your data in plain English. Get answers, recommendations, and strategic direction." },
  { icon: "👥", title: "Multi-Tenant Teams", desc: "Granular role-based access control. Invite your team, set permissions, and collaborate without compromising your data." },
  { icon: "💳", title: "Stripe Integration", desc: "Connect your Stripe account and watch revenue sync automatically. Track MRR, churn, and growth in one place." },
  { icon: "🔔", title: "Slack Alerts", desc: "Revenue anomalies, milestone hits, and team activity — delivered instantly to your Slack channels." },
  { icon: "📦", title: "Export Everything", desc: "Download your data as CSV, Excel, JSON, or PDF. Your data belongs to you, always." },
];

const FAQS = [
  { q: "How does the AI analytics work?", a: "Winners Ecosystem uses Claude by Anthropic to analyze your revenue data, detect anomalies, forecast trends, and answer questions in plain English. No data science degree required." },
  { q: "Can I connect my existing Stripe account?", a: "Yes. Connect your Stripe account in under 60 seconds. Revenue, subscriptions, and customer data sync automatically and in real-time." },
  { q: "How does multi-tenant access work?", a: "Each workspace is fully isolated. Invite team members with role-based permissions: Owner, Admin, Member, or Viewer. Your data is never shared across workspaces." },
  { q: "Is my data secure?", a: "All data is encrypted at rest and in transit. We use PostgreSQL with row-level security, JWT authentication, and follow industry best practices for SaaS security." },
  { q: "Can I export my data?", a: "Absolutely. Export any dataset as CSV, Excel (XLSX), JSON, or PDF at any time. No lock-in, ever." },
  { q: "Do you offer a free trial?", a: "The Starter plan is free forever with core features. Upgrade to Pro or Enterprise when you're ready for advanced analytics, unlimited team members, and priority support." },
];

const TESTIMONIALS = [
  { text: "We replaced three separate tools with Winners. The AI insights alone paid for the subscription in the first week.", name: "Marcus Chen", role: "Founder, Apex Digital", avatar: "M" },
  { text: "The Slack integration is seamless. Our team gets revenue alerts the moment they happen. It's transformed how we operate.", name: "Sarah Okonkwo", role: "COO, Meridian SaaS", avatar: "S" },
  { text: "Finally a dashboard that doesn't require a data analyst to interpret. The AI explains everything in plain English.", name: "James Whitfield", role: "CEO, Pinnacle Commerce", avatar: "J" },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <style>{css}</style>
      <div className="lp">

        {/* ── NAV ── */}
        <nav className="lp-nav">
          <a href="#" className="lp-nav-logo">
            <div className="lp-nav-logo-icon">✦</div>
            WINNERS
          </a>
          <ul className="lp-nav-links">
            <li><a href="#features">Features</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#testimonials">Reviews</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
          <button className="lp-nav-cta" onClick={() => navigate("/login")}>
            Sign In →
          </button>
        </nav>

        {/* ── HERO ── */}
        <section className="lp-hero">
          <div className="lp-hero-eyebrow">The Intelligence Layer for Serious Operators</div>
          <h1 className="lp-hero-title">
            Revenue <em>Intelligence</em>
          </h1>
          <div className="lp-hero-title-sub">Refined for Growth</div>
          <p className="lp-hero-desc">
            The analytics platform built for founders who demand clarity. AI-powered insights, real-time Stripe sync, and team collaboration — in one elegant workspace.
          </p>
          <div className="lp-hero-actions">
            <button className="lp-btn-primary" onClick={() => navigate("/login")}>
              Start Free Today
            </button>
            <button className="lp-btn-ghost" onClick={() => navigate("/login")}>
              View Demo →
            </button>
          </div>
          <div className="lp-hero-metrics">
            <div className="lp-metric">
              <div className="lp-metric-value">$2.4B+</div>
              <div className="lp-metric-label">Revenue Tracked</div>
            </div>
            <div className="lp-metric">
              <div className="lp-metric-value">12K+</div>
              <div className="lp-metric-label">Workspaces</div>
            </div>
            <div className="lp-metric">
              <div className="lp-metric-value">99.9%</div>
              <div className="lp-metric-label">Uptime SLA</div>
            </div>
            <div className="lp-metric">
              <div className="lp-metric-value">4.9★</div>
              <div className="lp-metric-label">Avg Rating</div>
            </div>
          </div>
        </section>

        <div className="lp-divider" />

        {/* ── FEATURES ── */}
        <section className="lp-section" id="features">
          <div className="lp-section-header">
            <div className="lp-section-eyebrow">Capabilities</div>
            <h2 className="lp-section-title">
              Everything you need<br /><em>nothing you don't</em>
            </h2>
            <p className="lp-section-desc">
              Built for operators who move fast and need their tools to keep up.
            </p>
          </div>
          <div className="lp-features-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="lp-feature">
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
        <section className="lp-section" id="pricing">
          <div className="lp-section-header">
            <div className="lp-section-eyebrow">Pricing</div>
            <h2 className="lp-section-title">
              Transparent pricing,<br /><em>exceptional value</em>
            </h2>
            <p className="lp-section-desc">
              Start free. Scale when you're ready. No hidden fees, no surprises.
            </p>
          </div>
          <div className="lp-pricing-grid">
            {/* Starter */}
            <div className="lp-plan">
              <div className="lp-plan-name">Starter</div>
              <div className="lp-plan-desc">For founders getting started</div>
              <div className="lp-plan-price">
                <div className="lp-plan-amount"><sup>$</sup>0</div>
                <div className="lp-plan-period">Free forever</div>
              </div>
              <ul className="lp-plan-features">
                <li className="highlight">1 workspace</li>
                <li className="highlight">Up to 3 team members</li>
                <li>Basic analytics dashboard</li>
                <li>Stripe integration</li>
                <li>CSV exports</li>
                <li>Email support</li>
              </ul>
              <button className="lp-plan-btn outline" onClick={() => navigate("/login")}>
                Get Started Free
              </button>
            </div>

            {/* Pro */}
            <div className="lp-plan featured">
              <div className="lp-plan-badge">Most Popular</div>
              <div className="lp-plan-name">Pro</div>
              <div className="lp-plan-desc">For growing businesses</div>
              <div className="lp-plan-price">
                <div className="lp-plan-amount"><sup>$</sup>99</div>
                <div className="lp-plan-period">Per month, billed monthly</div>
              </div>
              <ul className="lp-plan-features">
                <li className="highlight">Unlimited workspaces</li>
                <li className="highlight">Unlimited team members</li>
                <li className="highlight">AI-powered insights</li>
                <li className="highlight">Slack notifications</li>
                <li>All export formats</li>
                <li>Activity audit log</li>
                <li>Priority support</li>
              </ul>
              <button className="lp-plan-btn gold" onClick={() => navigate("/login")}>
                Start Pro Trial →
              </button>
            </div>

            {/* Enterprise */}
            <div className="lp-plan">
              <div className="lp-plan-name">Enterprise</div>
              <div className="lp-plan-desc">For scaling organisations</div>
              <div className="lp-plan-price">
                <div className="lp-plan-amount"><sup>$</sup>299</div>
                <div className="lp-plan-period">Per month, billed monthly</div>
              </div>
              <ul className="lp-plan-features">
                <li className="highlight">Everything in Pro</li>
                <li className="highlight">Custom integrations</li>
                <li className="highlight">Dedicated account manager</li>
                <li className="highlight">SLA guarantee</li>
                <li>White-label option</li>
                <li>Custom reporting</li>
                <li>SSO / SAML</li>
              </ul>
              <button className="lp-plan-btn outline" onClick={() => navigate("/login")}>
                Contact Sales
              </button>
            </div>
          </div>
        </section>

        <div className="lp-divider" />

        {/* ── TESTIMONIALS ── */}
        <section className="lp-section" id="testimonials">
          <div className="lp-section-header">
            <div className="lp-section-eyebrow">Social Proof</div>
            <h2 className="lp-section-title">
              Trusted by operators<br /><em>who demand more</em>
            </h2>
          </div>
          <div className="lp-testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="lp-testimonial">
                <div className="lp-testimonial-stars">★★★★★</div>
                <div className="lp-testimonial-text">{t.text}</div>
                <div className="lp-testimonial-author">
                  <div className="lp-testimonial-avatar">{t.avatar}</div>
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
        <section className="lp-section" id="faq">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "start" }}>
            <div>
              <div className="lp-section-eyebrow">FAQ</div>
              <h2 className="lp-section-title">
                Common<br /><em>questions</em>
              </h2>
              <p className="lp-section-desc">
                Everything you need to know before getting started.
              </p>
              <div style={{ marginTop: 40 }}>
                <button className="lp-btn-primary" onClick={() => navigate("/login")}>
                  Start Free Today
                </button>
              </div>
            </div>
            <div className="lp-faq-list">
              {FAQS.map((faq, i) => (
                <div key={i} className="lp-faq-item">
                  <button
                    className="lp-faq-question"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    {faq.q}
                    <span className={`lp-faq-icon${openFaq === i ? " open" : ""}`}>+</span>
                  </button>
                  <div className={`lp-faq-answer${openFaq === i ? " open" : ""}`}>
                    {faq.a}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA BAND ── */}
        <div className="lp-cta-band">
          <h2 className="lp-cta-title">
            Ready to take<br /><em>command</em> of your revenue?
          </h2>
          <p className="lp-cta-sub">Join 12,000+ operators. Free to start. No credit card required.</p>
          <div style={{ display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="lp-btn-primary" onClick={() => navigate("/login")}>
              Create Free Account →
            </button>
            <button className="lp-btn-ghost" onClick={() => navigate("/login")}>
              Book a Demo
            </button>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="lp-footer">
          <div className="lp-footer-top">
            <div>
              <div className="lp-footer-brand">✦ WINNERS ECOSYSTEM</div>
              <div className="lp-footer-tagline">
                The intelligence layer for serious operators. Revenue analytics, AI insights, and team collaboration — refined.
              </div>
            </div>
            <div>
              <div className="lp-footer-col-title">Product</div>
              <ul className="lp-footer-links">
                <li><a href="#features">Features</a></li>
                <li><a href="#pricing">Pricing</a></li>
                <li><a href="#faq">FAQ</a></li>
                <li><a href="#" onClick={() => navigate("/login")}>Dashboard</a></li>
              </ul>
            </div>
            <div>
              <div className="lp-footer-col-title">Company</div>
              <ul className="lp-footer-links">
                <li><a href="#">About</a></li>
                <li><a href="#">Blog</a></li>
                <li><a href="#">Careers</a></li>
                <li><a href="#">Contact</a></li>
              </ul>
            </div>
            <div>
              <div className="lp-footer-col-title">Support</div>
              <ul className="lp-footer-links">
                <li><a href="#">Documentation</a></li>
                <li><a href="#">API Reference</a></li>
                <li><a href="#">Status</a></li>
                <li><a href="#">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <div className="lp-footer-copy">
              © {new Date().getFullYear()} Winners Ecosystem. All rights reserved.
            </div>
            <div className="lp-footer-legal">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Policy</a>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}