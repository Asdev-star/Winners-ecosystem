import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import { AIStackParamList } from "../../navigation/types";
import { ASSISTANT_CONFIG, type AssistantKey } from "../../stores/aiStore";
import { useEcosystemStore } from "../../stores/ecosystemStore";
import { colors, radius, spacing, touch, typography, withAlpha } from "../../theme/tokens";

type Props = NativeStackScreenProps<AIStackParamList, "Hub">;

const HUB_ORDER: AssistantKey[] = ["aria", "nova", "sage", "atlas", "omega"];

export default function AIHubScreen({ navigation }: Props) {
  const pendingAiInsights = useEcosystemStore((state) => state.pendingAiInsights);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card accent="gold">
        <Text style={styles.eyebrow}>Digital Sovereign Intelligence</Text>
        <Text style={styles.title}>AI Command Hub</Text>
        <Text style={styles.body}>
          Choose the supervisor best suited to your current task, or let ARIA synthesize the full ecosystem before you act.
        </Text>
        {pendingAiInsights > 0 ? <Badge label={`${pendingAiInsights} new insights`} variant="red" /> : null}
      </Card>

      <Text style={styles.sectionLabel}>Supervisors</Text>
      <View style={styles.grid}>
        {HUB_ORDER.map((assistantKey) => {
          const assistant = ASSISTANT_CONFIG[assistantKey];

          return (
            <Pressable
              key={assistant.key}
              accessibilityRole="button"
              accessibilityLabel={`Open ${assistant.label}`}
              accessibilityHint={`Opens the ${assistant.label} assistant.`}
              onPress={() => navigation.navigate(assistant.route)}
              style={({ pressed }) => [styles.gridItemWrap, pressed && styles.pressed]}
            >
              <Card accent={assistant.accent} style={styles.gridCard}>
                <View style={styles.cardTop}>
                  <Badge label={assistant.label} variant={assistant.accent} />
                  {assistant.key === "omega" ? <Badge label="Briefing" variant="purple" /> : null}
                </View>
                <Text style={styles.cardTitle}>{assistant.label}</Text>
                <Text style={styles.cardBody}>{assistant.hubSummary}</Text>
              </Card>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.sectionLabel}>Quick Launch</Text>
      <View style={styles.quickActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open ARIA chat"
          onPress={() => navigation.navigate("ARIAChat")}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.primaryButtonText}>Open ARIA</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open OMEGA briefing"
          onPress={() => navigation.navigate("OMEGABriefing")}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.secondaryButtonText}>OMEGA Briefing</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  eyebrow: {
    color: colors.gold,
    ...typography.labelLg,
    marginBottom: spacing.xs,
  },
  title: {
    color: colors.text,
    ...typography.displayMd,
  },
  body: {
    color: colors.textDim,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    ...typography.bodyMd,
  },
  sectionLabel: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  gridItemWrap: {
    width: "48%",
  },
  gridCard: {
    marginBottom: 0,
    minHeight: 176,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  cardTitle: {
    color: colors.text,
    ...typography.displaySm,
  },
  cardBody: {
    color: colors.textDim,
    marginTop: spacing.sm,
    ...typography.bodySm,
  },
  quickActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  primaryButton: {
    flex: 1,
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
    flex: 1,
    minHeight: touch.comfortable,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: withAlpha("purple", 0.3),
    backgroundColor: withAlpha("purple", 0.08),
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: colors.purple,
    ...typography.labelLg,
  },
  pressed: {
    opacity: 0.78,
  },
});
