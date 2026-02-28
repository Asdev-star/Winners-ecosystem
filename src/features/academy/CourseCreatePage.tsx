// src/features/academy/CourseCreatePage.tsx — Course Create/Edit
// Phase 3: Academy Layer — Form to create or edit courses

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAcademyStore } from "./academyStore";
import type { Course, Module, Lesson } from "./academyStore";

const CATEGORIES = [
  "Digital Marketing",
  "Software Development",
  "Financial Literacy",
  "Creative Skills",
  "E-Commerce",
  "Business & Entrepreneurship",
  "Health & Wellness",
  "Language & Culture",
];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .course-form {
    padding: 24px;
    max-width: 900px;
    margin: 0 auto;
  }

  .form-header {
    margin-bottom: 32px;
  }

  .form-title {
    font-family: 'Syne', sans-serif;
    font-size: 28px;
    font-weight: 800;
    color: var(--text);
    margin-bottom: 8px;
  }

  .form-subtitle {
    font-size: 14px;
    color: var(--text-dim);
  }

  .form-section {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 24px;
    margin-bottom: 24px;
  }

  .form-section-title {
    font-family: 'Syne', sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .form-section-title::before {
    content: '';
    width: 3px;
    height: 16px;
    background: var(--gold);
    border-radius: 2px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .form-grid.single {
    grid-template-columns: 1fr;
  }

  .form-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .form-field.full {
    grid-column: 1 / -1;
  }

  .form-label {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .form-label .required {
    color: var(--red);
  }

  .form-input,
  .form-select,
  .form-textarea {
    font-family: 'Syne', sans-serif;
    font-size: 14px;
    padding: 12px 14px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text);
    transition: border-color 0.2s ease;
  }

  .form-input:focus,
  .form-select:focus,
  .form-textarea:focus {
    outline: none;
    border-color: var(--gold);
  }

  .form-textarea {
    min-height: 120px;
    resize: vertical;
  }

  .form-select {
    cursor: pointer;
  }

  .form-hint {
    font-size: 12px;
    color: var(--text-dim);
    margin-top: 4px;
  }

  .form-toggle {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .form-toggle.active {
    border-color: var(--green);
    background: rgba(45, 212, 160, 0.1);
  }

  .form-toggle-switch {
    width: 40px;
    height: 22px;
    background: var(--border);
    border-radius: 11px;
    position: relative;
    transition: background 0.2s ease;
  }

  .form-toggle-switch::after {
    content: '';
    position: absolute;
    width: 18px;
    height: 18px;
    background: var(--text);
    border-radius: 50%;
    top: 2px;
    left: 2px;
    transition: transform 0.2s ease;
  }

  .form-toggle.active .form-toggle-switch {
    background: var(--green);
  }

  .form-toggle.active .form-toggle-switch::after {
    transform: translateX(18px);
  }

  .form-toggle-label {
    font-size: 14px;
    color: var(--text);
  }

  .form-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
    padding-top: 20px;
    border-top: 1px solid var(--border);
  }

  .form-btn {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    padding: 12px 24px;
    border-radius: 6px;
    border: none;
    cursor: pointer;
    transition: all 0.2s ease;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .form-btn-primary {
    background: linear-gradient(135deg, var(--gold), #8B6914);
    color: #0D1520;
  }

  .form-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(201, 168, 76, 0.3);
  }

  .form-btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  .form-btn-secondary {
    background: var(--surface2);
    color: var(--text);
    border: 1px solid var(--border);
  }

  .form-btn-secondary:hover {
    background: var(--border);
  }

  .module-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .module-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: 4px;
  }

  .module-item-number {
    font-family: 'Space Mono', monospace;
    font-size: 12px;
    color: var(--gold);
    background: rgba(201, 168, 76, 0.1);
    padding: 4px 8px;
    border-radius: 3px;
  }

  .module-item-title {
    flex: 1;
    font-size: 14px;
    color: var(--text);
  }

  .module-item-count {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    color: var(--text-dim);
  }

  .module-add-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px;
    background: transparent;
    border: 1px dashed var(--border);
    border-radius: 4px;
    color: var(--text-dim);
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    text-transform: uppercase;
  }

  .module-add-btn:hover {
    border-color: var(--gold);
    color: var(--gold);
  }

  .lesson-list {
    margin-left: 24px;
    margin-top: 8px;
    padding-left: 16px;
    border-left: 2px solid var(--border);
  }

  .lesson-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    font-size: 13px;
    color: var(--text-dim);
  }

  .lesson-item::before {
    content: '→';
    color: var(--gold);
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

export default function CourseCreatePage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const { instructorCourses, createCourse, updateCourse, fetchInstructorCourses } = useAcademyStore();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    description: "",
    about: "",
    category: "",
    price: 0,
    currency: "USD",
    thumbnail: "",
    previewVideo: "",
    published: false,
  });

  useEffect(() => {
    if (isEdit && id) {
      // First fetch courses if not loaded
      if (instructorCourses.length === 0) {
        fetchInstructorCourses().then(() => {
          loadCourse(id);
        });
      } else {
        loadCourse(id);
      }
    }
  }, [id, isEdit, instructorCourses]);

  const loadCourse = (courseId: string) => {
    const course = instructorCourses.find((c) => c.id === courseId);
    if (course) {
      setFormData({
        title: course.title || "",
        slug: course.slug || "",
        description: course.description || "",
        about: course.about || "",
        category: course.category || "",
        price: course.price || 0,
        currency: course.currency || "USD",
        thumbnail: course.thumbnail || "",
        previewVideo: course.previewVideo || "",
        published: course.published || false,
      });
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));

    // Auto-generate slug from title
    if (name === "title" && !isEdit) {
      const slug = value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormData((prev) => ({ ...prev, slug }));
    }
  };

  const handleToggle = () => {
    setFormData((prev) => ({ ...prev, published: !prev.published }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isEdit && id) {
        await updateCourse(id, formData);
      } else {
        await createCourse(formData);
      }
      navigate("/academy/instructor");
    } catch (err) {
      console.error("Error saving course:", err);
    } finally {
      setSaving(false);
    }
  };

  // Get existing course for modules display
  const existingCourse = isEdit && id ? instructorCourses.find((c) => c.id === id) : null;

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
      <span className="ctx-sep">›</span>
      <span className="ctx-badge active">{isEdit ? "Edit Course" : "New Course"}</span>
    </div>
  );

  return (
    <>
      <style>{css}</style>
      <div className="course-form">
        {ctxBar}

        <div className="form-header">
          <div className="form-title">
            {isEdit ? "Edit Course" : "Create New Course"}
          </div>
          <div className="form-subtitle">
            {isEdit
              ? "Update your course details and content"
              : "Fill in the details to create a new course"}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <div className="form-section-title">Basic Information</div>
            <div className="form-grid">
              <div className="form-field full">
                <label className="form-label">
                  Course Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  className="form-input"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Complete Digital Marketing Masterclass"
                  required
                />
              </div>

              <div className="form-field">
                <label className="form-label">URL Slug</label>
                <input
                  type="text"
                  name="slug"
                  className="form-input"
                  value={formData.slug}
                  onChange={handleChange}
                  placeholder="course-url-slug"
                />
                <div className="form-hint">winnersempire.io/academy/courses/{formData.slug || "..."}</div>
              </div>

              <div className="form-field">
                <label className="form-label">
                  Category <span className="required">*</span>
                </label>
                <select
                  name="category"
                  className="form-select"
                  value={formData.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field full">
                <label className="form-label">
                  Short Description <span className="required">*</span>
                </label>
                <textarea
                  name="description"
                  className="form-textarea"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Brief description of what students will learn..."
                  required
                  style={{ minHeight: 80 }}
                />
              </div>

              <div className="form-field full">
                <label className="form-label">Full Description (About)</label>
                <textarea
                  name="about"
                  className="form-textarea"
                  value={formData.about}
                  onChange={handleChange}
                  placeholder="Detailed course description, prerequisites, what you'll learn..."
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Media</div>
            <div className="form-grid single">
              <div className="form-field">
                <label className="form-label">Thumbnail URL</label>
                <input
                  type="url"
                  name="thumbnail"
                  className="form-input"
                  value={formData.thumbnail}
                  onChange={handleChange}
                  placeholder="https://example.com/image.jpg"
                />
                <div className="form-hint">Recommended: 1280x720px</div>
              </div>

              <div className="form-field">
                <label className="form-label">Preview Video URL</label>
                <input
                  type="url"
                  name="previewVideo"
                  className="form-input"
                  value={formData.previewVideo}
                  onChange={handleChange}
                  placeholder="https://youtube.com/watch?v=..."
                />
                <div className="form-hint">YouTube or Vimeo URL for course preview</div>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Pricing</div>
            <div className="form-grid">
              <div className="form-field">
                <label className="form-label">Price (USD)</label>
                <input
                  type="number"
                  name="price"
                  className="form-input"
                  value={formData.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                />
                <div className="form-hint">Set to 0 for free courses</div>
              </div>

              <div className="form-field">
                <label className="form-label">Currency</label>
                <select
                  name="currency"
                  className="form-select"
                  value={formData.currency}
                  onChange={handleChange}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="KES">KES - Kenyan Shilling</option>
                  <option value="NGN">NGN - Nigerian Naira</option>
                  <option value="ZAR">ZAR - South African Rand</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <div className="form-section-title">Status</div>
            <div
              className={`form-toggle ${formData.published ? "active" : ""}`}
              onClick={handleToggle}
            >
              <div className="form-toggle-switch" />
              <div className="form-toggle-label">
                {formData.published ? "Published" : "Draft"}
              </div>
            </div>
            <div className="form-hint" style={{ marginTop: 12 }}>
              {formData.published
                ? "This course is visible to students"
                : "Only you can see this course"}
            </div>
          </div>

          {isEdit && existingCourse && existingCourse.modules.length > 0 && (
            <div className="form-section">
              <div className="form-section-title">Course Content</div>
              <div className="module-list">
                {existingCourse.modules.map((module, idx) => (
                  <div key={module.id} className="module-item">
                    <span className="module-item-number">M{idx + 1}</span>
                    <span className="module-item-title">{module.title}</span>
                    <span className="module-item-count">
                      {module.lessons.length} lessons
                    </span>
                  </div>
                ))}
              </div>
              <div className="form-hint" style={{ marginTop: 16 }}>
                Module and lesson management coming soon
              </div>
            </div>
          )}

          <div className="form-actions">
            <button
              type="button"
              className="form-btn form-btn-secondary"
              onClick={() => navigate("/academy/instructor")}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="form-btn form-btn-primary"
              disabled={saving || !formData.title || !formData.category}
            >
              {saving ? "Saving..." : isEdit ? "Update Course" : "Create Course"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
