// Phase 5 - Intelligence Layer
// Service: Proactive Communication
// Implements: AI Assistant Interaction Specification V2
// Handles when supervisors should initiate unprompted communication

import { SUPERVISOR_PROMPTS } from "../config/supervisorPrompts";
import type { SupervisorName } from "../stores/assistantStore";

// Proactive communication types
export type ProactiveTrigger =
  | "skill_detected"
  | "post_performed_well"
  | "post_performed_poorly"
  | "idle_48h"
  | "job_match_high"
  | "course_progress_slow"
  | "certificate_ready"
  | "contract_at_risk"
  | "opportunity_detected"
  | "health_signal_change"
  | "weekly_brief";

// Threshold configuration for proactive triggers
export interface TriggerThresholds {
  skillDetectionConfidence: number;
  postPerformanceMultiplier: number;
  idleHoursThreshold: number;
  jobMatchThreshold: number;
  courseProgressDropPercent: number;
}

// Default thresholds
export const DEFAULT_THRESHOLDS: TriggerThresholds = {
  skillDetectionConfidence: 0.75,
  postPerformanceMultiplier: 2.0,
  idleHoursThreshold: 48,
  jobMatchThreshold: 85,
  courseProgressDropPercent: 30
};

// Per-supervisor trigger configurations
export const SUPERVISOR_TRIGGERS: Record<SupervisorName, ProactiveTrigger[]> = {
  OMEGA: [
    "opportunity_detected",
    "health_signal_change",
    "weekly_brief"
  ],
  ARIA: [
    "idle_48h",
    "health_signal_change",
    "weekly_brief"
  ],
  NOVA: [
    "skill_detected",
    "post_performed_well",
    "post_performed_poorly",
    "idle_48h",
    "opportunity_detected",
    "weekly_brief"
  ],
  SAGE: [
    "course_progress_slow",
    "certificate_ready",
    "idle_48h",
    "weekly_brief"
  ],
  ATLAS: [
    "opportunity_detected",
    "health_signal_change",
    "weekly_brief"
  ],
  FORGE: [
    "health_signal_change",
    "idle_48h",
    "weekly_brief"
  ],
  CIRCUIT: [
    "job_match_high",
    "contract_at_risk",
    "idle_48h",
    "weekly_brief"
  ],
  NEXUS: [
    "health_signal_change",
    "idle_48h"
  ],
  HERALD: [
    "health_signal_change",
    "opportunity_detected",
    "weekly_brief"
  ]
};

// Generate proactive message content
export function generateProactiveMessage(
  supervisor: SupervisorName,
  trigger: ProactiveTrigger,
  context: Record<string, unknown>
): string {
  const config = SUPERVISOR_PROMPTS[supervisor];
  
  switch (trigger) {
    case "skill_detected": {
      const skills = context.skills as string[] || [];
      const topSkill = skills[0] || "your skill";
      return `${config.name}: Skill detected in your recent post. ${topSkill} identified with ${Math.round((context.confidence as number || 0) * 100)}% confidence. This skill unlocks ${context.opportunityCount || 0} opportunities.`;
    }
    
    case "post_performed_well": {
      const reach = context.reach as number || 0;
      const multiplier = context.multiplier as number || 0;
      return `${config.name}: Your post reached ${reach} people — ${multiplier.toFixed(1)}x your average. The ${context.driver || "content"} in ${context.paragraph || "paragraph 3"} was the amplification driver. This is replicable.`;
    }
    
    case "post_performed_poorly": {
      const reach = context.reach as number || 0;
      const avgReach = context.avgReach as number || 0;
      return `${config.name}: Your recent post reached ${reach} people — below your average of ${avgReach}. Consider ${context.suggestion || "adding a specific code example or data point to increase engagement"}.`;
    }
    
    case "idle_48h": {
      const lastAction = context.lastAction as string || "post";
      const hours = context.hours as number || 48;
      return `${config.name}: You have been away for ${hours} hours. Your last ${lastAction} was ${context.ago || "yesterday"}. The community is active — ${context.opportunity || "there are opportunities waiting"}.`;
    }
    
    case "job_match_high": {
      const match = context.match as number || 0;
      const jobTitle = context.jobTitle as string || "position";
      const budget = context.budget as string || "";
      return `${config.name}: ${jobTitle} posted with ${match}% match to your skills. ${budget} budget. ${context.applicantCount || 0} applicants already. I can draft a proposal in 2 minutes.`;
    }
    
    case "course_progress_slow": {
      const courseName = context.courseName as string || "course";
      const progress = context.progress as number || 0;
      const prevPace = context.previousPace as string || "before";
      return `${config.name}: Your ${courseName} progress slowed to ${progress}%. ${context.reason || "Consider"} adjusting your session schedule. At ${prevPace} pace, ${context.timeRemaining || "you could complete in weeks"}.`;
    }
    
    case "certificate_ready": {
      const courseName = context.courseName as string || "course";
      return `${config.name}: Congratulations! Your ${courseName} certificate is ready. This unlocks ${context.unlockedCount || 0} Work opportunities averaging ${context.avgRate || "$0"}/hour.`;
    }
    
    case "contract_at_risk": {
      const clientName = context.clientName as string || "client";
      const risk = context.riskLevel as string || "elevated";
      return `${config.name}: Your contract with ${clientName} has ${risk} status. ${context.reason || "Immediate action recommended"}. ${context.action || "I can help you address this"}.`;
    }
    
    case "opportunity_detected": {
      const opportunityType = context.type as string || "opportunity";
      const details = context.details as string || "";
      return `${config.name}: ${opportunityType} detected. ${details} ${context.action ? `Action: ${context.action}` : ""}`;
    }
    
    case "health_signal_change": {
      const signal = context.signal as string || "metric";
      const change = context.change as string || "changed";
      const implication = context.implication as string || "";
      return `${config.name}: Platform ${signal} ${change}. ${implication}`;
    }
    
    case "weekly_brief": {
      return `${config.name}: Your weekly intelligence brief is ready. ${context.highlight || "Key insight"}: ${context.insight || "See your full report"}.`;
    }
    
    default:
      return `${config.name}: I have an update for you.`;
  }
}

