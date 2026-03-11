// Phase 8 — Winners Cloud — CloudAutomationsPage.tsx
// NEXUS Supervisor · Automation Workflow Builder
// Visual iPaaS — triggers, actions, conditions, branching

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../auth/authStore";
import AssistantPanel from "../../components/ui/AssistantPanel";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

interface AutomationRun {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  creditsUsed: number;
  error: string | null;
}

interface Automation {
  id: string;
  name: string;
  description: string | null;
  trigger: Record<string, unknown>;
  steps: unknown[];
  active: boolean;
  runCount: number;
  lastRunAt: string | null;
  createdAt: string;
  _count?: { runs: number };
}

const TRIGGER_TYPES = [
  { value: "webhook",  label: "Webhook",          icon: "🪝", desc: "HTTP POST to a generated endpoint" },
  { value: "schedule", label: "Schedule (Cron)",   icon: "⏰", desc: "Run on a recurring schedule" },
  { value: "event",    label: "Ecosystem Event",   icon: "⚡", desc: "Triggered by Winners platform events" },
  { value: "loop",     label: "Agentic Loop",      icon: "🔁", desc: "Triggered by loop milestones" },
];

const LOOP_EVENTS = [
  "skill_detected",
  "certificate_issued",
  "contract_completed",
];

const SAMPLE_STEPS = [
  { id: "http",      label: "HTTP Request",       icon: "🌐", connector: "http",      action: "request" },
  { id: "whatsapp",  label: "Send WhatsApp",      icon: "💬", connector: "whatsapp",  action: "send_message" },
  { id: "email",     label: "Send Email",         icon: "📧", connector: "email",     action: "send" },
  { id: "mpesa",     label: "M-Pesa Transfer",    icon: "💳", connector: "mpesa",     action: "b2c_payment" },
  { id: "hubspot",   label: "Update HubSpot CRM", icon: "🏢", connector: "hubspot",   action: "create_contact" },
  { id: "slack",     label: "Slack Notification", icon: "💬", connector: "slack",     action: "post_message" },
  { id: "sheets",    label: "Write to Sheets",    icon: "📊", connector: "gsheets",   action: "append_row" },
  { id: "ai",        label: "AI Analysis",        icon: "🤖", connector: "anthropic", action: "complete" },
];

