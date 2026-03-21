import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { AcademyStackParamList } from "../../navigation/TabNavigator";
import EcosystemContextBar from "../../components/shared/EcosystemContextBar";
import { queueOfflineAction } from "../../services/offline";

type Props = NativeStackScreenProps<AcademyStackParamList, "Lesson">;

export default function LessonScreen({ route }: Props) {
  const lessonId = route.params?.lessonId ?? "starter-lesson";
  const [status, setStatus] = useState("Ready for streaming or offline download.");

  async function handleOfflineDownload() {
    await queueOfflineAction({
      id: `lesson-${lessonId}`,
      type: "lesson-download",
      payload: { lessonId },
      createdAt: new Date().toISOString(),
    });
    setStatus("Lesson queued for offline sync and download.");
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <EcosystemContextBar layer="Academy" assistant="SAGE" status="Offline-ready" />
      <Text style={styles.title}>Lesson player</Text>
      <Text style={styles.meta}>Current lesson: {lessonId}</Text>

      <View style={styles.videoShell}>
        <Text style={styles.videoTitle}>Offline-capable video player</Text>
        <Text style={styles.videoCopy}>
          Stream when online, queue encrypted lesson assets when offline support is required, and resume across devices once sync completes.
        </Text>
      </View>

      <Pressable onPress={handleOfflineDownload} style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Download for offline study</Text>
      </Pressable>

      <Text style={styles.status}>{status}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0D1520",
  },
  content: {
    padding: 20,
    gap: 18,
  },
  title: {
    color: "#F5F7FA",
    fontSize: 28,
    fontWeight: "800",
  },
  meta: {
    color: "#93A4B8",
    fontSize: 12,
    fontWeight: "700",
  },
  videoShell: {
    minHeight: 220,
    backgroundColor: "#162131",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#223247",
    padding: 20,
    justifyContent: "space-between",
  },
  videoTitle: {
    color: "#F5F7FA",
    fontSize: 18,
    fontWeight: "800",
  },
  videoCopy: {
    color: "#C6D0DA",
    fontSize: 14,
    lineHeight: 22,
  },
  primaryButton: {
    backgroundColor: "#C9A84C",
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#0D1520",
    fontWeight: "900",
    fontSize: 13,
  },
  status: {
    color: "#6FD6A3",
    fontSize: 12,
    fontWeight: "700",
  },
});
