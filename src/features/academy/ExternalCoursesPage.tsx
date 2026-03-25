// src/features/academy/ExternalCoursesPage.tsx
// Phase 3 — Academy Layer: External Course Integrations
// Browse and enroll in Coursera, FreeCodeCamp, Udemy courses

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../lib/api";
import { getAuthHeaders } from "../auth/authStore";
import ContextBar from "../../components/ui/ContextBar";

interface ExternalCourse {
  id: string;
  platform: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  courseUrl: string;
  instructor?: string;
  duration?: number;
  category?: string;
  tags: string[];
  price: number;
  currency: string;
  rating?: number;
  enrollmentCount: number;
  isVerified: boolean;
  isFeatured?: boolean;
  sageRecommended?: boolean;
  africanRelevance?: number;
  workContractCount?: number;
  hasCertificate?: boolean;
  certificateType?: string;
}

const PLATFORM_ICONS: Record<string, string> = {
  COURSERA: "🎓",
  UNIATHENA: "🎯",
  FREECODECAMP: "🔥",
  UDEMY: "💡",
  EDX: "📚",
  KHAN_ACADEMY: "🧠",
  PLURALSIGHT: "💻",
  LINKEDIN_LEARNING: "💼",
  GOOGLE_SKILLSHOP: "🔍",
  HUBSPOT: "📈",
  ALISON: "📖",
  AWS_SKILLBUILDER: "☁️",
  MICROSOFT_LEARN: "🪟",
  ALX_AFRICA: "🌍",
  ANDELA: "⚡",
};

// Fallback mock data when API fails or no courses seeded
const MOCK_EXTERNAL_COURSES: ExternalCourse[] = [
  {
    id: "mock-1",
    platform: "FREECODECAMP",
    title: "Responsive Web Design",
    description: "Learn HTML, CSS, and responsive design principles to build modern websites.",
    thumbnailUrl: "https://www.freecodecamp.org/news/content/images/size/w600/2021/08/fcc_secondary_logo.png",
    courseUrl: "https://www.freecodecamp.org/learn/2022/responsive-web-design/",
    instructor: "FreeCodeCamp",
    duration: 300,
    category: "Web Development",
    tags: ["HTML", "CSS", "Responsive Design"],
    price: 0,
    currency: "USD",
    rating: 4.8,
    enrollmentCount: 2500000,
    isVerified: true,
    isFeatured: true,
    sageRecommended: true,
    africanRelevance: 95,
    workContractCount: 1500,
    hasCertificate: true,
    certificateType: "FreeCodeCamp Certificate"
  },
  {
    id: "mock-2",
    platform: "COURSERA",
    title: "Machine Learning Specialization",
    description: "Master fundamental ML concepts, algorithms, and practical applications from Stanford.",
    thumbnailUrl: "https://d3njjcbhboqi7l.cloudfront.net/course-images/v1/BerkeleyX/CS189x-3T2020/thumbnail-v1.jpg",
    courseUrl: "https://www.coursera.org/specializations/machine-learning-introduction",
    instructor: "Stanford University",
    duration: 600,
    category: "Data Science",
    tags: ["Machine Learning", "AI", "Python", "Data Science"],
    price: 49,
    currency: "USD",
    rating: 4.9,
    enrollmentCount: 1800000,
    isVerified: true,
    isFeatured: true,
    sageRecommended: true,
    africanRelevance: 90,
    workContractCount: 2200,
    hasCertificate: true,
    certificateType: "Coursera Certificate"
  },
  {
    id: "mock-3",
    platform: "ALX_AFRICA",
    title: "Full Stack Web Development",
    description: "Become a full-stack developer with JavaScript, React, Node.js, and PostgreSQL.",
    thumbnailUrl: "https://www.alxafrica.com/wp-content/uploads/2023/03/ALX-Africa-1.png",
    courseUrl: "https://www.alxafrica.com/software-engineering/",
    instructor: "ALX Africa",
    duration: 720,
    category: "Web Development",
    tags: ["JavaScript", "React", "Node.js", "Full Stack"],
    price: 0,
    currency: "USD",
    rating: 4.7,
    enrollmentCount: 150000,
    isVerified: true,
    isFeatured: true,
    sageRecommended: true,
    africanRelevance: 100,
    workContractCount: 800,
    hasCertificate: true,
    certificateType: "ALX Certificate"
  },
  {
    id: "mock-4",
    platform: "UDEMY",
    title: "The Complete Digital Marketing Course",
    description: "Learn SEO, social media marketing, content marketing, and analytics from scratch.",
    thumbnailUrl: "https://www.udemy.com/staticx/udemy/images/v7/logo-udemy.svg",
    courseUrl: "https://www.udemy.com/course/the-complete-digital-marketing-course/",
    instructor: "Rob Percival",
    duration: 120,
    category: "Marketing",
    tags: ["Digital Marketing", "SEO", "Social Media", "Analytics"],
    price: 19.99,
    currency: "USD",
    rating: 4.5,
    enrollmentCount: 200000,
    isVerified: true,
    sageRecommended: false,
    africanRelevance: 85,
    workContractCount: 450,
    hasCertificate: true,
    certificateType: "Udemy Certificate"
  },
  {
    id: "mock-5",
    platform: "COURSERA",
    title: "Google Data Analytics Professional Certificate",
    description: "Learn data analytics with spreadsheets, SQL, and Tableau from Google.",
    thumbnailUrl: "https://d3njjcbhboqi7l.cloudfront.net/course-images/v1/GoogleCareerCertificates/google-data-analytics/thumbnail.png",
    courseUrl: "https://www.coursera.org/professional-certificates/google-data-analytics",
    instructor: "Google",
    duration: 180,
    category: "Data Science",
    tags: ["Data Analytics", "SQL", "Tableau", "Spreadsheets"],
    price: 39,
    currency: "USD",
    rating: 4.8,
    enrollmentCount: 3500000,
    isVerified: true,
    isFeatured: true,
    sageRecommended: true,
    africanRelevance: 88,
    workContractCount: 1800,
    hasCertificate: true,
    certificateType: "Google Certificate"
  },
  {
    id: "mock-6",
    platform: "ANDELA",
    title: "Advanced React Patterns",
    description: "Master advanced React patterns, hooks, and performance optimization techniques.",
    thumbnailUrl: "https://andela.com/wp-content/uploads/2021/12/andela-blue-logo.png",
    courseUrl: "https://andela.com/alab/advanced-react/",
    instructor: "Andela",
    duration: 80,
    category: "Web Development",
    tags: ["React", "JavaScript", "Frontend"],
    price: 0,
    currency: "USD",
    rating: 4.6,
    enrollmentCount: 50000,
    isVerified: true,
    sageRecommended: false,
    africanRelevance: 95,
    workContractCount: 320,
    hasCertificate: true,
    certificateType: "Andela Certificate"
  }
];

