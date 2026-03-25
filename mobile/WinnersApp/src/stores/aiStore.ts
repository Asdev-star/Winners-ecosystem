import { create } from "zustand";

export type AssistantKey = "aria" | "nova" | "sage" | "atlas" | "omega";

export type AssistantMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
};

type AssistantConfig = {
  key: AssistantKey;
  label: string;
  accent: "gold" | "green" | "ice" | "purple";
  route:
    | "ARIAChat"
    | "NOVAChat"
    | "SAGEChat"
    | "ATLASChat"
    | "OMEGABriefing";
  hubSummary: string;
  intro: string;
  quickPrompts: string[];
};

type AIState = {
  conversations: Record<AssistantKey, AssistantMessage[]>;
  sendMessage: (assistant: AssistantKey, text: string) => AssistantMessage | null;
};

export const ASSISTANT_CONFIG: Record<AssistantKey, AssistantConfig> = {
  aria: {
    key: "aria",
    label: "ARIA",
    accent: "gold",
    route: "ARIAChat",
    hubSummary: "Cross-layer synthesis for the next highest-leverage move.",
    intro: "I can coordinate signals across Community, Academy, Market, and Work. Ask for the next strongest move.",
    quickPrompts: [
      "What should I do next across the whole ecosystem?",
      "Summarize today’s strongest signals.",
      "Turn my recent activity into one operator plan.",
    ],
  },
  nova: {
    key: "nova",
    label: "NOVA",
    accent: "green",
    route: "NOVAChat",
    hubSummary: "Community momentum, collaboration patterns, and content signals.",
    intro: "I focus on community rhythm, post performance, and the fastest path to meaningful engagement.",
    quickPrompts: [
      "Draft a high-signal community post.",
      "What group should I focus on this week?",
      "Spot collaboration opportunities in my recent activity.",
    ],
  },
  sage: {
    key: "sage",
    label: "SAGE",
    accent: "ice",
    route: "SAGEChat",
    hubSummary: "Learning paths, lesson context, and certification momentum.",
    intro: "I help connect what you are learning to what you should execute next.",
    quickPrompts: [
      "What lesson should I take next?",
      "Turn this course into an action plan.",
      "Show me my strongest learning gap.",
    ],
  },
  atlas: {
    key: "atlas",
    label: "ATLAS",
    accent: "gold",
    route: "ATLASChat",
    hubSummary: "Commerce, offers, fulfillment, and product signal ranking.",
    intro: "I focus on product demand, offer design, and the clearest route from interest to purchase.",
    quickPrompts: [
      "What product should I push next?",
      "Summarize the strongest market signal.",
      "Improve my checkout conversion path.",
    ],
  },
  omega: {
    key: "omega",
    label: "OMEGA",
    accent: "purple",
    route: "OMEGABriefing",
    hubSummary: "Strategic briefing across identity, momentum, and next-step prioritization.",
    intro: "I synthesize the full operator picture and turn scattered activity into a clear strategic briefing.",
    quickPrompts: [
      "Give me my weekly operator briefing.",
      "What is my highest-leverage focus?",
      "Summarize my current strengths and gaps.",
    ],
  },
};

const INITIAL_CONVERSATIONS: Record<AssistantKey, AssistantMessage[]> = {
  aria: [
    {
      id: "aria-welcome",
      role: "assistant",
      text: ASSISTANT_CONFIG.aria.intro,
    },
  ],
  nova: [
    {
      id: "nova-welcome",
      role: "assistant",
      text: ASSISTANT_CONFIG.nova.intro,
    },
  ],
  sage: [
    {
      id: "sage-welcome",
      role: "assistant",
      text: ASSISTANT_CONFIG.sage.intro,
    },
  ],
  atlas: [
    {
      id: "atlas-welcome",
      role: "assistant",
      text: ASSISTANT_CONFIG.atlas.intro,
    },
  ],
  omega: [
    {
      id: "omega-welcome",
      role: "assistant",
      text: ASSISTANT_CONFIG.omega.intro,
    },
  ],
};

function buildResponse(assistant: AssistantKey, text: string) {
  const normalized = text.toLowerCase();

  if (assistant === "aria") {
    if (normalized.includes("next")) {
      return "ARIA suggests a three-step move: publish one focused community update, continue your growth systems course, and convert that momentum into one market or work action by end of day.";
    }
    return "ARIA sees the strongest leverage in linking your freshest signal to one concrete follow-up and one measurable output.";
  }

  if (assistant === "nova") {
    return "NOVA recommends turning your strongest idea into a specific ask, posting it in the most relevant group, and following up with one direct collaboration invitation.";
  }

  if (assistant === "sage") {
    return "SAGE recommends completing your next lesson, writing one execution note, and testing it inside Community or Market within the same day.";
  }

  if (assistant === "atlas") {
    return "ATLAS suggests focusing on the offer with the clearest trust signal, then tightening the path from product discovery to checkout.";
  }

  return "OMEGA’s briefing is clear: narrow your focus, commit to one operating priority, and use the rest of the ecosystem to amplify that decision instead of fragmenting it.";
}

export const useAIStore = create<AIState>((set) => ({
  conversations: INITIAL_CONVERSATIONS,
  sendMessage: (assistant, text) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return null;
    }

    const userMessage: AssistantMessage = {
      id: `${assistant}-user-${Date.now()}`,
      role: "user",
      text: trimmed,
    };

    const assistantMessage: AssistantMessage = {
      id: `${assistant}-assistant-${Date.now() + 1}`,
      role: "assistant",
      text: buildResponse(assistant, trimmed),
    };

    set((state) => ({
      conversations: {
        ...state.conversations,
        [assistant]: [...state.conversations[assistant], userMessage, assistantMessage],
      },
    }));

    return assistantMessage;
  },
}));
