import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, touch, typography, withAlpha } from "../../theme/tokens";

type Props = {
  label?: string;
  onPress: () => void;
};

const AssistantFAB = ({ label = "Ask Aria", onPress }: Props) => {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint="Opens the assistant for contextual help."
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <View style={styles.iconWrap}>
        <Text style={styles.iconText}>AI</Text>
      </View>
      <Text style={styles.text}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    position: "absolute",
    right: spacing.lg - spacing.xs,
    bottom: spacing.lg,
    minHeight: touch.comfortable,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 2,
    backgroundColor: colors.gold,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + spacing.xs,
    shadowColor: withAlpha("bg", 1),
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: withAlpha("gold", 0.3),
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: colors.bg,
    ...typography.bodyMd,
    fontWeight: "700",
  },
  iconText: {
    color: colors.bg,
    ...typography.labelLg,
  },
  pressed: {
    opacity: 0.82,
  },
});

export default AssistantFAB;
