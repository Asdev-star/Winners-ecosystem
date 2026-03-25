import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../../stores/authStore";
import { useEcosystemStore } from "../../stores/ecosystemStore";
import { useQAStore } from "../../stores/qaStore";
import { colors, radius, spacing, touch, typography, withAlpha } from "../../theme/tokens";

type Props = {
  title: string;
  canGoBack?: boolean;
  onBackPress?: () => void;
  onNotificationsPress?: () => void;
  onAvatarPress?: () => void;
};

const BACK_ICON = "\u2039";
const NOTIFICATION_ICON = "\u{1F514}";

function initialsFromName(name?: string | null) {
  if (!name) return "ME";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? "")
    .join("");
}

export default function MobileHeader({
  title,
  canGoBack = false,
  onBackPress,
  onNotificationsPress,
  onAvatarPress,
}: Props) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const unreadNotifications = useEcosystemStore((state) => state.unreadNotifications);
  const markNavigationStart = useQAStore((state) => state.markNavigationStart);

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <View style={styles.row}>
        <View style={styles.leftSlot}>
          {canGoBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Back"
              accessibilityHint="Returns to the previous screen."
              onPress={() => {
                markNavigationStart("Back");
                onBackPress?.();
              }}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
            >
              <Text style={styles.backIcon}>{BACK_ICON}</Text>
              <Text style={styles.backText}>Back</Text>
            </Pressable>
          ) : (
            <View style={styles.backSpacer} />
          )}
        </View>

        <Text numberOfLines={1} style={styles.title}>
          {title}
        </Text>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Notifications${unreadNotifications ? `, ${unreadNotifications} unread` : ""}`}
            accessibilityHint="Opens notifications and clears the unread indicator."
            onPress={() => {
              markNavigationStart("Notifications");
              onNotificationsPress?.();
            }}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          >
            <Text style={styles.iconText}>{NOTIFICATION_ICON}</Text>
            {unreadNotifications > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadNotifications}</Text>
              </View>
            ) : null}
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Profile"
            accessibilityHint="Opens your profile shortcut."
            onPress={() => {
              markNavigationStart("Profile");
              onAvatarPress?.();
            }}
            style={({ pressed }) => [styles.avatarButton, pressed && styles.pressed]}
          >
            <Text style={styles.avatarText}>{initialsFromName(user?.name)}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: withAlpha("bg", 0.94),
    borderBottomWidth: 1,
    borderBottomColor: withAlpha("border", 0.92),
    elevation: 4,
  },
  row: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  leftSlot: {
    minWidth: 72,
    justifyContent: "center",
  },
  backSpacer: {
    width: 44,
    height: 44,
  },
  backButton: {
    minHeight: touch.minimum,
    minWidth: 72,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  backIcon: {
    color: colors.text,
    ...typography.bodyLg,
  },
  backText: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  title: {
    flex: 1,
    textAlign: "center",
    color: colors.text,
    ...typography.displaySm,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minWidth: 88,
    justifyContent: "flex-end",
  },
  iconButton: {
    width: touch.minimum,
    height: touch.minimum,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  iconText: {
    fontSize: 18,
  },
  badge: {
    position: "absolute",
    right: 3,
    top: 6,
    minWidth: 16,
    height: 16,
    borderRadius: radius.full,
    backgroundColor: colors.red,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: colors.text,
    ...typography.labelSm,
  },
  avatarButton: {
    width: touch.minimum,
    height: touch.minimum,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    overflow: "hidden",
    textAlign: "center",
    textAlignVertical: "center",
    backgroundColor: withAlpha("gold", 0.16),
    color: colors.gold,
    ...typography.labelLg,
    lineHeight: 32,
  },
  pressed: {
    opacity: 0.72,
  },
});
