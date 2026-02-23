// src/features/dashboard/dashboardStore.ts

import { create } from "zustand";
import { getAuthHeaders } from "../auth/authStore";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export interface DashboardStats {
  totalRevenue:   number;
  revenueGrowth:  number;
  totalActivity:  number;
  activityGrowth: number;
  teamMembers:    number;
  topInsight:     string;
  trend:          "up" | "down" | "flat";
}

// Extended stats returned per-endpoint — normalized into DashboardStats above
interface RevenueResponse  { summary?: { totalRevenue?: number; revenueGrowth?: number; totalActivity?: number; activityGrowth?: number } }
interface SummaryResponse  { topInsight?: string; trend?: "up" | "down" | "flat" }
interface MembersResponse  { total?: number; members?: unknown[] }

interface DashboardState {
  stats:     DashboardStats | null;
  isLoading: boolean;
  error:     string | null;
  lastFetch: number | null;
  fetchStats:  () => Promise<void>;
  invalidate:  () => void;
}

const STALE_MS = 60_000; // re-fetch if data is older than 60s

export const useDashboardStore = create<DashboardState>((set, get) => ({
  stats:     null,
  isLoading: false,
  error:     null,
  lastFetch: null,

  // ── Invalidate (e.g. after plan upgrade or team change) ──────────────────
  invalidate: () => set({ lastFetch: null }),

  fetchStats: async () => {
    // Skip if data is still fresh
    const { lastFetch, isLoading } = get();
    if (isLoading) return;
    if (lastFetch && Date.now() - lastFetch < STALE_MS) return;

    set({ isLoading: true, error: null });

    try {
      const [revenueRes, summaryRes, membersRes] = await Promise.all([
        fetch(`${API_BASE}/analytics/revenue?period=30d`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/analytics/summary`,            { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/tenants/me/members`,           { headers: getAuthHeaders() }),
      ]);

      const revenue: RevenueResponse = revenueRes.ok ? await revenueRes.json() : {};
      const summary: SummaryResponse = summaryRes.ok ? await summaryRes.json() : {};
      const members: MembersResponse = membersRes.ok ? await membersRes.json() : {};

      // members.total may not exist on all backends — fall back to array length
      const memberCount = members?.total ?? (Array.isArray(members?.members) ? members.members.length : 0);

      set({
        stats: {
          totalRevenue:   revenue?.summary?.totalRevenue   ?? 0,
          revenueGrowth:  revenue?.summary?.revenueGrowth  ?? 0,
          totalActivity:  revenue?.summary?.totalActivity  ?? 0,
          activityGrowth: revenue?.summary?.activityGrowth ?? 0,
          teamMembers:    memberCount,
          topInsight:     summary?.topInsight ?? "",
          trend:          summary?.trend      ?? "flat",
        },
        isLoading: false,
        error:     null,
        lastFetch: Date.now(),
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load dashboard";
      // Keep stale data visible — just surface the error
      set({ isLoading: false, error: message });
    }
  },
}));