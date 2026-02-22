// src/features/changelog/ChangelogPage.tsx

import { useState, useEffect } from "react";
import { useAuthStore } from "../auth/authStore";

const API = import.meta.env.VITE_API_URL ?? "";

const css = `
  .cl-root { padding: 28px 24px 80px; font-family: 'Syne', sans-serif; color: var(--text); max-width: 760px; }
  .cl-title { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 4px; }
  .cl-title span { color: var(--gold); }
  .cl-subtitle { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); margin-bottom: 32px; }

  /* Admin bar */
  .cl-admin-bar { background: rgba(245,200,66,0.06); border: 1px solid rgba(245,200,66,0.2); border-radius: 6px; padding: 16px 20px; margin-bottom: 24px; }
  .cl-admin-bar-title { font-size: 13px; font-weight: 700; margin-bottom: 12px; color: var(--gold); }
  .cl-form-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
  .cl-input { background: var(--surface); border: 1px solid var(--border); border-radius: 3px; padding: 9px 12px; font-family: 'Syne', sans-serif; font-size: 12px; color: var(--text); outline: none; flex: 1; min-width: 160px; }
  .cl-input:focus { border-color: var(--gold); }
  .cl-input::placeholder { color: var(--text-dim); }
  .cl-textarea { background: var(--surface); border: 1px solid var(--border); border-radius: 3px; padding: 9px 12px; font-family: 'Syne', sans-serif; font-size: 12px; color: var(--text); outline: none; width: 100%; resize: vertical; min-height: 70px; box-sizing: border-box; margin-bottom: 8px; }
  .cl-textarea:focus { border-color: var(--gold); }
  .cl-textarea::placeholder { color: var(--text-dim); }
  .cl-select { background: var(--surface); border: 1px solid var(--border); border-radius: 3px; padding: 9px 12px; font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text); outline: none; }
  .cl-select:focus { border-color: var(--gold); }
  .cl-submit-btn { background: var(--gold); color: #080B10; border: none; border-radius: 3px; padding: 9px 20px; font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; cursor: pointer; transition: opacity 0.15s; }
  .cl-submit-btn:hover { opacity: 0.88; }
  .cl-submit-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Filter tabs */
  .cl-filters { display: flex; gap: 6px; margin-bottom: 24px; flex-wrap: wrap; }
  .cl-filter { background: var(--surface); border: 1px solid var(--border); border-radius: 3px; padding: 6px 14px; font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); cursor: pointer; transition: all 0.15s; }
  .cl-filter:hover { border-color: var(--gold); color: var(--gold); }
  .cl-filter.active { border-color: var(--gold); background: rgba(245,200,66,0.08); color: var(--gold); }

  /* Timeline */
  .cl-timeline { position: relative; padding-left: 24px; }
  .cl-timeline::before { content: ''; position: absolute; left: 7px; top: 0; bottom: 0; width: 1px; background: var(--border); }

  .cl-entry { position: relative; margin-bottom: 28px; }
  .cl-entry-dot { position: absolute; left: -21px; top: 6px; width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--bg); flex-shrink: 0; }
  .cl-entry-dot.FEATURE     { background: var(--gold); }
  .cl-entry-dot.BUGFIX      { background: #FF5975; }
  .cl-entry-dot.IMPROVEMENT { background: #4A9EFF; }
  .cl-entry-dot.COMING_SOON { background: #9B6FFF; }

  .cl-entry-card { background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 18px 20px; transition: border-color 0.15s; }
  .cl-entry-card:hover { border-color: rgba(245,200,66,0.3); }

  .cl-entry-header { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
  .cl-entry-badge { font-family: 'Space Mono', monospace; font-size: 9px; padding: 2px 8px; border-radius: 2px; flex-shrink: 0; margin-top: 2px; }
  .cl-entry-badge.FEATURE     { background: rgba(245,200,66,0.12); color: var(--gold); border: 1px solid rgba(245,200,66,0.2); }
  .cl-entry-badge.BUGFIX      { background: rgba(255,89,117,0.12); color: #FF5975; border: 1px solid rgba(255,89,117,0.2); }
  .cl-entry-badge.IMPROVEMENT { background: rgba(74,158,255,0.12); color: #4A9EFF; border: 1px solid rgba(74,158,255,0.2); }
  .cl-entry-badge.COMING_SOON { background: rgba(155,111,255,0.12); color: #9B6FFF; border: 1px solid rgba(155,111,255,0.2); }

  .cl-entry-title { font-size: 14px; font-weight: 700; flex: 1; }
  .cl-entry-version { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); padding: 2px 7px; border: 1px solid var(--border); border-radius: 2px; flex-shrink: 0; margin-top: 2px; }
  .cl-entry-desc { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); line-height: 1.6; margin-bottom: 10px; white-space: pre-wrap; }
  .cl-entry-footer { display: flex; align-items: center; justify-content: space-between; }
  .cl-entry-date { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }
  .cl-entry-actions { display: flex; gap: 6px; }
  .cl-action-btn { background: transparent; border: 1px solid var(--border); border-radius: 2px; padding: 3px 9px; font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); cursor: pointer; transition: all 0.15s; }
  .cl-action-btn:hover { border-color: var(--gold); color: var(--gold); }
  .cl-action-btn.danger:hover { border-color: #FF5975; color: #FF5975; }

  .cl-unpublished { opacity: 0.5; }
  .cl-unpublished-tag { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); background: var(--surface2); border: 1px solid var(--border); border-radius: 2px; padding: 1px 6px; margin-left: 8px; }

  .cl-empty { padding: 48px; text-align: center; font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); }
  .cl-loading { padding: 40px; text-align: center; font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); }
  .cl-success { background: rgba(45,212,160,0.08); border: 1px solid rgba(45,212,160,0.2); border-radius: 4px; padding: 10px 14px; font-family: 'Space Mono', monospace; font-size: 11px; color: #2DD4A0; margin-bottom: 12px; }

  @media (max-width: 600px) {
    .cl-root { padding: 16px 14px 80px; }
    .cl-timeline { padding-left: 18px; }
  }
`;

