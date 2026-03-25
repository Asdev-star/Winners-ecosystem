// src/features/community/BroadcastViewerPage.tsx — Winners Community Studio Broadcast Viewer
// Phase 2 Extension — One-to-many live streaming with chat and reactions

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";

interface BroadcastViewerPageProps {
  // Mode: 'watch' | 'host'
  mode?: "watch" | "host";
}

export default function BroadcastViewerPage({ mode = "watch" }: BroadcastViewerPageProps) {
  const { streamId } = useParams<{ streamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [stream, setStream] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(true);
  const [showSuperChat, setShowSuperChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ user: string; message: string; time: string; isSuperChat?: boolean; amount?: number }[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [reactions, setReactions] = useState<{ emoji: string; count: number }[]>([
    { emoji: "👏", count: 0 },
    { emoji: "🔥", count: 0 },
    { emoji: "💡", count: 0 },
    { emoji: "❓", count: 0 },
  ]);
  const [viewerCount, setViewerCount] = useState(0);

  // Load stream details
  useEffect(() => {
    const loadStream = async () => {
      if (!streamId) {
        setError("Invalid stream");
        setLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`/api/v1/studio/streams/${streamId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Stream not found");
        }

        const data = await response.json();
        setStream(data);
        setViewerCount(data.peakViewers || 0);

        // Simulate live viewer count
        const interval = setInterval(() => {
          setViewerCount((prev) => prev + Math.floor(Math.random() * 5) - 2);
        }, 5000);

        return () => clearInterval(interval);
      } catch (err) {
        console.error("Error loading stream:", err);
        setError(err instanceof Error ? err.message : "Failed to load stream");
      } finally {
        setLoading(false);
      }
    };

    loadStream();
  }, [streamId]);

  const sendReaction = useCallback((emoji: string) => {
    setReactions((prev) =>
      prev.map((r) => (r.emoji === emoji ? { ...r, count: r.count + 1 } : r))
    );
  }, []);

  const sendMessage = useCallback(() => {
    if (!newMessage.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { user: user?.name || "You", message: newMessage, time: new Date().toLocaleTimeString() },
    ]);
    setNewMessage("");
  }, [newMessage, user]);

  const sendSuperChat = useCallback(() => {
    if (!newMessage.trim()) return;
    const amount = 10; // Fixed for demo
    setChatMessages((prev) => [
      ...prev,
      { 
        user: user?.name || "You", 
        message: newMessage, 
        time: new Date().toLocaleTimeString(),
        isSuperChat: true,
        amount 
      },
    ]);
    setNewMessage("");
    setShowSuperChat(false);
  }, [newMessage, user]);

  if (loading) {
    return (
      <div className="broadcast-loading">
        <style>{`
          .broadcast-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            color: var(--text-dim);
            font-family: 'Space Mono', monospace;
          }
        `}</style>
        <div>Loading stream...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="broadcast-error">
        <style>{`
          .broadcast-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            gap: 16px;
          }
          .broadcast-error button {
            padding: 10px 20px;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 6px;
            color: var(--text);
            cursor: pointer;
          }
        `}</style>
        <h2 style={{ color: 'var(--red)' }}>Unable to Load Stream</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/community/studio")}>Back to Studio</button>
      </div>
    );
  }

  return (
    <div className="broadcast-page">
      <style>{`
        .broadcast-page {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 80px);
          background: var(--bg);
        }
        
        .bp-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
        }
        
        .bp-title {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: var(--text);
        }
        
        .bp-viewer-count {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: var(--text-dim);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .bp-live-badge {
          background: var(--red);
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          animation: pulse 2s infinite;
        }
        
        .bp-main {
          flex: 1;
          display: flex;
          overflow: hidden;
        }
        
        .bp-video-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          background: #000;
        }
        
        .bp-video-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        
        .bp-video-placeholder {
          text-align: center;
          color: var(--text-dim);
        }
        
        .bp-video-placeholder .host-avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--gold), var(--purple));
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          margin: 0 auto 16px;
        }
        
        .bp-video-info {
          padding: 16px 24px;
          background: var(--surface);
        }
        
        .bp-video-info h2 {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          color: var(--text);
          margin-bottom: 8px;
        }
        
        .bp-video-info .host {
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          color: var(--text-dim);
        }
        
        .bp-reactions {
          display: flex;
          gap: 8px;
          padding: 12px;
          justify-content: center;
          background: rgba(0,0,0,0.5);
        }
        
        .bp-reaction-btn {
          padding: 8px 16px;
          background: rgba(255,255,255,0.1);
          border: none;
          border-radius: 20px;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .bp-reaction-btn:hover {
          background: rgba(255,255,255,0.2);
          transform: scale(1.1);
        }
        
        .bp-reaction-count {
          font-size: 10px;
          color: white;
          margin-left: 4px;
        }
        
        .bp-chat {
          width: 360px;
          background: var(--surface);
          border-left: 1px solid var(--border);
          display: flex;
          flex-direction: column;
        }
        
        .bp-chat-header {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .bp-chat-title {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
        }
        
        .bp-superchat-btn {
          padding: 4px 12px;
          background: var(--gold);
          border: none;
          border-radius: 4px;
          color: var(--bg);
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        }
        
        .bp-chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }
        
        .bp-chat-message {
          margin-bottom: 12px;
          padding: 8px;
          border-radius: 6px;
          background: var(--surface2);
        }
        
        .bp-chat-message.super-chat {
          background: linear-gradient(135deg, rgba(201,168,76,0.2), rgba(155,111,255,0.2));
          border: 1px solid var(--gold);
        }
        
        .bp-chat-message .meta {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
        }
        
        .bp-chat-message .user {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          font-weight: 600;
          color: var(--gold);
        }
        
        .bp-chat-message.super-chat .amount {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: var(--green);
        }
        
        .bp-chat-message .time {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          color: var(--text-dim);
        }
        
        .bp-chat-message .text {
          font-size: 13px;
          color: var(--text);
        }
        
        .bp-chat-input {
          display: flex;
          gap: 8px;
          padding: 12px;
          border-top: 1px solid var(--border);
        }
        
        .bp-chat-input input {
          flex: 1;
          padding: 8px 12px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text);
          font-family: 'Syne', sans-serif;
          font-size: 13px;
        }
        
        .bp-chat-input input:focus {
          outline: none;
          border-color: var(--gold);
        }
        
        .bp-chat-input button {
          padding: 8px 16px;
          background: var(--blue);
          border: none;
          border-radius: 4px;
          color: white;
          font-weight: 600;
          cursor: pointer;
        }
        
        .bp-nova-panel {
          padding: 12px;
          background: var(--surface);
          border-top: 1px solid var(--border);
          font-family: 'Space Mono', monospace;
          font-size: 10px;
        }
        
        .bp-nova-panel h4 {
          color: var(--purple);
          margin-bottom: 8px;
          font-size: 11px;
        }
        
        .bp-nova-note {
          color: var(--text-dim);
          padding: 4px 0;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Context Bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap', padding: '12px 24px 0' }}>
        <span className="ctx-badge live">⬡ Core Engine</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge active">🧑‍🤝‍🧑 Community</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge">🎙️ Studio</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge">📺 Broadcast</span>
      </div>

      {/* Header */}
      <div className="bp-header">
        <div className="bp-title">{stream?.title || "Live Broadcast"}</div>
        <div className="bp-viewer-count">
          <span className="bp-live-badge">🔴 LIVE</span>
          {viewerCount.toLocaleString()} watching
        </div>
      </div>

      {/* Main Area */}
      <div className="bp-main">
        <div className="bp-video-area">
          {/* Video Container */}
          <div className="bp-video-container">
            <div className="bp-video-placeholder">
              <div className="host-avatar">🎙️</div>
              <p style={{ fontSize: 14, marginBottom: 4 }}>{stream?.host?.name || "Host"}</p>
              <p style={{ fontSize: 12 }}>{stream?.title || "Live Stream"}</p>
            </div>
          </div>

          {/* Reactions Bar */}
          <div className="bp-reactions">
            {reactions.map((r) => (
              <button key={r.emoji} className="bp-reaction-btn" onClick={() => sendReaction(r.emoji)}>
                {r.emoji}
                {r.count > 0 && <span className="bp-reaction-count">{r.count}</span>}
              </button>
            ))}
          </div>

          {/* Video Info */}
          <div className="bp-video-info">
            <h2>{stream?.title}</h2>
            <div className="host">Hosted by {stream?.host?.name}</div>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="bp-chat">
            <div className="bp-chat-header">
              <span className="bp-chat-title">Live Chat</span>
              <button className="bp-superchat-btn" onClick={() => setShowSuperChat(true)}>
                💰 Super Chat
              </button>
            </div>
            <div className="bp-chat-messages">
              {chatMessages.length === 0 ? (
                <p style={{ color: 'var(--text-dim)', textAlign: 'center', padding: 20 }}>
                  Chat messages will appear here
                </p>
              ) : (
                chatMessages.map((msg, i) => (
                  <div key={i} className={`bp-chat-message ${msg.isSuperChat ? 'super-chat' : ''}`}>
                    <div className="meta">
                      <span className="user">{msg.user}</span>
                      {msg.isSuperChat && <span className="amount">${msg.amount}</span>}
                      <span className="time">{msg.time}</span>
                    </div>
                    <div className="text">{msg.message}</div>
                  </div>
                ))
              )}
            </div>
            <div className="bp-chat-input">
              <input
                type="text"
                placeholder={showSuperChat ? "Send a Super Chat..." : "Send a message..."}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (showSuperChat ? sendSuperChat() : sendMessage())}
              />
              <button onClick={showSuperChat ? sendSuperChat : sendMessage}>
                {showSuperChat ? "💰 Send" : "Send"}
              </button>
            </div>

            {/* NOVA Live Notes */}
            <div className="bp-nova-panel">
              <h4>🔵 NOVA Live Notes</h4>
              <p className="bp-nova-note">• Session in progress...</p>
              <p className="bp-nova-note">• Skills being detected...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
