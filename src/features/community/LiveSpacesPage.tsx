// src/features/community/LiveSpacesPage.tsx
// Phase 2 V1.4: Live Spaces - Twitter Spaces-style audio rooms

import { useState, useEffect } from "react";
import { useAuthStore } from "../auth/authStore";

const API = import.meta.env.VITE_API_URL || "";

interface LiveSpace {
  id: string;
  title: string;
  description: string | null;
  status: "SCHEDULED" | "LIVE" | "ENDED" | "CANCELLED";
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  maxSpeakers: number;
  maxListeners: number;
  isRecorded: boolean;
  host: { id: string; name: string; email: string };
  _count: { participants: number; speakers: number };
}

export default function LiveSpacesPage() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [spaces, setSpaces] = useState<LiveSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSpace, setNewSpace] = useState({
    title: "",
    description: "",
    scheduledAt: "",
  });
  const [activeSpace, setActiveSpace] = useState<LiveSpace | null>(null);
  const [joining, setJoining] = useState<string | null>(null);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchSpaces = async () => {
    try {
      const res = await fetch(`${API}/spaces`, { headers });
      const data = await res.json().catch(() => null);
      if (res.ok && data) setSpaces(data.spaces || []);
    } catch (err) {
      console.error("Failed to fetch spaces:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpaces();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpace.title.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API}/spaces`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify(newSpace),
      });
      if (res.ok) {
        setShowCreate(false);
        setNewSpace({ title: "", description: "", scheduledAt: "" });
        fetchSpaces();
      }
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (spaceId: string) => {
    setJoining(spaceId);
    try {
      const res = await fetch(`${API}/spaces/${spaceId}/join`, {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ role: "LISTENER" }),
      });
      if (res.ok) {
        setActiveSpace(spaces.find((s) => s.id === spaceId) || null);
      }
    } finally {
      setJoining(null);
    }
  };

  const liveSpaces = spaces.filter((s) => s.status === "LIVE");
  const scheduledSpaces = spaces.filter((s) => s.status === "SCHEDULED");
  const endedSpaces = spaces.filter((s) => s.status === "ENDED");

  return (
    <>
      <style>{css}</style>
      <div className="ls-root">
        <div className="ls-header">
          <div className="ls-title">
            📡 Live Spaces
            <span className="ls-badge">{liveSpaces.length} Live</span>
          </div>
          <button className="ls-create-btn" onClick={() => setShowCreate(true)}>
            + Start Space
          </button>
        </div>

        {showCreate && (
          <div className="ls-modal">
            <div className="ls-modal-content">
              <h3>Start a Live Space</h3>
              <form onSubmit={handleCreate}>
                <input
                  type="text"
                  placeholder="Space title..."
                  value={newSpace.title}
                  onChange={(e) =>
                    setNewSpace({ ...newSpace, title: e.target.value })
                  }
                  autoFocus
                />
                <textarea
                  placeholder="Description (optional)..."
                  value={newSpace.description}
                  onChange={(e) =>
                    setNewSpace({ ...newSpace, description: e.target.value })
                  }
                />
                <input
                  type="datetime-local"
                  value={newSpace.scheduledAt}
                  onChange={(e) =>
                    setNewSpace({ ...newSpace, scheduledAt: e.target.value })
                  }
                />
                <div className="ls-modal-actions">
                  <button
                    type="button"
                    className="ls-cancel-btn"
                    onClick={() => setShowCreate(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="ls-submit-btn"
                    disabled={creating || !newSpace.title.trim()}
                  >
                    {creating ? "Creating..." : "Start Space"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {loading ? (
          <div className="ls-loading">Loading spaces...</div>
        ) : (
          <>
            {liveSpaces.length > 0 && (
              <section className="ls-section">
                <h2 className="ls-section-title">🔴 Live Now</h2>
                <div className="ls-grid">
                  {liveSpaces.map((space) => (
                    <div key={space.id} className="ls-card live">
                      <div className="ls-card-header">
                        <span className="ls-live-badge">● LIVE</span>
                        <span className="ls-listener-count">
                          👂 {space._count.participants} listening
                        </span>
                      </div>
                      <h3>{space.title}</h3>
                      {space.description && <p>{space.description}</p>}
                      <div className="ls-card-footer">
                        <span className="ls-host">
                          Hosted by {space.host.name}
                        </span>
                        <button
                          className="ls-join-btn"
                          onClick={() => handleJoin(space.id)}
                          disabled={joining === space.id}
                        >
                          {joining === space.id ? "Joining..." : "Join 🎙️"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {scheduledSpaces.length > 0 && (
              <section className="ls-section">
                <h2 className="ls-section-title">📅 Upcoming</h2>
                <div className="ls-grid">
                  {scheduledSpaces.map((space) => (
                    <div key={space.id} className="ls-card">
                      <div className="ls-card-header">
                        <span className="ls-scheduled-badge">SCHEDULED</span>
                        {space.scheduledAt && (
                          <span className="ls-schedule-time">
                            {new Date(space.scheduledAt).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <h3>{space.title}</h3>
                      {space.description && <p>{space.description}</p>}
                      <div className="ls-card-footer">
                        <span className="ls-host">
                          Hosted by {space.host.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {endedSpaces.length > 0 && (
              <section className="ls-section">
                <h2 className="ls-section-title">✅ Past Spaces</h2>
                <div className="ls-grid">
                  {endedSpaces.slice(0, 6).map((space) => (
                    <div key={space.id} className="ls-card ended">
                      <h3>{space.title}</h3>
                      <div className="ls-card-footer">
                        <span className="ls-host">
                          Hosted by {space.host.name}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {spaces.length === 0 && (
              <div className="ls-empty">
                <div className="ls-empty-icon">📡</div>
                <h3>No Live Spaces</h3>
                <p>
                  Start a space to connect with the Winners community through
                  live audio conversations.
                </p>
                <button
                  className="ls-create-btn"
                  onClick={() => setShowCreate(true)}
                >
                  Start Your First Space
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

const css = `
  .ls-root {
    max-width: 1280px;
    margin: 0 auto;
    padding: 24px;
    font-family: 'Syne', sans-serif;
  }
  .ls-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  .ls-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
    font-weight: 600;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .ls-badge {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: var(--red);
    background: rgba(224, 90, 78, 0.1);
    padding: 4px 8px;
    border-radius: 4px;
  }
  .ls-create-btn {
    background: var(--gold);
    color: var(--bg);
    border: none;
    border-radius: 6px;
    padding: 10px 20px;
    font-family: 'Syne', sans-serif;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .ls-create-btn:hover { background: var(--gold-light); }

  .ls-section { margin-bottom: 32px; }
  .ls-section-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-dim);
    margin-bottom: 16px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .ls-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 16px;
  }
  .ls-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 16px;
    position: relative;
  }
  .ls-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--gold), transparent);
  }
  .ls-card.live::before { background: linear-gradient(90deg, var(--red), transparent); }
  .ls-card.ended { opacity: 0.6; }
  .ls-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  .ls-live-badge {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--red);
    animation: pulse 1s infinite;
  }
  .ls-scheduled-badge {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--ice);
  }
  .ls-schedule-time {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--text-dim);
  }
  .ls-listener-count {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: var(--text-dim);
  }
  .ls-card h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--text);
    margin: 0 0 8px 0;
  }
  .ls-card p {
    font-size: 13px;
    color: var(--text-dim);
    margin: 0 0 12px 0;
    line-height: 1.4;
  }
  .ls-card-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .ls-host {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: var(--text-dim);
  }
  .ls-join-btn {
    background: var(--purple);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 8px 16px;
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  .ls-join-btn:hover:not(:disabled) { background: var(--purple-light); }
  .ls-join-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .ls-empty {
    text-align: center;
    padding: 60px 20px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
  }
  .ls-empty-icon { font-size: 48px; margin-bottom: 16px; }
  .ls-empty h3 { color: var(--text); margin: 0 0 8px 0; }
  .ls-empty p { color: var(--text-dim); margin: 0 0 20px 0; }

  .ls-modal {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  .ls-modal-content {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 24px;
    width: 90%;
    max-width: 480px;
  }
  .ls-modal-content h3 {
    color: var(--text);
    margin: 0 0 20px 0;
    font-family: 'Cormorant Garamond', serif;
  }
  .ls-modal-content input,
  .ls-modal-content textarea {
    width: 100%;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 12px;
    color: var(--text);
    font-family: 'Syne', sans-serif;
    font-size: 14px;
    margin-bottom: 12px;
  }
  .ls-modal-content textarea {
    min-height: 80px;
    resize: vertical;
  }
  .ls-modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 16px;
  }
  .ls-cancel-btn {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text-dim);
    border-radius: 6px;
    padding: 10px 16px;
    cursor: pointer;
  }
  .ls-submit-btn {
    background: var(--gold);
    color: var(--bg);
    border: none;
    border-radius: 6px;
    padding: 10px 20px;
    font-weight: 600;
    cursor: pointer;
  }
  .ls-submit-btn:disabled { opacity: 0.5; }

  .ls-loading {
    text-align: center;
    padding: 40px;
    color: var(--text-dim);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
`;
