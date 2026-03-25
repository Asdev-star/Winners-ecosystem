import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { resolveLayerFromPath } from "../lib/layers";

export default function LayerThemeBridge() {
  const location = useLocation();

  useEffect(() => {
    const layer = resolveLayerFromPath(location.pathname);
    const root = document.documentElement;

    root.setAttribute("data-layer", layer.id);
    root.style.setProperty("--layer-accent", layer.accent);
    root.style.setProperty("--layer-accent-soft", layer.accentSoft);
    root.style.setProperty("--layer-accent-alt", layer.accentAlt);
  }, [location.pathname]);

  return null;
}

