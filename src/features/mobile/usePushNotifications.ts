import { useState, useEffect, useCallback } from 'react';

export const usePushNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const getSubscription = useCallback(async () => {
    if (!('serviceWorker' in navigator)) return null;

    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
      return sub;
    } catch (error) {
      console.error('[Push] Failed to get subscription:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    getSubscription();
  }, [getSubscription]);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('[Push] Notifications not supported');
      return 'denied';
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  };

  const subscribe = async (vapidPublicKey: string) => {
    if (!('serviceWorker' in navigator)) return null;

    setIsSubscribing(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey,
      });

      setSubscription(sub);
      
      // Here you would typically send the subscription to your server
      // await sendSubscriptionToServer(sub);
      
      return sub;
    } catch (error) {
      console.error('[Push] Subscription failed:', error);
      return null;
    } finally {
      setIsSubscribing(false);
    }
  };

  const unsubscribe = async () => {
    if (!subscription) return true;

    try {
      await subscription.unsubscribe();
      setSubscription(null);
      // Notify server
      // await removeSubscriptionFromServer(subscription);
      return true;
    } catch (error) {
      console.error('[Push] Unsubscription failed:', error);
      return false;
    }
  };

  return {
    permission,
    subscription,
    isSubscribing,
    requestPermission,
    subscribe,
    unsubscribe,
  };
};