// Phase 8 — Winners Cloud — CloudWebhooksPage.tsx
// NEXUS Supervisor · Webhook Subscriptions
// Subscribe to 15+ ecosystem events with HMAC-signed payloads

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../auth/authStore";
import AssistantPanel from "../../components/ui/AssistantPanel";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

interface WebhookDelivery {
  id: string;
  event: string;
  statusCode: number | null;
  responseMs: number | null;
  success: boolean;
  attempts: number;
  createdAt: string;
}

interface Webhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  failCount: number;
  createdAt: string;
  _count?: { deliveries: number };
}

const ALL_EVENTS = [
  { id: "user.trust_score_changed",   layer: "Core",        icon: "⬡",  desc: "Trust Score tier changes" },
  { id: "academy.certificate_issued", layer: "Academy",     icon: "🎓", desc: "User earns a certificate" },
  { id: "community.skill_detected",   layer: "Community",   icon: "🧑‍🤝‍🧑", desc: "NOVA detects skill in post" },
  { id: "work.contract_completed",    layer: "Work",        icon: "💼", desc: "Escrow released" },
  { id: "loop.stage_advanced",        layer: "Intelligence",icon: "🔁", desc: "User advances Agentic Loop stage" },
  { id: "loop.completed",             layer: "Intelligence",icon: "🏆", desc: "Full Agentic Loop cycle completed" },
  { id: "market.sale_completed",      layer: "Market",      icon: "🛒", desc: "Product purchase confirmed" },
  { id: "user.identity_verified",     layer: "Core",        icon: "✅", desc: "KYC verification passes" },
  { id: "payment.received",           layer: "Billing",     icon: "💳", desc: "Any payment settled" },
  { id: "academy.course_enrolled",    layer: "Academy",     icon: "📚", desc: "User enrolls in a course" },
  { id: "community.post_created",     layer: "Community",   icon: "📝", desc: "New post published" },
  { id: "work.job_applied",           layer: "Work",        icon: "📋", desc: "Job application submitted" },
  { id: "market.vendor_approved",     layer: "Market",      icon: "🏪", desc: "Vendor account approved" },
  { id: "user.registered",            layer: "Core",        icon: "👤", desc: "New user registered" },
  { id: "automation.run_completed",   layer: "Cloud",       icon: "⚡", desc: "Automation workflow finished" },
];

