// src/features/landing/LandingPage.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400&family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --black:   #0D1520;
    --dark:    #111D2E;
    --surface: #172335;
    --card:    #111D2E;
    --border:  #1E3248;
    --gold:    #C9A84C;
    --gold2:   #E8C97A;
    --gold3:   #8B6914;
    --ice:     #89C4E1;
    --blue:    #2B5F8E;
    --text:    #E8EEF5;
    --dim:     #5A7A96;
    --green:   #2DD4A0;
  }

  html { scroll-behavior: smooth; }

  .lp {
    background: var(--black);
    color: var(--text);
    font-family: 'Syne', sans-serif;
    overflow-x: hidden;
    min-height: 100vh;
  }

  .lp::before {
    content: '';
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image: repeating-linear-gradient(
      0deg, transparent, transparent 2px,
      rgba(43,95,142,0.02) 2px, rgba(43,95,142,0.02) 4px
    );
  }

  /* ── NAV ── */
  .lp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 48px; height: 68px;
    background: rgba(13,21,32,0.92);
    backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(201,168,76,0.12);
  }
  .lp-nav-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }
  .lp-nav-logo-img { width: 36px; height: 36px; border-radius: 8px; object-fit: cover; border: 1.5px solid var(--gold); }
  .lp-nav-brand-text {}
  .lp-nav-brand-name { font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 800; color: var(--text); letter-spacing: -0.3px; }
  .lp-nav-brand-tag  { font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: var(--gold); }
  .lp-nav-links { display: flex; align-items: center; gap: 32px; list-style: none; }
  .lp-nav-links a {
    font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.08em;
    color: var(--dim); text-decoration: none; text-transform: uppercase; transition: color 0.2s;
  }
  .lp-nav-links a:hover { color: var(--gold); }
  .lp-nav-cta {
    padding: 9px 22px; border: 1px solid var(--gold);
    background: transparent; color: var(--gold);
    font-family: 'Space Mono', monospace; font-size: 10px;
    letter-spacing: 0.1em; text-transform: uppercase;
    cursor: pointer; transition: all 0.2s; border-radius: 2px;
  }
  .lp-nav-cta:hover { background: var(--gold); color: var(--black); }

  /* ── HERO ── */
  .lp-hero {
    position: relative; min-height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 120px 48px 80px; text-align: center; overflow: hidden;
  }
  .lp-hero::before {
    content: '';
    position: absolute; top: 10%; left: 50%; transform: translateX(-50%);
    width: 900px; height: 500px; border-radius: 50%;
    background: radial-gradient(ellipse, rgba(43,95,142,0.12) 0%, rgba(201,168,76,0.04) 50%, transparent 70%);
    pointer-events: none;
  }

  .lp-hero-logo {
    width: 100px; height: 100px; border-radius: 20px; object-fit: cover;
    border: 3px solid var(--gold); box-shadow: 0 0 40px rgba(201,168,76,0.25), 0 0 80px rgba(43,95,142,0.15);
    margin-bottom: 32px; animation: fadeUp 0.5s ease both;
  }

  .lp-hero-eyebrow {
    font-family: 'Space Mono', monospace; font-size: 10px;
    letter-spacing: 0.3em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 24px;
    display: flex; align-items: center; gap: 14px;
    animation: fadeUp 0.5s ease 0.1s both;
  }
  .lp-hero-eyebrow::before, .lp-hero-eyebrow::after {
    content: ''; width: 40px; height: 1px; background: var(--gold3);
  }

  .lp-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(52px, 8vw, 108px);
    font-weight: 300; line-height: 0.95; letter-spacing: -0.01em;
    color: var(--text); margin-bottom: 12px;
    animation: fadeUp 0.6s ease 0.2s both;
  }
  .lp-hero-title em { font-style: italic; color: var(--gold); }

  .lp-hero-title-sub {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(28px, 4vw, 52px);
    font-weight: 300; font-style: italic;
    color: var(--ice); line-height: 1.2; margin-bottom: 28px;
    animation: fadeUp 0.6s ease 0.3s both;
  }

  .lp-hero-desc {
    font-size: 15px; color: var(--dim); line-height: 1.75; max-width: 560px;
    margin: 0 auto 44px; animation: fadeUp 0.6s ease 0.4s both;
  }

  .lp-hero-actions {
    display: flex; align-items: center; gap: 16px; justify-content: center;
    flex-wrap: wrap; animation: fadeUp 0.6s ease 0.5s both;
  }

  .lp-btn-primary {
    padding: 14px 36px; background: var(--gold); color: var(--black);
    font-family: 'Space Mono', monospace; font-size: 11px;
    letter-spacing: 0.12em; text-transform: uppercase;
    border: none; cursor: pointer; transition: all 0.2s; font-weight: 700; border-radius: 2px;
  }
  .lp-btn-primary:hover { background: var(--gold2); transform: translateY(-1px); }

  .lp-btn-ghost {
    padding: 13px 36px; background: transparent; color: var(--dim);
    font-family: 'Space Mono', monospace; font-size: 11px;
    letter-spacing: 0.12em; text-transform: uppercase;
    border: 1px solid var(--border); cursor: pointer; transition: all 0.2s; border-radius: 2px;
  }
  .lp-btn-ghost:hover { border-color: var(--ice); color: var(--ice); }

  .lp-hero-metrics {
    display: flex; gap: 48px; justify-content: center;
    margin-top: 64px; padding-top: 40px;
    border-top: 1px solid var(--border); flex-wrap: wrap;
    animation: fadeUp 0.6s ease 0.6s both;
  }
  .lp-metric { text-align: center; }
  .lp-metric-value {
    font-family: 'Cormorant Garamond', serif; font-size: 40px;
    font-weight: 600; color: var(--gold); line-height: 1; margin-bottom: 6px;
  }
  .lp-metric-label {
    font-family: 'Space Mono', monospace; font-size: 9px;
    letter-spacing: 0.15em; text-transform: uppercase; color: var(--dim);
  }

  /* ── ECOSYSTEM VISION BAND ── */
  .lp-vision {
    position: relative; z-index: 1;
    background: linear-gradient(135deg, rgba(43,95,142,0.1), rgba(201,168,76,0.05));
    border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
    padding: 64px 48px; text-align: center;
  }
  .lp-vision-label {
    font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 3px;
    text-transform: uppercase; color: var(--ice); margin-bottom: 16px;
  }
  .lp-vision-title {
    font-family: 'Cormorant Garamond', serif; font-size: clamp(28px, 4vw, 48px);
    font-weight: 300; color: var(--text); margin-bottom: 12px;
  }
  .lp-vision-title em { font-style: italic; color: var(--gold); }
  .lp-vision-desc {
    font-size: 14px; color: var(--dim); line-height: 1.7; max-width: 620px; margin: 0 auto 40px;
  }
  .lp-vision-pillars {
    display: flex; justify-content: center; gap: 8px; flex-wrap: wrap;
  }
  .lp-vision-pill {
    display: flex; align-items: center; gap: 8px;
    background: rgba(43,95,142,0.12); border: 1px solid rgba(43,95,142,0.25);
    border-radius: 24px; padding: 8px 18px;
    font-family: 'Space Mono', monospace; font-size: 10px; color: var(--ice);
    letter-spacing: 0.5px;
  }
  .lp-vision-pill.gold { background: rgba(201,168,76,0.08); border-color: rgba(201,168,76,0.2); color: var(--gold); }

  /* ── PLATFORMS SECTION ── */
  .lp-section {
    position: relative; z-index: 1;
    padding: 100px 48px; max-width: 1200px; margin: 0 auto;
  }
  .lp-section-header { margin-bottom: 56px; }
  .lp-section-eyebrow {
    font-family: 'Space Mono', monospace; font-size: 9px;
    letter-spacing: 0.3em; text-transform: uppercase; color: var(--gold); margin-bottom: 14px;
  }
  .lp-section-title {
    font-family: 'Cormorant Garamond', serif; font-size: clamp(32px, 4vw, 52px);
    font-weight: 300; line-height: 1.1; color: var(--text);
  }
  .lp-section-title em { font-style: italic; color: var(--gold); }
  .lp-section-desc {
    font-size: 14px; color: var(--dim); line-height: 1.7; max-width: 480px; margin-top: 14px;
  }

  /* Platform cards */
  .lp-platforms-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .lp-platform-card {
    background: var(--card); border: 1px solid var(--border); border-radius: 6px;
    padding: 28px 24px; transition: all 0.2s; position: relative; overflow: hidden;
  }
  .lp-platform-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    opacity: 0; transition: opacity 0.3s;
  }
  .lp-platform-card.live::before   { background: linear-gradient(90deg, var(--gold), var(--ice)); opacity: 1; }
  .lp-platform-card.soon::before   { background: linear-gradient(90deg, var(--blue), var(--ice)); }
  .lp-platform-card.planned::before{ background: linear-gradient(90deg, var(--blue), var(--dim)); }
  .lp-platform-card:hover { border-color: rgba(201,168,76,0.25); transform: translateY(-2px); }
  .lp-platform-card:hover::before  { opacity: 1; }
  .lp-platform-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 16px; }
  .lp-platform-icon { font-size: 28px; }
  .lp-platform-badge { font-family: 'Space Mono', monospace; font-size: 7px; padding: 3px 8px; border-radius: 2px; }
  .lp-platform-badge.live    { background: rgba(45,212,160,0.1); color: var(--green); border: 1px solid rgba(45,212,160,0.2); }
  .lp-platform-badge.soon    { background: rgba(137,196,225,0.08); color: var(--ice); border: 1px solid rgba(137,196,225,0.2); }
  .lp-platform-badge.planned { background: rgba(43,95,142,0.1); color: var(--dim); border: 1px solid rgba(43,95,142,0.2); }
  .lp-platform-name { font-size: 15px; font-weight: 700; margin-bottom: 6px; }
  .lp-platform-desc-text { font-size: 12px; color: var(--dim); line-height: 1.6; margin-bottom: 16px; }
  .lp-platform-tags { display: flex; gap: 6px; flex-wrap: wrap; }
  .lp-platform-tag {
    font-family: 'Space Mono', monospace; font-size: 8px; padding: 2px 8px;
    border-radius: 2px; background: rgba(43,95,142,0.1); color: var(--dim);
    border: 1px solid rgba(43,95,142,0.15);
  }

  /* ── ARCHITECTURE DIAGRAM ── */
  .lp-arch {
    position: relative; z-index: 1;
    background: linear-gradient(180deg, transparent, rgba(43,95,142,0.05), transparent);
    border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
    padding: 80px 48px; text-align: center;
  }
  .lp-arch-diagram {
    max-width: 700px; margin: 40px auto 0;
    background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 32px;
    font-family: 'Space Mono', monospace; font-size: 11px; color: var(--dim);
    line-height: 2; text-align: left;
  }
  .lp-arch-core  { color: var(--gold); font-weight: 700; }
  .lp-arch-layer { color: var(--ice); }
  .lp-arch-ai    { color: var(--green); }

  /* ── FEATURES GRID ── */
  .lp-features-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px;
    background: var(--border); border: 1px solid var(--border);
  }
  .lp-feature {
    background: var(--card); padding: 36px 28px;
    transition: background 0.2s; position: relative; overflow: hidden;
  }
  .lp-feature::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, var(--gold3), transparent);
    opacity: 0; transition: opacity 0.3s;
  }
  .lp-feature:hover { background: rgba(43,95,142,0.08); }
  .lp-feature:hover::before { opacity: 1; }
  .lp-feature-num {
    font-family: 'Cormorant Garamond', serif; font-size: 42px;
    font-weight: 300; color: var(--border); margin-bottom: 16px; line-height: 1;
  }
  .lp-feature-icon { font-size: 24px; margin-bottom: 14px; }
  .lp-feature-title { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
  .lp-feature-desc { font-size: 12px; color: var(--dim); line-height: 1.7; }

  /* ── PRICING ── */
  .lp-pricing-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .lp-plan {
    border: 1px solid var(--border); padding: 36px 28px;
    position: relative; transition: border-color 0.2s; background: var(--card); border-radius: 6px;
  }
  .lp-plan:hover { border-color: var(--gold3); }
  .lp-plan.featured { border-color: var(--gold); background: linear-gradient(160deg, #172335 0%, #111D2E 100%); }
  .lp-plan-badge {
    position: absolute; top: -1px; left: 50%; transform: translateX(-50%);
    background: var(--gold); color: var(--black);
    font-family: 'Space Mono', monospace; font-size: 8px;
    letter-spacing: 0.15em; text-transform: uppercase; padding: 4px 16px; font-weight: 700;
  }
  .lp-plan-name { font-family: 'Cormorant Garamond', serif; font-size: 24px; font-weight: 400; color: var(--text); margin-bottom: 6px; }
  .lp-plan-desc { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--dim); margin-bottom: 24px; letter-spacing: 0.05em; }
  .lp-plan-price { margin-bottom: 28px; padding-bottom: 28px; border-bottom: 1px solid var(--border); }
  .lp-plan-amount { font-family: 'Cormorant Garamond', serif; font-size: 52px; font-weight: 600; color: var(--gold); line-height: 1; }
  .lp-plan-amount sup { font-size: 22px; vertical-align: top; margin-top: 10px; display: inline-block; }
  .lp-plan-period { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--dim); letter-spacing: 0.1em; margin-top: 4px; }
  .lp-plan-features { list-style: none; margin-bottom: 32px; }
  .lp-plan-features li {
    font-size: 12px; color: var(--dim); padding: 7px 0;
    border-bottom: 1px solid rgba(30,50,72,0.5); display: flex; align-items: center; gap: 8px;
  }
  .lp-plan-features li::before { content: '—'; color: var(--gold3); flex-shrink: 0; }
  .lp-plan-features li.highlight { color: var(--text); }
  .lp-plan-features li.highlight::before { content: '✦'; color: var(--gold); }
  .lp-plan-btn {
    width: 100%; padding: 12px; font-family: 'Space Mono', monospace; font-size: 10px;
    letter-spacing: 0.1em; text-transform: uppercase; cursor: pointer; transition: all 0.2s; border: none; border-radius: 2px;
  }
  .lp-plan-btn.outline { background: transparent; border: 1px solid var(--border); color: var(--dim); }
  .lp-plan-btn.outline:hover { border-color: var(--gold); color: var(--gold); }
  .lp-plan-btn.gold { background: var(--gold); color: var(--black); font-weight: 700; }
  .lp-plan-btn.gold:hover { background: var(--gold2); }

  /* ── TESTIMONIALS ── */
  .lp-testimonials-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
  .lp-testimonial {
    border: 1px solid var(--border); padding: 32px 24px;
    background: var(--card); border-radius: 6px;
  }
  .lp-testimonial-stars { color: var(--gold); font-size: 11px; letter-spacing: 2px; margin-bottom: 14px; }
  .lp-testimonial-text {
    font-family: 'Cormorant Garamond', serif; font-size: 17px;
    font-style: italic; font-weight: 300; color: var(--text); line-height: 1.6; margin-bottom: 20px;
  }
  .lp-testimonial-author { display: flex; align-items: center; gap: 10px; }
  .lp-testimonial-avatar {
    width: 36px; height: 36px; border-radius: 50%; border: 1px solid var(--gold3);
    background: var(--surface); display: flex; align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 800; color: var(--gold); flex-shrink: 0;
  }
  .lp-testimonial-name { font-size: 12px; font-weight: 700; color: var(--text); }
  .lp-testimonial-role { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--dim); margin-top: 2px; }

  /* ── FAQ ── */
  .lp-faq-item { border-bottom: 1px solid var(--border); }
  .lp-faq-question {
    width: 100%; padding: 20px 0; display: flex; align-items: center; justify-content: space-between;
    background: none; border: none; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600;
    color: var(--text); text-align: left; gap: 20px; transition: color 0.2s;
  }
  .lp-faq-question:hover { color: var(--gold); }
  .lp-faq-icon { font-family: 'Cormorant Garamond', serif; font-size: 22px; color: var(--gold); flex-shrink: 0; transition: transform 0.2s; line-height: 1; }
  .lp-faq-icon.open { transform: rotate(45deg); }
  .lp-faq-answer {
    font-size: 13px; color: var(--dim); line-height: 1.8;
    max-height: 0; overflow: hidden; transition: max-height 0.3s ease, padding 0.3s ease;
  }
  .lp-faq-answer.open { max-height: 300px; padding-bottom: 20px; }

  /* ── CTA BAND ── */
  .lp-cta-band {
    position: relative; z-index: 1; padding: 100px 48px; text-align: center;
    border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
    background: linear-gradient(180deg, var(--black) 0%, rgba(43,95,142,0.06) 50%, var(--black) 100%);
    overflow: hidden;
  }
  .lp-cta-band::before {
    content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 800px; height: 400px;
    background: radial-gradient(ellipse, rgba(201,168,76,0.06) 0%, transparent 70%);
    pointer-events: none;
  }
  .lp-cta-title {
    font-family: 'Cormorant Garamond', serif; font-size: clamp(36px, 5vw, 68px);
    font-weight: 300; color: var(--text); line-height: 1.1; margin-bottom: 16px;
  }
  .lp-cta-title em { font-style: italic; color: var(--gold); }
  .lp-cta-sub { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--dim); letter-spacing: 0.1em; margin-bottom: 44px; }

  /* ── FOOTER ── */
  .lp-footer { position: relative; z-index: 1; padding: 56px 48px 36px; border-top: 1px solid var(--border); }
  .lp-footer-top { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 48px; margin-bottom: 40px; }
  .lp-footer-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .lp-footer-logo { width: 32px; height: 32px; border-radius: 6px; object-fit: cover; border: 1px solid var(--gold3); }
  .lp-footer-brand-name { font-size: 14px; font-weight: 800; color: var(--gold); }
  .lp-footer-tagline { font-size: 12px; color: var(--dim); line-height: 1.7; max-width: 280px; }
  .lp-footer-col-title { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 18px; }
  .lp-footer-links { list-style: none; display: flex; flex-direction: column; gap: 10px; }
  .lp-footer-links a { font-size: 12px; color: var(--dim); text-decoration: none; transition: color 0.2s; }
  .lp-footer-links a:hover { color: var(--gold); }
  .lp-footer-bottom {
    display: flex; align-items: center; justify-content: space-between;
    padding-top: 20px; border-top: 1px solid var(--border); flex-wrap: wrap; gap: 12px;
  }
  .lp-footer-copy { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--dim); letter-spacing: 0.05em; }
  .lp-footer-legal { display: flex; gap: 24px; }
  .lp-footer-legal a { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--dim); text-decoration: none; transition: color 0.2s; }
  .lp-footer-legal a:hover { color: var(--gold); }

  /* ── DIVIDER ── */
  .lp-divider { width: 100%; height: 1px; background: linear-gradient(90deg, transparent, var(--border), transparent); }

  /* ── ANIMATIONS ── */
  @keyframes fadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }

  /* ── RESPONSIVE ── */
  @media (max-width: 900px) {
    .lp-nav { padding: 0 20px; }
    .lp-nav-links { display: none; }
    .lp-hero { padding: 100px 24px 60px; }
    .lp-section { padding: 70px 24px; }
    .lp-platforms-grid { grid-template-columns: 1fr 1fr; }
    .lp-features-grid { grid-template-columns: 1fr; }
    .lp-pricing-grid { grid-template-columns: 1fr; }
    .lp-testimonials-grid { grid-template-columns: 1fr; }
    .lp-footer-top { grid-template-columns: 1fr 1fr; }
    .lp-cta-band { padding: 70px 24px; }
    .lp-footer { padding: 44px 24px 28px; }
    .lp-arch { padding: 60px 24px; }
    .lp-vision { padding: 50px 24px; }
  }
  @media (max-width: 600px) {
    .lp-hero-metrics { gap: 24px; }
    .lp-footer-top { grid-template-columns: 1fr; }
    .lp-hero-actions { flex-direction: column; align-items: stretch; }
    .lp-btn-primary, .lp-btn-ghost { text-align: center; }
    .lp-platforms-grid { grid-template-columns: 1fr; }
  }
