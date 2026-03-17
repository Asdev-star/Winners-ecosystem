// src/features/notifications/notificationStore.ts

import { create } from "zustand";
import { getAuthHeaders } from "../auth/authStore";

import { API_BASE } from "../../lib/api";

export type NotificationType = "anomaly" | "team" | "billing" | "system" | "revenue";

export interface Notification {
  id:        string;
  type:      NotificationType;
  title:     string;
  body:      string;
  read:      boolean;
  createdAt: string;
  link?:     string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount:   number;
  isLoading:     boolean;

  fetchNotifications: () => Promise<void>;
  markAsRead:         (id: string) => Promise<void>;
  markAllAsRead:      () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll:           () => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount:   0,
  isLoading:     false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE}/notifications`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      const notifs = data.notifications ?? [];
      set({
        notifications: notifs,
        unreadCount:   notifs.filter((n: Notification) => !n.read).length,
        isLoading:     false,
      });
    } catch {
      set({ notifications: [], unreadCount: 0, isLoading: false });
    }
  },

  markAsRead: async (id) => {
    set((s) => ({
      notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
      unreadCount:   Math.max(0, s.unreadCount - (s.notifications.find((n) => n.id === id)?.read ? 0 : 1)),
    }));
    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, { method: "PATCH", headers: getAuthHeaders() });
    } catch { /* optimistic update already applied */ }
  },

  markAllAsRead: async () => {
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })), unreadCount: 0 }));
    try {
      await fetch(`${API_BASE}/notifications/read-all`, { method: "PATCH", headers: getAuthHeaders() });
    } catch { /* optimistic */ }
  },

  deleteNotification: async (id) => {
    set((s) => {
      const n = s.notifications.find((n) => n.id === id);
      return {
        notifications: s.notifications.filter((n) => n.id !== id),
        unreadCount:   Math.max(0, s.unreadCount - (n?.read ? 0 : 1)),
      };
    });
    try {
      await fetch(`${API_BASE}/notifications/${id}`, { method: "DELETE", headers: getAuthHeaders() });
    } catch { /* optimistic */ }
  },

  clearAll: async () => {
    set({ notifications: [], unreadCount: 0 });
    try {
      await fetch(`${API_BASE}/notifications`, { method: "DELETE", headers: getAuthHeaders() });
    } catch { /* optimistic */ }
  },
}));
