import React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { CommunityStackParamList } from "../../navigation/TabNavigator";
import EcosystemContextBar from "../../components/shared/EcosystemContextBar";
import AssistantFAB from "../../components/shared/AssistantFAB";

type Props = NativeStackScreenProps<CommunityStackParamList, "Feed">;

const posts = [
  { id: "founders-circle", author: "NOVA", title: "Founders circle demand is up 18%", excerpt: "The strongest threads are tactical, not inspirational. Double down on execution posts." },
  { id: "diaspora-market", author: "Mina", title: "Diaspora buyers are asking for bundled services", excerpt: "Packaging market offers with academy outcomes is converting better than standalone product drops." },
];

export default function FeedScreen({ navigation }: Props) {
  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <EcosystemContextBar layer="Community" assistant="NOVA" />
        <Text style={styles.title}>Community signal</Text>
        <Text style={styles.copy}>
          Mobile feed prioritizes momentum, replies, and network opportunities so you can act quickly between sessions.
        </Text>

        {posts.map((post) => (
          <Pressable
            key={post.id}
            style={styles.card}
            onPress={() => navigation.navigate("Post", { postId: post.id })}
          >
            <Text style={styles.cardMeta}>{post.author}</Text>
            <Text style={styles.cardTitle}>{post.title}</Text>
            <Text style={styles.cardCopy}>{post.excerpt}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <AssistantFAB
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
    gap: 8,
    marginBottom: 14,
  },
  cardMeta: {
    color: "#C9A84C",
    fontWeight: "700",
    fontSize: 12,
  },
  cardTitle: {
    color: "#F5F7FA",
    fontSize: 18,
    fontWeight: "800",
  },
  cardCopy: {
    color: "#C6D0DA",
    fontSize: 14,
    lineHeight: 20,
  },
});
