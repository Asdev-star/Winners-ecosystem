import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Post">;

const comments = [
  "This should be promoted into the academy launch checklist.",
  "We can turn this thread into a creator webinar by Friday.",
  "ARIA can summarize the top follow-up actions for new members.",
];

const PostScreen = ({ route }: Props) => {
  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>Community Post</Text>
      <Text style={styles.title}>{route.params.postId.replace(/-/g, " ")}</Text>
      <Text style={styles.body}>
        This post view is ready for thread detail, reactions, and deeper conversation routing. The mobile stack now
        has a dedicated screen target for deep links from notifications and feed cards.
      </Text>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Suggested follow-ups</Text>
        {comments.map((comment) => (
          <Text key={comment} style={styles.comment}>
            - {comment}
          </Text>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0D1520",
  },
  content: {
    padding: 24,
    gap: 16,
  },
  eyebrow: {
    color: "#C9A84C",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  title: {
    color: "#E8EEF5",
    fontSize: 28,
    fontWeight: "800",
    textTransform: "capitalize",
  },
  body: {
    color: "#9AB1C6",
    fontSize: 15,
    lineHeight: 24,
  },
  panel: {
    backgroundColor: "#111D2E",
    borderWidth: 1,
    borderColor: "#1E3248",
    borderRadius: 18,
    padding: 18,
    gap: 12,
  },
  panelTitle: {
    color: "#E8EEF5",
    fontSize: 16,
    fontWeight: "700",
  },
  comment: {
    color: "#8FA6BA",
    fontSize: 14,
    lineHeight: 22,
  },
});

export default PostScreen;
