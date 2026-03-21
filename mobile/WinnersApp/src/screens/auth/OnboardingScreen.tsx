import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

interface OnboardingScreenProps {
  onComplete: () => void;
}

const identities = ["Builder", "Creator", "Operator", "Instructor", "Founder"];
const goals = ["Grow community", "Ship products", "Learn faster", "Win contracts"];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [identity, setIdentity] = useState(identities[0]);
  const [goal, setGoal] = useState(goals[0]);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Text style={styles.kicker}>Mobile onboarding</Text>
      <Text style={styles.title}>Shape the shell around your real workflow</Text>
      <Text style={styles.copy}>
        Your selections tune the assistant tone, default tabs, and the recommendations ARIA prioritizes first.
      </Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Who are you building as?</Text>
        <View style={styles.chipRow}>
          {identities.map((item) => (
            <Pressable
              key={item}
              onPress={() => setIdentity(item)}
              style={[styles.chip, identity === item && styles.chipActive]}
            >
              <Text style={[styles.chipText, identity === item && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What matters most in the next 30 days?</Text>
        <View style={styles.chipRow}>
          {goals.map((item) => (
            <Pressable
              key={item}
              onPress={() => setGoal(item)}
              style={[styles.chip, goal === item && styles.chipActive]}
            >
              <Text style={[styles.chipText, goal === item && styles.chipTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryLabel}>Assigned mobile route</Text>
        <Text style={styles.summaryValue}>{identity} / {goal}</Text>
      </View>

      <Pressable onPress={onComplete} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Launch mobile workspace</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0D1520",
  },
  content: {
    padding: 24,
    gap: 24,
  },
  kicker: {
    color: "#C9A84C",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: "#F5F7FA",
    fontSize: 30,
    fontWeight: "800",
    lineHeight: 36,
  },
  copy: {
    color: "#93A4B8",
    fontSize: 15,
    lineHeight: 22,
  },
  section: {
    backgroundColor: "#162131",
    borderColor: "#223247",
    borderWidth: 1,
    borderRadius: 22,
    padding: 18,
    gap: 14,
  },
  sectionTitle: {
    color: "#F5F7FA",
    fontSize: 16,
    fontWeight: "700",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    borderWidth: 1,
    borderColor: "#31465D",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  chipActive: {
    backgroundColor: "#C9A84C",
    borderColor: "#C9A84C",
  },
  chipText: {
    color: "#D9E2EC",
    fontWeight: "600",
    fontSize: 13,
  },
  chipTextActive: {
    color: "#0D1520",
  },
  summary: {
    borderRadius: 18,
    backgroundColor: "#101926",
    borderWidth: 1,
    borderColor: "#223247",
    padding: 18,
    gap: 6,
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
    marginTop: 8,
  },
  primaryButtonText: {
    color: "#0D1520",
    fontSize: 14,
    fontWeight: "900",
  },
});
