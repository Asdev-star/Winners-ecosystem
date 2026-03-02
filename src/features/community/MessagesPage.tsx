// src/features/community/MessagesPage.tsx
// Phase 2 V1.3: Direct Messaging UI

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";
import { usePresence } from "./usePresence";
import { API_BASE } from "../../lib/api";

const API = API_BASE;

interface Conversation {
  id: string;
  title: string | null;
  isGroup: boolean;
  participants: Array<{ id: string; name: string; role: string }>;
  lastMessage: {
    id: string;
    content: string;
    sender: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

interface Message {
  id: string;
  content: string;
  type: string;
  sender: { id: string; name: string; email: string };
  createdAt: string;
  isRead: boolean;
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .dm-root {
    display: flex; height: 100vh;
    background: var(--bg); color: var(--text);
    font-family: 'Syne', sans-serif;
  }

  /* Sidebar */
  .dm-sidebar {
    width: 340px; flex-shrink: 0;
    background: var(--surface); border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
  }
  .dm-sidebar-header {
    padding: 20px; border-bottom: 1px solid var(--border);
    display: flex; justify-content: space-between; align-items: center;
  }
  .dm-sidebar-title { font-size: 18px; font-weight: 800; color: var(--text); }
  .dm-new-btn {
    width: 36px; height: 36px; border-radius: 50%;
    background: linear-gradient(135deg, var(--gold), var(--gold-dim));
    border: none; color: var(--bg); font-size: 20px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.2s ease;
  }
  .dm-new-btn:hover { transform: scale(1.08); }

  .dm-conv-list { flex: 1; overflow-y: auto; }
  .dm-conv-item {
    padding: 16px 20px; border-bottom: 1px solid var(--border);
    cursor: pointer; transition: background 0.15s ease;
    display: flex; gap: 12px; align-items: flex-start;
  }
  .dm-conv-item:hover { background: rgba(201,168,76,0.05); }
  .dm-conv-item.active { background: rgba(201,168,76,0.1); border-left: 3px solid var(--gold); }

  .dm-conv-avatar {
    width: 44px; height: 44px; border-radius: 50%;
    background: var(--surface2); flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px; font-weight: 700; color: var(--gold);
    border: 2px solid var(--border);
  }
  .dm-conv-info { flex: 1; min-width: 0; }
  .dm-conv-name {
    font-size: 14px; font-weight: 700; color: var(--text);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .dm-conv-preview {
    font-size: 12px; color: var(--text-dim);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-top: 2px;
  }
  .dm-conv-meta {
    display: flex; flex-direction: column; align-items: flex-end; gap: 4px;
  }
  .dm-conv-time {
    font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim);
  }
  .dm-unread-badge {
    background: var(--gold); color: var(--bg);
    font-family: 'Space Mono', monospace; font-size: 10px; font-weight: 700;
    padding: 2px 6px; border-radius: 10px; min-width: 18px; text-align: center;
  }

  /* Chat Area */
  .dm-chat {
    flex: 1; display: flex; flex-direction: column;
    background: linear-gradient(180deg, var(--bg) 0%, var(--surface) 100%);
  }
  .dm-chat-header {
    padding: 16px 24px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 12px;
    background: var(--surface);
  }
  .dm-chat-back {
    background: none; border: none; color: var(--text-dim);
    font-size: 20px; cursor: pointer; padding: 4px;
  }
  .dm-chat-avatar {
    width: 40px; height: 40px; border-radius: 50%;
    background: var(--surface2); display: flex; align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; color: var(--gold); border: 2px solid var(--gold);
  }
  .dm-chat-title { font-size: 16px; font-weight: 700; color: var(--text); }
  .dm-chat-status { font-size: 11px; color: var(--green); }

  .dm-messages {
    flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; gap: 16px;
  }
  .dm-message {
    max-width: 70%; display: flex; flex-direction: column;
  }
  .dm-message.sent { align-self: flex-end; }
  .dm-message.received { align-self: flex-start; }
  .dm-msg-bubble {
    padding: 12px 16px; border-radius: 16px; font-size: 14px; line-height: 1.5;
  }
  .dm-message.sent .dm-msg-bubble {
    background: linear-gradient(135deg, var(--gold), var(--gold-dim));
    color: var(--bg); border-bottom-right-radius: 4px;
  }
  .dm-message.received .dm-msg-bubble {
    background: var(--surface2); color: var(--text);
    border: 1px solid var(--border); border-bottom-left-radius: 4px;
  }
  .dm-msg-sender {
    font-size: 11px; color: var(--text-dim); margin-bottom: 4px;
  }
  .dm-message.sent .dm-msg-sender { text-align: right; }
  .dm-msg-time {
    font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim);
    margin-top: 4px;
  }
  .dm-message.sent .dm-msg-time { text-align: right; }

  .dm-input-area {
    padding: 16px 24px; border-top: 1px solid var(--border);
    display: flex; gap: 12px; align-items: flex-end;
    background: var(--surface);
  }
  .dm-input {
    flex: 1; background: var(--surface2); border: 1px solid var(--border);
    border-radius: 12px; padding: 12px 16px; color: var(--text);
    font-family: 'Syne', sans-serif; font-size: 14px; resize: none;
    outline: none; min-height: 44px; max-height: 120px;
  }
  .dm-input:focus { border-color: var(--gold); box-shadow: 0 0 0 2px rgba(201,168,76,0.1); }
  .dm-send-btn {
    width: 44px; height: 44px; border-radius: 50%;
    background: linear-gradient(135deg, var(--gold), var(--gold-dim));
    border: none; color: var(--bg); font-size: 18px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.2s ease;
  }
  .dm-send-btn:hover { transform: scale(1.05); }
  .dm-send-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Empty State */
  .dm-empty {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    color: var(--text-dim);
  }
  .dm-empty-icon { font-size: 64px; margin-bottom: 16px; opacity: 0.5; }
  .dm-empty-title { font-size: 20px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
  .dm-empty-text { font-size: 14px; }

  /* Online indicator */
  .dm-online-dot {
    width: 10px; height: 10px; border-radius: 50%;
    background: var(--green); border: 2px solid var(--surface);
    position: absolute; bottom: 0; right: 0;
  }
  .dm-conv-avatar-wrap { position: relative; }
  .dm-online-dot {
    width: 10px; height: 10px; border-radius: 50%;
    background: var(--green); border: 2px solid var(--surface);
    position: absolute; bottom: 0; right: 0;
  }

  @media (max-width: 768px) {
    .dm-sidebar { width: 100%; position: absolute; z-index: 10; }
    .dm-chat { width: 100%; }
  }
`;

export default function MessagesPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { user } = useAuthStore();
  const { isOnline, onlineCount } = usePresence();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Show online count in header
  const onlineStatus = onlineCount > 0 ? `${onlineCount} online` : "Offline";

  // Fetch conversations
  useEffect(() => {
    fetch(`${API}/messages`, { credentials: "include" })
      .then((r) => r.json())
      .then(setConversations)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Fetch messages when conversation selected
  useEffect(() => {
    if (!conversationId) return;
    fetch(`${API}/messages/${conversationId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => setMessages(data.messages || []))
      .catch(console.error);
  }, [conversationId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!newMessage.trim() || !conversationId) return;
    const res = await fetch(`${API}/messages/${conversationId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content: newMessage }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
    }
  }, [newMessage, conversationId]);

  const getConversationName = (conv: Conversation) => {
    if (conv.isGroup && conv.title) return conv.title;
    const other = conv.participants[0];
    return other?.name || "Unknown";
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const formatTime = (date: string) => {
    const d = new Date(date);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const currentConv = conversations.find((c) => c.id === conversationId);

  return (
    <>
      <style>{css}</style>
      <div className="dm-root">
        {/* Sidebar */}
        <div className="dm-sidebar">
          <div className="dm-sidebar-header">
            <span className="dm-sidebar-title">Messages</span>
            <button className="dm-new-btn" title="New Message">
              +
            </button>
          </div>
          <div className="dm-conv-list">
            {loading ? (
              <div style={{ padding: 20, color: "var(--text-dim)" }}>
                Loading...
              </div>
            ) : conversations.length === 0 ? (
              <div
                style={{
                  padding: 20,
                  color: "var(--text-dim)",
                  textAlign: "center",
                }}
              >
                No conversations yet
              </div>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  className={`dm-conv-item ${conversationId === conv.id ? "active" : ""}`}
                  onClick={() => navigate(`/messages/${conv.id}`)}
                >
                  <div className="dm-conv-avatar-wrap">
                    <div className="dm-conv-avatar">
                      {getInitials(getConversationName(conv))}
                    </div>
                  </div>
                  <div className="dm-conv-info">
                    <div className="dm-conv-name">
                      {getConversationName(conv)}
                    </div>
                    <div className="dm-conv-preview">
                      {conv.lastMessage?.content || "No messages"}
                    </div>
                  </div>
                  <div className="dm-conv-meta">
                    {conv.lastMessage && (
                      <span className="dm-conv-time">
                        {formatTime(conv.lastMessage.createdAt)}
                      </span>
                    )}
                    {conv.unreadCount > 0 && (
                      <span className="dm-unread-badge">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {conversationId ? (
          <div className="dm-chat">
            <div className="dm-chat-header">
              <button
                className="dm-chat-back"
                onClick={() => navigate("/messages")}
              >
                ←
              </button>
              <div className="dm-chat-avatar">
                {currentConv && getInitials(getConversationName(currentConv))}
              </div>
              <div>
                <div className="dm-chat-title">
                  {currentConv ? getConversationName(currentConv) : "Chat"}
                </div>
                <div className="dm-chat-status">{onlineStatus}</div>
              </div>
            </div>

            <div className="dm-messages">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`dm-message ${msg.sender.id === user?.id ? "sent" : "received"}`}
                >
                  {msg.sender.id !== user?.id && (
                    <div className="dm-msg-sender">{msg.sender.name}</div>
                  )}
                  <div className="dm-msg-bubble">{msg.content}</div>
                  <div className="dm-msg-time">{formatTime(msg.createdAt)}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="dm-input-area">
              <textarea
                className="dm-input"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                rows={1}
              />
              <button
                className="dm-send-btn"
                onClick={handleSend}
                disabled={!newMessage.trim()}
              >
                ➤
              </button>
            </div>
          </div>
        ) : (
          <div className="dm-empty">
            <div className="dm-empty-icon">💬</div>
            <div className="dm-empty-title">Your Messages</div>
            <div className="dm-empty-text">
              Select a conversation to start chatting
            </div>
          </div>
        )}
      </div>
    </>
  );
}
