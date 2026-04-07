import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../auth/authStore";

const GoLivePage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [streamData, setStreamData] = useState({
    title: "",
    isPayPerView: false,
    ppvPrice: 9.99,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [stream, setStream] = useState<any>(null);
  const [streamStatus, setStreamStatus] = useState<
    "idle" | "creating" | "ready" | "live" | "ended"
  >("idle");

  useEffect(() => {
    // Check if user has permission to stream
    const plan = user?.tenant?.plan;
    if (plan !== "PRO" && plan !== "ENTERPRISE") {
      navigate("/stream");
      return;
    }
  }, [user, navigate]);

  const createStream = async () => {
    if (!streamData.title.trim()) {
      alert("Please enter a stream title");
      return;
    }

    setIsCreating(true);
    setStreamStatus("creating");

    try {
      const response = await fetch("/api/v1/streams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(streamData),
      });

      if (response.ok) {
        const newStream = await response.json();
        setStream(newStream);
        setStreamStatus("ready");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create stream");
        setStreamStatus("idle");
      }
    } catch (error) {
      console.error("Error creating stream:", error);
      alert("Failed to create stream");
      setStreamStatus("idle");
    } finally {
      setIsCreating(false);
    }
  };

  const startStream = async () => {
    if (!stream) return;

    try {
      const response = await fetch(`/api/v1/streams/${stream.id}/start`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        setStreamStatus("live");
        // Redirect to watch page
        navigate(`/stream/watch/${stream.id}`);
      } else {
        alert("Failed to start stream");
      }
    } catch (error) {
      console.error("Error starting stream:", error);
      alert("Failed to start stream");
    }
  };

  const endStream = async () => {
    if (!stream) return;

    try {
      const response = await fetch(`/api/v1/streams/${stream.id}/end`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        setStreamStatus("ended");
        alert("Stream ended successfully");
        navigate("/stream");
      }
    } catch (error) {
      console.error("Error ending stream:", error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  return (
    <div className="go-live-page">
      <div className="go-live-container">
        <div className="go-live-header">
          <h1>🎬 Go Live</h1>
          <p>Start streaming to your audience</p>
        </div>

        {streamStatus === "idle" && (
          <div className="setup-section">
            <h2>Stream Setup</h2>

            <div className="form-group">
              <label>Stream Title</label>
              <input
                type="text"
                value={streamData.title}
                onChange={(e) =>
                  setStreamData({ ...streamData, title: e.target.value })
                }
                placeholder="What's your stream about?"
                maxLength={100}
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={streamData.isPayPerView}
                  onChange={(e) =>
                    setStreamData({
                      ...streamData,
                      isPayPerView: e.target.checked,
                    })
                  }
                />
                Make this a pay-per-view stream
              </label>
            </div>

            {streamData.isPayPerView && (
              <div className="form-group">
                <label>Subscription Price ($/month)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={streamData.ppvPrice}
                  onChange={(e) =>
                    setStreamData({
                      ...streamData,
                      ppvPrice: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
            )}

            <div className="stream-tips">
              <h3>💡 Streaming Tips</h3>
              <ul>
                <li>Test your internet connection and streaming software</li>
                <li>Use a good microphone and webcam for better quality</li>
                <li>Engage with your audience through chat</li>
                <li>Promote your stream in advance to build audience</li>
              </ul>
            </div>

            <button
              onClick={createStream}
              disabled={isCreating || !streamData.title.trim()}
              className="btn-create-stream"
            >
              {isCreating ? "Creating Stream..." : "Create Stream"}
            </button>
          </div>
        )}

        {streamStatus === "creating" && (
          <div className="loading-section">
            <div className="spinner"></div>
            <h3>Setting up your stream...</h3>
            <p>This may take a few moments</p>
          </div>
        )}

        {streamStatus === "ready" && stream && (
          <div className="ready-section">
            <div className="success-message">
              <h2>✅ Stream Created!</h2>
              <p>
                Your stream is ready to go live. Configure your streaming
                software with the details below.
              </p>
            </div>

            <div className="stream-details">
              <div className="detail-group">
                <h3>Stream Information</h3>
                <div className="detail-item">
                  <span className="label">Title:</span>
                  <span className="value">{stream.title}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Status:</span>
                  <span className="value">Ready to stream</span>
                </div>
                {stream.isPayPerView && (
                  <div className="detail-item">
                    <span className="label">Price:</span>
                    <span className="value">${stream.ppvPrice}/month</span>
                  </div>
                )}
              </div>

              <div className="detail-group">
                <h3>Streaming Settings</h3>
                <div className="detail-item">
                  <span className="label">Server URL:</span>
                  <span
                    className="value selectable"
                    onClick={() => copyToClipboard(stream.rtmpUrl)}
                  >
                    {stream.rtmpUrl}
                  </span>
                  <button
                    onClick={() => copyToClipboard(stream.rtmpUrl)}
                    className="copy-btn"
                  >
                    📋
                  </button>
                </div>
                <div className="detail-item">
                  <span className="label">Stream Key:</span>
                  <span
                    className="value selectable"
                    onClick={() => copyToClipboard(stream.streamKey)}
                  >
                    {stream.streamKey}
                  </span>
                  <button
                    onClick={() => copyToClipboard(stream.streamKey)}
                    className="copy-btn"
                  >
                    📋
                  </button>
                </div>
              </div>
            </div>

            <div className="streaming-software">
              <h3>📺 Streaming Software Setup</h3>
              <div className="software-grid">
                <div className="software-item">
                  <h4>OBS Studio</h4>
                  <ol>
                    <li>Open OBS Studio</li>
                    <li>Go to Settings → Stream</li>
                    <li>Select "Custom" service</li>
                    <li>Enter Server and Stream Key above</li>
                    <li>Click "Start Streaming"</li>
                  </ol>
                </div>

                <div className="software-item">
                  <h4>Streamlabs OBS</h4>
                  <ol>
                    <li>Open Streamlabs OBS</li>
                    <li>Go to Settings → Stream</li>
                    <li>Select "Custom Streaming Server"</li>
                    <li>Enter Server and Stream Key above</li>
                    <li>Click "Go Live"</li>
                  </ol>
                </div>

                <div className="software-item">
                  <h4>Other Software</h4>
                  <p>
                    Use RTMP protocol with the server URL and stream key
                    provided above.
                  </p>
                </div>
              </div>
            </div>

            <div className="stream-actions">
              <button onClick={startStream} className="btn-go-live">
                🚀 Go Live Now
              </button>
              <button
                onClick={() => navigate("/stream")}
                className="btn-cancel"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {streamStatus === "live" && (
          <div className="live-section">
            <div className="live-status">
              <div className="live-indicator">
                <span className="pulse"></span>
                <span className="live-text">LIVE</span>
              </div>
              <h2>You're Live!</h2>
              <p>Your stream is now broadcasting to viewers</p>
            </div>

            <div className="live-stats">
              <div className="stat">
                <span className="number">0</span>
                <span className="label">Viewers</span>
              </div>
              <div className="stat">
                <span className="number">0</span>
                <span className="label">Tips</span>
              </div>
              <div className="stat">
                <span className="number">0</span>
                <span className="label">Subs</span>
              </div>
            </div>

            <div className="live-actions">
              <button onClick={endStream} className="btn-end-stream">
                🛑 End Stream
              </button>
              <button
                onClick={() => navigate(`/stream/watch/${stream.id}`)}
                className="btn-watch"
              >
                👁️ Watch Stream
              </button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .go-live-page {
          padding: 2rem;
          max-width: 800px;
          margin: 0 auto;
        }

        .go-live-container {
          background: white;
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 2rem;
        }

        .go-live-header {
          text-align: center;
          margin-bottom: 3rem;
        }

        .go-live-header h1 {
          font-size: 2.5rem;
          margin-bottom: 0.5rem;
        }

        .setup-section h2 {
          margin-bottom: 2rem;
          color: var(--text-primary);
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          font-weight: 600;
          color: var(--text-primary);
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: normal;
          cursor: pointer;
        }

        .form-group input[type="checkbox"] {
          width: auto;
          margin: 0;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border);
          border-radius: 6px;
          font-size: 1rem;
        }

        .stream-tips {
          background: var(--light-bg);
          padding: 1.5rem;
          border-radius: 8px;
          margin: 2rem 0;
        }

        .stream-tips h3 {
          margin: 0 0 1rem 0;
          color: var(--text-primary);
        }

        .stream-tips ul {
          margin: 0;
          padding-left: 1.5rem;
        }

        .stream-tips li {
          margin-bottom: 0.5rem;
          color: var(--text-secondary);
        }

        .btn-create-stream {
          width: 100%;
          padding: 1rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-create-stream:hover:not(:disabled) {
          background: var(--primary-dark);
        }

        .btn-create-stream:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .loading-section {
          text-align: center;
          padding: 3rem;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid var(--border);
          border-top: 4px solid var(--primary);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 1rem auto;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .ready-section {
          text-align: center;
        }

        .success-message {
          margin-bottom: 2rem;
        }

        .success-message h2 {
          color: var(--success);
          margin-bottom: 0.5rem;
        }

        .stream-details {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          margin: 2rem 0;
          text-align: left;
        }

        .detail-group h3 {
          margin: 0 0 1rem 0;
          color: var(--text-primary);
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          padding: 0.5rem;
          background: var(--light-bg);
          border-radius: 4px;
        }

        .detail-item .label {
          font-weight: 600;
          color: var(--text-secondary);
          min-width: 80px;
        }

        .detail-item .value {
          flex: 1;
          font-family: monospace;
          font-size: 0.9rem;
          word-break: break-all;
        }

        .selectable {
          cursor: pointer;
          user-select: all;
        }

        .selectable:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .copy-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 4px;
        }

        .copy-btn:hover {
          background: var(--border);
        }

        .streaming-software {
          margin: 2rem 0;
          text-align: left;
        }

        .streaming-software h3 {
          margin-bottom: 1rem;
          color: var(--text-primary);
        }

        .software-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 1rem;
        }

        .software-item {
          padding: 1rem;
          border: 1px solid var(--border);
          border-radius: 8px;
        }

        .software-item h4 {
          margin: 0 0 0.5rem 0;
          color: var(--text-primary);
        }

        .software-item ol {
          margin: 0;
          padding-left: 1.5rem;
        }

        .software-item li {
          margin-bottom: 0.25rem;
          font-size: 0.9rem;
          color: var(--text-secondary);
        }

        .stream-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-top: 2rem;
        }

        .btn-go-live {
          padding: 1rem 2rem;
          background: var(--success);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-cancel {
          padding: 1rem 2rem;
          background: var(--secondary);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          cursor: pointer;
        }

        .live-section {
          text-align: center;
        }

        .live-status {
          margin-bottom: 2rem;
        }

        .live-indicator {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: rgba(255, 0, 0, 0.1);
          padding: 0.5rem 1rem;
          border-radius: 20px;
          margin-bottom: 1rem;
        }

        .pulse {
          width: 8px;
          height: 8px;
          background: #ff4444;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        .live-text {
          color: #ff4444;
          font-weight: bold;
        }

        .live-stats {
          display: flex;
          justify-content: center;
          gap: 2rem;
          margin: 2rem 0;
        }

        .stat {
          text-align: center;
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

        .live-actions {
          display: flex;
          gap: 1rem;
          justify-content: center;
        }

        .btn-end-stream {
          padding: 1rem 2rem;
          background: var(--danger);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          cursor: pointer;
        }

        .btn-watch {
          padding: 1rem 2rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 1.1rem;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .stream-details {
            grid-template-columns: 1fr;
          }

          .software-grid {
            grid-template-columns: 1fr;
          }

          .live-stats {
            flex-direction: column;
            gap: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default GoLivePage;
