import Constants from "expo-constants";
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

export const fcm = {
  async register(userId: string) {
    const existingPermission = await Notifications.getPermissionsAsync();
    const permission =
      existingPermission.status === "granted"
        ? existingPermission
        : await Notifications.requestPermissionsAsync();

    if (permission.status !== "granted" || !Device.isDevice) {
      return null;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const token = (
      await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)
    ).data;

    return {
      userId,
      token,
      platform: Platform.OS,
      deviceName: Device.deviceName ?? Device.modelName ?? "Unknown device",
    };
  },

  listen(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  },
};
