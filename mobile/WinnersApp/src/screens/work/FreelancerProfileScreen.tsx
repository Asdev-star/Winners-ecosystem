import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import { WorkStackParamList } from "../../navigation/types";
import { useWorkStore } from "../../stores/workStore";
import { colors, radius, spacing, touch, typography, withAlpha } from "../../theme/tokens";

type Props = NativeStackScreenProps<WorkStackParamList, "FreelancerProfile">;

export default function FreelancerProfileScreen({ navigation, route }: Props) {
  const profile = useWorkStore((state) => state.freelancers.find((entry) => entry.id === route.params.userId));
  const jobs = useWorkStore((state) => state.jobs.filter((entry) => entry.profileMatchUserId === route.params.userId));
  const contracts = useWorkStore((state) =>
    state.contracts.filter((entry) => (profile ? profile.featuredContractIds.includes(entry.id) : false)),
  );

  if (!profile) {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Card accent="blue">
            <Text style={styles.title}>Freelancer unavailable</Text>
            <Text style={styles.body}>This profile could not be found. Return to the Work stack and open another profile.</Text>
          </Card>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card accent="blue">
          <View style={styles.heroRow}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{profile.name.slice(0, 1)}</Text>
            </View>
            <View style={styles.heroCopy}>
              <Badge label={`Trust ${profile.trustScore}`} variant="blue" />
              <Text style={styles.title}>{profile.name}</Text>
              <Text style={styles.subtitle}>{profile.title}</Text>
              <Text style={styles.body}>{`${profile.location} | ${profile.hourlyRate}`}</Text>
              <Text style={styles.body}>{`${profile.availability} | ${profile.responseTime}`}</Text>
            </View>
          </View>
        </Card>

        <Card accent="blue">
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.body}>{profile.bio}</Text>
        </Card>

        <Card accent="blue">
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.highlightGrid}>
            {profile.highlights.map((highlight) => (
              <View key={highlight.id} style={styles.highlightCard}>
                <Text style={styles.highlightValue}>{highlight.value}</Text>
                <Text style={styles.highlightLabel}>{highlight.label}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.performanceText}>{profile.completionRate}</Text>
        </Card>

        <Card accent="blue">
          <Text style={styles.sectionTitle}>Skills</Text>
          <View style={styles.badgeRow}>
            {profile.skills.map((skill) => (
              <Badge key={skill} label={skill} variant="dim" />
            ))}
          </View>
          <View style={styles.badgeRow}>
            {profile.focusAreas.map((area) => (
              <Badge key={area} label={area} variant="ice" />
            ))}
          </View>
        </Card>

        <Card accent="blue">
          <Text style={styles.sectionTitle}>Recent contracts</Text>
          {contracts.map((contract) => (
            <Pressable
              key={contract.id}
              onPress={() => navigation.navigate("ContractDetail", { contractId: contract.id })}
              style={({ pressed }) => [styles.linkRow, pressed && styles.pressed]}
            >
              <View>
                <Text style={styles.linkTitle}>{contract.projectName}</Text>
                <Text style={styles.body}>{`${contract.client} | ${contract.escrowAmount} in escrow`}</Text>
              </View>
              <Text style={styles.linkCta}>Open</Text>
            </Pressable>
          ))}
        </Card>

        {jobs[0] ? (
          <Pressable onPress={() => navigation.navigate("JobDetail", { jobId: jobs[0].id })} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>Open matching job</Text>
          </Pressable>
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
  heroRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: withAlpha("blue", 0.12),
  },
  avatarText: {
    color: colors.blue,
    ...typography.displaySm,
  },
  heroCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  title: {
    color: colors.text,
    ...typography.displaySm,
  },
  subtitle: {
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
  highlightGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  highlightCard: {
    minWidth: "31%",
    flexGrow: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: withAlpha("blue", 0.08),
    padding: spacing.md,
    gap: spacing.xs,
  },
  highlightValue: {
    color: colors.text,
    ...typography.displaySm,
  },
  highlightLabel: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  performanceText: {
    color: colors.blue,
    ...typography.bodyMd,
    fontWeight: "700",
    marginTop: spacing.md,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  linkRow: {
    minHeight: touch.minimum,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  linkTitle: {
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "700",
  },
  linkCta: {
    color: colors.blue,
    ...typography.labelLg,
  },
  primaryButton: {
    minHeight: touch.comfortable,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: colors.bg,
    ...typography.labelLg,
  },
  pressed: {
    opacity: 0.8,
  },
});
