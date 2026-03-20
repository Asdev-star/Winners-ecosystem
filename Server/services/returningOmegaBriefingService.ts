import db from "../db.js";
import { ACTIONS } from "./activityService.js";

export interface AuthRoutingUserSnapshot {
  id: string;
  tenantId: string;
  name: string;
  metadata?: unknown;
  onboardingDone?: boolean | null;
  profileType?: string | null;
  firstPlatform?: string | null;
  omegaMission?: string | null;
  primarySkills?: string[] | null;
  skills?: string[] | null;
}

export interface ReturningOmegaBriefing {
  pathPrefix: string;
  supervisor: string;
  layer: string;
  title: string;
  message: string;
  selectedPlan: string;
  profileType?: string;
  entryPath?: string;
  briefingFocus?: string[];
  firstAction?: string;
  dismissAfterMs?: number;
}

interface OnboardingRoutingState {
  onboardingCompleted: boolean;
  onboardingPrimaryLayer: string | null;
  onboardingPrimaryPath: string | null;
  onboardingProfileType: string | null;
  onboardingAssignedSupervisor: string | null;
  onboardingSelectedPlan: string | null;
}

function metadataObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function normalizeString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeStringArray(value: unknown, limit = 5): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, limit);
}

function layerToPath(layer: string | null): string | null {
  switch ((layer ?? "").toLowerCase()) {
    case "community":
      return "/community";
    case "academy":
      return "/academy";
    case "market":
      return "/market";
    case "work":
      return "/work";
    case "cloud":
      return "/cloud";
    case "intelligence":
      return "/intelligence";
    default:
      return null;
  }
}

function profileTypeDisplay(profileType: string | null | undefined): string | null {
  switch ((profileType ?? "").toLowerCase().trim()) {
    case "the creator":
    case "creator":
      return "The Creator";
    case "the freelancer":
    case "freelancer":
      return "The Freelancer";
    case "the entrepreneur":
    case "entrepreneur":
      return "The Entrepreneur";
    case "the learner":
    case "learner":
      return "The Learner";
    case "the vendor":
    case "vendor":
    case "vendor_seller":
    case "vendor/seller":
      return "The Vendor";
    case "the developer":
    case "developer":
      return "The Developer";
    case "the marketer":
    case "marketer":
      return "The Marketer";
    case "the explorer":
    case "explorer":
      return "The Explorer";
    default:
      return null;
  }
}

function profileTypeToEntryPath(profileType: string | null): string | null {
  switch ((profileType ?? "").toLowerCase()) {
    case "the creator":
    case "creator":
      return "/community/feed";
    case "the freelancer":
    case "freelancer":
      return "/work/jobs";
    case "the entrepreneur":
    case "entrepreneur":
      return "/market/vendor";
    case "the learner":
    case "learner":
      return "/academy";
    case "the vendor":
    case "vendor":
    case "vendor_seller":
    case "vendor/seller":
      return "/market/vendor";
    case "the developer":
    case "developer":
      return "/cloud";
    case "the marketer":
    case "marketer":
      return "/market/marketing";
    case "the explorer":
    case "explorer":
      return "/dashboard";
    default:
      return null;
  }
}

function firstPlatformToEntryPath(platform: string | null): string | null {
  switch ((platform ?? "").toLowerCase()) {
    case "community":
      return "/community/feed";
    case "academy":
      return "/academy";
    case "market":
      return "/market/vendor";
    case "work":
      return "/work/jobs";
    case "cloud":
      return "/cloud";
    case "intelligence":
      return "/intelligence";
    default:
      return null;
  }
}

function supervisorForLayer(layer: string | null): string {
  switch ((layer ?? "").toLowerCase()) {
    case "community":
      return "NOVA";
    case "academy":
      return "SAGE";
    case "market":
      return "ATLAS";
    case "work":
      return "CIRCUIT";
    case "cloud":
      return "NEXUS";
    case "intelligence":
      return "FORGE";
    default:
      return "OMEGA";
  }
}

function firstName(name: string) {
  const value = name.trim();
  return value.split(/\s+/)[0] ?? value;
}

function pluralize(count: number, one: string, many: string) {
  return count === 1 ? one : many;
}

function formatRelativeVisit(date: Date | null) {
  if (!date) return "a little while ago";
  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
  if (diffHours < 24) return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays <= 1) return "1 day ago";
  if (diffDays < 30) return `${diffDays} days ago`;
  const diffMonths = Math.round(diffDays / 30);
  return diffMonths <= 1 ? "1 month ago" : `${diffMonths} months ago`;
}

