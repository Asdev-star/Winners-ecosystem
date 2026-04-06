// Phase 2 — Winners Community — MessagesPage.tsx
// V1.3: Direct Messaging — real-time via WebSocket, New Message modal, online presence

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuthStore } from "../auth/authStore";
import { API_BASE } from "../../lib/api";
import { usePresence } from "./usePresence";

const API = API_BASE;

function getAuthHeaders(token?: string): Record<string, string> {
  const authToken = token || localStorage.getItem("token");
  return authToken
    ? {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      }
    : { "Content-Type": "application/json" };
}

interface OtherUser {
  id: string;
  name: string | null;
  email: string;
}

interface LastMessage {
  id: string;
  content: string;
  sender: { id: string; name: string | null };
  createdAt: string;
}

interface Conversation {
  id: string;
  title: string | null;
  isGroup: boolean;
  otherUser: OtherUser | null;
  lastMessage: LastMessage | null;
  unreadCount: number;
  updatedAt: string;
}

interface Message {
  id: string;
  content: string;
  type: string;
  sender: { id: string; name: string | null };
  createdAt: string;
}

interface TenantUser {
  id: string;
  name: string | null;
  email: string;
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .dm-root {
    display: flex; height: calc(100vh - 60px);
    background: var(--bg); color: var(--text);
    font-family: 'Syne', sans-serif;
    border-radius: 8px; overflow: hidden;
    border: 1px solid var(--border);
    box-shadow: 0 16px 42px rgba(0,0,0,0.22);
  }

