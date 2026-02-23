// src/features/profile/ProfilePage.tsx
// Phase 1 — Core Engine | UI Layer
// Full rebuild: ecosystem card pattern, CSS variables only, no Tailwind, no hex colors
import type { FormEvent } from "react";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../auth/authStore";
import { getAuthHeaders } from "../auth/authStore";

const API = import.meta.env.VITE_API_URL ?? "";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&display=swap');

/* ── Layout ──────────────────────────────────────────────────────────────── */
.pf-root {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  font-family: 'Syne', sans-serif;
  padding: 32px 32px 80px;
  max-width: 860px;
}

/* ── Context Bar ──────────────────────────────────────────────────────────── */
.pf-context-bar {
  display: flex; align-items: center; gap: 8px;
  margin-bottom: 28px; flex-wrap: wrap;
}
.pf-context-item {
  font-family: 'Space Mono', monospace; font-size: 9px;
  letter-spacing: 0.15em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 2px;
}
.pf-context-item.live    { background: rgba(45,212,160,0.1); color: var(--green); border: 1px solid rgba(45,212,160,0.2); }
.pf-context-item.planned { background: rgba(90,122,150,0.08); color: var(--text-dim); border: 1px solid var(--border); }
.pf-context-sep { color: var(--border); font-size: 10px; }

/* ── Page Header ──────────────────────────────────────────────────────────── */
.pf-header { margin-bottom: 32px; }
.pf-eyebrow {
  font-family: 'Space Mono', monospace; font-size: 9px;
  letter-spacing: 0.25em; text-transform: uppercase;
  color: var(--gold); margin-bottom: 6px;
}
.pf-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(28px, 4vw, 40px);
  font-weight: 300; color: var(--text); line-height: 1.1;
  margin: 0 0 6px;
}
.pf-title em { font-style: italic; color: var(--gold); }
.pf-subtitle {
  font-family: 'Space Mono', monospace; font-size: 10px;
  color: var(--text-dim); letter-spacing: 0.05em;
}

/* ── Avatar Row ───────────────────────────────────────────────────────────── */
.pf-avatar-section {
  display: flex; align-items: center; gap: 24px;
  padding: 24px; margin-bottom: 20px;
  background: var(--surface);
  border: 1px solid var(--border); border-radius: 6px;
  position: relative; overflow: hidden;
}
.pf-avatar-section::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg, var(--gold), var(--ice));
}
.pf-avatar-wrap { position: relative; flex-shrink: 0; }
.pf-avatar {
  width: 72px; height: 72px; border-radius: 50%;
  background: linear-gradient(135deg, rgba(201,168,76,0.2), rgba(137,196,225,0.15));
  border: 2px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; font-weight: 800; color: var(--gold);
  font-family: 'Syne', sans-serif; overflow: hidden; cursor: pointer;
  transition: border-color 0.2s;
}
.pf-avatar:hover { border-color: var(--gold); }
.pf-avatar img { width: 100%; height: 100%; object-fit: cover; }
.pf-avatar-badge {
  position: absolute; bottom: 0; right: 0;
  width: 20px; height: 20px; border-radius: 50%;
  background: var(--green); border: 2px solid var(--bg);
  display: flex; align-items: center; justify-content: center;
  font-size: 10px;
}
.pf-avatar-info { flex: 1; }
.pf-avatar-name { font-size: 18px; font-weight: 800; margin-bottom: 3px; }
.pf-avatar-email { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); margin-bottom: 8px; }
.pf-avatar-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.pf-avatar-tag {
  font-family: 'Space Mono', monospace; font-size: 9px;
  letter-spacing: 0.1em; text-transform: uppercase;
  padding: 3px 8px; border-radius: 2px;
  background: rgba(201,168,76,0.08); color: var(--gold);
  border: 1px solid rgba(201,168,76,0.2);
}
.pf-avatar-tag.blue {
  background: rgba(43,95,142,0.15); color: var(--ice);
  border-color: rgba(43,95,142,0.3);
}
.pf-avatar-btn {
  font-family: 'Space Mono', monospace; font-size: 10px;
  color: var(--text-dim); background: none; border: 1px solid var(--border);
  border-radius: 3px; padding: 5px 12px; cursor: pointer;
  transition: all 0.15s; flex-shrink: 0;
}
.pf-avatar-btn:hover { border-color: var(--gold); color: var(--gold); }

