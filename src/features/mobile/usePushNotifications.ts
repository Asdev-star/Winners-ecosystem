import { useCallback, useEffect, useRef, useState } from "react";
import { getApp, getApps, initializeApp } from "firebase/app";
import { deleteToken, getMessaging, getToken, isSupported, onMessage, type MessagePayload } from "firebase/messaging";
import { toast } from "react-hot-toast";
import { API_BASE } from "../../lib/api";
import { useAuthStore } from "../auth/authStore";
import { useNotificationStore, type Notification } from "../notifications/notificationStore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

function canUsePushApis() {
  return typeof window !== "undefined" && typeof navigator !== "undefined" && "Notification" in window && "serviceWorker" in navigator;
}

function hasFirebaseConfig() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId,
  );
}

function getFirebaseAppInstance() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

async function getMessagingInstance() {
  if (!canUsePushApis() || !hasFirebaseConfig()) {
    return null;
  }

  const supported = await isSupported().catch(() => false);
  if (!supported) {
    return null;
  }

  return getMessaging(getFirebaseAppInstance());
}

async function getActiveServiceWorkerRegistration() {
  if (!canUsePushApis()) {
    return undefined;
  }

  return navigator.serviceWorker.ready.catch(() => undefined);
}

async function resolveMessagingToken() {
  const messaging = await getMessagingInstance();
  if (!messaging) {
    return null;
  }

  const serviceWorkerRegistration = await getActiveServiceWorkerRegistration();
  return getToken(messaging, {
    ...(VAPID_KEY ? { vapidKey: VAPID_KEY } : {}),
    ...(serviceWorkerRegistration ? { serviceWorkerRegistration } : {}),
  });
}

async function registerDeviceToken(authToken: string, deviceToken: string) {
  const response = await fetch(`${API_BASE}/notifications/device-token`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token: deviceToken, platform: "web" }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error ?? "Failed to register notification token.");
  }
}

async function unregisterDeviceToken(authToken: string, deviceToken: string) {
  const response = await fetch(`${API_BASE}/notifications/device-token`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${authToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token: deviceToken }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body?.error ?? "Failed to unregister notification token.");
  }
}

function showToast(title: string, body: string) {
  const message = body ? `${title}: ${body}` : title;
  if (!message) {
    return;
  }

  toast(message, {
    duration: 4500,
    id: `push:${title}:${body}`,
  });
}

function getForegroundMessage(payload: MessagePayload) {
  return {
    title: payload.notification?.title || payload.data?.title || "Winners",
    body: payload.notification?.body || payload.data?.body || "",
  };
}

function buildForegroundNotification(payload: MessagePayload): Notification {
  const { title, body } = getForegroundMessage(payload);
  const link = payload.data?.url || payload.fcmOptions?.link || "/notifications";
  const type = payload.data?.type;

  const normalizedType: Notification["type"] =
    type === "anomaly" || type === "team" || type === "billing" || type === "revenue" || type === "system"
      ? type
      : "system";

  return {
    id: payload.data?.notificationId || `push:${title}:${body}:${Date.now()}`,
    type: normalizedType,
    title,
    body,
    read: false,
    createdAt: new Date().toISOString(),
    link,
  };
}

async function registerMessagingToken(authToken: string) {
  const deviceToken = await resolveMessagingToken();
  if (!deviceToken) {
    return null;
  }

  await registerDeviceToken(authToken, deviceToken);
  return deviceToken;
}

export async function requestPushPermission(authToken: string) {
  if (!canUsePushApis() || !authToken) {
    return false;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return false;
  }

  const deviceToken = await registerMessagingToken(authToken);
  return Boolean(deviceToken);
}

