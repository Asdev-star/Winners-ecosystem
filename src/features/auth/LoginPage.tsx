// src/features/auth/LoginPage.tsx

import { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { getPostLoginPath, useAuthStore, type AuthUser } from "./authStore";
import { OMEGA_WELCOME_KEY, type OmegaLaunchWelcome } from "../onboarding/omegaLaunchWelcome";

import { API_BASE } from "../../lib/api";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .lp-root {
    min-height: 100vh; background: var(--bg);
    display: flex; flex-direction: row; align-items: stretch;
    font-family: 'Syne', sans-serif; color: var(--text); overflow: hidden;
  }

  .lp-left {
    width: 460px; flex-shrink: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 48px 36px; border-right: 1px solid var(--border);
    position: relative; z-index: 1; background: var(--surface);
  }
  .lp-left::before {
    content: ''; position: absolute; inset: 0; pointer-events: none;
    background: linear-gradient(180deg, rgba(43,95,142,0.06) 0%, transparent 50%, rgba(201,168,76,0.03) 100%);
  }

  .lp-card {
    width: 100%; max-width: 360px; position: relative; z-index: 1;
    animation: lp-fadeUp 0.4s ease forwards;
  }

  .lp-logo-area { display: flex; align-items: center; gap: 12px; margin-bottom: 32px; }
  .lp-logo-img { width: 42px; height: 42px; border-radius: 10px; object-fit: cover; border: 2px solid var(--gold); box-shadow: 0 0 16px rgba(201,168,76,0.2); flex-shrink: 0; }
  .lp-logo-fallback { width: 42px; height: 42px; border-radius: 10px; border: 2px solid var(--gold); background: rgba(201,168,76,0.1); display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
  .lp-logo-name { font-size: 14px; font-weight: 800; color: var(--text); letter-spacing: -0.3px; }
  .lp-logo-tag  { font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 2px; text-transform: uppercase; color: var(--gold); }

  .lp-title { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 4px; }
  .lp-title span { color: var(--gold); }
  .lp-subtitle { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); margin-bottom: 28px; }

  .lp-alert { background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2); border-radius: 14px; padding: 10px 14px; font-family: 'Space Mono', monospace; font-size: 10px; color: var(--red); margin-bottom: 18px; }

  .lp-oauth-row { display: flex; gap: 8px; margin-bottom: 10px; }
  .lp-google { flex: 1; background: var(--surface2); border: 1px solid var(--border); border-radius: 14px; padding: 11px 14px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600; color: var(--text); cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .lp-google:hover { border-color: var(--gold); background: rgba(201,168,76,0.04); }
  .lp-google-icon { width: 17px; height: 17px; flex-shrink: 0; }
  .lp-facebook { flex: 1; background: var(--surface2); border: 1px solid var(--border); border-radius: 14px; padding: 11px 14px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600; color: var(--text); cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 8px; }
  .lp-facebook:hover { border-color: #4267B2; background: rgba(66,103,178,0.06); }
  .lp-facebook-icon { width: 17px; height: 17px; flex-shrink: 0; }

  .lp-divider { display: flex; align-items: center; gap: 10px; margin: 16px 0; }
  .lp-divider-line { flex: 1; height: 1px; background: var(--border); }
  .lp-divider-text { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); }

  .lp-field { margin-bottom: 14px; }
  .lp-label { display: block; font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 7px; }
  .lp-input { width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 14px; padding: 11px 14px; font-family: 'Space Mono', monospace; font-size: 12px; color: var(--text); outline: none; transition: border-color 0.15s, box-shadow 0.15s; box-sizing: border-box; }
  .lp-input::placeholder { color: var(--text-dim); }
  .lp-input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.08); }
  .lp-input.error { border-color: var(--red); }
  .lp-field-error { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--red); margin-top: 5px; }

  .lp-forgot { text-align: right; margin-top: -6px; margin-bottom: 14px; }
  .lp-forgot span { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); cursor: pointer; transition: color 0.15s; }
  .lp-forgot span:hover { color: var(--gold); }

  .lp-submit { width: 100%; background: var(--gold); color: var(--bg); border: none; border-radius: 999px; padding: 12px; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.15s; margin-top: 4px; }
  .lp-submit:hover:not(:disabled) { background: var(--gold2); transform: translateY(-1px); }
  .lp-submit:disabled { opacity: 0.5; cursor: not-allowed; }
  .lp-loading { display: inline-flex; align-items: center; gap: 8px; }
  .lp-spinner { width: 13px; height: 13px; border: 2px solid rgba(8,11,16,0.3); border-top-color: var(--bg); border-radius: 50%; animation: lp-spin 0.7s linear infinite; }

  .lp-card-footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border); font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); text-align: center; line-height: 1.5; }
  .lp-card-footer a { color: var(--gold); text-decoration: none; cursor: pointer; }

  /* ── OTP Screen ── */
  .lp-otp-screen { animation: lp-fadeUp 0.3s ease forwards; }
  .lp-otp-icon { width: 52px; height: 52px; border-radius: 18px; background: rgba(137,196,225,0.1); border: 1px solid rgba(137,196,225,0.2); display: flex; align-items: center; justify-content: center; font-size: 22px; margin-bottom: 20px; }
  .lp-otp-title { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 6px; }
  .lp-otp-title span { color: var(--ice); }
  .lp-otp-subtitle { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); margin-bottom: 28px; line-height: 1.7; }
  .lp-otp-subtitle strong { color: var(--ice); }

  .lp-otp-boxes { display: flex; gap: 8px; margin-bottom: 24px; }
  .lp-otp-box { flex: 1; height: 52px; background: var(--surface2); border: 1px solid var(--border); border-radius: 14px; font-family: 'Space Mono', monospace; font-size: 20px; font-weight: 700; color: var(--text); text-align: center; outline: none; transition: border-color 0.15s, box-shadow 0.15s; caret-color: var(--gold); }
  .lp-otp-box:focus { border-color: var(--ice); box-shadow: 0 0 0 3px rgba(137,196,225,0.1); }
  .lp-otp-box.filled { border-color: rgba(201,168,76,0.4); }
  .lp-otp-box.otp-error { border-color: var(--red); animation: lp-shake 0.3s ease; }

  .lp-otp-resend { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); text-align: center; margin-top: 16px; }
  .lp-otp-resend button { background: none; border: none; color: var(--gold); cursor: pointer; font-family: 'Space Mono', monospace; font-size: 9px; padding: 0; transition: opacity 0.15s; }
  .lp-otp-resend button:disabled { opacity: 0.4; cursor: not-allowed; }

  .lp-back-btn { display: flex; align-items: center; gap: 6px; background: none; border: none; color: var(--text-dim); font-family: 'Space Mono', monospace; font-size: 9px; cursor: pointer; padding: 0; margin-bottom: 24px; transition: color 0.15s; }
  .lp-back-btn:hover { color: var(--ice); }

  /* ── Right panel ── */
  .lp-right { flex: 1; display: flex; flex-direction: column; justify-content: center; padding: 60px 64px; position: relative; overflow: hidden; background: var(--bg); }
  .lp-right-grid { position: absolute; inset: 0; pointer-events: none; background-image: linear-gradient(rgba(43,95,142,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(43,95,142,0.04) 1px, transparent 1px); background-size: 52px 52px; }
  .lp-right-glow { position: absolute; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(43,95,142,0.08) 0%, rgba(201,168,76,0.03) 40%, transparent 70%); top: 30%; left: 40%; transform: translate(-50%, -50%); pointer-events: none; }
  .lp-right-content { position: relative; z-index: 1; max-width: 520px; }

  .lp-panel-eyebrow { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 3px; text-transform: uppercase; color: var(--gold); margin-bottom: 14px; display: flex; align-items: center; gap: 10px; }
  .lp-panel-eyebrow::before { content: ''; width: 24px; height: 1px; background: var(--gold); }
  .lp-panel-title { font-family: 'Syne', sans-serif; font-size: 36px; font-weight: 800; color: var(--text); line-height: 1.05; margin-bottom: 10px; letter-spacing: -0.04em; }
  .lp-panel-title span { color: var(--gold); }
  .lp-panel-title .ice { color: var(--ice); }
  .lp-panel-desc { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); line-height: 1.8; margin-bottom: 28px; }

  .lp-platforms { display: flex; flex-direction: column; gap: 8px; margin-bottom: 24px; }
  .lp-platform-row { display: flex; align-items: center; gap: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 12px 16px; transition: border-color 0.15s; }
  .lp-platform-row:hover { border-color: rgba(201,168,76,0.2); }
  .lp-platform-row.active { border-color: rgba(74,222,128,0.2); background: rgba(74,222,128,0.03); }
  .lp-platform-icon { font-size: 18px; width: 22px; text-align: center; flex-shrink: 0; }
  .lp-platform-info { flex: 1; }
  .lp-platform-name { font-size: 12px; font-weight: 700; margin-bottom: 2px; }
  .lp-platform-desc { font-family: 'Space Mono', monospace; font-size: 8px; color: var(--text-dim); }
  .lp-platform-badge { font-family: 'Space Mono', monospace; font-size: 7px; padding: 2px 7px; border-radius: 4px; flex-shrink: 0; }
  .lp-platform-badge.live    { background: rgba(74,222,128,0.1);  color: var(--green); border: 1px solid rgba(74,222,128,0.2); }
  .lp-platform-badge.soon    { background: rgba(137,196,225,0.08); color: var(--ice);   border: 1px solid rgba(137,196,225,0.15); }
  .lp-platform-badge.planned { background: rgba(43,95,142,0.08);  color: var(--text-dim); border: 1px solid var(--border); }

  .lp-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); margin-bottom: 20px; border-radius: 18px; overflow: hidden; }
  .lp-stat { background: var(--surface); padding: 14px 16px; }
  .lp-stat-value { font-size: 20px; font-weight: 800; color: var(--gold); line-height: 1; margin-bottom: 4px; }
  .lp-stat-label { font-family: 'Space Mono', monospace; font-size: 8px; color: var(--text-dim); letter-spacing: 0.08em; text-transform: uppercase; }

  .lp-ai-status { background: linear-gradient(135deg, rgba(43,95,142,0.12), rgba(201,168,76,0.05)); border: 1px solid rgba(43,95,142,0.25); border-radius: 18px; padding: 14px 16px; display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
  .lp-ai-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px var(--green); flex-shrink: 0; animation: lp-pulse 2s ease infinite; }
  .lp-ai-text { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--ice); line-height: 1.6; }
  .lp-ai-text strong { color: var(--gold); }

  .lp-ticker { overflow: hidden; border: 1px solid var(--border); border-radius: 6px; padding: 7px 0; background: var(--surface); }
  .lp-ticker-track { display: flex; gap: 40px; animation: lp-scroll 24s linear infinite; white-space: nowrap; }
  .lp-ticker-item { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
  .up { color: var(--green); } .dn { color: var(--ice); }

  @keyframes lp-fadeUp  { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes lp-spin    { to { transform: rotate(360deg); } }
  @keyframes lp-scroll  { from { transform: translateX(0); } to { transform: translateX(-50%); } }
  @keyframes lp-pulse   { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
  @keyframes lp-shake   { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
  @keyframes lp-popIn   { from { opacity: 0; transform: scale(0.96) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }

  /* ── Registration Wizard ── */
  .rw-root { animation: lp-popIn 0.35s ease forwards; }
  .rw-steps { display: flex; align-items: center; gap: 0; margin-bottom: 28px; }
  .rw-step { display: flex; align-items: center; gap: 6px; }
  .rw-dot { width: 22px; height: 22px; border-radius: 50%; border: 1.5px solid var(--border); background: var(--surface2); font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); display: flex; align-items: center; justify-content: center; transition: all 0.2s; flex-shrink: 0; }
  .rw-dot.active { border-color: var(--gold); background: rgba(201,168,76,0.12); color: var(--gold); }
  .rw-dot.done { border-color: var(--green); background: rgba(74,222,128,0.1); color: var(--green); }
  .rw-step-label { font-family: 'Space Mono', monospace; font-size: 8px; color: var(--text-dim); letter-spacing: 0.05em; }
  .rw-step-label.active { color: var(--gold); }
  .rw-line { flex: 1; height: 1px; background: var(--border); margin: 0 6px; }
  .rw-line.done { background: var(--green); }

  .rw-title { font-size: 20px; font-weight: 800; letter-spacing: -0.4px; margin-bottom: 4px; }
  .rw-title span { color: var(--gold); }
  .rw-subtitle { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); margin-bottom: 20px; line-height: 1.7; }

  .rw-strength { display: flex; gap: 4px; margin-top: 6px; margin-bottom: 4px; }
  .rw-strength-bar { flex: 1; height: 3px; border-radius: 2px; background: var(--border); transition: background 0.2s; }
  .rw-strength-bar.weak   { background: var(--red); }
  .rw-strength-bar.fair   { background: var(--gold); }
  .rw-strength-bar.strong { background: var(--green); }
  .rw-strength-label { font-family: 'Space Mono', monospace; font-size: 8px; color: var(--text-dim); text-align: right; }

  .rw-focus-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 20px; }
  .rw-focus-card { background: var(--surface2); border: 1.5px solid var(--border); border-radius: 10px; padding: 14px 12px; cursor: pointer; transition: all 0.15s; text-align: left; }
  .rw-focus-card:hover { border-color: rgba(201,168,76,0.3); }
  .rw-focus-card.selected { border-color: var(--gold); background: rgba(201,168,76,0.06); }
  .rw-focus-icon { font-size: 20px; margin-bottom: 8px; }
  .rw-focus-name { font-size: 11px; font-weight: 700; margin-bottom: 3px; }
  .rw-focus-desc { font-family: 'Space Mono', monospace; font-size: 8px; color: var(--text-dim); line-height: 1.5; }

  .rw-success-icon { width: 60px; height: 60px; border-radius: 16px; background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.25); display: flex; align-items: center; justify-content: center; font-size: 26px; margin-bottom: 20px; }
  .rw-success-title { font-size: 22px; font-weight: 800; letter-spacing: -0.4px; margin-bottom: 6px; }
  .rw-success-title span { color: var(--green); }
  .rw-success-text { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); line-height: 1.8; margin-bottom: 24px; }
  .rw-success-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 24px; }
  .rw-chip { font-family: 'Space Mono', monospace; font-size: 8px; padding: 3px 8px; border-radius: 4px; border: 1px solid rgba(74,222,128,0.25); background: rgba(74,222,128,0.07); color: var(--green); }

  .rw-row { display: flex; gap: 8px; }
  .rw-row .lp-field { flex: 1; }
  .rw-actions { display: flex; gap: 8px; margin-top: 4px; }
  .rw-back { flex-shrink: 0; background: transparent; border: 1px solid var(--border); border-radius: 8px; padding: 11px 16px; font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); cursor: pointer; transition: all 0.15s; }
  .rw-back:hover { border-color: var(--text-dim); color: var(--text); }
  .rw-next { flex: 1; background: var(--gold); color: var(--bg); border: none; border-radius: 8px; padding: 12px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s; }
  .rw-next:hover:not(:disabled) { background: var(--gold2); transform: translateY(-1px); }
  .rw-next:disabled { opacity: 0.5; cursor: not-allowed; }

  @media (max-width: 960px) {
    .lp-root { flex-direction: column; }
    .lp-left { width: 100%; border-right: none; border-bottom: 1px solid var(--border); padding: 32px 24px; }
    .lp-right { display: none; }
  }
