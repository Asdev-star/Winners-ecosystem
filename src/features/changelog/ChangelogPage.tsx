// src/features/changelog/ChangelogPage.tsx

import { useState, useEffect } from "react";
import { useAuthStore } from "../auth/authStore";
import { API_BASE } from "../../lib/api";

const API = API_BASE;
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .cl-root {
    padding: 32px 24px 80px;
    font-family: 'Syne', sans-serif;
    color: #E8EEF5;
    max-width: 760px;
  }

  .cl-title { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 4px; }
  .cl-title span { color: #C9A84C; }
  .cl-subtitle { font-family: 'Space Mono', monospace; font-size: 11px; color: #5A7A96; margin-bottom: 32px; }

  /* ── Admin bar ── */
  .cl-admin-bar {
    background: linear-gradient(135deg, #0f1923 0%, #0D1520 100%);
    border: 1px solid rgba(201,168,76,0.2);
    border-radius: 16px; padding: 20px 22px; margin-bottom: 28px;
    position: relative; overflow: hidden;
  }
  .cl-admin-bar::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, #C9A84C, transparent);
  }
  .cl-admin-bar-title { font-size: 13px; font-weight: 700; margin-bottom: 14px; color: #C9A84C; }

  .cl-form-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
  .cl-input {
    background: rgba(137,196,225,0.04); border: 1px solid #1E3248; border-radius: 8px;
    padding: 10px 13px; font-family: 'Space Mono', monospace; font-size: 12px; color: #E8EEF5;
    outline: none; flex: 1; min-width: 160px; transition: border-color 0.15s, box-shadow 0.15s;
    box-sizing: border-box;
  }
  .cl-input:focus { border-color: rgba(201,168,76,0.5); box-shadow: 0 0 0 3px rgba(201,168,76,0.07); }
  .cl-input::placeholder { color: #2E3D4F; }

  .cl-textarea {
    background: rgba(137,196,225,0.04); border: 1px solid #1E3248; border-radius: 8px;
    padding: 10px 13px; font-family: 'Space Mono', monospace; font-size: 12px; color: #E8EEF5;
    outline: none; width: 100%; resize: vertical; min-height: 80px;
    box-sizing: border-box; margin-bottom: 10px;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .cl-textarea:focus { border-color: rgba(201,168,76,0.5); box-shadow: 0 0 0 3px rgba(201,168,76,0.07); }
  .cl-textarea::placeholder { color: #2E3D4F; }

  .cl-select {
    background: rgba(137,196,225,0.04); border: 1px solid #1E3248; border-radius: 8px;
    padding: 10px 13px; font-family: 'Space Mono', monospace; font-size: 11px; color: #E8EEF5;
    outline: none; transition: border-color 0.15s; cursor: pointer;
  }
  .cl-select:focus { border-color: rgba(201,168,76,0.5); }
  option { background: #111D2E; }

  .cl-submit-btn {
    background: #C9A84C; color: #0D1520; border: none; border-radius: 8px;
    padding: 10px 22px; font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700;
    cursor: pointer; transition: all 0.15s;
  }
  .cl-submit-btn:hover:not(:disabled) { background: #E8C97A; transform: translateY(-1px); }
  .cl-submit-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .cl-cancel-btn {
    background: transparent; border: 1px solid #1E3248; border-radius: 8px;
    padding: 9px 16px; font-family: 'Space Mono', monospace; font-size: 10px; color: #5A7A96;
    cursor: pointer; transition: all 0.15s;
  }
  .cl-cancel-btn:hover { border-color: #89C4E1; color: #89C4E1; }

  .cl-published-label {
    font-family: 'Space Mono', monospace; font-size: 10px; color: #5A7A96;
    display: flex; align-items: center; gap: 6px; cursor: pointer;
  }
  .cl-published-label input { accent-color: #C9A84C; }

  .cl-success {
    background: rgba(74,222,128,0.08); border: 1px solid rgba(74,222,128,0.2);
    border-radius: 8px; padding: 10px 14px; font-family: 'Space Mono', monospace;
    font-size: 11px; color: #4ade80; margin-bottom: 14px;
  }

  /* ── Filter tabs ── */
  .cl-filters { display: flex; gap: 6px; margin-bottom: 28px; flex-wrap: wrap; }
  .cl-filter {
    background: #111D2E; border: 1px solid #1E3248; border-radius: 8px;
    padding: 7px 14px; font-family: 'Space Mono', monospace; font-size: 10px;
    color: #5A7A96; cursor: pointer; transition: all 0.15s;
  }
  .cl-filter:hover { border-color: rgba(201,168,76,0.3); color: #C9A84C; }
  .cl-filter.active { border-color: rgba(201,168,76,0.4); background: rgba(201,168,76,0.08); color: #C9A84C; }

  /* ── Timeline ── */
  .cl-timeline { position: relative; padding-left: 26px; }
  .cl-timeline::before {
    content: ''; position: absolute; left: 7px; top: 0; bottom: 0;
    width: 1px; background: #1E3248;
  }

  .cl-entry { position: relative; margin-bottom: 24px; }
  .cl-entry-dot {
    position: absolute; left: -22px; top: 14px;
    width: 10px; height: 10px; border-radius: 50%;
    border: 2px solid #0D1520; flex-shrink: 0;
  }
  .cl-entry-dot.FEATURE     { background: #C9A84C; box-shadow: 0 0 8px rgba(201,168,76,0.4); }
  .cl-entry-dot.BUGFIX      { background: #f87171; box-shadow: 0 0 8px rgba(248,113,113,0.3); }
  .cl-entry-dot.IMPROVEMENT { background: #89C4E1; box-shadow: 0 0 8px rgba(137,196,225,0.3); }
  .cl-entry-dot.COMING_SOON { background: #a78bfa; box-shadow: 0 0 8px rgba(167,139,250,0.3); }

  .cl-entry-card {
    background: linear-gradient(135deg, #0f1923 0%, #0D1520 100%);
    border: 1px solid rgba(137,196,225,0.1); border-radius: 14px; padding: 18px 20px;
    transition: border-color 0.2s;
  }
  .cl-entry-card:hover { border-color: rgba(201,168,76,0.2); }

  .cl-entry-header { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
  .cl-entry-badge { font-family: 'Space Mono', monospace; font-size: 9px; padding: 3px 8px; border-radius: 6px; flex-shrink: 0; margin-top: 2px; }
  .cl-entry-badge.FEATURE     { background: rgba(201,168,76,0.12); color: #C9A84C; border: 1px solid rgba(201,168,76,0.2); }
  .cl-entry-badge.BUGFIX      { background: rgba(248,113,113,0.12); color: #f87171; border: 1px solid rgba(248,113,113,0.2); }
  .cl-entry-badge.IMPROVEMENT { background: rgba(137,196,225,0.12); color: #89C4E1; border: 1px solid rgba(137,196,225,0.2); }
  .cl-entry-badge.COMING_SOON { background: rgba(167,139,250,0.12); color: #a78bfa; border: 1px solid rgba(167,139,250,0.2); }

  .cl-entry-title { font-size: 14px; font-weight: 700; flex: 1; color: #E8EEF5; }
  .cl-entry-version {
    font-family: 'Space Mono', monospace; font-size: 9px; color: #5A7A96;
    padding: 2px 7px; border: 1px solid #1E3248; border-radius: 6px;
    flex-shrink: 0; margin-top: 2px;
  }
  .cl-entry-desc { font-family: 'Space Mono', monospace; font-size: 11px; color: #5A7A96; line-height: 1.7; margin-bottom: 12px; white-space: pre-wrap; }
  .cl-entry-footer { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
  .cl-entry-date { font-family: 'Space Mono', monospace; font-size: 10px; color: #3A5470; }

  .cl-entry-actions { display: flex; gap: 6px; }
  .cl-action-btn {
    background: transparent; border: 1px solid #1E3248; border-radius: 6px;
    padding: 4px 10px; font-family: 'Space Mono', monospace; font-size: 9px;
    color: #5A7A96; cursor: pointer; transition: all 0.15s;
  }
  .cl-action-btn:hover { border-color: #89C4E1; color: #89C4E1; }
  .cl-action-btn.danger:hover { border-color: #f87171; color: #f87171; }

  .cl-unpublished { opacity: 0.55; }
  .cl-draft-tag {
    font-family: 'Space Mono', monospace; font-size: 9px; color: #5A7A96;
    background: rgba(137,196,225,0.06); border: 1px solid #1E3248;
    border-radius: 5px; padding: 1px 7px; margin-left: 8px;
  }

  .cl-empty { padding: 48px; text-align: center; font-family: 'Space Mono', monospace; font-size: 11px; color: #5A7A96; }
  .cl-loading { padding: 40px; text-align: center; }
  .cl-spinner { width: 24px; height: 24px; border: 2px solid rgba(201,168,76,0.15); border-top-color: #C9A84C; border-radius: 50%; animation: cl-spin 0.8s linear infinite; margin: 0 auto 10px; }
  .cl-loading-text { font-family: 'Space Mono', monospace; font-size: 11px; color: #5A7A96; }

  @keyframes cl-spin { to { transform: rotate(360deg); } }

  @media (max-width: 600px) {
    .cl-root { padding: 16px 14px 80px; }
    .cl-timeline { padding-left: 20px; }
    .cl-entry-dot { left: -17px; }
  }
`;

if (typeof document !== "undefined" && !document.getElementById("cl-styles")) {
  const tag = document.createElement("style");
  tag.id = "cl-styles"; tag.textContent = css;
  document.head.appendChild(tag);
}

const TYPE_LABELS: Record<string, string> = {
  FEATURE:     "✨ New Feature",
  BUGFIX:      "🐛 Bug Fix",
  IMPROVEMENT: "⚡ Improvement",
  COMING_SOON: "🔮 Coming Soon",
};

const TYPE_OPTIONS = ["FEATURE", "IMPROVEMENT", "BUGFIX", "COMING_SOON"];

export default function ChangelogPage() {
  const token   = useAuthStore((s) => s.token);
  const user    = useAuthStore((s) => s.user);
  // Admin form visible to owners/admins — protected further by requireSuperAdmin on backend
  const isAdmin = user?.role === "owner" || user?.role === "admin";

  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState("ALL");
  const [success, setSuccess] = useState("");
  const [editId, setEditId]   = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "", description: "", type: "FEATURE", version: "", published: true,
  });

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/changelog/all`, { headers });
      const data = res.ok
        ? await res.json()
        : await fetch(`${API}/changelog`, { headers }).then((r) => r.json());
      setEntries(Array.isArray(data) ? data : []);
    } catch { setEntries([]); }
    finally  { setLoading(false); }
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

  const cancelEdit = () => {
    setEditId(null);
    setForm({ title: "", description: "", type: "FEATURE", version: "", published: true });
  };

  const filtered = filter === "ALL" ? entries : entries.filter((e) => e.type === filter);

  return (
    <div className="cl-root">
      <h1 className="cl-title">What's <span>New</span></h1>
      <p className="cl-subtitle">Latest updates, improvements and features in Winners Ecosystem</p>

      {/* Admin form */}
      {isAdmin && (
        <div className="cl-admin-bar">
          <div className="cl-admin-bar-title">🛡️ {editId ? "Edit Entry" : "Post Update"}</div>
          {success && <div className="cl-success">✓ {success}</div>}

          <div className="cl-form-row">
            <input
              className="cl-input" placeholder="Title…" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <input
              className="cl-input" placeholder="v2.1.0" value={form.version}
              style={{ maxWidth: 120 }}
              onChange={(e) => setForm({ ...form, version: e.target.value })}
            />
            <select
              className="cl-select" value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
            >
              {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
            </select>
          </div>

          <textarea
            className="cl-textarea" placeholder="Description… (supports line breaks)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button className="cl-submit-btn" onClick={submit} disabled={!form.title || !form.description}>
              {editId ? "Update Entry" : "Publish"}
            </button>
            <label className="cl-published-label">
              <input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} />
              Published
            </label>
            {editId && (
              <button className="cl-cancel-btn" onClick={cancelEdit}>Cancel</button>
            )}
          </div>
        </div>
      )}

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
        <div className="cl-loading">
          <div className="cl-spinner" />
          <div className="cl-loading-text">Loading changelog…</div>
        </div>
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
                    {!entry.published && <span className="cl-draft-tag">Draft</span>}
                  </span>
                  {entry.version && <span className="cl-entry-version">{entry.version}</span>}
                </div>
                <div className="cl-entry-desc">{entry.description}</div>
                <div className="cl-entry-footer">
                  <span className="cl-entry-date">
                    {new Date(entry.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </span>
                  {isAdmin && (
                    <div className="cl-entry-actions">
                      <button className="cl-action-btn" onClick={() => startEdit(entry)}>Edit</button>
                      <button className="cl-action-btn danger" onClick={() => del(entry.id)}>Delete</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}