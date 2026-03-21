import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";

interface AssistantFABProps {
  label?: string;
  onPress: () => void;
}

export default function AssistantFAB({
  label = "Ask ARIA",
  onPress,
}: AssistantFABProps) {
  return (
    <Pressable onPress={onPress} style={styles.button}>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    right: 20,
    bottom: 24,
    backgroundColor: "#C9A84C",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  label: {
    color: "#0D1520",
    fontWeight: "800",
    fontSize: 12,
    letterSpacing: 0.4,
  },
});
