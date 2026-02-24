// src/features/search/GlobalSearch.tsx

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";
import { API_BASE } from "../../lib/api";

const API = API_BASE;
const css = `
  .gs-wrap { position: relative; }

  .gs-trigger {
    display: flex; align-items: center; gap: 8px;
    background: var(--surface2, #141B24); border: 1px solid var(--border, #1E2A38);
    border-radius: 4px; padding: 7px 12px; cursor: pointer;
    font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim, #5A6878);
    transition: all 0.15s; min-width: 180px;
  }
  .gs-trigger:hover { border-color: var(--gold, #F5C842); color: var(--text, #E8EDF2); }
  .gs-trigger-icon { font-size: 13px; }
  .gs-trigger-kbd {
    margin-left: auto; background: var(--surface, #0D1117); border: 1px solid var(--border, #1E2A38);
    border-radius: 2px; padding: 1px 5px; font-size: 9px;
  }

  .gs-modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.7);
    z-index: 1000; display: flex; align-items: flex-start; justify-content: center;
    padding-top: 80px;
  }

  .gs-modal {
    background: var(--surface, #0D1117); border: 1px solid var(--border, #1E2A38);
    border-radius: 8px; width: 100%; max-width: 580px; overflow: hidden;
    box-shadow: 0 24px 64px rgba(0,0,0,0.6);
    animation: gs-in 0.15s ease forwards;
  }

  .gs-input-wrap {
    display: flex; align-items: center; gap: 12px;
    padding: 16px 20px; border-bottom: 1px solid var(--border, #1E2A38);
  }
  .gs-input-icon { font-size: 16px; color: var(--text-dim, #5A6878); flex-shrink: 0; }
  .gs-input {
    flex: 1; background: transparent; border: none; outline: none;
    font-family: 'Syne', sans-serif; font-size: 15px; color: var(--text, #E8EDF2);
  }
  .gs-input::placeholder { color: var(--text-dim, #5A6878); }
  .gs-esc {
    font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim, #5A6878);
    background: var(--surface2, #141B24); border: 1px solid var(--border, #1E2A38);
    border-radius: 2px; padding: 2px 6px; cursor: pointer; flex-shrink: 0;
  }

  .gs-results { max-height: 400px; overflow-y: auto; }

  .gs-section-label {
    font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 2px;
    text-transform: uppercase; color: var(--text-dim, #5A6878);
    padding: 10px 20px 4px;
  }

  .gs-item {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 20px; cursor: pointer; transition: background 0.1s;
  }
  .gs-item:hover { background: rgba(245,200,66,0.06); }
  .gs-item.selected { background: rgba(245,200,66,0.08); }

  .gs-item-icon {
    width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center; font-size: 13px;
  }
  .gs-item-icon.member { background: rgba(74,158,255,0.15); color: #4A9EFF; }
  .gs-item-icon.revenue { background: rgba(245,200,66,0.15); color: var(--gold, #F5C842); }
  .gs-item-icon.notification { background: rgba(155,111,255,0.15); color: #9B6FFF; }

  .gs-item-title { font-size: 13px; font-weight: 600; }
  .gs-item-sub { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim, #5A6878); margin-top: 1px; }
  .gs-item-right { margin-left: auto; font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim, #5A6878); }

  .gs-empty { padding: 32px; text-align: center; font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim, #5A6878); }
  .gs-loading { padding: 24px; text-align: center; font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim, #5A6878); }

  .gs-footer {
    padding: 10px 20px; border-top: 1px solid var(--border, #1E2A38);
    display: flex; gap: 16px; align-items: center;
    font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim, #5A6878);
  }
  .gs-footer-key { background: var(--surface2, #141B24); border: 1px solid var(--border, #1E2A38); border-radius: 2px; padding: 1px 5px; margin-right: 4px; }

  .gs-highlight { color: var(--gold, #F5C842); font-weight: 700; }

  @keyframes gs-in { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }

  @media (max-width: 600px) {
    .gs-modal-overlay { padding-top: 16px; align-items: flex-start; }
    .gs-modal { max-width: 100%; margin: 0 8px; }
    .gs-trigger { min-width: unset; }
    .gs-trigger-kbd { display: none; }
  }
`;

interface SearchResults {
  members:       any[];
  transactions:  any[];
  notifications: any[];
}

function highlight(text: string, q: string) {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span className="gs-highlight">{text.slice(idx, idx + q.length)}</span>
      {text.slice(idx + q.length)}
    </>
  );
}

