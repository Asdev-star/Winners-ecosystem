import React, { useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputSubmitEditingEventData,
} from "react-native";
import * as Linking from "expo-linking";
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Card from "../../components/ui/Card";
import { useAuthStore, type MobileUser } from "../../stores/authStore";
import { ENV } from "../../config/env";
import { RootStackParamList } from "../../navigation/types";
import { colors, radius, spacing, touch, typography, withAlpha } from "../../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

type LoginResponse = {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    tenantId?: string;
    tenantName?: string;
  };
};

function normalizeUser(user: LoginResponse["user"]): MobileUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.toLowerCase() as MobileUser["role"],
    tenantId: user.tenantId,
    tenantName: user.tenantName,
  };
}

export default function LoginScreen({ navigation }: Props) {
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingBiometrics, setCheckingBiometrics] = useState(true);
  const [biometricReady, setBiometricReady] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { hasCompletedOnboarding, login, setToken } = useAuthStore();

  useEffect(() => {
    const initialize = async () => {
      const [hardware, enrolled, biometricEnabled] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        SecureStore.getItemAsync("winners_biometric_enabled"),
      ]);

      const ready = hardware && enrolled;
      setBiometricReady(ready);

      if (ready && biometricEnabled === "true") {
        const success = await attemptBiometricLogin();
        if (success) {
          navigation.reset({
            index: 0,
            routes: [{ name: hasCompletedOnboarding ? "Main" : "Onboarding" }],
          });
          return;
        }
      }

      setCheckingBiometrics(false);
    };

    void initialize();
  }, [hasCompletedOnboarding, navigation, setToken]);

  const attemptBiometricLogin = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();

    if (!compatible || !enrolled) {
      return false;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Verify your identity to access Winners",
      fallbackLabel: "Use password",
      cancelLabel: "Cancel",
    });

    if (!result.success) {
      return false;
    }

    const storedToken = await SecureStore.getItemAsync("winners_jwt");
    if (!storedToken) {
      return false;
    }

    await setToken(storedToken);
    return true;
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Enter your email and password to continue.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${ENV.API_V1_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = (await response.json().catch(() => ({}))) as Partial<LoginResponse> & {
        error?: string;
        message?: string;
      };

      if (!response.ok || !data.token || !data.user) {
        throw new Error(data.error || data.message || "Login failed");
      }

      await login(data.token, normalizeUser(data.user));

      navigation.reset({
        index: 0,
        routes: [{ name: hasCompletedOnboarding ? "Main" : "Onboarding" }],
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (_event: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
    void handleLogin();
  };

  const handleBiometricLogin = async () => {
    setError(null);
    const success = await attemptBiometricLogin();

    if (success) {
      await SecureStore.setItemAsync("winners_biometric_enabled", "true");
      navigation.reset({
        index: 0,
        routes: [{ name: hasCompletedOnboarding ? "Main" : "Onboarding" }],
      });
      return;
    }

    setError("Biometric sign-in is not ready on this device, or no secure session has been saved yet.");
  };

  const handleGoogleLogin = () => {
    void Linking.openURL(`${ENV.API_V1_URL}/auth/google`);
  };

  const handleFacebookLogin = () => {
    void Linking.openURL(`${ENV.API_V1_URL}/auth/facebook`);
  };

  useEffect(() => {
    if (showPasswordForm) {
      const timeout = setTimeout(() => {
        emailRef.current?.focus();
      }, 250);

      return () => clearTimeout(timeout);
    }

    return undefined;
  }, [showPasswordForm]);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>DIGITAL SOVEREIGN{"\n"}INFRASTRUCTURE</Text>
        <Text style={styles.title}>Winners Ecosystem</Text>
        <Text style={styles.subtitle}>Secure mobile access for your ecosystem command center.</Text>
      </View>

      <Card accent="gold">
        <View style={styles.cardStack}>
          <Text style={styles.cardTitle}>Fingerprint sign-in</Text>
          <Text style={styles.cardBody}>
            {checkingBiometrics
              ? "Checking this device for secure biometric access."
              : biometricReady
                ? "This device is ready for secure biometric access."
                : "Biometric sign-in is unavailable on this device, but you can continue with password or social login."}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Login with fingerprint"
            accessibilityHint="Verifies your identity with the device biometric prompt and signs you in."
            disabled={!biometricReady}
            onPress={() => void handleBiometricLogin()}
            style={({ pressed }) => [
              styles.primaryButton,
              !biometricReady && styles.disabledButton,
              pressed && biometricReady && styles.pressedButton,
            ]}
          >
            <Text style={styles.primaryButtonText}>Login with Fingerprint</Text>
          </Pressable>
        </View>
      </Card>

      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>or</Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
        accessibilityHint="Opens the Google sign-in flow in the browser."
        onPress={handleGoogleLogin}
        style={({ pressed }) => [styles.surfaceButton, pressed && styles.surfaceButtonPressed]}
      >
        <Text style={styles.surfaceButtonText}>Continue with Google</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue with Facebook"
        accessibilityHint="Opens the Facebook sign-in flow in the browser."
        onPress={handleFacebookLogin}
        style={({ pressed }) => [styles.surfaceButton, pressed && styles.surfaceButtonPressed]}
      >
        <Text style={styles.surfaceButtonText}>Continue with Facebook</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Setup continue to onboard"
        accessibilityHint="Opens the onboarding flow so you can preview the setup questions."
        onPress={() => navigation.navigate("Onboarding")}
        style={({ pressed }) => [styles.outlineButton, pressed && styles.outlineButtonPressed]}
      >
        <Text style={styles.outlineButtonText}>Setup Continue to onboard</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Continue with password"
        accessibilityHint="Shows the email and password sign-in form."
        onPress={() => setShowPasswordForm((current) => !current)}
        style={({ pressed }) => [styles.textAction, pressed && styles.textActionPressed]}
      >
        <Text style={styles.textActionLabel}>Continue with password</Text>
      </Pressable>

      {showPasswordForm ? (
        <Card accent="blue">
          <View style={styles.formStack}>
            <TextInput
              ref={emailRef}
              accessibilityLabel="Email address"
              accessibilityHint="Enter the email address for your Winners account."
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={setEmail}
              onSubmitEditing={() => passwordRef.current?.focus()}
              placeholder="Email address"
              placeholderTextColor={colors.textDim}
              returnKeyType="next"
              style={styles.input}
              textContentType="username"
              value={email}
            />
            <TextInput
              ref={passwordRef}
              accessibilityLabel="Password"
              accessibilityHint="Enter your password and submit to sign in."
              autoCapitalize="none"
              autoComplete="password"
              onChangeText={setPassword}
              onSubmitEditing={handlePasswordSubmit}
              placeholder="Password"
              placeholderTextColor={colors.textDim}
              returnKeyType="done"
              secureTextEntry
              style={styles.input}
              textContentType="password"
              value={password}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Forgot password"
              accessibilityHint="Opens the password reset screen."
              onPress={() => navigation.navigate("ForgotPassword")}
              style={({ pressed }) => [styles.inlineLink, pressed && styles.textActionPressed]}
            >
              <Text style={styles.inlineLinkText}>Forgot password?</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sign in with password"
              accessibilityHint="Submits your email and password and signs you in."
              disabled={loading}
              onPress={() => void handleLogin()}
              style={({ pressed }) => [
                styles.primaryButton,
                loading && styles.disabledButton,
                pressed && !loading && styles.pressedButton,
              ]}
            >
              <Text style={styles.primaryButtonText}>{loading ? "Signing in..." : "Sign in"}</Text>
            </Pressable>
          </View>
        </Card>
      ) : null}

      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.errorText}>
          {error}
        </Text>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Create a new account"
        accessibilityHint="Opens the registration screen."
        onPress={() => navigation.navigate("Register")}
        style={({ pressed }) => [styles.registerRow, pressed && styles.textActionPressed]}
      >
        <Text style={styles.registerText}>
          Don't have an account? <Text style={styles.registerLink}>Create one →</Text>
        </Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: 80,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.lg,
  },
  eyebrow: {
    ...typography.labelLg,
    color: colors.gold,
    marginBottom: spacing.sm + spacing.xs,
  },
  title: {
    ...typography.displayLg,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.textDim,
  },
  cardStack: {
    gap: spacing.sm,
  },
  cardTitle: {
    ...typography.displaySm,
    color: colors.text,
  },
  cardBody: {
    ...typography.bodyMd,
    color: colors.textDim,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.labelMd,
    color: colors.textDim,
  },
  primaryButton: {
    minHeight: touch.comfortable,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  primaryButtonText: {
    ...typography.labelLg,
    color: colors.bg,
  },
  surfaceButton: {
    minHeight: touch.comfortable,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  surfaceButtonPressed: {
    opacity: 0.88,
  },
  surfaceButtonText: {
    ...typography.labelLg,
    color: colors.text,
  },
  outlineButton: {
    minHeight: touch.comfortable,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  outlineButtonPressed: {
    backgroundColor: withAlpha("gold", 0.08),
  },
  outlineButtonText: {
    ...typography.labelLg,
    color: colors.gold,
  },
  textAction: {
    minHeight: touch.minimum,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.xs,
  },
  textActionPressed: {
    opacity: 0.78,
  },
  textActionLabel: {
    ...typography.bodyMd,
    color: colors.textDim,
  },
  formStack: {
    gap: spacing.sm,
  },
  input: {
    minHeight: touch.comfortable,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.md,
    color: colors.text,
    ...typography.bodyMd,
  },
  inlineLink: {
    minHeight: touch.minimum,
    justifyContent: "center",
    alignSelf: "flex-end",
  },
  inlineLinkText: {
    ...typography.bodySm,
    color: colors.textDim,
  },
  errorText: {
    ...typography.bodySm,
    color: colors.red,
    marginTop: spacing.sm,
  },
  registerRow: {
    minHeight: touch.minimum,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.lg,
  },
  registerText: {
    ...typography.bodyMd,
    color: colors.textDim,
  },
  registerLink: {
    color: colors.gold,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.45,
  },
  pressedButton: {
    opacity: 0.88,
  },
});
