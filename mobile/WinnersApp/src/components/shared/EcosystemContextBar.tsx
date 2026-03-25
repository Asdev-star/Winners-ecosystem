import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Badge, { type BadgeVariant } from "../ui/Badge";
import { colors, spacing, typography } from "../../theme/tokens";

type Props = {
  label: string;
  context: string;
  accent?: BadgeVariant;
};

const EcosystemContextBar = ({ context, label, accent = "gold" }: Props) => {
  return (
    <View style={styles.container}>
      <Badge label={label} variant={accent} />
      <Text style={styles.context}>{context}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + spacing.xs,
    gap: 4,
  },
  context: {
    ...typography.bodySm,
    color: colors.textDim,
  },
});

export default EcosystemContextBar;
