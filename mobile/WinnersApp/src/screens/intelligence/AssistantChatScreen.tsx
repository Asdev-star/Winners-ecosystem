import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, TextInput, Pressable, View } from "react-native";
import * as Speech from "expo-speech";
import Badge from "../../components/ui/Badge";
import VoiceInput from "../../components/voice/VoiceInput";
import { ASSISTANT_CONFIG, type AssistantKey, useAIStore } from "../../stores/aiStore";
import { colors, radius, spacing, touch, typography, withAlpha } from "../../theme/tokens";

type Props = {
  assistant: AssistantKey;
};

export default function AssistantChatScreen({ assistant }: Props) {
  const [input, setInput] = useState("");
  const sendMessage = useAIStore((state) => state.sendMessage);
  const messages = useAIStore((state) => state.conversations[assistant]);
  const config = ASSISTANT_CONFIG[assistant];

  const submit = (value: string) => {
    const response = sendMessage(assistant, value);
    setInput("");

    if (response) {
      Speech.speak(response.text);
      return response.text;
    }

    return null;
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Badge label={config.label} variant={config.accent} />
        <Text style={styles.headerText}>{config.hubSummary}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.promptRow}>
          {config.quickPrompts.map((prompt) => (
            <Pressable
              key={prompt}
              accessibilityRole="button"
              accessibilityLabel={prompt}
              onPress={() => {
                void submit(prompt);
              }}
              style={({ pressed }) => [styles.promptChip, pressed && styles.pressed]}
            >
              <Text style={styles.promptChipText}>{prompt}</Text>
            </Pressable>
          ))}
        </View>

        {messages.map((message) => (
          <View key={message.id} style={[styles.message, message.role === "assistant" ? styles.assistant : styles.user]}>
            <Text style={[styles.role, message.role === "assistant" ? styles.roleAssistant : styles.roleUser]}>
              {message.role === "assistant" ? config.label : "You"}
            </Text>
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.composer}>
        <TextInput
          accessibilityLabel={`Message ${config.label}`}
          accessibilityHint={`Send a message to ${config.label}.`}
          placeholder={`Ask ${config.label} anything...`}
          placeholderTextColor={colors.textDim}
          style={styles.input}
          value={input}
          onChangeText={setInput}
        />
        <VoiceInput onTranscript={submit} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send message"
          accessibilityState={{ disabled: !input.trim() }}
          onPress={() => {
            void submit(input);
          }}
          style={({ pressed }) => [styles.send, !input.trim() && styles.sendDisabled, pressed && styles.pressed]}
        >
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  headerText: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  content: {
    padding: spacing.md,
    gap: spacing.sm,
    paddingBottom: 20,
  },
  promptRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  promptChip: {
    minHeight: touch.minimum,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
  promptChipText: {
    color: colors.textDim,
    ...typography.bodySm,
  },
  message: {
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
    maxWidth: "92%",
  },
  assistant: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  user: {
    alignSelf: "flex-end",
    backgroundColor: withAlpha("blue", 0.3),
  },
  role: {
    ...typography.labelLg,
  },
  roleAssistant: {
    color: colors.gold,
  },
  roleUser: {
    color: colors.ice,
  },
  messageText: {
    color: colors.text,
    ...typography.bodyMd,
  },
  composer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: touch.comfortable,
    borderRadius: radius.lg,
    backgroundColor: colors.bg,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    paddingHorizontal: spacing.md,
    ...typography.bodyMd,
  },
  send: {
    backgroundColor: colors.gold,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    minHeight: touch.comfortable,
    alignItems: "center",
    justifyContent: "center",
  },
  sendDisabled: {
    opacity: 0.45,
  },
  sendText: {
    color: colors.bg,
    ...typography.labelLg,
  },
  pressed: {
    opacity: 0.78,
  },
});
