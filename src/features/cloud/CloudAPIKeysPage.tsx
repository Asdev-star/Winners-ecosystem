// Phase 8 — Winners Cloud — CloudAPIKeysPage.tsx
// NEXUS Supervisor · API Key Management
// Generate, scope, and revoke developer API keys

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../auth/authStore";
import AssistantPanel from "../../components/ui/AssistantPanel";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  scopes: string[];
  rateLimitRpm: number;
  lastUsedAt: string | null;
  expiresAt: string | null;
  revoked: boolean;
  createdAt: string;
  rawKey?: string;
}

const AVAILABLE_SCOPES = [
  { id: "keys:read",        label: "Read API Keys",        icon: "🔑", group: "Keys" },
  { id: "keys:write",       label: "Manage API Keys",      icon: "🔑", group: "Keys" },
  { id: "connectors:read",  label: "Read Connectors",      icon: "🔌", group: "Connectors" },
  { id: "connectors:write", label: "Install Connectors",   icon: "🔌", group: "Connectors" },
  { id: "automations:read", label: "Read Automations",     icon: "⚡", group: "Automations" },
  { id: "automations:write", label: "Manage Automations", icon: "⚡", group: "Automations" },
  { id: "agents:read",      label: "Read Agents",          icon: "🤖", group: "Agents" },
  { id: "agents:write",     label: "Manage Agents",        icon: "🤖", group: "Agents" },
  { id: "webhooks:read",    label: "Read Webhooks",        icon: "🪝", group: "Webhooks" },
  { id: "webhooks:write",   label: "Manage Webhooks",      icon: "🪝", group: "Webhooks" },
  { id: "usage:read",       label: "Read Usage Logs",      icon: "📊", group: "Usage" },
  { id: "community:read",   label: "Read Community Data",  icon: "🧑‍🤝‍🧑", group: "Platform" },
  { id: "academy:read",     label: "Read Academy Data",    icon: "🎓", group: "Platform" },
  { id: "work:read",        label: "Read Work Data",       icon: "💼", group: "Platform" },
  { id: "market:read",      label: "Read Market Data",     icon: "🛒", group: "Platform" },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function CloudAPIKeysPage() {
  const token = useAuthStore((s) => s.token);

  const [keys, setKeys]             = useState<ApiKey[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKey, setNewKey]         = useState<ApiKey | null>(null);
  const [copied, setCopied]         = useState(false);

  const [form, setForm] = useState({
    name: "",
    selectedScopes: [] as string[],
    rateLimitRpm: 60,
    expiresAt: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/cloud/keys`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch {
      // non-blocking
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const toggleScope = (scopeId: string) => {
    setForm((f) => ({
      ...f,
      selectedScopes: f.selectedScopes.includes(scopeId)
        ? f.selectedScopes.filter((s) => s !== scopeId)
        : [...f.selectedScopes, scopeId],
    }));
  };

  const selectAllScopes = () => {
    setForm((f) => ({
      ...f,
      selectedScopes: AVAILABLE_SCOPES.map((s) => s.id),
    }));
  };

  const clearScopes = () => {
    setForm((f) => ({ ...f, selectedScopes: [] }));
  };

  const handleCreate = async () => {
    if (!form.name.trim()) { setError("Key name is required"); return; }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/cloud/keys`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          name:         form.name,
          scopes:       form.selectedScopes,
          rateLimitRpm: form.rateLimitRpm,
          expiresAt:    form.expiresAt || null,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to create API key");
      } else {
        const data = await res.json();
        setNewKey(data.key);
        setShowCreate(false);
        setForm({ name: "", selectedScopes: [], rateLimitRpm: 60, expiresAt: "" });
        await fetchKeys();
      }
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await fetch(`${API}/cloud/keys/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchKeys();
    } catch {
      // non-blocking
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeKeys  = keys.filter((k) => !k.revoked);
  const revokedKeys = keys.filter((k) => k.revoked);

  return (
    <div style={{ padding: "32px 28px", maxWidth: 960, margin: "0 auto" }}>
      <style>{`
        .keys-ctx-bar { display:flex; gap:8px; marginBottom:22px; flexWrap:wrap; }
        .ctx-badge { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:0.08em; padding:4px 10px; border-radius:3px; border:1px solid; }
        .ctx-badge.live   { background:rgba(45,212,160,0.08);  border-color:rgba(45,212,160,0.3);  color:var(--green); }
        .ctx-badge.active { background:rgba(155,111,255,0.15); border-color:var(--purple);         color:var(--purple); }
        .ctx-sep { color:var(--border); font-size:11px; display:flex; align-items:center; }

        .keys-header-row { display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:28px; }
        .keys-create-btn { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.08em; padding:8px 18px; border-radius:4px; background:var(--purple); color:#fff; border:none; cursor:pointer; transition:opacity 200ms; }
        .keys-create-btn:hover { opacity:0.85; }

        /* New Key Banner */
        .keys-new-banner { background:rgba(45,212,160,0.06); border:1px solid rgba(45,212,160,0.3); border-radius:6px; padding:20px 24px; margin-bottom:28px; position:relative; }
        .keys-new-banner::before { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:linear-gradient(90deg,var(--green),transparent); border-radius:6px 6px 0 0; }
        .keys-new-title { font-family:'Syne',sans-serif; font-size:13px; font-weight:700; color:var(--green); margin-bottom:6px; }
        .keys-new-warning { font-family:'Space Mono',monospace; font-size:10px; color:var(--text-dim); margin-bottom:14px; }
        .keys-new-key-row { display:flex; align-items:center; gap:10px; }
        .keys-new-key-val { font-family:'Space Mono',monospace; font-size:11px; color:var(--text); background:var(--surface3); border:1px solid var(--border); border-radius:4px; padding:10px 16px; flex:1; word-break:break-all; }
        .keys-copy-btn { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.08em; padding:8px 16px; border-radius:4px; background:var(--green); color:var(--bg); border:none; cursor:pointer; white-space:nowrap; }
        .keys-dismiss-btn { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; padding:8px 16px; border-radius:4px; background:transparent; border:1px solid var(--border); color:var(--text-dim); cursor:pointer; }

        /* Keys Table */
        .keys-section-title { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.1em; color:var(--text-dim); margin-bottom:12px; }
        .keys-table { width:100%; border-collapse:collapse; margin-bottom:32px; }
        .keys-table th { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-dim); padding:10px 14px; text-align:left; border-bottom:1px solid var(--border); background:var(--surface); }
        .keys-table td { padding:14px; border-bottom:1px solid rgba(30,50,72,0.4); vertical-align:middle; }
        .keys-table tr:last-child td { border-bottom:none; }
        .keys-table tr:hover td { background:rgba(30,50,72,0.2); }
        .keys-name { font-family:'Syne',sans-serif; font-size:13px; font-weight:600; color:var(--text); }
        .keys-prefix { font-family:'Space Mono',monospace; font-size:10px; color:var(--text-dim); margin-top:2px; }
        .keys-scope-tag { font-family:'Space Mono',monospace; font-size:8px; text-transform:uppercase; padding:2px 6px; border-radius:2px; background:rgba(43,95,142,0.15); border:1px solid rgba(43,95,142,0.3); color:var(--ice); margin:2px; display:inline-block; }
        .keys-scopes-overflow { font-family:'Space Mono',monospace; font-size:9px; color:var(--text-dim); }
        .keys-rpm { font-family:'Space Mono',monospace; font-size:10px; color:var(--text-dim); }
        .keys-date { font-family:'Space Mono',monospace; font-size:10px; color:var(--text-dim); }
        .keys-status-active  { font-family:'Space Mono',monospace; font-size:9px; color:var(--green); background:rgba(45,212,160,0.08); border:1px solid rgba(45,212,160,0.25); padding:3px 8px; border-radius:3px; }
        .keys-status-revoked { font-family:'Space Mono',monospace; font-size:9px; color:var(--red); background:rgba(224,90,78,0.08); border:1px solid rgba(224,90,78,0.25); padding:3px 8px; border-radius:3px; }
        .keys-revoke-btn { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.06em; padding:5px 12px; border-radius:3px; background:transparent; border:1px solid rgba(224,90,78,0.3); color:var(--red); cursor:pointer; transition:all 200ms; }
        .keys-revoke-btn:hover { background:rgba(224,90,78,0.1); border-color:var(--red); }

        /* Modal */
        .keys-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:200; display:flex; align-items:center; justify-content:center; padding:20px; }
        .keys-modal { background:var(--surface); border:1px solid var(--border); border-radius:8px; width:100%; max-width:580px; max-height:90vh; overflow-y:auto; }
        .keys-modal-header { padding:20px 24px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; position:sticky; top:0; background:var(--surface); z-index:1; }
        .keys-modal-title { font-family:'Syne',sans-serif; font-size:16px; font-weight:700; color:var(--text); }
        .keys-modal-close { background:transparent; border:none; color:var(--text-dim); font-size:18px; cursor:pointer; }
        .keys-modal-body { padding:24px; display:flex; flex-direction:column; gap:20px; }
        .keys-field-label { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; letter-spacing:0.08em; color:var(--text-dim); margin-bottom:6px; }
        .keys-input { width:100%; background:var(--surface2); border:1px solid var(--border); border-radius:4px; padding:10px 14px; font-family:'Syne',sans-serif; font-size:13px; color:var(--text); outline:none; box-sizing:border-box; }
        .keys-input:focus { border-color:var(--purple); }
        .keys-input::placeholder { color:var(--text-dim); }
        .keys-scopes-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:10px; }
        .keys-scopes-actions { display:flex; gap:8px; }
        .keys-scope-action-btn { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase; padding:4px 10px; border-radius:3px; background:transparent; border:1px solid var(--border); color:var(--text-dim); cursor:pointer; }
        .keys-scope-action-btn:hover { border-color:var(--purple); color:var(--purple); }
        .keys-scopes-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; }
        .keys-scope-opt { padding:8px 12px; background:var(--surface2); border:1px solid var(--border); border-radius:4px; cursor:pointer; transition:all 200ms; display:flex; align-items:center; gap:8px; }
        .keys-scope-opt.selected { border-color:var(--ice); background:rgba(137,196,225,0.08); }
        .keys-scope-opt-icon { font-size:13px; flex-shrink:0; }
        .keys-scope-opt-label { font-family:'Space Mono',monospace; font-size:9px; color:var(--text); }
        .keys-rpm-row { display:flex; align-items:center; gap:12px; }
        .keys-rpm-row input { width:90px; }
        .keys-rpm-hint { font-family:'Space Mono',monospace; font-size:9px; color:var(--text-dim); }
        .keys-error { font-family:'Space Mono',monospace; font-size:10px; color:var(--red); padding:8px 12px; background:rgba(224,90,78,0.08); border:1px solid rgba(224,90,78,0.25); border-radius:4px; }
        .keys-modal-footer { padding:16px 24px; border-top:1px solid var(--border); display:flex; justify-content:flex-end; gap:10px; position:sticky; bottom:0; background:var(--surface); }
        .keys-cancel-btn { font-family:'Space Mono',monospace; font-size:10px; text-transform:uppercase; padding:8px 18px; border-radius:4px; background:transparent; border:1px solid var(--border); color:var(--text-dim); cursor:pointer; }
        .keys-save-btn { font-family:'Space Mono',monospace; font-size:10px; text-transform:uppercase; padding:8px 18px; border-radius:4px; background:var(--purple); color:#fff; border:none; cursor:pointer; }
        .keys-save-btn:disabled { opacity:0.5; cursor:not-allowed; }

        .skeleton { background:linear-gradient(90deg,var(--surface2) 25%,var(--surface3) 50%,var(--surface2) 75%); background-size:200% 100%; animation:shimmer 1.5s infinite; border-radius:4px; }
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      `}</style>

      {/* Header */}
      <div className="keys-header-row">
        <div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 300, color: "var(--text)", margin: 0 }}>
            🔑 API <span style={{ color: "var(--purple)", fontStyle: "italic" }}>Keys</span>
          </h1>
          <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 10, color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>
            Scoped access · Rate-limited · SHA-256 hashed
          </div>
        </div>
        <button className="keys-create-btn" onClick={() => setShowCreate(true)}>+ Create API Key</button>
      </div>

      {/* Context Bar */}
      <div className="keys-ctx-bar">
        <span className="ctx-badge live">⬡ Core Engine</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge active">☁️ Cloud</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge active">🔑 API Keys</span>
      </div>

      {/* New Key Banner */}
      {newKey && (
        <div className="keys-new-banner">
          <div className="keys-new-title">✓ API Key Created — Copy It Now</div>
          <div className="keys-new-warning">
            This key will never be shown again. Store it securely — treat it like a password.
          </div>
          <div className="keys-new-key-row">
            <div className="keys-new-key-val">{newKey.rawKey}</div>
            <button className="keys-copy-btn" onClick={() => handleCopy(newKey.rawKey!)}>
              {copied ? "Copied ✓" : "Copy"}
            </button>
            <button className="keys-dismiss-btn" onClick={() => setNewKey(null)}>Dismiss</button>
          </div>
        </div>
      )}

      {/* Active Keys */}
      <div className="keys-section-title">Active Keys ({activeKeys.length})</div>
      {loading ? (
        <div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{ padding: "14px 0", borderBottom: "1px solid var(--border)" }}>
              <div className="skeleton" style={{ height: 14, width: "30%", marginBottom: 8 }} />
              <div className="skeleton" style={{ height: 10, width: "60%" }} />
            </div>
          ))}
        </div>
      ) : activeKeys.length === 0 ? (
        <div style={{ padding: "40px 20px", textAlign: "center", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, marginBottom: 32, color: "var(--text-dim)", fontFamily: "'Syne',sans-serif", fontSize: 13 }}>
          No active API keys. Create your first key to start building.
        </div>
      ) : (
        <table className="keys-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Scopes</th>
              <th>Rate Limit</th>
              <th>Last Used</th>
              <th>Created</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {activeKeys.map((k) => (
              <tr key={k.id}>
                <td>
                  <div className="keys-name">{k.name}</div>
                  <div className="keys-prefix">{k.prefix}••••••••</div>
                </td>
                <td>
                  {k.scopes.length === 0 ? (
                    <span className="keys-scopes-overflow">All scopes</span>
                  ) : (
                    <>
                      {k.scopes.slice(0, 3).map((s) => (
                        <span key={s} className="keys-scope-tag">{s.split(":")[0]}</span>
                      ))}
                      {k.scopes.length > 3 && (
                        <span className="keys-scopes-overflow"> +{k.scopes.length - 3}</span>
                      )}
                    </>
                  )}
                </td>
                <td><span className="keys-rpm">{k.rateLimitRpm} rpm</span></td>
                <td><span className="keys-date">{k.lastUsedAt ? timeAgo(k.lastUsedAt) : "Never"}</span></td>
                <td><span className="keys-date">{formatDate(k.createdAt)}</span></td>
                <td><span className="keys-status-active">Active</span></td>
                <td>
                  <button className="keys-revoke-btn" onClick={() => handleRevoke(k.id)}>Revoke</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Revoked Keys */}
      {revokedKeys.length > 0 && (
        <>
          <div className="keys-section-title">Revoked Keys ({revokedKeys.length})</div>
          <table className="keys-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Prefix</th>
                <th>Created</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {revokedKeys.map((k) => (
                <tr key={k.id} style={{ opacity: 0.5 }}>
                  <td><div className="keys-name">{k.name}</div></td>
                  <td><span className="keys-prefix">{k.prefix}••••••••</span></td>
                  <td><span className="keys-date">{formatDate(k.createdAt)}</span></td>
                  <td><span className="keys-status-revoked">Revoked</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* SDK Quick Start */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 6, padding: "24px", marginTop: 8, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--purple), transparent)" }} />
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--purple)", marginBottom: 12 }}>Quick Start</div>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 12 }}>Using your API key</div>
        <pre style={{ fontFamily: "'Space Mono',monospace", fontSize: 11, color: "var(--ice)", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 4, padding: "14px 16px", overflowX: "auto", margin: 0 }}>{`// Install the SDK
npm install @winners/sdk

// Initialize
import { WinnersClient } from '@winners/sdk';
const winners = new WinnersClient({ apiKey: 'wn_live_...' });

// Call any platform API
const community = await winners.community.getPosts({ limit: 10 });
const academy   = await winners.academy.getCourses({ category: 'tech' });

// Trigger an automation
await winners.automations.trigger('automation_id', { data: {} });`}</pre>
      </div>

      {/* Create Modal */}
      {showCreate && (
        <div className="keys-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <div className="keys-modal">
            <div className="keys-modal-header">
              <div className="keys-modal-title">Create API Key</div>
              <button className="keys-modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <div className="keys-modal-body">
              {error && <div className="keys-error">{error}</div>}

              <div>
                <div className="keys-field-label">Key Name *</div>
                <input
                  className="keys-input"
                  placeholder="e.g. Production App, Development, CI/CD Pipeline"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>

              <div>
                <div className="keys-scopes-header">
                  <div className="keys-field-label" style={{ margin: 0 }}>Scopes</div>
                  <div className="keys-scopes-actions">
                    <button className="keys-scope-action-btn" onClick={selectAllScopes}>Select All</button>
                    <button className="keys-scope-action-btn" onClick={clearScopes}>Clear</button>
                  </div>
                </div>
                <div style={{ fontFamily: "'Space Mono',monospace", fontSize: 9, color: "var(--text-dim)", marginBottom: 10 }}>
                  Leave empty for full access. Restrict scopes for least-privilege security.
                </div>
                <div className="keys-scopes-grid">
                  {AVAILABLE_SCOPES.map((s) => (
                    <div
                      key={s.id}
                      className={`keys-scope-opt ${form.selectedScopes.includes(s.id) ? "selected" : ""}`}
                      onClick={() => toggleScope(s.id)}
                    >
                      <span className="keys-scope-opt-icon">{s.icon}</span>
                      <span className="keys-scope-opt-label">{s.id}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="keys-field-label">Rate Limit (requests per minute)</div>
                <div className="keys-rpm-row">
                  <input
                    type="number"
                    className="keys-input"
                    style={{ width: 90 }}
                    min={10}
                    max={10000}
                    value={form.rateLimitRpm}
                    onChange={(e) => setForm((f) => ({ ...f, rateLimitRpm: Number(e.target.value) }))}
                  />
                  <span className="keys-rpm-hint">rpm · default 60 · max 10,000</span>
                </div>
              </div>

              <div>
                <div className="keys-field-label">Expiry Date (optional)</div>
                <input
                  type="date"
                  className="keys-input"
                  value={form.expiresAt}
                  onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
                />
              </div>
            </div>
            <div className="keys-modal-footer">
              <button className="keys-cancel-btn" onClick={() => setShowCreate(false)}>Cancel</button>
              <button className="keys-save-btn" onClick={handleCreate} disabled={saving}>
                {saving ? "Creating…" : "Create Key"}
              </button>
            </div>
          </div>
        </div>
      )}

      <AssistantPanel
        assistant="nexus"
        page="cloud/keys"
        context={{ layer: "cloud", view: "api-keys", description: "API key management — scopes, rate limits, SHA-256 hashed, one-time reveal" }}
      />
    </div>
  );
}
