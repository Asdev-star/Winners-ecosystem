// src/features/security/TwoFactorPage.tsx

import { useState, useEffect } from "react";
import { useAuthStore } from "../auth/authStore";

const API = import.meta.env.VITE_API_URL ?? "";

const css = `
  .tf-root { padding: 28px 24px 80px; font-family: 'Syne', sans-serif; color: var(--text); max-width: 640px; }
  .tf-title { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 4px; }
  .tf-title span { color: var(--gold); }
  .tf-subtitle { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); margin-bottom: 32px; }

  .tf-status-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 24px; margin-bottom: 24px; position: relative; overflow: hidden; }
  .tf-status-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
  .tf-status-card.enabled::before  { background: linear-gradient(90deg, #2DD4A0, transparent); }
  .tf-status-card.disabled::before { background: linear-gradient(90deg, var(--border), transparent); }
  .tf-status-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
  .tf-status-icon { font-size: 32px; }
  .tf-status-text { flex: 1; }
  .tf-status-title { font-size: 15px; font-weight: 700; margin-bottom: 4px; }
  .tf-status-desc { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }
  .tf-status-badge { font-family: 'Space Mono', monospace; font-size: 10px; padding: 4px 10px; border-radius: 3px; }
  .tf-status-badge.on  { background: rgba(45,212,160,0.12); color: #2DD4A0; border: 1px solid rgba(45,212,160,0.2); }
  .tf-status-badge.off { background: var(--surface2); color: var(--text-dim); border: 1px solid var(--border); }

  .tf-methods { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 24px; }
  .tf-method-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 20px; cursor: pointer; transition: all 0.15s; position: relative; }
  .tf-method-card:hover { border-color: rgba(245,200,66,0.4); }
  .tf-method-card.selected { border-color: var(--gold); background: rgba(245,200,66,0.04); }
  .tf-method-icon { font-size: 28px; margin-bottom: 10px; }
  .tf-method-title { font-size: 13px; font-weight: 700; margin-bottom: 4px; }
  .tf-method-desc { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); line-height: 1.5; }
  .tf-method-check { position: absolute; top: 12px; right: 12px; width: 18px; height: 18px; border-radius: 50%; border: 2px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 10px; }
  .tf-method-card.selected .tf-method-check { background: var(--gold); border-color: var(--gold); color: #080B10; }

  .tf-section { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 24px; margin-bottom: 16px; }
  .tf-section-title { font-size: 13px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
  .tf-qr { display: flex; justify-content: center; margin-bottom: 16px; }
  .tf-qr img { width: 180px; height: 180px; border-radius: 8px; border: 3px solid var(--gold); }
  .tf-secret { font-family: 'Space Mono', monospace; font-size: 11px; background: var(--surface2); border: 1px solid var(--border); border-radius: 4px; padding: 10px 14px; text-align: center; letter-spacing: 2px; color: var(--gold); margin-bottom: 16px; word-break: break-all; }
  .tf-input-row { display: flex; gap: 8px; }
  .tf-input { flex: 1; background: var(--surface2); border: 1px solid var(--border); border-radius: 3px; padding: 12px 14px; font-family: 'Space Mono', monospace; font-size: 18px; letter-spacing: 4px; color: var(--text); outline: none; text-align: center; }
  .tf-input:focus { border-color: var(--gold); }
  .tf-input::placeholder { font-size: 12px; letter-spacing: 1px; color: var(--text-dim); }
  .tf-btn { background: var(--gold); color: #080B10; border: none; border-radius: 3px; padding: 12px 24px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: opacity 0.15s; white-space: nowrap; }
  .tf-btn:hover { opacity: 0.88; }
  .tf-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .tf-btn.ghost { background: transparent; border: 1px solid var(--border); color: var(--text-dim); }
  .tf-btn.danger { background: rgba(255,89,117,0.1); border: 1px solid rgba(255,89,117,0.3); color: #FF5975; }
  .tf-btn.danger:hover { background: rgba(255,89,117,0.2); }

  .tf-backup { background: var(--surface2); border: 1px solid var(--border); border-radius: 4px; padding: 16px; margin-bottom: 12px; }
  .tf-backup-title { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 10px; }
  .tf-backup-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
  .tf-backup-code { font-family: 'Space Mono', monospace; font-size: 11px; background: var(--surface); border: 1px solid var(--border); border-radius: 3px; padding: 6px 8px; text-align: center; color: var(--gold); }

  .tf-success { background: rgba(45,212,160,0.08); border: 1px solid rgba(45,212,160,0.2); border-radius: 4px; padding: 12px 16px; font-family: 'Space Mono', monospace; font-size: 11px; color: #2DD4A0; margin-bottom: 12px; }
  .tf-error   { background: rgba(255,89,117,0.08); border: 1px solid rgba(255,89,117,0.2); border-radius: 4px; padding: 12px 16px; font-family: 'Space Mono', monospace; font-size: 11px; color: #FF5975; margin-bottom: 12px; }
  .tf-info    { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); line-height: 1.6; margin-bottom: 12px; }
  .tf-loading { padding: 40px; text-align: center; font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); }

  @media (max-width: 600px) {
    .tf-methods { grid-template-columns: 1fr; }
    .tf-backup-grid { grid-template-columns: repeat(2, 1fr); }
    .tf-root { padding: 16px 14px 80px; }
  }
`;

