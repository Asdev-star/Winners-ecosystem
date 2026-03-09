// src/features/community/CommunityPage.tsx
// Phase 2 — Community Layer V2.0
// NOVA Intelligence · Ice-Blue Identity · Agentic Loop · Social Architecture
// Design: CSS variables only · zero hardcoded hex · Syne + Space Mono + Cormorant Garamond

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuthStore } from "../auth/authStore";
import { API_BASE } from "../../lib/api";
import LayerSubNav from "../../components/ui/LayerSubNav";
import ContextBar from "../../components/ui/ContextBar";
import AIInsightBanner from "../../components/ui/AIInsightBanner";
import AssistantPanel from "../../components/ui/AssistantPanel";

const API = API_BASE;

// ─── CSS ─────────────────────────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400;1,600&family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

// Use global CSS variables from index.css

/* ── ROOT ── */
.cm-root {
  display: flex;
  gap: 0;
  min-height: 100vh;
  background:
    radial-gradient(ellipse at 88% 8%, rgba(137,196,225,0.055) 0%, transparent 52%),
    radial-gradient(ellipse at 12% 88%, rgba(201,168,76,0.025) 0%, transparent 38%),
    var(--bg);
  font-family: 'Syne', sans-serif;
  padding-bottom: 80px;
  color: var(--text);
}

/* ── FEED COLUMN ── */
.cm-feed {
  flex: 1;
  max-width: 660px;
  margin: 0 auto;
  padding: 28px 20px;
}

/* ── PAGE HEADER ── */
.cm-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.cm-page-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 28px;
  font-weight: 300;
  color: var(--text);
  letter-spacing: -0.01em;
}
.cm-page-title em {
  font-style: italic;
  color: var(--ice);
}
.cm-page-live {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(45,212,160,0.08);
  color: var(--green);
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid rgba(45,212,160,0.18);
}
.cm-live-dot {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--green);
  animation: livePulse 2s ease-in-out infinite;
}
@keyframes livePulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.8); }
}

/* ── NOVA INSIGHT BANNER ── */
.cm-nova-banner {
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 3px solid var(--ice);
  border-radius: 0 10px 10px 0;
  padding: 12px 16px;
  margin-bottom: 20px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  position: relative;
  animation: bannerEnter 0.4s ease both;
}
@keyframes bannerEnter {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.cm-nova-label {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  font-weight: 700;
  color: var(--ice);
  text-transform: uppercase;
  letter-spacing: 0.15em;
  white-space: nowrap;
  margin-top: 1px;
}
.cm-nova-text {
  flex: 1;
  font-size: 13px;
  color: var(--text);
  line-height: 1.6;
}
.cm-nova-cursor::after {
  content: '▋';
  color: var(--ice);
  animation: cursorBlink 0.75s infinite;
  margin-left: 1px;
  font-size: 11px;
}
@keyframes cursorBlink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
.cm-nova-dismiss {
  background: none;
  border: none;
  color: var(--text-dim);
  cursor: pointer;
  font-size: 14px;
  padding: 0;
  line-height: 1;
  transition: color 0.15s;
}
.cm-nova-dismiss:hover { color: var(--text); }

/* ── FEED TABS ── */
.cm-feed-tabs {
  display: flex;
  gap: 2px;
  margin-bottom: 20px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 4px;
}
.cm-tab {
  flex: 1;
  padding: 8px 12px;
  border-radius: 7px;
  border: none;
  background: none;
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-dim);
  cursor: pointer;
  transition: all 0.18s;
  text-align: center;
}
.cm-tab:hover { color: var(--text); background: rgba(137,196,225,0.05); }
.cm-tab.active {
  background: rgba(137,196,225,0.1);
  color: var(--ice);
  border: 1px solid rgba(137,196,225,0.18);
}
.cm-tab-nova.active {
  background: rgba(155,111,255,0.1);
  color: var(--purple);
  border: 1px solid rgba(155,111,255,0.18);
}

/* ── QUICK POST (X-STYLE) ── */
.cm-quick-post {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 14px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  transition: border-color 0.2s;
}
.cm-quick-post:focus-within { border-color: rgba(137,196,225,0.3); }
.cm-quick-input {
  flex: 1;
  background: none;
  border: none;
  outline: none;
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  color: var(--text);
}
.cm-quick-input::placeholder { color: var(--text-dim); }
.cm-quick-counter {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: var(--text-dim);
  transition: color 0.15s;
}
.cm-quick-counter.warn { color: var(--gold); }
.cm-quick-counter.over { color: var(--red); }
.cm-quick-btn {
  padding: 5px 14px;
  border-radius: 6px;
  background: var(--ice);
  color: var(--bg);
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.cm-quick-btn:hover:not(:disabled) { background: rgba(137,196,225,0.85); transform: translateY(-1px); }
.cm-quick-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* ── MAIN COMPOSER ── */
.cm-compose {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
  transition: border-color 0.2s;
}
.cm-compose::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--gold), transparent 60%);
}
.cm-compose:focus-within { border-color: rgba(201,168,76,0.3); }
.cm-compose-top {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}
.cm-avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  flex-shrink: 0;
  background: rgba(201,168,76,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  color: var(--gold);
  border: 1.5px solid rgba(201,168,76,0.22);
  position: relative;
}
/* Trust Score ring on avatar */
.cm-avatar-ring {
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 2px solid transparent;
}
.cm-avatar-ring.bronze { border-color: rgba(176,141,87,0.5); }
.cm-avatar-ring.silver { border-color: rgba(180,190,200,0.6); }
.cm-avatar-ring.gold   { border-color: var(--gold); }
.cm-avatar-ring.platinum {
  border-color: transparent;
  background: linear-gradient(var(--surface), var(--surface)) padding-box,
              linear-gradient(135deg, var(--gold), var(--ice), var(--gold)) border-box;
  animation: platinumSpin 4s linear infinite;
}
@keyframes platinumSpin {
  from { filter: hue-rotate(0deg); }
  to   { filter: hue-rotate(30deg); }
}
.cm-compose-input {
  flex: 1;
  background: rgba(137,196,225,0.03);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 10px 14px;
  color: var(--text);
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  resize: none;
  outline: none;
  min-height: 80px;
  transition: border-color 0.15s, box-shadow 0.15s;
  width: 100%;
}
.cm-compose-input:focus {
  border-color: rgba(201,168,76,0.4);
  box-shadow: 0 0 0 3px rgba(201,168,76,0.06);
}
.cm-compose-input::placeholder { color: rgba(90,122,150,0.6); }
.cm-compose-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
  gap: 10px;
}
.cm-compose-tools {
  display: flex;
  align-items: center;
  gap: 4px;
}
.cm-tool-btn {
  width: 30px; height: 30px;
  border-radius: 7px;
  border: none;
  background: none;
  color: var(--text-dim);
  cursor: pointer;
  font-size: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.cm-tool-btn:hover { background: rgba(137,196,225,0.08); color: var(--ice); }
.cm-tag-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  color: var(--text-dim);
  min-width: 0;
}
.cm-tag-input::placeholder { color: rgba(90,122,150,0.4); }
.cm-compose-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.cm-audience-select {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 5px 8px;
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: var(--text-dim);
  cursor: pointer;
  outline: none;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.cm-post-btn {
  padding: 7px 18px;
  border-radius: 8px;
  background: var(--gold);
  color: var(--bg);
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.cm-post-btn:hover:not(:disabled) { background: rgba(201,168,76,0.88); transform: translateY(-1px); }
.cm-post-btn:disabled { opacity: 0.35; cursor: not-allowed; transform: none; }
.cm-shortcut {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: var(--text-dim);
  letter-spacing: 0.04em;
}

/* ── SKELETON LOADER ── */
.cm-skeleton-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 14px;
  overflow: hidden;
}
.cm-skeleton-row {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(90deg,
    rgba(30,50,72,0.8) 0%,
    rgba(45,70,100,0.4) 50%,
    rgba(30,50,72,0.8) 100%
  );
  background-size: 200% 100%;
  animation: shimmer 1.6s infinite;
  margin-bottom: 8px;
}
.cm-skeleton-row.wide  { width: 100%; }
.cm-skeleton-row.med   { width: 65%; }
.cm-skeleton-row.short { width: 40%; }
.cm-skeleton-row.tiny  { width: 20%; height: 8px; }
.cm-skeleton-avatar {
  width: 36px; height: 36px;
  border-radius: 50%;
  background: rgba(30,50,72,0.8);
  animation: shimmer 1.6s infinite;
  flex-shrink: 0;
}
.cm-skeleton-top { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 12px; }
@keyframes shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── POST CARD ── */
.cm-post {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 14px;
  overflow: hidden;
  position: relative;
  transition: border-color 0.2s, transform 0.15s;
  animation: cardEnter 0.4s ease both;
}
@keyframes cardEnter {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.cm-post:nth-child(1) { animation-delay: 0ms; }
.cm-post:nth-child(2) { animation-delay: 60ms; }
.cm-post:nth-child(3) { animation-delay: 120ms; }
.cm-post:nth-child(4) { animation-delay: 180ms; }
.cm-post:nth-child(5) { animation-delay: 240ms; }
.cm-post::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--ice), transparent 55%);
}
.cm-post:hover {
  border-color: rgba(137,196,225,0.28);
  transform: translateY(-1px);
}

