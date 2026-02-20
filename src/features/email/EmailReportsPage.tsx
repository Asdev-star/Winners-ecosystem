// src/features/email/EmailReportsPage.tsx

import { useState, useEffect } from "react";
import { getAuthHeaders } from "../auth/authStore";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .er-root {
    --gold: #F5C842; --bg: #080B10; --surface: #0D1117; --surface2: #141B24;
    --border: #1E2A38; --text: #E8EDF2; --text-dim: #5A6878;
    --green: #2DD4A0; --red: #FF5975; --blue: #4A9EFF; --purple: #9B6FFF;
    background: var(--bg); color: var(--text);
    font-family: 'Syne', sans-serif; min-height: 100vh; padding: 32px 24px 80px;
  }

  .er-inner { max-width: 780px; margin: 0 auto; }

  .er-header { margin-bottom: 32px; }
  .er-title { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
  .er-title span { color: var(--gold); }
  .er-subtitle { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); margin-top: 4px; }

  .er-section-label {
    font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 2px;
    text-transform: uppercase; color: var(--gold); margin-bottom: 14px;
    display: flex; align-items: center; gap: 10px;
  }
  .er-section-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  /* Status banner */
  .er-status {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 4px; padding: 14px 18px; margin-bottom: 24px;
    display: flex; align-items: center; gap: 12px;
    font-family: 'Space Mono', monospace; font-size: 11px;
  }
  .er-status.ok  { border-color: rgba(45,212,160,0.25); }
  .er-status.err { border-color: rgba(255,89,117,0.25); }
  .er-status-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .er-status.ok  .er-status-dot { background: var(--green); box-shadow: 0 0 6px var(--green); }
  .er-status.err .er-status-dot { background: var(--red);   box-shadow: 0 0 6px var(--red); }
  .er-status-text { color: var(--text-dim); flex: 1; }
  .er-status.ok  .er-status-text strong { color: var(--green); }
  .er-status.err .er-status-text strong { color: var(--red); }

  /* Report cards */
  .er-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 28px; }

  .er-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 6px; overflow: hidden; position: relative;
    transition: border-color 0.15s;
  }
  .er-card:hover { border-color: rgba(245,200,66,0.2); }
  .er-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
  .er-card.weekly::before   { background: var(--gold); }
  .er-card.monthly::before  { background: var(--blue); }
  .er-card.anomaly::before  { background: var(--red); }
  .er-card.team::before     { background: var(--green); }
  .er-card.invoice::before  { background: var(--purple); }

  .er-card-body { padding: 18px 20px; }
  .er-card-icon { font-size: 24px; margin-bottom: 10px; }
  .er-card-name { font-size: 14px; font-weight: 700; margin-bottom: 4px; }
  .er-card.weekly  .er-card-name { color: var(--gold); }
  .er-card.monthly .er-card-name { color: var(--blue); }
  .er-card.anomaly .er-card-name { color: var(--red); }
  .er-card.team    .er-card-name { color: var(--green); }
  .er-card.invoice .er-card-name { color: var(--purple); }

  .er-card-desc     { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); line-height: 1.5; margin-bottom: 14px; }
  .er-card-schedule { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); margin-bottom: 14px; padding: 5px 8px; background: var(--surface2); border-radius: 3px; display: inline-block; }

  .er-card-footer { padding: 12px 20px; border-top: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .er-last-sent   { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); }

  .er-send-btn {
    background: var(--gold); color: #080B10; border: none; border-radius: 3px;
    padding: 7px 16px; font-family: 'Space Mono', monospace; font-size: 10px;
    font-weight: 700; cursor: pointer; transition: opacity 0.15s; letter-spacing: 0.5px;
  }
  .er-send-btn:hover:not(:disabled) { opacity: 0.88; }
  .er-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .er-send-btn.monthly  { background: var(--blue);   color: white; }
  .er-send-btn.anomaly  { background: var(--red);    color: white; }
  .er-send-btn.team     { background: var(--green);  color: #080B10; }
  .er-send-btn.invoice  { background: var(--purple); color: white; }

  /* Schedule info */
  .er-schedule-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 4px; overflow: hidden; margin-bottom: 28px;
  }
  .er-schedule-header { padding: 14px 20px; border-bottom: 1px solid var(--border); font-size: 13px; font-weight: 700; }
  .er-schedule-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 20px; border-bottom: 1px solid var(--border);
  }
  .er-schedule-row:last-child { border-bottom: none; }
  .er-schedule-name { font-size: 13px; font-weight: 600; }
  .er-schedule-time { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); margin-top: 2px; }
  .er-schedule-badge {
    font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 1px;
    text-transform: uppercase; padding: 3px 8px; border-radius: 2px;
    background: rgba(45,212,160,0.1); color: var(--green);
    border: 1px solid rgba(45,212,160,0.2);
  }

  /* History */
  .er-history { display: flex; flex-direction: column; gap: 8px; }
  .er-history-item {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 4px; padding: 12px 16px;
    display: flex; align-items: center; gap: 12px;
  }
  .er-history-icon { font-size: 16px; flex-shrink: 0; }
  .er-history-name { font-size: 13px; font-weight: 600; }
  .er-history-meta { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); margin-top: 2px; }
  .er-history-status { font-family: 'Space Mono', monospace; font-size: 9px; padding: 3px 8px; border-radius: 2px; margin-left: auto; }
  .er-history-status.sent { background: rgba(45,212,160,0.1); color: var(--green); border: 1px solid rgba(45,212,160,0.2); }
  .er-history-status.fail { background: rgba(255,89,117,0.1); color: var(--red);   border: 1px solid rgba(255,89,117,0.2); }

  /* Toast */
  .er-toast {
    position: fixed; bottom: 24px; right: 24px;
    background: var(--surface); border: 1px solid var(--border); border-radius: 4px;
    padding: 12px 18px; font-family: 'Space Mono', monospace; font-size: 11px;
    display: flex; align-items: center; gap: 10px;
    animation: er-slide 0.3s ease forwards; z-index: 999;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  }
  .er-toast.success { border-color: rgba(45,212,160,0.3);  color: var(--green); }
  .er-toast.error   { border-color: rgba(255,89,117,0.3); color: var(--red); }

  @keyframes er-slide { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @media (max-width: 640px) { .er-grid { grid-template-columns: 1fr; } }
`;

interface HistoryItem { id: number; name: string; icon: string; time: string; status: "sent" | "fail"; recipients: number; }

const REPORTS = [
  { key: "weekly",  cls: "weekly",  icon: "📊", name: "Weekly Revenue Summary", desc: "Revenue, activity, and daily breakdown for the past 7 days. Sent to all admins.", schedule: "Every Monday · 8:00 AM UTC",   endpoint: "/email/send/weekly"  },
  { key: "monthly", cls: "monthly", icon: "📈", name: "Monthly Full Report",     desc: "Complete analytics, team overview, and growth metrics for the past 30 days.",  schedule: "1st of month · 8:00 AM UTC", endpoint: "/email/send/monthly" },
  { key: "anomaly", cls: "anomaly", icon: "⚠️", name: "Anomaly Alert",           desc: "Sent immediately when revenue spikes or drops are detected in your data.",      schedule: "Daily check · 9:00 AM UTC",  endpoint: "/email/send/anomaly" },
  { key: "team",    cls: "team",    icon: "👥", name: "Team Activity Digest",    desc: "New members, role changes, and team activity summary for the past week.",       schedule: "On demand",                  endpoint: "/email/send/team"    },
  { key: "invoice", cls: "invoice", icon: "🧾", name: "Billing Invoice",         desc: "Invoice receipt sent to workspace owner after successful payment.",              schedule: "On payment",                 endpoint: "/email/send/invoice" },
];

export default function EmailReportsPage() {
  const [status,   setStatus]   = useState<{ configured: boolean; from: string } | null>(null);
  const [sending,  setSending]  = useState<string | null>(null);
  const [history,  setHistory]  = useState<HistoryItem[]>([]);
  const [toast,    setToast]    = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const id = "er-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id; tag.textContent = css;
      document.head.appendChild(tag);
    }
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/email/status`, { headers: getAuthHeaders() })
      .then((r) => r.ok ? r.json() : null)
      .then((d) => setStatus(d))
      .catch(() => setStatus({ configured: false, from: "unknown" }));
  }, []);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSend = async (report: typeof REPORTS[0]) => {
    setSending(report.key);
    try {
      const res  = await fetch(`${API_BASE}${report.endpoint}`, { method: "POST", headers: getAuthHeaders() });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message ?? "Failed");

      setHistory((h) => [{
        id:         Date.now(),
        name:       report.name,
        icon:       report.icon,
        time:       new Date().toLocaleTimeString(),
        status:     "sent",
        recipients: data.recipients ?? 0,
      }, ...h.slice(0, 9)]);

      showToast(data.message ?? "Email sent!", "success");
    } catch (err: any) {
      setHistory((h) => [{
        id:         Date.now(),
        name:       report.name,
        icon:       report.icon,
        time:       new Date().toLocaleTimeString(),
        status:     "fail",
        recipients: 0,
      }, ...h.slice(0, 9)]);
      showToast(err.message ?? "Failed to send email", "error");
    } finally {
      setSending(null);
    }
  };

  return (
    <div className="er-root">
      <div className="er-inner">

        <div className="er-header">
          <h1 className="er-title">Email <span>Reports</span></h1>
          <p className="er-subtitle">Automated reports and manual triggers</p>
        </div>

        {/* Status */}
        {status && (
          <div className={`er-status ${status.configured ? "ok" : "err"}`}>
            <div className="er-status-dot" />
            <div className="er-status-text">
              {status.configured
                ? <><strong>Resend connected</strong> · Sending from {status.from}</>
                : <><strong>Not configured</strong> · Add RESEND_API_KEY to .env to enable email sending</>
              }
            </div>
          </div>
        )}

        {/* Report cards */}
        <div className="er-section-label">Email Reports</div>
        <div className="er-grid">
          {REPORTS.map((r) => (
            <div key={r.key} className={`er-card ${r.cls}`}>
              <div className="er-card-body">
                <div className="er-card-icon">{r.icon}</div>
                <div className="er-card-name">{r.name}</div>
                <div className="er-card-desc">{r.desc}</div>
                <div className="er-card-schedule">⏰ {r.schedule}</div>
              </div>
              <div className="er-card-footer">
                <div className="er-last-sent">
                  {history.find((h) => h.name === r.name)
                    ? `Last sent ${history.find((h) => h.name === r.name)!.time}`
                    : "Not sent yet"}
                </div>
                <button
                  className={`er-send-btn ${r.cls}`}
                  disabled={!!sending}
                  onClick={() => handleSend(r)}
                >
                  {sending === r.key ? "Sending…" : "Send Now"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Cron Schedule */}
        <div className="er-section-label">Automated Schedule</div>
        <div className="er-schedule-card">
          <div className="er-schedule-header">Active Cron Jobs</div>
          {[
            { name: "Weekly Revenue Summary", time: "Every Monday at 8:00 AM UTC",  badge: "Active" },
            { name: "Monthly Full Report",    time: "1st of every month at 8:00 AM UTC", badge: "Active" },
            { name: "Daily Anomaly Check",    time: "Every day at 9:00 AM UTC",     badge: "Active" },
          ].map((s) => (
            <div className="er-schedule-row" key={s.name}>
              <div>
                <div className="er-schedule-name">{s.name}</div>
                <div className="er-schedule-time">{s.time}</div>
              </div>
              <span className="er-schedule-badge">{s.badge}</span>
            </div>
          ))}
        </div>

        {/* Send History */}
        {history.length > 0 && (
          <>
            <div className="er-section-label">Send History</div>
            <div className="er-history">
              {history.map((h) => (
                <div className="er-history-item" key={h.id}>
                  <div className="er-history-icon">{h.icon}</div>
                  <div>
                    <div className="er-history-name">{h.name}</div>
                    <div className="er-history-meta">{h.time}{h.recipients > 0 ? ` · ${h.recipients} recipient${h.recipients > 1 ? "s" : ""}` : ""}</div>
                  </div>
                  <span className={`er-history-status ${h.status}`}>{h.status}</span>
                </div>
              ))}
            </div>
          </>
        )}

      </div>

      {toast && (
        <div className={`er-toast ${toast.type}`}>
          {toast.type === "success" ? "✓" : "✗"} {toast.msg}
        </div>
      )}
    </div>
  );
}