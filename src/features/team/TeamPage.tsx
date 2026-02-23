// src/features/team/TeamPage.tsx
// Phase 1 — Core Engine | UI Layer
// Full rebuild: ecosystem card pattern, CSS variables only, no Tailwind, no hex colors

import { useState, useEffect, FormEvent } from "react";
import { useAuthStore } from "../auth/authStore";
import { useInviteStore, Role } from "./inviteStore";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&display=swap');

.tm-root {
  min-height: 100vh; background: var(--bg); color: var(--text);
  font-family: 'Syne', sans-serif; padding: 32px 32px 80px; max-width: 960px;
  animation: tm-fadeIn 0.35s ease forwards;
}
@keyframes tm-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }

/* Context Bar */
.tm-context-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 28px; flex-wrap: wrap; }
.tm-context-item {
  font-family: 'Space Mono', monospace; font-size: 9px;
  letter-spacing: 0.15em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 2px;
}
.tm-context-item.live    { background: rgba(45,212,160,0.1); color: var(--green); border: 1px solid rgba(45,212,160,0.2); }
.tm-context-item.planned { background: rgba(90,122,150,0.08); color: var(--text-dim); border: 1px solid var(--border); }
.tm-context-sep { color: var(--border); font-size: 10px; }

/* Page Header */
.tm-header { display: flex; align-items: flex-end; justify-content: space-between; margin-bottom: 28px; gap: 16px; flex-wrap: wrap; }
.tm-eyebrow { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--gold); margin-bottom: 6px; }
.tm-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(26px, 4vw, 38px); font-weight: 300; color: var(--text);
  line-height: 1.1; margin: 0;
}
.tm-title em { font-style: italic; color: var(--gold); }
.tm-subtitle { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); letter-spacing: 0.05em; margin-top: 5px; }
.tm-member-count {
  font-family: 'Cormorant Garamond', serif; font-size: 42px; font-weight: 600;
  color: var(--gold); line-height: 1;
}
.tm-member-count-label { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.1em; }

/* Stats Strip */
.tm-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px; background: var(--border); border-radius: 6px; overflow: hidden; border: 1px solid var(--border); margin-bottom: 20px; }
.tm-stat { background: var(--surface); padding: 14px 18px; text-align: center; }
.tm-stat-value { font-size: 20px; font-weight: 800; margin-bottom: 3px; }
.tm-stat-label { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.1em; }

/* Card */
.tm-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 6px; margin-bottom: 16px;
  position: relative; overflow: hidden;
}
.tm-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
.tm-card.gold::before   { background: linear-gradient(90deg, var(--gold), transparent); }
.tm-card.blue::before   { background: linear-gradient(90deg, var(--blue), transparent); }
.tm-card.green::before  { background: linear-gradient(90deg, var(--green), transparent); }
.tm-card.purple::before { background: linear-gradient(90deg, var(--purple), transparent); }

.tm-card-header {
  padding: 18px 24px; border-bottom: 1px solid var(--border);
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
}
.tm-card-title { font-size: 14px; font-weight: 700; }
.tm-card-meta  { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }
.tm-card-body  { padding: 24px; }

/* Invite Form */
.tm-invite-row { display: flex; gap: 10px; flex-wrap: wrap; }
.tm-input {
  flex: 1; min-width: 200px; background: var(--surface2);
  border: 1px solid var(--border); border-radius: 4px;
  padding: 10px 14px; font-family: 'Space Mono', monospace; font-size: 12px;
  color: var(--text); outline: none; transition: border-color 0.15s;
}
.tm-input:focus { border-color: var(--gold); }
.tm-input::placeholder { color: var(--text-dim); }
.tm-select {
  background: var(--surface2); border: 1px solid var(--border); border-radius: 4px;
  padding: 10px 14px; font-family: 'Space Mono', monospace; font-size: 12px;
  color: var(--text); outline: none; cursor: pointer;
}
.tm-select:focus { border-color: var(--gold); }

/* Buttons */
.tm-btn {
  background: var(--gold); color: #080B10; border: none; border-radius: 4px;
  padding: 10px 20px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: opacity 0.15s; white-space: nowrap;
}
.tm-btn:hover:not(:disabled) { opacity: 0.85; }
.tm-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.tm-btn.ghost { background: transparent; border: 1px solid var(--border); color: var(--text-dim); font-size: 11px; padding: 6px 12px; }
.tm-btn.ghost:hover { border-color: var(--red); color: var(--red); }
.tm-btn.small { font-size: 11px; padding: 5px 12px; }

.tm-success { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--green); margin-top: 10px; }
.tm-error-msg { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--red); margin-top: 10px; }

/* Table */
.tm-table { width: 100%; border-collapse: collapse; }
.tm-table th {
  padding: 10px 20px; text-align: left;
  font-family: 'Space Mono', monospace; font-size: 9px;
  color: var(--text-dim); letter-spacing: 0.12em; text-transform: uppercase;
  border-bottom: 1px solid var(--border);
}
.tm-table td { padding: 14px 20px; border-bottom: 1px solid var(--border); font-size: 13px; }
.tm-table tr:last-child td { border-bottom: none; }
.tm-table tr:hover td { background: rgba(137,196,225,0.03); transition: background 0.15s; }

