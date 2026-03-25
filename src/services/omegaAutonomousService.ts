// Level VII - Predictive & Autonomous OMEGA
// Service: omegaAutonomousService
// Manages pre-approved autonomous actions that OMEGA executes on behalf of the user.
// Actions are queued, approved once, then executed silently. Results surface in the
// morning briefing and in the AutoActionCard on the OMEGA Dashboard.

import { getAuthHeaders } from "../features/auth/authStore";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActionCategory =
  | "post_content"
  | "apply_to_job"
  | "send_connection_request"
  | "enroll_in_course"
  | "list_product"
  | "update_pricing"
  | "schedule_session";

export type ActionStatus =
  | "pending_approval"
  | "approved"
  | "executing"
  | "completed"
  | "failed"
  | "skipped";

export interface AutonomousAction {
  id: string;
  category: ActionCategory;
  title: string;
  description: string;
  layer: string;
  estimatedImpact: string;
  confidence: number;
  payload: Record<string, unknown>;
  status: ActionStatus;
  scheduledFor?: string;
  executedAt?: string;
  result?: string;
  createdAt: string;
}

export interface MorningBriefing {
  date: string;
  generatedAt: string;
  executedActions: AutonomousAction[];
  pendingActions: AutonomousAction[];
  insights: string[];
  loopProgress: {
    stage: string;
    progress: number;
    nextMilestone: string;
  };
  revenueActivity: {
    earned: number;
    pending: number;
    opportunities: number;
  };
  omegaMessage: string;
}

export interface ApprovalPreferences {
  autoApproveCategories: ActionCategory[];
  requireApprovalCategories: ActionCategory[];
  maxDailyActions: number;
  quietHoursStart: string;
  quietHoursEnd: string;
  enabled: boolean;
}

// ─── Default approval preferences ────────────────────────────────────────────

export const DEFAULT_PREFERENCES: ApprovalPreferences = {
  autoApproveCategories: ["enroll_in_course", "update_pricing"],
  requireApprovalCategories: [
    "post_content",
    "apply_to_job",
    "send_connection_request",
    "list_product",
    "schedule_session",
  ],
  maxDailyActions: 5,
  quietHoursStart: "22:00",
  quietHoursEnd: "07:00",
  enabled: false,
};

// ─── API calls ────────────────────────────────────────────────────────────────

export async function fetchPendingActions(): Promise<AutonomousAction[]> {
  const headers = getAuthHeaders();
  if (!headers.Authorization) return getMockPendingActions();

  try {
    const res = await fetch("/api/v1/omega/autonomous/pending", { headers });
    if (!res.ok) return getMockPendingActions();
    const data = await res.json();
    return data.actions ?? [];
  } catch {
    return getMockPendingActions();
  }
}

