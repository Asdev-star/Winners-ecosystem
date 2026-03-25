import "react-native-gesture-handler";
import React, { useEffect, useRef, useState } from "react";
import { NavigationContainer, DefaultTheme, useNavigationContainerRef } from "@react-navigation/native";
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

    const registerNotifications = async () => {
      const registration = await fcm.register(user.id);
      if (!registration) {
        return;
      }

      await api.post("/notifications/device-token", {
        token: registration.token,
        platform: registration.platform,
      });
    };

    void registerNotifications();

    const subscription = fcm.listen(() => {
      // Foreground notification handling can expand into an in-app inbox or toast layer.
    });

    return () => {
      subscription.remove();
    };
  }, [user]);

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
