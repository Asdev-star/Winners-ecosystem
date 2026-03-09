// Phase: Cross-cutting · Layer: Core Engine / Engineering Standards
// Winners Ecosystem — UI Architecture Quality Framework
// Zero Tailwind · CSS variables only · Winners design system
// Inspired by premium design: ambient lighting, pip animations, sophisticated typography

import { useState } from "react";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Space+Mono:wght@400;700&family=Syne:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { scroll-behavior: smooth; }

  .wa-root {
    background: var(--bg);
    color: var(--text);
    font-family: 'Syne', sans-serif;
    min-height: 100vh;
    position: relative;
    overflow-x: hidden;
  }

  /* Ambient top glow */
  .wa-ambient-top {
    position: fixed;
    top: -200px;
    left: 50%;
    transform: translateX(-50%);
    width: 900px;
    height: 500px;
    background: radial-gradient(ellipse at center, rgba(201,168,76,0.06) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  /* Grid texture */
  .wa-grid-bg {
    position: fixed;
    inset: 0;
    z-index: 0;
    pointer-events: none;
    background-image:
      linear-gradient(rgba(30,50,72,0.18) 1px, transparent 1px),
      linear-gradient(90deg, rgba(30,50,72,0.18) 1px, transparent 1px);
    background-size: 48px 48px;
  }

  /* Page wrap */
  .wa-page-wrap {
    position: relative;
    z-index: 1;
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 32px 120px;
  }

  /* HEADER */
  .wa-header {
    padding: 72px 0 80px;
    text-align: center;
  }

  .wa-eyebrow {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    letter-spacing: 0.35em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
  }
  .wa-eyebrow::before, .wa-eyebrow::after {
    content: '';
    width: 48px;
    height: 1px;
  }
  .wa-eyebrow::before { background: linear-gradient(90deg, transparent, var(--gold)); }
  .wa-eyebrow::after  { background: linear-gradient(90deg, var(--gold), transparent); }

  .wa-header-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(44px, 6vw, 82px);
    font-weight: 300;
    line-height: 1.04;
    letter-spacing: -0.02em;
    margin-bottom: 10px;
  }
  .wa-header-title em {
    font-style: italic;
    color: var(--gold);
  }

  .wa-header-sub {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(17px, 2.2vw, 24px);
    font-weight: 300;
    font-style: italic;
    color: var(--text-dim);
    margin-bottom: 36px;
  }

  .wa-header-meta {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--text-dim);
    display: flex;
    justify-content: center;
    gap: 28px;
    flex-wrap: wrap;
  }
  .wa-header-meta span {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .wa-header-meta span::before {
    content: '';
    width: 5px;
    height: 5px;
    border-radius: 50%;
    background: var(--gold);
    opacity: 0.55;
  }

  /* STATUS STRIP */
  .wa-status-strip {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    flex-wrap: wrap;
    padding: 14px 24px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    margin-bottom: 72px;
    position: relative;
    overflow: hidden;
  }
  .wa-status-strip::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--gold), transparent);
  }

  .wa-sdot {
    display: flex;
    align-items: center;
    gap: 7px;
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    white-space: nowrap;
    padding: 4px 10px;
    border-radius: 3px;
    border: 1px solid var(--border);
  }
  .wa-sdot .wa-pip {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .wa-sdot.live  { color:var(--green); background:rgba(45,212,160,0.05); border-color:rgba(45,212,160,0.18); }
  .wa-sdot.live .wa-pip { background:var(--green); box-shadow:0 0 6px var(--green); animation:wa-pip-pulse 2s infinite; }
  .wa-sdot.build { color:var(--gold);  background:rgba(201,168,76,0.05); border-color:rgba(201,168,76,0.18); }
  .wa-sdot.build .wa-pip { background:var(--gold); }
  .wa-sdot.plan  { color:var(--text-dim); }
  .wa-sdot.plan .wa-pip { background:var(--text-dim); }
  .wa-sdiv { width:1px; height:14px; background:var(--border); flex-shrink:0; }

  @keyframes wa-pip-pulse {
    0%,100%{opacity:1}
    50%{opacity:0.35}
  }

  /* SECTION LABEL */
  .wa-sec-label {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.42em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 14px;
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .wa-sec-label::after {
    content:'';
    flex:1;
    height:1px;
    background:linear-gradient(90deg, var(--border), transparent);
  }

  .wa-sec-intro {
    font-family: 'Cormorant Garamond', serif;
    font-size: 17px;
    font-weight: 300;
    font-style: italic;
    color: var(--text-dim);
    max-width: 660px;
    line-height: 1.65;
    margin-bottom: 60px;
  }

  /* LEVELS CONTAINER */
  .wa-levels {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  /* LEVEL CARD */
  .wa-lcard {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.25s;
    cursor: pointer;
  }
  .wa-lcard:hover { border-color: var(--border2); }

  /* Top accent */
  .wa-lcard::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
  }
  /* Left bar */
  .wa-lcard::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    width: 3px;
  }

  .wa-lcard.l1::before { background: linear-gradient(90deg, rgba(90,122,150,0.5), transparent); }
  .wa-lcard.l1::after  { background: rgba(90,122,150,0.25); }

  .wa-lcard.l2::before { background: linear-gradient(90deg, var(--ice), transparent); }
  .wa-lcard.l2::after  { background: linear-gradient(180deg, var(--ice), transparent); }

  .wa-lcard.l3::before { background: linear-gradient(90deg, var(--gold), transparent); }
  .wa-lcard.l3::after  { background: linear-gradient(180deg, var(--gold), rgba(201,168,76,0.1)); }

  .wa-lcard.l4::before { background: linear-gradient(90deg, var(--purple), transparent); }
  .wa-lcard.l4::after  { background: linear-gradient(180deg, var(--purple), rgba(155,111,255,0.08)); }

  .wa-lcard.l5::before { background: linear-gradient(90deg, var(--green), var(--gold), transparent); }
  .wa-lcard.l5::after  { background: linear-gradient(180deg, var(--green), var(--gold)); }

  .wa-linner {
    padding: 36px 40px 32px 52px;
    cursor: pointer;
  }

  .wa-ltop {
    display: flex;
    align-items: flex-start;
    gap: 32px;
  }

  .wa-lnum-block {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
  }

  .wa-lnum {
    font-family: 'Cormorant Garamond', serif;
    font-size: 54px;
    font-weight: 300;
    font-style: italic;
    line-height: 1;
  }
  .wa-lcard.l1 .wa-lnum { color: var(--text-dim); }
  .wa-lcard.l2 .wa-lnum { color: var(--ice); }
  .wa-lcard.l3 .wa-lnum { color: var(--gold); }
  .wa-lcard.l4 .wa-lnum { color: var(--purple); }
  .wa-lcard.l5 .wa-lnum {
    background: linear-gradient(135deg, var(--green), var(--gold));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .wa-lnum-sub {
    font-family: 'Space Mono', monospace;
    font-size: 7px;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: var(--text-dim);
    text-align: center;
  }

  .wa-lmain {
    flex: 1;
    min-width: 0;
  }

  .wa-lheader {
    display: flex;
    align-items: baseline;
    gap: 14px;
    margin-bottom: 5px;
    flex-wrap: wrap;
  }

  .wa-lname {
    font-family: 'Syne', sans-serif;
    font-size: 21px;
    font-weight: 800;
    letter-spacing: -0.025em;
  }
  .wa-lcard.l1 .wa-lname { color: var(--text-mid); }
  .wa-lcard.l2 .wa-lname { color: var(--ice); }
  .wa-lcard.l3 .wa-lname { color: var(--gold); }
  .wa-lcard.l4 .wa-lname { color: var(--purple); }
  .wa-lcard.l5 .wa-lname {
    background: linear-gradient(90deg, var(--green), var(--gold));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .wa-lbadge {
    font-family: 'Space Mono', monospace;
    font-size: 8px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    padding: 3px 10px;
    border-radius: 2px;
    font-weight: 700;
  }
  .wa-lb-current  { background:rgba(201,168,76,0.1);  color:var(--gold);    border:1px solid rgba(201,168,76,0.22); }
  .wa-lb-baseline { background:rgba(137,196,225,0.08); color:var(--ice);     border:1px solid rgba(137,196,225,0.2); }
  .wa-lb-required { background:rgba(201,168,76,0.07);  color:var(--gold);    border:1px solid rgba(201,168,76,0.15); }
  .wa-lb-advanced { background:rgba(155,111,255,0.1);  color:var(--purple);  border:1px solid rgba(155,111,255,0.2); }
  .wa-lb-vision   { background:linear-gradient(135deg,rgba(45,212,160,0.1),rgba(201,168,76,0.1)); color:var(--green); border:1px solid rgba(45,212,160,0.2); }

  .wa-ltagline {
    font-family: 'Cormorant Garamond', serif;
    font-size: 15px;
    font-style: italic;
    font-weight: 300;
    color: var(--text-dim);
    margin-bottom: 14px;
    line-height: 1.5;
  }

  .wa-ldesc {
    font-size: 13.5px;
    line-height: 1.72;
    color: var(--text-mid);
    margin-bottom: 18px;
    max-width: 820px;
  }

  .wa-ldesc code {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: var(--gold);
  }

  /* Toggle button */
  .wa-ltoggle {
    display: flex;
    align-items: center;
    gap: 9px;
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--text-dim);
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: color 0.2s;
  }
  .wa-ltoggle:hover { color: var(--gold); }
  .wa-larrow {
    width: 18px;
    height: 18px;
    border: 1px solid var(--border2);
    border-radius: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    transition: transform 0.3s ease, border-color 0.2s;
  }
  .wa-ltoggle:hover .wa-larrow { border-color: var(--gold); }
  .wa-ltoggle.open .wa-larrow  { transform: rotate(180deg); }

  /* Expanded */
  .wa-lexp {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .wa-lexp.open { max-height: 1400px; }

  .wa-lexp-inner {
    padding: 0 40px 36px 52px;
    border-top: 1px solid var(--border);
    margin-top: 20px;
    padding-top: 28px;
  }

  /* Metrics row */
  .wa-mrow {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 20px;
  }
  .wa-mchip {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 16px;
    text-align: center;
  }
  .wa-mval {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
    font-weight: 600;
    line-height: 1;
    margin-bottom: 4px;
  }
  .wa-mlbl {
    font-family: 'Space Mono', monospace;
    font-size: 8px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--text-dim);
  }

  /* Detail grid */
  .wa-dgrid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 20px;
  }

  .wa-dblock {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 18px 20px;
  }

  .wa-dtitle {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .wa-dtitle::after {
    content:'';
    flex:1;
    height:1px;
    background:var(--border);
  }

  .wa-ditems {
    list-style:none;
    display:flex;
    flex-direction:column;
    gap:7px;
  }
  .wa-ditems li {
    font-size: 12.5px;
    color: var(--text-mid);
    display: flex;
    align-items: flex-start;
    gap: 9px;
    line-height: 1.5;
  }
  .wa-dicon {
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    border-radius: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 8px;
    margin-top: 1px;
  }
  .wa-ic-check { background:rgba(45,212,160,0.1);  color:var(--green); }
  .wa-ic-build  { background:rgba(201,168,76,0.1);  color:var(--gold); }
  .wa-ic-plan   { background:rgba(90,122,150,0.1);  color:var(--text-dim); }
  .wa-ic-warn   { background:rgba(224,90,78,0.1);   color:var(--red); }
  .wa-ic-ai     { background:rgba(155,111,255,0.1); color:var(--purple); }

  /* Chip row */
  .wa-chips {
    display: flex;
    gap: 7px;
    flex-wrap: wrap;
    margin-bottom: 0;
  }
  .wa-chip {
    font-family: 'Space Mono', monospace;
    font-size: 8px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 4px 12px;
    border-radius: 2px;
    background: var(--surface2);
    border: 1px solid var(--border2);
    color: var(--text-dim);
  }
  .wa-chip.gold   { border-color:rgba(201,168,76,0.3);   color:var(--gold); }
  .wa-chip.ice    { border-color:rgba(137,196,225,0.3);  color:var(--ice); }
  .wa-chip.purple { border-color:rgba(155,111,255,0.3);  color:var(--purple); }
  .wa-chip.green  { border-color:rgba(45,212,160,0.3);   color:var(--green); }
  .wa-chip.red    { border-color:rgba(224,90,78,0.3);    color:var(--red); }

  /* CONNECTOR */
  .wa-connector {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px 0;
    position: relative;
  }
  .wa-cline {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 1px;
    height: 30px;
    background: linear-gradient(180deg, var(--border), var(--border2));
  }
  .wa-clabel {
    font-family: 'Space Mono', monospace;
    font-size: 8px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--text-dim);
    background: var(--bg);
    padding: 2px 14px;
    border: 1px solid var(--border);
    border-radius: 2px;
    position: relative;
    z-index: 1;
  }

  /* ROADMAP */
  .wa-roadmap {
    margin-top: 80px;
  }

  .wa-rmap-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 2px;
  }

  .wa-rcell {
    background: var(--surface);
    border: 1px solid var(--border);
    padding: 26px 22px;
    position: relative;
    overflow: hidden;
    transition: background 0.2s;
  }
  .wa-rcell:hover { background: var(--surface2); }

  .wa-rcell::before {
    content:'';
    position:absolute;
    top:0;left:0;right:0;
    height:2px;
  }
  .wa-rcell.done::before   { background:linear-gradient(90deg, var(--green), transparent); }
  .wa-rcell.active::before { background:linear-gradient(90deg, var(--gold), transparent); }
  .wa-rcell.next::before   { background:linear-gradient(90deg, var(--ice), transparent); }
  .wa-rcell.future::before { background:linear-gradient(90deg, rgba(90,122,150,0.35), transparent); }

  .wa-rnum {
    font-family: 'Cormorant Garamond', serif;
    font-size: 38px;
    font-weight: 300;
    font-style: italic;
    line-height: 1;
    margin-bottom: 4px;
  }
  .wa-rcell.done   .wa-rnum { color:var(--green); }
  .wa-rcell.active .wa-rnum { color:var(--gold); }
  .wa-rcwa-rnum {ell.next   . color:var(--ice); }
  .wa-rcell.future .wa-rnum { color:var(--text-dim); }

  .wa-rtitle {
    font-family: 'Syne', sans-serif;
    font-size: 12px;
    font-weight: 700;
    margin-bottom: 6px;
  }
  .wa-rcell.done   .wa-rtitle { color:var(--green); }
  .wa-rcell.active .wa-rtitle { color:var(--gold); }
  .wa-rcell.next   .wa-rtitle { color:var(--ice); }
  .wa-rcell.future .wa-rtitle { color:var(--text-dim); }

  .wa-rsprint {
    font-family: 'Space Mono', monospace;
    font-size: 8px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 12px;
  }

  .wa-rtags {
    display:flex;
    flex-wrap:wrap;
    gap:4px;
  }
  .wa-rtag {
    font-family: 'Space Mono', monospace;
    font-size: 8px;
    letter-spacing: 0.04em;
    padding: 2px 7px;
    border-radius: 2px;
    background: var(--surface2);
    border: 1px solid var(--border);
    color: var(--text-dim);
  }

  /* MANIFESTO */
  .wa-manifesto {
    margin-top: 80px;
    padding: 60px 64px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    position: relative;
    overflow: hidden;
    text-align: center;
  }
  .wa-manifesto::before {
    content: '';
    position: absolute;
    top:0;
    left:0;
    right:0;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
  }
  .wa-manifesto::after {
    content: '';
    position: absolute;
    bottom: -100px;
    left: 50%;
    transform: translateX(-50%);
    width: 500px;
    height: 280px;
    background: radial-gradient(ellipse at center, rgba(201,168,76,0.05) 0%, transparent 70%);
    pointer-events: none;
  }

  .wa-mquote {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(19px, 2.8vw, 30px);
    font-weight: 300;
    font-style: italic;
    line-height: 1.55;
    color: var(--text);
    max-width: 800px;
    margin: 0 auto 20px;
    position: relative;
    z-index: 1;
  }
  .wa-mquote strong {
    font-weight: 600;
    color: var(--gold);
    font-style: normal;
  }

  .wa-mattr {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    color: var(--text-dim);
    position: relative;
    z-index: 1;
  }

  /* ANIMATIONS */
  @keyframes wa-fade-up {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }
  .wa-fi { opacity:0; animation: wa-fade-up 0.6s ease forwards; }
  .wa-fi-1 { animation-delay:0.05s; }
  .wa-fi-2 { animation-delay:0.15s; }
  .wa-fi-3 { animation-delay:0.25s; }
  .wa-fi-4 { animation-delay:0.35s; }
  .wa-fi-5 { animation-delay:0.45s; }
  .wa-fi-6 { animation-delay:0.55s; }
  .wa-fi-7 { animation-delay:0.65s; }
  .wa-fi-8 { animation-delay:0.75s; }

  /* RESPONSIVE */
  @media (max-width: 900px) {
    .wa-rmap-grid { grid-template-columns: repeat(3, 1fr); }
    .wa-dgrid     { grid-template-columns: 1fr; }
    .wa-mrow      { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 640px) {
    .wa-page-wrap { padding: 0 16px 80px; }
    .wa-linner    { padding: 24px 18px 22px 26px; }
    .wa-lexp-inner{ padding: 0 18px 24px 26px; padding-top: 24px; }
    .wa-lnum      { font-size: 40px; }
    .wa-rmap-grid { grid-template-columns: repeat(2, 1fr); }
    .wa-manifesto { padding: 36px 24px; }
  }
`;

// Level data structure
interface LevelItem {
  type: "check" | "build" | "plan" | "warn" | "ai";
  text: string;
}

interface LevelData {
  id: string;
  name: string;
  tagline: string;
  desc: string;
  badge: string;
  badgeClass: string;
  metrics: { val: string; label: string; color: string }[];
  panels: {
    violations?: LevelItem[];
    exitCriteria?: LevelItem[];
    architecture?: LevelItem[];
    componentLib?: LevelItem[];
    stores?: LevelItem[];
    hooks?: LevelItem[];
    intelligence?: LevelItem[];
    deployment?: LevelItem[];
    distribution?: LevelItem[];
  };
  chips: { text: string; class: string }[];
}

const LEVELS: LevelData[] = [
  {
    id: "l1",
    name: "Functional",
    tagline: "Pages that work, but do not yet speak the language of the ecosystem.",
    desc: `Data loads. Actions fire. Routes exist. But every page is structurally isolated — styles are duplicated inline, hex values are hardcoded throughout, there is no shared component vocabulary, and no architectural continuity between screens. The 219 lint errors in the live repository are the direct symptom of this level. This is survival code. It proves the idea, but it does not build the foundation.`,
    badge: "Current — Partial",
    badgeClass: "wa-lb-current",
    metrics: [
      { val: "219", label: "Lint Problems", color: "var(--red)" },
      { val: "0", label: "Test Files", color: "var(--text-dim)" },
      { val: "~50%", label: "Pages at this Level", color: "var(--text-dim)" },
    ],
    panels: {
      violations: [
        { type: "warn", text: "Hardcoded hex in CommunityPage.tsx" },
        { type: "warn", text: "Hardcoded hex in RevenueChart.tsx" },
        { type: "warn", text: "@ts-nocheck suppressing type errors sitewide" },
        { type: "warn", text: "no-explicit-any throughout backend routes" },
        { type: "warn", text: "Card pattern duplicated in every page file" },
        { type: "warn", text: "Context bar copy-pasted, not imported" },
        { type: "warn", text: "Intelligence routes unwired in App.tsx" },
      ],
      exitCriteria: [
        { type: "build", text: "All hardcoded hex replaced with CSS variables" },
        { type: "build", text: "@ts-nocheck eliminated across all files" },
        { type: "build", text: "Lint errors reduced below 50" },
        { type: "build", text: "Intelligence routes wired in App.tsx" },
        { type: "build", text: "chatRoutes mounted in Server/index.ts" },
        { type: "build", text: "Every existing page passes design checklist" },
      ],
    },
    chips: [
      { text: "Sprint 1 Priority", class: "red" },
      { text: "Design Sweep", class: "" },
      { text: "Lint Reduction", class: "" },
      { text: "Route Wiring", class: "" },
    ],
  },
  {
    id: "l2",
    name: "Consistent",
    tagline: "Every surface speaks the same visual language. No exceptions. No drift. Ever.",
    desc: `The design system is fully enforced across all existing pages. Every card carries the 6px radius and 2px gold gradient top border. Every label is Space Mono. Every heading is Cormorant Garamond. Every data value references a CSS variable. The ecosystem context bar appears on every page reflecting live layer health. Skeleton loaders have replaced all spinners. Empty states include an AI prompt CTA — never a blank "No data found" message.`,
    badge: "Non-Negotiable Baseline",
    badgeClass: "wa-lb-baseline",
    metrics: [
      { val: "12", label: "CSS Variables", color: "var(--ice)" },
      { val: "3", label: "Font Families", color: "var(--ice)" },
      { val: "8+", label: "Layer Dots in Context Bar", color: "var(--ice)" },
    ],
    panels: {
      violations: [
        { type: "check", text: "Card: 6px radius + 2px gold gradient top border" },
        { type: "check", text: "Ecosystem context bar — all 8 layer status dots" },
        { type: "check", text: "Skeleton shimmer (--surface2) — zero spinners anywhere" },
        { type: "check", text: "Empty states: illustration + AI assistant CTA" },
        { type: "check", text: "Transitions: 200ms ease — no abrupt state changes" },
        { type: "check", text: "Phase + Layer comment at top of every file" },
        { type: "check", text: "WCAG AA: 4.5:1 contrast, fully keyboard-navigable" },
        { type: "check", text: "Touch targets: minimum 44px on all mobile views" },
      ],
      architecture: [
        { type: "plan", text: "Cormorant Garamond — display headings, wt 300–600, italic gold accents" },
        { type: "plan", text: "Syne 700–800 — section titles, platform names" },
        { type: "plan", text: "Syne 400 — all body text, descriptions" },
        { type: "plan", text: "Space Mono 9–11px — labels, badges, metadata, uppercase + letter-spacing" },
      ],
    },
    chips: [
      { text: "CSS Variables Only", class: "ice" },
      { text: "Dark Mode Default", class: "ice" },
      { text: "Light Mode Optional", class: "ice" },
      { text: "Entrance Animations Staggered", class: "ice" },
    ],
  },
  {
    id: "l3",
    name: "Componentised",
    tagline: "One infrastructure. Eight expressions. Built once, deployed across the entire ecosystem.",
    desc: `The ecosystem vision — one identity across 8 platforms — only becomes structurally real when a shared component library exists. The card pattern, context bar, skeleton loader, empty state, progress ring, and command palette are currently duplicated page by page. Level 3 extracts them into a single source of truth. The single most impactful outcome: the AssistantPanel — built once, it deploys NOVA into Community, SAGE into Academy, ATLAS into Market, and CIRCUIT into Work simultaneously.`,
    badge: "Architecture Unlock",
    badgeClass: "wa-lb-required",
    metrics: [
      { val: "8", label: "Platforms share one component lib", color: "var(--gold)" },
      { val: "9", label: "AI assistants need AssistantPanel", color: "var(--gold)" },
      { val: "1×", label: "Write once, deploy everywhere", color: "var(--gold)" },
    ],
    panels: {
      componentLib: [
        { type: "build", text: "Card.tsx — the card pattern as a component" },
        { type: "build", text: "ContextBar.tsx — imported once, used everywhere" },
        { type: "build", text: "SkeletonLoader.tsx — animated shimmer, consistent" },
        { type: "build", text: "EmptyState.tsx — illustration + AI CTA" },
        { type: "build", text: "ProgressRing.tsx — SVG ring for profile and courses" },
        { type: "build", text: "Badge.tsx — layer, status, trust score badges" },
        { type: "build", text: "CommandPalette.tsx — ⌘K, global" },
      ],
      architecture: [
        { type: "ai", text: "AssistantPanel → CommunityPage (NOVA)" },
        { type: "ai", text: "AssistantPanel → CoursePage (SAGE)" },
        { type: "ai", text: "AssistantPanel → MarketPage (ATLAS)" },
        { type: "ai", text: "AssistantPanel → WorkPage (CIRCUIT)" },
        { type: "ai", text: "AssistantPanel → Intelligence (FORGE)" },
        { type: "ai", text: "AssistantPanel → Dashboard (OMEGA)" },
      ],
    },
    chips: [
      { text: "Radix UI Primitives", class: "gold" },
      { text: "Framer Motion", class: "gold" },
      { text: "Lucide Icons", class: "gold" },
    ],
  },
  {
    id: "l4",
    name: "State-Driven & Reactive",
    tagline: "When OMEGA fires, every layer listens. The UI becomes the nervous system of the ecosystem.",
    desc: `The Agentic Loop — the core value proposition — demands that events in one layer trigger visible, real-time responses in another. NOVA detecting a skill in Community should surface a recommendation badge on the Academy sidebar. OMEGA completing a cross-platform analysis should update the Wealth Dashboard while the user is reading a Work contract. This requires graduating from per-feature Zustand stores to an ecosystem-aware state architecture with an ecosystemStore at the centre.`,
    badge: "Agentic Loop Enabler",
    badgeClass: "wa-lb-advanced",
    metrics: [
      { val: "9", label: "Assistants share one store", color: "var(--purple)" },
      { val: "∞", label: "Cross-layer events", color: "var(--purple)" },
      { val: "1", label: "Unified notification stream", color: "var(--purple)" },
    ],
    panels: {
      stores: [
        { type: "check", text: "authStore.ts — JWT + Google OAuth + 2FA (built)" },
        { type: "check", text: "dashboardStore.ts — IPv6 + stale cache (built)" },
        { type: "check", text: "analyticsStore.ts — Revenue + forecast (built)" },
        { type: "build", text: "ecosystemStore.ts — Layer health, OMEGA events" },
        { type: "build", text: "assistantStore.ts — Active AI, streaming state" },
        { type: "build", text: "agenticLoopStore.ts — Current loop stage" },
        { type: "build", text: "notificationStore.ts — Unified inbox" },
      ],
      hooks: [
        { type: "build", text: "useMultimodalChat.ts — streaming + file upload" },
        { type: "build", text: "useAssistant.ts — context-injected per route" },
        { type: "build", text: "useAgenticLoop.ts — watch loop stage" },
        { type: "build", text: "useEcosystemHealth.ts — poll layer statuses" },
      ],
    },
    chips: [
      { text: "Zustand Subscriptions", class: "purple" },
      { text: "Socket.io Events", class: "purple" },
      { text: "SSE Streaming", class: "purple" },
      { text: "OMEGA Orchestrator", class: "purple" },
    ],
  },
  {
    id: "l5",
    name: "Intelligent & Self-Aware",
    tagline: "The UI does not just display the ecosystem. It participates in it. It knows the user.",
    desc: `At Level 5, every page is context-aware and AI-supervised. The floating AssistantPanel knows which page the user is on, what they did last, where they sit in the Agentic Loop, and adapts its intelligence accordingly. The ⌘K command palette suggests next actions based on the user's trust score and journey stage. Empty states on the Work page know whether the user holds an Academy certificate and change their CTA accordingly. OMEGA's daily briefing renders as an interactive intelligence card.`,
    badge: "The Vision",
    badgeClass: "wa-lb-vision",
    metrics: [
      { val: "9", label: "AI supervisors active", color: "var(--green)" },
      { val: "∞", label: "Self-optimising loops", color: "var(--green)" },
      { val: "0", label: "Manual interventions needed", color: "var(--green)" },
    ],
    panels: {
      intelligence: [
        { type: "check", text: "AssistantPanel receives currentRoute + userContext + loopStage" },
        { type: "check", text: "Every significant user action fires an event to AgenticLoop" },
        { type: "check", text: "OMEGA daily briefing: interactive card — user responds inline" },
        { type: "check", text: "⌘K suggests actions based on trust score and journey stage" },
        { type: "check", text: "Empty states are certificate-aware — CTA adapts per user state" },
        { type: "check", text: "Wealth Dashboard updates live as Work contracts close" },
      ],
      distribution: [
        { type: "plan", text: "Electron wrapper — auto-starts Ollama, offline-first" },
        { type: "plan", text: "Expo mobile app — voice input, camera, all 9 assistants" },
        { type: "plan", text: "PWA — install-to-homescreen, offline courses, FCM" },
        { type: "plan", text: "Data-Lite Mode — text-first for African market connectivity" },
      ],
    },
    chips: [
      { text: "OMEGA Orchestrator Live", class: "green" },
      { text: "Persistent AI Memory", class: "green" },
      { text: "Autonomous Actions", class: "green" },
      { text: "Agentic Loop Closed", class: "gold" },
    ],
  },
];

// Roadmap data
const ROADMAP = [
  { num: "I", title: "Design Sweep", sprint: "Sprint 1 · Now", status: "done", tags: ["Hex → CSS vars", "Lint ↓", "Route wiring"] },
  { num: "II", title: "Consistency Lock", sprint: "Sprint 1–2 · Baseline", status: "active", tags: ["All pages pass", "Context bar live", "Skeletons everywhere"] },
  { num: "III", title: "Component Library", sprint: "Sprint 2–3 · Architecture", status: "next", tags: ["Card.tsx", "AssistantPanel", "⌘K Palette"] },
  { num: "IV", title: "Reactive State", sprint: "Sprint 3–4 · Ecosystem", status: "future", tags: ["ecosystemStore", "assistantStore", "OMEGA events"] },
  { num: "V", title: "Intelligence Live", sprint: "Sprint 4+ · Vision", status: "future", tags: ["AI Platform", "Agentic Loop", "Digital Sovereignty"] },
];

export default function WinnersUIArchitectureLevels() {
  const [openLevel, setOpenLevel] = useState<string | null>("l2");

  const toggle = (id: string) => {
    setOpenLevel(openLevel === id ? null : id);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="wa-root">
        <div className="wa-ambient-top" />
        <div className="wa-grid-bg" />

        <div className="wa-page-wrap">
          {/* HEADER */}
          <header className="wa-header wa-fi wa-fi-1">
            <div className="wa-eyebrow">Winners Ecosystem · UI Architecture Framework</div>
            <h1 className="wa-header-title">
              The Five Levels of<br /><em>Interface Excellence</em>
            </h1>
            <p className="wa-header-sub">From functional code to sovereign digital infrastructure</p>
            <div className="wa-header-meta">
              <span>8 Platform Layers</span>
              <span>9 AI Assistants</span>
              <span>1 Design System</span>
              <span>African & Diaspora First</span>
            </div>
          </header>

          {/* STATUS STRIP */}
          <div className="wa-status-strip wa-fi wa-fi-2">
            <div className="wa-sdot live"><span className="wa-pip"></span>Core Engine</div>
            <div className="wa-sdiv"></div>
            <div className="wa-sdot build"><span className="wa-pip"></span>Community</div>
            <div className="wa-sdiv"></div>
            <div className="wa-sdot build"><span className="wa-pip"></span>Academy</div>
            <div className="wa-sdiv"></div>
            <div className="wa-sdot plan"><span className="wa-pip"></span>Market</div>
            <div className="wa-sdiv"></div>
            <div className="wa-sdot build"><span className="wa-pip"></span>Intelligence</div>
            <div className="wa-sdiv"></div>
            <div className="wa-sdot plan"><span className="wa-pip"></span>Work</div>
            <div className="wa-sdiv"></div>
            <div className="wa-sdot plan"><span className="wa-pip"></span>Mobile</div>
            <div className="wa-sdiv"></div>
            <div className="wa-sdot plan"><span className="wa-pip"></span>Cloud</div>
          </div>

          {/* INTRO */}
          <div className="wa-fi wa-fi-3">
            <div className="wa-sec-label">Architecture Quality Levels</div>
            <p className="wa-sec-intro">
              Five progressive tiers — from survival code to intelligent, self-aware infrastructure.
              The vision is Level 5. Every sprint moves the needle. Here is the complete map.
            </p>
          </div>

          {/* LEVELS */}
          <div className="wa-levels">
            {LEVELS.map((level, idx) => (
              <div key={level.id}>
                <div
                  className={`wa-lcard l${idx + 1} wa-fi wa-fi-${Math.min(idx + 3, 8)} ${openLevel === level.id ? "open" : ""}`}
                  onClick={() => toggle(level.id)}
                >
                  <div className="wa-linner">
                    <div className="wa-ltop">
                      <div className="wa-lnum-block">
                        <div className="wa-lnum">{idx + 1}</div>
                        <div className="wa-lnum-sub">Level</div>
                      </div>
                      <div className="wa-lmain">
                        <div className="wa-lheader">
                          <div className="wa-lname">{level.name}</div>
                          <span className={`wa-lbadge ${level.badgeClass}`}>{level.badge}</span>
                        </div>
                        <div className="wa-ltagline">{level.tagline}</div>
                        <div className="wa-ldesc">{level.desc}</div>
                        <button
                          className={`wa-ltoggle ${openLevel === level.id ? "open" : ""}`}
                          onClick={(e) => { e.stopPropagation(); toggle(level.id); }}
                        >
                          <div className="wa-larrow">{openLevel === level.id ? "↑" : "↓"}</div>
                          {openLevel === level.id ? "Hide detail" : "View technical detail"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded content */}
                  <div className={`wa-lexp ${openLevel === level.id ? "open" : ""}`}>
                    <div className="wa-lexp-inner">
                      {/* Metrics */}
                      <div className="wa-mrow">
                        {level.metrics.map((m, mi) => (
                          <div key={mi} className="wa-mchip">
                            <div className="wa-mval" style={{ color: m.color }}>{m.val}</div>
                            <div className="wa-mlbl">{m.label}</div>
                          </div>
                        ))}
                      </div>

                      {/* Detail grids */}
                      <div className="wa-dgrid">
                        {level.panels.violations && (
                          <div className="wa-dblock">
                            <div className="wa-dtitle" style={{ color: idx === 0 ? "var(--red)" : "var(--text-dim)" }}>
                              {idx === 0 ? "Confirmed Violations" : "Compliance Checklist"}
                            </div>
                            <ul className="wa-ditems">
                              {level.panels.violations.map((item, ii) => (
                                <li key={ii}>
                                  <span className={`wa-dicon wa-${item.type === "check" ? "ic-check" : item.type === "warn" ? "ic-warn" : "ic-plan"}`}>
                                    {item.type === "check" ? "✓" : item.type === "warn" ? "!" : "→"}
                                  </span>
                                  {item.text}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {level.panels.exitCriteria && (
                          <div className="wa-dblock">
                            <div className="wa-dtitle" style={{ color: "var(--gold)" }}>
                              Exit Criteria — What Closes Level {idx + 1}
                            </div>
                            <ul className="wa-ditems">
                              {level.panels.exitCriteria.map((item, ii) => (
                                <li key={ii}>
                                  <span className={`wa-dicon wa-${item.type === "build" ? "ic-build" : "ic-plan"}`}>
                                    →
                                  </span>
                                  {item.text}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {level.panels.componentLib && (
                          <div className="wa-dblock">
                            <div className="wa-dtitle" style={{ color: "var(--gold)" }}>
                              src/components/ui/ — Build These
                            </div>
                            <ul className="wa-ditems">
                              {level.panels.componentLib.map((item, ii) => (
                                <li key={ii}>
                                  <span className={`wa-dicon wa-${item.type === "build" ? "ic-build" : "ic-check"}`}>
                                    {item.type === "build" ? "→" : "✓"}
                                  </span>
                                  {item.text}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {level.panels.architecture && (
                          <div className="wa-dblock">
                            <div className="wa-dtitle" style={{ color: idx === 1 ? "var(--ice)" : "var(--gold)" }}>
                              {idx === 1 ? "Typography Hierarchy" : "AssistantPanel Deployment Map"}
                            </div>
                            <ul className="wa-ditems">
                              {level.panels.architecture.map((item, ii) => (
                                <li key={ii}>
                                  <span className={`wa-dicon wa-${item.type === "ai" ? "ic-ai" : item.type === "check" ? "ic-check" : "ic-plan"}`}>
                                    {item.type === "ai" ? "AI" : item.type === "check" ? "✓" : "→"}
                                  </span>
                                  {item.text}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {level.panels.stores && (
                          <div className="wa-dblock">
                            <div className="wa-dtitle" style={{ color: "var(--purple)" }}>
                              src/stores/ — Required
                            </div>
                            <ul className="wa-ditems">
                              {level.panels.stores.map((item, ii) => (
                                <li key={ii}>
                                  <span className={`wa-dicon wa-${item.type === "check" ? "ic-check" : "ic-build"}`}>
                                    {item.type === "check" ? "✓" : "→"}
                                  </span>
                                  {item.text}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {level.panels.hooks && (
                          <div className="wa-dblock">
                            <div className="wa-dtitle" style={{ color: "var(--purple)" }}>
                              New React Hooks
                            </div>
                            <ul className="wa-ditems">
                              {level.panels.hooks.map((item, ii) => (
                                <li key={ii}>
                                  <span className="wa-dicon wa-ic-build">→</span>
                                  {item.text}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {level.panels.intelligence && (
                          <div className="wa-dblock">
                            <div className="wa-dtitle" style={{ color: "var(--green)" }}>
                              What Level 5 Looks Like
                            </div>
                            <ul className="wa-ditems">
                              {level.panels.intelligence.map((item, ii) => (
                                <li key={ii}>
                                  <span className={`wa-dicon wa-${item.type === "check" ? "ic-check" : "ic-plan"}`}>
                                    {item.type === "check" ? "✓" : "→"}
                                  </span>
                                  {item.text}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {level.panels.distribution && (
                          <div className="wa-dblock">
                            <div className="wa-dtitle" style={{ color: "var(--green)" }}>
                              Distribution
                            </div>
                            <ul className="wa-ditems">
                              {level.panels.distribution.map((item, ii) => (
                                <li key={ii}>
                                  <span className="wa-dicon wa-ic-plan">→</span>
                                  {item.text}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Chips */}
                      <div className="wa-chips">
                        {level.chips.map((chip, ci) => (
                          <span key={ci} className={`wa-chip ${chip.class}`}>
                            {chip.text}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connector between levels */}
                {idx < LEVELS.length - 1 && (
                  <div className="wa-connector wa-fi wa-fi-5">
                    <div className="wa-cline"></div>
                    <div className="wa-clabel">Phase Transition</div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ROADMAP */}
          <div className="wa-roadmap wa-fi wa-fi-7">
            <div className="wa-sec-label" style={{ marginTop: 80 }}>Execution Roadmap</div>
            <div className="wa-rmap-grid">
              {ROADMAP.map((r, ri) => (
                <div key={ri} className={`wa-rcell ${r.status}`}>
                  <div className="wa-rnum">{r.num}</div>
                  <div className="wa-rtitle">{r.title}</div>
                  <div className="wa-rsprint">{r.sprint}</div>
                  <div className="wa-rtags">
                    {r.tags.map((tag, ti) => (
                      <span key={ti} className="wa-rtag">{tag}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MANIFESTO */}
          <div className="wa-manifesto wa-fi wa-fi-8">
            <div className="wa-mquote">
              "The gap between the vision and the current code is entirely a
              <strong> Level&nbsp;I → Level&nbsp;III problem.</strong>
              The design is complete. The intelligence is specced. The execution bottleneck
              is shared component infrastructure — and that is the most solvable problem on the list."
            </div>
            <div className="wa-mattr">Winners Ecosystem · UI Architecture Framework · 2026</div>
          </div>

        </div>
      </div>
    </>
  );
}

