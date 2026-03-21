import { useState, useEffect, useCallback } from 'react';

export const useOfflineSync = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const requestSync = useCallback(async (tag: string) => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        // @ts-ignore - sync is not in standard ServiceWorkerRegistration type
        await registration.sync.register(tag);
        console.log(`[OfflineSync] Sync registered for tag: ${tag}`);
        return true;
      } catch (error) {
        console.error(`[OfflineSync] Sync registration failed for tag: ${tag}`, error);
        return false;
      }
    } else {
      console.warn('[OfflineSync] Background Sync not supported');
      return false;
    }
  }, []);

  return { isOnline, isSyncing, requestSync };
};