function uniqueStrings(values: Array<string | null | undefined>, limit = 5): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    if (!value) continue;
    const normalized = value.trim();
    if (!normalized || seen.has(normalized.toLowerCase())) continue;
    seen.add(normalized.toLowerCase());
    result.push(normalized);
    if (result.length >= limit) break;
  }
  return result;
}

function fallbackFirstAction(layer: string | null, mission: string | null) {
  switch ((layer ?? "").toLowerCase()) {
    case "community":
      return "Write one post so NOVA can refresh your skill graph.";
    case "academy":
      return "Resume your current course and finish the next lesson.";
    case "market":
      return "Open Market -> Vendor Dashboard and review today's best opportunity.";
    case "work":
      return "Open Work -> Jobs and move on the strongest match.";
    case "cloud":
      return "Open Cloud and make one live API call.";
    case "intelligence":
      return "Open Intelligence and review OMEGA's next recommendation.";
    default:
      return mission ? `Continue building ${mission}.` : "Step back into your main platform and take the next best action.";
  }
}

export function extractOnboardingState(user: AuthRoutingUserSnapshot): OnboardingRoutingState {
  const root = metadataObject(user.metadata);
  const onboarding = metadataObject(root.onboarding);
  const omegaRouting = metadataObject(root.omegaRouting);
  const onboardingCompleted = user.onboardingDone === true || onboarding.completed === true;
  const onboardingPrimaryLayer =
    normalizeString(omegaRouting.primaryLayer) ??
    normalizeString(onboarding.primaryLayer) ??
    normalizeString(user.firstPlatform);
  const onboardingAssignedSupervisor =
    normalizeString(omegaRouting.supervisor) ??
    normalizeString(onboarding.assignedSupervisor) ??
    (onboardingCompleted ? supervisorForLayer(onboardingPrimaryLayer) : null);
  const onboardingSelectedPlan =
    normalizeString(omegaRouting.selectedPlan) ??
    normalizeString(onboarding.selectedPlan) ??
    (onboardingCompleted ? "free" : null);
  const onboardingProfileType =
    normalizeString(omegaRouting.profileType) ??
    normalizeString(onboarding.profileType) ??
    profileTypeDisplay(user.profileType);
  const onboardingPrimaryPath =
    profileTypeToEntryPath(onboardingProfileType) ??
    firstPlatformToEntryPath(user.firstPlatform ?? onboardingPrimaryLayer) ??
    layerToPath(onboardingPrimaryLayer);

  return {
    onboardingCompleted,
    onboardingPrimaryLayer,
    onboardingPrimaryPath,
    onboardingProfileType,
    onboardingAssignedSupervisor,
    onboardingSelectedPlan,
  };
}