export default function ExternalCoursesPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<ExternalCourse[]>([]);
  const [recommendedCourses, setRecommendedCourses] = useState<ExternalCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchRecommended();
  }, [platformFilter]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      // Handle both relative and absolute API_BASE
      const baseUrl = API_BASE.startsWith('http') ? API_BASE : window.location.origin;
      const endpoint = `${baseUrl}/api/v1/external-courses`;
      const url = new URL(endpoint);
      if (platformFilter !== "all") {
        url.searchParams.set("platform", platformFilter);
      }
      
      const response = await fetch(url.toString());
      if (!response.ok) throw new Error("Failed to fetch courses");
      const data = await response.json();
      // Safely handle response - ensure it's an array
      const coursesArray = Array.isArray(data) ? data : [];
      setCourses(coursesArray.length > 0 ? coursesArray : MOCK_EXTERNAL_COURSES);
    } catch (err) {
      console.error("Failed to load courses, using mock data:", err);
      // Use mock data as fallback when API fails
      const filtered = platformFilter === "all" 
        ? MOCK_EXTERNAL_COURSES 
        : MOCK_EXTERNAL_COURSES.filter(c => c.platform === platformFilter);
      setCourses(filtered);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommended = async () => {
    try {
      const baseUrl = API_BASE.startsWith('http') ? API_BASE : window.location.origin;
      const response = await fetch(`${baseUrl}/api/v1/external-courses/recommended`);
      if (!response.ok) throw new Error("Failed to fetch recommended");
      const data = await response.json();
      // Safely handle response - ensure it's an array
      const recArray = Array.isArray(data) ? data : [];
      // Use mock recommended courses if API returns empty
      setRecommendedCourses(recArray.length > 0 ? recArray : MOCK_EXTERNAL_COURSES.filter(c => c.sageRecommended));
    } catch (err) {
      console.error("Failed to load recommended courses, using mock data:", err);
      // Use mock data as fallback when API fails
      setRecommendedCourses(MOCK_EXTERNAL_COURSES.filter(c => c.sageRecommended));
    }
  };

  const filteredCourses = courses.filter(course => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      course.title.toLowerCase().includes(searchLower) ||
      course.description?.toLowerCase().includes(searchLower) ||
      course.category?.toLowerCase().includes(searchLower) ||
      course.tags?.some(tag => tag.toLowerCase().includes(searchLower)) ||
      course.instructor?.toLowerCase().includes(searchLower);
    const matchesPlatform = platformFilter === "all" || course.platform === platformFilter;
    return matchesSearch && matchesPlatform;
  });

  const handleEnroll = async (course: ExternalCourse) => {
    // Redirect to external course URL
    window.open(course.courseUrl, "_blank");
  };

  const handleSeed = async () => {
    try {
      setSeeding(true);
      const baseUrl = API_BASE.startsWith('http') ? API_BASE : window.location.origin;
      const response = await fetch(`${baseUrl}/api/v1/external-courses/seed`, { method: 'POST' });
      if (response.ok) {
        // Reload courses after seeding
        fetchCourses();
        fetchRecommended();
      }
    } catch (err) {
      console.error("Failed to seed:", err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: "0 auto" }}>
      <ContextBar activeLayer="academy" showLabels={true} />
      
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ 
          fontFamily: "Syne, sans-serif", 
          fontSize: 32, 
          fontWeight: 800,
          color: "var(--text)",
          marginBottom: 8
        }}>
          🌍 Explore Global Learning
        </h1>
        <p style={{ 
          fontFamily: "Syne, sans-serif", 
          color: "var(--text-dim)",
          fontSize: 14 
        }}>
          SAGE recommends the best courses from Coursera, FreeCodeCamp, Udemy, and more — tracked in your Winners Academy profile
        </p>
        
        {/* Seed Button - visible for admins */}
        <button
          onClick={handleSeed}
          disabled={seeding}
          style={{
            marginTop: 12,
            padding: "10px 20px",
            background: "var(--gold)",
            color: "var(--bg)",
            border: "none",
            borderRadius: 6,
            fontFamily: "Syne, sans-serif",
            fontWeight: 700,
            fontSize: 13,
            cursor: seeding ? "not-allowed" : "pointer",
            opacity: seeding ? 0.7 : 1
          }}
        >
          {seeding ? "Seeding..." : "🌱 Seed Sample Courses"}
        </button>
      </div>

      {/* SAGE Recommendations */}
      {!loading && recommendedCourses.length > 0 && (
        <div style={{ marginBottom: 32 }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 12,
            marginBottom: 16 
          }}>
            <span style={{ fontSize: 24 }}>✨</span>
            <h2 style={{ 
              fontFamily: "Syne, sans-serif",
              fontSize: 20,
              fontWeight: 700,
              color: "var(--gold)",
              margin: 0
            }}>
              SAGE's Top Picks for You
            </h2>
          </div>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
            gap: 16 
          }}>
            {recommendedCourses.slice(0, 3).map((course) => (
              <div
                key={course.id}
                onClick={() => handleEnroll(course)}
                style={{
                  background: "linear-gradient(135deg, var(--surface) 0%, var(--surface2) 100%)",
                  border: "1px solid var(--gold)",
                  borderRadius: 6,
                  padding: 16,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                <div style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 2,
                  background: "linear-gradient(90deg, var(--gold), transparent)"
                }} />
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{PLATFORM_ICONS[course.platform] || "📚"}</span>
                  <span style={{ 
                    fontFamily: "Space Mono, monospace",
                    fontSize: 10,
                    color: "var(--gold)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em"
                  }}>
                    SAGE PICK
                  </span>
                </div>
                <h3 style={{ 
                  fontFamily: "Syne, sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--text)",
                  marginBottom: 8,
                  lineHeight: 1.4
                }}>
                  {course.title}
                </h3>
                <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-dim)" }}>
                  {course.price === 0 ? (
                    <span style={{ color: "var(--green)", fontWeight: 600 }}>FREE</span>
                  ) : (
                    <span>${course.price}</span>
                  )}
                  {course.duration && (
                    <span>~{Math.round(course.duration / 60)} hours</span>
                  )}
                  {(course.workContractCount ?? 0) > 0 && (
                    <span style={{ color: "var(--ice)" }}>{course.workContractCount} jobs</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div style={{ 
        display: "flex", 
        gap: 16, 
        marginBottom: 24, 
        flexWrap: "wrap",
        alignItems: "center"
      }}>
        <input
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: "12px 16px",
            borderRadius: 6,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            fontFamily: "Syne, sans-serif",
            fontSize: 14,
            width: 280,
            outline: "none",
          }}
        />
        
        <select
          value={platformFilter}
          onChange={(e) => setPlatformFilter(e.target.value)}
          style={{
            padding: "12px 16px",
            borderRadius: 6,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text)",
            fontFamily: "Syne, sans-serif",
            fontSize: 14,
            cursor: "pointer",
            outline: "none",
          }}
        >
          <option value="all">All Platforms</option>
          <option value="COURSERA">🎓 Coursera</option>
          <option value="UNIATHENA">🎯 UniAthena</option>
          <option value="FREECODECAMP">🔥 FreeCodeCamp</option>
          <option value="UDEMY">💡 Udemy</option>
          <option value="EDX">📚 edX</option>
          <option value="KHAN_ACADEMY">🧠 Khan Academy</option>
          <option value="PLURALSIGHT">💻 Pluralsight</option>
          <option value="LINKEDIN_LEARNING">💼 LinkedIn Learning</option>
          <option value="GOOGLE_SKILLSHOP">🔍 Google Skillshop</option>
          <option value="HUBSPOT">📈 HubSpot Academy</option>
          <option value="ALISON">📖 Alison</option>
          <option value="AWS_SKILLBUILDER">☁️ AWS Skill Builder</option>
        </select>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: 60 }}>
          <div style={{ fontSize: 32 }}>Loading...</div>
        </div>
      ) : error ? (
        <div style={{ 
          padding: 20, 
          borderRadius: 6, 
          border: "1px solid var(--red)",
          color: "var(--red)",
          fontFamily: "Space Mono, monospace",
          fontSize: 12
        }}>
          {error}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div style={{ 
          padding: 40, 
          borderRadius: 6, 
          border: "1px solid var(--border)",
          background: "var(--surface)",
          textAlign: "center"
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
          <div style={{ 
            fontFamily: "Syne, sans-serif", 
            fontSize: 18, 
            color: "var(--text)",
            marginBottom: 8
          }}>
            No courses found
          </div>
          <div style={{ 
            fontFamily: "Space Mono, monospace", 
            fontSize: 11, 
            color: "var(--text-dim)" 
          }}>
            Try adjusting your filters or search term
          </div>
          <button
            onClick={handleSeed}
            disabled={seeding}
            style={{
              marginTop: 16,
              padding: "12px 24px",
              background: "var(--gold)",
              color: "var(--bg)",
              border: "none",
              borderRadius: 6,
              fontFamily: "Syne, sans-serif",
              fontWeight: 700,
              cursor: seeding ? "not-allowed" : "pointer",
              opacity: seeding ? 0.7 : 1
            }}
          >
            {seeding ? "Seeding..." : "🌱 Seed Sample Courses"}
          </button>
        </div>
      ) : (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", 
          gap: 20 
        }}>
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              style={{
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                overflow: "hidden",
                position: "relative",
              }}
            >
              {/* Gold gradient top border */}
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: "linear-gradient(90deg, var(--gold), transparent)",
              }} />

              {/* Thumbnail */}
              <div style={{
                height: 140,
                background: course.thumbnailUrl 
                  ? `url(${course.thumbnailUrl}) center/cover`
                  : "var(--surface2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 48,
              }}>
                {!course.thumbnailUrl && (PLATFORM_ICONS[course.platform] || "📚")}
              </div>

              {/* Content */}
              <div style={{ padding: 16 }}>
                {/* Platform Badge */}
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 8, 
                  marginBottom: 12 
                }}>
                  <span style={{ fontSize: 16 }}>
                    {PLATFORM_ICONS[course.platform] || "📚"}
                  </span>
                  <span style={{
                    fontFamily: "Space Mono, monospace",
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--gold)",
                    background: "rgba(201, 168, 76, 0.1)",
                    padding: "4px 8px",
                    borderRadius: 4,
                  }}>
                    {course.platform.replace("_", " ")}
                  </span>
                  {course.isVerified && (
                    <span style={{
                      fontSize: 10,
                      color: "var(--green)",
                    }}>✓ Verified</span>
                  )}
                </div>

                {/* Title */}
                <h3 style={{
                  fontFamily: "Syne, sans-serif",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "var(--text)",
                  marginBottom: 8,
                  lineHeight: 1.3,
                }}>
                  {course.title}
                </h3>

                {/* Instructor */}
                {course.instructor && (
                  <div style={{
                    fontFamily: "Space Mono, monospace",
                    fontSize: 10,
                    color: "var(--text-dim)",
                    marginBottom: 8,
                  }}>
                    by {course.instructor}
                  </div>
                )}

                {/* Stats */}
                <div style={{
                  display: "flex",
                  gap: 16,
                  marginBottom: 16,
                  fontFamily: "Space Mono, monospace",
                  fontSize: 10,
                  color: "var(--text-dim)",
                }}>
                  <span>👥 {course.enrollmentCount.toLocaleString()}</span>
                  {course.duration && <span>⏱ {Math.round(course.duration / 60)}h</span>}
                  {course.rating && <span>⭐ {course.rating.toFixed(1)}</span>}
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleEnroll(course)}
                  style={{
                    width: "100%",
                    padding: "12px 16px",
                    borderRadius: 6,
                    border: "none",
                    background: "var(--blue)",
                    color: "white",
                    fontFamily: "Syne, sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "opacity 0.2s ease",
                  }}
                >
                  {course.price === 0 ? "Start Free" : `Enroll for $${course.price}`}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
