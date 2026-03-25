import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import { RootStackParamList } from "../../navigation/types";
import { useAppShellStore } from "../../stores/appShellStore";
import { colors, radius, spacing, touch, typography } from "../../theme/tokens";

type Props = NativeStackScreenProps<RootStackParamList, "Messages">;

export default function MessagesScreen({ navigation }: Props) {
  const threads = useAppShellStore((state) => state.threads);
  const markThreadRead = useAppShellStore((state) => state.markThreadRead);

  const unreadCount = useMemo(() => threads.reduce((total, thread) => total + thread.unreadCount, 0), [threads]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <Card accent="blue">
        <Text style={styles.sectionTitle}>Direct messages</Text>
        <Text style={styles.body}>{`${unreadCount} unread messages across assistants, clients, and operators.`}</Text>
      </Card>

      {threads.map((thread) => (
        <Pressable
          key={thread.id}
          onPress={() => {
            markThreadRead(thread.id);

            if (thread.role === "Client") {
              navigation.navigate("Main", { screen: "Work", params: { screen: "ContractDetail", params: { contractId: "contract-1234" } } });
              return;
            }

            if (thread.name === "SAGE") {
              navigation.navigate("Main", { screen: "AI", params: { screen: "SAGEChat" } });
              return;
            }

            navigation.navigate("Main", { screen: "AI", params: { screen: "ATLASChat" } });
          }}
        >
          <Card accent={thread.accent}>
            <View style={styles.threadTop}>
              <View>
                <Text style={styles.threadName}>{thread.name}</Text>
                <Text style={styles.threadRole}>{thread.role}</Text>
              </View>
              <View style={styles.threadMeta}>
                {thread.unreadCount > 0 ? <Badge label={String(thread.unreadCount)} variant={thread.accent} /> : null}
                <Text style={styles.timestamp}>{thread.updatedAt}</Text>
              </View>
            </View>
            <Text style={styles.body}>{thread.preview}</Text>
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
  sectionTitle: {
    color: colors.text,
    ...typography.displaySm,
  },
  body: {
    color: colors.textDim,
    ...typography.bodyMd,
  },
  threadTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  threadMeta: {
    alignItems: "flex-end",
    gap: spacing.xs,
  },
  threadName: {
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "700",
  },
  threadRole: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  timestamp: {
    color: colors.textDim,
    ...typography.bodySm,
  },
});