if (typeof document !== "undefined" && !document.getElementById("cl-styles")) {
  const tag = document.createElement("style");
  tag.id = "cl-styles"; tag.textContent = css;
  document.head.appendChild(tag);
}

const TYPE_LABELS: Record<string, string> = {
  FEATURE: "✨ New Feature",
  BUGFIX: "🐛 Bug Fix",
  IMPROVEMENT: "⚡ Improvement",
  COMING_SOON: "🔮 Coming Soon",
};

const TYPE_OPTIONS = ["FEATURE", "IMPROVEMENT", "BUGFIX", "COMING_SOON"];

export default function ChangelogPage() {
  const token   = useAuthStore((s) => s.token);
  const user    = useAuthStore((s) => s.user);
  const isAdmin = true; // Admin form is protected by backend requireSuperAdmin.map((e) => e.trim().toLowerCase()).includes(user?.email?.toLowerCase() ?? "___");

  const [entries, setEntries]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState("ALL");
  const [success, setSuccess]   = useState("");
  const [editId, setEditId]     = useState<string | null>(null);

  const [form, setForm] = useState({ title: "", description: "", type: "FEATURE", version: "", published: true });

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      // Try admin endpoint first (gets unpublished too), fall back to public
      const res  = await fetch(`${API}/changelog/all`, { headers });
      const data = res.ok ? await res.json() : await fetch(`${API}/changelog`, { headers }).then((r) => r.json());
      setEntries(Array.isArray(data) ? data : []);
    } catch { setEntries([]); }
    finally { setLoading(false); }
  };

  const submit = async () => {
    if (!form.title || !form.description) return;
    try {
      if (editId) {
        await fetch(`${API}/changelog/${editId}`, { method: "PATCH", headers, body: JSON.stringify(form) });
        setSuccess("Entry updated!");
        setEditId(null);
      } else {
        await fetch(`${API}/changelog`, { method: "POST", headers, body: JSON.stringify(form) });
        setSuccess("Entry published!");
      }
      setForm({ title: "", description: "", type: "FEATURE", version: "", published: true });
      load();
      setTimeout(() => setSuccess(""), 3000);
    } catch {}
  };

  const del = async (id: string) => {
    if (!confirm("Delete this entry?")) return;
    await fetch(`${API}/changelog/${id}`, { method: "DELETE", headers });
    load();
  };

  const startEdit = (entry: any) => {
    setEditId(entry.id);
    setForm({ title: entry.title, description: entry.description, type: entry.type, version: entry.version ?? "", published: entry.published });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filtered = filter === "ALL" ? entries : entries.filter((e) => e.type === filter);

  return (
    <div className="cl-root">
      <h1 className="cl-title">What's <span>New</span></h1>
      <p className="cl-subtitle">Latest updates, improvements and features in Winners Ecosystem</p>

      {/* Admin form */}
      <div className="cl-admin-bar">
        <div className="cl-admin-bar-title">🛡️ {editId ? "Edit Entry" : "Post Update"}</div>
        {success && <div className="cl-success">✓ {success}</div>}
        <div className="cl-form-row">
          <input className="cl-input" placeholder="Title…" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="cl-input" placeholder="Version (e.g. v2.1)" style={{ maxWidth: 140 }} value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} />
          <select className="cl-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
          </select>
        </div>
        <textarea className="cl-textarea" placeholder="Description… (supports line breaks)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button className="cl-submit-btn" onClick={submit} disabled={!form.title || !form.description}>
            {editId ? "Update Entry" : "Publish"}
          </button>
          <label style={{ fontFamily: "Space Mono, monospace", fontSize: 11, color: "var(--text-dim)", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
            Published
          </label>
          {editId && (
            <button className="cl-action-btn" onClick={() => { setEditId(null); setForm({ title: "", description: "", type: "FEATURE", version: "", published: true }); }}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="cl-filters">
        {["ALL", ...TYPE_OPTIONS].map((f) => (
          <div key={f} className={`cl-filter${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>
            {f === "ALL" ? "All Updates" : TYPE_LABELS[f]}
          </div>
        ))}
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="cl-loading">Loading changelog…</div>
      ) : filtered.length === 0 ? (
        <div className="cl-empty">No entries yet. Post your first update above!</div>
      ) : (
        <div className="cl-timeline">
          {filtered.map((entry) => (
            <div key={entry.id} className={`cl-entry${!entry.published ? " cl-unpublished" : ""}`}>
              <div className={`cl-entry-dot ${entry.type}`} />
              <div className="cl-entry-card">
                <div className="cl-entry-header">
                  <span className={`cl-entry-badge ${entry.type}`}>{TYPE_LABELS[entry.type]}</span>
                  <span className="cl-entry-title">
                    {entry.title}
                    {!entry.published && <span className="cl-unpublished-tag">Draft</span>}
                  </span>
                  {entry.version && <span className="cl-entry-version">{entry.version}</span>}
                </div>
                <div className="cl-entry-desc">{entry.description}</div>
                <div className="cl-entry-footer">
                  <span className="cl-entry-date">{new Date(entry.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</span>
                  <div className="cl-entry-actions">
                    <button className="cl-action-btn" onClick={() => startEdit(entry)}>Edit</button>
                    <button className="cl-action-btn danger" onClick={() => del(entry.id)}>Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}