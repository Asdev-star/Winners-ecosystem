import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AccessibilityInfo,
  FlatList,
  Pressable,
  RefreshControl,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Card from "../../components/ui/Card";
import Skeleton from "../../components/ui/Skeleton";
import EcosystemContextBar from "../../components/shared/EcosystemContextBar";
import OfflineBanner from "../../components/shared/OfflineBanner";
import AssistantFAB from "../../components/shared/AssistantFAB";
import { CommunityStackParamList } from "../../navigation/types";
import { api } from "../../services/api";
import { offline } from "../../services/offline";
import { useCommunityStore, type CommunityPost } from "../../stores/communityStore";
import { colors, radius, spacing, touch, typography, withAlpha } from "../../theme/tokens";

type Props = NativeStackScreenProps<CommunityStackParamList, "Feed">;

const STORIES = [
  { id: "user-amina", label: "You" },
  { id: "user-amina", label: "Amina" },
  { id: "user-samuel", label: "Samuel" },
  { id: "user-lebo", label: "Lebo" },
  { id: "user-zuri", label: "Zuri" },
];

const EXTRA_POSTS: CommunityPost[] = [
  {
    id: "post-extra-1",
    authorId: "user-nova",
    authorName: "NOVA Feed",
    authorRole: "Realtime Signal",
    relativeTime: "Moments ago",
    absoluteTime: "Posted at 5:44 PM",
    content: "A fresh collaboration signal was appended to the feed while you were scrolling.",
    likes: 3,
    liked: false,
    comments: 0,
  },
  {
    id: "post-extra-2",
    authorId: "user-circuit",
    authorName: "CIRCUIT Relay",
    authorRole: "Opportunity Signal",
    relativeTime: "Moments ago",
    absoluteTime: "Posted at 5:46 PM",
    content: "Operators who replied to work opportunities this week are also asking for group-based accountability threads.",
    likes: 1,
    liked: false,
    comments: 0,
  },
];

function sharePost(post: CommunityPost) {
  return Share.share({
    message: `${post.authorName}: ${post.content}`,
  });
}

