// src/features/team/TeamPage.tsx
// Phase 1 — Core Engine · Team Management
// Ecosystem design: CSS variables, card pattern, context bar, no Tailwind

import { useState, useEffect } from "react";
import { useAuthStore, getAuthHeaders } from "../auth/authStore";
import { CrossAppSsoActions } from "../auth/CrossAppSsoActions";
import { API_BASE } from "../../lib/api";
import AIInsightBanner from "../../components/ui/AIInsightBanner";
import AssistantPanel from "../../components/ui/AssistantPanel";
import ProgressRing from "../../components/ui/ProgressRing";
import CrossLayerHandoff from "../../components/ui/CrossLayerHandoff";
import ContextBar from "../../components/ui/ContextBar";
import { useAssistant } from "../../hooks/useAssistant";

const API = API_BASE;
function authHeaders() {
  return { "Content-Type": "application/json", ...getAuthHeaders() };
}

const ROLES = ["owner", "admin", "member", "viewer"] as const;
type Role = (typeof ROLES)[number];

interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  joinedAt: string;
  lastActive?: string;
}

interface ApiMember {
  id?: string;
  name?: string | null;
  email?: string;
  role?: string | null;
  createdAt?: string;
}

function isRole(value: unknown): value is Role {
  return (
    typeof value === "string" && (ROLES as readonly string[]).includes(value)
  );
}

const ROLE_META: Record<
  Role,
  { label: string; color: string; bg: string; border: string; desc: string }
> = {
  owner: {
    label: "Owner",
    color: "var(--gold)",
    bg: "rgba(201,168,76,0.1)",
    border: "rgba(201,168,76,0.25)",
    desc: "Full access, billing, delete workspace",
  },
  admin: {
    label: "Admin",
    color: "var(--purple)",
    bg: "rgba(155,111,255,0.1)",
    border: "rgba(155,111,255,0.2)",
    desc: "Manage team, settings, all features",
  },
  member: {
    label: "Member",
    color: "var(--green)",
    bg: "rgba(45,212,160,0.08)",
    border: "rgba(45,212,160,0.15)",
    desc: "Access all features, post & collaborate",
  },
  viewer: {
    label: "Viewer",
    color: "var(--ice)",
    bg: "rgba(137,196,225,0.08)",
    border: "rgba(137,196,225,0.15)",
    desc: "Read-only access to all content",
  },
};

function initials(name: string, email: string) {
  const src = (name || email || "").trim();
  if (!src) return "??";
  return src.split(/\s|@/)[0].slice(0, 2).toUpperCase();
}

