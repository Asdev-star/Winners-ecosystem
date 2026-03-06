// src/features/community/studioStore.ts — Winners Community Studio Store
// Zustand store for Studio data with proper auth

import { create } from "zustand";

const API_URL = import.meta.env.VITE_API_URL ?? "";

// Authenticated fetch helper
async function authFetch(path: string, options: RequestInit = {}) {
  const token = useAuthStore.getState().token;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? `HTTP ${res.status}`);
  }
  return res.json();
}

// Import auth store - must be after authStore is defined
import { useAuthStore } from "../auth/authStore";

export interface LiveRoom {
  id: string;
  title: string;
  type: "space" | "video" | "broadcast";
  host: { id: string; name: string };
  participants: number;
  startedAt: string;
  status: string;
}

export interface ScheduledEvent {
  id: string;
  title: string;
  sessionType: string;
  scheduledAt: string;
  host: { id: string; name: string };
  rsvpCount: number;
}

export interface StudioState {
  liveRooms: LiveRoom[];
  scheduledEvents: ScheduledEvent[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchLiveData: () => Promise<void>;
  fetchScheduledEvents: () => Promise<void>;
  createRoom: (room: CreateRoomParams) => Promise<LiveRoom>;
}

interface CreateRoomParams {
  title: string;
  description?: string;
  roomType?: string;
  scheduledAt?: string;
  maxParticipants?: number;
  isPrivate?: boolean;
}

export const useStudioStore = create<StudioState>((set, get) => ({
  liveRooms: [],
  scheduledEvents: [],
  loading: false,
  error: null,

  fetchLiveData: async () => {
    set({ loading: true, error: null });
    try {
      // Fetch live video rooms
      const roomsData = await authFetch("/api/v1/studio/rooms/live");
      const liveVideoRooms = Array.isArray(roomsData) ? roomsData : [];
      
      // Fetch live spaces
      const spacesData = await authFetch("/api/v1/spaces?status=LIVE");
      const liveSpaces = Array.isArray(spacesData) ? spacesData : [];
      
      // Fetch live broadcasts
      const broadcastsData = await authFetch("/api/v1/studio/streams/live");
      const liveBroadcasts = Array.isArray(broadcastsData) ? broadcastsData : [];
      
      // Transform and combine all live sessions
      const allLive: LiveRoom[] = [
        ...liveVideoRooms.map((r: any) => ({
          id: r.id,
          title: r.title,
          type: "video" as const,
          host: r.host || { id: "", name: "Unknown" },
          participants: r._count?.participants || 0,
          startedAt: r.createdAt || new Date().toISOString(),
          status: r.status || "LIVE",
        })),
        ...liveSpaces.map((s: any) => ({
          id: s.id,
          title: s.title,
          type: "space" as const,
          host: s.host || { id: "", name: "Unknown" },
          participants: s.participantCount || 0,
          startedAt: s.startedAt || new Date().toISOString(),
          status: s.status || "LIVE",
        })),
        ...liveBroadcasts.map((b: any) => ({
          id: b.id,
          title: b.title,
          type: "broadcast" as const,
          host: b.host || { id: "", name: "Unknown" },
          participants: b.peakViewers || 0,
          startedAt: b.startedAt || new Date().toISOString(),
          status: b.status || "LIVE",
        })),
      ];
      
      set({ liveRooms: allLive, loading: false });
    } catch (err: any) {
      console.error("Error fetching live data:", err);
      set({ error: err.message, loading: false });
    }
  },

  fetchScheduledEvents: async () => {
    try {
      const data = await authFetch("/api/v1/studio/events/upcoming");
      const events: ScheduledEvent[] = Array.isArray(data) ? data : [];
      set({ scheduledEvents: events });
    } catch (err: any) {
      console.error("Error fetching events:", err);
    }
  },

  createRoom: async (roomParams: CreateRoomParams) => {
    const data = await authFetch("/api/v1/studio/rooms", {
      method: "POST",
      body: JSON.stringify(roomParams),
    });
    
    const newRoom: LiveRoom = {
      id: data.id,
      title: data.title,
      type: "video",
      host: data.host || { id: "", name: "You" },
      participants: 0,
      startedAt: new Date().toISOString(),
      status: "LIVE",
    };
    
    set({ liveRooms: [...get().liveRooms, newRoom] });
    return newRoom;
  },
}));
