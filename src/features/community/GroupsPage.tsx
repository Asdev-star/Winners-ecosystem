// src/features/community/GroupsPage.tsx
// Phase 2 — Community Layer V1.2: Groups
// Route: /community/groups

import { useState, useEffect, useCallback } from "react";
import { getAuthHeaders } from "../auth/authStore";
import { API_BASE } from "../../lib/api";

const API = API_BASE;
// ─── Types ────────────────────────────────────────────────────────────────────

interface Group {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isPrivate: boolean;
  createdAt: string;
  memberCount: number;
  postCount: number;
  isMember: boolean;
  myRole: "OWNER" | "ADMIN" | "MEMBER" | null;
  createdBy: { id: string; name: string; email: string };
}

interface GroupPost {
  id: string;
  content: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  tags: string[];
  author: { id: string; name: string; email: string };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function authHeaders() {
  return { "Content-Type": "application/json", ...getAuthHeaders() };
}

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Create Group Modal ───────────────────────────────────────────────────────

function CreateGroupModal({ onClose, onCreated }: { onClose: () => void; onCreated: (g: Group) => void }) {
  const [name, setName]         = useState("");
  const [description, setDesc]  = useState("");
  const [isPrivate, setPrivate] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  const submit = async () => {
    if (!name.trim()) { setError("Group name is required"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch(`${API}/groups`, {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify({ name, description, isPrivate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onCreated(data);
    } catch (e: any) {
      setError(e.message ?? "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Top border */}
        <div style={styles.modalBorder} />

        <div style={{ padding: "24px" }}>
          <div style={styles.modalHeader}>
            <span style={styles.modalTitle}>Create Group</span>
            <button style={styles.closeBtn} onClick={onClose}>✕</button>
          </div>

          {error && <div style={styles.errorBox}>{error}</div>}

          <div style={styles.field}>
            <label style={styles.label}>Group Name *</label>
            <input
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Design Team, Marketing Hub..."
              maxLength={60}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Description</label>
            <textarea
              style={{ ...styles.input, height: "80px", resize: "none" }}
              value={description}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="What is this group about?"
              maxLength={300}
            />
          </div>

          <label style={{ ...styles.checkRow }}>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setPrivate(e.target.checked)}
              style={{ accentColor: "var(--gold)" }}
            />
            <span style={styles.checkLabel}>
              <strong style={{ color: "var(--text)" }}>Private group</strong>
              <span style={{ color: "var(--text-dim)" }}> — only members can see posts</span>
            </span>
          </label>

          <div style={styles.modalActions}>
            <button style={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button style={styles.createBtn} onClick={submit} disabled={loading}>
              {loading ? "Creating..." : "Create Group"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Group Card ───────────────────────────────────────────────────────────────

function GroupCard({
  group,
  onJoin,
  onLeave,
  onSelect,
}: {
  group: Group;
  onJoin: (slug: string) => void;
  onLeave: (slug: string) => void;
  onSelect: (slug: string) => void;
}) {
  const roleColor = {
    OWNER: "var(--gold)",
    ADMIN: "var(--purple)",
    MEMBER: "var(--green)",
  };

  return (
    <div style={styles.groupCard} onClick={() => onSelect(group.slug)}>
      <div style={styles.groupCardBorder} />
      <div style={styles.groupCardHead}>
        <div style={styles.groupAvatar}>{group.name.slice(0, 2).toUpperCase()}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={styles.groupName}>
            {group.name}
            {group.isPrivate && (
              <span style={styles.privateBadge}>🔒 Private</span>
            )}
          </div>
          {group.myRole && (
            <span style={{ ...styles.roleBadge, color: roleColor[group.myRole] }}>
              {group.myRole}
            </span>
          )}
        </div>
      </div>

      {group.description && (
        <p style={styles.groupDesc}>{group.description}</p>
      )}

      <div style={styles.groupMeta}>
        <span>👥 {group.memberCount} member{group.memberCount !== 1 ? "s" : ""}</span>
        <span>📝 {group.postCount} post{group.postCount !== 1 ? "s" : ""}</span>
        <span style={{ color: "var(--text-dim)", fontSize: "10px" }}>
          by {group.createdBy.name ?? group.createdBy.email}
        </span>
      </div>

      <div style={styles.groupCardFooter} onClick={(e) => e.stopPropagation()}>
        <button style={styles.viewBtn} onClick={() => onSelect(group.slug)}>
          View Group →
        </button>
        {group.isMember && group.myRole !== "OWNER" ? (
          <button style={styles.leaveBtn} onClick={() => onLeave(group.slug)}>
            Leave
          </button>
        ) : !group.isMember ? (
          <button style={styles.joinBtn} onClick={() => onJoin(group.slug)}>
            Join
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ─── Group Detail View ────────────────────────────────────────────────────────

function GroupDetail({ slug, onBack }: { slug: string; onBack: () => void }) {
  const [group, setGroup]   = useState<Group & { members?: any[] } | null>(null);
  const [posts, setPosts]   = useState<GroupPost[]>([]);
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [tab, setTab]       = useState<"feed" | "members">("feed");
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [gRes, pRes] = await Promise.all([
        fetch(`${API}/groups/${slug}`, { headers: authHeaders() }),
        fetch(`${API}/groups/${slug}/posts`, { headers: authHeaders() }),
      ]);
      if (!gRes.ok) { setError("Group not found or access denied"); setLoading(false); return; }
      const [gData, pData] = await Promise.all([gRes.json(), pRes.json()]);
      setGroup(gData);
      setPosts(pData.posts ?? []);
    } catch {
      setError("Failed to load group");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => { load(); }, [load]);

  const createPost = async () => {
    if (!content.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`${API}/posts`, {
        method:  "POST",
        headers: authHeaders(),
        body:    JSON.stringify({ content, groupId: group?.id }),
      });
      if (res.ok) { setContent(""); load(); }
    } finally {
      setPosting(false);
    }
  };

  const toggleLike = async (postId: string) => {
    await fetch(`${API}/posts/${postId}/like`, { method: "POST", headers: authHeaders() });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likedByMe: !p.likedByMe, likeCount: p.likedByMe ? p.likeCount - 1 : p.likeCount + 1 }
          : p
      )
    );
  };

  if (loading) return (
    <div style={styles.loadWrap}>
      <div style={styles.spinner} />
      <span style={{ color: "var(--text-dim)", fontFamily: "Space Mono, monospace", fontSize: "11px" }}>
        Loading group...
      </span>
    </div>
  );

  if (error || !group) return (
    <div style={styles.errorState}>
      <div style={{ fontSize: "32px", marginBottom: "12px" }}>🔒</div>
      <div style={{ color: "var(--text-dim)", fontFamily: "Space Mono, monospace", fontSize: "11px" }}>
        {error || "Group not found"}
      </div>
      <button style={{ ...styles.joinBtn, marginTop: "16px" }} onClick={onBack}>← Back</button>
    </div>
  );

  return (
    <div>
      {/* Group header */}
      <div style={styles.detailHeader}>
        <button style={styles.backBtn} onClick={onBack}>← Back to Groups</button>
        <div style={styles.detailHeaderCard}>
          <div style={styles.modalBorder} />
          <div style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{ ...styles.groupAvatar, width: "48px", height: "48px", fontSize: "18px" }}>
                {group.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.3px" }}>
                  {group.name}
                  {group.isPrivate && <span style={styles.privateBadge}>🔒 Private</span>}
                </div>
                {group.description && (
                  <div style={{ fontSize: "13px", color: "var(--text-dim)", marginTop: "3px" }}>
                    {group.description}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: "16px", marginTop: "12px" }}>
              <span style={styles.groupMetaItem}>👥 {group.memberCount} members</span>
              <span style={styles.groupMetaItem}>📝 {posts.length} posts</span>
              {group.myRole && (
                <span style={{ ...styles.groupMetaItem, color: "var(--gold)" }}>
                  Your role: {group.myRole}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={styles.tabs}>
          {(["feed", "members"] as const).map((t) => (
            <button
              key={t}
              style={{ ...styles.tab, ...(tab === t ? styles.tabActive : {}) }}
              onClick={() => setTab(t)}
            >
              {t === "feed" ? "📋 Feed" : "👥 Members"}
            </button>
          ))}
        </div>
      </div>

      {tab === "feed" && (
        <div>
          {/* Compose */}
          {group.isMember && (
            <div style={styles.composeCard}>
              <div style={styles.modalBorder} />
              <div style={{ padding: "16px" }}>
                <textarea
                  style={styles.composeTextarea}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={`Post to ${group.name}...`}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) createPost(); }}
                />
                <div style={styles.composeFooter}>
                  <span style={styles.composeHint}>⌘+Enter to post</span>
                  <button
                    style={posting || !content.trim() ? styles.postBtnDisabled : styles.postBtn}
                    onClick={createPost}
                    disabled={posting || !content.trim()}
                  >
                    {posting ? "Posting..." : "Post to Group"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Posts */}
          {posts.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>💬</div>
              <div style={{ color: "var(--text-dim)", fontFamily: "Space Mono, monospace", fontSize: "11px" }}>
                No posts yet — be the first to share something
              </div>
            </div>
          ) : (
            posts.map((post) => (
              <div key={post.id} style={styles.postCard}>
                <div style={styles.postCardBorder} />
                <div style={{ padding: "16px" }}>
                  <div style={styles.postHead}>
                    <div style={styles.postAvatar}>{initials(post.author.name ?? post.author.email)}</div>
                    <div>
                      <div style={styles.postAuthor}>{post.author.name ?? post.author.email}</div>
                      <div style={styles.postTime}>{timeAgo(post.createdAt)}</div>
                    </div>
                  </div>
                  <div style={styles.postContent}>{post.content}</div>
                  {post.tags.length > 0 && (
                    <div style={styles.tagRow}>
                      {post.tags.map((t) => (
                        <span key={t} style={styles.tag}>#{t}</span>
                      ))}
                    </div>
                  )}
                  <div style={styles.postActions}>
                    <button style={styles.actionBtn} onClick={() => toggleLike(post.id)}>
                      <span style={{ color: post.likedByMe ? "var(--red)" : "var(--text-dim)" }}>
                        {post.likedByMe ? "❤️" : "🤍"}
                      </span>
                      <span style={{ color: post.likedByMe ? "var(--red)" : "var(--text-dim)" }}>
                        {post.likeCount}
                      </span>
                    </button>
                    <button style={styles.actionBtn}>
                      <span style={{ color: "var(--text-dim)" }}>💬 {post.commentCount}</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {tab === "members" && (
        <div style={styles.membersList}>
          {(group as any).members?.map((m: any) => (
            <div key={m.id} style={styles.memberRow}>
              <div style={styles.postAvatar}>{initials(m.user.name ?? m.user.email)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "13px" }}>{m.user.name ?? m.user.email}</div>
                <div style={{ fontFamily: "Space Mono, monospace", fontSize: "9px", color: "var(--text-dim)", marginTop: "2px" }}>
                  {m.user.email}
                </div>
              </div>
              <span style={{
                fontFamily: "Space Mono, monospace",
                fontSize: "9px",
                padding: "3px 8px",
                borderRadius: "3px",
                background: m.role === "OWNER" ? "rgba(201,168,76,0.12)" : m.role === "ADMIN" ? "rgba(155,111,255,0.12)" : "rgba(45,212,160,0.08)",
                color: m.role === "OWNER" ? "var(--gold)" : m.role === "ADMIN" ? "var(--purple)" : "var(--green)",
                border: `1px solid ${m.role === "OWNER" ? "rgba(201,168,76,0.25)" : m.role === "ADMIN" ? "rgba(155,111,255,0.2)" : "rgba(45,212,160,0.15)"}`,
                letterSpacing: "1px",
                textTransform: "uppercase" as const,
              }}>
                {m.role}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main GroupsPage ──────────────────────────────────────────────────────────

export default function GroupsPage() {
  const [groups, setGroups]         = useState<Group[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSlug, setSelected] = useState<string | null>(null);
  const [filter, setFilter]         = useState<"all" | "mine">("all");
  const [search, setSearch]         = useState("");

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/groups`, { headers: authHeaders() });
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (slug: string) => {
    await fetch(`${API}/groups/${slug}/join`, { method: "POST", headers: authHeaders() });
    loadGroups();
  };

  const handleLeave = async (slug: string) => {
    if (!confirm("Leave this group?")) return;
    await fetch(`${API}/groups/${slug}/leave`, { method: "POST", headers: authHeaders() });
    loadGroups();
  };

  const handleCreated = (g: Group) => {
    setGroups((prev) => [{ ...g, memberCount: 1, postCount: 0, isMember: true, myRole: "OWNER" }, ...prev]);
    setShowCreate(false);
    setSelected(g.slug);
  };

  const filtered = groups.filter((g) => {
    if (filter === "mine" && !g.isMember) return false;
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // ─── Ecosystem context bar ────────────────────────────────────────────────
  const platformLayers = [
    { name: "Core", status: "live" },
    { name: "Community", status: "live" },
    { name: "Academy", status: "soon" },
    { name: "Market", status: "soon" },
    { name: "Intelligence", status: "planned" },
    { name: "Work", status: "planned" },
  ];

  if (selectedSlug) {
    return (
      <div style={styles.page}>
        <div style={styles.contextBar}>
          {platformLayers.map((p) => (
            <div key={p.name} style={styles.contextItem}>
              <div style={{
                ...styles.contextDot,
                background: p.status === "live" ? "var(--green)" : p.status === "soon" ? "var(--gold)" : "var(--border)",
              }} />
              <span style={{ color: p.name === "Community" ? "var(--gold)" : "var(--text-dim)" }}>
                {p.name}
              </span>
            </div>
          ))}
        </div>
        <GroupDetail slug={selectedSlug} onBack={() => setSelected(null)} />
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* Ecosystem context bar */}
      <div style={styles.contextBar}>
        {platformLayers.map((p) => (
          <div key={p.name} style={styles.contextItem}>
            <div style={{
              ...styles.contextDot,
              background: p.status === "live" ? "var(--green)" : p.status === "soon" ? "var(--gold)" : "var(--border)",
            }} />
            <span style={{ color: p.name === "Community" ? "var(--gold)" : "var(--text-dim)" }}>
              {p.name}
            </span>
          </div>
        ))}
      </div>

      {/* Page header */}
      <div style={styles.pageHeader}>
        <div>
          <div style={styles.pageLabel}>Community Layer · V1.2</div>
          <h1 style={styles.pageTitle}>Groups</h1>
          <p style={styles.pageDesc}>Join communities, share focused content, collaborate with your team.</p>
        </div>
        <button style={styles.createGroupBtn} onClick={() => setShowCreate(true)}>
          + Create Group
        </button>
      </div>

      {/* Filters */}
      <div style={styles.filterRow}>
        <div style={styles.filterTabs}>
          {(["all", "mine"] as const).map((f) => (
            <button
              key={f}
              style={{ ...styles.filterTab, ...(filter === f ? styles.filterTabActive : {}) }}
              onClick={() => setFilter(f)}
            >
              {f === "all" ? "All Groups" : "My Groups"}
            </button>
          ))}
        </div>
        <input
          style={styles.searchInput}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search groups..."
        />
      </div>

      {/* Groups grid */}
      {loading ? (
        <div style={styles.loadWrap}>
          <div style={styles.spinner} />
        </div>
      ) : filtered.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={{ fontSize: "40px", marginBottom: "12px" }}>👥</div>
          <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "6px" }}>
            {filter === "mine" ? "You haven't joined any groups yet" : "No groups found"}
          </div>
          <div style={{ color: "var(--text-dim)", fontSize: "13px", marginBottom: "20px" }}>
            {filter === "mine" ? "Join or create a group to get started" : "Be the first to create a group"}
          </div>
          <button style={styles.createGroupBtn} onClick={() => setShowCreate(true)}>
            + Create First Group
          </button>
        </div>
      ) : (
        <div style={styles.groupsGrid}>
          {filtered.map((g) => (
            <GroupCard
              key={g.id}
              group={g}
              onJoin={handleJoin}
              onLeave={handleLeave}
              onSelect={setSelected}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <CreateGroupModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    maxWidth:  "1100px",
    margin:    "0 auto",
    padding:   "24px 20px 60px",
    fontFamily: "Syne, sans-serif",
  },
  contextBar: {
    display:        "flex",
    alignItems:     "center",
    gap:            "16px",
    padding:        "8px 14px",
    background:     "var(--surface)",
    border:         "1px solid var(--border)",
    borderRadius:   "6px",
    marginBottom:   "24px",
    overflowX:      "auto",
  },
  contextItem: {
    display:        "flex",
    alignItems:     "center",
    gap:            "5px",
    fontFamily:     "Space Mono, monospace",
    fontSize:       "9px",
    letterSpacing:  "1px",
    textTransform:  "uppercase",
    whiteSpace:     "nowrap",
  },
  contextDot: {
    width:        "5px",
    height:       "5px",
    borderRadius: "50%",
  },
  pageHeader: {
    display:        "flex",
    alignItems:     "flex-start",
    justifyContent: "space-between",
    marginBottom:   "24px",
  },
  pageLabel: {
    fontFamily:    "Space Mono, monospace",
    fontSize:      "10px",
    letterSpacing: "2px",
    textTransform: "uppercase",
    color:         "var(--gold)",
    marginBottom:  "6px",
  },
  pageTitle: {
    fontSize:    "26px",
    fontWeight:  800,
    letterSpacing: "-0.5px",
    marginBottom: "6px",
  },
  pageDesc: {
    fontSize: "13px",
    color:    "var(--text-dim)",
  },
  createGroupBtn: {
    padding:       "10px 18px",
    background:    "var(--gold)",
    color:         "#0D1520",
    border:        "none",
    borderRadius:  "6px",
    fontFamily:    "Syne, sans-serif",
    fontWeight:    700,
    fontSize:      "13px",
    cursor:        "pointer",
    whiteSpace:    "nowrap",
    flexShrink:    0,
  },
  filterRow: {
    display:        "flex",
    alignItems:     "center",
    justifyContent: "space-between",
    gap:            "12px",
    marginBottom:   "20px",
    flexWrap:       "wrap",
  },
  filterTabs: {
    display: "flex",
    gap:     "4px",
  },
  filterTab: {
    padding:       "8px 16px",
    background:    "transparent",
    border:        "1px solid var(--border)",
    borderRadius:  "6px",
    color:         "var(--text-dim)",
    fontFamily:    "Space Mono, monospace",
    fontSize:      "10px",
    letterSpacing: "0.5px",
    cursor:        "pointer",
    transition:    "all 0.15s",
  },
  filterTabActive: {
    background:  "rgba(201,168,76,0.1)",
    borderColor: "var(--gold)",
    color:       "var(--gold)",
  },
  searchInput: {
    padding:      "8px 14px",
    background:   "var(--surface)",
    border:       "1px solid var(--border)",
    borderRadius: "6px",
    color:        "var(--text)",
    fontFamily:   "Syne, sans-serif",
    fontSize:     "13px",
    outline:      "none",
    width:        "220px",
  },
  groupsGrid: {
    display:             "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap:                 "14px",
  },
  groupCard: {
    background:   "var(--surface)",
    border:       "1px solid var(--border)",
    borderRadius: "10px",
    overflow:     "hidden",
    position:     "relative",
    cursor:       "pointer",
    transition:   "border-color 0.15s, transform 0.15s",
  },
  groupCardBorder: {
    position:   "absolute",
    top:        0, left: 0, right: 0,
    height:     "2px",
    background: "linear-gradient(90deg, var(--blue), var(--ice))",
  },
  groupCardHead: {
    display:    "flex",
    alignItems: "center",
    gap:        "12px",
    padding:    "16px 16px 8px",
  },
  groupAvatar: {
    width:          "40px",
    height:         "40px",
    borderRadius:   "8px",
    background:     "linear-gradient(135deg, var(--blue), var(--ice))",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    fontFamily:     "Space Mono, monospace",
    fontWeight:     700,
    fontSize:       "14px",
    color:          "#fff",
    flexShrink:     0,
  },
  groupName: {
    fontWeight:   700,
    fontSize:     "14px",
    letterSpacing: "-0.3px",
    display:      "flex",
    alignItems:   "center",
    gap:          "6px",
    flexWrap:     "wrap",
  },
  privateBadge: {
    fontFamily:    "Space Mono, monospace",
    fontSize:      "8px",
    letterSpacing: "0.5px",
    padding:       "2px 6px",
    background:    "rgba(90,122,150,0.15)",
    border:        "1px solid var(--border)",
    borderRadius:  "3px",
    color:         "var(--text-dim)",
  },
  roleBadge: {
    fontFamily:    "Space Mono, monospace",
    fontSize:      "8px",
    letterSpacing: "1px",
    textTransform: "uppercase",
    marginTop:     "2px",
    display:       "block",
  },
  groupDesc: {
    fontSize:   "12px",
    color:      "var(--text-dim)",
    lineHeight: "1.5",
    padding:    "0 16px 8px",
    margin:     0,
  },
  groupMeta: {
    display:    "flex",
    gap:        "12px",
    padding:    "0 16px 12px",
    fontFamily: "Space Mono, monospace",
    fontSize:   "10px",
    color:      "var(--text-dim)",
    flexWrap:   "wrap",
  },
  groupCardFooter: {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "center",
    padding:        "10px 16px",
    borderTop:      "1px solid var(--border)",
    background:     "var(--surface2)",
  },
  viewBtn: {
    background:  "transparent",
    border:      "none",
    color:       "var(--ice)",
    fontFamily:  "Space Mono, monospace",
    fontSize:    "10px",
    cursor:      "pointer",
    letterSpacing: "0.5px",
  },
  joinBtn: {
    padding:      "6px 14px",
    background:   "var(--gold)",
    border:       "none",
    borderRadius: "4px",
    color:        "#0D1520",
    fontFamily:   "Syne, sans-serif",
    fontWeight:   700,
    fontSize:     "11px",
    cursor:       "pointer",
  },
  leaveBtn: {
    padding:      "6px 14px",
    background:   "transparent",
    border:       "1px solid var(--border)",
    borderRadius: "4px",
    color:        "var(--text-dim)",
    fontFamily:   "Space Mono, monospace",
    fontSize:     "10px",
    cursor:       "pointer",
  },
  // Modal
  overlay: {
    position:    "fixed",
    inset:       0,
    background:  "rgba(13,21,32,0.85)",
    backdropFilter: "blur(4px)",
    display:     "flex",
    alignItems:  "center",
    justifyContent: "center",
    zIndex:      100,
    padding:     "16px",
  },
  modal: {
    background:   "var(--surface)",
    border:       "1px solid var(--border)",
    borderRadius: "12px",
    width:        "100%",
    maxWidth:     "480px",
    position:     "relative",
    overflow:     "hidden",
  },
  modalBorder: {
    position:   "absolute",
    top:        0, left: 0, right: 0,
    height:     "2px",
    background: "linear-gradient(90deg, var(--gold), var(--ice))",
  },
  modalHeader: {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "center",
    marginBottom:   "20px",
  },
  modalTitle: {
    fontWeight:    700,
    fontSize:      "16px",
    letterSpacing: "-0.3px",
  },
  closeBtn: {
    background:   "transparent",
    border:       "1px solid var(--border)",
    borderRadius: "4px",
    color:        "var(--text-dim)",
    width:        "28px",
    height:       "28px",
    cursor:       "pointer",
    display:      "flex",
    alignItems:   "center",
    justifyContent: "center",
    fontSize:     "11px",
  },
  field: {
    marginBottom: "16px",
  },
  label: {
    fontFamily:    "Space Mono, monospace",
    fontSize:      "10px",
    letterSpacing: "1px",
    textTransform: "uppercase",
    color:         "var(--text-dim)",
    display:       "block",
    marginBottom:  "6px",
  },
  input: {
    width:        "100%",
    padding:      "10px 12px",
    background:   "var(--surface2)",
    border:       "1px solid var(--border)",
    borderRadius: "6px",
    color:        "var(--text)",
    fontFamily:   "Syne, sans-serif",
    fontSize:     "13px",
    outline:      "none",
    boxSizing:    "border-box",
  },
  checkRow: {
    display:    "flex",
    alignItems: "flex-start",
    gap:        "10px",
    marginBottom: "20px",
    cursor:     "pointer",
  },
  checkLabel: {
    fontSize:   "13px",
    lineHeight: "1.4",
  },
  modalActions: {
    display:        "flex",
    justifyContent: "flex-end",
    gap:            "10px",
  },
  cancelBtn: {
    padding:      "9px 18px",
    background:   "transparent",
    border:       "1px solid var(--border)",
    borderRadius: "6px",
    color:        "var(--text-dim)",
    fontFamily:   "Syne, sans-serif",
    fontSize:     "13px",
    cursor:       "pointer",
  },
  createBtn: {
    padding:      "9px 20px",
    background:   "var(--gold)",
    border:       "none",
    borderRadius: "6px",
    color:        "#0D1520",
    fontFamily:   "Syne, sans-serif",
    fontWeight:   700,
    fontSize:     "13px",
    cursor:       "pointer",
  },
  errorBox: {
    padding:      "10px 12px",
    background:   "rgba(224,90,78,0.1)",
    border:       "1px solid rgba(224,90,78,0.25)",
    borderRadius: "6px",
    color:        "var(--red)",
    fontFamily:   "Space Mono, monospace",
    fontSize:     "11px",
    marginBottom: "14px",
  },
  loadWrap: {
    display:        "flex",
    flexDirection:  "column",
    alignItems:     "center",
    justifyContent: "center",
    gap:            "12px",
    padding:        "60px 20px",
  },
  spinner: {
    width:        "32px",
    height:       "32px",
    border:       "2px solid var(--border)",
    borderTop:    "2px solid var(--gold)",
    borderRadius: "50%",
    animation:    "spin 0.8s linear infinite",
  },
  emptyState: {
    textAlign:  "center",
    padding:    "60px 20px",
    color:      "var(--text)",
    fontFamily: "Syne, sans-serif",
  },
  // Group detail
  detailHeader: {
    marginBottom: "20px",
  },
  backBtn: {
    background:    "transparent",
    border:        "none",
    color:         "var(--text-dim)",
    fontFamily:    "Space Mono, monospace",
    fontSize:      "10px",
    letterSpacing: "0.5px",
    cursor:        "pointer",
    marginBottom:  "14px",
    padding:       0,
    display:       "block",
  },
  detailHeaderCard: {
    background:   "var(--surface)",
    border:       "1px solid var(--border)",
    borderRadius: "10px",
    overflow:     "hidden",
    position:     "relative",
    marginBottom: "16px",
  },
  groupMetaItem: {
    fontFamily:    "Space Mono, monospace",
    fontSize:      "10px",
    color:         "var(--text-dim)",
    letterSpacing: "0.3px",
  },
  tabs: {
    display: "flex",
    gap:     "4px",
  },
  tab: {
    padding:       "8px 16px",
    background:    "transparent",
    border:        "1px solid var(--border)",
    borderRadius:  "6px",
    color:         "var(--text-dim)",
    fontFamily:    "Space Mono, monospace",
    fontSize:      "10px",
    letterSpacing: "0.5px",
    cursor:        "pointer",
  },
  tabActive: {
    background:  "rgba(201,168,76,0.1)",
    borderColor: "var(--gold)",
    color:       "var(--gold)",
  },
  composeCard: {
    background:   "var(--surface)",
    border:       "1px solid var(--border)",
    borderRadius: "10px",
    overflow:     "hidden",
    position:     "relative",
    marginBottom: "14px",
  },
  composeTextarea: {
    width:       "100%",
    minHeight:   "80px",
    background:  "transparent",
    border:      "none",
    borderBottom: "1px solid var(--border)",
    color:       "var(--text)",
    fontFamily:  "Syne, sans-serif",
    fontSize:    "14px",
    outline:     "none",
    resize:      "none",
    padding:     "0 0 12px 0",
    lineHeight:  "1.5",
    boxSizing:   "border-box",
  },
  composeFooter: {
    display:        "flex",
    justifyContent: "space-between",
    alignItems:     "center",
    paddingTop:     "12px",
  },
  composeHint: {
    fontFamily:    "Space Mono, monospace",
    fontSize:      "9px",
    color:         "var(--text-dim)",
    letterSpacing: "0.5px",
  },
  postBtn: {
    padding:      "7px 16px",
    background:   "var(--gold)",
    border:       "none",
    borderRadius: "5px",
    color:        "#0D1520",
    fontFamily:   "Syne, sans-serif",
    fontWeight:   700,
    fontSize:     "12px",
    cursor:       "pointer",
  },
  postBtnDisabled: {
    padding:      "7px 16px",
    background:   "var(--border)",
    border:       "none",
    borderRadius: "5px",
    color:        "var(--text-dim)",
    fontFamily:   "Syne, sans-serif",
    fontWeight:   700,
    fontSize:     "12px",
    cursor:       "not-allowed",
  },
  postCard: {
    background:   "var(--surface)",
    border:       "1px solid var(--border)",
    borderRadius: "10px",
    overflow:     "hidden",
    position:     "relative",
    marginBottom: "12px",
  },
  postCardBorder: {
    position:   "absolute",
    top:        0, left: 0, right: 0,
    height:     "2px",
    background: "linear-gradient(90deg, var(--blue), var(--purple))",
  },
  postHead: {
    display:      "flex",
    alignItems:   "center",
    gap:          "10px",
    marginBottom: "10px",
  },
  postAvatar: {
    width:          "32px",
    height:         "32px",
    borderRadius:   "50%",
    background:     "linear-gradient(135deg, var(--blue), var(--purple))",
    display:        "flex",
    alignItems:     "center",
    justifyContent: "center",
    fontFamily:     "Space Mono, monospace",
    fontSize:       "10px",
    fontWeight:     700,
    color:          "#fff",
    flexShrink:     0,
  },
  postAuthor: {
    fontWeight: 600,
    fontSize:   "13px",
  },
  postTime: {
    fontFamily: "Space Mono, monospace",
    fontSize:   "9px",
    color:      "var(--text-dim)",
    marginTop:  "1px",
  },
  postContent: {
    fontSize:     "14px",
    lineHeight:   "1.6",
    color:        "var(--text)",
    marginBottom: "10px",
    whiteSpace:   "pre-wrap",
  },
  tagRow: {
    display:      "flex",
    flexWrap:     "wrap",
    gap:          "6px",
    marginBottom: "10px",
  },
  tag: {
    fontFamily:    "Space Mono, monospace",
    fontSize:      "9px",
    padding:       "2px 8px",
    borderRadius:  "3px",
    background:    "rgba(43,95,142,0.15)",
    border:        "1px solid rgba(43,95,142,0.3)",
    color:         "var(--ice)",
    letterSpacing: "0.5px",
  },
  postActions: {
    display:   "flex",
    gap:       "12px",
    marginTop: "4px",
  },
  actionBtn: {
    display:    "flex",
    alignItems: "center",
    gap:        "5px",
    background: "transparent",
    border:     "none",
    cursor:     "pointer",
    fontFamily: "Space Mono, monospace",
    fontSize:   "11px",
    padding:    "4px 0",
  },
  membersList: {
    background:   "var(--surface)",
    border:       "1px solid var(--border)",
    borderRadius: "10px",
    overflow:     "hidden",
  },
  memberRow: {
    display:    "flex",
    alignItems: "center",
    gap:        "12px",
    padding:    "12px 16px",
    borderBottom: "1px solid var(--border)",
  },
  errorState: {
    textAlign:  "center",
    padding:    "60px 20px",
  },
};
