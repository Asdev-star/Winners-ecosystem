import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "../../lib/api";
import { getAuthHeaders, useAuthStore } from "../auth/authStore";
import ContextBar from "../../components/ui/ContextBar";
import LayerSubNav from "../../components/ui/LayerSubNav";

type SavedPost = {
  id: string;
  content: string;
  createdAt: string;
  author?: {
    id: string;
    name: string;
    email?: string;
  };
  likeCount?: number;
  commentCount?: number;
  tags?: string[];
};

const css = `
.csp-root {
  min-height: 100vh;
  background: var(--bg);
  color: var(--text);
  padding-bottom: 80px;
}
.csp-shell {
  max-width: 980px;
  margin: 0 auto;
  padding: 28px 20px;
}
.csp-header {
  margin-bottom: 20px;
}
.csp-title {
  margin: 0;
  font-family: 'Cormorant Garamond', serif;
  font-size: 34px;
  font-weight: 300;
}
.csp-subtitle {
  margin: 10px 0 0;
  color: var(--text-dim);
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  line-height: 1.65;
}
.csp-grid {
  display: grid;
  gap: 14px;
}
.csp-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 18px;
}
.csp-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}
.csp-author {
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  font-weight: 700;
}
.csp-time {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  color: var(--text-dim);
}
.csp-content {
  margin: 0;
  font-family: 'Syne', sans-serif;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text);
  white-space: pre-wrap;
}
.csp-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}
.csp-tag {
  border-radius: 999px;
  border: 1px solid rgba(201,168,76,0.16);
  background: rgba(201,168,76,0.08);
  padding: 4px 10px;
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  color: var(--gold);
}
.csp-footer {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 14px;
  color: var(--text-dim);
  font-family: 'Space Mono', monospace;
  font-size: 10px;
}
.csp-actions {
  display: flex;
  gap: 10px;
  margin-top: 14px;
}
.csp-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  text-decoration: none;
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  font-weight: 700;
  border: 1px solid var(--border);
  background: rgba(137,196,225,0.06);
  color: var(--ice);
}
.csp-empty {
  margin-top: 20px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 26px 20px;
  text-align: center;
}
.csp-empty-title {
  font-family: 'Syne', sans-serif;
  font-size: 16px;
  font-weight: 700;
}
.csp-empty-copy {
  margin-top: 8px;
  color: var(--text-dim);
  font-size: 14px;
}
`;

function timeAgo(value: string) {
  const timestamp = new Date(value).getTime();
  const diff = Date.now() - timestamp;
  const minutes = Math.max(1, Math.floor(diff / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function SavedPostsPage() {
  const user = useAuthStore((state) => state.user);
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadSavedPosts = async () => {
      try {
        const res = await fetch(`${API_BASE}/community/posts/saved`, {
          headers: getAuthHeaders(),
        });
        if (!res.ok) throw new Error("Failed to fetch saved posts");
        const data = await res.json();
        if (cancelled) return;
        setPosts(Array.isArray(data?.saved) ? data.saved : []);
      } catch {
        if (cancelled) return;
        setPosts([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadSavedPosts();
    return () => {
      cancelled = true;
    };
  }, []);

  const summary = useMemo(
    () =>
      posts.length === 1
        ? "1 post saved for later."
        : `${posts.length} posts saved for later.`,
    [posts.length],
  );

  return (
    <>
      <style>{css}</style>
      <LayerSubNav
        layer="community"
        items={[
          { id: "feed", label: "Feed", href: "/community" },
          { id: "groups", label: "Groups", href: "/community/groups" },
          { id: "discover", label: "Discover", href: "/community/discover" },
          { id: "messages", label: "Messages", href: "/messages" },
          { id: "saved", label: "Saved", href: "/community/saved", badgeType: "new" },
          { id: "analytics", label: "Analytics", href: "/community/analytics" },
        ]}
      />
      <div className="csp-root">
        <div className="csp-shell">
          <ContextBar activeLayer="community" showLabels />
          <div className="csp-header">
            <h1 className="csp-title">Saved Posts</h1>
            <p className="csp-subtitle">
              {summary} Keep useful ideas, opportunities, and conversations close so you can come back when you are ready.
            </p>
          </div>

          {loading ? (
            <div className="csp-empty">
              <div className="csp-empty-title">Loading saved posts...</div>
            </div>
          ) : posts.length === 0 ? (
            <div className="csp-empty">
              <div className="csp-empty-title">Nothing saved yet</div>
              <div className="csp-empty-copy">
                Save posts from the Community feed and they will appear here.
              </div>
              <div className="csp-actions" style={{ justifyContent: "center" }}>
                <a className="csp-link" href="/community">
                  Go to feed
                </a>
              </div>
            </div>
          ) : (
            <div className="csp-grid">
              {posts.map((post) => (
                <article key={post.id} className="csp-card">
                  <div className="csp-meta">
                    <div className="csp-author">{post.author?.name ?? user?.name ?? "Community member"}</div>
                    <div className="csp-time">{timeAgo(post.createdAt)}</div>
                  </div>
                  <p className="csp-content">{post.content}</p>
                  {Array.isArray(post.tags) && post.tags.length > 0 ? (
                    <div className="csp-tags">
                      {post.tags.map((tag) => (
                        <span key={tag} className="csp-tag">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  <div className="csp-footer">
                    <span>❤ {post.likeCount ?? 0}</span>
                    <span>💬 {post.commentCount ?? 0}</span>
                  </div>
                  <div className="csp-actions">
                    <a className="csp-link" href="/community">
                      Back to feed
                    </a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
