import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { authenticateWithBiometrics } from "../../services/biometric";
import { registerDevicePushToken } from "../../services/fcm";

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onBiometricSuccess: () => void;
}

export default function LoginScreen({
  onLoginSuccess,
  onBiometricSuccess,
}: LoginScreenProps) {
  const [email, setEmail] = useState("founder@winners.io");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("Use your account or unlock with biometrics.");

  async function handleLogin() {
    setBusy(true);
    setStatus("Signing in and preparing mobile session...");
    await registerDevicePushToken();
    setBusy(false);
    onLoginSuccess();
  }

  async function handleBiometricLogin() {
    setBusy(true);
    const result = await authenticateWithBiometrics();

    if (result.success) {
      await registerDevicePushToken();
      setBusy(false);
      onBiometricSuccess();
      return;
    }

    setStatus(result.reason ?? "Biometric authentication failed.");
    setBusy(false);
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <View style={styles.panel}>
        <Text style={styles.kicker}>Winners Mobile</Text>
        <Text style={styles.title}>Digital sovereignty in your pocket</Text>
        <Text style={styles.copy}>
          Sign in to access community, academy, market, work, and ARIA from one native shell.
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          placeholder="Email"
          placeholderTextColor="#6F849C"
          style={styles.input}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="Password"
          placeholderTextColor="#6F849C"
          style={styles.input}
        />

        <Pressable onPress={handleLogin} style={[styles.primaryButton, busy && styles.buttonMuted]}>
          <Text style={styles.primaryButtonText}>{busy ? "Preparing..." : "Continue"}</Text>
        </Pressable>

        <Pressable onPress={handleBiometricLogin} style={styles.secondaryButton}>
          <Text style={styles.secondaryButtonText}>Unlock with Face ID / Fingerprint</Text>
        </Pressable>

        <Text style={styles.status}>{status}</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0D1520",
    justifyContent: "center",
    padding: 24,
  },
  panel: {
    backgroundColor: "#162131",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#223247",
    padding: 24,
    gap: 14,
  },
  kicker: {
    color: "#C9A84C",
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: "#F5F7FA",
    fontSize: 28,
    fontWeight: "800",
    lineHeight: 34,
  },
  copy: {
    color: "#93A4B8",
    fontSize: 15,
    lineHeight: 22,
  },
  input: {
    backgroundColor: "#0F1A28",
    borderColor: "#223247",
    borderWidth: 1,
    borderRadius: 14,
    color: "#F5F7FA",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  primaryButton: {
    backgroundColor: "#C9A84C",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonMuted: {
    opacity: 0.75,
  },
  primaryButtonText: {
    color: "#0D1520",
    fontWeight: "900",
    fontSize: 14,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#3B546D",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#F5F7FA",
    fontWeight: "700",
    fontSize: 13,
  },
  status: {
    color: "#93A4B8",
    fontSize: 12,
    lineHeight: 18,
  },
});