export async function buildReturningOmegaBriefing(user: AuthRoutingUserSnapshot): Promise<ReturningOmegaBriefing | null> {
  const state = extractOnboardingState(user);
  if (!state.onboardingCompleted || !state.onboardingPrimaryPath) return null;

  const profileType = state.onboardingProfileType ?? "The Explorer";
  const profileSlug = (profileTypeDisplay(user.profileType) ?? profileType).replace(/^The\s+/i, "").toLowerCase();
  const skillPool = uniqueStrings([...(user.skills ?? []), ...(user.primarySkills ?? [])], 4);
  const newestSkill = skillPool[0] ?? "core";
  const windowStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [lastLogin, activeEnrollment, recentSkillSignals, recentPosts, unreadInsights, activeApiKeys, vendor, jobMatches] = await Promise.all([
    db.activityLog.findFirst({
      where: {
        tenantId: user.tenantId,
        userId: user.id,
        category: "auth",
        action: { in: [ACTIONS.LOGIN, ACTIONS.GOOGLE_LOGIN, "Login via Facebook"] },
      },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    db.enrollment.findFirst({
      where: { tenantId: user.tenantId, userId: user.id, status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      select: { id: true, courseId: true, course: { select: { title: true } } },
    }),
    db.novaSkillDetection.count({
      where: { tenantId: user.tenantId, userId: user.id, createdAt: { gte: windowStart } },
    }),
    db.post.count({
      where: { tenantId: user.tenantId, authorId: user.id, deletedAt: null, createdAt: { gte: windowStart } },
    }),
    db.communityInsight.count({
      where: { tenantId: user.tenantId, userId: user.id, isRead: false },
    }),
    db.apiKey.count({
      where: { tenantId: user.tenantId, userId: user.id, revoked: false },
    }),
    db.vendor.findFirst({
      where: { tenantId: user.tenantId, userId: user.id },
      select: { id: true, storeName: true },
    }),
    skillPool.length
      ? db.jobListing.count({
          where: {
            tenantId: user.tenantId,
            status: "OPEN",
            createdAt: { gte: windowStart },
            skills: { hasSome: skillPool.slice(0, 3) },
          },
        })
      : Promise.resolve(0),
  ]);

  const [courseCompletedLessons, courseLessonTotal, activeProducts] = await Promise.all([
    activeEnrollment
      ? db.lessonProgress.count({
          where: { tenantId: user.tenantId, enrollmentId: activeEnrollment.id, completed: true },
        })
      : Promise.resolve(0),
    activeEnrollment
      ? db.lesson.count({
          where: { tenantId: user.tenantId, module: { courseId: activeEnrollment.courseId } },
        })
      : Promise.resolve(0),
    vendor
      ? db.product.count({
          where: { tenantId: user.tenantId, vendorId: vendor.id, isActive: true },
        })
      : Promise.resolve(0),
  ]);

  const courseProgressPercent =
    activeEnrollment && courseLessonTotal > 0
      ? Math.max(1, Math.min(100, Math.round((courseCompletedLessons / courseLessonTotal) * 100)))
      : null;

  const focusLines = uniqueStrings(
    [
      jobMatches > 0
        ? `CIRCUIT found ${jobMatches} new ${pluralize(jobMatches, "match", "matches")} for your ${newestSkill} skills overnight.`
        : null,
      courseProgressPercent !== null && activeEnrollment?.course?.title
        ? `SAGE says you're ${courseProgressPercent}% through ${activeEnrollment.course.title}.`
        : null,
      activeProducts > 0
        ? `ATLAS sees ${activeProducts} active ${pluralize(activeProducts, "product", "products")} in ${vendor?.storeName ?? "your catalog"}.`
        : null,
      activeApiKeys > 0
        ? `NEXUS kept ${activeApiKeys} active ${pluralize(activeApiKeys, "API key", "API keys")} ready for your next build.`
        : null,
      recentSkillSignals > 0
        ? `NOVA detected ${recentSkillSignals} fresh ${pluralize(recentSkillSignals, "skill signal", "skill signals")} from your recent activity.`
        : null,
      unreadInsights > 0
        ? `OMEGA queued ${unreadInsights} unread ${pluralize(unreadInsights, "insight", "insights")} while you were away.`
        : null,
      recentPosts > 0
        ? `Your last 7 days included ${recentPosts} ${pluralize(recentPosts, "post", "posts")} across Community.`
        : null,
    ],
    3,
  );

  const firstAction =
    (jobMatches > 0 && "Open Work -> Jobs and apply to the strongest CIRCUIT match.") ||
    (courseProgressPercent !== null && courseProgressPercent < 100 && activeEnrollment?.course?.title
      ? `Resume ${activeEnrollment.course.title} and finish the next lesson.`
      : null) ||
    (activeProducts === 0 && ["entrepreneur", "vendor", "marketer"].includes(profileSlug)
      ? "Open Market -> Vendor Dashboard and list your next revenue offer."
      : null) ||
    (activeApiKeys === 0 && profileSlug === "developer"
      ? "Open Cloud and create your first API key."
      : null) ||
    (recentPosts === 0 && profileSlug === "creator"
      ? "Write one post so NOVA can refresh your skill graph."
      : null) ||
    fallbackFirstAction(state.onboardingPrimaryLayer, normalizeString(user.omegaMission));

  const summary =
    focusLines[0] ??
    `OMEGA kept your ${profileType.replace(/^The\s+/i, "").toLowerCase()} route warm while you were away.`;

  return {
    pathPrefix: state.onboardingPrimaryPath,
    supervisor: state.onboardingAssignedSupervisor ?? supervisorForLayer(state.onboardingPrimaryLayer),
    layer: state.onboardingPrimaryLayer ?? "community",
    title: `Welcome back, ${firstName(user.name)}.`,
    message: `You last visited ${formatRelativeVisit(lastLogin?.createdAt ?? null)}. ${summary}`,
    selectedPlan: state.onboardingSelectedPlan ?? "free",
    profileType,
    entryPath: state.onboardingPrimaryPath,
    briefingFocus: focusLines,
    firstAction,
    dismissAfterMs: 18000,
  };
}
