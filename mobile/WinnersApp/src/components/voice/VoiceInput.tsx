import React, { useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Mic } from "lucide-react-native";

type Props = {
  onSpeechResult?: (text: string) => void;
};

const prompts = [
  "Summarise today's revenue signals for my team.",
  "Draft a follow-up for the newest community lead.",
  "Show me the next lesson I should finish offline.",
];

const VoiceInput = ({ onSpeechResult }: Props) => {
  const [isListening, setIsListening] = useState(false);
  const nextPrompt = useMemo(
    () => prompts[Math.floor(Math.random() * prompts.length)],
    [isListening],
  );

  const handleRelease = () => {
    setIsListening(false);
    onSpeechResult?.(nextPrompt);
  };

  return (
    <View style={styles.wrap}>
      <TouchableOpacity
        activeOpacity={0.85}
        onLongPress={() => setIsListening(true)}
        onPressOut={handleRelease}
        style={[styles.button, isListening && styles.listening]}
      >
        <Mic color={isListening ? "#FFFFFF" : "#C9A84C"} size={20} />
      </TouchableOpacity>
      <Text style={styles.caption}>{isListening ? "Listening..." : "Hold to speak"}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    gap: 6,
  },
  button: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#172335",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#1E3248",
  },
  listening: {
    backgroundColor: "#B8912A",
    borderColor: "#C9A84C",
  },
  caption: {
    color: "#8FA6BA",
    fontSize: 11,
    fontWeight: "600",
  },
});

export default VoiceInput;
