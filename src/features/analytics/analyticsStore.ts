// src/features/analytics/analyticsStore.ts

import { create } from "zustand";
import { getAuthHeaders } from "../auth/authStore";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

export type Period = "7d" | "30d" | "90d";

export interface DataPoint {
  date:     string;
  revenue:  number;
  activity: number;
}

export interface AnalyticsSummary {
  totalRevenue:   number;
  revenueGrowth:  number;
  totalActivity:  number;
  activityGrowth: number;
}

export interface ForecastPoint {
  date:            string;
  forecastRevenue: number;
  upperBound:      number;
  lowerBound:      number;
}

interface AnalyticsState {
  data:       DataPoint[];
  previous:   DataPoint[];
  summary:    AnalyticsSummary | null;
  forecast:   ForecastPoint[];
  period:     Period;
  isLoading:  boolean;
  error:      string | null;

  fetchRevenue:  (period?: Period) => Promise<void>;
  fetchForecast: (period?: Period) => Promise<void>;
  setPeriod:     (period: Period) => void;
}

export const useAnalyticsStore = create<AnalyticsState>((set, get) => ({
  data:      [],
  previous:  [],
  summary:   null,
  forecast:  [],
  period:    "30d",
  isLoading: false,
  error:     null,

  setPeriod: (period) => {
    set({ period });
    get().fetchRevenue(period);
    get().fetchForecast(period);
  },

  fetchRevenue: async (period) => {
    const p = period ?? get().period;
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/analytics/revenue?period=${p}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const json = await res.json();
      set({ data: json.data, previous: json.previous, summary: json.summary, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchForecast: async (period) => {
    const p = period ?? get().period;
    try {
      const res = await fetch(`${API_BASE}/analytics/forecast?period=${p}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) return;
      const json = await res.json();
      set({ forecast: json.forecast });
    } catch (err: any) {
      set({ error: err.message });
    }
  },
}));