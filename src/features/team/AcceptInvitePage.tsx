// src/features/team/AcceptInvitePage.tsx

import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";

const css = `
  .ai-root {
    --gold: #F5C842; --bg: #080B10; --surface: #0D1117; --surface2: #141B24;
    --border: #1E2A38; --text: #E8EDF2; --text-dim: #5A6878;
    --green: #2DD4A0; --red: #FF5975;
    min-height: 100vh; background: var(--bg); display: flex;
    align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; color: var(--text); padding: 24px;
  }

  .ai-root::before {
    content: ''; position: fixed; inset: 0;
    background-image: linear-gradient(rgba(245,200,66,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,200,66,0.03) 1px, transparent 1px);
    background-size: 40px 40px; pointer-events: none;
  }

  .ai-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 6px;
    padding: 40px; width: 100%; max-width: 440px; position: relative; z-index: 1;
    animation: ai-up 0.5s ease forwards;
  }

  .ai-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--gold), rgba(245,200,66,0.2)); border-radius: 6px 6px 0 0; }

  .ai-logo { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 3px; text-transform: uppercase; color: var(--gold); margin-bottom: 28px; display: flex; align-items: center; gap: 8px; }
  .ai-logo-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--gold); box-shadow: 0 0 8px var(--gold); }

  .ai-icon { font-size: 40px; margin-bottom: 16px; }
  .ai-title { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 8px; }
  .ai-title span { color: var(--gold); }
  .ai-desc { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); margin-bottom: 28px; line-height: 1.6; }

  .ai-invite-info { background: var(--surface2); border: 1px solid var(--border); border-radius: 4px; padding: 16px; margin-bottom: 24px; }
  .ai-invite-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-family: 'Space Mono', monospace; font-size: 11px; }
  .ai-invite-row:last-child { margin-bottom: 0; }
  .ai-invite-label { color: var(--text-dim); }
  .ai-invite-val { color: var(--text); font-weight: 700; }

  .ai-role-badge {
    padding: 2px 8px; border-radius: 2px; font-family: 'Space Mono', monospace;
    font-size: 10px; font-weight: 700; text-transform: uppercase;
    background: rgba(245,200,66,0.1); color: var(--gold); border: 1px solid rgba(245,200,66,0.2);
  }

  .ai-field { margin-bottom: 16px; }
  .ai-label { display: block; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 8px; }
  .ai-input { width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 3px; padding: 12px 14px; font-family: 'Space Mono', monospace; font-size: 13px; color: var(--text); outline: none; transition: border-color 0.15s; box-sizing: border-box; }
  .ai-input:focus { border-color: var(--gold); }
  .ai-input::placeholder { color: var(--text-dim); }

  .ai-btn { width: 100%; background: var(--gold); color: #080B10; border: none; border-radius: 3px; padding: 13px; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700; cursor: pointer; transition: opacity 0.15s; margin-top: 4px; }
  .ai-btn:hover:not(:disabled) { opacity: 0.9; }
  .ai-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .ai-success { text-align: center; }
  .ai-success-icon { font-size: 48px; margin-bottom: 16px; }
  .ai-success-title { font-size: 22px; font-weight: 800; margin-bottom: 8px; color: var(--green); }
  .ai-success-desc { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); }

  .ai-error { background: rgba(255,89,117,0.08); border: 1px solid rgba(255,89,117,0.25); border-radius: 3px; padding: 12px 14px; font-family: 'Space Mono', monospace; font-size: 11px; color: var(--red); margin-bottom: 16px; }

  .ai-invalid { text-align: center; padding: 16px 0; }
  .ai-invalid-icon { font-size: 40px; margin-bottom: 12px; }
  .ai-invalid-title { font-size: 18px; font-weight: 700; margin-bottom: 8px; }
  .ai-invalid-desc { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); }

  @keyframes ai-up { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
`;

// Mock invite resolver — replace with real API call
function resolveInviteToken(token: string) {
  if (!token || token.length < 5) return null;
  return {
    tenantName: "Winners Corp",
    invitedBy:  "Demo User",
    email:      "newmember@company.com",
    role:       "member" as const,
    expiresAt:  new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

export default function AcceptInvitePage() {
  const [params]   = useSearchParams();
  const navigate   = useNavigate();
  const login      = useAuthStore((s) => s.login);

  const token      = params.get("token") ?? "";
  const invite     = resolveInviteToken(token);

  const [name, setName]         = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [done, setDone]         = useState(false);

  useEffect(() => {
    const id = "ai-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id; tag.textContent = css;
      document.head.appendChild(tag);
    }
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  const handleAccept = async () => {
    setError("");
    if (!name.trim())        { setError("Name is required"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }

    setLoading(true);
    try {
      // In production: POST /auth/accept-invite { token, name, password }
      // Then auto-login
      await new Promise((r) => setTimeout(r, 1200)); // simulate API call
      setDone(true);
      setTimeout(() => navigate("/"), 2000);
    } catch {
      setError("Failed to accept invite. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ai-root">
      <div className="ai-card">
        <div className="ai-logo"><div className="ai-logo-dot" />Winners Ecosystem</div>

        {!invite ? (
          <div className="ai-invalid">
            <div className="ai-invalid-icon">⚠️</div>
            <div className="ai-invalid-title">Invalid Invite</div>
            <div className="ai-invalid-desc">This invite link is invalid or has expired.<br />Ask your admin to send a new invite.</div>
          </div>
        ) : done ? (
          <div className="ai-success">
            <div className="ai-success-icon">🎉</div>
            <div className="ai-success-title">You're in!</div>
            <div className="ai-success-desc">Welcome to {invite.tenantName}.<br />Redirecting to dashboard…</div>
          </div>
        ) : (
          <>
            <div className="ai-icon">✉️</div>
            <h1 className="ai-title">You're <span>Invited</span></h1>
            <p className="ai-desc">{invite.invitedBy} invited you to join {invite.tenantName}. Set up your account to get started.</p>

            <div className="ai-invite-info">
              <div className="ai-invite-row">
                <span className="ai-invite-label">Workspace</span>
                <span className="ai-invite-val">{invite.tenantName}</span>
              </div>
              <div className="ai-invite-row">
                <span className="ai-invite-label">Email</span>
                <span className="ai-invite-val">{invite.email}</span>
              </div>
              <div className="ai-invite-row">
                <span className="ai-invite-label">Role</span>
                <span className="ai-role-badge">{invite.role}</span>
              </div>
            </div>

            {error && <div className="ai-error">{error}</div>}

            <div className="ai-field">
              <label className="ai-label" htmlFor="name">Your Name</label>
              <input id="name" className="ai-input" type="text" placeholder="Jane Smith" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="ai-field">
              <label className="ai-label" htmlFor="pw">Create Password</label>
              <input id="pw" className="ai-input" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>

            <button className="ai-btn" onClick={handleAccept} disabled={loading}>
              {loading ? "Setting up your account…" : "Accept Invite & Join"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}