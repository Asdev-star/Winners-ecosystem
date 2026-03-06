// src/features/community/StudioHomePage.tsx — Winners Community Studio Home
// Phase 2 Extension — Live Spaces, Video Rooms, Broadcast Streams

import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";
import { useStudioStore, type LiveRoom, type ScheduledEvent } from "./studioStore";

// Icons
const VideoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M10 9l5 3-5 3V9z" fill="currentColor" />
  </svg>
);

const BroadcastIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <path d="M2 12h2M20 12h2M12 2v2M12 20v2" />
    <circle cx="12" cy="12" r="3" fill="currentColor" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

const PlusIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export default function StudioHomePage() {
  const { user } = useAuthStore();
  const [searchParams] = useSearchParams();
  const urlTab = searchParams.get("tab");
  
  // Map URL tab to internal tab
  const getInitialTab = () => {
    if (urlTab === "rooms" || urlTab === "streams" || urlTab === "events") return "live";
    if (urlTab === "scheduled") return "scheduled";
    if (urlTab === "recordings") return "recordings";
    if (urlTab === "mystudio") return "mystudio";
    return "live";
  };
  
  const [activeTab, setActiveTab] = useState<"live" | "scheduled" | "recordings" | "mystudio">(getInitialTab());
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

  // Use studio store
  const { 
    liveRooms, 
    scheduledEvents, 
    loading, 
    error,
    fetchLiveData,
    fetchScheduledEvents,
    createRoom 
  } = useStudioStore();

  useEffect(() => {
    fetchLiveData();
    fetchScheduledEvents();
  }, []);

  const handleCreateRoom = async () => {
    if (!newRoom.title) return;
    setCreating(true);
    try {
      await createRoom(newRoom);
      setShowCreateModal(false);
      setNewRoom({ title: "", description: "", roomType: "WORKSHOP", scheduledAt: "", maxParticipants: 50, isPrivate: false });
    } catch (err) {
      console.error("Error creating room:", err);
    }
    setCreating(false);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div style={{
      padding: "24px",
      background: "var(--bg)",
      minHeight: "100vh",
      color: "var(--text)",
    }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ 
          fontFamily: "var(--font-display)", 
          fontSize: "32px", 
          fontWeight: 300,
          marginBottom: "8px" 
        }}>
          🎙️ Studio
        </h1>
        <p style={{ color: "var(--text-dim)" }}>
          Go live with video rooms, broadcasts, and events
        </p>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: "flex", 
        gap: "8px", 
        marginBottom: "24px",
        borderBottom: "1px solid var(--border)",
        paddingBottom: "12px"
      }}>
        {[
          { id: "live", label: "🔴 Live Now" },
          { id: "scheduled", label: "📅 Scheduled" },
          { id: "mystudio", label: "� My Studio" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: "none",
              background: activeTab === tab.id ? "var(--gold)" : "transparent",
              color: activeTab === tab.id ? "var(--bg)" : "var(--text-dim)",
              cursor: "pointer",
              fontFamily: "var(--font-body)",
              fontWeight: 500,
              transition: "all 0.2s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Create Button */}
      <button
        onClick={() => setShowCreateModal(true)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 24px",
          background: "var(--gold)",
          color: "var(--bg)",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: 600,
          marginBottom: "24px",
        }}
      >
        <PlusIcon /> Start New Session
      </button>

      {/* Error */}
      {error && (
        <div style={{
          padding: "16px",
          background: "rgba(224, 90, 78, 0.1)",
          border: "1px solid var(--red)",
          borderRadius: "6px",
          color: "var(--red)",
          marginBottom: "16px",
        }}>
          {error}
        </div>
      )}

      {/* Live Tab */}
      {activeTab === "live" && (
        <div>
          <h2 style={{ fontSize: "18px", marginBottom: "16px", fontWeight: 600 }}>
            🔴 Live Right Now
          </h2>
          
          {loading ? (
            <div style={{ color: "var(--text-dim)" }}>Loading...</div>
          ) : liveRooms.length === 0 ? (
            <div style={{
              padding: "48px",
              background: "var(--surface)",
              borderRadius: "6px",
              textAlign: "center",
              border: "1px solid var(--border)",
            }}>
              <p style={{ color: "var(--text-dim)", marginBottom: "16px" }}>
                No live sessions right now
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  padding: "10px 20px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  color: "var(--text)",
                  cursor: "pointer",
                }}
              >
                Start the first one
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "16px" }}>
              {liveRooms.map((room) => (
                <div
                  key={room.id}
                  style={{
                    padding: "16px",
                    background: "var(--surface)",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      {room.type === "video" ? <VideoIcon /> : room.type === "broadcast" ? <BroadcastIcon /> : <span>🎙️</span>}
                      <span style={{ 
                        background: "var(--green)", 
                        padding: "2px 8px", 
                        borderRadius: "4px",
                        fontSize: "10px",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}>
                        {room.status}
                      </span>
                    </div>
                    <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>
                      {room.title}
                    </h3>
                    <p style={{ color: "var(--text-dim)", fontSize: "14px" }}>
                      Hosted by {room.host?.name || "Unknown"} • {room.participants} watching
                    </p>
                  </div>
                  <Link
                    to={room.type === "video" 
                      ? `/community/studio/room/${room.id}` 
                      : `/community/studio/stream/${room.id}`}
                    style={{
                      padding: "10px 20px",
                      background: "var(--gold)",
                      color: "var(--bg)",
                      borderRadius: "6px",
                      textDecoration: "none",
                      fontWeight: 600,
                    }}
                  >
                    {room.type === "video" ? "Join Room" : "Watch"}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Scheduled Tab */}
      {activeTab === "scheduled" && (
        <div>
          <h2 style={{ fontSize: "18px", marginBottom: "16px", fontWeight: 600 }}>
            📅 Upcoming Events
          </h2>
          
          {scheduledEvents.length === 0 ? (
            <div style={{
              padding: "48px",
              background: "var(--surface)",
              borderRadius: "6px",
              textAlign: "center",
              border: "1px solid var(--border)",
            }}>
              <p style={{ color: "var(--text-dim)" }}>
                No upcoming events scheduled
              </p>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "16px" }}>
              {scheduledEvents.map((event) => (
                <div
                  key={event.id}
                  style={{
                    padding: "16px",
                    background: "var(--surface)",
                    borderRadius: "6px",
                    border: "1px solid var(--border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <CalendarIcon />
                      <span style={{ color: "var(--gold)", fontSize: "14px", fontWeight: 600 }}>
                        {formatDate(event.scheduledAt)} at {formatTime(event.scheduledAt)}
                      </span>
                    </div>
                    <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "4px" }}>
                      {event.title}
                    </h3>
                    <p style={{ color: "var(--text-dim)", fontSize: "14px" }}>
                      Hosted by {event.host?.name || "Unknown"} • {event.rsvpCount} RSVPs
                    </p>
                  </div>
                  <button
                    style={{
                      padding: "10px 20px",
                      background: "var(--surface2)",
                      color: "var(--text)",
                      border: "1px solid var(--border)",
                      borderRadius: "6px",
                      cursor: "pointer",
                    }}
                  >
                    RSVP
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* My Studio Tab */}
      {activeTab === "mystudio" && (
        <div>
          <h2 style={{ fontSize: "18px", marginBottom: "16px", fontWeight: 600 }}>
            � My Studio
          </h2>
          <div style={{
            padding: "48px",
            background: "var(--surface)",
            borderRadius: "6px",
            textAlign: "center",
            border: "1px solid var(--border)",
          }}>
            <p style={{ color: "var(--text-dim)", marginBottom: "16px" }}>
              Your created rooms and broadcasts will appear here
            </p>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "var(--surface)",
            borderRadius: "8px",
            padding: "24px",
            width: "400px",
            maxWidth: "90vw",
            border: "1px solid var(--border)",
          }}>
            <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>Start New Session</h2>
            
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>Title</label>
              <input
                type="text"
                value={newRoom.title}
                onChange={(e) => setNewRoom({ ...newRoom, title: e.target.value })}
                placeholder="My Live Session"
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  color: "var(--text)",
                }}
              />
            </div>

            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>Type</label>
              <select
                value={newRoom.roomType}
                onChange={(e) => setNewRoom({ ...newRoom, roomType: e.target.value })}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  color: "var(--text)",
                }}
              >
                <option value="WORKSHOP">Workshop</option>
                <option value="MEETING">Meeting</option>
                <option value="QNA">Q&A</option>
                <option value="WEBINAR">Webinar</option>
              </select>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "4px", fontSize: "14px" }}>Max Participants</label>
              <input
                type="number"
                value={newRoom.maxParticipants}
                onChange={(e) => setNewRoom({ ...newRoom, maxParticipants: parseInt(e.target.value) })}
                min={2}
                max={50}
                style={{
                  width: "100%",
                  padding: "10px",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  color: "var(--text)",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "var(--surface2)",
                  color: "var(--text)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateRoom}
                disabled={creating || !newRoom.title}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: creating ? "var(--text-dim)" : "var(--gold)",
                  color: "var(--bg)",
                  border: "none",
                  borderRadius: "6px",
                  cursor: creating ? "not-allowed" : "pointer",
                  fontWeight: 600,
                }}
              >
                {creating ? "Creating..." : "Start"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