export async function approveAction(actionId: string): Promise<boolean> {
  const headers = getAuthHeaders();
  if (!headers.Authorization) return false;

  try {
    const res = await fetch(`/api/v1/omega/autonomous/${actionId}/approve`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function declineAction(actionId: string): Promise<boolean> {
  const headers = getAuthHeaders();
  if (!headers.Authorization) return false;

  try {
    const res = await fetch(`/api/v1/omega/autonomous/${actionId}/decline`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function approveAll(actionIds: string[]): Promise<boolean> {
  const headers = getAuthHeaders();
  if (!headers.Authorization) return false;

  try {
    const res = await fetch("/api/v1/omega/autonomous/approve-all", {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ actionIds }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchMorningBriefing(): Promise<MorningBriefing | null> {
  const headers = getAuthHeaders();
  if (!headers.Authorization) return getMockMorningBriefing();

  try {
    const res = await fetch("/api/v1/omega/briefing/morning", { headers });
    if (!res.ok) return getMockMorningBriefing();
    return await res.json();
  } catch {
    return getMockMorningBriefing();
  }
}

export async function fetchApprovalPreferences(): Promise<ApprovalPreferences> {
  const headers = getAuthHeaders();
  if (!headers.Authorization) return DEFAULT_PREFERENCES;

  try {
    const res = await fetch("/api/v1/omega/autonomous/preferences", { headers });
    if (!res.ok) return DEFAULT_PREFERENCES;
    return await res.json();
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export async function saveApprovalPreferences(
  prefs: ApprovalPreferences
): Promise<boolean> {
  const headers = getAuthHeaders();
  if (!headers.Authorization) return false;

  try {
    const res = await fetch("/api/v1/omega/autonomous/preferences", {
      method: "PUT",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Mock data (fallback when API is unavailable) ─────────────────────────────

function getMockPendingActions(): AutonomousAction[] {
  const now = new Date();
  return [
    {
      id: "action_1",
      category: "apply_to_job",
      title: "Apply: Senior React Developer",
      description:
        "OMEGA found a 94% match contract at TechBridge Africa. Budget $4,200. 2 applicants so far.",
      layer: "Work",
      estimatedImpact: "+$4,200 contract revenue",
      confidence: 94,
      payload: { jobId: "job_123", coverLetter: "auto-generated" },
      status: "pending_approval",
      scheduledFor: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
    },
    {
      id: "action_2",
      category: "post_content",
      title: "Post: Your React expertise thread",
      description:
        "NOVA drafted a 5-post thread on React performance based on your Academy progress. Peak engagement window: 9–11am.",
      layer: "Community",
      estimatedImpact: "+340 estimated reach",
      confidence: 87,
      payload: { content: "auto-drafted", platform: "winners-community" },
      status: "pending_approval",
      scheduledFor: new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(now.getTime() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: "action_3",
      category: "enroll_in_course",
      title: "Enroll: TypeScript Advanced Patterns",
      description:
        "SAGE identified a skill gap blocking 3 high-value contracts. Course is 4 hours. Certificate unlocks Work tier 2.",
      layer: "Academy",
      estimatedImpact: "Unlocks 3 contract categories",
      confidence: 91,
      payload: { courseId: "ts-advanced-patterns", autoStart: true },
      status: "pending_approval",
      scheduledFor: now.toISOString(),
      createdAt: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
    },
  ];
}

function getMockMorningBriefing(): MorningBriefing {
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  return {
    date: now.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
    }),
    generatedAt: now.toISOString(),
    executedActions: [
      {
        id: "done_1",
        category: "enroll_in_course",
        title: "Enrolled: React Performance Mastery",
        description: "Auto-enrolled as pre-approved.",
        layer: "Academy",
        estimatedImpact: "Certificate in 4 hours",
        confidence: 91,
        payload: {},
        status: "completed",
        executedAt: yesterday.toISOString(),
        result: "Enrolled successfully. Course starts at next login.",
        createdAt: yesterday.toISOString(),
      },
    ],
    pendingActions: getMockPendingActions(),
    insights: [
      "Your Trust Score increased 4 points overnight — now 76.",
      "3 community members engaged with your last post while you slept.",
      "React Developer rates increased 8% this week. Your positioning is strong.",
    ],
    loopProgress: {
      stage: "academy",
      progress: 37,
      nextMilestone: "Complete React course to unlock Work layer matches",
    },
    revenueActivity: {
      earned: 0,
      pending: 4200,
      opportunities: 3,
    },
    omegaMessage:
      "While you slept, I enrolled you in the React course you pre-approved. Three contracts are watching your profile. Approve the job application to be first in line — the window closes in 4 hours.",
  };
}

// ─── Utility helpers ──────────────────────────────────────────────────────────

export function getCategoryLabel(category: ActionCategory): string {
  const labels: Record<ActionCategory, string> = {
    post_content: "Content Post",
    apply_to_job: "Job Application",
    send_connection_request: "Connection",
    enroll_in_course: "Course Enrolment",
    list_product: "Product Listing",
    update_pricing: "Pricing Update",
    schedule_session: "Session Schedule",
  };
  return labels[category] ?? category;
}

export function getCategoryIcon(category: ActionCategory): string {
  const icons: Record<ActionCategory, string> = {
    post_content: "✍️",
    apply_to_job: "💼",
    send_connection_request: "🤝",
    enroll_in_course: "🎓",
    list_product: "🛒",
    update_pricing: "💰",
    schedule_session: "📅",
  };
  return icons[category] ?? "⚡";
}

export function getLayerColor(layer: string): string {
  const colors: Record<string, string> = {
    Community: "var(--ice)",
    Academy: "var(--green)",
    Work: "var(--blue)",
    Market: "var(--gold)",
    Intelligence: "var(--purple)",
    Cloud: "var(--ice)",
  };
  return colors[layer] ?? "var(--text-dim)";
}
