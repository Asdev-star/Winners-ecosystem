// Server/routes/quizRoutes.ts
// Phase 3 V1.1 — Quiz Routes
// Handles quiz CRUD, attempts, grading, and AI-powered generation

import { Router } from "express";
import { QuestionType } from "@prisma/client";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";

const router = Router();

// Create a new quiz for a course/module
router.post("/quizzes", authMiddleware, async (req, res) => {
  try {
    const { courseId, moduleId, title, description, passingScore, timeLimit, shuffleQuestions, showResults } = req.body;
    const tenantId = req.user!.tenantId;
    
    const quiz = await db.quiz.create({
      data: {
        tenantId,
        courseId,
        moduleId,
        title,
        description,
        passingScore: passingScore ?? 70,
        timeLimit,
        shuffleQuestions: shuffleQuestions ?? false,
        showResults: showResults ?? true
      }
    });
    
    res.status(201).json(quiz);
  } catch (error) {
    console.error("Error creating quiz:", error);
    res.status(500).json({ error: "Failed to create quiz" });
  }
});

// Get all quizzes for a course
router.get("/courses/:courseId/quizzes", async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const quizzes = await db.quiz.findMany({
      where: { courseId },
      include: {
        questions: {
          orderBy: { order: "asc" }
        }
      },
      orderBy: { createdAt: "asc" }
    });
    
    res.json(quizzes);
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    res.status(500).json({ error: "Failed to fetch quizzes" });
  }
});

// Get a specific quiz with questions
router.get("/quizzes/:quizId", async (req, res) => {
  try {
    const { quizId } = req.params;
    
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { order: "asc" }
        }
      }
    });
    
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }

    const course = await db.course.findFirst({
      where: { id: quiz.courseId, deletedAt: null },
      select: { id: true, slug: true, title: true },
    });

    res.json({ ...quiz, course });
  } catch (error) {
    console.error("Error fetching quiz:", error);
    res.status(500).json({ error: "Failed to fetch quiz" });
  }
});

// Add a question to a quiz
router.post("/quizzes/:quizId/questions", authMiddleware, async (req, res) => {
  try {
    const quizId = String(req.params.quizId);
    const { question, type, options, correctAnswer, points, order, explanation } = req.body;
    const tenantId = req.user!.tenantId;
    
    // Get the current max order for this quiz
    const lastQuestion = await db.quizQuestion.findFirst({
      where: { quizId },
      orderBy: { order: "desc" }
    });
    
    const newOrder = order ?? (lastQuestion ? lastQuestion.order + 1 : 1);
    
    const newQuestion = await db.quizQuestion.create({
      data: {
        tenantId,
        quizId,
        question,
        questionType: type as QuestionType,
        options: options ?? [],
        correctAnswer,
        points: points ?? 1,
        order: newOrder,
        explanation
      }
    });
    
    res.status(201).json(newQuestion);
  } catch (error) {
    console.error("Error adding question:", error);
    res.status(500).json({ error: "Failed to add question" });
  }
});

// Submit a quiz attempt
router.post("/quizzes/:quizId/attempts", authMiddleware, async (req, res) => {
  try {
    const quizId = String(req.params.quizId);
    const { answers } = req.body; // Array of { questionId, selectedAnswer }
    const userId = req.user!.userId;
    
    const quiz = await db.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true
      }
    });
    
    if (!quiz) {
      return res.status(404).json({ error: "Quiz not found" });
    }
    
    // Grade the answers
    let totalPoints = 0;
    let earnedPoints = 0;
    const gradedAnswers = quiz.questions.map((question) => {
      const userAnswer = answers.find((a: { questionId: string }) => a.questionId === question.id);
      const selectedAnswer = userAnswer?.selectedAnswer ?? "";
      const isCorrect = selectedAnswer.toLowerCase() === String(question.correctAnswer).toLowerCase();
      
      totalPoints += question.points;
      if (isCorrect) {
        earnedPoints += question.points;
      }
      
      return {
        questionId: question.id,
        selectedAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        points: isCorrect ? question.points : 0,
        maxPoints: question.points
      };
    });
    
    const score = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
    const passed = score >= (quiz.passingScore ?? 70);
    
    // Create the attempt record
    const attempt = await db.quizAttempt.create({
      data: {
        tenantId: req.user!.tenantId,
        userId,
        quizId,
        answers: gradedAnswers,
        score: earnedPoints,
        percentage: score,
        passed,
        startedAt: new Date(),
        completedAt: new Date()
      }
    });
    
    res.status(201).json({
      attempt,
      score,
      passed,
      passingScore: quiz.passingScore,
      gradedAnswers: quiz.showResults ? gradedAnswers : undefined
    });
  } catch (error) {
    console.error("Error submitting quiz attempt:", error);
    res.status(500).json({ error: "Failed to submit quiz attempt" });
  }
});

// Get user's attempts for a quiz
router.get("/quizzes/:quizId/attempts", authMiddleware, async (req, res) => {
  try {
    const quizIdParam = req.params.quizId;
    const quizId = Array.isArray(quizIdParam) ? quizIdParam[0] : (quizIdParam || "");
    const userId = req.user!.userId;
    
    const attempts = await db.quizAttempt.findMany({
      where: {
        quizId,
        userId
      },
      orderBy: { completedAt: "desc" }
    });
    
    res.json(attempts);
  } catch (error) {
    console.error("Error fetching attempts:", error);
    res.status(500).json({ error: "Failed to fetch attempts" });
  }
});

// Get best score for a quiz
router.get("/quizzes/:quizId/best-score", authMiddleware, async (req, res) => {
  try {
    const quizIdParam = req.params.quizId;
    const quizId = Array.isArray(quizIdParam) ? quizIdParam[0] : (quizIdParam || "");
    const userId = req.user!.userId;
    
    const bestAttempt = await db.quizAttempt.findFirst({
      where: {
        quizId,
        userId,
        passed: true
      },
      orderBy: { score: "desc" }
    });
    
    if (!bestAttempt) {
      return res.json({ hasPassed: false, bestScore: null });
    }
    
    res.json({
      hasPassed: true,
      bestScore: bestAttempt.score,
      attemptId: bestAttempt.id,
      completedAt: bestAttempt.completedAt
    });
  } catch (error) {
    console.error("Error fetching best score:", error);
    res.status(500).json({ error: "Failed to fetch best score" });
  }
});

// Delete a quiz
router.delete("/quizzes/:quizId", async (req, res) => {
  try {
    const { quizId } = req.params;
    
    // Delete associated questions first
    await db.quizQuestion.deleteMany({ where: { quizId } });
    await db.quizAttempt.deleteMany({ where: { quizId } });
    await db.quiz.delete({ where: { id: quizId } });
    
    res.json({ message: "Quiz deleted successfully" });
  } catch (error) {
    console.error("Error deleting quiz:", error);
    res.status(500).json({ error: "Failed to delete quiz" });
  }
});

export default router;
