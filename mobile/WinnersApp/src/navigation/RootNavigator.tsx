import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import TabNavigator from "./TabNavigator";
import LoginScreen from "../screens/auth/LoginScreen";
import OnboardingScreen from "../screens/auth/OnboardingScreen";
import { configurePushNotifications } from "../services/fcm";

export type RootStackParamList = {
  Login: undefined;
  Onboarding: undefined;
  AppTabs: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const [booting, setBooting] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setBooting(false), 450);
    void configurePushNotifications();
    return () => clearTimeout(timer);
  }, []);

  if (booting) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator size="large" color="#C9A84C" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!authenticated ? (
        <Stack.Screen name="Login">
          {() => (
            <LoginScreen
              onLoginSuccess={() => setAuthenticated(true)}
              onBiometricSuccess={() => {
                setAuthenticated(true);
                setOnboardingComplete(true);
              }}
            />
          )}
        </Stack.Screen>
      ) : !onboardingComplete ? (
        <Stack.Screen name="Onboarding">
          {() => (
            <OnboardingScreen
              onComplete={() => setOnboardingComplete(true)}
            />
          )}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="AppTabs" component={TabNavigator} />
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: "#0D1520",
    alignItems: "center",
    justifyContent: "center",
  },
});
