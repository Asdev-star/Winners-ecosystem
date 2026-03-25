// Phase 8 — Winners Cloud — CloudAgentsPage.tsx
// NEXUS Supervisor · AI Agents Builder
// Deploy autonomous OMEGA-class agents with goal-driven intelligence

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../auth/authStore";
import AssistantPanel from "../../components/ui/AssistantPanel";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

interface AgentRun {
  id: string;
  status: string;
  startedAt: string;
  completedAt: string | null;
  creditsUsed: number;
  result: string | null;
  approved: boolean | null;
}

interface AIAgent {
  id: string;
  name: string;
  description: string;
  goal: string;
  baseAssistant: string;
  tools: string[];
  schedule: string | null;
  triggerEvent: string | null;
  maxRuntime: number;
  maxCreditsPerRun: number;
  humanApprovalRequired: boolean;
  active: boolean;
  runCount: number;
  lastRunAt: string | null;
  createdAt: string;
  _count?: { runs: number };
}

const AVAILABLE_TOOLS = [
  { id: "web_search",       label: "Web Search",         icon: "🔍", desc: "Search the internet for current information" },
  { id: "send_email",       label: "Send Email",         icon: "📧", desc: "Compose and send emails via Resend" },
  { id: "send_whatsapp",    label: "WhatsApp Message",   icon: "💬", desc: "Send WhatsApp messages via Business API" },
  { id: "query_crm",        label: "Query CRM",          icon: "🏢", desc: "Read and update HubSpot/Salesforce records" },
  { id: "process_payment",  label: "Process Payment",    icon: "💳", desc: "Initiate M-Pesa, Flutterwave, or Stripe payments" },
  { id: "create_invoice",   label: "Create Invoice",     icon: "🧾", desc: "Generate and send invoices via Stripe" },
  { id: "update_crm",       label: "Update CRM",         icon: "✏️", desc: "Write new records or update existing ones" },
  { id: "read_database",    label: "Read Database",      icon: "🗄️", desc: "Query tenant data (read-only, scoped)" },
  { id: "write_database",   label: "Write Database",     icon: "💾", desc: "Insert or update records (human approval required)" },
  { id: "generate_content", label: "Generate Content",   icon: "✍️", desc: "Write reports, proposals, summaries with Claude" },
  { id: "analyze_data",     label: "Analyze Data",       icon: "📊", desc: "Statistical analysis and business intelligence" },
  { id: "schedule_meeting", label: "Schedule Meeting",   icon: "📅", desc: "Create Calendly or Google Calendar events" },
];

const BASE_ASSISTANTS = [
  { value: "omega",   label: "OMEGA",   icon: "🧠", desc: "Master orchestrator — cross-platform intelligence" },
  { value: "aria",    label: "ARIA",    icon: "⬡",  desc: "Core operations — billing, workspace, dashboard" },
  { value: "nexus",   label: "NEXUS",   icon: "☁️", desc: "Cloud & developer — API, SDK, integrations" },
  { value: "circuit", label: "CIRCUIT", icon: "💼", desc: "Work & contracts — job matching, proposals" },
  { value: "atlas",   label: "ATLAS",   icon: "🛒", desc: "Market intelligence — pricing, products, vendors" },
  { value: "sage",    label: "SAGE",    icon: "🎓", desc: "Academy tutor — learning paths, course content" },
];

const TRIGGER_EVENTS = [
  "loop.stage_advanced",
  "academy.certificate_issued",
  "community.skill_detected",
  "work.contract_completed",
  "market.sale_completed",
  "user.trust_score_changed",
];

