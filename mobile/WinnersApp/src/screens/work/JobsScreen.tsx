import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import EcosystemContextBar from "../../components/shared/EcosystemContextBar";
import AssistantFAB from "../../components/shared/AssistantFAB";

const jobs = [
  { id: "ops-lead", title: "Operations Lead", meta: "Remote / 3-month sprint", note: "Strong fit for builders with systems and launch experience." },
  { id: "growth-strategist", title: "Growth Strategist", meta: "Diaspora commerce / contract", note: "Best aligned with market and community crossover operators." },
];

export default function JobsScreen({ navigation }: { navigation: { navigate: (screen: string) => void } }) {
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <EcosystemContextBar layer="Work" assistant="CIRCUIT" />
        <Text style={styles.title}>Opportunity board</Text>
        <Text style={styles.copy}>
          CIRCUIT ranks jobs by proximity to your active skills, certificates, and current commercial focus.
        </Text>

        {jobs.map((job) => (
          <View key={job.id} style={styles.card}>
            <Text style={styles.cardTitle}>{job.title}</Text>
            <Text style={styles.cardMeta}>{job.meta}</Text>
            <Text style={styles.cardCopy}>{job.note}</Text>
            <Pressable style={styles.action}>
              <Text style={styles.actionText}>Prepare application</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>

      <AssistantFAB label="Ask CIRCUIT" onPress={() => navigation.navigate("Intelligence")} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0D1520",
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  title: {
    color: "#F5F7FA",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  copy: {
    color: "#93A4B8",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 18,
  },
  card: {
    backgroundColor: "#162131",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#223247",
    padding: 18,
    gap: 10,
    marginBottom: 14,
  },
  cardTitle: {
    color: "#F5F7FA",
    fontSize: 18,
    fontWeight: "800",
  },
  cardMeta: {
    color: "#C9A84C",
    fontSize: 12,
    fontWeight: "700",
  },
  cardCopy: {
    color: "#C6D0DA",
    fontSize: 14,
    lineHeight: 21,
  },
  action: {
    alignSelf: "flex-start",
    borderRadius: 999,
    backgroundColor: "#203246",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  actionText: {
    color: "#F5F7FA",
    fontWeight: "800",
    fontSize: 12,
  },
});