/* Avatar */
.tm-avatar {
  width: 34px; height: 34px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; margin-right: 10px; flex-shrink: 0;
}
.tm-member-cell { display: flex; align-items: center; }
.tm-member-name  { font-weight: 700; font-size: 13px; }
.tm-member-email { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); margin-top: 2px; }

/* Role Badges */
.tm-role-badge {
  display: inline-flex; align-items: center; gap: 5px;
  padding: 3px 10px; border-radius: 2px;
  font-family: 'Space Mono', monospace; font-size: 9px;
  font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
}
.tm-role-badge.owner  { background: rgba(201,168,76,0.1);  color: var(--gold);     border: 1px solid rgba(201,168,76,0.25); }
.tm-role-badge.admin  { background: rgba(43,95,142,0.15);  color: var(--ice);      border: 1px solid rgba(43,95,142,0.3);  }
.tm-role-badge.member { background: rgba(45,212,160,0.1);  color: var(--green);    border: 1px solid rgba(45,212,160,0.2); }
.tm-role-badge.viewer { background: rgba(90,122,150,0.08); color: var(--text-dim); border: 1px solid var(--border);        }

/* Role Select */
.tm-role-select {
  background: var(--surface2); border: 1px solid var(--border); border-radius: 3px;
  padding: 4px 8px; font-family: 'Space Mono', monospace; font-size: 10px;
  color: var(--text); outline: none; cursor: pointer;
}

.tm-actions { display: flex; gap: 8px; align-items: center; }

/* Pending Invites */
.tm-pending-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 24px; border-bottom: 1px solid var(--border);
}
.tm-pending-row:last-child { border-bottom: none; }
.tm-pending-email { font-family: 'Space Mono', monospace; font-size: 12px; }
.tm-pending-meta  { font-size: 11px; color: var(--text-dim); margin-top: 2px; }
.tm-pending-badge {
  font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.1em;
  text-transform: uppercase; color: var(--gold);
  background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.2);
  padding: 2px 8px; border-radius: 2px;
}

/* Loading */
.tm-loading {
  padding: 40px; text-align: center;
  font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim);
  letter-spacing: 0.1em;
}

