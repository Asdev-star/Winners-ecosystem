// src/features/profile/ProfilePage.tsx

import { useState, useEffect, useRef } from "react";
import type { FormEvent } from "react";
import { useAuthStore } from "../auth/authStore";
import { getAuthHeaders } from "../auth/authStore";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .pp-root {
    --gold: #F5C842; --bg: #080B10; --surface: #0D1117; --surface2: #141B24;
    --border: #1E2A38; --text: #E8EDF2; --text-dim: #5A6878;
    --green: #2DD4A0; --red: #FF5975; --purple: #9B6FFF;
    background: var(--bg); color: var(--text);
    font-family: 'Syne', sans-serif; min-height: 100vh; padding: 32px 24px 80px;
  }

  .pp-inner { max-width: 680px; margin: 0 auto; }

  .pp-header { margin-bottom: 32px; }
  .pp-title { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
  .pp-title span { color: var(--gold); }
  .pp-subtitle { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); margin-top: 4px; }

  .pp-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 6px; overflow: hidden; margin-bottom: 16px;
    position: relative;
  }
  .pp-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
  .pp-card.gold::before   { background: var(--gold); }
  .pp-card.green::before  { background: var(--green); }
  .pp-card.purple::before { background: var(--purple); }
  .pp-card.red::before    { background: var(--red); }

  .pp-card-header { padding: 18px 24px 14px; border-bottom: 1px solid var(--border); }
  .pp-card-title  { font-size: 14px; font-weight: 700; }
  .pp-card-desc   { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); margin-top: 3px; }
  .pp-card-body   { padding: 20px 24px; }

  /* Avatar */
  .pp-avatar-row { display: flex; align-items: center; gap: 20px; }
  .pp-avatar {
    width: 72px; height: 72px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; font-weight: 800; position: relative; cursor: pointer;
    background: rgba(245,200,66,0.15); color: var(--gold);
    border: 2px solid rgba(245,200,66,0.3); transition: border-color 0.2s;
    overflow: hidden;
  }
  .pp-avatar:hover { border-color: var(--gold); }
  .pp-avatar:hover .pp-avatar-overlay { opacity: 1; }
  .pp-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .pp-avatar-overlay {
    position: absolute; inset: 0; background: rgba(0,0,0,0.6);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 0.2s; font-size: 18px;
  }
  .pp-avatar-info { flex: 1; }
  .pp-avatar-name { font-size: 18px; font-weight: 800; margin-bottom: 4px; }
  .pp-avatar-email { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); }
  .pp-avatar-hint  { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); margin-top: 8px; }

  /* Form */
  .pp-field { margin-bottom: 16px; }
  .pp-field:last-child { margin-bottom: 0; }
  .pp-label {
    display: block; font-family: 'Space Mono', monospace; font-size: 10px;
    letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 8px;
  }
  .pp-input {
    width: 100%; background: var(--surface2); border: 1px solid var(--border);
    border-radius: 3px; padding: 11px 14px; font-family: 'Space Mono', monospace;
    font-size: 12px; color: var(--text); outline: none; transition: border-color 0.15s;
    box-sizing: border-box;
  }
  .pp-input:focus { border-color: var(--gold); }
  .pp-input::placeholder { color: var(--text-dim); }
  .pp-input:disabled { opacity: 0.5; cursor: not-allowed; }

  .pp-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  .pp-btn {
    background: var(--gold); color: #080B10; border: none; border-radius: 3px;
    padding: 10px 22px; font-family: 'Syne', sans-serif; font-size: 13px;
    font-weight: 700; cursor: pointer; transition: opacity 0.15s;
  }
  .pp-btn:hover:not(:disabled) { opacity: 0.88; }
  .pp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .pp-btn.ghost { background: transparent; border: 1px solid var(--border); color: var(--text-dim); }
  .pp-btn.ghost:hover { border-color: var(--gold); color: var(--gold); }
  .pp-btn.danger { background: transparent; border: 1px solid rgba(255,89,117,0.3); color: var(--red); }
  .pp-btn.danger:hover { background: rgba(255,89,117,0.08); }

  .pp-btn-row { display: flex; justify-content: flex-end; margin-top: 20px; }

  /* Notifications */
  .pp-toggle-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 0; border-bottom: 1px solid var(--border);
  }
  .pp-toggle-row:last-child { border-bottom: none; padding-bottom: 0; }
  .pp-toggle-label { font-size: 13px; font-weight: 600; }
  .pp-toggle-desc  { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); margin-top: 2px; }

  .pp-switch {
    width: 36px; height: 20px; border-radius: 10px; background: var(--border);
    position: relative; cursor: pointer; transition: background 0.2s; flex-shrink: 0;
  }
  .pp-switch.on { background: var(--green); }
  .pp-switch::after {
    content: ''; position: absolute; width: 14px; height: 14px; border-radius: 50%;
    background: white; top: 3px; left: 3px; transition: left 0.2s;
  }
  .pp-switch.on::after { left: 19px; }

  /* Feedback */
  .pp-success { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--green); margin-top: 10px; }
  .pp-error   { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--red);   margin-top: 10px; }

  /* Danger */
  .pp-danger-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
  .pp-danger-title { font-size: 13px; font-weight: 700; color: var(--red); margin-bottom: 4px; }
  .pp-danger-desc  { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }

  @media (max-width: 480px) { .pp-row { grid-template-columns: 1fr; } }
