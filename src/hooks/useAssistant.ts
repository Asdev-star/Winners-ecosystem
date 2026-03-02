// Level III - Shared Component Architecture
// Hook: useAssistant
// Automatically injects the correct assistant for the current route

import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useEcosystemStore, getAssistantForRoute, getPageFromRoute } from "../stores/ecosystemStore";

type AssistantKey = "aria" | "nova" | "sage" | "atlas" | "circuit" | "forge" | "nexus" | "herald" | "omega";

interface UseAssistantOptions {
  autoContext?: boolean;
}

interface UseAssistantReturn {
  assistant: AssistantKey;
  page: string;
  context: Record<string, unknown>;
}

export function useAssistant(options: UseAssistantOptions = {}): UseAssistantReturn {
  const { autoContext = true } = options;
  const location = useLocation();
  const { layerHealth, currentLoopStage } = useEcosystemStore();
  
  const assistant = useMemo(() => {
    return getAssistantForRoute(location.pathname);
  }, [location.pathname]);
  
  const page = useMemo(() => {
    return getPageFromRoute(location.pathname);
  }, [location.pathname]);
  
  const context = useMemo(() => {
    if (!autoContext) return {};
    
    // Build context based on current route
    const baseContext: Record<string, unknown> = {
      page,
      pathname: location.pathname,
      loopStage: currentLoopStage,
    };
    
    // Add layer-specific context
    switch (assistant) {
      case "nova":
        return {
          ...baseContext,
          layer: "community",
          layerHealth: layerHealth.community,
        };
      case "sage":
        return {
          ...baseContext,
          layer: "academy",
          layerHealth: layerHealth.academy,
        };
      case "atlas":
        return {
          ...baseContext,
          layer: "market",
          layerHealth: layerHealth.market,
        };
      case "circuit":
        return {
          ...baseContext,
          layer: "work",
          layerHealth: layerHealth.work,
        };
      case "forge":
        return {
          ...baseContext,
          layer: "intelligence",
          layerHealth: layerHealth.intelligence,
        };
      case "omega":
        return {
          ...baseContext,
          layer: "ecosystem",
          allLayers: layerHealth,
          currentLoopStage,
        };
      default:
        return {
          ...baseContext,
          layer: "core",
          layerHealth: layerHealth.core,
        };
    }
  }, [assistant, page, location.pathname, autoContext, layerHealth, currentLoopStage]);
  
  return { assistant, page, context };
}

// Hook for the floating assistant FAB
export function useAssistantPanel() {
  const location = useLocation();
  const { assistant, page, context } = useAssistant();
  const layerHealth = useEcosystemStore(state => state.layerHealth);
  
  return {
    assistant,
    page,
    context,
    // Determine if we should show proactive messages
    shouldShowProactive: useMemo(() => {
      // Only show for active/live layers
      const health = location.pathname.includes("/community") 
        ? layerHealth.community?.status 
        : location.pathname.includes("/academy")
        ? layerHealth.academy?.status
        : location.pathname.includes("/intelligence")
        ? layerHealth.intelligence?.status
        : "active";
      
      return health === "live" || health === "active";
    }, [location.pathname, layerHealth]),
  };
}
