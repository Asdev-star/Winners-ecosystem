// Phase 3 — Winners Academy — LiveSessionsPage.tsx
// Live cohort sessions for real-time learning experiences

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface LiveSession {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  instructorAvatar?: string;
  courseId?: string;
  courseName?: string;
  scheduledAt: string;
  duration: number; // minutes
  status: 'scheduled' | 'live' | 'ended';
  maxAttendees: number;
  currentAttendees: number;
  isPremium: boolean;
  tags: string[];
  recordingUrl?: string;
}

export default function LiveSessionsPage() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'live'>('all');
  const [selectedSession, setSelectedSession] = useState<LiveSession | null>(null);

  useEffect(() => {
    loadSessions();
  }, [filter]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('status', filter);
      
      const res = await fetch(`/api/v1/live-sessions?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinSession = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/v1/live-sessions/${sessionId}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const { roomUrl } = await res.json();
        window.open(roomUrl, '_blank');
      }
    } catch (error) {
      console.error('Failed to join session:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'live': return 'var(--green)';
      case 'scheduled': return 'var(--gold)';
      case 'ended': return 'var(--text-dim)';
      default: return 'var(--text-dim)';
    }
  };

  return (
    <div className="live-sessions-page">
      <style>{`
        .ctx-badge { font-family:'Space Mono',monospace; font-size:9px; letter-spacing:0.08em; padding:4px 10px; border-radius:3px; border:1px solid var(--border); background:var(--surface); color:var(--text-dim); text-transform:uppercase; }
        .ctx-badge.live { background:rgba(45,212,160,0.08); border-color:rgba(45,212,160,0.3); color:var(--green); }
        .ctx-badge.active { background:rgba(201,168,76,0.15); border-color:var(--gold); color:var(--gold); }
        .ctx-badge.building { background:rgba(201,168,76,0.08); border-color:rgba(201,168,76,0.25); color:var(--gold); }
        .ctx-badge.planned { background:rgba(43,95,142,0.08); border-color:rgba(43,95,142,0.25); color:var(--text-dim); }
        .ctx-sep { color:var(--border); font-size:11px; }
      `}</style>
      {/* Context Bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22, flexWrap: 'wrap', alignItems: 'center' }}>
        <span className="ctx-badge live">⬡ Core Engine</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge live">🧑‍🤝‍🧑 Community</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge active">🎓 Academy</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge building">🛒 Market</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge live">🤖 Intelligence</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge building">💼 Work</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge building">📱 Mobile</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge building">☁️ Cloud</span>
        <span className="ctx-sep">›</span>
        <span className="ctx-badge building">🧬 AI Platform</span>
      </div>

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 32 }}>
        <h1 style={{ 
          fontFamily: "'Cormorant Garamond', serif",
          fontSize: '2.5rem',
          fontWeight: 300,
          color: 'var(--text)',
          marginBottom: 8
        }}>
          Live <span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>Sessions</span>
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: '1rem', maxWidth: 600 }}>
          Join real-time learning experiences with expert instructors. 
          Live cohorts, Q&A sessions, and interactive workshops.
        </p>
      </div>

      {/* Filters */}
      <div className="filters" style={{ marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <button
          onClick={() => setFilter('all')}
          style={{
            padding: '8px 16px',
            borderRadius: 4,
            border: filter === 'all' ? '1px solid var(--gold)' : '1px solid var(--border)',
            background: filter === 'all' ? 'rgba(201,168,76,0.15)' : 'transparent',
            color: filter === 'all' ? 'var(--gold)' : 'var(--text-dim)',
            cursor: 'pointer',
            fontFamily: "'Space Mono', monospace",
            fontSize: '11px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            transition: 'all 200ms ease'
          }}
        >
          All Sessions
        </button>
        <button
          onClick={() => setFilter('upcoming')}
          style={{
            padding: '8px 16px',
            borderRadius: 4,
            border: filter === 'upcoming' ? '1px solid var(--gold)' : '1px solid var(--border)',
            background: filter === 'upcoming' ? 'rgba(201,168,76,0.15)' : 'transparent',
            color: filter === 'upcoming' ? 'var(--gold)' : 'var(--text-dim)',
            cursor: 'pointer',
            fontFamily: "'Space Mono', monospace",
            fontSize: '11px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            transition: 'all 200ms ease'
          }}
        >
          Upcoming
        </button>
        <button
          onClick={() => setFilter('live')}
          style={{
            padding: '8px 16px',
            borderRadius: 4,
            border: filter === 'live' ? '1px solid var(--green)' : '1px solid var(--border)',
            background: filter === 'live' ? 'rgba(45,212,160,0.15)' : 'transparent',
            color: filter === 'live' ? 'var(--green)' : 'var(--text-dim)',
            cursor: 'pointer',
            fontFamily: "'Space Mono', monospace",
            fontSize: '11px',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            transition: 'all 200ms ease'
          }}
        >
          🔴 Live Now
        </button>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="skeleton-container" style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {[1,2,3].map(i => (
            <div key={i} className="skeleton-card" style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              padding: 24,
              height: 200,
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0,
                height: 2,
                background: 'linear-gradient(90deg, var(--gold), transparent)'
              }} />
              <div style={{
                background: 'var(--surface2)',
                height: 20,
                width: '60%',
                marginBottom: 16,
                borderRadius: 4,
                animation: 'shimmer 1.5s infinite'
              }} />
              <div style={{
                background: 'var(--surface2)',
                height: 14,
                width: '80%',
                marginBottom: 8,
                borderRadius: 4,
                animation: 'shimmer 1.5s infinite'
              }} />
              <div style={{
                background: 'var(--surface2)',
                height: 14,
                width: '50%',
                borderRadius: 4,
                animation: 'shimmer 1.5s infinite'
              }} />
            </div>
          ))}
        </div>
      )}

      {/* Sessions Grid */}
      {!loading && sessions.length === 0 && (
        <div className="empty-state" style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: 60,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: 2,
            background: 'linear-gradient(90deg, var(--gold), transparent)'
          }} />
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎓</div>
          <h3 style={{ 
            color: 'var(--text)', 
            fontFamily: "'Syne', sans-serif",
            fontSize: '1.25rem',
            marginBottom: 8
          }}>
            No sessions found
          </h3>
          <p style={{ color: 'var(--text-dim)', marginBottom: 24 }}>
            {filter === 'live' 
              ? 'No live sessions right now. Check upcoming sessions below.'
              : filter === 'upcoming'
              ? 'No upcoming sessions scheduled. Check back later!'
              : 'No live sessions available at the moment.'}
          </p>
          <Link to="/academy" style={{
            color: 'var(--gold)',
            textDecoration: 'none',
            fontFamily: "'Space Mono', monospace",
            fontSize: '12px',
            letterSpacing: '0.1em'
          }}>
            Browse Courses →
          </Link>
        </div>
      )}

      {!loading && sessions.length > 0 && (
        <div className="sessions-grid" style={{ 
          display: 'grid', 
          gap: 20, 
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' 
        }}>
          {sessions.map(session => (
            <div 
              key={session.id} 
              className="session-card"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: 24,
                position: 'relative',
                overflow: 'hidden',
                transition: 'border-color 200ms ease, transform 200ms ease',
                cursor: 'pointer'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--gold)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
              onClick={() => setSelectedSession(session)}
            >
              {/* Gold gradient top border */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: session.status === 'live' 
                  ? 'linear-gradient(90deg, var(--green), transparent)'
                  : session.status === 'scheduled'
                  ? 'linear-gradient(90deg, var(--gold), transparent)'
                  : 'linear-gradient(90deg, var(--text-dim), transparent)'
              }} />

              {/* Status Badge */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 16 
              }}>
                <span style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '10px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  padding: '4px 10px',
                  borderRadius: 3,
                  border: `1px solid ${getStatusColor(session.status)}`,
                  background: `rgba(${session.status === 'live' ? '45,212,160' : session.status === 'scheduled' ? '201,168,76' : '90,122,150'}, 0.1)`,
                  color: getStatusColor(session.status)
                }}>
                  {session.status === 'live' ? '🔴 LIVE' : session.status === 'scheduled' ? '📅 Scheduled' : '✓ Ended'}
                </span>
                {session.isPremium && (
                  <span style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '10px',
                    letterSpacing: '0.1em',
                    padding: '4px 10px',
                    borderRadius: 3,
                    border: '1px solid var(--purple)',
                    background: 'rgba(155,111,255,0.1)',
                    color: 'var(--purple)'
                  }}>
                    PRO
                  </span>
                )}
              </div>

              {/* Title */}
              <h3 style={{
                color: 'var(--text)',
                fontFamily: "'Syne', sans-serif",
                fontSize: '1.1rem',
                fontWeight: 700,
                marginBottom: 8,
                lineHeight: 1.4
              }}>
                {session.title}
              </h3>

              {/* Description */}
              <p style={{
                color: 'var(--text-dim)',
                fontSize: '0.9rem',
                lineHeight: 1.6,
                marginBottom: 16,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {session.description}
              </p>

              {/* Instructor */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 10,
                marginBottom: 16 
              }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: 'var(--surface2)',
                  border: '2px solid var(--gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14
                }}>
                  {session.instructorAvatar ? (
                    <img src={session.instructorAvatar} alt={session.instructorName} style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                  ) : (
                    session.instructorName.charAt(0)
                  )}
                </div>
                <span style={{ color: 'var(--text)', fontSize: '0.85rem' }}>
                  {session.instructorName}
                </span>
              </div>

              {/* Meta Info */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 16,
                borderTop: '1px solid var(--border)'
              }}>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '10px',
                    color: 'var(--text-dim)',
                    letterSpacing: '0.05em'
                  }}>
                    📅 {formatDate(session.scheduledAt)}
                  </span>
                  <span style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '10px',
                    color: 'var(--text-dim)',
                    letterSpacing: '0.05em'
                  }}>
                    ⏱️ {session.duration} min
                  </span>
                  <span style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '10px',
                    color: 'var(--text-dim)',
                    letterSpacing: '0.05em'
                  }}>
                    👥 {session.currentAttendees}/{session.maxAttendees}
                  </span>
                </div>
                
                {session.status === 'live' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      joinSession(session.id);
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 4,
                      border: 'none',
                      background: 'var(--green)',
                      color: 'var(--bg)',
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'all 200ms ease'
                    }}
                  >
                    Join Now
                  </button>
                )}
                
                {session.status === 'scheduled' && session.currentAttendees < session.maxAttendees && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      joinSession(session.id);
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 4,
                      border: '1px solid var(--gold)',
                      background: 'transparent',
                      color: 'var(--gold)',
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '11px',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                      transition: 'all 200ms ease'
                    }}
                  >
                    Reserve
                  </button>
                )}
              </div>

              {/* Tags */}
              {session.tags.length > 0 && (
                <div style={{ 
                  display: 'flex', 
                  gap: 8, 
                  marginTop: 16,
                  flexWrap: 'wrap' 
                }}>
                  {session.tags.slice(0, 3).map(tag => (
                    <span key={tag} style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '9px',
                      letterSpacing: '0.1em',
                      padding: '3px 8px',
                      borderRadius: 2,
                      background: 'var(--surface2)',
                      color: 'var(--text-dim)'
                    }}>
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Session Detail Modal */}
      {selectedSession && (
        <div 
          className="modal-overlay"
          onClick={() => setSelectedSession(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(13, 21, 32, 0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 20
          }}
        >
          <div 
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 6,
              maxWidth: 600,
              width: '100%',
              maxHeight: '80vh',
              overflow: 'auto',
              position: 'relative'
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: 'linear-gradient(90deg, var(--gold), transparent)'
            }} />
            
            <button
              onClick={() => setSelectedSession(null)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'transparent',
                border: 'none',
                color: 'var(--text-dim)',
                fontSize: 24,
                cursor: 'pointer',
                lineHeight: 1
              }}
            >
              ×
            </button>

            <div style={{ padding: 32 }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: 16 
              }}>
                <span style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: '10px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  padding: '4px 10px',
                  borderRadius: 3,
                  border: `1px solid ${getStatusColor(selectedSession.status)}`,
                  background: `rgba(${selectedSession.status === 'live' ? '45,212,160' : selectedSession.status === 'scheduled' ? '201,168,76' : '90,122,150'}, 0.1)`,
                  color: getStatusColor(selectedSession.status)
                }}>
                  {selectedSession.status}
                </span>
                {selectedSession.courseName && (
                  <Link 
                    to={`/academy/courses/${selectedSession.courseId}`}
                    style={{
                      color: 'var(--ice)',
                      textDecoration: 'none',
                      fontSize: '0.85rem'
                    }}
                  >
                    {selectedSession.courseName}
                  </Link>
                )}
              </div>

              <h2 style={{
                color: 'var(--text)',
                fontFamily: "'Syne', sans-serif",
                fontSize: '1.5rem',
                fontWeight: 700,
                marginBottom: 16
              }}>
                {selectedSession.title}
              </h2>

              <p style={{
                color: 'var(--text-dim)',
                fontSize: '1rem',
                lineHeight: 1.7,
                marginBottom: 24
              }}>
                {selectedSession.description}
              </p>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)', 
                gap: 16,
                marginBottom: 24 
              }}>
                <div style={{
                  background: 'var(--surface2)',
                  padding: 16,
                  borderRadius: 4
                }}>
                  <div style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '10px',
                    color: 'var(--text-dim)',
                    letterSpacing: '0.1em',
                    marginBottom: 4
                  }}>
                    DATE & TIME
                  </div>
                  <div style={{ color: 'var(--text)' }}>
                    {formatDate(selectedSession.scheduledAt)}
                  </div>
                </div>
                <div style={{
                  background: 'var(--surface2)',
                  padding: 16,
                  borderRadius: 4
                }}>
                  <div style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '10px',
                    color: 'var(--text-dim)',
                    letterSpacing: '0.1em',
                    marginBottom: 4
                  }}>
                    DURATION
                  </div>
                  <div style={{ color: 'var(--text)' }}>
                    {selectedSession.duration} minutes
                  </div>
                </div>
                <div style={{
                  background: 'var(--surface2)',
                  padding: 16,
                  borderRadius: 4
                }}>
                  <div style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '10px',
                    color: 'var(--text-dim)',
                    letterSpacing: '0.1em',
                    marginBottom: 4
                  }}>
                    ATTENDEES
                  </div>
                  <div style={{ color: 'var(--text)' }}>
                    {selectedSession.currentAttendees} / {selectedSession.maxAttendees}
                  </div>
                </div>
                <div style={{
                  background: 'var(--surface2)',
                  padding: 16,
                  borderRadius: 4
                }}>
                  <div style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '10px',
                    color: 'var(--text-dim)',
                    letterSpacing: '0.1em',
                    marginBottom: 4
                  }}>
                    INSTRUCTOR
                  </div>
                  <div style={{ color: 'var(--text)' }}>
                    {selectedSession.instructorName}
                  </div>
                </div>
              </div>

              {selectedSession.recordingUrl && selectedSession.status === 'ended' && (
                <div style={{ marginBottom: 24 }}>
                  <a 
                    href={selectedSession.recordingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '12px 24px',
                      borderRadius: 4,
                      border: '1px solid var(--ice)',
                      background: 'transparent',
                      color: 'var(--ice)',
                      textDecoration: 'none',
                      fontFamily: "'Space Mono', monospace",
                      fontSize: '12px',
                      letterSpacing: '0.1em'
                    }}
                  >
                    ▶ Watch Recording
                  </a>
                </div>
              )}

              {selectedSession.status === 'live' && (
                <button
                  onClick={() => joinSession(selectedSession.id)}
                  style={{
                    width: '100%',
                    padding: '16px 24px',
                    borderRadius: 4,
                    border: 'none',
                    background: 'var(--green)',
                    color: 'var(--bg)',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '14px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 200ms ease'
                  }}
                >
                  Join Live Session
                </button>
              )}

              {selectedSession.status === 'scheduled' && selectedSession.currentAttendees < selectedSession.maxAttendees && (
                <button
                  onClick={() => joinSession(selectedSession.id)}
                  style={{
                    width: '100%',
                    padding: '16px 24px',
                    borderRadius: 4,
                    border: '1px solid var(--gold)',
                    background: 'transparent',
                    color: 'var(--gold)',
                    fontFamily: "'Space Mono', monospace",
                    fontSize: '14px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 200ms ease'
                  }}
                >
                  Reserve Your Spot
                </button>
              )}

              {selectedSession.status === 'scheduled' && selectedSession.currentAttendees >= selectedSession.maxAttendees && (
                <div style={{
                  padding: 16,
                  borderRadius: 4,
                  background: 'rgba(224, 90, 78, 0.1)',
                  border: '1px solid var(--red)',
                  textAlign: 'center'
                }}>
                  <span style={{ color: 'var(--red)', fontFamily: "'Space Mono', monospace", fontSize: '12px' }}>
                    Session is full. Join the waitlist.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}