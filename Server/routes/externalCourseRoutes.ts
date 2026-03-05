// @ts-nocheck
// Server/routes/externalCourseRoutes.ts
// Phase 3 — Academy Layer: External Course Integrations (Coursera, FreeCodeCamp, etc.)

import { Router } from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import db from "../db.js";
import { Anthropic } from "@anthropic-ai/sdk";

const router = Router();

// Initialize Anthropic client for certificate extraction
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "",
});

// Certificate import with Claude PDF extraction
router.post("/certificates/import", authMiddleware, async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { platform, certificateData, manualData } = req.body;
    const userId = req.user.userId;

    // If PDF base64 was provided, extract with Claude
    let extractedData = null;
    if (certificateData?.base64) {
      try {
        const extractionPrompt = `This is a certificate from an external learning platform. Extract the following fields as JSON:
{
  "learnerName": string,
  "courseName": string,
  "platform": string,
  "completionDate": string,
  "credentialId": string | null,
  "skills": string[],
  "verificationUrl": string | null,
  "institution": string | null
}
Return ONLY valid JSON. No preamble.`;

        const message = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          messages: [{
            role: "user",
            content: [{
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: certificateData.base64
              }
            }, {
              type: "text",
              text: extractionPrompt
            }]
          }]
        });

        // Parse the response as JSON
        const content = message.content[0];
        if (content.type === "text") {
          extractedData = JSON.parse(content.text);
        }
      } catch (extractError) {
        console.error("Error extracting certificate:", extractError);
        // Continue with manual data if extraction fails
      }
    }

    // Use extracted data or manual data
    const finalData = {
      ...manualData,
      ...extractedData,
    };

    // Map skills to Winners skill taxonomy (simplified)
    const skills = finalData?.skills || [];

    // Create or update enrollment with certificate
    const enrollment = await db.externalCourseEnrollment.upsert({
      where: {
        userId_externalCourseId: {
          userId,
          externalCourseId: finalData.courseName, // This would need proper course ID lookup
        },
      },
      update: {
        certificateUrl: finalData.verificationUrl,
        completedAt: finalData.completionDate ? new Date(finalData.completionDate) : new Date(),
        isSynced: true,
      },
      create: {
        userId,
        externalCourseId: "", // Would need to lookup based on course name
        certificateUrl: finalData.verificationUrl,
        completedAt: finalData.completionDate ? new Date(finalData.completionDate) : new Date(),
        isSynced: true,
        progress: 100,
      },
    });

    res.json({
      success: true,
      enrollment,
      extractedSkills: skills,
      message: "Certificate imported successfully"
    });
  } catch (error) {
    console.error("Error importing certificate:", error);
    res.status(500).json({ error: "Failed to import certificate" });
  }
});

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

