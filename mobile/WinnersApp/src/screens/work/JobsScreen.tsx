import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import EcosystemContextBar from "../../components/shared/EcosystemContextBar";

const jobs = [
  "Content strategist for East Africa education launch",
  "Community operations lead for diaspora partner onboarding",
  "Short-form video editor for mobile-first growth campaigns",
];

const JobsScreen = () => {
  return (
    <View style={styles.screen}>
      <EcosystemContextBar
        label="Work"
        context="Track open roles, client work, and operator capacity from a lightweight mobile cockpit."
      />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Pipeline overview</Text>
        <Text style={styles.copy}>The work tab is set up for a job list, contracts, and escrow-aware task flow.</Text>

        <View style={styles.panel}>
          {jobs.map((job) => (
            <View key={job} style={styles.jobRow}>
              <View style={styles.dot} />
              <Text style={styles.jobText}>{job}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0D1520",
  },
  content: {
    padding: 16,
    gap: 14,
  },
  title: {
    color: "#E8EEF5",
    fontSize: 28,
    fontWeight: "800",
  },
  copy: {
    color: "#8FA6BA",
    fontSize: 14,
    lineHeight: 22,
  },
  panel: {
    backgroundColor: "#111D2E",
    borderColor: "#1E3248",
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    gap: 14,
  },
  jobRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#C9A84C",
    marginTop: 7,
  },
  jobText: {
    flex: 1,
    color: "#E8EEF5",
    fontSize: 14,
    lineHeight: 22,
  },
});

export default JobsScreen;
