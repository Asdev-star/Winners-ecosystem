// Phase: Cross-cutting · Layer: Core Engine / Engineering Standards
// Winners Ecosystem — UI Architecture Quality Framework
// Zero Tailwind · CSS variables only · Winners design system

import { useState, useEffect, useRef } from "react";

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

  /* ── GRID TEXTURE ─────────────────────────────── */
  .wa-grid-bg {
    position: fixed; inset: 0; z-index: 0; pointer-events: none;
    background-image:
      linear-gradient(rgba(43,95,142,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(43,95,142,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  /* ── HEADER ───────────────────────────────────── */
  .wa-header {
    position: relative; z-index: 10;
    padding: 72px 48px 56px;
    max-width: 1200px; margin: 0 auto;
    border-bottom: 1px solid var(--border);
  }

  .wa-header-eyebrow {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 20px;
  }
  .wa-header-eyebrow-line {
    width: 32px; height: 1px; background: var(--gold);
  }
  .wa-header-eyebrow-text {
    font-family: 'Space Mono', monospace;
    font-size: 9px; letter-spacing: 0.35em; text-transform: uppercase;
    color: var(--gold);
  }

  .wa-header-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(40px, 5vw, 72px);
    font-weight: 300;
    line-height: 1.0;
    color: var(--text);
    margin-bottom: 6px;
  }
  .wa-header-title em {
    font-style: italic; color: var(--gold);
  }

  .wa-header-sub {
    font-size: 14px; color: var(--text-dim);
    line-height: 1.7; max-width: 580px;
    margin-top: 18px;
  }

  .wa-header-meta {
    display: flex; align-items: center; gap: 20px;
    margin-top: 28px; flex-wrap: wrap;
  }
  .wa-meta-tag {
    display: flex; align-items: center; gap: 6px;
    font-family: 'Space Mono', monospace;
    font-size: 9px; letter-spacing: 0.15em; text-transform: uppercase;
    padding: 5px 12px; border-radius: 2px;
  }
  .wa-meta-tag.gold   { background: var(--gold-dim); color: var(--gold); border: 1px solid rgba(201,168,76,0.2); }
  .wa-meta-tag.green  { background: var(--green-dim); color: var(--green); border: 1px solid rgba(45,212,160,0.2); }
  .wa-meta-tag.blue   { background: rgba(43,95,142,0.1); color: var(--ice); border: 1px solid rgba(43,95,142,0.25); }
  .wa-meta-tag-dot {
    width: 5px; height: 5px; border-radius: 50%; background: currentColor;
  }

  /* ── CONTEXT BAR ─────────────────────────────── */
  .wa-context-bar {
    position: relative; z-index: 10;
    padding: 12px 48px;
    max-width: 1200px; margin: 0 auto;
    display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
    border-bottom: 1px solid var(--border2);
  }
  .wa-ctx-badge {
    font-family: 'Space Mono', monospace;
    font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;
    padding: 3px 8px; border-radius: 2px;
    display: flex; align-items: center; gap: 5px;
    cursor: default;
  }
  .wa-ctx-badge::before {
    content: ''; width: 4px; height: 4px; border-radius: 50%; background: currentColor;
  }
  .wa-ctx-badge.live    { background: rgba(45,212,160,0.07);  color: var(--green); border: 1px solid rgba(45,212,160,0.15); }
  .wa-ctx-badge.building{ background: rgba(201,168,76,0.07);  color: var(--gold);  border: 1px solid rgba(201,168,76,0.15); }
  .wa-ctx-badge.planned { background: rgba(90,122,150,0.07);  color: var(--text-dim); border: 1px solid var(--border); }
  .wa-ctx-sep { color: var(--text-faint); font-size: 10px; }

  /* ── PROGRESS STRIP ──────────────────────────── */
  .wa-progress-strip {
    position: relative; z-index: 10;
    padding: 28px 48px 0;
    max-width: 1200px; margin: 0 auto;
    display: flex; gap: 4px; align-items: flex-end;
  }
  .wa-progress-col {
    flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px;
  }
  .wa-progress-bar-wrap {
    width: 100%; background: var(--surface2); border-radius: 2px; overflow: hidden;
    height: 4px; position: relative;
  }
  .wa-progress-bar-fill {
    height: 100%; border-radius: 2px;
    transition: width 1.4s cubic-bezier(0.22, 0.9, 0.36, 1);
  }
  .wa-progress-label {
    font-family: 'Space Mono', monospace;
    font-size: 8px; letter-spacing: 0.1em; text-transform: uppercase;
    color: var(--text-faint); text-align: center;
  }
  .wa-progress-num {
    font-family: 'Space Mono', monospace;
    font-size: 9px; color: var(--text-dim);
  }

  /* ── MAIN LAYOUT ─────────────────────────────── */
  .wa-main {
    position: relative; z-index: 10;
    padding: 60px 48px 80px;
    max-width: 1200px; margin: 0 auto;
    display: flex; flex-direction: column; gap: 3px;
  }

  /* ── LEVEL CARD ──────────────────────────────── */
  .wa-level {
    position: relative;
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
    transition: border-color 0.25s, box-shadow 0.25s;
    cursor: pointer;
    background: var(--surface);
  }
  .wa-level:hover  { border-color: rgba(201,168,76,0.25); }
  .wa-level.active { border-color: rgba(201,168,76,0.4);  box-shadow: 0 0 40px rgba(201,168,76,0.06); }

  .wa-level-top-border {
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    transition: opacity 0.3s;
  }
  .wa-level:not(.active) .wa-level-top-border { opacity: 0.35; }

  /* ── LEVEL HEADER (always visible) ──────────── */
  .wa-level-header {
    display: grid;
    grid-template-columns: 64px 1fr auto;
    align-items: center;
    gap: 0;
    padding: 0;
    min-height: 72px;
  }

  .wa-level-num-block {
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 0 20px;
    height: 100%;
    border-right: 1px solid var(--border2);
    position: relative;
  }
  .wa-level-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px; font-weight: 300; line-height: 1;
    transition: color 0.3s;
  }
  .wa-level-roman {
    font-family: 'Space Mono', monospace;
    font-size: 8px; letter-spacing: 0.2em; text-transform: uppercase;
    color: var(--text-faint); margin-top: 2px;
  }

  .wa-level-title-block {
    padding: 18px 24px;
    display: flex; flex-direction: column; gap: 4px;
  }
  .wa-level-name {
    font-family: 'Syne', sans-serif;
    font-size: 15px; font-weight: 700; letter-spacing: 0.01em;
    line-height: 1.2;
    transition: color 0.3s;
  }
  .wa-level-tagline {
    font-size: 12px; color: var(--text-dim); line-height: 1.5;
  }

  .wa-level-right {
    padding: 0 24px;
    display: flex; flex-direction: column; align-items: flex-end; gap: 6px;
  }
  .wa-level-status-badge {
    font-family: 'Space Mono', monospace;
    font-size: 8px; letter-spacing: 0.2em; text-transform: uppercase;
    padding: 4px 10px; border-radius: 2px;
    white-space: nowrap;
  }
  .wa-level-chevron {
    font-size: 10px; color: var(--text-faint);
    transition: transform 0.3s, color 0.3s;
  }
  .wa-level.active .wa-level-chevron { transform: rotate(180deg); }

  /* ── LEVEL BODY (expandable) ─────────────────── */
  .wa-level-body {
    overflow: hidden;
    max-height: 0;
    transition: max-height 0.5s cubic-bezier(0.22, 0.9, 0.36, 1);
    border-top: 1px solid transparent;
  }
  .wa-level.active .wa-level-body {
    max-height: 1800px;
    border-top-color: var(--border2);
  }

  .wa-level-body-inner {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 0;
    padding: 0;
  }

  /* ── BODY PANELS ─────────────────────────────── */
  .wa-panel {
    padding: 28px 28px 24px;
    border-right: 1px solid var(--border2);
    display: flex; flex-direction: column; gap: 16px;
  }
  .wa-panel:last-child { border-right: none; }

  .wa-panel-title {
    font-family: 'Space Mono', monospace;
    font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase;
    color: var(--text-faint);
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border2);
    display: flex; align-items: center; gap: 8px;
  }

  /* ── CODE BLOCK ──────────────────────────────── */
  .wa-code-block {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 14px 16px;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    line-height: 1.8;
    color: var(--text-dim);
    overflow-x: auto;
    position: relative;
  }
  .wa-code-block::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: var(--border);
  }
  .wa-code-gold   { color: var(--gold); }
  .wa-code-green  { color: var(--green); }
  .wa-code-ice    { color: var(--ice); }
  .wa-code-purple { color: var(--purple); }
  .wa-code-red    { color: var(--red); }
  .wa-code-dim    { color: var(--text-faint); }
  .wa-code-comment{ color: var(--text-faint); font-style: italic; }

  /* ── CHECKLIST ───────────────────────────────── */
  .wa-checklist { display: flex; flex-direction: column; gap: 8px; }
  .wa-check-item {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 12px; line-height: 1.5; color: var(--text-dim);
  }
  .wa-check-icon {
    width: 16px; height: 16px; border-radius: 2px;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; margin-top: 1px;
    font-family: 'Space Mono', monospace;
    font-size: 9px; font-weight: 700;
  }
  .wa-check-icon.done  { background: var(--green-dim); color: var(--green); border: 1px solid rgba(45,212,160,0.2); }
  .wa-check-icon.todo  { background: var(--surface3); color: var(--text-faint); border: 1px solid var(--border); }
  .wa-check-icon.warn  { background: var(--red-dim); color: var(--red); border: 1px solid rgba(224,90,78,0.2); }
  .wa-check-icon.next  { background: var(--gold-dim); color: var(--gold); border: 1px solid rgba(201,168,76,0.2); }

  /* ── METRICS ROW ─────────────────────────────── */
  .wa-metrics { display: flex; gap: 8px; flex-wrap: wrap; }
  .wa-metric {
    flex: 1; min-width: 90px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 4px; padding: 12px 14px;
  }
  .wa-metric-val {
    font-family: 'Cormorant Garamond', serif;
    font-size: 24px; font-weight: 300; line-height: 1;
    margin-bottom: 3px;
  }
  .wa-metric-label {
    font-family: 'Space Mono', monospace;
    font-size: 8px; letter-spacing: 0.15em; text-transform: uppercase;
    color: var(--text-faint);
  }

  /* ── ARCH DIAGRAM ────────────────────────────── */
  .wa-arch-diagram {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 16px;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    line-height: 2.0;
  }
  .wa-arch-layer {
    display: flex; align-items: center; gap: 8px;
    padding: 4px 8px; border-radius: 2px; margin: 2px 0;
  }
  .wa-arch-layer-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .wa-arch-arrow {
    text-align: center; color: var(--text-faint);
    padding: 2px 0; font-size: 10px;
  }

  /* ── BENCHMARK CHIPS ─────────────────────────── */
  .wa-benchmarks { display: flex; flex-wrap: wrap; gap: 6px; }
  .wa-benchmark-chip {
    font-family: 'Space Mono', monospace;
    font-size: 9px; letter-spacing: 0.1em;
    padding: 4px 10px; border-radius: 2px;
    background: var(--surface2); color: var(--text-dim);
    border: 1px solid var(--border);
    display: flex; align-items: center; gap: 5px;
  }
  .wa-benchmark-chip-dot { width: 4px; height: 4px; border-radius: 50%; }

  /* ── VERDICT BANNER ──────────────────────────── */
  .wa-verdict {
    border-radius: 4px; padding: 16px 18px;
    font-size: 12px; line-height: 1.6;
    display: flex; gap: 12px; align-items: flex-start;
    margin-top: 4px;
  }
  .wa-verdict-icon {
    font-size: 14px; flex-shrink: 0; margin-top: 1px;
  }
  .wa-verdict-text { color: var(--text-dim); }
  .wa-verdict b { font-weight: 700; }

  /* ── BOTTOM SUMMARY ──────────────────────────── */
  .wa-summary {
    position: relative; z-index: 10;
    max-width: 1200px; margin: 0 auto;
    padding: 0 48px 80px;
  }

  .wa-summary-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 3px;
  }
  .wa-summary-col {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 20px 18px;
    position: relative; overflow: hidden;
  }
  .wa-summary-col::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--gold), transparent);
  }
  .wa-summary-col-num {
    font-family: 'Cormorant Garamond', serif;
    font-size: 36px; font-weight: 300; line-height: 1;
    margin-bottom: 6px;
  }
  .wa-summary-col-name {
    font-family: 'Syne', sans-serif;
    font-size: 12px; font-weight: 700;
    margin-bottom: 4px;
  }
  .wa-summary-col-desc {
    font-family: 'Space Mono', monospace;
    font-size: 9px; letter-spacing: 0.05em;
    color: var(--text-faint); line-height: 1.6;
    white-space: pre-line;
  }
  .wa-summary-col-status {
    margin-top: 12px;
    font-family: 'Space Mono', monospace;
    font-size: 8px; letter-spacing: 0.2em; text-transform: uppercase;
    padding: 3px 8px; border-radius: 2px; display: inline-block;
  }

  /* ── SPRINT ROADMAP ──────────────────────────── */
  .wa-roadmap {
    position: relative; z-index: 10;
    max-width: 1200px; margin: 0 auto;
    padding: 0 48px 80px;
  }
  .wa-roadmap-title {
    font-family: 'Space Mono', monospace;
    font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase;
    color: var(--gold); margin-bottom: 24px;
    display: flex; align-items: center; gap: 12px;
  }
  .wa-roadmap-title::after {
    content: ''; flex: 1; height: 1px; background: var(--border);
  }
  .wa-roadmap-grid {
    display: grid; grid-template-columns: repeat(3, 1fr); gap: 3px;
  }
  .wa-sprint {
    background: var(--surface); border: 1px solid var(--border); border-radius: 4px;
    padding: 22px 22px 18px; position: relative; overflow: hidden;
  }
  .wa-sprint::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, var(--gold), transparent);
  }
  .wa-sprint-label {
    font-family: 'Space Mono', monospace;
    font-size: 8px; letter-spacing: 0.25em; text-transform: uppercase;
    margin-bottom: 10px;
  }
  .wa-sprint-name {
    font-family: 'Syne', sans-serif;
    font-size: 14px; font-weight: 700; margin-bottom: 14px;
  }
  .wa-sprint-items { display: flex; flex-direction: column; gap: 7px; }
  .wa-sprint-item {
    display: flex; align-items: flex-start; gap: 8px;
    font-size: 11px; color: var(--text-dim); line-height: 1.4;
  }
  .wa-sprint-item::before {
    content: '→'; color: var(--text-faint); flex-shrink: 0;
    font-family: 'Space Mono', monospace; font-size: 9px; margin-top: 1px;
  }
  .wa-sprint-outcome {
    margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border2);
    font-family: 'Space Mono', monospace;
    font-size: 9px; letter-spacing: 0.05em; color: var(--text-faint);
    display: flex; align-items: center; gap: 6px;
  }
  .wa-sprint-outcome-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }

  /* ── ANIMATIONS ──────────────────────────────── */
  @keyframes wa-fade-up {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes wa-shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }

  .wa-animate { opacity: 0; animation: wa-fade-up 0.6s ease forwards; }
  .wa-animate-1 { animation-delay: 0.05s; }
  .wa-animate-2 { animation-delay: 0.12s; }
  .wa-animate-3 { animation-delay: 0.19s; }
  .wa-animate-4 { animation-delay: 0.26s; }
  .wa-animate-5 { animation-delay: 0.33s; }

  /* ── RESPONSIVE ──────────────────────────────── */
  @media (max-width: 900px) {
    .wa-header, .wa-context-bar, .wa-progress-strip, .wa-main, .wa-summary, .wa-roadmap {
      padding-left: 20px; padding-right: 20px;
    }
    .wa-level-body-inner { grid-template-columns: 1fr; }
    .wa-panel { border-right: none; border-bottom: 1px solid var(--border2); }
    .wa-panel:last-child { border-bottom: none; }
    .wa-summary-grid { grid-template-columns: repeat(2, 1fr); }
    .wa-roadmap-grid { grid-template-columns: 1fr; }
    .wa-level-header { grid-template-columns: 56px 1fr auto; }
  }
