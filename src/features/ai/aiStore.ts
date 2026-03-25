// src/features/ai/aiStore.ts

import { create } from "zustand";
import { getAuthHeaders } from "../auth/authStore";
import { API_BASE } from "../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type RecommendationType =
  | "revenue_trend"
  | "anomaly"
  | "growth_opportunity"
  | "team_performance"
  | "churn_risk"
  | "action_item";

export interface Recommendation {
  id:       string;
  type:     RecommendationType;
  title:    string;
  body:     string;
  priority: "high" | "medium" | "low";
  metric?:  string;
  delta?:   string;
}

export interface AIInsight {
  summary:         string;
  recommendations: Recommendation[];
  generatedAt:     string;
}

interface AIState {
  insight:    AIInsight | null;
  isLoading:  boolean;
  isStreaming: boolean;
  streamText:  string;
  error:       string | null;

  fetchInsights:  (period?: string) => Promise<void>;
  streamInsights: (period?: string) => Promise<void>;
  clearInsights:  () => void;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAIStore = create<AIState>((set) => ({
  insight:     null,
  isLoading:   false,
  isStreaming:  false,
  streamText:   "",
  error:        null,

  fetchInsights: async (period = "30d") => {
    set({ isLoading: true, error: null, streamText: "" });
    try {
      const res = await fetch(`${API_BASE}/ai/insights?period=${period}`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch insights");
      const insight = await res.json();
      set({ insight, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  streamInsights: async (period = "30d") => {
    set({ isStreaming: true, error: null, streamText: "", insight: null });
    try {
      const res = await fetch(`${API_BASE}/ai/insights/stream?period=${period}`, {
        headers: getAuthHeaders(),
      });

      if (!res.ok) throw new Error("Stream failed");
      if (!res.body) throw new Error("No stream body");

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let full      = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

        for (const line of lines) {
          const data = line.replace("data: ", "").trim();
          if (data === "[DONE]") break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "text") {
              full += parsed.text;
              set({ streamText: full });
            } else if (parsed.type === "done") {
              set({ insight: parsed.insight, isStreaming: false, streamText: "" });
            }
          } catch { /* skip malformed chunks */ }
        }
      }
      set({ isStreaming: false });
    } catch (err: any) {
      set({ error: err.message, isStreaming: false });
    }
  },

  clearInsights: () => set({ insight: null, streamText: "", error: null }),
}));
