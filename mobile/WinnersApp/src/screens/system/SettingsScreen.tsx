import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import { RootStackParamList } from "../../navigation/types";
import { useAppShellStore } from "../../stores/appShellStore";
import { colors, radius, spacing, touch, typography, withAlpha } from "../../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

const PREFERENCE_COPY = {
  pushNotifications: "Push notifications",
  emailAlerts: "Email alerts",
  reducedMotion: "Reduced motion",
  largeText: "Large text",
} as const;

export default function SettingsScreen({ navigation }: Props) {
  const preferences = useAppShellStore((state) => state.preferences);
  const cacheSizeMb = useAppShellStore((state) => state.cacheSizeMb);
  const togglePreference = useAppShellStore((state) => state.togglePreference);
  const clearCache = useAppShellStore((state) => state.clearCache);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Card accent="ice">
        <Text style={styles.sectionTitle}>Notifications</Text>
        {Object.entries(PREFERENCE_COPY).slice(0, 2).map(([key, label]) => {
          const enabled = preferences[key as keyof typeof preferences];
          return (
            <Pressable key={key} onPress={() => togglePreference(key as keyof typeof preferences)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{label}</Text>
                <Text style={styles.rowBody}>Control how activity and assistant updates reach you.</Text>
              </View>
              <Badge label={enabled ? "On" : "Off"} variant={enabled ? "green" : "dim"} />
            </Pressable>
          );
        })}
      </Card>

      <Card accent="ice">
        <Text style={styles.sectionTitle}>Accessibility</Text>
        {Object.entries(PREFERENCE_COPY).slice(2).map(([key, label]) => {
          const enabled = preferences[key as keyof typeof preferences];
          return (
            <Pressable key={key} onPress={() => togglePreference(key as keyof typeof preferences)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <View style={styles.rowCopy}>
                <Text style={styles.rowTitle}>{label}</Text>
                <Text style={styles.rowBody}>Tune motion and type scale for more comfortable mobile use.</Text>
              </View>
              <Badge label={enabled ? "On" : "Off"} variant={enabled ? "ice" : "dim"} />
            </Pressable>
          );
        })}
      </Card>

      <Card accent="ice">
        <Text style={styles.sectionTitle}>Cache</Text>
        <View style={styles.cacheCard}>
          <Text style={styles.cacheValue}>{`${cacheSizeMb} MB`}</Text>
          <Text style={styles.rowBody}>Image, feed, and course cache currently stored on device.</Text>
        </View>

        <Pressable onPress={() => clearCache()} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
          <Text style={styles.secondaryButtonText}>Clear cache</Text>
        </Pressable>
      </Card>

      <Pressable onPress={() => navigation.navigate("Notifications")} style={({ pressed }) => [styles.inlineButton, pressed && styles.pressed]}>
        <Text style={styles.inlineButtonText}>Open notifications</Text>
      </Pressable>
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
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    color: colors.text,
    ...typography.displaySm,
    marginBottom: spacing.sm,
  },
  row: {
    minHeight: touch.comfortable,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  rowCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  rowTitle: {
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "700",
  },
  rowBody: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  cacheCard: {
    minHeight: 96,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: withAlpha("ice", 0.08),
    padding: spacing.md,
    justifyContent: "center",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cacheValue: {
    color: colors.text,
    ...typography.displaySm,
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
  inlineButton: {
    minHeight: touch.minimum,
    alignItems: "center",
    justifyContent: "center",
  },
  inlineButtonText: {
    color: colors.ice,
    ...typography.labelLg,
  },
  pressed: {
    opacity: 0.8,
  },
});
