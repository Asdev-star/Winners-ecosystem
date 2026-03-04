// Server/services/certificateService.ts
// Phase 3 V1.1 — Certificate Service
// Handles certificate generation, verification, and PDF output

import { PrismaClient } from "@prisma/client";
import PDFDocument from "pdfkit";

const prisma = new PrismaClient();

interface CertificateData {
  userName: string;
  courseTitle: string;
  issueDate: Date;
  verifyToken: string;
  certificateId: string;
}

// Generate certificate PDF
export async function generateCertificatePDF(certificateId: string): Promise<Buffer> {
  const certificate = await prisma.certificate.findUnique({
    where: { id: certificateId },
    include: {
      user: true,
      course: true,
      enrollment: true
    }
  });

  if (!certificate) {
    throw new Error("Certificate not found");
  }

  const doc = new PDFDocument({
    layout: "landscape",
    size: "A4",
    margins: { top: 50, bottom: 50, left: 50, right: 50 }
  });

  const chunks: Buffer[] = [];
  
  return new Promise((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // Background gradient
    doc.rect(0, 0, doc.page.width, doc.page.height).fill("#0D1520");
    
    // Border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
       .lineWidth(3)
       .stroke("#C9A84C"); // Gold

    // Inner border
    doc.rect(30, 30, doc.page.width - 60, doc.page.height - 60)
       .lineWidth(1)
       .stroke("#2B5F8E"); // Blue

    // Title
    doc.fillColor("#C9A84C")
       .fontSize(36)
       .font("Helvetica-Bold")
       .text("CERTIFICATE OF COMPLETION", 0, 80, { align: "center" });

    // Subtitle
    doc.fillColor("#E8EEF5")
       .fontSize(14)
       .font("Helvetica")
       .text("This is to certify that", 0, 140, { align: "center" });

    // User name
    doc.fillColor("#C9A84C")
       .fontSize(32)
       .font("Helvetica-Bold")
       .text(certificate.user.name || certificate.user.email, 0, 180, { align: "center" });

    // Completion text
    doc.fillColor("#E8EEF5")
       .fontSize(14)
       .font("Helvetica")
       .text("has successfully completed the course", 0, 240, { align: "center" });

    // Course title
    doc.fillColor("#89C4E1") // Ice blue
       .fontSize(24)
       .font("Helvetica-Bold")
       .text(certificate.course.title, 0, 280, { align: "center" });

    // Date
    const formattedDate = certificate.issuedAt.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
    
    doc.fillColor("#5A7A96")
       .fontSize(12)
       .font("Helvetica")
       .text(`Issued on ${formattedDate}`, 0, 340, { align: "center" });

    // Certificate ID
    doc.fillColor("#5A7A96")
       .fontSize(10)
       .text(`Certificate ID: ${certificate.id}`, 50, doc.page.height - 60);

    // Verification URL
    doc.text(`Verify at: winnersempire.io/verify/${certificate.verifyToken}`, doc.page.width - 250, doc.page.height - 60);

    // Winners Ecosystem branding
    doc.fillColor("#C9A84C")
       .fontSize(10)
       .text("WINNERS ECOSYSTEM", doc.page.width / 2 - 50, doc.page.height - 30);

    doc.end();
  });
}

// Verify certificate by token
export async function verifyCertificate(token: string): Promise<{
  valid: boolean;
  certificate?: CertificateData;
  message?: string;
}> {
  const certificate = await prisma.certificate.findUnique({
    where: { verifyToken: token },
    include: {
      user: {
        select: { name: true, email: true }
      },
      course: {
        select: { title: true }
      }
    }
  });

  if (!certificate) {
    return {
      valid: false,
      message: "Certificate not found or invalid verification token"
    };
  }

  return {
    valid: true,
    certificate: {
      userName: certificate.user.name || certificate.user.email,
      courseTitle: certificate.course.title,
      issueDate: certificate.issuedAt,
      verifyToken: certificate.verifyToken,
      certificateId: certificate.id
    }
  };
}