`;

const PLATFORMS = [
  {
    icon: "⬡", name: "Core Engine", phase: "Phase 1", status: "live",
    desc: "The control tower. Multi-tenant auth, billing, analytics, and API gateway powering the entire ecosystem.",
    tags: ["Auth & SSO", "Billing", "Analytics", "API"],
  },
  {
    icon: "🧑‍🤝‍🧑", name: "Winners Community", phase: "Phase 2", status: "live",
    desc: "A full social platform. Posts, comments, likes, follow system, groups, and creator monetization.",
    tags: ["Social Feed", "Groups", "Messaging", "Creators"],
  },
  {
    icon: "🎓", name: "Winners Academy", phase: "Phase 3", status: "soon",
    desc: "A complete learning platform. Courses, certifications, AI tutors, and skill-based hiring integration.",
    tags: ["Courses", "Certificates", "AI Tutor", "Progress"],
  },
  {
    icon: "🛒", name: "Winners Market", phase: "Phase 4", status: "soon",
    desc: "Marketplace + commerce engine. Digital products, dropshipping, vendor dashboards, and AI recommendations.",
    tags: ["Products", "Vendors", "Dropship", "Commerce"],
  },
  {
    icon: "🤖", name: "Winners Intelligence", phase: "Phase 5", status: "planned",
    desc: "The agentic AI core. Personal AI agents, smart recommendations, voice search, and ecosystem automation.",
    tags: ["AI Agents", "Search", "Automation", "Predictions"],
  },
  {
    icon: "💼", name: "Winners Work", phase: "Phase 6", status: "planned",
    desc: "Freelance hub meets work network. Job board, AI skill matching, contracts, escrow, and portfolios.",
    tags: ["Jobs", "Freelance", "Escrow", "Matching"],
  },
];

const FEATURES = [
  { icon: "🧠", title: "AI Intelligence Core", desc: "Claude-powered analytics that surfaces insights, detects anomalies, and generates strategic recommendations across every layer of the ecosystem." },
  { icon: "🏗", title: "Multi-Tenant Architecture", desc: "Full workspace isolation with role-based access. Every platform layer shares one identity system — one login, infinite possibilities." },
  { icon: "💳", title: "Unified Billing Engine", desc: "One billing system governs all platforms. Subscriptions, marketplace commissions, course revenue, and AI credits — managed centrally." },
  { icon: "🔗", title: "API-First Design", desc: "Every layer exposes clean APIs. Future developers and partners can build on Winners Ecosystem. You become infrastructure." },
  { icon: "🔐", title: "Enterprise Security", desc: "2FA, audit logs, encrypted storage, rate limiting, and GDPR compliance built into the core. Security is not a feature — it's the foundation." },
  { icon: "📊", title: "Data Dominance", desc: "Every interaction tracked. Revenue, engagement, retention, and cohort analytics available across all platforms in one unified dashboard." },
];

const FAQS = [
  { q: "What is Winners Ecosystem exactly?", a: "Winners Ecosystem is a Digital Sovereign Infrastructure — a central operating system that hosts, governs, and intelligently coordinates multiple digital platforms. Think of it as one account that gives you access to a social network, learning platform, marketplace, and AI system — all connected." },
  { q: "How does the AI orchestration work?", a: "The AI core monitors behavior across all platforms. It recommends courses based on community posts, suggests products based on learning progress, and connects creators with opportunities — automatically and intelligently." },
  { q: "When will the Community, Academy, and Market launch?", a: "Winners Community (Phase 2) is live now. Winners Academy (Phase 3) and Winners Market (Phase 4) are in active development. Each layer deploys when stable, not before." },
  { q: "Can I use just one platform or do I need all of them?", a: "Each platform is standalone and powerful on its own. You choose what you need. All platforms share your identity and data — but none require the others to work." },
  { q: "Will Winners Ecosystem have a mobile app?", a: "Yes. A React Native super app is planned for Phase 7 — covering community, learning, commerce, and AI assistant in one mobile experience." },
  { q: "How does multi-tenant access work?", a: "Each workspace is fully isolated with role-based permissions (Owner, Admin, Member, Viewer). Teams collaborate without data leakage across workspaces." },
];

const TESTIMONIALS = [
  { text: "We stopped using five separate tools the week we joined. The ecosystem thinking is exactly what growing teams need.", name: "Marcus Chen", role: "Founder, Apex Digital", avatar: "M" },
  { text: "The AI layer is what sold me. It doesn't just show data — it tells you what to do next. That's a different product.", name: "Sarah Okonkwo", role: "COO, Meridian SaaS", avatar: "S" },
  { text: "I joined for the analytics. I stayed for the community and the roadmap. This team is building something real.", name: "James Whitfield", role: "CEO, Pinnacle Commerce", avatar: "J" },
];

export default function LandingPage() {
  const navigate  = useNavigate();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <style>{css}</style>
      <div className="lp">

        {/* ── NAV ── */}
        <nav className="lp-nav">
          <a href="#" className="lp-nav-brand">
            <img src="/logo.jpg" alt="Winners Empire" className="lp-nav-logo-img"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
            <div className="lp-nav-brand-text">
              <div className="lp-nav-brand-name">Winners Empire</div>
              <div className="lp-nav-brand-tag">Digital Ecosystem</div>
            </div>
          </a>
          <ul className="lp-nav-links">
            <li><a href="#platforms">Platforms</a></li>
            <li><a href="#features">Features</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
          <button className="lp-nav-cta" onClick={() => navigate("/login")}>
            Enter Ecosystem →
          </button>
        </nav>

        {/* ── HERO ── */}
        <section className="lp-hero">
          <img src="/logo.jpg" alt="Winners Empire" className="lp-hero-logo"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
          <div className="lp-hero-eyebrow">Digital Sovereign Infrastructure · Est. 2025</div>
          <h1 className="lp-hero-title">
            One <em>Ecosystem</em>
          </h1>
          <div className="lp-hero-title-sub">Infinite Possibilities</div>
          <p className="lp-hero-desc">
            A central AI-powered operating system that hosts, governs, and intelligently orchestrates
            multiple digital platforms — community, learning, commerce, and AI — all under one identity.
          </p>
          <div className="lp-hero-actions">
            <button className="lp-btn-primary" onClick={() => navigate("/login")}>
              Join the Ecosystem
            </button>
            <button className="lp-btn-ghost" onClick={() => { document.getElementById("platforms")?.scrollIntoView({ behavior: "smooth" }); }}>
              Explore Platforms →
            </button>
          </div>
          <div className="lp-hero-metrics">
            <div className="lp-metric">
              <div className="lp-metric-value">6</div>
              <div className="lp-metric-label">Platform Layers</div>
            </div>
            <div className="lp-metric">
              <div className="lp-metric-value">1</div>
              <div className="lp-metric-label">Unified Identity</div>
            </div>
            <div className="lp-metric">
              <div className="lp-metric-value">∞</div>
              <div className="lp-metric-label">Possibilities</div>
            </div>
            <div className="lp-metric">
              <div className="lp-metric-value">AI</div>
              <div className="lp-metric-label">Powered Core</div>
            </div>
          </div>
        </section>

        {/* ── VISION BAND ── */}
        <div className="lp-vision">
          <div className="lp-vision-label">The Vision</div>
          <h2 className="lp-vision-title">
            Not a product. <em>A platform of platforms.</em>
          </h2>
          <p className="lp-vision-desc">
            Winners Ecosystem is the center. Every platform layer connects to one intelligence core —
            sharing identity, data, billing, and AI. As each layer matures, it becomes its own standalone
            app — still powered by the same brain.
          </p>
          <div className="lp-vision-pillars">
            <div className="lp-vision-pill gold">🧠 Learn</div>
            <div className="lp-vision-pill">🧑‍🤝‍🧑 Connect</div>
            <div className="lp-vision-pill gold">💰 Earn</div>
            <div className="lp-vision-pill">🛒 Sell</div>
            <div className="lp-vision-pill gold">🤖 Automate</div>
            <div className="lp-vision-pill">🌍 Scale</div>
          </div>
        </div>

        {/* ── PLATFORMS ── */}
        <section className="lp-section" id="platforms">
          <div className="lp-section-header">
            <div className="lp-section-eyebrow">Ecosystem Platforms</div>
            <h2 className="lp-section-title">
              Six platforms.<br /><em>One ecosystem.</em>
            </h2>
            <p className="lp-section-desc">
              Each layer is a standalone business. Each one connected to the intelligence core. Built sequentially, evolved continuously.
            </p>
          </div>
          <div className="lp-platforms-grid">
            {PLATFORMS.map((p) => (
              <div key={p.name} className={`lp-platform-card ${p.status}`}>
                <div className="lp-platform-header">
                  <div className="lp-platform-icon">{p.icon}</div>
                  <span className={`lp-platform-badge ${p.status}`}>
                    {p.status === "live" ? "● Live" : p.status === "soon" ? "Coming Soon" : p.phase}
                  </span>
                </div>
                <div className="lp-platform-name">{p.name}</div>
                <div className="lp-platform-desc-text">{p.desc}</div>
                <div className="lp-platform-tags">
                  {p.tags.map((t) => <span key={t} className="lp-platform-tag">{t}</span>)}
                </div>
              </div>
            ))}
          </div>
        </section>

        <div className="lp-divider" />

        {/* ── ARCHITECTURE ── */}
        <div className="lp-arch">
          <div className="lp-section-eyebrow" style={{ fontFamily: "'Space Mono', monospace", fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--gold)", marginBottom: 14 }}>System Architecture</div>
          <h2 className="lp-section-title" style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: "clamp(28px, 3vw, 44px)", fontWeight: 300, color: "var(--text)", marginBottom: 8 }}>
            Hub & Spoke.<br /><em style={{ fontStyle: "italic", color: "var(--gold)" }}>Built to scale.</em>
          </h2>
          <div className="lp-arch-diagram">
            <div style={{ marginBottom: 8 }}><span className="lp-arch-ai">🤖 AI Orchestration Layer</span> <span style={{ color: "var(--dim)" }}>← The Soul</span></div>
            <div style={{ paddingLeft: 20, marginBottom: 4 }}>↓</div>
            <div style={{ marginBottom: 8 }}><span className="lp-arch-core">⬡ Winners Core</span> <span style={{ color: "var(--dim)" }}>← Identity · Billing · Analytics · API · Governance</span></div>
            <div style={{ paddingLeft: 20, marginBottom: 4 }}>↓ ↓ ↓ ↓ ↓</div>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
              <span className="lp-arch-layer">🧑‍🤝‍🧑 Community</span>
              <span className="lp-arch-layer">🎓 Academy</span>
              <span className="lp-arch-layer">🛒 Market</span>
              <span className="lp-arch-layer">💼 Work</span>
              <span className="lp-arch-layer">📱 Mobile</span>
            </div>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)", color: "var(--dim)", fontSize: 10 }}>
              Every platform shares: auth · data · billing · AI intelligence
            </div>
          </div>
        </div>

        <div className="lp-divider" />

        {/* ── FEATURES ── */}
        <section className="lp-section" id="features">
          <div className="lp-section-header">
            <div className="lp-section-eyebrow">Core Capabilities</div>
            <h2 className="lp-section-title">
              Built for dominance,<br /><em>engineered for scale</em>
            </h2>
            <p className="lp-section-desc">Every component of the ecosystem is built with the next five years in mind.</p>
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
            <div className="lp-section-eyebrow">Access Plans</div>
            <h2 className="lp-section-title">
              Start free.<br /><em>Scale when ready.</em>
            </h2>
            <p className="lp-section-desc">One subscription. Access to the entire ecosystem as platforms launch.</p>
          </div>
          <div className="lp-pricing-grid">
            <div className="lp-plan">
              <div className="lp-plan-name">Starter</div>
              <div className="lp-plan-desc">For individuals getting started</div>
              <div className="lp-plan-price">
                <div className="lp-plan-amount"><sup>$</sup>0</div>
                <div className="lp-plan-period">Free forever</div>
              </div>
              <ul className="lp-plan-features">
                <li className="highlight">1 workspace</li>
                <li className="highlight">Up to 3 team members</li>
                <li>Core analytics dashboard</li>
                <li>Community access</li>
                <li>Basic AI insights</li>
                <li>CSV exports</li>
              </ul>
              <button className="lp-plan-btn outline" onClick={() => navigate("/login")}>Get Started Free</button>
            </div>
            <div className="lp-plan featured">
              <div className="lp-plan-badge">Most Popular</div>
              <div className="lp-plan-name">Pro</div>
              <div className="lp-plan-desc">For growing teams & creators</div>
              <div className="lp-plan-price">
                <div className="lp-plan-amount"><sup>$</sup>99</div>
                <div className="lp-plan-period">Per month</div>
              </div>
              <ul className="lp-plan-features">
                <li className="highlight">Unlimited workspaces</li>
                <li className="highlight">Unlimited team members</li>
                <li className="highlight">Full AI intelligence suite</li>
                <li className="highlight">All ecosystem platforms</li>
                <li>Slack & email automation</li>
                <li>Priority support</li>
                <li>All export formats</li>
              </ul>
              <button className="lp-plan-btn gold" onClick={() => navigate("/login")}>Start Pro Trial →</button>
            </div>
            <div className="lp-plan">
              <div className="lp-plan-name">Enterprise</div>
              <div className="lp-plan-desc">For organisations & institutions</div>
              <div className="lp-plan-price">
                <div className="lp-plan-amount"><sup>$</sup>299</div>
                <div className="lp-plan-period">Per month</div>
              </div>
              <ul className="lp-plan-features">
                <li className="highlight">Everything in Pro</li>
                <li className="highlight">Custom AI agents</li>
                <li className="highlight">White-label option</li>
                <li className="highlight">SSO / SAML</li>
                <li>Dedicated account manager</li>
                <li>SLA guarantee</li>
                <li>API access & SDK</li>
              </ul>
              <button className="lp-plan-btn outline" onClick={() => navigate("/login")}>Contact Sales</button>
            </div>
          </div>
        </section>

        <div className="lp-divider" />

        {/* ── TESTIMONIALS ── */}
        <section className="lp-section" id="testimonials">
          <div className="lp-section-header">
            <div className="lp-section-eyebrow">Early Adopters</div>
            <h2 className="lp-section-title">
              Trusted by operators<br /><em>who demand more</em>
            </h2>
          </div>
          <div className="lp-testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="lp-testimonial">
                <div className="lp-testimonial-stars">★★★★★</div>
                <div className="lp-testimonial-text">"{t.text}"</div>
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
              <p className="lp-section-desc">Everything you need to know before joining the ecosystem.</p>
              <div style={{ marginTop: 36 }}>
                <button className="lp-btn-primary" onClick={() => navigate("/login")}>Join Free Today</button>
              </div>
            </div>
            <div>
              {FAQS.map((faq, i) => (
                <div key={i} className="lp-faq-item">
                  <button className="lp-faq-question" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    {faq.q}
                    <span className={`lp-faq-icon${openFaq === i ? " open" : ""}`}>+</span>
                  </button>
                  <div className={`lp-faq-answer${openFaq === i ? " open" : ""}`}>{faq.a}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA BAND ── */}
        <div className="lp-cta-band">
          <h2 className="lp-cta-title">
            Ready to enter<br />the <em>ecosystem</em>?
          </h2>
          <p className="lp-cta-sub">One account. Six platforms. Infinite growth. Free to start.</p>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="lp-btn-primary" onClick={() => navigate("/login")}>Create Free Account →</button>
            <button className="lp-btn-ghost" onClick={() => navigate("/login")}>Sign In</button>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="lp-footer">
          <div className="lp-footer-top">
            <div>
              <div className="lp-footer-brand">
                <img src="/logo.jpg" alt="Winners Empire" className="lp-footer-logo"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <div className="lp-footer-brand-name">Winners Ecosystem</div>
              </div>
              <div className="lp-footer-tagline">
                A Digital Sovereign Infrastructure. One AI-powered core governing a community, learning, commerce, and intelligence ecosystem — all connected.
              </div>
            </div>
            <div>
              <div className="lp-footer-col-title">Platforms</div>
              <ul className="lp-footer-links">
                <li><a href="#platforms">Community</a></li>
                <li><a href="#platforms">Academy</a></li>
                <li><a href="#platforms">Market</a></li>
                <li><a href="#platforms">Work</a></li>
              </ul>
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
                <li><a href="#">Roadmap</a></li>
                <li><a href="#">Contact</a></li>
                <li><a href="#">Security</a></li>
              </ul>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <div className="lp-footer-copy">© {new Date().getFullYear()} Winners Empire Inc. All rights reserved.</div>
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