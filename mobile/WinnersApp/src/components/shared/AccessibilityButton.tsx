import React, { useMemo, useState } from "react";
import {
  AccessibilityInfo,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useAppShellStore } from "../../stores/appShellStore";
import {
  colors,
  radius,
  spacing,
  touch,
  typography,
  withAlpha,
} from "../../theme/tokens";

const ACCESSIBILITY_ICON = "\u267F";

export default function AccessibilityButton() {
  const [modalVisible, setModalVisible] = useState(false);
  const preferences = useAppShellStore((state) => state.preferences);
  const togglePreference = useAppShellStore((state) => state.togglePreference);
  const enabledCount = useMemo(
    () => Object.values(preferences).filter(Boolean).length,
    [preferences],
  );

  const accessibilityOptions = [
    {
      key: "reducedMotion" as const,
      label: "Reduced Motion",
      description: "Minimizes animations for a calmer experience.",
      icon: "\u26A0",
    },
    {
      key: "largeText" as const,
      label: "Large Text",
      description: "Increases text size for easier reading.",
      icon: "\u{1F4D6}",
    },
  ];

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Accessibility options${enabledCount ? `, ${enabledCount} enabled` : ""}`}
        accessibilityHint="Opens accessibility settings to customize your experience."
        onPress={() => {
          setModalVisible(true);
          void AccessibilityInfo.announceForAccessibility(
            "Accessibility options opened.",
          );
        }}
        style={({ pressed }) => [styles.button, pressed && styles.pressed]}
      >
        <Text style={styles.icon}>{ACCESSIBILITY_ICON}</Text>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setModalVisible(false);
          void AccessibilityInfo.announceForAccessibility(
            "Accessibility options closed.",
          );
        }}
      >
        <View style={styles.overlay}>
          <Pressable
            style={styles.backdrop}
            onPress={() => {
              setModalVisible(false);
              void AccessibilityInfo.announceForAccessibility(
                "Accessibility options closed.",
              );
            }}
            accessibilityRole="button"
            accessibilityLabel="Close accessibility menu"
          />
          <View
            accessible
            accessibilityViewIsModal
            accessibilityLabel="Accessibility settings"
            style={styles.modal}
          >
            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <Text accessibilityRole="header" style={styles.title}>
                  Accessibility
                </Text>
                <Text style={styles.subtitle}>
                  Adjust reading comfort and motion preferences for this device.
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                hitSlop={8}
                onPress={() => {
                  setModalVisible(false);
                  void AccessibilityInfo.announceForAccessibility(
                    "Accessibility options closed.",
                  );
                }}
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.closeIcon}>×</Text>
              </Pressable>
            </View>

            <View style={styles.options}>
              {accessibilityOptions.map((option) => {
                const enabled = preferences[option.key];
                return (
                  <Pressable
                    key={option.key}
                    accessibilityRole="switch"
                    accessibilityState={{ checked: enabled }}
                    accessibilityLabel={`${option.label}, ${enabled ? "enabled" : "disabled"}`}
                    accessibilityHint={option.description}
                    onPress={() => {
                      togglePreference(option.key);
                      void AccessibilityInfo.announceForAccessibility(
                        `${option.label} ${enabled ? "disabled" : "enabled"}.`,
                      );
                    }}
                    style={({ pressed }) => [
                      styles.option,
                      pressed && styles.pressed,
                      enabled && styles.optionEnabled,
                    ]}
                  >
                    <View style={styles.optionIcon}>
                      <Text style={styles.optionIconText}>{option.icon}</Text>
                    </View>
                    <View style={styles.optionContent}>
                      <Text style={styles.optionLabel}>{option.label}</Text>
                      <Text style={styles.optionDescription}>
                        {option.description}
                      </Text>
                    </View>
                    <View
                      style={[styles.toggle, enabled && styles.toggleEnabled]}
                    >
                      <Text style={[styles.toggleLabel, enabled && styles.toggleLabelEnabled]}>
                        {enabled ? "On" : "Off"}
                      </Text>
                      <View
                        style={[
                          styles.toggleKnob,
                          enabled && styles.toggleKnobEnabled,
                        ]}
                      />
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                These settings help make Winners more comfortable for everyone.
              </Text>
              <Text style={styles.footerMeta}>
                Active now: {enabledCount}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: touch.minimum,
    height: touch.minimum,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 20,
    color: colors.ice,
  },
  pressed: {
    opacity: 0.72,
  },
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: withAlpha("bg", 0.85),
  },
  modal: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: withAlpha("border", 0.92),
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: withAlpha("border", 0.92),
  },
  headerCopy: {
    flex: 1,
    gap: spacing.xs,
    paddingRight: spacing.sm,
  },
  title: {
    color: colors.text,
    ...typography.displaySm,
  },
  subtitle: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: withAlpha("surface2", 0.8),
  },
  closeIcon: {
    fontSize: 24,
    color: colors.textDim,
    lineHeight: 28,
  },
  options: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: withAlpha("surface2", 0.6),
    gap: spacing.md,
  },
  optionEnabled: {
    backgroundColor: withAlpha("ice", 0.12),
    borderColor: withAlpha("ice", 0.3),
    borderWidth: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: withAlpha("surface3", 0.8),
    alignItems: "center",
    justifyContent: "center",
  },
  optionIconText: {
    fontSize: 20,
  },
  optionContent: {
    flex: 1,
    gap: spacing.xs,
  },
  optionLabel: {
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "700",
  },
  optionDescription: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  toggle: {
    width: 48,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: withAlpha("surface3", 0.8),
    padding: 2,
    justifyContent: "center",
    overflow: "hidden",
  },
  toggleEnabled: {
    backgroundColor: colors.ice,
  },
  toggleLabel: {
    position: "absolute",
    left: 8,
    color: colors.textDim,
    ...typography.labelSm,
  },
  toggleLabelEnabled: {
    left: 6,
    color: colors.bg,
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    backgroundColor: colors.textDim,
  },
  toggleKnobEnabled: {
    backgroundColor: colors.text,
    alignSelf: "flex-end",
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: withAlpha("border", 0.92),
  },
  footerText: {
    color: colors.textDim,
    ...typography.bodySm,
    textAlign: "center",
  },
  footerMeta: {
    marginTop: spacing.xs,
    color: colors.text,
    ...typography.labelMd,
    textAlign: "center",
  },
});
