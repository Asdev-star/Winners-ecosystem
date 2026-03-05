import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";
import { createCourseCheckoutSession } from "../services/stripeService.js";

const router = Router();

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asOptionalString(value: unknown) {
  const parsed = asString(value).trim();
  return parsed.length > 0 ? parsed : null;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asInt(value: unknown, fallback = 0) {
  return Math.trunc(asNumber(value, fallback));
}

function withCourseStats<T extends { enrollments: { id: string }[]; reviews: { rating: number; body: string | null; user?: { name: string } | null }[] }>(
  course: T,
) {
  const reviewCount = course.reviews.length;
  const ratingSum = course.reviews.reduce((sum, review) => sum + review.rating, 0);

  return {
    ...course,
    tags: [],
    enrollmentCount: course.enrollments.length,
    averageRating: reviewCount > 0 ? ratingSum / reviewCount : 0,
    reviews: course.reviews.map((review) => ({
      ...review,
      comment: review.body ?? "",
    })),
  };
}

router.get("/courses", async (_req, res) => {
  try {
    const courses = await db.course.findMany({
      where: { published: true, deletedAt: null },
      include: {
        instructor: { select: { name: true, email: true } },
        modules: {
          include: {
            lessons: { orderBy: { order: "asc" } },
          },
          orderBy: { order: "asc" },
        },
        enrollments: { select: { id: true } },
        reviews: {
          include: { user: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(courses.map(withCourseStats));
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
});

// Instructor: Get my courses
router.get("/instructor/courses", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const courses = await db.course.findMany({
      where: { 
        instructorId: req.user.userId,
        tenantId: req.user.tenantId,
        deletedAt: null 
      },
      include: {
        instructor: { select: { name: true, email: true } },
        modules: {
          include: {
            lessons: { orderBy: { order: "asc" } },
          },
          orderBy: { order: "asc" },
        },
        enrollments: { select: { id: true, userId: true, createdAt: true } },
        reviews: {
          include: { user: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(courses.map(withCourseStats));
  } catch (error) {
    console.error("Error fetching instructor courses:", error);
    res.status(500).json({ error: "Failed to fetch instructor courses" });
  }
});

router.get("/courses/:id", async (req, res) => {
  try {
    const courseKey = String(req.params.id ?? "");

    const course = await db.course.findFirst({
      where: {
        published: true,
        deletedAt: null,
        OR: [{ id: courseKey }, { slug: courseKey }],
      },
      include: {
        instructor: { select: { name: true, email: true } },
        modules: {
          include: {
            lessons: { orderBy: { order: "asc" } },
          },
          orderBy: { order: "asc" },
        },
        enrollments: { select: { id: true } },
        reviews: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(withCourseStats(course));
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ error: "Failed to fetch course" });
  }
});

router.post("/courses", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const title = asString(req.body?.title).trim();
    const description = asString(req.body?.description).trim();
    const category = asString(req.body?.category).trim();

    if (!title || !description || !category) {
      return res.status(400).json({ error: "title, description, and category are required" });
    }

    const course = await db.course.create({
      data: {
        tenantId: req.user.tenantId,
        instructorId: req.user.userId,
        title,
        slug: asOptionalString(req.body?.slug) ?? toSlug(title),
        description,
        about: asOptionalString(req.body?.about),
        thumbnail: asOptionalString(req.body?.thumbnail),
        previewVideo: asOptionalString(req.body?.previewVideo),
        category,
        price: asNumber(req.body?.price, 0),
        currency: asOptionalString(req.body?.currency) ?? "USD",
        published: Boolean(req.body?.published),
      },
    });

    res.status(201).json({
      ...course,
      tags: [],
      enrollmentCount: 0,
      averageRating: 0,
      reviews: [],
    });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ error: "Failed to create course" });
  }
});

router.put("/courses/:id", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const courseId = String(req.params.id ?? "");
    const course = await db.course.findUnique({ where: { id: courseId } });

    if (!course || course.instructorId !== req.user.userId || course.tenantId !== req.user.tenantId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const updateData: Record<string, unknown> = {};

    if (req.body?.title !== undefined) updateData.title = asString(req.body.title).trim();
    if (req.body?.slug !== undefined) updateData.slug = toSlug(asString(req.body.slug));
    if (req.body?.description !== undefined) updateData.description = asString(req.body.description).trim();
    if (req.body?.about !== undefined) updateData.about = asOptionalString(req.body.about);
    if (req.body?.thumbnail !== undefined) updateData.thumbnail = asOptionalString(req.body.thumbnail);
    if (req.body?.previewVideo !== undefined) updateData.previewVideo = asOptionalString(req.body.previewVideo);
    if (req.body?.category !== undefined) updateData.category = asString(req.body.category).trim();
    if (req.body?.price !== undefined) updateData.price = asNumber(req.body.price, course.price);
    if (req.body?.currency !== undefined) updateData.currency = asString(req.body.currency).trim() || course.currency;
    if (req.body?.published !== undefined) updateData.published = Boolean(req.body.published);

    const updatedCourse = await db.course.update({
      where: { id: courseId },
      data: updateData,
    });

    res.json({ ...updatedCourse, tags: [] });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ error: "Failed to update course" });
  }
});

router.post("/courses/:courseId/modules", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const courseId = String(req.params.courseId ?? "");
    const title = asString(req.body?.title).trim();

    if (!title) {
      return res.status(400).json({ error: "title is required" });
    }

    const course = await db.course.findUnique({ where: { id: courseId } });

    if (!course || course.instructorId !== req.user.userId || course.tenantId !== req.user.tenantId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const moduleRecord = await db.module.create({
      data: {
        courseId,
        title,
        description: asOptionalString(req.body?.description),
        order: asInt(req.body?.order, 0),
      },
    });

    res.status(201).json(moduleRecord);
  } catch (error) {
    console.error("Error creating module:", error);
    res.status(500).json({ error: "Failed to create module" });
  }
});

router.post("/modules/:moduleId/lessons", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const moduleId = String(req.params.moduleId ?? "");
    const title = asString(req.body?.title).trim();

    if (!title) {
      return res.status(400).json({ error: "title is required" });
    }

    const moduleRecord = await db.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });

    if (!moduleRecord || moduleRecord.course.instructorId !== req.user.userId || moduleRecord.course.tenantId !== req.user.tenantId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const lesson = await db.lesson.create({
      data: {
        moduleId,
        title,
        description: asOptionalString(req.body?.description),
        content: asOptionalString(req.body?.content),
        videoUrl: asOptionalString(req.body?.videoUrl),
        duration: asInt(req.body?.duration, 0),
        order: asInt(req.body?.order, 0),
        isFree: Boolean(req.body?.isFree),
      },
    });

    res.status(201).json(lesson);
  } catch (error) {
    console.error("Error creating lesson:", error);
    res.status(500).json({ error: "Failed to create lesson" });
  }
});

