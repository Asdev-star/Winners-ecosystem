// @ts-nocheck
// Server/routes/externalCourseRoutes.ts
// Phase 3 — Academy Layer: External Course Integrations (Coursera, FreeCodeCamp, etc.)

import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";

const router = Router();

// Get all external courses (with filters)
router.get("/", async (req, res) => {
  try {
    const { platform, category, search, featured } = req.query;
    
    const where: any = {};
    
    if (platform) {
      where.platform = platform;
    }
    if (category) {
      where.category = category;
    }
    if (featured === "true") {
      where.isFeatured = true;
    }
    if (search) {
      where.OR = [
        { title: { contains: String(search), mode: "insensitive" } },
        { description: { contains: String(search), mode: "insensitive" } },
      ];
    }

    const courses = await db.externalCourse.findMany({
      where,
      orderBy: { enrollmentCount: "desc" },
      take: 50,
    });

    res.json(courses);
  } catch (error) {
    console.error("Error fetching external courses:", error);
    res.status(500).json({ error: "Failed to fetch external courses" });
  }
});

// Get single external course
router.get("/:id", async (req, res) => {
  try {
    const course = await db.externalCourse.findUnique({
      where: { id: String(req.params.id) },
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    console.error("Error fetching external course:", error);
    res.status(500).json({ error: "Failed to fetch external course" });
  }
});

// Enroll in external course (just track it in our system)
router.post("/:id/enroll", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const courseId = String(req.params.id);
    const userId = req.user.userId;

    const course = await db.externalCourse.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Check if already enrolled
    const existing = await db.externalCourseEnrollment.findUnique({
      where: {
        userId_externalCourseId: {
          userId,
          externalCourseId: courseId,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: "Already enrolled" });
    }

    // Create enrollment
    const enrollment = await db.externalCourseEnrollment.create({
      data: {
        userId,
        externalCourseId: courseId,
      },
      include: {
        externalCourse: true,
      },
    });

    // Increment enrollment count on course
    await db.externalCourse.update({
      where: { id: courseId },
      data: { enrollmentCount: { increment: 1 } },
    });

    res.status(201).json(enrollment);
  } catch (error) {
    console.error("Error enrolling in external course:", error);
    res.status(500).json({ error: "Failed to enroll" });
  }
});

// Get user's external course enrollments
router.get("/user/enrollments", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const enrollments = await db.externalCourseEnrollment.findMany({
      where: { userId: req.user.userId },
      include: {
        externalCourse: true,
      },
      orderBy: { enrolledAt: "desc" },
    });

    res.json(enrollments);
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    res.status(500).json({ error: "Failed to fetch enrollments" });
  }
});

// Update external course progress
router.patch("/:id/progress", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const courseId = String(req.params.id);
    const { progress, completedAt, certificateUrl } = req.body;

    const enrollment = await db.externalCourseEnrollment.findUnique({
      where: {
        userId_externalCourseId: {
          userId: req.user.userId,
          externalCourseId: courseId,
        },
      },
    });

    if (!enrollment) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    const updated = await db.externalCourseEnrollment.update({
      where: { id: enrollment.id },
      data: {
        progress: progress ?? undefined,
        completedAt: completedAt ?? undefined,
        certificateUrl: certificateUrl ?? undefined,
      },
      include: {
        externalCourse: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error updating progress:", error);
    res.status(500).json({ error: "Failed to update progress" });
  }
});

// Sync external certificate to Winners Academy
router.post("/:id/sync-certificate", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const courseId = String(req.params.id);
    const { certificateUrl } = req.body;

    const enrollment = await db.externalCourseEnrollment.findUnique({
      where: {
        userId_externalCourseId: {
          userId: req.user.userId,
          externalCourseId: courseId,
        },
      },
    });

    if (!enrollment) {
      return res.status(404).json({ error: "Enrollment not found" });
    }

    // Mark as synced
    const updated = await db.externalCourseEnrollment.update({
      where: { id: enrollment.id },
      data: {
        certificateUrl,
        completedAt: enrollment.completedAt || new Date(),
        isSynced: true,
      },
      include: {
        externalCourse: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Error syncing certificate:", error);
    res.status(500).json({ error: "Failed to sync certificate" });
  }
});

// Admin: Create external course (seed data)
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const {
      platform,
      externalId,
      title,
      description,
      thumbnailUrl,
      courseUrl,
      instructor,
      duration,
      category,
      tags,
      price,
      currency,
    } = req.body;

    const course = await db.externalCourse.create({
      data: {
        tenantId: req.user.tenantId,
        platform,
        externalId,
        title,
        description,
        thumbnailUrl,
        courseUrl,
        instructor,
        duration,
        category,
        tags: tags || [],
        price: price || 0,
        currency: currency || "USD",
      },
    });

    res.status(201).json(course);
  } catch (error) {
    console.error("Error creating external course:", error);
    res.status(500).json({ error: "Failed to create external course" });
  }
});

