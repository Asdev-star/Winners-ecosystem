import { Prisma } from "@prisma/client";
import { Router, type Request, type Response } from "express";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant } from "../middleware/rbacMiddleware.js";
import { callAnthropicAndGetText } from "../services/aiService.js";
import {
  buildOnboardingProfileFields,
  PROFILE_TO_PLATFORM,
  type OnboardingAnswers,
} from "../services/onboardingProfileService.js";

const router = Router();

router.use(authMiddleware);
router.use(enforceTenant);

function metadataObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function detectIntent(answer: string): string[] {
  const normalized = answer.toLowerCase();
  const intents = new Set<string>();

  if (/(fashion|brand|clothing|apparel|beauty|cosmetic)/.test(normalized)) intents.add("brand");
  if (/(startup|saas|platform|software|app|tech)/.test(normalized)) intents.add("startup");
  if (/(freelance|developer|designer|engineer|contract|consult)/.test(normalized)) intents.add("services");
  if (/(youtube|creator|content|podcast|channel|media)/.test(normalized)) intents.add("creator");
  if (/(school|education|course|teach|academy|learning|students?)/.test(normalized)) intents.add("education");
  if (/(shop|store|sell|seller|product|ecommerce|e-commerce|vendor)/.test(normalized)) intents.add("commerce");
  if (/(api|apis|developer|integration|cloud|automation)/.test(normalized)) intents.add("developer");
  if (/(exploring|not sure|nothing yet|just looking|skip)/.test(normalized)) intents.add("exploring");

  if (intents.size === 0) intents.add("general");
  return Array.from(intents).slice(0, 3);
}

function fallbackResponse(answer: string, intents: string[]) {
  if (intents.includes("brand") || intents.includes("commerce")) {
    return "Understood. ATLAS is already thinking about your market. Let me ask a few more things.";
  }
  if (intents.includes("startup")) {
    return "A startup. CIRCUIT will help you find talent, and ATLAS will help you launch. Good.";
  }
  if (intents.includes("services")) {
    return "Freelance momentum. CIRCUIT is already looking for matching work. Let me calibrate the rest.";
  }
  if (intents.includes("creator")) {
    return "Creator economy. NOVA is your first stop, and ATLAS will help you monetise it.";
  }
  if (intents.includes("education")) {
    return "Education is high-leverage work. SAGE and ATLAS both have a role here.";
  }
  if (intents.includes("developer")) {
    return "Developer path detected. NEXUS is already preparing your build surface. Let me calibrate a few more things.";
  }
  if (intents.includes("exploring")) {
    return "Exploring is how all great things start. OMEGA will light the path.";
  }
  return `Understood. OMEGA is calibrating the ecosystem around ${answer.trim()}. Let me ask a few more things.`;
}

function questionKey(question: unknown) {
  if (typeof question === "number" && Number.isInteger(question) && question >= 1 && question <= 7) {
    return `q${question}` as keyof OnboardingAnswers;
  }
  if (typeof question === "string" && /^q[1-7]$/i.test(question.trim())) {
    return question.trim().toLowerCase() as keyof OnboardingAnswers;
  }
  return null;
}

function normalizeAnswers(value: unknown): OnboardingAnswers | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const source = value as Record<string, unknown>;
  return {
    q1: typeof source.q1 === "string" ? source.q1.trim() : null,
    q2: typeof source.q2 === "string" ? source.q2.trim() : null,
    q3: typeof source.q3 === "string" ? source.q3.trim() : null,
    q4: typeof source.q4 === "string" ? source.q4.trim() : null,
    q5: Array.isArray(source.q5) ? source.q5.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()).slice(0, 5) : [],
    q6: Array.isArray(source.q6) ? source.q6.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()).slice(0, 5) : [],
    q7: typeof source.q7 === "string" ? source.q7.trim() : null,
  };
}

function answerText(answer: unknown) {
  if (typeof answer === "string") return answer.trim();
  if (Array.isArray(answer)) return answer.filter((item): item is string => typeof item === "string").join(", ").trim();
  return "";
}

function progressFallback(question: keyof OnboardingAnswers, answer: unknown) {
  const text = answerText(answer);
  if (question === "q1") return fallbackResponse(text, detectIntent(text));
  if (!text) return "Understood. OMEGA saved that signal and is ready for the next step.";
  return `Understood. OMEGA saved "${text}" and will use it in your route assignment.`;
}

