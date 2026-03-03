// Level V - Named Supervisor Deployment
// Hook: useProactiveMessages
// Manages AI-suggested messages without user prompting

import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "../features/auth/authStore";

interface ProactiveMessage {
  id: string;
  type: "insight" | "recommendation" | "opportunity" | "alert";
  title: string;
  message: string;
  assistant: "omega" | "aria" | "nova" | "sage" | "atlas" | "circuit";
  action?: {
    label: string;
    href: string;
  };
  priority: "high" | "medium" | "low";
  createdAt: string;
  dismissed?: boolean;
}

interface ProactiveMessagesState {
  messages: ProactiveMessage[];
  loading: boolean;
  error: string | null;
}

export function useProactiveMessages(options?: {
  maxMessages?: number;
  assistant?: string;
  enabled?: boolean;
}) {
  const { maxMessages = 5, assistant, enabled = true } = options || {};
  
  const [state, setState] = useState<ProactiveMessagesState>({
    messages: [],
    loading: false,
    error: null
  });

  const token = useAuthStore(state => state.token);
  const userId = useAuthStore(state => state.user?.id);

  const fetchMessages = useCallback(async () => {
    if (!enabled || !userId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const params = new URLSearchParams({
        max: maxMessages.toString(),
        ...(assistant && { assistant })
      });

      const response = await fetch(`/api/v1/ai/proactive-messages?${params}`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }

      const data = await response.json();
      
      setState({
        messages: data.messages || [],
        loading: false,
        error: null
      });
    } catch (err) {
      console.error("[useProactiveMessages] Error:", err);
      
      // Use mock messages for demo
      setState({
        messages: getMockMessages(),
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error"
      });
    }
  }, [enabled, userId, token, maxMessages, assistant]);

  const dismissMessage = useCallback(async (messageId: string) => {
    // Optimistically update UI
    setState(prev => ({
      ...prev,
      messages: prev.messages.map(m => 
        m.id === messageId ? { ...m, dismissed: true } : m
      )
    }));

    // Send dismiss request to API
    try {
      await fetch(`/api/v1/ai/proactive-messages/${messageId}/dismiss`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
    } catch (err) {
      console.error("[useProactiveMessages] Dismiss error:", err);
    }
  }, [token]);

  const refreshMessages = useCallback(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    fetchMessages();
    
    // Poll for new messages every 5 minutes
    if (enabled) {
      const interval = setInterval(fetchMessages, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchMessages, enabled]);

  return {
    messages: state.messages.filter(m => !m.dismissed),
    loading: state.loading,
    error: state.error,
    dismissMessage,
    refreshMessages,
  };
}

function getMockMessages(): ProactiveMessage[] {
  const now = new Date();
  
  return [
    {
      id: "1",
      type: "opportunity",
      title: "New Job Match Found",
      message: "A new React developer position matches your skills. Companies are hiring developers with your experience level.",
      assistant: "circuit",
      action: { label: "View Jobs", href: "/work" },
      priority: "high",
      createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: "2",
      type: "recommendation",
      title: "Complete Your Profile",
      message: "Adding your Academy certificates could improve your Trust Score by 15 points.",
      assistant: "omega",
      action: { label: "Add Certificates", href: "/profile" },
      priority: "medium",
      createdAt: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "3",
      type: "insight",
      title: "Trending in Your Network",
      message: "5 of your connections are discussing AI automation this week. Join the conversation!",
      assistant: "nova",
      action: { label: "View Topics", href: "/community" },
      priority: "low",
      createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "4",
      type: "alert",
      title: "Certificate Expiring Soon",
      message: "Your Digital Marketing certificate expires in 30 days. Consider renewing to maintain your Trust Score.",
      assistant: "sage",
      priority: "medium",
      createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}
