// src/features/settings/SettingsPage.tsx
// Phase 1 — Core Engine | UI Layer
// Full rebuild: ecosystem card pattern, CSS variables only, no Tailwind, no hex colors
import type { FormEvent } from "react";
import { useState, useEffect} from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, getAuthHeaders } from "../auth/authStore";
import { useInviteStore } from "../team/inviteStore";
import { API_BASE } from "../../lib/api";

const API = API_BASE;
const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "Europe/London", "Europe/Berlin", "Europe/Paris",
  "Asia/Tokyo", "Asia/Shanghai", "Asia/Kolkata", "Australia/Sydney",
  "Africa/Nairobi", "Africa/Lagos", "Africa/Johannesburg",
];

const CURRENCIES = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "KES", label: "KES — Kenyan Shilling" },
  { value: "NGN", label: "NGN — Nigerian Naira" },
  { value: "ZAR", label: "ZAR — South African Rand" },
  { value: "JPY", label: "JPY — Japanese Yen" },
  { value: "CAD", label: "CAD — Canadian Dollar" },
  { value: "AUD", label: "AUD — Australian Dollar" },
];

const FISCAL_MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&display=swap');

.st-root {
  min-height: 100vh; background: var(--bg); color: var(--text);
  font-family: 'Syne', sans-serif;
  padding: 32px 32px 80px; max-width: 860px;
}

/* Context Bar */
.st-context-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 28px; flex-wrap: wrap; }
.st-context-item {
  font-family: 'Space Mono', monospace; font-size: 9px;
  letter-spacing: 0.15em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 2px;
}
.st-context-item.live    { background: rgba(45,212,160,0.1); color: var(--green); border: 1px solid rgba(45,212,160,0.2); }
.st-context-item.planned { background: rgba(90,122,150,0.08); color: var(--text-dim); border: 1px solid var(--border); }
.st-context-sep { color: var(--border); font-size: 10px; }

/* Page Header */
.st-header { margin-bottom: 32px; }
.st-eyebrow {
  font-family: 'Space Mono', monospace; font-size: 9px;
  letter-spacing: 0.25em; text-transform: uppercase; color: var(--gold); margin-bottom: 6px;
}
.st-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(28px, 4vw, 40px); font-weight: 300;
  color: var(--text); line-height: 1.1; margin: 0 0 6px;
}
.st-title em { font-style: italic; color: var(--gold); }
.st-subtitle { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); letter-spacing: 0.05em; }

/* Cards */
.st-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 6px; margin-bottom: 16px;
  position: relative; overflow: hidden;
}
.st-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
}
.st-card.gold::before   { background: linear-gradient(90deg, var(--gold), transparent); }
.st-card.blue::before   { background: linear-gradient(90deg, var(--blue), transparent); }
.st-card.green::before  { background: linear-gradient(90deg, var(--green), transparent); }
.st-card.purple::before { background: linear-gradient(90deg, var(--purple), transparent); }
.st-card.red::before    { background: linear-gradient(90deg, var(--red), transparent); }

.st-card-header { padding: 20px 24px 16px; border-bottom: 1px solid var(--border); }
.st-card-title  { font-size: 14px; font-weight: 700; margin-bottom: 3px; }
.st-card-desc   { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }
.st-card-body   { padding: 24px; }

/* Form */
.st-field { margin-bottom: 16px; }
.st-label {
  display: block; font-family: 'Space Mono', monospace; font-size: 10px;
  letter-spacing: 0.1em; text-transform: uppercase; color: var(--text-dim); margin-bottom: 6px;
}
.st-input, .st-select {
  width: 100%; background: var(--surface2); border: 1px solid var(--border);
  border-radius: 4px; padding: 11px 14px;
  font-family: 'Space Mono', monospace; font-size: 12px; color: var(--text);
  outline: none; transition: border-color 0.15s; box-sizing: border-box; cursor: pointer;
}
.st-input:focus, .st-select:focus { border-color: var(--gold); }
.st-input::placeholder { color: var(--text-dim); }

.st-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.st-row3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }

