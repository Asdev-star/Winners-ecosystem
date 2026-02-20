// src/features/team/OnboardingPage.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";
import { useInviteStore } from "./inviteStore";
import type { Role } from "./inviteStore";
import { useEffect } from "react";

const css = `
  .ob-root {
    --gold: #F5C842; --bg: #080B10; --surface: #0D1117; --surface2: #141B24;
    --border: #1E2A38; --text: #E8EDF2; --text-dim: #5A6878;
    --green: #2DD4A0; --blue: #4A9EFF; --purple: #9B6FFF;
    min-height: 100vh; background: var(--bg); display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    font-family: 'Syne', sans-serif; color: var(--text); padding: 24px;
  }

  .ob-root::before {
    content: ''; position: fixed; inset: 0;
    background-image: linear-gradient(rgba(245,200,66,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,200,66,0.03) 1px, transparent 1px);
    background-size: 40px 40px; pointer-events: none;
  }

  .ob-progress { display: flex; align-items: center; gap: 0; margin-bottom: 40px; position: relative; z-index: 1; }
  .ob-step-dot { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700; transition: all 0.3s; border: 2px solid var(--border); background: var(--surface); color: var(--text-dim); }
  .ob-step-dot.active { border-color: var(--gold); background: rgba(245,200,66,0.1); color: var(--gold); }
  .ob-step-dot.done   { border-color: var(--green); background: rgba(45,212,160,0.1); color: var(--green); }
  .ob-step-line { width: 48px; height: 1px; background: var(--border); }
  .ob-step-line.done { background: var(--green); }

  .ob-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 6px;
    padding: 40px; width: 100%; max-width: 500px; position: relative; z-index: 1;
    animation: ob-in 0.4s ease forwards;
  }
  .ob-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--gold), var(--purple)); border-radius: 6px 6px 0 0; }

  .ob-step-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--gold); margin-bottom: 12px; }
  .ob-title { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 8px; }
  .ob-title span { color: var(--gold); }
  .ob-desc { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); margin-bottom: 28px; line-height: 1.6; }

  .ob-field { margin-bottom: 16px; }
  .ob-label { display: block; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 8px; }
  .ob-input { width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 3px; padding: 12px 14px; font-family: 'Space Mono', monospace; font-size: 13px; color: var(--text); outline: none; transition: border-color 0.15s; box-sizing: border-box; }
  .ob-input:focus { border-color: var(--gold); }
  .ob-input::placeholder { color: var(--text-dim); }
  .ob-select { width: 100%; background: var(--surface2); border: 1px solid var(--border); border-radius: 3px; padding: 12px 14px; font-family: 'Space Mono', monospace; font-size: 13px; color: var(--text); outline: none; cursor: pointer; box-sizing: border-box; }
  .ob-select:focus { border-color: var(--gold); }

  .ob-option-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 4px; }
  .ob-option { background: var(--surface2); border: 1px solid var(--border); border-radius: 4px; padding: 14px; cursor: pointer; transition: all 0.15s; text-align: center; }
  .ob-option:hover { border-color: var(--gold); }
  .ob-option.selected { border-color: var(--gold); background: rgba(245,200,66,0.08); }
  .ob-option-icon { font-size: 24px; margin-bottom: 6px; }
  .ob-option-label { font-size: 12px; font-weight: 700; }
  .ob-option-desc { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); margin-top: 2px; }

  .ob-invite-row { display: flex; gap: 8px; margin-bottom: 10px; }
  .ob-invite-row .ob-input { flex: 1; }
  .ob-invite-select { background: var(--surface2); border: 1px solid var(--border); border-radius: 3px; padding: 12px 10px; font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text); outline: none; cursor: pointer; }
  .ob-add-btn { background: transparent; border: 1px solid var(--border); border-radius: 3px; padding: 12px 14px; color: var(--text-dim); cursor: pointer; font-size: 18px; transition: all 0.15s; }
  .ob-add-btn:hover { border-color: var(--gold); color: var(--gold); }

  .ob-invite-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px; }
  .ob-invite-item { display: flex; justify-content: space-between; align-items: center; background: var(--surface2); border: 1px solid var(--border); border-radius: 3px; padding: 8px 12px; }
  .ob-invite-item-email { font-family: 'Space Mono', monospace; font-size: 11px; }
  .ob-invite-item-right { display: flex; align-items: center; gap: 8px; }
  .ob-remove { background: none; border: none; color: var(--text-dim); cursor: pointer; font-size: 14px; padding: 0; transition: color 0.15s; }
  .ob-remove:hover { color: var(--red); }

  .ob-nav { display: flex; justify-content: space-between; margin-top: 28px; }
  .ob-btn { background: var(--gold); color: #080B10; border: none; border-radius: 3px; padding: 12px 24px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: opacity 0.15s; }
  .ob-btn:hover { opacity: 0.88; }
  .ob-btn.ghost { background: transparent; color: var(--text-dim); border: 1px solid var(--border); }
  .ob-btn.ghost:hover { border-color: var(--gold); color: var(--gold); }

  .ob-done { text-align: center; padding: 16px 0; }
  .ob-done-icon { font-size: 56px; margin-bottom: 16px; }
  .ob-done-title { font-size: 26px; font-weight: 800; color: var(--green); margin-bottom: 8px; }
  .ob-done-desc { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); line-height: 1.6; }

  @keyframes ob-in { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
`;

