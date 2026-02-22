// src/features/onboarding/OnboardingPage.tsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";

const API = import.meta.env.VITE_API_URL ?? "";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .ob-root {
    min-height: 100vh; background: #080B10; color: #E8EDF2;
    font-family: 'Syne', sans-serif; display: flex; flex-direction: column;
    align-items: center; justify-content: center; padding: 24px;
    position: relative; overflow: hidden;
  }
  .ob-root::before {
    content: ''; position: fixed; inset: 0;
    background-image: linear-gradient(rgba(245,200,66,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(245,200,66,0.03) 1px, transparent 1px);
    background-size: 40px 40px; pointer-events: none;
  }
  .ob-glow {
    position: fixed; width: 700px; height: 700px; border-radius: 50%;
    background: radial-gradient(circle, rgba(245,200,66,0.04) 0%, transparent 70%);
    top: 50%; left: 50%; transform: translate(-50%, -50%); pointer-events: none;
  }

  /* Progress bar */
  .ob-progress {
    width: 100%; max-width: 560px; margin-bottom: 32px; position: relative; z-index: 1;
  }
  .ob-progress-top {
    display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;
  }
  .ob-progress-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #F5C842; }
  .ob-progress-step  { font-family: 'Space Mono', monospace; font-size: 10px; color: #5A6878; }
  .ob-progress-track { height: 3px; background: #1E2A38; border-radius: 2px; overflow: hidden; }
  .ob-progress-fill  { height: 100%; background: linear-gradient(90deg, #F5C842, rgba(245,200,66,0.6)); border-radius: 2px; transition: width 0.4s ease; }

  /* Steps indicator */
  .ob-steps {
    display: flex; align-items: center; gap: 0; margin-bottom: 8px;
    width: 100%; max-width: 560px; position: relative; z-index: 1;
  }
  .ob-step-dot {
    width: 28px; height: 28px; border-radius: 50%; border: 1px solid #1E2A38;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700;
    flex-shrink: 0; transition: all 0.3s; background: #0D1117;
    color: #5A6878;
  }
  .ob-step-dot.done    { background: rgba(45,212,160,0.15); border-color: #2DD4A0; color: #2DD4A0; }
  .ob-step-dot.active  { background: rgba(245,200,66,0.15); border-color: #F5C842; color: #F5C842; }
  .ob-step-line { flex: 1; height: 1px; background: #1E2A38; }
  .ob-step-line.done { background: #2DD4A0; }

  /* Card */
  .ob-card {
    background: #0D1117; border: 1px solid #1E2A38; border-radius: 8px;
    padding: 40px; width: 100%; max-width: 560px; position: relative; z-index: 1;
    animation: ob-fadeUp 0.35s ease forwards;
  }
  .ob-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, #F5C842, rgba(245,200,66,0.2)); border-radius: 8px 8px 0 0; }

  .ob-step-title { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 6px; }
  .ob-step-title span { color: #F5C842; }
  .ob-step-desc { font-family: 'Space Mono', monospace; font-size: 11px; color: #5A6878; margin-bottom: 28px; line-height: 1.5; }

  .ob-label { display: block; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: #5A6878; margin-bottom: 8px; }
  .ob-input {
    width: 100%; background: #141B24; border: 1px solid #1E2A38; border-radius: 3px;
    padding: 12px 14px; font-family: 'Space Mono', monospace; font-size: 13px;
    color: #E8EDF2; outline: none; transition: border-color 0.15s; box-sizing: border-box; margin-bottom: 16px;
  }
  .ob-input:focus { border-color: #F5C842; box-shadow: 0 0 0 3px rgba(245,200,66,0.08); }
  .ob-input::placeholder { color: #5A6878; }
  .ob-select {
    width: 100%; background: #141B24; border: 1px solid #1E2A38; border-radius: 3px;
    padding: 12px 14px; font-family: 'Space Mono', monospace; font-size: 13px;
    color: #E8EDF2; outline: none; cursor: pointer; margin-bottom: 16px; box-sizing: border-box;
  }
  .ob-select:focus { border-color: #F5C842; }

  .ob-row { display: flex; gap: 12px; }
  .ob-row .ob-field { flex: 1; }
  .ob-field { display: flex; flex-direction: column; }

  /* Plan cards */
  .ob-plans { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 8px; }
  .ob-plan {
    background: #141B24; border: 1px solid #1E2A38; border-radius: 6px;
    padding: 16px; cursor: pointer; transition: all 0.15s; position: relative;
  }
  .ob-plan:hover { border-color: rgba(245,200,66,0.3); }
  .ob-plan.selected { border-color: #F5C842; background: rgba(245,200,66,0.06); }
  .ob-plan.selected.purple { border-color: #9B6FFF; background: rgba(155,111,255,0.06); }
  .ob-plan-name { font-size: 13px; font-weight: 800; margin-bottom: 4px; }
  .ob-plan.pro .ob-plan-name { color: #F5C842; }
  .ob-plan.enterprise .ob-plan-name { color: #9B6FFF; }
  .ob-plan-price { font-family: 'Space Mono', monospace; font-size: 11px; color: #5A6878; margin-bottom: 10px; }
  .ob-plan-feat { font-size: 11px; color: #5A6878; line-height: 1.5; }
  .ob-plan-check { position: absolute; top: 10px; right: 10px; width: 16px; height: 16px; border-radius: 50%; background: #F5C842; color: #080B10; display: flex; align-items: center; justify-content: center; font-size: 9px; font-weight: 700; }
  .ob-plan.selected.purple .ob-plan-check { background: #9B6FFF; }

  /* Invite rows */
  .ob-invite-row { display: flex; gap: 8px; margin-bottom: 10px; }
  .ob-invite-row .ob-input { margin-bottom: 0; flex: 1; }
  .ob-invite-row .ob-select { margin-bottom: 0; width: auto; }
  .ob-add-btn {
    background: transparent; border: 1px dashed #1E2A38; border-radius: 3px;
    padding: 10px; font-family: 'Space Mono', monospace; font-size: 11px;
    color: #5A6878; cursor: pointer; width: 100%; transition: all 0.15s; margin-bottom: 16px;
  }
  .ob-add-btn:hover { border-color: #F5C842; color: #F5C842; }

  /* Stripe connect */
  .ob-stripe-box {
    background: #141B24; border: 1px solid #1E2A38; border-radius: 6px;
    padding: 20px; margin-bottom: 16px; text-align: center;
  }
  .ob-stripe-logo { font-size: 32px; margin-bottom: 8px; }
  .ob-stripe-text { font-family: 'Space Mono', monospace; font-size: 11px; color: #5A6878; line-height: 1.5; }
  .ob-stripe-btn {
    background: #635BFF; color: white; border: none; border-radius: 3px;
    padding: 11px 24px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
    cursor: pointer; margin-top: 14px; transition: opacity 0.15s; width: 100%;
  }
  .ob-stripe-btn:hover { opacity: 0.88; }
  .ob-stripe-connected { background: rgba(45,212,160,0.1); border: 1px solid rgba(45,212,160,0.3); border-radius: 4px; padding: 12px 16px; display: flex; align-items: center; gap: 10px; font-family: 'Space Mono', monospace; font-size: 11px; color: #2DD4A0; margin-bottom: 16px; }

  /* Navigation */
  .ob-nav { display: flex; justify-content: space-between; align-items: center; margin-top: 28px; }
  .ob-btn-primary {
    background: #F5C842; color: #080B10; border: none; border-radius: 3px;
    padding: 12px 28px; font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
    cursor: pointer; transition: opacity 0.15s;
  }
  .ob-btn-primary:hover:not(:disabled) { opacity: 0.88; }
  .ob-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
  .ob-btn-secondary {
    background: transparent; color: #5A6878; border: 1px solid #1E2A38; border-radius: 3px;
    padding: 12px 20px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all 0.15s;
  }
  .ob-btn-secondary:hover { border-color: #5A6878; color: #E8EDF2; }
  .ob-skip { font-family: 'Space Mono', monospace; font-size: 10px; color: #5A6878; cursor: pointer; transition: color 0.15s; background: none; border: none; }
  .ob-skip:hover { color: #F5C842; }

  .ob-error { font-family: 'Space Mono', monospace; font-size: 11px; color: #FF5975; margin-top: -8px; margin-bottom: 12px; }
  .ob-success-icon { font-size: 48px; text-align: center; margin-bottom: 16px; }

  @keyframes ob-fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

  @media (max-width: 600px) {
    .ob-card { padding: 24px; }
    .ob-plans { grid-template-columns: 1fr; }
    .ob-row { flex-direction: column; gap: 0; }
    .ob-invite-row { flex-direction: column; }
    .ob-invite-row .ob-select { width: 100%; }
  }
`;

const STEPS = [
  { label: "Workspace" },
  { label: "Preferences" },
  { label: "Team" },
  { label: "Stripe" },
  { label: "Plan" },
];

const TIMEZONES = ["UTC", "Africa/Nairobi", "America/New_York", "America/Los_Angeles", "America/Chicago", "Europe/London", "Europe/Paris", "Asia/Tokyo", "Asia/Singapore", "Australia/Sydney"];
const CURRENCIES = ["USD", "KES", "EUR", "GBP", "JPY", "SGD", "AUD", "CAD"];
const FISCAL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

interface Invite { email: string; role: string; }

export default function OnboardingPage() {
  const navigate = useNavigate();
  const user     = useAuthStore((s) => s.user);
  const token    = useAuthStore((s) => s.token);

  const [step, setStep]   = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  // Step 1 — Workspace
  const [workspaceName, setWorkspaceName] = useState(user?.tenantName ?? "");

  // Step 2 — Preferences
  const [timezone, setTimezone]       = useState("UTC");
  const [currency, setCurrency]       = useState("USD");
  const [fiscalMonth, setFiscalMonth] = useState(1);

  // Step 3 — Team
  const [invites, setInvites] = useState<Invite[]>([{ email: "", role: "member" }]);

  // Step 4 — Stripe (already connected via Stripe page)
  const [stripeConnected] = useState(!!user);

  // Step 5 — Plan
  const [selectedPlan, setSelectedPlan] = useState("free");

  if (!document.getElementById("ob-styles")) {
    const tag = document.createElement("style");
    tag.id = "ob-styles"; tag.textContent = css;
    document.head.appendChild(tag);
  }

  const authHeader = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const saveWorkspace = async () => {
    if (!workspaceName.trim()) { setError("Workspace name is required"); return false; }
    try {
      const res = await fetch(`${API}/settings/workspace`, {
        method: "PATCH", headers: authHeader,
        body: JSON.stringify({ name: workspaceName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to save workspace name");
      return true;
    } catch (e: any) { setError(e.message); return false; }
  };

  const savePreferences = async () => {
    try {
      const res = await fetch(`${API}/settings/workspace`, {
        method: "PATCH", headers: authHeader,
        body: JSON.stringify({ timezone, currency, fiscalMonth }),
      });
      if (!res.ok) throw new Error("Failed to save preferences");
      return true;
    } catch (e: any) { setError(e.message); return false; }
  };

  const saveInvites = async () => {
    const valid = invites.filter((i) => i.email.includes("@"));
    for (const inv of valid) {
      await fetch(`${API}/team/invite`, {
        method: "POST", headers: authHeader,
        body: JSON.stringify({ email: inv.email, role: inv.role }),
      }).catch(() => {});
    }
    return true;
  };

  const handleNext = async () => {
    setError("");
    setSaving(true);
    let ok = true;
    if (step === 0) ok = await saveWorkspace();
    if (step === 1) ok = await savePreferences();
    if (step === 2) ok = await saveInvites();
    setSaving(false);
    if (ok) setStep((s) => s + 1);
  };

  const handleFinish = async () => {
    setSaving(true);
    // Mark onboarding complete
    await fetch(`${API}/settings/workspace`, {
      method: "PATCH", headers: authHeader,
      body: JSON.stringify({ onboardingComplete: true }),
    }).catch(() => {});
    setSaving(false);
    navigate("/");
  };

  const addInviteRow = () => setInvites((p) => [...p, { email: "", role: "member" }]);
  const updateInvite = (i: number, field: keyof Invite, val: string) =>
    setInvites((p) => p.map((inv, idx) => idx === i ? { ...inv, [field]: val } : inv));
  const removeInvite = (i: number) => setInvites((p) => p.filter((_, idx) => idx !== i));

  const pct = ((step) / STEPS.length) * 100;

  return (
    <div className="ob-root">
      <div className="ob-glow" />

      {/* Step dots */}
      <div className="ob-steps">
        {STEPS.map((s, i) => (
          <>
            <div key={s.label} className={`ob-step-dot${i < step ? " done" : i === step ? " active" : ""}`}>
              <img src="/logo.jpg" alt="Winners Empire" style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover", border: "2px solid #F5C842" }} />
            </div>
            {i < STEPS.length - 1 && <div key={`line-${i}`} className={`ob-step-line${i < step ? " done" : ""}`} />}
          </>
        ))}
      </div>

      {/* Progress */}
      <div className="ob-progress">
        <div className="ob-progress-top">
          <span className="ob-progress-label">{STEPS[step]?.label}</span>
          <span className="ob-progress-step">Step {step + 1} of {STEPS.length}</span>
        </div>
        <div className="ob-progress-track">
          <div className="ob-progress-fill" style={{ width: `${pct + 20}%` }} />
        </div>
      </div>

      <div className="ob-card">

        {/* ── Step 1: Workspace Name ── */}
        {step === 0 && (
          <>
            <div className="ob-success-icon">🏢</div>
            <div className="ob-step-title">Name Your <span>Workspace</span></div>
            <div className="ob-step-desc">This is the name of your company or team. You can change it later in settings.</div>
            <label className="ob-label">Workspace Name</label>
            <input className="ob-input" placeholder="e.g. Acme Corp" value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} autoFocus />
            {error && <div className="ob-error">{error}</div>}
            <div className="ob-nav">
              <button className="ob-skip" onClick={() => navigate("/")}>Skip onboarding</button>
              <button className="ob-btn-primary" onClick={handleNext} disabled={saving}>{saving ? "Saving…" : "Continue →"}</button>
            </div>
          </>
        )}

        {/* ── Step 2: Preferences ── */}
        {step === 1 && (
          <>
            <div className="ob-success-icon">⚙️</div>
            <div className="ob-step-title">Set Your <span>Preferences</span></div>
            <div className="ob-step-desc">Configure your workspace timezone, currency, and fiscal year start month.</div>
            <label className="ob-label">Timezone</label>
            <select className="ob-select" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
            </select>
            <div className="ob-row">
              <div className="ob-field">
                <label className="ob-label">Currency</label>
                <select className="ob-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="ob-field">
                <label className="ob-label">Fiscal Year Start</label>
                <select className="ob-select" value={fiscalMonth} onChange={(e) => setFiscalMonth(Number(e.target.value))}>
                  {FISCAL_MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                </select>
              </div>
            </div>
            {error && <div className="ob-error">{error}</div>}
            <div className="ob-nav">
              <button className="ob-btn-secondary" onClick={() => setStep((s) => s - 1)}>← Back</button>
              <button className="ob-btn-primary" onClick={handleNext} disabled={saving}>{saving ? "Saving…" : "Continue →"}</button>
            </div>
          </>
        )}

        {/* ── Step 3: Invite Team ── */}
        {step === 2 && (
          <>
            <div className="ob-success-icon">👥</div>
            <div className="ob-step-title">Invite Your <span>Team</span></div>
            <div className="ob-step-desc">Add teammates to your workspace. They'll receive an email invitation.</div>
            {invites.map((inv, i) => (
              <div className="ob-invite-row" key={i}>
                <input
                  className="ob-input" type="email" placeholder="colleague@company.com"
                  value={inv.email} onChange={(e) => updateInvite(i, "email", e.target.value)}
                />
                <select className="ob-select" value={inv.role} onChange={(e) => updateInvite(i, "role", e.target.value)}>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
                {invites.length > 1 && (
                  <button onClick={() => removeInvite(i)} style={{ background: "none", border: "none", color: "#FF5975", cursor: "pointer", fontSize: 16, padding: "0 4px" }}>✕</button>
                )}
              </div>
            ))}
            {invites.length < 5 && (
              <button className="ob-add-btn" onClick={addInviteRow}>+ Add another teammate</button>
            )}
            <div className="ob-nav">
              <button className="ob-btn-secondary" onClick={() => setStep((s) => s - 1)}>← Back</button>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <button className="ob-skip" onClick={() => setStep((s) => s + 1)}>Skip</button>
                <button className="ob-btn-primary" onClick={handleNext} disabled={saving}>{saving ? "Sending…" : "Send Invites →"}</button>
              </div>
            </div>
          </>
        )}

        {/* ── Step 4: Connect Stripe ── */}
        {step === 3 && (
          <>
            <div className="ob-success-icon">💳</div>
            <div className="ob-step-title">Connect <span>Stripe</span></div>
            <div className="ob-step-desc">Link your Stripe account to track revenue and payments automatically.</div>
            {stripeConnected ? (
              <div className="ob-stripe-connected">✓ Stripe is connected and syncing your revenue data.</div>
            ) : (
              <div className="ob-stripe-box">
                <div className="ob-stripe-logo">⚡</div>
                <div className="ob-stripe-text">Connect Stripe to automatically pull your revenue, transactions, and customer data into your dashboard.</div>
                <button className="ob-stripe-btn" onClick={() => navigate("/stripe")}>Connect Stripe Account</button>
              </div>
            )}
            <div className="ob-nav">
              <button className="ob-btn-secondary" onClick={() => setStep((s) => s - 1)}>← Back</button>
              <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <button className="ob-skip" onClick={() => setStep((s) => s + 1)}>Skip</button>
                <button className="ob-btn-primary" onClick={() => setStep((s) => s + 1)}>Continue →</button>
              </div>
            </div>
          </>
        )}

        {/* ── Step 5: Choose Plan ── */}
        {step === 4 && (
          <>
            <div className="ob-success-icon">🚀</div>
            <div className="ob-step-title">Choose Your <span>Plan</span></div>
            <div className="ob-step-desc">Start free and upgrade anytime. No credit card required for the Free plan.</div>
            <div className="ob-plans">
              {[
                { id: "free",       name: "Free",       price: "Free forever", feat: "1 seat · 10 exports/mo · Basic analytics" },
                { id: "pro",        name: "Pro",        price: "$99/month",    feat: "10 seats · Unlimited exports · AI insights" },
                { id: "enterprise", name: "Enterprise", price: "$299/month",   feat: "Unlimited seats · Priority support · SSO" },
              ].map((plan) => (
                <div
                  key={plan.id}
                  className={`ob-plan ${plan.id}${selectedPlan === plan.id ? " selected" + (plan.id === "enterprise" ? " purple" : "") : ""}`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {selectedPlan === plan.id && <div className="ob-plan-check">✓</div>}
                  <div className="ob-plan-name">{plan.name}</div>
                  <div className="ob-plan-price">{plan.price}</div>
                  <div className="ob-plan-feat">{plan.feat}</div>
                </div>
              ))}
            </div>
            <div className="ob-nav">
              <button className="ob-btn-secondary" onClick={() => setStep((s) => s - 1)}>← Back</button>
              <button className="ob-btn-primary" onClick={handleFinish} disabled={saving}>
                {saving ? "Finishing…" : selectedPlan === "free" ? "Get Started →" : "Upgrade & Start →"}
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
}