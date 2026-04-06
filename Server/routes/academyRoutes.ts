import { Router } from "express";
import multer from "multer";
import { Prisma, QuestionType } from "@prisma/client";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";
import { createCourseCheckoutSession } from "../services/stripeService.js";
import { triggerAgenticLoop } from "../services/agenticLoopService.js";
import { recordAdminSignal } from "../services/adminSignalService.js";
import { uploadDocument, uploadVideo } from "../services/cloudinaryService.js";
import {
  buildCertificateVerifyUrl,
  createCertificateIdentifiers,
  generateCertificatePdfBuffer,
} from "../services/certificateGenerator.js";

const router = Router();
const videoUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
      return;
    }
    cb(new Error("Only video files are allowed"));
  },
});

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

function deriveTrustTier(score: number) {
  if (score >= 85) return "PLATINUM";
  if (score >= 70) return "GOLD";
  if (score >= 55) return "SILVER";
  return "BRONZE";
}

function toSentenceFragments(text: string) {
  return text
    .split(/(?:\n+|(?<=[.!?])\s+)/)
    .map((part) => part.trim())
    .filter((part) => part.length >= 24);
}

function keywordSummary(sentence: string) {
  const words = sentence
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length >= 4)
    .filter((word) => !["this", "that", "with", "from", "your", "have", "will", "lesson", "course"].includes(word));
  const unique = Array.from(new Set(words));
  return unique.slice(0, 4).join(" ") || sentence.slice(0, 28);
}

function extractMetadataObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function extractProfileBadges(value: unknown): string[] {
  const metadata = extractMetadataObject(value);
  const profile = extractMetadataObject(metadata.profile);
  const badges = profile.badges;
  if (!Array.isArray(badges)) return [];
  return badges.filter((badge): badge is string => typeof badge === "string" && badge.trim().length > 0);
}

