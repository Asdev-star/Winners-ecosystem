// Level VI — Multimodal Intelligence
// Hook: useMultimodalChat
// Streaming + file upload + provider routing via FORGE.
// Supports: text, images, PDFs, audio files across Claude/GPT-4o/Gemini/Ollama.

import { useState, useCallback, useRef } from "react";
import type { ModelId } from "../config/models";
import type { DroppedFile } from "../components/ai/FileDropZone";
import { getAuthHeaders } from "../features/auth/authStore";

const API = import.meta.env.VITE_API_URL || "http://localhost:3001";

// ─── Types ────────────────────────────────────────────────────────────────────

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  files?: DroppedFile[];
  model?: ModelId;
  timestamp: Date;
  streaming?: boolean;
  error?: boolean;
}

export interface MultimodalChatOptions {
  assistant?: string;
  model?: ModelId;
  systemPrompt?: string;
  context?: Record<string, unknown>;
  onTokenDelta?: (delta: string) => void;
  onComplete?: (message: ChatMessage) => void;
  onError?: (error: string) => void;
}

function toBackendModel(model: ModelId) {
  if (model.startsWith("claude")) return "claude";
  if (model.startsWith("gpt-4o")) return "gpt4o";
  if (model.startsWith("gemini")) return "gemini";
  return "ollama";
}

