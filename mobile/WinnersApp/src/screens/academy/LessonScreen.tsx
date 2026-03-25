import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ResizeMode, Video } from "expo-av";
import * as FileSystem from "expo-file-system";
import NetInfo from "@react-native-community/netinfo";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Card from "../../components/ui/Card";
import AssistantFAB from "../../components/shared/AssistantFAB";
import { AcademyStackParamList } from "../../navigation/types";
import { offline } from "../../services/offline";
import { getAcademyLesson, useAcademyStore } from "../../stores/academyStore";
import { colors, radius, spacing, touch, typography, withAlpha } from "../../theme/tokens";

type Props = NativeStackScreenProps<AcademyStackParamList, "CoursePlayer">;

type TabKey = "Overview" | "Notes" | "Q&A";

const DOWNLOADS_DIR = `${FileSystem.documentDirectory ?? ""}lessons/`;
const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

export default function LessonScreen({ navigation, route }: Props) {
  const notesByLessonId = useAcademyStore((state) => state.notesByLessonId);
  const saveLessonNotes = useAcademyStore((state) => state.saveLessonNotes);

  const lessonContext = useMemo(() => getAcademyLesson(route.params.lessonId), [route.params.lessonId]);
  const lesson = lessonContext?.lesson;
  const course = lessonContext?.course;

  const [localUri, setLocalUri] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("Overview");
  const [notes, setNotes] = useState(notesByLessonId[route.params.lessonId] ?? "");
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const videoRef = useRef<Video | null>(null);

  const fallbackLesson = lesson ?? {
    id: route.params.lessonId,
    title: route.params.lessonId.replace(/-/g, " "),
    moduleLabel: "Module 1 · Lesson 1",
    duration: "20 minutes",
    overview: "SAGE course context will appear here as the Academy graph expands.",
    videoUrl: "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4",
  };

  const playbackSource = localUri || fallbackLesson.videoUrl;

  useEffect(() => {
    setNotes(notesByLessonId[route.params.lessonId] ?? "");
  }, [notesByLessonId, route.params.lessonId]);

  const markOfflineReady = () => {
    offline.enqueue({
      endpoint: "/academy/offline-ready",
      method: "POST",
      body: { lessonId: route.params.lessonId },
    });
  };

  const updatePlaybackSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    void AccessibilityInfo.announceForAccessibility(`Playback speed ${speed}x`);
  };

  useEffect(() => {
    void videoRef.current?.setStatusAsync({
      rate: playbackSpeed,
      shouldCorrectPitch: true,
    });
  }, [playbackSpeed]);

  const downloadLesson = async () => {
    setIsDownloading(true);

    try {
      await FileSystem.makeDirectoryAsync(DOWNLOADS_DIR, { intermediates: true });
      const path = `${DOWNLOADS_DIR}${route.params.lessonId}.mp4`;
      const existing = await FileSystem.getInfoAsync(path);

      if (existing.exists) {
        setLocalUri(path);
        setDownloadProgress(1);
        return path;
      }

      const download = FileSystem.createDownloadResumable(
        fallbackLesson.videoUrl,
        path,
        {},
        (progress: FileSystem.DownloadProgressData) => {
          if (!progress.totalBytesExpectedToWrite) {
            return;
          }

          const pct = progress.totalBytesWritten / progress.totalBytesExpectedToWrite;
          setDownloadProgress(pct);
          void AccessibilityInfo.announceForAccessibility(`Downloading, ${Math.round(pct * 100)} percent`);
        },
      );

      const result = await download.downloadAsync();
      if (result?.uri) {
        setLocalUri(result.uri);
      }

      return result?.uri ?? null;
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      const path = `${DOWNLOADS_DIR}${route.params.lessonId}.mp4`;
      const connection = await NetInfo.fetch();
      const existing = await FileSystem.getInfoAsync(path);

      if (!connection.isConnected && existing.exists) {
        setLocalUri(path);
        return;
      }

      setLocalUri(connection.isConnected ? fallbackLesson.videoUrl : existing.exists ? path : null);
    };

    void load();
  }, [fallbackLesson.videoUrl, route.params.lessonId]);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            accessibilityHint="Returns to the previous Academy screen."
            onPress={() => navigation.goBack()}
            style={({ pressed }) => [styles.topAction, pressed && styles.pressed]}
          >
            <Text style={styles.topActionText}>← Back</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Lesson options"
            accessibilityHint="Toggles the captions state."
            onPress={() => setCaptionsEnabled((current) => !current)}
            style={({ pressed }) => [styles.topAction, pressed && styles.pressed]}
          >
            <Text style={styles.topActionText}>⋮ Options</Text>
          </Pressable>
        </View>

        <View style={styles.videoWrap}>
          <Video
            key={playbackSource}
            ref={videoRef}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
            source={{ uri: playbackSource }}
            style={styles.video}
            useNativeControls
          />
        </View>

        <Text style={styles.moduleLabel}>{fallbackLesson.moduleLabel}</Text>
        <Text style={styles.title}>{fallbackLesson.title}</Text>
        <Text style={styles.subtitle}>{course?.title ?? fallbackLesson.duration}</Text>

        <View style={styles.tabRow}>
          {(["Overview", "Notes", "Q&A"] as TabKey[]).map((tab) => {
            const selected = tab === activeTab;

            return (
              <Pressable
                key={tab}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={tab}
                onPress={() => setActiveTab(tab)}
                style={({ pressed }) => [styles.tabButton, selected && styles.tabButtonSelected, pressed && styles.pressed]}
              >
                <Text style={[styles.tabButtonText, selected && styles.tabButtonTextSelected]}>{tab}</Text>
              </Pressable>
            );
          })}
        </View>

        <Card accent="ice">
          {activeTab === "Overview" ? (
            <View style={styles.panelStack}>
              <Text style={styles.panelText}>{fallbackLesson.overview}</Text>
              <Text style={styles.panelSubtle}>Picture-in-picture and synced progress are staged for the next native pass.</Text>
            </View>
          ) : null}

          {activeTab === "Notes" ? (
            <TextInput
              accessibilityLabel="Lesson notes"
              accessibilityHint="Write notes that will sync to your Academy workspace."
              multiline
              onChangeText={(value) => {
                setNotes(value);
                saveLessonNotes(route.params.lessonId, value);
              }}
              placeholder="Write your notes here..."
              placeholderTextColor={colors.textDim}
              style={styles.notesInput}
              textAlignVertical="top"
              value={notes}
            />
          ) : null}

          {activeTab === "Q&A" ? (
            <View style={styles.panelStack}>
              <Text style={styles.panelText}>SAGE is ready to answer course-specific questions with this lesson context attached.</Text>
              <Text style={styles.panelSubtle}>Ask about this lesson from the floating SAGE shortcut.</Text>
            </View>
          ) : null}
        </Card>

        <Card accent="gold">
          <View style={styles.controlGroup}>
            <Text style={styles.controlTitle}>Playback Speed</Text>
            <View style={styles.speedRow}>
              {SPEEDS.map((speed) => {
                const selected = speed === playbackSpeed;
                return (
                  <Pressable
                    key={speed}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    accessibilityLabel={`${speed} times speed`}
                    onPress={() => updatePlaybackSpeed(speed)}
                    style={({ pressed }) => [styles.speedChip, selected && styles.speedChipSelected, pressed && styles.pressed]}
                  >
                    <Text style={[styles.speedChipText, selected && styles.speedChipTextSelected]}>{speed}x</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.controlRow}>
              <Text style={styles.panelText}>Captions</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Captions ${captionsEnabled ? "enabled" : "disabled"}`}
                onPress={() => setCaptionsEnabled((current) => !current)}
                style={({ pressed }) => [styles.toggleButton, pressed && styles.pressed]}
              >
                <Text style={styles.toggleText}>{captionsEnabled ? "On" : "Off"}</Text>
              </Pressable>
            </View>
          </View>
        </Card>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={localUri?.startsWith(DOWNLOADS_DIR) ? "Lesson saved offline" : "Download lesson"}
            onPress={() => {
              void downloadLesson();
            }}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>
              {isDownloading
                ? `Downloading ${Math.round(downloadProgress * 100)}%`
                : localUri?.startsWith(DOWNLOADS_DIR)
                  ? "Saved offline ✓"
                  : "Download lesson"}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Queue offline access"
            onPress={markOfflineReady}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.secondaryButtonText}>Queue offline access</Text>
          </Pressable>
        </View>
      </ScrollView>

      <AssistantFAB label="Ask SAGE" onPress={() => navigation.getParent()?.navigate("AI", { screen: "SAGEChat" })} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 120,
    gap: spacing.md,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  topAction: {
    minHeight: touch.minimum,
    justifyContent: "center",
  },
  topActionText: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  videoWrap: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  video: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  moduleLabel: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  title: {
    color: colors.text,
    ...typography.displaySm,
  },
  subtitle: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  tabRow: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  tabButton: {
    flex: 1,
    minHeight: touch.minimum,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  tabButtonSelected: {
    borderColor: colors.gold,
    backgroundColor: withAlpha("gold", 0.08),
  },
  tabButtonText: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  tabButtonTextSelected: {
    color: colors.gold,
  },
  panelStack: {
    gap: spacing.sm,
  },
  panelText: {
    color: colors.text,
    ...typography.bodyMd,
  },
  panelSubtle: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  notesInput: {
    minHeight: 140,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    color: colors.text,
    ...typography.bodyMd,
  },
  controlGroup: {
    gap: spacing.sm,
  },
  controlTitle: {
    color: colors.text,
    ...typography.labelLg,
  },
  speedRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  speedChip: {
    minHeight: touch.minimum,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  speedChipSelected: {
    borderColor: colors.gold,
    backgroundColor: withAlpha("gold", 0.08),
  },
  speedChipText: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  speedChipTextSelected: {
    color: colors.gold,
  },
  controlRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  toggleButton: {
    minHeight: touch.minimum,
    minWidth: 64,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleText: {
    color: colors.text,
    ...typography.labelLg,
  },
  actions: {
    gap: spacing.sm,
  },
  primaryButton: {
    minHeight: touch.comfortable,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
  },
  primaryButtonText: {
    color: colors.bg,
    ...typography.labelLg,
  },
  secondaryButton: {
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
  pressed: {
    opacity: 0.78,
  },
});
