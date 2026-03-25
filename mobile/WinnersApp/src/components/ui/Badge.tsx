import React from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius, spacing, typography, withAlpha } from "../../theme/tokens";

export type BadgeVariant = "gold" | "green" | "red" | "purple" | "ice" | "blue" | "dim";

const badgeColors: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
  gold: { bg: withAlpha("gold", 0.12), text: colors.gold, border: withAlpha("gold", 0.3) },
  green: { bg: withAlpha("green", 0.1), text: colors.green, border: withAlpha("green", 0.2) },
  red: { bg: withAlpha("red", 0.1), text: colors.red, border: withAlpha("red", 0.2) },
  purple: { bg: withAlpha("purple", 0.1), text: colors.purple, border: withAlpha("purple", 0.2) },
  ice: { bg: withAlpha("ice", 0.1), text: colors.ice, border: withAlpha("ice", 0.2) },
  blue: { bg: withAlpha("blue", 0.12), text: colors.blue, border: withAlpha("blue", 0.3) },
  dim: { bg: withAlpha("blue", 0.08), text: colors.textDim, border: withAlpha("blue", 0.2) },
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  style?: StyleProp<ViewStyle>;
}

export default function Badge({ label, variant = "gold", style }: BadgeProps) {
  const palette = badgeColors[variant];

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: palette.bg,
          borderColor: palette.border,
        },
        style,
      ]}
    >
      <Text style={[styles.text, { color: palette.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderRadius: radius.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.sm + spacing.xs,
    paddingVertical: spacing.xs,
  },
  text: {
    ...typography.labelMd,
  },
});
