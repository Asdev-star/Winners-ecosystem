// src/features/auth/LoginPage.tsx

import { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, type AuthUser } from "./authStore";

import { API_BASE } from "../../lib/api";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  :root {
    --gold: #F0B429;
    --gold-bright: #F5C842;
    --gold-dim: #B8841A;
    --bg: #080E1A;
    --surface: #0D1826;
    --surface2: #121F30;
    --border: #1A2E45;
    --text: #E8EEF5;
    --text-dim: #5A7A96;
    --green: #2DD4A0;
    --red: #E05A4E;
    --blue: #4A9EFF;
    --ice: #89C4E1;
  }

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

  .lp-alert { background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2); border-radius: 8px; padding: 10px 14px; font-family: 'Space Mono', monospace; font-size: 10px; color: var(--red); margin-bottom: 18px; }

  .lp-google { width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 11px 14px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600; color: var(--text); cursor: pointer; transition: all 0.15s; display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 10px; }
  .lp-google:hover { border-color: var(--gold); background: rgba(201,168,76,0.04); }
  .lp-google-icon { width: 17px; height: 17px; flex-shrink: 0; }

  .lp-divider { display: flex; align-items: center; gap: 10px; margin: 16px 0; }
  .lp-divider-line { flex: 1; height: 1px; background: var(--border); }
  .lp-divider-text { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); }

  .lp-field { margin-bottom: 14px; }
  .lp-label { display: block; font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 7px; }
  .lp-input { width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; padding: 11px 14px; font-family: 'Space Mono', monospace; font-size: 12px; color: var(--text); outline: none; transition: border-color 0.15s, box-shadow 0.15s; box-sizing: border-box; }
  .lp-input::placeholder { color: var(--text-dim); }
  .lp-input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(201,168,76,0.08); }
  .lp-input.error { border-color: var(--red); }
  .lp-field-error { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--red); margin-top: 5px; }

  .lp-forgot { text-align: right; margin-top: -6px; margin-bottom: 14px; }
  .lp-forgot span { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); cursor: pointer; transition: color 0.15s; }
  .lp-forgot span:hover { color: var(--gold); }

  .lp-submit { width: 100%; background: var(--gold); color: #080B10; border: none; border-radius: 8px; padding: 12px; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.15s; margin-top: 4px; }
  .lp-submit:hover:not(:disabled) { background: var(--gold2); transform: translateY(-1px); }
  .lp-submit:disabled { opacity: 0.5; cursor: not-allowed; }
  .lp-loading { display: inline-flex; align-items: center; gap: 8px; }
  .lp-spinner { width: 13px; height: 13px; border: 2px solid rgba(8,11,16,0.3); border-top-color: #080B10; border-radius: 50%; animation: lp-spin 0.7s linear infinite; }

  .lp-demo { width: 100%; background: transparent; border: 1px solid var(--border); border-radius: 8px; padding: 10px 14px; font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); cursor: pointer; transition: all 0.15s; text-align: center; letter-spacing: 0.5px; margin-top: 8px; }
  .lp-demo:hover { border-color: var(--gold); color: var(--gold); }
  .lp-demo span { color: var(--gold); }

  .lp-card-footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--border); font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); text-align: center; line-height: 1.6; }
  .lp-card-footer a { color: var(--gold); text-decoration: none; cursor: pointer; }

  /* ── OTP Screen ── */
  .lp-otp-screen { animation: lp-fadeUp 0.3s ease forwards; }
  .lp-otp-icon { width: 52px; height: 52px; border-radius: 14px; background: rgba(137,196,225,0.1); border: 1px solid rgba(137,196,225,0.2); display: flex; align-items: center; justify-content: center; font-size: 22px; margin-bottom: 20px; }
  .lp-otp-title { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 6px; }
  .lp-otp-title span { color: var(--ice); }
  .lp-otp-subtitle { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); margin-bottom: 28px; line-height: 1.7; }
  .lp-otp-subtitle strong { color: var(--ice); }

  .lp-otp-boxes { display: flex; gap: 8px; margin-bottom: 24px; }
  .lp-otp-box { flex: 1; height: 52px; background: var(--surface2); border: 1px solid var(--border); border-radius: 8px; font-family: 'Space Mono', monospace; font-size: 20px; font-weight: 700; color: var(--text); text-align: center; outline: none; transition: border-color 0.15s, box-shadow 0.15s; caret-color: var(--gold); }
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
  .lp-panel-title { font-size: 36px; font-weight: 800; color: var(--text); line-height: 1.1; margin-bottom: 10px; letter-spacing: -0.5px; }
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

  .lp-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--border); border: 1px solid var(--border); margin-bottom: 20px; border-radius: 8px; overflow: hidden; }
  .lp-stat { background: var(--surface); padding: 14px 16px; }
  .lp-stat-value { font-size: 20px; font-weight: 800; color: var(--gold); line-height: 1; margin-bottom: 4px; }
  .lp-stat-label { font-family: 'Space Mono', monospace; font-size: 8px; color: var(--text-dim); letter-spacing: 0.08em; text-transform: uppercase; }

  .lp-ai-status { background: linear-gradient(135deg, rgba(43,95,142,0.12), rgba(201,168,76,0.05)); border: 1px solid rgba(43,95,142,0.25); border-radius: 8px; padding: 14px 16px; display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
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
    desc: "Social feed · Chat · Groups · Creators",
    status: "live",
    active: true,
  },
  {
    icon: "🎓",
    name: "Winners Academy",
    desc: "Courses · Certificates · AI Tutor",
    status: "soon",
    active: false,
  },
  {
    icon: "🛒",
    name: "Winners Market",
    desc: "Products · Vendors · Dropshipping",
    status: "soon",
    active: false,
  },
  {
    icon: "🤖",
    name: "Winners Intelligence",
    desc: "Agentic AI · Smart Automation · Search",
    status: "planned",
    active: false,
  },
  {
    icon: "💼",
    name: "Winners Work",
    desc: "Freelance · Jobs · Escrow · Matching",
    status: "planned",
    active: false,
  },
];

