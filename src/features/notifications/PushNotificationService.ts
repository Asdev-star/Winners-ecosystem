// features/notifications/PushNotificationService.ts
// Phase 7 — Mobile PWA — Firebase Cloud Messaging Integration
// Handles push notification subscription, token management, and message handling

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";
const API = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

export interface StoredPushSubscription {
  id: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  createdAt: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  communityPosts: boolean;
  communityLikes: boolean;
  communityComments: boolean;
  academyEnrollment: boolean;
  academyCertificate: boolean;
  marketOrderUpdate: boolean;
  workApplication: boolean;
  workContractUpdate: boolean;
  trustScoreChange: boolean;
  systemAnnouncements: boolean;
}

class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: StoredPushSubscription | null = null;
  private token: string | null = null;

  /** Initialize push notifications */
  async initialize(userToken: string): Promise<boolean> {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.warn("[Push] Push notifications not supported");
      return false;
    }

    try {
      this.registration = await navigator.serviceWorker.ready;
      console.log("[Push] Service Worker ready");

      // Check existing subscription
      const existingSubscription = await this.registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        console.log("[Push] Existing subscription found");
        await this.saveSubscription(existingSubscription, userToken);
        return true;
      }

      console.log("[Push] No existing subscription");
      return false;
    } catch (error) {
      console.error("[Push] Initialization error:", error);
      return false;
    }
  }

  /** Request permission and subscribe to push notifications */
  async subscribe(userToken: string): Promise<boolean> {
    try {
      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission !== "granted") {
        console.log("[Push] Permission denied");
        return false;
      }

      if (!this.registration) {
        throw new Error("Service Worker not initialized");
      }

      // Subscribe with VAPID key
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(VAPID_KEY) as BufferSource,
      });

      console.log("[Push] Subscribed successfully");
      await this.saveSubscription(subscription, userToken);
      return true;
    } catch (error) {
      console.error("[Push] Subscription error:", error);
      return false;
    }
  }

  /** Unsubscribe from push notifications */
  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.registration) {
        return false;
      }

      const subscription = await this.registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        console.log("[Push] Unsubscribed successfully");
      }

      // Remove from server
      if (this.subscription?.id) {
        await fetch(`${API}/notifications/push/unregister`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${this.token}`,
          },
        });
      }

      this.subscription = null;
      return true;
    } catch (error) {
      console.error("[Push] Unsubscribe error:", error);
      return false;
    }
  }

  /** Save subscription to server */
  private async saveSubscription(
    subscription: globalThis.PushSubscription,
    userToken: string
  ): Promise<void> {
    const jsonSubscription = subscription.toJSON();
    
    const response = await fetch(`${API}/notifications/push/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        endpoint: jsonSubscription.endpoint,
        keys: {
          p256dh: jsonSubscription.keys?.p256dh || "",
          auth: jsonSubscription.keys?.auth || "",
        },
      }),
    });

    if (response.ok) {
      const data = await response.json();
      this.subscription = data.subscription as StoredPushSubscription;
      this.token = userToken;
      console.log("[Push] Subscription saved to server");
    }
  }

  /** Get notification preferences */
  async getPreferences(userToken: string): Promise<NotificationPreferences> {
    try {
      const response = await fetch(`${API}/notifications/preferences`, {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.preferences;
      }
    } catch (error) {
      console.error("[Push] Failed to get preferences:", error);
    }

    // Default preferences
    return {
      enabled: true,
      communityPosts: true,
      communityLikes: true,
      communityComments: true,
      academyEnrollment: true,
      academyCertificate: true,
      marketOrderUpdate: true,
      workApplication: true,
      workContractUpdate: true,
      trustScoreChange: true,
      systemAnnouncements: true,
    };
  }

  /** Update notification preferences */
  async updatePreferences(
    userToken: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    try {
      await fetch(`${API}/notifications/preferences`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify(preferences),
      });
      console.log("[Push] Preferences updated");
    } catch (error) {
      console.error("[Push] Failed to update preferences:", error);
    }
  }

  /** Send test notification */
  async sendTest(userToken: string): Promise<boolean> {
    try {
      const response = await fetch(`${API}/notifications/push/test`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error("[Push] Test notification failed:", error);
      return false;
    }
  }

  /** Convert VAPID key from base64 to Uint8Array */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /** Check if push is supported */
  isSupported(): boolean {
    return "serviceWorker" in navigator && "PushManager" in window;
  }

  /** Get current subscription status */
  getSubscriptionStatus(): { subscribed: boolean; subscription: StoredPushSubscription | null } {
    return {
      subscribed: !!this.subscription,
      subscription: this.subscription,
    };
  }
}

export const pushNotificationService = new PushNotificationService();
export default pushNotificationService;
