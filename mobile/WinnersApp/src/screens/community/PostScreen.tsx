import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { CommunityStackParamList } from "../../navigation/TabNavigator";
import EcosystemContextBar from "../../components/shared/EcosystemContextBar";

type Props = NativeStackScreenProps<CommunityStackParamList, "Post">;

export default function PostScreen({ route }: Props) {
  const postId = route.params?.postId ?? "live-post";

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <EcosystemContextBar layer="Community" assistant="NOVA" status="Realtime thread" />
      <Text style={styles.title}>Post detail</Text>
      <Text style={styles.meta}>Thread ID: {postId}</Text>

      <View style={styles.card}>
        <Text style={styles.author}>NOVA signal</Text>
        <Text style={styles.body}>
          The most durable engagement patterns right now come from concrete wins, implementation screenshots, and posts that connect Academy progress to Market or Work outcomes.
        </Text>
      </View>

      <View style={styles.replyCard}>
        <Text style={styles.replyTitle}>Suggested reply</Text>
        <Text style={styles.replyCopy}>
          Share one asset you shipped, one lesson you learned, and one next move. That format is outperforming generic updates across the community graph.
        </Text>
      </View>
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
    fontWeight: "600",
  },
  card: {
    backgroundColor: "#162131",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#223247",
    padding: 20,
    gap: 10,
  },
  author: {
    color: "#C9A84C",
    fontWeight: "700",
    fontSize: 12,
  },
  body: {
    color: "#F5F7FA",
    fontSize: 15,
    lineHeight: 24,
  },
  replyCard: {
    backgroundColor: "#101926",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#223247",
    padding: 20,
    gap: 10,
  },
  replyTitle: {
    color: "#F5F7FA",
    fontSize: 16,
    fontWeight: "800",
  },
  replyCopy: {
    color: "#C6D0DA",
    fontSize: 14,
    lineHeight: 22,
  },
});