// Check if a proactive message should be sent
export function shouldSendProactive(
  supervisor: SupervisorName,
  trigger: ProactiveTrigger,
  thresholds: TriggerThresholds = DEFAULT_THRESHOLDS,
  context: Record<string, unknown>
): boolean {
  // Check if supervisor is configured for this trigger
  const configuredTriggers = SUPERVISOR_TRIGGERS[supervisor];
  if (!configuredTriggers.includes(trigger)) {
    return false;
  }
  
  switch (trigger) {
    case "skill_detected":
      return (context.confidence as number || 0) >= thresholds.skillDetectionConfidence;
    
    case "post_performed_well":
      return (context.multiplier as number || 0) >= thresholds.postPerformanceMultiplier;
    
    case "post_performed_poorly":
      return (context.multiplier as number || 1) < 0.5;
    
    case "idle_48h":
      return (context.hours as number || 0) >= thresholds.idleHoursThreshold;
    
    case "job_match_high":
      return (context.match as number || 0) >= thresholds.jobMatchThreshold;
    
    case "course_progress_slow":
      return (context.progressDrop as number || 0) >= thresholds.courseProgressDropPercent;
    
    case "certificate_ready":
      return true; // Always notify when certificate is ready
    
    case "contract_at_risk":
      return true; // Always notify for contract risk
    
    case "opportunity_detected":
      return (context.confidence as number || 0) >= 0.7;
    
    case "health_signal_change":
      return Math.abs(context.changeMagnitude as number || 0) > 0.15;
    
    case "weekly_brief":
      return true; // Scheduled, always send
    
    default:
      return false;
  }
}

// Format notification for display
export interface ProactiveNotification {
  id: string;
  supervisor: SupervisorName;
  trigger: ProactiveTrigger;
  title: string;
  message: string;
  timestamp: Date;
  actionUrl?: string;
  actionLabel?: string;
  priority: "high" | "medium" | "low";
  read: boolean;
}

export function formatProactiveNotification(
  supervisor: SupervisorName,
  trigger: ProactiveTrigger,
  context: Record<string, unknown>
): ProactiveNotification {
  const config = SUPERVISOR_PROMPTS[supervisor];
  const message = generateProactiveMessage(supervisor, trigger, context);
  
  // Determine priority based on trigger
  let priority: "high" | "medium" | "low" = "medium";
  if (["job_match_high", "certificate_ready", "contract_at_risk"].includes(trigger)) {
    priority = "high";
  } else if (["idle_48h", "weekly_brief"].includes(trigger)) {
    priority = "low";
  }
  
  // Extract title from message
  const title = message.split(":")[1]?.split(".")[0] || message.slice(0, 50);
  
  return {
    id: crypto.randomUUID(),
    supervisor,
    trigger,
    title,
    message,
    timestamp: new Date(),
    actionUrl: context.actionUrl as string | undefined,
    actionLabel: context.actionLabel as string | undefined,
    priority,
    read: false
  };
}

// Rate limiting - max proactive messages per user per day
export const MAX_PROACTIVE_PER_DAY = 5;
export const MAX_PROACTIVE_PER_SUPERVISOR_PER_DAY = 2;

// Check rate limits
export function checkRateLimit(
  existingNotifications: ProactiveNotification[],
  supervisor: SupervisorName
): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const todayNotifications = existingNotifications.filter(
    n => n.timestamp >= today
  );
  
  // Check total limit
  if (todayNotifications.length >= MAX_PROACTIVE_PER_DAY) {
    return false;
  }
  
  // Check per-supervisor limit
  const supervisorToday = todayNotifications.filter(
    n => n.supervisor === supervisor
  );
  if (supervisorToday.length >= MAX_PROACTIVE_PER_SUPERVISOR_PER_DAY) {
    return false;
  }
  
  return true;
}
