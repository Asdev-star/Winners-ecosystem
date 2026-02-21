// src/features/auth/ResetPasswordPage.tsx

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const API = import.meta.env.VITE_API_URL ?? "";

const css = `
  .rp-root {
    min-height: 100vh; background: var(--bg, #080B10); display: flex; align-items: center;
    justify-content: center; font-family: 'Syne', sans-serif; color: var(--text, #E8EDF2);
    padding: 24px; position: relative;
  }
  .rp-root::before {
    content: ''; position: fixed; inset: 0;
    background-image: linear-gradient(rgba(245,200,66,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,200,66,0.03) 1px, transparent 1px);
    background-size: 40px 40px; pointer-events: none;
  }
  .rp-card {
    background: var(--surface, #0D1117); border: 1px solid var(--border, #1E2A38); border-radius: 6px;
    padding: 40px; width: 100%; max-width: 420px; position: relative; z-index: 1;
    animation: rp-fadeUp 0.4s ease forwards;
  }
  .rp-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #F5C842, rgba(245,200,66,0.2)); border-radius: 6px 6px 0 0; }
  .rp-logo { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: #F5C842; margin-bottom: 28px; display: flex; align-items: center; gap: 8px; }
  .rp-logo-dot { width: 6px; height: 6px; border-radius: 50%; background: #F5C842; box-shadow: 0 0 8px #F5C842; }
  .rp-title { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 6px; }
  .rp-title span { color: #F5C842; }
  .rp-subtitle { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim, #5A6878); margin-bottom: 28px; }
  .rp-label { display: block; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-dim, #5A6878); margin-bottom: 8px; }
  .rp-input { width: 100%; background: var(--surface2, #141B24); border: 1px solid var(--border, #1E2A38); border-radius: 3px; padding: 12px 14px; font-family: 'Space Mono', monospace; font-size: 13px; color: var(--text, #E8EDF2); outline: none; transition: border-color 0.15s; box-sizing: border-box; margin-bottom: 16px; }
  .rp-input:focus { border-color: #F5C842; box-shadow: 0 0 0 3px rgba(245,200,66,0.08); }
  .rp-btn { width: 100%; background: #F5C842; color: #080B10; border: none; border-radius: 3px; padding: 13px; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: opacity 0.15s; }
  .rp-btn:hover:not(:disabled) { opacity: 0.9; }
  .rp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .rp-back { display: block; text-align: center; margin-top: 20px; font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim, #5A6878); cursor: pointer; transition: color 0.15s; background: none; border: none; width: 100%; }
  .rp-back:hover { color: #F5C842; }
  .rp-alert { border-radius: 3px; padding: 11px 14px; font-family: 'Space Mono', monospace; font-size: 11px; margin-bottom: 16px; }
  .rp-alert.error   { background: rgba(255,89,117,0.08); border: 1px solid rgba(255,89,117,0.25); color: #FF5975; }
  .rp-alert.success { background: rgba(45,212,160,0.08); border: 1px solid rgba(45,212,160,0.25); color: #2DD4A0; }
  .rp-strength { height: 3px; border-radius: 2px; margin-bottom: 16px; transition: all 0.3s; }
  @keyframes rp-fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
`;

function getStrength(pw: string) {
  if (pw.length < 6)  return { pct: 20, color: "#FF5975", label: "Too short" };
  if (pw.length < 8)  return { pct: 45, color: "#F5C842", label: "Weak" };
  if (pw.length < 12) return { pct: 70, color: "#4A9EFF", label: "Good" };
  return { pct: 100, color: "#2DD4A0", label: "Strong" };
}

export default function ResetPasswordPage() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const token          = searchParams.get("token") ?? "";

  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState("");
  const [validToken, setValidToken] = useState<boolean | null>(null);

  if (!document.getElementById("rp-styles")) {
    const tag = document.createElement("style");
    tag.id = "rp-styles"; tag.textContent = css;
    document.head.appendChild(tag);
  }

  // Verify token on mount
  useEffect(() => {
    if (!token) { setValidToken(false); return; }
    fetch(`${API}/auth/verify-reset-token?token=${token}`)
      .then((r) => r.json())
      .then((d) => setValidToken(d.valid))
      .catch(() => setValidToken(false));
  }, [token]);

  const strength = getStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6)    { setError("Password must be at least 6 characters"); return; }
    if (password !== confirm)    { setError("Passwords do not match"); return; }
    setLoading(true);
    try {
      const res  = await fetch(`${API}/auth/reset-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDone(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err: any) {
      setError(err.message ?? "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rp-root">
      <div className="rp-card">
        <div className="rp-logo"><div className="rp-logo-dot" />Winners Ecosystem</div>
        <h1 className="rp-title">New <span>Password</span></h1>
        <p className="rp-subtitle">Enter your new password below.</p>

        {validToken === false && (
          <div className="rp-alert error">
            ✗ This reset link is invalid or has expired. Please request a new one.
          </div>
        )}

        {error && <div className="rp-alert error">{error}</div>}

        {done ? (
          <div className="rp-alert success">
            ✓ Password reset successfully! Redirecting to sign in…
          </div>
        ) : validToken && (
          <form onSubmit={handleSubmit}>
            <label className="rp-label">New Password</label>
            <input
              className="rp-input" type="password" placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)} autoFocus
            />
            {password && (
              <div className="rp-strength" style={{ background: strength.color, width: `${strength.pct}%`, marginTop: -12 }} />
            )}
            <label className="rp-label">Confirm Password</label>
            <input
              className="rp-input" type="password" placeholder="••••••••"
              value={confirm} onChange={(e) => setConfirm(e.target.value)}
            />
            <button className="rp-btn" disabled={loading}>
              {loading ? "Resetting…" : "Reset Password"}
            </button>
          </form>
        )}

        <button className="rp-back" onClick={() => navigate("/login")}>← Back to Sign In</button>
      </div>
    </div>
  );
}