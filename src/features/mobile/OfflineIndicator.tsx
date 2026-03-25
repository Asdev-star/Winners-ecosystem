import React from "react";
import { useOfflineSync } from "../pwa/useOfflineSync";

export default function OfflineIndicator() {
  const { isOnline, pendingActions } = useOfflineSync();

  if (isOnline) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9998,
        background: "var(--red)",
        color: "#fff",
        textAlign: "center",
        padding: "6px 12px",
        fontSize: 11,
        fontFamily: "'Space Mono', monospace",
      }}
    >
      {"\u25CF"} You're offline - actions are queued and will sync when you reconnect
      {pendingActions > 0 ? ` (${pendingActions} pending)` : ""}
    </div>
  );
}
