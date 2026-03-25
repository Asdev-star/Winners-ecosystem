import React, { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Device from "expo-device";
import Badge from "../ui/Badge";
import Card from "../ui/Card";
import { api } from "../../services/api";
import { offline } from "../../services/offline";
import { useAuthStore } from "../../stores/authStore";
import { useEcosystemStore } from "../../stores/ecosystemStore";
import { useQAStore } from "../../stores/qaStore";
import { colors, radius, spacing, touch, typography, withAlpha } from "../../theme/tokens";

function formatMemory(totalMemory?: number | null) {
  if (!totalMemory) return "Unknown";
  return `${(totalMemory / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

export default function QAOverlay() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const unreadNotifications = useEcosystemStore((state) => state.unreadNotifications);
  const pendingAiInsights = useEcosystemStore((state) => state.pendingAiInsights);
  const [offlineSnapshot, setOfflineSnapshot] = useState(offline.getSnapshot());
  const panelOpen = useQAStore((state) => state.panelOpen);
  const launchReadyMs = useQAStore((state) => state.launchReadyMs);
  const currentRoute = useQAStore((state) => state.currentRoute);
  const lastNavigationMs = useQAStore((state) => state.lastNavigationMs);
  const lastNavigationSource = useQAStore((state) => state.lastNavigationSource);
  const togglePanel = useQAStore((state) => state.togglePanel);
  const closePanel = useQAStore((state) => state.closePanel);
  const resetNavigationMetric = useQAStore((state) => state.resetNavigationMetric);

  useEffect(() => offline.subscribe(setOfflineSnapshot), []);

  const unreadQueue = offlineSnapshot.queue.length;
  const deviceLabel = useMemo(
    () => `${Device.modelName ?? "Unknown device"} · ${Device.osName ?? "OS"} ${Device.osVersion ?? ""}`.trim(),
    [],
  );

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View style={[styles.triggerWrap, { top: insets.top + spacing.sm }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={panelOpen ? "Close QA overlay" : "Open QA overlay"}
          accessibilityHint="Shows device QA and performance metrics for the current session."
          onPress={togglePanel}
          style={({ pressed }) => [styles.trigger, pressed && styles.pressed]}
        >
          <Text style={styles.triggerText}>QA</Text>
        </Pressable>
      </View>

      {panelOpen ? (
        <View pointerEvents="box-none" style={[styles.panelWrap, { top: insets.top + spacing.xxl }]}>
          <Card accent="purple" style={styles.panel}>
            <View style={styles.panelHeader}>
              <View>
                <Text style={styles.title}>Device QA</Text>
                <Text style={styles.caption}>{deviceLabel}</Text>
              </View>
              <Pressable onPress={closePanel} style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>

            <View style={styles.badges}>
              <Badge label={offlineSnapshot.isOnline ? "Online" : "Offline"} variant={offlineSnapshot.isOnline ? "green" : "red"} />
              <Badge label={`Queue ${unreadQueue}`} variant={unreadQueue > 0 ? "gold" : "dim"} />
              <Badge label={`Route ${currentRoute}`} variant="purple" />
            </View>

            <View style={styles.metricGrid}>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Launch</Text>
                <Text style={styles.metricValue}>{launchReadyMs ? `${launchReadyMs} ms` : "Pending"}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Last nav</Text>
                <Text style={styles.metricValue}>{lastNavigationMs ? `${lastNavigationMs} ms` : "Waiting"}</Text>
              </View>
              <View style={styles.metricCard}>
                <Text style={styles.metricLabel}>Memory</Text>
                <Text style={styles.metricValue}>{formatMemory(Device.totalMemory)}</Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>Session</Text>
            <Text style={styles.body}>{`User: ${user?.name ?? "Signed out"}`}</Text>
            <Text style={styles.body}>{`Unread notifications: ${unreadNotifications}`}</Text>
            <Text style={styles.body}>{`Pending AI insights: ${pendingAiInsights}`}</Text>
            <Text style={styles.body}>{`Measured from: ${lastNavigationSource ?? "No tracked navigation yet"}`}</Text>

            <View style={styles.actions}>
              <Pressable
                onPress={() => {
                  void api.flushQueuedRequests();
                }}
                disabled={!offlineSnapshot.isOnline || unreadQueue === 0}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  (!offlineSnapshot.isOnline || unreadQueue === 0) && styles.disabledButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.secondaryButtonText, (!offlineSnapshot.isOnline || unreadQueue === 0) && styles.disabledText]}>
                  Flush queue
                </Text>
              </Pressable>

              <Pressable onPress={resetNavigationMetric} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}>
                <Text style={styles.secondaryButtonText}>Reset nav metric</Text>
              </Pressable>
            </View>
          </Card>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  triggerWrap: {
    position: "absolute",
    right: spacing.md,
    zIndex: 40,
  },
  trigger: {
    minWidth: touch.minimum,
    minHeight: touch.minimum,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: withAlpha("purple", 0.35),
    backgroundColor: withAlpha("purple", 0.18),
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.sm,
  },
  triggerText: {
    color: colors.purple,
    ...typography.labelLg,
  },
  panelWrap: {
    position: "absolute",
    right: spacing.md,
    width: 320,
    zIndex: 39,
  },
  panel: {
    marginBottom: 0,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    ...typography.displaySm,
  },
  caption: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  closeButton: {
    minHeight: touch.minimum,
    justifyContent: "center",
  },
  closeButtonText: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  metricCard: {
    minWidth: "47%",
    flexGrow: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    padding: spacing.sm + 2,
    gap: spacing.xs,
  },
  metricLabel: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  metricValue: {
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "700",
  },
  sectionLabel: {
    color: colors.textDim,
    ...typography.labelLg,
    marginBottom: spacing.sm,
  },
  body: {
    color: colors.textDim,
    ...typography.bodySm,
    marginBottom: spacing.xs,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  secondaryButton: {
    minHeight: touch.minimum,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  secondaryButtonText: {
    color: colors.text,
    ...typography.labelLg,
  },
  disabledButton: {
    opacity: 0.5,
  },
  disabledText: {
    color: colors.textDim,
  },
  pressed: {
    opacity: 0.8,
  },
});
