// Server/services/omegaSignalService.ts
// Phase 2 V2.0 — OMEGA Signal Processing Service
// Processes NOVA skill signals and fires cross-layer OMEGA events
// This service is the heartbeat of the Agentic Loop

import db from "../db.js";
import { NotificationType } from "@prisma/client";
import { notifyUser } from "./wsService.js";

// Skill keywords for detection (expandable)
const SKILL_KEYWORDS: Record<string, string[]> = {
  "Software Development": ["react", "node", "python", "typescript", "javascript", "java", "php", "ruby", "golang", "rust", "sql", "aws", "docker", "kubernetes"],
  "Digital Marketing": ["seo", "marketing", "social media", "ads", "facebook", "instagram", "google ads", "content marketing", "email marketing"],
  "Design": ["figma", "photoshop", "illustrator", "ui", "ux", "graphic design", "logo", "branding"],
  "Data Science": ["python", "machine learning", "ai", "data analysis", "pandas", "tensorflow", "statistics"],
  "Finance": ["accounting", "finance", "investment", "trading", "blockchain", "crypto"],
  "Writing": ["copywriting", "content writing", "blogging", "journalism", "technical writing"],
  "Video": ["video editing", "premiere", "after effects", "animation", "motion graphics"],
  "Music": ["music production", "beat making", "audio engineering", "sound design"]
};

interface SkillSignal {
  userId: string;
  tenantId: string;
  postId: string;
  skills: Array<{
    skillName: string;
    confidence: number;
    category: string;
  }>;
  topics: string[];
  engagement: number;
}

// Process a post and extract skill signals
export async function processPostSignal(postId: string): Promise<SkillSignal | null> {
  try {
    const post = await db.post.findUnique({
      where: { id: postId },
      include: { author: true }
    });

    if (!post || !post.content) {
      return null;
    }

    const contentLower = post.content.toLowerCase();
    const detectedSkills: SkillSignal["skills"] = [];
    const detectedTopics: string[] = [];

    // Simple keyword matching for skills
    for (const [category, keywords] of Object.entries(SKILL_KEYWORDS)) {
      for (const keyword of keywords) {
        if (contentLower.includes(keyword)) {
          detectedSkills.push({
            skillName: keyword,
            confidence: 0.8,
            category
          });
          detectedTopics.push(category);
        }
      }
    }

    // Get engagement metrics
    const [likeCount, commentCount] = await Promise.all([
      db.like.count({ where: { postId } }),
      db.comment.count({ where: { postId } })
    ]);

    const signal: SkillSignal = {
      userId: post.authorId,
      tenantId: post.tenantId,
      postId: post.id,
      skills: detectedSkills,
      topics: [...new Set(detectedTopics)],
      engagement: likeCount + (commentCount * 2)
    };

    // Store the signal
    await storeSkillSignal(signal);

    // Check for cross-layer recommendations
    await evaluateForRecommendations(signal);

    // Emit real-time signal to user's OMEGA channel
    await emitSkillSignal(signal);

    return signal;
  } catch (error) {
    console.error("[omegaSignalService] Error processing post signal:", error);
    return null;
  }
}

// Store skill signal in database
async function storeSkillSignal(signal: SkillSignal): Promise<void> {
  try {
    // Store as activity event for analytics
    await db.activityLog.create({
      data: {
        tenantId: signal.tenantId,
        userId: signal.userId,
        action: "NOVA_SKILL_DETECTED",
        category: "community",
        metadata: {
          skills: signal.skills,
          topics: signal.topics,
          engagement: signal.engagement,
          postId: signal.postId
        }
      }
    });
  } catch (error) {
    console.error("[omegaSignalService] Error storing skill signal:", error);
  }
}

// Evaluate if user should receive cross-layer recommendations
async function evaluateForRecommendations(signal: SkillSignal): Promise<void> {
  try {
    // Check user's Academy enrollment status
    const enrollments = await db.enrollment.findMany({
      where: { userId: signal.userId }
    });

    const enrolledCourses = enrollments.map(e => e.courseId);

    // Check for skill gaps (skills detected but no related courses)
    for (const skill of signal.skills) {
      // Find courses in the same category
      const relatedCourses = await db.course.findMany({
        where: {
          category: { contains: skill.category, mode: "insensitive" },
          published: true
        },
        select: { id: true, title: true, slug: true }
      });

      // If user has detected skill but no course in that category, recommend
      const hasEnrolled = relatedCourses.some(c => enrolledCourses.includes(c.id));
      
      if (relatedCourses.length > 0 && !hasEnrolled) {
        await createAcademyRecommendation(signal.userId, signal.tenantId, skill, relatedCourses[0]);
      }
    }

    // Check for Work matching (high engagement + skills = ready for contracts)
    if (signal.engagement > 10 && signal.skills.length > 0) {
      await createWorkRecommendation(signal);
    }
  } catch (error) {
    console.error("[omegaSignalService] Error evaluating recommendations:", error);
  }
}

