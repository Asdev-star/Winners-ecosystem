import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Fingerprint, ShieldCheck } from "lucide-react-native";
import { biometric, BiometricStatus } from "../../services/biometric";
import { useAuthStore } from "../../stores/authStore";
import { RootStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

const LoginScreen = ({ navigation }: Props) => {
  const login = useAuthStore((state) => state.login);
  const [authenticating, setAuthenticating] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus>({
    available: false,
    enrolled: false,
    label: "Biometric",
  });
  const [message, setMessage] = useState("Secure mobile access for your ecosystem command center.");

  useEffect(() => {
    void biometric.getStatus().then(setBiometricStatus);
  }, []);

  const handleBiometricLogin = async () => {
    setAuthenticating(true);
    const result = await biometric.authenticate("Unlock Winners Ecosystem");
    if (result.success) {
      await login("biometric");
    } else {
      setMessage(result.reason ?? "Authentication did not complete.");
    }
    setAuthenticating(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>Digital Sovereign Infrastructure</Text>
          <Text style={styles.title}>Winners Ecosystem</Text>
          <Text style={styles.body}>{message}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.row}>
            <Fingerprint color="#C9A84C" size={22} />
            <View style={styles.rowText}>
              <Text style={styles.cardTitle}>{biometricStatus.label} sign-in</Text>
              <Text style={styles.cardBody}>
                {biometricStatus.available && biometricStatus.enrolled
                  ? "This device is ready for secure biometric access."
                  : "Biometrics are not configured yet. Continue with onboarding to prepare the app."}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            activeOpacity={0.9}
            disabled={!biometricStatus.available || !biometricStatus.enrolled || authenticating}
            onPress={() => void handleBiometricLogin()}
            style={[styles.primaryButton, (!biometricStatus.available || !biometricStatus.enrolled) && styles.disabled]}
          >
            {authenticating ? (
              <ActivityIndicator color="#0D1520" />
            ) : (
              <Text style={styles.primaryButtonText}>Login with {biometricStatus.label}</Text>
            )}
          </TouchableOpacity>

          <Pressable onPress={() => navigation.navigate("Onboarding")} style={styles.secondaryButton}>
            <ShieldCheck color="#E8EEF5" size={16} />
            <Text style={styles.secondaryButtonText}>Continue to onboarding</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0D1520",
  },
  container: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  hero: {
    gap: 14,
    marginTop: 32,
  },
  kicker: {
    color: "#C9A84C",
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    fontWeight: "700",
  },
  title: {
    color: "#E8EEF5",
    fontSize: 34,
    fontWeight: "800",
  },
  body: {
    color: "#9AB1C6",
    fontSize: 15,
    lineHeight: 24,
  },
  card: {
    backgroundColor: "#111D2E",
    borderWidth: 1,
    borderColor: "#1E3248",
    borderRadius: 20,
    padding: 20,
    gap: 18,
  },
  row: {
    flexDirection: "row",
    gap: 14,
  },
  rowText: {
    flex: 1,
    gap: 6,
  },
  cardTitle: {
    color: "#E8EEF5",
    fontSize: 16,
    fontWeight: "700",
  },
  cardBody: {
    color: "#8FA6BA",
    fontSize: 14,
    lineHeight: 21,
  },
  primaryButton: {
    backgroundColor: "#C9A84C",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
  },
  disabled: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: "#0D1520",
    fontSize: 16,
    fontWeight: "800",
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#29415D",
    minHeight: 50,
  },
  secondaryButtonText: {
    color: "#E8EEF5",
    fontSize: 14,
    fontWeight: "700",
  },
});

export default LoginScreen;
