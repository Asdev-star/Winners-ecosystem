// Phase 5 - Intelligence Layer
// Hook: useAssistant
// Implements: AI Assistant Interaction Specification V2
// Unified hook for all 9 supervisors with context injection, streaming, and follow-up chips

import { useState, useCallback, useRef, useEffect } from "react";
import { getAuthHeaders, useAuthStore } from "../features/auth/authStore";
import { useAgenticLoopStore } from "../stores/agenticLoopStore";
import {
  generateSystemPrompt,
  generateFollowUpChipsPrompt,
  generateGreetingPrompt,
  SUPERVISOR_PROMPTS,
  type SupervisorPromptConfig
} from "../config/supervisorPrompts";
import type { SupervisorName } from "../stores/assistantStore";

// Message types
export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  supervisor?: SupervisorName;
  provider?: string;
  tokensUsed?: number;
}

export interface UseAssistantOptions {
  supervisor: SupervisorName;
  initialMessage?: string;
  autoGreeting?: boolean;
  context?: Record<string, unknown>;
}

export interface UseAssistantReturn {
  messages: AssistantMessage[];
  isLoading: boolean;
  isStreaming: boolean;
  error: string | null;
  followUpChips: string[];
  greeting: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  regenerateGreeting: () => Promise<void>;
  supervisorConfig: SupervisorPromptConfig;
}

// Derive the current layer/page from the browser URL path
function getCurrentLayerFromPath(): { currentLayer: string; currentPage: string } {
  const path = typeof window !== "undefined" ? window.location.pathname : "/";
  if (path.startsWith("/academy"))     return { currentLayer: "Academy",      currentPage: "academy" };
  if (path.startsWith("/market"))      return { currentLayer: "Market",       currentPage: "market" };
  if (path.startsWith("/work"))        return { currentLayer: "Work",         currentPage: "work" };
  if (path.startsWith("/intelligence")) return { currentLayer: "Intelligence", currentPage: "intelligence" };
  if (path.startsWith("/cloud"))       return { currentLayer: "Cloud",        currentPage: "cloud" };
  if (path.startsWith("/community"))   return { currentLayer: "Community",    currentPage: "community" };
  if (path.startsWith("/analytics"))   return { currentLayer: "Core Engine",  currentPage: "analytics" };
  if (path.startsWith("/billing"))     return { currentLayer: "Core Engine",  currentPage: "billing" };
  if (path.startsWith("/dashboard"))   return { currentLayer: "Core Engine",  currentPage: "admin-dashboard" };
  if (path.startsWith("/home"))        return { currentLayer: "Core Engine",  currentPage: "home" };
  return { currentLayer: "Core Engine", currentPage: "home" };
}

function getUserContext() {
  const authUser = useAuthStore.getState().user;
  const loopState = useAgenticLoopStore.getState();

  const trustScoreRaw =
    authUser && typeof authUser === "object" && "trustScore" in authUser
      ? (authUser as { trustScore?: unknown }).trustScore
      : undefined;
  const trustScore = typeof trustScoreRaw === "number" ? trustScoreRaw : 0;
  let trustTier = "Bronze";
  if (trustScore >= 85) trustTier = "Platinum";
  else if (trustScore >= 65) trustTier = "Gold";
  else if (trustScore >= 40) trustTier = "Silver";

  const { currentLayer, currentPage } = getCurrentLayerFromPath();

  return {
    userName: authUser?.name ?? "User",
    currentLayer,
    loopStage: loopState.currentStage ?? "community",
    trustScore,
    trustTier,
    recentActions: [],
    pendingItems: [],
    currentPage,
  };
}

// API call to chat endpoint
async function callChatAPI(
  supervisor: SupervisorName,
  messages: AssistantMessage[],
  context?: Record<string, unknown>
): Promise<{ content: string; tokens?: number; provider?: string }> {
  const authHeaders = getAuthHeaders();
  if (!authHeaders.Authorization) {
    throw new Error("Authentication required");
  }

  const userContext = getUserContext();
  const systemPrompt = generateSystemPrompt(supervisor, userContext, context as Record<string, string> | undefined);
  
  const response = await fetch("/api/v1/chat/message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({
      supervisor,
      systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      context
    })
  });
  
  if (!response.ok) {
    throw new Error(`Chat API error: ${response.status}`);
  }
  
  const data = await response.json();
  return {
    content: data.content || data.message?.content || "",
    tokens: data.tokensUsed,
    provider: data.provider
  };
}

