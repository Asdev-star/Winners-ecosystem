import { create } from "zustand";

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  accent: "gold" | "green" | "ice" | "blue" | "red" | "purple";
  target:
    | { type: "community-post"; postId: string }
    | { type: "academy-course"; slug: string }
    | { type: "market-product"; productId: string }
    | { type: "work-job"; jobId: string }
    | { type: "ai" };
};

export type MessageThread = {
  id: string;
  name: string;
  role: string;
  preview: string;
  updatedAt: string;
  unreadCount: number;
  accent: "blue" | "gold" | "green" | "ice" | "purple";
};

type PreferenceKey = "pushNotifications" | "emailAlerts" | "reducedMotion" | "largeText";

type AppShellState = {
  notifications: AppNotification[];
  threads: MessageThread[];
  preferences: Record<PreferenceKey, boolean>;
  cacheSizeMb: number;
  addNotification: (notification: AppNotification) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  togglePreference: (key: PreferenceKey) => void;
  clearCache: () => void;
  markThreadRead: (id: string) => void;
};

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-community-post",
    title: "NOVA flagged a fast-moving discussion",
    body: "Your community post about founder systems picked up 18 new reactions.",
    timestamp: "Today · 2:30 PM",
    read: false,
    accent: "green",
    target: { type: "community-post", postId: "post-founder-systems" },
  },
  {
    id: "notif-academy-course",
    title: "SAGE recommends your next lesson",
    body: "Resume Building your brand identity to keep certificate progress moving.",
    timestamp: "Today · 11:10 AM",
    read: false,
    accent: "ice",
    target: { type: "academy-course", slug: "building-your-brand-identity" },
  },
  {
    id: "notif-work-job",
    title: "CIRCUIT found a higher-fit role",
    body: "A new mobile analytics contract now ranks above your saved community role.",
    timestamp: "Yesterday · 6:42 PM",
    read: false,
    accent: "blue",
    target: { type: "work-job", jobId: "job-react-native-growth-dashboard" },
  },
  {
    id: "notif-market-product",
    title: "ATLAS spotted product momentum",
    body: "A recommended product category you follow is trending again.",
    timestamp: "Yesterday · 9:05 AM",
    read: true,
    accent: "gold",
    target: { type: "market-product", productId: "prod-wireless-mic-kit" },
  },
];

const INITIAL_THREADS: MessageThread[] = [
  {
    id: "thread-techbridge",
    name: "TechBridge Africa",
    role: "Client",
    preview: "Can we review the dashboard milestone before tomorrow's check-in?",
    updatedAt: "18 min ago",
    unreadCount: 2,
    accent: "blue",
  },
  {
    id: "thread-sage",
    name: "SAGE",
    role: "Academy Assistant",
    preview: "I summarized your remaining lessons and certificate path.",
    updatedAt: "1 hour ago",
    unreadCount: 0,
    accent: "ice",
  },
  {
    id: "thread-atlas",
    name: "ATLAS",
    role: "Market Assistant",
    preview: "Your saved vendor list now includes two stronger margin options.",
    updatedAt: "Yesterday",
    unreadCount: 1,
    accent: "gold",
  },
];

export const useAppShellStore = create<AppShellState>((set) => ({
  notifications: INITIAL_NOTIFICATIONS,
  threads: INITIAL_THREADS,
  preferences: {
    pushNotifications: true,
    emailAlerts: true,
    reducedMotion: false,
    largeText: false,
  },
  cacheSizeMb: 148,

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 30),
    })),

  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === id
          ? {
              ...notification,
              read: true,
            }
          : notification,
      ),
    })),

  markAllNotificationsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((notification) => ({
        ...notification,
        read: true,
      })),
    })),

  togglePreference: (key) =>
    set((state) => ({
      preferences: {
        ...state.preferences,
        [key]: !state.preferences[key],
      },
    })),

  clearCache: () => set({ cacheSizeMb: 0 }),

  markThreadRead: (id) =>
    set((state) => ({
      threads: state.threads.map((thread) =>
        thread.id === id
          ? {
              ...thread,
              unreadCount: 0,
            }
          : thread,
      ),
    })),
}));
