// src/features/auth/ForgotPasswordPage.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL ?? "";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Space+Mono&display=swap');

  .fp-root {
    min-height: 100vh;
    background: #0D1520;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Syne', sans-serif;
    color: #E8EDF2;
    padding: 24px;
    position: relative;
    overflow: hidden;
  }

  /* Subtle grid */
  .fp-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(137,196,225,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(137,196,225,0.03) 1px, transparent 1px);
    background-size: 48px 48px;
    pointer-events: none;
  }

  /* Ambient glow */
  .fp-root::after {
    content: '';
    position: fixed;
    top: -200px;
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    height: 400px;
    background: radial-gradient(ellipse, rgba(43,95,142,0.15) 0%, transparent 70%);
    pointer-events: none;
  }

  .fp-card {
    background: linear-gradient(135deg, #0f1923 0%, #0D1520 100%);
    border: 1px solid rgba(137,196,225,0.12);
    border-radius: 16px;
    padding: 44px;
    width: 100%;
    max-width: 420px;
    position: relative;
    z-index: 1;
    animation: fp-fadeUp 0.4s ease forwards;
  }

  /* Gold top accent */
  .fp-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, #C9A84C, transparent);
    border-radius: 16px 16px 0 0;
    opacity: 0.8;
  }

  .fp-logo {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #C9A84C;
    margin-bottom: 32px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .fp-logo-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #C9A84C;
    box-shadow: 0 0 8px rgba(201,168,76,0.6);
  }

  .fp-title {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.5px;
    margin-bottom: 8px;
    color: #f0f4f8;
  }

  .fp-title span { color: #C9A84C; }

  .fp-subtitle {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: #4B5869;
    margin-bottom: 32px;
    line-height: 1.7;
  }

  .fp-label {
    display: block;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #4B5869;
    margin-bottom: 8px;
  }

  .fp-input {
    width: 100%;
    background: rgba(137,196,225,0.04);
    border: 1px solid rgba(137,196,225,0.12);
    border-radius: 8px;
    padding: 13px 16px;
    font-family: 'Space Mono', monospace;
    font-size: 13px;
    color: #E8EDF2;
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    box-sizing: border-box;
    margin-bottom: 20px;
  }

  .fp-input::placeholder { color: #2E3D4F; }

  .fp-input:focus {
    border-color: rgba(201,168,76,0.5);
    box-shadow: 0 0 0 3px rgba(201,168,76,0.08);
  }

  .fp-btn {
    width: 100%;
    background: #C9A84C;
    color: #0D1520;
    border: none;
    border-radius: 8px;
    padding: 14px;
    font-family: 'Syne', sans-serif;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.15s;
    letter-spacing: 0.02em;
  }

  .fp-btn:hover:not(:disabled) {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .fp-btn:active:not(:disabled) { transform: translateY(0); }
  .fp-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .fp-back {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    margin-top: 24px;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: #4B5869;
    cursor: pointer;
    transition: color 0.15s;
    background: none;
    border: none;
    width: 100%;
  }

  .fp-back:hover { color: #89C4E1; }

  .fp-alert {
    border-radius: 8px;
    padding: 12px 16px;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    margin-bottom: 20px;
    line-height: 1.6;
  }

  .fp-alert.error {
    background: rgba(248,113,113,0.08);
    border: 1px solid rgba(248,113,113,0.2);
    color: #f87171;
  }

  .fp-alert.success {
    background: rgba(74,222,128,0.08);
    border: 1px solid rgba(74,222,128,0.2);
    color: #4ade80;
  }

  .fp-success-icon {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: rgba(74,222,128,0.1);
    border: 1px solid rgba(74,222,128,0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 20px;
    font-size: 20px;
  }

  .fp-success-title {
    text-align: center;
    font-size: 16px;
    font-weight: 700;
    color: #f0f4f8;
    margin-bottom: 8px;
  }

  .fp-success-text {
    text-align: center;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: #4B5869;
    line-height: 1.7;
  }

  .fp-success-text strong { color: #89C4E1; }

  @keyframes fp-fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

export default function ForgotPasswordPage() {
  const navigate          = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  // Inject styles once
  if (!document.getElementById("fp-styles")) {
    const tag = document.createElement("style");
    tag.id = "fp-styles";
    tag.textContent = css;
    document.head.appendChild(tag);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.includes("@")) { setError("Please enter a valid email address."); return; }
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
      setError(err.message ?? "Failed to send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fp-root">
      <div className="fp-card">

        <div className="fp-logo">
          <div className="fp-logo-dot" />
          Winners Ecosystem
        </div>

        {sent ? (
          <>
            <div className="fp-success-icon">✓</div>
            <p className="fp-success-title">Check your inbox</p>
            <p className="fp-success-text">
              We sent a reset link to <strong>{email}</strong>.
              Follow the instructions to set a new password.
              The link expires in 30 minutes.
            </p>
          </>
        ) : (
          <>
            <h1 className="fp-title">Reset <span>Password</span></h1>
            <p className="fp-subtitle">
              Enter your email and we'll send you a secure reset link.
            </p>

            {error && <div className="fp-alert error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <label className="fp-label">Email Address</label>
              <input
                className="fp-input"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoFocus
              />
              <button className="fp-btn" disabled={loading || !email}>
                {loading ? "Sending…" : "Send Reset Link →"}
              </button>
            </form>
          </>
        )}

        <button className="fp-back" onClick={() => navigate("/login")}>
          ← Back to Sign In
        </button>

      </div>
    </div>
  );
}