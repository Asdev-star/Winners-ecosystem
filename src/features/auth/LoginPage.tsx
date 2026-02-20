// src/features/auth/LoginPage.tsx

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "./authStore";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .lp-root {
    --gold: #F5C842;
    --bg: #080B10;
    --surface: #0D1117;
    --surface2: #141B24;
    --border: #1E2A38;
    --text: #E8EDF2;
    --text-dim: #5A6878;
    --green: #2DD4A0;
    --red: #FF5975;
    min-height: 100vh;
    background: var(--bg);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Syne', sans-serif;
    color: var(--text);
    padding: 24px;
    position: relative;
    overflow: hidden;
  }

  .lp-root::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(245,200,66,0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(245,200,66,0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    pointer-events: none;
  }

  .lp-glow {
    position: fixed;
    width: 600px;
    height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(245,200,66,0.04) 0%, transparent 70%);
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
  }

  .lp-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 40px;
    width: 100%;
    max-width: 420px;
    position: relative;
    z-index: 1;
    animation: lp-fadeUp 0.5s ease forwards;
  }

  .lp-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--gold), rgba(245,200,66,0.2));
    border-radius: 6px 6px 0 0;
  }

  .lp-logo {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 28px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .lp-logo-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--gold);
    box-shadow: 0 0 8px var(--gold);
  }

  .lp-title {
    font-size: 26px;
    font-weight: 800;
    letter-spacing: -0.5px;
    margin-bottom: 6px;
  }

  .lp-title span { color: var(--gold); }

  .lp-subtitle {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: var(--text-dim);
    margin-bottom: 32px;
  }

  .lp-field { margin-bottom: 16px; }

  .lp-label {
    display: block;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: var(--text-dim);
    margin-bottom: 8px;
  }

  .lp-input {
    width: 100%;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 3px;
    padding: 12px 14px;
    font-family: 'Space Mono', monospace;
    font-size: 13px;
    color: var(--text);
    outline: none;
    transition: border-color 0.15s, box-shadow 0.15s;
    box-sizing: border-box;
  }

  .lp-input::placeholder { color: var(--text-dim); }

  .lp-input:focus {
    border-color: var(--gold);
    box-shadow: 0 0 0 3px rgba(245,200,66,0.08);
  }

  .lp-input.error { border-color: var(--red); }
  .lp-input.error:focus { box-shadow: 0 0 0 3px rgba(255,89,117,0.08); }

  .lp-error {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--red);
    margin-top: 6px;
    display: flex;
    align-items: center;
    gap: 5px;
  }

  .lp-submit {
    width: 100%;
    background: var(--gold);
    color: #080B10;
    border: none;
    border-radius: 3px;
    padding: 13px;
    font-family: 'Syne', sans-serif;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity 0.15s, transform 0.15s;
    margin-top: 8px;
    letter-spacing: 0.3px;
  }

  .lp-submit:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
  .lp-submit:active:not(:disabled) { transform: translateY(0); }
  .lp-submit:disabled { opacity: 0.5; cursor: not-allowed; }

  .lp-loading {
    display: inline-flex;
    align-items: center;
    gap: 8px;
  }

  .lp-spinner {
    width: 14px;
    height: 14px;
    border: 2px solid rgba(8,11,16,0.3);
    border-top-color: #080B10;
    border-radius: 50%;
    animation: lp-spin 0.7s linear infinite;
  }

  .lp-alert {
    background: rgba(255,89,117,0.08);
    border: 1px solid rgba(255,89,117,0.25);
    border-radius: 3px;
    padding: 11px 14px;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: var(--red);
    margin-bottom: 20px;
  }

  .lp-divider {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 24px 0;
  }

  .lp-divider-line { flex: 1; height: 1px; background: var(--border); }
  .lp-divider-text { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }

  .lp-demo {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 3px;
    padding: 12px 14px;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--text-dim);
    cursor: pointer;
    transition: border-color 0.15s;
    text-align: center;
    letter-spacing: 0.5px;
  }

  .lp-demo:hover { border-color: var(--gold); color: var(--gold); }
  .lp-demo span { color: var(--gold); }

  .lp-footer {
    margin-top: 28px;
    padding-top: 20px;
    border-top: 1px solid var(--border);
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--text-dim);
    text-align: center;
  }

  @keyframes lp-fadeUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes lp-spin {
    to { transform: rotate(360deg); }
  }
`;

export default function LoginPage() {
  const navigate     = useNavigate();
  const login        = useAuthStore((s) => s.login);
  const user         = useAuthStore((s) => s.user);

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [fieldErr, setFieldErr] = useState({ email: false, password: false });

  // Inject styles
  useEffect(() => {
    const id = "lp-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id;
      tag.textContent = css;
      document.head.appendChild(tag);
    }
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const validate = () => {
    const errs = {
      email: !email.includes("@"),
      password: password.length < 6,
    };
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
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err?.message ?? "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setEmail("demo@winners.io");
    setPassword("demo1234");
    setError("");
    setFieldErr({ email: false, password: false });
  };

  return (
    <div className="lp-root">
      <div className="lp-glow" />
      <div className="lp-card">

        <div className="lp-logo">
          <div className="lp-logo-dot" />
          Winners Ecosystem
        </div>

        <h1 className="lp-title">Welcome <span>Back</span></h1>
        <p className="lp-subtitle">Sign in to your workspace</p>

        {error && <div className="lp-alert">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="lp-field">
            <label className="lp-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className={`lp-input${fieldErr.email ? " error" : ""}`}
              placeholder="you@company.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setFieldErr((f) => ({ ...f, email: false })); }}
              autoComplete="email"
              autoFocus
            />
            {fieldErr.email && <div className="lp-error">› Valid email required</div>}
          </div>

          <div className="lp-field">
            <label className="lp-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className={`lp-input${fieldErr.password ? " error" : ""}`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setFieldErr((f) => ({ ...f, password: false })); }}
              autoComplete="current-password"
            />
            {fieldErr.password && <div className="lp-error">› Minimum 6 characters</div>}
          </div>

          <button type="submit" className="lp-submit" disabled={loading}>
            {loading
              ? <span className="lp-loading"><span className="lp-spinner" /> Signing in...</span>
              : "Sign In"}
          </button>
        </form>

        <div className="lp-divider">
          <div className="lp-divider-line" />
          <span className="lp-divider-text">or</span>
          <div className="lp-divider-line" />
        </div>

        <div className="lp-demo" onClick={fillDemo}>
          Use demo credentials → <span>demo@winners.io</span>
        </div>

        <div className="lp-footer">
          Winners Ecosystem · Multi-Tenant Intelligence Platform
        </div>
      </div>
    </div>
  );
}