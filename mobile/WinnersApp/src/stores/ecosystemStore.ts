import { create } from "zustand";
import type { MobilePlatformStatus } from "../navigation/types";

type PlatformKey = "community" | "academy" | "market" | "work" | "ai";

type EcosystemState = {
  platformStatus: Record<PlatformKey, MobilePlatformStatus>;
  unreadNotifications: number;
  pendingAiInsights: number;
  setPlatformStatus: (platform: PlatformKey, status: MobilePlatformStatus) => void;
  setUnreadNotifications: (count: number) => void;
  setPendingAiInsights: (count: number) => void;
  clearNotifications: () => void;
  consumeAiInsights: () => void;
};

export const useEcosystemStore = create<EcosystemState>((set) => ({
  platformStatus: {
    community: "live",
    academy: "live",
    market: "live",
    work: "live",
    ai: "live",
  },
  unreadNotifications: 3,
  pendingAiInsights: 2,
  setPlatformStatus: (platform, status) =>
    set((state) => ({
      platformStatus: {
        ...state.platformStatus,
        [platform]: status,
      },
    })),
  setUnreadNotifications: (count) => set({ unreadNotifications: Math.max(0, count) }),
  setPendingAiInsights: (count) => set({ pendingAiInsights: Math.max(0, count) }),
  clearNotifications: () => set({ unreadNotifications: 0 }),
  consumeAiInsights: () => set({ pendingAiInsights: 0 }),
}));