@media (max-width: 768px) {
  .tm-root { padding: 16px 14px 80px; }
  .tm-stats { grid-template-columns: 1fr 1fr; }
  .tm-table th:nth-child(3), .tm-table td:nth-child(3) { display: none; }
  .tm-invite-row { flex-direction: column; }
  .tm-input { min-width: unset; width: 100%; }
  .tm-header { flex-direction: column; }
}
@media (max-width: 480px) {
  .tm-table th:nth-child(4), .tm-table td:nth-child(4) { display: none; }
  .tm-avatar { width: 28px; height: 28px; font-size: 10px; }
  .tm-stats { grid-template-columns: 1fr; }
}
`;

const AVATAR_COLORS = [
  "var(--gold)", "var(--ice)", "var(--green)", "var(--purple)", "var(--red)",
];
const AVATAR_BG = [
  "rgba(201,168,76,0.15)", "rgba(43,95,142,0.2)", "rgba(45,212,160,0.15)",
  "rgba(155,111,255,0.15)", "rgba(224,90,78,0.15)",
];

function avatar(name: string, index: number) {
  return {
    initials: name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
    color: AVATAR_COLORS[index % AVATAR_COLORS.length],
    bg:    AVATAR_BG[index % AVATAR_BG.length],
  };
}

export default function TeamPage() {
  const { members, pendingInvites, isLoading, fetchTeam, inviteMember, removeMember, updateRole } = useInviteStore();
  const currentUser = useAuthStore((s) => s.user);

  const [email, setEmail]       = useState("");
  const [role,  setRole]        = useState<Role>("member");
  const [inviting, setInviting] = useState(false);
  const [success,  setSuccess]  = useState("");
  const [err,      setErr]      = useState("");

  useEffect(() => {
    const id = "tm-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id; tag.textContent = css;
      document.head.appendChild(tag);
    }
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  useEffect(() => { fetchTeam(); }, []);

  const canManage = currentUser?.role === "owner" || currentUser?.role === "admin";

  const handleInvite = async (e: FormEvent) => {
    e.preventDefault();
    setErr(""); setSuccess("");
    if (!email.includes("@")) { setErr("Valid email required"); return; }
    setInviting(true);
    try {
      await inviteMember(email, role);
      setSuccess(`Invite sent to ${email}`);
      setEmail("");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to send invite");
    } finally {
      setInviting(false);
      setTimeout(() => { setSuccess(""); setErr(""); }, 4000);
    }
  };

  const ownerCount  = members.filter((m) => m.role === "owner").length;
  const adminCount  = members.filter((m) => m.role === "admin").length;
  const memberCount = members.filter((m) => m.role === "member" || m.role === "viewer").length;

  return (
    <div className="tm-root">
      {/* Context Bar */}
      <div className="tm-context-bar">
        <span className="tm-context-item live">⬡ Core Engine</span>
        <span className="tm-context-sep">›</span>
        <span className="tm-context-item live">Team Management</span>
        <span className="tm-context-sep">›</span>
        <span className="tm-context-item planned">Phase 1</span>
      </div>

      {/* Header */}
      <div className="tm-header">
        <div>
          <div className="tm-eyebrow">Organization</div>
          <h1 className="tm-title">Your <em>Team</em></h1>
          <div className="tm-subtitle">Manage members, roles, and access across your workspace</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="tm-member-count">{members.length}</div>
          <div className="tm-member-count-label">Active Members</div>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="tm-stats">
        <div className="tm-stat">
          <div className="tm-stat-value" style={{ color: "var(--gold)" }}>{ownerCount}</div>
          <div className="tm-stat-label">Owners</div>
        </div>
        <div className="tm-stat">
          <div className="tm-stat-value" style={{ color: "var(--ice)" }}>{adminCount}</div>
          <div className="tm-stat-label">Admins</div>
        </div>
        <div className="tm-stat">
          <div className="tm-stat-value" style={{ color: "var(--green)" }}>{memberCount}</div>
          <div className="tm-stat-label">Members</div>
        </div>
        <div className="tm-stat">
          <div className="tm-stat-value" style={{ color: "var(--gold)" }}>{pendingInvites.length}</div>
          <div className="tm-stat-label">Pending</div>
        </div>
      </div>

      {/* Invite Form */}
      {canManage && (
        <div className="tm-card gold">
          <div className="tm-card-header">
            <div className="tm-card-title">Invite a Member</div>
            <div className="tm-card-meta">An email invite will be sent with a signup link</div>
          </div>
          <div className="tm-card-body">
            <form onSubmit={handleInvite}>
              <div className="tm-invite-row">
                <input
                  className="tm-input" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="colleague@company.com"
                />
                <select
                  className="tm-select" value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                >
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button type="submit" className="tm-btn" disabled={inviting}>
                  {inviting ? "Sending…" : "Send Invite"}
                </button>
              </div>
              {success && <div className="tm-success">✓ {success}</div>}
              {err     && <div className="tm-error-msg">✗ {err}</div>}
            </form>
          </div>
        </div>
      )}

      {/* Active Members */}
      <div className="tm-card blue">
        <div className="tm-card-header">
          <div className="tm-card-title">Active Members</div>
          <div className="tm-card-meta">{members.length} total · RBAC enforced</div>
        </div>
        {isLoading ? (
          <div className="tm-loading">Loading members…</div>
        ) : (
          <table className="tm-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Role</th>
                <th>Joined</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {members.map((m, i) => {
                const { initials, color, bg } = avatar(m.name, i);
                const isCurrentUser = m.id === currentUser?.id;
                const isOwner       = m.role === "owner";
                return (
                  <tr key={m.id}>
                    <td>
                      <div className="tm-member-cell">
                        <div className="tm-avatar" style={{ background: bg, color }}>{initials}</div>
                        <div>
                          <div className="tm-member-name">{m.name}{isCurrentUser && " (you)"}</div>
                          <div className="tm-member-email">{m.email}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className={`tm-role-badge ${m.role}`}>{m.role}</span></td>
                    <td style={{ fontFamily: "Space Mono, monospace", fontSize: 10, color: "var(--text-dim)" }}>
                      {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "—"}
                    </td>
                    {canManage && (
                      <td>
                        {!isOwner && !isCurrentUser ? (
                          <div className="tm-actions">
                            <select
                              className="tm-role-select"
                              value={m.role}
                              onChange={(e) => updateRole(m.id, e.target.value as Role)}
                            >
                              <option value="admin">Admin</option>
                              <option value="member">Member</option>
                              <option value="viewer">Viewer</option>
                            </select>
                            <button className="tm-btn ghost" onClick={() => removeMember(m.id)}>
                              Remove
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontFamily: "Space Mono, monospace", fontSize: 10, color: "var(--text-dim)" }}>
                            {isOwner ? "— Owner" : "— You"}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="tm-card purple">
          <div className="tm-card-header">
            <div className="tm-card-title">Pending Invites</div>
            <div className="tm-card-meta">{pendingInvites.length} awaiting acceptance</div>
          </div>
          {pendingInvites.map((inv) => (
            <div className="tm-pending-row" key={inv.id}>
              <div>
                <div className="tm-pending-email">{inv.email}</div>
                <div className="tm-pending-meta">
                  Role: {inv.role} · Sent {inv.createdAt ? new Date(inv.createdAt).toLocaleDateString() : "—"}
                </div>
              </div>
              <span className="tm-pending-badge">● Pending</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}