// src/features/community/CommunityPage.tsx

import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../auth/authStore";

const API = import.meta.env.VITE_API_URL ?? "";

const css = `
  .cm-root { padding: 0; font-family: 'Syne', sans-serif; color: var(--text); display: flex; min-height: 100vh; }

  /* Layout */
  .cm-feed-col  { flex: 1; max-width: 640px; margin: 0 auto; padding: 24px 16px 80px; }
  .cm-side-col  { width: 260px; padding: 24px 16px; flex-shrink: 0; }

  /* Header */
  .cm-header { margin-bottom: 24px; }
  .cm-title  { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
  .cm-title span { color: var(--gold); }
  .cm-subtitle { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); margin-top: 4px; }

  /* Create post */
  .cm-create { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 20px; }
  .cm-create-row { display: flex; gap: 10px; align-items: flex-start; }
  .cm-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--gold-dim); border: 2px solid var(--gold); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 800; color: var(--gold); flex-shrink: 0; }
  .cm-textarea { flex: 1; background: var(--surface2); border: 1px solid var(--border); border-radius: 6px; padding: 10px 14px; font-family: 'Syne', sans-serif; font-size: 13px; color: var(--text); outline: none; resize: none; min-height: 60px; transition: border-color 0.15s; }
  .cm-textarea:focus { border-color: var(--gold); min-height: 100px; }
  .cm-textarea::placeholder { color: var(--text-dim); }
  .cm-create-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 1px solid var(--border); }
  .cm-tag-input { background: transparent; border: none; outline: none; font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); width: 160px; }
  .cm-tag-input::placeholder { color: var(--text-dim); }
  .cm-post-btn { background: var(--gold); color: #080B10; border: none; border-radius: 4px; padding: 8px 18px; font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; cursor: pointer; transition: opacity 0.15s; }
  .cm-post-btn:hover { opacity: 0.88; }
  .cm-post-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Post card */
  .cm-post { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 18px; margin-bottom: 14px; transition: border-color 0.15s; }
  .cm-post:hover { border-color: rgba(201,168,76,0.3); }
  .cm-post-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
  .cm-post-author { font-weight: 700; font-size: 13px; }
  .cm-post-meta   { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }
  .cm-post-edited { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); margin-left: 6px; }
  .cm-post-pinned { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--gold); background: var(--gold-dim); padding: 1px 6px; border-radius: 2px; margin-left: auto; }
  .cm-post-content { font-size: 14px; line-height: 1.65; margin-bottom: 12px; white-space: pre-wrap; word-break: break-word; }
  .cm-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 12px; }
  .cm-tag  { font-family: 'Space Mono', monospace; font-size: 9px; padding: 2px 8px; border-radius: 2px; background: var(--blue-dim); color: var(--ice); border: 1px solid rgba(137,196,225,0.2); cursor: pointer; }
  .cm-tag:hover { background: rgba(43,95,142,0.25); }
  .cm-post-actions { display: flex; gap: 16px; align-items: center; }
  .cm-action-btn { background: none; border: none; cursor: pointer; font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); display: flex; align-items: center; gap: 5px; padding: 4px 8px; border-radius: 4px; transition: all 0.15s; }
  .cm-action-btn:hover { color: var(--text); background: var(--surface2); }
  .cm-action-btn.liked { color: var(--gold); }
  .cm-action-btn.liked:hover { color: var(--gold); }
  .cm-del-btn { margin-left: auto; font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); background: none; border: none; cursor: pointer; }
  .cm-del-btn:hover { color: #E05A4E; }

  /* Comments */
  .cm-comments { margin-top: 14px; padding-top: 14px; border-top: 1px solid var(--border); }
  .cm-comment { display: flex; gap: 8px; margin-bottom: 10px; }
  .cm-comment-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--surface2); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; color: var(--text-dim); flex-shrink: 0; }
  .cm-comment-body { flex: 1; background: var(--surface2); border-radius: 6px; padding: 8px 12px; }
  .cm-comment-author { font-size: 12px; font-weight: 700; margin-bottom: 2px; }
  .cm-comment-text  { font-size: 12px; line-height: 1.5; color: var(--text-dim); }
  .cm-comment-time  { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); margin-top: 4px; }
  .cm-comment-input-row { display: flex; gap: 8px; margin-top: 10px; }
  .cm-comment-input { flex: 1; background: var(--surface2); border: 1px solid var(--border); border-radius: 4px; padding: 7px 12px; font-family: 'Syne', sans-serif; font-size: 12px; color: var(--text); outline: none; }
  .cm-comment-input:focus { border-color: var(--gold); }
  .cm-comment-input::placeholder { color: var(--text-dim); }
  .cm-comment-send { background: var(--gold); color: #080B10; border: none; border-radius: 4px; padding: 7px 14px; font-size: 12px; font-weight: 700; cursor: pointer; }
  .cm-comment-send:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Sidebar */
  .cm-side-card { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 16px; }
  .cm-side-title { font-size: 12px; font-weight: 700; letter-spacing: 0.5px; margin-bottom: 12px; color: var(--gold); font-family: 'Space Mono', monospace; text-transform: uppercase; font-size: 10px; }
  .cm-side-user { display: flex; align-items: center; gap: 8px; margin-bottom: 10px; }
  .cm-side-user-name { font-size: 12px; font-weight: 700; }
  .cm-side-user-meta { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); }
  .cm-follow-btn { margin-left: auto; background: transparent; border: 1px solid var(--border); border-radius: 3px; padding: 3px 10px; font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); cursor: pointer; transition: all 0.15s; }
  .cm-follow-btn:hover { border-color: var(--gold); color: var(--gold); }
  .cm-follow-btn.following { background: var(--gold-dim); border-color: var(--gold); color: var(--gold); }

  /* Empty / loading */
  .cm-empty   { padding: 40px; text-align: center; font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); }
  .cm-loading { padding: 40px; text-align: center; font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); animation: pulse 1.5s ease infinite; }
  .cm-load-more { width: 100%; background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 12px; font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim); cursor: pointer; transition: all 0.15s; margin-top: 8px; }
  .cm-load-more:hover { border-color: var(--gold); color: var(--gold); }

  @media (max-width: 768px) {
    .cm-side-col { display: none; }
    .cm-feed-col { padding: 16px 12px 80px; }
  }
`;

