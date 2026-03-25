import React from "react";
import { Bell, BellOff, CircleAlert } from "lucide-react";
import Card from "../../components/ui/Card";
import { usePushNotifications } from "./usePushNotifications";

export const PushPermission: React.FC = () => {
  const {
    error,
    isSubscribing,
    permission,
    requestPermission,
    subscribe,
    subscribed,
    supported,
    unsubscribe,
  } = usePushNotifications();

  if (!supported) {
    return null;
  }

  const handleEnable = async () => {
    const nextPermission = await requestPermission();
    if (nextPermission === "granted") {
      await subscribe();
    }
  };

  return (
    <Card title="Push Notifications" subtitle="REAL-TIME MOBILE ENGAGEMENT" accent="blue">
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ margin: 0, fontSize: 14, color: "var(--text-dim)", lineHeight: 1.6 }}>
          Stay in sync with community replies, academy reminders, order updates, and ARIA briefings even when the app
          is not in the foreground.
        </p>

        {permission === "denied" ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: 12,
              borderRadius: 8,
              background: "rgba(201, 168, 76, 0.08)",
              border: "1px solid var(--border)",
              color: "var(--text)",
            }}
          >
            <CircleAlert size={16} />
            <span style={{ fontSize: 13 }}>
              Notifications are blocked in this browser. Re-enable them in site settings to receive alerts.
            </span>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => {
            void (subscribed ? unsubscribe() : handleEnable());
          }}
          disabled={isSubscribing || permission === "denied"}
          style={{
            background: subscribed ? "transparent" : "var(--blue)",
            border: subscribed ? "1px solid var(--border)" : "none",
            color: subscribed ? "var(--text)" : "white",
            padding: "10px 16px",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            cursor: isSubscribing || permission === "denied" ? "not-allowed" : "pointer",
            opacity: isSubscribing || permission === "denied" ? 0.7 : 1,
            fontWeight: 700,
          }}
        >
          {subscribed ? <BellOff size={16} /> : <Bell size={16} />}
          {isSubscribing ? "Updating..." : subscribed ? "Disable Notifications" : "Enable Notifications"}
        </button>

        {error ? <span style={{ fontSize: 12, color: "var(--red)" }}>{error}</span> : null}
      </div>
    </Card>
  );
};
