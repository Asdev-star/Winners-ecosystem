// Phase 3: Winners Academy · learn.winnersempire.io
// LearningPathsPage.tsx — Browse and enroll in structured learning journeys

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import ContextBar from '../../components/ui/ContextBar';

interface LearningPath {
  id: string;
  title: string;
  description: string;
  tagline: string;
  category: string;
  difficulty: string;
  durationWeeks: number;
  thumbnailUrl?: string;
  certificate?: string;
  price: number;
  published: boolean;
  courses: PathCourseInfo[];
  enrollmentCount?: number;
  rating?: number;
}

interface PathCourseInfo {
  id: string;
  title: string;
  durationWeeks: number;
  orderIndex: number;
}

const LearningPathsPage = () => {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');

  useEffect(() => {
    const fetchPaths = async () => {
      try {
        const response = await fetch('/api/v1/academy/paths', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to load learning paths');
        
        const data = await response.json();
        setPaths(data);
      } catch (error) {
        console.error('Error loading paths:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPaths();
  }, []);

  const categories = [
    { id: 'all', label: 'All Paths', icon: '🌟' },
    { id: 'software', label: 'Software Dev', icon: '💻' },
    { id: 'marketing', label: 'Digital Marketing', icon: '📈' },
    { id: 'business', label: 'Business', icon: '💼' },
    { id: 'creative', label: 'Creative', icon: '🎨' },
    { id: 'finance', label: 'Finance', icon: '💰' },
    { id: 'wellness', label: 'Wellness', icon: '💪' },
  ];

  const filteredPaths = paths.filter(path => {
    if (selectedCategory !== 'all' && path.category !== selectedCategory) return false;
    if (selectedDifficulty !== 'all' && path.difficulty !== selectedDifficulty) return false;
    return true;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'var(--green)';
      case 'intermediate': return 'var(--gold)';
      case 'advanced': return 'var(--red)';
      default: return 'var(--text-dim)';
    }
  };

  if (loading) {
    return (
      <div className="paths-loading">
        <div className="skeleton-grid">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton" style={{ height: 320 }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="learning-paths-page">
      <ContextBar activeLayer="academy" />
      <div className="page-header">
        <div className="header-content">
          <h1>Learning Paths</h1>
          <p>Structured journeys to mastery. Complete courses in sequence to earn valuable credentials.</p>
        </div>
        
        <div className="stats-bar">
          <div className="stat">
            <span className="stat-value">{paths.length}</span>
            <span className="stat-label">Paths Available</span>
          </div>
          <div className="stat">
            <span className="stat-value">
              {paths.reduce((acc, p) => acc + p.courses.length, 0)}
            </span>
            <span className="stat-label">Total Courses</span>
          </div>
          <div className="stat">
            <span className="stat-value">{paths.filter(p => p.price === 0).length}</span>
            <span className="stat-label">Free Paths</span>
          </div>
        </div>
      </div>

      <div className="filters-bar">
        <div className="category-tabs">
          {categories.map(cat => (
            <button
              key={cat.id}
              className={`category-tab ${selectedCategory === cat.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.id)}
            >
              <span className="tab-icon">{cat.icon}</span>
              <span className="tab-label">{cat.label}</span>
            </button>
          ))}
        </div>

        <div className="difficulty-filter">
          <select 
            value={selectedDifficulty} 
            onChange={(e) => setSelectedDifficulty(e.target.value)}
          >
            <option value="all">All Levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>
      </div>

      <div className="paths-grid">
        {filteredPaths.map(path => (
          <Link key={path.id} to={`/academy/paths/${path.id}`} className="path-card">
            <div className="path-thumbnail">
              {path.thumbnailUrl ? (
                <img src={path.thumbnailUrl} alt={path.title} />
              ) : (
                <div className="thumbnail-placeholder">
                  <span>🗺️</span>
                </div>
              )}
              
              <div className="path-badge">
                {path.courses.length} courses
              </div>
            </div>

            <div className="path-content">
              <div className="path-meta">
                <span 
                  className="difficulty-badge"
                  style={{ color: getDifficultyColor(path.difficulty) }}
                >
                  {path.difficulty}
                </span>
                <span className="duration">
                  ⏱️ {path.durationWeeks} weeks
                </span>
              </div>

              <h3 className="path-title">{path.title}</h3>
              <p className="path-tagline">{path.tagline}</p>

              <div className="path-courses">
                <span className="courses-label">Includes:</span>
                <div className="courses-list">
                  {path.courses.slice(0, 3).map((course, idx) => (
                    <span key={course.id} className="course-chip">
                      {course.title}
                    </span>
                  ))}
                  {path.courses.length > 3 && (
                    <span className="more-courses">+{path.courses.length - 3} more</span>
                  )}
                </div>
              </div>

              <div className="path-footer">
                {path.certificate && (
                  <div className="certificate-badge">
                    🏆 {path.certificate}
                  </div>
                )}
                
                <div className="path-price">
                  {path.price === 0 ? (
                    <span className="free">Free</span>
                  ) : (
                    <span className="price">${path.price}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="path-arrow">
              →
            </div>
          </Link>
        ))}
      </div>

      {filteredPaths.length === 0 && (
        <div className="empty-state">
          <span className="empty-icon">🗺️</span>
          <h3>No paths found</h3>
          <p>Try adjusting your filters or check back soon for new learning paths.</p>
        </div>
      )}

      <style>{`
        .learning-paths-page {
          max-width: 1280px;
          margin: 0 auto;
          padding: 32px 24px;
        }

        .page-header {
          margin-bottom: 32px;
        }

        .header-content h1 {
          font-family: 'Syne', sans-serif;
          font-size: 36px;
          font-weight: 800;
          color: var(--text);
          margin: 0 0 8px 0;
        }

        .header-content p {
          font-family: 'Syne', sans-serif;
          font-size: 15px;
          color: var(--text-dim);
          margin: 0;
        }

        .stats-bar {
          display: flex;
          gap: 32px;
          margin-top: 24px;
          padding: 20px 24px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
        }

        .stat {
          display: flex;
          flex-direction: column;
        }

        .stat-value {
          font-family: 'Space Mono', monospace;
          font-size: 24px;
          font-weight: 700;
          color: var(--gold);
        }

        .stat-label {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--text-dim);
        }

        .filters-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
          gap: 16px;
        }

        .category-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .category-tab {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          color: var(--text-dim);
        }

        .category-tab:hover {
          border-color: var(--gold);
          color: var(--text);
        }

        .category-tab.active {
          background: var(--gold);
          border-color: var(--gold);
          color: var(--bg);
        }

        .tab-icon {
          font-size: 14px;
        }

        .difficulty-filter select {
          padding: 10px 16px;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text);
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          cursor: pointer;
        }

        .paths-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 24px;
        }

        .path-card {
          display: flex;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          overflow: hidden;
          text-decoration: none;
          transition: all 0.2s ease;
          position: relative;
        }

        .path-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, var(--gold), transparent);
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .path-card:hover {
          border-color: var(--gold);
          transform: translateY(-2px);
        }

        .path-card:hover::before {
          opacity: 1;
        }

        .path-thumbnail {
          width: 140px;
          min-height: 180px;
          position: relative;
          background: var(--surface2);
        }

        .path-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .thumbnail-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
        }

        .path-badge {
          position: absolute;
          bottom: 8px;
          left: 8px;
          background: rgba(13, 21, 32, 0.9);
          padding: 4px 8px;
          border-radius: 4px;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: var(--text);
        }

        .path-content {
          flex: 1;
          padding: 16px;
          display: flex;
          flex-direction: column;
        }

        .path-meta {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
        }

        .difficulty-badge {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .duration {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: var(--text-dim);
        }

        .path-title {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: var(--text);
          margin: 0 0 4px 0;
        }

        .path-tagline {
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          color: var(--text-dim);
          margin: 0 0 12px 0;
          line-height: 1.5;
        }

        .path-courses {
          flex: 1;
        }

        .courses-label {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-dim);
          display: block;
          margin-bottom: 6px;
        }

        .courses-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .course-chip {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          padding: 3px 8px;
          background: var(--surface2);
          border-radius: 3px;
          color: var(--text-dim);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 120px;
        }

        .more-courses {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          color: var(--gold);
        }

        .path-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--border);
        }

        .certificate-badge {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          color: var(--green);
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .path-price {
          font-family: 'Space Mono', monospace;
          font-size: 14px;
          font-weight: 700;
        }

        .path-price .free {
          color: var(--green);
        }

        .path-price .price {
          color: var(--gold);
        }

        .path-arrow {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--gold);
          font-size: 20px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .path-card:hover .path-arrow {
          opacity: 1;
        }

        .empty-state {
          text-align: center;
          padding: 80px 24px;
        }

        .empty-icon {
          font-size: 64px;
          display: block;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          font-family: 'Syne', sans-serif;
          font-size: 20px;
          color: var(--text);
          margin: 0 0 8px 0;
        }

        .empty-state p {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          color: var(--text-dim);
          margin: 0;
        }

        .skeleton-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
          gap: 24px;
        }

        .skeleton {
          background: linear-gradient(90deg, var(--surface2) 25%, var(--surface) 50%, var(--surface2) 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
          border-radius: 6px;
        }

        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

export default LearningPathsPage;
