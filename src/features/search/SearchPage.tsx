// src/features/search/SearchPage.tsx

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";

const API = import.meta.env.VITE_API_URL ?? "";

const css = `
  .sp-root { padding: 28px 24px 80px; font-family: 'Syne', sans-serif; color: var(--text); max-width: 800px; }
  .sp-title { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; margin-bottom: 6px; }
  .sp-title span { color: var(--gold); }
  .sp-subtitle { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); margin-bottom: 24px; }

  .sp-search-wrap { position: relative; margin-bottom: 28px; }
  .sp-search-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); font-size: 16px; }
  .sp-input {
    width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 4px;
    padding: 14px 14px 14px 44px; font-family: 'Syne', sans-serif; font-size: 15px;
    color: var(--text); outline: none; transition: border-color 0.15s; box-sizing: border-box;
  }
  .sp-input:focus { border-color: var(--gold); box-shadow: 0 0 0 3px rgba(245,200,66,0.08); }
  .sp-input::placeholder { color: var(--text-dim); }

  .sp-filters { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
  .sp-filter {
    background: var(--surface); border: 1px solid var(--border); border-radius: 3px;
    padding: 6px 14px; font-family: 'Space Mono', monospace; font-size: 10px;
    color: var(--text-dim); cursor: pointer; transition: all 0.15s;
  }
  .sp-filter:hover { border-color: var(--gold); color: var(--gold); }
  .sp-filter.active { border-color: var(--gold); background: rgba(245,200,66,0.08); color: var(--gold); }

  .sp-section { margin-bottom: 28px; }
  .sp-section-label {
    font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 2px;
    text-transform: uppercase; color: var(--gold); margin-bottom: 12px;
    display: flex; align-items: center; gap: 10px;
  }
  .sp-section-label::after { content: ''; flex: 1; height: 1px; background: var(--border); }

  .sp-card { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; overflow: hidden; }
  .sp-item {
    display: flex; align-items: center; gap: 14px; padding: 14px 18px;
    border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.1s;
  }
  .sp-item:last-child { border-bottom: none; }
  .sp-item:hover { background: rgba(245,200,66,0.04); }

  .sp-item-icon {
    width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; font-size: 15px;
  }
  .sp-item-icon.member       { background: rgba(74,158,255,0.15);  color: #4A9EFF; }
  .sp-item-icon.revenue      { background: rgba(245,200,66,0.15);  color: var(--gold); }
  .sp-item-icon.notification { background: rgba(155,111,255,0.15); color: #9B6FFF; }

  .sp-item-title { font-size: 13px; font-weight: 600; }
  .sp-item-sub { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); margin-top: 2px; }
  .sp-item-right { margin-left: auto; text-align: right; }
  .sp-item-badge { font-family: 'Space Mono', monospace; font-size: 10px; padding: 2px 8px; border-radius: 2px; }
  .sp-item-badge.member       { background: rgba(74,158,255,0.1);  color: #4A9EFF; }
  .sp-item-badge.revenue      { background: rgba(245,200,66,0.1);  color: var(--gold); }
  .sp-item-badge.notification { background: rgba(155,111,255,0.1); color: #9B6FFF; }
  .sp-item-date { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); margin-top: 3px; }

  .sp-highlight { color: var(--gold); font-weight: 700; }
  .sp-empty { padding: 40px; text-align: center; font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); }
  .sp-loading { padding: 40px; text-align: center; font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); }
  .sp-count { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); margin-bottom: 20px; }

  @media (max-width: 600px) {
    .sp-root { padding: 16px 14px 80px; }
    .sp-item { padding: 12px 14px; gap: 10px; }
    .sp-item-icon { width: 30px; height: 30px; font-size: 13px; }
  }
`;

function highlight(text: string, q: string) {
  if (!q || !text) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="sp-highlight">{text.slice(idx, idx + q.length)}</span>
      {text.slice(idx + q.length)}
    </>
  );
}