const LAYER_COLOR: Record<string, string> = {
  Core:        "var(--green)",
  Academy:     "var(--gold)",
  Community:   "var(--ice)",
  Work:        "var(--blue)",
  Intelligence:"var(--purple)",
  Market:      "var(--gold)",
  Billing:     "var(--green)",
  Cloud:       "var(--purple)",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function CloudWebhooksPage() {
  const token = useAuthStore((s) => s.token);

  const [webhooks, setWebhooks]     = useState<Webhook[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);
  const [newSecret, setNewSecret]   = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);

  const [form, setForm] = useState({ url: "", selectedEvents: [] as string[] });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/cloud/webhooks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWebhooks(data.webhooks || []);
      }
    } catch { /* non-blocking */ }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchWebhooks(); }, [fetchWebhooks]);

  const fetchDeliveries = useCallback(async (id: string) => {
    setDeliveriesLoading(true);
    try {
      const res = await fetch(`${API}/cloud/webhooks/${id}/deliveries`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDeliveries(data.deliveries || []);
      }
    } catch { /* non-blocking */ }
    finally { setDeliveriesLoading(false); }
  }, [token]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    fetchDeliveries(id);
  };

  const toggleEvent = (eventId: string) => {
    setForm((f) => ({
      ...f,
      selectedEvents: f.selectedEvents.includes(eventId)
        ? f.selectedEvents.filter((e) => e !== eventId)
        : [...f.selectedEvents, eventId],
    }));
  };

  const selectAll = () => setForm((f) => ({ ...f, selectedEvents: ALL_EVENTS.map((e) => e.id) }));
  const clearAll  = () => setForm((f) => ({ ...f, selectedEvents: [] }));

  const handleCreate = async () => {
    if (!form.url.trim()) { setError("Endpoint URL is required"); return; }
    if (!form.url.startsWith("https://")) { setError("URL must use HTTPS"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/cloud/webhooks`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.url, events: form.selectedEvents }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to create webhook");
      } else {
        const data = await res.json();
        if (data.webhook?.secret) setNewSecret(data.webhook.secret);
        setShowCreate(false);
        setForm({ url: "", selectedEvents: [] });
        await fetchWebhooks();
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API}/cloud/webhooks/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (selectedId === id) setSelectedId(null);
      await fetchWebhooks();
    } catch { /* non-blocking */ }
  };

  const handleToggle = async (w: Webhook) => {
    try {
      await fetch(`${API}/cloud/webhooks/${w.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ active: !w.active }),
      });
      await fetchWebhooks();
    } catch { /* non-blocking */ }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const selectedWebhook = webhooks.find((w) => w.id === selectedId);

  return (
    <div style={{ padding: "32px 28px", maxWidth: 1200, margin: "0 auto" }}>
      <style>{`
        .wh-ctx { display:flex; gap:8px; marginBottom:22px; flexWrap:wrap; }
        .ctx-badge { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:0.08em; padding:4px 10px; border-radius:3px; border:1px solid; }
        .ctx-badge.live   { background:rgba(45,212,160,0.08);  border-color:rgba(45,212,160,0.3);  color:var(--green); }
        .ctx-badge.active { background:rgba(155,111,255,0.15); border-color:var(--purple);         color:var(--purple); }
        .ctx-sep { color:var(--border); font-size:11px; display:flex; align-items:center; }

        .wh-layout { display:grid; grid-template-columns:320px 1fr; gap:24px; align-items:start; }
        @media(max-width:880px) { .wh-layout { grid-template-columns:1fr; } }

        .wh-list-panel { background:var(--surface); border:1px solid var(--border); border-radius:6px; overflow:hidden; }
        .wh-list-header { padding:16px 20px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; }
        .wh-list-title { font-family:'Syne',sans-serif; font-size:13px; font-weight:700; color:var(--text); }
        .wh-add-btn { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.08em; padding:6px 14px; border-radius:3px; background:var(--purple); color:#fff; border:none; cursor:pointer; transition:opacity 200ms; }
        .wh-add-btn:hover { opacity:0.85; }

        .wh-item { padding:14px 20px; border-bottom:1px solid rgba(30,50,72,0.5); cursor:pointer; transition:background 200ms; }
        .wh-item:last-child { border-bottom:none; }
        .wh-item:hover { background:var(--surface2); }
        .wh-item.selected { background:rgba(155,111,255,0.08); border-left:3px solid var(--purple); padding-left:17px; }
        .wh-item-url { font-family:'Space Mono',monospace; font-size:10px; color:var(--ice); margin-bottom:5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
        .wh-item-meta { display:flex; align-items:center; gap:8px; }
        .wh-item-status { font-family:'Space Mono',monospace; font-size:8px; padding:2px 6px; border-radius:2px; }
        .wh-item-status.on  { background:rgba(45,212,160,0.1); border:1px solid rgba(45,212,160,0.3); color:var(--green); }
        .wh-item-status.off { background:rgba(90,122,150,0.1); border:1px solid var(--border); color:var(--text-dim); }
        .wh-item-events { font-family:'Space Mono',monospace; font-size:9px; color:var(--text-dim); }
        .wh-item-fail { font-family:'Space Mono',monospace; font-size:9px; color:var(--red); }

        .wh-detail { background:var(--surface); border:1px solid var(--border); border-radius:6px; overflow:hidden; }
        .wh-detail-header { padding:20px 24px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
        .wh-detail-url { font-family:'Space Mono',monospace; font-size:12px; color:var(--ice); word-break:break-all; }
        .wh-detail-actions { display:flex; gap:8px; flex-shrink:0; }
        .wh-btn { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.06em; padding:6px 12px; border-radius:3px; border:1px solid var(--border); background:transparent; color:var(--text-dim); cursor:pointer; transition:all 200ms; white-space:nowrap; }
        .wh-btn:hover { border-color:var(--purple); color:var(--purple); }
        .wh-btn.on  { background:rgba(45,212,160,0.1); border-color:rgba(45,212,160,0.4); color:var(--green); }
        .wh-btn.off { background:rgba(90,122,150,0.08); border-color:var(--border); color:var(--text-dim); }
        .wh-btn.danger:hover { border-color:var(--red); color:var(--red); }

        .wh-section { padding:18px 24px; border-bottom:1px solid rgba(30,50,72,0.5); }
        .wh-section:last-child { border-bottom:none; }
        .wh-section-title { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.1em; color:var(--text-dim); margin-bottom:12px; }

        .wh-events-list { display:flex; flex-wrap:wrap; gap:6px; }
        .wh-event-tag { font-family:'Space Mono',monospace; font-size:8px; padding:3px 8px; border-radius:2px; border:1px solid; }

        .wh-deliveries-table { width:100%; border-collapse:collapse; }
        .wh-deliveries-table th { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-dim); padding:8px 12px; text-align:left; border-bottom:1px solid var(--border); }
        .wh-deliveries-table td { padding:10px 12px; border-bottom:1px solid rgba(30,50,72,0.4); font-family:'Space Mono',monospace; font-size:10px; }
        .wh-deliveries-table tr:last-child td { border-bottom:none; }
        .wh-status-ok  { color:var(--green); }
        .wh-status-err { color:var(--red); }

        .wh-empty { text-align:center; padding:60px 20px; color:var(--text-dim); font-family:'Syne',sans-serif; font-size:14px; }
        .wh-empty-icon { font-size:36px; margin-bottom:12px; }

        /* Secret Banner */
        .wh-secret-banner { background:rgba(45,212,160,0.06); border:1px solid rgba(45,212,160,0.3); border-radius:6px; padding:20px 24px; margin-bottom:28px; position:relative; overflow:hidden; }
        .wh-secret-banner::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,var(--green),transparent); }
        .wh-secret-title { font-family:'Syne',sans-serif; font-size:13px; font-weight:700; color:var(--green); margin-bottom:5px; }
        .wh-secret-warn { font-family:'Space Mono',monospace; font-size:9px; color:var(--text-dim); margin-bottom:12px; }
        .wh-secret-row { display:flex; align-items:center; gap:10px; }
        .wh-secret-val { font-family:'Space Mono',monospace; font-size:10px; color:var(--text); background:var(--surface3); border:1px solid var(--border); border-radius:4px; padding:10px 14px; flex:1; word-break:break-all; }
        .wh-copy-btn { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; padding:8px 14px; border-radius:4px; background:var(--green); color:var(--bg); border:none; cursor:pointer; white-space:nowrap; }
        .wh-dismiss-btn { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; padding:8px 14px; border-radius:4px; background:transparent; border:1px solid var(--border); color:var(--text-dim); cursor:pointer; }

        /* Create Modal */
        .wh-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:200; display:flex; align-items:center; justify-content:center; padding:20px; }
        .wh-modal { background:var(--surface); border:1px solid var(--border); border-radius:8px; width:100%; max-width:600px; max-height:90vh; overflow-y:auto; }
        .wh-modal-header { padding:20px 24px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; background:var(--surface); z-index:1; }
        .wh-modal-title { font-family:'Syne',sans-serif; font-size:16px; font-weight:700; color:var(--text); }
        .wh-modal-close { background:transparent; border:none; color:var(--text-dim); font-size:18px; cursor:pointer; }
        .wh-modal-body { padding:24px; display:flex; flex-direction:column; gap:20px; }
        .wh-field-label { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-dim); margin-bottom:6px; }
        .wh-input { width:100%; background:var(--surface2); border:1px solid var(--border); border-radius:4px; padding:10px 14px; font-family:'Space Mono',monospace; font-size:11px; color:var(--text); outline:none; box-sizing:border-box; }
        .wh-input:focus { border-color:var(--purple); }
        .wh-input::placeholder { color:var(--text-dim); }
        .wh-events-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
        .wh-events-action { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; padding:3px 8px; border-radius:3px; background:transparent; border:1px solid var(--border); color:var(--text-dim); cursor:pointer; }
        .wh-events-action:hover { border-color:var(--purple); color:var(--purple); }
        .wh-events-grid { display:flex; flex-direction:column; gap:6px; }
        .wh-event-opt { display:flex; align-items:center; gap:12px; padding:10px 12px; background:var(--surface2); border:1px solid var(--border); border-radius:4px; cursor:pointer; transition:all 200ms; }
        .wh-event-opt.selected { border-color:rgba(155,111,255,0.4); background:rgba(155,111,255,0.06); }
        .wh-event-opt-check { width:16px; height:16px; border-radius:3px; border:1px solid var(--border); background:var(--surface3); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .wh-event-opt-check.on { background:var(--purple); border-color:var(--purple); }
        .wh-event-icon { font-size:13px; flex-shrink:0; }
        .wh-event-info { flex:1; }
        .wh-event-id { font-family:'Space Mono',monospace; font-size:10px; color:var(--text); }
        .wh-event-desc { font-family:'Space Mono',monospace; font-size:8px; color:var(--text-dim); margin-top:2px; }
        .wh-event-layer-badge { font-family:'Space Mono',monospace; font-size:8px; padding:2px 6px; border-radius:2px; border:1px solid; flex-shrink:0; }
        .wh-error { font-family:'Space Mono',monospace; font-size:10px; color:var(--red); padding:8px 12px; background:rgba(224,90,78,0.08); border:1px solid rgba(224,90,78,0.25); border-radius:4px; }
        .wh-modal-footer { padding:16px 24px; border-top:1px solid var(--border); display:flex; justify-content:flex-end; gap:10px; position:sticky; bottom:0; background:var(--surface); }
        .wh-cancel-btn { font-family:'Space Mono',monospace; font-size:10px; text-transform:uppercase; padding:8px 18px; border-radius:4px; background:transparent; border:1px solid var(--border); color:var(--text-dim); cursor:pointer; }
        .wh-save-btn { font-family:'Space Mono',monospace; font-size:10px; text-transform:uppercase; padding:8px 18px; border-radius:4px; background:var(--purple); color:#fff; border:none; cursor:pointer; }
        .wh-save-btn:disabled { opacity:0.5; cursor:not-allowed; }

        /* Verification box */
        .wh-verify-box { background:var(--surface2); border:1px solid var(--border); border-radius:4px; padding:14px 16px; }
        .wh-verify-code { font-family:'Space Mono',monospace; font-size:10px; color:var(--ice); line-height:1.7; }

        .skeleton { background:linear-gradient(90deg,var(--surface2) 25%,var(--surface3) 50%,var(--surface2) 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:4px; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: "var(--text)", margin: 0 }}>
          🪝 <span style={{ color: "var(--purple)", fontStyle: "italic" }}>Webhooks</span>
        </h1>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>
          Subscribe to 15 ecosystem events · HMAC-SHA256 signed · Automatic retry
        </div>
      </div>

      {/* Context Bar */}
      <div className="wh-ctx">
        <span className="ctx-badge live">⬡ Core Engine</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge active">☁️ Cloud</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge active">🪝 Webhooks</span>
      </div>

      {/* Secret Banner */}
      {newSecret && (
        <div className="wh-secret-banner">
          <div className="wh-secret-title">✓ Webhook Created — Save Your Signing Secret</div>
          <div className="wh-secret-warn">This secret is shown once. Use it to verify HMAC-SHA256 signatures on incoming payloads.</div>
          <div className="wh-secret-row">
            <div className="wh-secret-val">{newSecret}</div>
            <button className="wh-copy-btn" onClick={() => handleCopy(newSecret)}>{copiedSecret ? "Copied ✓" : "Copy"}</button>
            <button className="wh-dismiss-btn" onClick={() => setNewSecret(null)}>Dismiss</button>
          </div>
        </div>
      )}

      <div className="wh-layout">
        {/* Left — Webhook List */}
        <div className="wh-list-panel">
          <div className="wh-list-header">
            <div className="wh-list-title">Subscriptions ({webhooks.length})</div>
            <button className="wh-add-btn" onClick={() => setShowCreate(true)}>+ Add</button>
          </div>

          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ padding: "14px 20px", borderBottom: "1px solid rgba(30,50,72,0.5)" }}>
                <div className="skeleton" style={{ height: 10, width: "90%", marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 10, width: "55%" }} />
              </div>
            ))
          ) : webhooks.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-dim)", fontFamily: "'Syne',sans-serif", fontSize: 13 }}>
              No webhooks yet.<br />Add your first endpoint.
            </div>
          ) : (
            webhooks.map((w) => (
              <div
                key={w.id}
                className={`wh-item ${selectedId === w.id ? "selected" : ""}`}
                onClick={() => handleSelect(w.id)}
              >
                <div className="wh-item-url">{w.url}</div>
                <div className="wh-item-meta">
                  <span className={`wh-item-status ${w.active ? "on" : "off"}`}>{w.active ? "Active" : "Paused"}</span>
                  <span className="wh-item-events">{w.events.length === 0 ? "All events" : `${w.events.length} events`}</span>
                  {w.failCount > 0 && <span className="wh-item-fail">⚠ {w.failCount} fails</span>}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right — Detail */}
        <div className="wh-detail">
          {!selectedWebhook ? (
            <div className="wh-empty">
              <div className="wh-empty-icon">🪝</div>
              Select a subscription to see delivery history
            </div>
          ) : (
            <>
              <div className="wh-detail-header">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="wh-detail-url">{selectedWebhook.url}</div>
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "var(--text-dim)", marginTop: 6 }}>
                    Created {formatDate(selectedWebhook.createdAt)} · {selectedWebhook._count?.deliveries ?? 0} deliveries
                    {selectedWebhook.failCount > 0 && <span style={{ color: "var(--red)", marginLeft: 8 }}>⚠ {selectedWebhook.failCount} failures</span>}
                  </div>
                </div>
                <div className="wh-detail-actions">
                  <button
                    className={`wh-btn ${selectedWebhook.active ? "on" : "off"}`}
                    onClick={() => handleToggle(selectedWebhook)}
                  >
                    {selectedWebhook.active ? "● Active" : "○ Paused"}
                  </button>
                  <button className="wh-btn danger" onClick={() => handleDelete(selectedWebhook.id)}>Delete</button>
                </div>
              </div>

              {/* Events */}
              <div className="wh-section">
                <div className="wh-section-title">Subscribed Events</div>
                <div className="wh-events-list">
                  {selectedWebhook.events.length === 0 ? (
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "var(--text-dim)" }}>All events (wildcard)</span>
                  ) : (
                    selectedWebhook.events.map((e) => {
                      const ev = ALL_EVENTS.find((ae) => ae.id === e);
                      return (
                        <span key={e} className="wh-event-tag" style={{ color: LAYER_COLOR[ev?.layer ?? "Core"], borderColor: `${LAYER_COLOR[ev?.layer ?? "Core"]}44`, background: `${LAYER_COLOR[ev?.layer ?? "Core"]}11` }}>
                          {ev?.icon} {e}
                        </span>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Payload Verification */}
              <div className="wh-section">
                <div className="wh-section-title">Signature Verification</div>
                <div className="wh-verify-box">
                  <div className="wh-verify-code">{`// Node.js — verify HMAC-SHA256 signature
const crypto = require('crypto');

function verifyWebhook(rawBody, signature, secret) {
  const hmac = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');
  return crypto.timingSafeEqual(
    Buffer.from(hmac), Buffer.from(signature)
  );
}`}</div>
                </div>
              </div>

              {/* Delivery History */}
              <div className="wh-section">
                <div className="wh-section-title">Delivery History</div>
                {deliveriesLoading ? (
                  <div className="skeleton" style={{ height: 80, borderRadius: 4 }} />
                ) : deliveries.length === 0 ? (
                  <div style={{ color: "var(--text-dim)", fontFamily: "'Space Mono',monospace", fontSize: 11 }}>No deliveries yet</div>
                ) : (
                  <table className="wh-deliveries-table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Event</th>
                        <th>HTTP</th>
                        <th>Latency</th>
                        <th>Attempts</th>
                        <th>Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveries.slice(0, 20).map((d) => (
                        <tr key={d.id}>
                          <td className={d.success ? "wh-status-ok" : "wh-status-err"}>
                            {d.success ? "✓" : "✗"}
                          </td>
                          <td style={{ color: "var(--ice)", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.event}</td>
                          <td style={{ color: d.statusCode && d.statusCode >= 200 && d.statusCode < 300 ? "var(--green)" : "var(--red)" }}>
                            {d.statusCode ?? "—"}
                          </td>
                          <td style={{ color: "var(--text-dim)" }}>{d.responseMs ? `${d.responseMs}ms` : "—"}</td>
                          <td style={{ color: d.attempts > 1 ? "var(--gold)" : "var(--text-dim)" }}>{d.attempts}</td>
                          <td style={{ color: "var(--text-dim)" }}>{formatDate(d.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="wh-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="wh-modal">
            <div className="wh-modal-header">
              <div className="wh-modal-title">Add Webhook Endpoint</div>
              <button className="wh-modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="wh-modal-body">
              {error && <div className="wh-error">{error}</div>}

              <div>
                <div className="wh-field-label">Endpoint URL *</div>
                <input
                  className="wh-input"
                  placeholder="https://yourapp.com/webhooks/winners"
                  value={form.url}
                  onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                />
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "var(--text-dim)", marginTop: 5 }}>
                  Must be HTTPS · Winners will POST JSON payloads to this URL
                </div>
              </div>

              <div>
                <div className="wh-events-header">
                  <div className="wh-field-label" style={{ margin: 0 }}>Events to Subscribe</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="wh-events-action" onClick={selectAll}>All</button>
                    <button className="wh-events-action" onClick={clearAll}>None</button>
                  </div>
                </div>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "var(--text-dim)", marginBottom: 10 }}>
                  Leave empty to receive all events.
                </div>
                <div className="wh-events-grid">
                  {ALL_EVENTS.map((ev) => {
                    const selected = form.selectedEvents.includes(ev.id);
                    const layerColor = LAYER_COLOR[ev.layer] ?? "var(--text-dim)";
                    return (
                      <div
                        key={ev.id}
                        className={`wh-event-opt ${selected ? "selected" : ""}`}
                        onClick={() => toggleEvent(ev.id)}
                      >
                        <div className={`wh-event-opt-check ${selected ? "on" : ""}`}>
                          {selected && <span style={{ color: "#fff", fontSize: 9 }}>✓</span>}
                        </div>
                        <span className="wh-event-icon">{ev.icon}</span>
                        <div className="wh-event-info">
                          <div className="wh-event-id">{ev.id}</div>
                          <div className="wh-event-desc">{ev.desc}</div>
                        </div>
                        <span className="wh-event-layer-badge" style={{ color: layerColor, borderColor: `${layerColor}55`, background: `${layerColor}11` }}>
                          {ev.layer}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="wh-modal-footer">
              <button className="wh-cancel-btn" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="wh-save-btn" onClick={handleCreate} disabled={saving}>
                {saving ? "Creating…" : "Add Endpoint"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AssistantPanel
        assistant="nexus"
        page="cloud/webhooks"
        context={{ layer: "cloud", view: "webhooks", description: "Webhook subscriptions — 15 ecosystem events, HMAC-SHA256 signed, automatic retry" }}
      />
    </div>
  );
}
