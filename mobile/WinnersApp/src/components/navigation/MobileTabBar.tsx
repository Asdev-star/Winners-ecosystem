import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useEcosystemStore } from "../../stores/ecosystemStore";
import { useQAStore } from "../../stores/qaStore";
import { colors, spacing, typography, withAlpha } from "../../theme/tokens";

const ICONS: Record<string, string> = {
  Community: "\u{1F465}",
  Academy: "\u{1F393}",
  Market: "\u{1F6D2}",
  Work: "\u{1F4BC}",
  AI: "\u{1F916}",
};

const LABELS: Record<string, string> = {
  Community: "Community",
  Academy: "Academy",
  Market: "Market",
  Work: "Work",
  AI: "AI",
};

export default function MobileTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const pendingAiInsights = useEcosystemStore((store) => store.pendingAiInsights);
  const consumeAiInsights = useEcosystemStore((store) => store.consumeAiInsights);
  const markNavigationStart = useQAStore((state) => state.markNavigationStart);

  return (
    <View style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const label = LABELS[route.name] ?? route.name;
          const icon = ICONS[route.name] ?? "*";
          const aiBadgeVisible = route.name === "AI" && pendingAiInsights > 0;

          const onPress = async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              markNavigationStart(`Tab:${route.name}`);
              navigation.navigate(route.name);
            }

            if (route.name === "AI") {
              consumeAiInsights();
            }
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              onLongPress={() => {
                navigation.emit({
                  type: "tabLongPress",
                  target: route.key,
                });
              }}
              onPress={() => {
                void onPress();
              }}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
            >
              <View style={styles.iconWrap}>
                <Text style={[styles.icon, { color: isFocused ? colors.gold : colors.textDim }]}>{icon}</Text>
                {aiBadgeVisible ? (
                  <View style={styles.aiBadge}>
                    <Text style={styles.aiBadgeText}>{pendingAiInsights}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.label, { color: isFocused ? colors.gold : colors.textDim }]}>{label}</Text>
              <View style={[styles.underline, isFocused && styles.underlineActive]} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  row: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "stretch",
  },
  tab: {
    flex: 1,
    minWidth: 60,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingTop: spacing.sm,
  },
  iconWrap: {
    position: "relative",
    minHeight: 24,
    justifyContent: "center",
  },
  icon: {
    fontSize: 18,
  },
  label: {
    ...typography.labelMd,
  },
  underline: {
    marginTop: spacing.xs,
    width: "60%",
    height: 2,
    borderRadius: 1,
    backgroundColor: withAlpha("gold", 0),
  },
  underlineActive: {
    backgroundColor: colors.gold,
  },
  aiBadge: {
    position: "absolute",
    top: -4,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.red,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  aiBadgeText: {
    color: colors.text,
    ...typography.labelSm,
  },
  pressed: {
    opacity: 0.78,
  },
});
