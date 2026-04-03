// Phase 4C — Winners Market: Winners Stream
// Live streaming, VOD, pay-per-view events, creator tools
// AI supervisor: NOVA (Community) / OMEGA

import { useState, useEffect } from "react";
import { useAuthStore } from "../auth/authStore";
import AssistantPanel from "../../components/ui/AssistantPanel";
import ContextBar from "../../components/ui/ContextBar";

const API_BASE =
  (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ||
  "http://localhost:3001/api/v1";

interface StreamItem {
  id: string;
  title: string;
  description?: string;
  host: { id: string; name: string; trustScore: number };
  viewers: number;
  thumbnail?: string;
  type: "live" | "vod" | "ppv" | "scheduled";
  price?: number;
  category?: string;
  startedAt?: string;
  scheduledAt?: string;
  status: string;
  isPPV?: boolean;
  ppvPrice?: number;
}

interface VideoRoom {
  id: string;
  title: string;
  description?: string;
  host: { id: string; name: string; trustScore: number };
  roomType: string;
  status: string;
  participantCount: number;
  maxParticipants: number;
  scheduledAt?: string;
  isPrivate: boolean;
}

export default function WinnersStreamPage() {
  const { token, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<
    "discover" | "live-now" | "my-content" | "rooms"
  >("discover");
  const [streams, setStreams] = useState<StreamItem[]>([]);
  const [rooms, setRooms] = useState<VideoRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showCreateStream, setShowCreateStream] = useState(false);
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  // Create stream form
  const [newStream, setNewStream] = useState({
    title: "",
    description: "",
    category: "general",
    thumbnail: "",
    isPPV: false,
    ppvPrice: 0,
    superChatEnabled: true,
    scheduledAt: "",
  });

  // Create room form
  const [newRoom, setNewRoom] = useState({
    title: "",
    description: "",
    roomType: "WORKSHOP",
    maxParticipants: 50,
    isPrivate: false,
    password: "",
    scheduledAt: "",
  });

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "tech", label: "Technology" },
    { value: "music", label: "Music" },
    { value: "business", label: "Business" },
    { value: "education", label: "Education" },
    { value: "gaming", label: "Gaming" },
    { value: "lifestyle", label: "Lifestyle" },
    { value: "general", label: "General" },
  ];

  const roomTypes = [
    { value: "WORKSHOP", label: "Workshop" },
    { value: "MEETING", label: "Meeting" },
    { value: "WEBINAR", label: "Webinar" },
    { value: "INTERVIEW", label: "Interview" },
    { value: "STUDY_GROUP", label: "Study Group" },
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab, selectedCategory]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === "rooms") {
        const res = await fetch(`${API_BASE}/studio/rooms`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setRooms(data);
        }
      } else {
        const status = activeTab === "live-now" ? "LIVE" : "";
        const res = await fetch(
          `${API_BASE}/studio/streams?status=${status}&category=${selectedCategory === "all" ? "" : selectedCategory}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (res.ok) {
          const data = await res.json();
          setStreams(data);
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const createStream = async () => {
    try {
      const res = await fetch(`${API_BASE}/studio/streams`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newStream),
      });
      if (res.ok) {
        setShowCreateStream(false);
        setNewStream({
          title: "",
          description: "",
          category: "general",
          thumbnail: "",
          isPPV: false,
          ppvPrice: 0,
          superChatEnabled: true,
          scheduledAt: "",
        });
        fetchData();
      }
    } catch (error) {
      console.error("Error creating stream:", error);
    }
  };

  const createRoom = async () => {
    try {
      const res = await fetch(`${API_BASE}/studio/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newRoom),
      });
      if (res.ok) {
        setShowCreateRoom(false);
        setNewRoom({
          title: "",
          description: "",
          roomType: "WORKSHOP",
          maxParticipants: 50,
          isPrivate: false,
          password: "",
          scheduledAt: "",
        });
        fetchData();
      }
    } catch (error) {
      console.error("Error creating room:", error);
    }
  };

  const startStream = async (streamId: string) => {
    try {
      const res = await fetch(`${API_BASE}/studio/streams/${streamId}/start`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Redirect to stream view with LiveKit token
        window.location.href = `/market/stream/${streamId}?token=${data.livekitToken}`;
      }
    } catch (error) {
      console.error("Error starting stream:", error);
    }
  };

  const joinRoom = async (roomId: string) => {
    try {
      const res = await fetch(`${API_BASE}/studio/rooms/${roomId}/join`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Redirect to room view with LiveKit token
        window.location.href = `/market/stream/room/${roomId}?token=${data.livekitToken}`;
      }
    } catch (error) {
      console.error("Error joining room:", error);
    }
  };

  const startRoom = async (roomId: string) => {
    try {
      const res = await fetch(`${API_BASE}/studio/rooms/${roomId}/start`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        joinRoom(roomId);
      }
    } catch (error) {
      console.error("Error starting room:", error);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px 40px" }}>
      <ContextBar platform="market" />

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 32,
          marginTop: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: 48,
              fontWeight: 300,
              color: "var(--gold)",
              marginBottom: 8,
            }}
          >
            Winners Stream
          </h1>
          <p style={{ color: "var(--text-dim)", fontSize: 16, maxWidth: 600 }}>
            Live streaming & VOD for the sovereign creator economy. Go live,
            host workshops, monetize with PPV and super chats.
          </p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={() => setShowCreateRoom(true)}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: "12px 24px",
              color: "var(--text)",
              fontWeight: 600,
              fontFamily: "Syne",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>🎥</span> Create Room
          </button>
          <button
            onClick={() => setShowCreateStream(true)}
            style={{
              background: "linear-gradient(135deg, var(--red), #ff4444)",
              border: "none",
              borderRadius: 8,
              padding: "12px 24px",
              color: "white",
              fontWeight: 700,
              fontFamily: "Syne",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
              boxShadow: "0 4px 12px rgba(224,90,78,0.3)",
            }}
          >
            <span>📡</span> Go Live
          </button>
        </div>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 32,
        }}
      >
        {[
          {
            label: "Live Now",
            value: streams.filter((s) => s.status === "LIVE").length,
            icon: "🔴",
            color: "var(--red)",
          },
          {
            label: "Active Rooms",
            value: rooms.filter((r) => r.status === "LIVE").length,
            icon: "🎥",
            color: "var(--purple)",
          },
          {
            label: "Total Creators",
            value: "2.4K",
            icon: "👥",
            color: "var(--gold)",
          },
          {
            label: "Watch Hours",
            value: "12.8K",
            icon: "⏱️",
            color: "var(--green)",
          },
        ].map((stat, i) => (
          <div
            key={i}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 20,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: `linear-gradient(90deg, ${stat.color}, transparent)`,
              }}
            />
            <div style={{ fontSize: 24, marginBottom: 8 }}>{stat.icon}</div>
            <div
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 32,
                fontWeight: 600,
                color: stat.color,
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 10,
                color: "var(--text-dim)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: 8,
          marginBottom: 24,
          borderBottom: "1px solid var(--border)",
          paddingBottom: 12,
        }}
      >
        {[
          { key: "discover", label: "Discover", icon: "🔍" },
          { key: "live-now", label: "Live Now", icon: "🔴" },
          { key: "rooms", label: "Video Rooms", icon: "🎥" },
          { key: "my-content", label: "My Content", icon: "📁" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            style={{
              background:
                activeTab === t.key ? "var(--surface2)" : "transparent",
              border:
                activeTab === t.key
                  ? "1px solid var(--gold)"
                  : "1px solid transparent",
              borderRadius: 6,
              padding: "10px 20px",
              color: activeTab === t.key ? "var(--gold)" : "var(--text-dim)",
              fontFamily: "Space Mono",
              fontSize: 12,
              textTransform: "uppercase",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {/* Category Filter */}
      {activeTab !== "rooms" && activeTab !== "my-content" && (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              style={{
                background:
                  selectedCategory === cat.value
                    ? "var(--gold)"
                    : "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 20,
                padding: "6px 16px",
                color:
                  selectedCategory === cat.value ? "var(--bg)" : "var(--text)",
                fontSize: 12,
                fontFamily: "Syne",
                cursor: "pointer",
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Content Grid */}
      {loading ? (
        <div
          style={{ textAlign: "center", padding: 60, color: "var(--text-dim)" }}
        >
          Loading...
        </div>
      ) : activeTab === "rooms" ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 20,
          }}
        >
          {rooms.map((room) => (
            <div
              key={room.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                overflow: "hidden",
                transition: "transform 0.2s, border-color 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--gold)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  height: 160,
                  background:
                    "linear-gradient(135deg, var(--surface2), var(--surface))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                <div style={{ fontSize: 48 }}>🎥</div>
                {room.status === "LIVE" && (
                  <span
                    style={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      background: "var(--red)",
                      color: "white",
                      padding: "4px 10px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "white",
                        animation: "pulse 1.5s infinite",
                      }}
                    />
                    LIVE
                  </span>
                )}
                <span
                  style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    background: "var(--surface2)",
                    color: "var(--text-dim)",
                    padding: "4px 10px",
                    borderRadius: 4,
                    fontSize: 10,
                    fontFamily: "Space Mono",
                  }}
                >
                  {room.roomType}
                </span>
              </div>

              <div style={{ padding: 16 }}>
                <h3
                  style={{
                    fontSize: 16,
                    marginBottom: 8,
                    color: "var(--text)",
                    fontWeight: 600,
                  }}
                >
                  {room.title}
                </h3>
                <p
                  style={{
                    color: "var(--text-dim)",
                    fontSize: 13,
                    marginBottom: 12,
                    lineHeight: 1.5,
                  }}
                >
                  {room.description || "No description provided"}
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background:
                          "linear-gradient(135deg, var(--gold), var(--purple))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--bg)",
                      }}
                    >
                      {room.host.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>
                        {room.host.name}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-dim)" }}>
                        Trust: {room.host.trustScore}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                    👥 {room.participantCount}/{room.maxParticipants}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  {room.host.id === user?.id ? (
                    <button
                      onClick={() =>
                        room.status === "LIVE"
                          ? joinRoom(room.id)
                          : startRoom(room.id)
                      }
                      style={{
                        flex: 1,
                        background:
                          room.status === "LIVE"
                            ? "var(--green)"
                            : "var(--gold)",
                        border: "none",
                        borderRadius: 6,
                        padding: "10px 16px",
                        color: "var(--bg)",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "Space Mono",
                      }}
                    >
                      {room.status === "LIVE" ? "JOIN ROOM" : "START ROOM"}
                    </button>
                  ) : (
                    <button
                      onClick={() => joinRoom(room.id)}
                      disabled={room.status !== "LIVE"}
                      style={{
                        flex: 1,
                        background:
                          room.status === "LIVE"
                            ? "var(--purple)"
                            : "var(--surface2)",
                        border: "none",
                        borderRadius: 6,
                        padding: "10px 16px",
                        color:
                          room.status === "LIVE" ? "white" : "var(--text-dim)",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor:
                          room.status === "LIVE" ? "pointer" : "not-allowed",
                        fontFamily: "Space Mono",
                      }}
                    >
                      {room.status === "LIVE" ? "JOIN ROOM" : "NOT STARTED"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 20,
          }}
        >
          {streams.map((stream) => (
            <div
              key={stream.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                overflow: "hidden",
                transition: "transform 0.2s, border-color 0.2s",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--gold)";
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                style={{
                  height: 180,
                  background: stream.thumbnail
                    ? `url(${stream.thumbnail}) center/cover`
                    : "linear-gradient(135deg, var(--surface2), var(--surface))",
                  display: stream.thumbnail ? "none" : "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                }}
              >
                {!stream.thumbnail && <div style={{ fontSize: 48 }}>📡</div>}
                {stream.status === "LIVE" && (
                  <span
                    style={{
                      position: "absolute",
                      top: 12,
                      left: 12,
                      background: "var(--red)",
                      color: "white",
                      padding: "4px 10px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "white",
                        animation: "pulse 1.5s infinite",
                      }}
                    />
                    LIVE
                  </span>
                )}
                {stream.isPPV && (
                  <span
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      background: "var(--gold)",
                      color: "var(--bg)",
                      padding: "4px 10px",
                      borderRadius: 4,
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                  >
                    PPV ${stream.ppvPrice}
                  </span>
                )}
                {stream.category && (
                  <span
                    style={{
                      position: "absolute",
                      bottom: 12,
                      left: 12,
                      background: "var(--surface2)",
                      color: "var(--text-dim)",
                      padding: "4px 10px",
                      borderRadius: 4,
                      fontSize: 10,
                    }}
                  >
                    {stream.category}
                  </span>
                )}
              </div>

              <div style={{ padding: 16 }}>
                <h3
                  style={{
                    fontSize: 16,
                    marginBottom: 8,
                    color: "var(--text)",
                    fontWeight: 600,
                  }}
                >
                  {stream.title}
                </h3>
                <p
                  style={{
                    color: "var(--text-dim)",
                    fontSize: 13,
                    marginBottom: 12,
                    lineHeight: 1.5,
                  }}
                >
                  {stream.description || "No description provided"}
                </p>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background:
                          "linear-gradient(135deg, var(--gold), var(--purple))",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 700,
                        color: "var(--bg)",
                      }}
                    >
                      {stream.host.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>
                        {stream.host.name}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--text-dim)" }}>
                        Trust: {stream.host.trustScore}
                      </div>
                    </div>
                  </div>
                  {stream.status === "LIVE" && (
                    <div
                      style={{
                        fontSize: 12,
                        color: "var(--red)",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: "var(--red)",
                        }}
                      />
                      {stream.viewers} watching
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 8 }}>
                  {stream.host.id === user?.id ? (
                    <button
                      onClick={() => startStream(stream.id)}
                      style={{
                        flex: 1,
                        background: "var(--red)",
                        border: "none",
                        borderRadius: 6,
                        padding: "10px 16px",
                        color: "white",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "Space Mono",
                      }}
                    >
                      {stream.status === "LIVE" ? "MANAGE STREAM" : "GO LIVE"}
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        (window.location.href = `/market/stream/${stream.id}`)
                      }
                      style={{
                        flex: 1,
                        background:
                          stream.status === "LIVE"
                            ? "var(--purple)"
                            : "var(--surface2)",
                        border: "none",
                        borderRadius: 6,
                        padding: "10px 16px",
                        color:
                          stream.status === "LIVE"
                            ? "white"
                            : "var(--text-dim)",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        fontFamily: "Space Mono",
                      }}
                    >
                      {stream.status === "LIVE" ? "WATCH NOW" : "VIEW DETAILS"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Stream Modal */}
      {showCreateStream && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 32,
              width: "100%",
              maxWidth: 500,
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 28,
                color: "var(--gold)",
                marginBottom: 24,
              }}
            >
              Create Broadcast Stream
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10,
                    color: "var(--text-dim)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Stream Title *
                </label>
                <input
                  value={newStream.title}
                  onChange={(e) =>
                    setNewStream({ ...newStream, title: e.target.value })
                  }
                  placeholder="e.g. Building My Startup Live"
                  style={{
                    width: "100%",
                    background: "var(--surface2)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: "12px 16px",
                    color: "var(--text)",
                    fontSize: 14,
                    fontFamily: "Syne",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10,
                    color: "var(--text-dim)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Description
                </label>
                <textarea
                  value={newStream.description}
                  onChange={(e) =>
                    setNewStream({ ...newStream, description: e.target.value })
                  }
                  placeholder="What will you be streaming about?"
                  rows={3}
                  style={{
                    width: "100%",
                    background: "var(--surface2)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: "12px 16px",
                    color: "var(--text)",
                    fontSize: 14,
                    fontFamily: "Syne",
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div>
                  <label
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 10,
                      color: "var(--text-dim)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Category
                  </label>
                  <select
                    value={newStream.category}
                    onChange={(e) =>
                      setNewStream({ ...newStream, category: e.target.value })
                    }
                    style={{
                      width: "100%",
                      background: "var(--surface2)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      padding: "12px 16px",
                      color: "var(--text)",
                      fontSize: 14,
                      fontFamily: "Syne",
                      boxSizing: "border-box",
                    }}
                  >
                    {categories
                      .filter((c) => c.value !== "all")
                      .map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 10,
                      color: "var(--text-dim)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Schedule (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={newStream.scheduledAt}
                    onChange={(e) =>
                      setNewStream({
                        ...newStream,
                        scheduledAt: e.target.value,
                      })
                    }
                    style={{
                      width: "100%",
                      background: "var(--surface2)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      padding: "12px 16px",
                      color: "var(--text)",
                      fontSize: 14,
                      fontFamily: "Syne",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 16 }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={newStream.isPPV}
                    onChange={(e) =>
                      setNewStream({ ...newStream, isPPV: e.target.checked })
                    }
                    style={{ width: 16, height: 16 }}
                  />
                  <span style={{ fontSize: 13, color: "var(--text)" }}>
                    Pay-Per-View
                  </span>
                </label>
                {newStream.isPPV && (
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span style={{ fontSize: 13, color: "var(--text-dim)" }}>
                      $
                    </span>
                    <input
                      type="number"
                      value={newStream.ppvPrice}
                      onChange={(e) =>
                        setNewStream({
                          ...newStream,
                          ppvPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="9.99"
                      style={{
                        width: 80,
                        background: "var(--surface2)",
                        border: "1px solid var(--border)",
                        borderRadius: 6,
                        padding: "8px 12px",
                        color: "var(--text)",
                        fontSize: 14,
                        fontFamily: "Syne",
                      }}
                    />
                  </div>
                )}
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={newStream.superChatEnabled}
                  onChange={(e) =>
                    setNewStream({
                      ...newStream,
                      superChatEnabled: e.target.checked,
                    })
                  }
                  style={{ width: 16, height: 16 }}
                />
                <span style={{ fontSize: 13, color: "var(--text)" }}>
                  Enable Super Chat
                </span>
              </label>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button
                onClick={() => setShowCreateStream(false)}
                style={{
                  flex: 1,
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "12px 24px",
                  color: "var(--text)",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "Syne",
                }}
              >
                Cancel
              </button>
              <button
                onClick={createStream}
                disabled={!newStream.title}
                style={{
                  flex: 1,
                  background: newStream.title
                    ? "var(--red)"
                    : "var(--surface2)",
                  border: "none",
                  borderRadius: 6,
                  padding: "12px 24px",
                  color: newStream.title ? "white" : "var(--text-dim)",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: newStream.title ? "pointer" : "not-allowed",
                  fontFamily: "Syne",
                }}
              >
                Create Stream
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateRoom && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 32,
              width: "100%",
              maxWidth: 500,
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 28,
                color: "var(--purple)",
                marginBottom: 24,
              }}
            >
              Create Video Room
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10,
                    color: "var(--text-dim)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Room Title *
                </label>
                <input
                  value={newRoom.title}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, title: e.target.value })
                  }
                  placeholder="e.g. Weekly Team Standup"
                  style={{
                    width: "100%",
                    background: "var(--surface2)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: "12px 16px",
                    color: "var(--text)",
                    fontSize: 14,
                    fontFamily: "Syne",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: 10,
                    color: "var(--text-dim)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Description
                </label>
                <textarea
                  value={newRoom.description}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, description: e.target.value })
                  }
                  placeholder="What's this room about?"
                  rows={3}
                  style={{
                    width: "100%",
                    background: "var(--surface2)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: "12px 16px",
                    color: "var(--text)",
                    fontSize: 14,
                    fontFamily: "Syne",
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div>
                  <label
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 10,
                      color: "var(--text-dim)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Room Type
                  </label>
                  <select
                    value={newRoom.roomType}
                    onChange={(e) =>
                      setNewRoom({ ...newRoom, roomType: e.target.value })
                    }
                    style={{
                      width: "100%",
                      background: "var(--surface2)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      padding: "12px 16px",
                      color: "var(--text)",
                      fontSize: 14,
                      fontFamily: "Syne",
                      boxSizing: "border-box",
                    }}
                  >
                    {roomTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 10,
                      color: "var(--text-dim)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Max Participants
                  </label>
                  <input
                    type="number"
                    value={newRoom.maxParticipants}
                    onChange={(e) =>
                      setNewRoom({
                        ...newRoom,
                        maxParticipants: parseInt(e.target.value) || 50,
                      })
                    }
                    min={2}
                    max={500}
                    style={{
                      width: "100%",
                      background: "var(--surface2)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      padding: "12px 16px",
                      color: "var(--text)",
                      fontSize: 14,
                      fontFamily: "Syne",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 16,
                }}
              >
                <div>
                  <label
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 10,
                      color: "var(--text-dim)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Schedule (optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={newRoom.scheduledAt}
                    onChange={(e) =>
                      setNewRoom({ ...newRoom, scheduledAt: e.target.value })
                    }
                    style={{
                      width: "100%",
                      background: "var(--surface2)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      padding: "12px 16px",
                      color: "var(--text)",
                      fontSize: 14,
                      fontFamily: "Syne",
                      boxSizing: "border-box",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: 10,
                      color: "var(--text-dim)",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      display: "block",
                      marginBottom: 6,
                    }}
                  >
                    Password (optional)
                  </label>
                  <input
                    type="password"
                    value={newRoom.password}
                    onChange={(e) =>
                      setNewRoom({ ...newRoom, password: e.target.value })
                    }
                    placeholder="Leave empty for public"
                    style={{
                      width: "100%",
                      background: "var(--surface2)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      padding: "12px 16px",
                      color: "var(--text)",
                      fontSize: 14,
                      fontFamily: "Syne",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={newRoom.isPrivate}
                  onChange={(e) =>
                    setNewRoom({ ...newRoom, isPrivate: e.target.checked })
                  }
                  style={{ width: 16, height: 16 }}
                />
                <span style={{ fontSize: 13, color: "var(--text)" }}>
                  Private Room (requires password)
                </span>
              </label>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <button
                onClick={() => setShowCreateRoom(false)}
                style={{
                  flex: 1,
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "12px 24px",
                  color: "var(--text)",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "Syne",
                }}
              >
                Cancel
              </button>
              <button
                onClick={createRoom}
                disabled={!newRoom.title}
                style={{
                  flex: 1,
                  background: newRoom.title
                    ? "var(--purple)"
                    : "var(--surface2)",
                  border: "none",
                  borderRadius: 6,
                  padding: "12px 24px",
                  color: newRoom.title ? "white" : "var(--text-dim)",
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: newRoom.title ? "pointer" : "not-allowed",
                  fontFamily: "Syne",
                }}
              >
                Create Room
              </button>
            </div>
          </div>
        </div>
      )}

      <AssistantPanel assistant="nova" />
    </div>
  );
}