const STEPS = ["Workspace", "Industry", "Invite", "Done"];

interface InviteRow { email: string; role: Role; }

export default function OnboardingPage() {
  const navigate      = useNavigate();
  const user          = useAuthStore((s) => s.user);
  const updateTenant  = useInviteStore((s) => s.updateTenant);
  const inviteMember  = useInviteStore((s) => s.inviteMember);

  const [step, setStep]           = useState(0);
  const [workspaceName, setWS]    = useState(user?.tenantName ?? "");
  const [timezone, setTZ]         = useState("UTC");
  const [currency, setCurrency]   = useState("USD");
  const [industry, setIndustry]   = useState("");
  const [invites, setInvites]     = useState<InviteRow[]>([]);
  const [inviteEmail, setIEmail]  = useState("");
  const [inviteRole, setIRole]    = useState<Role>("member");
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    const id = "ob-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id; tag.textContent = css;
      document.head.appendChild(tag);
    }
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  const addInvite = () => {
    if (!inviteEmail.includes("@")) return;
    setInvites((prev) => [...prev, { email: inviteEmail, role: inviteRole }]);
    setIEmail(""); setIRole("member");
  };

  const finish = async () => {
    setFinishing(true);
    await updateTenant({ name: workspaceName, settings: { timezone, currency, fiscalMonth: 1 } });
    await Promise.all(invites.map((inv) => inviteMember(inv.email, inv.role)));
    setStep(3);
    setFinishing(false);
  };

  const INDUSTRIES = [
    { icon: "🛒", label: "E-Commerce",  desc: "Online retail & DTC" },
    { icon: "💻", label: "SaaS",        desc: "Software products" },
    { icon: "🏥", label: "Healthcare",  desc: "Medical & wellness" },
    { icon: "🎓", label: "Education",   desc: "Courses & training" },
    { icon: "🏗️", label: "Agency",      desc: "Client services" },
    { icon: "📊", label: "Finance",     desc: "Fintech & investing" },
  ];

  return (
    <div className="ob-root">

      {/* Progress */}
      {step < 3 && (
        <div className="ob-progress">
          {STEPS.slice(0, 3).map((s, i) => (
            <>
              <div key={s} className={`ob-step-dot${i === step ? " active" : i < step ? " done" : ""}`}>
                {i < step ? "✓" : i + 1}
              </div>
              {i < 2 && <div key={`line-${i}`} className={`ob-step-line${i < step ? " done" : ""}`} />}
            </>
          ))}
        </div>
      )}

      <div className="ob-card">

        {/* Step 0 — Workspace */}
        {step === 0 && (
          <>
            <div className="ob-step-label">Step 1 of 3</div>
            <h1 className="ob-title">Set up your <span>Workspace</span></h1>
            <p className="ob-desc">Configure your workspace name and preferences. You can change these any time.</p>

            <div className="ob-field">
              <label className="ob-label">Workspace Name</label>
              <input className="ob-input" type="text" placeholder="Acme Corp" value={workspaceName} onChange={(e) => setWS(e.target.value)} />
            </div>
            <div className="ob-field">
              <label className="ob-label">Timezone</label>
              <select className="ob-select" value={timezone} onChange={(e) => setTZ(e.target.value)}>
                <option value="UTC">UTC</option>
                <option value="America/New_York">Eastern (ET)</option>
                <option value="America/Chicago">Central (CT)</option>
                <option value="America/Denver">Mountain (MT)</option>
                <option value="America/Los_Angeles">Pacific (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
                <option value="Asia/Tokyo">Tokyo (JST)</option>
              </select>
            </div>
            <div className="ob-field">
              <label className="ob-label">Currency</label>
              <select className="ob-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="KES">KES — Kenyan Shilling</option>
                <option value="NGN">NGN — Nigerian Naira</option>
                <option value="ZAR">ZAR — South African Rand</option>
              </select>
            </div>

            <div className="ob-nav">
              <div />
              <button className="ob-btn" onClick={() => setStep(1)} disabled={!workspaceName.trim()}>Next →</button>
            </div>
          </>
        )}

        {/* Step 1 — Industry */}
        {step === 1 && (
          <>
            <div className="ob-step-label">Step 2 of 3</div>
            <h1 className="ob-title">Your <span>Industry</span></h1>
            <p className="ob-desc">Helps us tailor your analytics insights and benchmarks.</p>

            <div className="ob-option-grid">
              {INDUSTRIES.map((ind) => (
                <div
                  key={ind.label}
                  className={`ob-option${industry === ind.label ? " selected" : ""}`}
                  onClick={() => setIndustry(ind.label)}
                >
                  <div className="ob-option-icon">{ind.icon}</div>
                  <div className="ob-option-label">{ind.label}</div>
                  <div className="ob-option-desc">{ind.desc}</div>
                </div>
              ))}
            </div>

            <div className="ob-nav">
              <button className="ob-btn ghost" onClick={() => setStep(0)}>← Back</button>
              <button className="ob-btn" onClick={() => setStep(2)}>Next →</button>
            </div>
          </>
        )}

        {/* Step 2 — Invite */}
        {step === 2 && (
          <>
            <div className="ob-step-label">Step 3 of 3</div>
            <h1 className="ob-title">Invite your <span>Team</span></h1>
            <p className="ob-desc">Add teammates to your workspace. You can always invite more from the Team page.</p>

            {invites.length > 0 && (
              <div className="ob-invite-list">
                {invites.map((inv, i) => (
                  <div className="ob-invite-item" key={i}>
                    <span className="ob-invite-item-email">{inv.email}</span>
                    <div className="ob-invite-item-right">
                      <span style={{ fontFamily: "Space Mono, monospace", fontSize: "10px", color: "var(--text-dim)" }}>{inv.role}</span>
                      <button className="ob-remove" onClick={() => setInvites((p) => p.filter((_, j) => j !== i))}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="ob-invite-row">
              <input
                className="ob-input"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setIEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addInvite()}
              />
              <select className="ob-invite-select" value={inviteRole} onChange={(e) => setIRole(e.target.value as Role)}>
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
              <button className="ob-add-btn" onClick={addInvite}>+</button>
            </div>

            <div className="ob-nav">
              <button className="ob-btn ghost" onClick={() => setStep(1)}>← Back</button>
              <button className="ob-btn" onClick={finish} disabled={finishing}>
                {finishing ? "Setting up…" : "Finish Setup 🚀"}
              </button>
            </div>
          </>
        )}

        {/* Step 3 — Done */}
        {step === 3 && (
          <div className="ob-done">
            <div className="ob-done-icon">🏆</div>
            <div className="ob-done-title">You're all set!</div>
            <div className="ob-done-desc">
              {workspaceName} is ready.<br />
              {invites.length > 0 && `${invites.length} invite${invites.length > 1 ? "s" : ""} sent. `}
              Welcome to the Winners Ecosystem.
            </div>
            <button className="ob-btn" style={{ marginTop: "24px" }} onClick={() => navigate("/")}>
              Go to Dashboard →
            </button>
          </div>
        )}

      </div>
    </div>
  );
}