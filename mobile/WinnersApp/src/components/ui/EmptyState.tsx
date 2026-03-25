import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Card from "./Card";
import Badge, { type BadgeVariant } from "./Badge";
import { colors, radius, spacing, touch, typography, withAlpha } from "../../theme/tokens";

type AssistantKey = "atlas" | "nova" | "sage" | "circuit" | "aria";

interface EmptyStateProps {
  icon: string;
  headline: string;
  body: string;
  ctaLabel?: string;
  onCta?: () => void;
  assistant?: AssistantKey;
}

const assistantTheme: Record<AssistantKey, { accent: BadgeVariant; label: string }> = {
  atlas: { accent: "purple", label: "ATLAS Suggestion" },
  nova: { accent: "ice", label: "NOVA Suggestion" },
  sage: { accent: "green", label: "SAGE Suggestion" },
  circuit: { accent: "dim", label: "CIRCUIT Suggestion" },
  aria: { accent: "gold", label: "ARIA Suggestion" },
};

export default function EmptyState({
  icon,
  headline,
  body,
  ctaLabel,
  onCta,
  assistant = "aria",
}: EmptyStateProps) {
  const theme = assistantTheme[assistant];

  return (
    <Card accent={theme.accent === "dim" ? "blue" : theme.accent}>
      <View style={styles.stack}>
        <View style={styles.hero}>
          <Text style={styles.icon}>{icon}</Text>
          <Badge label={theme.label} variant={theme.accent} />
        </View>
        <Text style={styles.headline}>{headline}</Text>
        <Text style={styles.body}>{body}</Text>
        <Text style={styles.suggestion}>
          {theme.label.split(" ")[0]} can suggest the next best move instead of leaving this surface empty.
        </Text>
        {onCta ? (
          <Pressable style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]} onPress={onCta}>
            <Text style={styles.ctaText}>{ctaLabel ?? `Open ${theme.label.split(" ")[0]}`}</Text>
          </Pressable>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: spacing.sm,
  },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  icon: {
    fontSize: spacing.xl,
  },
  headline: {
    ...typography.displaySm,
    color: colors.text,
  },
  body: {
    ...typography.bodyMd,
    color: colors.textDim,
  },
  suggestion: {
    ...typography.bodySm,
    color: colors.text,
  },
  cta: {
    minHeight: touch.minimum,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: withAlpha("gold", 0.32),
    backgroundColor: withAlpha("gold", 0.14),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  ctaPressed: {
    opacity: 0.86,
  },
  ctaText: {
    ...typography.labelLg,
    color: colors.gold,
  },
});
