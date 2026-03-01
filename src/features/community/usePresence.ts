// src/features/community/usePresence.ts
// Real-time presence hook for Community layer

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../auth/authStore";
import { API_BASE } from "../../lib/api";

interface OnlineUser {
  userId: string;
  userName: string;
  joinedAt: number;
}

export function usePresence() {
  const { user } = useAuthStore();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Fetch initial online users
  const fetchOnlineUsers = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/posts/online`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setOnlineUsers(data.onlineUsers || []);
      }
    } catch (err) {
      console.error("[presence] Failed to fetch online users:", err);
    }
  }, []);

  // Connect to WebSocket for real-time presence
  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    const wsUrl = `${window.location.protocol === "https:" ? "wss:" : "ws:"}//${window.location.host}/ws?token=${token}`;
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("[presence] WebSocket connected");
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "PRESENCE_UPDATE") {
          setOnlineUsers(data.onlineUsers || []);
        }
      } catch (err) {
        console.error("[presence] Failed to parse message:", err);
      }
    };

    socket.onclose = () => {
      console.log("[presence] WebSocket disconnected");
    };

    socket.onerror = (err) => {
      console.error("[presence] WebSocket error:", err);
    };

    setWs(socket);

    // Fetch initial online users
    fetchOnlineUsers();

    // Poll for presence every 30 seconds as fallback
    const interval = setInterval(fetchOnlineUsers, 30000);

    return () => {
      socket.close();
      clearInterval(interval);
    };
  }, [user, fetchOnlineUsers]);

  const isOnline = useCallback(
    (userId: string) => onlineUsers.some((u) => u.userId === userId),
    [onlineUsers]
  );

  return {
    onlineUsers,
    onlineCount: onlineUsers.length,
    isOnline,
    refresh: fetchOnlineUsers,
  };
}