`;

// ── DATA ───────────────────────────────────────────────────────────────────────

interface LevelItem {
  type: "done" | "warn" | "todo" | "next";
  text: string;
}

interface CodeLine {
  t: string;
  v: string;
}

interface Metric {
  val: string;
  label: string;
  color: string;
}

interface Panel {
  title: string;
  items?: LevelItem[];
  snippet?: CodeLine[];
}

interface Panels {
  state: Panel;
  code: Panel;
  action: Panel;
}

interface Level {
  num: string;
  roman: string;
  name: string;
  tagline: string;
  color: string;
  colorDim: string;
  colorBorder: string;
  status: string;
  statusColor: { bg: string; color: string; border: string };
  metrics: Metric[];
  gradient: string;
  panels: Panels;
}

interface Sprint {
  color: string;
  gradient: string;
  label: string;
  name: string;
  items: string[];
  outcome: { color: string; text: string };
}

const LEVELS: Level[] = [
  {
    num: "01",
    roman: "I",
    name: "Functional",
    tagline: "Pages work. Data loads. Actions fire.",
    color: "var(--red)",
    colorDim: "var(--red-dim)",
    colorBorder: "rgba(224,90,78,0.2)",
    status: "Current Reality",
    statusColor: { bg: "var(--red-dim)", color: "var(--red)", border: "rgba(224,90,78,0.2)" },
    metrics: [
      { val: "219", label: "Lint problems", color: "var(--red)" },
      { val: "0", label: "Test files", color: "var(--text-dim)" },
      { val: "~40%", label: "Pages consistent", color: "var(--text-dim)" },
    ],
    gradient: "linear-gradient(90deg, var(--red), transparent)",
    panels: {
      state: {
        title: "Current Code Reality",
        items: [
          { type: "warn", text: "Hardcoded hex values in CommunityPage.tsx and RevenueChart.tsx" },
          { type: "warn", text: "219 lint problems — 205 errors, 14 warnings across codebase" },
          { type: "warn", text: "0 test files — Vitest config exists but suite empty" },
          { type: "warn", text: "CSS duplicated per-file — no shared component language" },
          { type: "warn", text: "@ts-nocheck scattered across multiple files" },
          { type: "done", text: "TypeScript compiles clean — both tsconfig targets pass" },
          { type: "done", text: "Core Engine pages functional and deployed live" },
        ]
      },
      code: {
        title: "What This Looks Like",
        snippet: [
          { t: "comment", v: "// ❌ Level 1 — survival code" },
          { t: "red",  v: `style={{ color: '#C9A84C' }}` },
          { t: "dim",  v: "" },
          { t: "comment", v: "// Inline hex everywhere" },
          { t: "red",  v: `background: '#111D2E',` },
          { t: "red",  v: `border: '1px solid #1E3248'` },
          { t: "dim",  v: "" },
          { t: "comment", v: "// @ts-nocheck used to skip types" },
          { t: "red",  v: "// @ts-nocheck" },
          { t: "dim",  v: "export default function Page(){" },
          { t: "dim",  v: "  return <div>" },
        ]
      },
      action: {
        title: "To Escape This Level",
        items: [
          { type: "next", text: "Global design sweep — grep and replace all hardcoded hex with CSS vars" },
          { type: "next", text: "Lint reduction pass — start with no-explicit-any and @ts-nocheck clusters" },
          { type: "next", text: "Enforce design rules in every existing page before writing new ones" },
        ],
        verdict: {
          style: { background: "var(--red-dim)", border: "1px solid rgba(224,90,78,0.15)" },
          icon: "⚠",
          text: "<b>The gap between your vision and this level is total.</b> Bloomberg Terminal doesn't ship with hardcoded colors. Fix this before any new feature is written."
        }
      }
    }
  },
  {
    num: "02",
    roman: "II",
    name: "Consistent",
    tagline: "Every page obeys the same non-negotiable rules.",
    color: "var(--orange)",
    colorDim: "var(--orange-dim)",
    colorBorder: "rgba(245,158,11,0.2)",
    status: "50% Achieved",
    statusColor: { bg: "var(--orange-dim)", color: "var(--orange)", border: "rgba(245,158,11,0.2)" },
    metrics: [
      { val: "12", label: "CSS vars in use", color: "var(--gold)" },
      { val: "6px", label: "Card radius", color: "var(--gold)" },
      { val: "3", label: "Font families", color: "var(--gold)" },
    ],
    gradient: "linear-gradient(90deg, var(--orange), transparent)",
    panels: {
      state: {
        title: "Design System Compliance",
        items: [
          { type: "done", text: "CSS variables declared and used across most pages" },
          { type: "done", text: "Card pattern: 6px radius + 2px gold gradient top border" },
          { type: "done", text: "Cormorant Garamond · Syne · Space Mono loaded and used" },
          { type: "done", text: "Context bar pattern defined — ecosystem breadcrumb on every page" },
          { type: "todo", text: "CommunityPage.tsx still has hardcoded hex — sweep pending" },
          { type: "todo", text: "RevenueChart.tsx colors not yet converted to CSS variables" },
          { type: "todo", text: "Skeleton loaders missing on several data-fetching components" },
        ]
      },
      code: {
        title: "What This Looks Like",
        snippet: [
          { t: "comment", v: "// ✅ Level 2 — consistent design system" },
          { t: "green", v: `style={{ color: 'var(--gold)' }}` },
          { t: "dim",   v: "" },
          { t: "green", v: "background: var(--surface)," },
          { t: "green", v: "border: '1px solid var(--border)'," },
          { t: "green", v: "borderRadius: 6," },
          { t: "dim",   v: "" },
          { t: "comment", v: "// Card pattern used everywhere" },
          { t: "green", v: ".card::before {" },
          { t: "green", v: "  background: linear-gradient(" },
          { t: "green", v: "    90deg, var(--gold), transparent" },
          { t: "green", v: "  );" },
        ]
      },
      action: {
        title: "Compliance Checklist",
        items: [
          { type: "done", text: "All CSS variables declared in :root" },
          { type: "done", text: "Phase + Layer comment at top of every file" },
          { type: "next", text: "Ecosystem context bar on every single page" },
          { type: "next", text: "Empty states use AI prompt, never bare 'No data'" },
          { type: "next", text: "Skeleton loading replaces all spinners" },
          { type: "next", text: "WCAG AA contrast on all text — 4.5:1 minimum" },
        ],
        verdict: {
          style: { background: "var(--orange-dim)", border: "1px solid rgba(245,158,11,0.15)" },
          icon: "◈",
          text: "<b>This is the minimum floor for a premium product.</b> Every page that doesn't meet this standard reduces trust. A user who sees one inconsistent page questions all the others."
        }
      }
    }
  },
  {
    num: "03",
    roman: "III",
    name: "Componentised",
    tagline: "One infrastructure. Eight expressions. Zero duplication.",
    color: "var(--gold)",
    colorDim: "var(--gold-dim)",
    colorBorder: "rgba(201,168,76,0.2)",
    status: "Build Now",
    statusColor: { bg: "var(--gold-dim)", color: "var(--gold)", border: "rgba(201,168,76,0.2)" },
    metrics: [
      { val: "8", label: "Platforms share one component lib", color: "var(--gold)" },
      { val: "9", label: "AI assistants need AssistantPanel", color: "var(--gold)" },
      { val: "1×", label: "Write once, deploy everywhere", color: "var(--gold)" },
    ],
    gradient: "linear-gradient(90deg, var(--gold), transparent)",
    panels: {
      state: {
        title: "Shared Component Library",
        items: [
          { type: "todo", text: "src/components/ui/Card.tsx — card pattern as an importable component" },
          { type: "todo", text: "src/components/ui/ContextBar.tsx — ecosystem breadcrumb, built once" },
          { type: "todo", text: "src/components/ui/SkeletonLoader.tsx — shimmer, consistent system-wide" },
          { type: "todo", text: "src/components/ui/EmptyState.tsx — illustration + AI CTA, never duplicated" },
          { type: "todo", text: "src/components/ui/ProgressRing.tsx — SVG ring for profile and courses" },
          { type: "todo", text: "src/components/ui/Badge.tsx — layer badges, trust scores, status pills" },
          { type: "todo", text: "src/components/ai/AssistantPanel.tsx — the panel that wires all 9 AIs" },
        ]
      },
      code: {
        title: "Target Architecture",
        snippet: [
          { t: "comment", v: "// ✅ Level 3 — componentised" },
          { t: "ice",   v: "import { Card } from '@/components/ui/Card';" },
          { t: "ice",   v: "import { ContextBar } from '@/components/ui/ContextBar';" },
          { t: "ice",   v: "import { AssistantPanel } from '@/components/ai';" },
          { t: "dim",   v: "" },
          { t: "gold",  v: "export function CommunityPage() {" },
          { t: "dim",   v: "  return (" },
          { t: "dim",   v: "    <>" },
          { t: "green", v: "      <ContextBar layer='community' />" },
          { t: "dim",   v: "      <Card>" },
          { t: "dim",   v: "        <FeedContent />" },
          { t: "dim",   v: "      </Card>" },
          { t: "purple",v: "      <AssistantPanel ai='NOVA' />" },
          { t: "dim",   v: "    </>" },
          { t: "dim",   v: "  );" },
          { t: "dim",   v: "}" },
        ]
      },
      action: {
        title: "Why This Unlocks Everything",
        items: [
          { type: "next", text: "AssistantPanel built once → NOVA, SAGE, ATLAS, CIRCUIT all go live simultaneously" },
          { type: "next", text: "ContextBar built once → 8 platforms stay in sync with zero extra work" },
          { type: "next", text: "EmptyState built once → consistent AI-powered empty states everywhere" },
          { type: "next", text: "Badge built once → Trust Score renders identically across Community, Work, Market" },
        ],
        verdict: {
          style: { background: "var(--gold-dim)", border: "1px solid rgba(201,168,76,0.15)" },
          icon: "⬡",
          text: "<b>This is the most impactful architectural upgrade available right now.</b> AssistantPanel alone unlocks NOVA, SAGE, ATLAS, and CIRCUIT going live across four platforms simultaneously."
        }
      }
    }
  },
  {
    num: "04",
    roman: "IV",
    name: "State-Driven",
    tagline: "The Agentic Loop requires state that crosses platform boundaries.",
    color: "var(--green)",
    colorDim: "var(--green-dim)",
    colorBorder: "rgba(45,212,160,0.2)",
    status: "Design Phase",
    statusColor: { bg: "var(--green-dim)", color: "var(--green)", border: "rgba(45,212,160,0.2)" },
    metrics: [
      { val: "9", label: "Assistants share one store", color: "var(--green)" },
      { val: "∞", label: "Cross-layer events", color: "var(--green)" },
      { val: "1", label: "Unified notification stream", color: "var(--green)" },
    ],
    gradient: "linear-gradient(90deg, var(--green), transparent)",
    panels: {
      state: {
        title: "Global Store Architecture",
        items: [
          { type: "done", text: "authStore.ts — JWT + Google OAuth + 2FA state (built)" },
          { type: "done", text: "dashboardStore.ts — IPv6 + stale cache + fallbacks (built)" },
          { type: "done", text: "analyticsStore.ts — Revenue + forecast + summary (built)" },
          { type: "todo", text: "ecosystemStore.ts — Layer health, OMEGA events, notification feed" },
          { type: "todo", text: "assistantStore.ts — Active AI, conversation history, streaming state" },
          { type: "todo", text: "agenticLoopStore.ts — Current loop stage, trigger, outcome tracking" },
          { type: "todo", text: "notificationStore.ts — Unified inbox across all 8 platforms" },
        ]
      },
      code: {
        title: "ecosystemStore — Design",
        snippet: [
          { t: "comment", v: "// 🆕 ecosystemStore.ts" },
          { t: "ice",   v: "import { create } from 'zustand';" },
          { t: "dim",   v: "" },
          { t: "gold",  v: "interface EcosystemState {" },
          { t: "dim",   v: "  layers: LayerStatus[];" },
          { t: "green", v: "  omegaEvents: OmegaEvent[];" },
          { t: "purple",v: "  activeLoop: AgenticLoop | null;" },
          { t: "ice",   v: "  unreadCount: number;" },
          { t: "dim",   v: "  trustScore: number;" },
          { t: "gold",  v: "}" },
          { t: "dim",   v: "" },
          { t: "ice",   v: "export const useEcosystem" },
          { t: "ice",   v: "  = create<EcosystemState>()(...)" },
        ]
      },
      action: {
        title: "What This Enables",
        items: [
          { type: "next", text: "NOVA detects skill in Community → sidebar Academy badge updates in real time without page reload" },
          { type: "next", text: "OMEGA completes analysis → Core Engine Wealth Dashboard widget updates instantly" },
          { type: "next", text: "Certificate earned in Academy → Work sidebar shows new job match without user navigation" },
          { type: "next", text: "Unified inbox aggregates DMs, job offers, order updates from all 8 platforms in one stream" },
        ],
        verdict: {
          style: { background: "var(--green-dim)", border: "1px solid rgba(45,212,160,0.15)" },
          icon: "⟳",
          text: "<b>Without this level, the Agentic Loop is a diagram, not a product.</b> Real-time cross-layer state is what makes OMEGA's orchestration visible to the user."
        }
      }
    }
  },
  {
    num: "05",
    roman: "V",
    name: "Intelligent",
    tagline: "The UI participates in the ecosystem. It learns, adapts, and acts.",
    color: "var(--purple)",
    colorDim: "var(--purple-dim)",
    colorBorder: "rgba(155,111,255,0.2)",
    status: "Endgame",
    statusColor: { bg: "var(--purple-dim)", color: "var(--purple)", border: "rgba(155,111,255,0.2)" },
    metrics: [
      { val: "9", label: "AI supervisors active", color: "var(--purple)" },
      { val: "∞", label: "Self-optimising loops", color: "var(--purple)" },
      { val: "0", label: "Manual interventions needed", color: "var(--purple)" },
    ],
    gradient: "linear-gradient(90deg, var(--purple), transparent)",
    panels: {
      state: {
        title: "Intelligence-Level UI Capabilities",
        items: [
          { type: "todo", text: "AssistantPanel receives currentRoute + userContext — adapts prompts per page" },
          { type: "todo", text: "⌘K command palette suggests actions based on user's Agentic Loop stage" },
          { type: "todo", text: "Empty states on Work page check Academy cert status — CTA changes accordingly" },
          { type: "todo", text: "OMEGA daily briefing renders as an interactive card, not a static notification" },
          { type: "todo", text: "Every significant action fires an AgenticLoop event to the backend" },
          { type: "todo", text: "AssistantPanel streaming visible in bottom-right across all pages simultaneously" },
          { type: "todo", text: "Trust Score badge is live — recalculates as user earns certs, completes jobs" },
        ]
      },
      code: {
        title: "Self-Aware Page Pattern",
        snippet: [
          { t: "comment", v: "// Level 5 — the UI knows where it is" },
          { t: "purple",v: "<AssistantPanel" },
          { t: "ice",   v: "  ai='NOVA'" },
          { t: "ice",   v: "  context={{" },
          { t: "gold",  v: "    route: '/community'," },
          { t: "gold",  v: "    userLoop: loop.currentStage," },
          { t: "gold",  v: "    recentActivity: activity.last5," },
          { t: "gold",  v: "    trustScore: user.trustScore," },
          { t: "ice",   v: "  }}" },
          { t: "ice",   v: "  onAction={(e) =>" },
          { t: "green", v: "    omega.dispatch(e)" },
          { t: "ice",   v: "  }" },
          { t: "purple",v: "/>" },
        ]
      },
      action: {
        title: "Benchmarks at This Level",
        items: [
          { type: "next", text: "Linear.app — keyboard-first, every action available via ⌘K, UI feels telepathic" },
          { type: "next", text: "Stripe Dashboard — data density with perfect breathing room, every number earns its place" },
          { type: "next", text: "Anthropic Claude — streaming, file context, model awareness baked into every interaction" },
          { type: "next", text: "Bloomberg Terminal — the benchmark for data-sovereign, professional-grade infrastructure" },
        ],
        verdict: {
          style: { background: "var(--purple-dim)", border: "1px solid rgba(155,111,255,0.15)" },
          icon: "🧠",
          text: "<b>This is the vision.</b> The UI is no longer a skin over an API. It is a sovereign intelligence layer — every surface aware of the user's journey, every interaction feeding OMEGA's orchestration engine."
        }
      }
    }
  }
];

const SPRINTS: Sprint[] = [
  {
    color: "var(--red)",
    gradient: "linear-gradient(90deg, var(--red), transparent)",
    label: "Sprint 1 — Immediate",
    name: "Reach Level II Across All Pages",
    items: [
      "Global hex sweep — grep and replace all hardcoded colors",
      "Fix CommunityPage.tsx and RevenueChart.tsx design drift",
      "Lint reduction — target no-explicit-any and @ts-nocheck",
      "First Vitest smoke tests — auth, API mounts, academy enroll",
    ],
    outcome: { color: "var(--orange)", text: "Every existing page passes design system checklist" }
  },
  {
    color: "var(--gold)",
    gradient: "linear-gradient(90deg, var(--gold), transparent)",
    label: "Sprint 2 — This Week",
    name: "Build the Level III Component Library",
    items: [
      "Extract Card, ContextBar, SkeletonLoader, EmptyState into src/components/ui/",
      "Build AssistantPanel — wires NOVA, SAGE, ATLAS, CIRCUIT simultaneously",
      "Refactor all existing pages to import shared components",
      "Build FileDropZone + ModelSelector for AI Platform",
    ],
    outcome: { color: "var(--green)", text: "9 AI assistants deployable with a single import" }
  },
  {
    color: "var(--green)",
    gradient: "linear-gradient(90deg, var(--green), transparent)",
    label: "Sprint 3 — Next Fortnight",
    name: "Wire Level IV State Architecture",
    items: [
      "Build ecosystemStore — layer health, OMEGA events, live statuses",
      "Build assistantStore — persistent conversation state across navigation",
      "Wire Agentic Loop event stream — Community → Academy → Work",
      "Unified notification inbox aggregating all 8 platforms",
    ],
    outcome: { color: "var(--purple)", text: "The Agentic Loop becomes visible, not just diagrammed" }
  }
];

// ── COMPONENT ───────────────────────────────────────────────────────────────────

export default function WinnersUIArchitectureLevels() {
  const [active, setActive] = useState<number>(2);
  const [progressVisible, setProgressVisible] = useState<boolean>(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setProgressVisible(true); },
      { threshold: 0.2 }
    );
    if (progressRef.current) observer.observe(progressRef.current);
    return () => observer.disconnect();
  }, []);

  const toggle = (idx: number) => setActive(active === idx ? -1 : idx);

  const progressBars = [
    { label: "L I — Functional",      pct: 85, color: "var(--red)" },
    { label: "L II — Consistent",     pct: 52, color: "var(--orange)" },
    { label: "L III — Componentised",  pct: 8,  color: "var(--gold)" },
    { label: "L IV — State-Driven",    pct: 3,  color: "var(--green)" },
    { label: "L V — Intelligent",      pct: 0,  color: "var(--purple)" },
  ];

  const contextBarItems = [
    ["⬡ Core Engine","live"],
    ["🧑‍🤝‍🧑 Community","building"],
    ["🎓 Academy","building"],
    ["🛒 Market","planned"],
    ["🤖 Intelligence","building"],
    ["💼 Work","planned"],
    ["📱 Mobile","planned"],
    ["☁️ Cloud","planned"],
  ] as const;

  const summaryCols = [
    { num:"01", name:"Functional",     desc:"Pages work,\ndata loads,\nactions fire.",        color:"var(--red)",    status:"Where you are",  statusBg:"var(--red-dim)",    statusBorder:"rgba(224,90,78,0.2)" },
    { num:"02", name:"Consistent",     desc:"Design system\nenforced across\nall pages.",     color:"var(--orange)", status:"50% achieved",   statusBg:"var(--orange-dim)", statusBorder:"rgba(245,158,11,0.2)" },
    { num:"03", name:"Componentised",  desc:"Shared library,\nzero duplication,\n8 platforms.",    color:"var(--gold)",  status:"Build sprint 2", statusBg:"var(--gold-dim)",   statusBorder:"rgba(201,168,76,0.2)" },
    { num:"04", name:"State-Driven",   desc:"Agentic Loop\nstate crosses\nall layers.",       color:"var(--green)",  status:"Sprint 3",       statusBg:"var(--green-dim)",  statusBorder:"rgba(45,212,160,0.2)" },
    { num:"05", name:"Intelligent",    desc:"UI participates\nin ecosystem\nintelligence.",   color:"var(--purple)", status:"The vision",     statusBg:"var(--purple-dim)", statusBorder:"rgba(155,111,255,0.2)" },
  ];

  const benchmarks = [
    ["Linear.app","var(--ice)"],
    ["Stripe","var(--green)"],
    ["Bloomberg","var(--gold)"],
    ["Claude.ai","var(--purple)"],
    ["Binance","var(--orange)"],
    ["Flutterwave","var(--green)"],
  ];

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="wa-root">
        <div className="wa-grid-bg" />

        {/* HEADER */}
        <header className="wa-header wa-animate wa-animate-1">
          <div className="wa-header-eyebrow">
            <div className="wa-header-eyebrow-line" />
            <span className="wa-header-eyebrow-text">Winners Ecosystem · Engineering Standards</span>
          </div>
          <h1 className="wa-header-title">
            UI Architecture<br /><em>Quality Framework</em>
          </h1>
          <p className="wa-header-sub">
            Five levels of UI architecture quality mapped against the Winners Ecosystem vision.
            Bloomberg Terminal meets a world-class creative studio. This is the engineering roadmap
            that bridges your current codebase to that standard.
          </p>
          <div className="wa-header-meta">
            <span className="wa-meta-tag gold"><span className="wa-meta-tag-dot" />Live · commit d48968b</span>
            <span className="wa-meta-tag blue"><span className="wa-meta-tag-dot" />9 AI Supervisors</span>
            <span className="wa-meta-tag green"><span className="wa-meta-tag-dot" />~45% Complete</span>
          </div>
        </header>

        {/* CONTEXT BAR */}
        <div className="wa-context-bar wa-animate wa-animate-2">
          {contextBarItems.map(([label, status], i) => (
            <span key={i} className={`wa-ctx-badge ${status}`}>{label}</span>
          ))}
        </div>

        {/* PROGRESS STRIP */}
        <div className="wa-progress-strip wa-animate wa-animate-2" ref={progressRef}>
          {progressBars.map((pb, i) => (
            <div key={i} className="wa-progress-col">
              <span className="wa-progress-num" style={{ color: pb.color }}>
                {progressVisible ? `${pb.pct}%` : "0%"}
              </span>
              <div className="wa-progress-bar-wrap">
                <div
                  className="wa-progress-bar-fill"
                  style={{
                    width: progressVisible ? `${pb.pct}%` : "0%",
                    background: pb.color,
                    transitionDelay: `${i * 0.1}s`
                  }}
                />
              </div>
              <span className="wa-progress-label" style={{ color: pb.color, opacity: 0.7 }}>
                {pb.label}
              </span>
            </div>
          ))}
        </div>

        {/* LEVELS */}
        <main className="wa-main">
          {LEVELS.map((lv, idx) => (
            <div
              key={idx}
              className={`wa-level wa-animate wa-animate-${Math.min(idx + 1, 5)} ${active === idx ? "active" : ""}`}
              onClick={() => toggle(idx)}
            >
              {/* Top accent border */}
              <div className="wa-level-top-border" style={{ background: lv.gradient }} />

              {/* Header row */}
              <div className="wa-level-header">
                {/* Number block */}
                <div className="wa-level-num-block">
                  <span className="wa-level-num" style={{ color: active === idx ? lv.color : "var(--text-faint)" }}>
                    {lv.num}
                  </span>
                  <span className="wa-level-roman">{lv.roman}</span>
                </div>

                {/* Title block */}
                <div className="wa-level-title-block">
                  <span className="wa-level-name" style={{ color: active === idx ? lv.color : "var(--text)" }}>
                    {lv.name}
                  </span>
                  <span className="wa-level-tagline">{lv.tagline}</span>
                </div>

                {/* Right block */}
                <div className="wa-level-right">
                  <span
                    className="wa-level-status-badge"
                    style={{
                      background: lv.statusColor.bg,
                      color: lv.statusColor.color,
                      border: `1px solid ${lv.statusColor.border}`,
                    }}
                  >
                    {lv.status}
                  </span>
                  <span className="wa-level-chevron" style={{ color: active === idx ? lv.color : undefined }}>
                    ▾
                  </span>
                </div>
              </div>

              {/* Expandable body */}
              <div className="wa-level-body">
                <div className="wa-level-body-inner" onClick={(e) => e.stopPropagation()}>

                  {/* PANEL 1 — State */}
                  <div className="wa-panel">
                    <div className="wa-panel-title" style={{ color: lv.color }}>
                      ◈ {lv.panels.state.title}
                    </div>

                    {/* Metrics */}
                    <div className="wa-metrics">
                      {lv.metrics.map((m, mi) => (
                        <div key={mi} className="wa-metric">
                          <div className="wa-metric-val" style={{ color: m.color }}>{m.val}</div>
                          <div className="wa-metric-label">{m.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Checklist */}
                    <div className="wa-checklist">
                      {lv.panels.state.items?.map((item, ii) => (
                        <div key={ii} className="wa-check-item">
                          <div className={`wa-check-icon ${item.type}`}>
                            {item.type === "done" ? "✓" : item.type === "warn" ? "!" : item.type === "next" ? "→" : "○"}
                          </div>
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PANEL 2 — Code */}
                  <div className="wa-panel">
                    <div className="wa-panel-title" style={{ color: lv.color }}>
                      ⟨/⟩ {lv.panels.code.title}
                    </div>
                    <div className="wa-code-block">
                      {lv.panels.code.snippet?.map((line, li) => (
                        <div key={li}>
                          <span className={`wa-code-${line.t}`}>{line.v || "\u00A0"}</span>
                        </div>
                      ))}
                    </div>

                    {/* Architecture diagram for levels 3–5 */}
                    {idx >= 2 && (
                      <div className="wa-arch-diagram">
                        {[
                          { label: "src/components/ui/", color: lv.color },
                          { label: "  ↳ Card · ContextBar · Badge", color: "var(--text-dim)" },
                          { label: "  ↳ SkeletonLoader · EmptyState", color: "var(--text-dim)" },
                          { label: "src/components/ai/", color: idx >= 3 ? "var(--purple)" : "var(--text-faint)" },
                          { label: "  ↳ AssistantPanel · FileDropZone", color: idx >= 3 ? "var(--text-dim)" : "var(--text-faint)" },
                          { label: "src/stores/ (ecosystem-wide)", color: idx >= 3 ? "var(--green)" : "var(--text-faint)" },
                          { label: "  ↳ ecosystemStore · assistantStore", color: idx >= 3 ? "var(--text-dim)" : "var(--text-faint)" },
                        ].map((row, ri) => (
                          <div key={ri} className="wa-arch-layer"
                            style={{ background: ri % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                            <span style={{ color: row.color, fontSize: 10 }}>{row.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* PANEL 3 — Actions */}
                  <div className="wa-panel">
                    <div className="wa-panel-title" style={{ color: lv.color }}>
                      ▸ {lv.panels.action.title}
                    </div>

                    <div className="wa-checklist">
                      {lv.panels.action.items?.map((item, ii) => (
                        <div key={ii} className="wa-check-item">
                          <div className={`wa-check-icon ${item.type}`}>
                            {item.type === "done" ? "✓" : item.type === "warn" ? "!" : "→"}
                          </div>
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>

                    {/* Benchmarks */}
                    <div className="wa-panel-title" style={{ color: "var(--text-faint)", marginTop: 8 }}>
                      ◆ Reference Benchmarks
                    </div>
                    <div className="wa-benchmarks">
                      {benchmarks.slice(0, idx + 2).map(([name, color], bi) => (
                        <div key={bi} className="wa-benchmark-chip">
                          <span className="wa-benchmark-chip-dot" style={{ background: color }} />
                          {name}
                        </div>
                      ))}
                    </div>

                    {/* Verdict */}
                    <div className="wa-verdict" style={lv.panels.action.verdict.style}>
                      <span className="wa-verdict-icon" style={{ color: lv.color }}>
                        {lv.panels.action.verdict.icon}
                      </span>
                      <span
                        className="wa-verdict-text"
                        dangerouslySetInnerHTML={{ __html: lv.panels.action.verdict.text }}
                      />
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ))}
        </main>

        {/* SUMMARY GRID */}
        <section className="wa-summary">
          <div className="wa-roadmap-title">Current Status At A Glance</div>
          <div className="wa-summary-grid">
            {summaryCols.map((col, ci) => (
              <div key={ci} className="wa-summary-col">
                <div
                  style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 2,
                    background: `linear-gradient(90deg, ${col.color}, transparent)`
                  }}
                />
                <div className="wa-summary-col-num" style={{ color: col.color }}>{col.num}</div>
                <div className="wa-summary-col-name" style={{ color: col.color }}>{col.name}</div>
                <div className="wa-summary-col-desc">{col.desc}</div>
                <span
                  className="wa-summary-col-status"
                  style={{ background: col.statusBg, color: col.color, border: `1px solid ${col.statusBorder}` }}
                >
                  {col.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* SPRINT ROADMAP */}
        <section className="wa-roadmap">
          <div className="wa-roadmap-title">Three-Sprint Execution Path</div>
          <div className="wa-roadmap-grid">
            {SPRINTS.map((sp, si) => (
              <div key={si} className="wa-sprint">
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 2,
                  background: sp.gradient
                }} />
                <div className="wa-sprint-label" style={{ color: sp.color }}>{sp.label}</div>
                <div className="wa-sprint-name">{sp.name}</div>
                <div className="wa-sprint-items">
                  {sp.items.map((item, ii) => (
                    <div key={ii} className="wa-sprint-item">{item}</div>
                  ))}
                </div>
                <div className="wa-sprint-outcome" style={{ color: sp.outcome.color }}>
                  <span className="wa-sprint-outcome-dot" />
                  {sp.outcome.text}
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </>
  );
}
