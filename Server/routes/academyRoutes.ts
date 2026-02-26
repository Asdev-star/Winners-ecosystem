// Server/routes/academyRoutes.ts — Winners Academy API V1.0
// Phase 3: Academy Layer — Courses, Modules, Lessons, Enrollment, Progress, Certificates

import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = Router();
const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// COURSES — CRUD for instructors
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/v1/academy/courses — List all courses (public catalog)
router.get("/courses", async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      where: { published: true },
      include: {
        instructor: { select: { name: true, email: true } },
        modules: { include: { lessons: true } },
        enrollments: { select: { id: true } },
        reviews: { select: { rating: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate average rating and enrollment count
    const coursesWithStats = courses.map(course => ({
      ...course,
      enrollmentCount: course.enrollments.length,
      averageRating: course.reviews.length > 0
        ? course.reviews.reduce((sum, r) => sum + r.rating, 0) / course.reviews.length
        : 0
    }));

    res.json(coursesWithStats);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

// POST /api/v1/academy/courses — Create course (instructor only)
router.post("/courses", authMiddleware, async (req, res) => {
  try {
    const { title, description, price, category, tags, published = false } = req.body;
    const instructorId = req.user!.id;

    const course = await prisma.course.create({
      data: {
        title,
        description,
        price: price || 0,
        category,
        tags: tags || [],
        published,
        instructorId
      }
    });

    res.json(course);
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ error: "Failed to create course" });
  }
});

// GET /api/v1/academy/courses/:id — Get course details
router.get("/courses/:id", async (req, res) => {
  try {
    const courseId = req.params.id;
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: { select: { name: true, email: true } },
        modules: {
          include: {
            lessons: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        },
        enrollments: { select: { id: true } },
        reviews: {
          include: { user: { select: { name: true } } }
        }
      }
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ error: "Failed to fetch course" });
  }
});

// PUT /api/v1/academy/courses/:id — Update course (instructor only)
router.put("/courses/:id", authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.id;
    const instructorId = req.user!.id;

    // Verify ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course || course.instructorId !== instructorId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const { title, description, price, category, tags, published } = req.body;

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        title,
        description,
        price,
        category,
        tags,
        published
      }
    });

    res.json(updatedCourse);
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ error: "Failed to update course" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// MODULES — Course structure
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/v1/academy/courses/:courseId/modules — Add module to course
router.post("/courses/:courseId/modules", authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const instructorId = req.user!.id;
    const { title, description, order } = req.body;

    // Verify course ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course || course.instructorId !== instructorId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const module = await prisma.module.create({
      data: {
        title,
        description,
        order: order || 0,
        courseId
      }
    });

    res.json(module);
  } catch (error) {
    console.error("Error creating module:", error);
    res.status(500).json({ error: "Failed to create module" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// LESSONS — Course content
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/v1/academy/modules/:moduleId/lessons — Add lesson to module
router.post("/modules/:moduleId/lessons", authMiddleware, async (req, res) => {
  try {
    const moduleId = req.params.moduleId;
    const { title, content, videoUrl, order, duration } = req.body;

    // Verify module ownership through course
    const module = await prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true }
    });

    if (!module || module.course.instructorId !== req.user!.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const lesson = await prisma.lesson.create({
      data: {
        title,
        content,
        videoUrl,
        order: order || 0,
        duration: duration || 0,
        moduleId
      }
    });

    res.json(lesson);
  } catch (error) {
    console.error("Error creating lesson:", error);
    res.status(500).json({ error: "Failed to create lesson" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ENROLLMENT — Student enrollment and progress
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/v1/academy/courses/:courseId/enroll — Enroll in course
router.post("/courses/:courseId/enroll", authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.user!.id;

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({ error: "Already enrolled" });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId
      }
    });

    res.json(enrollment);
  } catch (error) {
    console.error("Error enrolling in course:", error);
    res.status(500).json({ error: "Failed to enroll" });
  }
});

// GET /api/v1/academy/enrollments — Get user's enrollments
router.get("/enrollments", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;

    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            instructor: { select: { name: true } },
            modules: { include: { lessons: true } }
          }
        },
        progress: true
      }
    });

    res.json(enrollments);
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    res.status(500).json({ error: "Failed to fetch enrollments" });
  }
});

// POST /api/v1/academy/lessons/:lessonId/progress — Update lesson progress
router.post("/lessons/:lessonId/progress", authMiddleware, async (req, res) => {
  try {
    const lessonId = req.params.lessonId;
    const userId = req.user!.id;
    const { completed, timeSpent } = req.body;

    // Find enrollment for this lesson's course
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: { course: true }
        }
      }
    });

    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: lesson.module.course.id
        }
      }
    });

    if (!enrollment) {
      return res.status(403).json({ error: "Not enrolled in this course" });
    }

    const progress = await prisma.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: enrollment.id,
          lessonId
        }
      },
      update: {
        completed: completed || false,
        timeSpent: {
          increment: timeSpent || 0
        },
        completedAt: completed ? new Date() : null
      },
      create: {
        enrollmentId: enrollment.id,
        lessonId,
        completed: completed || false,
        timeSpent: timeSpent || 0,
        completedAt: completed ? new Date() : null
      }
    });

    res.json(progress);
  } catch (error) {
    console.error("Error updating progress:", error);
    res.status(500).json({ error: "Failed to update progress" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// CERTIFICATES — Completion certificates
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/v1/academy/courses/:courseId/certificate — Generate certificate
router.post("/courses/:courseId/certificate", authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.user!.id;

    // Check enrollment and completion
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      },
      include: {
        course: true,
        progress: {
          include: { lesson: true }
        }
      }
    });

    if (!enrollment) {
      return res.status(403).json({ error: "Not enrolled" });
    }

    // Check if all lessons are completed
    const totalLessons = await prisma.lesson.count({
      where: {
        module: {
          courseId
        }
      }
    });

    const completedLessons = enrollment.progress.filter(p => p.completed).length;

    if (completedLessons < totalLessons) {
      return res.status(400).json({
        error: "Course not completed",
        completed: completedLessons,
        total: totalLessons
      });
    }

    // Generate certificate
    const certificate = await prisma.certificate.create({
      data: {
        userId,
        courseId,
        certificateNumber: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
      }
    });

    res.json(certificate);
  } catch (error) {
    console.error("Error generating certificate:", error);
    res.status(500).json({ error: "Failed to generate certificate" });
  }
});

// GET /api/v1/academy/certificates — Get user's certificates
router.get("/certificates", authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;

    const certificates = await prisma.certificate.findMany({
      where: { userId },
      include: {
        course: {
          include: {
            instructor: { select: { name: true } }
          }
        }
      },
      orderBy: { issuedAt: 'desc' }
    });

    res.json(certificates);
  } catch (error) {
    console.error("Error fetching certificates:", error);
    res.status(500).json({ error: "Failed to fetch certificates" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// REVIEWS — Course reviews and ratings
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/v1/academy/courses/:courseId/reviews — Add review
router.post("/courses/:courseId/reviews", authMiddleware, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const userId = req.user!.id;
    const { rating, comment } = req.body;

    // Check if enrolled and completed
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    if (!enrollment) {
      return res.status(403).json({ error: "Must be enrolled to review" });
    }

    const review = await prisma.review.create({
      data: {
        userId,
        courseId,
        rating,
        comment
      }
    });

    res.json(review);
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Failed to create review" });
  }
});

export default router;