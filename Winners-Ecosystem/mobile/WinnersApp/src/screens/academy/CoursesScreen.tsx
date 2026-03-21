import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import EcosystemContextBar from "../../components/shared/EcosystemContextBar";
import OfflineBanner from "../../components/shared/OfflineBanner";
import { TabParamList } from "../../navigation/types";
import { offline } from "../../services/offline";
import { api } from "../../services/api";

type Props = BottomTabScreenProps<TabParamList, "Academy">;

const lessons = [
  {
    id: "lesson-growth-systems",
    title: "Growth systems for diaspora founders",
    detail: "25 min video lesson with downloadable worksheet.",
  },
  {
    id: "lesson-creator-commerce",
    title: "Creator commerce operating model",
    detail: "Voice-noted breakdown for product, offers, and distribution.",
  },
];

const CoursesScreen = ({ navigation }: Props) => {
  const [offlineState, setOfflineState] = useState(offline.getSnapshot());

  useEffect(() => offline.subscribe(setOfflineState), []);

  return (
    <View style={styles.screen}>
      <EcosystemContextBar
        label="Academy"
        context="Learn in focused bursts, then keep momentum even when the connection drops."
      />
      <OfflineBanner
        isOnline={offlineState.isOnline}
        isSyncing={offlineState.isSyncing}
        pendingCount={offlineState.queue.length}
        onSync={() => {
          void api.flushQueuedRequests();
        }}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Offline-ready curriculum</Text>
          <Text style={styles.heroBody}>
            Lessons can be bookmarked for travel, commute, and low-bandwidth study sessions.
          </Text>
        </View>

        {lessons.map((lesson) => (
          <TouchableOpacity
            key={lesson.id}
            activeOpacity={0.9}
            onPress={() => navigation.getParent()?.navigate("Lesson", { lessonId: lesson.id })}
            style={styles.card}
          >
            <Text style={styles.cardTitle}>{lesson.title}</Text>
            <Text style={styles.cardBody}>{lesson.detail}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0D1520",
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 40,
  },
  hero: {
    backgroundColor: "#111D2E",
    borderWidth: 1,
    borderColor: "#1E3248",
    borderRadius: 20,
    padding: 20,
    gap: 8,
  },
  heroTitle: {
    color: "#E8EEF5",
    fontSize: 24,
    fontWeight: "800",
  },
  heroBody: {
    color: "#8FA6BA",
    fontSize: 14,
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#111D2E",
    borderWidth: 1,
    borderColor: "#1E3248",
    borderRadius: 18,
    padding: 18,
    gap: 8,
  },
  cardTitle: {
    color: "#E8EEF5",
    fontSize: 18,
    fontWeight: "700",
  },
  cardBody: {
    color: "#8FA6BA",
    fontSize: 14,
    lineHeight: 21,
  },
});

export default CoursesScreen;
