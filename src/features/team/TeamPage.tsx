// src/features/team/TeamPage.tsx

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useInviteStore } from "./inviteStore";
import { useAuthStore } from "../auth/authStore";
import type { Role } from "./inviteStore";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .tm-root {
    --gold: #F5C842; --bg: #080B10; --surface: #0D1117; --surface2: #141B24;
    --border: #1E2A38; --text: #E8EDF2; --text-dim: #5A6878;
    --green: #2DD4A0; --blue: #4A9EFF; --red: #FF5975; --purple: #9B6FFF;
    background: var(--bg); color: var(--text);
    font-family: 'Syne', sans-serif; min-height: 100vh; padding: 32px 24px 80px;
  }

  .tm-inner { max-width: 900px; margin: 0 auto; }

  .tm-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; flex-wrap: wrap; gap: 16px; }
  .tm-title { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
  .tm-title span { color: var(--gold); }
  .tm-subtitle { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); margin-top: 4px; }

  .tm-btn {
    background: var(--gold); color: #080B10; border: none; border-radius: 3px;
    padding: 10px 20px; font-family: 'Syne', sans-serif; font-size: 13px;
    font-weight: 700; cursor: pointer; transition: opacity 0.15s;
  }
  .tm-btn:hover { opacity: 0.88; }
  .tm-btn.ghost {
    background: transparent; color: var(--text-dim);
    border: 1px solid var(--border);
  }
  .tm-btn.ghost:hover { border-color: var(--gold); color: var(--gold); }
  .tm-btn.danger { background: transparent; color: var(--red); border: 1px solid rgba(255,89,117,0.3); }
  .tm-btn.danger:hover { background: rgba(255,89,117,0.08); }
  .tm-btn.sm { padding: 6px 12px; font-size: 11px; }

  /* Invite Form */
  .tm-invite-card {
    background: var(--surface); border: 1px solid rgba(245,200,66,0.2);
    border-radius: 4px; padding: 24px; margin-bottom: 24px; position: relative; overflow: hidden;
  }
  .tm-invite-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--gold), var(--purple)); }
  .tm-invite-title { font-size: 14px; font-weight: 700; margin-bottom: 16px; }
  .tm-invite-row { display: flex; gap: 10px; flex-wrap: wrap; }
  .tm-input {
    background: var(--surface2); border: 1px solid var(--border); border-radius: 3px;
    padding: 10px 14px; font-family: 'Space Mono', monospace; font-size: 12px;
    color: var(--text); outline: none; transition: border-color 0.15s; flex: 1; min-width: 200px;
  }
  .tm-input::placeholder { color: var(--text-dim); }
  .tm-input:focus { border-color: var(--gold); }

  .tm-select {
    background: var(--surface2); border: 1px solid var(--border); border-radius: 3px;
    padding: 10px 14px; font-family: 'Space Mono', monospace; font-size: 12px;
    color: var(--text); outline: none; cursor: pointer;
  }
  .tm-select:focus { border-color: var(--gold); }

  .tm-success { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--green); margin-top: 10px; }
  .tm-error-msg { font-family: 'Space Mono', monospace; font-size: 11px; color: var(--red); margin-top: 10px; }

  /* Members Table */
  .tm-card { background: var(--surface); border: 1px solid var(--border); border-radius: 4px; overflow: hidden; margin-bottom: 20px; }
  .tm-card-header { padding: 18px 20px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; }
  .tm-card-title { font-size: 13px; font-weight: 700; }
  .tm-card-meta { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }

  .tm-table { width: 100%; border-collapse: collapse; }
  .tm-table th { padding: 10px 20px; text-align: left; font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); letter-spacing: 1px; text-transform: uppercase; border-bottom: 1px solid var(--border); }
  .tm-table td { padding: 14px 20px; border-bottom: 1px solid var(--border); font-size: 13px; }
  .tm-table tr:last-child td { border-bottom: none; }
  .tm-table tr:hover td { background: var(--surface2); }

  .tm-avatar {
    width: 32px; height: 32px; border-radius: 50%; display: inline-flex;
    align-items: center; justify-content: center; font-size: 12px; font-weight: 700;
    margin-right: 10px; flex-shrink: 0;
  }

  .tm-member-cell { display: flex; align-items: center; }
  .tm-member-name { font-weight: 600; font-size: 13px; }
  .tm-member-email { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); margin-top: 2px; }

  .tm-role-badge {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 3px 9px; border-radius: 2px;
    font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700;
    letter-spacing: 0.5px; text-transform: uppercase;
  }
  .tm-role-badge.owner  { background: rgba(245,200,66,0.1); color: var(--gold);   border: 1px solid rgba(245,200,66,0.2); }
  .tm-role-badge.admin  { background: rgba(74,158,255,0.1); color: var(--blue);   border: 1px solid rgba(74,158,255,0.2); }
  .tm-role-badge.member { background: rgba(45,212,160,0.1); color: var(--green);  border: 1px solid rgba(45,212,160,0.2); }
  .tm-role-badge.viewer { background: rgba(90,104,120,0.1); color: var(--text-dim); border: 1px solid var(--border); }

  .tm-actions { display: flex; gap: 8px; align-items: center; }

  .tm-role-select {
    background: var(--surface2); border: 1px solid var(--border); border-radius: 3px;
    padding: 5px 8px; font-family: 'Space Mono', monospace; font-size: 10px;
    color: var(--text); outline: none; cursor: pointer;
  }

  /* Pending Invites */
  .tm-pending-row { display: flex; align-items: center; justify-content: space-between; padding: 12px 20px; border-bottom: 1px solid var(--border); }
  .tm-pending-row:last-child { border-bottom: none; }
  .tm-pending-email { font-family: 'Space Mono', monospace; font-size: 12px; }
  .tm-pending-meta { font-size: 11px; color: var(--text-dim); margin-top: 2px; }
  .tm-pending-badge { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 1px; text-transform: uppercase; color: var(--gold); background: rgba(245,200,66,0.08); border: 1px solid rgba(245,200,66,0.2); padding: 2px 7px; border-radius: 2px; }

  @keyframes tm-fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  .tm-root { animation: tm-fadeIn 0.4s ease forwards; }
  @media (max-width: 768px) {
  .tm-root { padding: 16px 14px 80px; }
  .tm-title { font-size: 22px; }
  .tm-table th:nth-child(3), .tm-table td:nth-child(3) { display: none; }
  .tm-invite-row { flex-direction: column; }
  .tm-input { min-width: unset; width: 100%; }
  .tm-header { flex-direction: column; gap: 12px; }
}
@media (max-width: 480px) {
  .tm-table th:nth-child(4), .tm-table td:nth-child(4) { display: none; }
  .tm-avatar { width: 26px; height: 26px; font-size: 10px; }
}
`;

const AVATAR_COLORS = ["#F5C842", "#4A9EFF", "#2DD4A0", "#9B6FFF", "#FF5975"];

function avatar(name: string, index: number) {
  return { initials: name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(), color: AVATAR_COLORS[index % AVATAR_COLORS.length] };
}

export default function TeamPage() {
  const { members, pendingInvites, isLoading, fetchTeam, inviteMember, removeMember, updateRole } = useInviteStore();
  const currentUser = useAuthStore((s) => s.user);

  const [email, setEmail]       = useState("");
  const [role, setRole]         = useState<Role>("member");
  const [inviting, setInviting] = useState(false);
  const [success, setSuccess]   = useState("");
  const [err, setErr]           = useState("");

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
      setErr(e?.message ?? "Invite failed");
    } finally {
      setInviting(false);
    }
  };

  const canManage = currentUser?.role === "owner" || currentUser?.role === "admin";

  return (
    <div className="tm-root">
      <div className="tm-inner">

        {/* Header */}
        <div className="tm-header">
          <div>
            <h1 className="tm-title">Team <span>Members</span></h1>
            <p className="tm-subtitle">{members.length} members · {currentUser?.tenantName}</p>
          </div>
        </div>

        {/* Invite Form */}
        {canManage && (
          <div className="tm-invite-card">
            <div className="tm-invite-title">Invite a Member</div>
            <form onSubmit={handleInvite}>
              <div className="tm-invite-row">
                <input
                  className="tm-input"
                  type="email"
                  placeholder="colleague@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <select className="tm-select" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                  <option value="viewer">Viewer</option>
                </select>
                <button type="submit" className="tm-btn" disabled={inviting}>
                  {inviting ? "Sending…" : "Send Invite"}
                </button>
              </div>
              {success && <div className="tm-success">✓ {success}</div>}
              {err     && <div className="tm-error-msg">› {err}</div>}
            </form>
          </div>
        )}

        {/* Members Table */}
        <div className="tm-card">
          <div className="tm-card-header">
            <div className="tm-card-title">Active Members</div>
            <div className="tm-card-meta">{members.length} total</div>
          </div>
          {isLoading ? (
            <div style={{ padding: "32px", textAlign: "center", fontFamily: "Space Mono, monospace", fontSize: "11px", color: "var(--text-dim)" }}>Loading…</div>
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
                  const { initials, color } = avatar(m.name, i);
                  const isCurrentUser = m.id === currentUser?.id;
                  const isOwner = m.role === "owner";
                  return (
                    <tr key={m.id}>
                      <td>
                        <div className="tm-member-cell">
                          <div className="tm-avatar" style={{ background: `${color}18`, color }}>{initials}</div>
                          <div>
                            <div className="tm-member-name">{m.name}{isCurrentUser && " (you)"}</div>
                            <div className="tm-member-email">{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><span className={`tm-role-badge ${m.role}`}>{m.role}</span></td>
                      <td style={{ fontFamily: "Space Mono, monospace", fontSize: "11px", color: "var(--text-dim)" }}>{m.createdAt}</td>
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
                              <button className="tm-btn danger sm" onClick={() => removeMember(m.id)}>Remove</button>
                            </div>
                          ) : (
                            <span style={{ fontFamily: "Space Mono, monospace", fontSize: "10px", color: "var(--text-dim)" }}>—</span>
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
          <div className="tm-card">
            <div className="tm-card-header">
              <div className="tm-card-title">Pending Invites</div>
              <div className="tm-card-meta">{pendingInvites.length} pending</div>
            </div>
            {pendingInvites.map((inv) => (
              <div className="tm-pending-row" key={inv.id}>
                <div>
                  <div className="tm-pending-email">{inv.email}</div>
                  <div className="tm-pending-meta">Expires {new Date(inv.expiresAt).toLocaleDateString()}</div>
                </div>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                  <span className={`tm-role-badge ${inv.role}`}>{inv.role}</span>
                  <span className="tm-pending-badge">Pending</span>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}