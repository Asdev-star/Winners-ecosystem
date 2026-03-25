import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Card from "../../components/ui/Card";
import { ENV } from "../../config/env";
import { RootStackParamList } from "../../navigation/types";
import { colors, radius, spacing, touch, typography } from "../../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "ForgotPassword">;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError("Enter your email address to receive a reset link.");
      return;
    }

    setSending(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`${ENV.API_V1_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = (await response.json().catch(() => ({}))) as { message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset link");
      }

      setMessage(data.message || "If that email exists, a reset link has been sent.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Failed to send reset link");
    } finally {
      setSending(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to login"
        accessibilityHint="Returns to the sign-in screen."
        onPress={() => navigation.navigate("Login")}
        style={({ pressed }) => [styles.backButton, pressed && styles.linkPressed]}
      >
        <Text style={styles.backButtonText}>Back to login</Text>
      </Pressable>

      <Text style={styles.eyebrow}>PASSWORD RESET</Text>
      <Text style={styles.title}>Reset your password</Text>
      <Text style={styles.subtitle}>Enter your email and we'll send you a secure reset link.</Text>

      <Card accent="gold">
        <View style={styles.formStack}>
          <TextInput
            accessibilityLabel="Email address"
            accessibilityHint="Enter the email address that should receive the password reset link."
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor={colors.textDim}
            returnKeyType="done"
            style={styles.input}
            textContentType="emailAddress"
            value={email}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send reset link"
            accessibilityHint="Sends a password reset link to the email address you entered."
            disabled={sending}
            onPress={() => void handleSubmit()}
            style={({ pressed }) => [
              styles.primaryButton,
              sending && styles.disabledButton,
              pressed && !sending && styles.primaryPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>{sending ? "Sending..." : "Send Reset Link"}</Text>
          </Pressable>
        </View>
      </Card>

      {message ? (
        <Card accent="green">
          <Text style={styles.confirmationTitle}>Reset link sent</Text>
          <Text style={styles.confirmationBody}>{message}</Text>
        </Card>
      ) : null}

      {error ? (
        <Text accessibilityLiveRegion="polite" style={styles.errorText}>
          {error}
        </Text>
      ) : null}
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
  confirmationTitle: {
    ...typography.displaySm,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  confirmationBody: {
    ...typography.bodyMd,
    color: colors.textDim,
  },
  errorText: {
    ...typography.bodySm,
    color: colors.red,
    marginTop: spacing.sm,
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
