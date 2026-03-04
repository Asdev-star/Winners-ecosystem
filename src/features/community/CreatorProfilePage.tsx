// src/features/community/CreatorProfilePage.tsx
// Phase 2 V2.0 — Creator Public Profile Page
// NOVA Intelligence · Ice-Blue Identity · Public Identity Layer
// Design: CSS variables only · zero hardcoded hex · Syne + Space Mono + Cormorant Garamond

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');

  // Use global CSS variables from index.css

  .cp-root {
    min-height: 100vh;
    background: var(--bg);
    color: var(--text);
    font-family: 'Syne', sans-serif;
  }

  /* Cover image */
  .cp-cover {
    height: 240px;
    background: linear-gradient(135deg, var(--surface) 0%, var(--bg) 100%);
    position: relative;
    overflow: hidden;
  }
  .cp-cover-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.6;
  }
  .cp-cover-pattern {
    position: absolute;
    inset: 0;
    background: 
      radial-gradient(circle at 20% 50%, rgba(137,196,225,0.08) 0%, transparent 50%),
      radial-gradient(circle at 80% 50%, rgba(201,168,76,0.06) 0%, transparent 50%);
  }

  /* Profile header */
  .cp-header {
    max-width: 900px;
    margin: -80px auto 0;
    padding: 0 24px;
    position: relative;
    z-index: 10;
  }
  .cp-header-inner {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    gap: 24px;
    align-items: flex-start;
  }
  .cp-avatar-wrap {
    position: relative;
    flex-shrink: 0;
  }
  .cp-avatar {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    border: 3px solid var(--gold);
    object-fit: cover;
    background: var(--surface2);
  }
  .cp-avatar-ring {
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    border: 2px solid var(--gold);
    opacity: 0.4;
    animation: pulse-ring 2s ease infinite;
  }
  @keyframes pulse-ring {
    0%, 100% { transform: scale(1); opacity: 0.4; }
    50% { transform: scale(1.05); opacity: 0.2; }
  }
  .cp-verified {
    position: absolute;
    bottom: 4px;
    right: 4px;
    width: 28px;
    height: 28px;
    background: var(--green);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    border: 2px solid var(--surface);
  }
  .cp-info {
    flex: 1;
    min-width: 0;
  }
  .cp-name-row {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }
  .cp-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 32px;
    font-weight: 600;
    color: var(--text);
    margin: 0;
  }
  .cp-handle {
    font-family: 'Space Mono', monospace;
    font-size: 13px;
    color: var(--text-dim);
  }
  .cp-bio {
    margin: 12px 0;
    font-size: 15px;
    line-height: 1.6;
    color: var(--text-dim);
  }
  .cp-tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 12px;
  }
  .cp-tag {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    padding: 4px 10px;
    border-radius: 4px;
    background: rgba(137,196,225,0.1);
    color: var(--ice);
    border: 1px solid rgba(137,196,225,0.2);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .cp-tag.skill {
    background: rgba(45,212,160,0.1);
    color: var(--green);
    border-color: rgba(45,212,160,0.2);
  }

  /* Stats row */
  .cp-stats {
    display: flex;
    gap: 24px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border);
  }
  .cp-stat {
    text-align: center;
  }
  .cp-stat-value {
    font-family: 'Syne', sans-serif;
    font-size: 20px;
    font-weight: 800;
    color: var(--text);
  }
  .cp-stat-label {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  /* Action buttons */
  .cp-actions {
    display: flex;
    gap: 12px;
    margin-left: auto;
    align-items: flex-start;
  }
  .cp-btn {
    padding: 10px 20px;
    border-radius: 6px;
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }
  .cp-btn-primary {
    background: var(--gold);
    color: var(--bg);
  }
  .cp-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(201,168,76,0.3);
  }
