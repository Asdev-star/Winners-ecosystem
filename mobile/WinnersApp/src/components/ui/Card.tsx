import React from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius, spacing, withAlpha } from "../../theme/tokens";

type AccentColor = "gold" | "blue" | "ice" | "green" | "red" | "purple";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  accent?: AccentColor;
  padding?: number;
}

export default function Card({
  children,
  style,
  accent = "gold",
  padding = spacing.md,
}: CardProps) {
  return (
    <View style={[styles.card, style]}>
      <LinearGradient
        colors={[colors[accent], withAlpha(accent, 0)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topBorder}
      />
      <View style={[styles.content, { padding }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: "hidden",
    marginBottom: spacing.sm,
  },
  topBorder: {
    height: 2,
    width: "100%",
  },
  content: {
    width: "100%",
  },
});
