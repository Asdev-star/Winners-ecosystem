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
      set({
        notifications: data.notifications,
        unreadCount:   data.notifications.filter((n: Notification) => !n.read).length,
        isLoading:     false,
      });
    } catch {
      // Mock fallback
      const mock: Notification[] = [
        { id: "n1", type: "anomaly",  title: "Revenue spike detected",       body: "Revenue on Feb 15 was 45% above average — $7,230 vs $4,980 mean.",    read: false, createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),   link: "/analytics" },
        { id: "n2", type: "team",     title: "New member joined",             body: "Alice Smith joined your workspace as Admin.",                          read: false, createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),  link: "/team"      },
        { id: "n3", type: "billing",  title: "Pro plan active",               body: "Your Pro subscription is active. Next billing date: March 19, 2026.",  read: false, createdAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),  link: "/billing"   },
        { id: "n4", type: "revenue",  title: "Monthly goal reached",          body: "You've hit $120,000 in revenue this month — 8.4% above last month.",   read: true,  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), link: "/analytics" },
        { id: "n5", type: "system",   title: "Export completed",              body: "Your XLSX report for the last 30 days is ready to download.",          read: true,  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), link: "/export"    },
        { id: "n6", type: "anomaly",  title: "Activity dip detected",         body: "Pageviews dropped 22% on Wednesday — worth investigating.",            read: true,  createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), link: "/analytics" },
      ];
      set({ notifications: mock, unreadCount: mock.filter((n) => !n.read).length, isLoading: false });
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