// Get available platforms
router.get("/meta/platforms", (req, res) => {
  res.json([
    { id: "COURSERA", name: "Coursera", icon: "🎓" },
    { id: "UNIATHENA", name: "UniAthena", icon: "🎯" },
    { id: "FREECODECAMP", name: "FreeCodeCamp", icon: "🔥" },
    { id: "UDEMY", name: "Udemy", icon: "💡" },
    { id: "EDX", name: "edX", icon: "📚" },
    { id: "KHAN_ACADEMY", name: "Khan Academy", icon: "🧠" },
    { id: "PLURALSIGHT", name: "Pluralsight", icon: "💻" },
    { id: "LINKEDIN_LEARNING", name: "LinkedIn Learning", icon: "💼" },
    { id: "GOOGLE_SKILLSHOP", name: "Google Skillshop", icon: "🔍" },
    { id: "HUBSPOT", name: "HubSpot Academy", icon: "📈" },
    { id: "ALISON", name: "Alison", icon: "📖" },
    { id: "AWS_SKILLBUILDER", name: "AWS Skill Builder", icon: "☁️" },
    { id: "MICROSOFT_LEARN", name: "Microsoft Learn", icon: "🪟" },
    { id: "ALX_AFRICA", name: "ALX Africa", icon: "🌍" },
    { id: "ANDELA", name: "Andela", icon: "⚡" },
  ]);
});

// Save external course for later
router.post("/:id/save", authMiddleware, async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const { userId } = req.user;
    const { sageNote } = req.body;

    const course = await db.externalCourse.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    const save = await db.externalCourseSave.upsert({
      where: {
        userId_courseId: { userId, courseId },
      },
      update: { sageNote },
      create: {
        userId,
        courseId,
        sageNote,
      },
    });

    res.status(201).json(save);
  } catch (error) {
    console.error("Error saving course:", error);
    res.status(500).json({ error: "Failed to save course" });
  }
});

// Remove saved external course
router.delete("/:id/save", authMiddleware, async (req, res) => {
  try {
    const { id: courseId } = req.params;
    const { userId } = req.user;

    await db.externalCourseSave.delete({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    res.json({ message: "Course unsaved" });
  } catch (error) {
    console.error("Error unsaving course:", error);
    res.status(500).json({ error: "Failed to unsave course" });
  }
});

// Get user's saved courses
router.get("/user/saved", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;

    const saves = await db.externalCourseSave.findMany({
      where: { userId },
      include: {
        course: true,
      },
      orderBy: { savedAt: "desc" },
    });

    res.json(saves);
  } catch (error) {
    console.error("Error fetching saved courses:", error);
    res.status(500).json({ error: "Failed to fetch saved courses" });
  }
});

// FreeCodeCamp account sync
router.post("/freecodecamp/connect", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const { fccUsername } = req.body;

    if (!fccUsername) {
      return res.status(400).json({ error: "freeCodeCamp username is required" });
    }

    // Fetch the user's public profile page
    // Note: In production, you'd want to scrape or use an API
    // For now, we just store the username
    const sync = await db.freeCodeCampSync.upsert({
      where: { userId },
      update: { fccUsername },
      create: { userId, fccUsername },
    });

    res.json({
      message: "FreeCodeCamp account connected",
      username: fccUsername,
    });
  } catch (error) {
    console.error("Error connecting FreeCodeCamp:", error);
    res.status(500).json({ error: "Failed to connect FreeCodeCamp" });
  }
});

// Get FreeCodeCamp sync status
router.get("/freecodecamp/status", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;

    const sync = await db.freeCodeCampSync.findUnique({
      where: { userId },
    });

    if (!sync) {
      return res.json({ connected: false });
    }

    res.json({
      connected: true,
      username: sync.fccUsername,
      lastSynced: sync.lastSynced,
      certifications: sync.certifications,
    });
  } catch (error) {
    console.error("Error fetching FreeCodeCamp status:", error);
    res.status(500).json({ error: "Failed to fetch status" });
  }
});

// Get courses recommended by SAGE
router.get("/recommended", async (req, res) => {
  try {
    const courses = await db.externalCourse.findMany({
      where: { sageRecommended: true },
      orderBy: [
        { africanRelevance: "desc" },
        { workContractCount: "desc" },
      ],
      take: 10,
    });

    res.json(courses);
  } catch (error) {
    console.error("Error fetching recommended courses:", error);
    res.status(500).json({ error: "Failed to fetch recommended courses" });
  }
});

export default router;
