import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing, touch, typography, withAlpha } from "../../theme/tokens";

type Props = {
  isOnline: boolean;
  isSyncing?: boolean;
  pendingCount?: number;
  onSync?: () => void;
};

const OfflineBanner = ({ isOnline, isSyncing = false, onSync, pendingCount = 0 }: Props) => {
  if (isOnline && !pendingCount && !isSyncing) return null;

  return (
    <View style={[styles.container, isOnline ? styles.online : styles.offline]}>
      <View style={styles.messageRow}>
        <Text style={styles.badge}>OFF</Text>
        <Text style={styles.text}>
          {!isOnline
            ? "Offline mode enabled. Actions will sync when you reconnect."
            : isSyncing
              ? "Syncing queued activity..."
              : `${pendingCount} queued action${pendingCount === 1 ? "" : "s"} ready to sync.`}
        </Text>
      </View>

      {isOnline && pendingCount > 0 && onSync ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sync offline actions"
          accessibilityHint="Attempts to send queued offline activity now that your connection is back."
          onPress={onSync}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Text style={styles.actionIcon}>SYNC</Text>
          <Text style={styles.actionText}>Sync</Text>
        </Pressable>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    gap: spacing.sm + 4,
  },
  offline: {
    backgroundColor: withAlpha("red", 0.8),
  },
  online: {
    backgroundColor: withAlpha("blue", 0.85),
  },
  messageRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  text: {
    color: colors.text,
    ...typography.bodySm,
    fontWeight: "600",
    flex: 1,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: touch.minimum,
    gap: spacing.xs + 2,
    borderWidth: 1,
    borderColor: withAlpha("text", 0.28),
    borderRadius: radius.full,
    paddingHorizontal: spacing.md - 2,
    paddingVertical: spacing.xs + 2,
  },
  actionText: {
    color: colors.text,
    ...typography.labelLg,
  },
  badge: {
    color: colors.text,
    ...typography.labelLg,
  },
  actionIcon: {
    color: colors.text,
    ...typography.labelMd,
  },
  pressed: {
    opacity: 0.8,
  },
});

export default OfflineBanner;
