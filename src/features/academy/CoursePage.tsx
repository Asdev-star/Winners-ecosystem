// src/features/academy/CoursePage.tsx — Course Player V1.0
// Phase 3: Academy Layer — Individual course view with enrollment and progress tracking

import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { getAuthHeaders, useAuthStore } from "../../features/auth/authStore";

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  instructor: { name: string; email: string };
  modules: Array<{
    id: string;
    title: string;
    description: string;
    order: number;
    lessons: Array<{
      id: string;
      title: string;
      content: string;
      videoUrl?: string;
      order: number;
      duration: number;
    }>;
  }>;
  enrollmentCount: number;
  averageRating: number;
  reviews: Array<{
    rating: number;
    comment: string;
    user: { name: string };
  }>;
}

interface Enrollment {
  id: string;
  enrolledAt: string;
  course?: { id: string; slug?: string | null };
  progress: Array<{
    lessonId: string;
    completed: boolean;
    timeSpent: number;
  }>;
}

export default function CoursePage() {
  const { slug } = useParams<{ slug: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const { user } = useAuthStore();

  const fetchCourse = useCallback(async () => {
    if (!slug) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/v1/academy/courses/${slug}`);
      if (!response.ok) throw new Error("Failed to fetch course");
      const data = await response.json();
      setCourse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load course");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const checkEnrollment = useCallback(async () => {
    if (!slug) return;

    try {
      const response = await fetch("/api/v1/academy/enrollments", {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const enrollments = (await response.json()) as Enrollment[];
        const courseEnrollment = enrollments.find((item) => (
          item.course?.id === slug || item.course?.slug === slug
        ));
        if (courseEnrollment) {
          setEnrollment(courseEnrollment);
        }
      }
    } catch (err) {
      console.error("Failed to check enrollment:", err);
    }
  }, [slug]);

  useEffect(() => {
    if (slug) {
      void fetchCourse();
      if (user) {
        void checkEnrollment();
      }
    }
  }, [slug, user, fetchCourse, checkEnrollment]);

  const handleEnroll = async () => {
    if (!user || !course) return;

    try {
      setEnrolling(true);
      const response = await fetch(`/api/v1/academy/courses/${course.id}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) throw new Error("Failed to enroll");

      const newEnrollment = await response.json();
      setEnrollment(newEnrollment);
      await checkEnrollment(); // Refresh enrollment data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to enroll");
    } finally {
      setEnrolling(false);
    }
  };

  const handleLessonComplete = async (lessonId: string) => {
    if (!enrollment) return;

    try {
      await fetch(`/api/v1/academy/lessons/${lessonId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ completed: true })
      });
      await checkEnrollment(); // Refresh progress
    } catch (err) {
      console.error("Failed to update progress:", err);
    }
  };

  // Ecosystem context bar
  const ctxBar = (
    <div style={{ display:'flex', gap:8, marginBottom:22, flexWrap:'wrap' }}>
      <span className="ctx-badge live">⬡ Core Engine</span>
      <span className="ctx-sep">›</span>
      <span className="ctx-badge live">🧑‍🤝‍🧑 Community</span>
      <span className="ctx-sep">›</span>
      <span className="ctx-badge active">🎓 Academy</span>
    </div>
  );

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        {ctxBar}
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>Loading course...</div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div style={{ padding: 20 }}>
        {ctxBar}
        <div style={{ padding:16, borderRadius:6, border:'1px solid var(--red)',
          background:'rgba(224,90,78,0.08)', color:'var(--red)',
          fontFamily:'Space Mono', fontSize:12 }}>
          ⚠ {error || "Course not found"} — <span onClick={fetchCourse} style={{cursor:'pointer',textDecoration:'underline'}}>Retry</span>
        </div>
      </div>
    );
  }

  const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
  const completedLessons = enrollment?.progress.filter(p => p.completed).length || 0;
  const progressPercentage = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;

  return (
    <div style={{ padding: 20 }}>
      {ctxBar}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32 }}>
        {/* Main Content */}
        <div>
          {/* Course Header */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 42,
              fontWeight: 600,
              color: 'var(--gold)',
              marginBottom: 8,
              letterSpacing: '-0.5px'
            }}>
              {course.title}
            </h1>
            <p style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 18,
              color: 'var(--text)',
              lineHeight: 1.6,
              marginBottom: 16
            }}>
              {course.description}
            </p>

            <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: 11,
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                letterSpacing: '0.1em'
              }}>
                {course.category}
              </span>
              <span style={{
                fontFamily: 'Space Mono, monospace',
                fontSize: 11,
                color: 'var(--text-dim)'
              }}>
                by {course.instructor.name}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: 'var(--gold)' }}>★</span>
                <span style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: 11,
                  color: 'var(--text-dim)'
                }}>
                  {course.averageRating.toFixed(1)} ({course.reviews.length} reviews)
                </span>
              </div>
              <button
                onClick={() => window.location.href = "/academy/my-learning"}
                style={{
                  padding: "6px 10px",
                  borderRadius: 4,
                  border: "1px solid var(--border)",
                  background: "var(--surface2)",
                  color: "var(--text)",
                  fontFamily: "Space Mono, monospace",
                  fontSize: 10,
                  cursor: "pointer",
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                My Learning
              </button>
            </div>
          </div>

          {/* Enrollment Status */}
          {enrollment ? (
            <div style={{ marginBottom: 32 }}>
              <div style={{
                padding: 16,
                borderRadius: 6,
                border: '1px solid var(--green)',
                background: 'rgba(45,213,160,0.08)',
                marginBottom: 16
              }}>
                <div style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 16,
                  color: 'var(--green)',
                  marginBottom: 8
                }}>
                  ✅ Enrolled in this course
                </div>
                <div style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: 11,
                  color: 'var(--text-dim)'
                }}>
                  Progress: {completedLessons} of {totalLessons} lessons completed
                </div>
                <div style={{
                  width: '100%',
                  height: 4,
                  background: 'var(--border)',
                  borderRadius: 2,
                  marginTop: 8,
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${progressPercentage}%`,
                    height: '100%',
                    background: 'var(--green)',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
              </div>
            </div>
          ) : user ? (
            <div style={{ marginBottom: 32 }}>
              <button
                onClick={handleEnroll}
                disabled={enrolling}
                style={{
                  padding: '12px 24px',
                  borderRadius: 6,
                  border: 'none',
                  background: course.price === 0 ? 'var(--green)' : 'var(--gold)',
                  color: 'var(--bg)',
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 16,
                  fontWeight: 600,
                  cursor: enrolling ? 'not-allowed' : 'pointer',
                  opacity: enrolling ? 0.7 : 1
                }}
              >
                {enrolling ? 'Enrolling...' : course.price === 0 ? 'Enroll Free' : `Enroll for $${course.price}`}
              </button>
            </div>
          ) : (
            <div style={{ marginBottom: 32 }}>
              <div style={{
                padding: 16,
                borderRadius: 6,
                border: '1px solid var(--ice)',
                background: 'rgba(137,196,225,0.08)'
              }}>
                <div style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 16,
                  color: 'var(--ice)',
                  marginBottom: 8
                }}>
                  🔐 Sign in to enroll
                </div>
                <div style={{
                  fontFamily: 'Space Mono, monospace',
                  fontSize: 11,
                  color: 'var(--text-dim)'
                }}>
                  Create an account to access this course
                </div>
              </div>
            </div>
          )}

          {/* Course Content */}
          <div>
            <h2 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 24,
              fontWeight: 700,
              color: 'var(--text)',
              marginBottom: 24
            }}>
              Course Content
            </h2>

            {course.modules.map(module => (
              <div key={module.id} style={{ marginBottom: 24 }}>
                <h3 style={{
                  fontFamily: 'Syne, sans-serif',
                  fontSize: 18,
                  fontWeight: 600,
                  color: 'var(--text)',
                  marginBottom: 12
                }}>
                  {module.title}
                </h3>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {module.lessons.map(lesson => {
                    const isCompleted = enrollment?.progress.some(p => p.lessonId === lesson.id && p.completed);
                    const isSelected = selectedLesson === lesson.id;

                    return (
                      <div
                        key={lesson.id}
                        onClick={() => setSelectedLesson(isSelected ? null : lesson.id)}
                        style={{
                          padding: 16,
                          borderRadius: 6,
                          border: '1px solid var(--border)',
                          background: isSelected ? 'var(--surface2)' : 'var(--surface)',
                          cursor: 'pointer',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontFamily: 'Syne, sans-serif',
                            fontSize: 16,
                            color: 'var(--text)',
                            marginBottom: 4
                          }}>
                            {lesson.title}
                          </div>
                          <div style={{
                            fontFamily: 'Space Mono, monospace',
                            fontSize: 11,
                            color: 'var(--text-dim)'
                          }}>
                            {lesson.duration} min {isCompleted && '• ✅ Completed'}
                          </div>
                        </div>

                        {enrollment && !isCompleted && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleLessonComplete(lesson.id);
                            }}
                            style={{
                              padding: '6px 12px',
                              borderRadius: 4,
                              border: '1px solid var(--green)',
                              background: 'var(--green)',
                              color: 'var(--bg)',
                              fontFamily: 'Space Mono, monospace',
                              fontSize: 10,
                              cursor: 'pointer'
                            }}
                          >
                            Mark Complete
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 6,
            position: 'relative',
            overflow: 'hidden',
            padding: 20
          }}>
            {/* Gradient top border */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: 2,
              background: 'linear-gradient(90deg, var(--gold), transparent)'
            }} />

            <h3 style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: 18,
              fontWeight: 700,
              color: 'var(--text)',
              marginBottom: 16
            }}>
              Course Stats
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'var(--text-dim)' }}>
                  Students
                </span>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'var(--text)' }}>
                  {course.enrollmentCount}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'var(--text-dim)' }}>
                  Modules
                </span>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'var(--text)' }}>
                  {course.modules.length}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'var(--text-dim)' }}>
                  Lessons
                </span>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'var(--text)' }}>
                  {totalLessons}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'var(--text-dim)' }}>
                  Rating
                </span>
                <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'var(--text)' }}>
                  {course.averageRating.toFixed(1)} ⭐
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
