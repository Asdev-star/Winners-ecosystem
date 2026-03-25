import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type RegisteredDeviceToken = {
  userId: string;
  token: string;
  platform: string;
  provider: "native" | "expo";
  deviceName: string;
};

export const fcm = {
  async register(userId: string): Promise<RegisteredDeviceToken | null> {
    const existingPermission = await Notifications.getPermissionsAsync();
    const isGranted = (permission: Notifications.NotificationPermissionsStatus) => {
      const permissionShape = permission as unknown as {
        granted?: boolean;
        status?: string;
        ios?: { status?: number };
      };

      return (
        permissionShape.granted === true ||
        permissionShape.status === "granted" ||
        permissionShape.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
        permissionShape.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
      );
    };
    const permission =
      isGranted(existingPermission)
        ? existingPermission
        : await Notifications.requestPermissionsAsync();

    if (!isGranted(permission) || !Device.isDevice) {
      return null;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const nativePushToken = await Notifications.getDevicePushTokenAsync().catch(() => null);
    const token = typeof nativePushToken?.data === "string" ? nativePushToken.data : null;

    if (!token) {
      return null;
    }

    return {
      userId,
      token,
      platform: Platform.OS,
      provider: "native",
      deviceName: Device.deviceName ?? Device.modelName ?? "Unknown device",
    };
  },

  listen(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  },
};
