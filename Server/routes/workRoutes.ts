// Server/routes/workRoutes.ts
// Phase 6 — Winners Work — Freelancer Marketplace API
// Job listings, freelancer profiles, applications, contracts
// V1.1 — CIRCUIT AI matching + proposal generation

import { Router, Request, Response } from "express";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant } from "../middleware/rbacMiddleware.js";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const router = Router();
router.use(authMiddleware);
router.use(enforceTenant);

type CircuitRecommendation = {
  jobId: string;
  score: number;
  headline: string;
  strengths: string[];
  gaps: string[];
  estimatedRate: string;
};

function normalizeSkill(value: string) {
  return value.trim().toLowerCase();
}

function rankJobsDeterministically(input: {
  profileSkills: string[];
  detectedSkills: string[];
  certificates: string[];
  openJobs: Array<{
    id: string;
    title: string;
    category: string;
    skills: string[];
    experienceLevel: string;
    budgetMin: number | null;
    budgetMax: number | null;
    currency: string;
  }>;
}): CircuitRecommendation[] {
  const profileSkills = new Set(input.profileSkills.map(normalizeSkill));
  const detectedSkills = new Set(input.detectedSkills.map(normalizeSkill));
  const certificates = new Set(input.certificates.map(normalizeSkill));

  return input.openJobs
    .map((job) => {
      const jobSkills = job.skills.map(normalizeSkill);
      const matchedSkills = jobSkills.filter(
        (skill) => profileSkills.has(skill) || detectedSkills.has(skill),
      );
      const missingSkills = jobSkills.filter((skill) => !matchedSkills.includes(skill));
      const categoryBoost = certificates.has(normalizeSkill(job.category)) ? 8 : 0;
      const matchRatio = jobSkills.length
        ? matchedSkills.length / jobSkills.length
        : 0.45;
      const baseScore = Math.round(Math.min(96, 45 + matchRatio * 40 + categoryBoost));
      const estimatedRate = job.budgetMax ?? job.budgetMin ?? 0;

      return {
        jobId: job.id,
        score: baseScore,
        headline:
          matchedSkills.length > 0
            ? `Strong overlap across ${matchedSkills.slice(0, 2).join(" and ")} with room to close the remaining gaps quickly.`
            : "Promising strategic fit, but this role needs profile strengthening before it becomes a top-tier CIRCUIT match.",
        strengths: matchedSkills.slice(0, 3),
        gaps: missingSkills.slice(0, 2),
        estimatedRate: `${job.currency} ${estimatedRate || "Negotiable"}`,
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 10);
}

// ─── JOB LISTINGS ─────────────────────────────────────────────────────────────

// GET /work/jobs — list jobs with filters
router.get("/jobs", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const page     = parseInt(String(req.query.page  ?? "1"));
  const limit    = parseInt(String(req.query.limit ?? "20"));
  const category = String(req.query.category ?? "").trim() || undefined;
  const jobType  = String(req.query.jobType  ?? "").trim() || undefined;
  const level    = String(req.query.level    ?? "").trim() || undefined;
  const search   = String(req.query.search   ?? "").trim() || undefined;
  const location = String(req.query.location ?? "").trim() || undefined;

  try {
    const where: Record<string, unknown> = {
      tenantId,
      status: "OPEN",
    };
    if (category) where.category = category;
    if (jobType)  where.jobType  = jobType;
    if (level)    where.experienceLevel = level;
    if (location) where.location = { contains: location, mode: "insensitive" };
    if (search) {
      where.OR = [
        { title:       { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { skills:      { has: search } },
      ];
    }

    const [jobs, total] = await Promise.all([
      db.jobListing.findMany({
        where: where as never,
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        skip:    (page - 1) * limit,
        take:    limit,
        include: {
          client:       { select: { id: true, name: true, email: true } },
          _count:       { select: { applications: true } },
        },
      }),
      db.jobListing.count({ where: where as never }),
    ]);

    return res.json({
      jobs: jobs.map((j) => ({ ...j, applicationCount: j._count.applications })),
      total,
      page,
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error("[work] Get jobs error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /work/jobs/:id — single job
router.get("/jobs/:id", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const jobId    = String(req.params.id);

  try {
    const job = await db.jobListing.findFirst({
      where:   { id: jobId, tenantId },
      include: {
        client:       { select: { id: true, name: true, email: true } },
        _count:       { select: { applications: true } },
        applications: {
          where:   { freelancer: { userId: req.user!.userId } },
          select:  { id: true, status: true, createdAt: true },
        },
      },
    });

    if (!job) return res.status(404).json({ message: "Job not found" });

    await db.jobListing.update({
      where: { id: jobId },
      data:  { viewCount: { increment: 1 } },
    });

    return res.json({
      ...job,
      applicationCount: job._count.applications,
      myApplication:    job.applications[0] ?? null,
    });
  } catch (error) {
    console.error("[work] Get job error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /work/jobs — create job listing
router.post("/jobs", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const clientId = req.user!.userId;
  const {
    title, description, requirements, category, skills,
    experienceLevel, jobType, budgetMin, budgetMax, currency,
    duration, location, deadline,
  } = req.body;

  if (!title?.trim() || !description?.trim() || !category || !experienceLevel || !jobType) {
    return res.status(400).json({ message: "title, description, category, experienceLevel, and jobType are required" });
  }

  try {
    const job = await db.jobListing.create({
      data: {
        tenantId,
        clientId,
        title:           title.trim(),
        description:     description.trim(),
        requirements:    requirements?.trim() ?? null,
        category,
        skills:          Array.isArray(skills) ? skills : [],
        experienceLevel,
        jobType,
        budgetMin:       budgetMin ? parseFloat(budgetMin) : null,
        budgetMax:       budgetMax ? parseFloat(budgetMax) : null,
        currency:        currency ?? "USD",
        duration:        duration ?? null,
        location:        location ?? null,
        deadline:        deadline ? new Date(deadline) : null,
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
      },
    });

    return res.status(201).json(job);
  } catch (error) {
    console.error("[work] Create job error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// PATCH /work/jobs/:id — update job (client only)
router.patch("/jobs/:id", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId   = req.user!.userId;
  const jobId    = String(req.params.id);

  try {
    const job = await db.jobListing.findFirst({
      where: { id: jobId, tenantId, clientId: userId },
    });
    if (!job) return res.status(404).json({ message: "Job not found or not yours" });

    const allowed = ["title", "description", "requirements", "skills", "budgetMin", "budgetMax",
                     "duration", "location", "deadline", "status", "experienceLevel", "jobType"];
    const data: Record<string, unknown> = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === "deadline") data[key] = req.body[key] ? new Date(req.body[key]) : null;
        else if (key === "budgetMin" || key === "budgetMax") data[key] = req.body[key] ? parseFloat(req.body[key]) : null;
        else data[key] = req.body[key];
      }
    }

    const updated = await db.jobListing.update({
      where: { id: jobId, tenantId },
      data: data as never
    });
    return res.json(updated);
  } catch (error) {
    console.error("[work] Update job error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// DELETE /work/jobs/:id
router.delete("/jobs/:id", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId   = req.user!.userId;
  const jobId    = String(req.params.id);

  try {
    const job = await db.jobListing.findFirst({
      where: { id: jobId, tenantId, clientId: userId },
    });
    if (!job) return res.status(404).json({ message: "Job not found or not yours" });

    await db.jobListing.update({
      where: { id: jobId, tenantId },
      data: { status: "CANCELLED" }
    });
    return res.json({ message: "Job closed" });
  } catch (error) {
    console.error("[work] Delete job error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── FREELANCER PROFILES ──────────────────────────────────────────────────────

// GET /work/freelancers — list freelancers
router.get("/freelancers", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const page     = parseInt(String(req.query.page  ?? "1"));
  const limit    = parseInt(String(req.query.limit ?? "20"));
  const search   = String(req.query.search   ?? "").trim() || undefined;
  const skill    = String(req.query.skill    ?? "").trim() || undefined;
  const country  = String(req.query.country  ?? "").trim() || undefined;

  try {
    const where: Record<string, unknown> = { tenantId, availability: "AVAILABLE" };
    if (skill)   where.skills  = { has: skill };
    if (country) where.country = { equals: country, mode: "insensitive" };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { bio:   { contains: search, mode: "insensitive" } },
      ];
    }

    const [freelancers, total] = await Promise.all([
      db.freelancerProfile.findMany({
        where: where as never,
        orderBy: [{ trustScore: "desc" }, { totalJobs: "desc" }],
        skip:    (page - 1) * limit,
        take:    limit,
        include: {
          user:           { select: { id: true, name: true, email: true } },
          portfolioItems: { take: 3 },
          _count:         { select: { contracts: true } },
        },
      }),
      db.freelancerProfile.count({ where: where as never }),
    ]);

    return res.json({
      freelancers,
      total,
      page,
      pages: Math.ceil(total / limit),
      hasMore: page * limit < total,
    });
  } catch (error) {
    console.error("[work] Get freelancers error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /work/freelancers/me — get my freelancer profile
router.get("/freelancers/me", async (req: Request, res: Response) => {
  const userId   = req.user!.userId;
  const tenantId = req.user!.tenantId;

  try {
    const profile = await db.freelancerProfile.findFirst({
      where:   { userId, tenantId },
      include: {
        user:           { select: { id: true, name: true, email: true } },
        portfolioItems: true,
      },
    });

    if (!profile) return res.status(404).json({ message: "No freelancer profile found" });
    return res.json(profile);
  } catch (error) {
    console.error("[work] Get my profile error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /work/freelancers — create or update my freelancer profile (upsert)
router.post("/freelancers", async (req: Request, res: Response) => {
  const userId   = req.user!.userId;
  const tenantId = req.user!.tenantId;
  const {
    title, bio, hourlyRate, availability, yearsExperience,
    languages, skills, portfolioUrl, linkedInUrl, githubUrl, timezone, country,
  } = req.body;

  try {
    const profile = await db.freelancerProfile.upsert({
      where:  { userId_tenantId: { userId, tenantId } },
      update: {
        title:           title?.trim()  ?? undefined,
        bio:             bio?.trim()    ?? undefined,
        hourlyRate:      hourlyRate     ? parseFloat(hourlyRate) : undefined,
        availability:    availability  ?? undefined,
        yearsExperience: yearsExperience ? parseInt(yearsExperience) : undefined,
        languages:       Array.isArray(languages) ? languages : undefined,
        skills:          Array.isArray(skills) ? skills : undefined,
        portfolioUrl:    portfolioUrl   ?? undefined,
        linkedInUrl:     linkedInUrl    ?? undefined,
        githubUrl:       githubUrl      ?? undefined,
        timezone:        timezone       ?? undefined,
        country:         country        ?? undefined,
      },
      create: {
        userId,
        tenantId,
        title:           title?.trim()  ?? null,
        bio:             bio?.trim()    ?? null,
        hourlyRate:      hourlyRate     ? parseFloat(hourlyRate) : null,
        availability:    availability  ?? "AVAILABLE",
        yearsExperience: yearsExperience ? parseInt(yearsExperience) : null,
        languages:       Array.isArray(languages) ? languages : ["English"],
        skills:          Array.isArray(skills) ? skills : [],
        portfolioUrl:    portfolioUrl   ?? null,
        linkedInUrl:     linkedInUrl    ?? null,
        githubUrl:       githubUrl      ?? null,
        timezone:        timezone       ?? null,
        country:         country        ?? null,
      },
    });

    return res.json(profile);
  } catch (error) {
    console.error("[work] Upsert freelancer profile error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /work/freelancers/:id — public freelancer profile
router.get("/freelancers/:id", async (req: Request, res: Response) => {
  const profileId = String(req.params.id);
  const tenantId  = req.user!.tenantId;

  try {
    const profile = await db.freelancerProfile.findFirst({
      where:   { id: profileId, tenantId },
      include: {
        user:           { select: { id: true, name: true, email: true } },
        portfolioItems: true,
        _count:         { select: { contracts: true } },
      },
    });

    if (!profile) return res.status(404).json({ message: "Freelancer not found" });
    return res.json(profile);
  } catch (error) {
    console.error("[work] Get freelancer error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// POST /work/freelancers/portfolio — add portfolio item
router.post("/freelancers/portfolio", async (req: Request, res: Response) => {
  const userId   = req.user!.userId;
  const tenantId = req.user!.tenantId;
  const { title, description, category, url, imageUrl, toolsUsed } = req.body;

  if (!title?.trim()) return res.status(400).json({ message: "title is required" });

  try {
    const profile = await db.freelancerProfile.findFirst({ where: { userId, tenantId } });
    if (!profile) return res.status(404).json({ message: "Create your freelancer profile first" });

    const item = await db.portfolioItem.create({
      data: {
        tenantId,
        freelancerId: profile.id,
        title:        title.trim(),
        description:  description?.trim() ?? null,
        category:     category ?? null,
        url:          url ?? null,
        imageUrl:     imageUrl ?? null,
        toolsUsed:    Array.isArray(toolsUsed) ? toolsUsed : [],
      },
    });

    return res.status(201).json(item);
  } catch (error) {
    console.error("[work] Add portfolio error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── APPLICATIONS ─────────────────────────────────────────────────────────────

// POST /work/jobs/:id/apply
router.post("/jobs/:id/apply", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId   = req.user!.userId;
  const jobId    = String(req.params.id);
  const { coverLetter, proposedRate, estimatedDays, cvUrl, portfolioUrls } = req.body;

  try {
    const job = await db.jobListing.findFirst({ where: { id: jobId, tenantId, status: "OPEN" } });
    if (!job) return res.status(404).json({ message: "Job not found or not accepting applications" });

    const profile = await db.freelancerProfile.findFirst({ where: { userId, tenantId } });
    if (!profile) return res.status(400).json({ message: "You need a freelancer profile to apply. Create one first." });

    const existing = await db.jobApplication.findUnique({
      where: { jobId_freelancerId: { jobId, freelancerId: profile.id } },
    });
    if (existing) return res.status(400).json({ message: "You have already applied to this job" });

    const application = await db.jobApplication.create({
      data: {
        jobId,
        freelancerId:  profile.id,
        tenantId,
        coverLetter:   coverLetter?.trim() ?? null,
        proposedRate:  proposedRate  ? parseFloat(proposedRate) : null,
        estimatedDays: estimatedDays ? parseInt(estimatedDays) : null,
        cvUrl:         cvUrl ?? null,
        portfolioUrls: Array.isArray(portfolioUrls) ? portfolioUrls : [],
      },
    });

    await db.jobListing.update({
      where: { id: jobId, tenantId },
      data:  { applicationCount: { increment: 1 } },
    });

    return res.status(201).json(application);
  } catch (error) {
    console.error("[work] Apply job error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /work/jobs/:id/applications — list applications (client only)
router.get("/jobs/:id/applications", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;
  const userId   = req.user!.userId;
  const jobId    = String(req.params.id);

  try {
    const job = await db.jobListing.findFirst({ where: { id: jobId, tenantId, clientId: userId } });
    if (!job) return res.status(403).json({ message: "Not your job listing" });

    const applications = await db.jobApplication.findMany({
      where:   { jobId },
      orderBy: { createdAt: "asc" },
      include: {
        freelancer: {
          include: {
            user:           { select: { id: true, name: true, email: true } },
            portfolioItems: { take: 2 },
          },
        },
      },
    });

    return res.json({ applications });
  } catch (error) {
    console.error("[work] Get applications error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /work/applications/mine — my applications
router.get("/applications/mine", async (req: Request, res: Response) => {
  const userId   = req.user!.userId;
  const tenantId = req.user!.tenantId;

  try {
    const profile = await db.freelancerProfile.findFirst({ where: { userId, tenantId } });
    if (!profile) return res.json({ applications: [] });

    const applications = await db.jobApplication.findMany({
      where:   { freelancerId: profile.id },
      orderBy: { createdAt: "desc" },
      include: {
        job: {
          include: {
            client: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return res.json({ applications });
  } catch (error) {
    console.error("[work] Get my applications error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// PATCH /work/applications/:id/status — update application status (client)
router.patch("/applications/:id/status", async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const tenantId = req.user!.tenantId;
  const appId  = String(req.params.id);
  const { status } = req.body;

  const allowed = ["SHORTLISTED", "INTERVIEWING", "OFFERED", "HIRED", "REJECTED"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: `status must be one of: ${allowed.join(", ")}` });
  }

  try {
    const application = await db.jobApplication.findFirst({
      where:   { id: appId, tenantId },
      include: {
        job: true,
        freelancer: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });
    if (!application) return res.status(404).json({ message: "Application not found" });
    if (application.job.clientId !== userId) return res.status(403).json({ message: "Not your job" });

    const updated = await db.jobApplication.update({
      where: { id: appId, tenantId },
      data:  { status },
    });

    let contract = null;

    if (status === "HIRED") {
      const existingContract = await db.contract.findFirst({
        where: {
          tenantId,
          jobId: application.jobId,
          freelancerId: application.freelancerId,
          status: { not: "CANCELLED" },
        },
      });

      if (!existingContract) {
        const proposedAmount =
          application.proposedRate ??
          application.job.budgetMax ??
          application.job.budgetMin ??
          0;
        const startDate = req.body.startDate ? new Date(req.body.startDate) : new Date();
        const endDate = req.body.endDate ? new Date(req.body.endDate) : null;
        const paymentType = String(req.body.paymentType ?? application.job.jobType ?? "fixed");
        const milestoneInputs = Array.isArray(req.body.milestones)
          ? req.body.milestones
          : [
              {
                title: "Project delivery",
                description: "Initial contract milestone created from hired application.",
                amount: proposedAmount,
                dueDate: endDate?.toISOString() ?? null,
              },
            ];

        contract = await db.contract.create({
          data: {
            tenantId,
            jobId: application.jobId,
            clientId: userId,
            freelancerId: application.freelancerId,
            title: application.job.title,
            description: application.job.description,
            status: "ACTIVE",
            startDate,
            endDate,
            paymentType,
            amount: proposedAmount,
            currency: application.job.currency,
            platformFee: Number((proposedAmount * 0.1).toFixed(2)),
            milestones: {
              create: milestoneInputs.map((milestone: {
                title?: string;
                description?: string;
                amount?: number;
                dueDate?: string | null;
              }) => ({
                tenantId,
                title: milestone.title?.trim() || "Project delivery",
                description: milestone.description?.trim() || null,
                amount: Number(milestone.amount ?? proposedAmount),
                dueDate: milestone.dueDate ? new Date(milestone.dueDate) : null,
              })),
            },
          },
          include: {
            milestones: true,
            freelancer: {
              include: { user: { select: { id: true, name: true, email: true } } },
            },
            client: { select: { id: true, name: true, email: true } },
          },
        });
      } else {
        contract = existingContract;
      }

      await Promise.all([
        db.jobListing.update({
          where: { id: application.jobId, tenantId },
          data: { status: "IN_PROGRESS" },
        }),
        db.jobApplication.updateMany({
          where: {
            jobId: application.jobId,
            id: { not: appId },
            status: { in: ["PENDING", "SHORTLISTED", "INTERVIEWING", "OFFERED"] },
          },
          data: { status: "REJECTED" },
        }),
      ]);
    }

    return res.json({ application: updated, contract });
  } catch (error) {
    console.error("[work] Update application status error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── CONTRACTS ────────────────────────────────────────────────────────────────

// GET /work/contracts — my contracts (as client or freelancer)
router.get("/contracts", async (req: Request, res: Response) => {
  const userId   = req.user!.userId;
  const tenantId = req.user!.tenantId;
  const role     = String(req.query.role ?? "all"); // all | client | freelancer

  try {
    const profile = await db.freelancerProfile.findFirst({ where: { userId, tenantId } });

    const where: Record<string, unknown> = { tenantId, status: { not: "DRAFT" } };
    if (role === "client") {
      where.clientId = userId;
    } else if (role === "freelancer" && profile) {
      where.freelancerId = profile.id;
    } else {
      const conditions: Record<string, unknown>[] = [{ clientId: userId }];
      if (profile) conditions.push({ freelancerId: profile.id });
      where.OR = conditions;
    }

    const contracts = await db.contract.findMany({
      where:   where as never,
      orderBy: { createdAt: "desc" },
      include: {
        client:     { select: { id: true, name: true, email: true } },
        freelancer: { include: { user: { select: { id: true, name: true, email: true } } } },
        milestones: { orderBy: { dueDate: "asc" } },
        job:        { select: { id: true, title: true } },
      },
    });

    return res.json({ contracts });
  } catch (error) {
    console.error("[work] Get contracts error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// GET /work/contracts/:id — single contract
router.get("/contracts/:id", async (req: Request, res: Response) => {
  const userId     = req.user!.userId;
  const contractId = String(req.params.id);
  const tenantId   = req.user!.tenantId;

  try {
    const profile = await db.freelancerProfile.findFirst({ where: { userId, tenantId } });

    const contract = await db.contract.findFirst({
      where: {
        id: contractId,
        tenantId,
        OR: [
          { clientId: userId },
          ...(profile ? [{ freelancerId: profile.id }] : []),
        ],
      } as never,
      include: {
        client:     { select: { id: true, name: true, email: true } },
        freelancer: { include: { user: { select: { id: true, name: true, email: true } } } },
        milestones: { orderBy: { dueDate: "asc" } },
        job:        { select: { id: true, title: true } },
        escrow:     true,
        reviews:    true,
      },
    });

    if (!contract) return res.status(404).json({ message: "Contract not found" });
    return res.json(contract);
  } catch (error) {
    console.error("[work] Get contract error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

// ─── CIRCUIT AI ───────────────────────────────────────────────────────────────

// GET /work/circuit/recommendations — AI-ranked job matches for logged-in freelancer
router.get("/circuit/recommendations", async (req: Request, res: Response) => {
  const userId   = req.user!.userId;
  const tenantId = req.user!.tenantId;

  try {
    const [profile, certificates, skills, openJobs] = await Promise.all([
      db.freelancerProfile.findFirst({
        where:   { userId, tenantId },
        include: { portfolioItems: { take: 5 } },
      }),
      db.certificate.findMany({ where: { userId }, include: { course: { select: { title: true, category: true } } } }),
      db.novaSkillDetection.findMany({
        where:   { userId, confidence: { gte: 0.65 } },
        orderBy: { confidence: "desc" },
        take:    20,
      }),
      db.jobListing.findMany({
        where:   { tenantId, status: "OPEN" },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
        take:    30,
        include: { client: { select: { id: true, name: true } }, _count: { select: { applications: true } } },
      }),
    ]);

    if (!profile) {
      return res.json({ matches: [], message: "Create a freelancer profile to get AI job matches." });
    }

    const freelancerContext = {
      title:        profile.title,
      bio:          profile.bio,
      skills:       profile.skills,
      detectedSkills: skills.map((s) => ({ skill: s.skill, confidence: s.confidence })),
      certificates: certificates.map((c) => ({ course: c.course?.title, category: c.course?.category })),
      hourlyRate:   profile.hourlyRate,
      availability: profile.availability,
      experience:   profile.yearsExperience,
    };

    const jobSummaries = openJobs.map((j) => ({
      id:          j.id,
      title:       j.title,
      category:    j.category,
      skills:      j.skills,
      level:       j.experienceLevel,
      type:        j.jobType,
      budgetMin:   j.budgetMin,
      budgetMax:   j.budgetMax,
      currency:    j.currency,
      description: j.description.slice(0, 300),
    }));

    const prompt = `You are CIRCUIT, the AI job-matching supervisor for Winners Work marketplace.

Analyze this freelancer profile and rank these jobs by match score (0–100).

FREELANCER:
${JSON.stringify(freelancerContext, null, 2)}

AVAILABLE JOBS (${jobSummaries.length}):
${JSON.stringify(jobSummaries, null, 2)}

Return a JSON array of the top 10 best matches with this exact structure:
[
  {
    "jobId": "string",
    "score": 85,
    "headline": "Why this is a great match (1 sentence)",
    "strengths": ["skill match 1", "skill match 2"],
    "gaps": ["missing skill or experience gap"],
    "estimatedRate": "suggested bid amount (number in ${openJobs[0]?.currency || "USD"})"
  }
]

Only return valid JSON. No explanation text outside the array.`;

    let matches: CircuitRecommendation[] = [];

    if (process.env.ANTHROPIC_API_KEY) {
      try {
        const response = await anthropic.messages.create({
          model:      "claude-opus-4-5",
          max_tokens: 2048,
          messages:   [{ role: "user", content: prompt }],
        });

        const rawText = response.content[0].type === "text" ? response.content[0].text : "[]";
        const jsonMatch = rawText.match(/\[[\s\S]*\]/);
        matches = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
      } catch (modelError) {
        console.warn("[CIRCUIT] Falling back to deterministic ranking:", modelError);
      }
    }

    if (!matches.length) {
      matches = rankJobsDeterministically({
        profileSkills: profile.skills,
        detectedSkills: skills.map((skill) => skill.skill),
        certificates: certificates
          .map((certificate) => certificate.course?.category)
          .filter((category): category is string => Boolean(category)),
        openJobs: openJobs.map((job) => ({
          id: job.id,
          title: job.title,
          category: job.category,
          skills: job.skills,
          experienceLevel: job.experienceLevel,
          budgetMin: job.budgetMin,
          budgetMax: job.budgetMax,
          currency: job.currency,
        })),
      });
    }

    const enriched = matches.map((m) => {
      const job = openJobs.find((j) => j.id === m.jobId);
      return { ...m, job };
    }).filter((m) => m.job);

    return res.json({ matches: enriched, freelancerProfile: profile });
  } catch (error) {
    console.error("[CIRCUIT] Recommendations error:", error);
    return res.status(500).json({ message: "CIRCUIT AI is temporarily unavailable." });
  }
});

// POST /work/circuit/proposal/:jobId — CIRCUIT generates a personalized proposal
router.post("/circuit/proposal/:jobId", async (req: Request, res: Response) => {
  const userId   = req.user!.userId;
  const tenantId = req.user!.tenantId;
  const jobId    = String(req.params.jobId);
  const { tone = "professional" } = req.body;

  try {
    const [profile, job, certificates, skills] = await Promise.all([
      db.freelancerProfile.findFirst({
        where:   { userId, tenantId },
        include: { portfolioItems: { take: 3 } },
      }),
      db.jobListing.findFirst({
        where:   { id: jobId, tenantId, status: "OPEN" },
        include: { client: { select: { name: true } } },
      }),
      db.certificate.findMany({ where: { userId }, include: { course: { select: { title: true } } } }),
      db.novaSkillDetection.findMany({
        where:   { userId, confidence: { gte: 0.7 } },
        orderBy: { confidence: "desc" },
        take:    10,
      }),
    ]);

    if (!profile) return res.status(400).json({ message: "Create a freelancer profile first." });
    if (!job)     return res.status(404).json({ message: "Job not found." });

    const prompt = `You are CIRCUIT, the AI job-matching supervisor for Winners Work. Write a winning proposal.

JOB:
Title: ${job.title}
Category: ${job.category}
Description: ${job.description}
Required Skills: ${job.skills.join(", ")}
Experience Level: ${job.experienceLevel}
Budget: ${job.budgetMin ?? "Open"}–${job.budgetMax ?? "Open"} ${job.currency}

FREELANCER:
Name: (to be filled by user)
Title: ${profile.title}
Bio: ${profile.bio}
Skills: ${profile.skills.join(", ")}
Detected Skills (AI): ${skills.map((s) => s.skill).join(", ")}
Certificates: ${certificates.map((c) => c.course?.title).filter(Boolean).join(", ")}
Experience: ${profile.yearsExperience ?? "Not specified"} years
Rate: ${profile.hourlyRate ? `$${profile.hourlyRate}/hr` : "Flexible"}
Portfolio: ${profile.portfolioItems.map((p) => p.title).join(", ")}

Tone: ${tone} (options: professional, confident, warm)

Write a compelling proposal (200–300 words) that:
1. Opens with a specific hook referencing the job's core challenge
2. Demonstrates relevant experience with concrete examples
3. References their certified skills and portfolio items naturally
4. Proposes a specific approach/methodology
5. Closes with a clear call to action and suggested rate

Return JSON: { "proposal": "full proposal text", "suggestedRate": number, "currency": "${job.currency}", "estimatedDays": number }`;

    const response = await anthropic.messages.create({
      model:      "claude-opus-4-5",
      max_tokens: 1024,
      messages:   [{ role: "user", content: prompt }],
    });

    const rawText = response.content[0].type === "text" ? response.content[0].text : "{}";
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const result = jsonMatch ? JSON.parse(jsonMatch[0]) : { proposal: rawText, suggestedRate: profile.hourlyRate, currency: job.currency, estimatedDays: 7 };

    return res.json({ ...result, job: { id: job.id, title: job.title, category: job.category } });
  } catch (error) {
    console.error("[CIRCUIT] Proposal error:", error);
    return res.status(500).json({ message: "CIRCUIT AI is temporarily unavailable." });
  }
});

// ─── STATS ────────────────────────────────────────────────────────────────────

// GET /work/stats — platform stats
router.get("/stats", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;

  try {
    const [jobCount, freelancerCount, contractCount] = await Promise.all([
      db.jobListing.count({ where: { tenantId, status: "OPEN" } }),
      db.freelancerProfile.count({ where: { tenantId, availability: "AVAILABLE" } }),
      db.contract.count({ where: { tenantId, status: "COMPLETED" } }),
    ]);

    return res.json({
      openJobs:             jobCount,
      availableFreelancers: freelancerCount,
      completedContracts:   contractCount,
    });
  } catch (error) {
    console.error("[work] Stats error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