async function generateOMEGAResponse(question: keyof OnboardingAnswers, answer: unknown, userId: string) {
  const text = answerText(answer);
  const fallback = progressFallback(question, answer);
  if (!text) return fallback;

  const systemPrompt = `You are OMEGA, the ecosystem orchestrator for Winners Ecosystem.
Reply in one short sentence.
Be direct, warm, and useful.
Reference relevant supervisors like NOVA, SAGE, ATLAS, CIRCUIT, or NEXUS only when helpful.
Never pressure the user.`;

  return callAnthropicAndGetText(
    `Question key: ${question}
User id: ${userId}
User answer: ${text}
Respond in one sentence that acknowledges the answer and gently prepares the next step.`,
    systemPrompt,
    { model: "claude-sonnet-4-20250514", max_tokens: 120, temperature: 0.5 },
    fallback,
  );
}

async function updateUserOnboardingData(userId: string, tenantId: string, question: keyof OnboardingAnswers, answer: unknown) {
  const user = await db.user.findFirst({
    where: { id: userId, tenantId, deletedAt: null },
    select: { id: true, metadata: true },
  });

  if (!user) return;

  const existingMetadata = metadataObject(user.metadata);
  const onboardingProgress = metadataObject(existingMetadata.onboardingProgress as Prisma.JsonValue | undefined);
  const existingAnswers = metadataObject(onboardingProgress.answers as Prisma.JsonValue | undefined);

  const nextAnswers: Record<string, unknown> = {
    ...existingAnswers,
    [question]: Array.isArray(answer)
      ? answer.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim())
      : answerText(answer),
  };

  const nextMetadata: Record<string, unknown> = {
    ...existingMetadata,
    onboardingProgress: {
      answers: nextAnswers,
      lastQuestion: question,
      updatedAt: new Date().toISOString(),
    },
  };

  await db.user.update({
    where: { id: user.id },
    data: { metadata: nextMetadata as Prisma.InputJsonValue },
  });
}

async function setupOMEGAContext(userId: string, tenantId: string, answers: OnboardingAnswers) {
  const user = await db.user.findFirst({
    where: { id: userId, tenantId, deletedAt: null },
    select: { id: true, metadata: true },
  });

  if (!user) return;

  const fields = buildOnboardingProfileFields(answers);
  const existingMetadata = metadataObject(user.metadata);
  const nextMetadata: Record<string, unknown> = {
    ...existingMetadata,
    omegaContext: {
      setupAt: new Date().toISOString(),
      mission: fields.omegaMission,
      profileType: fields.profileType,
      firstPlatform: fields.primaryPlatform,
      primaryMarkets: fields.primaryMarkets,
      primarySkills: fields.primarySkills,
    },
  };

  await db.user.update({
    where: { id: user.id },
    data: { metadata: nextMetadata as Prisma.InputJsonValue },
  });
}

router.post("/answer", async (req: Request, res: Response) => {
  const key = questionKey(req.body?.question);
  const answer = req.body?.answer;

  if (!key) {
    return res.status(400).json({ message: "question must be q1-q7 or 1-7" });
  }

  const text = answerText(answer);
  if (!text) {
    return res.status(400).json({ message: "answer is required" });
  }

  try {
    const omegaResponse = await generateOMEGAResponse(key, answer, req.user!.userId);
    await updateUserOnboardingData(req.user!.userId, req.user!.tenantId, key, answer);
    return res.json({ omegaResponse: omegaResponse.trim() || progressFallback(key, answer) });
  } catch (err) {
    console.error("Onboarding answer error:", err);
    return res.status(500).json({ message: "Failed to process onboarding answer" });
  }
});

