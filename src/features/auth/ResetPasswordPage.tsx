// src/features/auth/ResetPasswordPage.tsx

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { API_BASE } from "../../lib/api";

const API = API_BASE;
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Space+Mono&display=swap');

  .rp-root {
    min-height: 100vh;
    background: #0D1520;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Syne', sans-serif;
    color: #E8EEF5;
    padding: 24px;
    position: relative;
    overflow: hidden;
  }

  .rp-root::before {
    content: '';
    position: fixed; inset: 0;
    background-image:
      linear-gradient(rgba(137,196,225,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(137,196,225,0.03) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none;
  }

  .rp-root::after {
    content: '';
    position: fixed;
    top: -200px; left: 50%; transform: translateX(-50%);
    width: 600px; height: 400px;
    background: radial-gradient(ellipse, rgba(43,95,142,0.15) 0%, transparent 70%);
    pointer-events: none;
  }

  .rp-card {
    background: linear-gradient(135deg, #0f1923 0%, #0D1520 100%);
    border: 1px solid rgba(137,196,225,0.12);
    border-radius: 16px;
    padding: 44px;
    width: 100%; max-width: 420px;
    position: relative; z-index: 1;
    animation: rp-fadeUp 0.4s ease forwards;
  }

  .rp-card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, #C9A84C, transparent);
    border-radius: 16px 16px 0 0;
    opacity: 0.8;
  }

  .rp-logo {
    font-family: 'Space Mono', monospace;
    font-size: 10px; letter-spacing: 3px; text-transform: uppercase;
    color: #C9A84C; margin-bottom: 32px;
    display: flex; align-items: center; gap: 8px;
  }
  .rp-logo-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #C9A84C; box-shadow: 0 0 8px rgba(201,168,76,0.6);
  }

  .rp-title { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 8px; color: #f0f4f8; }
  .rp-title span { color: #C9A84C; }
  .rp-subtitle { font-family: 'Space Mono', monospace; font-size: 11px; color: #4B5869; margin-bottom: 32px; line-height: 1.6; }

  .rp-label { display: block; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #4B5869; margin-bottom: 8px; }

  .rp-input-wrap { position: relative; margin-bottom: 8px; }
  .rp-input {
    width: 100%;
    background: rgba(137,196,225,0.04);
    border: 1px solid rgba(137,196,225,0.12);
    border-radius: 8px;
    padding: 13px 16px;
    font-family: 'Space Mono', monospace; font-size: 13px; color: #E8EEF5;
    outline: none; transition: border-color 0.15s, box-shadow 0.15s;
    box-sizing: border-box;
  }
  .rp-input::placeholder { color: #2E3D4F; }
  .rp-input:focus { border-color: rgba(201,168,76,0.5); box-shadow: 0 0 0 3px rgba(201,168,76,0.08); }
  .rp-input.match   { border-color: rgba(74,222,128,0.4); }
  .rp-input.mismatch { border-color: rgba(248,113,113,0.4); }

  /* Strength bar */
  .rp-strength-wrap { margin-bottom: 20px; }
  .rp-strength-track { height: 3px; background: rgba(137,196,225,0.08); border-radius: 2px; overflow: hidden; margin-bottom: 6px; }
  .rp-strength-bar { height: 100%; border-radius: 2px; transition: width 0.3s, background 0.3s; }
  .rp-strength-label { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.05em; }

  .rp-match-hint { font-family: 'Space Mono', monospace; font-size: 9px; margin-bottom: 20px; margin-top: -4px; }

  .rp-field { margin-bottom: 4px; }

  .rp-btn {
    width: 100%; background: #C9A84C; color: #0D1520; border: none; border-radius: 8px;
    padding: 14px; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
    cursor: pointer; transition: opacity 0.15s, transform 0.15s; margin-top: 8px;
  }
  .rp-btn:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  .rp-btn:active:not(:disabled) { transform: translateY(0); }
  .rp-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .rp-back {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    margin-top: 24px; font-family: 'Space Mono', monospace; font-size: 11px;
    color: #4B5869; cursor: pointer; transition: color 0.15s;
    background: none; border: none; width: 100%;
  }
  .rp-back:hover { color: #89C4E1; }

  .rp-alert { border-radius: 8px; padding: 12px 16px; font-family: 'Space Mono', monospace; font-size: 11px; margin-bottom: 20px; line-height: 1.6; }
  .rp-alert.error   { background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2);  color: #f87171; }
  .rp-alert.success { background: rgba(74,222,128,0.08);  border: 1px solid rgba(74,222,128,0.2);   color: #4ade80; }
  .rp-alert.warning { background: rgba(201,168,76,0.08);  border: 1px solid rgba(201,168,76,0.2);   color: #C9A84C; }

  /* Success state */
  .rp-success-icon {
    width: 52px; height: 52px; border-radius: 50%;
    background: rgba(74,222,128,0.1); border: 1px solid rgba(74,222,128,0.2);
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 20px; font-size: 22px;
  }
  .rp-success-title { text-align: center; font-size: 18px; font-weight: 700; color: #f0f4f8; margin-bottom: 8px; }
  .rp-success-text  { text-align: center; font-family: 'Space Mono', monospace; font-size: 11px; color: #4B5869; line-height: 1.7; }

  /* Token checking skeleton */
  .rp-checking { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 20px 0; }
  .rp-spinner { width: 28px; height: 28px; border: 2px solid rgba(201,168,76,0.15); border-top-color: #C9A84C; border-radius: 50%; animation: rp-spin 0.8s linear infinite; }
  .rp-checking-text { font-family: 'Space Mono', monospace; font-size: 11px; color: #4B5869; }

  @keyframes rp-fadeUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes rp-spin   { to { transform: rotate(360deg); } }
`;

function getStrength(pw: string): { pct: number; color: string; label: string } {
  if (pw.length === 0) return { pct: 0,   color: "transparent",  label: "" };
  if (pw.length < 6)  return { pct: 20,  color: "#f87171",      label: "Too short" };
  if (pw.length < 8)  return { pct: 45,  color: "#C9A84C",      label: "Weak" };
  if (pw.length < 12) return { pct: 70,  color: "#89C4E1",      label: "Good" };
  return               { pct: 100, color: "#4ade80",      label: "Strong" };
}

export default function ResetPasswordPage() {
  const navigate       = useNavigate();
  const [searchParams] = useSearchParams();
  const token          = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [done, setDone]         = useState(false);
  const [error, setError]       = useState("");
  const [validToken, setValidToken] = useState<boolean | null>(null);

  // Inject styles once
  if (!document.getElementById("rp-styles")) {
    const tag = document.createElement("style");
    tag.id = "rp-styles"; tag.textContent = css;
    document.head.appendChild(tag);
  }

  // Verify token on mount
  useEffect(() => {
    if (!token) { setValidToken(false); return; }
    fetch(`${API}/auth/verify-reset-token?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((d) => setValidToken(d.valid ?? false))
      .catch(() => setValidToken(false));
  }, [token]);

  const strength  = getStrength(password);
  const matches   = confirm.length > 0 && password === confirm;
  const mismatches = confirm.length > 0 && password !== confirm;
  const canSubmit = password.length >= 6 && matches && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6)  { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm)  { setError("Passwords do not match."); return; }
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
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: any) {
      setError(err.message ?? "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rp-root">
      <div className="rp-card">

        <div className="rp-logo">
          <div className="rp-logo-dot" />
          Winners Ecosystem
        </div>

        {/* Token still verifying */}
        {validToken === null && (
          <>
            <h1 className="rp-title">New <span>Password</span></h1>
            <div className="rp-checking">
              <div className="rp-spinner" />
              <p className="rp-checking-text">Verifying reset link…</p>
            </div>
          </>
        )}

        {/* Invalid / expired token */}
        {validToken === false && (
          <>
            <h1 className="rp-title">New <span>Password</span></h1>
            <div className="rp-alert error">
              ✗ This reset link is invalid or has expired.
            </div>
            <div className="rp-alert warning">
              Request a new reset link from the forgot password page.
            </div>
          </>
        )}

        {/* Success state */}
        {done && (
          <>
            <div className="rp-success-icon">✓</div>
            <p className="rp-success-title">Password Updated</p>
            <p className="rp-success-text">
              Your password has been reset successfully.<br />
              Redirecting to sign in…
            </p>
          </>
        )}

        {/* Reset form */}
        {validToken === true && !done && (
          <>
            <h1 className="rp-title">New <span>Password</span></h1>
            <p className="rp-subtitle">Choose a strong password for your account.</p>

            {error && <div className="rp-alert error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="rp-field">
                <label className="rp-label">New Password</label>
                <div className="rp-input-wrap">
                  <input
                    className="rp-input" type="password" placeholder="••••••••"
                    value={password} onChange={(e) => setPassword(e.target.value)} autoFocus
                  />
                </div>
                {password && (
                  <div className="rp-strength-wrap">
                    <div className="rp-strength-track">
                      <div className="rp-strength-bar" style={{ width: `${strength.pct}%`, background: strength.color }} />
                    </div>
                    <span className="rp-strength-label" style={{ color: strength.color }}>{strength.label}</span>
                  </div>
                )}
              </div>

              <div className="rp-field" style={{ marginBottom: "4px" }}>
                <label className="rp-label">Confirm Password</label>
                <div className="rp-input-wrap">
                  <input
                    className={`rp-input${matches ? " match" : mismatches ? " mismatch" : ""}`}
                    type="password" placeholder="••••••••"
                    value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  />
                </div>
              </div>

              {confirm.length > 0 && (
                <p className="rp-match-hint" style={{ color: matches ? "#4ade80" : "#f87171" }}>
                  {matches ? "✓ Passwords match" : "✗ Passwords do not match"}
                </p>
              )}

              <button className="rp-btn" disabled={!canSubmit}>
                {loading ? "Resetting…" : "Set New Password →"}
              </button>
            </form>
          </>
        )}

        <button className="rp-back" onClick={() => navigate("/login")}>
          ← Back to Sign In
        </button>

      </div>
    </div>
  );
}