const TICKER = [
  { label: "Community", val: "● Live", cls: "up" },
  { label: "AI Core", val: "Online", cls: "up" },
  { label: "Phase 2", val: "Building", cls: "up" },
  { label: "Stripe", val: "Synced", cls: "up" },
  { label: "2FA", val: "Active", cls: "up" },
  { label: "Academy", val: "Q2 2026", cls: "dn" },
  { label: "Market", val: "Q3 2026", cls: "dn" },
  { label: "AI Agents", val: "Phase 5", cls: "dn" },
];

function getErrorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

// ─── OTP Input ─────────────────────────────────────────────────────────────

function OtpInput({
  onComplete,
  hasError,
}: {
  onComplete: (code: string) => void;
  hasError: boolean;
}) {
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = digit;
    setDigits(next);
    if (digit && i < 5) refs.current[i + 1]?.focus();
    if (next.every((d) => d !== "")) onComplete(next.join(""));
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
      setDigits(pasted.split(""));
      refs.current[5]?.focus();
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

// ─── Main ──────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const verifyTwoFactor = useAuthStore((s) => s.verifyTwoFactor);
  const pendingTwoFactor = useAuthStore((s) => s.pendingTwoFactor);
  const user = useAuthStore((s) => s.user);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErr, setFieldErr] = useState({ email: false, password: false });
  const [otpError, setOtpError] = useState(false);
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
    if (user) navigate("/dashboard", { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  // Google OAuth callback
  useEffect(() => {
    const finishOAuthLogin = (token: string, rawUser: unknown) => {
      if (!token || !rawUser) {
        setError("Google sign-in failed.");
        return;
      }

      try {
        const userData: AuthUser =
          typeof rawUser === "string"
            ? (JSON.parse(decodeURIComponent(rawUser)) as AuthUser)
            : (rawUser as AuthUser);

        localStorage.setItem("we_token", token);
        localStorage.setItem("we_user", JSON.stringify(userData));
        useAuthStore.setState({
          token,
          user: userData,
          pendingTwoFactor: null,
        });
        navigate("/dashboard", { replace: true });
      } catch {
        setError("Failed to complete Google sign-in.");
      }
    };

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const token = params.get("token");
    const userJson = params.get("user");
    const oauthErr = params.get("error");

    if (oauthErr) {
      setError("Google sign-in failed.");
      window.history.replaceState({}, "", "/login");
      return;
    }

    if (code) {
      window.history.replaceState({}, "", "/login");
      setLoading(true);
      const API = API_BASE;
      fetch(`${API}/auth/google/exchange`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          redirectUri: `${window.location.origin}/login`,
        }),
      })
        .then(async (r) => {
          const data = await r.json().catch(() => ({}));
          if (!r.ok) {
            setError(data.message ?? "Google sign-in failed.");
            return;
          }

          if (data.token && data.user) {
            finishOAuthLogin(data.token, data.user);
            return;
          }

          setError(data.message ?? "Google sign-in failed.");
        })
        .catch(() => setError("Google sign-in failed."))
        .finally(() => setLoading(false));
      return;
    }

    if (token && userJson) {
      finishOAuthLogin(token, userJson);
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
      "148507996421-2di0upcp6d7fi4gojr8d74n5l3udk9tu.apps.googleusercontent.com";
    const redirectUri = encodeURIComponent(`${window.location.origin}/login`);
    const scope = encodeURIComponent("openid email profile");
    window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=select_account`;
  };

  const fillDemo = () => {
    setEmail("demo@winners.io");
    setPassword("demo1234");
    setError("");
    setFieldErr({ email: false, password: false });
  };
  const doubled = [...TICKER, ...TICKER];

  return (
    <div className="lp-root">
      {/* ── LEFT ── */}
      <div className="lp-left">
        <div className="lp-card">
          {/* ── OTP Screen ── */}
          {pendingTwoFactor ? (
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
              <OtpInput onComplete={handleOtpComplete} hasError={otpError} />
              <button className="lp-submit" disabled={loading}>
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

              <button className="lp-google" onClick={handleGoogle}>
                <svg className="lp-google-icon" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

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
                  <span onClick={() => navigate("/forgot-password")}>
                    Forgot password?
                  </span>
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
              <button className="lp-demo" onClick={fillDemo}>
                Try demo → <span>demo@winners.io</span>
              </button>

              <div className="lp-card-footer">
                Don't have an account?{" "}
                <a onClick={() => navigate("/register")}>Create one free</a>
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
              <div className="lp-stat-value">6</div>
              <div className="lp-stat-label">Platforms</div>
            </div>
            <div className="lp-stat">
              <div className="lp-stat-value">1</div>
              <div className="lp-stat-label">Identity</div>
            </div>
            <div className="lp-stat">
              <div className="lp-stat-value">AI</div>
              <div className="lp-stat-label">Powered</div>
            </div>
          </div>
          <div className="lp-ai-status">
            <div className="lp-ai-dot" />
            <div className="lp-ai-text">
              <strong>Winners AI Core · Online</strong>
              <br />
              Phase 2 active — Community Layer live. Academy & Market building.
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