/* Feature card variant */
.cm-post.feature {
  border-color: rgba(201,168,76,0.2);
}
.cm-post.feature::before {
  background: linear-gradient(90deg, var(--gold), var(--ice), transparent 70%);
  height: 2px;
}
/* Compact card variant */
.cm-post.compact { margin-bottom: 8px; }
.cm-post.compact .cm-post-body { padding: 8px 16px; font-size: 13px; }

.cm-post-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px 0;
}
.cm-post-avatar {
  width: 34px; height: 34px;
  border-radius: 50%;
  flex-shrink: 0;
  background: rgba(137,196,225,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--ice);
  border: 1.5px solid rgba(137,196,225,0.15);
  position: relative;
}
.cm-post-avatar-ring {
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  pointer-events: none;
}
.cm-post-avatar-ring.gold   { border: 2px solid var(--gold); }
.cm-post-avatar-ring.silver { border: 2px solid rgba(180,190,200,0.6); }
.cm-post-avatar-ring.bronze { border: 2px solid rgba(176,141,87,0.45); }
.cm-post-avatar-ring.platinum {
  border: 2px solid transparent;
  background: linear-gradient(var(--surface), var(--surface)) padding-box,
              linear-gradient(135deg, var(--gold), var(--ice), var(--gold)) border-box;
  animation: platinumSpin 4s linear infinite;
}
.cm-post-info { flex: 1; min-width: 0; }
.cm-post-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cm-post-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}
.cm-post-role {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.cm-post-time {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: var(--text-dim);
}
.cm-post-online {
  width: 5px; height: 5px;
  border-radius: 50%;
  background: var(--green);
  box-shadow: 0 0 5px rgba(45,212,160,0.5);
  flex-shrink: 0;
}

/* Loop stage indicator */
.cm-loop-badge {
  font-family: 'Space Mono', monospace;
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 2px 7px;
  border-radius: 10px;
  margin-left: auto;
}
.cm-loop-badge.skill   { background: rgba(137,196,225,0.1); color: var(--ice); border: 1px solid rgba(137,196,225,0.2); }
.cm-loop-badge.course  { background: rgba(45,212,160,0.1);  color: var(--green); border: 1px solid rgba(45,212,160,0.2); }
.cm-loop-badge.income  { background: rgba(201,168,76,0.1);  color: var(--gold); border: 1px solid rgba(201,168,76,0.2); }

.cm-post-body {
  padding: 12px 16px;
  font-size: 14px;
  color: var(--text);
  line-height: 1.7;
  white-space: pre-wrap;
}
.cm-post-body.collapsed {
  max-height: 96px;
  overflow: hidden;
  position: relative;
}
.cm-post-body.collapsed::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 32px;
  background: linear-gradient(transparent, var(--surface));
}
.cm-read-more {
  display: block;
  padding: 0 16px 10px;
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  color: var(--ice);
  cursor: pointer;
  letter-spacing: 0.05em;
  background: none;
  border: none;
  text-align: left;
}
.cm-read-more:hover { color: var(--text); }

/* Tags row */
.cm-post-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 0 16px 10px;
}
.cm-tag {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: var(--gold);
  background: rgba(201,168,76,0.07);
  border: 1px solid rgba(201,168,76,0.14);
  border-radius: 20px;
  padding: 2px 9px;
  letter-spacing: 0.04em;
}

/* NOVA skill detection badges */
.cm-skill-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 0 16px 10px;
}
.cm-skill-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: var(--ice);
  background: rgba(137,196,225,0.06);
  border: 1px solid rgba(137,196,225,0.15);
  border-radius: 20px;
  padding: 2px 8px;
  cursor: pointer;
  transition: all 0.15s;
}
.cm-skill-badge:hover {
  background: rgba(137,196,225,0.12);
  border-color: rgba(137,196,225,0.3);
}
.cm-skill-badge-nova {
  font-size: 8px;
  color: rgba(137,196,225,0.5);
  letter-spacing: 0.04em;
}
.cm-skill-confidence {
  width: 20px;
  height: 2px;
  border-radius: 1px;
  background: var(--border);
  overflow: hidden;
}
.cm-skill-confidence-fill {
  height: 100%;
  background: var(--ice);
  border-radius: 1px;
}

/* Post actions bar */
.cm-post-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 8px 12px;
  border-top: 1px solid rgba(137,196,225,0.06);
}
.cm-action-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 10px;
  border-radius: 7px;
  border: none;
  background: transparent;
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-dim);
  cursor: pointer;
  transition: all 0.15s;
}
.cm-action-btn:hover { background: rgba(137,196,225,0.06); color: var(--text); }
.cm-action-btn.liked { color: var(--red); }
.cm-action-btn.liked:hover { background: rgba(248,113,113,0.08); }
.cm-action-btn.saved { color: var(--gold); }
.cm-action-btn.delete:hover { color: var(--red); background: rgba(224,90,78,0.08); }
.cm-action-btn .like-icon { transition: transform 0.25s cubic-bezier(0.34,1.56,0.64,1); }
.cm-action-btn.liked .like-icon { transform: scale(1.2); }

/* Reactions picker */
.cm-reactions-picker {
  position: relative;
}
.cm-reactions-popup {
  position: absolute;
  bottom: 38px;
  left: 0;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 24px;
  padding: 6px 8px;
  display: flex;
  gap: 4px;
  z-index: 100;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  animation: popupEnter 0.15s ease both;
  white-space: nowrap;
}
@keyframes popupEnter {
  from { opacity: 0; transform: scale(0.85) translateY(6px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
.cm-reaction-opt {
  font-size: 18px;
  cursor: pointer;
  transition: transform 0.12s;
  padding: 2px;
  border-radius: 50%;
}
.cm-reaction-opt:hover { transform: scale(1.3); }

/* Quote post area */
.cm-quote-preview {
  margin: 0 16px 10px;
  border: 1px solid var(--border);
  border-left: 3px solid var(--ice);
  border-radius: 0 8px 8px 0;
  padding: 8px 12px;
  background: rgba(137,196,225,0.03);
}
.cm-quote-preview-author {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: var(--ice);
  margin-bottom: 3px;
}
.cm-quote-preview-text {
  font-size: 12px;
  color: var(--text-dim);
  line-height: 1.5;
}

/* ── CROSS-LAYER HANDOFF CARD ── */
.cm-handoff {
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 14px;
  position: relative;
  overflow: hidden;
  animation: cardEnter 0.45s ease both;
}
.cm-handoff.nova-sage {
  background: rgba(45,212,160,0.03);
  border-color: rgba(45,212,160,0.18);
}
.cm-handoff.nova-sage::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--green), transparent);
}
.cm-handoff.nova-circuit {
  background: rgba(43,95,142,0.06);
  border-color: rgba(43,95,142,0.25);
}
.cm-handoff.nova-circuit::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--blue), transparent);
}
.cm-handoff.nova-atlas {
  background: rgba(201,168,76,0.04);
  border-color: rgba(201,168,76,0.2);
}
.cm-handoff.nova-atlas::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--gold), transparent);
}
.cm-handoff-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.cm-handoff-from {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.cm-handoff-arrow { font-size: 10px; color: var(--text-dim); }
.cm-handoff-to {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}
.nova-sage  .cm-handoff-to { color: var(--green); }
.nova-circuit .cm-handoff-to { color: var(--ice); }
.nova-atlas .cm-handoff-to { color: var(--gold); }
.cm-handoff-dismiss {
  margin-left: auto;
  background: none;
  border: none;
  color: var(--text-dim);
  cursor: pointer;
  font-size: 13px;
  padding: 0;
}
.cm-handoff-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 3px;
}
.cm-handoff-desc {
  font-size: 12px;
  color: var(--text-dim);
  margin-bottom: 10px;
  line-height: 1.5;
}
.cm-handoff-cta {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 14px;
  border-radius: 6px;
  border: none;
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
  text-decoration: none;
}
.nova-sage   .cm-handoff-cta { background: rgba(45,212,160,0.12); color: var(--green); }
.nova-circuit .cm-handoff-cta { background: rgba(43,95,142,0.15); color: var(--ice); }
.nova-atlas  .cm-handoff-cta { background: rgba(201,168,76,0.12); color: var(--gold); }
.cm-handoff-cta:hover { transform: translateY(-1px); filter: brightness(1.15); }

