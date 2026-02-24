// src/features/slack/SlackSettingsPage.tsx

import { useEffect, useState } from "react";
import { useAuthStore } from "../auth/authStore";
import { API_BASE } from "../../lib/api";

const API = API_BASE;
const css = `
  .sl-root { padding: 28px 24px 80px; font-family: 'Syne', sans-serif; color: var(--text); max-width: 800px; }
  .sl-title { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 6px; }
  .sl-title span { color: var(--gold); }
  .sl-subtitle { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); margin-bottom: 32px; }

  .sl-section { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; margin-bottom: 16px; overflow: hidden; }
  .sl-section-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .sl-section-title { font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 10px; }
  .sl-section-body { padding: 20px; }

  .sl-status { font-family: 'Space Mono', monospace; font-size: 10px; padding: 3px 9px; border-radius: 2px; }
  .sl-status.connected    { background: rgba(45,212,160,0.1); color: #2DD4A0; border: 1px solid rgba(45,212,160,0.2); }
  .sl-status.disconnected { background: rgba(90,104,120,0.1); color: var(--text-dim); border: 1px solid var(--border); }

  .sl-label { display: block; font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 8px; }
  .sl-input { width: 100%; background: var(--surface2, #141B24); border: 1px solid var(--border); border-radius: 3px; padding: 11px 14px; font-family: 'Space Mono', monospace; font-size: 12px; color: var(--text); outline: none; transition: border-color 0.15s; box-sizing: border-box; margin-bottom: 12px; }
  .sl-input:focus { border-color: var(--gold); }
  .sl-input::placeholder { color: var(--text-dim); }

  .sl-desc { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); margin-bottom: 14px; line-height: 1.5; }

  .sl-btn { background: var(--gold); color: #080B10; border: none; border-radius: 3px; padding: 9px 18px; font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; cursor: pointer; transition: opacity 0.15s; }
  .sl-btn:hover { opacity: 0.88; }
  .sl-btn.ghost { background: transparent; border: 1px solid var(--border); color: var(--text-dim); }
  .sl-btn.ghost:hover { border-color: var(--gold); color: var(--gold); }
  .sl-btn.danger { background: transparent; border: 1px solid rgba(255,89,117,0.3); color: #FF5975; }
  .sl-btn.danger:hover { background: rgba(255,89,117,0.08); }
  .sl-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .sl-btn-row { display: flex; gap: 8px; flex-wrap: wrap; }

  .sl-alert { font-family: 'Space Mono', monospace; font-size: 11px; padding: 10px 14px; border-radius: 3px; margin-bottom: 12px; }
  .sl-alert.success { background: rgba(45,212,160,0.08); border: 1px solid rgba(45,212,160,0.2); color: #2DD4A0; }
  .sl-alert.error   { background: rgba(255,89,117,0.08); border: 1px solid rgba(255,89,117,0.2); color: #FF5975; }

  .sl-how { background: rgba(245,200,66,0.04); border: 1px solid rgba(245,200,66,0.12); border-radius: 4px; padding: 16px 20px; margin-bottom: 24px; }
  .sl-how-title { font-size: 12px; font-weight: 700; color: var(--gold); margin-bottom: 8px; }
  .sl-how-steps { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); line-height: 2; }
  .sl-how-steps a { color: var(--gold); }

  @media (max-width: 600px) {
    .sl-root { padding: 16px 14px 80px; }
    .sl-btn-row { flex-direction: column; }
  }
`;

const CHANNELS = [
  { key: "revenue", icon: "💰", label: "Revenue",        desc: "Triggered when a new payment is received via Stripe.",           envVar: "SLACK_WEBHOOK_REVENUE" },
  { key: "team",    icon: "👥", label: "Team",           desc: "Triggered when a new team member joins your workspace.",         envVar: "SLACK_WEBHOOK_TEAM"    },
  { key: "billing", icon: "⚡", label: "Billing",        desc: "Triggered when your workspace plan is upgraded.",                envVar: "SLACK_WEBHOOK_BILLING" },
  { key: "reports", icon: "📊", label: "Reports",        desc: "Receives daily revenue summaries and weekly performance reports.", envVar: "SLACK_WEBHOOK_REPORTS" },
];