-.cp-btn-secondary {
    background: transparent;
    color: var(--text); var(--text);
    border: 1px solid var(--border);
  }
  .cp-btn-secondary:hover {
    border-color: var(--text-dim);
    background: var(--surface2);
  }

  /* Content tabs */
  .cp-tabs {
    max-width: 900px;
    margin: 24px auto;
    padding: 0 24px;
  }
  .cp-tabs-nav {
    display: flex;
    gap: 4px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 24px;
  }
  .cp-tab {
    padding: 12px 20px;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: var(--text-dim);
    cursor: pointer;
    border: none;
    background: none;
    position: relative;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .cp-tab:hover {
    color: var(--text);
  }
  .cp-tab.active {
    color: var(--gold);
  }
  .cp-tab.active::after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--gold);
  }

  /* Posts grid */
  .cp-posts {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
  }
  .cp-post {
    aspect-ratio: 1;
    background: var(--surface);
    border-radius: 4px;
    overflow: hidden;
    cursor: pointer;
    position: relative;
    transition: transform 0.2s;
  }
  .cp-post:hover {
    transform: scale(1.02);
    z-index: 1;
  }
  .cp-post-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .cp-post-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    opacity: 0;
    transition: opacity 0.2s;
  }
  .cp-post:hover .cp-post-overlay {
    opacity: 1;
  }
  .cp-post-stat {
    font-family: 'Space Mono', monospace;
    font-size: 12px;
    color: var(--text);
  }

  /* Academy badges */
  .cp-badges {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .cp-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: var(--surface2);
    border-radius: 6px;
    border: 1px solid var(--border);
  }
  .cp-badge-icon {
    font-size: 16px;
  }
  .cp-badge-info {
    flex: 1;
  }
  .cp-badge-name {
    font-size: 11px;
    font-weight: 700;
    color: var(--text);
  }
  .cp-badge-date {
    font-family: 'Space Mono', monospace;
    font-size: 8px;
    color: var(--text-dim);
  }

  /* Work section */
  .cp-work-history {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .cp-work-item {
    display: flex;
    gap: 16px;
    padding: 16px;
    background: var(--surface);
    border-radius: 8px;
    border: 1px solid var(--border);
  }
  .cp-work-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: var(--surface2);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }
  .cp-work-info {
    flex: 1;
  }
  .cp-work-title {
    font-size: 14px;
    font-weight: 700;
    color: var(--text);
  }
  .cp-work-org {
    font-size: 12px;
    color: var(--text-dim);
  }
  .cp-work-meta {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--green);
  }

  /* Empty state */
  .cp-empty {
    text-align: center;
    padding: 60px 24px;
    color: var(--text-dim);
  }
  .cp-empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }
  .cp-empty-text {
    font-size: 14px;
  }

  /* Loading */
  .cp-loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
  }
  .cp-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid var(--border);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Responsive */
  @media (max-width: 768px) {
    .cp-header-inner {
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .cp-avatar {
      width: 100px;
      height: 100px;
    }
    .cp-stats {
      justify-content: center;
    }
    .cp-actions {
      margin-left: 0;
      width: 100%;
      justify-content: center;
    }
    .cp-posts {
      grid-template-columns: repeat(2, 1fr);
    }
  }
`;

// Demo data for preview
const DEMO_CREATOR = {
  id: "creator-1",
  name: "Adaeze Nwosu",
  handle: "@adaeze_builds",
  bio: "Building the future of African fintech. Software engineer @TechHubLagos. Teaching React & Node.js through Winners Academy. 🇳🇬",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=adaeze",
  cover: "https://images.unsplash.com/photo-1557683316-973673baf926?w=1200",
  verified: true,
  tags: ["React", "Node.js", "Fintech", "Mentor"],
  skills: ["TypeScript", "PostgreSQL", "AWS"],
  stats: {
    followers: 2847,
    following: 412,
    posts: 156,
    likes: 18420
  },
  badges: [
    { icon: "🎓", name: "Certified React Developer", date: "2025" },
    { icon: "🎓", name: "Advanced Node.js", date: "2025" },
    { icon: "🏆", name: "Top Creator Q4", date: "2025" }
  ],
  workHistory: [
    { icon: "💼", title: "Senior Engineer", org: "TechHub Lagos", meta: "2024 - Present" },
    { icon: "💼", title: "Freelance Developer", org: "Upwork", meta: "15 contracts" }
  ],
  posts: [
    { id: 1, img: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400", likes: 234, comments: 45 },
    { id: 2, img: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400", likes: 189, comments: 32 },
    { id: 3, img: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400", likes: 312, comments: 67 },
    { id: 4, img: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400", likes: 156, comments: 28 },
    { id: 5, img: "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=400", likes: 98, comments: 12 },
    { id: 6, img: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400", likes: 267, comments: 41 }
  ]
};

type TabType = "posts" | "badges" | "work";

export default function CreatorProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("posts");
  const [creator, setCreator] = useState<typeof DEMO_CREATOR | null>(null);

  useEffect(() => {
    // Simulate loading creator data
    setTimeout(() => {
      setCreator(DEMO_CREATOR);
      setLoading(false);
    }, 800);
  }, [id]);

  if (loading) {
    return (
      <div className="cp-root">
        <style>{css}</style>
        <div className="cp-loading">
          <div className="cp-spinner" />
        </div>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="cp-root">
        <style>{css}</style>
        <div className="cp-empty">
          <div className="cp-empty-icon">🔍</div>
          <div className="cp-empty-text">Creator not found</div>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?.id === creator.id;

  return (
    <div className="cp-root">
      <style>{css}</style>
      
      {/* Cover */}
      <div className="cp-cover">
        {creator.cover && (
          <img src={creator.cover} alt="Cover" className="cp-cover-img" />
        )}
        <div className="cp-cover-pattern" />
      </div>

      {/* Header */}
      <div className="cp-header">
        <div className="cp-header-inner">
          {/* Avatar */}
          <div className="cp-avatar-wrap">
            <img src={creator.avatar} alt={creator.name} className="cp-avatar" />
            <div className="cp-avatar-ring" />
            {creator.verified && (
              <div className="cp-verified" title="Verified">✓</div>
            )}
          </div>

          {/* Info */}
          <div className="cp-info">
            <div className="cp-name-row">
              <h1 className="cp-name">{creator.name}</h1>
              <span className="cp-handle">{creator.handle}</span>
            </div>
            <p className="cp-bio">{creator.bio}</p>
            
            <div className="cp-tags">
              {creator.tags.map((tag, i) => (
                <span key={i} className="cp-tag">{tag}</span>
              ))}
              {creator.skills.map((skill, i) => (
                <span key={i} className="cp-tag skill">{skill}</span>
              ))}
            </div>

            <div className="cp-stats">
              <div className="cp-stat">
                <div className="cp-stat-value">{creator.stats.followers.toLocaleString()}</div>
                <div className="cp-stat-label">Followers</div>
              </div>
              <div className="cp-stat">
                <div className="cp-stat-value">{creator.stats.following}</div>
                <div className="cp-stat-label">Following</div>
              </div>
              <div className="cp-stat">
                <div className="cp-stat-value">{creator.stats.posts}</div>
                <div className="cp-stat-label">Posts</div>
              </div>
              <div className="cp-stat">
                <div className="cp-stat-value">{creator.stats.likes.toLocaleString()}</div>
                <div className="cp-stat-label">Likes</div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="cp-actions">
            {isOwnProfile ? (
              <button className="cp-btn cp-btn-secondary">Edit Profile</button>
            ) : (
              <>
                <button className="cp-btn cp-btn-secondary">Message</button>
                <button className="cp-btn cp-btn-primary">Follow</button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="cp-tabs">
        <div className="cp-tabs-nav">
          <button 
            className={`cp-tab ${activeTab === "posts" ? "active" : ""}`}
            onClick={() => setActiveTab("posts")}
          >
            Posts
          </button>
          <button 
            className={`cp-tab ${activeTab === "badges" ? "active" : ""}`}
            onClick={() => setActiveTab("badges")}
          >
            Badges
          </button>
          <button 
            className={`cp-tab ${activeTab === "work" ? "active" : ""}`}
            onClick={() => setActiveTab("work")}
          >
            Work
          </button>
        </div>

        {/* Posts Tab */}
        {activeTab === "posts" && (
          <div className="cp-posts">
            {creator.posts.map((post) => (
              <div key={post.id} className="cp-post">
                <img src={post.img} alt="Post" className="cp-post-img" />
                <div className="cp-post-overlay">
                  <span className="cp-post-stat">❤️ {post.likes}</span>
                  <span className="cp-post-stat">💬 {post.comments}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Badges Tab */}
        {activeTab === "badges" && (
          <div className="cp-badges">
            {creator.badges.map((badge, i) => (
              <div key={i} className="cp-badge">
                <span className="cp-badge-icon">{badge.icon}</span>
                <div className="cp-badge-info">
                  <div className="cp-badge-name">{badge.name}</div>
                  <div className="cp-badge-date">{badge.date}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Work Tab */}
        {activeTab === "work" && (
          <div className="cp-work-history">
            {creator.workHistory.map((work, i) => (
              <div key={i} className="cp-work-item">
                <div className="cp-work-icon">{work.icon}</div>
                <div className="cp-work-info">
                  <div className="cp-work-title">{work.title}</div>
                  <div className="cp-work-org">{work.org}</div>
                </div>
                <div className="cp-work-meta">{work.meta}</div>
              </div>
            ))}
          </div>
        )}

        {/* Empty tabs */}
        {activeTab === "posts" && creator.posts.length === 0 && (
          <div className="cp-empty">
            <div className="cp-empty-icon">📝</div>
            <div className="cp-empty-text">No posts yet</div>
          </div>
        )}
      </div>
    </div>
  );
}