/* Buttons */
.st-btn {
  background: var(--gold); color: var(--bg); border: none; border-radius: 4px;
  padding: 10px 22px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: opacity 0.15s;
}
.st-btn:hover:not(:disabled) { opacity: 0.85; }
.st-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.st-btn.ghost { background: transparent; border: 1px solid var(--border); color: var(--text-dim); }
.st-btn.ghost:hover { border-color: var(--gold); color: var(--gold); }
.st-btn.danger { background: transparent; border: 1px solid rgba(224,90,78,0.35); color: var(--red); }
.st-btn.danger:hover { background: rgba(224,90,78,0.08); }
.st-btn.blue { background: transparent; border: 1px solid rgba(43,95,142,0.35); color: var(--ice); }
.st-btn.blue:hover { background: rgba(43,95,142,0.12); }
.st-btn-row { display: flex; justify-content: flex-end; margin-top: 20px; gap: 10px; }

/* Feedback */
.st-success { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--green); margin-top: 10px; }
.st-error   { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--red);   margin-top: 10px; }

/* Plan Banner */
.st-plan-banner {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-radius: 4px; flex-wrap: wrap; gap: 12px;
  background: linear-gradient(135deg, rgba(201,168,76,0.08), rgba(137,196,225,0.04));
  border: 1px solid rgba(201,168,76,0.2); margin-bottom: 16px;
}
.st-plan-info { display: flex; align-items: center; gap: 12px; }
.st-plan-dot  { width: 8px; height: 8px; border-radius: 50%; background: var(--green); box-shadow: 0 0 8px var(--green); }
.st-plan-name { font-weight: 700; font-size: 14px; }
.st-plan-sub  { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); margin-top: 2px; }

/* Danger items */
.st-danger-item {
  display: flex; align-items: flex-start; justify-content: space-between;
  padding: 16px 0; border-bottom: 1px solid var(--border); gap: 16px; flex-wrap: wrap;
}
.st-danger-item:last-child { border-bottom: none; padding-bottom: 0; }
.st-danger-title { font-weight: 700; font-size: 13px; color: var(--red); margin-bottom: 3px; }
.st-danger-desc  { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); line-height: 1.6; }

