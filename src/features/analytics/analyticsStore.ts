import { create } from "zustand";

interface DataPoint {
  name: string;
  value: number;
}

type Period = "7d" | "30d" | "90d";

interface AnalyticsState {
  period: Period;
  userData: DataPoint[];
  revenueData: DataPoint[];
  prevUserData: DataPoint[];
  prevRevenueData: DataPoint[];
  isLoading: boolean;
  setPeriod: (period: Period) => void;
}

function generateMock(days: number, base = 1): DataPoint[] {
  return Array.from({ length: days }).map((_, i) => ({
    name: `Day ${i + 1}`,
    value:
      Math.floor(Math.random() * 300 * base) + 50,
  }));
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  period: "7d",
  userData: generateMock(7, 1.1),
  revenueData: generateMock(7, 1.2),
  prevUserData: generateMock(7, 1),
  prevRevenueData: generateMock(7, 1),
  isLoading: false,

  setPeriod: (period) => {
    set({ isLoading: true });

    const days =
      period === "7d" ? 7 : period === "30d" ? 30 : 90;

    setTimeout(() => {
      set({
        period,
        userData: generateMock(days, 1.2),
        revenueData: generateMock(days, 1.3),
        prevUserData: generateMock(days, 1),
        prevRevenueData: generateMock(days, 1),
        isLoading: false,
      });
    }, 800);
  },
}));
