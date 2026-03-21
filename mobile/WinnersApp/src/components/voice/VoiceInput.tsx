import React, { useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
}

export default function VoiceInput({ onTranscript }: VoiceInputProps) {
  const [recording, setRecording] = useState(false);

  async function handlePress() {
    if (recording) {
      setRecording(false);
      onTranscript("Voice note captured. Drafting a transcript for ARIA.");
      return;
    }

    setRecording(true);
    setTimeout(() => {
      setRecording(false);
      onTranscript("I want ARIA to summarize my priorities for the week.");
    }, 1200);
  }

  return (
    <Pressable style={[styles.button, recording && styles.buttonActive]} onPress={handlePress}>
      <Text style={styles.label}>{recording ? "Stop Mic" : "Voice Input"}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#4D6785",
    backgroundColor: "#162131",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  buttonActive: {
    backgroundColor: "#4A1F2A",
    borderColor: "#D66C6C",
  },
  label: {
    color: "#F5F7FA",
    fontWeight: "700",
    fontSize: 12,
  },
});
