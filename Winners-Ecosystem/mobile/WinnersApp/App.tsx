import "react-native-gesture-handler";

import React, { useEffect } from "react";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { StripeProvider } from "@stripe/stripe-react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RootNavigator } from "./src/navigation/RootNavigator";
import { linking } from "./src/navigation/linking";
import { offline } from "./src/services/offline";

const winnersTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: "#C9A84C",
    background: "#0D1520",
    card: "#111D2E",
    text: "#E8EEF5",
    border: "#1E3248",
    notification: "#C9A84C",
  },
};

export default function App() {
  useEffect(() => {
    offline.restore();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StripeProvider
          merchantIdentifier="merchant.com.winners.ecosystem"
          publishableKey={process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "pk_test_winners_placeholder"}
          urlScheme="winners"
        >
          <NavigationContainer linking={linking} theme={winnersTheme}>
            <StatusBar style="light" backgroundColor="#0D1520" />
            <RootNavigator />
          </NavigationContainer>
        </StripeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
