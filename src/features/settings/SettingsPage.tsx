// src/features/settings/SettingsPage.tsx

import { useState, useEffect } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore, getAuthHeaders } from "../auth/authStore";
import { useInviteStore } from "../team/inviteStore";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .sp-root {
    --gold: #F5C842; --bg: #080B10; --surface: #0D1117; --surface2: #141B24;
    --border: #1E2A38; --text: #E8EDF2; --text-dim: #5A6878;
    --green: #2DD4A0; --red: #FF5975; --blue: #4A9EFF; --purple: #9B6FFF;
    background: var(--bg); color: var(--text);
    font-family: 'Syne', sans-serif; min-height: 100vh; padding: 32px 24px 80px;
  }

  .sp-inner { max-width: 680px; margin: 0 auto; }

  .sp-header { margin-bottom: 32px; }
  .sp-title { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
  .sp-title span { color: var(--gold); }
  .sp-subtitle { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); margin-top: 4px; }

  .sp-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 6px; overflow: hidden; margin-bottom: 16px; position: relative;
  }
  .sp-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
  .sp-card.gold::before   { background: var(--gold); }
  .sp-card.blue::before   { background: var(--blue); }
  .sp-card.purple::before { background: var(--purple); }
  .sp-card.red::before    { background: var(--red); }

  .sp-card-header { padding: 18px 24px 14px; border-bottom: 1px solid var(--border); }
  .sp-card-title  { font-size: 14px; font-weight: 700; }
  .sp-card-desc   { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); margin-top: 3px; }
  .sp-card-body   { padding: 20px 24px; }

  .sp-field { margin-bottom: 16px; }
  .sp-field:last-child { margin-bottom: 0; }
  .sp-label {
    display: block; font-family: 'Space Mono', monospace; font-size: 10px;
    letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 8px;
  }
  .sp-input {
    width: 100%; background: var(--surface2); border: 1px solid var(--border);
    border-radius: 3px; padding: 11px 14px; font-family: 'Space Mono', monospace;
    font-size: 12px; color: var(--text); outline: none; transition: border-color 0.15s;
    box-sizing: border-box;
  }
  .sp-input:focus { border-color: var(--gold); }
  .sp-input::placeholder { color: var(--text-dim); }

  .sp-select {
    width: 100%; background: var(--surface2); border: 1px solid var(--border);
    border-radius: 3px; padding: 11px 14px; font-family: 'Space Mono', monospace;
    font-size: 12px; color: var(--text); outline: none; cursor: pointer;
    box-sizing: border-box; transition: border-color 0.15s;
  }
  .sp-select:focus { border-color: var(--gold); }

  .sp-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  .sp-btn {
    background: var(--gold); color: #080B10; border: none; border-radius: 3px;
    padding: 10px 22px; font-family: 'Syne', sans-serif; font-size: 13px;
    font-weight: 700; cursor: pointer; transition: opacity 0.15s;
  }
  .sp-btn:hover:not(:disabled) { opacity: 0.88; }
  .sp-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .sp-btn.danger { background: transparent; border: 1px solid rgba(255,89,117,0.3); color: var(--red); }
  .sp-btn.danger:hover { background: rgba(255,89,117,0.08); }
  .sp-btn.link { background: transparent; border: 1px solid rgba(74,158,255,0.3); color: var(--blue); }
  .sp-btn.link:hover { background: rgba(74,158,255,0.08); }

  .sp-btn-row { display: flex; justify-content: flex-end; margin-top: 20px; }

  .sp-success { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--green); margin-top: 10px; }
  .sp-error   { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--red);   margin-top: 10px; }

  /* Plan card */
  .sp-plan-row {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 12px;
  }
  .sp-plan-badge {
    font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 1px;
    text-transform: uppercase; padding: 4px 12px; border-radius: 2px;
    background: rgba(245,200,66,0.1); color: var(--gold); border: 1px solid rgba(245,200,66,0.2);
  }
  .sp-plan-name  { font-size: 18px; font-weight: 800; margin-bottom: 4px; }
  .sp-plan-price { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); }

  .sp-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .sp-info-item { background: var(--surface2); border: 1px solid var(--border); border-radius: 3px; padding: 12px 14px; }
  .sp-info-label { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 1px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 4px; }
  .sp-info-value { font-size: 14px; font-weight: 700; }

  /* Danger */
  .sp-danger-row { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
  .sp-danger-title { font-size: 13px; font-weight: 700; color: var(--red); margin-bottom: 4px; }
  .sp-danger-desc  { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }

  @media (max-width: 480px) { .sp-row { grid-template-columns: 1fr; } .sp-info-grid { grid-template-columns: 1fr; } }
`;

const TIMEZONES = ["UTC", "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Tokyo", "Asia/Singapore", "Australia/Sydney"];
const CURRENCIES = [
  { value: "USD", label: "USD — US Dollar" },
  { value: "EUR", label: "EUR — Euro" },
  { value: "GBP", label: "GBP — British Pound" },
  { value: "KES", label: "KES — Kenyan Shilling" },
  { value: "NGN", label: "NGN — Nigerian Naira" },
  { value: "ZAR", label: "ZAR — South African Rand" },
  { value: "JPY", label: "JPY — Japanese Yen" },
];
const FISCAL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function SettingsPage() {
  const user     = useAuthStore((s) => s.user);
  const logout   = useAuthStore((s) => s.logout);
  const navigate = useNavigate();
  const { tenant, fetchTenant, updateTenant } = useInviteStore();

  const [wsName,    setWsName]    = useState("");
  const [currency,  setCurrency]  = useState("USD");
  const [timezone,  setTimezone]  = useState("UTC");
  const [fiscal,    setFiscal]    = useState(1);
  const [saving,    setSaving]    = useState(false);
  const [saveMsg,   setSaveMsg]   = useState("");

  useEffect(() => {
    const id = "sp-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id; tag.textContent = css;
      document.head.appendChild(tag);
    }
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  useEffect(() => {
    fetchTenant();
  }, []);

  useEffect(() => {
    if (tenant) {
      setWsName(tenant.name);
      setCurrency(tenant.settings.currency);
      setTimezone(tenant.settings.timezone);
      setFiscal(tenant.settings.fiscalMonth);
    }
  }, [tenant]);

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveMsg("");
    try {
      await updateTenant({ name: wsName, settings: { timezone, currency, fiscalMonth: fiscal } });
      setSaveMsg("✓ Settings saved successfully");
    } catch {
      setSaveMsg("✗ Failed to save settings");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  };

  const handleDeleteWorkspace = async () => {
    const confirm1 = confirm("This will permanently delete your workspace and all data. Are you sure?");
    if (!confirm1) return;
    const confirm2 = prompt(`Type your workspace name "${wsName}" to confirm:`);
    if (confirm2 !== wsName) { alert("Name did not match. Deletion cancelled."); return; }

    try {
      await fetch(`${API_BASE}/tenants/me`, { method: "DELETE", headers: getAuthHeaders() });
      logout();
      navigate("/login");
    } catch {
      alert("Deletion failed. Please try again.");
    }
  };

  const planName  = tenant?.plan ?? user?.role ?? "FREE";
  const planPrice = planName === "PRO" ? "$99/mo" : planName === "ENTERPRISE" ? "$299/mo" : "Free";

  return (
    <div className="sp-root">
      <div className="sp-inner">

        <div className="sp-header">
          <h1 className="sp-title">Workspace <span>Settings</span></h1>
          <p className="sp-subtitle">Manage your workspace configuration</p>
        </div>

        {/* Workspace Name & Currency */}
        <div className="sp-card gold">
          <div className="sp-card-header">
            <div className="sp-card-title">General Settings</div>
            <div className="sp-card-desc">Workspace name and currency preferences</div>
          </div>
          <div className="sp-card-body">
            <form onSubmit={handleSave}>
              <div className="sp-field">
                <label className="sp-label">Workspace Name</label>
                <input className="sp-input" type="text" value={wsName} onChange={(e) => setWsName(e.target.value)} placeholder="Your workspace name" />
              </div>
              <div className="sp-field">
                <label className="sp-label">Currency</label>
                <select className="sp-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>

              {/* Timezone & Fiscal Month */}
              <div className="sp-row">
                <div className="sp-field">
                  <label className="sp-label">Timezone</label>
                  <select className="sp-select" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                    {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                </div>
                <div className="sp-field">
                  <label className="sp-label">Fiscal Year Start</label>
                  <select className="sp-select" value={fiscal} onChange={(e) => setFiscal(Number(e.target.value))}>
                    {FISCAL_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                </div>
              </div>

              {saveMsg && <div className={saveMsg.startsWith("✓") ? "sp-success" : "sp-error"}>{saveMsg}</div>}
              <div className="sp-btn-row">
                <button type="submit" className="sp-btn" disabled={saving}>{saving ? "Saving…" : "Save Settings"}</button>
              </div>
            </form>
          </div>
        </div>

        {/* Plan & Billing */}
        <div className="sp-card blue">
          <div className="sp-card-header">
            <div className="sp-card-title">Plan & Billing</div>
            <div className="sp-card-desc">Your current subscription and usage</div>
          </div>
          <div className="sp-card-body">
            <div className="sp-plan-row" style={{ marginBottom: 16 }}>
              <div>
                <div className="sp-plan-name">{planName} Plan</div>
                <div className="sp-plan-price">{planPrice} · Renews monthly</div>
              </div>
              <span className="sp-plan-badge">{planName}</span>
            </div>
            <div className="sp-info-grid" style={{ marginBottom: 16 }}>
              <div className="sp-info-item">
                <div className="sp-info-label">Members</div>
                <div className="sp-info-value">{tenant?.memberCount ?? "—"}</div>
              </div>
              <div className="sp-info-item">
                <div className="sp-info-label">Workspace ID</div>
                <div className="sp-info-value" style={{ fontSize: 11, fontFamily: "Space Mono, monospace" }}>{tenant?.id ?? "—"}</div>
              </div>
            </div>
            <button className="sp-btn link" onClick={() => navigate("/billing")}>
              Manage Billing →
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        {user?.role === "owner" && (
          <div className="sp-card red">
            <div className="sp-card-header">
              <div className="sp-card-title" style={{ color: "var(--red)" }}>Danger Zone</div>
              <div className="sp-card-desc">Irreversible actions — proceed with extreme caution</div>
            </div>
            <div className="sp-card-body">
              <div className="sp-danger-row">
                <div>
                  <div className="sp-danger-title">Delete Workspace</div>
                  <div className="sp-danger-desc">Permanently delete this workspace, all members, data, and billing. This cannot be undone.</div>
                </div>
                <button className="sp-btn danger" onClick={handleDeleteWorkspace}>Delete Workspace</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}