const STATUS_COLOR: Record<string, string> = {
  success: "var(--green)",
  running: "var(--gold)",
  failed:  "var(--red)",
  pending: "var(--text-dim)",
  awaiting_approval: "var(--purple)",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function CloudAgentsPage() {
  const token = useAuthStore((s) => s.token);

  const [agents, setAgents]         = useState<AIAgent[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [runs, setRuns]             = useState<AgentRun[]>([]);
  const [runsLoading, setRunsLoading] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    goal: "",
    baseAssistant: "omega",
    selectedTools: [] as string[],
    maxCreditsPerRun: 100,
    humanApprovalRequired: true,
    triggerEvent: "",
    schedule: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/cloud/agents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
      }
    } catch {
      // non-blocking
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const fetchRuns = useCallback(async (agentId: string) => {
    setRunsLoading(true);
    try {
      const res = await fetch(`${API}/cloud/agents/${agentId}/runs`, {
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

  const toggleTool = (toolId: string) => {
    setForm((f) => ({
      ...f,
      selectedTools: f.selectedTools.includes(toolId)
        ? f.selectedTools.filter((t) => t !== toolId)
        : [...f.selectedTools, toolId],
    }));
  };

  const handleCreate = async () => {
    if (!form.name.trim()) { setError("Agent name is required"); return; }
    if (!form.goal.trim()) { setError("Agent goal is required"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/cloud/agents`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name:                 form.name,
          description:          form.description,
          goal:                 form.goal,
          baseAssistant:        form.baseAssistant,
          tools:                form.selectedTools,
          maxCreditsPerRun:     form.maxCreditsPerRun,
          humanApprovalRequired: form.humanApprovalRequired,
          triggerEvent:         form.triggerEvent || null,
          schedule:             form.schedule || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to create agent");
      } else {
        setShowCreate(false);
        setForm({ name: "", description: "", goal: "", baseAssistant: "omega", selectedTools: [], maxCreditsPerRun: 100, humanApprovalRequired: true, triggerEvent: "", schedule: "" });
        await fetchAgents();
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (a: AIAgent) => {
    try {
      await fetch(`${API}/cloud/agents/${a.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ active: !a.active }),
      });
      await fetchAgents();
    } catch {
      // non-blocking
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API}/cloud/agents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (selectedId === id) setSelectedId(null);
      await fetchAgents();
    } catch {
      // non-blocking
    }
  };

  const selectedAgent = agents.find((a) => a.id === selectedId);
  const assistantMeta = BASE_ASSISTANTS.find((b) => b.value === selectedAgent?.baseAssistant);

  return (
    <div style={{ padding: "32px 28px", maxWidth: 1200, margin: "0 auto" }}>
      <style>{`
        .agents-ctx-bar { display:flex; gap:8px; marginBottom:22px; flexWrap:wrap; }
        .ctx-badge { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:0.08em; padding:4px 10px; border-radius:3px; border:1px solid; }
        .ctx-badge.live    { background:rgba(45,212,160,0.08);  border-color:rgba(45,212,160,0.3);  color:var(--green); }
        .ctx-badge.active  { background:rgba(155,111,255,0.15); border-color:var(--purple);         color:var(--purple); }
        .ctx-sep { color:var(--border); font-size:11px; display:flex; align-items:center; }

        .agents-layout { display:grid; grid-template-columns:300px 1fr; gap:24px; align-items:start; }
        @media(max-width:900px) { .agents-layout { grid-template-columns:1fr; } }

        .agents-list-panel { background:var(--surface); border:1px solid var(--border); border-radius:6px; overflow:hidden; }
        .agents-list-header { padding:16px 20px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; }
        .agents-list-title { font-family:'Syne',sans-serif; font-size:13px; font-weight:700; color:var(--text); }
        .agents-create-btn { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.08em; padding:6px 14px; border-radius:3px; background:var(--purple); color:#fff; border:none; cursor:pointer; transition:opacity 200ms; }
        .agents-create-btn:hover { opacity:0.85; }

        .agents-item { padding:14px 20px; border-bottom:1px solid rgba(30,50,72,0.5); cursor:pointer; transition:background 200ms; }
        .agents-item:last-child { border-bottom:none; }
        .agents-item:hover { background:var(--surface2); }
        .agents-item.selected { background:rgba(155,111,255,0.08); border-left:3px solid var(--purple); padding-left:17px; }
        .agents-item-header { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
        .agents-item-name { font-family:'Syne',sans-serif; font-size:13px; font-weight:600; color:var(--text); }
        .agents-item-status { font-family:'Space Mono',monospace; font-size:8px; padding:2px 6px; border-radius:3px; }
        .agents-item-status.active   { background:rgba(45,212,160,0.1); color:var(--green); border:1px solid rgba(45,212,160,0.3); }
        .agents-item-status.inactive { background:rgba(90,122,150,0.1); color:var(--text-dim); border:1px solid var(--border); }
        .agents-item-assistant { font-family:'Space Mono',monospace; font-size:9px; color:var(--purple); }
        .agents-item-goal { font-family:'Syne',sans-serif; font-size:11px; color:var(--text-dim); line-height:1.4; margin-top:4px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }

        .agents-detail-panel { background:var(--surface); border:1px solid var(--border); border-radius:6px; overflow:hidden; }
        .agents-detail-header { padding:20px 24px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:flex-start; gap:12px; }
        .agents-detail-name { font-family:'Syne',sans-serif; font-size:16px; font-weight:700; color:var(--text); }
        .agents-detail-assistant { display:flex; align-items:center; gap:8px; margin-top:6px; }
        .agents-assistant-badge { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.08em; padding:3px 10px; border-radius:3px; background:rgba(155,111,255,0.1); border:1px solid rgba(155,111,255,0.3); color:var(--purple); }
        .agents-detail-actions { display:flex; gap:8px; flex-shrink:0; }
        .agents-btn { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.08em; padding:6px 12px; border-radius:3px; border:1px solid var(--border); background:transparent; color:var(--text-dim); cursor:pointer; transition:all 200ms; }
        .agents-btn:hover { border-color:var(--purple); color:var(--purple); }
        .agents-btn.danger:hover { border-color:var(--red); color:var(--red); }
        .agents-btn.toggle-on  { background:rgba(45,212,160,0.1); border-color:rgba(45,212,160,0.4); color:var(--green); }
        .agents-btn.toggle-off { background:rgba(90,122,150,0.08); border-color:var(--border); color:var(--text-dim); }

        .agents-section { padding:20px 24px; border-bottom:1px solid rgba(30,50,72,0.5); }
        .agents-section:last-child { border-bottom:none; }
        .agents-section-title { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.1em; color:var(--text-dim); margin-bottom:14px; }
        .agents-goal-text { font-family:'Syne',sans-serif; font-size:13px; color:var(--text-dim); line-height:1.6; background:var(--surface2); border:1px solid var(--border); border-radius:4px; padding:14px 16px; }

        .agents-tools-grid { display:flex; flex-wrap:wrap; gap:8px; }
        .agents-tool-tag { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.06em; padding:4px 10px; border-radius:3px; background:rgba(137,196,225,0.08); border:1px solid rgba(137,196,225,0.25); color:var(--ice); }

        .agents-config-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
        .agents-config-item { background:var(--surface2); border:1px solid var(--border); border-radius:4px; padding:12px; }
        .agents-config-label { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-dim); margin-bottom:6px; }
        .agents-config-value { font-family:'Syne',sans-serif; font-size:14px; font-weight:700; color:var(--text); }

        .agents-runs-table { width:100%; border-collapse:collapse; }
        .agents-runs-table th { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-dim); padding:8px 12px; text-align:left; border-bottom:1px solid var(--border); }
        .agents-runs-table td { padding:10px 12px; border-bottom:1px solid rgba(30,50,72,0.4); font-family:'Space Mono',monospace; font-size:10px; }
        .agents-runs-table tr:last-child td { border-bottom:none; }

        .agents-empty { text-align:center; padding:60px 20px; color:var(--text-dim); font-family:'Syne',sans-serif; font-size:14px; }
        .agents-empty-icon { font-size:40px; margin-bottom:12px; }

        /* Create Modal */
        .agents-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:200; display:flex; align-items:center; justify-content:center; padding:20px; }
        .agents-modal { background:var(--surface); border:1px solid var(--border); border-radius:8px; width:100%; max-width:640px; max-height:92vh; overflow-y:auto; }
        .agents-modal-header { padding:20px 24px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; background:var(--surface); z-index:1; }
        .agents-modal-title { font-family:'Syne',sans-serif; font-size:16px; font-weight:700; color:var(--text); }
        .agents-modal-close { background:transparent; border:none; color:var(--text-dim); font-size:18px; cursor:pointer; }
        .agents-modal-body { padding:24px; display:flex; flex-direction:column; gap:20px; }
        .agents-field-label { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-dim); margin-bottom:6px; }
        .agents-input { width:100%; background:var(--surface2); border:1px solid var(--border); border-radius:4px; padding:10px 14px; font-family:'Syne',sans-serif; font-size:13px; color:var(--text); outline:none; box-sizing:border-box; }
        .agents-input:focus { border-color:var(--purple); }
        .agents-input::placeholder { color:var(--text-dim); }
        .agents-textarea { min-height:80px; resize:vertical; }
        .agents-assistant-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; }
        .agents-assistant-opt { padding:10px 12px; background:var(--surface2); border:1px solid var(--border); border-radius:4px; cursor:pointer; transition:all 200ms; text-align:center; }
        .agents-assistant-opt.selected { border-color:var(--purple); background:rgba(155,111,255,0.08); }
        .agents-assistant-icon { font-size:18px; margin-bottom:4px; }
        .agents-assistant-name { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; color:var(--text); }
        .agents-tools-select { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .agents-tool-opt { padding:10px 12px; background:var(--surface2); border:1px solid var(--border); border-radius:4px; cursor:pointer; transition:all 200ms; display:flex; align-items:flex-start; gap:8px; }
        .agents-tool-opt.selected { border-color:var(--ice); background:rgba(137,196,225,0.08); }
        .agents-tool-opt-icon { font-size:14px; flex-shrink:0; margin-top:1px; }
        .agents-tool-opt-info { display:flex; flex-direction:column; gap:2px; }
        .agents-tool-opt-label { font-family:'Syne',sans-serif; font-size:11px; font-weight:600; color:var(--text); }
        .agents-tool-opt-desc { font-family:'Space Mono',monospace; font-size:8px; color:var(--text-dim); }
        .agents-approval-toggle { display:flex; align-items:center; gap:12px; padding:14px 16px; background:var(--surface2); border:1px solid var(--border); border-radius:4px; cursor:pointer; }
        .agents-approval-toggle.on { border-color:rgba(155,111,255,0.4); background:rgba(155,111,255,0.08); }
        .agents-approval-check { width:18px; height:18px; border-radius:3px; border:1px solid var(--border); background:var(--surface3); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .agents-approval-check.on { background:var(--purple); border-color:var(--purple); }
        .agents-approval-text { font-family:'Syne',sans-serif; font-size:12px; color:var(--text); }
        .agents-approval-sub { font-family:'Space Mono',monospace; font-size:9px; color:var(--text-dim); }
        .agents-credit-input { display:flex; align-items:center; gap:10px; }
        .agents-credit-input input { width:100px; }
        .agents-error { font-family:'Space Mono',monospace; font-size:10px; color:var(--red); padding:8px 12px; background:rgba(224,90,78,0.08); border:1px solid rgba(224,90,78,0.25); border-radius:4px; }
        .agents-modal-footer { padding:16px 24px; border-top:1px solid var(--border); display:flex; justify-content:flex-end; gap:10px; position:sticky; bottom:0; background:var(--surface); }
        .agents-cancel-btn { font-family:'Space Mono',monospace; font-size:10px; text-transform:uppercase; padding:8px 18px; border-radius:4px; background:transparent; border:1px solid var(--border); color:var(--text-dim); cursor:pointer; }
        .agents-save-btn { font-family:'Space Mono',monospace; font-size:10px; text-transform:uppercase; padding:8px 18px; border-radius:4px; background:var(--purple); color:#fff; border:none; cursor:pointer; }
        .agents-save-btn:disabled { opacity:0.5; cursor:not-allowed; }

        .skeleton { background:linear-gradient(90deg,var(--surface2) 25%,var(--surface3) 50%,var(--surface2) 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:4px; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: "var(--text)", margin: 0 }}>
          🤖 AI <span style={{ color: "var(--purple)", fontStyle: "italic" }}>Agents</span>
        </h1>
        <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>
          Deploy autonomous OMEGA-class agents · Goal-driven · Human-in-the-loop controls
        </div>
      </div>

      {/* Context Bar */}
      <div className="agents-ctx-bar">
        <span className="ctx-badge live">⬡ Core Engine</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge active">☁️ Cloud</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge active">🤖 AI Agents</span>
      </div>

      <div className="agents-layout">
        {/* Left — Agent List */}
        <div className="agents-list-panel">
          <div className="agents-list-header">
            <div className="agents-list-title">Agents ({agents.length})</div>
            <button className="agents-create-btn" onClick={() => setShowCreate(true)}>+ Deploy</button>
          </div>

          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ padding: "14px 20px", borderBottom: "1px solid rgba(30,50,72,0.5)" }}>
                <div className="skeleton" style={{ height: 14, width: "70%", marginBottom: 8 }} />
                <div className="skeleton" style={{ height: 10, width: "50%", marginBottom: 6 }} />
                <div className="skeleton" style={{ height: 10, width: "85%" }} />
              </div>
            ))
          ) : agents.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "var(--text-dim)", fontFamily: "'Syne',sans-serif", fontSize: 13 }}>
              No agents deployed yet.<br />Deploy your first AI agent.
            </div>
          ) : (
            agents.map((a) => (
              <div
                key={a.id}
                className={`agents-item ${selectedId === a.id ? "selected" : ""}`}
                onClick={() => handleSelect(a.id)}
              >
                <div className="agents-item-header">
                  <div className="agents-item-name">{a.name}</div>
                  <span className={`agents-item-status ${a.active ? "active" : "inactive"}`}>
                    {a.active ? "Active" : "Paused"}
                  </span>
                </div>
                <div className="agents-item-assistant">
                  {BASE_ASSISTANTS.find((b) => b.value === a.baseAssistant)?.icon} {a.baseAssistant.toUpperCase()} · {a.tools.length} tools
                </div>
                <div className="agents-item-goal">{a.goal}</div>
              </div>
            ))
          )}
        </div>

        {/* Right — Detail Panel */}
        <div className="agents-detail-panel">
          {!selectedAgent ? (
            <div className="agents-empty">
              <div className="agents-empty-icon">🤖</div>
              Select an agent or deploy a new one to see details
            </div>
          ) : (
            <>
              <div className="agents-detail-header">
                <div>
                  <div className="agents-detail-name">{selectedAgent.name}</div>
                  <div className="agents-detail-assistant">
                    <span className="agents-assistant-badge">
                      {assistantMeta?.icon} {selectedAgent.baseAssistant.toUpperCase()} Base
                    </span>
                    {selectedAgent.humanApprovalRequired && (
                      <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "var(--purple)", background: "rgba(155,111,255,0.08)", border: "1px solid rgba(155,111,255,0.25)", padding: "3px 8px", borderRadius: 3 }}>
                        ✋ Approval Required
                      </span>
                    )}
                  </div>
                </div>
                <div className="agents-detail-actions">
                  <button
                    className={`agents-btn ${selectedAgent.active ? "toggle-on" : "toggle-off"}`}
                    onClick={() => handleToggleActive(selectedAgent)}
                  >
                    {selectedAgent.active ? "● Active" : "○ Paused"}
                  </button>
                  <button className="agents-btn danger" onClick={() => handleDelete(selectedAgent.id)}>Delete</button>
                </div>
              </div>

              {/* Goal */}
              <div className="agents-section">
                <div className="agents-section-title">Agent Goal</div>
                <div className="agents-goal-text">{selectedAgent.goal}</div>
              </div>

              {/* Config */}
              <div className="agents-section">
                <div className="agents-section-title">Configuration</div>
                <div className="agents-config-grid">
                  <div className="agents-config-item">
                    <div className="agents-config-label">Max Credits / Run</div>
                    <div className="agents-config-value">{selectedAgent.maxCreditsPerRun}</div>
                  </div>
                  <div className="agents-config-item">
                    <div className="agents-config-label">Total Runs</div>
                    <div className="agents-config-value">{selectedAgent._count?.runs ?? selectedAgent.runCount}</div>
                  </div>
                  <div className="agents-config-item">
                    <div className="agents-config-label">Max Runtime</div>
                    <div className="agents-config-value">{selectedAgent.maxRuntime}s</div>
                  </div>
                </div>
              </div>

              {/* Tools */}
              <div className="agents-section">
                <div className="agents-section-title">Tools ({selectedAgent.tools.length})</div>
                <div className="agents-tools-grid">
                  {selectedAgent.tools.length === 0 ? (
                    <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "var(--text-dim)" }}>No tools assigned</span>
                  ) : (
                    selectedAgent.tools.map((t) => (
                      <span key={t} className="agents-tool-tag">
                        {AVAILABLE_TOOLS.find((at) => at.id === t)?.icon ?? "⚙️"} {t.replace(/_/g, " ")}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {/* Run History */}
              <div className="agents-section">
                <div className="agents-section-title">Run History</div>
                {runsLoading ? (
                  <div className="skeleton" style={{ height: 80, width: "100%", borderRadius: 4 }} />
                ) : runs.length === 0 ? (
                  <div style={{ color: "var(--text-dim)", fontFamily: "'Space Mono',monospace", fontSize: 11 }}>No runs yet</div>
                ) : (
                  <table className="agents-runs-table">
                    <thead>
                      <tr>
                        <th>Status</th>
                        <th>Started</th>
                        <th>Credits</th>
                        <th>Approval</th>
                      </tr>
                    </thead>
                    <tbody>
                      {runs.slice(0, 10).map((r) => (
                        <tr key={r.id}>
                          <td style={{ color: STATUS_COLOR[r.status] ?? "var(--text-dim)" }}>● {r.status}</td>
                          <td>{formatDate(r.startedAt)}</td>
                          <td>{r.creditsUsed}</td>
                          <td style={{ color: r.approved === true ? "var(--green)" : r.approved === false ? "var(--red)" : "var(--text-dim)" }}>
                            {r.approved === true ? "Approved" : r.approved === false ? "Rejected" : "—"}
                          </td>
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
        <div className="agents-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="agents-modal">
            <div className="agents-modal-header">
              <div className="agents-modal-title">Deploy AI Agent</div>
              <button className="agents-modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="agents-modal-body">
              {error && <div className="agents-error">{error}</div>}

              <div>
                <div className="agents-field-label">Agent Name *</div>
                <input className="agents-input" placeholder="e.g. Lead Follow-Up Agent" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>

              <div>
                <div className="agents-field-label">Description</div>
                <input className="agents-input" placeholder="Brief description for your team" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>

              <div>
                <div className="agents-field-label">Agent Goal *</div>
                <textarea
                  className="agents-input agents-textarea"
                  placeholder="Describe what this agent should accomplish. Be specific — e.g. 'When a new lead is added to HubSpot, research their LinkedIn, draft a personalised outreach email, and schedule a follow-up reminder.'"
                  value={form.goal}
                  onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
                />
              </div>

              <div>
                <div className="agents-field-label">Base Assistant</div>
                <div className="agents-assistant-grid">
                  {BASE_ASSISTANTS.map((b) => (
                    <div
                      key={b.value}
                      className={`agents-assistant-opt ${form.baseAssistant === b.value ? "selected" : ""}`}
                      onClick={() => setForm((f) => ({ ...f, baseAssistant: b.value }))}
                    >
                      <div className="agents-assistant-icon">{b.icon}</div>
                      <div className="agents-assistant-name">{b.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="agents-field-label">Tools</div>
                <div className="agents-tools-select">
                  {AVAILABLE_TOOLS.map((t) => (
                    <div
                      key={t.id}
                      className={`agents-tool-opt ${form.selectedTools.includes(t.id) ? "selected" : ""}`}
                      onClick={() => toggleTool(t.id)}
                    >
                      <span className="agents-tool-opt-icon">{t.icon}</span>
                      <div className="agents-tool-opt-info">
                        <span className="agents-tool-opt-label">{t.label}</span>
                        <span className="agents-tool-opt-desc">{t.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="agents-field-label">Max Credits Per Run</div>
                <div className="agents-credit-input">
                  <input
                    type="number"
                    className="agents-input"
                    style={{ width: 100 }}
                    min={10}
                    max={1000}
                    value={form.maxCreditsPerRun}
                    onChange={(e) => setForm((f) => ({ ...f, maxCreditsPerRun: Number(e.target.value) }))}
                  />
                  <span style={{ fontFamily: "'Space Mono',monospace", fontSize: 10, color: "var(--text-dim)" }}>
                    credits · ~${(form.maxCreditsPerRun * 0.001).toFixed(2)} max cost
                  </span>
                </div>
              </div>

              <div>
                <div className="agents-field-label">Trigger Event (optional)</div>
                <select className="agents-input" value={form.triggerEvent} onChange={(e) => setForm((f) => ({ ...f, triggerEvent: e.target.value }))}>
                  <option value="">Manual / API trigger only</option>
                  {TRIGGER_EVENTS.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>

              <div
                className={`agents-approval-toggle ${form.humanApprovalRequired ? "on" : ""}`}
                onClick={() => setForm((f) => ({ ...f, humanApprovalRequired: !f.humanApprovalRequired }))}
              >
                <div className={`agents-approval-check ${form.humanApprovalRequired ? "on" : ""}`}>
                  {form.humanApprovalRequired && <span style={{ color: "#fff", fontSize: 10 }}>✓</span>}
                </div>
                <div>
                  <div className="agents-approval-text">Require Human Approval</div>
                  <div className="agents-approval-sub">Agent will pause and notify you before executing high-impact actions</div>
                </div>
              </div>
            </div>
            <div className="agents-modal-footer">
              <button className="agents-cancel-btn" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="agents-save-btn" onClick={handleCreate} disabled={saving}>
                {saving ? "Deploying…" : "Deploy Agent"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AssistantPanel
        assistant="nexus"
        page="cloud/agents"
        context={{ layer: "cloud", view: "agents", description: "AI Agents builder — goal-driven autonomous agents with human-in-the-loop controls" }}
      />
    </div>
  );
}