/* ── COMMENTS ── */
.cm-comments { padding: 0 16px 14px; }
.cm-comment-list { padding-top: 10px; border-top: 1px solid rgba(137,196,225,0.06); }
.cm-comment {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}
.cm-comment-avatar {
  width: 26px; height: 26px;
  border-radius: 50%;
  flex-shrink: 0;
  background: rgba(137,196,225,0.07);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 700;
  color: var(--ice);
  border: 1px solid rgba(137,196,225,0.14);
}
.cm-comment-bubble {
  flex: 1;
  background: rgba(137,196,225,0.03);
  border: 1px solid var(--border);
  border-radius: 0 8px 8px 8px;
  padding: 7px 11px;
}
.cm-comment-author {
  font-size: 11px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 1px;
}
.cm-comment-text {
  font-size: 12px;
  color: var(--text-dim);
  line-height: 1.5;
}
.cm-comment-form {
  display: flex;
  gap: 8px;
  margin-top: 10px;
  align-items: center;
}
.cm-comment-input {
  flex: 1;
  background: rgba(137,196,225,0.03);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 12px;
  color: var(--text);
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  outline: none;
  transition: border-color 0.15s;
}
.cm-comment-input:focus { border-color: rgba(201,168,76,0.4); }
.cm-comment-input::placeholder { color: rgba(90,122,150,0.45); }
.cm-comment-submit {
  padding: 7px 14px;
  border-radius: 7px;
  background: rgba(201,168,76,0.1);
  border: 1px solid rgba(201,168,76,0.2);
  color: var(--gold);
  font-family: 'Syne', sans-serif;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}
.cm-comment-submit:hover:not(:disabled) { background: rgba(201,168,76,0.2); }
.cm-comment-submit:disabled { opacity: 0.35; cursor: not-allowed; }

/* ── LOAD MORE ── */
.cm-load-more {
  display: flex;
  justify-content: center;
  padding: 8px 0 20px;
}
.cm-load-more-btn {
  padding: 9px 24px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-dim);
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.cm-load-more-btn:hover { border-color: rgba(137,196,225,0.3); color: var(--ice); }

/* ── SIDEBAR ── */
.cm-sidebar {
  width: 292px;
  flex-shrink: 0;
  padding: 28px 0 28px 0;
}
.cm-sidebar-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 12px;
  position: relative;
  overflow: hidden;
}
.cm-sidebar-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--ice), transparent 60%);
}
.cm-sidebar-title {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--ice);
  margin-bottom: 12px;
}

/* Personal status card */
.cm-trust-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.cm-trust-ring-wrap { position: relative; flex-shrink: 0; }
.cm-trust-score-val {
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  font-weight: 700;
  color: var(--gold);
}
.cm-trust-label {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.cm-loop-stage-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
}
.cm-loop-node {
  flex: 1;
  height: 3px;
  border-radius: 2px;
  background: var(--border);
  position: relative;
  overflow: hidden;
}
.cm-loop-node.active { background: var(--ice); }
.cm-loop-node.done   { background: var(--green); }
.cm-loop-stage-label {
  font-family: 'Space Mono', monospace;
  font-size: 8px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-top: 4px;
  text-align: center;
}

/* Opportunity board */
.cm-opp-item {
  padding: 8px 0;
  border-bottom: 1px solid rgba(137,196,225,0.07);
}
.cm-opp-item:last-child { border-bottom: none; padding-bottom: 0; }
.cm-opp-label {
  font-family: 'Space Mono', monospace;
  font-size: 8px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 2px;
}
.cm-opp-label.skill  { color: var(--ice); }
.cm-opp-label.course { color: var(--green); }
.cm-opp-label.market { color: var(--gold); }
.cm-opp-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 1px;
  line-height: 1.4;
}
.cm-opp-desc {
  font-size: 11px;
  color: var(--text-dim);
  line-height: 1.4;
  margin-bottom: 5px;
}
.cm-opp-cta {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: var(--ice);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  letter-spacing: 0.04em;
  text-decoration: none;
}
.cm-opp-cta:hover { color: var(--text); }
.cm-opp-footer {
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(137,196,225,0.07);
  font-family: 'Space Mono', monospace;
  font-size: 8px;
  color: var(--text-dim);
  letter-spacing: 0.05em;
}

/* Trending topics */
.cm-trending-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid rgba(137,196,225,0.07);
  cursor: pointer;
}
.cm-trending-item:last-child { border-bottom: none; }
.cm-trending-item:hover .cm-trending-tag { color: var(--ice); }
.cm-trending-tag {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  color: var(--text-dim);
  transition: color 0.15s;
}
.cm-trending-count {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: var(--text-dim);
}
.cm-trending-arrow {
  font-size: 9px;
  color: var(--green);
  margin-left: 4px;
}

/* Community pulse */
.cm-stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  border-bottom: 1px solid rgba(137,196,225,0.07);
}
.cm-stat-row:last-child { border-bottom: none; padding-bottom: 0; }
.cm-stat-label {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
.cm-stat-val {
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  color: var(--text);
}

/* My Groups */
.cm-group-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 0;
  border-bottom: 1px solid rgba(137,196,225,0.07);
  cursor: pointer;
  transition: all 0.15s;
}
.cm-group-item:last-child { border-bottom: none; }
.cm-group-item:hover .cm-group-name { color: var(--ice); }
.cm-group-dot {
  width: 8px; height: 8px;
  border-radius: 50%;
  background: rgba(137,196,225,0.2);
  flex-shrink: 0;
}
.cm-group-dot.active {
  background: var(--green);
  box-shadow: 0 0 6px rgba(45,212,160,0.4);
}
.cm-group-name {
  flex: 1;
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  transition: color 0.15s;
}
.cm-group-new {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: var(--ice);
  background: rgba(137,196,225,0.1);
  padding: 1px 6px;
  border-radius: 8px;
}
.cm-group-join {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: var(--ice);
  background: none;
  border: 1px dashed rgba(137,196,225,0.25);
  border-radius: 6px;
  padding: 5px 10px;
  cursor: pointer;
  margin-top: 8px;
  width: 100%;
  transition: all 0.15s;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.cm-group-join:hover { background: rgba(137,196,225,0.07); border-color: rgba(137,196,225,0.4); }

/* ── ONLINE PRESENCE ── */
.cm-online-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 14px;
}
.cm-online-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--green);
  animation: livePulse 2s ease-in-out infinite;
  flex-shrink: 0;
}
.cm-online-label {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  color: var(--green);
  letter-spacing: 0.06em;
}

