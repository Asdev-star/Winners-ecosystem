// Server/routes/workRoutes.ts
// Phase 6 — Winners Work — Freelancer Marketplace API
// Job listings, freelancer profiles, applications, contracts

import { Router, Request, Response } from "express";
import db from "../db.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { enforceTenant } from "../middleware/rbacMiddleware.js";

const router = Router();
router.use(authMiddleware);
router.use(enforceTenant);

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

    const updated = await db.jobListing.update({ where: { id: jobId }, data: data as never });
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

    await db.jobListing.update({ where: { id: jobId }, data: { status: "CANCELLED" } });
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
      where:  { userId },
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
        coverLetter:   coverLetter?.trim() ?? null,
        proposedRate:  proposedRate  ? parseFloat(proposedRate) : null,
        estimatedDays: estimatedDays ? parseInt(estimatedDays) : null,
        cvUrl:         cvUrl ?? null,
        portfolioUrls: Array.isArray(portfolioUrls) ? portfolioUrls : [],
      },
    });

    await db.jobListing.update({
      where: { id: jobId },
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
  const appId  = String(req.params.id);
  const { status } = req.body;

  const allowed = ["SHORTLISTED", "INTERVIEWING", "OFFERED", "HIRED", "REJECTED"];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: `status must be one of: ${allowed.join(", ")}` });
  }

  try {
    const application = await db.jobApplication.findUnique({
      where:   { id: appId },
      include: { job: true },
    });
    if (!application) return res.status(404).json({ message: "Application not found" });
    if (application.job.clientId !== userId) return res.status(403).json({ message: "Not your job" });

    const updated = await db.jobApplication.update({
      where: { id: appId },
      data:  { status },
    });

    return res.json(updated);
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

    const where: Record<string, unknown> = { status: { not: "DRAFT" } };
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

// ─── STATS ────────────────────────────────────────────────────────────────────

// GET /work/stats — platform stats
router.get("/stats", async (req: Request, res: Response) => {
  const tenantId = req.user!.tenantId;

  try {
    const [jobCount, freelancerCount, contractCount] = await Promise.all([
      db.jobListing.count({ where: { tenantId, status: "OPEN" } }),
      db.freelancerProfile.count({ where: { tenantId, availability: "AVAILABLE" } }),
      db.contract.count({ where: { status: "COMPLETED" } }),
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
