// src/features/landing/LandingPage.tsx
// Phase: Cross-cutting · Layer: Core Engine / Public Face
// Updated: Complete brand alignment with Winners Ecosystem Digital Sovereign Infrastructure
// Now with customizable theming and content via config

import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../lib/api";
import { defaultConfig, type LandingPageConfig } from "../../config/landingConfig";
import {
  detectBrowserCountry,
  getLandingDirection,
  getLandingLocalePack,
  resolveLandingLocale,
} from "../../lib/landingLocalization";

interface LandingPageProps {
  config?: Partial<LandingPageConfig>;
}

type PublicEcosystemSettings = Partial<LandingPageConfig> & {
  language?: string;
  adaptiveLanguage?: boolean;
  countryLanguageMapping?: Array<{ country: string; language: string }>;
};

function assignDefined(target: Record<string, unknown>, source?: Record<string, unknown>) {
  if (!source) return;
  for (const [key, value] of Object.entries(source)) {
    if (value !== undefined) {
      target[key] = value;
    }
  }
}

const generateCSS = (config: LandingPageConfig) => `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --gold:    ${config.theme.primary};
    --gold2:   ${config.theme.primaryHover};
    --gold3:   ${config.theme.accent};
    --gold-dim: ${config.theme.accentDim};
    --blue:    ${config.theme.secondary};
    --blue2:   ${config.theme.secondary};
    --ice:     ${config.theme.secondary};
    --green:   #2dd4a0;
    --purple:  #9b6fff;
    --red:     #ef4444;
    --bg:      ${config.theme.background};
    --surface: ${config.theme.surface};
    --surface2:${config.theme.surface2};
    --border:  ${config.theme.border};
    --border2: rgba(30,50,72,0.6);
    --text:    ${config.theme.text};
    --text-dim:${config.theme.textDim};
    --text-faint: ${config.theme.textFaint};
  }

  html { scroll-behavior: smooth; }
  body { background: ${config.theme.background}; }

  .lp {
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=Space+Mono:wght@400;700&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --gold:    var(--gold);
    --gold2:   var(--gold);
    --gold3:   var(--gold);
    --gold-dim: rgba(201,168,76,0.08);
    --blue:    var(--blue);
    --blue2:   var(--blue);
    --ice:     var(--ice);
    --green:   var(--green);
    --purple:  var(--purple);
    --red:     var(--red);
    --bg:      var(--bg);
    --surface: var(--surface);
    --surface2:var(--surface2);
    --border:  var(--border);
    --border2: rgba(30,50,72,0.6);
    --text:    var(--text);
    --text-dim:var(--text-dim);
    --text-faint: var(--border);
  }

  html { scroll-behavior: smooth; }
  body { background: #0f1826; }

  .lp {
    background:
      radial-gradient(circle at top, rgba(137,196,225,0.12), transparent 28%),
      linear-gradient(180deg, #122033 0%, #0d1726 56%, #09111b 100%);
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
      linear-gradient(rgba(137,196,225,0.045) 1px, transparent 1px),
      linear-gradient(90deg, rgba(137,196,225,0.045) 1px, transparent 1px);
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
    background: rgba(18,32,51,0.92);
    backdrop-filter: blur(24px);
    border-bottom: 1px solid rgba(30,50,72,0.8);
    transition: border-color 0.3s;
  }
  .lp-nav.scrolled { border-bottom-color: rgba(201,168,76,0.15); }

  .lp-nav-brand { display: flex; align-items: center; gap: 12px; text-decoration: none; }
  .lp-nav-logo {
    width: 28px; height: 28px; border-radius: 6px;
    object-fit: cover;
    border: 1.5px solid rgba(201,168,76,0.4);
    box-shadow: 0 0 12px rgba(201,168,76,0.12);
  }
  .lp-nav-logo-fallback {
    width: 28px; height: 28px; border-radius: 6px;
    background: linear-gradient(135deg, var(--gold3), var(--blue));
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 800; color: var(--bg);
    border: 1.5px solid rgba(201,168,76,0.4);
  }
  .lp-nav-wordmark { line-height: 1.1; }
  .lp-nav-name { font-size: 13px; font-weight: 800; color: var(--text); letter-spacing: -0.2px; }
  .lp-nav-sub { font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 2.5px; text-transform: uppercase; color: var(--gold); }

  .lp-nav-links { display: flex; align-items: center; gap: 28px; list-style: none; }
  .lp-nav-links a {
    font-family: 'Space Mono', monospace; font-size: 9.5px;
    letter-spacing: 0.1em; text-transform: uppercase;
    color: rgba(242,247,252,0.78); text-decoration: none; transition: color 0.2s;
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
      rgba(137,196,225,0.18) 0%,
      rgba(201,168,76,0.08) 40%,
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
    background: linear-gradient(135deg, var(--surface) 0%, var(--bg) 100%);
    border: 2.5px solid rgba(201,168,76,0.5);
    box-shadow: 0 0 48px rgba(201,168,76,0.2);
    display: flex; align-items: center; justify-content: center;
    font-size: 40px; margin-bottom: 36px;
    animation: fadeUp 0.6s ease both;
  }

  .lp-hero-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(56px, 9vw, 120px);
    font-weight: 300; line-height: 0.9;
    letter-spacing: -0.02em; color: var(--text);
    margin-bottom: 10px;
    animation: fadeUp 0.7s ease 0.15s both;
  }
  .lp-hero-title em { font-style: italic; color: var(--gold); }

  .lp-hero-sub {
    font-family: 'Syne', sans-serif;
    font-size: clamp(24px, 3.5vw, 48px);
    font-weight: 300; font-style: italic;
    color: #b9e3f5; line-height: 1.1; margin-bottom: 32px;
    animation: fadeUp 0.7s ease 0.25s both;
  }

  .lp-hero-desc {
    font-size: 15px; color: rgba(242,247,252,0.8); line-height: 1.8;
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
    border: 1px solid rgba(137,196,225,0.22);
    border-radius: 4px; overflow: hidden;
    animation: fadeUp 0.7s ease 0.55s both;
  }
  .lp-metric {
    padding: 18px 36px; text-align: center;
    border-right: 1px solid var(--border);
    background: rgba(26,42,61,0.74);
  }
  .lp-metric:last-child { border-right: none; }
  .lp-metric-value {
    font-family: 'Syne', sans-serif;
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
    font-family: 'Syne', sans-serif;
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
     HOW IT WORKS
  ═══════════════════════════════════════════ */
  .lp-how-it-works {
    padding: 100px 48px;
    background: var(--surface);
    border-bottom: 1px solid var(--border);
    text-align: center;
  }
  .lp-how-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32px;
    max-width: 1100px;
    margin: 48px auto 0;
  }
  .lp-how-step {
    padding: 32px;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    transition: transform 0.3s ease;
  }
  .lp-how-step:hover {
    transform: translateY(-8px);
    border-color: var(--gold);
  }
  .lp-how-num {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--gold-dim);
    border: 1px solid var(--gold);
    color: var(--gold);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Space Mono', monospace;
    font-weight: 700;
  }
  .lp-how-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--text);
  }
  .lp-how-desc {
    font-size: 14px;
    color: var(--text-dim);
    line-height: 1.6;
  }

  /* ═══════════════════════════════════════════
     COMPANY & SERVICES
  ═══════════════════════════════════════════ */
  .lp-company-section {
    padding: 100px 48px;
    background: linear-gradient(180deg, var(--bg) 0%, var(--surface2) 100%);
    border-bottom: 1px solid var(--border);
  }
  .lp-company-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 80px;
    max-width: 1200px;
    margin: 0 auto;
    align-items: center;
  }
  .lp-company-mission {
    font-family: 'Syne', sans-serif;
    font-size: 32px;
    font-style: italic;
    color: var(--gold);
    line-height: 1.4;
    margin-bottom: 24px;
  }
  .lp-company-body {
    font-size: 16px;
    color: var(--text-dim);
    line-height: 1.8;
  }
  .lp-services-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .lp-service-item {
    padding: 24px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
  }
  .lp-service-title {
    font-family: 'Space Mono', monospace;
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .lp-service-desc {
    font-size: 12px;
    color: var(--text-dim);
    line-height: 1.6;
  }

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
    font-family: 'Syne', sans-serif;
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
    font-family: 'Syne', sans-serif; font-size: 22px;
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
    font-family: 'Syne', sans-serif; font-size: 48px;
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
    font-family: 'Syne', sans-serif; font-size: 28px;
    font-weight: 400; color: var(--text); margin-bottom: 6px;
  }
  .lp-plan-tagline {
    font-family: 'Space Mono', monospace; font-size: 9px;
    color: var(--text-dim); letter-spacing: 0.08em; margin-bottom: 24px;
  }
  .lp-plan-price-row { display: flex; align-items: baseline; gap: 4px; margin-bottom: 6px; }
  .lp-plan-currency { font-size: 18px; color: var(--gold); font-weight: 600; margin-top: 4px; }
  .lp-plan-price { font-family: 'Syne', sans-serif; font-size: 52px; font-weight: 800; color: var(--text); line-height: 1; }
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
    font-family: 'Syne', sans-serif; font-size: 24px;
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
    font-family: 'Syne', sans-serif;
    font-size: clamp(36px, 5.5vw, 72px);
    font-weight: 300; color: var(--text); line-height: 1.05; margin-bottom: 16px;
  }
  .lp-cta-title em { font-style: italic; color: var(--gold); }
  .lp-cta-sub {
    font-family: 'Space Mono', monospace; font-size: 10px;
    color: var(--text-dim); letter-spacing: 0.12em; margin-bottom: 44px;
  }
  .lp-cta-tagline {
    font-family: 'Syne', sans-serif; font-size: 20px;
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
  .lp-footer-social { display: flex; gap: 12px; margin-top: 16px; }
  .lp-social-link {
    width: 36px; height: 36px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center;
    background: var(--surface2); border: 1px solid var(--border);
    color: var(--text-dim); font-size: 14px;
    text-decoration: none; transition: all 0.2s;
  }
  .lp-social-link:hover {
    border-color: var(--gold); color: var(--gold);
    transform: translateY(-2px);
  }
  .lp-contact-info { margin-top: 16px; font-size: 12px; color: var(--text-dim); line-height: 1.8; }
  .lp-contact-info a { color: var(--gold); text-decoration: none; }
  .lp-contact-info a:hover { text-decoration: underline; }

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

  /* ═══════════════════════════════════════════
     AI INTELLIGENCE TICKER
  ═══════════════════════════════════════════ */
  @keyframes lp-ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
  @keyframes lp-neural-pulse { 0%, 100% { opacity: 0.6; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }
  @keyframes lp-float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-6px); } }

  .lp-ai-ticker {
    background: rgba(8,14,26,0.8); border-top: 1px solid rgba(155,111,255,0.15);
    border-bottom: 1px solid rgba(155,111,255,0.15); overflow: hidden;
    height: 36px; display: flex; align-items: center;
    position: relative;
  }
  .lp-ai-ticker::before,
  .lp-ai-ticker::after {
    content: ''; position: absolute; top: 0; bottom: 0; width: 80px; z-index: 2; pointer-events: none;
  }
  .lp-ai-ticker::before { left: 0; background: linear-gradient(90deg, rgba(8,14,26,1), transparent); }
  .lp-ai-ticker::after  { right: 0; background: linear-gradient(-90deg, rgba(8,14,26,1), transparent); }
  .lp-ai-ticker-label {
    position: absolute; left: 16px; z-index: 3;
    font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 2px;
    text-transform: uppercase; color: var(--purple); white-space: nowrap;
    background: rgba(8,14,26,0.9); padding: 0 8px;
  }
  .lp-ai-ticker-track { display: flex; width: max-content; animation: lp-ticker 30s linear infinite; }
  .lp-ai-ticker-item {
    display: flex; align-items: center; gap: 6px; padding: 0 24px;
    font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); white-space: nowrap;
  }
  .lp-ai-ticker-item .dot { width: 4px; height: 4px; border-radius: 50%; background: var(--green); }
  .lp-ai-ticker-item .dot.ai { background: var(--purple); }
  .lp-ai-ticker-item .dot.gold { background: var(--gold); }

  /* ═══════════════════════════════════════════
     NEURAL NETWORK NODES (Hero Background)
  ═══════════════════════════════════════════ */
  .lp-neural-bg {
    position: absolute; inset: 0; pointer-events: none; overflow: hidden; z-index: 0;
  }
  .lp-neural-node {
    position: absolute; border-radius: 50%;
    background: radial-gradient(circle, rgba(155,111,255,0.3) 0%, transparent 70%);
    animation: lp-neural-pulse 3s ease-in-out infinite;
  }
  .lp-neural-line {
    position: absolute; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(155,111,255,0.08), transparent);
    transform-origin: left center;
  }

  /* ═══════════════════════════════════════════
     INTELLIGENCE PROOF STRIP
  ═══════════════════════════════════════════ */
  .lp-intel-strip {
    display: flex; align-items: center; justify-content: center; gap: 32px; flex-wrap: wrap;
    padding: 20px 48px; margin-bottom: 0;
    border-top: 1px solid var(--border);
  }
  .lp-intel-stat {
    display: flex; flex-direction: column; align-items: center; gap: 2px; text-align: center;
  }
  .lp-intel-stat-val {
    font-family: 'Syne', sans-serif; font-size: 22px; font-weight: 800; color: var(--gold);
    letter-spacing: -0.5px;
  }
  .lp-intel-stat-lbl {
    font-family: 'Space Mono', monospace; font-size: 8px; color: var(--text-dim);
    letter-spacing: 1px; text-transform: uppercase;
  }
  .lp-intel-divider { width: 1px; height: 40px; background: var(--border); }
  @media (max-width: 768px) { .lp-intel-strip { gap: 20px; padding: 16px 24px; } .lp-intel-divider { display: none; } }

  /* ═══════════════════════════════════════════
     TRUSTED BY SECTION
  ═══════════════════════════════════════════ */
  .lp-trusted {
    padding: 48px 48px; text-align: center;
    border-top: 1px solid var(--border);
    border-bottom: 1px solid var(--border);
    background: var(--surface);
  }
  .lp-trusted-label {
    font-family: 'Space Mono', monospace; font-size: 9px;
    letter-spacing: 0.25em; text-transform: uppercase;
    color: var(--text-dim); margin-bottom: 24px;
  }
  .lp-trusted-logos {
    display: flex; align-items: center; justify-content: center;
    gap: 48px; flex-wrap: wrap; opacity: 0.7;
  }
  .lp-trusted-logo {
    font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700;
    color: var(--text-dim); letter-spacing: -0.5px;
    transition: opacity 0.2s;
  }
  .lp-trusted-logo:hover { opacity: 1; }
  @media (max-width: 600px) { .lp-trusted { padding: 32px 24px; } .lp-trusted-logos { gap: 24px; } }

  /* ═══════════════════════════════════════════
     TESTIMONIALS
  ═══════════════════════════════════════════ */
  .lp-testimonials {
    padding: 100px 48px;
    background: linear-gradient(180deg, var(--bg) 0%, var(--surface2) 100%);
    border-bottom: 1px solid var(--border);
  }
  .lp-testimonials-grid {
    display: grid; grid-template-columns: repeat(3, 1fr);
    gap: 28px; max-width: 1200px; margin: 48px auto 0;
  }
  .lp-testimonial {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 8px; padding: 28px;
    transition: all 0.3s ease;
  }
  .lp-testimonial:hover {
    transform: translateY(-4px);
    border-color: var(--gold3);
  }
  .lp-testimonial-quote {
    font-size: 14px; color: var(--text-dim); line-height: 1.8;
    margin-bottom: 20px; font-style: italic;
  }
  .lp-testimonial-author {
    display: flex; align-items: center; gap: 12px;
  }
  .lp-testimonial-avatar {
    width: 42px; height: 42px; border-radius: 50%;
    background: linear-gradient(135deg, var(--gold), var(--blue));
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; color: var(--bg); font-size: 14px;
  }
  .lp-testimonial-name {
    font-size: 13px; font-weight: 700; color: var(--text);
  }
  .lp-testimonial-role {
    font-family: 'Space Mono', monospace; font-size: 9px;
    color: var(--text-dim); letter-spacing: 0.05em;
  }
  @media (max-width: 900px) { .lp-testimonials-grid { grid-template-columns: 1fr; } }

  /* Regulation overrides: simplify landing composition */
  .lp-nav,
  .lp-hero,
  .lp-trusted,
  .lp-testimonials,
  .lp-footer {
    border-color: var(--border);
  }

  .lp-nav-btn,
  .lp-btn-primary,
  .lp-btn-ghost,
  .lp-plan-btn,
  .lp-faq-question {
    border-radius: 999px;
    min-height: 44px;
  }

  .lp-hero-title,
  .lp-section-title,
  .lp-cta-title,
  .lp-panel-title {
    font-family: 'Syne', sans-serif !important;
    font-weight: 800 !important;
    letter-spacing: -0.04em;
    line-height: 1.02;
  }

  .lp-hero-sub,
  .lp-section-desc,
  .lp-panel-desc,
  .lp-testimonial-quote,
  .lp-footer-tagline {
    line-height: 1.5;
  }

  .lp-platform-card,
  .lp-plan,
  .lp-testimonial,
  .lp-faq-item,
  .lp-service-item {
    border-radius: 18px;
  }

  .lp-nav,
  .lp-context-bar,
  .lp-hero,
  .lp-os-band,
  .lp-how-it-works,
  .lp-company-section,
  .lp-arch,
  .lp-section,
  .lp-loop-section,
  .lp-features-section,
  .lp-progress-band,
  .lp-pricing-section,
  .lp-testimonials,
  .lp-cta-band,
  .lp-footer {
    padding-inline: clamp(16px, 4vw, 48px);
  }
`;

