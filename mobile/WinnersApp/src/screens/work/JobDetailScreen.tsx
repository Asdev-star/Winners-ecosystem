import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import EcosystemContextBar from "../../components/shared/EcosystemContextBar";
import { WorkStackParamList } from "../../navigation/types";
import { useWorkStore } from "../../stores/workStore";
import { colors, radius, spacing, touch, typography, withAlpha } from "../../theme/tokens";

type Props = NativeStackScreenProps<WorkStackParamList, "JobDetail">;

export default function JobDetailScreen({ navigation, route }: Props) {
  const job = useWorkStore((state) => state.jobs.find((entry) => entry.id === route.params.jobId));
  const toggleSavedJob = useWorkStore((state) => state.toggleSavedJob);
  const profile = useWorkStore((state) =>
    state.freelancers.find((entry) => entry.id === (job?.profileMatchUserId ?? state.currentFreelancerId)),
  );
  const relatedContract = useWorkStore((state) => state.contracts.find((entry) => entry.jobId === route.params.jobId));

  if (!job) {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Card accent="blue">
            <Text style={styles.title}>Job unavailable</Text>
            <Text style={styles.meta}>This role could not be found. Return to the Work home screen and choose another opportunity.</Text>
          </Card>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <EcosystemContextBar accent="blue" label="CIRCUIT" context={job.circuitAnalysis} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card accent="blue">
          <View style={styles.headerRow}>
            <View style={styles.heroCopy}>
              <View style={styles.badgeRow}>
                <Badge label={job.mode} variant="blue" />
                <Badge label={`${job.circuitFitScore} Match`} variant="gold" />
                {job.applied ? <Badge label="Applied" variant="green" /> : null}
              </View>
              <Text style={styles.title}>{job.title}</Text>
              <Text style={styles.company}>{job.company}</Text>
              <Text style={styles.meta}>{job.companyTagline}</Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={job.saved ? "Remove saved job" : "Save job"}
              onPress={() => toggleSavedJob(job.id)}
              style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}
            >
              <Text style={styles.saveButtonText}>{job.saved ? "Saved" : "Save"}</Text>
            </Pressable>
          </View>

          <View style={styles.statGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Compensation</Text>
              <Text style={styles.statValue}>{job.compensation}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Location</Text>
              <Text style={styles.statValue}>{job.location}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Posted</Text>
              <Text style={styles.statValue}>{job.postedLabel}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Applicants</Text>
              <Text style={styles.statValue}>{String(job.applicants)}</Text>
            </View>
          </View>
        </Card>

        <Card accent="blue">
          <Text style={styles.sectionTitle}>Role summary</Text>
          <Text style={styles.body}>{job.summary}</Text>
          <View style={styles.tagRow}>
            {job.tags.map((tag) => (
              <Badge key={tag} label={tag} variant="dim" />
            ))}
          </View>
        </Card>

        <Card accent="blue">
          <Text style={styles.sectionTitle}>Responsibilities</Text>
          {job.responsibilities.map((item) => (
            <View key={item} style={styles.listRow}>
              <View style={styles.listDot} />
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </Card>

        <Card accent="blue">
          <Text style={styles.sectionTitle}>Requirements</Text>
          {job.requirements.map((item) => (
            <View key={item} style={styles.listRow}>
              <View style={styles.listDot} />
              <Text style={styles.listText}>{item}</Text>
            </View>
          ))}
        </Card>

        <Card accent="blue">
          <Text style={styles.sectionTitle}>CIRCUIT analysis</Text>
          {job.circuitSignals.map((signal) => (
            <View key={signal} style={styles.signalRow}>
              <Badge label="Signal" variant="blue" />
              <Text style={styles.listText}>{signal}</Text>
            </View>
          ))}

          {profile ? (
            <Pressable
              onPress={() => navigation.navigate("FreelancerProfile", { userId: profile.id })}
              style={({ pressed }) => [styles.inlineAction, pressed && styles.pressed]}
            >
              <Text style={styles.inlineActionText}>{`Open ${profile.name}'s profile`}</Text>
            </Pressable>
          ) : null}
        </Card>

        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={job.applied ? "Application submitted" : "Apply to this job"}
            accessibilityHint="Opens the proposal form for this role."
            disabled={job.applied}
            onPress={() => navigation.navigate("Apply", { jobId: job.id })}
            style={({ pressed }) => [styles.primaryButton, job.applied && styles.primaryButtonDisabled, pressed && styles.pressed]}
          >
            <Text style={[styles.primaryButtonText, job.applied && styles.primaryButtonTextDisabled]}>
              {job.applied ? "Application sent" : "Apply now"}
            </Text>
          </Pressable>

          {relatedContract ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open related contract"
              onPress={() => navigation.navigate("ContractDetail", { contractId: relatedContract.id })}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryButtonText}>Contract view</Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  headerRow: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  heroCopy: {
    flex: 1,
    gap: spacing.sm,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    ...typography.displaySm,
  },
  company: {
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "700",
  },
  meta: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  saveButton: {
    minWidth: 64,
    minHeight: touch.minimum,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.md,
  },
  saveButtonText: {
    color: colors.text,
    ...typography.labelLg,
  },
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  statCard: {
    minWidth: "47%",
    flexGrow: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: withAlpha("blue", 0.08),
    padding: spacing.md,
    gap: spacing.xs,
  },
  statLabel: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  statValue: {
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "700",
  },
  sectionTitle: {
    color: colors.text,
    ...typography.displaySm,
    marginBottom: spacing.sm,
  },
  body: {
    color: colors.textDim,
    ...typography.bodyMd,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  listDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.blue,
    marginTop: spacing.xs,
  },
  listText: {
    flex: 1,
    color: colors.textDim,
    ...typography.bodyMd,
  },
  signalRow: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  inlineAction: {
    minHeight: touch.minimum,
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  inlineActionText: {
    color: colors.blue,
    ...typography.labelLg,
  },
  actionRow: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  primaryButton: {
    minHeight: touch.comfortable,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonDisabled: {
    backgroundColor: withAlpha("gold", 0.18),
  },
  primaryButtonText: {
    color: colors.bg,
    ...typography.labelLg,
  },
  primaryButtonTextDisabled: {
    color: colors.textDim,
  },
  secondaryButton: {
    minHeight: touch.comfortable,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: colors.text,
    ...typography.labelLg,
  },
  pressed: {
    opacity: 0.8,
  },
});