router.post("/complete", async (req: Request, res: Response) => {
  const answers = normalizeAnswers(req.body?.answers);
  if (!answers?.q1 || !answers.q2 || !answers.q3 || !answers.q4 || !answers.q7) {
    return res.status(400).json({ message: "answers.q1 through answers.q7 must be present before completion" });
  }

  try {
    const user = await db.user.findFirst({
      where: { id: req.user!.userId, tenantId: req.user!.tenantId, deletedAt: null },
      select: { id: true, metadata: true },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const fields = buildOnboardingProfileFields(answers);
    const existingMetadata = metadataObject(user.metadata);
    const existingOnboarding = metadataObject(existingMetadata.onboarding as Prisma.JsonValue | undefined);
    const existingOmegaRouting = metadataObject(existingMetadata.omegaRouting as Prisma.JsonValue | undefined);

    const nextMetadata: Record<string, unknown> = {
      ...existingMetadata,
      onboardingProgress: {
        answers,
        completed: true,
        completedAt: new Date().toISOString(),
      },
      onboarding: {
        ...existingOnboarding,
        completed: true,
        completedAt: new Date().toISOString(),
        profileType: fields.profileTypeDisplay,
        buildingFocus: fields.omegaMission,
        experienceLevel: answers.q3,
        incomeTarget: answers.q4,
        marketFocus: fields.primaryMarkets,
        topSkills: fields.primarySkills,
        primaryLayer: fields.primaryPlatform,
        teamSize: answers.q7,
        selectedPlan: "free",
        recommendedPlan: typeof existingOnboarding.recommendedPlan === "string" ? existingOnboarding.recommendedPlan : "free",
        assignedSupervisor: fields.supervisor,
      },
      omegaRouting: {
        ...existingOmegaRouting,
        primaryLayer: fields.primaryPlatform,
        profileType: fields.profileTypeDisplay,
        experienceLevel: answers.q3,
        incomeTarget: answers.q4,
        marketFocus: fields.primaryMarkets,
        topSkills: fields.primarySkills,
        supervisor: fields.supervisor,
        selectedPlan: "free",
        recommendedPlan: typeof existingOmegaRouting.recommendedPlan === "string" ? existingOmegaRouting.recommendedPlan : "free",
      },
    };

    await db.user.update({
      where: { id: user.id },
      data: {
        profileType: fields.profileType,
        onboardingDone: true,
        omegaMission: fields.omegaMission,
        incomeGoal: fields.incomeGoal,
        experienceLevel: fields.experienceLevel,
        primaryMarkets: fields.primaryMarkets,
        primarySkills: fields.primarySkills,
        teamType: fields.teamType,
        onboardingData: fields.onboardingData as Prisma.InputJsonValue,
        firstPlatform: fields.primaryPlatform,
        metadata: nextMetadata as Prisma.InputJsonValue,
      },
    });

    await setupOMEGAContext(req.user!.userId, req.user!.tenantId, answers);

    return res.json({
      profileType: fields.profileType,
      redirectTo: fields.redirectPath,
      primaryPlatform: PROFILE_TO_PLATFORM[fields.profileType],
    });
  } catch (err) {
    console.error("Onboarding completion error:", err);
    return res.status(500).json({ message: "Failed to complete onboarding" });
  }
});

router.post("/omega-response", async (req: Request, res: Response) => {
  const question = Number(req.body?.question);
  const answer = typeof req.body?.answer === "string" ? req.body.answer.trim() : "";

  if (question !== 1) {
    return res.status(400).json({ message: "Only question 1 is supported by this endpoint right now." });
  }

  if (!answer) {
    return res.status(400).json({ message: "answer is required" });
  }

  const detectedIntent = detectIntent(answer);
  const fallback = fallbackResponse(answer, detectedIntent);
  const systemPrompt = `You are OMEGA, the ecosystem orchestrator for Winners Ecosystem.
A new user has just told you what they are building. Respond in ONE sentence.
Be direct, warm, and ecosystem-aware. Reference specific supervisors (NOVA, SAGE, ATLAS, CIRCUIT, NEXUS)
by name when helpful. Never say "Great answer" or "Interesting". Just acknowledge and move forward.
The response will appear immediately below their input, before the next question shows.`;

  const omegaResponse = await callAnthropicAndGetText(
    `Question: 1\nUser answer: ${answer}\nReturn exactly one sentence.`,
    systemPrompt,
    { model: "claude-sonnet-4-20250514", max_tokens: 120, temperature: 0.5 },
    fallback,
  );

  return res.json({
    omegaResponse: omegaResponse.trim() || fallback,
    detectedIntent,
  });
});

export default router;
