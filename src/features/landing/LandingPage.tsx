// src/features/landing/LandingPage.tsx
// Phase: Cross-cutting · Layer: Core Engine / Public Face
// Updated: Complete brand alignment with Winners Ecosystem Digital Sovereign Infrastructure

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;0,700;1,300;1,400;1,600&family=Space+Mono:wght@400;700&family=Syne:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --gold:    #C9A84C;
    --gold2:   #E8C97A;
    --gold3:   #8B6914;
    --gold-dim: rgba(201,168,76,0.08);
    --blue:    #2B5F8E;
    --blue2:   #3A7BC0;
    --ice:     #89C4E1;
    --green:   #2DD4A0;
    --purple:  #9B6FFF;
    --red:     #E05A4E;
    --bg:      #0D1520;
    --surface: #111D2E;
    --surface2:#172335;
    --border:  #1E3248;
    --border2: rgba(30,50,72,0.6);
    --text:    #E8EEF5;
    --text-dim:#5A7A96;
    --text-faint: #2E4A64;
  }

  html { scroll-behavior: smooth; }
  body { background: var(--bg); }

  .lp {
    background: var(--bg);
    color: var(--text);
    font-family: 'Syne', sans-serif;
    overflow-x: hidden;
    min-height: 100vh;
    position: relative;
  }

  /* ═══════════════════════════════════════════
     SCANLINE GRID TEXTURE
  ═══════════════════════════════════════════ */
  .lp-grid-bg {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(43,95,142,0.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(43,95,142,0.025) 1px, transparent 1px);
    background-size: 48px 48px;
  }

  /* ═══════════════════════════════════════════
     NAV
  ═══════════════════════════════════════════ */
  .lp-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    height: 64px;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 48px;
    background: rgba(13,21,32,0.88);
    backdrop-filter: blur(24px);
    border-bottom: 1px solid rgba(30,50,72,0.8);
    transition: border-color 0.3s;
  }
  .lp-nav.scrolled { border-bottom-color: rgba(201,168,76,0.15); }

  .lp-nav-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }
  .lp-nav-logo {
    width: 34px; height: 34px; border-radius: 7px;
    object-fit: cover;
    border: 1.5px solid rgba(201,168,76,0.4);
    box-shadow: 0 0 12px rgba(201,168,76,0.12);
  }
  .lp-nav-logo-fallback {
    width: 34px; height: 34px; border-radius: 7px;
    background: linear-gradient(135deg, var(--gold3), var(--blue));
    display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 800; color: var(--bg);
    border: 1.5px solid rgba(201,168,76,0.4);
  }
  .lp-nav-wordmark { line-height: 1.1; }
  .lp-nav-name { font-size: 13px; font-weight: 800; color: var(--text); letter-spacing: -0.2px; }
  .lp-nav-sub { font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 2.5px; text-transform: uppercase; color: var(--gold); }

  .lp-nav-links { display: flex; align-items: center; gap: 28px; list-style: none; }
  .lp-nav-links a {
    font-family: 'Space Mono', monospace; font-size: 9.5px;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--text-dim); text-decoration: none; transition: color 0.2s;
  }
  .lp-nav-links a:hover { color: var(--gold); }

  .lp-nav-right { display: flex; align-items: center; gap: 12px; }
  .lp-nav-status {
    display: flex; align-items: center; gap: 6px;
    font-family: 'Space Mono', monospace; font-size: 9px;
    color: var(--green); letter-spacing: 0.08em;
    background: rgba(45,212,160,0.08); border: 1px solid rgba(45,212,160,0.2);
    padding: 4px 10px; border-radius: 3px;
  }
  .lp-nav-status-dot {
    width: 5px; height: 5px; border-radius: 50%; background: var(--green);
    animation: pulse 2s infinite;
  }
  .lp-nav-btn {
    padding: 8px 20px;
    background: transparent; color: var(--gold);
    font-family: 'Space Mono', monospace; font-size: 9.5px;
    letter-spacing: 0.12em; text-transform: uppercase;
    border: 1px solid rgba(201,168,76,0.5); cursor: pointer;
    transition: all 0.2s; border-radius: 2px;
  }
  .lp-nav-btn:hover { background: var(--gold); color: var(--bg); }

  /* ═══════════════════════════════════════════
     HERO
  ═══════════════════════════════════════════ */
  .lp-hero {
    position: relative; z-index: 1;
    min-height: 100vh;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 120px 48px 80px;
    text-align: center;
    overflow: hidden;
  }

  /* Radial glow behind hero */
  .lp-hero-glow {
    position: absolute; top: 20%; left: 50%; transform: translateX(-50%);
    width: 1000px; height: 600px; pointer-events: none;
    background: radial-gradient(ellipse at center,
      rgba(43,95,142,0.14) 0%,
      rgba(201,168,76,0.04) 40%,
      transparent 70%);
  }
  .lp-hero-glow2 {
    position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
    width: 600px; height: 300px; pointer-events: none;
    background: radial-gradient(ellipse at center,
      rgba(201,168,76,0.05) 0%, transparent 70%);
  }

  .lp-hero-eyebrow {
    font-family: 'Space Mono', monospace; font-size: 9.5px;
    letter-spacing: 0.35em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 28px;
    display: flex; align-items: center; gap: 16px;
    animation: fadeUp 0.6s ease 0.1s both;
  }
  .lp-hero-eyebrow::before, .lp-hero-eyebrow::after {
    content: ''; flex: 0 0 44px; height: 1px;
    background: linear-gradient(90deg, transparent, var(--gold3));
  }
  .lp-hero-eyebrow::after { background: linear-gradient(270deg, transparent, var(--gold3)); }

  .lp-hero-logo {
    width: 96px; height: 96px; border-radius: 20px; object-fit: cover;
    border: 2.5px solid rgba(201,168,76,0.5);
    box-shadow: 0 0 48px rgba(201,168,76,0.2), 0 0 96px rgba(43,95,142,0.15);
    margin-bottom: 36px;
    animation: fadeUp 0.6s ease both;
  }
  .lp-hero-logo-fallback {
    width: 96px; height: 96px; border-radius: 20px;
    background: linear-gradient(135deg, #1a2a3a 0%, #0d1520 100%);
    border: 2.5px solid rgba(201,168,76,0.5);
    box-shadow: 0 0 48px rgba(201,168,76,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 40px; margin-bottom: 36px;
    animation: fadeUp 0.6s ease both;
  }

  .lp-hero-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(56px, 9vw, 120px);
    font-weight: 300; line-height: 0.9;
    letter-spacing: -0.02em; color: var(--text);
    margin-bottom: 10px;
    animation: fadeUp 0.7s ease 0.15s both;
  }
  .lp-hero-title em { font-style: italic; color: var(--gold); }

  .lp-hero-sub {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(24px, 3.5vw, 48px);
    font-weight: 300; font-style: italic;
    color: var(--ice); line-height: 1.1; margin-bottom: 32px;
    animation: fadeUp 0.7s ease 0.25s both;
  }

  .lp-hero-desc {
    font-size: 15px; color: var(--text-dim); line-height: 1.8;
    max-width: 580px; margin: 0 auto 48px;
    animation: fadeUp 0.7s ease 0.35s both;
  }

  .lp-hero-actions {
    display: flex; align-items: center; gap: 14px; justify-content: center;
    flex-wrap: wrap; margin-bottom: 72px;
    animation: fadeUp 0.7s ease 0.45s both;
  }
  .lp-btn-primary {
    padding: 14px 36px; background: var(--gold); color: var(--bg);
    font-family: 'Space Mono', monospace; font-size: 10.5px;
    letter-spacing: 0.14em; text-transform: uppercase;
    border: none; cursor: pointer; font-weight: 700;
    border-radius: 2px; transition: all 0.2s;
  }
  .lp-btn-primary:hover { background: var(--gold2); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(201,168,76,0.25); }
  .lp-btn-ghost {
    padding: 14px 36px; background: transparent; color: var(--text-dim);
    font-family: 'Space Mono', monospace; font-size: 10.5px;
    letter-spacing: 0.12em; text-transform: uppercase;
    border: 1px solid var(--border); cursor: pointer; border-radius: 2px; transition: all 0.2s;
  }
  .lp-btn-ghost:hover { border-color: var(--ice); color: var(--ice); }

  /* ── HERO METRICS TICKER ── */
  .lp-hero-metrics {
    display: flex; gap: 0; justify-content: center;
    border: 1px solid var(--border);
    border-radius: 4px; overflow: hidden;
    animation: fadeUp 0.7s ease 0.55s both;
  }
  .lp-metric {
    padding: 18px 36px; text-align: center;
    border-right: 1px solid var(--border);
    background: rgba(17,29,46,0.6);
  }
  .lp-metric:last-child { border-right: none; }
  .lp-metric-value {
    font-family: 'Cormorant Garamond', serif;
    font-size: 36px; font-weight: 600; color: var(--gold); line-height: 1;
    margin-bottom: 5px;
  }
  .lp-metric-label {
    font-family: 'Space Mono', monospace; font-size: 8.5px;
    letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-dim);
  }

  /* ── SCROLL INDICATOR ── */
  .lp-scroll-hint {
    position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%);
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    animation: fadeUp 1s ease 1s both;
  }
  .lp-scroll-hint span {
    font-family: 'Space Mono', monospace; font-size: 8px;
    letter-spacing: 0.2em; text-transform: uppercase; color: var(--text-faint);
  }
  .lp-scroll-line {
    width: 1px; height: 40px;
    background: linear-gradient(180deg, var(--gold3), transparent);
    animation: scrollPulse 2s ease-in-out infinite;
  }

  /* ═══════════════════════════════════════════
     ECOSYSTEM OS BAND — the big idea statement
  ═══════════════════════════════════════════ */
  .lp-os-band {
    position: relative; z-index: 1;
    background: linear-gradient(135deg, rgba(43,95,142,0.1) 0%, rgba(201,168,76,0.04) 50%, rgba(43,95,142,0.06) 100%);
    border-top: 1px solid rgba(201,168,76,0.1);
    border-bottom: 1px solid rgba(201,168,76,0.1);
    padding: 80px 48px;
    text-align: center;
    overflow: hidden;
  }
  .lp-os-band::before {
    content: '';
    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
    width: 700px; height: 300px;
    background: radial-gradient(ellipse, rgba(201,168,76,0.04), transparent 70%);
    pointer-events: none;
  }
  .lp-os-label {
    font-family: 'Space Mono', monospace; font-size: 9px;
    letter-spacing: 0.3em; text-transform: uppercase;
    color: var(--ice); margin-bottom: 20px;
  }
  .lp-os-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(28px, 4.5vw, 58px);
    font-weight: 300; color: var(--text); line-height: 1.1;
    margin-bottom: 20px;
  }
  .lp-os-title em { font-style: italic; color: var(--gold); }
  .lp-os-desc {
    font-size: 14px; color: var(--text-dim); line-height: 1.8;
    max-width: 660px; margin: 0 auto 44px;
  }
  .lp-os-pillars {
    display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;
  }
  .lp-os-pill {
    padding: 9px 20px;
    border-radius: 24px;
    font-family: 'Space Mono', monospace; font-size: 10px;
    letter-spacing: 0.06em;
    display: flex; align-items: center; gap: 7px;
    transition: all 0.2s;
  }
  .lp-os-pill.blue { background: rgba(43,95,142,0.12); border: 1px solid rgba(43,95,142,0.25); color: var(--ice); }
  .lp-os-pill.gold { background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.2); color: var(--gold); }
  .lp-os-pill.green { background: rgba(45,212,160,0.07); border: 1px solid rgba(45,212,160,0.18); color: var(--green); }
  .lp-os-pill.purple { background: rgba(155,111,255,0.08); border: 1px solid rgba(155,111,255,0.2); color: var(--purple); }

  /* ═══════════════════════════════════════════
     ARCHITECTURE DIAGRAM (ASCII style)
  ═══════════════════════════════════════════ */
  .lp-arch {
    position: relative; z-index: 1;
    padding: 80px 48px;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    background: linear-gradient(180deg, transparent, rgba(43,95,142,0.04), transparent);
    text-align: center;
  }
  .lp-arch-box {
    max-width: 760px; margin: 40px auto 0;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 6px; padding: 36px 40px;
    font-family: 'Space Mono', monospace; font-size: 11px;
    color: var(--text-dim); line-height: 2.2; text-align: left;
    position: relative;
  }
  .lp-arch-box::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, var(--gold3), transparent);
  }
  .lp-arch-ai   { color: var(--purple); font-weight: 700; }
  .lp-arch-core { color: var(--gold); font-weight: 700; }
  .lp-arch-layer{ color: var(--ice); }
  .lp-arch-dim  { color: var(--text-faint); }
  .lp-arch-green{ color: var(--green); }

  /* ═══════════════════════════════════════════
     PLATFORM LAYERS
  ═══════════════════════════════════════════ */
  .lp-section {
    position: relative; z-index: 1;
    padding: 100px 48px;
    max-width: 1280px; margin: 0 auto;
  }
  .lp-section-header { margin-bottom: 56px; }
  .lp-section-eyebrow {
    font-family: 'Space Mono', monospace; font-size: 9px;
    letter-spacing: 0.3em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 14px;
  }
  .lp-section-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(32px, 4vw, 56px);
    font-weight: 300; color: var(--text); line-height: 1.05;
    margin-bottom: 14px;
  }
  .lp-section-title em { font-style: italic; color: var(--gold); }
  .lp-section-desc { font-size: 14px; color: var(--text-dim); line-height: 1.7; max-width: 520px; }

  .lp-platforms-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    background: var(--border);
    border: 1px solid var(--border);
    border-radius: 6px; overflow: hidden;
  }
  .lp-platform-card {
    background: var(--surface);
    padding: 32px 28px;
    position: relative; overflow: hidden;
    transition: background 0.25s;
    cursor: default;
  }
  .lp-platform-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    opacity: 0; transition: opacity 0.3s;
  }
  .lp-platform-card.live::before   { background: linear-gradient(90deg, transparent, var(--green), transparent); }
  .lp-platform-card.soon::before   { background: linear-gradient(90deg, transparent, var(--gold), transparent); }
  .lp-platform-card.planned::before{ background: linear-gradient(90deg, transparent, var(--blue2), transparent); }
  .lp-platform-card:hover { background: var(--surface2); }
  .lp-platform-card:hover::before { opacity: 1; }

  .lp-platform-header {
    display: flex; align-items: flex-start; justify-content: space-between;
    margin-bottom: 20px;
  }
  .lp-platform-icon { font-size: 28px; line-height: 1; }
  .lp-platform-badge {
    font-family: 'Space Mono', monospace; font-size: 8.5px;
    letter-spacing: 0.1em; text-transform: uppercase;
    padding: 3px 9px; border-radius: 2px;
  }
  .lp-platform-badge.live    { background: rgba(45,212,160,0.12); color: var(--green); border: 1px solid rgba(45,212,160,0.25); }
  .lp-platform-badge.soon    { background: rgba(201,168,76,0.1);  color: var(--gold);  border: 1px solid rgba(201,168,76,0.25); }
  .lp-platform-badge.planned { background: rgba(43,95,142,0.12);  color: var(--ice);   border: 1px solid rgba(43,95,142,0.25); }

  .lp-platform-phase {
    font-family: 'Space Mono', monospace; font-size: 8px;
    letter-spacing: 0.15em; text-transform: uppercase;
    color: var(--text-faint); margin-bottom: 8px;
  }
  .lp-platform-name { font-size: 16px; font-weight: 700; color: var(--text); margin-bottom: 10px; }
  .lp-platform-desc { font-size: 12.5px; color: var(--text-dim); line-height: 1.7; margin-bottom: 18px; }
  .lp-platform-tags { display: flex; flex-wrap: wrap; gap: 6px; }
  .lp-platform-tag {
    font-family: 'Space Mono', monospace; font-size: 8.5px;
    color: var(--text-dim); letter-spacing: 0.06em;
    background: rgba(30,50,72,0.8); border: 1px solid var(--border);
    padding: 3px 8px; border-radius: 2px;
  }

  /* ── AGENTIC LOOP SECTION ── */
  .lp-loop-section {
    position: relative; z-index: 1;
    padding: 90px 48px;
    background: linear-gradient(135deg, rgba(155,111,255,0.04), rgba(43,95,142,0.06), transparent);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    text-align: center;
  }
  .lp-loop-steps {
    display: flex; align-items: center; justify-content: center;
    flex-wrap: wrap; gap: 0; max-width: 1000px; margin: 48px auto 0;
  }
  .lp-loop-step {
    display: flex; flex-direction: column; align-items: center; gap: 10px;
    padding: 20px 16px; min-width: 120px;
    position: relative;
  }
  .lp-loop-icon {
    width: 52px; height: 52px; border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px;
    background: var(--surface); border: 1px solid var(--border);
    transition: all 0.25s;
  }
  .lp-loop-step:hover .lp-loop-icon {
    background: var(--surface2);
    border-color: rgba(201,168,76,0.3);
    box-shadow: 0 0 20px rgba(201,168,76,0.1);
  }
  .lp-loop-step-label {
    font-family: 'Space Mono', monospace; font-size: 8.5px;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--text-dim); text-align: center; line-height: 1.4;
    max-width: 100px;
  }
  .lp-loop-arrow {
    font-family: 'Cormorant Garamond', serif; font-size: 22px;
    color: var(--gold3); padding: 0 4px;
    transform: translateY(-10px);
  }

  /* ═══════════════════════════════════════════
     FEATURES GRID
  ═══════════════════════════════════════════ */
  .lp-features-section {
    position: relative; z-index: 1;
    padding: 100px 48px;
    max-width: 1280px; margin: 0 auto;
  }
  .lp-features-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 1px; background: var(--border);
    border: 1px solid var(--border); border-radius: 6px; overflow: hidden;
    margin-top: 52px;
  }
  .lp-feature {
    background: var(--surface); padding: 36px 28px;
    transition: background 0.2s; position: relative; overflow: hidden;
  }
  .lp-feature::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, var(--gold3), transparent);
    opacity: 0; transition: opacity 0.3s;
  }
  .lp-feature:hover { background: var(--surface2); }
  .lp-feature:hover::before { opacity: 1; }
  .lp-feature-num {
    font-family: 'Cormorant Garamond', serif; font-size: 48px;
    font-weight: 300; color: var(--text-faint); margin-bottom: 14px; line-height: 1;
  }
  .lp-feature-icon { font-size: 22px; margin-bottom: 12px; }
  .lp-feature-title { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
  .lp-feature-desc { font-size: 12.5px; color: var(--text-dim); line-height: 1.7; }

  /* ═══════════════════════════════════════════
     CONTEXT BAR — platform layer status (required on all ecosystem pages)
  ═══════════════════════════════════════════ */
  .lp-context-bar {
    position: relative; z-index: 1;
    background: var(--surface);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 0 48px;
    overflow-x: auto;
  }
  .lp-context-inner {
    display: flex; align-items: stretch; min-height: 48px;
    gap: 0; min-width: max-content;
  }
  .lp-context-label {
    font-family: 'Space Mono', monospace; font-size: 8.5px;
    letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold);
    padding: 0 20px; display: flex; align-items: center;
    border-right: 1px solid var(--border); flex-shrink: 0; white-space: nowrap;
  }
  .lp-context-item {
    display: flex; align-items: center; gap: 8px;
    padding: 0 18px; border-right: 1px solid var(--border);
    white-space: nowrap;
  }
  .lp-context-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .lp-context-dot.live    { background: var(--green); box-shadow: 0 0 6px rgba(45,212,160,0.5); animation: pulse 2s infinite; }
  .lp-context-dot.building{ background: var(--gold); }
  .lp-context-dot.planned { background: var(--text-faint); }
  .lp-context-name {
    font-family: 'Space Mono', monospace; font-size: 9px;
    letter-spacing: 0.06em; color: var(--text-dim);
  }
  .lp-context-pct {
    font-family: 'Space Mono', monospace; font-size: 8px;
    color: var(--text-faint);
  }

  /* ═══════════════════════════════════════════
     PRICING
  ═══════════════════════════════════════════ */
  .lp-pricing-section {
    position: relative; z-index: 1;
    padding: 100px 48px;
    max-width: 1100px; margin: 0 auto;
    text-align: center;
  }
  .lp-pricing-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 20px; margin-top: 52px; text-align: left;
  }
  .lp-plan {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px; padding: 36px 28px;
    position: relative; transition: border-color 0.2s, transform 0.2s;
  }
  .lp-plan:hover { border-color: var(--gold3); transform: translateY(-2px); }
  .lp-plan.featured {
    border-color: var(--gold);
    background: linear-gradient(160deg, rgba(23,35,53,1) 0%, rgba(17,29,46,1) 100%);
  }
  .lp-plan.featured::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, var(--gold), var(--ice), transparent);
  }
  .lp-plan-badge {
    position: absolute; top: -1px; left: 50%; transform: translateX(-50%);
    background: var(--gold); color: var(--bg);
    font-family: 'Space Mono', monospace; font-size: 7.5px;
    letter-spacing: 0.18em; text-transform: uppercase;
    padding: 4px 14px; font-weight: 700;
    white-space: nowrap;
  }
  .lp-plan-name {
    font-family: 'Cormorant Garamond', serif; font-size: 28px;
    font-weight: 400; color: var(--text); margin-bottom: 6px;
  }
  .lp-plan-tagline {
    font-family: 'Space Mono', monospace; font-size: 9px;
    color: var(--text-dim); letter-spacing: 0.08em; margin-bottom: 24px;
  }
  .lp-plan-price-row { display: flex; align-items: baseline; gap: 4px; margin-bottom: 6px; }
  .lp-plan-currency { font-size: 18px; color: var(--gold); font-weight: 600; margin-top: 4px; }
  .lp-plan-price { font-family: 'Cormorant Garamond', serif; font-size: 52px; font-weight: 600; color: var(--text); line-height: 1; }
  .lp-plan-period {
    font-family: 'Space Mono', monospace; font-size: 10px;
    color: var(--text-dim); margin-bottom: 28px;
  }
  .lp-plan-divider { height: 1px; background: var(--border); margin-bottom: 24px; }
  .lp-plan-features { list-style: none; display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
  .lp-plan-feature {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 12.5px; color: var(--text-dim); line-height: 1.5;
  }
  .lp-plan-check { color: var(--green); font-size: 12px; margin-top: 1px; flex-shrink: 0; }
  .lp-plan-x     { color: var(--text-faint); font-size: 12px; margin-top: 1px; flex-shrink: 0; }
  .lp-plan-btn {
    width: 100%; padding: 12px;
    font-family: 'Space Mono', monospace; font-size: 10px;
    letter-spacing: 0.12em; text-transform: uppercase;
    border-radius: 2px; cursor: pointer; transition: all 0.2s; font-weight: 700;
    border: 1px solid var(--border); background: transparent; color: var(--text);
  }
  .lp-plan-btn:hover { border-color: var(--gold); color: var(--gold); }
  .lp-plan.featured .lp-plan-btn {
    background: var(--gold); color: var(--bg); border-color: var(--gold);
  }
  .lp-plan.featured .lp-plan-btn:hover { background: var(--gold2); }

  /* ═══════════════════════════════════════════
     BUILD PROGRESS BAND
  ═══════════════════════════════════════════ */
  .lp-progress-band {
    position: relative; z-index: 1;
    background: var(--surface);
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    padding: 70px 48px; text-align: center;
  }
  .lp-progress-grid {
    display: grid; grid-template-columns: repeat(4, 1fr);
    gap: 0; max-width: 900px; margin: 44px auto 0;
    border: 1px solid var(--border); border-radius: 6px; overflow: hidden;
  }
  .lp-progress-item {
    padding: 24px 20px; border-right: 1px solid var(--border);
    position: relative;
  }
  .lp-progress-item:last-child { border-right: none; }
  .lp-progress-bar-track {
    height: 3px; background: var(--border); border-radius: 2px;
    margin-top: 10px; overflow: hidden;
  }
  .lp-progress-bar-fill {
    height: 100%; border-radius: 2px; transition: width 1.2s ease;
  }
  .lp-progress-bar-fill.live     { background: linear-gradient(90deg, var(--green), var(--ice)); }
  .lp-progress-bar-fill.building { background: linear-gradient(90deg, var(--gold), var(--gold2)); }
  .lp-progress-bar-fill.planned  { background: var(--text-faint); }
  .lp-progress-name {
    font-size: 12px; font-weight: 700; color: var(--text); margin-bottom: 2px;
  }
  .lp-progress-status {
    font-family: 'Space Mono', monospace; font-size: 8px;
    letter-spacing: 0.1em; text-transform: uppercase;
  }
  .lp-progress-status.live     { color: var(--green); }
  .lp-progress-status.building { color: var(--gold); }
  .lp-progress-status.planned  { color: var(--text-faint); }
  .lp-progress-pct {
    font-family: 'Space Mono', monospace; font-size: 10px;
    color: var(--text-dim); margin-top: 6px;
  }

  /* ═══════════════════════════════════════════
     FAQ
  ═══════════════════════════════════════════ */
  .lp-faq-item { border-bottom: 1px solid var(--border); }
  .lp-faq-question {
    width: 100%; padding: 20px 0;
    display: flex; align-items: center; justify-content: space-between;
    background: none; border: none; cursor: pointer;
    font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600;
    color: var(--text); text-align: left; gap: 20px; transition: color 0.2s;
  }
  .lp-faq-question:hover { color: var(--gold); }
  .lp-faq-icon {
    font-family: 'Cormorant Garamond', serif; font-size: 24px;
    color: var(--gold); flex-shrink: 0; transition: transform 0.25s; line-height: 1;
  }
  .lp-faq-icon.open { transform: rotate(45deg); }
  .lp-faq-answer {
    font-size: 13px; color: var(--text-dim); line-height: 1.8;
    max-height: 0; overflow: hidden; transition: max-height 0.35s ease, padding 0.3s ease;
  }
  .lp-faq-answer.open { max-height: 300px; padding-bottom: 22px; }

  /* ═══════════════════════════════════════════
     CTA BAND
  ═══════════════════════════════════════════ */
  .lp-cta-band {
    position: relative; z-index: 1;
    padding: 110px 48px; text-align: center;
    border-top: 1px solid var(--border);
    background: linear-gradient(180deg, var(--bg), rgba(43,95,142,0.07), var(--bg));
    overflow: hidden;
  }
  .lp-cta-band::before {
    content: ''; position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%);
    width: 900px; height: 400px;
    background: radial-gradient(ellipse, rgba(201,168,76,0.06), transparent 70%);
    pointer-events: none;
  }
  .lp-cta-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(36px, 5.5vw, 72px);
    font-weight: 300; color: var(--text); line-height: 1.05; margin-bottom: 16px;
  }
  .lp-cta-title em { font-style: italic; color: var(--gold); }
  .lp-cta-sub {
    font-family: 'Space Mono', monospace; font-size: 10px;
    color: var(--text-dim); letter-spacing: 0.12em; margin-bottom: 44px;
  }
  .lp-cta-tagline {
    font-family: 'Cormorant Garamond', serif; font-size: 20px;
    font-style: italic; color: var(--ice); margin-top: 28px;
  }

  /* ═══════════════════════════════════════════
     FOOTER
  ═══════════════════════════════════════════ */
  .lp-footer {
    position: relative; z-index: 1;
    padding: 60px 48px 36px;
    border-top: 1px solid var(--border);
    background: var(--surface);
  }
  .lp-footer-top {
    display: grid; grid-template-columns: 2.2fr 1fr 1fr 1fr;
    gap: 52px; margin-bottom: 44px;
  }
  .lp-footer-brand { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
  .lp-footer-logo { width: 30px; height: 30px; border-radius: 6px; object-fit: cover; border: 1px solid rgba(201,168,76,0.3); }
  .lp-footer-brand-name { font-size: 14px; font-weight: 800; color: var(--gold); }
  .lp-footer-tagline { font-size: 12px; color: var(--text-dim); line-height: 1.75; max-width: 280px; margin-bottom: 16px; }
  .lp-footer-ecosystem-tag {
    display: inline-flex; align-items: center; gap: 6px;
    font-family: 'Space Mono', monospace; font-size: 8.5px; letter-spacing: 0.1em;
    color: var(--text-dim); background: rgba(30,50,72,0.6);
    border: 1px solid var(--border); padding: 4px 10px; border-radius: 2px;
  }
  .lp-footer-col-title {
    font-family: 'Space Mono', monospace; font-size: 8.5px;
    letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 18px;
  }
  .lp-footer-links { list-style: none; display: flex; flex-direction: column; gap: 10px; }
  .lp-footer-links a { font-size: 12px; color: var(--text-dim); text-decoration: none; transition: color 0.2s; }
  .lp-footer-links a:hover { color: var(--gold); }
  .lp-footer-divider { height: 1px; background: var(--border); margin-bottom: 24px; }
  .lp-footer-bottom {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px;
  }
  .lp-footer-copy {
    font-family: 'Space Mono', monospace; font-size: 9px;
    color: var(--text-dim); letter-spacing: 0.05em;
  }
  .lp-footer-copy span { color: var(--gold); }
  .lp-footer-legal { display: flex; gap: 24px; }
  .lp-footer-legal a {
    font-family: 'Space Mono', monospace; font-size: 9px;
    color: var(--text-dim); text-decoration: none; transition: color 0.2s;
  }
  .lp-footer-legal a:hover { color: var(--gold); }

  /* ═══════════════════════════════════════════
     DIVIDER
  ═══════════════════════════════════════════ */
  .lp-divider {
    width: 100%; height: 1px; position: relative; z-index: 1;
    background: linear-gradient(90deg, transparent, var(--border), transparent);
  }

  /* ═══════════════════════════════════════════
     ANIMATIONS
  ═══════════════════════════════════════════ */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(22px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }
  @keyframes scrollPulse {
    0% { transform: scaleY(0); transform-origin: top; opacity: 0; }
    50% { transform: scaleY(1); opacity: 1; }
    100% { transform: scaleY(0); transform-origin: bottom; opacity: 0; }
  }

  /* ═══════════════════════════════════════════
     RESPONSIVE
  ═══════════════════════════════════════════ */
  @media (max-width: 1024px) {
    .lp-platforms-grid { grid-template-columns: repeat(2, 1fr); }
    .lp-features-grid  { grid-template-columns: repeat(2, 1fr); }
    .lp-pricing-grid   { grid-template-columns: 1fr; }
    .lp-progress-grid  { grid-template-columns: repeat(2, 1fr); }
    .lp-footer-top     { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 900px) {
    .lp-nav { padding: 0 20px; }
    .lp-nav-links { display: none; }
    .lp-nav-status { display: none; }
    .lp-hero { padding: 100px 24px 60px; }
    .lp-hero-metrics { flex-direction: row; flex-wrap: wrap; justify-content: center; border-radius: 4px; }
    .lp-metric { flex: 1; min-width: 100px; }
    .lp-section, .lp-features-section, .lp-pricing-section { padding: 70px 24px; }
    .lp-os-band, .lp-arch, .lp-loop-section, .lp-progress-band { padding: 60px 24px; }
    .lp-cta-band { padding: 80px 24px; }
    .lp-footer { padding: 44px 24px 28px; }
    .lp-context-bar { padding: 0 24px; }
  }
  @media (max-width: 600px) {
    .lp-platforms-grid, .lp-features-grid, .lp-progress-grid { grid-template-columns: 1fr; }
    .lp-hero-actions { flex-direction: column; align-items: stretch; }
    .lp-btn-primary, .lp-btn-ghost { text-align: center; }
    .lp-footer-top { grid-template-columns: 1fr; }
    .lp-loop-steps { gap: 0; }
    .lp-loop-arrow { display: none; }
  }
`;

// ─── DATA ────────────────────────────────────────────────────────────────────

const PLATFORMS = [
  {
    icon: "⬡", name: "Core Engine", phase: "Phase 1", status: "live", pct: 90,
    desc: "The control tower. Multi-tenant auth, billing, analytics, RBAC, and the API gateway that powers every platform layer.",
    tags: ["Auth & 2FA", "Billing", "Analytics", "API Gateway"],
  },
  {
    icon: "🧑‍🤝‍🧑", name: "Winners Community", phase: "Phase 2", status: "live", pct: 55,
    desc: "A full social platform. Posts, likes, comments, follow system, groups, DMs, and creator monetization tools.",
    tags: ["Social Feed", "Groups", "Messaging", "Creators"],
  },
  {
    icon: "🎓", name: "Winners Academy", phase: "Phase 3", status: "soon", pct: 30,
    desc: "Complete learning platform. Courses, modules, video lessons, AI tutors, certificates, and skill-based hiring.",
    tags: ["Courses", "Certificates", "AI Tutor", "Progress"],
  },
  {
    icon: "🛒", name: "Winners Market", phase: "Phase 4", status: "soon", pct: 0,
    desc: "Commerce engine. Digital products, dropshipping, vendor dashboards, storefronts, and AI-powered recommendations.",
    tags: ["Products", "Vendors", "Dropship", "Commerce"],
  },
  {
    icon: "🤖", name: "Winners Intelligence", phase: "Phase 5", status: "planned", pct: 5,
    desc: "The agentic AI core. Personal AI agents, cross-platform smart recommendations, voice search, and full automation.",
    tags: ["AI Agents", "Smart Search", "Automation", "Predictions"],
  },
  {
    icon: "💼", name: "Winners Work", phase: "Phase 6", status: "planned", pct: 0,
    desc: "Freelance hub meets work network. Job board, AI skill matching, contracts, escrow payments, and portfolios.",
    tags: ["Jobs", "Freelance", "Escrow", "AI Matching"],
  },
];

const FEATURES = [
  { num: "01", icon: "🧠", title: "AI Intelligence Core", desc: "Claude-powered analytics surfaces insights, detects anomalies, and generates strategic recommendations across every ecosystem layer — automatically." },
  { num: "02", icon: "🏗", title: "Multi-Tenant Architecture", desc: "Full workspace isolation with role-based access. Every platform layer shares one identity system. One login, every product, zero data leakage." },
  { num: "03", icon: "💳", title: "Unified Billing Engine", desc: "One billing system governs all platforms. Subscriptions, marketplace commissions, course revenue, and AI credits — managed from a single control panel." },
  { num: "04", icon: "🔗", title: "API-First Design", desc: "Every layer exposes clean, versioned APIs. Future developers and partners can build on Winners Ecosystem. You stop being a product. You become infrastructure." },
  { num: "05", icon: "🔐", title: "Enterprise Security", desc: "2FA (TOTP + Email OTP + backup codes), audit logs, encrypted storage, rate limiting, and GDPR compliance built into the core. Security is the foundation." },
  { num: "06", icon: "📊", title: "Data Dominance", desc: "Every interaction tracked. Revenue, engagement, retention, and cohort analytics available across all platforms in one unified intelligence dashboard." },
];

const AGENTIC_LOOP = [
  { icon: "🧑‍🤝‍🧑", label: "Post in Community" },
  { icon: "🤖", label: "AI Analyses Skills" },
  { icon: "🎓", label: "Course Recommended" },
  { icon: "📜", label: "Certificate Earned" },
  { icon: "💼", label: "Job Matched" },
  { icon: "🛒", label: "Sell in Market" },
  { icon: "📈", label: "Revenue Grows" },
];

const PLANS = [
  {
    name: "Starter", tagline: "Explore the ecosystem", price: "0", period: "Free forever",
    features: [
      { label: "Winners Community access", yes: true },
      { label: "1 workspace", yes: true },
      { label: "Basic analytics (30 days)", yes: true },
      { label: "Academy courses (free tier)", yes: true },
      { label: "AI recommendations", yes: false },
      { label: "Winners Market storefront", yes: false },
      { label: "Custom domain", yes: false },
    ],
    cta: "Get Started Free",
  },
  {
    name: "Pro", tagline: "Build your business", price: "29", period: "/ month",
    featured: true,
    features: [
      { label: "All Starter features", yes: true },
      { label: "Unlimited workspaces", yes: true },
      { label: "Advanced analytics + AI insights", yes: true },
      { label: "All Academy courses", yes: true },
      { label: "Winners Market storefront", yes: true },
      { label: "AI recommendations + automation", yes: true },
      { label: "Priority support", yes: true },
    ],
    cta: "Start Pro Trial",
  },
  {
    name: "Enterprise", tagline: "Full ecosystem control", price: "99", period: "/ month",
    features: [
      { label: "All Pro features", yes: true },
      { label: "White-label ecosystem", yes: true },
      { label: "API access + developer SDK", yes: true },
      { label: "SSO + advanced RBAC", yes: true },
      { label: "Custom AI agents (per tenant)", yes: true },
      { label: "Dedicated support + SLA", yes: true },
      { label: "Enterprise billing integration", yes: true },
    ],
    cta: "Contact Sales",
  },
];

const FAQS = [
  {
    q: "What exactly is Winners Ecosystem?",
    a: "Winners Ecosystem is a Digital Sovereign Infrastructure — a Central Digital Operating System that hosts, governs, and intelligently orchestrates six platform products: Community, Academy, Market, Work, Intelligence, and a Developer Cloud. One login gives you access to all of them. Every layer shares identity, billing, and AI."
  },
  {
    q: "How does the AI Agentic Loop work?",
    a: "The AI core monitors your activity across all platforms. Post in Community → AI detects skills → recommends a course in Academy → you earn a certificate → AI matches you to a job in Winners Work → you earn and spend in the Market. The ecosystem feeds itself and compounds your growth automatically."
  },
  {
    q: "What is live right now?",
    a: "The Core Engine (auth, billing, analytics, multi-tenant architecture) is live at 90% and running in production on Railway. Winners Community V1 is live with social feed, posts, likes, and comments. Winners Academy is actively building — courses, modules, enrollment, and certificates are in development."
  },
  {
    q: "Can I use just one platform layer?",
    a: "Yes. Each layer is a standalone product. Community works without Academy. Market works without Work. All platforms share your identity and data, but none require the others to function."
  },
  {
    q: "How does multi-tenant isolation work?",
    a: "Each workspace is fully isolated with role-based permissions (Owner, Admin, Member, Viewer). Teams collaborate without data leakage. An enterprise can run multiple isolated workspaces under one billing account — each with custom permissions and branding."
  },
  {
    q: "When will the mobile app launch?",
    a: "A React Native super app is planned for Phase 7 — covering community, learning, commerce, and AI assistant in one mobile experience. A PWA version will ship before native apps to get mobile access faster."
  },
];

const STATUS_MAP: Record<string, string> = {
  live: "live", soon: "building", planned: "planned"
};

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate  = useNavigate();
  const [openFaq, setOpenFaq]     = useState<number | null>(null);
  const [scrolled, setScrolled]   = useState(false);
  const [logoError, setLogoError] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const [barsVisible, setBarsVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Animate progress bars when section enters viewport
  useEffect(() => {
    if (!progressRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setBarsVisible(true); },
      { threshold: 0.3 }
    );
    obs.observe(progressRef.current);
    return () => obs.disconnect();
  }, []);

  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      <style>{css}</style>
      <div className="lp">
        <div className="lp-grid-bg" />

        {/* ── NAV ── */}
        <nav className={`lp-nav${scrolled ? " scrolled" : ""}`}>
          <a href="/" className="lp-nav-brand">
            {!logoError ? (
              <img src="/logo.jpg" alt="Winners Ecosystem"
                className="lp-nav-logo"
                onError={() => setLogoError(true)} />
            ) : (
              <div className="lp-nav-logo-fallback">W</div>
            )}
            <div className="lp-nav-wordmark">
              <div className="lp-nav-name">Winners Ecosystem</div>
              <div className="lp-nav-sub">Digital Sovereign Infrastructure</div>
            </div>
          </a>

          <ul className="lp-nav-links">
            <li><a href="#platforms" onClick={e => { e.preventDefault(); scrollTo("platforms"); }}>Platforms</a></li>
            <li><a href="#build"     onClick={e => { e.preventDefault(); scrollTo("build"); }}>Build Status</a></li>
            <li><a href="#pricing"   onClick={e => { e.preventDefault(); scrollTo("pricing"); }}>Pricing</a></li>
            <li><a href="#faq"       onClick={e => { e.preventDefault(); scrollTo("faq"); }}>FAQ</a></li>
          </ul>

          <div className="lp-nav-right">
            <div className="lp-nav-status">
              <div className="lp-nav-status-dot" />
              Core Engine Live
            </div>
            <button className="lp-nav-btn" onClick={() => navigate("/login")}>
              Enter →
            </button>
          </div>
        </nav>

        {/* ── ECOSYSTEM CONTEXT BAR ── */}
        <div className="lp-context-bar" style={{ marginTop: 64 }}>
          <div className="lp-context-inner">
            <div className="lp-context-label">Ecosystem</div>
            {PLATFORMS.map(p => (
              <div className="lp-context-item" key={p.name}>
                <div className={`lp-context-dot ${STATUS_MAP[p.status]}`} />
                <span className="lp-context-name">{p.name}</span>
                <span className="lp-context-pct">{p.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── HERO ── */}
        <section className="lp-hero">
          <div className="lp-hero-glow" />
          <div className="lp-hero-glow2" />

          <div className="lp-hero-eyebrow">
            Digital Sovereign Infrastructure · Phase 2 of 8 Active
          </div>

          {!logoError ? (
            <img src="/logo.jpg" alt="Winners Ecosystem"
              className="lp-hero-logo"
              onError={() => setLogoError(true)} />
          ) : (
            <div className="lp-hero-logo-fallback">⬡</div>
          )}

          <h1 className="lp-hero-title">
            One <em>Ecosystem</em>
          </h1>
          <div className="lp-hero-sub">Six Platforms. One Intelligence.</div>

          <p className="lp-hero-desc">
            A Central Digital Operating System that owns, hosts, governs, and intelligently
            orchestrates multiple platform-products — Community, Learning, Commerce, Work, and AI —
            all unified under one identity, one billing engine, and one AI core.
          </p>

          <div className="lp-hero-actions">
            <button className="lp-btn-primary" onClick={() => navigate("/login")}>
              Join the Ecosystem
            </button>
            <button className="lp-btn-ghost" onClick={() => scrollTo("platforms")}>
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
              <div className="lp-metric-value">8</div>
              <div className="lp-metric-label">Build Phases</div>
            </div>
            <div className="lp-metric">
              <div className="lp-metric-value">AI</div>
              <div className="lp-metric-label">Orchestrated</div>
            </div>
          </div>

          <div className="lp-scroll-hint">
            <div className="lp-scroll-line" />
            <span>Scroll to explore</span>
          </div>
        </section>

        {/* ── ECOSYSTEM OS BAND ── */}
        <div className="lp-os-band">
          <div className="lp-os-label">The Core Concept</div>
          <h2 className="lp-os-title">
            Not a website. Not a SaaS.<br /><em>A Digital Operating System.</em>
          </h2>
          <p className="lp-os-desc">
            Winners Ecosystem is infrastructure. Every platform layer — Community, Academy, Market,
            Work, Intelligence — runs on the same brain. One account. One billing system. One AI core
            that connects them all and makes them smarter together than they are apart.
          </p>
          <div className="lp-os-pillars">
            <span className="lp-os-pill blue">🧑‍🤝‍🧑 Connect</span>
            <span className="lp-os-pill gold">🎓 Learn</span>
            <span className="lp-os-pill green">💰 Earn</span>
            <span className="lp-os-pill blue">🛒 Sell</span>
            <span className="lp-os-pill purple">🤖 Automate</span>
            <span className="lp-os-pill gold">🌍 Scale</span>
          </div>
        </div>

        {/* ── ARCHITECTURE DIAGRAM ── */}
        <div className="lp-arch">
          <div className="lp-section-eyebrow">Architecture</div>
          <h2 className="lp-section-title" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}>
            Three zones. One system.
          </h2>
          <div className="lp-arch-box">
            <div className="lp-arch-ai">┌──────────────────────────────────────────────┐</div>
            <div className="lp-arch-ai">│         🤖  AI ORCHESTRATION LAYER            │</div>
            <div className="lp-arch-ai">│      The Soul — connects and drives all        │</div>
            <div className="lp-arch-ai">└──────────────────────┬───────────────────────┘</div>
            <div className="lp-arch-dim">                       │</div>
            <div className="lp-arch-core">┌──────────────────────▼───────────────────────┐</div>
            <div className="lp-arch-core">│                 ⬡  THE CORE                  │</div>
            <div className="lp-arch-core">│          Identity · Billing · Analytics        │</div>
            <div className="lp-arch-core">│            API Gateway · Governance            │</div>
            <div className="lp-arch-core">└──┬───┬───┬───┬───┬──────────────────────────┘</div>
            <div className="lp-arch-dim">   │   │   │   │   │</div>
            <div className="lp-arch-layer">  [Community] [Academy] [Market] [Work] [Cloud]</div>
            <div className="lp-arch-dim">   │   │   │   │   │</div>
            <div className="lp-arch-green">┌──▼───▼───▼───▼───▼──────────────────────────┐</div>
            <div className="lp-arch-green">│           🌐  PLATFORM LAYERS                │</div>
            <div className="lp-arch-green">│    Standalone products. Unified by core.      │</div>
            <div className="lp-arch-green">└──────────────────────────────────────────────┘</div>
          </div>
        </div>

        {/* ── PLATFORM LAYERS ── */}
        <section className="lp-section" id="platforms">
          <div className="lp-section-header">
            <div className="lp-section-eyebrow">Ecosystem Platforms</div>
            <h2 className="lp-section-title">
              Six platforms.<br /><em>One ecosystem.</em>
            </h2>
            <p className="lp-section-desc">
              Each layer is a standalone product and a monetizable business. Built sequentially,
              connected by the AI core, evolved continuously.
            </p>
          </div>
          <div className="lp-platforms-grid">
            {PLATFORMS.map(p => (
              <div key={p.name} className={`lp-platform-card ${p.status}`}>
                <div className="lp-platform-header">
                  <div className="lp-platform-icon">{p.icon}</div>
                  <span className={`lp-platform-badge ${p.status}`}>
                    {p.status === "live"    ? "● Live"    :
                     p.status === "soon"   ? "⟳ Building" :
                                             "◌ Planned"}
                  </span>
                </div>
                <div className="lp-platform-phase">{p.phase}</div>
                <div className="lp-platform-name">{p.name}</div>
                <div className="lp-platform-desc">{p.desc}</div>
                <div className="lp-platform-tags">
                  {p.tags.map(tag => (
                    <span key={tag} className="lp-platform-tag">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── AGENTIC LOOP ── */}
        <div className="lp-loop-section">
          <div className="lp-section-eyebrow">The Agentic Loop</div>
          <h2 className="lp-section-title" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300, textAlign: "center" }}>
            Every action feeds the next.<br /><em>The ecosystem compounds.</em>
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.8, maxWidth: 580, margin: "0 auto", textAlign: "center" }}>
            Winners Intelligence connects all platforms into one reinforcing loop. Your activity in
            Community becomes your curriculum in Academy. Your certificate becomes your job listing.
            Your income becomes your market. Every loop makes you more valuable.
          </p>
          <div className="lp-loop-steps">
            {AGENTIC_LOOP.map((step, i) => (
              <>
                <div className="lp-loop-step" key={step.label}>
                  <div className="lp-loop-icon">{step.icon}</div>
                  <div className="lp-loop-step-label">{step.label}</div>
                </div>
                {i < AGENTIC_LOOP.length - 1 && (
                  <div className="lp-loop-arrow" key={`arrow-${i}`}>→</div>
                )}
              </>
            ))}
          </div>
        </div>

        {/* ── FEATURES ── */}
        <section className="lp-features-section" id="features">
          <div className="lp-section-header">
            <div className="lp-section-eyebrow">Core Capabilities</div>
            <h2 className="lp-section-title">
              Built for scale.<br /><em>From day one.</em>
            </h2>
            <p className="lp-section-desc">
              The Core Engine isn't a feature — it's the foundation every platform layer runs on.
              Built once, never abandoned.
            </p>
          </div>
          <div className="lp-features-grid">
            {FEATURES.map(f => (
              <div key={f.num} className="lp-feature">
                <div className="lp-feature-num">{f.num}</div>
                <div className="lp-feature-icon">{f.icon}</div>
                <div className="lp-feature-title">{f.title}</div>
                <div className="lp-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── BUILD PROGRESS ── */}
        <div className="lp-progress-band" id="build" ref={progressRef}>
          <div className="lp-section-eyebrow">Build Status · February 2026</div>
          <h2 className="lp-section-title" style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}>
            Phase 2 of 8. <em>Active build.</em>
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-dim)", maxWidth: 520, margin: "0 auto" }}>
            Transparent progress. Every layer tracked. Shipped in order. Never abandoned.
          </p>
          <div className="lp-progress-grid">
            {PLATFORMS.map(p => (
              <div className="lp-progress-item" key={p.name}>
                <div className="lp-progress-name">{p.icon} {p.name}</div>
                <div className={`lp-progress-status ${STATUS_MAP[p.status]}`}>
                  {p.status === "live" ? "● Live" : p.status === "soon" ? "⟳ Building" : "◌ Planned"}
                </div>
                <div className="lp-progress-pct">{p.pct}% complete</div>
                <div className="lp-progress-bar-track">
                  <div
                    className={`lp-progress-bar-fill ${STATUS_MAP[p.status]}`}
                    style={{ width: barsVisible ? `${p.pct}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── PRICING ── */}
        <section className="lp-pricing-section" id="pricing">
          <div className="lp-section-eyebrow">Pricing</div>
          <h2 className="lp-section-title">
            One account.<br /><em>Every platform.</em>
          </h2>
          <p className="lp-section-desc" style={{ margin: "0 auto" }}>
            All plans give you access to the full ecosystem as each layer launches.
            No per-platform pricing. One subscription covers everything.
          </p>
          <div className="lp-pricing-grid">
            {PLANS.map(plan => (
              <div key={plan.name} className={`lp-plan${plan.featured ? " featured" : ""}`}>
                {plan.featured && <div className="lp-plan-badge">Most Popular</div>}
                <div className="lp-plan-name">{plan.name}</div>
                <div className="lp-plan-tagline">{plan.tagline}</div>
                <div className="lp-plan-price-row">
                  {plan.price !== "0" && <div className="lp-plan-currency">$</div>}
                  <div className="lp-plan-price">{plan.price === "0" ? "Free" : plan.price}</div>
                </div>
                <div className="lp-plan-period">{plan.period}</div>
                <div className="lp-plan-divider" />
                <ul className="lp-plan-features">
                  {plan.features.map(f => (
                    <li key={f.label} className="lp-plan-feature">
                      <span className={f.yes ? "lp-plan-check" : "lp-plan-x"}>
                        {f.yes ? "✓" : "–"}
                      </span>
                      <span style={{ color: f.yes ? "var(--text-dim)" : "var(--text-faint)" }}>
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>
                <button className="lp-plan-btn" onClick={() => navigate("/login")}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </section>

        <div className="lp-divider" />

        {/* ── FAQ ── */}
        <section className="lp-section" id="faq">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 80, alignItems: "start" }}>
            <div>
              <div className="lp-section-eyebrow">FAQ</div>
              <h2 className="lp-section-title">
                Common<br /><em>questions.</em>
              </h2>
              <p className="lp-section-desc">
                Everything you need to know about the ecosystem before joining.
              </p>
              <div style={{ marginTop: 36 }}>
                <button className="lp-btn-primary" onClick={() => navigate("/login")}>
                  Join Free Today
                </button>
              </div>
            </div>
            <div style={{ paddingTop: 12 }}>
              {FAQS.map((faq, i) => (
                <div key={i} className="lp-faq-item">
                  <button
                    className="lp-faq-question"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
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
          <p className="lp-cta-sub">One account. Six platforms. One intelligence core.</p>
          <div className="lp-hero-actions">
            <button className="lp-btn-primary" onClick={() => navigate("/login")}>
              Join the Ecosystem
            </button>
            <button className="lp-btn-ghost" onClick={() => navigate("/login")}>
              Sign In →
            </button>
          </div>
          <div className="lp-cta-tagline">
            "Infrastructure → Engagement → Value → Monetization → Intelligence → Scale."
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="lp-footer">
          <div className="lp-footer-top">
            <div>
              <div className="lp-footer-brand">
                {!logoError ? (
                  <img src="/logo.jpg" alt="Winners Ecosystem" className="lp-footer-logo"
                    onError={() => setLogoError(true)} />
                ) : (
                  <div style={{ width: 30, height: 30, borderRadius: 6, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⬡</div>
                )}
                <div className="lp-footer-brand-name">Winners Ecosystem</div>
              </div>
              <p className="lp-footer-tagline">
                A Central Digital Operating System. Six platforms, one identity, one AI intelligence
                core. Building the infrastructure for the next generation of creators, entrepreneurs,
                and digital businesses.
              </p>
              <div className="lp-footer-ecosystem-tag">
                <span style={{ color: "var(--green)", fontSize: 8 }}>●</span>
                Live on Railway · winners-empire-eco.up.railway.app
              </div>
            </div>
            <div>
              <div className="lp-footer-col-title">Platforms</div>
              <ul className="lp-footer-links">
                <li><a href="#platforms" onClick={e => { e.preventDefault(); scrollTo("platforms"); }}>Core Engine</a></li>
                <li><a href="#platforms" onClick={e => { e.preventDefault(); scrollTo("platforms"); }}>Winners Community</a></li>
                <li><a href="#platforms" onClick={e => { e.preventDefault(); scrollTo("platforms"); }}>Winners Academy</a></li>
                <li><a href="#platforms" onClick={e => { e.preventDefault(); scrollTo("platforms"); }}>Winners Market</a></li>
                <li><a href="#platforms" onClick={e => { e.preventDefault(); scrollTo("platforms"); }}>Winners Intelligence</a></li>
                <li><a href="#platforms" onClick={e => { e.preventDefault(); scrollTo("platforms"); }}>Winners Work</a></li>
              </ul>
            </div>
            <div>
              <div className="lp-footer-col-title">Product</div>
              <ul className="lp-footer-links">
                <li><a href="#features"  onClick={e => { e.preventDefault(); scrollTo("features"); }}>Features</a></li>
                <li><a href="#build"     onClick={e => { e.preventDefault(); scrollTo("build"); }}>Build Status</a></li>
                <li><a href="#pricing"   onClick={e => { e.preventDefault(); scrollTo("pricing"); }}>Pricing</a></li>
                <li><a href="#faq"       onClick={e => { e.preventDefault(); scrollTo("faq"); }}>FAQ</a></li>
                <li><a href="/login"     onClick={e => { e.preventDefault(); navigate("/login"); }}>Sign In</a></li>
              </ul>
            </div>
            <div>
              <div className="lp-footer-col-title">Ecosystem</div>
              <ul className="lp-footer-links">
                <li><a href="#">Phase 1 — Core ✅</a></li>
                <li><a href="#">Phase 2 — Community 🔄</a></li>
                <li><a href="#">Phase 3 — Academy 🔄</a></li>
                <li><a href="#">Phase 4 — Market 📋</a></li>
                <li><a href="#">Phase 5 — Intelligence 📋</a></li>
                <li><a href="#">Phase 6–8 — Planned 📋</a></li>
              </ul>
            </div>
          </div>
          <div className="lp-footer-divider" />
          <div className="lp-footer-bottom">
            <div className="lp-footer-copy">
              © 2024–2026 <span>Winners Ecosystem</span> · Digital Sovereign Infrastructure · Built with discipline.
            </div>
            <div className="lp-footer-legal">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">API Docs</a>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}