// Server/services/appRegistry.ts
// ─── Core Infrastructure: App Registry System ────────────────────────────────
// Central registry for all platform modules. Each phase/layer registers itself.
// Enables: service discovery, health aggregation, feature flags, phase gating.
// Roadmap requirement: "App registry system (register new platforms)" (Block 1, Item 2)

export type AppStatus = "live" | "in_progress" | "planned" | "deprecated";
export type AppPhase = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface AppRegistration {
  id: string; // Unique identifier, e.g. "community"
  name: string; // Display name, e.g. "Winners Community"
  phase: AppPhase; // Roadmap phase number
  status: AppStatus; // Current deployment status
  version: string; // Current version, e.g. "1.0.0"
  description: string; // Short description
  apiPrefix: string; // API route prefix, e.g. "/api/v1/posts"
  frontendPath: string; // Frontend route, e.g. "/community"
  dependencies: string[]; // IDs of required apps
  features: string[]; // Feature flags for this app
  registeredAt: Date;
  updatedAt: Date;
  meta: Record<string, unknown>;
}

// ─── Registry Store ───────────────────────────────────────────────────────────

const registry = new Map<string, AppRegistration>();

// ─── Registry API ─────────────────────────────────────────────────────────────

export const AppRegistry = {
  /**
   * Register a platform module with the ecosystem.
   * Called at server startup for each phase layer.
   */
  register(app: Omit<AppRegistration, "registeredAt" | "updatedAt">): AppRegistration {
    const record: AppRegistration = {
      ...app,
      registeredAt: new Date(),
      updatedAt: new Date(),
    };
    registry.set(app.id, record);
    console.log(`[AppRegistry] Registered: ${app.name} (${app.status}) — Phase ${app.phase}`);
    return record;
  },

  /**
   * Update an existing registration (e.g. status change on deployment).
   */
  update(id: string, updates: Partial<Omit<AppRegistration, "id" | "registeredAt">>): AppRegistration | null {
    const existing = registry.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    registry.set(id, updated);
    return updated;
  },

  /**
   * Retrieve a single registered app by ID.
   */
  get(id: string): AppRegistration | undefined {
    return registry.get(id);
  },

  /**
   * List all registered apps, optionally filtered by status or phase.
   */
  list(filters?: { status?: AppStatus; phase?: AppPhase }): AppRegistration[] {
    const all = Array.from(registry.values());
    if (!filters) return all;
    return all.filter((app) => {
      if (filters.status && app.status !== filters.status) return false;
      if (filters.phase && app.phase !== filters.phase) return false;
      return true;
    });
  },

  /**
   * Check if a feature flag is enabled for a given app.
   */
  hasFeature(appId: string, feature: string): boolean {
    return registry.get(appId)?.features.includes(feature) ?? false;
  },

  /**
   * Validate that all dependencies of an app are "live".
   * Used to gate Phase 3 behind Phase 1+2 completion.
   */
  checkDependencies(appId: string): { ready: boolean; missing: string[] } {
    const app = registry.get(appId);
    if (!app) return { ready: false, missing: [appId] };

    const missing = app.dependencies.filter((depId) => {
      const dep = registry.get(depId);
      return !dep || dep.status !== "live";
    });

    return { ready: missing.length === 0, missing };
  },

  /**
   * Full ecosystem summary for the API version endpoint and admin dashboard.
   */
  summary() {
    const all = Array.from(registry.values());
    const live = all.filter((a) => a.status === "live").length;
    const total = all.length;

    return {
      totalApps: total,
      liveApps: live,
      progress: total > 0 ? Math.round((live / total) * 100) : 0,
      apps: all.sort((a, b) => a.phase - b.phase),
      generatedAt: new Date().toISOString(),
    };
  },
};

// ─── Platform Registrations ───────────────────────────────────────────────────
// These run at module import time — each phase self-registers.

