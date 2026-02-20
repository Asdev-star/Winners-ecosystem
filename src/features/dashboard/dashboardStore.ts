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

interface DashboardState {
  stats:     DashboardStats | null;
  isLoading: boolean;
  error:     string | null;
  fetchStats: () => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats:     null,
  isLoading: false,
  error:     null,

  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const [revenueRes, summaryRes, membersRes] = await Promise.all([
        fetch(`${API_BASE}/analytics/revenue?period=30d`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/analytics/summary`,            { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/tenants/me/members`,           { headers: getAuthHeaders() }),
      ]);

      const revenue = revenueRes.ok ? await revenueRes.json() : null;
      const summary = summaryRes.ok ? await summaryRes.json() : null;
      const members = membersRes.ok ? await membersRes.json() : null;

      set({
        stats: {
          totalRevenue:   revenue?.summary?.totalRevenue   ?? 0,
          revenueGrowth:  revenue?.summary?.revenueGrowth  ?? 0,
          totalActivity:  revenue?.summary?.totalActivity  ?? 0,
          activityGrowth: revenue?.summary?.activityGrowth ?? 0,
          teamMembers:    members?.total ?? 0,
          topInsight:     summary?.topInsight ?? "",
          trend:          summary?.trend ?? "flat",
        },
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
}));