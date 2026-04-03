// src/components/ui/TenantSwitcher.tsx

import { useState, useRef, useEffect, useMemo } from "react";
import { useAuthStore, getAuthHeaders } from "../../features/auth/authStore";

import { API_BASE } from "../../lib/api";

const css = `
  .ts-wrap { position: relative; display: inline-block; width: 100%; }
  .ts-trigger {
    display: flex; align-items: center; gap: 10px;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--card-radius, 14px); padding: 10px 12px; cursor: pointer;
    transition: border-color 0.15s; width: 100%; box-sizing: border-box;
    font-family: var(--font-body), 'Syne', sans-serif;
  }
  .ts-trigger:hover { border-color: var(--gold); }
  .ts-trigger.open  { border-color: var(--gold); background: rgba(245,200,66,0.05); }
  .ts-avatar { width: 28px; height: 28px; border-radius: var(--card-radius, 999px); display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; flex-shrink: 0; background: rgba(245,200,66,0.15); color: var(--gold); }
  .ts-info { flex: 1; min-width: 0; }
  .ts-name { font-size: 12px; font-weight: 700; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .ts-plan { font-family: var(--font-mono), 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 1px; margin-top: 1px; }
  .ts-chevron { color: var(--text-dim); font-size: 10px; transition: transform 0.2s; flex-shrink: 0; }
  .ts-chevron.open { transform: rotate(180deg); }
  .ts-dropdown { position: absolute; top: calc(100% + 6px); left: 0; right: 0; background: var(--surface); border: 1px solid var(--border); border-radius: var(--card-radius, 16px); overflow: hidden; z-index: 100; animation: ts-drop 0.15s ease forwards; box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
  .ts-section-label { font-family: var(--font-mono), 'Space Mono', monospace; font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: var(--text-dim); padding: 10px 12px 6px; border-bottom: 1px solid var(--border); }
  .ts-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; cursor: pointer; transition: background 0.12s; }
  .ts-item:hover  { background: rgba(245,200,66,0.05); }
  .ts-item.active { background: rgba(245,200,66,0.08); }
  .ts-item-avatar { width: 26px; height: 26px; border-radius: var(--card-radius, 999px); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0; }
  .ts-item-name  { font-size: 12px; font-weight: 600; color: var(--text); flex: 1; }
  .ts-item-plan  { font-family: var(--font-mono), 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); }
  .ts-item-check { color: var(--gold); font-size: 12px; }
  .ts-divider    { height: 1px; background: var(--border); }
  .ts-action { display: flex; align-items: center; gap: 8px; padding: 10px 12px; cursor: pointer; transition: background 0.12s; font-family: var(--font-mono), 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }
  .ts-action:hover { background: rgba(245,200,66,0.05); color: var(--gold); }
  @keyframes ts-drop { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
`;

const COLORS = ["var(--gold)", "var(--blue)", "var(--green)", "var(--purple)", "var(--red)"];

interface Tenant { id: string; name: string; plan: string; }
interface Props  { onCreateNew?: () => void; }

export default function TenantSwitcher({ onCreateNew }: Props) {
  const user                  = useAuthStore((s) => s.user);
  const [open, setOpen]       = useState(false);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const ref                   = useRef<HTMLDivElement>(null);

  const active = useMemo<Tenant>(
    () => ({ id: user?.tenantId ?? "", name: user?.tenantName ?? "Workspace", plan: "PRO" }),
    [user?.tenantId, user?.tenantName],
  );

  useEffect(() => {
    const id = "ts-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id; tag.textContent = css;
      document.head.appendChild(tag);
    }
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/tenants/me`, { headers: getAuthHeaders() })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setTenants([{
            id: String(data.id ?? ""),
            name: String(data.name ?? "Workspace"),
            plan: String(data.plan ?? "PRO"),
          }]);
        }
      })
      .catch(() => setTenants([active]));
  }, [active]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const list     = tenants.length > 0 ? tenants : [active];
  const initials = (n: string) => {
    const normalized = typeof n === "string" ? n.trim() : "";
    if (!normalized) return "??";
    return normalized.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  };

  return (
    <div className="ts-wrap" ref={ref}>
      <div className={`ts-trigger${open ? " open" : ""}`} onClick={() => setOpen((v) => !v)}>
        <div className="ts-avatar">{initials(active.name)}</div>
        <div className="ts-info">
          <div className="ts-name">{active.name}</div>
          <div className="ts-plan">{active.plan}</div>
        </div>
        <div className={`ts-chevron${open ? " open" : ""}`}>▼</div>
      </div>

      {open && (
        <div className="ts-dropdown">
          <div className="ts-section-label">Your Workspaces</div>
          {list.map((t, i) => (
            <div key={t.id} className={`ts-item${t.id === active.id ? " active" : ""}`}>
              <div className="ts-item-avatar" style={{ background: `${COLORS[i % COLORS.length]}18`, color: COLORS[i % COLORS.length] }}>
                {initials(t.name)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="ts-item-name">{t.name}</div>
                <div className="ts-item-plan">{t.plan}</div>
              </div>
              {t.id === active.id && <div className="ts-item-check">✓</div>}
            </div>
          ))}
          <div className="ts-divider" />
          <div className="ts-action" onClick={() => { setOpen(false); onCreateNew?.(); }}>+ Create new workspace</div>
        </div>
      )}
    </div>
  );
}
