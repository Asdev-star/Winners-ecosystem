import React, { useMemo, useState } from "react";
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import { CommunityStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../stores/authStore";
import { getCommunityPost, useCommunityStore } from "../../stores/communityStore";
import { colors, radius, spacing, touch, typography, withAlpha } from "../../theme/tokens";

type Props = NativeStackScreenProps<CommunityStackParamList, "PostDetail">;

export default function PostScreen({ navigation, route }: Props) {
  const currentUser = useAuthStore((state) => state.user);
  const posts = useCommunityStore((state) => state.posts);
  const comments = useCommunityStore((state) => state.comments[route.params.postId] ?? []);
  const togglePostLike = useCommunityStore((state) => state.togglePostLike);
  const addComment = useCommunityStore((state) => state.addComment);
  const toggleCommentLike = useCommunityStore((state) => state.toggleCommentLike);
  const [draftComment, setDraftComment] = useState("");

  const post = useMemo(
    () => posts.find((entry) => entry.id === route.params.postId) ?? getCommunityPost(route.params.postId),
    [posts, route.params.postId],
  );

  if (!post) {
    return (
      <View style={styles.missingWrap}>
        <EmptyState
          icon="?"
          headline="Post unavailable"
          body="NOVA could not load this thread right now, but the route is still active and ready for a retry."
          ctaLabel="Back to feed"
          onCta={() => navigation.goBack()}
          assistant="nova"
        />
      </View>
    );
  }

  const handlePostLike = () => {
    const updatedPost = togglePostLike(post.id);
    if (!updatedPost) return;

    void AccessibilityInfo.announceForAccessibility(
      `${updatedPost.liked ? "Liked" : "Not liked"}, ${updatedPost.likes} like${updatedPost.likes === 1 ? "" : "s"}`,
    );
  };

  const handleCommentSubmit = () => {
    if (!draftComment.trim() || !currentUser) {
      return;
    }

    addComment(post.id, {
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role === "owner" ? "Ecosystem Owner" : "Community Member",
      body: draftComment,
    });

    setDraftComment("");
    void AccessibilityInfo.announceForAccessibility("Comment posted");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      keyboardVerticalOffset={Platform.select({ ios: 88, android: 0 })}
      style={styles.screen}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Card accent="green">
          <View style={styles.postTop}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${post.authorName} profile`}
              onPress={() => navigation.navigate("UserProfile", { userId: post.authorId })}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{post.authorName.slice(0, 1)}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${post.authorName} profile`}
              onPress={() => navigation.navigate("UserProfile", { userId: post.authorId })}
              style={styles.postMeta}
            >
              <Text style={styles.author}>{post.authorName}</Text>
              <Text style={styles.role}>{post.authorRole}</Text>
              <Text accessibilityLabel={post.absoluteTime} style={styles.timestamp}>
                {post.relativeTime}
              </Text>
            </Pressable>
          </View>

          <Text style={styles.postBody}>{post.content}</Text>

          {post.imageLabel ? (
            <View accessibilityLabel={post.imageLabel} style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>Preview image</Text>
            </View>
          ) : null}

          <View style={styles.actionsRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${post.liked ? "Liked" : "Not liked"}, ${post.likes} likes`}
              onPress={handlePostLike}
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            >
              <Text style={[styles.actionText, post.liked && styles.actionTextActive]}>Like</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share post"
              onPress={() => {
                void Share.share({ message: `${post.authorName}: ${post.content}` });
              }}
              style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}
            >
              <Text style={styles.actionText}>Share</Text>
            </Pressable>
          </View>
        </Card>

        <View style={styles.commentsHeader}>
          <Text style={styles.sectionLabel}>Comments</Text>
          <Text style={styles.commentsCount}>{comments.length} total</Text>
        </View>

        {comments.length === 0 ? (
          <EmptyState
            icon="..."
            headline="Start the thread"
            body="NOVA suggests asking one concrete question so the best operators can reply fast."
            assistant="nova"
          />
        ) : (
          comments.map((comment) => (
            <Card key={comment.id} accent="green">
              <View style={styles.commentTop}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${comment.authorName} profile`}
                  onPress={() => navigation.navigate("UserProfile", { userId: comment.authorId })}
                  style={styles.commentAvatar}
                >
                  <Text style={styles.commentAvatarText}>{comment.authorName.slice(0, 1)}</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${comment.authorName} profile`}
                  onPress={() => navigation.navigate("UserProfile", { userId: comment.authorId })}
                  style={styles.commentMeta}
                >
                  <Text style={styles.commentAuthor}>{comment.authorName}</Text>
                  <Text style={styles.commentRole}>{comment.authorRole}</Text>
                  <Text accessibilityLabel={comment.absoluteTime} style={styles.commentTime}>
                    {comment.relativeTime}
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.commentBody}>{comment.body}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${comment.liked ? "Liked" : "Not liked"}, ${comment.likes} comment likes`}
                onPress={() => {
                  const updatedComment = toggleCommentLike(post.id, comment.id);
                  if (updatedComment) {
                    void AccessibilityInfo.announceForAccessibility(
                      `${updatedComment.liked ? "Liked" : "Not liked"}, ${updatedComment.likes} likes`,
                    );
                  }
                }}
                style={({ pressed }) => [styles.inlineAction, pressed && styles.pressed]}
              >
                <Text style={[styles.inlineActionText, comment.liked && styles.inlineActionTextActive]}>
                  Helpful {comment.likes > 0 ? `(${comment.likes})` : ""}
                </Text>
              </Pressable>
            </Card>
          ))
        )}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          accessibilityLabel="Add comment"
          accessibilityHint="Write a reply to this post."
          multiline
          onChangeText={setDraftComment}
          placeholder="Add your comment..."
          placeholderTextColor={colors.textDim}
          style={styles.composerInput}
          value={draftComment}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Post comment"
          accessibilityState={{ disabled: !draftComment.trim() }}
          onPress={handleCommentSubmit}
          style={({ pressed }) => [styles.composerButton, !draftComment.trim() && styles.composerButtonDisabled, pressed && styles.pressed]}
        >
          <Text style={styles.composerButtonText}>Reply</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
    paddingBottom: 128,
    gap: spacing.sm,
  },
  postTop: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 44,
    height: 44,
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
  imagePlaceholder: {
    height: 196,
    marginTop: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  actionsRow: {
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    minHeight: touch.minimum,
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
  commentsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
  },
  sectionLabel: {
    color: colors.text,
    ...typography.displaySm,
  },
  commentsCount: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  commentTop: {
    flexDirection: "row",
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: withAlpha("green", 0.12),
    alignItems: "center",
    justifyContent: "center",
  },
  commentAvatarText: {
    color: colors.green,
    ...typography.labelMd,
  },
  commentMeta: {
    flex: 1,
    gap: 2,
  },
  commentAuthor: {
    color: colors.text,
    ...typography.bodySm,
    fontWeight: "700",
  },
  commentRole: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  commentTime: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  commentBody: {
    color: colors.text,
    ...typography.bodyMd,
  },
  inlineAction: {
    alignSelf: "flex-start",
    marginTop: spacing.sm,
    minHeight: touch.minimum,
    justifyContent: "center",
  },
  inlineActionText: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  inlineActionTextActive: {
    color: colors.gold,
  },
  composer: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.sm,
  },
  composerInput: {
    flex: 1,
    minHeight: 52,
    maxHeight: 120,
    color: colors.text,
    ...typography.bodyMd,
  },
  composerButton: {
    minHeight: touch.comfortable,
    minWidth: 88,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  composerButtonDisabled: {
    opacity: 0.48,
  },
  composerButtonText: {
    color: colors.bg,
    ...typography.labelLg,
  },
  pressed: {
    opacity: 0.78,
  },
});
