import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TabNavigator } from "./TabNavigator";
import { RootStackParamList } from "./types";
import { useAuthStore } from "../stores/authStore";
import LoginScreen from "../screens/auth/LoginScreen";
import OnboardingScreen from "../screens/auth/OnboardingScreen";
import PostScreen from "../screens/community/PostScreen";
import LessonScreen from "../screens/academy/LessonScreen";
import CheckoutScreen from "../screens/market/CheckoutScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator = () => {
  const hasCompletedOnboarding = useAuthStore((state) => state.hasCompletedOnboarding);
  const isRestoring = useAuthStore((state) => state.isRestoring);
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  if (isRestoring) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#C9A84C" size="large" />
      </View>
    );
  }

  const needsAuth = !user;
  const needsOnboarding = !!user && !hasCompletedOnboarding;

  return (
    <Stack.Navigator
      initialRouteName={needsAuth ? "Login" : needsOnboarding ? "Onboarding" : "Main"}
      screenOptions={{
        headerStyle: { backgroundColor: "#111D2E" },
        headerTintColor: "#E8EEF5",
        contentStyle: { backgroundColor: "#0D1520" },
      }}
    >
      {needsAuth ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ title: "Get Started" }} />
        </>
      ) : needsOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ title: "Get Started" }} />
      ) : (
        <>
          <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="Post" component={PostScreen} options={{ title: "Community Post" }} />
          <Stack.Screen name="Lesson" component={LessonScreen} options={{ title: "Lesson Player" }} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: "Checkout" }} />
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: "#0D1520",
    alignItems: "center",
    justifyContent: "center",
  },
});