function fmt(n: number) {
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function GlobalSearch() {
  const token    = useAuthStore((s) => s.token);
  const navigate = useNavigate();

  const [open, setOpen]         = useState(false);
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState<SearchResults | null>(null);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<any>(null);

  // Inject styles
  useEffect(() => {
    const id = "gs-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id; tag.textContent = css;
      document.head.appendChild(tag);
    }
  }, []);

  // Keyboard shortcut Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 50); setQuery(""); setResults(null); setSelected(0); }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query || query.length < 2) { setResults(null); return; }
    clearTimeout(debounce.current);
    setLoading(true);
    debounce.current = setTimeout(async () => {
      try {
        const res  = await fetch(`${API}/search?q=${encodeURIComponent(query)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setResults(data);
        setSelected(0);
      } catch { setResults(null); }
      finally { setLoading(false); }
    }, 300);
  }, [query]);

  // Flatten results for keyboard nav
  const allItems = [
    ...(results?.members       ?? []).map((m: any) => ({ type: "member",       data: m })),
    ...(results?.transactions  ?? []).map((t: any) => ({ type: "revenue",      data: t })),
    ...(results?.notifications ?? []).map((n: any) => ({ type: "notification", data: n })),
  ];

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelected((s) => Math.min(s + 1, allItems.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === "Enter" && allItems[selected]) { handleSelect(allItems[selected]); }
  };

  const handleSelect = (item: any) => {
    setOpen(false);
    if (item.type === "member")       navigate("/team");
    if (item.type === "revenue")      navigate("/stripe");
    if (item.type === "notification") navigate("/notifications");
  };

  const hasResults = results && (results.members.length + results.transactions.length + results.notifications.length) > 0;
  let itemIndex    = 0;

  return (
    <div className="gs-wrap">
      <div className="gs-trigger" onClick={() => setOpen(true)}>
        <span className="gs-trigger-icon">🔍</span>
        Search…
        <span className="gs-trigger-kbd">⌘K</span>
      </div>

      {open && (
        <div className="gs-modal-overlay" onClick={() => setOpen(false)}>
          <div className="gs-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gs-input-wrap">
              <span className="gs-input-icon">🔍</span>
              <input
                ref={inputRef}
                className="gs-input"
                placeholder="Search members, transactions, notifications…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKey}
              />
              <span className="gs-esc" onClick={() => setOpen(false)}>ESC</span>
            </div>

            <div className="gs-results">
              {loading && <div className="gs-loading">Searching…</div>}

              {!loading && query.length >= 2 && !hasResults && (
                <div className="gs-empty">No results for "{query}"</div>
              )}

              {!loading && !query && (
                <div className="gs-empty">Type to search across your workspace</div>
              )}

              {/* Members */}
              {!loading && results && results.members.length > 0 && (
                <>
                  <div className="gs-section-label">Team Members</div>
                  {results.members.map((m: any) => {
                    const idx = itemIndex++;
                    return (
                      <div key={m.id} className={`gs-item${selected === idx ? " selected" : ""}`} onClick={() => handleSelect({ type: "member", data: m })}>
                        <div className="gs-item-icon member">👤</div>
                        <div>
                          <div className="gs-item-title">{highlight(m.name, query)}</div>
                          <div className="gs-item-sub">{highlight(m.email, query)}</div>
                        </div>
                        <div className="gs-item-right">{m.role}</div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Transactions */}
              {!loading && results && results.transactions.length > 0 && (
                <>
                  <div className="gs-section-label">Transactions</div>
                  {results.transactions.map((t: any) => {
                    const idx = itemIndex++;
                    return (
                      <div key={t.id} className={`gs-item${selected === idx ? " selected" : ""}`} onClick={() => handleSelect({ type: "revenue", data: t })}>
                        <div className="gs-item-icon revenue">💰</div>
                        <div>
                          <div className="gs-item-title">{fmt(t.amount)}</div>
                          <div className="gs-item-sub">{highlight(t.source ?? "—", query)}</div>
                        </div>
                        <div className="gs-item-right">{new Date(t.date).toLocaleDateString()}</div>
                      </div>
                    );
                  })}
                </>
              )}

              {/* Notifications */}
              {!loading && results && results.notifications.length > 0 && (
                <>
                  <div className="gs-section-label">Notifications</div>
                  {results.notifications.map((n: any) => {
                    const idx = itemIndex++;
                    return (
                      <div key={n.id} className={`gs-item${selected === idx ? " selected" : ""}`} onClick={() => handleSelect({ type: "notification", data: n })}>
                        <div className="gs-item-icon notification">🔔</div>
                        <div>
                          <div className="gs-item-title">{highlight(n.title ?? "Notification", query)}</div>
                          <div className="gs-item-sub">{highlight(n.message ?? "", query)}</div>
                        </div>
                        <div className="gs-item-right">{new Date(n.createdAt).toLocaleDateString()}</div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            <div className="gs-footer">
              <span><span className="gs-footer-key">↑↓</span> Navigate</span>
              <span><span className="gs-footer-key">↵</span> Open</span>
              <span><span className="gs-footer-key">ESC</span> Close</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}