import "react-native-gesture-handler";
import React, { useEffect, useRef, useState } from "react";
import { Alert, NavigationContainer, DefaultTheme, useNavigationContainerRef } from "@react-navigation/native";
import { StripeProvider } from "@stripe/stripe-react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import NetInfo from "@react-native-community/netinfo";
import QAOverlay from "./src/components/system/QAOverlay";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { RootStackParamList } from "./src/navigation/types";
import { env } from "./src/config/env";
import { linking } from "./src/navigation/linking";
import OfflineBanner from "./src/components/shared/OfflineBanner";
import { api } from "./src/services/api";
import { fcm } from "./src/services/fcm";
import { offline } from "./src/services/offline";
import { useAuthStore } from "./src/stores/authStore";
import { useAppShellStore } from "./src/stores/appShellStore";
import { useQAStore } from "./src/stores/qaStore";
import { colors } from "./src/theme/tokens";

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    primary: colors.gold,
    border: colors.border,
    notification: colors.red,
  },
};

export default function App() {
  const user = useAuthStore((state) => state.user);
  const addNotification = useAppShellStore((state) => state.addNotification);
  const markNotificationRead = useAppShellStore((state) => state.markNotificationRead);
  const navigationRef = useNavigationContainerRef<RootStackParamList>();
  const routeNameRef = useRef<string | undefined>(undefined);
  const [offlineSnapshot, setOfflineSnapshot] = useState(offline.getSnapshot());
  const markAppReady = useQAStore((state) => state.markAppReady);
  const completeNavigation = useQAStore((state) => state.completeNavigation);

  useEffect(() => offline.subscribe(setOfflineSnapshot), []);

  useEffect(() => {
    offline.restore();

    const unsubscribe = NetInfo.addEventListener((state) => {
      const isOnline = Boolean(state.isConnected) && state.isInternetReachable !== false;
      offline.setOnline(isOnline);

      if (isOnline && offline.getSnapshot().queue.length > 0) {
        void api.flushQueuedRequests();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;
    let notificationSubscription: { remove: () => void } | null = null;

    const registerNotifications = async () => {
      try {
        const registration = await fcm.register(user.id);
        if (!registration || !active) {
          return;
        }

        await api.post("/notifications/device-token", {
          token: registration.token,
          platform: registration.platform,
        });
      } catch (error) {
        console.warn("[fcm] Mobile push registration failed:", error);
      }
    };

    void registerNotifications();

    notificationSubscription = fcm.listen((notification) => {
      const content = notification.request.content;
      const notifId = content.data?.notificationId ? String(content.data.notificationId) : `push-${Date.now()}`;
      const targetUrl = content.data?.url;
      
      addNotification({
        id: notifId,
        title: content.title ?? "Winners",
        body: content.body ?? "",
        timestamp: new Date().toISOString(),
        read: false,
        accent: "blue",
        target: targetUrl ? { type: "ai" } : { type: "ai" },
      });

      Alert.alert(
        content.title ?? "Winners",
        content.body ?? "",
        [
          { 
            text: "View", 
            onPress: async () => {
              markNotificationRead(notifId);
              try {
                await api.patch(`/notifications/${notifId}/read`, {});
              } catch {}
              navigationRef.navigate("Main", { screen: "AI", params: { screen: "Hub" } });
            } 
          },
          { 
            text: "Dismiss", 
            style: "cancel",
            onPress: async () => {
              markNotificationRead(notifId);
              try {
                await api.patch(`/notifications/${notifId}/read`, {});
              } catch {}
            }
          }
        ],
        { cancelable: true }
      );
    });

    return () => {
      active = false;
      notificationSubscription?.remove();
    };
  }, [addNotification, user]);

  const content = (
    <SafeAreaProvider>
      <NavigationContainer
        ref={navigationRef}
        linking={linking}
        theme={theme}
        onReady={() => {
          const routeName = navigationRef.getCurrentRoute()?.name ?? "Unknown";
          routeNameRef.current = routeName;
          markAppReady(routeName);
        }}
        onStateChange={() => {
          const routeName = navigationRef.getCurrentRoute()?.name ?? "Unknown";

          if (routeNameRef.current !== routeName) {
            routeNameRef.current = routeName;
            completeNavigation(routeName);
          }
        }}
      >
        <StatusBar style="light" />
        <OfflineBanner
          isOnline={offlineSnapshot.isOnline}
          isSyncing={offlineSnapshot.isSyncing}
          pendingCount={offlineSnapshot.queue.length}
          onSync={() => {
            void api.flushQueuedRequests();
          }}
        />
        <RootNavigator />
        {env.enableQaOverlay ? <QAOverlay /> : null}
      </NavigationContainer>
    </SafeAreaProvider>
  );

  if (!env.stripePublishableKey) {
    return content;
  }

  return <StripeProvider publishableKey={env.stripePublishableKey}>{content}</StripeProvider>;
}
