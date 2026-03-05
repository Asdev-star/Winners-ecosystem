// Server/services/externalCourseSeed.ts
// Auto-seed external platforms and courses on server startup

import db from "../db.js";

export async function seedExternalCoursesIfNeeded(): Promise<void> {
  try {
    // Check if platforms already exist
    const existingPlatforms = await db.externalPlatform.findFirst();
    if (existingPlatforms) {
      console.log("✅ External platforms already seeded");
      return;
    }

    console.log("🌱 Seeding external platforms and courses...");

    // Get default tenant
    const defaultTenant = await db.tenant.findFirst();
    if (!defaultTenant) {
      console.log("⚠️ No tenant found, skipping external course seed");
      return;
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
        courseUrl: "https://skillshop.exceedlms.com/student/curriculum/ga4",
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

    console.log(`✅ Seeded ${platforms.length} platforms and ${courses.length} courses`);
  } catch (error) {
    console.error("⚠️ Error seeding external courses:", error);
  }
}