// ─── COMPONENT ───────────────────────────────────────────────────────────────

export default function LandingPage({ config: userConfig }: LandingPageProps = {}) {
  const [runtimeSettings, setRuntimeSettings] = useState<PublicEcosystemSettings | null>(null);
  const [localeCode, setLocaleCode] = useState("en");

  useEffect(() => {
    const controller = new AbortController();
    const country = detectBrowserCountry();

    async function loadPublicSettings() {
      try {
        const response = await fetch(`${API_BASE}/public/ecosystem-settings?country=${encodeURIComponent(country)}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;

        const body = (await response.json().catch(() => ({}))) as {
          settings?: PublicEcosystemSettings;
          resolvedLanguage?: string;
          countryLanguageMapping?: Array<{ country: string; language: string }>;
        };
        if (controller.signal.aborted) return;

        const settings = body.settings ?? {};
        setRuntimeSettings(settings);

        const language = settings.adaptiveLanguage === false
          ? (settings.language ?? "en")
          : body.resolvedLanguage ?? resolveLandingLocale(settings.language ?? "en", country, body.countryLanguageMapping ?? settings.countryLanguageMapping ?? []);

        setLocaleCode(language || "en");
      } catch {
        if (!controller.signal.aborted) {
          setRuntimeSettings(null);
          setLocaleCode("en");
        }
      }
    }

    void loadPublicSettings();
    return () => controller.abort();
  }, []);

  const localePack = useMemo(() => getLandingLocalePack(localeCode), [localeCode]);

  const config = useMemo(() => {
    const merged = {
      ...defaultConfig,
      theme: { ...defaultConfig.theme },
      branding: { ...defaultConfig.branding },
      nav: { ...defaultConfig.nav, links: [...defaultConfig.nav.links] },
      sections: { ...defaultConfig.sections },
      hero: { ...defaultConfig.hero, metrics: [...defaultConfig.hero.metrics] },
      trustedBy: { ...defaultConfig.trustedBy, companies: [...defaultConfig.trustedBy.companies] },
      ecosystemBand: { ...defaultConfig.ecosystemBand, pillars: [...defaultConfig.ecosystemBand.pillars] },
      howItWorks: { ...defaultConfig.howItWorks, steps: [...defaultConfig.howItWorks.steps] },
      company: { ...defaultConfig.company, services: [...defaultConfig.company.services] },
      architecture: { ...defaultConfig.architecture },
      platforms: {
        ...defaultConfig.platforms,
        items: defaultConfig.platforms.items.map((item) => ({ ...item, tags: [...item.tags] })),
      },
      agenticLoop: { ...defaultConfig.agenticLoop, steps: [...defaultConfig.agenticLoop.steps] },
      features: { ...defaultConfig.features, items: [...defaultConfig.features.items] },
      buildProgress: { ...defaultConfig.buildProgress },
      pricing: {
        ...defaultConfig.pricing,
        plans: defaultConfig.pricing.plans.map((plan) => ({ ...plan, features: plan.features.map((feature) => ({ ...feature })) })),
      },
      testimonials: { ...defaultConfig.testimonials, items: [...defaultConfig.testimonials.items] },
      faq: { ...defaultConfig.faq, items: [...defaultConfig.faq.items] },
      cta: { ...defaultConfig.cta },
      footer: {
        ...defaultConfig.footer,
        platformLinks: [...defaultConfig.footer.platformLinks],
        productLinks: [...defaultConfig.footer.productLinks],
        ecosystemLinks: [...defaultConfig.footer.ecosystemLinks],
        socialLinks: { ...defaultConfig.footer.socialLinks },
        legalLinks: [...defaultConfig.footer.legalLinks],
      },
    };

    if (runtimeSettings) {
      merged.theme.primary = runtimeSettings.brandColor ?? merged.theme.primary;
      merged.theme.primaryHover = runtimeSettings.brandColor ?? merged.theme.primaryHover;
      merged.theme.accent = runtimeSettings.accentColor ?? merged.theme.accent;
      merged.theme.secondary = runtimeSettings.accentColor ?? merged.theme.secondary;
      merged.theme.background = runtimeSettings.defaultTheme === "light" ? "#f7fafc" : merged.theme.background;
      merged.theme.surface = runtimeSettings.defaultTheme === "light" ? "#ffffff" : merged.theme.surface;
      merged.theme.surface2 = runtimeSettings.defaultTheme === "light" ? "#f1f5f9" : merged.theme.surface2;
      merged.theme.text = runtimeSettings.defaultTheme === "light" ? "#0f172a" : merged.theme.text;
      merged.theme.textDim = runtimeSettings.defaultTheme === "light" ? "#475569" : merged.theme.textDim;
      merged.theme.border = runtimeSettings.defaultTheme === "light" ? "rgba(15,23,42,0.12)" : merged.theme.border;
    }

    const localeOverrides = {
      nav: {
        statusText: localePack.nav?.statusText,
        ctaText: localePack.nav?.ctaText,
      },
      hero: {
        eyebrow: localePack.hero?.eyebrow,
        subtitle: localePack.hero?.subtitle,
        description: localePack.hero?.description,
        ctaPrimary: localePack.hero?.ctaPrimary,
        ctaSecondary: localePack.hero?.ctaSecondary,
      },
      trustedBy: localePack.trustedBy,
      ecosystemBand: localePack.ecosystemBand,
      cta: localePack.cta,
      footer: localePack.footer,
    };

    if (userConfig) {
      assignDefined(merged.theme as Record<string, unknown>, userConfig.theme as Record<string, unknown> | undefined);
      assignDefined(merged.branding as Record<string, unknown>, userConfig.branding as Record<string, unknown> | undefined);
      assignDefined(merged.nav as Record<string, unknown>, userConfig.nav as Record<string, unknown> | undefined);
      assignDefined(merged.sections as Record<string, unknown>, userConfig.sections as Record<string, unknown> | undefined);
      assignDefined(merged.hero as Record<string, unknown>, userConfig.hero as Record<string, unknown> | undefined);
      assignDefined(merged.trustedBy as Record<string, unknown>, userConfig.trustedBy as Record<string, unknown> | undefined);
      assignDefined(merged.ecosystemBand as Record<string, unknown>, userConfig.ecosystemBand as Record<string, unknown> | undefined);
      assignDefined(merged.cta as Record<string, unknown>, userConfig.cta as Record<string, unknown> | undefined);
      assignDefined(merged.footer as Record<string, unknown>, userConfig.footer as Record<string, unknown> | undefined);
    }
    assignDefined(merged.nav as Record<string, unknown>, localeOverrides.nav as Record<string, unknown> | undefined);
    assignDefined(merged.hero as Record<string, unknown>, localeOverrides.hero as Record<string, unknown> | undefined);
    assignDefined(merged.trustedBy as Record<string, unknown>, localeOverrides.trustedBy as Record<string, unknown> | undefined);
    assignDefined(merged.ecosystemBand as Record<string, unknown>, localeOverrides.ecosystemBand as Record<string, unknown> | undefined);
    assignDefined(merged.cta as Record<string, unknown>, localeOverrides.cta as Record<string, unknown> | undefined);
    assignDefined(merged.footer as Record<string, unknown>, localeOverrides.footer as Record<string, unknown> | undefined);
    return merged;
  }, [localePack, runtimeSettings, userConfig]);

  const navigate  = useNavigate();
  const [openFaq, setOpenFaq]     = useState<number | null>(null);
  const [scrolled, setScrolled]   = useState(false);
  const [logoError, setLogoError] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const [barsVisible, setBarsVisible] = useState(false);

  const css = useMemo(() => generateCSS(config), [config]);

  useEffect(() => {
    document.documentElement.lang = localeCode;
    document.documentElement.dir = getLandingDirection(localeCode);
  }, [localeCode]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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

  const StatusMap: Record<string, string> = {
    live: "live", soon: "building", building: "building", planned: "planned"
  };

  return (
    <>
      <style>{css}</style>
      <div className="lp">
        <div className="lp-grid-bg" />

        {/* ── NAV ── */}
        {config.sections.hero !== false && (
        <nav className={`lp-nav${scrolled ? " scrolled" : ""}`}>
          <a href="/" className="lp-nav-brand">
            {!logoError && config.branding.logo ? (
              <img src={config.branding.logo} alt={config.branding.name}
                className="lp-nav-logo"
                onError={() => setLogoError(true)} />
            ) : (
              <div className="lp-nav-logo-fallback">{config.branding.logoFallback || "W"}</div>
            )}
            <div className="lp-nav-wordmark">
              <div className="lp-nav-name">{config.branding.name}</div>
              <div className="lp-nav-sub">{config.branding.tagline}</div>
            </div>
          </a>

          <ul className="lp-nav-links">
            {config.nav.links.map((link, i) => (
              <li key={i}><a href={link.href} onClick={e => { e.preventDefault(); scrollTo(link.href.replace("#", "")); }}>{link.label}</a></li>
            ))}
          </ul>

          <div className="lp-nav-right">
            {config.nav.showStatus && (
              <div className="lp-nav-status">
                <div className="lp-nav-status-dot" />
                {config.nav.statusText}
              </div>
            )}
            <button className="lp-nav-btn" onClick={() => navigate(config.nav.ctaLink)}>
              {config.nav.ctaText}
            </button>
          </div>
        </nav>
        )}

        {/* ── ECOSYSTEM CONTEXT BAR ── */}
        {config.sections.contextBar && (
        <div className="lp-context-bar" style={{ marginTop: config.sections.hero !== false ? 64 : 0 }}>
          <div className="lp-context-inner">
            <div className="lp-context-label">Ecosystem</div>
            {config.platforms.items.map(p => (
              <div className="lp-context-item" key={p.name}>
                <div className={`lp-context-dot ${StatusMap[p.status]}`} />
                <span className="lp-context-name">{p.name}</span>
                <span className="lp-context-pct">{p.pct}%</span>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* ── HERO ── */}
        {config.sections.hero && (
        <section className="lp-hero">
          <div className="lp-hero-glow" />
          <div className="lp-hero-glow2" />

          <div className="lp-hero-eyebrow">
            {config.hero.eyebrow}
          </div>

          {!logoError && config.branding.logo ? (
            <img src={config.branding.logo} alt={config.branding.name}
              className="lp-hero-logo"
              onError={() => setLogoError(true)} />
          ) : (
            <div className="lp-hero-logo-fallback">{config.branding.logoFallback || "⬡"}</div>
          )}

          <h1 className="lp-hero-title">
            {config.hero.title.split(config.hero.titleHighlight).map((part, i, arr) => (
              <>{part}{i < arr.length - 1 && <em>{config.hero.titleHighlight}</em>}</>
            ))}
          </h1>
          <div className="lp-hero-sub">{config.hero.subtitle}</div>

          <p className="lp-hero-desc">
            {config.hero.description}
          </p>

          <div className="lp-hero-actions">
            <button className="lp-btn-primary" onClick={() => navigate(config.nav.ctaLink)}>
              {config.hero.ctaPrimary}
            </button>
            <button className="lp-btn-ghost" onClick={() => scrollTo("how-it-works")}>
              {config.hero.ctaSecondary}
            </button>
          </div>

          <div className="lp-hero-metrics">
            {config.hero.metrics.map((m, i) => (
              <div className="lp-metric" key={i}>
                <div className="lp-metric-value">{m.value}</div>
                <div className="lp-metric-label">{m.label}</div>
              </div>
            ))}
          </div>

          <div className="lp-scroll-hint">
            <div className="lp-scroll-line" />
            <span>Scroll to explore</span>
          </div>
        </section>
        )}

        {/* ── TRUSTED BY ── */}
        {config.sections.trustedBy && (
        <div className="lp-trusted">
          <div className="lp-trusted-label">{config.trustedBy.label}</div>
          <div className="lp-trusted-logos">
            {config.trustedBy.companies.map((c, i) => (
              <span key={i} className="lp-trusted-logo">{c}</span>
            ))}
          </div>
        </div>
        )}

        {/* ── ECOSYSTEM OS BAND ── */}
        {config.sections.ecosystemBand && (
        <div className="lp-os-band">
          <div className="lp-os-label">{config.ecosystemBand.label}</div>
          <h2 className="lp-os-title">
            {config.ecosystemBand.title.split(config.ecosystemBand.titleHighlight).map((part, i, arr) => (<>{part}{i < arr.length - 1 && <em>{config.ecosystemBand.titleHighlight}</em>}</>))}
          </h2>
          <p className="lp-os-desc">{config.ecosystemBand.description}</p>
          <div className="lp-os-pillars">
            {config.ecosystemBand.pillars.map((pill, i) => (
              <span key={i} className={`lp-os-pill ${pill.color}`}>{pill.icon} {pill.label}</span>
            ))}
          </div>
        </div>
        )}

        {/* ── HOW IT WORKS ── */}
        {config.sections.howItWorks && (
        <section className="lp-how-it-works" id="how-it-works">
          <div className="lp-section-eyebrow">{config.howItWorks.eyebrow}</div>
          <h2 className="lp-section-title">How to <em>{config.howItWorks.titleHighlight}</em></h2>
          <p className="lp-section-desc" style={{ margin: '0 auto' }}>
            {config.howItWorks.description}
          </p>
          
          <div className="lp-how-grid">
            {config.howItWorks.steps.map((step, i) => (
              <div className="lp-how-step" key={i}>
                <div className="lp-how-num">{step.num}</div>
                <div className="lp-how-title">{step.title}</div>
                <div className="lp-how-desc">{step.description}</div>
              </div>
            ))}
          </div>
        </section>
        )}

        {/* ── THE COMPANY & SERVICES ── */}
        {config.sections.company && (
        <section className="lp-company-section" id="company">
          <div className="lp-company-grid">
            <div className="lp-company-content">
              <div className="lp-section-eyebrow">{config.company.eyebrow}</div>
              <h2 className="lp-section-title">{config.company.title.split(config.company.titleHighlight).map((part, i, arr) => (<>{part}{i < arr.length - 1 && <em>{config.company.titleHighlight}</em>}</>))}</h2>
              <p className="lp-company-mission">{config.company.mission}</p>
              <div className="lp-company-body">
                <p style={{ marginBottom: 20 }}>{config.company.description.split('. ')[0]}.</p>
                <p>{config.company.description.split('. ').slice(1).join('. ')}</p>
              </div>
            </div>

            <div className="lp-services-list">
              {config.company.services.map((service, i) => (
                <div className="lp-service-item" key={i}>
                  <div className="lp-service-title">{service.title}</div>
                  <div className="lp-service-desc">{service.description}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
        )}

        {/* ── ARCHITECTURE DIAGRAM ── */}
        {config.sections.architecture && (
        <div className="lp-arch">
          <div className="lp-section-eyebrow">{config.architecture.eyebrow}</div>
          <h2 className="lp-section-title" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800 }}>
            {config.architecture.title}
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
        )}

        {/* ── PLATFORM LAYERS ── */}
        {config.sections.platforms && (
        <section className="lp-section" id="platforms">
          <div className="lp-section-header">
            <div className="lp-section-eyebrow">{config.platforms.eyebrow}</div>
            <h2 className="lp-section-title">
              {config.platforms.title.split(config.platforms.titleHighlight).map((part, i, arr) => (<>{part}{i < arr.length - 1 && <em>{config.platforms.titleHighlight}</em>}</>))}
            </h2>
            <p className="lp-section-desc">{config.platforms.description}</p>
          </div>
          <div className="lp-platforms-grid">
            {config.platforms.items.map(p => (
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
        )}

        {/* ── AGENTIC LOOP ── */}
        {config.sections.agenticLoop && (
        <div className="lp-loop-section">
          <div className="lp-section-eyebrow">{config.agenticLoop.eyebrow}</div>
          <h2 className="lp-section-title" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, textAlign: "center" }}>
            {config.agenticLoop.title.split(config.agenticLoop.titleHighlight).map((part, i, arr) => (<>{part}{i < arr.length - 1 && <em>{config.agenticLoop.titleHighlight}</em>}</>))}
          </h2>
          <p style={{ fontSize: 14, color: "var(--text-dim)", lineHeight: 1.8, maxWidth: 580, margin: "0 auto", textAlign: "center" }}>
            {config.agenticLoop.description}
          </p>
          <div className="lp-loop-steps">
            {config.agenticLoop.steps.map((step, i) => (
              <><div className="lp-loop-step" key={step.label}>
                <div className="lp-loop-icon">{step.icon}</div>
                <div className="lp-loop-step-label">{step.label}</div>
              </div>
              {i < config.agenticLoop.steps.length - 1 && <div className="lp-loop-arrow" key={`arrow-${i}`}>→</div>}</>
            ))}
          </div>
        </div>
        )}

        {/* ── FEATURES ── */}
        {config.sections.features && (
        <section className="lp-features-section" id="features">
          <div className="lp-section-header">
            <div className="lp-section-eyebrow">{config.features.eyebrow}</div>
            <h2 className="lp-section-title">
              {config.features.title.split(config.features.titleHighlight).map((part, i, arr) => (<>{part}{i < arr.length - 1 && <em>{config.features.titleHighlight}</em>}</>))}
            </h2>
            <p className="lp-section-desc">{config.features.description}</p>
          </div>
          <div className="lp-features-grid">
            {config.features.items.map(f => (
              <div key={f.num} className="lp-feature">
                <div className="lp-feature-num">{f.num}</div>
                <div className="lp-feature-icon">{f.icon}</div>
                <div className="lp-feature-title">{f.title}</div>
                <div className="lp-feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>
        )}

        {/* ── BUILD PROGRESS ── */}
        {config.sections.buildProgress && (
        <div className="lp-progress-band" id="build" ref={progressRef}>
          <div className="lp-section-eyebrow">{config.buildProgress.eyebrow}</div>
          <h2 className="lp-section-title" style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800 }}>
            {config.buildProgress.title.split(config.buildProgress.titleHighlight).map((part, i, arr) => (<>{part}{i < arr.length - 1 && <em>{config.buildProgress.titleHighlight}</em>}</>))}
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-dim)", maxWidth: 520, margin: "0 auto" }}>{config.buildProgress.description}</p>
          <div className="lp-progress-grid">
            {config.platforms.items.map(p => (
              <div className="lp-progress-item" key={p.name}>
                <div className="lp-progress-name">{p.icon} {p.name}</div>
                <div className={`lp-progress-status ${StatusMap[p.status]}`}>
                  {p.status === "live" ? "● Live" : p.status === "soon" ? "⟳ Building" : "◌ Planned"}
                </div>
                <div className="lp-progress-pct">{p.pct}% complete</div>
                <div className="lp-progress-bar-track">
                  <div
                    className={`lp-progress-bar-fill ${StatusMap[p.status]}`}
                    style={{ width: barsVisible ? `${p.pct}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* ── PRICING ── */}
        {config.sections.pricing && (
        <section className="lp-pricing-section" id="pricing">
          <div className="lp-section-eyebrow">{config.pricing.eyebrow}</div>
          <h2 className="lp-section-title">
            {config.pricing.title.split(config.pricing.titleHighlight).map((part, i, arr) => (<>{part}{i < arr.length - 1 && <em>{config.pricing.titleHighlight}</em>}</>))}
          </h2>
          <p className="lp-section-desc" style={{ margin: "0 auto" }}>{config.pricing.description}</p>
          <div className="lp-pricing-grid">
            {config.pricing.plans.map(plan => (
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
                  {plan.features.map((f, i) => (
                    <li key={i} className="lp-plan-feature">
                      <span className={f.included ? "lp-plan-check" : "lp-plan-x"}>
                        {f.included ? "✓" : "–"}
                      </span>
                      <span style={{ color: f.included ? "var(--text-dim)" : "var(--text-faint)" }}>
                        {f.label}
                      </span>
                    </li>
                  ))}
                </ul>
                <button className="lp-plan-btn" onClick={() => navigate(config.nav.ctaLink)}>
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </section>
        )}

        <div className="lp-divider" />

        {/* ── TESTIMONIALS ── */}
        {config.sections.testimonials && (
        <section className="lp-testimonials">
          <div className="lp-section-eyebrow">{config.testimonials.eyebrow}</div>
          <h2 className="lp-section-title">
            {config.testimonials.title.split(config.testimonials.titleHighlight).map((part, i, arr) => (<>{part}{i < arr.length - 1 && <em>{config.testimonials.titleHighlight}</em>}</>))}
          </h2>
          <p className="lp-section-desc" style={{ margin: "0 auto", textAlign: "center" }}>{config.testimonials.description}</p>
          <div className="lp-testimonials-grid">
            {config.testimonials.items.map((t, i) => (
              <div key={i} className="lp-testimonial">
                <div className="lp-testimonial-quote">"{t.quote}"</div>
                <div className="lp-testimonial-author">
                  <div className="lp-testimonial-avatar">{t.name.charAt(0)}</div>
                  <div>
                    <div className="lp-testimonial-name">{t.name}</div>
                    <div className="lp-testimonial-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
        )}

        {/* ── FAQ ── */}
        {config.sections.faq && (
        <section className="lp-section" id="faq">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 80, alignItems: "start" }}>
            <div>
              <div className="lp-section-eyebrow">{config.faq.eyebrow}</div>
              <h2 className="lp-section-title">
                {config.faq.title.split(config.faq.titleHighlight).map((part, i, arr) => (<>{part}{i < arr.length - 1 && <em>{config.faq.titleHighlight}</em>}</>))}
              </h2>
              <p className="lp-section-desc">{config.faq.description}</p>
              <div style={{ marginTop: 36 }}>
                <button className="lp-btn-primary" onClick={() => navigate(config.nav.ctaLink)}>
                  {config.faq.cta}
                </button>
              </div>
            </div>
            <div style={{ paddingTop: 12 }}>
              {config.faq.items.map((faq, i) => (
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
        )}

        {/* ── CTA BAND ── */}
        {config.sections.cta && (
        <div className="lp-cta-band">
          <h2 className="lp-cta-title">
            {config.cta.title.split(config.cta.titleHighlight).map((part, i, arr) => (<>{part}{i < arr.length - 1 && <em>{config.cta.titleHighlight}</em>}</>))}
          </h2>
          <p className="lp-cta-sub">{config.cta.subtitle}</p>
          <div className="lp-hero-actions">
            <button className="lp-btn-primary" onClick={() => navigate(config.nav.ctaLink)}>
              {config.cta.ctaPrimary}
            </button>
            <button className="lp-btn-ghost" onClick={() => scrollTo("platforms")}>
              {config.cta.ctaSecondary}
            </button>
          </div>
          <div className="lp-cta-tagline">
            {config.cta.tagline}
          </div>
        </div>
        )}

        {/* ── FOOTER ── */}
        {config.sections.footer && (
        <footer className="lp-footer">
          <div className="lp-footer-top">
            <div>
              <div className="lp-footer-brand">
                {!logoError && config.branding.logo ? (
                  <img src={config.branding.logo} alt={config.branding.name} className="lp-footer-logo"
                    onError={() => setLogoError(true)} />
                ) : (
                  <div style={{ width: 30, height: 30, borderRadius: 10, background: "var(--surface2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⬡</div>
                )}
                <div className="lp-footer-brand-name">{config.branding.name}</div>
              </div>
              <p className="lp-footer-tagline">{config.footer.tagline}</p>
              <div className="lp-footer-social">
                {config.footer.socialLinks.twitter && (
                  <a href={config.footer.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="lp-social-link" title="Twitter/X">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </a>
                )}
                {config.footer.socialLinks.linkedin && (
                  <a href={config.footer.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="lp-social-link" title="LinkedIn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                  </a>
                )}
                {config.footer.socialLinks.github && (
                  <a href={config.footer.socialLinks.github} target="_blank" rel="noopener noreferrer" className="lp-social-link" title="GitHub">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                  </a>
                )}
                {config.footer.socialLinks.discord && (
                  <a href={config.footer.socialLinks.discord} target="_blank" rel="noopener noreferrer" className="lp-social-link" title="Discord">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
                  </a>
                )}
                {config.footer.socialLinks.instagram && (
                  <a href={config.footer.socialLinks.instagram} target="_blank" rel="noopener noreferrer" className="lp-social-link" title="Instagram">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678a6.162 6.162 0 100 12.324 6.162 6.162 0 100-12.324zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405a1.441 1.441 0 01-2.88 0 1.44 1.44 0 012.88 0z"/></svg>
                  </a>
                )}
                {config.footer.socialLinks.youtube && (
                  <a href={config.footer.socialLinks.youtube} target="_blank" rel="noopener noreferrer" className="lp-social-link" title="YouTube">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
                  </a>
                )}
              </div>
              <div className="lp-contact-info">
                <div>Contact us:</div>
                <div><a href={`mailto:${config.branding.supportEmail}`}>{config.branding.supportEmail}</a></div>
                <div><a href={config.branding.websiteUrl}>{config.branding.websiteUrl.replace(/^https?:\/\//, '')}</a></div>
              </div>
            </div>
            <div>
              <div className="lp-footer-col-title">Platforms</div>
              <ul className="lp-footer-links">
                {config.footer.platformLinks.map((link, i) => (
                  <li key={i}><a href={link.href} onClick={e => { e.preventDefault(); scrollTo(link.href.replace("#", "")); }}>{link.label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <div className="lp-footer-col-title">Product</div>
              <ul className="lp-footer-links">
                {config.footer.productLinks.map((link, i) => (
                  <li key={i}><a href={link.href} onClick={e => { e.preventDefault(); scrollTo(link.href.replace("#", "")); }}>{link.label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <div className="lp-footer-col-title">Ecosystem</div>
              <ul className="lp-footer-links">
                {config.footer.ecosystemLinks.map((link, i) => (
                  <li key={i}><a href={link.href}>{link.label}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="lp-footer-divider" />
          <div className="lp-footer-bottom">
            <div className="lp-footer-copy">
              {config.footer.copyright}
            </div>
            <div className="lp-footer-legal">
              {config.footer.legalLinks.map((link, i) => (
                <a key={i} href={link.href}>{link.label}</a>
              ))}
            </div>
          </div>
        </footer>
        )}

      </div>
    </>
  );
}
