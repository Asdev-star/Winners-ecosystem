export type ModelId =
  | "claude-3-7-sonnet"
  | "claude-3-5-haiku"
  | "gpt-4o"
  | "gpt-4o-mini"
  | "gemini-2-0-flash"
  | "gemini-1-5-pro"
  | "llama-3-1-70b"
  | "ollama-local";

export interface ModelConfig {
  id: ModelId;
  label: string;
  provider: "anthropic" | "openai" | "google" | "meta" | "local";
  speedRating: 1 | 2 | 3 | 4 | 5;
  costRating: 1 | 2 | 3 | 4 | 5;
  contextWindow: string;
  bestFor: string;
  badge?: string;
  emoji: string;
}

export const MODELS: ModelConfig[] = [
  {
    id: "claude-3-7-sonnet",
    label: "Claude 3.7 Sonnet",
    provider: "anthropic",
    speedRating: 3,
    costRating: 3,
    contextWindow: "200K",
    bestFor: "Complex reasoning and writing",
    badge: "Recommended",
    emoji: "🟣",
  },
  {
    id: "claude-3-5-haiku",
    label: "Claude 3.5 Haiku",
    provider: "anthropic",
    speedRating: 5,
    costRating: 2,
    contextWindow: "200K",
    bestFor: "Fast responses and low cost",
    emoji: "🟣",
  },
  {
    id: "gpt-4o",
    label: "GPT-4o",
    provider: "openai",
    speedRating: 4,
    costRating: 3,
    contextWindow: "128K",
    bestFor: "Multimodal and vision",
    emoji: "🟢",
  },
  {
    id: "gpt-4o-mini",
    label: "GPT-4o Mini",
    provider: "openai",
    speedRating: 5,
    costRating: 1,
    contextWindow: "128K",
    bestFor: "High volume and budget",
    emoji: "🟢",
  },
  {
    id: "gemini-2-0-flash",
    label: "Gemini 2.0 Flash",
    provider: "google",
    speedRating: 5,
    costRating: 1,
    contextWindow: "1M",
    bestFor: "Long documents and ultra fast",
    badge: "1M context",
    emoji: "🔵",
  },
  {
    id: "gemini-1-5-pro",
    label: "Gemini 1.5 Pro",
    provider: "google",
    speedRating: 3,
    costRating: 2,
    contextWindow: "2M",
    bestFor: "Full codebase and deep analysis",
    emoji: "🔵",
  },
  {
    id: "llama-3-1-70b",
    label: "Llama 3.1 70B",
    provider: "meta",
    speedRating: 3,
    costRating: 2,
    contextWindow: "128K",
    bestFor: "Open source and no data sharing",
    emoji: "🦙",
  },
  {
    id: "ollama-local",
    label: "Ollama (Local)",
    provider: "local",
    speedRating: 2,
    costRating: 1,
    contextWindow: "Varies",
    bestFor: "Private, offline, zero cost",
    emoji: "💻",
  },
];

export const MODEL_OPTIONS = MODELS.map((model) => ({
  value: model.id,
  label: model.label,
}));

export function getModelConfig(modelId: ModelId) {
  return MODELS.find((model) => model.id === modelId);
}