export default function SlackSettingsPage() {
  const token = useAuthStore((s) => s.token);
  const [status, setStatus]   = useState<Record<string, boolean>>({});
  const [testing, setTesting] = useState<string | null>(null);
  const [alert, setAlert]     = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [sending, setSending] = useState<string | null>(null);

  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => {
    const id = "sl-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id; tag.textContent = css;
      document.head.appendChild(tag);
    }
    fetch(`${API}/slack/status`, { headers }).then((r) => r.json()).then(setStatus).catch(() => {});
  }, []);

  const showAlert = (msg: string, type: "success" | "error") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const testChannel = async (channel: string) => {
    setTesting(channel);
    try {
      const res  = await fetch(`${API}/slack/test`, { method: "POST", headers, body: JSON.stringify({ channel }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showAlert(`Test message sent to ${channel} channel!`, "success");
    } catch (err: any) {
      showAlert(err.message ?? "Failed to send test", "error");
    } finally {
      setTesting(null);
    }
  };

  const sendDaily = async () => {
    setSending("daily");
    try {
      const res  = await fetch(`${API}/slack/daily`, { method: "POST", headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showAlert("Daily summary sent to Slack!", "success");
    } catch (err: any) {
      showAlert(err.message ?? "Failed to send", "error");
    } finally {
      setSending(null);
    }
  };

  const sendWeekly = async () => {
    setSending("weekly");
    try {
      const res  = await fetch(`${API}/slack/weekly`, { method: "POST", headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showAlert("Weekly report sent to Slack!", "success");
    } catch (err: any) {
      showAlert(err.message ?? "Failed to send", "error");
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="sl-root">
      <h1 className="sl-title">Slack <span>Notifications</span></h1>
      <p className="sl-subtitle">Send real-time alerts and reports to your Slack channels</p>

      {alert && <div className={`sl-alert ${alert.type}`}>{alert.type === "success" ? "✓" : "✗"} {alert.msg}</div>}

      {/* How to set up */}
      <div className="sl-how">
        <div className="sl-how-title">🔧 How to set up</div>
        <div className="sl-how-steps">
          1. Go to <a href="https://api.slack.com/apps" target="_blank" rel="noreferrer">api.slack.com/apps</a> → Create New App → From scratch<br />
          2. Enable <strong>Incoming Webhooks</strong> → Add New Webhook to Workspace<br />
          3. Choose the channel for each notification type<br />
          4. Copy the webhook URL and add it to Railway Variables (see env var names below)<br />
          5. Redeploy and test each channel
        </div>
      </div>

      {/* Channel sections */}
      {CHANNELS.map((ch) => (
        <div className="sl-section" key={ch.key}>
          <div className="sl-section-header">
            <div className="sl-section-title">
              {ch.icon} {ch.label}
              <span className={`sl-status ${status[ch.key] ? "connected" : "disconnected"}`}>
                {status[ch.key] ? "Connected" : "Not configured"}
              </span>
            </div>
            {status[ch.key] && (
              <button className="sl-btn ghost" onClick={() => testChannel(ch.key)} disabled={testing === ch.key}>
                {testing === ch.key ? "Sending…" : "Send Test"}
              </button>
            )}
          </div>
          <div className="sl-section-body">
            <div className="sl-desc">{ch.desc}</div>
            <label className="sl-label">Railway Environment Variable</label>
            <input className="sl-input" value={ch.envVar} readOnly onClick={(e) => (e.target as HTMLInputElement).select()} />
            <div className="sl-desc" style={{ marginBottom: 0 }}>
              Add this variable to Railway with your Slack webhook URL as the value.
            </div>
          </div>
        </div>
      ))}

      {/* Manual triggers */}
      <div className="sl-section">
        <div className="sl-section-header">
          <div className="sl-section-title">📤 Manual Send</div>
        </div>
        <div className="sl-section-body">
          <div className="sl-desc">Manually trigger reports to your Slack channels at any time.</div>
          <div className="sl-btn-row">
            <button className="sl-btn" onClick={sendDaily} disabled={!!sending}>
              {sending === "daily" ? "Sending…" : "Send Daily Summary"}
            </button>
            <button className="sl-btn ghost" onClick={sendWeekly} disabled={!!sending}>
              {sending === "weekly" ? "Sending…" : "Send Weekly Report"}
            </button>
            <button className="sl-btn ghost" onClick={() => testChannel("all")} disabled={!!testing}>
              {testing === "all" ? "Sending…" : "Test All Channels"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}