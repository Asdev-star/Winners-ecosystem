import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import { CommunityStackParamList } from "../../navigation/types";
import {
  getCommunityPostsForUser,
  getCommunityProfile,
  useCommunityStore,
} from "../../stores/communityStore";
import { colors, radius, spacing, touch, typography, withAlpha } from "../../theme/tokens";

type Props = NativeStackScreenProps<CommunityStackParamList, "UserProfile">;

export default function UserProfileScreen({ navigation, route }: Props) {
  const profiles = useCommunityStore((state) => state.profiles);
  const groups = useCommunityStore((state) => state.groups);

  const profile = useMemo(
    () => profiles[route.params.userId] ?? getCommunityProfile(route.params.userId),
    [profiles, route.params.userId],
  );
  const posts = useMemo(() => getCommunityPostsForUser(route.params.userId), [profiles, route.params.userId]);
  const joinedGroups = useMemo(
    () => groups.filter((group) => group.joined && group.tags.some((tag) => profile?.topSkills.some((skill) => skill.includes(tag) || tag.includes(skill)))),
    [groups, profile],
  );

  if (!profile) {
    return (
      <View style={styles.missingWrap}>
        <EmptyState
          icon="@"
          headline="Profile unavailable"
          body="This member route is wired, but the profile data is missing right now."
          assistant="nova"
        />
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Card accent="green">
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{profile.name.slice(0, 1)}</Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.name}>{profile.name}</Text>
            <Text style={styles.role}>{profile.role}</Text>
            <Text style={styles.location}>{profile.location}</Text>
          </View>
        </View>

        <Text style={styles.bio}>{profile.bio}</Text>

        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{profile.followers}</Text>
            <Text style={styles.metricLabel}>Followers</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{profile.contributions}</Text>
            <Text style={styles.metricLabel}>Contributions</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{posts.length}</Text>
            <Text style={styles.metricLabel}>Posts</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Top Skills</Text>
        <View style={styles.badges}>
          {profile.topSkills.map((skill) => (
            <Badge key={skill} label={skill} variant="green" />
          ))}
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Recent Posts</Text>
      {posts.length === 0 ? (
        <EmptyState
          icon="[]"
          headline="No posts yet"
          body="NOVA suggests starting with a specific operator lesson or ask so collaborators know how to respond."
          assistant="nova"
        />
      ) : (
        posts.map((post) => (
          <Pressable key={post.id} onPress={() => navigation.navigate("PostDetail", { postId: post.id })}>
            <Card accent="green">
              <Text style={styles.postTime}>{post.relativeTime}</Text>
              <Text style={styles.postBody}>{post.content}</Text>
              <Text style={styles.postMeta}>
                {post.likes} likes · {post.comments} comments
              </Text>
            </Card>
          </Pressable>
        ))
      )}

      <Text style={styles.sectionTitle}>Shared Group Signals</Text>
      {joinedGroups.length === 0 ? (
        <EmptyState
          icon="[]"
          headline="No shared groups yet"
          body="NOVA can still route this member into relevant circles as the community graph fills in."
          assistant="nova"
        />
      ) : (
        joinedGroups.slice(0, 3).map((group) => (
          <Pressable key={group.id} onPress={() => navigation.navigate("GroupDetail", { groupId: group.id })}>
            <Card accent="green">
              <View style={styles.groupTop}>
                <Text style={styles.groupName}>{group.name}</Text>
                <Badge label={group.privacy} variant={group.privacy === "Public" ? "green" : "purple"} />
              </View>
              <Text style={styles.groupInsight}>{group.novaInsight}</Text>
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
    backgroundColor: colors.bg,
    padding: spacing.md,
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  hero: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: radius.full,
    backgroundColor: withAlpha("green", 0.14),
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: colors.green,
    ...typography.displaySm,
  },
  heroCopy: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.text,
    ...typography.displaySm,
  },
  role: {
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "700",
  },
  location: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  bio: {
    color: colors.textDim,
    ...typography.bodyMd,
  },
  metricsRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  metric: {
    flex: 1,
    minHeight: 84,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    alignItems: "center",
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
  sectionLabel: {
    marginTop: spacing.md,
    color: colors.textDim,
    ...typography.labelLg,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    color: colors.text,
    ...typography.displaySm,
    marginTop: spacing.xs,
  },
  postTime: {
    color: colors.textDim,
    marginBottom: spacing.xs,
    ...typography.bodySm,
  },
  postBody: {
    color: colors.text,
    ...typography.bodyMd,
  },
  postMeta: {
    color: colors.textDim,
    marginTop: spacing.sm,
    ...typography.bodySm,
  },
  groupTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  groupName: {
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "700",
  },
  groupInsight: {
    color: colors.textDim,
    ...typography.bodyMd,
  },
});
