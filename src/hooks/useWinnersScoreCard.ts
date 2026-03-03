// Level V - Named Supervisor Deployment
// Hook: useWinnersScoreCard
// Fetches and manages the user's Winners Score (OMEGA weekly report)

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../features/auth/authStore";

interface ScoreBreakdown {
  community: { score: number; percentage: number; color: string };
  academy: { score: number; percentage: number; color: string };
  market: { score: number; percentage: number; color: string };
  work: { score: number; percentage: number; color: string };
  intelligence: { score: number; percentage: number; color: string };
  engagement: { score: number; percentage: number; color: string };
}

interface ScoreTrend {
  direction: "up" | "down" | "stable";
  change: number;
}

interface WinnersScoreCardData {
  score: number;
  breakdown: ScoreBreakdown;
  trend: ScoreTrend | null;
  lastUpdated: string;
}

export function useWinnersScoreCard(userId?: string) {
  const [score, setScore] = useState(0);
  const [breakdown, setBreakdown] = useState<ScoreBreakdown | null>(null);
  const [trend, setTrend] = useState<ScoreTrend | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const token = useAuthStore((state) => state.token);
  const authUserId = useAuthStore((state) => state.user?.id);

  const targetUserId = userId || authUserId;

  const fetchScore = useCallback(async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/users/${targetUserId}/score`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          await generateInitialScore(targetUserId);
          return;
        }
        throw new Error(`Failed to fetch score: ${response.status}`);
      }

      const data: WinnersScoreCardData = await response.json();
      setScore(data.score);
      setBreakdown(data.breakdown);
      setTrend(data.trend);
      setLastUpdated(data.lastUpdated);
    } catch (err) {
      console.error("[useWinnersScoreCard] Error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      const mock = getMockScore();
      setScore(mock.score);
      setBreakdown(mock.breakdown);
      setTrend(mock.trend);
      setLastUpdated(new Date().toISOString());
    } finally {
      setLoading(false);
    }
  }, [targetUserId, token]);

  const generateInitialScore = async (uid: string) => {
    try {
      const response = await fetch(`/api/v1/users/${uid}/score/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setScore(data.score);
        setBreakdown(data.breakdown);
        setTrend(data.trend);
        setLastUpdated(data.lastUpdated);
      }
    } catch (err) {
      console.error("[useWinnersScoreCard] Generate error:", err);
      const mock = getMockScore();
      setScore(mock.score);
      setBreakdown(mock.breakdown);
      setTrend(mock.trend);
      setLastUpdated(new Date().toISOString());
    } finally {
      setLoading(false);
    }
  };

  const refresh = useCallback(() => {
    fetchScore();
  }, [fetchScore]);

  useEffect(() => {
    fetchScore();
  }, [fetchScore]);

  return {
    score,
    breakdown,
    trend,
    loading,
    error,
    lastUpdated,
    refresh,
  };
}

function getMockScore(): {
  score: number;
  breakdown: ScoreBreakdown;
  trend: ScoreTrend;
} {
  return {
    score: 72,
    breakdown: {
      community: { score: 85, percentage: 85, color: "var(--gold)" },
      academy: { score: 60, percentage: 60, color: "var(--blue)" },
      market: { score: 0, percentage: 0, color: "var(--text-dim)" },
      work: { score: 0, percentage: 0, color: "var(--text-dim)" },
      intelligence: { score: 78, percentage: 78, color: "var(--purple)" },
      engagement: { score: 65, percentage: 65, color: "var(--ice)" },
    },
    trend: {
      direction: "up",
      change: 12,
    },
  };
}
