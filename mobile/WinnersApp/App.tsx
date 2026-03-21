import "react-native-gesture-handler";
import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import RootNavigator from "./src/navigation/RootNavigator";
import linking from "./src/navigation/linking";
import OfflineBanner from "./src/components/shared/OfflineBanner";

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#0D1520",
    card: "#162131",
    text: "#F5F7FA",
    primary: "#C9A84C",
    border: "#223247",
    notification: "#D66C6C",
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer linking={linking} theme={theme}>
        <StatusBar style="light" />
        <OfflineBanner />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
