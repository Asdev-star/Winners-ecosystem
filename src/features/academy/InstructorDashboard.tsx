// src/features/academy/InstructorDashboard.tsx — Instructor Dashboard
// Phase 3: Academy Layer — Manage courses, modules, lessons, and view analytics

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAcademyStore, Course } from "./academyStore";

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .inst-dash {
    padding: 24px;
    max-width: 1400px;
    margin: 0 auto;
  }

  .inst-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
    flex-wrap: wrap;
    gap: 16px;
  }

  .inst-title {
    font-family: 'Syne', sans-serif;
    font-size: 28px;
    font-weight: 800;
    color: var(--text);
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .inst-title-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, var(--gold), #8B6914);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }

  .inst-btn {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    padding: 12px 20px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .inst-btn-primary {
    background: linear-gradient(135deg, var(--gold), #8B6914);
    color: #0D1520;
  }

  .inst-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(201, 168, 76, 0.3);
  }

  .inst-btn-secondary {
    background: var(--surface2);
    color: var(--text);
    border: 1px solid var(--border);
  }

  .inst-btn-secondary:hover {
    background: var(--border);
  }

  .inst-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 32px;
  }

  .inst-stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 20px;
    position: relative;
    overflow: hidden;
  }

  .inst-stat-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--gold), transparent);
  }

  .inst-stat-label {
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 8px;
  }

  .inst-stat-value {
    font-family: 'Syne', sans-serif;
    font-size: 32px;
    font-weight: 800;
    color: var(--text);
  }

  .inst-courses-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .inst-courses-title {
    font-family: 'Syne', sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: var(--text);
  }

  .inst-course-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 20px;
  }

  .inst-course-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
    transition: all 0.2s ease;
  }

  .inst-course-card:hover {
    border-color: var(--gold);
    transform: translateY(-2px);
  }

  .inst-course-thumb {
    width: 100%;
    height: 140px;
    object-fit: cover;
    background: var(--surface2);
  }

  .inst-course-body {
    padding: 16px;
  }

  .inst-course-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .inst-course-category {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    color: var(--ice);
    background: rgba(137, 196, 225, 0.1);
    padding: 3px 8px;
    border-radius: 3px;
    text-transform: uppercase;
  }

  .inst-course-status {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    padding: 3px 8px;
    border-radius: 3px;
  }

  .inst-course-status.published {
    background: rgba(45, 212, 160, 0.1);
    color: var(--green);
  }

  .inst-course-status.draft {
    background: rgba(155, 111, 255, 0.1);
    color: var(--purple);
  }

  .inst-course-title {
    font-family: 'Syne', sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 8px;
  }

  .inst-course-stats {
    display: flex;
    gap: 16px;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: var(--text-dim);
  }

  .inst-course-stat {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .inst-course-actions {
    display: flex;
    gap: 8px;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--border);
  }

  .inst-course-btn {
    flex: 1;
    font-family: 'Space Mono', monospace;
    font-size: 10px;
    padding: 8px;
    border-radius: 4px;
    border: 1px solid var(--border);
    background: var(--surface2);
    color: var(--text);
    cursor: pointer;
    transition: all 0.15s ease;
  }

  .inst-course-btn:hover {
    background: var(--border);
  }

  .inst-course-btn.primary {
    background: var(--gold);
    color: #0D1520;
    border-color: var(--gold);
  }

  .inst-empty {
    text-align: center;
    padding: 60px 20px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
  }

  .inst-empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
  }

  .inst-empty-title {
    font-family: 'Syne', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 8px;
  }

  .inst-empty-text {
    font-size: 14px;
    color: var(--text-dim);
    margin-bottom: 20px;
  }

  .ctx-badge {
    font-family: 'Space Mono', monospace;
    font-size: 9px;
    padding: 4px 10px;
    border-radius: 3px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  .ctx-badge.live { background: rgba(45,212,160,0.12); color: var(--green); border: 1px solid rgba(45,212,160,0.2); }
  .ctx-badge.active { background: rgba(201,168,76,0.15); color: var(--gold); border: 1px solid rgba(201,168,76,0.2); }
  .ctx-sep { color: var(--text-dim); font-size: 10px; }
`;

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const { instructorCourses, loading, error, fetchInstructorCourses } = useAcademyStore();

  useEffect(() => {
    fetchInstructorCourses();
  }, [fetchInstructorCourses]);

  const totalStudents = instructorCourses.reduce((sum, c) => sum + c.enrollmentCount, 0);
  const totalRevenue = instructorCourses.reduce(
    (sum, c) => sum + c.enrollmentCount * c.price,
    0
  );
  const publishedCount = instructorCourses.filter((c) => c.published).length;

  const handleCreateCourse = () => {
    navigate("/academy/instructor/create");
  };

  const handleEditCourse = (courseId: string) => {
    navigate(`/academy/instructor/edit/${courseId}`);
  };

  const handleViewCourse = (slug: string) => {
    navigate(`/academy/courses/${slug}`);
  };

  // Ecosystem context bar
  const ctxBar = (
    <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>
      <span className="ctx-badge live">⬡ Core Engine</span>
      <span className="ctx-sep">›</span>
      <span className="ctx-badge live">🧑‍🤝‍🧑 Community</span>
      <span className="ctx-sep">›</span>
      <span className="ctx-badge active">🎓 Academy</span>
      <span className="ctx-sep">›</span>
      <span className="ctx-badge active">👨‍🏫 Instructor</span>
    </div>
  );

  if (loading) {
    return (
      <>
        <style>{css}</style>
        <div className="inst-dash">
          {ctxBar}
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>Loading...</div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{css}</style>
        <div className="inst-dash">
          {ctxBar}
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--red)" }}>
            {error}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{css}</style>
      <div className="inst-dash">
        {ctxBar}

        <div className="inst-header">
          <div className="inst-title">
            <div className="inst-title-icon">🎓</div>
            Instructor Dashboard
          </div>
          <button className="inst-btn inst-btn-primary" onClick={handleCreateCourse}>
            + New Course
          </button>
        </div>

        <div className="inst-stats">
          <div className="inst-stat-card">
            <div className="inst-stat-label">Total Courses</div>
            <div className="inst-stat-value">{instructorCourses.length}</div>
          </div>
          <div className="inst-stat-card">
            <div className="inst-stat-label">Published</div>
            <div className="inst-stat-value">{publishedCount}</div>
          </div>
          <div className="inst-stat-card">
            <div className="inst-stat-label">Total Students</div>
            <div className="inst-stat-value">{totalStudents}</div>
          </div>
          <div className="inst-stat-card">
            <div className="inst-stat-label">Est. Revenue</div>
            <div className="inst-stat-value">${totalRevenue.toLocaleString()}</div>
          </div>
        </div>

        <div className="inst-courses-header">
          <div className="inst-courses-title">Your Courses</div>
        </div>

        {instructorCourses.length === 0 ? (
          <div className="inst-empty">
            <div className="inst-empty-icon">📚</div>
            <div className="inst-empty-title">No courses yet</div>
            <div className="inst-empty-text">
              Create your first course and start teaching
            </div>
            <button className="inst-btn inst-btn-primary" onClick={handleCreateCourse}>
              Create Course
            </button>
          </div>
        ) : (
          <div className="inst-course-grid">
            {instructorCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onEdit={() => handleEditCourse(course.id)}
                onView={() => handleViewCourse(course.slug)}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function CourseCard({
  course,
  onEdit,
  onView,
}: {
  course: Course;
  onEdit: () => void;
  onView: () => void;
}) {
  const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

  return (
    <div className="inst-course-card">
      {course.thumbnail ? (
        <img src={course.thumbnail} alt={course.title} className="inst-course-thumb" />
      ) : (
        <div className="inst-course-thumb" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontSize: 48 }}>
          📚
        </div>
      )}
      <div className="inst-course-body">
        <div className="inst-course-meta">
          <span className="inst-course-category">{course.category}</span>
          <span className={`inst-course-status ${course.published ? "published" : "draft"}`}>
            {course.published ? "Published" : "Draft"}
          </span>
        </div>
        <div className="inst-course-title">{course.title}</div>
        <div className="inst-course-stats">
          <span className="inst-course-stat">
            👥 {course.enrollmentCount}
          </span>
          <span className="inst-course-stat">
            📄 {course.modules.length} modules
          </span>
          <span className="inst-course-stat">
            🎬 {totalLessons} lessons
          </span>
        </div>
        <div className="inst-course-actions">
          <button className="inst-course-btn" onClick={onView}>
            View
          </button>
          <button className="inst-course-btn primary" onClick={onEdit}>
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
