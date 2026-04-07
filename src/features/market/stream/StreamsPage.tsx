import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../auth/authStore";
import { Link } from "react-router-dom";

interface Stream {
  id: string;
  title: string;
  status: "offline" | "live" | "ended";
  isPayPerView: boolean;
  ppvPrice?: number;
  viewCount: number;
  peakViewers: number;
  createdAt: string;
  creator: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  _count: {
    tips: number;
    subscriptions: number;
  };
}

const StreamsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "live" | "vod">("all");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchStreams();
  }, [filter]);

  const fetchStreams = async () => {
    try {
      const status =
        filter === "all" ? undefined : filter === "live" ? "live" : undefined;
      const url = status ? `/api/v1/streams/live` : `/api/v1/streams?limit=50`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStreams(data);
      }
    } catch (error) {
      console.error("Error fetching streams:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStreams = streams.filter(
    (stream) =>
      stream.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stream.creator.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "live":
        return "#ff4444";
      case "ended":
        return "#666";
      default:
        return "#999";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "live":
        return "LIVE";
      case "ended":
        return "ENDED";
      default:
        return "OFFLINE";
    }
  };

  const canCreateStream = () => {
    const plan = user?.tenant?.plan;
    return plan === "PRO" || plan === "ENTERPRISE";
  };

  if (loading) {
    return (
      <div className="streams-page">
        <div className="loading">Loading streams...</div>
      </div>
    );
  }

  return (
    <div className="streams-page">
      <div className="streams-header">
        <h1>🎥 Winners Stream</h1>
        <p>Watch live streams, discover creators, and support your favorites</p>

        <div className="streams-controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search streams or creators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-tabs">
            <button
              className={`tab ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All Streams
            </button>
            <button
              className={`tab ${filter === "live" ? "active" : ""}`}
              onClick={() => setFilter("live")}
            >
              Live Now
            </button>
            <button
              className={`tab ${filter === "vod" ? "active" : ""}`}
              onClick={() => setFilter("vod")}
            >
              Past Streams
            </button>
          </div>

          {canCreateStream() && (
            <Link to="/stream/go-live" className="btn-primary">
              🎬 Go Live
            </Link>
          )}
        </div>
      </div>

      {!canCreateStream() && (
        <div className="plan-notice">
          <h3>Want to start streaming?</h3>
          <p>
            Upgrade to Pro or Enterprise plan to create your own live streams.
          </p>
          <Link to="/billing" className="btn-secondary">
            Upgrade Plan
          </Link>
        </div>
      )}

      <div className="streams-grid">
        {filteredStreams.length === 0 ? (
          <div className="empty-state">
            <h3>No streams found</h3>
            <p>
              {filter === "live"
                ? "No live streams right now. Check back later!"
                : "No streams match your search."}
            </p>
          </div>
        ) : (
          filteredStreams.map((stream) => (
            <div key={stream.id} className="stream-card">
              <div className="stream-thumbnail">
                <div className="stream-status">
                  <span
                    className="status-indicator"
                    style={{ backgroundColor: getStatusColor(stream.status) }}
                  >
                    {getStatusText(stream.status)}
                  </span>
                </div>

                {stream.status === "live" && (
                  <div className="live-indicator">
                    <span className="pulse"></span>
                    LIVE
                  </div>
                )}

                <div className="stream-info">
                  <div className="viewer-count">
                    👁️ {stream.viewCount.toLocaleString()}
                  </div>
                  {stream.isPayPerView && stream.ppvPrice && (
                    <div className="ppv-price">💰 ${stream.ppvPrice}</div>
                  )}
                </div>
              </div>

              <div className="stream-content">
                <h3>{stream.title}</h3>

                <div className="creator-info">
                  <img
                    src={stream.creator.avatarUrl || "/default-avatar.png"}
                    alt={stream.creator.name}
                    className="creator-avatar"
                  />
                  <span className="creator-name">{stream.creator.name}</span>
                </div>

                <div className="stream-stats">
                  <div className="stat">
                    <span className="label">Tips:</span>
                    <span className="value">{stream._count.tips}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Subs:</span>
                    <span className="value">{stream._count.subscriptions}</span>
                  </div>
                  <div className="stat">
                    <span className="label">Peak:</span>
                    <span className="value">{stream.peakViewers}</span>
                  </div>
                </div>
              </div>

              <div className="stream-actions">
                <Link to={`/stream/watch/${stream.id}`} className="btn-primary">
                  {stream.status === "live" ? "Watch Live" : "Watch Replay"}
                </Link>
                <Link
                  to={`/stream/channel/${stream.creator.id}`}
                  className="btn-outline"
                >
                  View Channel
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .streams-page {
          padding: 2rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .streams-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .streams-header h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .streams-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 2rem;
          flex-wrap: wrap;
          gap: 1rem;
        }

        .search-bar input {
          padding: 0.75rem 1rem;
          border: 1px solid var(--border);
          border-radius: 25px;
          width: 300px;
          font-size: 1rem;
        }

        .filter-tabs {
          display: flex;
          gap: 0;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid var(--border);
        }

        .tab {
          padding: 0.75rem 1.5rem;
          border: none;
          background: white;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .tab.active {
          background: var(--primary);
          color: white;
        }

        .btn-primary,
        .btn-secondary,
        .btn-outline {
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 500;
          transition: all 0.2s;
        }

        .btn-primary {
          background: var(--primary);
          color: white;
        }

        .btn-secondary {
          background: var(--secondary);
          color: white;
        }

        .btn-outline {
          border: 1px solid var(--primary);
          color: var(--primary);
          background: white;
        }

        .plan-notice {
          background: linear-gradient(135deg, var(--gold), var(--purple));
          color: white;
          padding: 2rem;
          border-radius: 12px;
          text-align: center;
          margin-bottom: 2rem;
        }

        .plan-notice h3 {
          margin: 0 0 0.5rem 0;
        }

        .streams-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 2rem;
        }

        .stream-card {
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
          background: white;
          transition: box-shadow 0.2s;
        }

        .stream-card:hover {
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .stream-thumbnail {
          height: 180px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.2rem;
          font-weight: bold;
        }

        .stream-status {
          position: absolute;
          top: 10px;
          left: 10px;
        }

        .status-indicator {
          padding: 4px 8px;
          border-radius: 4px;
          color: white;
          font-size: 0.8rem;
          font-weight: bold;
        }

        .live-indicator {
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(255, 0, 0, 0.9);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: bold;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .pulse {
          width: 8px;
          height: 8px;
          background: white;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
          100% {
            opacity: 1;
          }
        }

        .stream-info {
          position: absolute;
          bottom: 10px;
          right: 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .viewer-count,
        .ppv-price {
          background: rgba(0, 0, 0, 0.7);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.8rem;
        }

        .stream-content {
          padding: 1.5rem;
        }

        .stream-content h3 {
          margin: 0 0 1rem 0;
          font-size: 1.2rem;
          line-height: 1.3;
        }

        .creator-info {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }

        .creator-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }

        .creator-name {
          font-weight: 500;
          color: var(--text-secondary);
        }

        .stream-stats {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .stat {
          text-align: center;
        }

        .stat .label {
          display: block;
          font-size: 0.8rem;
          color: var(--text-secondary);
        }

        .stat .value {
          font-weight: 600;
          color: var(--primary);
        }

        .stream-actions {
          padding: 0 1.5rem 1.5rem 1.5rem;
          display: flex;
          gap: 0.5rem;
        }

        .empty-state {
          grid-column: 1 / -1;
          text-align: center;
          padding: 4rem 2rem;
          color: var(--text-secondary);
        }

        .empty-state h3 {
          margin: 0 0 0.5rem 0;
          color: var(--text-primary);
        }

        .loading {
          text-align: center;
          padding: 4rem;
          font-size: 1.2rem;
        }

        @media (max-width: 768px) {
          .streams-controls {
            flex-direction: column;
            align-items: stretch;
          }

          .search-bar input {
            width: 100%;
          }

          .filter-tabs {
            justify-content: center;
          }

          .streams-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default StreamsPage;