`;

const NOTIF_OPTIONS = [
  { key: "revenueAlerts",   label: "Revenue Alerts",       desc: "Get notified when revenue spikes or drops significantly" },
  { key: "weeklyReport",    label: "Weekly Report",         desc: "Receive a weekly summary every Monday morning" },
  { key: "teamActivity",    label: "Team Activity",         desc: "Notifications when members join or change roles" },
  { key: "anomalyDetected", label: "Anomaly Detection",     desc: "Instant alerts when data anomalies are detected" },
  { key: "billingUpdates",  label: "Billing Updates",       desc: "Invoice and subscription change notifications" },
];

export default function ProfilePage() {
  const user      = useAuthStore((s) => s.user);
  const fileRef   = useRef<HTMLInputElement>(null);

  const [name,     setName]     = useState(user?.name     ?? "");
  const [email,    setEmail]    = useState(user?.email    ?? "");
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
    const id = "pp-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id; tag.textContent = css;
      document.head.appendChild(tag);
    }
    return () => { document.getElementById(id)?.remove(); };
  }, []);

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
      await fetch(`${API_BASE}/profile`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body:    JSON.stringify({ name, email }),
      });
      setSaveMsg("✓ Profile updated successfully");
    } catch {
      setSaveMsg("✗ Failed to update profile");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwdMsg("");
    if (newPwd !== confPwd) { setPwdMsg("✗ Passwords do not match"); return; }
    if (newPwd.length < 6)  { setPwdMsg("✗ Password must be at least 6 characters"); return; }
    setPwdSaving(true);
    try {
      const res = await fetch(`${API_BASE}/profile/password`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body:    JSON.stringify({ currentPassword: curPwd, newPassword: newPwd }),
      });
      if (!res.ok) throw new Error();
      setPwdMsg("✓ Password changed successfully");
      setCurPwd(""); setNewPwd(""); setConfPwd("");
    } catch {
      setPwdMsg("✗ Current password is incorrect");
    } finally {
      setPwdSaving(false);
      setTimeout(() => setPwdMsg(""), 3000);
    }
  };

  const handleDeleteAccount = () => {
    if (!confirm("Are you sure? This action cannot be undone. Your account will be permanently deleted.")) return;
    alert("Account deletion requested. You will receive a confirmation email.");
  };

  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="pp-root">
      <div className="pp-inner">

        <div className="pp-header">
          <h1 className="pp-title">My <span>Profile</span></h1>
          <p className="pp-subtitle">Manage your personal account settings</p>
        </div>

        {/* Avatar + Identity */}
        <div className="pp-card gold">
          <div className="pp-card-header">
            <div className="pp-card-title">Profile Photo</div>
            <div className="pp-card-desc">Click your avatar to upload a new photo</div>
          </div>
          <div className="pp-card-body">
            <div className="pp-avatar-row">
              <div className="pp-avatar" onClick={() => fileRef.current?.click()}>
                {avatar ? <img src={avatar} alt="avatar" /> : initials}
                <div className="pp-avatar-overlay">📷</div>
              </div>
              <div className="pp-avatar-info">
                <div className="pp-avatar-name">{name}</div>
                <div className="pp-avatar-email">{email}</div>
                <div className="pp-avatar-hint">JPG, PNG or GIF · Max 2MB</div>
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarChange} />
          </div>
        </div>

        {/* Edit Profile */}
        <div className="pp-card gold">
          <div className="pp-card-header">
            <div className="pp-card-title">Personal Information</div>
            <div className="pp-card-desc">Update your name and email address</div>
          </div>
          <div className="pp-card-body">
            <form onSubmit={handleSaveProfile}>
              <div className="pp-row">
                <div className="pp-field">
                  <label className="pp-label">Full Name</label>
                  <input className="pp-input" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
                </div>
                <div className="pp-field">
                  <label className="pp-label">Email Address</label>
                  <input className="pp-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
                </div>
              </div>
              <div className="pp-field">
                <label className="pp-label">Role</label>
                <input className="pp-input" type="text" value={user?.role ?? ""} disabled />
              </div>
              {saveMsg && <div className={saveMsg.startsWith("✓") ? "pp-success" : "pp-error"}>{saveMsg}</div>}
              <div className="pp-btn-row">
                <button type="submit" className="pp-btn" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>

        {/* Change Password */}
        <div className="pp-card green">
          <div className="pp-card-header">
            <div className="pp-card-title">Change Password</div>
            <div className="pp-card-desc">Use a strong password with at least 6 characters</div>
          </div>
          <div className="pp-card-body">
            <form onSubmit={handleChangePassword}>
              <div className="pp-field">
                <label className="pp-label">Current Password</label>
                <input className="pp-input" type="password" value={curPwd} onChange={(e) => setCurPwd(e.target.value)} placeholder="••••••••" />
              </div>
              <div className="pp-row">
                <div className="pp-field">
                  <label className="pp-label">New Password</label>
                  <input className="pp-input" type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="••••••••" />
                </div>
                <div className="pp-field">
                  <label className="pp-label">Confirm Password</label>
                  <input className="pp-input" type="password" value={confPwd} onChange={(e) => setConfPwd(e.target.value)} placeholder="••••••••" />
                </div>
              </div>
              {pwdMsg && <div className={pwdMsg.startsWith("✓") ? "pp-success" : "pp-error"}>{pwdMsg}</div>}
              <div className="pp-btn-row">
                <button type="submit" className="pp-btn" disabled={pwdSaving}>{pwdSaving ? "Updating…" : "Update Password"}</button>
              </div>
            </form>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="pp-card purple">
          <div className="pp-card-header">
            <div className="pp-card-title">Notification Preferences</div>
            <div className="pp-card-desc">Choose what you want to be notified about</div>
          </div>
          <div className="pp-card-body">
            {NOTIF_OPTIONS.map((opt) => (
              <div className="pp-toggle-row" key={opt.key}>
                <div>
                  <div className="pp-toggle-label">{opt.label}</div>
                  <div className="pp-toggle-desc">{opt.desc}</div>
                </div>
                <div
                  className={`pp-switch${notifs[opt.key] ? " on" : ""}`}
                  onClick={() => setNotifs((n) => ({ ...n, [opt.key]: !n[opt.key] }))}
                />
              </div>
            ))}
            <div className="pp-btn-row" style={{ marginTop: 16 }}>
              <button className="pp-btn" onClick={() => alert("Notification preferences saved!")}>Save Preferences</button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="pp-card red">
          <div className="pp-card-header">
            <div className="pp-card-title" style={{ color: "var(--red)" }}>Danger Zone</div>
            <div className="pp-card-desc">Irreversible actions — proceed with caution</div>
          </div>
          <div className="pp-card-body">
            <div className="pp-danger-row">
              <div>
                <div className="pp-danger-title">Delete Account</div>
                <div className="pp-danger-desc">Permanently delete your account and all associated data.</div>
              </div>
              <button className="pp-btn danger" onClick={handleDeleteAccount}>Delete Account</button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}