const STATUS_COLOR: Record<string, string> = {
  success: "var(--green)",
  running: "var(--gold)",
  failed:  "var(--red)",
  pending: "var(--text-dim)",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function CloudAutomationsPage() {
  const token = useAuthStore((s) => s.token);

  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showCreate, setShowCreate]   = useState(false);
  const [selectedId, setSelectedId]   = useState<string | null>(null);
  const [runs, setRuns]               = useState<AutomationRun[]>([]);
  const [runsLoading, setRunsLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    triggerType: "webhook",
    cronExpr: "0 9 * * 1-5",
    loopEvent: "skill_detected",
    selectedSteps: [] as string[],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const fetchAutomations = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/cloud/automations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAutomations(data.automations || []);
      }
    } catch {
      // non-blocking
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAutomations();
  }, [fetchAutomations]);

  const fetchRuns = useCallback(async (automationId: string) => {
    setRunsLoading(true);
    try {
      const res = await fetch(`${API}/cloud/automations/${automationId}/runs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRuns(data.runs || []);
      }
    } catch {
      // non-blocking
    } finally {
      setRunsLoading(false);
    }
  }, [token]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    fetchRuns(id);
  };

  const toggleStep = (stepId: string) => {
    setForm((f) => ({
      ...f,
      selectedSteps: f.selectedSteps.includes(stepId)
        ? f.selectedSteps.filter((s) => s !== stepId)
        : [...f.selectedSteps, stepId],
    }));
  };

  const handleCreate = async () => {
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError("");
    try {
      const trigger =
        form.triggerType === "webhook"  ? { type: "webhook", method: "POST" } :
        form.triggerType === "schedule" ? { type: "schedule", cron: form.cronExpr, timezone: "Africa/Nairobi" } :
        form.triggerType === "loop"     ? { type: "loop", loopEvent: form.loopEvent } :
        { type: "event", source: "winners", event: "custom" };

      const steps = form.selectedSteps.map((sid) => {
        const s = SAMPLE_STEPS.find((x) => x.id === sid)!;
        return { id: sid, connector: s.connector, action: s.action, input: {} };
      });

      const res = await fetch(`${API}/cloud/automations`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, description: form.description, trigger, steps }),
      });

      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to create automation");
      } else {
        setShowCreate(false);
        setForm({ name: "", description: "", triggerType: "webhook", cronExpr: "0 9 * * 1-5", loopEvent: "skill_detected", selectedSteps: [] });
        await fetchAutomations();
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (a: Automation) => {
    try {
      await fetch(`${API}/cloud/automations/${a.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ active: !a.active }),
      });
      await fetchAutomations();
    } catch {
      // non-blocking
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API}/cloud/automations/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (selectedId === id) setSelectedId(null);
      await fetchAutomations();
    } catch {
      // non-blocking
    }
  };

  const selectedAuto = automations.find((a) => a.id === selectedId);

  return (
    <div style={{ padding: "32px 28px", maxWidth: 1200, margin: "0 auto" }}>
      <style>{`
        .auto-ctx-bar { display:flex; gap:8px; marginBottom:22px; flexWrap:wrap; }
        .ctx-badge { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:0.08em; padding:4px 10px; border-radius:3px; border:1px solid; }
        .ctx-badge.live    { background:rgba(45,212,160,0.08);  border-color:rgba(45,212,160,0.3);  color:var(--green); }
        .ctx-badge.active  { background:rgba(155,111,255,0.15); border-color:var(--purple);         color:var(--purple); }
        .ctx-sep { color:var(--border); font-size:11px; display:flex; align-items:center; }

        .auto-layout { display:grid; grid-template-columns:320px 1fr; gap:24px; align-items:start; }
        @media(max-width:900px) { .auto-layout { grid-template-columns:1fr; } }

        .auto-list-panel { background:var(--surface); border:1px solid var(--border); border-radius:6px; overflow:hidden; }
        .auto-list-header { padding:16px 20px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; }
        .auto-list-title { font-family:'Syne',sans-serif; font-size:13px; font-weight:700; color:var(--text); }
        .auto-create-btn { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.08em; padding:6px 14px; border-radius:3px; background:var(--purple); color:#fff; border:none; cursor:pointer; transition:opacity 200ms; }
        .auto-create-btn:hover { opacity:0.85; }

        .auto-item { padding:14px 20px; border-bottom:1px solid rgba(30,50,72,0.5); cursor:pointer; transition:background 200ms; }
        .auto-item:last-child { border-bottom:none; }
        .auto-item:hover { background:var(--surface2); }
        .auto-item.selected { background:rgba(155,111,255,0.08); border-left:3px solid var(--purple); padding-left:17px; }
        .auto-item-name { font-family:'Syne',sans-serif; font-size:13px; font-weight:600; color:var(--text); margin-bottom:4px; }
        .auto-item-meta { display:flex; gap:8px; align-items:center; }
        .auto-item-trigger { font-family:'Space Mono',monospace; font-size:9px; color:var(--text-dim); text-transform:uppercase; }
        .auto-item-status { font-family:'Space Mono',monospace; font-size:9px; padding:2px 6px; border-radius:3px; }
        .auto-item-status.active   { background:rgba(45,212,160,0.1); color:var(--green); border:1px solid rgba(45,212,160,0.3); }
        .auto-item-status.inactive { background:rgba(90,122,150,0.1); color:var(--text-dim); border:1px solid var(--border); }
        .auto-item-runs { font-family:'Space Mono',monospace; font-size:9px; color:var(--text-dim); margin-top:4px; }

        .auto-detail-panel { background:var(--surface); border:1px solid var(--border); border-radius:6px; overflow:hidden; }
        .auto-detail-header { padding:20px 24px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:flex-start; }
        .auto-detail-title { font-family:'Syne',sans-serif; font-size:16px; font-weight:700; color:var(--text); }
        .auto-detail-actions { display:flex; gap:8px; }
        .auto-btn { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.08em; padding:6px 12px; border-radius:3px; border:1px solid var(--border); background:transparent; color:var(--text-dim); cursor:pointer; transition:all 200ms; }
        .auto-btn:hover { border-color:var(--purple); color:var(--purple); }
        .auto-btn.danger:hover { border-color:var(--red); color:var(--red); }
        .auto-btn.toggle-on  { background:rgba(45,212,160,0.1); border-color:rgba(45,212,160,0.4); color:var(--green); }
        .auto-btn.toggle-off { background:rgba(90,122,150,0.08); border-color:var(--border); color:var(--text-dim); }

        .auto-section { padding:20px 24px; border-bottom:1px solid rgba(30,50,72,0.5); }
        .auto-section:last-child { border-bottom:none; }
        .auto-section-title { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.1em; color:var(--text-dim); margin-bottom:14px; }

        .auto-trigger-card { background:var(--surface2); border:1px solid var(--border); border-radius:4px; padding:14px 16px; }
        .auto-trigger-type { font-family:'Syne',sans-serif; font-size:13px; font-weight:600; color:var(--gold); margin-bottom:4px; }
        .auto-trigger-detail { font-family:'Space Mono',monospace; font-size:10px; color:var(--text-dim); }

        .auto-steps-list { display:flex; flex-direction:column; gap:8px; }
        .auto-step-item { display:flex; align-items:center; gap:10px; background:var(--surface2); border:1px solid var(--border); border-radius:4px; padding:10px 14px; }
        .auto-step-num { font-family:'Space Mono',monospace; font-size:9px; color:var(--text-dim); width:16px; text-align:center; }
        .auto-step-icon { font-size:16px; }
        .auto-step-name { font-family:'Syne',sans-serif; font-size:12px; color:var(--text); }
        .auto-step-connector { font-family:'Space Mono',monospace; font-size:9px; color:var(--text-dim); margin-left:auto; }

        .auto-runs-table { width:100%; border-collapse:collapse; }
        .auto-runs-table th { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-dim); padding:8px 12px; text-align:left; border-bottom:1px solid var(--border); }
        .auto-runs-table td { padding:10px 12px; border-bottom:1px solid rgba(30,50,72,0.4); font-family:'Space Mono',monospace; font-size:10px; color:var(--text-dim); }
        .auto-runs-table tr:last-child td { border-bottom:none; }

        .auto-empty { text-align:center; padding:60px 20px; color:var(--text-dim); font-family:'Syne',sans-serif; font-size:14px; }

        /* Create Modal */
        .auto-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:200; display:flex; align-items:center; justify-content:center; padding:20px; }
        .auto-modal { background:var(--surface); border:1px solid var(--border); border-radius:8px; width:100%; max-width:600px; max-height:90vh; overflow-y:auto; }
        .auto-modal-header { padding:20px 24px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; }
        .auto-modal-title { font-family:'Syne',sans-serif; font-size:16px; font-weight:700; color:var(--text); }
        .auto-modal-close { background:transparent; border:none; color:var(--text-dim); font-size:18px; cursor:pointer; }
        .auto-modal-body { padding:24px; display:flex; flex-direction:column; gap:18px; }
        .auto-field-label { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-dim); margin-bottom:6px; }
        .auto-input { width:100%; background:var(--surface2); border:1px solid var(--border); border-radius:4px; padding:10px 14px; font-family:'Syne',sans-serif; font-size:13px; color:var(--text); outline:none; box-sizing:border-box; }
        .auto-input:focus { border-color:var(--purple); }
        .auto-input::placeholder { color:var(--text-dim); }
        .auto-trigger-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .auto-trigger-opt { padding:12px; background:var(--surface2); border:1px solid var(--border); border-radius:4px; cursor:pointer; transition:all 200ms; }
        .auto-trigger-opt.selected { border-color:var(--purple); background:rgba(155,111,255,0.08); }
        .auto-trigger-opt-icon { font-size:18px; margin-bottom:6px; }
        .auto-trigger-opt-label { font-family:'Syne',sans-serif; font-size:12px; font-weight:600; color:var(--text); margin-bottom:2px; }
        .auto-trigger-opt-desc { font-family:'Space Mono',monospace; font-size:9px; color:var(--text-dim); }
        .auto-steps-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .auto-step-opt { padding:10px 12px; background:var(--surface2); border:1px solid var(--border); border-radius:4px; cursor:pointer; transition:all 200ms; display:flex; align-items:center; gap:8px; }
        .auto-step-opt.selected { border-color:var(--ice); background:rgba(137,196,225,0.08); }
        .auto-step-opt-icon { font-size:16px; }
        .auto-step-opt-label { font-family:'Syne',sans-serif; font-size:12px; color:var(--text); }
        .auto-error { font-family:'Space Mono',monospace; font-size:10px; color:var(--red); padding:8px 12px; background:rgba(224,90,78,0.08); border:1px solid rgba(224,90,78,0.25); border-radius:4px; }
        .auto-modal-footer { padding:16px 24px; border-top:1px solid var(--border); display:flex; justify-content:flex-end; gap:10px; }
        .auto-cancel-btn { font-family:'Space Mono',monospace; font-size:10px; text-transform:uppercase; padding:8px 18px; border-radius:4px; background:transparent; border:1px solid var(--border); color:var(--text-dim); cursor:pointer; }
        .auto-save-btn { font-family:'Space Mono',monospace; font-size:10px; text-transform:uppercase; padding:8px 18px; border-radius:4px; background:var(--purple); color:#fff; border:none; cursor:pointer; }
        .auto-save-btn:disabled { opacity:0.5; cursor:not-allowed; }

        .skeleton { background:linear-gradient(90deg,var(--surface2) 25%,var(--surface3) 50%,var(--surface2) 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:4px; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: "var(--text)", margin: 0 }}>
          ⚡ Automation <span style={{ color: "var(--purple)", fontStyle: "italic" }}>Builder</span>
        </h1>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>
          Visual iPaaS · Connect triggers, actions & conditions · Powered by NEXUS
        </div>
      </div>

      {/* Context Bar */}
      <div className="auto-ctx-bar">
        <span className="ctx-badge live">⬡ Core Engine</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge active">☁️ Cloud</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge active">⚡ Automations</span>
      </div>

      <div className="auto-layout">
        {/* Left — Automation List */}
        <div className="auto-list-panel">
          <div className="auto-list-header">
            <div className="auto-list-title">Workflows ({automations.length})</div>
            <button className="auto-create-btn" onClick={() => setShowCreate(true)}>+ New</button>
          </div>

          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ padding: "14px 20px", borderBottom: "1px solid rgba(30,50,72,0.5)" }}>
                <div className="skeleton" style={{ height: 14, width: "70%", marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 10, width: "40%" }} />
              </div>
            ))
          ) : automations.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-dim)", fontFamily: "'Syne',sans-serif", fontSize: 13 }}>
              No automations yet.<br />Create your first workflow.
            </div>
          ) : (
            automations.map((a) => (
              <div
                key={a.id}
                className={`auto-item ${selectedId === a.id ? "selected" : ""}`}
                onClick={() => handleSelect(a.id)}
              >
                <div className="auto-item-name">{a.name}</div>
                <div className="auto-item-meta">
                  <span className="auto-item-trigger">{String((a.trigger as Record<string, unknown>).type ?? "webhook")}</span>
                  <span className={`auto-item-status ${a.active ? "active" : "inactive"}`}>
                    {a.active ? "Active" : "Paused"}
                  </span>
                </div>
                <div className="auto-item-runs">Runs: {a._count?.runs ?? a.runCount}</div>
              </div>
            ))
          )}
        </div>

        {/* Right — Detail Panel */}
        <div className="auto-detail-panel">
          {!selectedAuto ? (
            <div className="auto-empty">
              <div style={{ fontSize: 36, marginBottom: 12 }}>⚡</div>
              Select a workflow or create a new one to see details
            </div>
          ) : (
            <>
              <div className="auto-detail-header">
                <div>
                  <div className="auto-detail-title">{selectedAuto.name}</div>
                  {selectedAuto.description && (
                    <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 12, color: "var(--text-dim)", marginTop: 4 }}>
                      {selectedAuto.description}
                    </div>
                  )}
                </div>
                <div className="auto-detail-actions">
                  <button
                    className={`auto-btn ${selectedAuto.active ? "toggle-on" : "toggle-off"}`}
                    onClick={() => handleToggleActive(selectedAuto)}
                  >
                    {selectedAuto.active ? "● Active" : "○ Paused"}
                  </button>
                  <button className="auto-btn danger" onClick={() => handleDelete(selectedAuto.id)}>Delete</button>
                </div>
              </div>

              {/* Trigger */}
              <div className="auto-section">
                <div className="auto-section-title">Trigger</div>
                <div className="auto-trigger-card">
                  <div className="auto-trigger-type">
                    {String((selectedAuto.trigger as Record<string, unknown>).type ?? "webhook").toUpperCase()}
                  </div>
                  <div className="auto-trigger-detail">
                    {JSON.stringify(selectedAuto.trigger)}
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="auto-section">
                <div className="auto-section-title">Steps ({(selectedAuto.steps as unknown[]).length})</div>
                <div className="auto-steps-list">
                  {(selectedAuto.steps as { id: string; connector: string; action: string }[]).map((step, idx) => {
                    const meta = SAMPLE_STEPS.find((s) => s.id === step.id);
                    return (
                      <div key={idx} className="auto-step-item">
                        <span className="auto-step-num">{idx + 1}</span>
                        <span className="auto-step-icon">{meta?.icon ?? "⚙️"}</span>
                        <span className="auto-step-name">{meta?.label ?? step.action}</span>
                        <span className="auto-step-connector">{step.connector}</span>
                      </div>
                    );
                  })}
                  {(selectedAuto.steps as unknown[]).length === 0 && (
                    <div style={{ color: "var(--text-dim)", fontFamily: "'Space Mono',monospace", fontSize: 11 }}>No steps configured</div>
                  )}
                </div>
              </div>

              {/* Run History */}
              <div className="auto-section">
                <div className="auto-section-title">Run History</div>
                {runsLoading ? (
                  <div className="skeleton" style={{ height: 80, width: "100%", borderRadius: 4 }} />
                ) : runs.length === 0 ? (
                  <div style={{ color: "var(--text-dim)", fontFamily: "'Space Mono',monospace", fontSize: 11 }}>No runs yet</div>
                ) : (
                  <table className="auto-runs-table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Started</th>
                        <th>Duration</th>
                        <th>Credits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runs.slice(0, 10).map((r) => {
                        const duration = r.completedAt
                          ? `${Math.round((new Date(r.completedAt).getTime() - new Date(r.startedAt).getTime()) / 1000)}s`
                          : "—";
                        return (
                          <tr key={r.id}>
                            <td style={{ color: STATUS_COLOR[r.status] ?? "var(--text-dim)" }}>● {r.status}</td>
                            <td>{formatDate(r.startedAt)}</td>
                            <td>{duration}</td>
                            <td>{r.creditsUsed}</td>
                          </tr>
                        );
                      })}
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
        <div className="auto-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="auto-modal">
            <div className="auto-modal-header">
              <div className="auto-modal-title">Create Automation</div>
              <button className="auto-modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="auto-modal-body">
              {error && <div className="auto-error">{error}</div>}

              <div>
                <div className="auto-field-label">Workflow Name *</div>
                <input className="auto-input" placeholder="e.g. Send WhatsApp on certificate earned" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>

              <div>
                <div className="auto-field-label">Description</div>
                <input className="auto-input" placeholder="What does this automation do?" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>

              <div>
                <div className="auto-field-label">Trigger Type *</div>
                <div className="auto-trigger-grid">
                  {TRIGGER_TYPES.map((t) => (
                    <div
                      key={t.value}
                      className={`auto-trigger-opt ${form.triggerType === t.value ? "selected" : ""}`}
                      onClick={() => setForm((f) => ({ ...f, triggerType: t.value }))}
                    >
                      <div className="auto-trigger-opt-icon">{t.icon}</div>
                      <div className="auto-trigger-opt-label">{t.label}</div>
                      <div className="auto-trigger-opt-desc">{t.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {form.triggerType === "schedule" && (
                <div>
                  <div className="auto-field-label">Cron Expression</div>
                  <input className="auto-input" value={form.cronExpr} onChange={(e) => setForm((f) => ({ ...f, cronExpr: e.target.value }))} placeholder="0 9 * * 1-5" />
                  <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "var(--text-dim)", marginTop: 4 }}>
                    Examples: "0 9 * * 1-5" (weekdays 9am) · "0 */6 * * *" (every 6h)
                  </div>
                </div>
              )}

              {form.triggerType === "loop" && (
                <div>
                  <div className="auto-field-label">Loop Event</div>
                  <select className="auto-input" value={form.loopEvent} onChange={(e) => setForm((f) => ({ ...f, loopEvent: e.target.value }))}>
                    {LOOP_EVENTS.map((e) => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              )}

              <div>
                <div className="auto-field-label">Add Steps</div>
                <div className="auto-steps-grid">
                  {SAMPLE_STEPS.map((s) => (
                    <div
                      key={s.id}
                      className={`auto-step-opt ${form.selectedSteps.includes(s.id) ? "selected" : ""}`}
                      onClick={() => toggleStep(s.id)}
                    >
                      <span className="auto-step-opt-icon">{s.icon}</span>
                      <span className="auto-step-opt-label">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="auto-modal-footer">
              <button className="auto-cancel-btn" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="auto-save-btn" onClick={handleCreate} disabled={saving}>
                {saving ? "Creating…" : "Create Automation"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AssistantPanel
        assistant="nexus"
        context="Winners Cloud automation builder. Help the developer configure triggers (webhooks, schedules, ecosystem events, Agentic Loop milestones), add action steps (WhatsApp messages, M-Pesa payments, email, Slack, AI analysis, CRM updates), and understand workflow execution, retry logic, and credit costs."
      />
    </div>
  );
}
