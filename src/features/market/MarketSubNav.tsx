import { useEffect, useMemo, useState } from "react";
import LayerSubNav from "../../components/navigation/LayerSubNav";
import type { LayerSmartAction, LayerSubNavConfig } from "../../components/navigation/layerSubNavConfigs";
import { useAuthStore } from "../auth/authStore";

type AtlasNavActionResponse = {
  action?: {
    supervisor?: "ATLAS";
    title?: string;
    hint?: string;
    to?: string;
  };
};

const MARKET_ITEMS: LayerSubNavConfig["items"] = [
  { id: "market-hub", label: "Shop", to: "/market", badge: "Live", badgeTone: "positive" },
  { id: "market-dropshipping", label: "Dropshipping", to: "/market/dropshipping", badge: "HOT", badgeTone: "attention" },
  { id: "market-vendor", label: "My Store", to: "/market/vendor" },
  { id: "market-stream", label: "Stream", to: "/market/stream" },
  { id: "market-business", label: "Business", to: "/market/business", aliases: ["/market/business-launcher"] },
  { id: "market-career", label: "Career", to: "/market/career", aliases: ["/market/cv-tools"] },
  { id: "market-trading", label: "Trading", to: "/market/trading" },
  { id: "market-events", label: "Events", to: "/market/events" },
  { id: "market-property", label: "Property", to: "/market/property" },
  { id: "market-health", label: "Health", to: "/market/health" },
  { id: "market-finance", label: "Finance", to: "/market/finance", badge: "PRO", badgeTone: "attention" },
];

const FALLBACK_ACTION: LayerSmartAction = {
  supervisor: "ATLAS",
  title: "Find best-value product path",
  hint: "Match products to your goals and budget profile.",
  to: "/market/dropshipping?tab=niches",
};

function normalizeAction(payload: AtlasNavActionResponse | null): LayerSmartAction {
  const action = payload?.action;
  if (!action?.title || !action?.hint) return FALLBACK_ACTION;
  return {
    supervisor: "ATLAS",
    title: action.title,
    hint: action.hint,
    to: action.to || FALLBACK_ACTION.to,
  };
}

export default function MarketSubNav() {
  const { token } = useAuthStore();
  const [navAction, setNavAction] = useState<LayerSmartAction>(FALLBACK_ACTION);

  useEffect(() => {
    let cancelled = false;
    const apiBase = import.meta.env.VITE_API_URL || "/api/v1";

    const loadAction = async () => {
      try {
        const res = await fetch(`${apiBase}/supervisors/atlas/nav-action`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });

        if (!res.ok) {
          throw new Error(`nav-action failed with ${res.status}`);
        }

        const data = (await res.json()) as AtlasNavActionResponse;
        if (!cancelled) {
          setNavAction(normalizeAction(data));
        }
      } catch {
        if (!cancelled) {
          setNavAction(FALLBACK_ACTION);
        }
      }
    };

    void loadAction();
    const interval = window.setInterval(() => {
      void loadAction();
    }, 60_000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [token]);

  const config = useMemo<LayerSubNavConfig>(() => ({
    key: "market",
    layer: "market",
    accent: "var(--gold)",
    items: MARKET_ITEMS,
    smartAction: () => navAction,
  }), [navAction]);

  return <LayerSubNav config={config} />;
}
