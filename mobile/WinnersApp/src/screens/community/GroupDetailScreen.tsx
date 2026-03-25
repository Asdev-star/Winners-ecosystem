import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import { CommunityStackParamList } from "../../navigation/types";
import { getCommunityGroup, getCommunityPostsForGroup, useCommunityStore } from "../../stores/communityStore";
import { colors, radius, spacing, touch, typography, withAlpha } from "../../theme/tokens";

type Props = NativeStackScreenProps<CommunityStackParamList, "GroupDetail">;

export default function GroupDetailScreen({ navigation, route }: Props) {
  const groups = useCommunityStore((state) => state.groups);
  const communityPosts = useCommunityStore((state) => state.posts);
  const joinGroup = useCommunityStore((state) => state.joinGroup);
  const leaveGroup = useCommunityStore((state) => state.leaveGroup);

  const group = useMemo(
    () => groups.find((entry) => entry.id === route.params.groupId) ?? getCommunityGroup(route.params.groupId),
    [groups, route.params.groupId],
  );
  const posts = useMemo(() => getCommunityPostsForGroup(route.params.groupId), [communityPosts, route.params.groupId]);

  if (!group) {
    return (
      <View style={styles.missingWrap}>
        <EmptyState
          icon="!"
          headline="Group unavailable"
          body="This group route is active, but the underlying group could not be loaded."
          assistant="nova"
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card accent="green">
        <View style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <Text style={styles.groupName}>{group.name}</Text>
            <Text style={styles.groupDescription}>{group.description}</Text>
          </View>
          <Badge label={group.privacy} variant={group.privacy === "Public" ? "green" : "purple"} />
        </View>

        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{group.members}</Text>
            <Text style={styles.metricLabel}>Members</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{group.posts}</Text>
            <Text style={styles.metricLabel}>Posts</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{group.location}</Text>
            <Text style={styles.metricLabel}>Scope</Text>
          </View>
        </View>

        <Card accent="green" style={styles.insightCard}>
          <Text style={styles.insightLabel}>NOVA Insight</Text>
          <Text style={styles.insightText}>{group.novaInsight}</Text>
        </Card>

        <View style={styles.actionRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={group.joined ? `Leave ${group.name}` : `Join ${group.name}`}
            onPress={() => (group.joined ? leaveGroup(group.id) : joinGroup(group.id))}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>{group.joined ? "Joined" : "Join Group"}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Create post in group"
            onPress={() => navigation.navigate("CreatePost", { groupId: group.id })}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryButtonText}>Post</Text>
          </Pressable>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Recent Posts</Text>

      {posts.length === 0 ? (
        <EmptyState
          icon="[]"
          headline="No posts in this group yet"
          body="NOVA suggests opening with a concrete ask so the right members can self-select into the conversation."
          ctaLabel="Create first post"
          onCta={() => navigation.navigate("CreatePost", { groupId: group.id })}
          assistant="nova"
        />
      ) : (
        posts.map((post) => (
          <Pressable key={post.id} onPress={() => navigation.navigate("PostDetail", { postId: post.id })}>
            <Card accent="green">
              <View style={styles.postTop}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{post.authorName.slice(0, 1)}</Text>
                </View>
                <View style={styles.postMeta}>
                  <Text style={styles.author}>{post.authorName}</Text>
                  <Text style={styles.role}>{post.authorRole}</Text>
                  <Text style={styles.timestamp}>{post.relativeTime}</Text>
                </View>
              </View>
              <Text style={styles.postBody}>{post.content}</Text>
              <Text style={styles.postMetaLine}>
                {post.likes} likes · {post.comments} comments
              </Text>
            </Card>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  missingWrap: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  heroTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  heroCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  groupName: {
    color: colors.text,
    ...typography.displaySm,
  },
  groupDescription: {
    color: colors.textDim,
    ...typography.bodyMd,
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  metric: {
    flex: 1,
    minHeight: 76,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    padding: spacing.sm,
    justifyContent: "center",
    gap: spacing.xs,
  },
  metricValue: {
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "700",
  },
  metricLabel: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  insightCard: {
    marginTop: spacing.md,
    marginBottom: 0,
    backgroundColor: withAlpha("green", 0.06),
  },
  insightLabel: {
    color: colors.green,
    ...typography.labelLg,
    marginBottom: spacing.xs,
  },
  insightText: {
    color: colors.text,
    ...typography.bodyMd,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  primaryButton: {
    flex: 1,
    minHeight: touch.comfortable,
    backgroundColor: colors.gold,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: colors.bg,
    ...typography.labelLg,
  },
  secondaryButton: {
    minWidth: 92,
    minHeight: touch.comfortable,
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
  sectionTitle: {
    color: colors.text,
    ...typography.displaySm,
    marginTop: spacing.xs,
  },
  postTop: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: withAlpha("green", 0.14),
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.green,
    ...typography.labelLg,
  },
  postMeta: {
    flex: 1,
    gap: 2,
  },
  author: {
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "700",
  },
  role: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  timestamp: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  postBody: {
    color: colors.text,
    ...typography.bodyMd,
  },
  postMetaLine: {
    marginTop: spacing.sm,
    color: colors.textDim,
    ...typography.bodySm,
  },
  pressed: {
    opacity: 0.78,
  },
});
