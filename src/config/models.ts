// src/config/models.ts
2→
3→export type ModelId =
4→  | "claude-3-7-sonnet"
5→  | "claude-3-5-haiku"
6→  | "gpt-4o"
7→  | "gpt-4o-mini"
8→  | "gemini-2-0-flash"
9→  | "gemini-1-5-pro"
10→  | "llama-3-1-70b"
11→  | "ollama-local";
12→
13→export interface ModelConfig {
14→  id: ModelId;
15→  label: string;
16→  provider: "anthropic" | "openai" | "google" | "meta" | "local";
17→  speedRating: 1 | 2 | 3 | 4 | 5;
18→  costRating: 1 | 2 | 3 | 4 | 5;
19→  contextWindow: string;
20→  bestFor: string;
21→  badge?: string;
22→  emoji: string;
23→}
24→
25→export const MODELS: ModelConfig[] = [
26→  {
27→    id: "claude-3-7-sonnet",
28→    label: "Claude 3.7 Sonnet",
29→    provider: "anthropic",
30→    speedRating: 3,
31→    costRating: 3,
32→    contextWindow: "200K",
33→    bestFor: "Complex reasoning & writing",
34→    badge: "Recommended",
35→    emoji: "🟣",
36→  },
37→  {
38→    id: "claude-3-5-haiku",
39→    label: "Claude 3.5 Haiku",
40→    provider: "anthropic",
41→    speedRating: 5,
42→    costRating: 2,
43→    contextWindow: "200K",
44→    bestFor: "Fast responses · low cost",
45→    emoji: "🟣",
46→  },
47→  {
48→    id: "gpt-4o",
49→    label: "GPT-4o",
50→    provider: "openai",
51→    speedRating: 4,
52→    costRating: 3,
53→    contextWindow: "128K",
54→    bestFor: "Multimodal · vision",
55→    emoji: "🟢",
56→  },
57→  {
58→    id: "gpt-4o-mini",
59→    label: "GPT-4o Mini",
60→    provider: "openai",
61→    speedRating: 5,
62→    costRating: 1,
63→    contextWindow: "128K",
64→    bestFor: "High volume · budget",
65→    emoji: "🟢",
66→  },
67→  {
68→    id: "gemini-2-0-flash",
69→    label: "Gemini 2.0 Flash",
70→    provider: "google",
71→    speedRating: 5,
72→    costRating: 1,
73→    contextWindow: "1M",
74→    bestFor: "Long documents · ultra fast",
75→    badge: "1M context",
76→    emoji: "🔵",
77→  },
78→  {
79→    id: "gemini-1-5-pro",
80→    label: "Gemini 1.5 Pro",
81→    provider: "google",
82→    speedRating: 3,
83→    costRating: 2,
84→    contextWindow: "2M",
85→    bestFor: "Full codebase · deep analysis",
86→    emoji: "🔵",
87→  },
88→  {
89→    id: "llama-3-1-70b",
90→    label: "Llama 3.1 70B",
91→    provider: "meta",
92→    speedRating: 3,
93→    costRating: 2,
94→    contextWindow: "128K",
95→    bestFor: "Open source · no data sharing",
96→    emoji: "🦙",
97→  },
98→  {
99→    id: "ollama-local",
100→    label: "Ollama (Local)",
101→    provider: "local",
102→    speedRating: 2,
103→    costRating: 1,
104→    contextWindow: "Varies",
105→    bestFor: "Private · offline · zero cost",
111→    emoji: "💻",
112→  },
113→];
