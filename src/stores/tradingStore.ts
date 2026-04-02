import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface TradingSignal {
  id: string;
  symbol: string;
  type: "BUY" | "SELL" | "HOLD";
  confidence: number;
  price: number;
  targetPrice: number;
  stopLoss: number;
  timeframe: string;
  analysis: string;
  createdAt: string;
  status: "active" | "triggered" | "expired";
}

export interface PortfolioItem {
  id: string;
  symbol: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
}

export interface MarketAnalysis {
  id: string;
  title: string;
  summary: string;
  sentiment: "bullish" | "bearish" | "neutral";
  confidence: number;
  assets: string[];
  createdAt: string;
}

interface TradingState {
  signals: TradingSignal[];
  portfolio: PortfolioItem[];
  analyses: MarketAnalysis[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchSignals: () => Promise<void>;
  fetchPortfolio: () => Promise<void>;
  fetchAnalyses: () => Promise<void>;
  subscribeToSignal: (signalId: string) => Promise<void>;
  unsubscribeFromSignal: (signalId: string) => Promise<void>;
  clearError: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export const useTradingStore = create<TradingState>()(
  devtools(
    (set, get) => ({
      signals: [],
      portfolio: [],
      analyses: [],
      loading: false,
      error: null,

      fetchSignals: async () => {
        set({ loading: true, error: null });
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(`${API_BASE}/trading/signals`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch trading signals");
          }

          const data = await response.json();
          set({ signals: data.signals || [], loading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to fetch signals",
            loading: false,
          });
        }
      },

      fetchPortfolio: async () => {
        set({ loading: true, error: null });
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(`${API_BASE}/trading/portfolio`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch portfolio");
          }

          const data = await response.json();
          set({ portfolio: data.portfolio || [], loading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to fetch portfolio",
            loading: false,
          });
        }
      },

      fetchAnalyses: async () => {
        set({ loading: true, error: null });
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(`${API_BASE}/trading/analyses`, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            throw new Error("Failed to fetch market analyses");
          }

          const data = await response.json();
          set({ analyses: data.analyses || [], loading: false });
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to fetch analyses",
            loading: false,
          });
        }
      },

      subscribeToSignal: async (signalId: string) => {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(
            `${API_BASE}/trading/signals/${signalId}/subscribe`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            },
          );

          if (!response.ok) {
            throw new Error("Failed to subscribe to signal");
          }

          // Refresh signals after subscription
          await get().fetchSignals();
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to subscribe to signal",
          });
        }
      },

      unsubscribeFromSignal: async (signalId: string) => {
        try {
          const token = localStorage.getItem("token");
          const response = await fetch(
            `${API_BASE}/trading/signals/${signalId}/unsubscribe`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            },
          );

          if (!response.ok) {
            throw new Error("Failed to unsubscribe from signal");
          }

          // Refresh signals after unsubscription
          await get().fetchSignals();
        } catch (error) {
          set({
            error:
              error instanceof Error
                ? error.message
                : "Failed to unsubscribe from signal",
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    { name: "trading-store" },
  ),
);