router.post("/courses/:courseId/enroll", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const courseId = String(req.params.courseId ?? "");
    const userId = req.user.userId;

    // Get course to check if it's paid
    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    // Check if course is paid - redirect to checkout
    if (course.price > 0) {
      const baseUrl = process.env.APP_URL || "https://winners-empire-eco.up.railway.app";
      
      const session = await createCourseCheckoutSession({
        courseId: course.id,
        courseTitle: course.title,
        price: course.price,
        currency: course.currency || "usd",
        userId: req.user.userId,
        tenantId: req.user.tenantId,
        email: req.user.email || "",
        successUrl: `${baseUrl}/academy/courses/${course.slug}?enrolled=true`,
        cancelUrl: `${baseUrl}/academy/courses/${course.slug}?enrolled=false`,
      });

      return res.json({ checkoutUrl: session.url });
    }

    // Free course - enroll directly
    const existingEnrollment = await db.enrollment.findUnique({
      where: { courseId_userId: { courseId, userId } },
    });

    if (existingEnrollment) {
      return res.status(400).json({ error: "Already enrolled" });
    }

    const enrollment = await db.enrollment.create({
      data: {
        courseId,
        userId,
      },
      include: { progress: true, course: true },
    });

    res.status(201).json({
      ...enrollment,
      enrolledAt: enrollment.createdAt,
      progress: enrollment.progress.map((item) => ({
        ...item,
        timeSpent: item.watchedSecs,
      })),
    });
  } catch (error) {
    console.error("Error enrolling in course:", error);
    res.status(500).json({ error: "Failed to enroll" });
  }
});

