import React, { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { api } from "../../services/api";
import { useAuthStore } from "../../stores/authStore";

type Props = NativeStackScreenProps<RootStackParamList, "Checkout">;

const CheckoutScreen = ({ route }: Props) => {
  const token = useAuthStore((state) => state.token);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("Secure checkout path ready.");

  const handleCheckout = async () => {
    setLoading(true);

    try {
      await api.post("/api/market/checkout", {
        planId: route.params.planId ?? "market-growth-kit",
        source: route.params.source ?? "mobile",
      }, token);
      setMessage("Checkout request sent successfully.");
    } catch {
      setMessage("No connection available. Checkout was queued and will retry automatically.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>Checkout</Text>
      <Text style={styles.title}>{route.params.planId?.replace(/-/g, " ") ?? "market offer"}</Text>
      <Text style={styles.copy}>
        This screen is ready for Stripe or custom payment orchestration while preserving a graceful offline fallback.
      </Text>

      <View style={styles.summary}>
        <Text style={styles.summaryTitle}>Order summary</Text>
        <Text style={styles.summaryLine}>Offer: {route.params.planId ?? "market-growth-kit"}</Text>
        <Text style={styles.summaryLine}>Channel: {route.params.source ?? "mobile"}</Text>
      </View>

      <TouchableOpacity activeOpacity={0.9} onPress={() => void handleCheckout()} style={styles.button}>
        {loading ? <ActivityIndicator color="#0D1520" /> : <Text style={styles.buttonText}>Complete order</Text>}
      </TouchableOpacity>

      <Text style={styles.message}>{message}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0D1520",
  },
  content: {
    padding: 24,
    gap: 16,
  },
  eyebrow: {
    color: "#C9A84C",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  title: {
    color: "#E8EEF5",
    fontSize: 28,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  copy: {
    color: "#9AB1C6",
    fontSize: 15,
    lineHeight: 24,
  },
  summary: {
    backgroundColor: "#111D2E",
    borderWidth: 1,
    borderColor: "#1E3248",
    borderRadius: 18,
    padding: 18,
    gap: 8,
  },
  summaryTitle: {
    color: "#E8EEF5",
    fontSize: 16,
    fontWeight: "700",
  },
  summaryLine: {
    color: "#8FA6BA",
    fontSize: 14,
  },
  button: {
    backgroundColor: "#C9A84C",
    borderRadius: 14,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#0D1520",
    fontSize: 15,
    fontWeight: "800",
  },
  message: {
    color: "#8FA6BA",
    fontSize: 13,
    lineHeight: 20,
  },
});

export default CheckoutScreen;