// Check if user is eligible for certificate (all lessons completed)
export async function checkCertificateEligibility(enrollmentId: string): Promise<{
  eligible: boolean;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  missingLessons: string[];
}> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      course: {
        include: {
          modules: {
            include: {
              lessons: true
            }
          }
        }
      },
      progress: true
    }
  });

  if (!enrollment) {
    return {
      eligible: false,
      progress: 0,
      completedLessons: 0,
      totalLessons: 0,
      missingLessons: []
    };
  }

  // Count total lessons
  const totalLessons = enrollment.course.modules.reduce(
    (acc, mod) => acc + mod.lessons.length, 0
  );

  // Count completed lessons
  const completedLessons = enrollment.progress.filter(p => p.completed).length;

  // Calculate progress
  const progress = totalLessons > 0 
    ? Math.round((completedLessons / totalLessons) * 100) 
    : 0;

  // Get missing lessons
  const completedLessonIds = enrollment.progress
    .filter(p => p.completed)
    .map(p => p.lessonId);

  const missingLessons: string[] = [];
  for (const mod of enrollment.course.modules) {
    for (const lesson of mod.lessons) {
      if (!completedLessonIds.includes(lesson.id)) {
        missingLessons.push(lesson.title);
      }
    }
  }

  return {
    eligible: progress === 100,
    progress,
    completedLessons,
    totalLessons,
    missingLessons
  };
}

// Generate certificate readiness report (SAGE integration)
export async function generateCertificateReadinessReport(
  enrollmentId: string
): Promise<{
  overallScore: number;
  ready: boolean;
  quizAverage: number;
  completionRate: number;
  timeInvestment: number;
  gaps: Array<{ module: string; issue: string; recommendation: string }>;
  workOpportunitiesUnlocked: number;
  estimatedRateIncrease: number;
}> {
  const enrollment = await prisma.enrollment.findUnique({
    where: { id: enrollmentId },
    include: {
      course: {
        include: {
          modules: {
            include: {
              lessons: true
            }
          }
        }
      },
      progress: true
    }
  });

  if (!enrollment) {
    throw new Error("Enrollment not found");
  }

  // Calculate completion rate
  const totalLessons = enrollment.course.modules.reduce(
    (acc, mod) => acc + mod.lessons.length, 0
  );
  const completedLessons = enrollment.progress.filter(p => p.completed).length;
  const completionRate = totalLessons > 0 
    ? Math.round((completedLessons / totalLessons) * 100) 
    : 0;

  // Calculate quiz average (placeholder - would query quiz attempts)
  const quizAverage = 0; // TODO: Add quiz attempts query

  // Calculate time investment (placeholder - would calculate from watchedSecs)
  const timeInvestment = Math.round(completedLessons * 15); // Assume 15 min per lesson

  // Generate gaps
  const gaps: Array<{ module: string; issue: string; recommendation: string }> = [];
  
  if (completionRate < 100) {
    const remaining = 100 - completionRate;
    gaps.push({
      module: "Course",
      issue: `${remaining}% of course content not completed`,
      recommendation: "Complete all lessons before requesting certificate"
    });
  }

  if (quizAverage < 70) {
    gaps.push({
      module: "Quizzes",
      issue: `Quiz average (${quizAverage}%) below passing score`,
      recommendation: "Review module content and retake quizzes"
    });
  }

  // Work opportunities unlocked (placeholder - would query Work layer)
  const workOpportunitiesUnlocked = 0;

  // Estimated rate increase (placeholder)
  const estimatedRateIncrease = 15; // 15% average increase for certified professionals

  // Calculate overall score
  const overallScore = Math.round(
    (completionRate * 0.5) + (quizAverage * 0.3) + (15 * 0.2)
  );

  return {
    overallScore,
    ready: completionRate >= 100,
    quizAverage,
    completionRate,
    timeInvestment,
    gaps,
    workOpportunitiesUnlocked,
    estimatedRateIncrease
  };
}

export default {
  generateCertificatePDF,
  verifyCertificate,
  checkCertificateEligibility,
  generateCertificateReadinessReport
};