router.get("/enrollments", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const enrollments = await db.enrollment.findMany({
      where: { userId: req.user.userId },
      include: {
        course: {
          include: {
            instructor: { select: { name: true } },
            modules: {
              include: { lessons: { orderBy: { order: "asc" } } },
              orderBy: { order: "asc" },
            },
          },
        },
        progress: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(
      enrollments.map((enrollment) => ({
        ...enrollment,
        enrolledAt: enrollment.createdAt,
        progress: enrollment.progress.map((item) => ({
          ...item,
          timeSpent: item.watchedSecs,
        })),
      })),
    );
  } catch (error) {
    console.error("Error fetching enrollments:", error);
    res.status(500).json({ error: "Failed to fetch enrollments" });
  }
});

router.post("/lessons/:lessonId/progress", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const lessonId = String(req.params.lessonId ?? "");
    const userId = req.user.userId;
    const completed = Boolean(req.body?.completed);
    const timeSpent = asInt(req.body?.timeSpent, 0);

    const lesson = await db.lesson.findUnique({
      where: { id: lessonId },
      include: {
        module: {
          include: { course: true },
        },
      },
    });

    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    const enrollment = await db.enrollment.findUnique({
      where: {
        courseId_userId: {
          courseId: lesson.module.courseId,
          userId,
        },
      },
    });

    if (!enrollment) {
      return res.status(403).json({ error: "Not enrolled in this course" });
    }

    const progress = await db.lessonProgress.upsert({
      where: {
        enrollmentId_lessonId: {
          enrollmentId: enrollment.id,
          lessonId,
        },
      },
      update: {
        completed,
        watchedSecs: {
          increment: timeSpent,
        },
        completedAt: completed ? new Date() : null,
      },
      create: {
        enrollmentId: enrollment.id,
        lessonId,
        userId,
        completed,
        watchedSecs: timeSpent,
        completedAt: completed ? new Date() : null,
      },
    });

    res.json({
      ...progress,
      timeSpent: progress.watchedSecs,
    });
  } catch (error) {
    console.error("Error updating progress:", error);
    res.status(500).json({ error: "Failed to update progress" });
  }
});

router.post("/courses/:courseId/certificate", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const courseId = String(req.params.courseId ?? "");
    const userId = req.user.userId;

    const enrollment = await db.enrollment.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
      include: { progress: true },
    });

    if (!enrollment) {
      return res.status(403).json({ error: "Not enrolled" });
    }

    const totalLessons = await db.lesson.count({
      where: {
        module: {
          courseId,
        },
      },
    });

    const completedLessons = enrollment.progress.filter((item) => item.completed).length;

    if (totalLessons === 0 || completedLessons < totalLessons) {
      return res.status(400).json({
        error: "Course not completed",
        completed: completedLessons,
        total: totalLessons,
      });
    }

    const existingCertificate = await db.certificate.findUnique({
      where: { enrollmentId: enrollment.id },
    });

    if (existingCertificate) {
      return res.json(existingCertificate);
    }

    const certificate = await db.certificate.create({
      data: {
        enrollmentId: enrollment.id,
        courseId,
        userId,
      },
    });

    res.status(201).json(certificate);
  } catch (error) {
    console.error("Error generating certificate:", error);
    res.status(500).json({ error: "Failed to generate certificate" });
  }
});

router.get("/certificates", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const certificates = await db.certificate.findMany({
      where: { userId: req.user.userId },
      include: {
        course: {
          include: {
            instructor: { select: { name: true } },
          },
        },
      },
      orderBy: { issuedAt: "desc" },
    });

    res.json(certificates);
  } catch (error) {
    console.error("Error fetching certificates:", error);
    res.status(500).json({ error: "Failed to fetch certificates" });
  }
});

router.post("/courses/:courseId/reviews", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const courseId = String(req.params.courseId ?? "");
    const userId = req.user.userId;
    const rating = Math.max(1, Math.min(5, asInt(req.body?.rating, 0)));
    const comment = asOptionalString(req.body?.comment);

    if (!rating) {
      return res.status(400).json({ error: "rating is required (1-5)" });
    }

    const enrollment = await db.enrollment.findUnique({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
    });

    if (!enrollment) {
      return res.status(403).json({ error: "Must be enrolled to review" });
    }

    const review = await db.review.upsert({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
      update: {
        rating,
        body: comment,
      },
      create: {
        courseId,
        userId,
        rating,
        body: comment,
      },
    });

    res.status(201).json({
      ...review,
      comment: review.body ?? "",
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({ error: "Failed to create review" });
  }
});

export default router;
