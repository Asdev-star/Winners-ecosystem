// src/features/community/CommunityPage.tsx

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "../auth/authStore";
import { API_BASE } from "../../lib/api";

const API = API_BASE;
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .cm-root {
    display: flex; gap: 0; min-height: 100vh;
    background: var(--bg); font-family: 'Syne', sans-serif; padding-bottom: 80px;
  }

  .cm-feed { flex: 1; max-width: 680px; margin: 0 auto; padding: 28px 20px; }

  .cm-page-title {
    font-size: 22px; font-weight: 800; color: var(--text);
    margin-bottom: 20px; display: flex; align-items: center; gap: 10px;
  }
  .cm-page-badge {
    background: rgba(74,222,128,0.1); color: var(--green);
    font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.1em;
    text-transform: uppercase; padding: 3px 10px; border-radius: 20px;
    border: 1px solid rgba(74,222,128,0.2);
  }

  .cm-compose {
    background: linear-gradient(135deg, #0f1923 0%, #111D2E 100%);
    border: 1px solid rgba(137,196,225,0.12);
    border-radius: 16px; padding: 16px; margin-bottom: 20px;
    position: relative; overflow: hidden;
  }
  .cm-compose::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, #C9A84C, transparent);
  }
  .cm-compose-top { display: flex; gap: 12px; align-items: flex-start; }

  .cm-avatar {
    width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
    background: rgba(201,168,76,0.12); display: flex; align-items: center; justify-content: center;
    font-size: 13px; font-weight: 700; color: var(--gold); border: 1px solid rgba(201,168,76,0.2);
  }
  .cm-compose-input {
    flex: 1; background: rgba(137,196,225,0.04); border: 1px solid #1E3248; border-radius: 10px;
    padding: 10px 14px; color: #E8EEF5; font-family: 'Syne', sans-serif; font-size: 14px;
    resize: none; outline: none; min-height: 80px; transition: border-color 0.15s, box-shadow 0.15s; width: 100%;
  }
  .cm-compose-input:focus { border-color: rgba(201,168,76,0.5); box-shadow: 0 0 0 3px rgba(201,168,76,0.07); }
  .cm-compose-input::placeholder { color: #2E3D4F; }

  .cm-compose-footer {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 10px; padding-top: 10px; border-top: 1px solid #1E3248;
  }
  .cm-tag-input { background: transparent; border: none; outline: none; font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); width: 160px; }
  .cm-tag-input::placeholder { color: #2E3D4F; }

  .cm-media-btn {
    background: none; border: none; color: var(--text-dim); font-size: 16px; cursor: pointer;
    padding: 6px 10px; border-radius: 8px; transition: all 0.15s; display: flex; align-items: center; gap: 6px;
  }
  .cm-media-btn:hover { background: rgba(201,168,76,0.1); color: #C9A84C; }
  .cm-media-btn.recording { background: rgba(224,90,78,0.15); color: var(--red); animation: pulse-rec 1s infinite; }
  @keyframes pulse-rec { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

  .cm-voice-recording {
    display: flex; align-items: center; gap: 10px; padding: 10px 14px;
    background: rgba(224,90,78,0.08); border: 1px solid rgba(224,90,78,0.2);
    border-radius: 10px; margin-top: 10px;
  }
  .cm-voice-wave {
    display: flex; align-items: center; gap: 2px; height: 24px;
  }
  .cm-voice-bar {
    width: 3px; background: var(--red); border-radius: 2px; animation: voice-bar 0.5s ease infinite alternate;
  }
  @keyframes voice-bar { 0% { height: 6px; } 100% { height: 20px; } }
  .cm-voice-time { font-family: 'Space Mono', monospace; font-size: 12px; color: var(--red); }
  .cm-voice-cancel {
    margin-left: auto; background: none; border: none; color: #5A7A96; cursor: pointer; font-size: 12px;
  }

  .cm-post-btn {
    padding: 8px 20px; border-radius: 8px; background: #C9A84C; color: #0D1520;
    font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
    border: none; cursor: pointer; transition: all 0.15s;
  }
  .cm-post-btn:hover:not(:disabled) { background: #E8C97A; transform: translateY(-1px); }
  .cm-post-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }

  .cm-post {
    background: linear-gradient(135deg, #0f1923 0%, #0D1520 100%);
    border: 1px solid rgba(137,196,225,0.1);
    border-radius: 16px; margin-bottom: 16px; transition: border-color 0.2s; overflow: hidden;
  }
  .cm-post:hover { border-color: rgba(201,168,76,0.2); }

  .cm-post-header { display: flex; align-items: center; gap: 10px; padding: 14px 16px 0; }
  .cm-post-author { flex: 1; }
  .cm-post-name { font-size: 13px; font-weight: 700; color: #E8EEF5; }
  .cm-post-meta { font-family: 'Space Mono', monospace; font-size: 10px; color: #5A7A96; margin-top: 1px; }
  .cm-post-body { padding: 12px 16px; font-size: 14px; color: var(--text); line-height: 1.65; white-space: pre-wrap; }

  .cm-post-tags { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 16px 12px; }
  .cm-tag { font-family: 'Space Mono', monospace; font-size: 10px; color: #C9A84C; background: rgba(201,168,76,0.08); border: 1px solid rgba(201,168,76,0.15); border-radius: 20px; padding: 2px 10px; }

  .cm-post-actions { display: flex; align-items: center; gap: 4px; padding: 8px 12px; border-top: 1px solid rgba(137,196,225,0.08); }
  .cm-action-btn {
    display: flex; align-items: center; gap: 5px; padding: 6px 10px; border-radius: 8px;
    border: none; background: transparent; font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 600;
    color: #5A7A96; cursor: pointer; transition: all 0.15s;
  }
  .cm-action-btn:hover { background: rgba(137,196,225,0.06); color: #E8EEF5; }
  .cm-action-btn.liked { color: #f87171; }
  .cm-action-btn.liked:hover { background: rgba(248,113,113,0.08); }
  .cm-action-btn.delete:hover { color: #f87171; background: rgba(248,113,113,0.08); }

  .cm-comments { padding: 0 16px 14px; border-top: 1px solid rgba(137,196,225,0.08); }
  .cm-comment-list { padding-top: 12px; }
  .cm-comment { display: flex; gap: 8px; margin-bottom: 10px; }
  .cm-comment-avatar {
    width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
    background: rgba(137,196,225,0.08); display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700; color: var(--ice); border: 1px solid rgba(137,196,225,0.15);
  }
  .cm-comment-bubble { flex: 1; background: rgba(137,196,225,0.04); border: 1px solid #1E3248; border-radius: 10px; padding: 8px 12px; }
  .cm-comment-author { font-size: 11px; font-weight: 700; color: #E8EEF5; margin-bottom: 2px; }
  .cm-comment-text { font-size: 13px; color: var(--text-dim); line-height: 1.5; }

  .cm-comment-form { display: flex; gap: 8px; margin-top: 10px; align-items: center; }
  .cm-comment-input {
    flex: 1; background: rgba(137,196,225,0.04); border: 1px solid #1E3248; border-radius: 8px;
    padding: 8px 12px; color: #E8EEF5; font-family: 'Syne', sans-serif; font-size: 13px;
    outline: none; transition: border-color 0.15s;
  }
  .cm-comment-input:focus { border-color: rgba(201,168,76,0.5); }
  .cm-comment-input::placeholder { color: #2E3D4F; }
  .cm-comment-submit {
    padding: 8px 14px; border-radius: 8px; background: rgba(201,168,76,0.1);
    border: 1px solid rgba(201,168,76,0.2); color: #C9A84C;
    font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700;
    cursor: pointer; transition: all 0.15s; flex-shrink: 0;
  }
  .cm-comment-submit:hover:not(:disabled) { background: rgba(201,168,76,0.2); }
  .cm-comment-submit:disabled { opacity: 0.4; cursor: not-allowed; }

  .cm-sidebar { width: 280px; flex-shrink: 0; padding: 28px 16px 28px 0; }
  .cm-sidebar-card {
    background: linear-gradient(135deg, #0f1923 0%, #0D1520 100%);
    border: 1px solid rgba(137,196,225,0.1); border-radius: 16px; padding: 16px; margin-bottom: 16px;
  }
  .cm-sidebar-card.gold-border { border-color: rgba(201,168,76,0.2); }
  .cm-sidebar-title { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 0.15em; text-transform: uppercase; color: #C9A84C; margin-bottom: 14px; }

  .cm-member-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid rgba(137,196,225,0.07); }
  .cm-member-item:last-child { border-bottom: none; padding-bottom: 0; }
  .cm-member-avatar { width: 30px; height: 30px; border-radius: 50%; background: rgba(201,168,76,0.1); border: 1px solid rgba(201,168,76,0.15); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #C9A84C; flex-shrink: 0; }
  .cm-member-name { font-size: 12px; font-weight: 700; color: #E8EEF5; }
  .cm-member-role { font-family: 'Space Mono', monospace; font-size: 9px; color: #5A7A96; text-transform: uppercase; }
  .cm-member-dot { width: 6px; height: 6px; border-radius: 50%; background: #4ade80; margin-left: auto; flex-shrink: 0; box-shadow: 0 0 6px rgba(74,222,128,0.5); }

  .cm-stat-row { display: flex; justify-content: space-between; align-items: center; padding: 7px 0; border-bottom: 1px solid rgba(137,196,225,0.07); }
  .cm-stat-row:last-child { border-bottom: none; padding-bottom: 0; }
  .cm-stat-label { font-family: 'Space Mono', monospace; font-size: 10px; color: #5A7A96; }
  .cm-stat-val { font-size: 13px; font-weight: 800; color: #C9A84C; }

  .cm-pinned-badge { display: inline-flex; align-items: center; gap: 4px; font-family: 'Space Mono', monospace; font-size: 9px; color: #C9A84C; letter-spacing: 0.1em; text-transform: uppercase; margin-left: auto; }

  .cm-empty { text-align: center; padding: 48px 20px; font-family: 'Space Mono', monospace; font-size: 12px; color: #5A7A96; }
  .cm-empty-icon { font-size: 36px; margin-bottom: 12px; }

  .cm-skeleton { background: linear-gradient(135deg, #0f1923 0%, #0D1520 100%); border: 1px solid rgba(137,196,225,0.08); border-radius: 16px; padding: 18px; margin-bottom: 16px; }
  .cm-skel-line { height: 11px; border-radius: 6px; margin-bottom: 9px; background: linear-gradient(90deg, #1E3248 25%, rgba(137,196,225,0.05) 50%, #1E3248 75%); background-size: 200% 100%; animation: cm-shimmer 1.4s infinite; }
  @keyframes cm-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  .cm-load-more { width: 100%; padding: 11px; background: transparent; border: 1px solid #1E3248; border-radius: 10px; color: #5A7A96; font-family: 'Space Mono', monospace; font-size: 11px; cursor: pointer; transition: all 0.15s; margin-top: 8px; }
  .cm-load-more:hover { border-color: rgba(201,168,76,0.3); color: #C9A84C; }

  .cm-tip-text { font-size: 12px; color: #5A7A96; line-height: 1.6; font-family: 'Space Mono', monospace; }
  .cm-tip-text strong { color: #C9A84C; }

  @media (max-width: 900px) {
    .cm-sidebar { display: none; }
    .cm-feed { padding: 20px 14px; }
  }
`;

function timeAgo(date: string): string {
  const diff  = Date.now() - new Date(date).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function initials(name: string): string {
  return name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() ?? "?";
}

interface Post {
  id: string; content: string; authorId: string;
  author: { id: string; name: string; role: string };
  tags: { tag: { name: string } }[]; likes: { userId: string }[];
  comments: Comment[]; isPinned: boolean; createdAt: string;
  _count?: { likes: number; comments: number };
}
interface Comment { id: string; content: string; author: { name: string }; createdAt: string; }
interface Member  { id: string; name: string; role: string; }

export default function CommunityPage() {
  const token = useAuthStore((s) => s.token);
  const user  = useAuthStore((s) => s.user);

  const [posts, setPosts]     = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [content, setContent] = useState("");
  const [tags, setTags]       = useState("");
  const [page, setPage]       = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [openComments, setOpenComments]           = useState<Set<string>>(new Set());
  const [commentText, setCommentText]             = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<string | null>(null);
  const [onlineCount, setOnlineCount]             = useState(0);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  const fetchPosts = useCallback(async (p = 1, append = false) => {
    setLoading(p === 1);
    try {
      const res  = await fetch(`${API}/posts?page=${p}&limit=10`, { headers });
      const data = await res.json();
      const list = data.posts ?? [];
      setPosts((prev) => append ? [...prev, ...list] : list);
      setHasMore(data.hasMore ?? false);
    } catch { setPosts([]); }
    finally  { setLoading(false); }
  }, [token]);

  const fetchMembers = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/tenants/me/members`, { headers });
      const data = await res.json();
      const list = Array.isArray(data?.members) ? data.members : [];
      setMembers(list);
    } catch {}
  }, [token]);

  useEffect(() => { fetchPosts(1); fetchMembers(); }, [fetchPosts, fetchMembers]);

  useEffect(() => {
    if (!token || !API) return;

    let ws: WebSocket | null = null;
    try {
      const apiUrl = new URL(API);
      const protocol = apiUrl.protocol === "https:" ? "wss:" : "ws:";
      const wsUrl = `${protocol}//${apiUrl.host}/ws?token=${encodeURIComponent(token)}`;
      ws = new WebSocket(wsUrl);

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload?.type === "PRESENCE_UPDATE" && typeof payload.onlineCount === "number") {
            setOnlineCount(payload.onlineCount);
          }
          if (payload?.type === "NEW_POST" || payload?.type === "NEW_COMMENT" || payload?.type === "NEW_LIKE") {
            fetchPosts(1);
          }
        } catch {
          // Ignore malformed socket payloads
        }
      };
    } catch {
      // Ignore websocket bootstrap failures
    }

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) ws.close();
    };
  }, [token, fetchPosts]);

  const handlePost = async () => {
    if (!content.trim() && !voiceBlob) return;
    setPosting(true);
    try {
      // Handle voice post upload
      if (voiceBlob) {
        // Convert blob to base64
        const voiceData = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(voiceBlob);
          reader.onloadend = () => resolve(reader.result as string);
        });

        const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
        const res = await fetch(`${API}/posts/voice`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: content.trim() || "🎤 Voice post",
            voiceData,
            tags: JSON.stringify(tagList),
          })
        });
        if (res.ok) {
          setContent("");
          setTags("");
          setVoiceBlob(null);
          setRecordingTime(0);
          await fetchPosts(1);
        }
      } else {
        // Regular text post
        const tagList = tags.split(",").map((t) => t.trim()).filter(Boolean);
        const res = await fetch(`${API}/posts`, { method: "POST", headers, body: JSON.stringify({ content: content.trim(), tags: tagList }) });
        if (res.ok) { setContent(""); setTags(""); await fetchPosts(1); }
      }
    } finally { setPosting(false); }
  };

  // Voice recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      mediaRecorder.onstop = () => { setVoiceBlob(new Blob(chunks, { type: "audio/webm" })); stream.getTracks().forEach(t => t.stop()); };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to start recording:", err);
      alert("Could not access microphone. Please grant permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setVoiceBlob(null);
    setRecordingTime(0);
  };

  const handleLike = async (postId: string) => {
    const res = await fetch(`${API}/posts/${postId}/like`, { method: "POST", headers });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) return;

    setPosts((prev) => prev.map((p) => {
      if (p.id !== postId) return p;
      const currentLikes = Array.isArray(p.likes) ? p.likes : [];
      const hasMyLike = currentLikes.some((l) => l.userId === user?.id);

      if (data.liked === true && !hasMyLike) {
        return { ...p, likes: [...currentLikes, { userId: user?.id ?? "" }] };
      }
      if (data.liked === false && hasMyLike) {
        return { ...p, likes: currentLikes.filter((l) => l.userId !== user?.id) };
      }
      return p;
    }));
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    await fetch(`${API}/posts/${postId}`, { method: "DELETE", headers });
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const toggleComments = (postId: string) => {
    setOpenComments((prev) => { const next = new Set(prev); next.has(postId) ? next.delete(postId) : next.add(postId); return next; });
  };

  const handleComment = async (postId: string) => {
    const text = commentText[postId]?.trim();
    if (!text) return;
    setSubmittingComment(postId);
    try {
      const res = await fetch(`${API}/posts/${postId}/comments`, { method: "POST", headers, body: JSON.stringify({ content: text }) });
      if (res.ok) {
        const newComment = await res.json();
        setCommentText((prev) => ({ ...prev, [postId]: "" }));
        setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments: [...(p.comments ?? []), newComment] } : p));
      }
    } finally { setSubmittingComment(null); }
  };

  const loadMore = () => { const next = page + 1; setPage(next); fetchPosts(next, true); };

  const totalLikes    = posts.reduce((s, p) => s + (p.likes?.length ?? 0), 0);
  const totalComments = posts.reduce((s, p) => s + (p.comments?.length ?? 0), 0);

  return (
    <>
      <style>{css}</style>
      <div className="cm-root">

        <div className="cm-feed">
          <div className="cm-page-title">
            🧑‍🤝‍🧑 Community
            <span className="cm-page-badge">● Live</span>
          </div>

          <div className="cm-compose">
            <div className="cm-compose-top">
              <div className="cm-avatar">{initials(user?.name ?? "")}</div>
              <textarea
                className="cm-compose-input"
                placeholder="Share something with the Winners community..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && e.metaKey) handlePost(); }}
              />
            </div>
            <div className="cm-compose-footer">
              {/* Voice Recording UI */}
              {isRecording || voiceBlob ? (
                <div className="cm-voice-recording">
                  <div className="cm-voice-status">
                    {isRecording && <span className="cm-recording-indicator">● Recording</span>}
                    {voiceBlob && !isRecording && <span className="cm-voice-preview">🎤 Voice recorded ({Math.round(voiceBlob.size / 1024)}KB)</span>}
                    {isRecording && <span className="cm-recording-time">{Math.floor(recordingTime / 60)}:{String(recordingTime % 60).padStart(2, "0")}</span>}
                  </div>
                  <div className="cm-voice-actions">
                    {isRecording ? (
                      <button type="button" className="cm-stop-btn" onClick={stopRecording}>⏹ Stop</button>
                    ) : voiceBlob ? (
                      <>
                        <button type="button" className="cm-cancel-btn" onClick={cancelRecording}>✕ Discard</button>
                        <button type="button" className="cm-play-btn" onClick={() => {
                          const audio = new Audio(URL.createObjectURL(voiceBlob));
                          audio.play();
                        }}>▶ Play</button>
                      </>
                    ) : null}
                  </div>
                </div>
              ) : (
                <>
                  <button type="button" className="cm-mic-btn" onClick={startRecording} title="Record a voice post">
                    🎤 Voice
                  </button>
                  <input className="cm-tag-input" placeholder="# tags, comma separated" value={tags} onChange={(e) => setTags(e.target.value)} />
                </>
              )}
              <button className="cm-post-btn" disabled={(!content.trim() && !voiceBlob) || posting} onClick={handlePost}>
                {posting ? "Posting…" : voiceBlob ? "Post Voice →" : "Post →"}
              </button>
            </div>
          </div>

          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="cm-skeleton">
                <div className="cm-skel-line" style={{ width: "40%", marginBottom: 14 }} />
                <div className="cm-skel-line" style={{ width: "100%" }} />
                <div className="cm-skel-line" style={{ width: "75%" }} />
                <div className="cm-skel-line" style={{ width: "50%" }} />
              </div>
            ))
          ) : posts.length === 0 ? (
            <div className="cm-empty">
              <div className="cm-empty-icon">✦</div>
              No posts yet. Be the first to share something.
            </div>
          ) : (
            <>
              {posts.map((post) => {
                const liked        = post.likes?.some((l) => l.userId === user?.id);
                const likeCount    = post.likes?.length ?? 0;
                const commentCount = post.comments?.length ?? 0;
                const isOwn        = post.author?.id === user?.id || post.authorId === user?.id;
                const commentsOpen = openComments.has(post.id);

                return (
                  <div key={post.id} className="cm-post">
                    <div className="cm-post-header">
                      <div className="cm-avatar" style={{ width: 36, height: 36, fontSize: 12 }}>{initials(post.author?.name ?? "?")}</div>
                      <div className="cm-post-author">
                        <div className="cm-post-name">{post.author?.name ?? "Unknown"}</div>
                        <div className="cm-post-meta">{post.author?.role?.toLowerCase()} · {timeAgo(post.createdAt)}</div>
                      </div>
                      {post.isPinned && <span className="cm-pinned-badge">📌 Pinned</span>}
                    </div>

                    <div className="cm-post-body">{post.content}</div>

                    {post.tags?.length > 0 && (
                      <div className="cm-post-tags">
                        {post.tags.map((t, i) => <span key={i} className="cm-tag">#{t.tag?.name ?? t}</span>)}
                      </div>
                    )}

                    <div className="cm-post-actions">
                      <button className={`cm-action-btn${liked ? " liked" : ""}`} onClick={() => handleLike(post.id)}>
                        {liked ? "❤️" : "🤍"} {likeCount > 0 && likeCount}
                      </button>
                      <button className="cm-action-btn" onClick={() => toggleComments(post.id)}>
                        💬 {commentCount > 0 && commentCount} {commentsOpen ? "Hide" : "Comment"}
                      </button>
                      {isOwn && (
                        <button className="cm-action-btn delete" onClick={() => handleDelete(post.id)} style={{ marginLeft: "auto" }}>🗑</button>
                      )}
                    </div>

                    {commentsOpen && (
                      <div className="cm-comments">
                        <div className="cm-comment-list">
                          {post.comments?.map((c) => (
                            <div key={c.id} className="cm-comment">
                              <div className="cm-comment-avatar">{initials(c.author?.name ?? "?")}</div>
                              <div className="cm-comment-bubble">
                                <div className="cm-comment-author">{c.author?.name}</div>
                                <div className="cm-comment-text">{c.content}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="cm-comment-form">
                          <div className="cm-avatar" style={{ width: 28, height: 28, fontSize: 10 }}>{initials(user?.name ?? "")}</div>
                          <input
                            className="cm-comment-input" placeholder="Write a comment…"
                            value={commentText[post.id] ?? ""}
                            onChange={(e) => setCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Enter") handleComment(post.id); }}
                          />
                          <button
                            className="cm-comment-submit"
                            disabled={submittingComment === post.id || !commentText[post.id]?.trim()}
                            onClick={() => handleComment(post.id)}
                          >
                            {submittingComment === post.id ? "…" : "→"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {hasMore && <button className="cm-load-more" onClick={loadMore}>Load more posts →</button>}
            </>
          )}
        </div>

        <div className="cm-sidebar">
          <div className="cm-sidebar-card">
            <div className="cm-sidebar-title">Community Stats</div>
            {[
              { label: "Posts",       val: posts.length   },
              { label: "Total Likes", val: totalLikes     },
              { label: "Comments",    val: totalComments  },
              { label: "Members",     val: members.length },
              { label: "Online Now",  val: onlineCount    },
            ].map((s) => (
              <div className="cm-stat-row" key={s.label}>
                <span className="cm-stat-label">{s.label}</span>
                <span className="cm-stat-val">{s.val}</span>
              </div>
            ))}
          </div>

          <div className="cm-sidebar-card">
            <div className="cm-sidebar-title">Active Members</div>
            {members.slice(0, 6).map((m) => (
              <div key={m.id} className="cm-member-item">
                <div className="cm-member-avatar">{initials(m.name)}</div>
                <div>
                  <div className="cm-member-name">{m.name}</div>
                  <div className="cm-member-role">{m.role?.toLowerCase()}</div>
                </div>
                <div className="cm-member-dot" />
              </div>
            ))}
            {members.length === 0 && (
              <div style={{ fontSize: 11, color: "var(--text-dim)", fontFamily: "Space Mono, monospace" }}>No members yet</div>
            )}
          </div>

          <div className="cm-sidebar-card gold-border">
            <div className="cm-sidebar-title">✦ Tip</div>
            <div className="cm-tip-text">
              Press <strong>⌘ + Enter</strong> to post quickly. Use tags to help others find your posts.
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
