import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../auth/authStore";

interface Stream {
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  status: "idle" | "live" | "ended";
  createdAt: string;
  viewerCount: number;
  isPayPerView: boolean;
  ppvPrice?: number;
}

interface Creator {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  followerCount: number;
  isFollowing: boolean;
  isSubscribed: boolean;
}

const ChannelPage: React.FC = () => {
  const { creatorId } = useParams<{ creatorId: string }>();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [creator, setCreator] = useState<Creator | null>(null);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"videos" | "about">("videos");

  useEffect(() => {
    if (creatorId) {
      fetchCreatorData();
    }
  }, [creatorId]);

  const fetchCreatorData = async () => {
    try {
      const [creatorResponse, streamsResponse] = await Promise.all([
        fetch(`/api/v1/users/${creatorId}/profile`),
        fetch(`/api/v1/streams/creator/${creatorId}`),
      ]);

      if (creatorResponse.ok) {
        const creatorData = await creatorResponse.json();
        setCreator(creatorData);
      }

      if (streamsResponse.ok) {
        const streamsData = await streamsResponse.json();
        setStreams(streamsData);
      }
    } catch (error) {
      console.error("Error fetching creator data:", error);
    } finally {
      setLoading(false);
    }
  };

  const followCreator = async () => {
    if (!creator || !user) return;

    try {
      const response = await fetch(`/api/v1/users/${creator.id}/follow`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        setCreator({
          ...creator,
          isFollowing: !creator.isFollowing,
          followerCount: creator.followerCount + (creator.isFollowing ? -1 : 1),
        });
      }
    } catch (error) {
      console.error("Error following creator:", error);
    }
  };

  const subscribeToCreator = async () => {
    if (!creator || !user) return;

    try {
      const response = await fetch(`/api/v1/streams/subscribe/${creator.id}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        setCreator({ ...creator, isSubscribed: !creator.isSubscribed });
        alert(
          creator.isSubscribed
            ? "Unsubscribed successfully"
            : "Subscribed successfully",
        );
      }
    } catch (error) {
      console.error("Error subscribing:", error);
    }
  };

  const watchStream = (streamId: string) => {
    navigate(`/stream/watch/${streamId}`);
  };

  if (loading) {
    return (
      <div className="channel-loading">
        <div className="spinner"></div>
        <p>Loading channel...</p>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="channel-not-found">
        <h1>Channel not found</h1>
        <p>The creator you're looking for doesn't exist.</p>
        <button onClick={() => navigate("/stream")} className="btn-back">
          Back to Streams
        </button>
      </div>
    );
  }

  const liveStreams = streams.filter((s) => s.status === "live");
  const pastStreams = streams.filter((s) => s.status === "ended");

  return (
    <div className="channel-page">
      {/* Channel Header */}
      <div className="channel-header">
        <div className="channel-banner">
          <div className="banner-overlay"></div>
        </div>

        <div className="channel-info">
          <div className="creator-avatar">
            {creator.avatarUrl ? (
              <img src={creator.avatarUrl} alt={creator.displayName} />
            ) : (
              <div className="avatar-placeholder">
                {creator.displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="creator-details">
            <h1>{creator.displayName}</h1>
            <p className="username">@{creator.username}</p>
            <p className="followers">
              {creator.followerCount.toLocaleString()} followers
            </p>

            {creator.bio && <p className="bio">{creator.bio}</p>}
          </div>

          <div className="channel-actions">
            {user && user.id !== creator.id && (
              <>
                <button
                  onClick={followCreator}
                  className={`btn-follow ${creator.isFollowing ? "following" : ""}`}
                >
                  {creator.isFollowing ? "Following" : "Follow"}
                </button>

                <button
                  onClick={subscribeToCreator}
                  className={`btn-subscribe ${creator.isSubscribed ? "subscribed" : ""}`}
                >
                  {creator.isSubscribed ? "Subscribed" : "Subscribe"}
                </button>
              </>
            )}

            {user && user.id === creator.id && (
              <button
                onClick={() => navigate("/stream/go-live")}
                className="btn-go-live"
              >
                🎬 Go Live
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Channel Content */}
      <div className="channel-content">
        <div className="channel-tabs">
          <button
            className={`tab ${activeTab === "videos" ? "active" : ""}`}
            onClick={() => setActiveTab("videos")}
          >
            Videos ({streams.length})
          </button>
          <button
            className={`tab ${activeTab === "about" ? "active" : ""}`}
            onClick={() => setActiveTab("about")}
          >
            About
          </button>
        </div>

        {activeTab === "videos" && (
          <div className="videos-section">
            {/* Live Streams */}
            {liveStreams.length > 0 && (
              <div className="live-streams">
                <h2>🔴 Live Now</h2>
                <div className="streams-grid">
                  {liveStreams.map((stream) => (
                    <div
                      key={stream.id}
                      className="stream-card live"
                      onClick={() => watchStream(stream.id)}
                    >
                      <div className="stream-thumbnail">
                        {stream.thumbnailUrl ? (
                          <img src={stream.thumbnailUrl} alt={stream.title} />
                        ) : (
                          <div className="thumbnail-placeholder">
                            <span>LIVE</span>
                          </div>
                        )}
                        <div className="live-indicator">
                          <span className="pulse"></span>
                          LIVE
                        </div>
                      </div>

                      <div className="stream-info">
                        <h3>{stream.title}</h3>
                        <div className="stream-meta">
                          <span className="viewers">
                            {stream.viewerCount} watching
                          </span>
                          {stream.isPayPerView && (
                            <span className="price">${stream.ppvPrice}/mo</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Past Streams */}
            <div className="past-streams">
              <h2>Previous Streams</h2>
              {pastStreams.length > 0 ? (
                <div className="streams-grid">
                  {pastStreams.map((stream) => (
                    <div
                      key={stream.id}
                      className="stream-card"
                      onClick={() => watchStream(stream.id)}
                    >
                      <div className="stream-thumbnail">
                        {stream.thumbnailUrl ? (
                          <img src={stream.thumbnailUrl} alt={stream.title} />
                        ) : (
                          <div className="thumbnail-placeholder">
                            <span>ENDED</span>
                          </div>
                        )}
                      </div>

                      <div className="stream-info">
                        <h3>{stream.title}</h3>
                        <div className="stream-meta">
                          <span className="date">
                            {new Date(stream.createdAt).toLocaleDateString()}
                          </span>
                          <span className="views">
                            {stream.viewerCount} views
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-streams">
                  <p>No streams yet</p>
                  {user && user.id === creator.id && (
                    <button
                      onClick={() => navigate("/stream/go-live")}
                      className="btn-create-stream"
                    >
                      Create Your First Stream
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "about" && (
          <div className="about-section">
            <div className="about-content">
              <h2>About {creator.displayName}</h2>

              {creator.bio ? (
                <div className="bio-section">
                  <h3>Bio</h3>
                  <p>{creator.bio}</p>
                </div>
              ) : (
                <div className="no-bio">
                  <p>No bio available</p>
                </div>
              )}

              <div className="stats-section">
                <h3>Channel Stats</h3>
                <div className="stats-grid">
                  <div className="stat">
                    <span className="number">{streams.length}</span>
                    <span className="label">Total Streams</span>
                  </div>
                  <div className="stat">
                    <span className="number">{creator.followerCount}</span>
                    <span className="label">Followers</span>
                  </div>
                  <div className="stat">
                    <span className="number">
                      {streams.reduce((sum, s) => sum + s.viewerCount, 0)}
                    </span>
                    <span className="label">Total Views</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .channel-page {
          min-height: 100vh;
          background: var(--bg-primary);
        }

        .channel-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 50vh;
          gap: 1rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--border);
          border-top: 4px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .channel-not-found {
          text-align: center;
          padding: 4rem 2rem;
        }

        .channel-not-found h1 {
          margin-bottom: 1rem;
          color: var(--text-primary);
        }

        .btn-back {
          padding: 0.75rem 1.5rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        .channel-header {
          position: relative;
        }

        .channel-banner {
          height: 200px;
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          position: relative;
        }

        .banner-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
        }

        .channel-info {
          display: flex;
          align-items: flex-end;
          gap: 2rem;
          padding: 2rem;
          margin-top: -60px;
          position: relative;
          z-index: 1;
        }

        .creator-avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          overflow: hidden;
          border: 4px solid white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .creator-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          background: var(--primary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 3rem;
          font-weight: bold;
        }

        .creator-details {
          flex: 1;
        }

        .creator-details h1 {
          margin: 0 0 0.25rem 0;
          font-size: 2rem;
          color: var(--text-primary);
        }

        .username {
          color: var(--text-secondary);
          margin: 0 0 0.5rem 0;
          font-size: 1.1rem;
        }

        .followers {
          color: var(--text-secondary);
          margin: 0 0 1rem 0;
          font-size: 1rem;
        }

        .bio {
          color: var(--text-primary);
          margin: 0;
          max-width: 500px;
        }

        .channel-actions {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .btn-follow,
        .btn-subscribe {
          padding: 0.75rem 1.5rem;
          border: 2px solid var(--primary);
          background: transparent;
          color: var(--primary);
          border-radius: 25px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }

        .btn-follow.following,
        .btn-subscribe.subscribed {
          background: var(--primary);
          color: white;
        }

        .btn-go-live {
          padding: 0.75rem 1.5rem;
          background: var(--success);
          color: white;
          border: none;
          border-radius: 25px;
          cursor: pointer;
          font-weight: 600;
        }

        .channel-content {
          max-width: 1200px;
          margin: 0 auto;
          padding: 2rem;
        }

        .channel-tabs {
          display: flex;
          border-bottom: 1px solid var(--border);
          margin-bottom: 2rem;
        }

        .tab {
          padding: 1rem 2rem;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
          font-size: 1rem;
          font-weight: 600;
          color: var(--text-secondary);
          transition: all 0.2s;
        }

        .tab.active {
          color: var(--primary);
          border-bottom-color: var(--primary);
        }

        .videos-section h2 {
          margin: 0 0 1.5rem 0;
          color: var(--text-primary);
          font-size: 1.5rem;
        }

        .streams-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .stream-card {
          background: white;
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.2s;
        }

        .stream-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .stream-card.live {
          border-color: #ff4444;
          box-shadow: 0 0 0 2px rgba(255, 68, 68, 0.2);
        }

        .stream-thumbnail {
          position: relative;
          aspect-ratio: 16/9;
          overflow: hidden;
        }

        .stream-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .thumbnail-placeholder {
          width: 100%;
          height: 100%;
          background: var(--light-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          font-weight: 600;
        }

        .live-indicator {
          position: absolute;
          top: 10px;
          left: 10px;
          background: rgba(255, 68, 68, 0.9);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .pulse {
          width: 6px;
          height: 6px;
          background: white;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }

        .stream-info {
          padding: 1rem;
        }

        .stream-info h3 {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          color: var(--text-primary);
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .stream-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .price {
          background: var(--primary);
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.8rem;
        }

        .no-streams {
          text-align: center;
          padding: 3rem;
          color: var(--text-secondary);
        }

        .btn-create-stream {
          padding: 0.75rem 1.5rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 600;
        }

        .about-section {
          max-width: 800px;
        }

        .about-content h2 {
          margin-bottom: 2rem;
          color: var(--text-primary);
        }

        .bio-section h3,
        .stats-section h3 {
          margin: 2rem 0 1rem 0;
          color: var(--text-primary);
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 1rem;
        }

        .stat {
          text-align: center;
          padding: 1rem;
          background: var(--light-bg);
          border-radius: 8px;
        }

        .stat .number {
          display: block;
          font-size: 2rem;
          font-weight: bold;
          color: var(--primary);
        }

        .stat .label {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .no-bio {
          color: var(--text-secondary);
          font-style: italic;
        }

        @media (max-width: 768px) {
          .channel-info {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 1rem;
          }

          .channel-actions {
            flex-direction: column;
            width: 100%;
          }

          .btn-follow,
          .btn-subscribe,
          .btn-go-live {
            width: 100%;
          }

          .streams-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default ChannelPage;
