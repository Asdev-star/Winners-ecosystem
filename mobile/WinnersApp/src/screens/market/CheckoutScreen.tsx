import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import EcosystemContextBar from "../../components/shared/EcosystemContextBar";
import { queueOfflineAction } from "../../services/offline";

export default function CheckoutScreen() {
  const [status, setStatus] = useState("Secure checkout ready.");

  async function queueCheckout() {
    await queueOfflineAction({
      id: `checkout-${Date.now()}`,
      type: "checkout",
      payload: { offer: "growth-kit", total: 14900 },
      createdAt: new Date().toISOString(),
    });
    setStatus("Checkout intent saved for retry when connectivity returns.");
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <EcosystemContextBar layer="Market" assistant="ATLAS" status="Mobile checkout" />
      <Text style={styles.title}>Checkout</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Offer</Text>
        <Text style={styles.summaryValue}>Growth Kit</Text>
        <Text style={styles.summaryLabel}>Total</Text>
        <Text style={styles.summaryValue}>$149.00</Text>
      </View>

      <Pressable style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Pay securely</Text>
      </Pressable>

      <Pressable onPress={queueCheckout} style={styles.secondaryButton}>
        <Text style={styles.secondaryButtonText}>Save intent offline</Text>
      </Pressable>

      <Text style={styles.status}>{status}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0D1520",
  },
  content: {
    padding: 20,
    gap: 18,
  },
  title: {
    color: "#F5F7FA",
    fontSize: 28,
    fontWeight: "800",
  },
  summaryCard: {
    backgroundColor: "#162131",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#223247",
    padding: 20,
    gap: 8,
  },
  summaryLabel: {
    color: "#93A4B8",
    fontSize: 12,
    fontWeight: "700",
  },
  summaryValue: {
    color: "#F5F7FA",
    fontSize: 18,
    fontWeight: "800",
  },
  primaryButton: {
    backgroundColor: "#C9A84C",
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#0D1520",
    fontWeight: "900",
    fontSize: 14,
  },
  secondaryButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#31465D",
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
