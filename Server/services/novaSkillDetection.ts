// Phase 5 — Winners Intelligence — novaSkillDetection.ts
// Claude-powered skill detection from community posts
// Fire-and-forget — never blocks the calling route

import db from "../db.js";
import Anthropic from "@anthropic-ai/sdk";
import { triggerAgenticLoop } from "./agenticLoopService.js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface DetectedSkill {
  skill: string;
  confidence: number;
  category: string;
}

export async function detectSkillsInPost(
  postId: string,
  content: string,
  userId: string,
  tenantId: string
): Promise<void> {
  setImmediate(async () => {
    try {
      if (!content || content.length < 20) return;

      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 300,
        system: `Extract professional skills demonstrated or mentioned in this social media post.
Return JSON only: { "skills": [{"skill": string, "confidence": number (0-1), "category": "technical|creative|business|soft|language"}] }
Return empty array if no clear skills detected. Maximum 5 skills. No markdown.`,
        messages: [{ role: "user", content: content.substring(0, 1000) }],
      });

      const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
      let parsed: { skills: DetectedSkill[] } = { skills: [] };

      try {
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
      } catch {
        return;
      }

      if (!parsed.skills || parsed.skills.length === 0) return;

      // Store skills in NovaSkillDetection table
      for (const skill of parsed.skills) {
        try {
          await db.novaSkillDetection.upsert({
            where: { userId_postId_skill: { userId, postId, skill: skill.skill } },
            update: { confidence: skill.confidence, category: skill.category },
            create: {
              tenantId,
              postId,
              userId,
              skill: skill.skill,
              confidence: skill.confidence * 100,
              category: skill.category,
              source: "post",
            },
          });
        } catch {
          // Unique constraint — skill already detected for this post
        }

        // Update AssistantMemory for NOVA
        try {
          await db.assistantMemory.upsert({
            where: {
              userId_assistant_memoryType: {
                userId,
                assistant: "nova",
                memoryType: "skill",
              },
            },
            update: {
              content: `Detected skills: ${parsed.skills.map((s) => s.skill).join(", ")} (from post ${postId})`,
              updatedAt: new Date(),
            },
            create: {
              userId,
              tenantId,
              assistant: "nova",
              memoryType: "skill",
              content: `Detected skills: ${parsed.skills.map((s) => s.skill).join(", ")} (from post ${postId})`,
              confidence: parsed.skills[0]?.confidence ?? 0.8,
            },
          });
        } catch {
          // Memory already exists
        }
      }

      // Fire Agentic Loop trigger
      await triggerAgenticLoop({
        userId,
        tenantId,
        triggerType: "skill_detected",
        layer: "community",
        data: {
          postId,
          skills: parsed.skills.map((s) => s.skill),
          topSkill: parsed.skills[0]?.skill,
        },
      });
    } catch (err) {
      console.error("[novaSkillDetection] Error:", err);
    }
  });
}

export async function batchDetectSkills(
  posts: Array<{ id: string; content: string; authorId: string; tenantId: string }>
): Promise<void> {
  for (const post of posts) {
    await detectSkillsInPost(post.id, post.content, post.authorId, post.tenantId);
  }
}

export default { detectSkillsInPost, batchDetectSkills };
