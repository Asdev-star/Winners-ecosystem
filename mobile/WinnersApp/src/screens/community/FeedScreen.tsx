import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import EcosystemContextBar from "../../components/shared/EcosystemContextBar";
import OfflineBanner from "../../components/shared/OfflineBanner";
import AssistantFAB from "../../components/shared/AssistantFAB";
import { TabParamList } from "../../navigation/types";
import { offline } from "../../services/offline";
import { api } from "../../services/api";

type Props = BottomTabScreenProps<TabParamList, "Community">;

const posts = [
  {
    id: "diaspora-growth-playbook",
    title: "Diaspora growth playbook is live",
    excerpt: "A new operator guide connects community posts, academy tasks, and revenue follow-ups.",
    tag: "Strategy",
  },
  {
    id: "creator-collab-thread",
    title: "Creator collaboration thread",
    excerpt: "Members are matching editors, hosts, and marketers for cross-border campaigns.",
    tag: "Community",
  },
];

const FeedScreen = ({ navigation }: Props) => {
  const [offlineState, setOfflineState] = useState(offline.getSnapshot());

  useEffect(() => offline.subscribe(setOfflineState), []);

  return (
    <View style={styles.screen}>
      <EcosystemContextBar
        label="Community"
        context="Run the social layer from one feed, then turn promising momentum into action."
      />
      <OfflineBanner
        isOnline={offlineState.isOnline}
        isSyncing={offlineState.isSyncing}
        onSync={() => {
          void api.flushQueuedRequests();
        }}
        pendingCount={offlineState.queue.length}
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Today's signal</Text>
          <Text style={styles.heroBody}>
            Three new high-intent conversations are trending across diaspora business, creator economy, and live
            education.
          </Text>
        </View>

        {posts.map((post) => (
          <TouchableOpacity
            key={post.id}
            activeOpacity={0.9}
            onPress={() => navigation.getParent()?.navigate("Post", { postId: post.id })}
            style={styles.card}
          >
            <Text style={styles.tag}>{post.tag}</Text>
            <Text style={styles.cardTitle}>{post.title}</Text>
            <Text style={styles.cardBody}>{post.excerpt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <AssistantFAB onPress={() => navigation.navigate("Aria")} label="Draft with Aria" />
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
    paddingBottom: 120,
  },
  hero: {
    backgroundColor: "#111D2E",
    borderColor: "#1E3248",
    borderWidth: 1,
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
  tag: {
    color: "#C9A84C",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
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

export default FeedScreen;