// Create Academy recommendation notification
async function createAcademyRecommendation(
  userId: string,
  tenantId: string,
  skill: { skillName: string; category: string; confidence: number },
  course: { id: string; title: string; slug: string }
): Promise<void> {
  try {
    await db.notification.create({
      data: {
        tenantId,
        userId,
        type: NotificationType.OPPORTUNITY_MATCH,
        title: `Learn ${skill.skillName} with SAGE`,
        body: `NOVA detected ${skill.skillName} in your posts. SAGE recommends "${course.title}" to certify your skills.`,
        link: `/academy/courses/${course.slug}`
      }
    });

    // Emit real-time notification
    notifyUser(userId, {
      type: "OMEGA_RECOMMENDATION",
      title: `Learn ${skill.skillName} with SAGE`,
      message: `NOVA detected ${skill.skillName} in your posts.`,
      data: { courseSlug: course.slug }
    });
  } catch (error) {
    console.error("[omegaSignalService] Error creating academy recommendation:", error);
  }
}

// Create Work matching recommendation
async function createWorkRecommendation(signal: SkillSignal): Promise<void> {
  try {
    await db.notification.create({
      data: {
        tenantId: signal.tenantId,
        userId: signal.userId,
        type: NotificationType.OPPORTUNITY_MATCH,
        title: "Your skills are in demand!",
        body: `Your recent post got ${signal.engagement} engagement. CIRCUIT found matching contracts for your ${signal.skills[0].skillName} skills.`,
        link: "/work"
      }
    });

    // Emit real-time notification
    notifyUser(signal.userId, {
      type: "OMEGA_RECOMMENDATION",
      title: "Your skills are in demand!",
      message: `CIRCUIT found matching contracts for your skills.`,
      data: { skills: signal.skills.map(s => s.skillName) }
    });
  } catch (error) {
    console.error("[omegaSignalService] Error creating work recommendation:", error);
  }
}

// Emit skill signal via WebSocket
async function emitSkillSignal(signal: SkillSignal): Promise<void> {
  try {
    notifyUser(signal.userId, {
      event: "nova:signal",
      postId: signal.postId,
      skills: signal.skills,
      topics: signal.topics,
      engagement: signal.engagement,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("[omegaSignalService] Error emitting skill signal:", error);
  }
}

// Get user's skill history (from activity logs)
export async function getUserSkillHistory(userId: string): Promise<Array<{
  skillName: string;
  category: string;
  confidence: number;
  postCount: number;
  lastDetected: Date;
}>> {
  try {
    const logs = await db.activityLog.findMany({
      where: {
        userId,
        action: "NOVA_SKILL_DETECTED"
      },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    // Aggregate skills from activity logs
    const skillMap = new Map<string, {
      skillName: string;
      category: string;
      confidence: number;
      postCount: number;
      lastDetected: Date;
    }>();

    for (const log of logs) {
      try {
        const metadata = log.metadata as { skills?: Array<{ skillName: string; category: string; confidence: number }> } | null;
        if (metadata?.skills) {
          for (const skill of metadata.skills) {
            const existing = skillMap.get(skill.skillName);
            if (existing) {
              existing.postCount++;
              existing.confidence = (existing.confidence + skill.confidence) / 2;
              existing.lastDetected = log.createdAt;
            } else {
              skillMap.set(skill.skillName, {
                skillName: skill.skillName,
                category: skill.category,
                confidence: skill.confidence,
                postCount: 1,
                lastDetected: log.createdAt
              });
            }
          }
        }
      } catch {
        // Skip invalid metadata
      }
    }

    return Array.from(skillMap.values()).sort((a, b) => b.postCount - a.postCount);
  } catch (error) {
    console.error("[omegaSignalService] Error getting skill history:", error);
    return [];
  }
}

// Process batch of posts (for backfill)
export async function processBatchSignals(postIds: string[]): Promise<void> {
  for (const postId of postIds) {
    await processPostSignal(postId);
  }
}

export default {
  processPostSignal,
  getUserSkillHistory,
  processBatchSignals
};