@media (max-width: 768px) {
  .st-root { padding: 16px 16px 80px; }
  .st-row, .st-row3 { grid-template-columns: 1fr; }
}
`;

export default function SettingsPage() {
  const user     = useAuthStore((s) => s.user);
  const logout   = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const { tenant, fetchTenant, updateTenant } = useInviteStore();

  const [wsName,   setWsName]   = useState("");
  const [currency, setCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("UTC");
  const [fiscal,   setFiscal]   = useState(1);
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState("");

  useEffect(() => {
    const id = "st-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id; tag.textContent = css;
      document.head.appendChild(tag);
    }
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  useEffect(() => { fetchTenant(); }, []);

  useEffect(() => {
    if (tenant) {
      setWsName(tenant.name);
      setCurrency(tenant.settings?.currency ?? "USD");
      setTimezone(tenant.settings?.timezone ?? "UTC");
      setFiscal(tenant.settings?.fiscalMonth ?? 1);
    }
  }, [tenant]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveMsg("");
    try {
      await updateTenant({ name: wsName, settings: { timezone, currency, fiscalMonth: fiscal } });
      setSaveMsg("✓ Workspace settings saved");
    } catch {
      setSaveMsg("✗ Failed to save settings");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 3500);
    }
  };

  const handleDeleteWorkspace = async () => {
    const confirm1 = confirm("This will permanently delete your workspace and all data. Are you sure?");
    if (!confirm1) return;
    const confirm2 = prompt(`Type your workspace name "${wsName}" to confirm:`);
    if (confirm2 !== wsName) { alert("Name did not match. Deletion cancelled."); return; }
    try {
      await fetch(`${API}/api/v1/tenants/me`, { method: "DELETE", headers: getAuthHeaders() });
      logout(); navigate("/login");
    } catch { alert("Deletion failed. Please try again."); }
  };

  const planName  = tenant?.plan ?? "FREE";
  const planPrice = planName === "PRO" ? "$99/mo" : planName === "ENTERPRISE" ? "Custom" : "Free";
  const canManage = user?.role === "owner" || user?.role === "admin";

  return (
    <div className="st-root">
      {/* Context Bar */}
      <div className="st-context-bar">
        <span className="st-context-item live">⬡ Core Engine</span>
        <span className="st-context-sep">›</span>
        <span className="st-context-item live">Settings</span>
        <span className="st-context-sep">›</span>
        <span className="st-context-item planned">Phase 1</span>
      </div>

      {/* Header */}
      <div className="st-header">
        <div className="st-eyebrow">Workspace</div>
        <h1 className="st-title">Workspace <em>Settings</em></h1>
        <div className="st-subtitle">Configure your workspace, preferences, and integrations</div>
      </div>

      {/* Plan Banner */}
      <div className="st-plan-banner">
        <div className="st-plan-info">
          <div className="st-plan-dot" />
          <div>
            <div className="st-plan-name">{planName} Plan — {planPrice}</div>
            <div className="st-plan-sub">Active subscription · Winners Ecosystem Core</div>
          </div>
        </div>
        <button className="st-btn ghost" onClick={() => navigate("/billing")}>
          Manage Plan →
        </button>
      </div>

      {/* Workspace Config */}
      <div className="st-card gold">
        <div className="st-card-header">
          <div className="st-card-title">Workspace Configuration</div>
          <div className="st-card-desc">Name, currency, timezone, and fiscal year settings</div>
        </div>
        <div className="st-card-body">
          <form onSubmit={handleSave}>
            <div className="st-field">
              <label className="st-label">Workspace Name</label>
              <input
                className="st-input" value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                placeholder="My Workspace" disabled={!canManage}
              />
            </div>
            <div className="st-row">
              <div className="st-field">
                <label className="st-label">Timezone</label>
                <select className="st-select" value={timezone} onChange={(e) => setTimezone(e.target.value)} disabled={!canManage}>
                  {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                </select>
              </div>
              <div className="st-field">
                <label className="st-label">Currency</label>
                <select className="st-select" value={currency} onChange={(e) => setCurrency(e.target.value)} disabled={!canManage}>
                  {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div className="st-field">
              <label className="st-label">Fiscal Year Start</label>
              <select className="st-select" value={fiscal} onChange={(e) => setFiscal(Number(e.target.value))} disabled={!canManage}>
                {FISCAL_MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            {saveMsg && <div className={saveMsg.startsWith("✓") ? "st-success" : "st-error"}>{saveMsg}</div>}
            {canManage && (
              <div className="st-btn-row">
                <button type="submit" className="st-btn" disabled={saving}>
                  {saving ? "Saving…" : "Save Settings"}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Integrations */}
      <div className="st-card blue">
        <div className="st-card-header">
          <div className="st-card-title">Integrations</div>
          <div className="st-card-desc">Connected services and third-party tools</div>
        </div>
        <div className="st-card-body">
          {[
            { name: "Stripe", desc: "Revenue syncing and subscription management", path: "/stripe", status: "Connected" },
            { name: "Slack",  desc: "Team notifications and alert channels",        path: "/slack",  status: "Configure" },
            { name: "Email Reports", desc: "Automated weekly and monthly reports",  path: "/email",  status: "Configure" },
          ].map((int) => (
            <div key={int.name} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>{int.name}</div>
                <div style={{ fontFamily: "Space Mono, monospace", fontSize: 10, color: "var(--text-dim)", marginTop: 2 }}>{int.desc}</div>
              </div>
              <button className="st-btn blue" onClick={() => navigate(int.path)} style={{ fontSize: 11, padding: "6px 14px" }}>
                {int.status} →
              </button>
            </div>
          ))}
          <div style={{ paddingTop: 14 }} />
        </div>
      </div>

      {/* Danger Zone */}
      {canManage && (
        <div className="st-card red">
          <div className="st-card-header">
            <div className="st-card-title">Danger Zone</div>
            <div className="st-card-desc">Irreversible actions — proceed with extreme caution</div>
          </div>
          <div className="st-card-body">
            <div className="st-danger-item">
              <div>
                <div className="st-danger-title">Delete Workspace</div>
                <div className="st-danger-desc">
                  Permanently deletes this workspace, all members, analytics data, and billing records.
                  This action cannot be undone.
                </div>
              </div>
              <button className="st-btn danger" onClick={handleDeleteWorkspace}>
                Delete Workspace
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