/* ── Cards ────────────────────────────────────────────────────────────────── */
.pf-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 6px; margin-bottom: 16px;
  position: relative; overflow: hidden;
}
.pf-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0;
  height: 2px;
}
.pf-card.gold::before   { background: linear-gradient(90deg, var(--gold), transparent); }
.pf-card.green::before  { background: linear-gradient(90deg, var(--green), transparent); }
.pf-card.blue::before   { background: linear-gradient(90deg, var(--blue), transparent); }
.pf-card.red::before    { background: linear-gradient(90deg, var(--red), transparent); }
.pf-card.purple::before { background: linear-gradient(90deg, var(--purple), transparent); }

.pf-card-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border);
  display: flex; align-items: flex-start; justify-content: space-between; gap: 16px;
}
.pf-card-title { font-size: 14px; font-weight: 700; margin-bottom: 3px; }
.pf-card-desc  { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }
.pf-card-body  { padding: 24px; }

/* ── Form Elements ────────────────────────────────────────────────────────── */
.pf-field { margin-bottom: 16px; }
.pf-label {
  display: block; font-family: 'Space Mono', monospace; font-size: 10px;
  letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--text-dim); margin-bottom: 6px;
}
.pf-input {
  width: 100%; background: var(--surface2); border: 1px solid var(--border);
  border-radius: 4px; padding: 11px 14px;
  font-family: 'Space Mono', monospace; font-size: 12px; color: var(--text);
  outline: none; transition: border-color 0.15s; box-sizing: border-box;
}
.pf-input:focus { border-color: var(--gold); }
.pf-input::placeholder { color: var(--text-dim); }
.pf-input:disabled { opacity: 0.45; cursor: not-allowed; }

.pf-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

/* ── Buttons ─────────────────────────────────────────────────────────────── */
.pf-btn {
  background: var(--gold); color: #080B10; border: none;
  border-radius: 4px; padding: 10px 22px;
  font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: opacity 0.15s;
}
.pf-btn:hover:not(:disabled) { opacity: 0.85; }
.pf-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.pf-btn.ghost {
  background: transparent; border: 1px solid var(--border); color: var(--text-dim);
}
.pf-btn.ghost:hover { border-color: var(--gold); color: var(--gold); }
.pf-btn.danger {
  background: transparent; border: 1px solid rgba(224,90,78,0.35); color: var(--red);
}
.pf-btn.danger:hover:not(:disabled) { background: rgba(224,90,78,0.08); }
.pf-btn-row { display: flex; justify-content: flex-end; margin-top: 20px; gap: 10px; }

/* ── Feedback ─────────────────────────────────────────────────────────────── */
.pf-success { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--green); margin-top: 10px; }
.pf-error   { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--red);   margin-top: 10px; }

/* ── Toggle Switches ──────────────────────────────────────────────────────── */
.pf-toggle-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 0; border-bottom: 1px solid var(--border);
}
.pf-toggle-row:last-child { border-bottom: none; padding-bottom: 0; }
.pf-toggle-label { font-size: 13px; font-weight: 600; margin-bottom: 3px; }
.pf-toggle-desc  { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }

.pf-switch {
  width: 38px; height: 22px; border-radius: 11px;
  background: var(--border); position: relative;
  cursor: pointer; transition: background 0.2s; flex-shrink: 0;
}
.pf-switch.on { background: var(--green); }
.pf-switch::after {
  content: ''; position: absolute;
  width: 16px; height: 16px; border-radius: 50%;
  background: white; top: 3px; left: 3px; transition: left 0.2s;
}
.pf-switch.on::after { left: 19px; }

/* ── Danger Zone ──────────────────────────────────────────────────────────── */
.pf-danger-desc { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); margin-bottom: 16px; line-height: 1.6; }
.pf-danger-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }

/* ── Stats Strip ──────────────────────────────────────────────────────────── */
.pf-stats {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 1px; background: var(--border); border-radius: 6px;
  overflow: hidden; margin-bottom: 20px;
  border: 1px solid var(--border);
}
.pf-stat {
  background: var(--surface); padding: 16px 20px; text-align: center;
}
.pf-stat-value { font-size: 22px; font-weight: 800; color: var(--gold); margin-bottom: 4px; }
.pf-stat-label { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); letter-spacing: 0.1em; text-transform: uppercase; }

