import { useCallback, useEffect, useMemo, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const DISMISS_KEY = "we_install_prompt_dismissed";

function getDisplayMode(): "browser" | "standalone" {
  if (typeof window === "undefined") return "browser";

  const standaloneMatch = window.matchMedia?.("(display-mode: standalone)").matches;
  const navStandalone = typeof navigator !== "undefined" && "standalone" in navigator
    ? Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
    : false;

  return standaloneMatch || navStandalone ? "standalone" : "browser";
}

function wasDismissed() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(DISMISS_KEY) === "true";
}

export const useInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(getDisplayMode() === "standalone");
  const [dismissed, setDismissed] = useState(wasDismissed());

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();

      if (dismissed || getDisplayMode() === "standalone") {
        return;
      }

      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      window.sessionStorage.removeItem(DISMISS_KEY);
      setDismissed(false);
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [dismissed]);

  const dismissInstallPrompt = useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(DISMISS_KEY, "true");
    }

    setDismissed(true);
    setDeferredPrompt(null);
  }, []);

  const resetInstallPrompt = useCallback(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(DISMISS_KEY);
    }

    setDismissed(false);
  }, []);

  const showInstallPrompt = useCallback(async () => {
    if (!deferredPrompt) {
      return { outcome: "dismissed" as const };
    }

    await deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;

    setDeferredPrompt(null);
    if (choice.outcome === "accepted") {
      setIsInstalled(true);
      resetInstallPrompt();
    } else {
      dismissInstallPrompt();
    }

    return choice;
  }, [deferredPrompt, dismissInstallPrompt, resetInstallPrompt]);

  const isInstallable = useMemo(
    () => Boolean(deferredPrompt) && !dismissed && !isInstalled,
    [deferredPrompt, dismissed, isInstalled],
  );

  return {
    deferredPrompt,
    dismissed,
    isInstallable,
    isInstalled,
    showInstallPrompt,
    dismissInstallPrompt,
    resetInstallPrompt,
    displayMode: getDisplayMode(),
  };
};