/* ── NEW POSTS BANNER ── */
.cm-new-posts-banner {
  position: sticky;
  top: 12px;
  z-index: 50;
  text-align: center;
  margin-bottom: 12px;
}
.cm-new-posts-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 16px;
  border-radius: 20px;
  background: var(--surface2);
  border: 1px solid rgba(137,196,225,0.25);
  color: var(--ice);
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(0,0,0,0.35);
  transition: all 0.15s;
  animation: bannerEnter 0.3s ease both;
}
.cm-new-posts-btn:hover { background: var(--surface); border-color: rgba(137,196,225,0.4); }

/* ── PINNED BADGE ── */
.cm-pinned-badge {
  font-family: 'Space Mono', monospace;
  font-size: 8px;
  color: var(--gold);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  padding: 2px 7px;
  border-radius: 4px;
  background: rgba(201,168,76,0.07);
  border: 1px solid rgba(201,168,76,0.14);
  margin-left: auto;
}

/* ── MOBILE ── */
@media (max-width: 900px) {
  .cm-sidebar { display: none; }
  .cm-feed { max-width: 100%; }
}
@media (max-width: 640px) {
  .cm-feed { padding: 16px 12px; }
  .cm-compose { padding: 12px; }
  .cm-page-title { font-size: 22px; }
  .cm-shortcut { display: none; }
}
`;

// ─── Types ────────────────────────────────────────────────────────────────────
interface SkillDetection {
  skillName: string;
  confidence: number;
  category: string;
}

interface Post {
  id: string;
  content: string;
  authorId: string;
  author: { id: string; name: string; role?: string };
  tags: { tag: { name: string } }[];
  likes: { userId: string }[];
  reactions?: { reaction: string; userId: string }[];
  userReaction?: string;
  comments: Comment[];
  isPinned: boolean;
  createdAt: string;
  _count?: { likes: number; comments: number };
  likeCount?: number;
  commentCount?: number;
  liked?: boolean;
  skillDetections?: SkillDetection[];
  loopStage?: "skill" | "course" | "income";
}

interface Comment {
  id: string;
  content: string;
  author: { name: string };
  createdAt: string;
}

interface Opportunity {
  type: "skill" | "course" | "market";
  label: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  supervisor: string;
}

interface RecommendationItem {
  id?: string;
  title: string;
  slug?: string;
  category?: string;
  level?: string;
  reason?: string;
  href?: string;
  budget?: number | string | null;
  link?: string;
  matchedSkills?: string[];
}

interface OpportunityBucket {
  label: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  supervisor: string;
  items?: RecommendationItem[];
}

interface CommunityOpportunitiesResponse {
  opportunities?: {
    skillMatch?: OpportunityBucket;
    learningGap?: OpportunityBucket;
    marketOpening?: OpportunityBucket;
  };
  lastUpdated?: string;
}

interface CommunityLoopStatusResponse {
  loop?: {
    stage?: number;
    stageName?: string;
    currentStage?: string;
  };
  skills?: Array<{ skill: string; confidence: number; category?: string }>;
  nextAction?: string;
}

interface HandoffCard {
  id: string;
  variant: "nova-sage" | "nova-circuit" | "nova-atlas";
  fromSupervisor: string;
  toSupervisor: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?";
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function trustTier(score: number): string {
  if (score >= 85) return "platinum";
  if (score >= 65) return "gold";
  if (score >= 40) return "silver";
  return "bronze";
}

function normalizeConfidence(raw: number): number {
  if (raw <= 1) return Number(raw.toFixed(2));
  return Number((raw / 100).toFixed(2));
}

function mapDetectedSkills(skills: Array<{ skill: string; confidence: number; category?: string }>): SkillDetection[] {
  return skills.map((skill) => ({
    skillName: skill.skill,
    confidence: normalizeConfidence(skill.confidence),
    category: skill.category ?? "technical",
  }));
}

function mapLoopStageIndex(stage?: string): number {
  if (!stage) return 0;
  const normalizedStage = stage.toLowerCase();
  const index = LOOP_STAGES.findIndex((value) => value === normalizedStage);
  return index >= 0 ? index : 0;
}

function createHandoffCards(recommendations: RecommendationItem[]): HandoffCard[] {
  return recommendations.slice(0, 2).map((item, index) => ({
    id: item.id ?? `${item.title}-${index}`,
    variant: "nova-sage",
    fromSupervisor: "NOVA",
    toSupervisor: "SAGE",
    title: `${item.title} is ready for certification`,
    description: item.reason ?? "SAGE found a course to deepen your detected skill.",
    ctaLabel: "Continue Your Loop →",
    ctaHref: item.href ?? "/academy",
  }));
}

function mapOpportunityBoard(opportunities?: CommunityOpportunitiesResponse["opportunities"]): Opportunity[] {
  const skillMatch = opportunities?.skillMatch;
  const learningGap = opportunities?.learningGap;
  const marketOpening = opportunities?.marketOpening;

  const skillItem = skillMatch?.items?.[0];
  const courseItem = learningGap?.items?.[0];

  return [
    {
      type: "skill",
      label: skillMatch?.label ?? "SKILL MATCH",
      supervisor: skillMatch?.supervisor ?? "CIRCUIT",
      title: skillItem?.title ?? skillMatch?.title ?? DEMO_OPPORTUNITIES[0].title,
      description:
        typeof skillItem?.budget !== "undefined" && skillItem?.budget !== null
          ? `${skillMatch?.description ?? "CIRCUIT matched this to your detected skills"} · Budget ${String(skillItem.budget)}`
          : skillMatch?.description ?? DEMO_OPPORTUNITIES[0].description,
      ctaLabel: skillMatch?.ctaLabel ?? DEMO_OPPORTUNITIES[0].ctaLabel,
      ctaHref: skillItem?.link ?? skillMatch?.ctaHref ?? DEMO_OPPORTUNITIES[0].ctaHref,
    },
    {
      type: "course",
      label: learningGap?.label ?? "LEARNING GAP",
      supervisor: learningGap?.supervisor ?? "SAGE",
      title: courseItem?.title ?? learningGap?.title ?? DEMO_OPPORTUNITIES[1].title,
      description: courseItem?.reason ?? learningGap?.description ?? DEMO_OPPORTUNITIES[1].description,
      ctaLabel: learningGap?.ctaLabel ?? DEMO_OPPORTUNITIES[1].ctaLabel,
      ctaHref: courseItem?.href ?? learningGap?.ctaHref ?? DEMO_OPPORTUNITIES[1].ctaHref,
    },
    {
      type: "market",
      label: marketOpening?.label ?? "MARKET OPENING",
      supervisor: marketOpening?.supervisor ?? "ATLAS",
      title: marketOpening?.title ?? DEMO_OPPORTUNITIES[2].title,
      description: marketOpening?.description ?? DEMO_OPPORTUNITIES[2].description,
      ctaLabel: marketOpening?.ctaLabel ?? DEMO_OPPORTUNITIES[2].ctaLabel,
      ctaHref: marketOpening?.ctaHref ?? DEMO_OPPORTUNITIES[2].ctaHref,
    },
  ];
}

function normalizeTags(tags: unknown): { tag: { name: string } }[] {
  if (!Array.isArray(tags)) return [];
  if (tags.length === 0) return [];

  if (typeof tags[0] === "string") {
    return (tags as string[]).map((tag) => ({ tag: { name: tag } }));
  }

  return (tags as Array<{ tag?: { name?: string } }>).map((item) => ({
    tag: { name: item?.tag?.name ?? "" },
  })).filter((item) => item.tag.name.length > 0);
}

function normalizePost(post: Partial<Post> & Record<string, unknown>, index: number, currentUserId?: string): Post {
  const tags = normalizeTags(post.tags);
  const likes = Array.isArray(post.likes)
    ? (post.likes as Array<{ userId?: string }>).filter((like) => !!like.userId).map((like) => ({ userId: String(like.userId) }))
    : [];
  const liked = Boolean(post.liked) || likes.some((like) => like.userId === currentUserId);

  const fallbackSkillDetections =
    tags.length > 0
      ? tags.slice(0, 2).map((tag) => ({
          skillName: tag.tag.name,
          confidence: 0.75 + Math.random() * 0.22,
          category: "technical",
        }))
      : [];

  return {
    id: String(post.id ?? ""),
    content: String(post.content ?? ""),
    authorId: String(post.authorId ?? ""),
    author: {
      id: String((post.author as { id?: string } | undefined)?.id ?? ""),
      name: String((post.author as { name?: string } | undefined)?.name ?? "Unknown"),
      role: (post.author as { role?: string } | undefined)?.role ?? "Member",
    },
    tags,
    likes: likes.length > 0 ? likes : liked && currentUserId ? [{ userId: currentUserId }] : [],
    comments: Array.isArray(post.comments) ? (post.comments as Comment[]) : [],
    isPinned: Boolean(post.isPinned),
    createdAt: String(post.createdAt ?? new Date().toISOString()),
    _count: post._count as { likes: number; comments: number } | undefined,
    likeCount: typeof post.likeCount === "number" ? post.likeCount : undefined,
    commentCount: typeof post.commentCount === "number" ? post.commentCount : undefined,
    liked,
    skillDetections: Array.isArray(post.skillDetections)
      ? (post.skillDetections as SkillDetection[])
      : fallbackSkillDetections,
    loopStage: index % 3 === 0 ? "skill" : index % 3 === 1 ? "course" : "income",
  };
}

// ─── Static demo data ─────────────────────────────────────────────────────────
const DEMO_OPPORTUNITIES: Opportunity[] = [
  {
    type: "skill",
    label: "SKILL MATCH",
    supervisor: "CIRCUIT",
    title: "React Developer — $2,400 contract",
    description: "CIRCUIT matched this to your detected skills",
    ctaLabel: "View Job →",
    ctaHref: "/work",
  },
  {
    type: "course",
    label: "LEARNING GAP",
    supervisor: "SAGE",
    title: "Advanced TypeScript — SAGE recommends",
    description: "Completes your development certification path",
    ctaLabel: "See Course →",
    ctaHref: "/academy",
  },
  {
    type: "market",
    label: "MARKET OPENING",
    supervisor: "ATLAS",
    title: "8 new Shopify dev jobs this week",
    description: "ATLAS: trending in African tech market",
    ctaLabel: "Explore →",
    ctaHref: "/market",
  },
];

const DEMO_TRENDING = [
  { tag: "#AfricanTech", count: 23 },
  { tag: "#NodeJS", count: 17 },
  { tag: "#DiasporaLife", count: 14 },
  { tag: "#Shopify", count: 11 },
  { tag: "#WinnersCreators", count: 9 },
];

const DEMO_GROUPS = [
  { name: "#AfricanTech", active: true, newPosts: 3 },
  { name: "#WinnersCreators", active: false, newPosts: 1 },
  { name: "#DiasporaLife", active: true, newPosts: 0 },
];

const LOOP_STAGES = ["community", "academy", "work", "market", "income"];

const REACTIONS = ["❤️", "🔥", "💡", "👏", "😂", "😱"];

const NOVA_INSIGHTS = [
  "Your last 3 posts got 2.4× more engagement than your average. Posting today compounds that momentum.",
  "NOVA detected React and TypeScript in your recent posts. SAGE has 3 courses that certify these skills.",
  "You have 7 followers you haven't engaged with this week. A comment or reply often converts a follower into a collaborator.",
  "The #AfricanTech group is most active on Tuesday mornings — your best window to post technical content.",
];

// ─── Skeleton ──────────────────────────────────────────────────────────────────
function PostSkeleton() {
  return (
    <div className="cm-skeleton-card">
      <div className="cm-skeleton-top">
        <div className="cm-skeleton-avatar" />
        <div style={{ flex: 1 }}>
          <div className="cm-skeleton-row short" />
          <div className="cm-skeleton-row tiny" />
        </div>
      </div>
      <div className="cm-skeleton-row wide" />
      <div className="cm-skeleton-row wide" />
      <div className="cm-skeleton-row med" />
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const token = useAuthStore((s) => s.token);
  const user  = useAuthStore((s) => s.user);

  // Feed state
  const [posts, setPosts]         = useState<Post[]>([]);
  const [loading, setLoading]     = useState(true);
  const [posting, setPosting]     = useState(false);
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(false);
  const [feedTab, setFeedTab]     = useState<"foryou" | "following" | "nova">("foryou");
  const [newPostsCount, setNewPostsCount] = useState(0);

  // Composer state
  const [content, setContent]       = useState("");
  const [tags, setTags]             = useState("");
  const [quickContent, setQuickContent] = useState("");
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set());

  // Comments state
  const [openComments, setOpenComments]           = useState<Set<string>>(new Set());
  const [commentText, setCommentText]             = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);

  // Reactions
  const [activeReactionPicker, setActiveReactionPicker] = useState<string | null>(null);
  const [savedPosts, setSavedPosts] = useState<Set<string>>(new Set());

  // NOVA state
  const [novaInsight, setNovaInsight]     = useState("");
  const [novaStreaming, setNovaStreaming] = useState(true);
  const [showNovaBanner, setShowNovaBanner] = useState(true);
  const [handoffCards, setHandoffCards]   = useState<HandoffCard[]>([]);
  const [detectedSkills, setDetectedSkills] = useState<SkillDetection[]>([]);
  const [opportunityBoard, setOpportunityBoard] = useState<Opportunity[]>(DEMO_OPPORTUNITIES);
  const [opportunityUpdatedAt, setOpportunityUpdatedAt] = useState<string | null>(null);
  const [nextLoopAction, setNextLoopAction] = useState("Post more to trigger skill detection");

  const [onlineCount, setOnlineCount]   = useState(43);
  const [totalPosts, setTotalPosts]     = useState(127);
  const [totalLikes, setTotalLikes]     = useState(891);
  const [loopStage, setLoopStage]       = useState(1);
  const [trustScore]                    = useState(67);

  const headers = useMemo(
    () => ({ Authorization: `Bearer ${token}`, "Content-Type": "application/json" }),
    [token],
  );

  const refreshCommunityIntelligence = useCallback(async () => {
    try {
      const [opportunitiesRes, loopStatusRes] = await Promise.all([
        fetch(`${API}/community/opportunities`, { headers }),
        fetch(`${API}/community/loop-status`, { headers }),
      ]);

      if (opportunitiesRes.ok) {
        const opportunitiesData = await opportunitiesRes.json() as CommunityOpportunitiesResponse;
        const courseRecommendations = opportunitiesData.opportunities?.learningGap?.items ?? [];
        setOpportunityBoard(mapOpportunityBoard(opportunitiesData.opportunities));
        setHandoffCards(createHandoffCards(courseRecommendations));
        setOpportunityUpdatedAt(opportunitiesData.lastUpdated ?? new Date().toISOString());
      }

      if (loopStatusRes.ok) {
        const loopStatusData = await loopStatusRes.json() as CommunityLoopStatusResponse;
        const mappedSkills = Array.isArray(loopStatusData.skills)
          ? mapDetectedSkills(loopStatusData.skills)
          : [];
        setDetectedSkills(mappedSkills);
        setLoopStage(mapLoopStageIndex(loopStatusData.loop?.currentStage));
        setNextLoopAction(loopStatusData.nextAction ?? "Post more to trigger skill detection");
      }
    } catch {
    }
  }, [headers]);

  // ── Fetch posts ──────────────────────────────────────────────────────────────
  const fetchPosts = useCallback(async (p = 1, append = false) => {
    if (p === 1) setLoading(true);
    try {
      const endpoint =
        feedTab === "nova"
          ? `${API}/community/feed/intelligence?page=${p}&limit=10`
          : `${API}/posts?page=${p}&limit=10`;
      const res = await fetch(endpoint, { headers });
      if (!res.ok) throw new Error("Failed to fetch posts");

      const data = await res.json();
      const list: Post[] = (data.posts ?? []).map(
        (post: Partial<Post> & Record<string, unknown>, i: number) => normalizePost(post, i, user?.id),
      );

      setPosts((prev) => append ? [...prev, ...list] : list);
      setHasMore(
        Boolean(
          data.hasMore ??
          (typeof data?.pagination?.pages === "number" ? p < data.pagination.pages : false),
        ),
      );
      if (append) setTotalPosts((n) => n + list.length);
    } catch {
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [feedTab, headers, user?.id]);

  useEffect(() => { fetchPosts(1); }, [fetchPosts]);

  useEffect(() => {
    refreshCommunityIntelligence();
  }, [refreshCommunityIntelligence]);

  useEffect(() => {
    let cancelled = false;

    const loadSavedPosts = async () => {
      try {
        const res = await fetch(`${API}/community/posts/saved`, { headers });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        const ids = new Set<string>(
          Array.isArray(data?.saved)
            ? data.saved.map((post: { id?: string }) => String(post?.id ?? "")).filter(Boolean)
            : [],
        );
        setSavedPosts(ids);
      } catch {
        // Ignore transient saved-post fetch issues.
      }
    };

    loadSavedPosts();
    return () => {
      cancelled = true;
    };
  }, [headers]);

  useEffect(() => {
    let cancelled = false;
    setNovaStreaming(true);

    const loadInsight = async () => {
      try {
        const res = await fetch(`${API}/community/insights/banner`, { headers });
        if (!res.ok) throw new Error("Failed to fetch insight");
        const data = await res.json();
        if (cancelled) return;
        setNovaInsight(String(data?.insight ?? ""));
      } catch {
        const fallback = NOVA_INSIGHTS[Math.floor(Math.random() * NOVA_INSIGHTS.length)];
        if (cancelled) return;
        setNovaInsight(fallback);
      } finally {
        if (!cancelled) setNovaStreaming(false);
      }
    };

    loadInsight();
    return () => {
      cancelled = true;
    };
  }, [headers]);

  useEffect(() => {
    const persistFeedMode = async () => {
      const feedMode = feedTab === "nova" ? "intelligence" : feedTab;
      try {
        await fetch(`${API}/community/feed-preferences`, {
          method: "PUT",
          headers,
          body: JSON.stringify({ feedMode }),
        });
      } catch {
        // Feed preference sync failure should not block UI.
      }
    };

    persistFeedMode();
  }, [feedTab, headers]);

  useEffect(() => {
    if (feedTab === "nova") {
      setNewPostsCount(0);
      return;
    }
    const t = setTimeout(() => setNewPostsCount(2), 18000);
    return () => clearTimeout(t);
  }, [feedTab]);

  // ── Post handlers ──────────────────────────────────────────────────────────── ────────────────────────────────────────────────────────────
  const handlePost = async (c = content, t = tags) => {
    if (!c.trim() || posting) return;
    setPosting(true);
    try {
      const tagArr = t.split(",").map((s) => s.trim()).filter(Boolean);
      const res = await fetch(`${API}/posts`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content: c, tags: tagArr }),
      });
      if (res.ok) {
        const newPost = await res.json();
        let skillDetections: SkillDetection[] = [];

        try {
          const skillRes = await fetch(`${API}/community/skills/detect`, {
            method: "POST",
            headers,
            body: JSON.stringify({ content: c, postId: newPost.id }),
          });
          if (skillRes.ok) {
            const skillData = await skillRes.json();
            if (Array.isArray(skillData?.skills)) {
              skillDetections = mapDetectedSkills(skillData.skills);
            }
          }
        } catch {
          skillDetections = tagArr.slice(0, 2).map((tag) => ({
            skillName: tag,
            confidence: 0.85,
            category: "technical",
          }));
        }

        const enriched = normalizePost(
          { ...newPost, skillDetections },
          0,
          user?.id,
        );
        enriched.loopStage = "skill";

        setPosts((prev) => [enriched, ...prev]);
        setContent("");
        setTags("");
        setQuickContent("");
        setTotalPosts((n) => n + 1);

        if (skillDetections.length > 0) {
          setDetectedSkills(skillDetections);
        }

        await refreshCommunityIntelligence();
      }
    } finally {
      setPosting(false);
    }
  };

  const handleQuickPost = () => {
    if (quickContent.trim()) {
      handlePost(quickContent, "");
    }
  };

  const handleLike = async (postId: string) => {
    const res = await fetch(`${API}/posts/${postId}/like`, { method: "POST", headers });
    const data = await res.json();
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const hasMyLike = p.likes?.some((l) => l.userId === user?.id);
        const currentLikes = p.likes ?? [];
        const currentLikeCount = p.likeCount ?? p._count?.likes ?? currentLikes.length;
        if (data.liked === true && !hasMyLike)
          return {
            ...p,
            likes: [...currentLikes, { userId: user?.id ?? "" }],
            liked: true,
            likeCount: currentLikeCount + 1,
          };
        if (data.liked === false && hasMyLike)
          return {
            ...p,
            likes: currentLikes.filter((l) => l.userId !== user?.id),
            liked: false,
            likeCount: Math.max(0, currentLikeCount - 1),
          };
        return p;
      })
    );
  };

  // Handle six-reaction system
  const handleReaction = async (postId: string, reaction: string) => {
    try {
      const res = await fetch(`${API}/community/posts/${postId}/react`, {
        method: "POST",
        headers,
        body: JSON.stringify({ reaction }),
      });
      if (res.ok) {
        const data = await res.json();
        setPosts((prev) =>
          prev.map((p) => {
            if (p.id !== postId) return p;
            return {
              ...p,
              reactions: Array.isArray(data?.reactions) ? (data.reactions as { reaction: string; userId: string }[]) : (p.reactions ?? []),
              userReaction: reaction,
            };
          })
        );
      } else {
        // Fallback to like if reaction endpoint not available
        handleLike(postId);
      }
    } catch {
      // Fallback to like on error
      handleLike(postId);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    await fetch(`${API}/posts/${postId}`, { method: "DELETE", headers });
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleComment = async (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!text) return;
    setSubmittingComment(postId);
    try {
      const res = await fetch(`${API}/posts/${postId}/comments`, {
        method: "POST",
        headers,
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const newComment = await res.json();
        setCommentText((prev) => ({ ...prev, [postId]: "" }));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, comments: [...(p.comments ?? []), newComment] }
              : p
          )
        );
      }
    } finally {
      setSubmittingComment(null);
    }
  };

  const toggleExpand = (postId: string) =>
    setExpandedPosts((prev) => {
      const n = new Set(prev);
      n.has(postId) ? n.delete(postId) : n.add(postId);
      return n;
    });

  const toggleComments = (postId: string) =>
    setOpenComments((prev) => {
      const n = new Set(prev);
      n.has(postId) ? n.delete(postId) : n.add(postId);
      return n;
    });

  const toggleSave = async (postId: string) => {
    const isSaved = savedPosts.has(postId);
    const method = isSaved ? "DELETE" : "POST";
    const body = isSaved ? undefined : JSON.stringify({ isPublic: false });

    const res = await fetch(`${API}/community/posts/${postId}/save`, {
      method,
      headers,
      body,
    });
    if (!res.ok) return;

    setSavedPosts((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  const handleQuote = async (postId: string) => {
    const commentary = prompt("Add commentary for your quote-share (optional):");
    if (commentary === null) return;

    const res = await fetch(`${API}/community/posts/${postId}/quote`, {
      method: "POST",
      headers,
      body: JSON.stringify({ commentary }),
    });
    if (!res.ok) return;

    const data = await res.json();
    if (!data?.post) return;

    const normalized = normalizePost(data.post as Partial<Post> & Record<string, unknown>, 0, user?.id);
    normalized.loopStage = "skill";
    setPosts((prev) => [normalized, ...prev]);
    setTotalPosts((n) => n + 1);
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPosts(next, true);
  };

  const dismissHandoff = (id: string) =>
    setHandoffCards((prev) => prev.filter((c) => c.id !== id));

  const tier = trustTier(trustScore);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      
      {/* Universal Sub-Navigation */}
      <LayerSubNav
        layer="community"
        items={[
          { id: "feed", label: "Feed", href: "/community" },
          { id: "groups", label: "Groups", href: "/community/groups", badge: 3, badgeType: "normal" },
          { id: "discover", label: "Discover", href: "/community/discover" },
          { id: "messages", label: "Messages", href: "/messages", badge: 2, badgeType: "alert" },
          { id: "saved", label: "Saved", href: "/community/saved" },
          { id: "analytics", label: "Analytics", href: "/community/analytics" },
        ]}
        smartAction={{
          label: "3 posts match your skills",
          supervisor: "nova",
          href: "/community?nova=insights",
          urgency: "normal",
        }}
      />
      
      <div className="cm-root">

        {/* ── FEED ── */}
        <div className="cm-feed">

          {/* Header */}
          <div className="cm-page-header">
            <h1 className="cm-page-title">
              Winners <em>Community</em>
            </h1>
            <AIInsightBanner page="community" assistant="nova" />
            <div className="cm-page-live">
              <div className="cm-live-dot" />
              Live
            </div>
          </div>

          {/* Ecosystem Context Bar */}
          <ContextBar activeLayer="community" showLabels={true} />

          {/* NOVA Insight Banner */}
          {showNovaBanner && (
            <div className="cm-nova-banner">
              <span className="cm-nova-label">NOVA</span>
              <span className={`cm-nova-text ${novaStreaming ? "cm-nova-cursor" : ""}`}>
                {novaInsight}
              </span>
              <button className="cm-nova-dismiss" onClick={() => setShowNovaBanner(false)}>×</button>
            </div>
          )}

          {/* New posts floating banner */}
          {newPostsCount > 0 && (
            <div className="cm-new-posts-banner">
              <button
                className="cm-new-posts-btn"
                onClick={() => { fetchPosts(1); setNewPostsCount(0); }}
              >
                ↑ {newPostsCount} new posts — click to load
              </button>
            </div>
          )}

          {/* Feed Tabs */}
          <div className="cm-feed-tabs">
            <button
              className={`cm-tab ${feedTab === "foryou" ? "active" : ""}`}
              onClick={() => { setPage(1); setFeedTab("foryou"); }}
            >
              For You
            </button>
            <button
              className={`cm-tab ${feedTab === "following" ? "active" : ""}`}
              onClick={() => { setPage(1); setFeedTab("following"); }}
            >
              Following
            </button>
            <button
              className={`cm-tab cm-tab-nova ${feedTab === "nova" ? "active" : ""}`}
              onClick={() => { setPage(1); setFeedTab("nova"); }}
            >
              🤖 NOVA Intelligence
            </button>
          </div>

          {/* Quick Post (X-style) */}
          <div className="cm-quick-post">
            <input
              className="cm-quick-input"
              placeholder="Quick thought? Post in seconds..."
              value={quickContent}
              maxLength={260}
              onChange={(e) => setQuickContent(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleQuickPost(); } }}
            />
            <span className={`cm-quick-counter ${quickContent.length > 220 ? "warn" : ""} ${quickContent.length > 240 ? "over" : ""}`}>
              {quickContent.length}/240
            </span>
            <button
              className="cm-quick-btn"
              disabled={!quickContent.trim() || posting}
              onClick={handleQuickPost}
            >
              Post
            </button>
          </div>

          {/* Main Composer */}
          <div className="cm-compose">
            <div className="cm-compose-top">
              <div className="cm-avatar">
                <div className={`cm-avatar-ring ${tier}`} />
                {initials(user?.name ?? "")}
              </div>
              <textarea
                className="cm-compose-input"
                placeholder={feedTab === "nova" ? "Share a skill, a build, a lesson — NOVA is watching." : "What are you building today?"}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) handlePost(); }}
              />
            </div>
            <div className="cm-compose-footer">
              <div className="cm-compose-tools">
                <button className="cm-tool-btn" title="Voice post">🎙️</button>
                <button className="cm-tool-btn" title="Image">📷</button>
                <button className="cm-tool-btn" title="Thread">🧵</button>
                <button className="cm-tool-btn" title="Schedule">📅</button>
              </div>
              <input
                className="cm-tag-input"
                placeholder="#tags, comma separated"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <div className="cm-compose-right">
                <select className="cm-audience-select">
                  <option>Everyone</option>
                  <option>Followers</option>
                  <option>Group</option>
                  <option>Subscribers</option>
                </select>
                <span className="cm-shortcut">⌘+Enter</span>
                <button
                  className="cm-post-btn"
                  disabled={!content.trim() || posting}
                  onClick={() => handlePost()}
                >
                  {posting ? "Posting…" : "Post →"}
                </button>
              </div>
            </div>
          </div>

          {detectedSkills.length > 0 && (
            <div className="cm-handoff nova-sage">
              <div className="cm-handoff-header">
                <span className="cm-handoff-from">NOVA</span>
                <span className="cm-handoff-arrow">→</span>
                <span className="cm-handoff-to">OMEGA</span>
              </div>
              <div className="cm-handoff-title">Skills detected from your recent Community activity</div>
              <div className="cm-handoff-desc">{nextLoopAction}</div>
              <div className="cm-skill-badges" style={{ marginTop: 12 }}>
                {detectedSkills.slice(0, 4).map((skill) => (
                  <div key={skill.skillName} className="cm-skill-badge" title={`NOVA detected ${skill.skillName} with ${Math.round(skill.confidence * 100)}% confidence`}>
                    <span className="cm-skill-badge-nova">NOVA</span>
                    <div className="cm-skill-confidence">
                      <div className="cm-skill-confidence-fill" style={{ width: `${skill.confidence * 100}%` }} />
                    </div>
                    {skill.skillName}
                  </div>
                ))}
              </div>
            </div>
          )}

          {handoffCards.map((card) => (
            <div key={card.id} className={`cm-handoff ${card.variant}`}>
              <div className="cm-handoff-header">
                <span className="cm-handoff-from">{card.fromSupervisor}</span>
                <span className="cm-handoff-arrow">→</span>
                <span className="cm-handoff-to">{card.toSupervisor}</span>
                <button className="cm-handoff-dismiss" onClick={() => dismissHandoff(card.id)}>×</button>
              </div>
              <div className="cm-handoff-title">{card.title}</div>
              <div className="cm-handoff-desc">{card.description}</div>
              <a href={card.ctaHref} className="cm-handoff-cta">{card.ctaLabel}</a>
            </div>
          ))}

          {/* Feed */}
          {loading ? (
            <>
              <PostSkeleton />
              <PostSkeleton />
              <PostSkeleton />
            </>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "48px 20px", color: "var(--text-dim)" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🧑‍🤝‍🧑</div>
              <div style={{ fontFamily: "Syne", fontWeight: 700, marginBottom: 6 }}>No posts yet</div>
              <div style={{ fontFamily: "Space Mono", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                Be the first to post in this community
              </div>
            </div>
          ) : (
            posts.map((post) => {
              const isLiked     = post.liked ?? post.likes?.some((l) => l.userId === user?.id);
              const isSaved     = savedPosts.has(post.id);
              const isExpanded  = expandedPosts.has(post.id);
              const showMore    = post.content.length > 220 && !isExpanded;
              const likeCount   = post.likeCount ?? post._count?.likes ?? post.likes?.length ?? 0;
              const commentCount = post.commentCount ?? post._count?.comments ?? post.comments?.length ?? 0;
              const isOwnPost   = post.authorId === user?.id;
              const postTier    = trustTier(Math.floor(Math.random() * 40) + 50);

              return (
                <div
                  key={post.id}
                  className={`cm-post ${post.content.length < 120 ? "compact" : ""}`}
                >
                  {/* Header */}
                  <div className="cm-post-header">
                    <div className="cm-post-avatar">
                      <div className={`cm-post-avatar-ring ${postTier}`} />
                      {initials(post.author?.name ?? "")}
                    </div>
                    <div className="cm-post-info">
                      <div className="cm-post-name">{post.author?.name ?? "Unknown"}</div>
                      <div className="cm-post-meta">
                        <span className="cm-post-role">{post.author?.role ?? "Member"}</span>
                        <span className="cm-post-time">{timeAgo(post.createdAt)}</span>
                        {Math.random() > 0.6 && <div className="cm-post-online" title="Online now" />}
                      </div>
                    </div>
                    {post.isPinned && <span className="cm-pinned-badge">📌 Pinned</span>}
                    {post.loopStage && !post.isPinned && (
                      <span className={`cm-loop-badge ${post.loopStage}`}>
                        {post.loopStage === "skill" ? "🔵 Skill" : post.loopStage === "course" ? "🟢 Course" : "🟡 Income"}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className={`cm-post-body ${showMore ? "collapsed" : ""}`}>
                    {post.content}
                  </div>
                  {showMore && (
                    <button className="cm-read-more" onClick={() => toggleExpand(post.id)}>
                      Read more ↓
                    </button>
                  )}

                  {/* NOVA Skill badges */}
                  {post.skillDetections && post.skillDetections.length > 0 && (
                    <div className="cm-skill-badges">
                      {post.skillDetections.map((s, i) => (
                        <div key={i} className="cm-skill-badge" title={`NOVA detected ${s.skillName} with ${Math.round(s.confidence * 100)}% confidence`}>
                          <span className="cm-skill-badge-nova">NOVA</span>
                          <div className="cm-skill-confidence">
                            <div className="cm-skill-confidence-fill" style={{ width: `${s.confidence * 100}%` }} />
                          </div>
                          {s.skillName}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tags */}
                  {post.tags?.length > 0 && (
                    <div className="cm-post-tags">
                      {post.tags.map((t, i) => (
                        <span key={i} className="cm-tag">#{t.tag.name}</span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="cm-post-actions">
                    {/* Like with reactions */}
                    <div className="cm-reactions-picker">
                      {activeReactionPicker === post.id && (
                        <div className="cm-reactions-popup">
                          {REACTIONS.map((r) => (
                            <span
                              key={r}
                              className="cm-reaction-opt"
                              onClick={() => {
                                handleLike(post.id);
                                setActiveReactionPicker(null);
                              }}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      )}
                      <button
                        className={`cm-action-btn ${isLiked ? "liked" : ""}`}
                        onClick={() => handleLike(post.id)}
                        onMouseEnter={() => !isLiked && setActiveReactionPicker(post.id)}
                        onMouseLeave={() => setActiveReactionPicker(null)}
                      >
                        <span className="like-icon">{isLiked ? "❤️" : "🤍"}</span>
                        {likeCount > 0 && likeCount}
                      </button>
                    </div>

                    <button
                      className="cm-action-btn"
                      onClick={() => toggleComments(post.id)}
                    >
                      💬 {commentCount > 0 && commentCount}
                    </button>

                    <button
                      className="cm-action-btn"
                      title="Quote-share"
                      onClick={() => handleQuote(post.id)}
                    >
                      ↗ Quote
                    </button>

                    <button
                      className={`cm-action-btn ${isSaved ? "saved" : ""}`}
                      onClick={() => toggleSave(post.id)}
                      title={isSaved ? "Saved" : "Save post"}
                    >
                      {isSaved ? "🔖" : "🔖"}
                    </button>

                    {isOwnPost && (
                      <button className="cm-action-btn delete" onClick={() => handleDelete(post.id)}>
                        🗑
                      </button>
                    )}
                  </div>

                  {/* Comments */}
                  {openComments.has(post.id) && (
                    <div className="cm-comments">
                      {post.comments?.length > 0 && (
                        <div className="cm-comment-list">
                          {post.comments.map((c) => (
                            <div key={c.id} className="cm-comment">
                              <div className="cm-comment-avatar">{initials(c.author?.name ?? "")}</div>
                              <div className="cm-comment-bubble">
                                <div className="cm-comment-author">{c.author?.name}</div>
                                <div className="cm-comment-text">{c.content}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="cm-comment-form">
                        <input
                          className="cm-comment-input"
                          placeholder="Write a comment..."
                          value={commentText[post.id] ?? ""}
                          onChange={(e) => setCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))}
                          onKeyDown={(e) => { if (e.key === "Enter") handleComment(post.id); }}
                        />
                        <button
                          className="cm-comment-submit"
                          disabled={!commentText[post.id]?.trim() || submittingComment === post.id}
                          onClick={() => handleComment(post.id)}
                        >
                          {submittingComment === post.id ? "…" : "Reply"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Load more */}
          {hasMore && !loading && (
            <div className="cm-load-more">
              <button className="cm-load-more-btn" onClick={loadMore}>
                Load more posts
              </button>
            </div>
          )}
        </div>

        {/* ── SIDEBAR ── */}
        <div className="cm-sidebar">

          {/* Personal Status */}
          <div className="cm-sidebar-card">
            <div className="cm-sidebar-title">Your Status</div>
            <div className="cm-online-row">
              <div className="cm-online-dot" />
              <span className="cm-online-label">{onlineCount} online now</span>
            </div>
            <div className="cm-trust-row">
              <div>
                <div className="cm-trust-score-val">{trustScore}</div>
                <div className="cm-trust-label">Trust Score · {tier.charAt(0).toUpperCase() + tier.slice(1)}</div>
              </div>
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ fontFamily: "Space Mono", fontSize: 8, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>
                Agentic Loop
              </div>
              <div className="cm-loop-stage-bar">
                {LOOP_STAGES.map((s, i) => (
                  <div key={s} className={`cm-loop-node ${i < loopStage ? "done" : i === loopStage ? "active" : ""}`} title={s} />
                ))}
              </div>
              <div className="cm-loop-stage-label">
                Stage {loopStage + 1}/5 · {LOOP_STAGES[loopStage]}
              </div>
            </div>
          </div>

          <div className="cm-sidebar-card">
            <div className="cm-sidebar-title">NOVA · Opportunities</div>
            {opportunityBoard.map((opp, i) => (
              <div key={i} className="cm-opp-item">
                <div className={`cm-opp-label ${opp.type}`}>
                  {opp.label} · {opp.supervisor}
                </div>
                <div className="cm-opp-title">{opp.title}</div>
                <div className="cm-opp-desc">{opp.description}</div>
                <a href={opp.ctaHref} className="cm-opp-cta">{opp.ctaLabel}</a>
              </div>
            ))}
            <div className="cm-opp-footer">
              Powered by OMEGA · Updated {opportunityUpdatedAt ? timeAgo(opportunityUpdatedAt) : "just now"}
            </div>
          </div>

          {/* Trending Topics */}
          <div className="cm-sidebar-card">
            <div className="cm-sidebar-title">Trending Now</div>
            {DEMO_TRENDING.map((t, i) => (
              <div key={i} className="cm-trending-item" onClick={() => setTags(t.tag.replace("#", ""))}>
                <span className="cm-trending-tag">{t.tag}</span>
                <span className="cm-trending-count">
                  {t.count} posts<span className="cm-trending-arrow">↑</span>
                </span>
              </div>
            ))}
          </div>

          {/* Community Pulse */}
          <div className="cm-sidebar-card">
            <div className="cm-sidebar-title">Community Pulse</div>
            <div className="cm-stat-row">
              <span className="cm-stat-label">Posts today</span>
              <span className="cm-stat-val">{totalPosts}</span>
            </div>
            <div className="cm-stat-row">
              <span className="cm-stat-label">Likes today</span>
              <span className="cm-stat-val">{totalLikes}</span>
            </div>
            <div className="cm-stat-row">
              <span className="cm-stat-label">Members online</span>
              <span className="cm-stat-val">{onlineCount}</span>
            </div>
            <div className="cm-stat-row">
              <span className="cm-stat-label">Active groups</span>
              <span className="cm-stat-val">6</span>
            </div>
          </div>

          {/* My Groups */}
          <div className="cm-sidebar-card">
            <div className="cm-sidebar-title">My Groups</div>
            {DEMO_GROUPS.map((g, i) => (
              <div key={i} className="cm-group-item">
                <div className={`cm-group-dot ${g.active ? "active" : ""}`} />
                <span className="cm-group-name">{g.name}</span>
                {g.newPosts > 0 && (
                  <span className="cm-group-new">{g.newPosts} new</span>
                )}
              </div>
            ))}
            <button className="cm-group-join">+ Join a Group</button>
          </div>

        </div>
      </div>

      <AssistantPanel
        assistant="nova"
        page="community"
        userId={user?.id}
        context={{ totalPosts, totalLikes, onlineCount }}
      />
    </>
  );
}

