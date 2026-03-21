import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AcademyStackParamList } from "../../navigation/TabNavigator";
import EcosystemContextBar from "../../components/shared/EcosystemContextBar";
import AssistantFAB from "../../components/shared/AssistantFAB";

type Props = NativeStackScreenProps<AcademyStackParamList, "Courses">;

const courses = [
  { id: "sales-systems", title: "Sales Systems for Digital Operators", progress: "68% complete" },
  { id: "creator-ops", title: "Creator Ops and Offer Packaging", progress: "41% complete" },
];

export default function CoursesScreen({ navigation }: Props) {
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <EcosystemContextBar layer="Academy" assistant="SAGE" />
        <Text style={styles.title}>Course momentum</Text>
        <Text style={styles.copy}>
          Continue where you left off, queue lessons for offline review, and let SAGE surface the fastest path to completion.
        </Text>

        {courses.map((course) => (
          <Pressable
            key={course.id}
            style={styles.card}
            onPress={() => navigation.navigate("Lesson", { lessonId: course.id })}
          >
            <Text style={styles.cardTitle}>{course.title}</Text>
            <Text style={styles.cardMeta}>{course.progress}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <AssistantFAB
        label="Ask SAGE"
        onPress={() => navigation.getParent()?.navigate("Intelligence" as never)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0D1520",
  },
  content: {
    padding: 20,
    paddingBottom: 120,
  },
  title: {
    color: "#F5F7FA",
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 8,
  },
  copy: {
    color: "#93A4B8",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 18,
  },
  card: {
    backgroundColor: "#162131",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#223247",
    padding: 18,
    marginBottom: 14,
  },
  cardTitle: {
    color: "#F5F7FA",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 6,
  },
  cardMeta: {
    color: "#6FD6A3",
    fontWeight: "700",
    fontSize: 12,
  },
});