function timeAgo(iso: string) {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function TeamPage() {
  const authUser = useAuthStore((s) => s.user);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("member");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [search, setSearch] = useState("");
  useEffect(() => {
    loadMembers();
  }, []);

  // Level 4 AI Assistant hook
  const { sendMessage, messages, isLoading } = useAssistant({
    supervisor: "ARIA",
    autoGreeting: true,
  });

  const loadMembers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/tenants/me/members`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      const list: ApiMember[] = Array.isArray(data?.members)
        ? data.members
        : [];
      setMembers(
        list.map((m) => ({
          id: m.id ?? "",
          name: m.name ?? "",
          email: m.email ?? "",
          role: isRole(m.role) ? m.role : "member",
          joinedAt: m.createdAt ?? new Date().toISOString(),
          lastActive: m.createdAt ?? new Date().toISOString(),
        })),
      );
    } catch {
      setMembers([]);
    }
    setLoading(false);
  };

  const sendInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteMsg(null);
    try {
      const res = await fetch(`${API}/users/invite`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to send invite");
      setInviteMsg({ type: "ok", text: `Invite sent to ${inviteEmail}` });
      setInviteEmail("");
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to send invite";
      setInviteMsg({ type: "err", text: message });
    }
    setInviting(false);
  };

  const changeRole = async (memberId: string, newRole: Role) => {
    await fetch(`${API}/users/${memberId}/role`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify({ role: newRole }),
    });
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m)),
    );
  };

  const removeMember = async (member: Member) => {
    if (!confirm(`Remove ${member.name || member.email} from your team?`))
      return;
    await fetch(`${API}/users/${member.id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    setMembers((prev) => prev.filter((m) => m.id !== member.id));
  };

  const filtered = members.filter(
    (m) =>
      !search ||
      m.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase()),
  );

  const canManage = ["owner", "admin"].includes(authUser?.role ?? "");

  const platformLayers = [
    { name: "Core", status: "live" },
    { name: "Community", status: "live" },
    { name: "Academy", status: "soon" },
    { name: "Market", status: "live" },
    { name: "Intelligence", status: "live" },
    { name: "Work", status: "live" },
  ];

  return (
    <div style={s.page}>
      <ContextBar
        activeLayer="core"
        statusOverrides={{
          core: "live",
          community: "live",
          academy: "active",
          market: "live",
          intelligence: "live",
          work: "live",
        }}
        showLabels={true}
      />

      {/* Header */}
      <div style={s.header}>
        <div>
          <div style={s.pageLabel}>Core Engine · Team</div>
          <h1 style={s.pageTitle}>Team Management</h1>
          <p style={s.pageDesc}>
            Invite members, manage roles, and control workspace access.
          </p>
        </div>
        <div style={s.memberCount}>
          <span style={{ ...s.countNum, color: "var(--gold)" }}>
            {members.length}
          </span>
          <span style={s.countLabel}>Members</span>
        </div>
      </div>

      {/* AI Insight Banner */}
      <AIInsightBanner page="dashboard" assistant="aria" />
      <AssistantPanel page="team" assistant="aria" />
      <CrossLayerHandoff
        type="work"
        title="Growing your team?"
        subtitle="Find talented freelancers"
        details={
          <p>
            Post a job and get matched with verified professionals from the
            Winners ecosystem.
          </p>
        }
        actionLabel="Post a Job"
        actionHref="/work/freelancers"
        loopStage={4}
      />
      <div style={{ marginTop: 16 }}>
        <ProgressRing
          progress={members.length > 0 ? 100 : 0}
          size={48}
          label="Team"
        />
      </div>

      <CrossAppSsoActions variant="team" />

      {/* Invite card */}
      {canManage && (
        <div style={s.inviteCard}>
          <div style={s.cardBorder} />
          <div style={{ padding: "20px 24px" }}>
            <div style={s.cardTitle}>Invite Team Member</div>

            {inviteMsg && (
              <div
                style={{
                  ...s.msgBox,
                  ...(inviteMsg.type === "ok" ? s.msgOk : s.msgErr),
                }}
              >
                {inviteMsg.type === "ok" ? "✓" : "✕"} {inviteMsg.text}
              </div>
            )}

            <div style={s.inviteRow}>
              <input
                style={{ ...s.input, flex: 1 }}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                type="email"
                onKeyDown={(e) => e.key === "Enter" && sendInvite()}
              />
              <select
                style={s.roleSelect}
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as Role)}
              >
                {ROLES.filter((r) => r !== "owner").map((r) => (
                  <option key={r} value={r}>
                    {ROLE_META[r].label}
                  </option>
                ))}
              </select>
              <button
                style={s.inviteBtn}
                onClick={sendInvite}
                disabled={inviting || !inviteEmail.trim()}
              >
                {inviting ? "Sending..." : "Send Invite"}
              </button>
            </div>

            {/* Role guide */}
            <div style={s.roleGuide}>
              {ROLES.map((r) => (
                <div key={r} style={s.roleGuideItem}>
                  <span
                    style={{
                      ...s.roleBadge,
                      color: ROLE_META[r].color,
                      background: ROLE_META[r].bg,
                      borderColor: ROLE_META[r].border,
                    }}
                  >
                    {ROLE_META[r].label}
                  </span>
                  <span style={s.roleDesc}>{ROLE_META[r].desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Member list */}
      <div style={s.sectionHeader}>
        <div style={s.sectionLabel}>Members</div>
        <div style={s.sectionLine} />
        <input
          style={s.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search members..."
        />
      </div>

      <div style={s.memberCard}>
        <div style={s.cardBorder} />
        {loading ? (
          <div style={s.loadWrap}>
            <div style={s.spinner} />
          </div>
        ) : filtered.length === 0 ? (
          <div style={s.emptyState}>
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>👥</div>
            <div
              style={{
                color: "var(--text-dim)",
                fontFamily: "Space Mono, monospace",
                fontSize: "11px",
              }}
            >
              {search ? "No members match your search" : "No team members yet"}
            </div>
          </div>
        ) : (
          filtered.map((member, i) => {
            const rm = ROLE_META[member.role] ?? ROLE_META.member;
            const isMe = member.id === authUser?.id;
            const isOwner = member.role === "owner";
            return (
              <div
                key={member.id}
                style={{
                  ...s.memberRow,
                  ...(i === filtered.length - 1
                    ? { borderBottom: "none" }
                    : {}),
                }}
              >
                {/* Avatar */}
                <div
                  style={{
                    ...s.avatar,
                    background:
                      member.role === "owner"
                        ? "linear-gradient(135deg, var(--gold), var(--blue))"
                        : member.role === "admin"
                          ? "linear-gradient(135deg, var(--purple), var(--blue))"
                          : "linear-gradient(135deg, var(--blue), var(--ice))",
                  }}
                >
                  {initials(member.name, member.email)}
                </div>

                {/* Info */}
                <div style={s.memberInfo}>
                  <div style={s.memberName}>
                    {member.name || member.email}
                    {isMe && <span style={s.youBadge}>you</span>}
                  </div>
                  <div style={s.memberEmail}>{member.email}</div>
                </div>

                {/* Role */}
                <div style={s.memberRole}>
                  {canManage && !isOwner && !isMe ? (
                    <select
                      style={{
                        ...s.roleSelectSmall,
                        color: rm.color,
                        borderColor: rm.border,
                        background: rm.bg,
                      }}
                      value={member.role}
                      onChange={(e) =>
                        changeRole(member.id, e.target.value as Role)
                      }
                    >
                      {ROLES.filter((r) => r !== "owner").map((r) => (
                        <option key={r} value={r}>
                          {ROLE_META[r].label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span
                      style={{
                        ...s.roleBadge,
                        color: rm.color,
                        background: rm.bg,
                        borderColor: rm.border,
                      }}
                    >
                      {rm.label}
                    </span>
                  )}
                </div>

                {/* Last active */}
                <div style={s.lastActive}>
                  <div style={s.lastActiveLabel}>Last active</div>
                  <div style={s.lastActiveVal}>
                    {timeAgo(member.lastActive ?? member.joinedAt)}
                  </div>
                </div>

                {/* Joined */}
                <div style={s.lastActive}>
                  <div style={s.lastActiveLabel}>Joined</div>
                  <div style={s.lastActiveVal}>{timeAgo(member.joinedAt)}</div>
                </div>

                {/* Remove */}
                {canManage && !isOwner && !isMe && (
                  <button
                    style={s.removeBtn}
                    onClick={() => removeMember(member)}
                    title="Remove member"
                  >
                    ✕
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  page: {
    maxWidth: "1000px",
    margin: "0 auto",
    padding: "24px 20px 60px",
    fontFamily: "Syne, sans-serif",
  },
  contextBar: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "8px 14px",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    marginBottom: "24px",
    overflowX: "auto",
  },
  contextItem: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
    fontFamily: "Space Mono, monospace",
    fontSize: "9px",
    letterSpacing: "1px",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
  contextDot: { width: "5px", height: "5px", borderRadius: "50%" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "24px",
  },
  pageLabel: {
    fontFamily: "Space Mono, monospace",
    fontSize: "10px",
    letterSpacing: "2px",
    textTransform: "uppercase",
    color: "var(--gold)",
    marginBottom: "6px",
  },
  pageTitle: {
    fontSize: "26px",
    fontWeight: 800,
    letterSpacing: "-0.5px",
    margin: 0,
  },
  pageDesc: { fontSize: "13px", color: "var(--text-dim)", margin: "6px 0 0" },
  memberCount: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "8px",
    padding: "12px 20px",
  },
  countNum: { fontSize: "28px", fontWeight: 800, lineHeight: 1 },
  countLabel: {
    fontFamily: "Space Mono, monospace",
    fontSize: "9px",
    color: "var(--text-dim)",
    letterSpacing: "1px",
    marginTop: "2px",
  },
  inviteCard: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    overflow: "hidden",
    position: "relative",
    marginBottom: "24px",
  },
  cardBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "2px",
    background: "linear-gradient(90deg, var(--gold), var(--ice))",
  },
  cardTitle: {
    fontFamily: "Space Mono, monospace",
    fontSize: "10px",
    letterSpacing: "2px",
    textTransform: "uppercase",
    color: "var(--gold)",
    marginBottom: "16px",
  },
  msgBox: {
    padding: "10px 12px",
    borderRadius: "6px",
    fontFamily: "Space Mono, monospace",
    fontSize: "11px",
    marginBottom: "14px",
    border: "1px solid",
  },
  msgOk: {
    background: "rgba(45,212,160,0.08)",
    borderColor: "rgba(45,212,160,0.2)",
    color: "var(--green)",
  },
  msgErr: {
    background: "rgba(224,90,78,0.08)",
    borderColor: "rgba(224,90,78,0.2)",
    color: "var(--red)",
  },
  inviteRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "16px",
    flexWrap: "wrap",
  },
  input: {
    padding: "10px 12px",
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    color: "var(--text)",
    fontFamily: "Syne, sans-serif",
    fontSize: "13px",
    outline: "none",
  },
  roleSelect: {
    padding: "10px 12px",
    background: "var(--surface2)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    color: "var(--text)",
    fontFamily: "Space Mono, monospace",
    fontSize: "11px",
    outline: "none",
    cursor: "pointer",
  },
  inviteBtn: {
    padding: "10px 18px",
    background: "var(--gold)",
    border: "none",
    borderRadius: "6px",
    color: "var(--bg)",
    fontFamily: "Syne, sans-serif",
    fontWeight: 700,
    fontSize: "13px",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  roleGuide: { display: "flex", flexDirection: "column", gap: "6px" },
  roleGuideItem: { display: "flex", alignItems: "center", gap: "10px" },
  roleBadge: {
    fontFamily: "Space Mono, monospace",
    fontSize: "9px",
    letterSpacing: "1px",
    textTransform: "uppercase",
    padding: "2px 8px",
    borderRadius: "3px",
    border: "1px solid",
    whiteSpace: "nowrap",
  },
  roleDesc: {
    fontFamily: "Space Mono, monospace",
    fontSize: "10px",
    color: "var(--text-dim)",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "14px",
  },
  sectionLabel: {
    fontFamily: "Space Mono, monospace",
    fontSize: "10px",
    letterSpacing: "3px",
    textTransform: "uppercase",
    color: "var(--gold)",
    whiteSpace: "nowrap",
  },
  sectionLine: { flex: 1, height: "1px", background: "var(--border)" },
  searchInput: {
    padding: "8px 12px",
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "6px",
    color: "var(--text)",
    fontFamily: "Syne, sans-serif",
    fontSize: "12px",
    outline: "none",
    width: "180px",
  },
  memberCard: {
    background: "var(--surface)",
    border: "1px solid var(--border)",
    borderRadius: "10px",
    overflow: "hidden",
    position: "relative",
  },
  memberRow: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "14px 20px",
    borderBottom: "1px solid var(--border)",
    flexWrap: "wrap",
  },
  avatar: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Space Mono, monospace",
    fontSize: "11px",
    fontWeight: 700,
    color: "var(--text)",
    flexShrink: 0,
  },
  memberInfo: { flex: 1, minWidth: "140px" },
  memberName: {
    fontWeight: 600,
    fontSize: "13px",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },
  youBadge: {
    fontFamily: "Space Mono, monospace",
    fontSize: "8px",
    padding: "1px 5px",
    background: "rgba(201,168,76,0.1)",
    border: "1px solid rgba(201,168,76,0.25)",
    borderRadius: "3px",
    color: "var(--gold)",
    letterSpacing: "0.5px",
  },
  memberEmail: {
    fontFamily: "Space Mono, monospace",
    fontSize: "9px",
    color: "var(--text-dim)",
    marginTop: "2px",
  },
  memberRole: { minWidth: "90px" },
  roleSelectSmall: {
    fontFamily: "Space Mono, monospace",
    fontSize: "9px",
    letterSpacing: "0.5px",
    padding: "3px 6px",
    borderRadius: "3px",
    border: "1px solid",
    outline: "none",
    cursor: "pointer",
  },
  lastActive: { textAlign: "center", minWidth: "70px" },
  lastActiveLabel: {
    fontFamily: "Space Mono, monospace",
    fontSize: "8px",
    color: "var(--text-dim)",
    letterSpacing: "0.5px",
    textTransform: "uppercase",
  },
  lastActiveVal: {
    fontFamily: "Space Mono, monospace",
    fontSize: "10px",
    color: "var(--text-dim)",
    marginTop: "2px",
  },
  removeBtn: {
    background: "transparent",
    border: "1px solid var(--border)",
    borderRadius: "4px",
    color: "var(--text-dim)",
    width: "26px",
    height: "26px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "10px",
    flexShrink: 0,
  },
  loadWrap: { display: "flex", justifyContent: "center", padding: "40px" },
  spinner: {
    width: "28px",
    height: "28px",
    border: "2px solid var(--border)",
    borderTop: "2px solid var(--gold)",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  emptyState: {
    textAlign: "center",
    padding: "40px",
    color: "var(--text-dim)",
  },
};
