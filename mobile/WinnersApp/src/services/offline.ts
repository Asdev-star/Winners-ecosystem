import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNetInfo } from "@react-native-community/netinfo";

const OFFLINE_QUEUE_KEY = "winners-mobile-offline-queue";

export interface OfflineAction {
  id: string;
  type: "message" | "checkout" | "lesson-download" | "profile-update";
  payload: Record<string, unknown>;
  createdAt: string;
}

export function useNetworkStatus() {
  const netInfo = useNetInfo();
  return {
    isOnline: Boolean(netInfo.isConnected && netInfo.isInternetReachable !== false),
    netInfo,
  };
}

export async function getOfflineQueue(): Promise<OfflineAction[]> {
  const raw = await AsyncStorage.getItem(OFFLINE_QUEUE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as OfflineAction[];
  } catch {
    return [];
  }
}

export async function queueOfflineAction(action: OfflineAction) {
  const queue = await getOfflineQueue();
  queue.push(action);
  await AsyncStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  return queue;
}

export async function flushOfflineQueue(
  handler: (action: OfflineAction) => Promise<void>,
) {
  const queue = await getOfflineQueue();

  for (const action of queue) {
    await handler(action);
  }

  await AsyncStorage.removeItem(OFFLINE_QUEUE_KEY);
}
