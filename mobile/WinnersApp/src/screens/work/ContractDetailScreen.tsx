import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import { WorkStackParamList } from "../../navigation/types";
import { useWorkStore } from "../../stores/workStore";
import { colors, radius, spacing, touch, typography } from "../../theme/tokens";

type Props = NativeStackScreenProps<WorkStackParamList, "ContractDetail">;

export default function ContractDetailScreen({ navigation, route }: Props) {
  const contract = useWorkStore((state) => state.contracts.find((entry) => entry.id === route.params.contractId));

  if (!contract) {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.topAction, pressed && styles.pressed]}>
              <Text style={styles.topActionText}>Back</Text>
            </Pressable>
            <Text style={styles.title}>Contract</Text>
            <View style={styles.topSpacer} />
          </View>

          <Card accent="blue">
            <Text style={styles.projectName}>Contract unavailable</Text>
            <Text style={styles.meta}>This contract could not be found. Return to Work home to open another project.</Text>
          </Card>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable onPress={() => navigation.goBack()} style={({ pressed }) => [styles.topAction, pressed && styles.pressed]}>
            <Text style={styles.topActionText}>Back</Text>
          </Pressable>
          <Text style={styles.title}>Contract #{route.params.contractId.replace("contract-", "")}</Text>
          <View style={styles.topSpacer} />
        </View>

        <Card accent="blue">
          <Badge label={contract.statusLabel} variant={contract.statusLabel === "In Progress" ? "green" : "gold"} />
          <Text style={styles.projectName}>{contract.projectName}</Text>
          <Text style={styles.meta}>{`Client: ${contract.client}`}</Text>
          <Text style={styles.meta}>{contract.scopeSummary}</Text>
          <Text style={styles.escrow}>{`${contract.escrowAmount} in escrow`}</Text>
        </Card>

        <Card accent="blue">
          <Text style={styles.sectionTitle}>Milestones</Text>
          {contract.milestones.map((milestone) => (
            <View key={milestone.id} style={styles.milestoneRow}>
              <Badge
                label={`${milestone.label} | ${milestone.amount}`}
                variant={milestone.status === "Released" ? "green" : milestone.status === "Pending" ? "gold" : "dim"}
              />
              <Text style={styles.meta}>{`${milestone.status} | ${milestone.dueLabel}`}</Text>
            </View>
          ))}
        </Card>

        <Card accent="blue">
          <Text style={styles.sectionTitle}>Messages</Text>
          <Text style={styles.meta}>{contract.messageThreadLabel}</Text>
        </Card>

        <View style={styles.actions}>
          {contract.userRole === "client" ? (
            <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              <Text style={styles.primaryButtonText}>Release Funds</Text>
            </Pressable>
          ) : (
            <Pressable style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
              <Text style={styles.primaryButtonText}>Request Release</Text>
            </Pressable>
          )}

          <Pressable style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
            <Text style={styles.secondaryButtonText}>Open Messages</Text>
          </Pressable>
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topAction: {
    minHeight: touch.minimum,
    justifyContent: "center",
  },
  topActionText: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  topSpacer: {
    width: 64,
  },
  title: {
    color: colors.text,
    ...typography.displaySm,
  },
  projectName: {
    color: colors.text,
    ...typography.displaySm,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  meta: {
    color: colors.textDim,
    ...typography.bodyMd,
  },
  escrow: {
    color: colors.gold,
    ...typography.bodyMd,
    fontWeight: "700",
    marginTop: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    ...typography.displaySm,
    marginBottom: spacing.sm,
  },
  milestoneRow: {
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  actions: {
    gap: spacing.sm,
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
    opacity: 0.78,
  },
});
