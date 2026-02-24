// src/features/onboarding/OnboardingPage.tsx
// Phase 1 — Core Engine | UI Layer
// Full rebuild: ecosystem design system, 5-step onboarding flow

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";
import { API_BASE } from "../../lib/api";

const API = API_BASE;
interface Invite { email: string; role: string; }

const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');

*, *::before, *::after { box-sizing: border-box; }

.ob-root {
  min-height: 100vh; background: var(--bg); color: var(--text);
  font-family: 'Syne', sans-serif;
  display: flex; align-items: center; justify-content: center;
  padding: 32px 20px;
}

.ob-shell {
  width: 100%; max-width: 580px;
  animation: ob-rise 0.45s ease forwards;
}
@keyframes ob-rise { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: none; } }

/* Brand Header */
.ob-brand {
  text-align: center; margin-bottom: 40px;
}
.ob-brand-badge {
  display: inline-flex; align-items: center; gap: 8px;
  font-family: 'Space Mono', monospace; font-size: 10px;
  letter-spacing: 0.2em; text-transform: uppercase;
  color: var(--gold); margin-bottom: 12px;
}
.ob-brand-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px var(--green); }
.ob-brand-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 36px; font-weight: 300; color: var(--text);
  line-height: 1.1; margin: 0;
}
.ob-brand-title em { font-style: italic; color: var(--gold); }
.ob-brand-sub { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); margin-top: 8px; letter-spacing: 0.05em; }

/* Progress Track */
.ob-progress { display: flex; align-items: center; justify-content: center; gap: 0; margin-bottom: 36px; }
.ob-step-item { display: flex; align-items: center; }
.ob-step-dot {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Space Mono', monospace; font-size: 11px; font-weight: 700;
  border: 2px solid var(--border); background: var(--surface);
  color: var(--text-dim); transition: all 0.3s; cursor: default; position: relative;
  flex-shrink: 0;
}
.ob-step-dot.active  { border-color: var(--gold); background: rgba(201,168,76,0.15); color: var(--gold); box-shadow: 0 0 16px rgba(201,168,76,0.2); }
.ob-step-dot.done    { border-color: var(--green); background: rgba(45,212,160,0.15); color: var(--green); }
.ob-step-label {
  position: absolute; top: 40px; left: 50%; transform: translateX(-50%);
  font-family: 'Space Mono', monospace; font-size: 8px; white-space: nowrap;
  color: var(--text-dim); letter-spacing: 0.1em; text-transform: uppercase;
}
.ob-step-dot.active .ob-step-label { color: var(--gold); }
.ob-step-dot.done   .ob-step-label { color: var(--green); }
.ob-step-line { flex: 1; height: 1px; background: var(--border); min-width: 32px; max-width: 64px; transition: background 0.3s; }
.ob-step-line.done { background: var(--green); }

/* Card */
.ob-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 6px; padding: 32px; margin-bottom: 20px;
  position: relative; overflow: hidden;
}
.ob-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, var(--gold), var(--ice));
}

.ob-step-header { text-align: center; margin-bottom: 28px; }
.ob-step-icon { font-size: 32px; margin-bottom: 12px; }
.ob-step-title { font-size: 22px; font-weight: 800; margin-bottom: 6px; }
.ob-step-desc  { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); line-height: 1.7; }

/* Form Elements */
.ob-field { margin-bottom: 16px; }
.ob-label {
  display: block; font-family: 'Space Mono', monospace; font-size: 9px;
  letter-spacing: 0.15em; text-transform: uppercase; color: var(--text-dim); margin-bottom: 6px;
}
.ob-input, .ob-select {
  width: 100%; background: var(--surface2); border: 1px solid var(--border);
  border-radius: 4px; padding: 12px 14px;
  font-family: 'Space Mono', monospace; font-size: 12px; color: var(--text);
  outline: none; transition: border-color 0.2s;
}
.ob-input:focus, .ob-select:focus { border-color: var(--gold); }
.ob-input::placeholder { color: var(--text-dim); }

.ob-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

/* Invite rows */
.ob-invite-row { display: flex; gap: 8px; align-items: center; margin-bottom: 10px; }
.ob-invite-email { flex: 1; }
.ob-invite-role  { width: 120px; }
.ob-add-row {
  font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim);
  background: none; border: 1px dashed var(--border); border-radius: 4px;
  padding: 8px 14px; cursor: pointer; width: 100%; text-align: left;
  transition: all 0.2s; margin-top: 6px;
}
.ob-add-row:hover { border-color: var(--gold); color: var(--gold); }

