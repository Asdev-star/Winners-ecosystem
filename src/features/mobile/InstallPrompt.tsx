import { useEffect, useState } from "react";
import { shouldShowInstallPrompt } from "../../lib/regulation";
import { trackAppDownload } from "../../lib/ecosystemTelemetry";

interface BeforeInstallPromptEvent extends Event {
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  prompt(): Promise<void>;
}

function trackEvent(eventName: string) {
  const analytics = (window as Window & {
    plausible?: (name: string) => void;
    gtag?: (...args: unknown[]) => void;
  });

  if (typeof analytics.plausible === "function") {
    analytics.plausible(eventName);
    return;
  }

  if (typeof analytics.gtag === "function") {
    analytics.gtag("event", eventName);
    return;
  }

  console.info("[InstallPrompt]", eventName);
}

export default function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const visits = parseInt(localStorage.getItem("winners:visit-count") || "0", 10) + 1;
    localStorage.setItem("winners:visit-count", String(visits));

    const dismissed = localStorage.getItem("winners:install-dismissed");
    const daysSinceDismiss = dismissed
      ? (Date.now() - parseInt(dismissed, 10)) / (1000 * 60 * 60 * 24)
      : 999;

    const handleBeforeInstallPrompt = (event: Event) => {
      if (
        !shouldShowInstallPrompt({
          dismissed: Boolean(dismissed),
          displayMode: "browser",
          visits,
          daysSinceDismiss,
        })
      ) {
        return;
      }

      event.preventDefault();
      setPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;

    await prompt.prompt();
    const result = await prompt.userChoice;
    if (result.outcome === "accepted") {
      trackEvent("pwa_install");
      trackAppDownload({
        platform: "pwa",
        appVersion: "web",
        isFirstDownload: true,
      });
    }
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("winners:install-dismissed", String(Date.now()));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 80,
        left: 16,
        right: 16,
        zIndex: 9999,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 8,
        padding: "14px 16px",
        borderTop: "2px solid var(--gold)",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
    >
      <span style={{ fontSize: 12, fontWeight: 700, color: "var(--gold)" }}>APP</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Add Winners to your home screen</div>
        <div style={{ fontSize: 11, color: "var(--text-dim)" }}>Faster access - Works offline - Push notifications</div>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        style={{
          background: "transparent",
          border: "none",
          color: "var(--text-dim)",
          cursor: "pointer",
          fontSize: 18,
        }}
      >
        X
      </button>
      <button
        type="button"
        onClick={() => void handleInstall()}
        style={{
          background: "var(--gold)",
          color: "#0D1520",
          border: "none",
          borderRadius: 4,
          padding: "7px 14px",
          fontFamily: "'Space Mono', monospace",
          fontSize: 9,
          textTransform: "uppercase",
          letterSpacing: ".1em",
          fontWeight: 700,
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        Install
      </button>
    </div>
  );
}
