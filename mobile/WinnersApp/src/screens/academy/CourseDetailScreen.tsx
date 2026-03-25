import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import AssistantFAB from "../../components/shared/AssistantFAB";
import { AcademyStackParamList } from "../../navigation/types";
import { getAcademyCourse, useAcademyStore } from "../../stores/academyStore";
import { colors, radius, spacing, touch, typography, withAlpha } from "../../theme/tokens";

type Props = NativeStackScreenProps<AcademyStackParamList, "CourseDetail">;

export default function CourseDetailScreen({ navigation, route }: Props) {
  const courses = useAcademyStore((state) => state.courses);
  const enrollCourse = useAcademyStore((state) => state.enrollCourse);
  const toggleCourseDownload = useAcademyStore((state) => state.toggleCourseDownload);

  const course = useMemo(
    () => courses.find((entry) => entry.slug === route.params.slug) ?? getAcademyCourse(route.params.slug),
    [courses, route.params.slug],
  );

  if (!course) {
    return (
      <View style={styles.missingWrap}>
        <EmptyState
          icon="!"
          headline="Course unavailable"
          body="SAGE could not load this course right now, but the route is in place and ready for retry."
          assistant="sage"
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card accent="ice">
          <Badge label={course.category} variant="ice" />
          <Text style={styles.title}>{course.title}</Text>
          <Text style={styles.tagline}>{course.tagline}</Text>
          <Text style={styles.description}>{course.description}</Text>

          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{course.duration}</Text>
              <Text style={styles.metricLabel}>Duration</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{course.progress}%</Text>
              <Text style={styles.metricLabel}>Progress</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{course.lessons.length}</Text>
              <Text style={styles.metricLabel}>Lessons</Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={course.enrolled ? "Continue course" : "Enroll in course"}
              onPress={() => {
                if (!course.enrolled) {
                  enrollCourse(course.slug);
                }
                navigation.navigate("CoursePlayer", { lessonId: course.nextLessonId, courseId: course.slug });
              }}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonText}>{course.enrolled ? "Continue" : "Enroll"}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={course.downloaded ? "Remove offline download" : "Download course"}
              onPress={() => toggleCourseDownload(course.slug)}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.secondaryButtonText}>{course.downloaded ? "Downloaded" : "Download"}</Text>
            </Pressable>
          </View>
        </Card>

        <Text style={styles.sectionLabel}>Lessons</Text>
        {course.lessons.map((lesson, index) => (
          <Pressable
            key={lesson.id}
            accessibilityRole="button"
            accessibilityLabel={lesson.title}
            onPress={() => navigation.navigate("CoursePlayer", { lessonId: lesson.id, courseId: course.slug })}
          >
            <Card accent="ice">
              <View style={styles.lessonTop}>
                <View style={styles.lessonIndex}>
                  <Text style={styles.lessonIndexText}>{index + 1}</Text>
                </View>
                <View style={styles.lessonCopy}>
                  <Text style={styles.lessonTitle}>{lesson.title}</Text>
                  <Text style={styles.lessonMeta}>{lesson.moduleLabel}</Text>
                  <Text style={styles.lessonMeta}>{lesson.duration}</Text>
                </View>
              </View>
            </Card>
          </Pressable>
        ))}

        <Card accent="gold">
          <Text style={styles.sageLabel}>SAGE Note</Text>
          <Text style={styles.sageBody}>
            This course becomes most effective when you pair each lesson with one live community action and one market or work execution step.
          </Text>
        </Card>
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
  missingWrap: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.md,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 120,
    gap: spacing.sm,
  },
  title: {
    color: colors.text,
    marginTop: spacing.sm,
    ...typography.displaySm,
  },
  tagline: {
    color: colors.text,
    marginTop: spacing.xs,
    ...typography.bodyMd,
  },
  description: {
    color: colors.textDim,
    marginTop: spacing.sm,
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
    textAlign: "center",
    ...typography.bodyMd,
    fontWeight: "700",
  },
  metricLabel: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  primaryButton: {
    flex: 1,
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
  secondaryButton: {
    flex: 1,
    minHeight: touch.comfortable,
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
  sectionLabel: {
    color: colors.textDim,
    ...typography.labelLg,
  },
  lessonTop: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
  },
  lessonIndex: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: withAlpha("ice", 0.14),
    alignItems: "center",
    justifyContent: "center",
  },
  lessonIndexText: {
    color: colors.ice,
    ...typography.labelLg,
  },
  lessonCopy: {
    flex: 1,
    gap: 2,
  },
  lessonTitle: {
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "700",
  },
  lessonMeta: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  sageLabel: {
    color: colors.gold,
    marginBottom: spacing.xs,
    ...typography.labelLg,
  },
  sageBody: {
    color: colors.text,
    ...typography.bodyMd,
  },
  pressed: {
    opacity: 0.78,
  },
});