/* Plan cards */
.ob-plans { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.ob-plan-card {
  border: 2px solid var(--border); border-radius: 6px; padding: 20px;
  cursor: pointer; transition: all 0.2s; text-align: center; position: relative;
  background: var(--surface2);
}
.ob-plan-card:hover { border-color: rgba(201,168,76,0.4); }
.ob-plan-card.selected { border-color: var(--gold); background: rgba(201,168,76,0.05); }
.ob-plan-card.selected::before {
  content: '✓'; position: absolute; top: -10px; right: -10px;
  width: 22px; height: 22px; border-radius: 50%;
  background: var(--gold); color: var(--bg);
  font-weight: 900; font-size: 11px;
  display: flex; align-items: center; justify-content: center;
}
.ob-plan-name  { font-weight: 800; font-size: 14px; margin-bottom: 4px; }
.ob-plan-price { font-family: 'Space Mono', monospace; font-size: 20px; font-weight: 700; color: var(--gold); margin-bottom: 8px; }
.ob-plan-desc  { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); line-height: 1.6; }
.ob-plan-badge {
  display: inline-block; margin-bottom: 8px;
  font-family: 'Space Mono', monospace; font-size: 8px;
  letter-spacing: 0.1em; text-transform: uppercase;
  padding: 2px 8px; border-radius: 2px;
  background: rgba(201,168,76,0.15); color: var(--gold); border: 1px solid rgba(201,168,76,0.3);
}

/* Completion screen */
.ob-complete { text-align: center; padding: 16px 0; }
.ob-complete-icon { font-size: 52px; margin-bottom: 16px; animation: ob-pop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
@keyframes ob-pop { from { transform: scale(0); } to { transform: scale(1); } }
.ob-complete-title { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 300; margin-bottom: 8px; }
.ob-complete-title em { font-style: italic; color: var(--gold); }
.ob-complete-desc { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); line-height: 1.8; max-width: 380px; margin: 0 auto 24px; }
.ob-layers { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 24px 0; }
.ob-layer {
  display: flex; align-items: center; gap: 10px;
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 4px; padding: 10px 14px; text-align: left;
}
.ob-layer-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.ob-layer-dot.live    { background: var(--green); }
.ob-layer-dot.planned { background: var(--text-dim); }
.ob-layer-name { font-size: 12px; font-weight: 700; }
.ob-layer-desc { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); }

/* Navigation */
.ob-nav { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.ob-btn {
  background: var(--gold); color: var(--bg); border: none;
  border-radius: 4px; padding: 12px 28px;
  font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
  cursor: pointer; transition: opacity 0.15s;
}
.ob-btn:hover:not(:disabled) { opacity: 0.85; }
.ob-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.ob-btn.ghost {
  background: transparent; border: 1px solid var(--border); color: var(--text-dim);
}
.ob-btn.ghost:hover { border-color: var(--gold); color: var(--gold); }

.ob-skip {
  font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim);
  background: none; border: none; cursor: pointer; text-decoration: underline;
  text-decoration-style: dotted; padding: 0;
}
.ob-skip:hover { color: var(--gold); }

.ob-error { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--red); text-align: center; margin-bottom: 12px; }