AppRegistry.register({
  id: "core",
  name: "Core Engine",
  phase: 1,
  status: "live",
  version: "1.0.0",
  description: "Multi-tenant auth, billing, analytics, and API gateway",
  apiPrefix: "/api/v1",
  frontendPath: "/dashboard",
  dependencies: [],
  features: [
    "jwt-auth",
    "google-oauth",
    "rbac",
    "2fa",
    "stripe-billing",
    "analytics-engine",
    "export",
    "referral-system",
    "admin-dashboard",
    "email-reports",
  ],
  meta: { completionTarget: "Before Phase 3", infraPending: 8 },
});

AppRegistry.register({
  id: "community",
  name: "Winners Community",
  phase: 2,
  status: "live",
  version: "1.0.0",
  description: "Social platform — posts, comments, likes, follows",
  apiPrefix: "/api/v1/posts",
  frontendPath: "/community",
  dependencies: ["core"],
  features: ["feed", "posts", "comments", "likes", "follows", "tags"],
  meta: {
    v1_1_planned: ["socket.io", "real-time-notifications", "online-presence"],
    v1_2_planned: ["groups"],
    v1_3_planned: ["direct-messaging"],
  },
});

AppRegistry.register({
  id: "academy",
  name: "Winners Academy",
  phase: 3,
  status: "live",
  version: "1.0.0",
  description: "Learning platform — courses, certifications, AI tutors",
  apiPrefix: "/api/v1/academy",
  frontendPath: "/academy",
  dependencies: ["core", "community"],
  features: ["courses", "modules", "lessons", "quizzes", "flashcards", "certificates", "mentors", "live-sessions", "lecture-uploads", "learning-paths"],
  meta: {},
});

AppRegistry.register({
  id: "market",
  name: "Winners Market",
  phase: 4,
  status: "in_progress",
  version: "1.0.0",
  description: "Marketplace — digital products, dropshipping, vendor dashboards",
  apiPrefix: "/api/v1/market",
  frontendPath: "/market",
  dependencies: ["core", "community", "academy"],
  features: ["vendors", "products", "cart", "orders", "dropshipping"],
  meta: {},
});

AppRegistry.register({
  id: "intelligence",
  name: "Winners Intelligence",
  phase: 5,
  status: "in_progress",
  version: "1.0.0",
  description: "AI orchestration — agents, recommendations, automation",
  apiPrefix: "/api/v1/ai",
  frontendPath: "/intelligence",
  dependencies: ["core"],
  features: ["claude-sdk", "omega-supervisor", "agentic-loops", "nova-community-intelligence", "ai-credits", "proactive-messages"],
  meta: {},
});

AppRegistry.register({
  id: "work",
  name: "Winners Work",
  phase: 6,
  status: "in_progress",
  version: "1.0.0",
  description: "Freelance hub — job board, AI skill matching, contracts, escrow",
  apiPrefix: "/api/v1/work",
  frontendPath: "/work",
  dependencies: ["core", "community", "academy"],
  features: ["job-listings", "freelancer-profiles", "contracts", "escrow", "job-applications"],
  meta: {},
});

AppRegistry.register({
  id: "mobile",
  name: "Winners Mobile",
  phase: 7,
  status: "planned",
  version: "0.0.0",
  description: "React Native mobile application",
  apiPrefix: "/api/v1",
  frontendPath: "native://",
  dependencies: ["core", "community"],
  features: [],
  meta: { principle: "Mobile last — web must be solid first" },
});

AppRegistry.register({
  id: "cloud",
  name: "Winners Cloud",
  phase: 8,
  status: "planned",
  version: "0.5.0",
  description: "Developer platform — public API, SDK, plugin marketplace",
  apiPrefix: "/api/v1/developer",
  frontendPath: "/cloud",
  dependencies: ["core", "community", "academy", "market", "work"],
  features: ["api-keys", "agents", "automations", "connectors", "webhooks"],
  meta: {},
});

export default AppRegistry;
