import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "../../auth/authStore";

interface Stream {
  id: string;
  title: string;
  status: "offline" | "live" | "ended";
  isPayPerView: boolean;
  ppvPrice?: number;
  muxPlaybackId?: string;
  viewCount: number;
  creator: {
    id: string;
    name: string;
    avatarUrl?: string;
    bio?: string;
  };
  tips: Array<{
    id: string;
    amount: number;
    message?: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
      avatarUrl?: string;
    };
  }>;
  subscriptions: Array<{
    id: string;
    amount: number;
    userId: string;
  }>;
  _count: {
    tips: number;
    subscriptions: number;
  };
}

const WatchPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [stream, setStream] = useState<Stream | null>(null);
  const [loading, setLoading] = useState(true);
  const [chatMessage, setChatMessage] = useState("");
  const [tipAmount, setTipAmount] = useState("");
  const [tipMessage, setTipMessage] = useState("");
  const [showTipModal, setShowTipModal] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);

  useEffect(() => {
    if (id) {
      fetchStream();
    }
  }, [id]);

  useEffect(() => {
    if (stream?.muxPlaybackId && stream.status === "live") {
      initializePlayer();
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [stream]);

  const fetchStream = async () => {
    try {
      const response = await fetch(`/api/v1/streams/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStream(data);
        setIsSubscribed(
          data.subscriptions.some((sub: any) => sub.userId === user?.id),
        );
      }
    } catch (error) {
      console.error("Error fetching stream:", error);
    } finally {
      setLoading(false);
    }
  };

  const initializePlayer = async () => {
    if (!stream?.muxPlaybackId) return;

    try {
      // Load HLS.js dynamically
      const Hls = (await import("hls.js")).default;

      if (Hls.isSupported() && videoRef.current) {
        const hls = new Hls();
        hlsRef.current = hls;

        const playbackUrl = `https://stream.mux.com/${stream.muxPlaybackId}.m3u8`;
        hls.loadSource(playbackUrl);
        hls.attachMedia(videoRef.current);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current?.play();
        });
      } else if (
        videoRef.current?.canPlayType("application/vnd.apple.mpegurl")
      ) {
        // Native HLS support (Safari)
        videoRef.current.src = `https://stream.mux.com/${stream.muxPlaybackId}.m3u8`;
      }
    } catch (error) {
      console.error("Error initializing player:", error);
    }
  };

  const sendTip = async () => {
    if (!tipAmount || !stream) return;

    try {
      const response = await fetch(`/api/v1/streams/${stream.id}/tip`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          amount: parseFloat(tipAmount),
          message: tipMessage.trim() || undefined,
        }),
      });

      if (response.ok) {
        const newTip = await response.json();
        setStream((prev) =>
          prev
            ? {
                ...prev,
                tips: [newTip, ...prev.tips.slice(0, 9)],
              }
            : null,
        );
        setTipAmount("");
        setTipMessage("");
        setShowTipModal(false);
      }
    } catch (error) {
      console.error("Error sending tip:", error);
    }
  };

  const subscribe = async () => {
    if (!stream) return;

    try {
      const response = await fetch(`/api/v1/streams/${stream.id}/subscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          amount: 9.99, // Default subscription price
        }),
      });

      if (response.ok) {
        setIsSubscribed(true);
        alert("Successfully subscribed!");
      }
    } catch (error) {
      console.error("Error subscribing:", error);
    }
  };

  const sendChatMessage = async () => {
    if (!chatMessage.trim()) return;

    // Here you would integrate with a chat service (Socket.io, etc.)
    // For now, we'll just clear the input
    setChatMessage("");
  };

  if (loading) {
    return (
      <div className="watch-page">
        <div className="loading">Loading stream...</div>
      </div>
    );
  }

  if (!stream) {
    return (
      <div className="watch-page">
        <div className="error">Stream not found</div>
      </div>
    );
  }

  const canAccessStream =
    !stream.isPayPerView || isSubscribed || stream.creator.id === user?.id;

  return (
    <div className="watch-page">
      <div className="stream-container">
        <div className="video-section">
          <div className="video-wrapper">
            {canAccessStream ? (
              <>
                <video
                  ref={videoRef}
                  controls
                  autoPlay
                  muted
                  className="stream-video"
                  poster={stream.creator.avatarUrl}
                />
                {stream.status === "live" && (
                  <div className="live-indicator">
                    <span className="pulse"></span>
                    LIVE
                  </div>
                )}
              </>
            ) : (
              <div className="paywall">
                <h3>Premium Stream</h3>
                <p>This stream requires a subscription</p>
                <div className="paywall-actions">
                  <button onClick={subscribe} className="btn-primary">
                    Subscribe for ${stream.ppvPrice}/month
                  </button>
                  <p className="paywall-note">
                    Support {stream.creator.name} and unlock exclusive content
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="stream-info">
            <div className="stream-header">
              <h1>{stream.title}</h1>
              <div className="stream-meta">
                <span className="creator">{stream.creator.name}</span>
                <span className="viewers">
                  👁️ {stream.viewCount.toLocaleString()}
                </span>
                {stream.status === "live" && (
                  <span className="live-badge">LIVE</span>
                )}
              </div>
            </div>

            <div className="stream-actions">
              <button
                onClick={() => setShowTipModal(true)}
                className="btn-tip"
                disabled={!canAccessStream}
              >
                💰 Send Tip
              </button>
              {!isSubscribed && stream.creator.id !== user?.id && (
                <button onClick={subscribe} className="btn-subscribe">
                  ⭐ Subscribe
                </button>
              )}
              <div className="stream-stats">
                <span>Tips: {stream._count.tips}</span>
                <span>Subs: {stream._count.subscriptions}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="sidebar">
          <div className="chat-section">
            <h3>Live Chat</h3>
            <div className="chat-messages">
              {/* Chat messages would go here */}
              <div className="chat-placeholder">
                Chat messages will appear here during live streams
              </div>
            </div>
            <div className="chat-input">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendChatMessage()}
                placeholder="Type a message..."
                disabled={!canAccessStream}
              />
              <button onClick={sendChatMessage} disabled={!canAccessStream}>
                Send
              </button>
            </div>
          </div>

          <div className="tips-section">
            <h3>Recent Tips</h3>
            <div className="tips-list">
              {stream.tips.map((tip) => (
                <div key={tip.id} className="tip-item">
                  <div className="tip-header">
                    <img
                      src={tip.user.avatarUrl || "/default-avatar.png"}
                      alt={tip.user.name}
                      className="tipper-avatar"
                    />
                    <div>
                      <span className="tipper-name">{tip.user.name}</span>
                      <span className="tip-amount">${tip.amount}</span>
                    </div>
                  </div>
                  {tip.message && <p className="tip-message">{tip.message}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Tip Modal */}
      {showTipModal && (
        <div className="modal-overlay" onClick={() => setShowTipModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Send a Tip</h3>
              <button onClick={() => setShowTipModal(false)}>×</button>
            </div>

            <div className="tip-form">
              <div className="form-group">
                <label>Amount ($)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={tipAmount}
                  onChange={(e) => setTipAmount(e.target.value)}
                  placeholder="5.00"
                />
              </div>

              <div className="form-group">
                <label>Message (optional)</label>
                <textarea
                  value={tipMessage}
                  onChange={(e) => setTipMessage(e.target.value)}
                  placeholder="Say something nice..."
                  rows={3}
                />
              </div>

              <div className="tip-presets">
                <button onClick={() => setTipAmount("5")}>$5</button>
                <button onClick={() => setTipAmount("10")}>$10</button>
                <button onClick={() => setTipAmount("25")}>$25</button>
                <button onClick={() => setTipAmount("50")}>$50</button>
              </div>

              <div className="modal-actions">
                <button
                  onClick={() => setShowTipModal(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button onClick={sendTip} className="btn-primary">
                  Send Tip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .watch-page {
          padding: 1rem;
          max-width: 1400px;
          margin: 0 auto;
        }

        .stream-container {
          display: grid;
          grid-template-columns: 1fr 350px;
          gap: 2rem;
        }

        .video-section {
          background: black;
          border-radius: 12px;
          overflow: hidden;
        }

        .video-wrapper {
          position: relative;
          width: 100%;
          height: 0;
          padding-bottom: 56.25%; /* 16:9 aspect ratio */
          background: #000;
        }

        .stream-video {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
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
          z-index: 10;
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

        .paywall {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          text-align: center;
          color: white;
          z-index: 10;
        }

        .paywall h3 {
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
        }

        .paywall-actions {
          margin-top: 2rem;
        }

        .paywall-note {
          margin: 1rem 0 0 0;
          font-size: 0.9rem;
          opacity: 0.8;
        }

        .stream-info {
          padding: 1.5rem;
          background: white;
        }

        .stream-header h1 {
          margin: 0 0 0.5rem 0;
          font-size: 1.5rem;
        }

        .stream-meta {
          display: flex;
          align-items: center;
          gap: 1rem;
          color: var(--text-secondary);
          font-size: 0.9rem;
        }

        .live-badge {
          background: #ff4444;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 0.8rem;
          font-weight: bold;
        }

        .stream-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-top: 1rem;
        }

        .btn-tip,
        .btn-subscribe {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
        }

        .btn-tip {
          background: var(--primary);
          color: white;
        }

        .btn-subscribe {
          background: var(--gold);
          color: black;
        }

        .stream-stats {
          display: flex;
          gap: 1rem;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .sidebar {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .chat-section,
        .tips-section {
          background: white;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1rem;
        }

        .chat-section h3,
        .tips-section h3 {
          margin: 0 0 1rem 0;
          font-size: 1.1rem;
        }

        .chat-messages {
          height: 300px;
          overflow-y: auto;
          margin-bottom: 1rem;
        }

        .chat-placeholder {
          color: var(--text-secondary);
          text-align: center;
          padding: 2rem;
        }

        .chat-input {
          display: flex;
          gap: 0.5rem;
        }

        .chat-input input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid var(--border);
          border-radius: 4px;
        }

        .chat-input button {
          padding: 0.5rem 1rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .tips-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .tip-item {
          padding: 0.75rem;
          border-bottom: 1px solid var(--border);
        }

        .tip-item:last-child {
          border-bottom: none;
        }

        .tip-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 0.5rem;
        }

        .tipper-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }

        .tipper-name {
          font-weight: 500;
        }

        .tip-amount {
          color: var(--primary);
          font-weight: 600;
          margin-left: auto;
        }

        .tip-message {
          margin: 0;
          font-size: 0.9rem;
          color: var(--text-secondary);
          font-style: italic;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 0;
          max-width: 400px;
          width: 90%;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border);
        }

        .modal-header h3 {
          margin: 0;
        }

        .modal-header button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
        }

        .tip-form {
          padding: 1.5rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 500;
        }

        .form-group input,
        .form-group textarea {
          width: 100%;
          padding: 0.5rem;
          border: 1px solid var(--border);
          border-radius: 4px;
        }

        .tip-presets {
          display: flex;
          gap: 0.5rem;
          margin: 1rem 0;
        }

        .tip-presets button {
          padding: 0.5rem 1rem;
          border: 1px solid var(--primary);
          background: white;
          color: var(--primary);
          border-radius: 4px;
          cursor: pointer;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          margin-top: 1.5rem;
        }

        .btn-cancel {
          padding: 0.5rem 1rem;
          border: 1px solid var(--border);
          background: white;
          border-radius: 4px;
          cursor: pointer;
        }

        .btn-primary {
          padding: 0.5rem 1rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }

        .loading,
        .error {
          text-align: center;
          padding: 4rem;
          font-size: 1.2rem;
        }

        @media (max-width: 768px) {
          .stream-container {
            grid-template-columns: 1fr;
          }

          .sidebar {
            order: -1;
          }
        }
      `}</style>
    </div>
  );
};

export default WatchPage;
