// Server/services/quizService.ts
// Phase 3 V1.1 — Quiz Service
// Handles quiz creation, attempts, grading, and AI-powered generation

import { PrismaClient, QuestionType } from "@prisma/client";

const prisma = new PrismaClient();

interface QuizAnswer {
  questionId: string;
  selectedAnswer: string;
}

interface GradedAnswer {
  questionId: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  points: number;
  maxPoints: number;
}

// Create a quiz for a course/module
export async function createQuiz(data: {
  courseId: string;
  moduleId?: string;
  title: string;
  description?: string;
  passingScore?: number;
  timeLimit?: number;
  shuffleQuestions?: boolean;
  showResults?: boolean;
}) {
  return await prisma.quiz.create({
    data: {
      courseId: data.courseId,
      moduleId: data.moduleId,
      title: data.title,
      description: data.description,
      passingScore: data.passingScore ?? 70,
      timeLimit: data.timeLimit,
      shuffleQuestions: data.shuffleQuestions ?? false,
      showResults: data.showResults ?? true
    }
  });
}

// Add a question to a quiz
export async function addQuestion(data: {
  quizId: string;
  question: string;
  questionType?: QuestionType;
  options: string[];
  correctAnswer: string;
  explanation?: string;
  points?: number;
  order?: number;
}) {
  return await prisma.quizQuestion.create({
    data: {
      quizId: data.quizId,
      question: data.question,
      questionType: data.questionType ?? QuestionType.MULTIPLE_CHOICE,
      options: data.options,
      correctAnswer: data.correctAnswer,
      explanation: data.explanation,
      points: data.points ?? 1,
      order: data.order ?? 0
    }
  });
}

// Start a quiz attempt
export async function startQuizAttempt(quizId: string, userId: string) {
  // Check for existing attempt
  const existing = await prisma.quizAttempt.findUnique({
    where: {
      quizId_userId: { quizId, userId }
    }
  });

  if (existing && existing.completedAt) {
    // User has already completed this quiz
    return { 
      allowed: false, 
      message: "You have already completed this quiz",
      attempt: existing
    };
  }

  // Get quiz with questions
  const quiz = await prisma.quiz.findUnique({
    where: { id: quizId },
    include: {
      questions: {
        orderBy: { order: "asc" }
      }
    }
  });

  if (!quiz) {
    throw new Error("Quiz not found");
  }

  // Create new attempt
  const attempt = await prisma.quizAttempt.create({
    data: {
      quizId,
      userId,
      score: 0,
      percentage: 0,
      passed: false,
      answers: []
    }
  });

  // Return questions (shuffled if enabled)
  let questions = quiz.questions;
  if (quiz.shuffleQuestions) {
    questions = [...questions].sort(() => Math.random() - 0.5);
  }

  // Don't return correct answers!
  return {
    allowed: true,
    attempt,
    quiz: {
      id: quiz.id,
      title: quiz.title,
      timeLimit: quiz.timeLimit,
      showResults: quiz.showResults,
      passingScore: quiz.passingScore,
      questions: questions.map(q => ({
        id: q.id,
        question: q.question,
        questionType: q.questionType,
        options: q.options,
        points: q.points
      }))
    }
  };
}

// Submit quiz answers and grade
export async function submitQuizAttempt(
  attemptId: string,
  userId: string,
  answers: QuizAnswer[],
  timeTakenSecs?: number
): Promise<{
  attempt: {
    id: string;
    score: number;
    percentage: number;
    passed: boolean;
    gradedAnswers: GradedAnswer[];
  };
}> {
  // Get attempt with quiz
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: {
        include: {
          questions: true
        }
      }
    }
  });

  if (!attempt) {
    throw new Error("Quiz attempt not found");
  }

  if (attempt.userId !== userId) {
    throw new Error("Unauthorized");
  }

  if (attempt.completedAt) {
    throw new Error("Quiz already submitted");
  }

  // Grade answers
  let totalScore = 0;
  let maxPoints = 0;
  const gradedAnswers: GradedAnswer[] = [];

  for (const answer of answers) {
    const question = attempt.quiz.questions.find(q => q.id === answer.questionId);
    
    if (!question) {
      continue;
    }

    maxPoints += question.points;
    
    // Check if answer is correct
    const isCorrect = answer.selectedAnswer.toLowerCase().trim() === 
                      question.correctAnswer.toLowerCase().trim();
    
    if (isCorrect) {
      totalScore += question.points;
    }

    gradedAnswers.push({
      questionId: answer.questionId,
      selectedAnswer: answer.selectedAnswer,
      correctAnswer: question.correctAnswer,
      isCorrect,
      points: isCorrect ? question.points : 0,
      maxPoints: question.points
    });
  }

  // Calculate percentage
  const percentage = maxPoints > 0 ? Math.round((totalScore / maxPoints) * 100) : 0;
  const passed = percentage >= attempt.quiz.passingScore;

  // Update attempt
  const updatedAttempt = await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      score: totalScore,
      percentage,
      passed,
      answers: gradedAnswers,
      timeTakenSecs,
      completedAt: new Date()
    }
  });

  return {
    attempt: {
      id: updatedAttempt.id,
      score: totalScore,
      percentage,
      passed,
      gradedAnswers: attempt.quiz.showResults ? gradedAnswers : []
    }
  };
}

// Get quiz results (for viewing after completion)
export async function getQuizResults(attemptId: string, userId: string) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      quiz: {
        include: {
          questions: true
        }
      }
    }
  });

  if (!attempt) {
    throw new Error("Quiz attempt not found");
  }

  if (attempt.userId !== userId) {
    throw new Error("Unauthorized");
  }

  if (!attempt.completedAt) {
    throw new Error("Quiz not yet submitted");
  }

  return {
    attempt: {
      id: attempt.id,
      score: attempt.score,
      percentage: attempt.percentage,
      passed: attempt.passed,
      timeTakenSecs: attempt.timeTakenSecs,
      completedAt: attempt.completedAt,
      answers: attempt.quiz.showResults ? attempt.answers : null
    },
    quiz: {
      title: attempt.quiz.title,
      passingScore: attempt.quiz.passingScore,
      showResults: attempt.quiz.showResults
    }
  };
}

// Get all quiz attempts for a user
export async function getUserQuizAttempts(userId: string, courseId?: string) {
  const where: any = { userId };
  
  if (courseId) {
    where.quiz = { courseId };
  }

  return await prisma.quizAttempt.findMany({
    where,
    include: {
      quiz: {
        select: {
          id: true,
          title: true,
          passingScore: true,
          courseId: true
        }
      }
    },
    orderBy: { startedAt: "desc" }
  });
}

// AI-powered quiz generation (for SAGE integration)
export async function generateQuizWithAI(
  courseId: string,
  moduleId: string,
  lessonContent: string,
  numQuestions: number = 5
): Promise<{
  quiz: any;
  questions: any[];
}> {
  // This would call the AI service to generate questions
  // For now, return a placeholder structure
  
  const quiz = await createQuiz({
    courseId,
    moduleId,
    title: `Module Quiz - Generated`,
    description: `AI-generated quiz based on lesson content`,
    passingScore: 70,
    timeLimit: 15,
    shuffleQuestions: true,
    showResults: true
  });

  // In production, this would call Claude API to generate questions
  // For now, return the created quiz
  return {
    quiz,
    questions: [] // Would be populated by AI
  };
}

export default {
  createQuiz,
  addQuestion,
  startQuizAttempt,
  submitQuizAttempt,
  getQuizResults,
  getUserQuizAttempts,
  generateQuizWithAI
};
