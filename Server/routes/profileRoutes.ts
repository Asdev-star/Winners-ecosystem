// server/routes/profileRoutes.ts

import { Prisma } from "@prisma/client";
import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant } from "../middleware/rbacMiddleware.js";
import { buildOnboardingProfileFields } from "../services/onboardingProfileService.js";

const router = Router();
router.use(authMiddleware);
router.use(enforceTenant);

function metadataObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function mergeObject(target: Record<string, unknown>, patch: unknown) {
  if (!patch || typeof patch !== "object" || Array.isArray(patch)) return target;
  return { ...target, ...(patch as Record<string, unknown>) };
}

function normalizeString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeStringArray(value: unknown, limit = 3): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    .map((item) => item.trim())
    .slice(0, limit);
}

router.get("/", async (req: Request, res: Response) => {
  try {
    const user = await db.user.findFirst({
      where: { id: req.user!.userId, tenantId: req.user!.tenantId, deletedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        country: true,
        city: true,
        bio: true,
        skills: true,
        industry: true,
        isPublicProfile: true,
        metadata: true,
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const metadata = metadataObject(user.metadata);

    return res.json({
      profile: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role.toLowerCase(),
        country: user.country,
        city: user.city,
        bio: user.bio,
        skills: user.skills,
        industry: user.industry,
        isPublicProfile: user.isPublicProfile,
        metadata,
      },
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/onboarding", async (req: Request, res: Response) => {
  const {
    workspaceName,
    buildingFocus,
    profileType,
    identity,
    experienceLevel,
    incomeTarget,
    marketFocus,
    topSkills,
    primaryGoal,
    primaryLayer,
    teamSize,
    recommendedPlan,
    reasoning,
    currentStage,
    firstAction,
    secondaryLayers,
    assignedSupervisor,
    welcomeMessage,
  } = req.body ?? {};

  const fields = {
    workspaceName,
    profileType,
    identity,
    experienceLevel,
    primaryGoal,
    primaryLayer,
    teamSize,
    recommendedPlan,
  };

  const missingField = Object.entries(fields).find(([, value]) => typeof value !== "string" || !value.trim());
  if (missingField) {
    return res.status(400).json({ message: `Missing or invalid field: ${missingField[0]}` });
  }

  const safeReasoning = Array.isArray(reasoning)
    ? reasoning.filter((item): item is string => typeof item === "string" && item.trim().length > 0).slice(0, 12)
    : [];
  const safeBuildingFocus = normalizeString(buildingFocus);
  const safeSecondaryLayers = normalizeStringArray(secondaryLayers, 3);
  const safeMarketFocus = normalizeStringArray(marketFocus, 3);
  const safeTopSkills = normalizeStringArray(topSkills, 5);
  const safeCurrentStage = normalizeString(currentStage);
  const safeFirstAction = normalizeString(firstAction);
  const safeAssignedSupervisor = normalizeString(assignedSupervisor);
  const safeWelcomeMessage = normalizeString(welcomeMessage);
  const safeExperienceLevel = normalizeString(experienceLevel);
  const safeIncomeTarget = normalizeString(incomeTarget);
  const safeSelectedPlan = "free";
  const onboardingProfile = buildOnboardingProfileFields({
    q1: safeBuildingFocus,
    q2: identity,
    q3: safeExperienceLevel,
    q4: safeIncomeTarget,
    q5: safeMarketFocus,
    q6: safeTopSkills,
    q7: teamSize,
  });

  try {
    const user = await db.user.findFirst({
      where: { id: req.user!.userId, tenantId: req.user!.tenantId, deletedAt: null },
      select: { id: true, role: true, metadata: true },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const existingMetadata = metadataObject(user.metadata);
    const onboarding = {
      completed: true,
      completedAt: new Date().toISOString(),
      supervisor: "OMEGA",
      assignedSupervisor: safeAssignedSupervisor,
      version: "2.0",
      workspaceName: workspaceName.trim(),
      buildingFocus: safeBuildingFocus,
      profileType: onboardingProfile.profileTypeDisplay,
      identity: identity.trim(),
      experienceLevel: safeExperienceLevel,
      incomeTarget: safeIncomeTarget,
      marketFocus: safeMarketFocus,
      topSkills: safeTopSkills,
      primaryGoal: primaryGoal.trim(),
      primaryLayer: primaryLayer.trim(),
      secondaryLayers: safeSecondaryLayers,
      teamSize: teamSize.trim(),
      currentStage: safeCurrentStage,
      firstAction: safeFirstAction,
      selectedPlan: safeSelectedPlan,
      recommendedPlan: recommendedPlan.trim().toLowerCase(),
      reasoning: safeReasoning,
      welcomeMessage: safeWelcomeMessage,
    };

    const nextMetadata: Record<string, unknown> = {
      ...existingMetadata,
      onboarding,
      omegaRouting: {
        primaryLayer: primaryLayer.trim(),
        buildingFocus: safeBuildingFocus,
        secondaryLayers: safeSecondaryLayers,
        profileType: onboardingProfile.profileTypeDisplay,
        experienceLevel: safeExperienceLevel,
        incomeTarget: safeIncomeTarget,
        marketFocus: safeMarketFocus,
        topSkills: safeTopSkills,
        supervisor: safeAssignedSupervisor,
        currentStage: safeCurrentStage,
        firstAction: safeFirstAction,
        selectedPlan: safeSelectedPlan,
        recommendedPlan: recommendedPlan.trim().toLowerCase(),
      },
    };

    await db.user.update({
      where: { id: user.id },
      data: {
        metadata: nextMetadata as Prisma.InputJsonValue,
        profileType: onboardingProfile.profileType,
        onboardingDone: true,
        omegaMission: safeBuildingFocus,
        incomeGoal: onboardingProfile.incomeGoal,
        experienceLevel: onboardingProfile.experienceLevel,
        primaryMarkets: onboardingProfile.primaryMarkets,
        primarySkills: onboardingProfile.primarySkills,
        teamType: onboardingProfile.teamType,
        onboardingData: onboardingProfile.onboardingData as Prisma.InputJsonValue,
        firstPlatform: onboardingProfile.primaryPlatform,
      },
    });

    if ((user.role === "OWNER" || user.role === "ADMIN") && workspaceName.trim()) {
      await db.tenant.update({
        where: { id: req.user!.tenantId },
        data: { name: workspaceName.trim() },
      });
    }

    return res.json({
      message: "Onboarding saved",
      onboarding,
      route: primaryLayer.trim(),
      supervisor: safeAssignedSupervisor,
      welcomeMessage: safeWelcomeMessage,
    });
  } catch (err) {
    console.error("Onboarding save error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── PATCH /profile — update name, email, and diaspora fields ────────────────────────

router.patch("/", async (req: Request, res: Response) => {
  const { name, email, country, city, bio, skills, industry, isPublicProfile, location, website, preferences, metadata: metadataPatch } = req.body;

  if (
    !name &&
    !email &&
    !country &&
    !city &&
    !bio &&
    !skills &&
    !industry &&
    location === undefined &&
    website === undefined &&
    preferences === undefined &&
    metadataPatch === undefined &&
    isPublicProfile === undefined
  ) {
    return res.status(400).json({ message: "At least one field is required" });
  }

  try {
    // Check email uniqueness if changing
    if (email) {
      const existing = await db.user.findFirst({
        where: { email: email.toLowerCase(), tenantId: req.user!.tenantId, deletedAt: null, NOT: { id: req.user!.userId } },
      });
      if (existing) return res.status(409).json({ message: "Email already in use" });
    }

    const user = await db.user.findFirst({
      where: { id: req.user!.userId, tenantId: req.user!.tenantId, deletedAt: null },
      select: { metadata: true },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const existingMetadata = metadataObject(user.metadata);
    const nextMetadata = mergeObject(existingMetadata, metadataPatch);

    if (location !== undefined || website !== undefined) {
      const currentProfile = metadataObject(existingMetadata.profile as Prisma.JsonValue | undefined);
      nextMetadata.profile = {
        ...currentProfile,
        ...(location !== undefined ? { location } : {}),
        ...(website !== undefined ? { website } : {}),
      };
    }

    if (preferences !== undefined) {
      const currentPreferences = metadataObject(existingMetadata.preferences as Prisma.JsonValue | undefined);
      nextMetadata.preferences = mergeObject(currentPreferences, preferences);
    }

    const updated = await db.user.update({
      where: { id: req.user!.userId },
      data:  {
        ...(name  && { name }),
        ...(email && { email: email.toLowerCase() }),
        ...(country !== undefined && { country }),
        ...(city !== undefined && { city }),
        ...(bio !== undefined && { bio }),
        ...(skills && { skills }),
        ...(industry !== undefined && { industry }),
        ...(isPublicProfile !== undefined && { isPublicProfile }),
        metadata: nextMetadata as Prisma.InputJsonValue,
      },
    });

    return res.json({
      message: "Profile updated",
      user: { 
        id: updated.id, 
        name: updated.name, 
        email: updated.email, 
        role: updated.role.toLowerCase(),
        country: updated.country,
        city: updated.city,
        bio: updated.bio,
        skills: updated.skills,
        industry: updated.industry,
        isPublicProfile: updated.isPublicProfile,
        metadata: nextMetadata,
      },
    });
  } catch (err) {
    console.error("Profile update error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── PATCH /profile/password — change password ────────────────────────────────

router.patch("/password", async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "currentPassword and newPassword are required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: "New password must be at least 6 characters" });
  }

  try {
    const user = await db.user.findFirst({
      where: { id: req.user!.userId, deletedAt: null },
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ message: "Current password is incorrect" });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.user.update({ where: { id: req.user!.userId }, data: { password: hashed } });

    return res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Password change error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── DELETE /profile — soft delete account ────────────────────────────────────

router.delete("/", async (req: Request, res: Response) => {
  try {
    const user = await db.user.findFirst({ where: { id: req.user!.userId } });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.role === "OWNER") return res.status(403).json({ message: "Owners cannot delete their account. Transfer ownership first." });

    await db.user.update({ where: { id: req.user!.userId }, data: { deletedAt: new Date() } });

    return res.json({ message: "Account deleted" });
  } catch (err) {
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
