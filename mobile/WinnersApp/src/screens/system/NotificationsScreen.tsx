import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import { RootStackParamList } from "../../navigation/types";
import { useAppShellStore } from "../../stores/appShellStore";
import { useEcosystemStore } from "../../stores/ecosystemStore";
import { colors, radius, spacing, touch, typography } from "../../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "Notifications">;

export default function NotificationsScreen({ navigation }: Props) {
  const notifications = useAppShellStore((state) => state.notifications);
  const markNotificationRead = useAppShellStore((state) => state.markNotificationRead);
  const markAllNotificationsRead = useAppShellStore((state) => state.markAllNotificationsRead);
  const setUnreadNotifications = useEcosystemStore((state) => state.setUnreadNotifications);

  const unreadCount = useMemo(() => notifications.filter((notification) => !notification.read).length, [notifications]);

  const openTarget = (target: (typeof notifications)[number]["target"]) => {
    if (target.type === "community-post") {
      navigation.navigate("Main", { screen: "Community", params: { screen: "PostDetail", params: { postId: target.postId } } });
      return;
    }

    if (target.type === "academy-course") {
      navigation.navigate("Main", { screen: "Academy", params: { screen: "CourseDetail", params: { slug: target.slug } } });
      return;
    }

    if (target.type === "market-product") {
      navigation.navigate("Main", { screen: "Market", params: { screen: "ProductDetail", params: { productId: target.productId } } });
      return;
    }

    if (target.type === "work-job") {
      navigation.navigate("Main", { screen: "Work", params: { screen: "JobDetail", params: { jobId: target.jobId } } });
      return;
    }

    navigation.navigate("Main", { screen: "AI", params: { screen: "Hub" } });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Card accent="red">
        <View style={styles.topRow}>
          <View>
            <Text style={styles.sectionTitle}>Inbox</Text>
            <Text style={styles.body}>{`${unreadCount} unread notifications`}</Text>
          </View>
          <Pressable
            onPress={() => {
              markAllNotificationsRead();
              setUnreadNotifications(0);
            }}
            style={({ pressed }) => [styles.markAllButton, pressed && styles.pressed]}
          >
            <Text style={styles.markAllText}>Mark all read</Text>
          </Pressable>
        </View>
      </Card>

      {notifications.map((notification) => (
        <Pressable
          key={notification.id}
          onPress={() => {
            markNotificationRead(notification.id);
            if (!notification.read) {
              setUnreadNotifications(Math.max(0, unreadCount - 1));
            }
            openTarget(notification.target);
          }}
        >
          <Card accent={notification.accent}>
            <View style={styles.notificationTop}>
              <Badge label={notification.read ? "Read" : "New"} variant={notification.read ? "dim" : notification.accent} />
              <Text style={styles.timestamp}>{notification.timestamp}</Text>
            </View>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <Text style={styles.body}>{notification.body}</Text>
          </Card>
        </Pressable>
      ))}
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
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    ...typography.displaySm,
  },
  body: {
    color: colors.textDim,
    ...typography.bodyMd,
  },
  markAllButton: {
    minHeight: touch.minimum,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  markAllText: {
    color: colors.text,
    ...typography.labelLg,
  },
  notificationTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  timestamp: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  notificationTitle: {
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  pressed: {
    opacity: 0.8,
  },
});