export const usePushNotifications = () => {
  const token = useAuthStore((state) => state.token);
  const currentTokenRef = useRef<string | null>(null);
  const addNotification = useNotificationStore((state) => state.addNotification);

  const [supported, setSupported] = useState(() => canUsePushApis() && hasFirebaseConfig());
  const [permission, setPermission] = useState<NotificationPermission>(
    canUsePushApis() ? Notification.permission : "default",
  );
  const [subscribed, setSubscribed] = useState(false);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!canUsePushApis() || !hasFirebaseConfig()) {
      setSupported(false);
      return undefined;
    }

    void isSupported()
      .then((nextSupported) => {
        if (active) {
          setSupported(nextSupported);
        }
      })
      .catch(() => {
        if (active) {
          setSupported(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const requestPermission = useCallback(async () => {
    if (!supported) {
      setPermission("denied");
      setError("Push notifications are not supported in this browser.");
      return "denied" as const;
    }

    const nextPermission = await Notification.requestPermission();
    setPermission(nextPermission);

    if (nextPermission === "denied") {
      setError("Push notifications were blocked. Update your browser site permissions to try again.");
    } else {
      setError(null);
    }

    return nextPermission;
  }, [supported]);

  const subscribe = useCallback(async () => {
    if (!token) {
      setError("Sign in to enable notifications.");
      return null;
    }

    setIsSubscribing(true);
    setError(null);

    try {
      const deviceToken = await registerMessagingToken(token);
      currentTokenRef.current = deviceToken;
      setSubscribed(Boolean(deviceToken));
      return deviceToken;
    } catch (reason) {
      const nextError = reason instanceof Error ? reason.message : "Unable to enable push notifications.";
      console.error("[Push] Registration failed", reason);
      setError(nextError);
      setSubscribed(false);
      return null;
    } finally {
      setIsSubscribing(false);
      setPermission(canUsePushApis() ? Notification.permission : "default");
    }
  }, [token]);

  const unsubscribe = useCallback(async () => {
    if (!token) {
      return true;
    }

    setIsSubscribing(true);
    setError(null);

    try {
      const messaging = await getMessagingInstance();
      const deviceToken = currentTokenRef.current ?? (permission === "granted" ? await resolveMessagingToken() : null);

      if (deviceToken) {
        await unregisterDeviceToken(token, deviceToken);
      }

      if (messaging) {
        await deleteToken(messaging).catch(() => false);
      }

      currentTokenRef.current = null;
      setSubscribed(false);
      return true;
    } catch (reason) {
      const nextError = reason instanceof Error ? reason.message : "Unable to disable push notifications.";
      console.error("[Push] Unregister failed", reason);
      setError(nextError);
      return false;
    } finally {
      setIsSubscribing(false);
    }
  }, [permission, token]);

  useEffect(() => {
    if (!token || !supported || permission !== "granted") {
      if (!token) {
        currentTokenRef.current = null;
        setSubscribed(false);
      }
      return undefined;
    }

    let active = true;

    void registerMessagingToken(token)
      .then((deviceToken) => {
        if (!active) {
          return;
        }

        currentTokenRef.current = deviceToken;
        setSubscribed(Boolean(deviceToken));
      })
      .catch((reason) => {
        if (!active) {
          return;
        }

        const nextError = reason instanceof Error ? reason.message : "Unable to restore push notifications.";
        console.error("[Push] Restore failed", reason);
        setError(nextError);
        setSubscribed(false);
      });

    return () => {
      active = false;
    };
  }, [permission, supported, token]);

  useEffect(() => {
    if (!supported || permission !== "granted") {
      return undefined;
    }

    let detach: (() => void) | undefined;
    let active = true;

    void getMessagingInstance().then((messaging) => {
      if (!active || !messaging) {
        return;
      }

      detach = onMessage(messaging, (payload) => {
        const { title, body } = getForegroundMessage(payload);
        addNotification(buildForegroundNotification(payload));
        showToast(title, body);
      });
    });

    return () => {
      active = false;
      detach?.();
    };
  }, [addNotification, permission, supported]);

  return {
    supported,
    permission,
    subscribed,
    isSubscribing,
    error,
    requestPermission,
    subscribe,
    unsubscribe,
  };
};
