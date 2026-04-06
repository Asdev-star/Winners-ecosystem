// Phase 3: Academy Layer - Student dashboard (enrollments, progress, certificates)

import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthHeaders, useAuthStore } from "../auth/authStore";
import { API_BASE } from "../../lib/api";

interface EnrollmentProgress {
  lessonId: string;
  completed: boolean;
  timeSpent: number;
}

interface EnrollmentCourse {
  id: string;
  slug?: string | null;
  title: string;
  description: string;
  category: string;
  price: number;
  instructor?: { name?: string | null } | null;
  modules: Array<{ lessons: Array<{ id: string }> }>;
}

interface Enrollment {
  id: string;
  enrolledAt: string;
  course: EnrollmentCourse;
  progress: EnrollmentProgress[];
}

interface Certificate {
  id: string;
  certNumber: string;
  verificationCode: string;
  pdfUrl?: string | null;
  issuedAt: string;
  course: {
    id: string;
    title: string;
    instructor?: { name?: string | null } | null;
  };
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [issuingCourseId, setIssuingCourseId] = useState<string | null>(null);
  const [downloadingCertId, setDownloadingCertId] = useState<string | null>(null);

  const loadDashboard = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [enrollmentsResponse, certificatesResponse] = await Promise.all([
        fetch(`${API_BASE}/academy/enrollments`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/academy/certificates`, { headers: getAuthHeaders() }),
      ]);

      if (!enrollmentsResponse.ok) {
        throw new Error("Failed to load enrollments");
      }

      if (!certificatesResponse.ok) {
        throw new Error("Failed to load certificates");
      }

      const enrollmentsData = (await enrollmentsResponse.json()) as Enrollment[];
      const certificatesData = (await certificatesResponse.json()) as Certificate[];

      setEnrollments(enrollmentsData);
      setCertificates(certificatesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load student dashboard");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const progressByEnrollment = useMemo(() => {
    const map = new Map<string, { completed: number; total: number; percent: number }>();

    for (const enrollment of enrollments) {
      const total = enrollment.course.modules.reduce((sum, moduleItem) => sum + moduleItem.lessons.length, 0);
      const completed = enrollment.progress.filter((item) => item.completed).length;
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

      map.set(enrollment.id, { completed, total, percent });
    }

    return map;
  }, [enrollments]);

  const certificateByCourseId = useMemo(() => {
    return new Map(certificates.map((item) => [item.course.id, item]));
  }, [certificates]);

  const buildVerifyUrl = useCallback((certNumber: string) => {
    if (!window?.location?.origin) {
      return `/verify/${certNumber}`;
    }
    return `${window.location.origin}/verify/${certNumber}`;
  }, []);

  const issueCertificate = async (courseId: string) => {
    try {
      setIssuingCourseId(courseId);
      setError(null);

      const response = await fetch(`${API_BASE}/academy/courses/${courseId}/certificate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error("Failed to issue certificate");
      }

      const certificate = (await response.json()) as Certificate;
      setCertificates((prev) => {
        if (prev.some((item) => item.id === certificate.id)) {
          return prev;
        }
        return [certificate, ...prev];
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to issue certificate");
    } finally {
      setIssuingCourseId(null);
    }
  };

  const downloadCertificate = async (certId: string, courseTitle: string) => {
    setDownloadingCertId(certId);
    try {
      const res = await fetch(`${API_BASE}/academy/certificates/${certId}/pdf`, {
        headers: getAuthHeaders(),
      });
      const contentType = res.headers.get("Content-Type") ?? "";
      if (!res.ok) {
        const errJson = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(errJson?.error ?? `Certificate PDF failed (${res.status})`);
      }
      if (!contentType.includes("application/pdf")) {
        throw new Error("Server did not return a PDF. Check certificate service configuration.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `certificate-${courseTitle.replace(/\s+/g, '-').toLowerCase()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloadingCertId(null);
    }
  };

  const ctxBar = (
    <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
      <span className="ctx-badge live">Core Engine</span>
      <span className="ctx-sep">/</span>
      <span className="ctx-badge live">Community</span>
      <span className="ctx-sep">/</span>
      <span className="ctx-badge active">Academy</span>
    </div>
  );

  if (!user) {
    return (
      <div style={{ padding: 20 }}>
        {ctxBar}
        <div style={{ color: "var(--text-dim)", fontFamily: "Space Mono, monospace", fontSize: 12 }}>
          Sign in to view your academy dashboard.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        {ctxBar}
        <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--text-dim)" }}>
          Loading your learning dashboard...
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      {ctxBar}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 40, fontWeight: 600, color: "var(--gold)", marginBottom: 6 }}>
            My Learning
          </h1>
          <div style={{ fontFamily: "Syne, sans-serif", fontSize: 14, color: "var(--text-dim)" }}>
            Track your enrollments, progress, and certificates.
          </div>
        </div>
        <button
          onClick={() => navigate("/academy")}
          style={{
            padding: "10px 14px",
            borderRadius: 6,
            border: "1px solid var(--border)",
            background: "var(--surface2)",
            color: "var(--text)",
            fontFamily: "Space Mono, monospace",
            fontSize: 11,
            cursor: "pointer",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          Browse Courses
        </button>
      </div>

      {error && (
        <div
          style={{
            padding: 14,
            borderRadius: 6,
            border: "1px solid var(--red)",
            background: "rgba(224,90,78,0.08)",
            color: "var(--red)",
            fontFamily: "Space Mono, monospace",
            fontSize: 12,
            marginBottom: 20,
          }}
        >
          {error} - <span onClick={() => void loadDashboard()} style={{ cursor: "pointer", textDecoration: "underline" }}>Retry</span>
        </div>
      )}

      <section style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 22, color: "var(--text)", marginBottom: 14 }}>
          Enrolled Courses ({enrollments.length})
        </h2>

        {enrollments.length === 0 ? (
          <div style={{ padding: 20, borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-dim)", fontFamily: "Space Mono, monospace", fontSize: 11 }}>
            You have not enrolled in any courses yet.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            {enrollments.map((enrollment) => {
              const progress = progressByEnrollment.get(enrollment.id) ?? { completed: 0, total: 0, percent: 0 };
              const certificate = certificateByCourseId.get(enrollment.course.id);
              const isCompleted = progress.total > 0 && progress.completed >= progress.total;

              return (
                <div
                  key={enrollment.id}
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 6,
                    padding: 16,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--gold), transparent)" }} />

                  <div style={{ fontFamily: "Syne, sans-serif", color: "var(--text)", fontWeight: 700, fontSize: 17, marginBottom: 6 }}>
                    {enrollment.course.title}
                  </div>
                  <div style={{ fontFamily: "Space Mono, monospace", fontSize: 10, color: "var(--text-dim)", marginBottom: 12 }}>
                    {enrollment.course.category} / by {enrollment.course.instructor?.name ?? "Instructor"}
                  </div>

                  <div style={{ fontFamily: "Space Mono, monospace", fontSize: 11, color: "var(--text-dim)", marginBottom: 6 }}>
                    Progress: {progress.completed}/{progress.total} lessons ({progress.percent}%)
                  </div>
                  <div style={{ width: "100%", height: 5, borderRadius: 3, background: "var(--border)", overflow: "hidden", marginBottom: 12 }}>
                    <div style={{ width: `${progress.percent}%`, height: "100%", background: "var(--green)" }} />
                  </div>

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                    <button
                      onClick={() => navigate(`/academy/courses/${enrollment.course.slug ?? enrollment.course.id}`)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 4,
                        border: "1px solid var(--border)",
                        background: "var(--surface2)",
                        color: "var(--text)",
                        fontFamily: "Space Mono, monospace",
                        fontSize: 10,
                        cursor: "pointer",
                        textTransform: "uppercase",
                      }}
                    >
                      Continue
                    </button>

                    {certificate ? (
                      <span style={{ fontFamily: "Space Mono, monospace", fontSize: 10, color: "var(--green)" }}>
                        Certificate issued {formatDate(certificate.issuedAt)}
                      </span>
                    ) : isCompleted ? (
                      <button
                        onClick={() => void issueCertificate(enrollment.course.id)}
                        disabled={issuingCourseId === enrollment.course.id}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 4,
                          border: "1px solid var(--gold)",
                          background: "rgba(201,168,76,0.12)",
                          color: "var(--gold)",
                          fontFamily: "Space Mono, monospace",
                          fontSize: 10,
                          cursor: issuingCourseId === enrollment.course.id ? "not-allowed" : "pointer",
                          opacity: issuingCourseId === enrollment.course.id ? 0.7 : 1,
                          textTransform: "uppercase",
                        }}
                      >
                        {issuingCourseId === enrollment.course.id ? "Issuing..." : "Issue Certificate"}
                      </button>
                    ) : (
                      <span style={{ fontFamily: "Space Mono, monospace", fontSize: 10, color: "var(--text-dim)" }}>
                        Complete all lessons to unlock certificate
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section>
        <h2 style={{ fontFamily: "Syne, sans-serif", fontSize: 22, color: "var(--text)", marginBottom: 14 }}>
          Certificates ({certificates.length})
        </h2>

        {certificates.length === 0 ? (
          <div style={{ padding: 20, borderRadius: 6, border: "1px solid var(--border)", background: "var(--surface)", color: "var(--text-dim)", fontFamily: "Space Mono, monospace", fontSize: 11 }}>
            No certificates yet.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            {certificates.map((certificate) => (
              <div
                key={certificate.id}
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: 6,
                  padding: 14,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "linear-gradient(90deg, var(--gold), transparent)" }} />
                <div style={{ fontFamily: "Syne, sans-serif", fontSize: 16, color: "var(--text)", fontWeight: 700, marginBottom: 6 }}>
                  {certificate.course.title}
                </div>
                <div style={{ fontFamily: "Space Mono, monospace", fontSize: 10, color: "var(--text-dim)" }}>
                  Instructor: {certificate.course.instructor?.name ?? "Instructor"}
                </div>
                <div style={{ fontFamily: "Space Mono, monospace", fontSize: 10, color: "var(--green)", marginTop: 6, marginBottom: 12 }}>
                  Issued {formatDate(certificate.issuedAt)}
                </div>
                <div style={{ fontFamily: "Space Mono, monospace", fontSize: 9, color: "var(--text-dim)", marginBottom: 12 }}>
                  {certificate.certNumber}
                </div>
                <button
                  onClick={() => void downloadCertificate(certificate.id, certificate.course.title)}
                  disabled={downloadingCertId === certificate.id}
                  style={{
                    padding: "7px 12px",
                    borderRadius: 4,
                    border: "1px solid var(--gold)",
                    background: "rgba(201,168,76,0.10)",
                    color: "var(--gold)",
                    fontFamily: "Space Mono, monospace",
                    fontSize: 10,
                    cursor: downloadingCertId === certificate.id ? "not-allowed" : "pointer",
                    opacity: downloadingCertId === certificate.id ? 0.6 : 1,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {downloadingCertId === certificate.id ? "Generating PDF…" : "⬇ Download PDF"}
                </button>
                <button
                  onClick={() => {
                    const verifyUrl = buildVerifyUrl(certificate.certNumber);
                    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`;
                    window.open(linkedinUrl, "_blank", "noopener,noreferrer");
                  }}
                  style={{
                    marginLeft: 8,
                    padding: "7px 12px",
                    borderRadius: 4,
                    border: "1px solid var(--ice)",
                    background: "rgba(137,196,225,0.08)",
                    color: "var(--ice)",
                    fontFamily: "Space Mono, monospace",
                    fontSize: 10,
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Verify on LinkedIn
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