function createGeneratedQuizQuestions(lessonText: string, courseTitle: string) {
  const fragments = toSentenceFragments(lessonText);
  const fallbackFragments = [
    `${courseTitle} focuses on practical application.`,
    `${courseTitle} introduces the core workflow.`,
    `${courseTitle} reinforces the important concepts.`,
    `${courseTitle} highlights the next implementation step.`,
  ];
  const pool = [...fragments, ...fallbackFragments];
  const questions: Array<{
    question: string;
    type: QuestionType;
    options: string[];
    correctAnswer: string;
    explanation: string;
    points: number;
    order: number;
  }> = [];

  for (let index = 0; index < 10; index += 1) {
    const sentence = pool[index % pool.length];
    const keyword = keywordSummary(sentence);
    const distractorOne = `${keyword} strategy`;
    const distractorTwo = `${keyword} fundamentals`;
    const distractorThree = `${keyword} overview`;
    questions.push({
      question: `Which idea best matches this part of ${courseTitle}? "${sentence.slice(0, 120)}${sentence.length > 120 ? "..." : ""}"`,
      type: QuestionType.MULTIPLE_CHOICE,
      options: [keyword, distractorOne, distractorTwo, distractorThree],
      correctAnswer: keyword,
      explanation: sentence,
      points: 1,
      order: index + 1,
    });
  }

  return questions;
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
    const msg = error instanceof Error ? error.message : String(error);
    console.error("Error fetching courses:", msg, error);
    res.status(500).json({ error: "Failed to fetch courses", detail: msg });
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
    const course = await db.course.findUnique({ 
      where: { id: courseId } 
    });

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

    const course = await db.course.findUnique({ 
      where: { id: courseId } 
    });

    if (!course || course.instructorId !== req.user.userId || course.tenantId !== req.user.tenantId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const moduleRecord = await db.module.create({
      data: {
        courseId,
        tenantId: req.user.tenantId,
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
      where: { id_tenantId: { id: moduleId, tenantId: req.user.tenantId } },
      include: { course: true },
    });

    if (!moduleRecord || moduleRecord.course.instructorId !== req.user.userId || moduleRecord.course.tenantId !== req.user.tenantId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const lesson = await db.lesson.create({
      data: {
        moduleId,
        tenantId: req.user.tenantId,
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

router.post("/lessons/:lessonId/video", authMiddleware, videoUpload.single("video"), async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const lessonId = String(req.params.lessonId ?? "");
    const lesson = await db.lesson.findFirst({
      where: { id: lessonId, tenantId: req.user.tenantId },
      include: {
        module: {
          include: { course: true },
        },
      },
    });

    if (!lesson) {
      return res.status(404).json({ error: "Lesson not found" });
    }

    if (lesson.module.course.instructorId !== req.user.userId || lesson.module.course.tenantId !== req.user.tenantId) {
      return res.status(403).json({ error: "Not authorized to update this lesson" });
    }

    const rawVideo = req.file
      ? `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`
      : typeof req.body?.videoData === "string"
        ? req.body.videoData
        : "";

    if (!rawVideo) {
      return res.status(400).json({ error: "video file or videoData is required" });
    }

    const uploaded = await uploadVideo(rawVideo, {
      folder: `winners-academy/${req.user.tenantId}/lessons/${lessonId}`,
    });

    const updatedLesson = await db.lesson.update({
      where: { id: lessonId },
      data: {
        videoId: uploaded.publicId,
        videoUrl: uploaded.secureUrl,
        thumbnailUrl: uploaded.thumbnailUrl ?? null,
        duration: typeof uploaded.duration === "number" ? Math.round(uploaded.duration) : lesson.duration,
      },
    });

    return res.json({
      ...updatedLesson,
      thumbnailUrl: updatedLesson.thumbnailUrl ?? uploaded.thumbnailUrl ?? null,
    });
  } catch (error) {
    console.error("Error uploading lesson video:", error);
    return res.status(500).json({ error: "Failed to upload lesson video" });
  }
});

router.post("/sage/quiz-generate", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const courseId = String(req.body?.courseId ?? "");
    const moduleId = typeof req.body?.moduleId === "string" && req.body.moduleId.trim() ? req.body.moduleId.trim() : null;
    if (!courseId) {
      return res.status(400).json({ error: "courseId is required" });
    }

    const course = await db.course.findFirst({
      where: { id: courseId, tenantId: req.user.tenantId, instructorId: req.user.userId, deletedAt: null },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            lessons: { orderBy: { order: "asc" } },
          },
        },
      },
    });

    if (!course) {
      return res.status(403).json({ error: "Not authorized to generate quizzes for this course" });
    }

    const targetModule = moduleId
      ? course.modules.find((module) => module.id === moduleId) ?? null
      : course.modules[0] ?? null;

    const lessonPool = targetModule
      ? targetModule.lessons
      : course.modules.flatMap((module) => module.lessons);
    const lessonText = lessonPool
      .map((lesson) => `${lesson.title}. ${lesson.description ?? ""} ${lesson.content ?? ""}`)
      .join("\n\n")
      .trim();

    if (!lessonText) {
      return res.status(400).json({ error: "Add lesson content before generating a quiz" });
    }

    const quiz = await db.quiz.create({
      data: {
        tenantId: req.user.tenantId,
        courseId,
        moduleId: targetModule?.id ?? moduleId,
        title: `${course.title} · SAGE Quiz`,
        description: `Auto-generated from ${targetModule?.title ?? course.title}`,
        passingScore: asInt(req.body?.passingScore, 70) || 70,
        showResults: true,
        shuffleQuestions: false,
      },
    });

    const generatedQuestions = createGeneratedQuizQuestions(lessonText, course.title);
    const questions = await Promise.all(
      generatedQuestions.map((question) =>
        db.quizQuestion.create({
          data: {
            tenantId: req.user!.tenantId,
            quizId: quiz.id,
            question: question.question,
            questionType: question.type,
            options: question.options,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            points: question.points,
            order: question.order,
          },
        }),
      ),
    );

    return res.status(201).json({ ...quiz, questions });
  } catch (error) {
    console.error("Error generating quiz:", error);
    return res.status(500).json({ error: "Failed to generate quiz" });
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
      where: { courseId_userId_tenantId: { courseId, userId, tenantId: req.user.tenantId } },
    });

    if (existingEnrollment) {
      return res.status(400).json({ error: "Already enrolled" });
    }

    const enrollment = await db.enrollment.create({
      data: {
        tenantId: req.user.tenantId,
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

    triggerAgenticLoop({
      userId,
      tenantId: req.user!.tenantId,
      triggerType: "course_enrolled",
      layer: "academy",
      data: { courseId, courseTitle: enrollment.course.title },
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

    const enrollment = await db.enrollment.findFirst({
      where: {
        courseId: lesson.module.courseId,
        userId,
        tenantId: req.user.tenantId,
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
        tenantId: req.user.tenantId,
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

    if (completed) {
      triggerAgenticLoop({
        userId,
        tenantId: req.user!.tenantId,
        triggerType: "lesson_completed",
        layer: "academy",
        data: { lessonId, courseId: lesson.module.courseId, courseTitle: lesson.module.course.title },
      });
    }
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

    const enrollment = await db.enrollment.findFirst({
      where: {
        courseId,
        userId,
        tenantId: req.user.tenantId,
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

    const quizzes = await db.quiz.findMany({
      where: {
        courseId,
        tenantId: req.user.tenantId,
      },
      select: {
        id: true,
        title: true,
        passingScore: true,
      },
    });

    if (quizzes.length > 0) {
      const passedQuizAttempts = await db.quizAttempt.findMany({
        where: {
          tenantId: req.user.tenantId,
          userId,
          quizId: { in: quizzes.map((quiz) => quiz.id) },
          passed: true,
        },
        select: { quizId: true },
      });

      if (passedQuizAttempts.length < quizzes.length) {
        return res.status(400).json({
          error: "All quizzes must be passed before a certificate can be issued",
          completedQuizzes: passedQuizAttempts.length,
          totalQuizzes: quizzes.length,
        });
      }
    }

    const existingCertificate = await db.certificate.findUnique({
      where: { enrollmentId: enrollment.id },
    });

    if (existingCertificate) {
      return res.json(existingCertificate);
    }

    const [course, user] = await Promise.all([
      db.course.findFirst({
        where: { id: courseId, tenantId: req.user.tenantId, deletedAt: null },
        select: { title: true, description: true, slug: true, category: true },
      }),
      db.user.findFirst({
        where: { id: userId, tenantId: req.user.tenantId, deletedAt: null },
        select: { name: true, email: true, trustScore: true, metadata: true },
      }),
    ]);

    if (!course || !user) {
      return res.status(404).json({ error: "Course or user not found" });
    }

    const { certNumber, verificationCode } = createCertificateIdentifiers();
    const verifyUrl = buildCertificateVerifyUrl(certNumber);
    const pdfBuffer = await generateCertificatePdfBuffer({
      userName: user.name || user.email,
      courseTitle: course.title,
      issuedAt: new Date(),
      certNumber,
      verificationCode,
      verifyUrl,
      courseDescription: course.description,
    });
    const pdfDataUri = `data:application/pdf;base64,${pdfBuffer.toString("base64")}`;
    const uploadedPdf = await uploadDocument(pdfDataUri, {
      folder: `winners-academy/${req.user.tenantId}/certificates/${courseId}`,
    });

    const badgeLabel = `Certified: ${course.title}`;
    const updatedTrust = Math.min(100, (user.trustScore ?? 50) + 30);
    const badges = Array.from(new Set([...extractProfileBadges(user.metadata), badgeLabel]));
    const userMetadata = extractMetadataObject(user.metadata);
    const nextProfile = extractMetadataObject(userMetadata.profile);
    nextProfile.badges = badges;
    userMetadata.profile = nextProfile;

    const certificate = await db.certificate.create({
      data: {
        tenantId: req.user.tenantId,
        enrollmentId: enrollment.id,
        courseId,
        userId,
        certNumber,
        verificationCode,
        verifyToken: verificationCode,
        pdfUrl: uploadedPdf.secureUrl,
        pdfPublicId: uploadedPdf.publicId,
      },
    });

    await db.user.update({
      where: { id: userId },
      data: {
        trustScore: updatedTrust,
        trustScoreTier: deriveTrustTier(updatedTrust),
        trustScoreUpdatedAt: new Date(),
        metadata: userMetadata as Prisma.InputJsonValue,
      },
    });

    res.status(201).json(certificate);

    recordAdminSignal({
      kind: "sage:cert_issued",
      supervisor: "SAGE",
      supervisorEmoji: "SAGE -> CIRCUIT",
      layerId: "academy",
      layerName: "Academy",
      adminPath: "/admin/platform/academy",
      title: `${user?.name ?? user?.email ?? "A learner"} earned a certificate`,
      message: `${user?.name ?? user?.email ?? "A learner"} earned ${course?.title ?? "a certificate"}. CIRCUIT is preparing the next match.`,
      metadata: {
        certificateId: certificate.id,
        courseId,
        courseTitle: course?.title ?? null,
        certificateNumber: certNumber,
      },
    });

    triggerAgenticLoop({
      userId,
      tenantId: req.user!.tenantId,
      triggerType: "certificate_earned",
      layer: "academy",
      data: { certificateId: certificate.id, courseId },
    });
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

// Public certificate verification endpoint by certificate number
router.get("/verify/:certNumber", async (req, res) => {
  try {
    const certNumber = String(req.params.certNumber ?? "").trim();

    const certificate = await db.certificate.findUnique({
      where: { certNumber },
      include: {
        user: {
          select: { name: true, email: true },
        },
        course: {
          select: { title: true, description: true, slug: true },
        },
      },
    });

    if (!certificate) {
      return res.status(404).json({
        valid: false,
        message: "Certificate not found or invalid certificate number",
      });
    }

    return res.json({
      valid: true,
      certificate: {
        id: certificate.id,
        certNumber: certificate.certNumber,
        verificationCode: certificate.verificationCode,
        userName: certificate.user.name || certificate.user.email,
        courseTitle: certificate.course.title,
        courseDescription: certificate.course.description,
        issuedAt: certificate.issuedAt,
        pdfUrl: certificate.pdfUrl,
        verifyUrl: buildCertificateVerifyUrl(certificate.certNumber),
      },
    });
  } catch (error) {
    console.error("Error verifying certificate:", error);
    return res.status(500).json({ error: "Failed to verify certificate" });
  }
});

// Legacy verification endpoint retained for existing tokens
router.get("/certificates/verify/:token", async (req, res) => {
  try {
    const { token } = req.params;
    
    const certificate = await db.certificate.findUnique({
      where: { verifyToken: token },
      include: {
        user: {
          select: { name: true, email: true }
        },
        course: {
          select: { title: true, description: true }
        }
      }
    });

    if (!certificate) {
      return res.status(404).json({ 
        valid: false, 
        message: "Certificate not found or invalid verification token" 
      });
    }

    res.json({
      valid: true,
      certificate: {
        id: certificate.id,
        certNumber: certificate.certNumber,
        userName: certificate.user.name || certificate.user.email,
        courseTitle: certificate.course.title,
        courseDescription: certificate.course.description,
        issuedAt: certificate.issuedAt,
        verifyToken: certificate.verifyToken,
        pdfUrl: certificate.pdfUrl,
      }
    });
  } catch (error) {
    console.error("Error verifying certificate:", error);
    res.status(500).json({ error: "Failed to verify certificate" });
  }
});

// Download certificate as PDF
router.get("/certificates/:certificateId/pdf", authMiddleware, async (req, res) => {
  try {
    const certificateId = String(req.params.certificateId);
    const userId = req.user!.userId;

    const certificate = await db.certificate.findFirst({
      where: { 
        id: certificateId,
        userId 
      },
      include: {
        course: true,
        user: true
      }
    });

    if (!certificate) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    // Generate PDF using certificate service
    const pdfBuffer = await generateCertificatePdfBuffer({
      userName: certificate.user.name || certificate.user.email,
      courseTitle: certificate.course.title,
      courseDescription: certificate.course.description,
      issuedAt: certificate.issuedAt,
      certNumber: certificate.certNumber,
      verificationCode: certificate.verificationCode,
      verifyUrl: buildCertificateVerifyUrl(certificate.certNumber),
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="certificate-${certificateId}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating certificate PDF:", error);
    res.status(500).json({ error: "Failed to generate certificate PDF" });
  }
});

router.delete("/courses/:id", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const courseId = String(req.params.id ?? "");
    const course = await db.course.findUnique({
      where: { id: courseId },
    });

    if (!course || course.instructorId !== req.user.userId || course.tenantId !== req.user.tenantId) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await db.course.update({
      where: { id: courseId },
      data: { deletedAt: new Date() },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ error: "Failed to delete course" });
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

    const enrollment = await db.enrollment.findFirst({
      where: {
        courseId,
        userId,
        tenantId: req.user!.tenantId,
      },
    });

    if (!enrollment) {
      return res.status(403).json({ error: "Must be enrolled to review" });
    }

    const review = await db.review.upsert({
      where: {
        courseId_userId_tenantId: {
          courseId,
          userId,
          tenantId: req.user!.tenantId,
        },
      },
      update: {
        rating,
        body: comment,
      },
      create: {
        tenantId: req.user!.tenantId,
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
