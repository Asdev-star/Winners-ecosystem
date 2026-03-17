// Hook: usePushNotifications
// Firebase FCM push notification opt-in for PWA + mobile

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../features/auth/authStore";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";
const VAPID_PUBLIC_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";

export interface PushState {
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
  loading: boolean;
  error: string | null;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const { token } = useAuthStore();
  const [state, setState] = useState<PushState>({
    supported: false,
    permission: "default",
    subscribed: false,
    loading: false,
    error: null,
  });

  useEffect(() => {
    const supported = "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
    setState((prev) => ({
      ...prev,
      supported,
      permission: supported ? Notification.permission : "unsupported",
    }));

    if (supported && Notification.permission === "granted") {
      checkExistingSubscription();
    }
  }, []);

  async function checkExistingSubscription() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        setState((prev) => ({ ...prev, subscribed: true }));
      }
    } catch {
      // ignore
    }
  }

  async function registerTokenWithServer(fcmToken: string) {
    if (!token) return;
    try {
      await fetch(`${API_BASE}/push-tokens/register`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ token: fcmToken, platform: "web" }),
      });
    } catch (err) {
      console.error("[push] Failed to register token with server:", err);
    }
  }

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.supported) return false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));

      if (permission !== "granted") {
        setState((prev) => ({ ...prev, loading: false, error: "Permission denied" }));
        return false;
      }

      const reg = await navigator.serviceWorker.ready;

      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        const applicationServerKey = VAPID_PUBLIC_KEY
          ? urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
          : undefined;

        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          ...(applicationServerKey ? { applicationServerKey: applicationServerKey as Uint8Array<ArrayBuffer> } : {}),
        });
      }

      const subJson = sub.toJSON();
      const p256dhKey = subJson.keys?.p256dh ?? "";
      const authKey = subJson.keys?.auth ?? "";
      const endpointToken = `web_push:${btoa(JSON.stringify({ endpoint: sub.endpoint, p256dh: p256dhKey, auth: authKey }))}`;

      await registerTokenWithServer(endpointToken);

      setState((prev) => ({ ...prev, subscribed: true, loading: false }));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to subscribe";
      setState((prev) => ({ ...prev, loading: false, error: msg }));
      return false;
    }
  }, [state.supported, token]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        if (token) {
          await fetch(`${API_BASE}/push-tokens/register`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ token: sub.endpoint }),
          });
        }
      }
      setState((prev) => ({ ...prev, subscribed: false, loading: false }));
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to unsubscribe";
      setState((prev) => ({ ...prev, loading: false, error: msg }));
      return false;
    }
  }, [token]);

  return { ...state, subscribe, unsubscribe };
}