`;

const PLATFORMS = [
  {
    icon: "⬡",
    name: "Core Engine",
    desc: "Auth · Billing · Analytics · API Gateway",
    status: "live",
    active: true,
  },
  {
    icon: "🧑‍🤝‍🧑",
    name: "Winners Community",
    desc: "Feed · Groups · DMs · NOVA AI",
    status: "live",
    active: true,
  },
  {
    icon: "🎓",
    name: "Winners Academy",
    desc: "Courses · Certificates · SAGE AI Tutor",
    status: "live",
    active: true,
  },
  {
    icon: "🤖",
    name: "Winners Intelligence",
    desc: "9 Supervisors · OMEGA · Streaming AI",
    status: "live",
    active: true,
  },
  {
    icon: "🛒",
    name: "Winners Market",
    desc: "10 Verticals · Vendors · Dropshipping",
    status: "live",
    active: true,
  },
  {
    icon: "💼",
    name: "Winners Work",
    desc: "Job Board · Freelancers · CIRCUIT AI",
    status: "live",
    active: true,
  },
];

const TICKER = [
  { label: "Core Engine",   val: "● Live",          cls: "up" },
  { label: "Community",     val: "● Live",          cls: "up" },
  { label: "Academy",       val: "● Live",          cls: "up" },
  { label: "Intelligence",  val: "● 9 Supervisors", cls: "up" },
  { label: "Work",          val: "● Live",          cls: "up" },
  { label: "Market",        val: "● Live",          cls: "up" },
  { label: "Stripe",        val: "Synced",          cls: "up" },
  { label: "2FA",           val: "Active",          cls: "up" },
  { label: "Cloud",         val: "In Progress",     cls: "up" },
  { label: "Mobile",        val: "Phase 7",         cls: "dn" },
];

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

// ─── OTP Input ─────────────────────────────────────────────────────────────

function OtpInput({
  onComplete,
  onChange,
  hasError,
}: {
  onComplete: (code: string) => void;
  onChange: (code: string) => void;
  hasError: boolean;
}) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const update = (next: string[]) => {
    setDigits(next);
    onChange(next.join(""));
    if (next.every((d) => d !== "")) onComplete(next.join(""));
  };

  const handleChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = digit;
    if (digit && i < 5) refs.current[i + 1]?.focus();
    update(next);
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !digits[i] && i > 0)
      refs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (pasted.length === 6) {
      const next = pasted.split("");
      setDigits(next);
      refs.current[5]?.focus();
      onChange(pasted);
      onComplete(pasted);
    }
    e.preventDefault();
  };

  return (
    <div className="lp-otp-boxes">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          className={`lp-otp-box${d ? " filled" : ""}${hasError ? " otp-error" : ""}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}

