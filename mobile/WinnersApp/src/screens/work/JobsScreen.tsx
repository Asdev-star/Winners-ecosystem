import React, { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import EcosystemContextBar from "../../components/shared/EcosystemContextBar";
import { WorkStackParamList } from "../../navigation/types";
import { useWorkStore } from "../../stores/workStore";
import { colors, radius, spacing, touch, typography, withAlpha } from "../../theme/tokens";

type Props = NativeStackScreenProps<WorkStackParamList, "Home">;
type WorkTab = "Jobs" | "Contracts" | "Profile";

const FILTERS = ["Remote", "$500+", "Design", "React"] as const;

export default function JobsScreen({ navigation }: Props) {
  const [activeTab, setActiveTab] = useState<WorkTab>("Jobs");
  const [activeFilter, setActiveFilter] = useState<(typeof FILTERS)[number]>("Remote");
  const jobs = useWorkStore((state) => state.jobs);
  const contracts = useWorkStore((state) => state.contracts);
  const currentFreelancerId = useWorkStore((state) => state.currentFreelancerId);
  const freelancer = useWorkStore((state) => state.freelancers.find((entry) => entry.id === currentFreelancerId));

  const filteredJobs = useMemo(
    () =>
      jobs.filter((job) => {
        if (activeFilter === "Remote") {
          return job.mode === "Remote";
        }

        if (activeFilter === "$500+") {
          return true;
        }

        return job.tags.includes(activeFilter);
      }),
    [activeFilter, jobs],
  );

  return (
    <View style={styles.screen}>
      <EcosystemContextBar accent="blue" label="CIRCUIT" context="3 job matches were ranked highest for your current delivery window and stack." />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.tabRow}>
          {(["Jobs", "Contracts", "Profile"] as WorkTab[]).map((tab) => {
            const selected = tab === activeTab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={({ pressed }) => [styles.tabButton, selected && styles.tabButtonSelected, pressed && styles.pressed]}
              >
                <Text style={[styles.tabButtonText, selected && styles.tabButtonTextSelected]}>{tab}</Text>
              </Pressable>
            );
          })}
        </View>

        {activeTab === "Jobs" ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
              {FILTERS.map((filter) => {
                const selected = filter === activeFilter;
                return (
                  <Pressable
                    key={filter}
                    onPress={() => setActiveFilter(filter)}
                    style={({ pressed }) => [styles.filterChip, selected && styles.filterChipSelected, pressed && styles.pressed]}
                  >
                    <Text style={[styles.filterChipText, selected && styles.filterChipTextSelected]}>{filter}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {filteredJobs.map((job) => (
              <Card key={job.id} accent="blue">
                <View style={styles.jobTop}>
                  <View style={styles.logoCircle}>
                    <Text style={styles.logoText}>{job.company.slice(0, 1)}</Text>
                  </View>

                  <View style={styles.jobCopy}>
                    <Text style={styles.jobTitle}>{job.title}</Text>
                    <Text style={styles.companyText}>{job.company}</Text>
                    <Text style={styles.jobMeta}>{`${job.compensation} | ${job.mode}`}</Text>
                    <Text style={styles.jobMeta}>{`Posted ${job.postedLabel} | ${job.applicants} applicants`}</Text>
                    <View style={styles.tagRow}>
                      <Badge label={`${job.circuitFitScore} Match`} variant="blue" />
                      {job.applied ? <Badge label="Applied" variant="green" /> : null}
                    </View>
                  </View>
                </View>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${job.title}`}
                  accessibilityHint="Opens the full job brief and application actions."
                  onPress={() => navigation.navigate("JobDetail", { jobId: job.id })}
                  style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                >
                  <Text style={styles.primaryButtonText}>View job</Text>
                </Pressable>
              </Card>
            ))}
          </>
        ) : null}

        {activeTab === "Contracts" ? (
          <>
            {contracts.map((contract) => (
              <Card key={contract.id} accent="blue">
                <Badge label={contract.statusLabel} variant={contract.statusLabel === "In Progress" ? "green" : "gold"} />
                <Text style={styles.contractTitle}>{contract.projectName}</Text>
                <Text style={styles.jobMeta}>{contract.client}</Text>
                <Text style={styles.jobMeta}>{`${contract.escrowAmount} in escrow | ${contract.messageThreadLabel}`}</Text>
                <Pressable
                  onPress={() => navigation.navigate("ContractDetail", { contractId: contract.id })}
                  style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                >
                  <Text style={styles.secondaryButtonText}>Open contract</Text>
                </Pressable>
              </Card>
            ))}
          </>
        ) : null}

        {activeTab === "Profile" && freelancer ? (
          <Card accent="blue">
            <Badge label={`Trust ${freelancer.trustScore}`} variant="blue" />
            <Text style={styles.contractTitle}>{freelancer.name}</Text>
            <Text style={styles.jobMeta}>{freelancer.title}</Text>
            <Text style={styles.jobMeta}>{`${freelancer.hourlyRate} | ${freelancer.availability}`}</Text>
            <Pressable
              onPress={() => navigation.navigate("FreelancerProfile", { userId: freelancer.id })}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryButtonText}>Open profile</Text>
            </Pressable>
          </Card>
        ) : null}
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
  tabRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  tabButton: {
    flex: 1,
    minHeight: touch.minimum,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonSelected: {
    borderColor: colors.blue,
    backgroundColor: withAlpha("blue", 0.12),
  },
  tabButtonText: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  tabButtonTextSelected: {
    color: colors.blue,
  },
  filterRow: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  filterChip: {
    minHeight: touch.minimum,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipSelected: {
    borderColor: colors.blue,
    backgroundColor: withAlpha("blue", 0.12),
  },
  filterChipText: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  filterChipTextSelected: {
    color: colors.blue,
  },
  jobTop: {
    flexDirection: "row",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: withAlpha("blue", 0.12),
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    color: colors.blue,
    ...typography.labelLg,
  },
  jobCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  jobTitle: {
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "700",
  },
  companyText: {
    color: colors.text,
    ...typography.bodySm,
  },
  jobMeta: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryButton: {
    minHeight: touch.minimum,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: colors.bg,
    ...typography.labelLg,
  },
  secondaryButton: {
    minHeight: touch.minimum,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: spacing.md,
  },
  secondaryButtonText: {
    color: colors.text,
    ...typography.labelLg,
  },
  contractTitle: {
    color: colors.text,
    ...typography.displaySm,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  pressed: {
    opacity: 0.78,
  },
});
