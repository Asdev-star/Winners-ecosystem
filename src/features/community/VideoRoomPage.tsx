// src/features/community/VideoRoomPage.tsx — Winners Community Studio Video Room
// Phase 2 Extension — Zoom-style video conferencing with NOVA Intelligence

import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";
import LiveKit from "livekit-client";

interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  cameraOn: boolean;
  micOn: boolean;
  isSpeaking: boolean;
}

interface VideoRoomPageProps {
  // Mode: 'join' | 'host'
  mode?: "join" | "host";
}

export default function VideoRoomPage({ mode: initialMode = "join" }: VideoRoomPageProps) {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [room, setRoom] = useState<any>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ user: string; message: string; time: string }[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Load room details and connect to LiveKit
  useEffect(() => {
    const connectToRoom = async () => {
      if (!roomId || !user) {
        setError("Invalid room or not authenticated");
        setLoading(false);
        return;
      }

      try {
        // Fetch room details from API - use auth store token
        const token = useAuthStore.getState().token;
        const response = await fetch(`/api/v1/studio/rooms/${roomId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) {
          throw new Error("Room not found");
        }

        const roomData = await response.json();
        setRoom(roomData);

        // In production, connect to LiveKit here:
        // const livekitUrl = import.meta.env.VITE_LIVEKIT_URL || "wss://your-livekit-server.com";
        // const livekitToken = roomData.livekitToken; // Generated server-side
        
        // For now, simulate participants
        setParticipants([
          { id: roomData.hostId, name: roomData.host?.name || "Host", isHost: true, cameraOn: true, micOn: true, isSpeaking: false },
        ]);
      } catch (err) {
        console.error("Error connecting to room:", err);
        setError(err instanceof Error ? err.message : "Failed to connect");
      } finally {
        setLoading(false);
      }
    };

    connectToRoom();
  }, [roomId, user]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
    // In production: room?.localParticipant.setMicrophoneEnabled(!isMuted);
  }, [isMuted]);

  const toggleCamera = useCallback(() => {
    setIsCameraOff((prev) => !prev);
    // In production: room?.localParticipant.setCameraEnabled(!isCameraOff);
  }, [isCameraOff]);

  const toggleScreenShare = useCallback(() => {
    setIsScreenSharing((prev) => !prev);
    // In production: room?.localParticipant.setScreenShareEnabled(!isScreenSharing);
  }, [isScreenSharing]);

  const leaveRoom = useCallback(() => {
    // In production: room?.disconnect();
    navigate("/community/studio");
  }, [navigate]);

  const sendMessage = useCallback(() => {
    if (!newMessage.trim()) return;
    setChatMessages((prev) => [
      ...prev,
      { user: user?.name || "You", message: newMessage, time: new Date().toLocaleTimeString() },
    ]);
    setNewMessage("");
  }, [newMessage, user]);

  if (loading) {
    return (
      <div className="video-room-loading">
        <style>{`
          .video-room-loading {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            color: var(--text-dim);
            font-family: 'Space Mono', monospace;
          }
        `}</style>
        <div>Connecting to room...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="video-room-error">
        <style>{`
          .video-room-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 60vh;
            gap: 16px;
          }
          .video-room-error h2 {
            color: var(--red);
            font-family: 'Syne', sans-serif;
          }
          .video-room-error button {
            padding: 10px 20px;
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 6px;
            color: var(--text);
            cursor: pointer;
          }
        `}</style>
        <h2>Unable to Join</h2>
        <p>{error}</p>
        <button onClick={() => navigate("/community/studio")}>Back to Studio</button>
      </div>
    );
  }

  return (
    <div className="video-room-page">
      <style>{`
        .video-room-page {
          display: flex;
          flex-direction: column;
          height: calc(100vh - 80px);
          background: var(--bg);
        }
        
        .vr-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 24px;
          background: var(--surface);
          border-bottom: 1px solid var(--border);
        }
        
        .vr-title {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: var(--text);
        }
        
        .vr-participant-count {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: var(--text-dim);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .vr-main {
          flex: 1;
          display: flex;
          overflow: hidden;
        }
        
        .vr-video-area {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 16px;
          gap: 12px;
        }
        
        .vr-grid {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 12px;
          overflow-y: auto;
        }
        
        .vr-participant-tile {
          position: relative;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          aspect-ratio: 16/9;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        
        .vr-participant-tile.speaking {
          border-color: var(--green);
          box-shadow: 0 0 0 2px var(--green);
        }
        
        .vr-participant-tile .avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--gold);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 700;
          color: var(--bg);
        }
        
        .vr-participant-tile .name {
          position: absolute;
          bottom: 8px;
          left: 8px;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: var(--text);
          background: rgba(0,0,0,0.5);
          padding: 2px 6px;
          border-radius: 4px;
        }
        
        .vr-participant-tile .badges {
          position: absolute;
          top: 8px;
          right: 8px;
          display: flex;
          gap: 4px;
        }
        
        .vr-participant-tile .badge {
          font-size: 12px;
          padding: 2px 4px;
          background: rgba(0,0,0,0.5);
          border-radius: 4px;
        }
        
        .vr-sidebar {
          width: 320px;
          background: var(--surface);
          border-left: 1px solid var(--border);
          display: flex;
          flex-direction: column;
        }
        
        .vr-sidebar-header {
          display: flex;
          border-bottom: 1px solid var(--border);
        }
        
        .vr-sidebar-tab {
          flex: 1;
          padding: 12px;
          background: transparent;
          border: none;
          color: var(--text-dim);
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .vr-sidebar-tab.active {
          color: var(--gold);
          border-bottom: 2px solid var(--gold);
        }
        
        .vr-sidebar-content {
          flex: 1;
          overflow-y: auto;
          padding: 12px;
        }
        
        .vr-chat-message {
          margin-bottom: 12px;
        }
        
        .vr-chat-message .meta {
          display: flex;
          gap: 8px;
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          color: var(--text-dim);
          margin-bottom: 2px;
        }
        
        .vr-chat-message .text {
          font-size: 13px;
          color: var(--text);
        }
        
        .vr-chat-input {
          display: flex;
          gap: 8px;
          padding: 12px;
          border-top: 1px solid var(--border);
        }
        
        .vr-chat-input input {
          flex: 1;
          padding: 8px 12px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text);
          font-family: 'Syne', sans-serif;
          font-size: 13px;
        }
        
        .vr-chat-input input:focus {
          outline: none;
          border-color: var(--gold);
        }
        
        .vr-chat-input button {
          padding: 8px 12px;
          background: var(--gold);
          border: none;
          border-radius: 4px;
          color: var(--bg);
          font-weight: 600;
          cursor: pointer;
        }
        
        .vr-controls {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 16px;
          background: var(--surface);
          border-top: 1px solid var(--border);
        }
        
        .vr-control-btn {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .vr-control-btn.primary {
          background: var(--red);
          color: white;
        }
        
        .vr-control-btn.active {
          background: var(--gold);
          color: var(--bg);
        }
        
        .vr-control-btn:not(.primary):not(.active) {
          background: var(--surface2);
          color: var(--text);
          border: 1px solid var(--border);
        }
        
        .vr-control-btn:hover {
          transform: scale(1.05);
        }
        
        .vr-nova-panel {
          position: absolute;
          bottom: 80px;
          left: 24px;
          width: 300px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 16px;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
        }
        
        .vr-nova-panel h4 {
          color: var(--purple);
          margin-bottom: 8px;
          font-size: 12px;
        }
        
        .vr-nova-panel .skill {
          display: inline-block;
          padding: 2px 6px;
          background: var(--surface2);
          border-radius: 4px;
          margin: 2px;
          font-size: 10px;
          color: var(--text-dim);
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
        <span className="ctx-badge">🎥 Video Room</span>
      </div>

      {/* Header */}
      <div className="vr-header">
        <div className="vr-title">{room?.title || "Video Room"}</div>
        <div className="vr-participant-count">
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s infinite' }} />
          {participants.length} participant{participants.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Main Area */}
      <div className="vr-main">
        <div className="vr-video-area">
          {/* Video Grid */}
          <div className="vr-grid">
            {participants.map((participant) => (
              <div key={participant.id} className={`vr-participant-tile ${participant.isSpeaking ? 'speaking' : ''}`}>
                <div className="avatar">{participant.name.charAt(0).toUpperCase()}</div>
                <div className="name">{participant.name}</div>
                <div className="badges">
                  {participant.isHost && <span className="badge">🎤</span>}
                  {!participant.micOn && <span className="badge">🔇</span>}
                  {!participant.cameraOn && <span className="badge">📷</span>}
                </div>
              </div>
            ))}
          </div>

          {/* NOVA Live Notes Panel */}
          {room && (
            <div className="vr-nova-panel">
              <h4>🔵 NOVA · Live Notes</h4>
              <p style={{ color: 'var(--text-dim)', marginBottom: 8 }}>
                Transcribing and analyzing session...
              </p>
              <div>
                <span className="skill">React.js</span>
                <span className="skill">API Design</span>
                <span className="skill">Node.js</span>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        {showChat && (
          <div className="vr-sidebar">
            <div className="vr-sidebar-header">
              <button className="vr-sidebar-tab active">Chat</button>
              <button className="vr-sidebar-tab" onClick={() => setShowParticipants(true)}>
                People ({participants.length})
              </button>
            </div>
            <div className="vr-sidebar-content">
              {chatMessages.map((msg, i) => (
                <div key={i} className="vr-chat-message">
                  <div className="meta">
                    <span style={{ color: 'var(--gold)' }}>{msg.user}</span>
                    <span>{msg.time}</span>
                  </div>
                  <div className="text">{msg.message}</div>
                </div>
              ))}
            </div>
            <div className="vr-chat-input">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              />
              <button onClick={sendMessage}>Send</button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="vr-controls">
        <button
          className={`vr-control-btn ${isMuted ? '' : 'active'}`}
          onClick={toggleMute}
          title={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted ? "🔇" : "🎤"}
        </button>
        <button
          className={`vr-control-btn ${isCameraOff ? '' : 'active'}`}
          onClick={toggleCamera}
          title={isCameraOff ? "Turn on camera" : "Turn off camera"}
        >
          {isCameraOff ? "📷" : "📹"}
        </button>
        <button
          className={`vr-control-btn ${isScreenSharing ? 'active' : ''}`}
          onClick={toggleScreenShare}
          title={isScreenSharing ? "Stop sharing" : "Share screen"}
        >
          🖥️
        </button>
        <button
          className={`vr-control-btn ${showChat ? 'active' : ''}`}
          onClick={() => setShowChat(!showChat)}
          title="Chat"
        >
          💬
        </button>
        <button
          className="vr-control-btn primary"
          onClick={leaveRoom}
          title="Leave room"
        >
          📤
        </button>
      </div>
    </div>
  );
}
