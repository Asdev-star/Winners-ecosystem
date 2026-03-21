import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Video, ResizeMode } from "expo-av";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { offline } from "../../services/offline";

type Props = NativeStackScreenProps<RootStackParamList, "Lesson">;

const LessonScreen = ({ route }: Props) => {
  const markOfflineReady = () => {
    offline.enqueue({
      endpoint: "/academy/offline-ready",
      method: "POST",
      body: { lessonId: route.params.lessonId },
    });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>Lesson Player</Text>
      <Text style={styles.title}>{route.params.lessonId.replace(/-/g, " ")}</Text>

      <View style={styles.videoWrap}>
        <Video
          style={styles.video}
          useNativeControls
          resizeMode={ResizeMode.COVER}
          source={{ uri: "https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4" }}
        />
      </View>

      <Text style={styles.copy}>
        The lesson screen is ready for streaming playback today and an offline queue pathway for saved progress and
        download intents.
      </Text>

      <TouchableOpacity activeOpacity={0.9} onPress={markOfflineReady} style={styles.button}>
        <Text style={styles.buttonText}>Queue offline access</Text>
      </TouchableOpacity>
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
  videoWrap: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#1E3248",
  },
  video: {
    width: "100%",
    height: 220,
    backgroundColor: "#111D2E",
  },
  copy: {
    color: "#9AB1C6",
    fontSize: 15,
    lineHeight: 24,
  },
  button: {
    backgroundColor: "#C9A84C",
    borderRadius: 14,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#0D1520",
    fontSize: 15,
    fontWeight: "800",
  },
});

export default LessonScreen;
