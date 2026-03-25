import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import Badge from "../../components/ui/Badge";
import Card from "../../components/ui/Card";
import EmptyState from "../../components/ui/EmptyState";
import { AcademyStackParamList } from "../../navigation/types";
import { useAcademyStore } from "../../stores/academyStore";
import { colors, radius, spacing, touch, typography, withAlpha } from "../../theme/tokens";

type Props = NativeStackScreenProps<AcademyStackParamList, "MyLearning">;

export default function MyLearningScreen({ navigation }: Props) {
  const courses = useAcademyStore((state) => state.courses);
  const enrolledCourses = useMemo(() => courses.filter((course) => course.enrolled), [courses]);
  const downloadedCourses = useMemo(() => courses.filter((course) => course.downloaded), [courses]);
  const certificates = useMemo(
    () => enrolledCourses.filter((course) => course.certificateEligible && course.progress >= 75),
    [enrolledCourses],
  );

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>Enrolled Courses</Text>
      {enrolledCourses.length === 0 ? (
        <EmptyState
          icon="[]"
          headline="Nothing enrolled yet"
          body="SAGE recommends starting with the course that most directly compounds your current community and market activity."
          assistant="sage"
        />
      ) : (
        enrolledCourses.map((course) => (
          <Pressable key={course.slug} onPress={() => navigation.navigate("CourseDetail", { slug: course.slug })}>
            <Card accent="ice">
              <View style={styles.cardTop}>
                <View style={styles.cardCopy}>
                  <Text style={styles.courseTitle}>{course.title}</Text>
                  <Text style={styles.courseMeta}>{course.duration}</Text>
                </View>
                {course.downloaded ? <Badge label="Offline" variant="green" /> : null}
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${course.progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{course.progress}% complete</Text>
            </Card>
          </Pressable>
        ))
      )}

      <Text style={styles.sectionTitle}>Downloaded</Text>
      {downloadedCourses.length === 0 ? (
        <EmptyState
          icon="↓"
          headline="No offline courses yet"
          body="Downloaded lessons will appear here for low-connectivity study sessions."
          assistant="sage"
        />
      ) : (
        downloadedCourses.map((course) => (
          <Card key={`download-${course.slug}`} accent="ice">
            <Text style={styles.courseTitle}>{course.title}</Text>
            <Text style={styles.courseMeta}>{course.duration}</Text>
          </Card>
        ))
      )}

      <Text style={styles.sectionTitle}>Certificates</Text>
      {certificates.length === 0 ? (
        <EmptyState
          icon="[]"
          headline="No certificates unlocked yet"
          body="Reach the course completion threshold and certificate-ready courses will surface here."
          assistant="sage"
        />
      ) : (
        certificates.map((course) => (
          <Card key={`certificate-${course.slug}`} accent="gold">
            <View style={styles.certificateTop}>
              <View style={styles.certificateIcon}>
                <Text style={styles.certificateIconText}>★</Text>
              </View>
              <View style={styles.cardCopy}>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.courseMeta}>Certificate ready</Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open certificate for ${course.title}`}
              onPress={() => navigation.navigate("Certificate", { certId: course.slug })}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
            >
              <Text style={styles.primaryButtonText}>View Certificate</Text>
            </Pressable>
          </Card>
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
  content: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  sectionTitle: {
    color: colors.text,
    ...typography.displaySm,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
    alignItems: "flex-start",
  },
  cardCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  courseTitle: {
    color: colors.text,
    ...typography.bodyMd,
    fontWeight: "700",
  },
  courseMeta: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  progressTrack: {
    marginTop: spacing.md,
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
  progressText: {
    marginTop: spacing.sm,
    color: colors.textDim,
    ...typography.bodySm,
  },
  certificateTop: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    marginBottom: spacing.md,
  },
  certificateIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: withAlpha("gold", 0.16),
    alignItems: "center",
    justifyContent: "center",
  },
  certificateIconText: {
    color: colors.gold,
    ...typography.displaySm,
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
  pressed: {
    opacity: 0.78,
  },
});
