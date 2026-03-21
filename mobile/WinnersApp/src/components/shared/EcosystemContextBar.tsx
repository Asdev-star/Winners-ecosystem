import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface EcosystemContextBarProps {
  layer: string;
  assistant: string;
  status?: string;
}

export default function EcosystemContextBar({
  layer,
  assistant,
  status = "Live sync",
}: EcosystemContextBarProps) {
  return (
    <View style={styles.root}>
      <Text style={styles.kicker}>{layer}</Text>
      <Text style={styles.dot}>/</Text>
      <Text style={styles.assistant}>{assistant}</Text>
      <View style={styles.spacer} />
      <Text style={styles.status}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#162131",
    borderColor: "#223247",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  kicker: {
    color: "#93A4B8",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  dot: {
    color: "#4D6785",
    marginHorizontal: 8,
  },
  assistant: {
    color: "#F5F7FA",
    fontSize: 12,
    fontWeight: "700",
  },
  spacer: {
    flex: 1,
  },
  status: {
    color: "#C9A84C",
    fontSize: 11,
    fontWeight: "700",
  },
});