// ─── Register Wizard ───────────────────────────────────────────────────────

const STEP_META = [
  { label: "Identity" },
  { label: "Security" },
  { label: "OMEGA" },
  { label: "Welcome" },
];

function passwordStrength(pw: string): { level: 0 | 1 | 2 | 3; label: string } {
  if (pw.length === 0) return { level: 0, label: "" };
  let score = 0;
  if (pw.length >= 8)                   score++;
  if (/[A-Z]/.test(pw))                 score++;
  if (/[0-9!@#$%^&*]/.test(pw))        score++;
  if (score === 1) return { level: 1, label: "Weak" };
  if (score === 2) return { level: 2, label: "Fair" };
  return { level: 3, label: "Strong" };
}

const FOCUS_OPTIONS = [
  { id: "community",    icon: "🧑‍🤝‍🧑", name: "Community",    desc: "Connect · Share · Grow" },
  { id: "academy",      icon: "🎓", name: "Academy",      desc: "Learn · Certify · Level up" },
  { id: "market",       icon: "🛒", name: "Market",       desc: "Sell · Source · Scale" },
  { id: "work",         icon: "💼", name: "Work",         desc: "Freelance · Jobs · Escrow" },
  { id: "intelligence", icon: "🤖", name: "Intelligence", desc: "AI · Automation · Insights" },
  { id: "cloud",        icon: "☁️", name: "Cloud",        desc: "Build · API · Deploy" },
];

function RegisterWizard({
  onBack,
  onDone,
}: {
  onBack: () => void;
  onDone: () => void;
}) {
  const [step, setStep]       = useState(1);
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPass]   = useState("");
  const [confirm, setConfirm] = useState("");
  const [focus, setFocus]     = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [fieldErr, setFieldErr] = useState({ name: false, email: false, password: false, confirm: false });

  const strength = passwordStrength(password);

  const strengthBarClass = (bar: 1 | 2 | 3) => {
    if (strength.level === 0) return "";
    if (strength.level === 1 && bar === 1) return "weak";
    if (strength.level === 2 && bar <= 2)  return "fair";
    if (strength.level === 3)              return "strong";
    return "";
  };

  const validateStep1 = () => {
    const errs = { name: name.trim().length < 2, email: !email.includes("@"), password: false, confirm: false };
    setFieldErr(errs);
    return !errs.name && !errs.email;
  };

  const validateStep2 = () => {
    const errs = { name: false, email: false, password: password.length < 8, confirm: confirm !== password };
    setFieldErr(errs);
    return !errs.password && !errs.confirm;
  };

  const handleNext = async () => {
    setError("");
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
    } else if (step === 2) {
      if (!validateStep2()) return;
      setStep(3);
    } else if (step === 3) {
      await submitRegistration();
    }
  };

  const submitRegistration = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.toLowerCase().trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.message ?? "Registration failed."); return; }
      const { token, user } = data as { token: string; user: import("./authStore").AuthUser };
      localStorage.setItem("we_token", token);
      localStorage.setItem("we_user", JSON.stringify(user));
      useAuthStore.setState({ token, user, pendingTwoFactor: null });
      setStep(4);
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rw-root">
      {/* ── Step indicator ── */}
      {step < 4 && (
        <div className="rw-steps">
          {STEP_META.slice(0, 3).map((s, i) => {
            const n = i + 1;
            const isDone   = step > n;
            const isActive = step === n;
            return (
              <div key={s.label} className="rw-step" style={{ flex: i < 2 ? 1 : undefined }}>
                <div className={`rw-dot${isDone ? " done" : isActive ? " active" : ""}`}>
                  {isDone ? "✓" : n}
                </div>
                <span className={`rw-step-label${isActive ? " active" : ""}`}>{s.label}</span>
                {i < 2 && <div className={`rw-line${isDone ? " done" : ""}`} />}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Step 1: Identity ── */}
      {step === 1 && (
        <>
          <h2 className="rw-title">Your <span>Identity</span></h2>
          <p className="rw-subtitle">Tell us who you are. This is how the ecosystem knows you.</p>
          {error && <div className="lp-alert">{error}</div>}
          <div className="lp-field">
            <label className="lp-label" htmlFor="rw-name">Full Name</label>
            <input
              id="rw-name" type="text" autoFocus
              className={`lp-input${fieldErr.name ? " error" : ""}`}
              placeholder="Your full name"
              value={name}
              onChange={(e) => { setName(e.target.value); setFieldErr(f => ({ ...f, name: false })); }}
            />
            {fieldErr.name && <div className="lp-field-error">› At least 2 characters required</div>}
          </div>
          <div className="lp-field">
            <label className="lp-label" htmlFor="rw-email">Email Address</label>
            <input
              id="rw-email" type="email"
              className={`lp-input${fieldErr.email ? " error" : ""}`}
              placeholder="you@company.com"
              value={email}
              autoComplete="email"
              onChange={(e) => { setEmail(e.target.value); setFieldErr(f => ({ ...f, email: false })); }}
            />
            {fieldErr.email && <div className="lp-field-error">› Valid email required</div>}
          </div>
          <div className="rw-actions">
            <button type="button" className="rw-back" onClick={onBack}>← Login</button>
            <button type="button" className="rw-next" onClick={handleNext}>Continue →</button>
          </div>
        </>
      )}

      {/* ── Step 2: Security ── */}
      {step === 2 && (
        <>
          <h2 className="rw-title">Secure Your <span>Account</span></h2>
          <p className="rw-subtitle">Create a strong password to protect your ecosystem access.</p>
          {error && <div className="lp-alert">{error}</div>}
          <div className="lp-field">
            <label className="lp-label" htmlFor="rw-pass">Password</label>
            <input
              id="rw-pass" type="password" autoFocus
              className={`lp-input${fieldErr.password ? " error" : ""}`}
              placeholder="Min. 8 characters"
              value={password}
              autoComplete="new-password"
              onChange={(e) => { setPass(e.target.value); setFieldErr(f => ({ ...f, password: false })); }}
            />
            {password.length > 0 && (
              <>
                <div className="rw-strength">
                  <div className={`rw-strength-bar ${strengthBarClass(1)}`} />
                  <div className={`rw-strength-bar ${strengthBarClass(2)}`} />
                  <div className={`rw-strength-bar ${strengthBarClass(3)}`} />
                </div>
                <div className="rw-strength-label">{strength.label}</div>
              </>
            )}
            {fieldErr.password && <div className="lp-field-error">› Minimum 8 characters required</div>}
          </div>
          <div className="lp-field">
            <label className="lp-label" htmlFor="rw-confirm">Confirm Password</label>
            <input
              id="rw-confirm" type="password"
              className={`lp-input${fieldErr.confirm ? " error" : ""}`}
              placeholder="Repeat your password"
              value={confirm}
              autoComplete="new-password"
              onChange={(e) => { setConfirm(e.target.value); setFieldErr(f => ({ ...f, confirm: false })); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleNext(); }}
            />
            {fieldErr.confirm && <div className="lp-field-error">› Passwords do not match</div>}
          </div>
          <div className="rw-actions">
            <button type="button" className="rw-back" onClick={() => { setStep(1); setError(""); }}>← Back</button>
            <button type="button" className="rw-next" onClick={handleNext}>Continue →</button>
          </div>
        </>
      )}

      {/* ── Step 3: Ecosystem Focus ── */}
      {step === 3 && (
        <>
          <h2 className="rw-title">Meet <span>OMEGA</span></h2>
          <p className="rw-subtitle">This final sign-up signal helps OMEGA start your first-login conversation with better context. Your full platform routing still happens in onboarding.</p>
          {error && <div className="lp-alert">{error}</div>}
          <div className="rw-focus-grid">
            {FOCUS_OPTIONS.map((f) => (
              <button
                key={f.id} type="button"
                className={`rw-focus-card${focus === f.id ? " selected" : ""}`}
                onClick={() => setFocus(focus === f.id ? "" : f.id)}
              >
                <div className="rw-focus-icon">{f.icon}</div>
                <div className="rw-focus-name">{f.name}</div>
                <div className="rw-focus-desc">{f.desc}</div>
              </button>
            ))}
          </div>
          <div className="rw-actions">
            <button type="button" className="rw-back" onClick={() => { setStep(2); setError(""); }}>← Back</button>
            <button type="button" className="rw-next" disabled={loading} onClick={handleNext}>
              {loading
                ? <span className="lp-loading"><span className="lp-spinner" /> Creating account...</span>
                : focus ? "Create Account →" : "Create Account →"}
            </button>
          </div>
        </>
      )}

      {/* ── Step 4: Welcome ── */}
      {step === 4 && (
        <>
          <div className="rw-success-icon">🏆</div>
          <h2 className="rw-success-title">Welcome, <span>{name.split(" ")[0]}</span>!</h2>
          <p className="rw-success-text">
            Your Winners Ecosystem account is ready.<br />
            OMEGA is waiting to run your personalized onboarding conversation. Your first login starts on Free, with no credit card required.
          </p>
          <div className="rw-success-chips">
            <span className="rw-chip">✓ Core Engine</span>
            <span className="rw-chip">✓ Community</span>
            <span className="rw-chip">✓ Academy</span>
            <span className="rw-chip">✓ Intelligence</span>
            <span className="rw-chip">✓ Market</span>
            <span className="rw-chip">✓ Work</span>
          </div>
          <button type="button" className="rw-next" onClick={onDone}>
            Meet OMEGA →
          </button>
        </>
      )}
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const verifyTwoFactor = useAuthStore((s) => s.verifyTwoFactor);
  const pendingTwoFactor = useAuthStore((s) => s.pendingTwoFactor);
  const user = useAuthStore((s) => s.user);

  const [showRegister, setShowRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErr, setFieldErr] = useState({ email: false, password: false });
  const [otpError, setOtpError] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const id = "lp-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id;
      tag.textContent = css;
      document.head.appendChild(tag);
    }
    return () => {
      document.getElementById(id)?.remove();
    };
  }, []);

  useEffect(() => {
    if (user) navigate(getPostLoginPath(user), { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // OAuth callback handler (Google + Facebook)
  useEffect(() => {
    const stashOmegaWelcome = (rawWelcome: unknown) => {
      if (!rawWelcome) return;
      try {
        const parsed: OmegaLaunchWelcome =
          typeof rawWelcome === "string"
            ? (JSON.parse(decodeURIComponent(rawWelcome)) as OmegaLaunchWelcome)
            : (rawWelcome as OmegaLaunchWelcome);
        if (!parsed?.pathPrefix || !parsed?.title || !parsed?.message) return;
        sessionStorage.setItem(OMEGA_WELCOME_KEY, JSON.stringify(parsed));
      } catch {
        /* ignore malformed welcome payloads */
      }
    };

    const finishOAuthLogin = (token: string, rawUser: unknown, rawWelcome?: unknown, provider = "Google") => {
      if (!token || !rawUser) {
        setError(`${provider} sign-in failed.`);
        return;
      }
      try {
        const userData: AuthUser =
          typeof rawUser === "string"
            ? (JSON.parse(decodeURIComponent(rawUser)) as AuthUser)
            : (rawUser as AuthUser);
        stashOmegaWelcome(rawWelcome);
        localStorage.setItem("we_token", token);
        localStorage.setItem("we_user", JSON.stringify(userData));
        useAuthStore.setState({ token, user: userData, pendingTwoFactor: null });
        navigate(getPostLoginPath(userData), { replace: true });
      } catch {
        setError(`Failed to complete ${provider} sign-in.`);
      }
    };

    const params    = new URLSearchParams(window.location.search);
    const code      = params.get("code");
    const state     = params.get("state");
    const token     = params.get("token");
    const userJson  = params.get("user");
    const omegaWelcome = params.get("omegaWelcome");
    const oauthErr  = params.get("error");
    const redirectUri = `${window.location.origin}/login`;

    if (oauthErr) {
      const oauthMessage =
        oauthErr === "google_code_invalid"
          ? "Google sign-in expired or was already used. Please try again."
          : oauthErr === "google_not_configured"
            ? "Google sign-in is not configured right now."
            : oauthErr === "no_id_token"
              ? "Google sign-in did not return an ID token."
              : "Sign-in failed. Please try again.";
      setError(oauthMessage);
      window.history.replaceState({}, "", "/login");
      return;
    }

    if (code) {
      window.history.replaceState({}, "", "/login");
      const isFacebook = state === "facebook";
      const provider   = isFacebook ? "Facebook" : "Google";
      const endpoint   = isFacebook ? "/auth/facebook/exchange" : "/auth/google/exchange";
      setLoading(true);
      fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, redirectUri }),
      })
        .then(async (r) => {
          const data = await r.json().catch(() => ({}));
          if (!r.ok) {
            setError(data.message ?? `${provider} sign-in failed.`);
            return;
          }
          if (data.token && data.user) {
            finishOAuthLogin(data.token, data.user, data.omegaWelcome, provider);
            return;
          }
          setError(data.message ?? `${provider} sign-in failed.`);
        })
        .catch(() => setError(`${provider} sign-in failed.`))
        .finally(() => setLoading(false));
      return;
    }

    if (token && userJson) {
      finishOAuthLogin(token, userJson, omegaWelcome);
    }
  }, [navigate]);

  const validate = () => {
    const errs = { email: !email.includes("@"), password: password.length < 6 };
    setFieldErr(errs);
    return !errs.email && !errs.password;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Invalid credentials."));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpComplete = async (code: string) => {
    setOtpError(false);
    setLoading(true);
    try {
      await verifyTwoFactor(code);
    } catch (err: unknown) {
      setOtpError(true);
      setError(getErrorMessage(err, "Invalid code."));
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setCountdown(30);
    setError("");
    try {
      await login(email, password);
    } catch {
      /* silent */
    }
  };

  const handleGoogle = () => {
    const clientId =
      import.meta.env.VITE_GOOGLE_CLIENT_ID ??
      "148507996421-2di0upcp6d7fi4gojr8d74n5l3udk9tu.apps.googleusercontent.com";
    const redirectUri = encodeURIComponent(`${window.location.origin}/login`);
    const scope = encodeURIComponent("openid email profile");
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=select_account`;
  };

  const handleFacebook = () => {
    setError("");
    window.location.href = `${API_BASE}/auth/facebook`;
  };

  const doubled = [...TICKER, ...TICKER];

  return (
    <div className="lp-root">
      {/* ── LEFT ── */}
      <div className="lp-left">
        <div className="lp-card">
          {/* ── Register Wizard ── */}
          {showRegister ? (
            <RegisterWizard
              onBack={() => setShowRegister(false)}
              onDone={() => navigate("/onboarding", { replace: true })}
            />
          ) : pendingTwoFactor ? (
            <div className="lp-otp-screen">
              <button
                className="lp-back-btn"
                onClick={() => {
                  useAuthStore.setState({ pendingTwoFactor: null });
                  setError("");
                }}
              >
                ← Back to login
              </button>
              <div className="lp-otp-icon">
                {pendingTwoFactor.method === "totp" ? "🔐" : "📧"}
              </div>
              <h1 className="lp-otp-title">
                Verify <span>Identity</span>
              </h1>
              <p className="lp-otp-subtitle">
                {pendingTwoFactor.method === "totp" ? (
                  <>
                    Enter the 6-digit code from your{" "}
                    <strong>authenticator app</strong>.
                  </>
                ) : (
                  <>
                    Enter the code sent to <strong>{email}</strong>.
                  </>
                )}
              </p>
              {error && <div className="lp-alert">{error}</div>}
              <OtpInput
                onComplete={handleOtpComplete}
                onChange={setOtpCode}
                hasError={otpError}
              />
              <button
                className="lp-submit"
                disabled={loading || otpCode.length < 6}
                onClick={() => { if (otpCode.length === 6) handleOtpComplete(otpCode); }}
              >
                {loading ? (
                  <span className="lp-loading">
                    <span className="lp-spinner" /> Verifying...
                  </span>
                ) : (
                  "Verify & Enter →"
                )}
              </button>
              {pendingTwoFactor.method === "email_otp" && (
                <div className="lp-otp-resend">
                  Didn't receive it?{" "}
                  <button onClick={handleResend} disabled={countdown > 0}>
                    {countdown > 0 ? `Resend in ${countdown}s` : "Resend code"}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* ── Login Form ── */
            <>
              <div className="lp-logo-area">
                {!imgError ? (
                  <img
                    src="/logo.jpg"
                    alt="Winners Empire"
                    className="lp-logo-img"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="lp-logo-fallback">🏆</div>
                )}
                <div>
                  <div className="lp-logo-name">Winners Empire</div>
                  <div className="lp-logo-tag">Digital Ecosystem</div>
                </div>
              </div>

              <h1 className="lp-title">
                Welcome <span>Back</span>
              </h1>
              <p className="lp-subtitle">Sign in to your ecosystem workspace</p>
              {error && <div className="lp-alert">{error}</div>}

              <div className="lp-oauth-row">
                <button className="lp-google" onClick={handleGoogle}>
                  <svg className="lp-google-icon" viewBox="0 0 24 24">
                    <path fill="var(--blue)"  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="var(--green)" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="var(--gold)"  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="var(--red)"   d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </button>
                <button className="lp-facebook" onClick={handleFacebook}>
                  <svg className="lp-facebook-icon" viewBox="0 0 24 24" fill="#4267B2">
                    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.313 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
                  </svg>
                  Facebook
                </button>
              </div>

              <div className="lp-divider">
                <div className="lp-divider-line" />
                <span className="lp-divider-text">or email</span>
                <div className="lp-divider-line" />
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="lp-field">
                  <label className="lp-label" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    className={`lp-input${fieldErr.email ? " error" : ""}`}
                    placeholder="you@company.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setFieldErr((f) => ({ ...f, email: false }));
                    }}
                    autoComplete="email"
                    autoFocus
                  />
                  {fieldErr.email && (
                    <div className="lp-field-error">› Valid email required</div>
                  )}
                </div>
                <div className="lp-field">
                  <label className="lp-label" htmlFor="password">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    className={`lp-input${fieldErr.password ? " error" : ""}`}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setFieldErr((f) => ({ ...f, password: false }));
                    }}
                    autoComplete="current-password"
                  />
                  {fieldErr.password && (
                    <div className="lp-field-error">› Minimum 6 characters</div>
                  )}
                </div>
                <div className="lp-forgot">
                  <button type="button" onClick={() => navigate("/forgot-password")} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit" }}>
                    Forgot password?
                  </button>
                </div>
                <button type="submit" className="lp-submit" disabled={loading}>
                  {loading ? (
                    <span className="lp-loading">
                      <span className="lp-spinner" /> Signing in...
                    </span>
                  ) : (
                    "Enter Ecosystem →"
                  )}
                </button>
              </form>

              <div className="lp-divider">
                <div className="lp-divider-line" />
                <span className="lp-divider-text">or</span>
                <div className="lp-divider-line" />
              </div>
              <div className="lp-card-footer">
                Don't have an account?{" "}
                <button type="button" onClick={() => setShowRegister(true)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", font: "inherit", color: "var(--gold)" }}>Create one free</button>
                <br />
                Winners Ecosystem · Digital Sovereign Infrastructure
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── RIGHT ── */}

      <div className="lp-right">
        <div className="lp-right-grid" />
        <div className="lp-right-glow" />
        <div className="lp-right-content">
          <div className="lp-panel-eyebrow">Platform of Platforms</div>
          <h2 className="lp-panel-title">
            One <span>Ecosystem.</span>
            <br />
            <span className="ice">Infinite</span> Possibilities.
          </h2>
          <p className="lp-panel-desc">
            A central AI-powered operating system hosting multiple digital
            platforms —<br />
            community, learning, commerce, and intelligence — all under one
            identity.
          </p>
          <div className="lp-stats">
            <div className="lp-stat">
              <div className="lp-stat-value">9</div>
              <div className="lp-stat-label">Platforms</div>
            </div>
            <div className="lp-stat">
              <div className="lp-stat-value">9</div>
              <div className="lp-stat-label">Supervisors</div>
            </div>
            <div className="lp-stat">
              <div className="lp-stat-value">6</div>
              <div className="lp-stat-label">Live Layers</div>
            </div>
          </div>
          <div className="lp-ai-status">
            <div className="lp-ai-dot" />
            <div className="lp-ai-text">
              <strong>OMEGA · Master Orchestrator · Online</strong>
              <br />
              Core · Community · Academy · Intelligence · Market · Work live.
            </div>
          </div>
          <div className="lp-platforms">
            {PLATFORMS.map((p) => (
              <div
                key={p.name}
                className={`lp-platform-row${p.active ? " active" : ""}`}
              >
                <div className="lp-platform-icon">{p.icon}</div>
                <div className="lp-platform-info">
                  <div className="lp-platform-name">{p.name}</div>
                  <div className="lp-platform-desc">{p.desc}</div>
                </div>
                <span className={`lp-platform-badge ${p.status}`}>
                  {p.status === "live"
                    ? "● Live"
                    : p.status === "soon"
                      ? "Soon"
                      : "Planned"}
                </span>
              </div>
            ))}
          </div>
          <div className="lp-ticker">
            <div className="lp-ticker-track">
              {doubled.map((t, i) => (
                <div key={i} className="lp-ticker-item">
                  <span>{t.label}</span>
                  <span className={t.cls}>{t.val}</span>
                  <span style={{ color: "var(--border)" }}>·</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
