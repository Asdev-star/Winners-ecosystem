import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../auth/authStore";

interface StreamStats {
  totalStreams: number;
  totalViews: number;
  totalTips: number;
  totalSubscribers: number;
  liveViewers: number;
  monthlyRevenue: number;
}

interface RecentStream {
  id: string;
  title: string;
  status: "idle" | "live" | "ended";
  createdAt: string;
  viewerCount: number;
  tipsReceived: number;
  duration?: number;
}

interface Subscriber {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  subscribedAt: string;
  totalTips: number;
}

const CreatorDashboard: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<StreamStats | null>(null);
  const [recentStreams, setRecentStreams] = useState<RecentStream[]>([]);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "overview" | "streams" | "subscribers" | "analytics"
  >("overview");

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, streamsResponse, subscribersResponse] =
        await Promise.all([
          fetch("/api/v1/streams/creator/stats", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
          fetch("/api/v1/streams/creator/recent", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
          fetch("/api/v1/streams/subscribers", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }),
        ]);

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }

      if (streamsResponse.ok) {
        const streamsData = await streamsResponse.json();
        setRecentStreams(streamsData);
      }

      if (subscribersResponse.ok) {
        const subscribersData = await subscribersResponse.json();
        setSubscribers(subscribersData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const goLive = () => {
    navigate("/stream/go-live");
  };

  const watchStream = (streamId: string) => {
    navigate(`/stream/watch/${streamId}`);
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // Check if user has creator permissions
  const plan = user?.tenant?.plan;
  if (plan !== "PRO" && plan !== "ENTERPRISE") {
    return (
      <div className="dashboard-upgrade">
        <h1>Creator Dashboard</h1>
        <p>Upgrade to Pro or Enterprise plan to access creator features.</p>
        <button onClick={() => navigate("/pricing")} className="btn-upgrade">
          View Plans
        </button>
      </div>
    );
  }

  return (
    <div className="creator-dashboard">
      <div className="dashboard-header">
        <h1>🎬 Creator Dashboard</h1>
        <button onClick={goLive} className="btn-go-live">
          🚀 Go Live
        </button>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab ${activeTab === "overview" ? "active" : ""}`}
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === "streams" ? "active" : ""}`}
          onClick={() => setActiveTab("streams")}
        >
          My Streams
        </button>
        <button
          className={`tab ${activeTab === "subscribers" ? "active" : ""}`}
          onClick={() => setActiveTab("subscribers")}
        >
          Subscribers ({subscribers.length})
        </button>
        <button
          className={`tab ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          Analytics
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === "overview" && stats && (
          <div className="overview-section">
            {/* Stats Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📺</div>
                <div className="stat-info">
                  <span className="stat-number">{stats.totalStreams}</span>
                  <span className="stat-label">Total Streams</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">👁️</div>
                <div className="stat-info">
                  <span className="stat-number">
                    {stats.totalViews.toLocaleString()}
                  </span>
                  <span className="stat-label">Total Views</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-info">
                  <span className="stat-number">
                    {formatCurrency(stats.monthlyRevenue)}
                  </span>
                  <span className="stat-label">Monthly Revenue</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">⭐</div>
                <div className="stat-info">
                  <span className="stat-number">{stats.totalSubscribers}</span>
                  <span className="stat-label">Subscribers</span>
                </div>
              </div>

              <div className="stat-card live">
                <div className="stat-icon">🔴</div>
                <div className="stat-info">
                  <span className="stat-number">{stats.liveViewers}</span>
                  <span className="stat-label">Live Viewers</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🎁</div>
                <div className="stat-info">
                  <span className="stat-number">
                    {formatCurrency(stats.totalTips)}
                  </span>
                  <span className="stat-label">Tips Received</span>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity">
              <h2>Recent Streams</h2>
              {recentStreams.length > 0 ? (
                <div className="activity-list">
                  {recentStreams.slice(0, 5).map((stream) => (
                    <div
                      key={stream.id}
                      className="activity-item"
                      onClick={() => watchStream(stream.id)}
                    >
                      <div className="activity-icon">
                        {stream.status === "live" ? "🔴" : "📺"}
                      </div>
                      <div className="activity-content">
                        <h4>{stream.title}</h4>
                        <p>
                          {new Date(stream.createdAt).toLocaleDateString()} •
                          {stream.viewerCount} views •
                          {formatCurrency(stream.tipsReceived)} tips
                          {stream.duration &&
                            ` • ${formatDuration(stream.duration)}`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-activity">
                  <p>No streams yet. Create your first stream!</p>
                  <button onClick={goLive} className="btn-create-stream">
                    Go Live Now
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "streams" && (
          <div className="streams-section">
            <div className="section-header">
              <h2>My Streams</h2>
              <button onClick={goLive} className="btn-create-stream">
                + New Stream
              </button>
            </div>

            {recentStreams.length > 0 ? (
              <div className="streams-table">
                <div className="table-header">
                  <span>Title</span>
                  <span>Date</span>
                  <span>Views</span>
                  <span>Tips</span>
                  <span>Status</span>
                  <span>Actions</span>
                </div>

                {recentStreams.map((stream) => (
                  <div key={stream.id} className="table-row">
                    <span className="stream-title">{stream.title}</span>
                    <span>
                      {new Date(stream.createdAt).toLocaleDateString()}
                    </span>
                    <span>{stream.viewerCount.toLocaleString()}</span>
                    <span>{formatCurrency(stream.tipsReceived)}</span>
                    <span className={`status ${stream.status}`}>
                      {stream.status === "live"
                        ? "🔴 Live"
                        : stream.status === "ended"
                          ? "✅ Ended"
                          : "⏳ Scheduled"}
                    </span>
                    <div className="actions">
                      <button
                        onClick={() => watchStream(stream.id)}
                        className="btn-watch"
                      >
                        👁️ Watch
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-streams">
                <p>You haven't created any streams yet.</p>
                <button onClick={goLive} className="btn-create-stream">
                  Create Your First Stream
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "subscribers" && (
          <div className="subscribers-section">
            <h2>Subscribers ({subscribers.length})</h2>

            {subscribers.length > 0 ? (
              <div className="subscribers-grid">
                {subscribers.map((subscriber) => (
                  <div key={subscriber.id} className="subscriber-card">
                    <div className="subscriber-avatar">
                      {subscriber.avatarUrl ? (
                        <img
                          src={subscriber.avatarUrl}
                          alt={subscriber.displayName}
                        />
                      ) : (
                        <div className="avatar-placeholder">
                          {subscriber.displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    <div className="subscriber-info">
                      <h4>{subscriber.displayName}</h4>
                      <p className="username">@{subscriber.username}</p>
                      <p className="subscribed-date">
                        Subscribed{" "}
                        {new Date(subscriber.subscribedAt).toLocaleDateString()}
                      </p>
                      <p className="tips-total">
                        Total tips: {formatCurrency(subscriber.totalTips)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-subscribers">
                <p>
                  No subscribers yet. Start streaming to build your audience!
                </p>
                <button onClick={goLive} className="btn-create-stream">
                  Go Live Now
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "analytics" && stats && (
          <div className="analytics-section">
            <h2>Analytics</h2>

            <div className="analytics-grid">
              <div className="analytics-card">
                <h3>Revenue Breakdown</h3>
                <div className="revenue-breakdown">
                  <div className="revenue-item">
                    <span className="label">Subscriptions</span>
                    <span className="amount">
                      {formatCurrency(stats.monthlyRevenue * 0.7)}
                    </span>
                  </div>
                  <div className="revenue-item">
                    <span className="label">Tips</span>
                    <span className="amount">
                      {formatCurrency(stats.totalTips)}
                    </span>
                  </div>
                  <div className="revenue-item">
                    <span className="label">Pay-per-view</span>
                    <span className="amount">
                      {formatCurrency(stats.monthlyRevenue * 0.3)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="analytics-card">
                <h3>Performance Metrics</h3>
                <div className="metrics-list">
                  <div className="metric">
                    <span className="label">Average Viewers per Stream</span>
                    <span className="value">
                      {stats.totalStreams > 0
                        ? Math.round(stats.totalViews / stats.totalStreams)
                        : 0}
                    </span>
                  </div>
                  <div className="metric">
                    <span className="label">Subscriber Conversion Rate</span>
                    <span className="value">
                      {stats.totalViews > 0
                        ? (
                            (stats.totalSubscribers / stats.totalViews) *
                            100
                          ).toFixed(1)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="metric">
                    <span className="label">Average Revenue per Stream</span>
                    <span className="value">
                      {formatCurrency(
                        stats.totalStreams > 0
                          ? (stats.monthlyRevenue + stats.totalTips) /
                              stats.totalStreams
                          : 0,
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .creator-dashboard {
          padding: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .dashboard-loading {
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

        .dashboard-upgrade {
          text-align: center;
          padding: 4rem 2rem;
        }

        .dashboard-upgrade h1 {
          margin-bottom: 1rem;
          color: var(--text-primary);
        }

        .btn-upgrade {
          padding: 1rem 2rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .dashboard-header h1 {
          margin: 0;
          color: var(--text-primary);
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

        .dashboard-tabs {
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

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 3rem;
        }

        .stat-card {
          background: white;
          padding: 1.5rem;
          border-radius: 12px;
          border: 1px solid var(--border);
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .stat-card.live {
          border-color: #ff4444;
          background: rgba(255, 68, 68, 0.05);
        }

        .stat-icon {
          font-size: 2rem;
        }

        .stat-info {
          flex: 1;
        }

        .stat-number {
          display: block;
          font-size: 1.5rem;
          font-weight: bold;
          color: var(--text-primary);
        }

        .stat-label {
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .recent-activity h2 {
          margin-bottom: 1rem;
          color: var(--text-primary);
        }

        .activity-list {
          background: white;
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid var(--border);
          cursor: pointer;
          transition: background 0.2s;
        }

        .activity-item:last-child {
          border-bottom: none;
        }

        .activity-item:hover {
          background: var(--light-bg);
        }

        .activity-icon {
          font-size: 1.5rem;
        }

        .activity-content h4 {
          margin: 0 0 0.25rem 0;
          color: var(--text-primary);
        }

        .activity-content p {
          margin: 0;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .no-activity {
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

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .section-header h2 {
          margin: 0;
          color: var(--text-primary);
        }

        .streams-table {
          background: white;
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
          gap: 1rem;
          padding: 1rem;
          background: var(--light-bg);
          font-weight: 600;
          color: var(--text-primary);
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1fr 1fr;
          gap: 1rem;
          padding: 1rem;
          border-bottom: 1px solid var(--border);
          align-items: center;
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .stream-title {
          font-weight: 600;
          color: var(--text-primary);
        }

        .status.live {
          color: #ff4444;
          font-weight: 600;
        }

        .status.ended {
          color: var(--success);
        }

        .actions {
          display: flex;
          gap: 0.5rem;
        }

        .btn-watch {
          padding: 0.5rem 1rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .no-streams {
          text-align: center;
          padding: 3rem;
          color: var(--text-secondary);
        }

        .subscribers-section h2 {
          margin-bottom: 2rem;
          color: var(--text-primary);
        }

        .subscribers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1rem;
        }

        .subscriber-card {
          background: white;
          padding: 1.5rem;
          border: 1px solid var(--border);
          border-radius: 12px;
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .subscriber-avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          overflow: hidden;
        }

        .subscriber-avatar img {
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
          font-weight: bold;
          font-size: 1.5rem;
        }

        .subscriber-info h4 {
          margin: 0 0 0.25rem 0;
          color: var(--text-primary);
        }

        .username {
          color: var(--text-secondary);
          margin: 0 0 0.5rem 0;
          font-size: 0.9rem;
        }

        .subscribed-date,
        .tips-total {
          margin: 0.25rem 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .no-subscribers {
          text-align: center;
          padding: 3rem;
          color: var(--text-secondary);
        }

        .analytics-section h2 {
          margin-bottom: 2rem;
          color: var(--text-primary);
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 2rem;
        }

        .analytics-card {
          background: white;
          padding: 2rem;
          border: 1px solid var(--border);
          border-radius: 12px;
        }

        .analytics-card h3 {
          margin: 0 0 1.5rem 0;
          color: var(--text-primary);
        }

        .revenue-breakdown {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .revenue-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: var(--light-bg);
          border-radius: 6px;
        }

        .revenue-item .label {
          font-weight: 600;
          color: var(--text-primary);
        }

        .revenue-item .amount {
          color: var(--success);
          font-weight: bold;
        }

        .metrics-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .metric {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem;
          background: var(--light-bg);
          border-radius: 6px;
        }

        .metric .label {
          color: var(--text-primary);
        }

        .metric .value {
          font-weight: bold;
          color: var(--primary);
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }

          .dashboard-tabs {
            flex-wrap: wrap;
          }

          .tab {
            padding: 0.75rem 1rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .table-header,
          .table-row {
            grid-template-columns: 1fr;
            gap: 0.5rem;
          }

          .table-row {
            text-align: center;
          }

          .subscribers-grid {
            grid-template-columns: 1fr;
          }

          .analytics-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default CreatorDashboard;