if (typeof document !== "undefined" && !document.getElementById("cm-styles")) {
  const tag = document.createElement("style");
  tag.id = "cm-styles"; tag.textContent = css;
  document.head.appendChild(tag);
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7)  return `${days}d ago`;
  return new Date(date).toLocaleDateString();
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name?.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "?";
  return (
    <div className="cm-avatar" style={{ width: size, height: size, fontSize: size * 0.36 }}>
      {initials}
    </div>
  );
}

export default function CommunityPage() {
  const token = useAuthStore((s) => s.token);
  const user  = useAuthStore((s) => s.user);

  const [posts, setPosts]       = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [hasMore, setHasMore]   = useState(false);
  const [page, setPage]         = useState(0);
  const [content, setContent]   = useState("");
  const [tags, setTags]         = useState("");
  const [posting, setPosting]   = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, any[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [members, setMembers]   = useState<any[]>([]);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  useEffect(() => { loadFeed(0, true); loadMembers(); }, []);

  const loadFeed = async (p: number, reset = false) => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/posts?page=${p}&limit=10`, { headers });
      const data = await res.json();
      setPosts((prev) => reset ? data.posts : [...prev, ...data.posts]);
      setHasMore(data.hasMore);
      setPage(p);
    } catch {}
    finally { setLoading(false); }
  };

  const loadMembers = async () => {
    // Load recent active users from team endpoint
    try {
      const res  = await fetch(`${API}/team`, { headers });
      const data = await res.json();
      setMembers((data.members ?? []).slice(0, 5));
    } catch {}
  };

  const createPost = async () => {
    if (!content.trim()) return;
    setPosting(true);
    try {
      const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
      const res  = await fetch(`${API}/posts`, {
        method: "POST", headers,
        body: JSON.stringify({ content, tags: tagList }),
      });
      const post = await res.json();
      setPosts((prev) => [post, ...prev]);
      setContent(""); setTags("");
    } catch {}
    finally { setPosting(false); }
  };

  const toggleLike = async (postId: string) => {
    try {
      const res  = await fetch(`${API}/posts/${postId}/like`, { method: "POST", headers });
      const data = await res.json();
      setPosts((prev) => prev.map((p) =>
        p.id === postId ? { ...p, liked: data.liked, _count: { ...p._count, likes: data.count } } : p
      ));
    } catch {}
  };

  const toggleComments = async (postId: string) => {
    const next = new Set(expanded);
    if (next.has(postId)) { next.delete(postId); }
    else {
      next.add(postId);
      if (!comments[postId]) {
        try {
          const res  = await fetch(`${API}/posts/${postId}`, { headers });
          const data = await res.json();
          setComments((prev) => ({ ...prev, [postId]: data.comments ?? [] }));
        } catch {}
      }
    }
    setExpanded(next);
  };

  const sendComment = async (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!text) return;
    try {
      const res  = await fetch(`${API}/posts/${postId}/comments`, {
        method: "POST", headers, body: JSON.stringify({ content: text }),
      });
      const comment = await res.json();
      setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] ?? []), comment] }));
      setCommentText((prev) => ({ ...prev, [postId]: "" }));
      setPosts((prev) => prev.map((p) =>
        p.id === postId ? { ...p, _count: { ...p._count, comments: p._count.comments + 1 } } : p
      ));
    } catch {}
  };

  const deletePost = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    try {
      await fetch(`${API}/posts/${postId}`, { method: "DELETE", headers });
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch {}
  };

  return (
    <div className="cm-root">
      <div className="cm-feed-col">
        <div className="cm-header">
          <h1 className="cm-title">Community <span>Feed</span></h1>
          <p className="cm-subtitle">Connect, share, and grow together</p>
        </div>

        {/* Create post */}
        <div className="cm-create">
          <div className="cm-create-row">
            <Avatar name={user?.name ?? "?"} />
            <textarea
              className="cm-textarea"
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) createPost(); }}
            />
          </div>
          <div className="cm-create-footer">
            <input className="cm-tag-input" placeholder="# tags, comma separated" value={tags} onChange={(e) => setTags(e.target.value)} />
            <button className="cm-post-btn" onClick={createPost} disabled={!content.trim() || posting}>
              {posting ? "Posting…" : "Post"}
            </button>
          </div>
        </div>

        {/* Feed */}
        {loading && posts.length === 0 ? (
          <div className="cm-loading">Loading feed…</div>
        ) : posts.length === 0 ? (
          <div className="cm-empty">No posts yet. Be the first to share something!</div>
        ) : (
          <>
            {posts.map((post) => (
              <div key={post.id} className="cm-post">
                <div className="cm-post-header">
                  <Avatar name={post.author?.name ?? "?"} size={34} />
                  <div>
                    <div className="cm-post-author">{post.author?.name ?? "Unknown"}</div>
                    <div className="cm-post-meta">
                      {timeAgo(post.createdAt)}
                      {post.edited && <span className="cm-post-edited">· edited</span>}
                    </div>
                  </div>
                  {post.pinned && <span className="cm-post-pinned">📌 Pinned</span>}
                </div>

                <div className="cm-post-content">{post.content}</div>

                {post.tags?.length > 0 && (
                  <div className="cm-tags">
                    {post.tags.map((t: any) => (
                      <span key={t.tag.id} className="cm-tag">#{t.tag.name}</span>
                    ))}
                  </div>
                )}

                <div className="cm-post-actions">
                  <button className={`cm-action-btn${post.liked ? " liked" : ""}`} onClick={() => toggleLike(post.id)}>
                    {post.liked ? "⭐" : "☆"} {post._count?.likes ?? 0}
                  </button>
                  <button className="cm-action-btn" onClick={() => toggleComments(post.id)}>
                    💬 {post._count?.comments ?? 0}
                  </button>
                  {post.author?.id === user?.id && (
                    <button className="cm-del-btn" onClick={() => deletePost(post.id)}>Delete</button>
                  )}
                </div>

                {expanded.has(post.id) && (
                  <div className="cm-comments">
                    {(comments[post.id] ?? []).map((c: any) => (
                      <div key={c.id} className="cm-comment">
                        <div className="cm-comment-avatar">{c.author?.name?.[0]?.toUpperCase()}</div>
                        <div className="cm-comment-body">
                          <div className="cm-comment-author">{c.author?.name}</div>
                          <div className="cm-comment-text">{c.content}</div>
                          <div className="cm-comment-time">{timeAgo(c.createdAt)}</div>
                        </div>
                      </div>
                    ))}
                    <div className="cm-comment-input-row">
                      <input
                        className="cm-comment-input"
                        placeholder="Write a comment…"
                        value={commentText[post.id] ?? ""}
                        onChange={(e) => setCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === "Enter") sendComment(post.id); }}
                      />
                      <button className="cm-comment-send" onClick={() => sendComment(post.id)} disabled={!commentText[post.id]?.trim()}>
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {hasMore && (
              <button className="cm-load-more" onClick={() => loadFeed(page + 1)}>
                Load more posts…
              </button>
            )}
          </>
        )}
      </div>

      {/* Sidebar */}
      <div className="cm-side-col">
        <div className="cm-side-card">
          <div className="cm-side-title">Your Profile</div>
          <div className="cm-side-user">
            <Avatar name={user?.name ?? "?"} size={40} />
            <div>
              <div className="cm-side-user-name">{user?.name}</div>
              <div className="cm-side-user-meta">{user?.role?.toLowerCase()}</div>
            </div>
          </div>
        </div>

        {members.length > 0 && (
          <div className="cm-side-card">
            <div className="cm-side-title">Team Members</div>
            {members.map((m: any) => (
              <div key={m.id} className="cm-side-user">
                <Avatar name={m.name ?? "?"} size={30} />
                <div>
                  <div className="cm-side-user-name" style={{ fontSize: 12 }}>{m.name}</div>
                  <div className="cm-side-user-meta">{m.role?.toLowerCase()}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="cm-side-card">
          <div className="cm-side-title">Quick Tips</div>
          <div style={{ fontFamily: "Space Mono, monospace", fontSize: 10, color: "var(--text-dim)", lineHeight: 1.7 }}>
            ⭐ Star posts you find useful<br />
            💬 Comment to start discussions<br />
            # Use tags to organize posts<br />
            ⌘ + Enter to post quickly
          </div>
        </div>
      </div>
    </div>
  );
}