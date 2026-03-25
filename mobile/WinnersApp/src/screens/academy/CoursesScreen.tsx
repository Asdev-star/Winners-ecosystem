import React, { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import EcosystemContextBar from "../../components/shared/EcosystemContextBar";
import OfflineBanner from "../../components/shared/OfflineBanner";
import { AcademyStackParamList } from "../../navigation/types";
import { api } from "../../services/api";
import { offline } from "../../services/offline";
import { useAcademyStore } from "../../stores/academyStore";
import { colors, radius, spacing, touch, typography, withAlpha } from "../../theme/tokens";

type Props = NativeStackScreenProps<AcademyStackParamList, "Home">;

const CATEGORY_CHIPS = ["All", "Tech", "Growth", "Creator", "Brand", "Community"];

export default function CoursesScreen({ navigation }: Props) {
  const [offlineState, setOfflineState] = useState(offline.getSnapshot());
  const [selectedCategory, setSelectedCategory] = useState("All");
  const courses = useAcademyStore((state) => state.courses);
  const toggleCourseDownload = useAcademyStore((state) => state.toggleCourseDownload);

  useEffect(() => offline.subscribe(setOfflineState), []);

  const continueCourse = useMemo(
    () =>
      [...courses]
        .filter((course) => course.enrolled && course.progress > 0)
        .sort((left, right) => right.progress - left.progress)[0] ?? courses[0],
    [courses],
  );
  const recommended = useMemo(() => courses.filter((course) => !course.enrolled).slice(0, 3), [courses]);
  const visibleCourses = useMemo(
    () =>
      selectedCategory === "All"
        ? courses
        : courses.filter((course) => course.category === selectedCategory),
    [courses, selectedCategory],
  );

  return (
    <View style={styles.screen}>
      <EcosystemContextBar
        accent="ice"
        label="SAGE"
        context="Your next lesson is ready. SAGE suggests continuing where your brand and monetization tracks meet."
      />
      <OfflineBanner
        isOnline={offlineState.isOnline}
        isSyncing={offlineState.isSyncing}
        pendingCount={offlineState.queue.length}
        onSync={() => {
          void api.flushQueuedRequests();
        }}
      />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.sectionRow}>
          <Text style={styles.sectionLabel}>Continue Learning</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open my learning"
            onPress={() => navigation.navigate("MyLearning")}
            style={({ pressed }) => [styles.inlineAction, pressed && styles.pressed]}
          >
            <Text style={styles.inlineActionText}>My Learning</Text>
          </Pressable>
        </View>

        <Card accent="ice">
          <View style={styles.continueCard}>
            <View accessibilityLabel={`Course ${continueCourse.progress}% complete`} style={styles.progressRing}>
              <View style={styles.progressRingInner}>
                <Text style={styles.progressRingValue}>{continueCourse.progress}%</Text>
              </View>
            </View>
            <View style={styles.continueCopy}>
              <Text style={styles.courseTitle}>{continueCourse.title}</Text>
              <Text style={styles.courseMeta}>{continueCourse.lessons.find((lesson) => lesson.id === continueCourse.nextLessonId)?.moduleLabel}</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${continueCourse.progress}%` }]} />
              </View>
              <Text accessibilityLabel={continueCourse.duration} style={styles.courseMeta}>
                {continueCourse.duration}
              </Text>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Continue course"
            accessibilityHint="Opens the next lesson in this course."
            onPress={() => navigation.navigate("CoursePlayer", { lessonId: continueCourse.nextLessonId, courseId: continueCourse.slug })}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          >
            <Text style={styles.primaryButtonText}>Continue →</Text>
          </Pressable>
        </Card>

        <Text style={styles.sectionLabel}>Recommended For You</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
          {recommended.map((course) => (
            <Card key={course.slug} accent="ice" style={styles.recommendedCard}>
              <Text style={styles.courseTitle}>{course.title}</Text>
              <Text style={styles.courseMeta}>{course.tagline}</Text>
              <Text accessibilityLabel={course.duration} style={styles.courseMeta}>
                {course.duration}
              </Text>
              <View style={styles.recommendedActions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Open ${course.title}`}
                  onPress={() => navigation.navigate("CourseDetail", { slug: course.slug })}
                  style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
                >
                  <Text style={styles.secondaryButtonText}>View</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Download ${course.title}`}
                  onPress={() => toggleCourseDownload(course.slug)}
                  style={({ pressed }) => [styles.iconChip, pressed && styles.pressed]}
                >
                  <Text style={styles.iconChipText}>{course.downloaded ? "✓ Offline" : "↓ Download"}</Text>
                </Pressable>
              </View>
            </Card>
          ))}
        </ScrollView>

        <Text style={styles.sectionLabel}>Browse All Courses</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalRow}>
          {CATEGORY_CHIPS.map((chip) => {
            const selected = chip === selectedCategory;

            return (
              <Pressable
                key={chip}
                accessibilityRole="button"
                accessibilityLabel={`${chip} category`}
                onPress={() => setSelectedCategory(chip)}
                style={({ pressed }) => [styles.chip, selected && styles.chipSelected, pressed && styles.pressed]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{chip}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.courseList}>
          {visibleCourses.map((course) => (
            <Pressable
              key={course.slug}
              accessibilityRole="button"
              accessibilityLabel={course.title}
              accessibilityHint="Opens the course detail screen."
              onPress={() => navigation.navigate("CourseDetail", { slug: course.slug })}
            >
              <Card accent="ice">
                <View style={styles.listCardTop}>
                  <View style={styles.listCopy}>
                    <Text style={styles.courseTitle}>{course.title}</Text>
                    <Text style={styles.courseMeta}>{course.tagline}</Text>
                    <Text accessibilityLabel={course.duration} style={styles.courseMeta}>
                      {course.duration}
                    </Text>
                  </View>
                  {course.downloaded ? <Badge label="Downloaded" variant="green" /> : null}
                </View>
                <View style={styles.listActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Toggle download for ${course.title}`}
                    onPress={() => toggleCourseDownload(course.slug)}
                    style={({ pressed }) => [styles.iconChip, pressed && styles.pressed]}
                  >
                    <Text style={styles.iconChipText}>{course.downloaded ? "✓ Offline" : "↓ Download"}</Text>
                  </Pressable>
                </View>
              </Card>
            </Pressable>
          ))}
        </View>
      </ScrollView>
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
    gap: spacing.md,
    paddingBottom: spacing.xxl,
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionLabel: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  inlineAction: {
    minHeight: touch.minimum,
    justifyContent: "center",
  },
  inlineActionText: {
    color: colors.ice,
    ...typography.labelLg,
  },
  continueCard: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  progressRing: {
    width: 82,
    height: 82,
    borderRadius: radius.full,
    backgroundColor: withAlpha("ice", 0.18),
    borderWidth: 4,
    borderColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  progressRingInner: {
    width: 58,
    height: 58,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  progressRingValue: {
    color: colors.gold,
    ...typography.labelLg,
  },
  continueCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  courseTitle: {
    color: colors.text,
    ...typography.displaySm,
  },
  courseMeta: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  progressTrack: {
    height: spacing.xs,
    borderRadius: radius.full,
    backgroundColor: colors.surface2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: radius.full,
    backgroundColor: colors.gold,
  },
  primaryButton: {
    minHeight: touch.comfortable,
    borderRadius: radius.md,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: {
    color: colors.bg,
    ...typography.labelLg,
  },
  horizontalRow: {
    gap: spacing.sm,
    paddingBottom: spacing.xs,
  },
  recommendedCard: {
    width: 260,
  },
  recommendedActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  secondaryButton: {
    minHeight: touch.minimum,
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: {
    color: colors.text,
    ...typography.labelLg,
  },
  chip: {
    minHeight: touch.minimum,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  chipSelected: {
    borderColor: colors.ice,
    backgroundColor: withAlpha("ice", 0.12),
  },
  chipText: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  chipTextSelected: {
    color: colors.ice,
  },
  courseList: {
    gap: spacing.sm,
  },
  listCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  listCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  listActions: {
    marginTop: spacing.sm,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  iconChip: {
    minHeight: touch.minimum,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  iconChipText: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  pressed: {
    opacity: 0.78,
  },
});