// Seed external platforms and courses (public for initial setup)
router.post("/seed", async (req, res) => {
  try {
    // First, ensure we have the default tenant
    const defaultTenant = await db.tenant.findFirst();
    if (!defaultTenant) {
      return res.status(400).json({ error: "No tenant found. Please create a tenant first." });
    }

    const tenantId = defaultTenant.id;

    // Create platforms
    const platforms = [
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
    ];

    for (const p of platforms) {
      await db.externalPlatform.upsert({
        where: { id: p.id },
        update: {},
        create: { id: p.id, name: p.name, icon: p.icon, tenantId },
      });
    }

    // Create seed courses
    const courses = [
      // FreeCodeCamp courses (all free)
      {
        platform: "FREECODECAMP",
        externalId: "responsive-web-design",
        title: "Responsive Web Design Certification",
        description: "Learn HTML5, CSS3, Flexbox, Grid, and Accessibility. Build 5 responsive projects.",
        courseUrl: "https://www.freecodecamp.org/learn/2022/responsive-web-design/",
        category: "Web Development",
        difficulty: "Beginner",
        duration: 300,
        price: 0,
        tags: ["HTML", "CSS", "Responsive Design", "Accessibility"],
        hasCertificate: true,
        certificateType: "Certification",
        sageRecommended: true,
        africanRelevance: 9,
        workContractCount: 156,
        isFeatured: true,
      },
      {
        platform: "FREECODECAMP",
        externalId: "javascript-algorithms",
        title: "JavaScript Algorithms and Data Structures",
        description: "Master JavaScript fundamentals, algorithms, and data structures.",
        courseUrl: "https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures/",
        category: "Programming",
        difficulty: "Intermediate",
        duration: 300,
        price: 0,
        tags: ["JavaScript", "Algorithms", "Data Structures"],
        hasCertificate: true,
        certificateType: "Certification",
        sageRecommended: true,
        africanRelevance: 10,
        workContractCount: 234,
        isFeatured: true,
      },
      {
        platform: "FREECODECAMP",
        externalId: "front-end-libraries",
        title: "Front End Development Libraries",
        description: "Learn Bootstrap, jQuery, Sass, React, Redux in this comprehensive course.",
        courseUrl: "https://www.freecodecamp.org/learn/front-end-development-libraries/",
        category: "Web Development",
        difficulty: "Intermediate",
        duration: 300,
        price: 0,
        tags: ["React", "Redux", "Bootstrap", "jQuery"],
        hasCertificate: true,
        certificateType: "Certification",
        sageRecommended: true,
        africanRelevance: 9,
        workContractCount: 189,
      },
      // Coursera courses
      {
        platform: "COURSERA",
        externalId: "google-it-support",
        title: "Google IT Support Professional Certificate",
        description: "Start your career in IT. Learn computer networking, operating systems, system administration, and security.",
        courseUrl: "https://www.coursera.org/professional-certificates/google-it-support",
        category: "IT Support",
        difficulty: "Beginner",
        duration: 180,
        price: 49,
        tags: ["IT", "Networking", "Security", "System Administration"],
        hasCertificate: true,
        certificateType: "Professional Certificate",
        sageRecommended: true,
        africanRelevance: 9,
        workContractCount: 312,
        isFeatured: true,
      },
      {
        platform: "COURSERA",
        externalId: "ibm-data-science",
        title: "IBM Data Science Professional Certificate",
        description: "Learn data science from scratch. Python, SQL, machine learning, and data visualization.",
        courseUrl: "https://www.coursera.org/professional-certificates/ibm-data-science",
        category: "Data Science",
        difficulty: "Intermediate",
        duration: 300,
        price: 49,
        tags: ["Python", "SQL", "Machine Learning", "Data Visualization"],
        hasCertificate: true,
        certificateType: "Professional Certificate",
        sageRecommended: true,
        africanRelevance: 10,
        workContractCount: 445,
        isFeatured: true,
      },
      {
        platform: "COURSERA",
        externalId: "google-data-analytics",
        title: "Google Data Analytics Professional Certificate",
        description: "Learn data analytics from Google. Spreadsheets, SQL, R, Tableau.",
        courseUrl: "https://www.coursera.org/professional-certificates/google-data-analytics",
        category: "Data Analytics",
        difficulty: "Beginner",
        duration: 180,
        price: 39,
        tags: ["SQL", "R", "Tableau", "Data Analytics"],
        hasCertificate: true,
        certificateType: "Professional Certificate",
        sageRecommended: true,
        africanRelevance: 9,
        workContractCount: 278,
      },
      {
        platform: "COURSERA",
        externalId: "meta-front-end",
        title: "Meta Front-End Developer Professional Certificate",
        description: "Become a front-end developer. HTML, CSS, JavaScript, React, Git.",
        courseUrl: "https://www.coursera.org/professional-certificates/meta-front-end-developer",
        category: "Web Development",
        difficulty: "Beginner",
        duration: 240,
        price: 49,
        tags: ["React", "HTML", "CSS", "JavaScript"],
        hasCertificate: true,
        certificateType: "Professional Certificate",
        sageRecommended: true,
        africanRelevance: 8,
        workContractCount: 198,
      },
      // HubSpot Academy (all free)
      {
        platform: "HUBSPOT",
        externalId: "inbound-marketing",
        title: "Inbound Marketing Certification",
        description: "Master inbound marketing methodology. Content creation, SEO, social promotion, email marketing.",
        courseUrl: "https://academy.hubspot.com/courses/inbound-marketing",
        category: "Digital Marketing",
        difficulty: "Beginner",
        duration: 6,
        price: 0,
        tags: ["SEO", "Content Marketing", "Email Marketing", "Social Media"],
        hasCertificate: true,
        certificateType: "Certification",
        sageRecommended: true,
        africanRelevance: 9,
        workContractCount: 167,
        isFeatured: true,
      },
      {
        platform: "HUBSPOT",
        externalId: "content-marketing",
        title: "Content Marketing Certification",
        description: "Learn to create compelling content that attracts and engages your target audience.",
        courseUrl: "https://academy.hubspot.com/courses/content-marketing",
        category: "Digital Marketing",
        difficulty: "Intermediate",
        duration: 5,
        price: 0,
        tags: ["Content Strategy", "Blogging", "Video Marketing"],
        hasCertificate: true,
        certificateType: "Certification",
        sageRecommended: true,
        africanRelevance: 8,
        workContractCount: 134,
      },
      // Google Skillshop (all free)
      {
        platform: "GOOGLE_SKILLSHOP",
        externalId: "google-analytics",
        title: "Google Analytics Certification",
        description: "Learn Google Analytics 4 from Google. Measure and analyze customer data.",
        courseUrl: "https://skillshop.exceedlms.com/student/curriculum/ ga4",
        category: "Analytics",
        difficulty: "Intermediate",
        duration: 8,
        price: 0,
        tags: ["Google Analytics", "Data Analysis", "Marketing Analytics"],
        hasCertificate: true,
        certificateType: "Certification",
        sageRecommended: true,
        africanRelevance: 9,
        workContractCount: 189,
        isFeatured: true,
      },
      {
        platform: "GOOGLE_SKILLSHOP",
        externalId: "google-ads-fundamentals",
        title: "Google Ads Fundamentals",
        description: "Master Google Ads. Search, Display, Video advertising.",
        courseUrl: "https://skillshop.exceedlms.com/student/curriculum/ google-ads",
        category: "Digital Marketing",
        difficulty: "Beginner",
        duration: 12,
        price: 0,
        tags: ["Google Ads", "PPC", "Paid Search", "Advertising"],
        hasCertificate: true,
        certificateType: "Certification",
        sageRecommended: true,
        africanRelevance: 8,
        workContractCount: 145,
      },
      // ALX Africa
      {
        platform: "ALX_AFRICA",
        externalId: "software-engineering",
        title: "ALX Software Engineering Program",
        description: "Intensive 12-month software engineering program designed for African talent.",
        courseUrl: "https://www.alxafrica.com/software-engineering/",
        category: "Software Engineering",
        difficulty: "Intermediate",
        duration: 365,
        price: 0,
        tags: ["Python", "JavaScript", "Databases", "Web Development"],
        hasCertificate: true,
        certificateType: "Certificate",
        sageRecommended: true,
        africanRelevance: 10,
        workContractCount: 456,
        isFeatured: true,
      },
      // AWS Skill Builder
      {
        platform: "AWS_SKILLBUILDER",
        externalId: "aws-cloud-practitioner",
        title: "AWS Cloud Practitioner Essentials",
        description: " foundational understanding of AWS cloud concepts, services, and value.",
        courseUrl: "https://aws.amazon.com/training/path-cloud-practitioner/",
        category: "Cloud Computing",
        difficulty: "Beginner",
        duration: 8,
        price: 0,
        tags: ["AWS", "Cloud", "Cloud Computing"],
        hasCertificate: true,
        certificateType: "Certification",
        sageRecommended: true,
        africanRelevance: 8,
        workContractCount: 234,
      },
      // LinkedIn Learning
      {
        platform: "LINKEDIN_LEARNING",
        externalId: "react-essential",
        title: "React.js Essential Training",
        description: "Learn to build user interfaces with React.js.",
        courseUrl: "https://www.linkedin.com/learning/react-js-essential-training",
        category: "Web Development",
        difficulty: "Intermediate",
        duration: 3,
        price: 30,
        tags: ["React", "JavaScript", "UI Development"],
        hasCertificate: true,
        certificateType: "Completion Certificate",
        sageRecommended: false,
        africanRelevance: 7,
        workContractCount: 178,
      },
      // Alison (free)
      {
        platform: "ALISON",
        externalId: "digital-marketing",
        title: "Diploma in Digital Marketing",
        description: "Comprehensive digital marketing course covering all aspects of online marketing.",
        courseUrl: "https://alison.com/course/diploma-in-digital-marketing",
        category: "Digital Marketing",
        difficulty: "Beginner",
        duration: 20,
        price: 0,
        tags: ["SEO", "Social Media", "Content Marketing", "Email"],
        hasCertificate: true,
        certificateType: "Diploma",
        sageRecommended: false,
        africanRelevance: 8,
        workContractCount: 123,
      },
    ];

    for (const c of courses) {
      await db.externalCourse.upsert({
        where: {
          platform_externalId: {
            platform: c.platform,
            externalId: c.externalId,
          },
        },
        update: c,
        create: {
          ...c,
          tenantId,
        },
      });
    }

    res.json({
      success: true,
      message: "External platforms and courses seeded successfully",
      platformsCreated: platforms.length,
      coursesCreated: courses.length,
    });
  } catch (error) {
    console.error("Error seeding external courses:", error);
    res.status(500).json({ error: "Failed to seed external courses" });
  }
});

export default router;
