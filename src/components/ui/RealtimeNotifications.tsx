import { useEffect, useRef } from "react";
import { toast, type Renderable } from "react-hot-toast";
import { useAuthStore } from "../../features/auth/authStore";
import { useNotificationStore, type Notification } from "../../features/notifications/notificationStore";
import { getAuthHeaders } from "../../features/auth/authStore";
import { API_BASE } from "../../lib/api";
import { closeOpenSocket, createAuthenticatedSocketUrl } from "../../lib/regulation";
import {
  Sparkles,
  MessageSquare,
  Heart,
  UserPlus,
  ShieldAlert,
  Info,
  CheckCircle2,
  Terminal,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type RealtimeEvent = {
  type: string;
  message: string;
  icon: Renderable;
  duration?: number;
  path?: string;
  key: string;
  priority: "critical" | "normal";
};

const OCCASIONAL_TOAST_INTERVAL_MS = 30_000;
const OCCASIONAL_DRAIN_INTERVAL_MS = 16_000;
const MAX_BUFFERED_EVENTS = 6;

export default function RealtimeNotifications() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);
  const navigate = useNavigate();
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const drainTimerRef = useRef<number | null>(null);
  const lastToastAtRef = useRef(0);
  const queuedEventsRef = useRef<RealtimeEvent[]>([]);

  useEffect(() => {
    if (!token) return;

    const socketUrl = createAuthenticatedSocketUrl(token);
    let isOpen = false;
    let shouldClose = false;

    const showToast = (event: RealtimeEvent) => {
      lastToastAtRef.current = Date.now();
      if (event.path) {
        toast.custom(
          (t) => (
            <button
              type="button"
              onClick={async () => {
                toast.dismiss(t.id);
                if (event.key.startsWith("NEW_POST:") || event.key.startsWith("NEW_LIKE:") || event.key.startsWith("NEW_COMMENT:") || event.key.startsWith("NEW_FOLLOW:")) {
                  const match = event.key.match(/:(.+)$/);
                  if (match) {
                    try {
                      await fetch(`${API_BASE}/notifications`, { headers: getAuthHeaders() });
                      const res = await fetch(`${API_BASE}/notifications`, { headers: getAuthHeaders() });
                      const data = await res.json();
                      const notifs = data.notifications ?? [];
                      const matched = notifs.find((n: Notification) => n.title?.includes(match[1]) || n.body?.includes(match[1]));
                      if (matched?.id) {
                        await fetch(`${API_BASE}/notifications/${matched.id}/read`, { method: "PATCH", headers: getAuthHeaders() });
                      }
                    } catch {}
                  }
                }
                navigate(event.path as string);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                maxWidth: 420,
                padding: "12px 14px",
                borderRadius: 16,
                border: "1px solid rgba(255,255,255,.12)",
                background: "rgba(10,16,24,.96)",
                color: "var(--text)",
                boxShadow: "0 18px 50px rgba(0,0,0,.32)",
                cursor: "pointer",
              }}
            >
              <span>{event.icon}</span>
              <span style={{ textAlign: "left", lineHeight: 1.35 }}>{event.message}</span>
            </button>
          ),
          { duration: event.duration ?? 4500 },
        );
        return;
      }

      toast(event.message, {
        icon: event.icon,
        duration: event.duration ?? 4500,
      });
    };

    const enqueueOccasionalEvent = (event: RealtimeEvent) => {
      queuedEventsRef.current = queuedEventsRef.current.filter(
        (queued) => queued.key !== event.key,
      );
      queuedEventsRef.current.push(event);
      if (queuedEventsRef.current.length > MAX_BUFFERED_EVENTS) {
        queuedEventsRef.current.shift();
      }
    };

    const emitIfReady = (event: RealtimeEvent) => {
      const enoughTimePassed =
        Date.now() - lastToastAtRef.current >= OCCASIONAL_TOAST_INTERVAL_MS;

      if (event.priority === "critical" || enoughTimePassed) {
        showToast(event);
        return;
      }

      enqueueOccasionalEvent(event);
    };

    const scheduleReconnect = () => {
      reconnectTimerRef.current = window.setTimeout(connect, 5000);
    };

    const normalizeEvent = (data: any): RealtimeEvent | null => {
      const type = data.type || data.event;

      switch (type) {
        case "NEW_POST":
          if (data.post?.author?.id === user?.id) return null;
          return {
            type,
            message: `New post from ${data.post?.author?.name || "a user"}`,
            icon: <MessageSquare className="w-4 h-4 text-blue-500" />,
            path: "/community/feed",
            key: `NEW_POST:${data.post?.id ?? data.post?.author?.id ?? "latest"}`,
            priority: "normal",
          };

        case "NEW_LIKE":
          return {
            type,
            message: `${data.userName || "Someone"} liked your post`,
            icon: <Heart className="w-4 h-4 text-red-500" />,
            key: `NEW_LIKE:${data.postId ?? data.userId ?? data.userName ?? "latest"}`,
            priority: "normal",
          };

        case "NEW_COMMENT":
          return {
            type,
            message: `${data.userName || "Someone"} commented on your post`,
            icon: <MessageSquare className="w-4 h-4 text-green-500" />,
            key: `NEW_COMMENT:${data.commentId ?? data.postId ?? data.userName ?? "latest"}`,
            priority: "normal",
          };

        case "NEW_FOLLOW":
          return {
            type,
            message: `${data.userName || "Someone"} followed you`,
            icon: <UserPlus className="w-4 h-4 text-purple-500" />,
            path: "/community",
            key: `NEW_FOLLOW:${data.userId ?? data.userName ?? "latest"}`,
            priority: "normal",
          };

        case "SYSTEM":
          return {
            type,
            message: data.message || "System update",
            icon: <Info className="w-4 h-4 text-blue-400" />,
            key: `SYSTEM:${data.message ?? "update"}`,
            priority: "normal",
          };

        case "ADMIN_EVENT":
          return {
            type,
            message: data.message || "Admin alert",
            icon: <ShieldAlert className="w-4 h-4 text-red-600" />,
            duration: 8000,
            key: `ADMIN_EVENT:${data.id ?? data.message ?? "alert"}`,
            priority: "critical",
          };

        case "OMEGA_RECOMMENDATION":
          return {
            type,
            message: data.message || "New OMEGA recommendation available",
            icon: <Sparkles className="w-4 h-4 text-yellow-500" />,
            duration: 6000,
            path: "/intelligence",
            key: `OMEGA_RECOMMENDATION:${data.id ?? data.message ?? "recommendation"}`,
            priority: "normal",
          };

        case "PAYMENT_RELEASED":
          return {
            type,
            message: data.message || "A payout or release was completed.",
            icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />,
            path: "/work/escrow",
            key: `PAYMENT_RELEASED:${data.id ?? data.escrowId ?? "latest"}`,
            priority: "critical",
          };

        case "DEPLOYMENT_EVENT":
          return {
            type,
            message: data.message || "A platform deployment just finished.",
            icon: <Terminal className="w-4 h-4 text-cyan-400" />,
            path: "/cloud",
            key: `DEPLOYMENT_EVENT:${data.id ?? data.message ?? "deploy"}`,
            priority: "normal",
          };

        case "nova:signal":
        case "CONNECTED":
          return null;

        default:
          return null;
      }
    };

    const connect = () => {
      const socket = new WebSocket(socketUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        isOpen = true;
        if (shouldClose) {
          socket.close();
        }
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const normalizedEvent = normalizeEvent(data);

          if (normalizedEvent) {
            // Significant interaction event received
            fetchNotifications();
            emitIfReady(normalizedEvent);
          }
        } catch (err) {
          console.error("WS Message Error:", err);
        }
      };

      socket.onclose = () => {
        scheduleReconnect();
      };

      socket.onerror = () => {
        // Allow the socket to fail silently; reconnects are driven by onclose.
      };
    };

    drainTimerRef.current = window.setInterval(() => {
      const nextEvent = queuedEventsRef.current.shift();
      if (!nextEvent) return;

      const enoughTimePassed =
        Date.now() - lastToastAtRef.current >= OCCASIONAL_TOAST_INTERVAL_MS;

      if (!enoughTimePassed) {
        queuedEventsRef.current.unshift(nextEvent);
        return;
      }

      showToast(nextEvent);
    }, OCCASIONAL_DRAIN_INTERVAL_MS);

    connect();

    return () => {
      shouldClose = true;
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      if (drainTimerRef.current) {
        window.clearInterval(drainTimerRef.current);
      }
      queuedEventsRef.current = [];
      if (socketRef.current) {
        socketRef.current.onclose = null;
        if (isOpen) {
          closeOpenSocket(socketRef.current);
        }
      }
    };
  }, [token, user?.id, navigate]);

  return null;
}