export default function FeedScreen({ navigation }: Props) {
  const posts = useCommunityStore((state) => state.posts);
  const appendPosts = useCommunityStore((state) => state.appendPosts);
  const togglePostLike = useCommunityStore((state) => state.togglePostLike);
  const [offlineState, setOfflineState] = useState(offline.getSnapshot());
  const [onlineUsers, setOnlineUsers] = useState<Array<{ userId: string; userName: string; joinedAt: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [lastImageTap, setLastImageTap] = useState(0);

  useEffect(() => {
    const unsubscribe = offline.subscribe(setOfflineState);
    return unsubscribe;
  }, []);

  const refreshPresence = useCallback(async () => {
    try {
      const data = await api.get<{ onlineUsers?: Array<{ userId: string; userName: string; joinedAt: number }> }>("/posts/online");
      setOnlineUsers(data.onlineUsers ?? []);
    } catch {
      setOnlineUsers([]);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 650);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    void refreshPresence();
    const interval = setInterval(() => {
      void refreshPresence();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshPresence]);

  const feedPosts = useMemo(() => posts, [posts]);

  const applyLike = (postId: string, viaImage = false) => {
    const updatedPost = togglePostLike(postId);

    if (updatedPost) {
      void AccessibilityInfo.announceForAccessibility(
        `${updatedPost.liked ? "Liked" : "Not liked"}, ${updatedPost.likes} like${updatedPost.likes === 1 ? "" : "s"}`,
      );
    }

    if (!offlineState.isOnline) {
      offline.enqueue({
        endpoint: `/community/posts/${postId}/like`,
        method: "POST",
        body: { source: viaImage ? "double-tap-image" : "feed-button" },
      });
    }
  };

  const refreshFeed = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 850));
    setRefreshing(false);
  };

  const loadMorePosts = async () => {
    if (loadingMore || posts.some((post) => post.id === EXTRA_POSTS[0]?.id)) {
      return;
    }

    setLoadingMore(true);
    void AccessibilityInfo.announceForAccessibility("Loading more posts");
    await new Promise((resolve) => setTimeout(resolve, 900));
    appendPosts(EXTRA_POSTS);
    setLoadingMore(false);
  };

  const header = (
    <View style={styles.headerStack}>
      <EcosystemContextBar
        accent="green"
        label="NOVA"
        context="Today's signal: founder accountability, diaspora introductions, and creator collaboration are driving the strongest replies."
      />
      <View style={styles.presenceCard}>
        <View style={styles.presenceHeader}>
          <Text style={styles.presenceTitle}>Live now</Text>
          <Text style={styles.presenceCount}>{`${onlineUsers.length} active`}</Text>
        </View>
        <View style={styles.presenceAvatars}>
          {onlineUsers.slice(0, 4).map((user) => (
            <View key={user.userId} style={styles.presenceAvatar} accessibilityLabel={`${user.userName} is online`}>
              <Text style={styles.presenceAvatarText}>{user.userName.slice(0, 1).toUpperCase()}</Text>
            </View>
          ))}
          {onlineUsers.length > 4 ? (
            <View style={styles.presenceAvatarOverflow}>
              <Text style={styles.presenceAvatarOverflowText}>+{onlineUsers.length - 4}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <OfflineBanner
        isOnline={offlineState.isOnline}
        isSyncing={offlineState.isSyncing}
        pendingCount={offlineState.queue.length}
        onSync={() => {
          void api.flushQueuedRequests();
        }}
      />

      <View style={styles.quickActions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Create post"
          accessibilityHint="Opens the community composer."
          onPress={() => navigation.navigate("CreatePost")}
          style={({ pressed }) => [styles.quickActionButton, styles.quickActionPrimary, pressed && styles.pressed]}
        >
          <Text style={styles.quickActionPrimaryText}>Create Post</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open groups"
          accessibilityHint="Opens your community groups."
          onPress={() => navigation.navigate("Groups")}
          style={({ pressed }) => [styles.quickActionButton, styles.quickActionSecondary, pressed && styles.pressed]}
        >
          <Text style={styles.quickActionSecondaryText}>Groups</Text>
        </Pressable>
      </View>

      <View>
        <Text style={styles.sectionLabel}>Stories</Text>
        <FlatList
          data={STORIES}
          horizontal
          keyExtractor={(item) => `${item.id}-${item.label}`}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.label} profile`}
              accessibilityHint="Opens the member profile."
              onPress={() => navigation.navigate("UserProfile", { userId: item.id })}
              style={({ pressed }) => [styles.storyItem, pressed && styles.pressed]}
            >
              <View style={styles.storyCircle}>
                <Text style={styles.storyInitial}>{item.label.slice(0, 1)}</Text>
              </View>
              <Text style={styles.storyName}>{item.label}</Text>
            </Pressable>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.storiesRow}
        />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.screen}>
        {header}
        <View style={styles.loadingWrap}>
          <Skeleton height={120} />
          <Skeleton height={180} />
          <Skeleton height={180} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={feedPosts}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.feedContent}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          void loadMorePosts();
        }}
        refreshControl={<RefreshControl tintColor={colors.gold} refreshing={refreshing} onRefresh={() => void refreshFeed()} />}
        renderItem={({ item }) => (
          <Card accent="green" style={styles.postCard}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${item.authorName} post`}
              accessibilityHint="Opens the full post and comments."
              onPress={() => navigation.navigate("PostDetail", { postId: item.id })}
            >
              <View style={styles.postTop}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${item.authorName} profile`}
                  accessibilityHint="Opens this member profile."
                  onPress={() => navigation.navigate("UserProfile", { userId: item.authorId })}
                  style={styles.avatar}
                >
                  <Text style={styles.avatarText}>{item.authorName.slice(0, 1)}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${item.authorName} profile`}
                  accessibilityHint="Opens this member profile."
                  onPress={() => navigation.navigate("UserProfile", { userId: item.authorId })}
                  style={styles.postMeta}
                >
                  <Text style={styles.author}>{item.authorName}</Text>
                  <Text style={styles.role}>{item.authorRole}</Text>
                  <Text accessibilityLabel={item.absoluteTime} style={styles.timestamp}>
                    {item.relativeTime}
                  </Text>
                </Pressable>
              </View>

              <Text style={styles.postBody}>{item.content}</Text>

              {item.imageLabel ? (
                <Pressable
                  accessibilityRole="imagebutton"
                  accessibilityLabel={item.imageLabel}
                  accessibilityHint="Double tap to like this post image."
                  onPress={() => {
                    const now = Date.now();
                    if (now - lastImageTap < 280) {
                      applyLike(item.id, true);
                    }
                    setLastImageTap(now);
                  }}
                  style={styles.imagePlaceholder}
                >
                  <Text style={styles.imagePlaceholderText}>Preview image</Text>
                </Pressable>
              ) : null}
            </Pressable>

            <View style={styles.actionsRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${item.liked ? "Liked" : "Not liked"}, ${item.likes} likes`}
                accessibilityHint="Toggles the like state for this post."
                onPress={() => applyLike(item.id)}
                style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
              >
                <Text style={[styles.actionText, item.liked && styles.actionTextActive]}>Like</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${item.comments} comments`}
                accessibilityHint="Opens the comments for this post."
                onPress={() => navigation.navigate("PostDetail", { postId: item.id })}
                style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
              >
                <Text style={styles.actionText}>Comment</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Share post"
                accessibilityHint="Opens native sharing for this post."
                onPress={() => {
                  void sharePost(item);
                }}
                style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
              >
                <Text style={styles.actionText}>Share</Text>
              </Pressable>
            </View>
          </Card>
        )}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerLoading}>
              <Skeleton height={140} />
            </View>
          ) : (
            <View style={styles.footerSpacer} />
          )
        }
      />

      <AssistantFAB onPress={() => navigation.getParent()?.navigate("AI", { screen: "NOVAChat" })} label="Draft with NOVA" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerStack: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  presenceCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  presenceHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  presenceTitle: {
    color: colors.text,
    ...typography.labelLg,
  },
  presenceCount: {
    color: colors.green,
    ...typography.bodySm,
    fontWeight: "700",
  },
  presenceAvatars: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  presenceAvatar: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: withAlpha("green", 0.16),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: withAlpha("green", 0.28),
  },
  presenceAvatarText: {
    color: colors.green,
    ...typography.labelLg,
  },
  presenceAvatarOverflow: {
    minWidth: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presenceAvatarOverflowText: {
    color: colors.textDim,
    ...typography.bodySm,
    fontWeight: "700",
  },
  loadingWrap: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  feedContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 120,
    gap: spacing.sm,
  },
  quickActions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  quickActionButton: {
    flex: 1,
    minHeight: touch.comfortable,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  quickActionPrimary: {
    backgroundColor: colors.gold,
  },
  quickActionSecondary: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickActionPrimaryText: {
    color: colors.bg,
    ...typography.labelLg,
  },
  quickActionSecondaryText: {
    color: colors.text,
    ...typography.labelLg,
  },
  sectionLabel: {
    ...typography.labelLg,
    color: colors.textDim,
    marginBottom: spacing.sm,
  },
  storiesRow: {
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  storyItem: {
    alignItems: "center",
    gap: spacing.xs,
    width: 72,
  },
  storyCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.full,
    backgroundColor: colors.surface2,
    borderWidth: 2,
    borderColor: withAlpha("green", 0.35),
    alignItems: "center",
    justifyContent: "center",
  },
  storyInitial: {
    color: colors.green,
    ...typography.displaySm,
  },
  storyName: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  postCard: {
    marginBottom: spacing.sm,
  },
  postTop: {
    flexDirection: "row",
    alignItems: "center",
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
    marginBottom: spacing.sm,
  },
  imagePlaceholder: {
    height: 176,
    borderRadius: radius.lg,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  imagePlaceholderText: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    gap: spacing.xs,
  },
  actionButton: {
    minHeight: touch.minimum,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  actionText: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  actionTextActive: {
    color: colors.gold,
    fontWeight: "700",
  },
  footerLoading: {
    paddingTop: spacing.sm,
  },
  footerSpacer: {
    height: 120,
  },
  pressed: {
    opacity: 0.76,
  },
});
