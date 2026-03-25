import React, { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Card from "../../components/ui/Card";
import { ENV } from "../../config/env";
import { RootStackParamList } from "../../navigation/types";
import { useAuthStore, type MobileUser } from "../../stores/authStore";
import { colors, radius, spacing, touch, typography } from "../../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "Register">;

type RegisterResponse = {
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

function normalizeUser(user: RegisterResponse["user"]): MobileUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role.toLowerCase() as MobileUser["role"],
    tenantId: user.tenantId,
    tenantName: user.tenantName,
  };
}

function getPasswordStrength(password: string) {
  const hasMixedCase = /[a-z]/.test(password) && /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (password.length < 8) {
    return { label: "Weak", color: colors.red, width: "33%" as const };
  }

  if (hasMixedCase && hasNumber && hasSpecial) {
    return { label: "Strong", color: colors.green, width: "100%" as const };
  }

  return { label: "Fair", color: colors.gold, width: "66%" as const };
}

export default function RegisterScreen({ navigation }: Props) {
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuthStore();

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const emailValid = /\S+@\S+\.\S+/.test(email.trim());
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  const canSubmit =
    fullName.trim().length > 1 && emailValid && password.length >= 8 && passwordsMatch && !submitting;

  const handleRegister = async () => {
    if (!canSubmit) {
      setError("Finish all required fields before creating your account.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${ENV.API_V1_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as Partial<RegisterResponse> & {
        error?: string;
        message?: string;
      };

      if (!response.ok || !data.token || !data.user) {
        throw new Error(data.error || data.message || "Registration failed");
      }

      await login(data.token, normalizeUser(data.user));
      navigation.reset({
        index: 0,
        routes: [{ name: "Onboarding" }],
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to login"
        accessibilityHint="Returns to the sign-in screen."
        onPress={() => navigation.navigate("Login")}
        style={({ pressed }) => [styles.backButton, pressed && styles.linkPressed]}
      >
        <Text style={styles.backButtonText}>Back to login</Text>
      </Pressable>

      <Text style={styles.eyebrow}>ACCOUNT SETUP</Text>
      <Text style={styles.title}>Create your Winners access</Text>
      <Text style={styles.subtitle}>Set up your identity, then continue into the OMEGA onboarding flow.</Text>

      <Card accent="gold">
        <View style={styles.formStack}>
          <TextInput
            accessibilityLabel="Full name"
            accessibilityHint="Enter your full name as you want it shown in Winners."
            autoCapitalize="words"
            autoComplete="name"
            onChangeText={setFullName}
            onSubmitEditing={() => emailRef.current?.focus()}
            placeholder="Full Name"
            placeholderTextColor={colors.textDim}
            returnKeyType="next"
            style={styles.input}
            textContentType="name"
            value={fullName}
          />
          <TextInput
            ref={emailRef}
            accessibilityLabel="Email address"
            accessibilityHint="Enter the email address for your account."
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={setEmail}
            onSubmitEditing={() => passwordRef.current?.focus()}
            placeholder="Email"
            placeholderTextColor={colors.textDim}
            returnKeyType="next"
            style={styles.input}
            textContentType="emailAddress"
            value={email}
          />
          <TextInput
            ref={passwordRef}
            accessibilityLabel="Password"
            accessibilityHint="Enter a secure password for your new account."
            autoCapitalize="none"
            autoComplete="new-password"
            onChangeText={setPassword}
            onSubmitEditing={() => confirmRef.current?.focus()}
            placeholder="Password"
            placeholderTextColor={colors.textDim}
            returnKeyType="next"
            secureTextEntry
            style={styles.input}
            textContentType="newPassword"
            value={password}
          />

          <View accessibilityLiveRegion="polite" style={styles.strengthWrap}>
            <View style={styles.strengthTrack}>
              <View style={[styles.strengthFill, { width: passwordStrength.width, backgroundColor: passwordStrength.color }]} />
            </View>
            <Text style={[styles.strengthLabel, { color: passwordStrength.color }]}>
              Password strength: {passwordStrength.label}
            </Text>
          </View>

          <TextInput
            ref={confirmRef}
            accessibilityLabel="Confirm password"
            accessibilityHint="Re-enter your password to confirm it matches."
            autoCapitalize="none"
            autoComplete="new-password"
            onChangeText={setConfirmPassword}
            onSubmitEditing={() => void handleRegister()}
            placeholder="Confirm Password"
            placeholderTextColor={colors.textDim}
            returnKeyType="done"
            secureTextEntry
            style={styles.input}
            textContentType="newPassword"
            value={confirmPassword}
          />

          {!passwordsMatch && confirmPassword.length > 0 ? (
            <Text accessibilityLiveRegion="polite" style={styles.errorText}>
              Passwords must match before you can continue.
            </Text>
          ) : null}

          {error ? (
            <Text accessibilityLiveRegion="polite" style={styles.errorText}>
              {error}
            </Text>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create account"
            accessibilityHint="Creates your Winners account and moves you into onboarding."
            disabled={!canSubmit}
            onPress={() => void handleRegister()}
            style={({ pressed }) => [
              styles.primaryButton,
              !canSubmit && styles.disabledButton,
              pressed && canSubmit && styles.primaryPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>{submitting ? "Creating account..." : "Create account"}</Text>
          </Pressable>
        </View>
      </Card>
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
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  backButton: {
    minHeight: touch.minimum,
    justifyContent: "center",
    alignSelf: "flex-start",
    marginBottom: spacing.sm,
  },
  backButtonText: {
    ...typography.labelLg,
    color: colors.textDim,
  },
  eyebrow: {
    ...typography.labelLg,
    color: colors.gold,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.displayLg,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.bodyMd,
    color: colors.textDim,
    marginBottom: spacing.lg,
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
  strengthWrap: {
    gap: spacing.xs,
  },
  strengthTrack: {
    height: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface2,
    overflow: "hidden",
  },
  strengthFill: {
    height: "100%",
    borderRadius: radius.full,
  },
  strengthLabel: {
    ...typography.bodySm,
  },
  errorText: {
    ...typography.bodySm,
    color: colors.red,
  },
  primaryButton: {
    minHeight: touch.comfortable,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    marginTop: spacing.xs,
  },
  primaryButtonText: {
    ...typography.labelLg,
    color: colors.bg,
  },
  disabledButton: {
    opacity: 0.4,
  },
  primaryPressed: {
    opacity: 0.88,
  },
  linkPressed: {
    opacity: 0.76,
  },
});
