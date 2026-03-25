// src/features/dashboard/dashboardStore.ts
// Fixed: graceful fallbacks per endpoint, correct API paths, stale caching,
// dedup guard, detailed error logging for debugging

import { create } from "zustand";
import { getAuthHeaders } from "../auth/authStore";
import { API_BASE } from "../../lib/api";
const STALE_MS = 60_000; // 60 seconds

export interface DashboardStats {
  totalRevenue:   number;
  revenueGrowth:  number;
  totalActivity:  number;
  activityGrowth: number;
  teamMembers:    number;
  topInsight:     string;
  trend:          "up" | "down" | "flat";
}

interface DashboardState {
  stats:      DashboardStats | null;
  isLoading:  boolean;
  error:      string | null;
  lastFetch:  number | null;
  fetchStats: () => Promise<void>;
  invalidate: () => void;
}

// Safe JSON fetch — returns null instead of throwing on non-ok or network error
async function safeFetch(url: string): Promise<any> {
  try {
    const res = await fetch(url, { headers: getAuthHeaders() });
    if (!res.ok) {
      console.warn(`[Dashboard] ${url} → ${res.status} ${res.statusText}`);
      return null;
    }
    return await res.json();
  } catch (err) {
    console.warn(`[Dashboard] ${url} → network error:`, err);
    return null;
  }
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  stats:     null,
  isLoading: false,
  error:     null,
  lastFetch: null,

  invalidate: () => set({ lastFetch: null }),

  fetchStats: async () => {
    // De-duplication guard
    if (get().isLoading) return;

    // Stale-cache: skip if fresh data exists
    const last = get().lastFetch;
    if (last && Date.now() - last < STALE_MS && get().stats) return;

    set({ isLoading: true, error: null });

    try {
      // Fire all 3 requests independently — one failing doesn't kill the others
      const [revenue, summary, members] = await Promise.all([
        safeFetch(`${API_BASE}/analytics/revenue?period=30d`),
        safeFetch(`${API_BASE}/analytics/summary`),
        safeFetch(`${API_BASE}/tenants/me/members`),
      ]);

      // Defensive extraction with full fallback chain
      const totalRevenue   = revenue?.summary?.totalRevenue   ?? revenue?.totalRevenue   ?? 0;
      const revenueGrowth  = revenue?.summary?.revenueGrowth  ?? revenue?.revenueGrowth  ?? 0;
      const totalActivity  = revenue?.summary?.totalActivity  ?? revenue?.totalActivity  ?? 0;
      const activityGrowth = revenue?.summary?.activityGrowth ?? revenue?.activityGrowth ?? 0;
      const teamMembers    = members?.total ?? (Array.isArray(members?.members) ? members.members.length : 0) ?? 1;
      const topInsight     = summary?.topInsight ?? "";
      const trend          = summary?.trend ?? (revenueGrowth > 2 ? "up" : revenueGrowth < -2 ? "down" : "flat");

      set({
        stats: { totalRevenue, revenueGrowth, totalActivity, activityGrowth, teamMembers, topInsight, trend },
        isLoading: false,
        error:     null,
        lastFetch: Date.now(),
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load dashboard data";
      console.error("[Dashboard] fetchStats error:", err);
      // Preserve stale stats — don't wipe the UI on refresh failure
      set({ isLoading: false, error: msg });
    }
  },
}));
