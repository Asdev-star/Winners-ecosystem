// src/features/academy/CoursePage.tsx — Course Player V1.0
// Phase 3: Academy Layer — Individual course view with enrollment and progress tracking

import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation } from "react-router-dom";
import { getAuthHeaders, useAuthStore } from "../../features/auth/authStore";
import { API_BASE } from "../../lib/api";
import AIInsightBanner from "../../components/ui/AIInsightBanner";
import AssistantPanel from "../../components/ai/AssistantPanel";
import FileDropZone, { type AnalysisResult } from "../../components/ai/FileDropZone";
import QuizTaker from "./components/QuizTaker";

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
  const location = useLocation();
  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'content' | 'quizzes'>('content');
  const [sageAnalysis, setSageAnalysis] = useState<AnalysisResult | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (location.hash !== "#sage-academy-tutor" || !course || !enrollment) return;
    setActiveTab("content");
    const first = course.modules?.[0]?.lessons?.[0];
    if (first) {
      setSelectedLesson((prev) => prev ?? first.id);
    }
    const t = window.setTimeout(() => {
      document.getElementById("sage-academy-tutor")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
    return () => window.clearTimeout(t);
  }, [location.hash, course, enrollment]);

  const fetchCourse = useCallback(async () => {
    if (!slug) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/academy/courses/${slug}`);
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
      const response = await fetch(`${API_BASE}/academy/enrollments`, {
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
      const response = await fetch(`${API_BASE}/academy/courses/${course.id}/enroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) throw new Error("Failed to enroll");

      const data = await response.json();

      // If checkout URL is returned, redirect to Stripe
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      setEnrollment(data);
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
      await fetch(`${API_BASE}/academy/lessons/${lessonId}/progress`, {
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
        <AIInsightBanner page="academy" assistant="sage" />
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
        <AIInsightBanner page="academy" assistant="sage" />
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
  const currentModuleId = (() => {
    if (!selectedLesson) return course.modules[0]?.id ?? "";
    for (const module of course.modules) {
      if (module.lessons.some((lesson) => lesson.id === selectedLesson)) {
        return module.id;
      }
    }
    return course.modules[0]?.id ?? "";
  })();

  return (
    <div style={{ padding: 20 }}>
      {ctxBar}
      <AIInsightBanner page="academy" assistant="sage" />

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

          {/* Tab Nav */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
            {(['content', 'quizzes'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 20px',
                  background: 'none',
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid var(--gold)' : '2px solid transparent',
                  cursor: 'pointer',
                  fontFamily: 'Space Mono, monospace',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: activeTab === tab ? 'var(--gold)' : 'var(--text-dim)',
                  marginBottom: -1,
                  transition: 'all 200ms ease',
                }}
              >
                {tab === 'content' ? '📚 Content' : '✏️ Quizzes'}
              </button>
            ))}
          </div>

          {activeTab === 'content' && (
            <div>
              {course.modules.map((module, moduleIndex) => (
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
                    {module.lessons.map((lesson, lessonIndex) => {
                      const isCompleted = enrollment?.progress.some(p => p.lessonId === lesson.id && p.completed);
                      const isSelected = selectedLesson === lesson.id;
                      const isFreePreview = moduleIndex === 0 && lessonIndex === 0;
                      const canAccess = !!enrollment || isFreePreview;

                      return (
                        <div
                          key={lesson.id}
                          onClick={() => canAccess && setSelectedLesson(isSelected ? null : lesson.id)}
                          style={{
                            padding: 16,
                            borderRadius: 6,
                            border: `1px solid ${isSelected ? 'var(--gold)' : 'var(--border)'}`,
                            background: isSelected ? 'var(--surface2)' : 'var(--surface)',
                            cursor: canAccess ? 'pointer' : 'default',
                            opacity: canAccess ? 1 : 0.6,
                            transition: 'all 200ms ease',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <div style={{
                                  fontFamily: 'Syne, sans-serif',
                                  fontSize: 16,
                                  color: 'var(--text)',
                                }}>
                                  {lesson.title}
                                </div>
                                {isFreePreview && !enrollment && (
                                  <span style={{
                                    fontFamily: 'Space Mono, monospace',
                                    fontSize: 9,
                                    padding: '2px 7px',
                                    borderRadius: 10,
                                    background: 'rgba(45,212,160,0.12)',
                                    border: '1px solid rgba(45,212,160,0.3)',
                                    color: 'var(--green)',
                                    letterSpacing: '0.06em',
                                    textTransform: 'uppercase',
                                  }}>
                                    Free Preview
                                  </span>
                                )}
                              </div>
                              <div style={{
                                fontFamily: 'Space Mono, monospace',
                                fontSize: 11,
                                color: 'var(--text-dim)'
                              }}>
                                {lesson.duration} min {isCompleted && '· ✅ Completed'}
                                {!canAccess && ' · 🔒 Enroll to access'}
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
                                  cursor: 'pointer',
                                  flexShrink: 0,
                                }}
                              >
                                Mark Complete
                              </button>
                            )}
                          </div>

                          {isSelected && lesson.videoUrl && (
                            <div style={{ marginTop: 14 }}>
                              <video
                                src={lesson.videoUrl}
                                controls
                                style={{ width: '100%', borderRadius: 4, background: '#000' }}
                              />
                            </div>
                          )}
                          {isSelected && lesson.content && (
                            <div style={{
                              marginTop: 14,
                              fontFamily: 'Syne, sans-serif',
                              fontSize: 14,
                              color: 'var(--text)',
                              lineHeight: 1.7,
                              padding: '12px 0',
                              borderTop: '1px solid var(--border)',
                            }}>
                              {lesson.content}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'quizzes' && (
            <QuizTaker courseId={course.id} />
          )}

          {/* SAGE Document Analysis - Per-lesson AI tutoring */}
          {selectedLesson && enrollment && (
            <div id="sage-academy-tutor" style={{ marginTop: 24 }}>
              <div style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--gold)',
                marginBottom: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                🎓 SAGE AI Tutor
              </div>
              <FileDropZone
                supervisor="sage"
                context={{ courseId: course?.id ?? "", lessonId: selectedLesson ?? "", courseSlug: slug ?? "" }}
                acceptedTypes={['pdf', 'image', 'audio']}
                label="Drop a PDF, screenshot, or audio for SAGE to analyze"
                onAnalysis={(result) => setSageAnalysis(result)}
              />
              {sageAnalysis && (
                <div style={{
                  marginTop: 16,
                  padding: 16,
                  background: 'var(--surface2)',
                  border: '1px solid var(--border)',
                  borderRadius: 6,
                  borderLeft: '3px solid var(--gold)'
                }}>
                  <div style={{
                    fontFamily: 'Space Mono, monospace',
                    fontSize: 10,
                    color: 'var(--gold)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 8
                  }}>
                    SAGE Analysis
                  </div>
                  <div style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: 13,
                    color: 'var(--text)',
                    lineHeight: 1.6
                  }}>
                    {sageAnalysis.analysis}
                  </div>
                  {sageAnalysis.skills && sageAnalysis.skills.length > 0 && (
                    <div style={{ marginTop: 12, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {sageAnalysis.skills.map((skill, i) => (
                        <span key={i} style={{
                          padding: '4px 8px',
                          background: 'rgba(201,168,76,0.15)',
                          border: '1px solid rgba(201,168,76,0.3)',
                          borderRadius: 4,
                          fontFamily: 'Space Mono, monospace',
                          fontSize: 9,
                          color: 'var(--gold)'
                        }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
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

      <AssistantPanel
        assistant="sage"
        page="academy"
        userId={user?.id}
        context={{
          courseId: course.id,
          moduleId: currentModuleId,
          progressPct: progressPercentage,
        }}
      />
    </div>
  );
}
