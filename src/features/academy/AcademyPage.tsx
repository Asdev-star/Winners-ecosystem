// src/features/academy/AcademyPage.tsx — Winners Academy V1.0
// Phase 3: Academy Layer — Course catalog with filters and enrollment

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../lib/api";
import LayerSubNav from "../../components/ui/LayerSubNav";
import EmptyState from "../../components/ui/EmptyState";
import AIInsightBanner from "../../components/ui/AIInsightBanner";
import ContextBar from "../../components/ui/ContextBar";
import OmegaProfileAssignmentCard from "../../components/ui/OmegaProfileAssignmentCard";
import { ACADEMY_SUBNAV } from "../../components/ui/subnav";

interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  instructor: { name: string; email: string };
  enrollmentCount: number;
  averageRating: number;
  published: boolean;
  createdAt: string;
}

export default function AcademyPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/academy/courses`);
      if (!response.ok) throw new Error("Failed to fetch courses");
      const data = await response.json();
      setCourses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ["all", ...Array.from(new Set(courses.map(c => c.category)))];

  // Ecosystem context bar
  // Using ContextBar component for consistent ecosystem status display
  const ctxBar = <ContextBar activeLayer="academy" showLabels={true} />;

  if (loading) {
    return (
      <div style={{ padding: 20 }}>
        {ctxBar}
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>Loading courses...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 20 }}>
        {ctxBar}
        <div style={{ padding:16, borderRadius:6, border:'1px solid var(--red)',
          background:'rgba(224,90,78,0.08)', color:'var(--red)',
          fontFamily:'Space Mono', fontSize:12 }}>
          ⚠ {error} — <span onClick={fetchCourses} style={{cursor:'pointer',textDecoration:'underline'}}>Retry</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      {ctxBar}

      <OmegaProfileAssignmentCard layer="academy" />
      
      {/* Academy Sub-Navigation */}
      <LayerSubNav
        layer="academy"
        items={ACADEMY_SUBNAV}
        smartAction={{
          label: "Continue your React course",
          supervisor: "sage",
          href: "/academy/courses/react-fundamentals",
          urgency: "normal",
        }}
      />

      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <h1 style={{
            fontFamily: 'Syne, sans-serif',
            fontSize: 40,
            fontWeight: 800,
            color: 'var(--gold)',
            marginBottom: 8,
            letterSpacing: '-0.04em'
          }}>
            Winners Academy
          </h1>
          <AIInsightBanner page="academy" assistant="sage" />
          <button
            onClick={() => navigate("/academy/my-learning")}
            style={{
              padding: "10px 16px",
              borderRadius: 14,
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
            My Learning
          </button>
        </div>
        <p style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 16,
          color: 'var(--text-dim)',
          marginBottom: 24
        }}>
          Master new skills, earn certificates, and unlock opportunities in the Winners Ecosystem.
        </p>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 18 }}>
        <input
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: 14,
            border: '1px solid var(--border)',
            background: 'var(--surface2)',
            color: 'var(--text)',
            fontFamily: 'Syne, sans-serif',
            fontSize: 15,
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Category Filter Chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              border: selectedCategory === cat ? '1px solid var(--gold)' : '1px solid var(--border)',
              background: selectedCategory === cat ? 'rgba(201,168,76,0.12)' : 'var(--surface2)',
              color: selectedCategory === cat ? 'var(--gold)' : 'var(--text-dim)',
              fontFamily: 'Space Mono, monospace',
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              cursor: 'pointer',
              transition: 'all 200ms ease',
              whiteSpace: 'nowrap',
            }}
          >
            {cat === 'all' ? 'All Categories' : cat}
          </button>
        ))}
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <EmptyState
          assistant="sage"
          title="No courses found"
          description="Adjust your filters or explore the full catalog."
          illustration="academy"
          ctaLabel="Browse All Courses"
          ctaPath="/academy"
        />
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 24
        }}>
          {filteredCourses.map(course => (
            <div key={course.id} style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 18,
              position: 'relative',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'transform 0.2s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            onClick={() => window.location.href = `/academy/courses/${course.id}`}
            >
              {/* Gradient top border */}
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: 2,
                background: 'linear-gradient(90deg, var(--gold), transparent)'
              }} />

              <div style={{ padding: 20 }}>
                <div style={{ marginBottom: 12 }}>
                  <h3 style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: 18,
                    fontWeight: 700,
                    color: 'var(--text)',
                    marginBottom: 8
                  }}>
                    {course.title}
                  </h3>
                  <p style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: 14,
                    color: 'var(--text-dim)',
                    lineHeight: 1.4
                  }}>
                    {course.description.length > 120
                      ? `${course.description.substring(0, 120)}...`
                      : course.description}
                  </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{
                    fontFamily: 'Space Mono, monospace',
                    fontSize: 10,
                    color: 'var(--text-dim)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.1em'
                  }}>
                    {course.category}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ color: 'var(--gold)' }}>★</span>
                    <span style={{
                      fontFamily: 'Space Mono, monospace',
                      fontSize: 11,
                      color: 'var(--text-dim)'
                    }}>
                      {course.averageRating.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontFamily: 'Space Mono, monospace',
                    fontSize: 11,
                    color: 'var(--text-dim)'
                  }}>
                    by {course.instructor.name}
                  </span>
                  <span style={{
                    fontFamily: 'Space Mono, monospace',
                    fontSize: 11,
                    color: 'var(--text-dim)'
                  }}>
                    {course.enrollmentCount} enrolled
                  </span>
                </div>

                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <span style={{
                    fontFamily: 'Syne, sans-serif',
                    fontSize: 16,
                    fontWeight: 600,
                    color: course.price === 0 ? 'var(--green)' : 'var(--gold)'
                  }}>
                    {course.price === 0 ? 'FREE' : `$${course.price}`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
