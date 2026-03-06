// src/features/community/StudioHomePage.tsx — Winners Community Studio Home
// Phase 2 Extension — Live Spaces, Video Rooms, Broadcast Streams

import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";

// Types
interface LiveRoom {
  id: string;
  title: string;
  type: "space" | "video" | "broadcast";
  host: { id: string; name: string };
  participants: number;
  startedAt: string;
  status: string;
}

interface ScheduledEvent {
  id: string;
  title: string;
  sessionType: string;
  scheduledAt: string;
  host: { id: string; name: string };
  rsvpCount: number;
}

export default function StudioHomePage() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") as "live" | "scheduled" | "recordings" | "mystudio" | null;
  const [activeTab, setActiveTab] = useState<"live" | "scheduled" | "recordings" | "mystudio">(
    initialTab === "rooms" || initialTab === "streams" || initialTab === "events" ? "live" : 
    initialTab || "live"
  );
  const [liveRooms, setLiveRooms] = useState<LiveRoom[]>([]);
  const [scheduledEvents, setScheduledEvents] = useState<ScheduledEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRoom, setNewRoom] = useState({
    title: "",
    description: "",
    roomType: "WORKSHOP",
    scheduledAt: "",
    maxParticipants: 50,
    isPrivate: false,
  });

  const createRoom = async () => {
    if (!newRoom.title) return;
    setCreating(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/v1/studio/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newRoom),
      });
      if (response.ok) {
        const room = await response.json();
        setLiveRooms([...liveRooms, { ...room, type: "video", participants: 0, startedAt: new Date().toISOString(), status: "LIVE" }]);
        setShowCreateModal(false);
        setNewRoom({ title: "", description: "", roomType: "WORKSHOP", scheduledAt: "", maxParticipants: 50, isPrivate: false });
      }
    } catch (error) {
      console.error("Error creating room:", error);
    }
    setCreating(false);
  };

  useEffect(() => {
    loadStudioData();
  }, []);

  const loadStudioData = async () => {
    try {
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}` };
      
      // Fetch live video rooms
      const roomsRes = await fetch("/api/v1/studio/rooms/live", { headers });
      const liveVideoRooms = roomsRes.ok ? await roomsRes.json() : [];
      
      // Fetch live spaces
      const spacesRes = await fetch("/api/v1/spaces?status=LIVE", { headers });
      const liveSpaces = spacesRes.ok ? await spacesRes.json() : [];
      
      // Fetch live broadcasts
      const broadcastsRes = await fetch("/api/v1/studio/streams/live", { headers });
      const liveBroadcasts = broadcastsRes.ok ? await broadcastsRes.json() : [];
      
      // Transform and combine all live sessions
      const allLive: LiveRoom[] = [
        ...liveVideoRooms.map((r: any) => ({
          id: r.id,
          title: r.title,
          type: "video" as const,
          host: r.host,
          participants: r._count?.participants || 0,
          startedAt: r.startedAt || new Date().toISOString(),
          status: r.status
        })),
        ...liveSpaces.map((s: any) => ({
          id: s.id,
          title: s.title,
          type: "space" as const,
          host: s.host,
          participants: s._count?.participants || 0,
          startedAt: s.startedAt || new Date().toISOString(),
          status: s.status
        })),
        ...liveBroadcasts.map((b: any) => ({
          id: b.id,
          title: b.title,
          type: "broadcast" as const,
          host: b.host,
          participants: b.peakViewers || 0,
          startedAt: b.startedAt || new Date().toISOString(),
          status: b.status
        }))
      ];
      setLiveRooms(allLive);

      // Fetch scheduled events
      const eventsRes = await fetch("/api/v1/studio/events/upcoming", { headers });
      const events = eventsRes.ok ? await eventsRes.json() : [];
      setScheduledEvents(events.map((e: any) => ({
        id: e.id,
        title: e.title,
        sessionType: e.sessionType,
        scheduledAt: e.scheduledAt,
        host: e.host,
        rsvpCount: e.rsvpCount || 0
      })));
    } catch (error) {
      console.error("Error loading studio data:", error);
      // Fallback to empty state on error
      setLiveRooms([]);
      setScheduledEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  const formatScheduledTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `in ${diffMins} min`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `in ${diffHours}h`;
    return date.toLocaleDateString();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "space": return "🎙️";
      case "video": return "🎥";
      case "broadcast": return "📺";
      default: return "🎙️";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "space": return "Audio Space";
      case "video": return "Video Room";
      case "broadcast": return "Broadcast";
      default: return "Session";
    }
  };

  return (
    <div className="studio-home">
      <style>{`
        .studio-home {
          padding: 24px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .studio-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .studio-title {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          font-weight: 700;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .create-room-btn {
          background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dim, #a8863d) 100%);
          color: var(--bg);
          border: none;
          padding: 12px 24px;
          border-radius: 6px;
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .create-room-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(201, 168, 76, 0.3);
        }
        
        .studio-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 12px;
        }
        
        .studio-tab {
          background: transparent;
          border: none;
          color: var(--text-dim);
          padding: 10px 16px;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .studio-tab.active {
          background: var(--surface);
          color: var(--gold);
        }
        
        .studio-tab:hover:not(.active) {
          color: var(--text);
          background: var(--surface2);
        }
        
        .live-indicator {
          width: 8px;
          height: 8px;
          background: var(--red);
          border-radius: 50%;
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .section-title {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 16px;
          padding-top: 16px;
        }
        
        .session-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 16px;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
        }
        
        .session-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--gold), transparent);
        }
        
        .session-card:hover {
          border-color: var(--gold);
          transform: translateY(-2px);
        }
        
        .session-type-icon {
          font-size: 32px;
          width: 48px;
          text-align: center;
        }
        
        .session-info {
          flex: 1;
        }
        
        .session-title {
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 4px;
        }
        
        .session-meta {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: var(--text-dim);
          display: flex;
          gap: 12px;
          align-items: center;
        }
        
        .session-status {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        
        .status-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .status-badge.live {
          background: var(--red);
          color: white;
        }
        
        .status-badge.scheduled {
          background: var(--blue);
          color: white;
        }
        
        .participant-count {
          color: var(--ice);
        }
        
        .host-info {
          color: var(--text-dim);
        }
        
        .empty-state {
          text-align: center;
          padding: 48px;
          color: var(--text-dim);
        }
        
        .empty-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }
        
        .nova-panel {
          background: linear-gradient(135deg, rgba(155, 111, 255, 0.1) 0%, rgba(155, 111, 255, 0.05) 100%);
          border: 1px solid rgba(155, 111, 255, 0.3);
          border-radius: 6px;
          padding: 16px;
          margin-top: 24px;
        }
        
        .nova-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        
        .nova-badge {
          background: var(--purple);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 10px;
          font-weight: 600;
        }
        
        .nova-title {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 600;
          color: var(--text);
        }
        
        .nova-skills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 8px;
        }
        
        .skill-tag {
          background: var(--surface2);
          padding: 4px 10px;
          border-radius: 12px;
          font-size: 11px;
          color: var(--text-dim);
        }
        
        .nova-insight {
          font-size: 12px;
          color: var(--text-dim);
          line-height: 1.5;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 24px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .form-group {
          margin-bottom: 16px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: var(--text);
        }
        
        .form-group input,
        .form-group textarea,
        .form-group select {
          width: 100%;
          padding: 10px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text);
          font-family: 'Syne', sans-serif;
        }
        
        .modal-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
          margin-top: 24px;
        }
        
        .btn-cancel {
          padding: 10px 20px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text);
          cursor: pointer;
        }
        
        .btn-create {
          padding: 10px 20px;
          background: var(--gold);
          border: none;
          border-radius: 6px;
          color: var(--bg);
          font-weight: 600;
          cursor: pointer;
        }
        
        .btn-create:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>

      {/* Context Bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap' }}>
        <span className="ctx-badge live">⬡ Core Engine</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge active">🧑‍🤝‍🧑 Community</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge">🎙️ Studio</span>
      </div>

      <div className="studio-header">
        <h1 className="studio-title">
          🎙️ WINNERS COMMUNITY STUDIO
        </h1>
        <button className="create-room-btn" onClick={() => setShowCreateModal(true)}>
          + Create Room
        </button>
      </div>

      <div className="studio-tabs">
        <button 
          className={`studio-tab ${activeTab === 'live' ? 'active' : ''}`}
          onClick={() => setActiveTab('live')}
        >
          <span className="live-indicator"></span>
          🔴 LIVE NOW
        </button>
        <button 
          className={`studio-tab ${activeTab === 'scheduled' ? 'active' : ''}`}
          onClick={() => setActiveTab('scheduled')}
        >
          📅 SCHEDULED
        </button>
        <button 
          className={`studio-tab ${activeTab === 'recordings' ? 'active' : ''}`}
          onClick={() => setActiveTab('recordings')}
        >
          📼 RECORDINGS
        </button>
        <button 
          className={`studio-tab ${activeTab === 'mystudio' ? 'active' : ''}`}
          onClick={() => setActiveTab('mystudio')}
        >
          🎤 MY STUDIO
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Loading...</div>
      ) : (
        <>
          {activeTab === 'live' && (
            <>
              <h2 className="section-title">🔴 LIVE NOW</h2>
              {liveRooms.map(room => (
                <div key={room.id} className="session-card">
                  <div className="session-type-icon">{getTypeIcon(room.type)}</div>
                  <div className="session-info">
                    <div className="session-title">{room.title}</div>
                    <div className="session-meta">
                      <span className="session-status">
                        <span className="status-badge live">🔴 LIVE</span>
                        <span className="participant-count">{room.participants} {room.type === 'broadcast' ? 'viewers' : 'listeners'}</span>
                      </span>
                      <span className="host-info">Hosted by {room.host.name}</span>
                      <span className="host-info">{getTypeLabel(room.type)} · Started {formatTime(room.startedAt)}</span>
                    </div>
                  </div>
                </div>
              ))}

              {/* NOVA Live Intelligence Panel */}
              <div className="nova-panel">
                <div className="nova-header">
                  <span className="nova-badge">NOVA</span>
                  <span className="nova-title">Live Intelligence</span>
                </div>
                <div className="nova-skills">
                  <span className="skill-tag">React.js (94%)</span>
                  <span className="skill-tag">Product Strategy (87%)</span>
                  <span className="skill-tag">Fundraising (81%)</span>
                </div>
                <p className="nova-insight">
                  3 listeners have no Academy cert in React but high engagement. 
                  SAGE is ready to recommend a course.
                </p>
              </div>
            </>
          )}

          {activeTab === 'scheduled' && (
            <>
              <h2 className="section-title">📅 STARTING SOON</h2>
              {scheduledEvents.map(event => (
                <div key={event.id} className="session-card">
                  <div className="session-type-icon">{getTypeIcon(event.sessionType)}</div>
                  <div className="session-info">
                    <div className="session-title">{event.title}</div>
                    <div className="session-meta">
                      <span className="session-status">
                        <span className="status-badge scheduled">{formatScheduledTime(event.scheduledAt)}</span>
                        <span className="participant-count">{event.rsvpCount} RSVPs</span>
                      </span>
                      <span className="host-info">Hosted by {event.host.name}</span>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {activeTab === 'recordings' && (
            <div className="empty-state">
              <div className="empty-icon">📼</div>
              <p>No recordings yet. Past sessions will appear here.</p>
            </div>
          )}

          {activeTab === 'mystudio' && (
            <div className="empty-state">
              <div className="empty-icon">🎤</div>
              <p>Your hosted rooms and events will appear here.</p>
            </div>
          )}
        </>
      )}

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Create New Room</h2>
            <div className="form-group">
              <label>Room Title</label>
              <input
                type="text"
                value={newRoom.title}
                onChange={e => setNewRoom({...newRoom, title: e.target.value})}
                placeholder="Enter room title"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={newRoom.description}
                onChange={e => setNewRoom({...newRoom, description: e.target.value})}
                placeholder="Enter room description"
              />
            </div>
            <div className="form-group">
              <label>Room Type</label>
              <select
                value={newRoom.roomType}
                onChange={e => setNewRoom({...newRoom, roomType: e.target.value})}
              >
                <option value="WORKSHOP">Workshop</option>
                <option value="WEBINAR">Webinar</option>
                <option value="MEETUP">Meetup</option>
                <option value="QNA">Q&A Session</option>
              </select>
            </div>
            <div className="form-group">
              <label>Schedule (optional)</label>
              <input
                type="datetime-local"
                value={newRoom.scheduledAt}
                onChange={e => setNewRoom({...newRoom, scheduledAt: e.target.value})}
              />
            </div>
            <div className="form-group">
              <label>Max Participants</label>
              <input
                type="number"
                value={newRoom.maxParticipants}
                onChange={e => setNewRoom({...newRoom, maxParticipants: parseInt(e.target.value)})}
                min={2}
                max={100}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button className="btn-create" onClick={createRoom} disabled={creating || !newRoom.title}>
                {creating ? "Creating..." : "Create Room"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