function fmt(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function SearchPage() {
  const token        = useAuthStore((s) => s.token);
  const navigate     = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery]     = useState(searchParams.get("q") ?? "");
  const [filter, setFilter]   = useState("all");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const debounce              = { current: null as any };

  useEffect(() => {
    const id = "sp-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id; tag.textContent = css;
      document.head.appendChild(tag);
    }
  }, []);

  useEffect(() => {
    if (!query || query.length < 2) { setResults(null); return; }
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res  = await fetch(`${API}/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setResults(data);
        setSearchParams({ q: query });
      } catch { setResults(null); }
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const members       = filter === "all" || filter === "members"       ? (results?.members       ?? []) : [];
  const transactions  = filter === "all" || filter === "transactions"  ? (results?.transactions  ?? []) : [];
  const notifications = filter === "all" || filter === "notifications" ? (results?.notifications ?? []) : [];
  const total         = members.length + transactions.length + notifications.length;

  return (
    <div className="sp-root">
      <h1 className="sp-title">Search <span>Workspace</span></h1>
      <p className="sp-subtitle">Find team members, transactions and notifications</p>

      <div className="sp-search-wrap">
        <span className="sp-search-icon">🔍</span>
        <input
          className="sp-input"
          placeholder="Search everything…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      <div className="sp-filters">
        {["all", "members", "transactions", "notifications"].map((f) => (
          <div key={f} className={`sp-filter${filter === f ? " active" : ""}`} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </div>
        ))}
      </div>

      {loading && <div className="sp-loading">Searching…</div>}

      {!loading && results && total === 0 && (
        <div className="sp-empty">No results found for "{query}"</div>
      )}

      {!loading && results && total > 0 && (
        <div className="sp-count">{total} result{total !== 1 ? "s" : ""} for "{query}"</div>
      )}

      {/* Members */}
      {!loading && members.length > 0 && (
        <div className="sp-section">
          <div className="sp-section-label">Team Members</div>
          <div className="sp-card">
            {members.map((m: any) => (
              <div key={m.id} className="sp-item" onClick={() => navigate("/team")}>
                <div className="sp-item-icon member">👤</div>
                <div>
                  <div className="sp-item-title">{highlight(m.name, query)}</div>
                  <div className="sp-item-sub">{highlight(m.email, query)}</div>
                </div>
                <div className="sp-item-right">
                  <div className={`sp-item-badge member`}>{m.role}</div>
                  <div className="sp-item-date">{new Date(m.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transactions */}
      {!loading && transactions.length > 0 && (
        <div className="sp-section">
          <div className="sp-section-label">Transactions</div>
          <div className="sp-card">
            {transactions.map((t: any) => (
              <div key={t.id} className="sp-item" onClick={() => navigate("/stripe")}>
                <div className="sp-item-icon revenue">💰</div>
                <div>
                  <div className="sp-item-title">{fmt(t.amount)}</div>
                  <div className="sp-item-sub">{highlight(t.source ?? "—", query)}</div>
                </div>
                <div className="sp-item-right">
                  <div className="sp-item-badge revenue">revenue</div>
                  <div className="sp-item-date">{new Date(t.date).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notifications */}
      {!loading && notifications.length > 0 && (
        <div className="sp-section">
          <div className="sp-section-label">Notifications</div>
          <div className="sp-card">
            {notifications.map((n: any) => (
              <div key={n.id} className="sp-item" onClick={() => navigate("/notifications")}>
                <div className="sp-item-icon notification">🔔</div>
                <div>
                  <div className="sp-item-title">{highlight(n.title ?? "Notification", query)}</div>
                  <div className="sp-item-sub">{highlight(n.message ?? "", query)}</div>
                </div>
                <div className="sp-item-right">
                  <div className="sp-item-badge notification">alert</div>
                  <div className="sp-item-date">{new Date(n.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!query && (
        <div className="sp-empty">Start typing to search your workspace</div>
      )}
    </div>
  );
}