/* ── Responsive ──────────────────────────────────────────────────────────── */
@media (max-width: 768px) {
  .pf-root { padding: 16px 16px 80px; }
  .pf-row { grid-template-columns: 1fr; }
  .pf-stats { grid-template-columns: 1fr; }
  .pf-avatar-section { flex-direction: column; align-items: flex-start; }
}
`;

const NOTIF_OPTIONS = [
  { key: "revenueAlerts",   label: "Revenue Alerts",   desc: "Notify when revenue spikes or drops significantly" },
  { key: "weeklyReport",    label: "Weekly Report",     desc: "Receive a weekly summary every Monday" },
  { key: "teamActivity",    label: "Team Activity",     desc: "When members join or change roles" },
  { key: "anomalyDetected", label: "Anomaly Detection", desc: "Instant alert when anomalies are detected" },
  { key: "billingUpdates",  label: "Billing Updates",   desc: "Invoice and subscription change notifications" },
];

export default function ProfilePage() {
  const user    = useAuthStore((s) => s.user);
  const fileRef = useRef<HTMLInputElement>(null);

  const [name,     setName]     = useState(user?.name  ?? "");
  const [email]                 = useState(user?.email ?? "");
  const [avatar,   setAvatar]   = useState<string | null>(null);
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState("");

  const [curPwd,   setCurPwd]   = useState("");
  const [newPwd,   setNewPwd]   = useState("");
  const [confPwd,  setConfPwd]  = useState("");
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg,   setPwdMsg]   = useState("");

  const [notifs, setNotifs] = useState<Record<string, boolean>>({
    revenueAlerts: true, weeklyReport: true, teamActivity: false,
    anomalyDetected: true, billingUpdates: true,
  });

  useEffect(() => {
    const id = "pf-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id; tag.textContent = css;
      document.head.appendChild(tag);
    }
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?";

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveMsg("");
    try {
      const res = await fetch(`${API}/api/v1/profile`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ name: name.trim() }),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      setSaveMsg("✓ Profile updated successfully");
    } catch (err: any) {
      setSaveMsg("✗ " + err.message);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 3500);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (newPwd !== confPwd)    { setPwdMsg("✗ Passwords do not match"); return; }
    if (newPwd.length < 6)     { setPwdMsg("✗ Password must be at least 6 characters"); return; }
    setPwdSaving(true); setPwdMsg("");
    try {
      const res = await fetch(`${API}/api/v1/profile/password`, {
        method: "PATCH",
        headers: getAuthHeaders(),
        body: JSON.stringify({ currentPassword: curPwd, newPassword: newPwd }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Failed");
      setPwdMsg("✓ Password updated successfully");
      setCurPwd(""); setNewPwd(""); setConfPwd("");
    } catch (err: any) {
      setPwdMsg("✗ " + err.message);
    } finally {
      setPwdSaving(false);
      setTimeout(() => setPwdMsg(""), 3500);
    }
  };

  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : "Member";

  return (
    <div className="pf-root">
      {/* Context Bar */}
      <div className="pf-context-bar">
        <span className="pf-context-item live">⬡ Core Engine</span>
        <span className="pf-context-sep">›</span>
        <span className="pf-context-item live">Profile</span>
        <span className="pf-context-sep">›</span>
        <span className="pf-context-item planned">Phase 1</span>
      </div>

      {/* Page Header */}
      <div className="pf-header">
        <div className="pf-eyebrow">Account</div>
        <h1 className="pf-title">Your <em>Profile</em></h1>
        <div className="pf-subtitle">Manage your identity within the Winners Ecosystem</div>
      </div>

      {/* Avatar + Info */}
      <div className="pf-avatar-section">
        <div className="pf-avatar-wrap">
          <div className="pf-avatar" onClick={() => fileRef.current?.click()}>
            {avatar ? <img src={avatar} alt="avatar" /> : initials}
          </div>
          <div className="pf-avatar-badge">✓</div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
        </div>
        <div className="pf-avatar-info">
          <div className="pf-avatar-name">{name || "Your Name"}</div>
          <div className="pf-avatar-email">{email}</div>
          <div className="pf-avatar-tags">
            <span className="pf-avatar-tag">{roleLabel}</span>
            <span className="pf-avatar-tag blue">🏆 Winners Ecosystem</span>
          </div>
        </div>
        <button className="pf-avatar-btn" onClick={() => fileRef.current?.click()}>
          Change Photo
        </button>
      </div>

      {/* Stats Strip */}
      <div className="pf-stats">
        <div className="pf-stat">
          <div className="pf-stat-value">1</div>
          <div className="pf-stat-label">Workspace</div>
        </div>
        <div className="pf-stat">
          <div className="pf-stat-value">{roleLabel}</div>
          <div className="pf-stat-label">Role</div>
        </div>
        <div className="pf-stat">
          <div className="pf-stat-value">Active</div>
          <div className="pf-stat-label">Status</div>
        </div>
      </div>

      {/* Personal Info */}
      <div className="pf-card gold">
        <div className="pf-card-header">
          <div>
            <div className="pf-card-title">Personal Information</div>
            <div className="pf-card-desc">Update your display name and profile details</div>
          </div>
        </div>
        <div className="pf-card-body">
          <form onSubmit={handleSaveProfile}>
            <div className="pf-row">
              <div className="pf-field">
                <label className="pf-label">Display Name</label>
                <input className="pf-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div className="pf-field">
                <label className="pf-label">Email Address</label>
                <input className="pf-input" value={email} disabled />
              </div>
            </div>
            <div className="pf-field">
              <label className="pf-label">Role in Ecosystem</label>
              <input className="pf-input" value={roleLabel} disabled />
            </div>
            {saveMsg && <div className={saveMsg.startsWith("✓") ? "pf-success" : "pf-error"}>{saveMsg}</div>}
            <div className="pf-btn-row">
              <button type="submit" className="pf-btn" disabled={saving}>
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Change Password */}
      <div className="pf-card green">
        <div className="pf-card-header">
          <div>
            <div className="pf-card-title">Change Password</div>
            <div className="pf-card-desc">Minimum 6 characters. Use a strong password.</div>
          </div>
        </div>
        <div className="pf-card-body">
          <form onSubmit={handleChangePassword}>
            <div className="pf-field">
              <label className="pf-label">Current Password</label>
              <input className="pf-input" type="password" value={curPwd} onChange={(e) => setCurPwd(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="pf-row">
              <div className="pf-field">
                <label className="pf-label">New Password</label>
                <input
                  className="pf-input" type="password" value={newPwd}
                  onChange={(e) => setNewPwd(e.target.value)} placeholder="••••••••"
                  style={newPwd && confPwd ? { borderColor: newPwd === confPwd ? "var(--green)" : "var(--red)" } : {}}
                />
              </div>
              <div className="pf-field">
                <label className="pf-label">Confirm Password</label>
                <input
                  className="pf-input" type="password" value={confPwd}
                  onChange={(e) => setConfPwd(e.target.value)} placeholder="••••••••"
                  style={confPwd ? { borderColor: newPwd === confPwd ? "var(--green)" : "var(--red)" } : {}}
                />
              </div>
            </div>
            {confPwd && (
              <div style={{ fontFamily: "Space Mono, monospace", fontSize: 10, marginBottom: 8, color: newPwd === confPwd ? "var(--green)" : "var(--red)" }}>
                {newPwd === confPwd ? "✓ Passwords match" : "✗ Passwords do not match"}
              </div>
            )}
            {pwdMsg && <div className={pwdMsg.startsWith("✓") ? "pf-success" : "pf-error"}>{pwdMsg}</div>}
            <div className="pf-btn-row">
              <button type="submit" className="pf-btn" disabled={pwdSaving || !curPwd || !newPwd || newPwd !== confPwd}>
                {pwdSaving ? "Updating…" : "Update Password"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="pf-card purple">
        <div className="pf-card-header">
          <div>
            <div className="pf-card-title">Notification Preferences</div>
            <div className="pf-card-desc">Choose what you want to be notified about</div>
          </div>
        </div>
        <div className="pf-card-body">
          {NOTIF_OPTIONS.map((opt) => (
            <div className="pf-toggle-row" key={opt.key}>
              <div>
                <div className="pf-toggle-label">{opt.label}</div>
                <div className="pf-toggle-desc">{opt.desc}</div>
              </div>
              <div
                className={`pf-switch${notifs[opt.key] ? " on" : ""}`}
                onClick={() => setNotifs((prev) => ({ ...prev, [opt.key]: !prev[opt.key] }))}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="pf-card red">
        <div className="pf-card-header">
          <div>
            <div className="pf-card-title">Danger Zone</div>
            <div className="pf-card-desc">Irreversible actions — proceed with extreme caution</div>
          </div>
        </div>
        <div className="pf-card-body">
          <div className="pf-danger-desc">
            Deleting your account will permanently remove all your personal data, posts, and activity
            from the Winners Ecosystem. This action cannot be undone and complies with GDPR Article 17.
          </div>
          <div className="pf-danger-row">
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: "var(--red)", marginBottom: 3 }}>Delete My Account</div>
              <div style={{ fontFamily: "Space Mono, monospace", fontSize: 10, color: "var(--text-dim)" }}>Permanent · Irreversible · GDPR compliant</div>
            </div>
            <button
              className="pf-btn danger"
              onClick={() => {
                if (confirm("This will permanently delete your account and all associated data. Are you sure?")) {
                  fetch(`${API}/api/v1/gdpr/me`, {
                    method: "DELETE",
                    headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
                    body: JSON.stringify({ confirmation: "DELETE_MY_ACCOUNT" }),
                  });
                }
              }}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}