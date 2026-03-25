import { useState } from "react";
import { useLocation } from "react-router-dom";

export default function AIBackdrop() {
  const location = useLocation();
  const [logoError, setLogoError] = useState(false);
  const isLanding = location.pathname === "/" || location.pathname === "/landing";

  return (
    <div className={`ai-backdrop${isLanding ? " landing" : ""}`} aria-hidden="true">
      <div className="ai-backdrop-grid" />
      <div className="ai-backdrop-glow ai-backdrop-glow-gold" />
      <div className="ai-backdrop-glow ai-backdrop-glow-ice" />
      <div className="ai-backdrop-glow ai-backdrop-glow-blue" />

      <div className="ai-backdrop-ring ai-backdrop-ring-a" />
      <div className="ai-backdrop-ring ai-backdrop-ring-b" />
      <div className="ai-backdrop-ring ai-backdrop-ring-c" />

      {!logoError ? (
        <img
          className="ai-backdrop-logo"
          src="/logo.jpg"
          alt=""
          onError={() => setLogoError(true)}
        />
      ) : (
        <div className="ai-backdrop-logo-fallback">W</div>
      )}
    </div>
  );
}

