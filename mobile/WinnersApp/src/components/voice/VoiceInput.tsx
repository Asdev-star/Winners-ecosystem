import React, { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { Audio, InterruptionModeIOS } from "expo-av";
import * as Haptics from "expo-haptics";
import { API_BASE, getAuthToken } from "../../services/api";
import { colors, typography } from "../../theme/tokens";

type Props = {
  onTranscript: (text: string) => void;
};

const VoiceInput = ({ onTranscript }: Props) => {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const startRecording = async () => {
    const permission = await Audio.requestPermissionsAsync();
    if (!permission.granted || isProcessing) {
      return;
    }

    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
    });
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const nextRecording = new Audio.Recording();
    nextRecording.setOnRecordingStatusUpdate((status) => {
      setIsRecording(status.isRecording);
    });
    await nextRecording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    await nextRecording.startAsync();
    setRecording(nextRecording);
  };

  const stopRecording = async () => {
    if (!recording || !isRecording) {
      return;
    }

    await recording.stopAndUnloadAsync();
    setIsProcessing(true);

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });

      const uri = recording.getURI();
      if (!uri) {
        return;
      }

      const formData = new FormData();
      formData.append("audio", {
        uri,
        name: "voice.m4a",
        type: "audio/m4a",
      } as any);

      const token = await getAuthToken();
      const response = await fetch(`${API_BASE}/ai-platform/speech/transcribe`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });
      const data = (await response.json().catch(() => ({}))) as { text?: string };

      if (data.text) {
        onTranscript(data.text);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } finally {
      setRecording(null);
      setIsRecording(false);
      setIsProcessing(false);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isRecording ? "Stop voice recording" : "Start voice recording"}
      accessibilityHint="Press and hold to record your voice message."
      onPressIn={() => void startRecording()}
      onPressOut={() => void stopRecording()}
      style={({ pressed }) => [
        styles.button,
        isRecording ? styles.recording : styles.idle,
        pressed && styles.pressed,
        isProcessing && styles.processing,
      ]}
    >
      <Text style={styles.icon}>Mic</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  idle: {
    backgroundColor: colors.purple,
  },
  recording: {
    backgroundColor: colors.red,
  },
  pressed: {
    transform: [{ scale: 0.92 }],
  },
  processing: {
    opacity: 0.6,
  },
  icon: {
    color: colors.text,
    ...typography.labelLg,
  },
});

export default VoiceInput;
