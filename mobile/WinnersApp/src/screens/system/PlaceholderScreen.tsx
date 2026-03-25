import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Card from "../../components/ui/Card";
import Badge, { type BadgeVariant } from "../../components/ui/Badge";
import { colors, spacing, typography } from "../../theme/tokens";

type Props = {
  eyebrow?: string;
  title: string;
  body: string;
  accent?: BadgeVariant;
};

export default function PlaceholderScreen({
  eyebrow = "Mobile Route",
  title,
  body,
  accent = "dim",
}: Props) {
  const cardAccent = accent === "dim" ? "blue" : accent;

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Badge label={eyebrow} variant={accent} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>

      <Card accent={cardAccent}>
        <Text style={styles.cardTitle}>Inventory-aligned route is live</Text>
        <Text style={styles.cardBody}>
          This destination has been wired into the mobile navigation model and deep-link surface, and is ready for its
          full UI pass.
        </Text>
      </Card>

      <View style={styles.divider} />

      <Text style={styles.note}>Use this as the handoff point for the dedicated screen implementation.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    ...typography.displayMd,
  },
  body: {
    color: colors.textDim,
    ...typography.bodyMd,
  },
  cardTitle: {
    color: colors.text,
    marginBottom: spacing.xs,
    ...typography.bodyLg,
  },
  cardBody: {
    color: colors.textDim,
    ...typography.bodyMd,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  note: {
    color: colors.textDim,
    ...typography.bodySm,
  },
});
