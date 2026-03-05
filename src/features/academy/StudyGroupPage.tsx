// Phase 3: Winners Academy · learn.winnersempire.io
// StudyGroupPage.tsx — AI-facilitated peer learning groups

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

interface StudyGroup {
  id: string;
  name: string;
  description?: string;
  courseId: string;
  courseName: string;
  maxMembers: number;
  members: GroupMember[];
  sagePrompts: SagePrompt[];
  active: boolean;
  createdAt: string;
}

interface GroupMember {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  role: string;
  joinedAt: string;
  progress?: number;
}

interface SagePrompt {
  id: string;
  content: string;
  createdAt: string;
  weekNumber: number;
}

interface StudyGroupPageProps {
  courseId?: string;
}

const StudyGroupPage = ({ courseId }: StudyGroupPageProps) => {
  const { groupId } = useParams<{ groupId?: string }>();
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const url = courseId 
          ? `/api/v1/academy/study-groups?courseId=${courseId}`
          : '/api/v1/academy/study-groups';
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to load study groups');
        
        const data = await response.json();
        setGroups(data);
        
        if (groupId) {
          const found = data.find((g: StudyGroup) => g.id === groupId);
          if (found) setSelectedGroup(found);
        }
      } catch (error) {
        console.error('Error loading groups:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, [courseId, groupId]);

  const handleCreateGroup = async () => {
    try {
      const response = await fetch('/api/v1/academy/study-groups', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDesc,
          courseId
        })
      });

      if (!response.ok) throw new Error('Failed to create group');

      const newGroup = await response.json();
      setGroups([...groups, newGroup]);
      setSelectedGroup(newGroup);
      setShowCreateModal(false);
      setNewGroupName('');
      setNewGroupDesc('');
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      const response = await fetch(`/api/v1/academy/study-groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to join group');

      const updatedGroup = await response.json();
      setGroups(groups.map(g => g.id === groupId ? updatedGroup : g));
      setSelectedGroup(updatedGroup);
    } catch (error) {
      console.error('Error joining group:', error);
    }
  };

  if (loading) {
    return (
      <div className="study-groups-loading">
        <div className="skeleton" style={{ height: 400 }} />
      </div>
    );
  }

  return (
    <div className="study-groups-page">
      <div className="page-header">
        <div className="header-content">
          <h1>Study Groups</h1>
          <p>Learn together. SAGE facilitates weekly discussions to keep your group on track.</p>
        </div>

        <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
          + Create Group
        </button>
      </div>

      {!groupId && (
        <div className="sage-intro">
          <div className="sage-badge">
            <span className="sage-icon">🎓</span>
            <span className="sage-label">SAGE</span>
          </div>
          <div className="sage-content">
            <h3>AI-Facilitated Peer Learning</h3>
            <p>
              SAGE creates study groups of 3-8 learners at similar progress levels. 
              Every Monday, SAGE generates a discussion prompt based on your quiz scores 
              and module progress. Learn from peers while SAGE ensures no one falls behind.
            </p>
            <ul className="sage-features">
              <li>📊 SAGE analyzes quiz performance to create balanced groups</li>
              <li>💬 Weekly AI-generated discussion prompts</li>
              <li>🎯 3-4x higher completion rates vs solo learning</li>
              <li>🏆 Group completion milestones and badges</li>
            </ul>
          </div>
        </div>
      )}

      {selectedGroup ? (
        <div className="group-detail">
          <button className="back-btn" onClick={() => setSelectedGroup(null)}>
            ← Back to Groups
          </button>

          <div className="group-header">
            <div className="group-info">
              <h2>{selectedGroup.name}</h2>
              <p className="course-name">📚 {selectedGroup.courseName}</p>
              {selectedGroup.description && (
                <p className="group-desc">{selectedGroup.description}</p>
              )}
            </div>

            <div className="group-stats">
              <div className="stat">
                <span className="stat-value">{selectedGroup.members.length}</span>
                <span className="stat-label">/ {selectedGroup.maxMembers} Members</span>
              </div>
            </div>
          </div>

          <div className="members-section">
            <h3>Group Members</h3>
            <div className="members-grid">
              {selectedGroup.members.map(member => (
                <div key={member.id} className="member-card">
                  <div className="member-avatar">
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.name} />
                    ) : (
                      <span className="avatar-placeholder">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    {member.progress === 100 && (
                      <span className="completed-badge">✓</span>
                    )}
                  </div>
                  <div className="member-info">
                    <span className="member-name">{member.name}</span>
                    <span className="member-role">{member.role}</span>
                  </div>
                  {member.progress !== undefined && (
                    <div className="member-progress">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${member.progress}%` }} 
                      />
                      <span>{member.progress}%</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {selectedGroup.sagePrompts.length > 0 && (
            <div className="sage-prompts-section">
              <h3>
                <span className="sage-icon">🎓</span>
                SAGE Discussion Prompts
              </h3>
              <div className="prompts-timeline">
                {selectedGroup.sagePrompts.map(prompt => (
                  <div key={prompt.id} className="prompt-card">
                    <div className="prompt-header">
                      <span className="week-label">Week {prompt.weekNumber}</span>
                      <span className="prompt-date">
                        {new Date(prompt.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="prompt-content">{prompt.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="groups-grid">
          {groups.map(group => (
            <div key={group.id} className="group-card">
              <div className="group-card-header">
                <h3>{group.name}</h3>
                <span className={`status ${group.active ? 'active' : 'inactive'}`}>
                  {group.active ? 'Active' : 'Completed'}
                </span>
              </div>

              <p className="group-course">📚 {group.courseName}</p>
              
              {group.description && (
                <p className="group-desc">{group.description}</p>
              )}

              <div className="members-preview">
                <div className="avatars-stack">
                  {group.members.slice(0, 4).map((member, idx) => (
                    <div 
                      key={member.id} 
                      className="mini-avatar"
                      style={{ zIndex: 4 - idx }}
                    >
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {group.members.length > 4 && (
                    <div className="more-members">
                      +{group.members.length - 4}
                    </div>
                  )}
                </div>
                <span className="members-count">
                  {group.members.length}/{group.maxMembers} members
                </span>
              </div>

              {group.sagePrompts.length > 0 && (
                <div className="latest-prompt">
                  <span className="sage-label">Latest SAGE prompt:</span>
                  <p>{group.sagePrompts[group.sagePrompts.length - 1].content.substring(0, 100)}...</p>
                </div>
              )}

              <button 
                className="btn-join"
                onClick={() => handleJoinGroup(group.id)}
                disabled={group.members.length >= group.maxMembers}
              >
                {group.members.length >= group.maxMembers ? 'Full' : 'Join Group'}
              </button>
            </div>
          ))}

          {groups.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">👥</span>
              <h3>No study groups yet</h3>
              <p>Create a study group to start learning with peers. SAGE will help facilitate discussions.</p>
              <button className="btn-primary" onClick={() => setShowCreateModal(true)}>
                Create First Group
              </button>
            </div>
          )}
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Create Study Group</h2>
            
            <div className="form-group">
              <label>Group Name</label>
              <input
                type="text"
                value={newGroupName}
                onChange={e => setNewGroupName(e.target.value)}
                placeholder="e.g., React Fundamentals Cohort A"
              />
            </div>

            <div className="form-group">
              <label>Description (optional)</label>
              <textarea
                value={newGroupDesc}
                onChange={e => setNewGroupDesc(e.target.value)}
                placeholder="What will your group focus on?"
                rows={3}
              />
            </div>

            <div className="modal-actions">
              <button 
                className="btn-secondary" 
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim()}
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .study-groups-page {
          max-width: 1280px;
          margin: 0 auto;
          padding: 32px 24px;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
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

        .sage-intro {
          display: flex;
          gap: 20px;
          background: linear-gradient(135deg, rgba(45, 212, 160, 0.08), rgba(201, 168, 76, 0.08));
          border: 1px solid rgba(45, 212, 160, 0.2);
          border-radius: 6px;
          padding: 24px;
          margin-bottom: 32px;
        }

        .sage-badge {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px;
          background: var(--surface);
          border-radius: 6px;
          min-width: 70px;
        }

        .sage-icon {
          font-size: 28px;
        }

        .sage-label {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--green);
        }

        .sage-content h3 {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          color: var(--text);
          margin: 0 0 8px 0;
        }

        .sage-content p {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          color: var(--text-dim);
          margin: 0 0 16px 0;
          line-height: 1.6;
        }

        .sage-features {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .sage-features li {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: var(--text-dim);
        }

        .groups-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 24px;
        }

        .group-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 20px;
          transition: all 0.2s ease;
        }

        .group-card:hover {
          border-color: var(--gold);
        }

        .group-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .group-card-header h3 {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          color: var(--text);
          margin: 0;
        }

        .status {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          text-transform: uppercase;
          padding: 4px 8px;
          border-radius: 4px;
        }

        .status.active {
          background: rgba(45, 212, 160, 0.15);
          color: var(--green);
        }

        .status.inactive {
          background: rgba(90, 122, 150, 0.15);
          color: var(--text-dim);
        }

        .group-course {
          font-family: 'Space Mono', monospace;
          font-size: 12px;
          color: var(--text-dim);
          margin: 0 0 8px 0;
        }

        .group-desc {
          font-family: 'Syne', sans-serif;
          font-size: 13px;
          color: var(--text-dim);
          margin: 0 0 16px 0;
        }

        .members-preview {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .avatars-stack {
          display: flex;
        }

        .mini-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--gold);
          color: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          font-weight: 700;
          border: 2px solid var(--surface);
          margin-left: -8px;
        }

        .mini-avatar:first-child {
          margin-left: 0;
        }

        .more-members {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--surface2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: var(--text-dim);
          margin-left: -8px;
        }

        .members-count {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: var(--text-dim);
        }

        .latest-prompt {
          background: var(--surface2);
          border-radius: 4px;
          padding: 12px;
          margin-bottom: 16px;
        }

        .latest-prompt .sage-label {
          display: block;
          margin-bottom: 4px;
        }

        .latest-prompt p {
          font-family: 'Syne', sans-serif;
          font-size: 12px;
          color: var(--text-dim);
          margin: 0;
          line-height: 1.5;
        }

        .btn-join {
          width: 100%;
          padding: 12px;
          background: var(--gold);
          color: var(--bg);
          border: none;
          border-radius: 4px;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-join:hover:not(:disabled) {
          filter: brightness(1.1);
        }

        .btn-join:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-primary, .btn-secondary {
          padding: 12px 24px;
          border-radius: 4px;
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .btn-primary {
          background: var(--gold);
          color: var(--bg);
          border: none;
        }

        .btn-secondary {
          background: transparent;
          color: var(--text);
          border: 1px solid var(--border);
        }

        .group-detail {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 32px;
        }

        .back-btn {
          background: none;
          border: none;
          color: var(--gold);
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          cursor: pointer;
          margin-bottom: 24px;
        }

        .group-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 32px;
        }

        .group-info h2 {
          font-family: 'Syne', sans-serif;
          font-size: 28px;
          margin: 0 0 8px 0;
          color: var(--text);
        }

        .course-name {
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          color: var(--text-dim);
          margin: 0;
        }

        .members-section h3, .sage-prompts-section h3 {
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          margin: 0 0 16px 0;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .members-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
        }

        .member-card {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: var(--surface2);
          border-radius: 6px;
        }

        .member-avatar {
          position: relative;
          width: 44px;
          height: 44px;
        }

        .member-avatar img, .avatar-placeholder {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .avatar-placeholder {
          background: var(--gold);
          color: var(--bg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-size: 18px;
          font-weight: 700;
        }

        .completed-badge {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 18px;
          height: 18px;
          background: var(--green);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          color: var(--bg);
          border: 2px solid var(--surface);
        }

        .member-info {
          display: flex;
          flex-direction: column;
        }

        .member-name {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          color: var(--text);
        }

        .member-role {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: var(--text-dim);
          text-transform: uppercase;
        }

        .member-progress {
          margin-left: auto;
          width: 60px;
        }

        .member-progress .progress-bar {
          height: 4px;
          background: var(--surface);
          border-radius: 2px;
          overflow: hidden;
        }

        .member-progress .progress-bar::after {
          content: '';
          display: block;
          height: 100%;
          background: var(--green);
        }

        .member-progress span {
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          color: var(--text-dim);
        }

        .prompts-timeline {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .prompt-card {
          background: var(--surface2);
          border-radius: 6px;
          padding: 20px;
          border-left: 3px solid var(--green);
        }

        .prompt-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .week-label {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          color: var(--green);
          text-transform: uppercase;
        }

        .prompt-date {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: var(--text-dim);
        }

        .prompt-content {
          font-family: 'Syne', sans-serif;
          font-size: 14px;
          color: var(--text);
          margin: 0;
          line-height: 1.6;
        }

        .empty-state {
          text-align: center;
          padding: 80px 24px;
          grid-column: 1 / -1;
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
          margin: 0 0 24px 0;
        }

        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .modal {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 32px;
          max-width: 480px;
          width: 100%;
        }

        .modal h2 {
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          margin: 0 0 24px 0;
          color: var(--text);
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-dim);
          margin-bottom: 8px;
        }

        .form-group input, .form-group textarea {
          width: 100%;
          padding: 12px;
          background: var(--surface2);
          border: 1px solid var(--border);
          border-radius: 4px;
          color: var(--text);
          font-family: 'Syne', sans-serif;
          font-size: 14px;
        }

        .form-group input:focus, .form-group textarea:focus {
          outline: none;
          border-color: var(--gold);
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
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

export default StudyGroupPage;
