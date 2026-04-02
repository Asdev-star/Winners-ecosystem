import { usePushNotifications as useMobilePushNotifications } from "../features/mobile/usePushNotifications";

export interface PushState {
  supported: boolean;
  permission: NotificationPermission | "unsupported";
  subscribed: boolean;
  loading: boolean;
  error: string | null;
}

export function usePushNotifications() {
  const {
    supported,
    permission,
    subscribed,
    isSubscribing,
    error,
    subscribe,
    unsubscribe,
  } = useMobilePushNotifications();

  return {
    supported,
    permission: supported ? permission : "unsupported",
    subscribed,
    loading: isSubscribing,
    error,
    subscribe: async () => Boolean(await subscribe()),
    unsubscribe,
  } satisfies PushState & {
    subscribe: () => Promise<boolean>;
    unsubscribe: () => Promise<boolean>;
  };
}