  .dm-sidebar {
    width: 320px; flex-shrink: 0;
    background: var(--surface); border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
  }
  .dm-sidebar-header {
    padding: 18px 20px; border-bottom: 1px solid var(--border);
    display: flex; justify-content: space-between; align-items: center;
  }
  .dm-sidebar-title { font-size: 16px; font-weight: 800; color: var(--text); }
  .dm-sidebar-sub { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); margin-top: 2px; }
  .dm-new-btn {
    width: 32px; height: 32px; border-radius: 50%;
    background: var(--gold); border: none; color: var(--bg);
    font-size: 18px; cursor: pointer; display: flex;
    align-items: center; justify-content: center;
    transition: transform 0.2s ease;
  }
  .dm-new-btn:hover { transform: scale(1.08); }

  .dm-search {
    padding: 10px 16px; border-bottom: 1px solid var(--border);
  }
  .dm-search input {
    width: 100%; background: var(--surface2); border: 1px solid var(--border);
    border-radius: 6px; padding: 8px 12px; color: var(--text);
    font-family: 'Syne', sans-serif; font-size: 13px; outline: none;
    box-sizing: border-box;
  }
  .dm-search input:focus { border-color: var(--gold); }

  .dm-conv-list { flex: 1; overflow-y: auto; }
  .dm-conv-item {
    padding: 14px 16px; border-bottom: 1px solid var(--border);
    cursor: pointer; transition: background 0.15s ease;
    display: flex; gap: 10px; align-items: flex-start;
  }
  .dm-conv-item:hover { background: rgba(201,168,76,0.05); }
  .dm-conv-item.active { background: rgba(201,168,76,0.1); border-left: 3px solid var(--gold); }

  .dm-conv-avatar-wrap { position: relative; flex-shrink: 0; }
  .dm-conv-avatar {
    width: 40px; height: 40px; border-radius: 50%;
    background: var(--surface2); display: flex;
    align-items: center; justify-content: center;
    font-size: 14px; font-weight: 700; color: var(--gold);
    border: 2px solid var(--border);
  }
  .dm-online-dot {
    width: 9px; height: 9px; border-radius: 50%;
    background: var(--green); border: 2px solid var(--surface);
    position: absolute; bottom: 0; right: 0;
  }
  .dm-conv-info { flex: 1; min-width: 0; }
  .dm-conv-name {
    font-size: 13px; font-weight: 700; color: var(--text);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  .dm-conv-preview {
    font-size: 12px; color: var(--text-dim);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin-top: 2px;
  }
  .dm-conv-meta { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
  .dm-conv-time { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); }
  .dm-unread-badge {
    background: var(--gold); color: var(--bg);
    font-family: 'Space Mono', monospace; font-size: 9px; font-weight: 700;
    padding: 2px 6px; border-radius: 10px; min-width: 16px; text-align: center;
  }

  .dm-chat {
    flex: 1; display: flex; flex-direction: column;
    background: linear-gradient(180deg, var(--bg) 0%, var(--surface) 100%);
    min-width: 0;
  }
  .dm-chat-header {
    padding: 14px 20px; border-bottom: 1px solid var(--border);
    display: flex; align-items: center; gap: 10px;
    background: var(--surface);
  }
  .dm-chat-back {
    background: none; border: none; color: var(--text-dim);
    font-size: 18px; cursor: pointer; padding: 4px;
  }
  .dm-chat-avatar {
    width: 36px; height: 36px; border-radius: 50%;
    background: var(--surface2); display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: var(--gold); border: 2px solid var(--gold);
    flex-shrink: 0;
  }
  .dm-chat-name { font-size: 15px; font-weight: 700; color: var(--text); }
  .dm-chat-status { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--green); margin-top: 1px; }
  .dm-chat-status.offline { color: var(--text-dim); }

  .dm-messages {
    flex: 1; overflow-y: auto; padding: 20px;
    display: flex; flex-direction: column; gap: 12px;
  }
  .dm-message {
    max-width: 72%;
    display: flex;
    flex-direction: column;
    animation: dm-pop 180ms ease-out;
  }
  .dm-message.sent { align-self: flex-end; }
  .dm-message.received { align-self: flex-start; }
  .dm-msg-sender { font-size: 10px; color: var(--text-dim); margin-bottom: 3px; }
  .dm-message.sent .dm-msg-sender { text-align: right; }
  .dm-msg-bubble { padding: 10px 14px; border-radius: 14px; font-size: 13px; line-height: 1.5; }
  .dm-message.sent .dm-msg-bubble {
    background: linear-gradient(135deg, var(--gold), #b8922a);
    color: #0d1520; border-bottom-right-radius: 4px;
  }
  .dm-message.received .dm-msg-bubble {
    background: var(--surface2); color: var(--text);
    border: 1px solid var(--border); border-bottom-left-radius: 4px;
  }
  .dm-msg-time {
    font-family: 'Space Mono', monospace; font-size: 9px;
    color: var(--text-dim); margin-top: 3px;
  }
  .dm-message.sent .dm-msg-time { text-align: right; }

  .dm-input-area {
    padding: 14px 20px; border-top: 1px solid var(--border);
    display: flex; gap: 10px; align-items: flex-end;
    background: var(--surface);
  }
  .dm-input {
    flex: 1; background: var(--surface2); border: 1px solid var(--border);
    border-radius: 10px; padding: 10px 14px; color: var(--text);
    font-family: 'Syne', sans-serif; font-size: 13px; resize: none;
    outline: none; min-height: 40px; max-height: 110px;
  }
  .dm-input:focus { border-color: var(--gold); }
  .dm-send-btn {
    width: 40px; height: 40px; border-radius: 50%;
    background: var(--gold); border: none;
    color: var(--bg); font-size: 16px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.2s ease; flex-shrink: 0;
  }
  .dm-send-btn:hover { transform: scale(1.05); }
  .dm-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .dm-empty {
    flex: 1; display: flex; flex-direction: column;
    align-items: center; justify-content: center; color: var(--text-dim);
  }
  .dm-empty-icon { font-size: 56px; margin-bottom: 14px; opacity: 0.4; }
  .dm-empty-title { font-size: 18px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
  .dm-empty-text { font-size: 13px; text-align: center; max-width: 260px; line-height: 1.6; }

  /* New Message Modal */
  .dm-modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.6);
    display: flex; align-items: center; justify-content: center;
    z-index: 1000;
  }
  .dm-modal {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; padding: 0; width: 400px; max-height: 500px;
    display: flex; flex-direction: column; overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5);
    position: relative;
  }
  .dm-modal::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0;
    height: 2px; background: linear-gradient(90deg, var(--gold), transparent);
  }
  .dm-modal-header {
    padding: 18px 20px; border-bottom: 1px solid var(--border);
    display: flex; justify-content: space-between; align-items: center;
  }
  .dm-modal-title { font-size: 15px; font-weight: 700; }
  .dm-modal-close {
    background: none; border: none; color: var(--text-dim);
    font-size: 20px; cursor: pointer; padding: 0;
  }
  .dm-modal-search {
    padding: 14px 20px; border-bottom: 1px solid var(--border);
  }
  .dm-modal-search input {
    width: 100%; background: var(--surface2); border: 1px solid var(--border);
    border-radius: 6px; padding: 10px 12px; color: var(--text);
    font-family: 'Syne', sans-serif; font-size: 13px; outline: none;
    box-sizing: border-box;
  }
  .dm-modal-search input:focus { border-color: var(--gold); }
  .dm-user-list { overflow-y: auto; flex: 1; }
  .dm-user-item {
    padding: 12px 20px; display: flex; align-items: center; gap: 10px;
    cursor: pointer; transition: background 0.12s ease;
    border-bottom: 1px solid var(--border);
  }
  .dm-user-item:hover { background: rgba(201,168,76,0.08); }
  .dm-user-avatar {
    width: 36px; height: 36px; border-radius: 50%; background: var(--surface3);
    display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: var(--gold); flex-shrink: 0;
  }
  .dm-user-name { font-size: 13px; font-weight: 600; }
  .dm-user-email { font-size: 11px; color: var(--text-dim); margin-top: 1px; }

  @media (max-width: 768px) {
    .dm-root { height: calc(100vh - 60px); border-radius: 0; border: none; }
    .dm-sidebar { width: 100%; }
    .dm-chat { display: none; }
    .dm-chat.active { display: flex; position: absolute; inset: 0; z-index: 5; }
    .dm-sidebar-header { padding: 16px 16px 14px; }
    .dm-search { padding: 10px 14px; }
    .dm-conv-item { padding: 12px 14px; }
    .dm-messages { padding: 16px; gap: 10px; }
    .dm-message { max-width: 82%; }
    .dm-input-area { padding: 12px 14px; }
    .dm-input { font-size: 14px; }
  }

  @media (max-width: 500px) {
    .dm-sidebar-header {
      padding: 14px 14px 12px;
      gap: 10px;
    }
    .dm-sidebar-title { font-size: 15px; }
    .dm-sidebar-sub { font-size: 8px; }
    .dm-new-btn { width: 30px; height: 30px; font-size: 16px; }
    .dm-search input { font-size: 12px; padding: 8px 10px; }
    .dm-conv-name { font-size: 12px; }
    .dm-conv-preview { font-size: 11px; }
    .dm-chat-header { padding: 12px 14px; }
    .dm-chat-name { font-size: 14px; }
    .dm-messages { padding: 14px 12px; }
    .dm-message { max-width: 88%; }
    .dm-msg-bubble { padding: 9px 12px; font-size: 12px; }
    .dm-input-area {
      padding: 12px;
      flex-direction: column;
      align-items: stretch;
    }
    .dm-input { min-height: 54px; max-height: 140px; }
    .dm-send-btn {
      width: 100%;
      height: 40px;
      border-radius: 10px;
    }
  }

  @keyframes pulse {
    0%, 100% { opacity: 0.45; }
    50% { opacity: 1; }
  }

  @keyframes dm-pop {
    from { opacity: 0; transform: translateY(6px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

function initials(name: string | null | undefined, email?: string) {
  const n = name || email || "?";
  return n
    .split(" ")
    .map((x) => x[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MessagesPage() {
  const navigate = useNavigate();
  const { conversationId } = useParams<{ conversationId?: string }>();
  const { user, token } = useAuthStore();
  const { isOnline } = usePresence();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [convSearch, setConvSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [tenantUsers, setTenantUsers] = useState<TenantUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentConv =
    conversations.find((c) => c.id === conversationId) ?? null;
  const otherOnline = currentConv?.otherUser
    ? isOnline(currentConv.otherUser.id)
    : false;

  const filteredConvs = conversations.filter((c) => {
    const name = c.otherUser?.name ?? c.otherUser?.email ?? c.title ?? "";
    return name.toLowerCase().includes(convSearch.toLowerCase());
  });

  const filteredUsers = tenantUsers.filter((u) => {
    if (u.id === user?.id) return false;
    const term = userSearch.toLowerCase();
    return (
      (u.name?.toLowerCase().includes(term) ?? false) ||
      u.email.toLowerCase().includes(term)
    );
  });

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch(`${API}/messages`, {
        headers: getAuthHeaders(token),
      });
      if (res.ok) setConversations(await res.json());
    } catch {
      /* silent */
    } finally {
      setLoading(false);
    }
  }, [token]);

  const loadMessages = useCallback(
    async (convId: string) => {
      try {
        const res = await fetch(`${API}/messages/${convId}`, {
          headers: getAuthHeaders(token),
        });
        if (res.ok) {
          const data = await res.json();
          setMessages(data.messages ?? []);
        }
      } catch {
        /* silent */
      }
    },
    [token],
  );

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (conversationId) {
      setMessages([]);
      loadMessages(conversationId);
    }
  }, [conversationId, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // WebSocket — real-time message delivery
  useEffect(() => {
    const storedToken = token || localStorage.getItem("token");
    if (!storedToken) return;

    const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws?token=${storedToken}`;
    const socket = new WebSocket(wsUrl);

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "new_message") {
          if (data.conversationId === conversationId) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === data.message.id)) return prev;
              return [...prev, data.message];
            });
          }
          loadConversations();
        }
      } catch {
        /* ignore */
      }
    };

    return () => {
      socket.close();
    };
  }, [token, conversationId, loadConversations]);

  const handleSend = useCallback(async () => {
    if (!newMessage.trim() || !conversationId || sending) return;
    setSending(true);
    const optimistic: Message = {
      id: `opt-${Date.now()}`,
      content: newMessage,
      type: "TEXT",
      sender: { id: user?.id ?? "", name: user?.name ?? null },
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setNewMessage("");
    try {
      const res = await fetch(`${API}/messages/${conversationId}`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ content: optimistic.content }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages((prev) =>
          prev.map((m) => (m.id === optimistic.id ? msg : m)),
        );
        loadConversations();
      }
    } catch {
      /* silent */
    } finally {
      setSending(false);
    }
  }, [newMessage, conversationId, sending, user, loadConversations]);

  const openNewModal = async () => {
    setShowNewModal(true);
    setUserSearch("");
    setUsersLoading(true);
    try {
      const res = await fetch(`${API}/users`, {
        headers: getAuthHeaders(token),
      });
      if (res.ok) {
        const data = await res.json();
        setTenantUsers(data.users ?? data ?? []);
      }
    } catch {
      /* silent */
    } finally {
      setUsersLoading(false);
    }
  };

  const startConversation = async (participantId: string) => {
    setShowNewModal(false);
    try {
      const res = await fetch(`${API}/messages`, {
        method: "POST",
        headers: getAuthHeaders(token),
        body: JSON.stringify({ participantId }),
      });
      if (res.ok) {
        const conv = await res.json();
        await loadConversations();
        navigate(`/messages/${conv.id}`);
      }
    } catch {
      /* silent */
    }
  };

  const convName = (c: Conversation) =>
    c.isGroup && c.title
      ? c.title
      : (c.otherUser?.name ?? c.otherUser?.email ?? "Unknown");

  return (
    <>
      <style>{css}</style>

      {/* New Message Modal */}
      {showNewModal && (
        <div
          className="dm-modal-overlay"
          onClick={() => setShowNewModal(false)}
        >
          <div className="dm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="dm-modal-header">
              <span className="dm-modal-title">New Message</span>
              <button
                className="dm-modal-close"
                onClick={() => setShowNewModal(false)}
              >
                ×
              </button>
            </div>
            <div className="dm-modal-search">
              <input
                autoFocus
                placeholder="Search people..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
            </div>
            <div className="dm-user-list">
              {usersLoading ? (
                <div
                  style={{
                    padding: "20px",
                    color: "var(--text-dim)",
                    fontSize: "13px",
                    textAlign: "center",
                  }}
                >
                  Loading...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div
                  style={{
                    padding: "20px",
                    color: "var(--text-dim)",
                    fontSize: "13px",
                    textAlign: "center",
                  }}
                >
                  No users found
                </div>
              ) : (
                filteredUsers.slice(0, 20).map((u) => (
                  <div
                    key={u.id}
                    className="dm-user-item"
                    onClick={() => startConversation(u.id)}
                  >
                    <div className="dm-user-avatar">
                      {initials(u.name, u.email)}
                    </div>
                    <div>
                      <div className="dm-user-name">{u.name ?? u.email}</div>
                      <div className="dm-user-email">{u.email}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="dm-root">
        {/* Sidebar */}
        <div className="dm-sidebar">
          <div className="dm-sidebar-header">
            <div>
              <div className="dm-sidebar-title">Messages</div>
              <div className="dm-sidebar-sub">
                {conversations.length} conversations
              </div>
            </div>
            <button
              className="dm-new-btn"
              onClick={openNewModal}
              title="New Message"
            >
              +
            </button>
          </div>

          <div className="dm-search">
            <input
              placeholder="Search conversations..."
              value={convSearch}
              onChange={(e) => setConvSearch(e.target.value)}
            />
          </div>

          <div className="dm-conv-list">
            {loading ? (
              [0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{ padding: "14px 16px", display: "flex", gap: 10 }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: "var(--surface2)",
                      animation: "pulse 1.5s ease infinite",
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        height: 12,
                        background: "var(--surface2)",
                        borderRadius: 4,
                        marginBottom: 6,
                        width: "60%",
                        animation: "pulse 1.5s ease infinite",
                      }}
                    />
                    <div
                      style={{
                        height: 10,
                        background: "var(--surface2)",
                        borderRadius: 4,
                        width: "80%",
                        animation: "pulse 1.5s ease infinite",
                      }}
                    />
                  </div>
                </div>
              ))
            ) : filteredConvs.length === 0 ? (
              <div
                style={{
                  padding: "24px 16px",
                  color: "var(--text-dim)",
                  fontSize: "13px",
                  textAlign: "center",
                }}
              >
                {convSearch
                  ? "No conversations match"
                  : "No messages yet — click + to start one"}
              </div>
            ) : (
              filteredConvs.map((conv) => {
                const online = conv.otherUser
                  ? isOnline(conv.otherUser.id)
                  : false;
                return (
                  <div
                    key={conv.id}
                    className={`dm-conv-item ${conversationId === conv.id ? "active" : ""}`}
                    onClick={() => navigate(`/messages/${conv.id}`)}
                  >
                    <div className="dm-conv-avatar-wrap">
                      <div className="dm-conv-avatar">
                        {initials(convName(conv))}
                      </div>
                      {online && <div className="dm-online-dot" />}
                    </div>
                    <div className="dm-conv-info">
                      <div className="dm-conv-name">{convName(conv)}</div>
                      <div className="dm-conv-preview">
                        {conv.lastMessage?.content ?? "No messages yet"}
                      </div>
                    </div>
                    <div className="dm-conv-meta">
                      {conv.lastMessage && (
                        <span className="dm-conv-time">
                          {timeAgo(conv.lastMessage.createdAt)}
                        </span>
                      )}
                      {conv.unreadCount > 0 && (
                        <span className="dm-unread-badge">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Chat Area */}
        {conversationId && currentConv ? (
          <div className={`dm-chat${conversationId ? " active" : ""}`}>
            <div className="dm-chat-header">
              <button
                className="dm-chat-back"
                onClick={() => navigate("/messages")}
              >
                ←
              </button>
              <div className="dm-chat-avatar">
                {initials(convName(currentConv))}
              </div>
              <div>
                <div className="dm-chat-name">{convName(currentConv)}</div>
                <div
                  className={`dm-chat-status${otherOnline ? "" : " offline"}`}
                >
                  {otherOnline ? "● Online" : "Offline"}
                </div>
              </div>
            </div>

            <div className="dm-messages">
              {messages.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--text-dim)",
                    fontSize: "13px",
                    marginTop: "40px",
                  }}
                >
                  No messages yet — say hello!
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`dm-message ${msg.sender.id === user?.id ? "sent" : "received"}`}
                  >
                    {msg.sender.id !== user?.id && (
                      <div className="dm-msg-sender">{msg.sender.name}</div>
                    )}
                    <div className="dm-msg-bubble">{msg.content}</div>
                    <div className="dm-msg-time">
                      {formatTime(msg.createdAt)}
                    </div>
                  </div>
                ))
              )}
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
                disabled={!newMessage.trim() || sending}
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
              Select a conversation or click <strong>+</strong> to start a new
              one
            </div>
          </div>
        )}
      </div>
    </>
  );
}