@media (max-width: 600px) {
  .ob-plans { grid-template-columns: 1fr; }
  .ob-layers { grid-template-columns: 1fr; }
  .ob-row    { grid-template-columns: 1fr; }
  .ob-card   { padding: 24px 20px; }
  .ob-invite-row { flex-direction: column; }
  .ob-invite-role { width: 100%; }
}
`;

const STEPS = [
  { label: "Workspace" },
  { label: "Prefs" },
  { label: "Team" },
  { label: "Plan" },
  { label: "Done" },
];

const LAYERS = [
  { name: "Core Engine",          desc: "Auth · Billing · Analytics",  dot: "live"    },
  { name: "Community",            desc: "Feed · Posts · Follows",       dot: "live"    },
  { name: "Winners Academy",      desc: "Courses · Certificates",       dot: "planned" },
  { name: "Winners Market",       desc: "Products · Vendors",           dot: "planned" },
  { name: "Winners Intelligence", desc: "AI Agents · Automation",       dot: "planned" },
  { name: "Winners Work",         desc: "Jobs · Freelance · Escrow",    dot: "planned" },
];

export default function OnboardingPage() {
  const user     = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const token    = useAuthStore((s) => s.token);

  const [step, setStep]                   = useState(0);
  const [saving, setSaving]               = useState(false);
  const [error,  setError]                = useState("");

  // Step 0 — Workspace
  const [workspaceName, setWorkspaceName] = useState(user ? `${user.name}'s Workspace` : "");

  // Step 1 — Preferences
  const [timezone, setTimezone]           = useState("UTC");
  const [currency, setCurrency]           = useState("USD");

  // Step 2 — Team
  const [invites, setInvites]             = useState<Invite[]>([{ email: "", role: "member" }]);

  // Step 3 — Plan
  const [selectedPlan, setSelectedPlan]   = useState("free");

  const authHeader = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const saveWorkspace = async () => {
    if (!workspaceName.trim()) { setError("Workspace name is required"); return false; }
    try {
      const res = await fetch(`${API}/api/v1/settings/workspace`, {
        method: "PATCH", headers: authHeader,
        body: JSON.stringify({ name: workspaceName.trim() }),
      });
      if (!res.ok) throw new Error("Failed to save workspace");
      return true;
    } catch (e: any) { setError(e.message); return false; }
  };

  const savePreferences = async () => {
    try {
      await fetch(`${API}/api/v1/settings/workspace`, {
        method: "PATCH", headers: authHeader,
        body: JSON.stringify({ timezone, currency }),
      });
      return true;
    } catch (e: any) { setError(e.message); return false; }
  };

  const saveInvites = async () => {
    const valid = invites.filter((i) => i.email.includes("@"));
    for (const inv of valid) {
      await fetch(`${API}/api/v1/team/invite`, {
        method: "POST", headers: authHeader,
        body: JSON.stringify({ email: inv.email, role: inv.role }),
      }).catch(() => {});
    }
    return true;
  };

  const handleNext = async () => {
    setError(""); setSaving(true);
    let ok = true;
    if (step === 0) ok = await saveWorkspace();
    if (step === 1) ok = await savePreferences();
    if (step === 2) ok = await saveInvites();
    setSaving(false);
    if (ok) setStep((s) => s + 1);
  };

  const handleFinish = async () => {
    setSaving(true);
    await fetch(`${API}/api/v1/settings/workspace`, {
      method: "PATCH", headers: authHeader,
      body: JSON.stringify({ onboardingComplete: true }),
    }).catch(() => {});
    setSaving(false);
    navigate("/dashboard");
  };

  const addInviteRow = () => setInvites((p) => [...p, { email: "", role: "member" }]);
  const updateInvite = (i: number, field: keyof Invite, val: string) =>
    setInvites((p) => p.map((inv, idx) => idx === i ? { ...inv, [field]: val } : inv));

  return (
    <div className="ob-root">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="ob-shell">

        {/* Brand */}
        <div className="ob-brand">
          <div className="ob-brand-badge">
            <span className="ob-brand-dot" />
            Winners Ecosystem
          </div>
          <h1 className="ob-brand-title">Let's <em>build</em> your workspace.</h1>
          <div className="ob-brand-sub">5 steps · takes about 2 minutes</div>
        </div>

        {/* Progress Track */}
        <div className="ob-progress" style={{ marginBottom: 60 }}>
          {STEPS.map((s, i) => (
            <>
              <div className={`ob-step-dot${i === step ? " active" : i < step ? " done" : ""}`} key={s.label}>
                {i < step ? "✓" : i + 1}
                <span className="ob-step-label">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`ob-step-line${i < step ? " done" : ""}`} key={`line-${i}`} />
              )}
            </>
          ))}
        </div>

        {/* Step Content */}
        <div className="ob-card">

          {/* Step 0 — Workspace */}
          {step === 0 && (
            <>
              <div className="ob-step-header">
                <div className="ob-step-icon">⬡</div>
                <div className="ob-step-title">Name your workspace</div>
                <div className="ob-step-desc">This is your command center inside the Winners Ecosystem. You can change it anytime.</div>
              </div>
              <div className="ob-field">
                <label className="ob-label">Workspace Name</label>
                <input
                  className="ob-input" value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  placeholder="My Company · My Brand · My Empire"
                  autoFocus
                />
              </div>
            </>
          )}

          {/* Step 1 — Preferences */}
          {step === 1 && (
            <>
              <div className="ob-step-header">
                <div className="ob-step-icon">🌍</div>
                <div className="ob-step-title">Set your preferences</div>
                <div className="ob-step-desc">Timezone and currency shape how analytics, reports, and revenue data are displayed.</div>
              </div>
              <div className="ob-row">
                <div className="ob-field">
                  <label className="ob-label">Timezone</label>
                  <select className="ob-select" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                    {["UTC","America/New_York","America/Los_Angeles","Europe/London","Europe/Berlin","Asia/Tokyo","Asia/Kolkata","Africa/Nairobi","Africa/Lagos"].map((tz) =>
                      <option key={tz} value={tz}>{tz}</option>
                    )}
                  </select>
                </div>
                <div className="ob-field">
                  <label className="ob-label">Currency</label>
                  <select className="ob-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    {[["USD","US Dollar"],["EUR","Euro"],["GBP","British Pound"],["KES","Kenyan Shilling"],["NGN","Nigerian Naira"],["ZAR","South African Rand"]].map(([v, l]) =>
                      <option key={v} value={v}>{v} — {l}</option>
                    )}
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Step 2 — Team */}
          {step === 2 && (
            <>
              <div className="ob-step-header">
                <div className="ob-step-icon">🧑‍🤝‍🧑</div>
                <div className="ob-step-title">Invite your team</div>
                <div className="ob-step-desc">Add members now or later from Team Settings. They'll receive an email invite with a signup link.</div>
              </div>
              {invites.map((inv, i) => (
                <div className="ob-invite-row" key={i}>
                  <input
                    className="ob-input ob-invite-email"
                    type="email" placeholder="colleague@company.com"
                    value={inv.email} onChange={(e) => updateInvite(i, "email", e.target.value)}
                  />
                  <select className="ob-select ob-invite-role" value={inv.role} onChange={(e) => updateInvite(i, "role", e.target.value)}>
                    <option value="admin">Admin</option>
                    <option value="member">Member</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
              ))}
              <button className="ob-add-row" onClick={addInviteRow}>+ Add another member</button>
            </>
          )}

          {/* Step 3 — Plan */}
          {step === 3 && (
            <>
              <div className="ob-step-header">
                <div className="ob-step-icon">💎</div>
                <div className="ob-step-title">Choose your plan</div>
                <div className="ob-step-desc">Start free and upgrade as you grow. All plans include the Core Engine.</div>
              </div>
              <div className="ob-plans">
                {[
                  { id: "free",       name: "Free",       price: "$0",    desc: "Core Engine\nCommunity access\nUp to 3 members",        badge: null         },
                  { id: "pro",        name: "Pro",        price: "$99",   desc: "Everything in Free\nAnalytics · Exports\nFull billing",  badge: "Most Popular" },
                  { id: "enterprise", name: "Enterprise", price: "Custom", desc: "Unlimited members\nAI agents · API access\nWhite-label", badge: null        },
                ].map((plan) => (
                  <div
                    key={plan.id}
                    className={`ob-plan-card${selectedPlan === plan.id ? " selected" : ""}`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {plan.badge && <div className="ob-plan-badge">{plan.badge}</div>}
                    <div className="ob-plan-name">{plan.name}</div>
                    <div className="ob-plan-price">{plan.price}{plan.id !== "enterprise" && "/mo"}</div>
                    <div className="ob-plan-desc" style={{ whiteSpace: "pre-line" }}>{plan.desc}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Step 4 — Complete */}
          {step === 4 && (
            <div className="ob-complete">
              <div className="ob-complete-icon">🏆</div>
              <div className="ob-complete-title">Welcome to the <em>Ecosystem</em></div>
              <div className="ob-complete-desc">
                Your workspace is live. You're now part of the Winners Ecosystem —
                a unified platform where community, commerce, learning, and AI come together.
              </div>
              <div className="ob-layers">
                {LAYERS.map((l) => (
                  <div className="ob-layer" key={l.name}>
                    <div className={`ob-layer-dot ${l.dot}`} />
                    <div>
                      <div className="ob-layer-name">{l.name}</div>
                      <div className="ob-layer-desc">{l.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Error */}
        {error && <div className="ob-error">✗ {error}</div>}

        {/* Navigation */}
        <div className="ob-nav">
          {step > 0 && step < 4 ? (
            <button className="ob-btn ghost" onClick={() => setStep((s) => s - 1)}>← Back</button>
          ) : <div />}

          {step === 2 && (
            <button className="ob-skip" onClick={() => setStep((s) => s + 1)}>Skip for now</button>
          )}

          {step < 3 && (
            <button className="ob-btn" onClick={handleNext} disabled={saving}>
              {saving ? "Saving…" : "Continue →"}
            </button>
          )}

          {step === 3 && (
            <button className="ob-btn" onClick={() => setStep(4)} disabled={saving}>
              {saving ? "Setting up…" : "Continue →"}
            </button>
          )}

          {step === 4 && (
            <button className="ob-btn" onClick={handleFinish} disabled={saving} style={{ width: "100%" }}>
              {saving ? "Launching…" : "Enter the Ecosystem →"}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
