import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import EcosystemContextBar from "../../components/shared/EcosystemContextBar";
import { CommunityStackParamList } from "../../navigation/types";
import { useCommunityStore } from "../../stores/communityStore";
import { colors, spacing, touch, typography } from "../../theme/tokens";

type Props = NativeStackScreenProps<CommunityStackParamList, "Groups">;

export default function GroupsScreen({ navigation }: Props) {
  const groups = useCommunityStore((state) => state.groups);
  const joinGroup = useCommunityStore((state) => state.joinGroup);
  const myGroups = useMemo(() => groups.filter((group) => group.joined), [groups]);
  const discoverGroups = useMemo(() => groups.filter((group) => !group.joined), [groups]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <EcosystemContextBar
        accent="green"
        label="NOVA"
        context="Your strongest community momentum is in operator circles and creator collaboration groups right now."
      />

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Groups</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create post"
          accessibilityHint="Open the post composer."
          onPress={() => navigation.navigate("CreatePost")}
          style={({ pressed }) => [styles.inlineButton, pressed && styles.pressed]}
        >
          <Text style={styles.inlineButtonText}>Create</Text>
        </Pressable>
      </View>

      {myGroups.length === 0 ? (
        <EmptyState
          icon="[]"
          headline="No joined groups yet"
          body="NOVA can point you to the circles most likely to accelerate your next operator move."
          ctaLabel="Discover groups"
          onCta={() => undefined}
          assistant="nova"
        />
      ) : (
        myGroups.map((group) => (
          <Pressable key={group.id} onPress={() => navigation.navigate("GroupDetail", { groupId: group.id })}>
            <Card accent="green">
              <View style={styles.groupTop}>
                <View style={styles.groupCopy}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupDescription}>{group.description}</Text>
                </View>
                <Badge label={group.privacy} variant={group.privacy === "Public" ? "green" : "purple"} />
              </View>
              <Text style={styles.groupMeta}>
                {group.members} members · {group.posts} posts · {group.location}
              </Text>
            </Card>
          </Pressable>
        ))
      )}

      <Text style={styles.sectionTitle}>Discover</Text>

      {discoverGroups.map((group) => (
        <Card key={group.id} accent="green">
          <View style={styles.groupTop}>
            <View style={styles.groupCopy}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupDescription}>{group.description}</Text>
            </View>
            <Badge label={group.privacy} variant={group.privacy === "Public" ? "green" : "purple"} />
          </View>
          <Text style={styles.groupMeta}>
            {group.members} members · {group.posts} posts · {group.location}
          </Text>
          <View style={styles.tags}>
            {group.tags.map((tag) => (
              <Badge key={`${group.id}-${tag}`} label={tag} variant="dim" />
            ))}
          </View>
          <View style={styles.groupActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${group.name}`}
              onPress={() => navigation.navigate("GroupDetail", { groupId: group.id })}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryButtonText}>View</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Join ${group.name}`}
              onPress={() => joinGroup(group.id)}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonText}>Join</Text>
            </Pressable>
          </View>
        </Card>
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
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    ...typography.displaySm,
  },
  inlineButton: {
    minHeight: touch.minimum,
    justifyContent: "center",
  },
  inlineButtonText: {
    color: colors.gold,
    ...typography.labelLg,
  },
  groupTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  groupCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  groupName: {
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "700",
  },
  groupDescription: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  groupMeta: {
    marginTop: spacing.sm,
    color: colors.textDim,
    ...typography.bodySm,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  groupActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  primaryButton: {
    flex: 1,
    minHeight: touch.comfortable,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  primaryButtonText: {
    color: colors.bg,
    ...typography.labelLg,
  },
  secondaryButton: {
    flex: 1,
    minHeight: touch.comfortable,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  secondaryButtonText: {
    color: colors.text,
    ...typography.labelLg,
  },
  pressed: {
    opacity: 0.78,
  },
});