if (typeof document !== "undefined" && !document.getElementById("tf-styles")) {
  const tag = document.createElement("style");
  tag.id = "tf-styles"; tag.textContent = css;
  document.head.appendChild(tag);
}

type Step = "status" | "choose" | "totp-setup" | "email-setup" | "backup" | "done";

export default function TwoFactorPage() {
  const token = useAuthStore((s) => s.token);

  const [status, setStatus]       = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [step, setStep]           = useState<Step>("status");
  const [method, setMethod]       = useState<"totp" | "email">("totp");
  const [qrCode, setQrCode]       = useState("");
  const [secret, setSecret]       = useState("");
  const [code, setCode]           = useState("");
  const [backupCodes, setBackup]  = useState<string[]>([]);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [submitting, setSubmitting] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => { loadStatus(); }, []);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/2fa/status`, { headers });
      const data = await res.json();
      setStatus(data);
    } catch {}
    finally { setLoading(false); }
  };

  const setupTOTP = async () => {
    setSubmitting(true); setError("");
    try {
      const res  = await fetch(`${API}/2fa/totp/setup`, { method: "POST", headers });
      const data = await res.json();
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setStep("totp-setup");
    } catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const verifyTOTP = async () => {
    setSubmitting(true); setError("");
    try {
      const res  = await fetch(`${API}/2fa/totp/verify`, { method: "POST", headers, body: JSON.stringify({ code }) });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setBackup(data.backupCodes);
      setStep("backup");
      loadStatus();
    } catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const setupEmail = async () => {
    setSubmitting(true); setError("");
    try {
      const res  = await fetch(`${API}/2fa/email/setup`, { method: "POST", headers });
      const data = await res.json();
      if (!res.ok) { setError(data.message); return; }
      setBackup(data.backupCodes);
      setStep("backup");
      loadStatus();
    } catch (e: any) { setError(e.message); }
    finally { setSubmitting(false); }
  };

  const disable2FA = async () => {
    if (!confirm("Are you sure you want to disable 2FA? This will make your account less secure.")) return;
    try {
      await fetch(`${API}/2fa/disable`, { method: "POST", headers });
      setSuccess("2FA disabled successfully.");
      loadStatus();
      setStep("status");
    } catch (e: any) { setError(e.message); }
  };

  if (loading) return <div className="tf-root"><div className="tf-loading">Loading security settings…</div></div>;

  return (
    <div className="tf-root">
      <h1 className="tf-title">Two-Factor <span>Authentication</span></h1>
      <p className="tf-subtitle">Add an extra layer of security to your account</p>

      {error   && <div className="tf-error">⚠ {error}</div>}
      {success && <div className="tf-success">✓ {success}</div>}

      {/* Status card */}
      <div className={`tf-status-card ${status?.enabled ? "enabled" : "disabled"}`}>
        <div className="tf-status-row">
          <div className="tf-status-icon">{status?.enabled ? "🔐" : "🔓"}</div>
          <div className="tf-status-text">
            <div className="tf-status-title">{status?.enabled ? "2FA is Active" : "2FA is not enabled"}</div>
            <div className="tf-status-desc">
              {status?.enabled
                ? `Protected via ${status.method === "totp" ? "Authenticator App" : "Email OTP"} · ${status.backupCodesRemaining} backup codes remaining`
                : "Your account is protected by password only"}
            </div>
          </div>
          <div className={`tf-status-badge ${status?.enabled ? "on" : "off"}`}>
            {status?.enabled ? "● ACTIVE" : "○ INACTIVE"}
          </div>
        </div>
      </div>

      {/* Main actions */}
      {step === "status" && (
        <>
          {!status?.enabled ? (
            <div style={{ display: "flex", gap: 10 }}>
              <button className="tf-btn" onClick={() => setStep("choose")}>Enable 2FA</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 10 }}>
              <button className="tf-btn ghost" onClick={() => setStep("choose")}>Change Method</button>
              <button className="tf-btn danger" onClick={disable2FA}>Disable 2FA</button>
            </div>
          )}
        </>
      )}

      {/* Choose method */}
      {step === "choose" && (
        <>
          <div className="tf-methods">
            <div className={`tf-method-card${method === "totp" ? " selected" : ""}`} onClick={() => setMethod("totp")}>
              <div className="tf-method-check">{method === "totp" ? "✓" : ""}</div>
              <div className="tf-method-icon">📱</div>
              <div className="tf-method-title">Authenticator App</div>
              <div className="tf-method-desc">Use Google Authenticator, Authy, or any TOTP app. Most secure option.</div>
            </div>
            <div className={`tf-method-card${method === "email" ? " selected" : ""}`} onClick={() => setMethod("email")}>
              <div className="tf-method-check">{method === "email" ? "✓" : ""}</div>
              <div className="tf-method-icon">📧</div>
              <div className="tf-method-title">Email OTP</div>
              <div className="tf-method-desc">Receive a 6-digit code via email every time you log in.</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="tf-btn" onClick={method === "totp" ? setupTOTP : setupEmail} disabled={submitting}>
              {submitting ? "Setting up…" : `Enable ${method === "totp" ? "Authenticator App" : "Email OTP"}`}
            </button>
            <button className="tf-btn ghost" onClick={() => setStep("status")}>Cancel</button>
          </div>
        </>
      )}

      {/* TOTP Setup */}
      {step === "totp-setup" && (
        <div className="tf-section">
          <div className="tf-section-title">📱 Scan QR Code</div>
          <div className="tf-info">Open your authenticator app and scan this QR code. If you can't scan, enter the secret key manually.</div>
          {qrCode && <div className="tf-qr"><img src={qrCode} alt="QR Code" /></div>}
          <div className="tf-secret">{secret}</div>
          <div className="tf-info">Enter the 6-digit code from your app to confirm setup:</div>
          <div className="tf-input-row">
            <input className="tf-input" placeholder="000 000" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => e.key === "Enter" && verifyTOTP()} />
            <button className="tf-btn" onClick={verifyTOTP} disabled={code.length < 6 || submitting}>
              {submitting ? "Verifying…" : "Verify & Enable"}
            </button>
          </div>
        </div>
      )}

      {/* Backup codes */}
      {step === "backup" && (
        <div className="tf-section">
          <div className="tf-section-title">🔑 Save Your Backup Codes</div>
          <div className="tf-info">Save these backup codes in a safe place. Each code can only be used once. Use them if you lose access to your {method === "totp" ? "authenticator app" : "email"}.</div>
          <div className="tf-backup">
            <div className="tf-backup-title">Backup Codes</div>
            <div className="tf-backup-grid">
              {backupCodes.map((c) => <div key={c} className="tf-backup-code">{c}</div>)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="tf-btn" onClick={() => { navigator.clipboard.writeText(backupCodes.join("\n")); setSuccess("Backup codes copied!"); }}>Copy All Codes</button>
            <button className="tf-btn ghost" onClick={() => { setStep("status"); setSuccess("2FA enabled successfully!"); }}>Done</button>
          </div>
        </div>
      )}
    </div>
  );
}