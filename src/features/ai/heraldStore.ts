// src/features/ai/heraldStore.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { getAuthHeaders } from "../auth/authStore";
import { API_BASE } from "../../lib/api";
import { persistStorage } from "../../lib/storage";

export interface AIProviderStatus {
  provider: string;
  latency_ms: number;
  cost: number;
  status: "active" | "degraded" | "offline";
  isLocal: boolean;
}

export interface PlatformMetrics {
  totalRequests: number;
  localPercent: number;
  errorRate: number;
  gpuUsage: number;
  activeModels: string[];
}

interface HeraldState {
  metrics: PlatformMetrics | null;
  providers: AIProviderStatus[];
  isLoading: boolean;
  lastUpdated: string | null;

  fetchStatus: () => Promise<void>;
  getLatencyBenchmark: () => number;
}

export const useHeraldStore = create<HeraldState>()(
  persist(
    (set, get) => ({
      metrics: null,
      providers: [
        { provider: "ollama", latency_ms: 94, cost: 0, status: "active", isLocal: true },
        { provider: "whisper", latency_ms: 120, cost: 0, status: "active", isLocal: true },
        { provider: "claude", latency_ms: 850, cost: 0.015, status: "active", isLocal: false },
        { provider: "gpt4o", latency_ms: 720, cost: 0.01, status: "active", isLocal: false },
      ],
      isLoading: false,
      lastUpdated: null,

      fetchStatus: async () => {
        set({ isLoading: true });
        try {
          // HERALD specifically monitors the /ai-platform/monitor endpoint
          const res = await fetch(`${API_BASE}/ai-platform/monitor`, {
            headers: getAuthHeaders(),
          });
          if (res.ok) {
            const data = await res.json();
            // Map backend metrics to our store
            set({
              metrics: {
                totalRequests: data.total_requests || 0,
                localPercent: data.local_percent || 72,
                errorRate: data.error_rate || 0.02,
                gpuUsage: data.gpu?.utilization || 0,
                activeModels: data.ollama_models || ["llama3", "mistral", "whisper-v3"],
              },
              lastUpdated: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.error("HERALD failed to fetch platform metrics", err);
        } finally {
          set({ isLoading: false });
        }
      },

      getLatencyBenchmark: () => {
        const local = get().providers.find(p => p.isLocal && p.status === "active");
        return local ? local.latency_ms : 800; // Default to cloud latency if local is down
      }
    }),
    {
      name: "winners-herald-storage",
      storage: createJSONStorage(() => persistStorage),
    }
  )
);
