// Level IV - Reactive Ecosystem State
// Hook: useEcosystemHealth
// Polls layer statuses every 60 seconds - feeds ContextBar

import { useEffect, useMemo, useCallback, useState } from "react";

// Types matching ecosystemStore
type LayerKey =
  | "core"
  | "community"
  | "academy"
  | "market"
  | "intelligence"
  | "work"
  | "cloud"
  | "ai-platform";

interface LayerHealth {
  status: "live" | "active" | "building" | "planned";
  lastChecked: string;
  metrics?: {
    uptime: number;
    responseTime: number;
    activeUsers?: number;
  };
}

const LAYERS: LayerKey[] = [
  "core",
  "community",
  "academy",
  "market",
  "intelligence",
  "work",
  "cloud",
  "ai-platform",
];

// Mock health data for development - in production this would call the API
const getMockHealth = (): Record<LayerKey, LayerHealth> => {
  const now = new Date().toISOString();
  return {
    core: {
      status: "live",
      lastChecked: now,
      metrics: { uptime: 99.9, responseTime: 120 },
    },
    community: {
      status: "active",
      lastChecked: now,
      metrics: { uptime: 99.5, responseTime: 180 },
    },
    academy: {
      status: "active",
      lastChecked: now,
      metrics: { uptime: 99.2, responseTime: 200 },
    },
    market: { status: "live", lastChecked: now },
    intelligence: {
      status: "active",
      lastChecked: now,
      metrics: { uptime: 98.8, responseTime: 350 },
    },
    work: { status: "live", lastChecked: now },
    cloud: { status: "live", lastChecked: now },
    "ai-platform": { status: "live", lastChecked: now },
  };
};

interface UseEcosystemHealthReturn {
  health: Record<LayerKey, LayerHealth>;
  isLoading: boolean;
  error: string | null;
  lastRefresh: Date | null;
  refresh: () => Promise<void>;
  // Convenience accessors
  getLayerStatus: (layer: LayerKey) => LayerHealth | undefined;
  isLayerLive: (layer: LayerKey) => boolean;
  isLayerActive: (layer: LayerKey) => boolean;
  isLayerBuilding: (layer: LayerKey) => boolean;
  isLayerPlanned: (layer: LayerKey) => boolean;
}

export function useEcosystemHealth(): UseEcosystemHealthReturn {
  const [health, setHealth] =
    useState<Record<LayerKey, LayerHealth>>(getMockHealth());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/health/layers");
      if (res.ok) {
        const body = (await res.json()) as {
          layers: Record<LayerKey, LayerHealth>;
        };
        if (body.layers) {
          setHealth(body.layers);
          setError(null);
          return;
        }
      }
      // Fall back to mock if API fails or returns invalid data
      setHealth(getMockHealth());
    } catch (err) {
      // Network error - use mock data
      setHealth(getMockHealth());
      setError(
        err instanceof Error ? err.message : "Failed to fetch layer health",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000);
    return () => clearInterval(interval);
  }, [refresh]);

  // Convenience accessors
  const getLayerStatus = useCallback(
    (layer: LayerKey): LayerHealth | undefined => {
      return health[layer];
    },
    [health],
  );

  const isLayerLive = useCallback(
    (layer: LayerKey): boolean => {
      return health[layer]?.status === "live";
    },
    [health],
  );

  const isLayerActive = useCallback(
    (layer: LayerKey): boolean => {
      return health[layer]?.status === "active";
    },
    [health],
  );

  const isLayerBuilding = useCallback(
    (layer: LayerKey): boolean => {
      return health[layer]?.status === "building";
    },
    [health],
  );

  const isLayerPlanned = useCallback(
    (layer: LayerKey): boolean => {
      return health[layer]?.status === "planned";
    },
    [health],
  );

  // Get last refresh time
  const lastRefresh = useMemo(() => {
    const times = LAYERS.map((l: LayerKey) => health[l]?.lastChecked).filter(
      Boolean,
    ) as string[];
    if (times.length === 0) return null;
    return new Date(
      Math.max(...times.map((t: string) => new Date(t).getTime())),
    );
  }, [health]);

  return {
    health,
    isLoading,
    error,
    lastRefresh,
    refresh,
    getLayerStatus,
    isLayerLive,
    isLayerActive,
    isLayerBuilding,
    isLayerPlanned,
  };
}

// Need to add useState import

// Hook for getting status display info for ContextBar
export function useLayerStatusDisplay() {
  const { health, isLoading } = useEcosystemHealth();

  const layerStatus = useMemo(() => {
    return LAYERS.map((layer) => ({
      key: layer,
      label: getLayerLabel(layer),
      status: health[layer]?.status || "planned",
      metrics: health[layer]?.metrics,
    }));
  }, [health]);

  return { layerStatus, isLoading };
}

function getLayerLabel(layer: LayerKey): string {
  const labels: Record<LayerKey, string> = {
    core: "⬡ Core Engine",
    community: "👥 Community",
    academy: "🎓 Academy",
    market: "🛒 Market",
    intelligence: "🤖 Intelligence",
    work: "💼 Work",
    cloud: "☁️ Cloud",
    "ai-platform": "🧬 AI Platform",
  };
  return labels[layer] || layer;
}