// API call for streaming
async function* streamChatAPI(
  supervisor: SupervisorName,
  messages: AssistantMessage[],
  context?: Record<string, unknown>
): AsyncGenerator<string> {
  const authHeaders = getAuthHeaders();
  if (!authHeaders.Authorization) {
    throw new Error("Authentication required");
  }

  const userContext = getUserContext();
  const systemPrompt = generateSystemPrompt(supervisor, userContext, context as Record<string, string> | undefined);
  
  const response = await fetch("/api/v1/chat/message", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({
      supervisor,
      systemPrompt,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content
      })),
      context,
      stream: true
    })
  });
  
  if (!response.ok) {
    throw new Error(`Chat API error: ${response.status}`);
  }
  
  if (!response.body) {
    throw new Error("No response body");
  }
  
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");
      
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);
          if (data === "[DONE]") return;
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.token) {
              yield parsed.token;
            } else if (parsed.content) {
              yield parsed.content;
            }
          } catch {
            // Not JSON, yield as-is
            yield line;
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

// API call for follow-up chips
async function generateFollowUpChips(userQuery: string, assistantResponse: string): Promise<string[]> {
  const authHeaders = getAuthHeaders();
  if (!authHeaders.Authorization) return [];

  const prompt = generateFollowUpChipsPrompt(userQuery, assistantResponse);
  
  const response = await fetch("/api/v1/ai/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({
      prompt,
      maxTokens: 200,
      temperature: 0.7
    })
  });
  
  if (!response.ok) {
    return [];
  }
  
  const data = await response.json();
  const content = data.content || data.text || "";
  
  try {
    // Try to parse JSON array
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, 3);
    }
  } catch {
    // Not JSON, try to extract lines
    const lines = content
      .split("\n")
      .filter((line: string) => line.trim().length > 0)
      .slice(0, 3);
    return lines;
  }
  
  return [];
}

// API call for greeting generation
async function generateGreeting(supervisor: SupervisorName): Promise<string> {
  const authHeaders = getAuthHeaders();
  if (!authHeaders.Authorization) {
    const config = SUPERVISOR_PROMPTS[supervisor];
    return `Hello! I'm ${config.name}. How can I help you today?`;
  }

  const userContext = getUserContext();
  const prompt = generateGreetingPrompt(supervisor, userContext);
  
  const response = await fetch("/api/v1/ai/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders,
    },
    body: JSON.stringify({
      prompt,
      maxTokens: 150,
      temperature: 0.8
    })
  });
  
  if (!response.ok) {
    const config = SUPERVISOR_PROMPTS[supervisor];
    return `Hello! I'm ${config.name}. How can I help you today?`;
  }
  
  const data = await response.json();
  const content = data.content || data.text || "";
  
  // Clean up and return
  return content.trim();
}

export function useAssistant(options: UseAssistantOptions): UseAssistantReturn {
  const { supervisor, initialMessage, autoGreeting = true, context } = options;
  
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followUpChips, setFollowUpChips] = useState<string[]>([]);
  const [greeting, setGreeting] = useState<string | null>(null);
  
  const streamingContent = useRef("");
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const supervisorConfig = SUPERVISOR_PROMPTS[supervisor];
  
  // Generate greeting on mount
  useEffect(() => {
    if (autoGreeting && !greeting) {
      generateGreeting(supervisor)
        .then(g => setGreeting(g))
        .catch(() => {
          const config = SUPERVISOR_PROMPTS[supervisor];
          setGreeting(`Hello! I'm ${config.name}. How can I help you today?`);
        });
    }
  }, [supervisor, autoGreeting, greeting]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
  
  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    
    // Add user message
    const userMessage: AssistantMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
      supervisor
    };
    
    setMessages(prev => [...prev, userMessage]);
    setFollowUpChips([]);
    setError(null);
    setIsLoading(true);
    setIsStreaming(true);
    
    try {
      // Get previous messages for context
      const previousMessages = messages;
      
      // Start streaming
      streamingContent.current = "";
      
      const stream = streamChatAPI(supervisor, [...previousMessages, userMessage], context);
      
      const assistantMessage: AssistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        isStreaming: true,
        supervisor
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      for await (const token of stream) {
        streamingContent.current += token;
        
        setMessages(prev => 
          prev.map(m => 
            m.id === assistantMessage.id 
              ? { ...m, content: streamingContent.current }
              : m
          )
        );
      }
      
      // Streaming complete
      const finalContent = streamingContent.current;
      
      setMessages(prev => 
        prev.map(m => 
          m.id === assistantMessage.id 
            ? { ...m, content: finalContent, isStreaming: false }
            : m
        )
      );
      
      // Generate follow-up chips
      const chips = await generateFollowUpChips(content, finalContent);
      setFollowUpChips(chips);
      
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // Request was cancelled, don't show error
        return;
      }
      
      setError(err instanceof Error ? err.message : "An error occurred");
      
      // Add error message
      const errorMessage: AssistantMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "I encountered an error processing your request. Please try again.",
        timestamp: new Date(),
        supervisor
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  }, [messages, supervisor, context]);
  
  const clearMessages = useCallback(() => {
    setMessages([]);
    setFollowUpChips([]);
    setError(null);
    streamingContent.current = "";
  }, []);
  
  const regenerateGreeting = useCallback(async () => {
    setGreeting(null);
    const g = await generateGreeting(supervisor);
    setGreeting(g);
  }, [supervisor]);
  
  return {
    messages,
    isLoading,
    isStreaming,
    error,
    followUpChips,
    greeting,
    sendMessage,
    clearMessages,
    regenerateGreeting,
    supervisorConfig
  };
}

// Export types for consumers
export type { SupervisorName };
