// src/features/auth/ForgotPasswordPage.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL ?? "";

const css = `
  .fp-root {
    min-height: 100vh; background: var(--bg, #080B10); display: flex; align-items: center;
    justify-content: center; font-family: 'Syne', sans-serif; color: var(--text, #E8EDF2);
    padding: 24px; position: relative;
  }
  .fp-root::before {
    content: ''; position: fixed; inset: 0;
    background-image: linear-gradient(rgba(245,200,66,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,200,66,0.03) 1px, transparent 1px);
    background-size: 40px 40px; pointer-events: none;
  }
  .fp-card {
    background: var(--surface, #0D1117); border: 1px solid var(--border, #1E2A38); border-radius: 6px;
    padding: 40px; width: 100%; max-width: 420px; position: relative; z-index: 1;
    animation: fp-fadeUp 0.4s ease forwards;
  }
  .fp-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #F5C842, rgba(245,200,66,0.2)); border-radius: 6px 6px 0 0; }
  .fp-logo { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #F5C842; margin-bottom: 28px; display: flex; align-items: center; gap: 8px; }
  .fp-logo-dot { width: 6px; height: 6px; border-radius: 50%; background: #F5C842; box-shadow: 0 0 8px #F5C842; }
  .fp-title { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 6px; }
  .fp-title span { color: #F5C842; }
  .fp-subtitle { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim, #5A6878); margin-bottom: 28px; line-height: 1.5; }
  .fp-label { display: block; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-dim, #5A6878); margin-bottom: 8px; }
  .fp-input { width: 100%; background: var(--surface2, #141B24); border: 1px solid var(--border, #1E2A38); border-radius: 3px; padding: 12px 14px; font-family: 'Space Mono', monospace; font-size: 13px; color: var(--text, #E8EDF2); outline: none; transition: border-color 0.15s; box-sizing: border-box; margin-bottom: 16px; }
  .fp-input:focus { border-color: #F5C842; box-shadow: 0 0 0 3px rgba(245,200,66,0.08); }
  .fp-btn { width: 100%; background: #F5C842; color: #080B10; border: none; border-radius: 3px; padding: 13px; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: opacity 0.15s; }
  .fp-btn:hover:not(:disabled) { opacity: 0.9; }
  .fp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .fp-back { display: block; text-align: center; margin-top: 20px; font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim, #5A6878); cursor: pointer; transition: color 0.15s; background: none; border: none; width: 100%; }
  .fp-back:hover { color: #F5C842; }
  .fp-alert { border-radius: 3px; padding: 11px 14px; font-family: 'Space Mono', monospace; font-size: 11px; margin-bottom: 16px; }
  .fp-alert.error   { background: rgba(255,89,117,0.08); border: 1px solid rgba(255,89,117,0.25); color: #FF5975; }
  .fp-alert.success { background: rgba(45,212,160,0.08); border: 1px solid rgba(45,212,160,0.25); color: #2DD4A0; }
  @keyframes fp-fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
`;

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail]     = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  if (!document.getElementById("fp-styles")) {
    const tag = document.createElement("style");
    tag.id = "fp-styles"; tag.textContent = css;
    document.head.appendChild(tag);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) { setError("Valid email required"); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/auth/forgot-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSent(true);
    } catch (err: any) {
      setError(err.message ?? "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fp-root">
      <div className="fp-card">
        <div className="fp-logo"><div className="fp-logo-dot" />Winners Ecosystem</div>
        <h1 className="fp-title">Reset <span>Password</span></h1>
        <p className="fp-subtitle">Enter your email and we'll send you a reset link.</p>

        {error && <div className="fp-alert error">{error}</div>}

        {sent ? (
          <div className="fp-alert success">
            ✓ Reset link sent! Check your inbox and follow the instructions.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="fp-label">Email</label>
            <input
              className="fp-input" type="email" placeholder="you@company.com"
              value={email} onChange={(e) => setEmail(e.target.value)} autoFocus
            />
            <button className="fp-btn" disabled={loading}>
              {loading ? "Sending…" : "Send Reset Link"}
            </button>
          </form>
        )}

        <button className="fp-back" onClick={() => navigate("/login")}>← Back to Sign In</button>
      </div>
    </div>
  );
}