// Level II - AI-Present on Every Page
// Hook: useTrustScore
// Real-time trust score for current user - visible intelligence signal

import { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "../features/auth/authStore";

interface TrustScoreBreakdown {
  academy: number;      // Up to 30 points
  work: number;        // Up to 25 points
  community: number;    // Up to 20 points
  identity: number;     // Up to 15 points
  payments: number;   // Up to 10 points
}

interface TrustScoreReturn {
  score: number;
  tier: "new" | "building" | "established" | "trusted" | "elite";
  breakdown: TrustScoreBreakdown;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Tier thresholds
const TIER_THRESHOLDS = {
  new: 0,
  building: 40,
  established: 60,
  trusted: 80,
  elite: 90,
};

function getTier(score: number): "new" | "building" | "established" | "trusted" | "elite" {
  if (score >= TIER_THRESHOLDS.elite) return "elite";
  if (score >= TIER_THRESHOLDS.trusted) return "trusted";
  if (score >= TIER_THRESHOLDS.established) return "established";
  if (score >= TIER_THRESHOLDS.building) return "building";
  return "new";
}

// Mock data for development - in production would call API
const getMockTrustData = (userId: string) => ({
  score: 67,
  breakdown: {
    academy: 18,      // 2 certificates
    work: 15,        // 3 contracts completed
    community: 14,   // Active engagement
    identity: 10,    // Verified
    payments: 10,    // No disputes
  },
});

export function useTrustScore(): TrustScoreReturn {
  const user = useAuthStore((state) => state.user);
  const [scoreData, setScoreData] = useState<{
    score: number;
    breakdown: TrustScoreBreakdown;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrustScore = async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // In production, call the API:
      // const response = await fetch(`/api/v1/users/${user.id}/trust-score`);
      // const data = await response.json();
      
      // For now, use mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      const data = getMockTrustData(user.id);
      setScoreData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch trust score");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrustScore();
  }, [user?.id]);

  const score = scoreData?.score ?? 0;
  const breakdown = scoreData?.breakdown ?? {
    academy: 0,
    work: 0,
    community: 0,
    identity: 0,
    payments: 0,
  };

  const tier = useMemo(() => getTier(score), [score]);

  return {
    score,
    tier,
    breakdown,
    isLoading,
    error,
    refetch: fetchTrustScore,
  };
}

// Hook specifically for Trust Score Widget display
export function useTrustScoreDisplay(userId?: string) {
  const { score, tier, breakdown, isLoading, error } = useTrustScore();
  
  const scoreColor = useMemo(() => {
    switch (tier) {
      case "elite": return "var(--green)";
      case "trusted": return "var(--gold)";
      case "established": return "var(--ice)";
      case "building": return "var(--text-dim)";
      default: return "var(--red)";
    }
  }, [tier]);

  const tierLabel = useMemo(() => {
    switch (tier) {
      case "elite": return "Elite";
      case "trusted": return "Trusted";
      case "established": return "Established";
      case "building": return "Building";
      default: return "New";
    }
  }, [tier]);

  const maxPoints = 100;
  const percentage = Math.round((score / maxPoints) * 100);

  return {
    score,
    tier,
    tierLabel,
    scoreColor,
    percentage,
    breakdown,
    breakdownLabels: {
      academy: "Academy Certificates",
      work: "Contracts Completed",
      community: "Community Engagement",
      identity: "Identity Verified",
      payments: "Payment History",
    },
    isLoading,
    error,
  };
}