function fileToBlob(file: DroppedFile) {
  const [, base64Data] = file.data.includes(",") ? file.data.split(",", 2) : ["", file.data];
  const binary = atob(base64Data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: file.mimeType });
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useMultimodalChat(options: MultimodalChatOptions = {}) {
  const {
    assistant = "forge",
    model: initialModel = "claude-3-7-sonnet",
    systemPrompt,
    context,
    onTokenDelta,
    onComplete,
    onError,
  } = options;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentModel, setCurrentModel] = useState<ModelId>(initialModel);
  const [attachedFiles, setAttachedFiles] = useState<DroppedFile[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  // ── Build conversation history for API ──────────────────────────────────────
  const buildHistory = (msgs: ChatMessage[]) =>
    msgs
      .filter((m) => !m.error)
      .map((m) => ({
        role: m.role,
        content: m.content,
        ...(m.files?.length
          ? { files: m.files.map((f) => ({ type: f.type, data: f.data, name: f.name, mimeType: f.mimeType })) }
          : {}),
      }));

  // ── Mock streamed response (no live API) ────────────────────────────────────
  const mockStream = async (
    userContent: string,
    files: DroppedFile[],
    assistantMsgId: string
  ) => {
    const hasFile = files.length > 0;
    const fileDesc = hasFile
      ? `I can see you've attached ${files.map((f) => `${f.type} "${f.name}"`).join(", ")}. `
      : "";

    const responses: string[] = [
      `${fileDesc}I've analysed your input and here is what I found: the content aligns well with your current goals across the ecosystem. `,
      `Based on your context, I'd recommend focusing on the areas showing the highest leverage — specifically your community engagement and market positioning. `,
      `This analysis was routed through FORGE using ${currentModel} for optimal accuracy. `,
      `Would you like a deeper breakdown of any of these signals?`,
    ];

    const full = responses.join("");
    let accumulated = "";

    for (const chunk of responses) {
      await new Promise((r) => setTimeout(r, 120 + Math.random() * 80));
      accumulated += chunk;
      onTokenDelta?.(chunk);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: accumulated, streaming: true }
            : m
        )
      );
    }

    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantMsgId ? { ...m, streaming: false } : m
      )
    );

    const finalMsg = messages.find((m) => m.id === assistantMsgId);
    if (finalMsg) onComplete?.({ ...finalMsg, content: accumulated, streaming: false });
  };

  // ── Live streamed API call ──────────────────────────────────────────────────
  const liveStream = async (
    userContent: string,
    files: DroppedFile[],
    history: ReturnType<typeof buildHistory>,
    assistantMsgId: string
  ) => {
    abortRef.current = new AbortController();

    const res = await fetch(`${API}/api/v1/ai-platform/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      signal: abortRef.current.signal,
      body: JSON.stringify({
        assistant,
        model: currentModel,
        systemPrompt,
        context,
        history,
        message: userContent,
        files: files.map((f) => ({ type: f.type, data: f.data, name: f.name, mimeType: f.mimeType })),
      }),
    });

    if (!res.ok || !res.body) throw new Error(`API error ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let accumulated = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const text = decoder.decode(value, { stream: true });
      const lines = text.split("\n").filter((l) => l.startsWith("data:"));

      for (const line of lines) {
        const data = line.slice(5).trim();
        if (data === "[DONE]") break;
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.delta ?? parsed.text ?? "";
          accumulated += delta;
          onTokenDelta?.(delta);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: accumulated, streaming: true }
                : m
            )
          );
        } catch {
          // Ignore malformed SSE chunks
        }
      }
    }

    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantMsgId ? { ...m, streaming: false } : m
      )
    );

    const finalMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: accumulated,
      model: currentModel,
      timestamp: new Date(),
      streaming: false,
    };
    onComplete?.(finalMsg);
  };

  const multimodalRequest = async (
    userContent: string,
    files: DroppedFile[],
    assistantMsgId: string,
  ) => {
    const formData = new FormData();
    formData.append("message", userContent);
    formData.append("model", toBackendModel(currentModel));
    formData.append("assistant", assistant);

    for (const file of files) {
      formData.append("file", fileToBlob(file), file.name);
    }

    const headers = getAuthHeaders();
    delete headers["Content-Type"];

    const res = await fetch(`${API}/api/v1/ai-platform/multimodal`, {
      method: "POST",
      headers,
      signal: abortRef.current?.signal,
      body: formData,
    });

    if (!res.ok) throw new Error(`API error ${res.status}`);

    const data = await res.json();
    const content = data.response ?? data.analysis ?? data.text ?? data.message ?? "";

    setMessages((prev) =>
      prev.map((m) =>
        m.id === assistantMsgId
          ? { ...m, content, streaming: false }
          : m
      )
    );

    const finalMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content,
      model: currentModel,
      timestamp: new Date(),
      streaming: false,
    };
    onComplete?.(finalMsg);
  };

  // ── Send ────────────────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (userText: string, extraFiles?: DroppedFile[]) => {
      if (isStreaming) return;

      const files = [...attachedFiles, ...(extraFiles ?? [])];
      const fileLabel = files.length
        ? ` [${files.map((f) => `${f.type.toUpperCase()}: ${f.name}`).join(", ")}]`
        : "";

      const userMsg: ChatMessage = {
        id: `u_${Date.now()}`,
        role: "user",
        content: (userText.trim() || "Analyse this file") + fileLabel,
        files,
        timestamp: new Date(),
      };

      const assistantMsgId = `a_${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        model: currentModel,
        timestamp: new Date(),
        streaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setAttachedFiles([]);
      setIsStreaming(true);

      const history = buildHistory([...messages, userMsg]);

      try {
        const headers = getAuthHeaders();
        if (headers.Authorization) {
          if (files.length > 0) {
            await multimodalRequest(userText, files, assistantMsgId);
          } else {
            await liveStream(userText, files, history, assistantMsgId);
          }
        } else {
          // No auth - show error instead of mock
          throw new Error("Authentication required. Please log in to use the AI chat.");
        }
      } catch (err: unknown) {
        if ((err as Error)?.name === "AbortError") return;
        const errMsg = err instanceof Error ? err.message : "Connection error";
        onError?.(errMsg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? { ...m, content: `⚠️ ${errMsg}`, streaming: false, error: true }
              : m
          )
        );
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming, attachedFiles, messages, currentModel, assistant]
  );

  const attachFile = useCallback((file: DroppedFile) => {
    setAttachedFiles((prev) => [...prev, file]);
  }, []);

  const removeFile = useCallback((index: number) => {
    setAttachedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearFiles = useCallback(() => setAttachedFiles([]), []);

  const clearMessages = useCallback(() => setMessages([]), []);

  const stopStreaming = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
  }, []);

  return {
    messages,
    isStreaming,
    attachedFiles,
    currentModel,
    setCurrentModel,
    sendMessage,
    attachFile,
    removeFile,
    clearFiles,
    clearMessages,
    stopStreaming,
  };
}
