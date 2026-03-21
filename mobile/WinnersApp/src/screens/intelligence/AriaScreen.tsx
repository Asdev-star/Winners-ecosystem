import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import EcosystemContextBar from "../../components/shared/EcosystemContextBar";
import VoiceInput from "../../components/voice/VoiceInput";
import { sendAssistantMessage } from "../../services/api";

interface ChatMessage {
  role: "assistant" | "user";
  content: string;
}

export default function AriaScreen() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "I am ARIA. Ask for a weekly plan, a summary, or a next move across the ecosystem.",
    },
  ]);
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSend() {
    if (!prompt.trim() || busy) {
      return;
    }

    const input = prompt.trim();
    setPrompt("");
    setMessages((current) => [...current, { role: "user", content: input }]);
    setBusy(true);

    try {
      const response = await sendAssistantMessage(input, "aria");
      const reply =
        response.data?.message ??
        "ARIA could not reach the backend, so the mobile shell is showing a local fallback response.";

      setMessages((current) => [...current, { role: "assistant", content: reply }]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: "Backend unavailable. I would still suggest prioritizing the shortest path to shipped outcomes this week.",
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.root}
    >
      <View style={styles.inner}>
        <EcosystemContextBar layer="Intelligence" assistant="ARIA" status="Voice enabled" />

        <ScrollView contentContainerStyle={styles.messages}>
          {messages.map((message, index) => (
            <View
              key={`${message.role}-${index}`}
              style={[
                styles.message,
                message.role === "assistant" ? styles.assistantMessage : styles.userMessage,
              ]}
            >
              <Text style={styles.messageRole}>{message.role === "assistant" ? "ARIA" : "You"}</Text>
              <Text style={styles.messageText}>{message.content}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Ask ARIA anything..."
            placeholderTextColor="#6F849C"
            style={styles.input}
            multiline
          />
          <View style={styles.actions}>
            <VoiceInput onTranscript={setPrompt} />
            <Pressable onPress={handleSend} style={[styles.sendButton, busy && styles.sendButtonMuted]}>
              <Text style={styles.sendButtonText}>{busy ? "Thinking..." : "Send"}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0D1520",
  },
  inner: {
    flex: 1,
    padding: 20,
  },
  messages: {
    gap: 12,
    paddingBottom: 20,
  },
  message: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
  },
  assistantMessage: {
    backgroundColor: "#162131",
    borderColor: "#223247",
  },
  userMessage: {
    backgroundColor: "#1B2734",
    borderColor: "#30455E",
  },
  messageRole: {
    color: "#C9A84C",
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 6,
  },
  messageText: {
    color: "#F5F7FA",
    fontSize: 14,
    lineHeight: 22,
  },
  composer: {
    gap: 12,
    marginTop: 12,
  },
  input: {
    minHeight: 112,
    backgroundColor: "#101926",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#223247",
    color: "#F5F7FA",
    padding: 16,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
  },
  sendButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "#C9A84C",
    paddingVertical: 14,
  },
  sendButtonMuted: {
    opacity: 0.75,
  },
  sendButtonText: {
    color: "#0D1520",
    fontWeight: "900",
    fontSize: 13,
  },
});
