import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import * as Speech from "expo-speech";
import EcosystemContextBar from "../../components/shared/EcosystemContextBar";
import VoiceInput from "../../components/voice/VoiceInput";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

const initialMessages: ChatMessage[] = [
  {
    id: "aria-welcome",
    role: "assistant",
    text: "I can help summarize signals across community, academy, market, and work. Ask for the next highest-leverage move.",
  },
];

const AriaScreen = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState(initialMessages);

  const sendMessage = (value: string) => {
    if (!value.trim()) return null;

    const nextUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: value.trim(),
    };
    const nextAssistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      text: "ARIA suggests prioritizing one quick win: convert fresh community interest into a structured follow-up and assign the next lesson or offer automatically.",
    };

    setMessages((current) => [...current, nextUserMessage, nextAssistantMessage]);
    setInput("");
    return nextAssistantMessage.text;
  };

  return (
    <View style={styles.screen}>
      <EcosystemContextBar
        label="Aria"
        context="Voice-enabled AI coordination for your learning, revenue, and community workflows."
      />
      <ScrollView contentContainerStyle={styles.content}>
        {messages.map((message) => (
          <View key={message.id} style={[styles.message, message.role === "assistant" ? styles.assistant : styles.user]}>
            <Text style={styles.role}>{message.role === "assistant" ? "ARIA" : "You"}</Text>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          placeholder="Ask Aria anything..."
          placeholderTextColor="#6F889F"
          style={styles.input}
          value={input}
          onChangeText={setInput}
        />
        <VoiceInput onSpeechResult={sendMessage} />
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => {
            const response = sendMessage(input);
            if (response) {
              Speech.speak(response);
            }
          }}
          style={styles.send}
        >
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
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
    gap: 12,
    paddingBottom: 20,
  },
  message: {
    borderRadius: 18,
    padding: 16,
    gap: 6,
    maxWidth: "92%",
  },
  assistant: {
    alignSelf: "flex-start",
    backgroundColor: "#111D2E",
    borderWidth: 1,
    borderColor: "#1E3248",
  },
  user: {
    alignSelf: "flex-end",
    backgroundColor: "#1D4E89",
  },
  role: {
    color: "#C9A84C",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  messageText: {
    color: "#E8EEF5",
    fontSize: 14,
    lineHeight: 22,
  },
  composer: {
    borderTopWidth: 1,
    borderTopColor: "#1E3248",
    backgroundColor: "#111D2E",
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: "#0D1520",
    borderWidth: 1,
    borderColor: "#1E3248",
    color: "#E8EEF5",
    paddingHorizontal: 14,
  },
  send: {
    backgroundColor: "#C9A84C",
    borderRadius: 14,
    paddingHorizontal: 16,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  sendText: {
    color: "#0D1520",
    fontWeight: "800",
  },
});

export default AriaScreen;
