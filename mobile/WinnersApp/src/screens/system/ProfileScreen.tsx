import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import { RootStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";
import { useEcosystemStore } from "../../stores/ecosystemStore";
import { useAppShellStore } from "../../stores/appShellStore";
import { colors, radius, spacing, touch, typography, withAlpha } from "../../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "Profile">;

const ECOSYSTEM_AREAS = [
  { label: "Community", accent: "green" as const },
  { label: "Academy", accent: "ice" as const },
  { label: "Market", accent: "gold" as const },
  { label: "Work", accent: "blue" as const },
  { label: "AI", accent: "purple" as const },
];

export default function ProfileScreen({ navigation }: Props) {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const platformStatus = useEcosystemStore((state) => state.platformStatus);
  const unreadNotifications = useEcosystemStore((state) => state.unreadNotifications);
  const pendingAiInsights = useEcosystemStore((state) => state.pendingAiInsights);
  const threads = useAppShellStore((state) => state.threads);

  const unreadMessages = useMemo(() => threads.reduce((total, thread) => total + thread.unreadCount, 0), [threads]);

  if (!user) {
    return (
      <View style={styles.screen}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Card accent="gold">
            <Text style={styles.name}>Profile unavailable</Text>
            <Text style={styles.body}>No authenticated user was found for this modal session.</Text>
          </Card>
        </ScrollView>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Card accent="gold">
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.name.slice(0, 1)}</Text>
          </View>

          <View style={styles.heroCopy}>
            <Badge label={user.role} variant="gold" />
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.subhead}>{user.email}</Text>
            <Text style={styles.subhead}>Trust Score 96 · Sovereign Builder Plan</Text>
          </View>
        </View>
      </Card>

      <Card accent="gold">
        <Text style={styles.sectionTitle}>Ecosystem access</Text>
        <View style={styles.badges}>
          {ECOSYSTEM_AREAS.map((area) => (
            <Badge
              key={area.label}
              label={`${area.label} ${platformStatus[area.label.toLowerCase() as keyof typeof platformStatus]}`}
              variant={area.accent}
            />
          ))}
        </View>
      </Card>

      <Card accent="gold">
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.actionGrid}>
          <Pressable onPress={() => navigation.navigate("Notifications")} style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}>
            <Text style={styles.actionValue}>{String(unreadNotifications)}</Text>
            <Text style={styles.actionLabel}>Notifications</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("Messages")} style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}>
            <Text style={styles.actionValue}>{String(unreadMessages)}</Text>
            <Text style={styles.actionLabel}>Messages</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate("Settings")} style={({ pressed }) => [styles.actionCard, pressed && styles.pressed]}>
            <Text style={styles.actionValue}>{String(pendingAiInsights)}</Text>
            <Text style={styles.actionLabel}>AI Insights</Text>
          </Pressable>
        </View>
      </Card>

      <Card accent="gold">
        <Text style={styles.sectionTitle}>Plan</Text>
        <Text style={styles.body}>Sovereign Builder unlocks full ecosystem access, assistant routing, export tools, and trust-first commerce surfaces.</Text>
      </Card>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open settings"
        onPress={() => navigation.navigate("Settings")}
        style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
      >
        <Text style={styles.secondaryButtonText}>Open settings</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Log out"
        onPress={() => logout()}
        style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
      >
        <Text style={styles.primaryButtonText}>Log out</Text>
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
  hero: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: withAlpha("gold", 0.14),
  },
  avatarText: {
    color: colors.gold,
    ...typography.displayMd,
  },
  heroCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: colors.text,
    ...typography.displaySm,
  },
  subhead: {
    color: colors.textDim,
    ...typography.bodyMd,
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
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actionGrid: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionCard: {
    flex: 1,
    minHeight: 96,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  actionValue: {
    color: colors.text,
    ...typography.displaySm,
  },
  actionLabel: {
    color: colors.textDim,
    ...typography.bodySm,
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
  primaryButton: {
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
  pressed: {
    opacity: 0.8,
  },
});
