import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { TabNavigator } from "./TabNavigator";
import { RootStackParamList } from "./types";
import { useAuthStore } from "../stores/authStore";
import LoginScreen from "../screens/auth/LoginScreen";
import RegisterScreen from "../screens/auth/RegisterScreen";
import ForgotPasswordScreen from "../screens/auth/ForgotPasswordScreen";
import OnboardingScreen from "../screens/auth/OnboardingScreen";
import ProfileScreen from "../screens/system/ProfileScreen";
import SettingsScreen from "../screens/system/SettingsScreen";
import NotificationsScreen from "../screens/system/NotificationsScreen";
import MessagesScreen from "../screens/system/MessagesScreen";
import Skeleton from "../components/ui/Skeleton";
import { colors, spacing } from "../theme/tokens";

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
        <View style={styles.loadingCard}>
          <Skeleton height={20} width="42%" />
          <Skeleton height={56} />
          <Skeleton height={56} />
          <Skeleton height={48} width="68%" />
        </View>
      </View>
    );
  }

  const needsAuth = !user;
  const needsOnboarding = Boolean(user) && !hasCompletedOnboarding;

  return (
    <Stack.Navigator
      initialRouteName={needsAuth ? "Login" : needsOnboarding ? "Onboarding" : "Main"}
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      {needsAuth ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        </>
      ) : needsOnboarding ? (
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
      ) : (
        <>
          <Stack.Screen name="Main" component={TabNavigator} options={{ headerShown: false }} />
          <Stack.Group screenOptions={{ presentation: "modal" }}>
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
            <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Notifications" }} />
            <Stack.Screen name="Messages" component={MessagesScreen} options={{ title: "Messages" }} />
          </Stack.Group>
        </>
      )}
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  loadingCard: {
    width: "100%",
    gap: spacing.md,
  },
});
