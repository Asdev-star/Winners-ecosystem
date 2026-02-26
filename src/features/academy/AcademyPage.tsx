// src/features/academy/AcademyPage.tsx — Winners Academy V1.0
// Phase 3: Academy Layer — Course catalog with filters and enrollment

import { useState, useEffect } from "react";
import { useAuthStore } from "../../features/auth/authStore";

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
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { user } = useAuthStore();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/v1/academy/courses");
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

      <div style={{ marginBottom: 32 }}>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 42,
          fontWeight: 600,
          color: 'var(--gold)',
          marginBottom: 8,
          letterSpacing: '-0.5px'
        }}>
          Winners Academy
        </h1>
        <p style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 16,
          color: 'var(--text-dim)',
          marginBottom: 24
        }}>
          Master new skills, earn certificates, and unlock opportunities in the Winners Ecosystem.
        </p>
      </div>

      {/* Search and Filter */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Search courses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            flex: 1,
            minWidth: 200,
            padding: '12px 16px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'var(--surface2)',
            color: 'var(--text)',
            fontFamily: 'Syne, sans-serif'
          }}
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '12px 16px',
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'var(--surface2)',
            color: 'var(--text)',
            fontFamily: 'Syne, sans-serif'
          }}
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {cat === "all" ? "All Categories" : cat}
            </option>
          ))}
        </select>
      </div>

      {/* Course Grid */}
      {filteredCourses.length === 0 ? (
        <div style={{ textAlign:'center', padding:'60px 20px', color:'var(--text-dim)' }}>
          <div style={{ fontSize:32, marginBottom:12 }}>📚</div>
          <div style={{ fontFamily:'Syne', fontSize:16, marginBottom:8 }}>No courses found</div>
          <div style={{ fontFamily:'Space Mono', fontSize:11 }}>Try adjusting your search or filters</div>
        </div>
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
              borderRadius: 6,
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