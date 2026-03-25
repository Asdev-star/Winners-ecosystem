import React, { useEffect, useMemo, useState } from "react";
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Badge from "../../components/ui/Badge";
import { CommunityStackParamList } from "../../navigation/types";
import { offline } from "../../services/offline";
import { useAuthStore } from "../../stores/authStore";
import { useCommunityStore } from "../../stores/communityStore";
import { colors, radius, spacing, touch, typography, withAlpha } from "../../theme/tokens";

type Props = NativeStackScreenProps<CommunityStackParamList, "CreatePost">;

const MAX_CHARS = 280;

export default function CreatePostScreen({ navigation, route }: Props) {
  const user = useAuthStore((state) => state.user);
  const groups = useCommunityStore((state) => state.groups);
  const createPost = useCommunityStore((state) => state.createPost);
  const [content, setContent] = useState("");
  const [imageLabel, setImageLabel] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | undefined>(route.params?.groupId);
  const [toolbarState, setToolbarState] = useState<"photo" | "video" | "tag" | "location" | null>(null);
  const [hasAnnouncedThreshold, setHasAnnouncedThreshold] = useState(false);

  const joinedGroups = useMemo(() => groups.filter((group) => group.joined), [groups]);
  const selectedGroup = joinedGroups.find((group) => group.id === selectedGroupId);
  const canPost = content.trim().length > 0 && content.trim().length <= MAX_CHARS && !!user;

  useEffect(() => {
    const threshold = Math.floor(MAX_CHARS * 0.8);

    if (content.length >= threshold && !hasAnnouncedThreshold) {
      void AccessibilityInfo.announceForAccessibility(`${MAX_CHARS - content.length} characters remaining`);
      setHasAnnouncedThreshold(true);
    }

    if (content.length < threshold && hasAnnouncedThreshold) {
      setHasAnnouncedThreshold(false);
    }
  }, [content.length, hasAnnouncedThreshold]);

  const submitPost = () => {
    if (!canPost || !user) {
      return;
    }

    const post = createPost({
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role === "owner" ? "Ecosystem Owner" : "Community Member",
      content,
      imageLabel: imageLabel.trim() || undefined,
      groupId: selectedGroupId,
    });

    if (!offline.getSnapshot().isOnline) {
      offline.enqueue({
        endpoint: "/community/posts",
        method: "POST",
        body: {
          content,
          imageLabel: imageLabel.trim() || undefined,
          groupId: selectedGroupId,
        },
      });
    }

    navigation.replace("PostDetail", { postId: post.id });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.select({ ios: "padding", android: undefined })}
      keyboardVerticalOffset={Platform.select({ ios: 24, android: 0 })}
      style={styles.screen}
    >
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          accessibilityHint="Closes the composer without posting."
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.topAction, pressed && styles.pressed]}
        >
          <Text style={styles.topActionText}>Cancel</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Post"
          accessibilityState={{ disabled: !canPost }}
          onPress={submitPost}
          style={({ pressed }) => [styles.postButton, !canPost && styles.postButtonDisabled, pressed && styles.pressed]}
        >
          <Text style={styles.postButtonText}>Post</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.identityRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.slice(0, 1) ?? "M"}</Text>
          </View>
          <View style={styles.identityCopy}>
            <Text style={styles.name}>{user?.name ?? "Member"}</Text>
            <Text style={styles.role}>{selectedGroup ? `Posting in ${selectedGroup.name}` : "Posting to your community feed"}</Text>
          </View>
        </View>

        <TextInput
          accessibilityLabel="Post content"
          accessibilityHint="Write what is on your mind."
          autoFocus
          multiline
          onChangeText={setContent}
          placeholder="What's on your mind?"
          placeholderTextColor={colors.textDim}
          style={styles.composer}
          textAlignVertical="top"
          value={content}
        />

        <Text style={styles.helperText}>{content.length}/{MAX_CHARS}</Text>

        <View style={styles.groupSection}>
          <Text style={styles.sectionLabel}>Post to</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.groupChips}>
            <Pressable
              onPress={() => setSelectedGroupId(undefined)}
              style={({ pressed }) => [styles.groupChip, !selectedGroupId && styles.groupChipSelected, pressed && styles.pressed]}
            >
              <Text style={[styles.groupChipText, !selectedGroupId && styles.groupChipTextSelected]}>Main Feed</Text>
            </Pressable>
            {joinedGroups.map((group) => (
              <Pressable
                key={group.id}
                onPress={() => setSelectedGroupId(group.id)}
                style={({ pressed }) => [styles.groupChip, selectedGroupId === group.id && styles.groupChipSelected, pressed && styles.pressed]}
              >
                <Text style={[styles.groupChipText, selectedGroupId === group.id && styles.groupChipTextSelected]}>
                  {group.name}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <View style={styles.attachments}>
          <Text style={styles.sectionLabel}>Context</Text>
          <TextInput
            accessibilityLabel="Media description"
            accessibilityHint="Describe the image or video you plan to attach."
            onChangeText={setImageLabel}
            placeholder="Optional image or video description"
            placeholderTextColor={colors.textDim}
            style={styles.attachmentInput}
            value={imageLabel}
          />
          {toolbarState ? <Badge label={`${toolbarState} ready`} variant="green" /> : null}
        </View>
      </ScrollView>

      <View style={styles.toolbar}>
        {[
          { key: "photo", label: "Photo" },
          { key: "video", label: "Video" },
          { key: "tag", label: "Tag" },
          { key: "location", label: "Location" },
        ].map((item) => (
          <Pressable
            key={item.key}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityHint={`Marks ${item.label.toLowerCase()} for this post.`}
            onPress={() => setToolbarState(item.key as typeof toolbarState)}
            style={({ pressed }) => [
              styles.toolbarButton,
              toolbarState === item.key && styles.toolbarButtonSelected,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.toolbarText, toolbarState === item.key && styles.toolbarTextSelected]}>{item.label}</Text>
          </Pressable>
        ))}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  topAction: {
    minHeight: touch.minimum,
    justifyContent: "center",
  },
  topActionText: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  postButton: {
    minHeight: touch.minimum,
    minWidth: 84,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  postButtonDisabled: {
    opacity: 0.44,
  },
  postButtonText: {
    color: colors.bg,
    ...typography.labelLg,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingBottom: 112,
    gap: spacing.md,
  },
  identityRow: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
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
  identityCopy: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "700",
  },
  role: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  composer: {
    minHeight: 220,
    color: colors.text,
    ...typography.bodyLg,
  },
  helperText: {
    color: colors.textDim,
    textAlign: "right",
    ...typography.bodySm,
  },
  groupSection: {
    gap: spacing.sm,
  },
  sectionLabel: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  groupChips: {
    gap: spacing.sm,
  },
  groupChip: {
    minHeight: touch.minimum,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  groupChipSelected: {
    borderColor: colors.green,
    backgroundColor: withAlpha("green", 0.12),
  },
  groupChipText: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  groupChipTextSelected: {
    color: colors.green,
  },
  attachments: {
    gap: spacing.sm,
  },
  attachmentInput: {
    minHeight: touch.comfortable,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface2,
    color: colors.text,
    paddingHorizontal: spacing.md,
    ...typography.bodyMd,
  },
  toolbar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
  toolbarButton: {
    flex: 1,
    minHeight: touch.minimum,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  toolbarButtonSelected: {
    borderColor: colors.green,
    backgroundColor: withAlpha("green", 0.1),
  },
  toolbarText: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  toolbarTextSelected: {
    color: colors.green,
  },
  pressed: {
    opacity: 0.78,
  },
});
