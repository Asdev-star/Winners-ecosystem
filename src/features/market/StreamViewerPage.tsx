// Phase 4C — Winners Market: Stream Viewer
// Live stream viewing with super chat, PPV, and real-time interaction
// AI supervisor: NOVA (Community) / OMEGA

import { useState, useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";
import ContextBar from "../../components/ui/ContextBar";

const API_BASE =
  (import.meta as { env?: { VITE_API_URL?: string } }).env?.VITE_API_URL ||
  "http://localhost:3001/api/v1";

interface Stream {
  id: string;
  title: string;
  description?: string;
  host: { id: string; name: string; trustScore: number };
  status: string;
  isPPV: boolean;
  ppvPrice: number;
  superChatEnabled: boolean;
  muxPlaybackId?: string;
  livekitToken?: string;
  livekitUrl?: string;
  viewers: Array<{ id: string; user: { id: string; name: string } }>;
  superChats: Array<{
    id: string;
    user: { id: string; name: string };
    amount: number;
    message: string;
    pinnedUntil?: string;
    createdAt: string;
  }>;
}

interface ChatMessage {
  id: string;
  user: { id: string; name: string };
  amount: number;
  message: string;
  createdAt: string;
  isPinned: boolean;
}

export default function StreamViewerPage() {
  const { streamId } = useParams();
  const [searchParams] = useSearchParams();
  const { token, user } = useAuthStore();
  const [stream, setStream] = useState<Stream | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [superChatMessage, setSuperChatMessage] = useState("");
  const [superChatAmount, setSuperChatAmount] = useState(5);
  const [sendingSuperChat, setSendingSuperChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [showPPVModal, setShowPPVModal] = useState(false);
  const [purchasingPPV, setPurchasingPPV] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchStream();
  }, [streamId]);

  const fetchStream = async () => {
    try {
      const res = await fetch(`${API_BASE}/studio/streams/${streamId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStream(data);
        setChatMessages(data.superChats || []);

        // Check if PPV and user hasn't purchased
        if (data.isPPV && data.host.id !== user?.id) {
          const hasAccess = data.viewers.some(
            (v: any) => v.user.id === user?.id,
          );
          if (!hasAccess) {
            setShowPPVModal(true);
          }
        }
      } else {
        setError("Stream not found");
      }
    } catch (err) {
      setError("Failed to load stream");
    } finally {
      setLoading(false);
    }
  };

  const purchasePPV = async () => {
    setPurchasingPPV(true);
    try {
      const res = await fetch(
        `${API_BASE}/studio/streams/${streamId}/purchase`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      if (res.ok) {
        setShowPPVModal(false);
        fetchStream();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to purchase access");
      }
    } catch (err) {
      setError("Failed to purchase access");
    } finally {
      setPurchasingPPV(false);
    }
  };

  const sendSuperChat = async () => {
    if (!superChatMessage.trim() || superChatAmount < 1) return;
    setSendingSuperChat(true);
    try {
      const res = await fetch(
        `${API_BASE}/studio/streams/${streamId}/superchat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            amount: superChatAmount,
            message: superChatMessage,
          }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        setChatMessages((prev) => [data, ...prev]);
        setSuperChatMessage("");
      }
    } catch (err) {
      console.error("Error sending super chat:", err);
    } finally {
      setSendingSuperChat(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px 40px" }}>
        <ContextBar platform="market" />
        <div
          style={{ textAlign: "center", padding: 60, color: "var(--text-dim)" }}
        >
          Loading stream...
        </div>
      </div>
    );
  }

  if (error || !stream) {
    return (
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px 40px" }}>
        <ContextBar platform="market" />
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <h2 style={{ color: "var(--red)", marginBottom: 8 }}>
            {error || "Stream not found"}
          </h2>
          <a href="/market/stream" style={{ color: "var(--gold)" }}>
            ← Back to Winners Stream
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px 40px" }}>
      <ContextBar platform="market" />

      {/* PPV Modal */}
      {showPPVModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.9)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--gold)",
              borderRadius: 12,
              padding: 32,
              width: "100%",
              maxWidth: 400,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h2
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 28,
                color: "var(--gold)",
                marginBottom: 8,
              }}
            >
              Pay-Per-View
            </h2>
            <p style={{ color: "var(--text-dim)", marginBottom: 24 }}>
              This stream requires a one-time payment to watch.
            </p>
            <div
              style={{
                background: "var(--surface2)",
                borderRadius: 8,
                padding: 16,
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: 36,
                  fontWeight: 600,
                  color: "var(--gold)",
                }}
              >
                ${stream.ppvPrice}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
                One-time payment
              </div>
            </div>
            <button
              onClick={purchasePPV}
              disabled={purchasingPPV}
              style={{
                width: "100%",
                background: "var(--gold)",
                border: "none",
                borderRadius: 8,
                padding: "14px 24px",
                color: "var(--bg)",
                fontSize: 14,
                fontWeight: 700,
                cursor: purchasingPPV ? "not-allowed" : "pointer",
                fontFamily: "Syne",
                opacity: purchasingPPV ? 0.7 : 1,
              }}
            >
              {purchasingPPV
                ? "Processing..."
                : `Pay $${stream.ppvPrice} to Watch`}
            </button>
            <button
              onClick={() => (window.location.href = "/market/stream")}
              style={{
                width: "100%",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: "14px 24px",
                color: "var(--text-dim)",
                fontSize: 14,
                cursor: "pointer",
                fontFamily: "Syne",
                marginTop: 12,
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 360px",
          gap: 24,
          marginTop: 24,
        }}
      >
        {/* Main Video Area */}
        <div>
          {/* Video Player */}
          <div
            style={{
              background: "#000",
              borderRadius: 8,
              overflow: "hidden",
              position: "relative",
              aspectRatio: "16/9",
              marginBottom: 16,
            }}
          >
            {stream.muxPlaybackId ? (
              <video
                ref={videoRef}
                src={`https://stream.mux.com/${stream.muxPlaybackId}.m3u8`}
                controls
                autoPlay
                style={{ width: "100%", height: "100%" }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background:
                    "linear-gradient(135deg, var(--surface2), var(--surface))",
                }}
              >
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 64, marginBottom: 16 }}>📡</div>
                  <div style={{ color: "var(--text-dim)", fontSize: 14 }}>
                    {stream.status === "LIVE"
                      ? "Stream is live"
                      : "Stream has ended"}
                  </div>
                </div>
              </div>
            )}

            {stream.status === "LIVE" && (
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  left: 16,
                  background: "var(--red)",
                  color: "white",
                  padding: "6px 12px",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "white",
                    animation: "pulse 1.5s infinite",
                  }}
                />
                LIVE
              </div>
            )}

            {stream.isPPV && (
              <div
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  background: "var(--gold)",
                  color: "var(--bg)",
                  padding: "6px 12px",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                PPV ${stream.ppvPrice}
              </div>
            )}
          </div>

          {/* Stream Info */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 20,
            }}
          >
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontSize: 28,
                color: "var(--text)",
                marginBottom: 8,
              }}
            >
              {stream.title}
            </h1>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, var(--gold), var(--purple))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--bg)",
                  }}
                >
                  {stream.host.name.charAt(0)}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {stream.host.name}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-dim)" }}>
                    Trust Score: {stream.host.trustScore}
                  </div>
                </div>
              </div>

              {stream.status === "LIVE" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "var(--surface2)",
                    padding: "6px 12px",
                    borderRadius: 20,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: "var(--red)",
                    }}
                  />
                  <span style={{ fontSize: 12, color: "var(--text)" }}>
                    {stream.viewers.length} watching
                  </span>
                </div>
              )}
            </div>

            {stream.description && (
              <p
                style={{
                  color: "var(--text-dim)",
                  fontSize: 14,
                  lineHeight: 1.6,
                }}
              >
                {stream.description}
              </p>
            )}
          </div>
        </div>

        {/* Chat / Super Chat Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Super Chat */}
          {stream.superChatEnabled && (
            <div
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                padding: 16,
              }}
            >
              <h3
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 11,
                  color: "var(--gold)",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 12,
                }}
              >
                💰 Super Chat
              </h3>

              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                {[1, 5, 10, 20, 50].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setSuperChatAmount(amount)}
                    style={{
                      flex: 1,
                      background:
                        superChatAmount === amount
                          ? "var(--gold)"
                          : "var(--surface2)",
                      border: "1px solid var(--border)",
                      borderRadius: 6,
                      padding: "8px 4px",
                      color:
                        superChatAmount === amount
                          ? "var(--bg)"
                          : "var(--text)",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      fontFamily: "Space Mono",
                    }}
                  >
                    ${amount}
                  </button>
                ))}
              </div>

              <textarea
                value={superChatMessage}
                onChange={(e) => setSuperChatMessage(e.target.value)}
                placeholder="Send a super chat message..."
                rows={2}
                style={{
                  width: "100%",
                  background: "var(--surface2)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: "10px 12px",
                  color: "var(--text)",
                  fontSize: 13,
                  fontFamily: "Syne",
                  boxSizing: "border-box",
                  resize: "none",
                  marginBottom: 12,
                }}
              />

              <button
                onClick={sendSuperChat}
                disabled={!superChatMessage.trim() || sendingSuperChat}
                style={{
                  width: "100%",
                  background: superChatMessage.trim()
                    ? "var(--gold)"
                    : "var(--surface2)",
                  border: "none",
                  borderRadius: 6,
                  padding: "10px 16px",
                  color: superChatMessage.trim()
                    ? "var(--bg)"
                    : "var(--text-dim)",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: superChatMessage.trim() ? "pointer" : "not-allowed",
                  fontFamily: "Space Mono",
                }}
              >
                {sendingSuperChat
                  ? "SENDING..."
                  : `SEND $${superChatAmount} SUPER CHAT`}
              </button>
            </div>
          )}

          {/* Chat Messages */}
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 16px",
                borderBottom: "1px solid var(--border)",
                fontFamily: "'Space Mono', monospace",
                fontSize: 11,
                color: "var(--text-dim)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Super Chats ({chatMessages.length})
            </div>

            <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
              {chatMessages.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: 20,
                    color: "var(--text-dim)",
                    fontSize: 13,
                  }}
                >
                  No super chats yet. Be the first!
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      background: msg.isPinned
                        ? "rgba(201,168,76,0.1)"
                        : "var(--surface2)",
                      border: `1px solid ${msg.isPinned ? "var(--gold)" : "var(--border)"}`,
                      borderRadius: 8,
                      padding: 12,
                      marginBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 6,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background:
                              "linear-gradient(135deg, var(--gold), var(--purple))",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: 10,
                            fontWeight: 700,
                            color: "var(--bg)",
                          }}
                        >
                          {msg.user.name.charAt(0)}
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>
                          {msg.user.name}
                        </span>
                      </div>
                      <div
                        style={{
                          background: "var(--gold)",
                          color: "var(--bg)",
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontSize: 10,
                          fontWeight: 700,
                          fontFamily: "Space Mono",
                        }}
                      >
                        ${msg.amount}
                      </div>
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--text)",
                        lineHeight: 1.5,
                        margin: 0,
                      }}
                    >
                      {msg.message}
                    </p>
                    <div
                      style={{
                        fontSize: 10,
                        color: "var(--text-dim)",
                        marginTop: 6,
                      }}
                    >
                      {formatTime(msg.createdAt)}
                      {msg.isPinned && " • 📌 Pinned"}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
