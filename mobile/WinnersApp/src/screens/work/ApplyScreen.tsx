import React, { useMemo, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import EcosystemContextBar from "../../components/shared/EcosystemContextBar";
import { WorkStackParamList } from "../../navigation/types";
import { useWorkStore } from "../../stores/workStore";
import { colors, radius, spacing, touch, typography, withAlpha } from "../../theme/tokens";

type Props = NativeStackScreenProps<WorkStackParamList, "Apply">;

export default function ApplyScreen({ navigation, route }: Props) {
  const job = useWorkStore((state) => state.jobs.find((entry) => entry.id === route.params.jobId));
  const submitApplication = useWorkStore((state) => state.submitApplication);
  const [proposal, setProposal] = useState("");
  const [rate, setRate] = useState(job?.compensation ?? "");
  const [deliveryWindow, setDeliveryWindow] = useState("2-4 weeks");
  const [submitted, setSubmitted] = useState(false);

  const isValid = useMemo(
    () => proposal.trim().length >= 60 && rate.trim().length > 0 && deliveryWindow.trim().length > 0,
    [deliveryWindow, proposal, rate],
  );

  if (!job) {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Card accent="blue">
            <Text style={styles.title}>Application unavailable</Text>
            <Text style={styles.body}>The role could not be found. Return to the Work tab and start again from the job list.</Text>
          </Card>
        </ScrollView>
      </View>
    );
  }

  if (submitted) {
    return (
      <View style={styles.screen}>
        <EcosystemContextBar accent="blue" label="CIRCUIT" context="Your application is queued with the strongest role-fit signals highlighted for the hiring team." />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Card accent="blue">
            <Badge label="Application sent" variant="green" />
            <Text style={styles.title}>{job.title}</Text>
            <Text style={styles.body}>Your proposal, rate, and delivery window were saved. CIRCUIT highlighted your mobile systems and delivery-speed fit.</Text>
          </Card>

          <Pressable onPress={() => navigation.replace("JobDetail", { jobId: job.id })} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>Back to job</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}>
      <EcosystemContextBar accent="blue" label="CIRCUIT" context="Lead with your delivery system, expected outcome, and the fastest believable path to value." />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Card accent="blue">
          <Badge label={`${job.circuitFitScore} Match`} variant="gold" />
          <Text style={styles.title}>{job.title}</Text>
          <Text style={styles.body}>{`${job.company} | ${job.compensation} | ${job.mode}`}</Text>
        </Card>

        <Card accent="blue">
          <Text style={styles.sectionTitle}>Proposal</Text>
          <Text style={styles.helperText}>Explain how you would approach the first 2 weeks, what you would ship first, and where you would reduce delivery risk.</Text>
          <TextInput
            accessibilityLabel="Proposal"
            accessibilityHint="Describe your approach to the project."
            multiline
            placeholder="Outline your approach, priorities, and expected delivery rhythm."
            placeholderTextColor={colors.textDim}
            style={[styles.input, styles.textArea]}
            value={proposal}
            onChangeText={setProposal}
            textAlignVertical="top"
          />
          <Text style={styles.counterText}>{`${proposal.trim().length} characters`}</Text>
        </Card>

        <Card accent="blue">
          <Text style={styles.sectionTitle}>Commercial terms</Text>
          <TextInput
            accessibilityLabel="Rate"
            placeholder="Rate or project fee"
            placeholderTextColor={colors.textDim}
            style={styles.input}
            value={rate}
            onChangeText={setRate}
          />
          <TextInput
            accessibilityLabel="Delivery window"
            placeholder="Delivery window"
            placeholderTextColor={colors.textDim}
            style={styles.input}
            value={deliveryWindow}
            onChangeText={setDeliveryWindow}
          />
        </Card>

        <Card accent="blue">
          <Text style={styles.sectionTitle}>CIRCUIT guidance</Text>
          {job.circuitSignals.map((signal) => (
            <View key={signal} style={styles.signalRow}>
              <View style={styles.signalDot} />
              <Text style={styles.body}>{signal}</Text>
            </View>
          ))}
        </Card>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Submit application"
          accessibilityHint="Sends your proposal for this role."
          disabled={!isValid}
          onPress={() => {
            submitApplication({
              jobId: job.id,
              proposal,
              rate,
              deliveryWindow,
            });
            setSubmitted(true);
          }}
          style={({ pressed }) => [styles.primaryButton, !isValid && styles.primaryButtonDisabled, pressed && styles.pressed]}
        >
          <Text style={[styles.primaryButtonText, !isValid && styles.primaryButtonTextDisabled]}>Submit application</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
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
  title: {
    color: colors.text,
    ...typography.displaySm,
    marginTop: spacing.sm,
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
  helperText: {
    color: colors.textDim,
    ...typography.bodySm,
    marginBottom: spacing.sm,
  },
  input: {
    minHeight: touch.comfortable,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    color: colors.text,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + spacing.xs,
    ...typography.bodyMd,
    marginBottom: spacing.sm,
  },
  textArea: {
    minHeight: 160,
  },
  counterText: {
    color: colors.textDim,
    ...typography.labelMd,
  },
  signalRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  signalDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    marginTop: spacing.xs,
    backgroundColor: colors.blue,
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
  pressed: {
    opacity: 0.8,
  },
});
