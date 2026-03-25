// src/features/community/DiasporaDirectoryPage.tsx

import { useState, useEffect } from "react";
import { useAuthStore } from "../auth/authStore";
import { API_BASE } from "../../lib/api";

const API = API_BASE;

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .dd-root {
    display: flex; gap: 0; min-height: 100vh;
    background: var(--bg); font-family: 'Syne', sans-serif; padding-bottom: 80px;
  }

  .dd-container { flex: 1; max-width: 1200px; margin: 0 auto; padding: 28px 20px; }

  .dd-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 28px;
  }

  .dd-title-section h1 {
    font-size: 28px; font-weight: 800; color: var(--text); margin: 0 0 8px 0;
  }
  .dd-subtitle { color: var(--text-dim); font-size: 14px; }

  .dd-filters {
    display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px;
  }

  .dd-filter-select {
    background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
    padding: 10px 16px; color: var(--text); font-family: 'Syne', sans-serif;
    font-size: 13px; min-width: 160px; cursor: pointer;
  }
  .dd-filter-select:focus { outline: none; border-color: var(--gold); }

  .dd-search {
    flex: 1; min-width: 200px;
    background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
    padding: 10px 16px; color: var(--text); font-family: 'Syne', sans-serif;
    font-size: 13px;
  }
  .dd-search:focus { outline: none; border-color: var(--gold); }

  .dd-grid {
    display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }

  .dd-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
    padding: 20px; position: relative; overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .dd-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
  }
  .dd-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 32px rgba(0,0,0,0.4);
  }

  .dd-card-header {
    display: flex; align-items: center; gap: 14px; margin-bottom: 16px;
  }

  .dd-avatar {
    width: 56px; height: 56px; border-radius: 50%;
    background: rgba(201,168,76,0.12); display: flex; align-items: center; justify-content: center;
    font-size: 20px; font-weight: 700; color: var(--gold);
    border: 2px solid rgba(201,168,76,0.3); position: relative;
  }
  .dd-avatar.online::after {
    content: ''; position: absolute; bottom: 2px; right: 2px; width: 14px; height: 14px;
    background: var(--green); border-radius: 50%; border: 2px solid var(--surface);
  }

  .dd-user-info h3 {
    font-size: 16px; font-weight: 700; color: var(--text); margin: 0 0 4px 0;
  }

  .dd-location {
    font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim);
    display: flex; align-items: center; gap: 4px;
  }

  .dd-industry-badge {
    display: inline-block; background: rgba(137,196,225,0.1); color: var(--ice);
    font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.1em;
    text-transform: uppercase; padding: 4px 10px; border-radius: 20px;
    margin-bottom: 12px;
  }

  .dd-bio {
    font-size: 13px; color: var(--text-dim); line-height: 1.5; margin-bottom: 16px;
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
  }

  .dd-skills {
    display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;
  }

  .dd-skill-tag {
    background: rgba(155,111,255,0.1); color: var(--purple);
    font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.05em;
    padding: 4px 8px; border-radius: 4px;
  }

  .dd-card-footer {
    display: flex; justify-content: space-between; align-items: center;
    padding-top: 12px; border-top: 1px solid var(--border);
  }

  .dd-profile-link {
    background: linear-gradient(135deg, var(--gold) 0%, var(--blue) 100%);
    border: none; border-radius: 8px; padding: 8px 16px;
    color: var(--bg); font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
  }
  .dd-profile-link:hover { transform: scale(1.02); box-shadow: 0 4px 12px rgba(201,168,76,0.3); }

  .dd-stats { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }

  .dd-empty {
    text-align: center; padding: 60px 20px; color: var(--text-dim);
  }
  .dd-empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
  .dd-empty h3 { font-size: 18px; color: var(--text); margin-bottom: 8px; }

  .dd-loading {
    display: flex; justify-content: center; align-items: center; padding: 60px;
  }
  .dd-spinner {
    width: 32px; height: 32px; border: 3px solid var(--border); border-top-color: var(--gold);
    border-radius: 50%; animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .dd-edit-modal {
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    background: rgba(13,21,32,0.9); display: flex; align-items: center; justify-content: center;
    z-index: 1000; padding: 20px;
  }

  .dd-modal-content {
    background: var(--surface); border: 1px solid var(--border); border-radius: 16px;
    width: 100%; max-width: 500px; max-height: 90vh; overflow-y: auto;
    position: relative;
  }
  .dd-modal-content::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
  }

  .dd-modal-header {
    padding: 20px; border-bottom: 1px solid var(--border);
    display: flex; justify-content: space-between; align-items: center;
  }
  .dd-modal-header h2 { font-size: 18px; color: var(--text); margin: 0; }
  .dd-close-btn { background: none; border: none; color: var(--text-dim); font-size: 24px; cursor: pointer; }

  .dd-modal-body { padding: 20px; }

  .dd-form-group { margin-bottom: 16px; }
  .dd-form-group label {
    display: block; font-family: 'Space Mono', monospace; font-size: 10px;
    color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px;
  }
  .dd-form-input, .dd-form-textarea, .dd-form-select {
    width: 100%; background: var(--bg); border: 1px solid var(--border); border-radius: 8px;
    padding: 12px; color: var(--text); font-family: 'Syne', sans-serif; font-size: 14px;
  }
  .dd-form-input:focus, .dd-form-textarea:focus, .dd-form-select:focus {
    outline: none; border-color: var(--gold);
  }
  .dd-form-textarea { min-height: 80px; resize: vertical; }

  .dd-skills-input {
    display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px;
  }
  .dd-skill-tag.input {
    background: rgba(201,168,76,0.1); color: var(--gold);
    padding: 6px 12px; cursor: pointer;
  }
  .dd-skill-tag.input:hover { background: rgba(201,168,76,0.2); }

  .dd-modal-footer {
    padding: 16px 20px; border-top: 1px solid var(--border);
    display: flex; justify-content: flex-end; gap: 12px;
  }

  .dd-btn {
    padding: 10px 20px; border-radius: 8px; font-family: 'Syne', sans-serif;
    font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s;
  }
  .dd-btn-secondary {
    background: transparent; border: 1px solid var(--border); color: var(--text-dim);
  }
  .dd-btn-secondary:hover { border-color: var(--text-dim); color: var(--text); }
  .dd-btn-primary {
    background: linear-gradient(135deg, var(--gold) 0%, var(--blue) 100%); border: none; color: var(--bg);
  }
  .dd-btn-primary:hover { box-shadow: 0 4px 12px rgba(201,168,76,0.3); }

  .dd-toggle {
    display: flex; align-items: center; gap: 10px;
  }
  .dd-toggle-switch {
    width: 44px; height: 24px; background: var(--border); border-radius: 12px; position: relative;
    cursor: pointer; transition: background 0.2s;
  }
  .dd-toggle-switch.active { background: var(--green); }
  .dd-toggle-switch::after {
    content: ''; position: absolute; top: 2px; left: 2px; width: 20px; height: 20px;
    background: var(--text); border-radius: 50%; transition: transform 0.2s;
  }
  .dd-toggle-switch.active::after { transform: translateX(20px); }

  @media (max-width: 768px) {
    .dd-header { flex-direction: column; align-items: flex-start; gap: 16px; }
    .dd-filters { flex-direction: column; }
    .dd-filter-select, .dd-search { width: 100%; }
  }
`;

const COUNTRIES = [
  "Nigeria",
  "Kenya",
  "Ghana",
  "South Africa",
  "Egypt",
  "Morocco",
  "Ethiopia",
  "Tanzania",
  "Uganda",
  "Rwanda",
  "Senegal",
  "Ivory Coast",
  "Cameroon",
  "UK",
  "USA",
  "Canada",
  "Germany",
  "France",
  "Netherlands",
  "UAE",
  "Other",
];

const INDUSTRIES = [
  "Technology",
  "Finance & Banking",
  "Healthcare",
  "Education",
  "Creative Arts",
  "Marketing & Media",
  "E-commerce",
  "Real Estate",
  "Legal",
  "Consulting",
  "Music & Entertainment",
  "Food & Hospitality",
  "Sports",
  "Non-profit",
  "Other",
];

const COMMON_SKILLS = [
  "React",
  "Node.js",
  "Python",
  "UI/UX Design",
  "Graphic Design",
  "Video Editing",
  "Copywriting",
  "Social Media",
  "SEO",
  "Data Analysis",
  "Project Management",
  "Sales",
  "Finance",
  "Accounting",
  "Photography",
  "Content Creation",
];

interface UserProfile {
  id: string;
  name: string;
  email: string;
  country?: string | null;
  city?: string | null;
  bio?: string | null;
  skills?: string[] | null;
  industry?: string | null;
  isPublicProfile?: boolean;
  profileViews?: number;
}

export default function DiasporaDirectoryPage() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCountry, setFilterCountry] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: user?.name || "",
    country: user?.country || "",
    city: user?.city || "",
    bio: user?.bio || "",
    skills: user?.skills || ([] as string[]),
    industry: user?.industry || "",
    isPublicProfile: user?.isPublicProfile ?? true,
  });

  useEffect(() => {
    fetchUsers();
  }, [search, filterCountry, filterIndustry]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (filterCountry) params.append("country", filterCountry);
      if (filterIndustry) params.append("industry", filterIndustry);
      params.append("publicOnly", "true");

      const res = await fetch(`${API}/users/directory?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      const res = await fetch(`${API}/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(editForm),
      });
      if (res.ok) {
        setShowEditModal(false);
        fetchUsers();
      }
    } catch (err) {
      console.error("Failed to save profile:", err);
    }
  };

  const toggleSkill = (skill: string) => {
    setEditForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <style>{css}</style>
      <div className="dd-root">
        <div className="dd-container">
          <div className="dd-header">
            <div className="dd-title-section">
              <h1>🌍 Diaspora Directory</h1>
              <p className="dd-subtitle">
                Connect with Africans worldwide by country, industry, and skills
              </p>
            </div>
            {user && (
              <button
                className="dd-profile-link"
                onClick={() => setShowEditModal(true)}
              >
                Edit My Profile
              </button>
            )}
          </div>

          <div className="dd-filters">
            <input
              type="text"
              className="dd-search"
              placeholder="Search by name or skill..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="dd-filter-select"
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
            >
              <option value="">All Countries</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <select
              className="dd-filter-select"
              value={filterIndustry}
              onChange={(e) => setFilterIndustry(e.target.value)}
            >
              <option value="">All Industries</option>
              {INDUSTRIES.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="dd-loading">
              <div className="dd-spinner"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="dd-empty">
              <div className="dd-empty-icon">🌍</div>
              <h3>No members found</h3>
              <p>
                Try adjusting your filters or be the first to add your profile!
              </p>
            </div>
          ) : (
            <div className="dd-grid">
              {users.map((u) => (
                <div key={u.id} className="dd-card">
                  <div className="dd-card-header">
                    <div className="dd-avatar online">
                      {getInitials(u.name)}
                    </div>
                    <div className="dd-user-info">
                      <h3>{u.name}</h3>
                      {u.country && (
                        <div className="dd-location">
                          📍 {u.city ? `${u.city}, ` : ""}
                          {u.country}
                        </div>
                      )}
                    </div>
                  </div>

                  {u.industry && (
                    <span className="dd-industry-badge">{u.industry}</span>
                  )}

                  {u.bio && <p className="dd-bio">{u.bio}</p>}

                  {u.skills && u.skills.length > 0 && (
                    <div className="dd-skills">
                      {u.skills.slice(0, 4).map((skill) => (
                        <span key={skill} className="dd-skill-tag">
                          {skill}
                        </span>
                      ))}
                      {u.skills.length > 4 && (
                        <span className="dd-skill-tag">
                          +{u.skills.length - 4}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="dd-card-footer">
                    <button className="dd-profile-link">View Profile</button>
                    <span className="dd-stats">
                      {u.profileViews || 0} profile views
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showEditModal && (
        <div className="dd-edit-modal" onClick={() => setShowEditModal(false)}>
          <div
            className="dd-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="dd-modal-header">
              <h2>Edit Your Directory Profile</h2>
              <button
                className="dd-close-btn"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            <div className="dd-modal-body">
              <div className="dd-form-group">
                <label>Display Name</label>
                <input
                  type="text"
                  className="dd-form-input"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />
              </div>

              <div className="dd-form-group">
                <label>Country</label>
                <select
                  className="dd-form-select"
                  value={editForm.country}
                  onChange={(e) =>
                    setEditForm({ ...editForm, country: e.target.value })
                  }
                >
                  <option value="">Select country...</option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dd-form-group">
                <label>City</label>
                <input
                  type="text"
                  className="dd-form-input"
                  placeholder="e.g., London, Lagos, New York"
                  value={editForm.city}
                  onChange={(e) =>
                    setEditForm({ ...editForm, city: e.target.value })
                  }
                />
              </div>

              <div className="dd-form-group">
                <label>Industry</label>
                <select
                  className="dd-form-select"
                  value={editForm.industry}
                  onChange={(e) =>
                    setEditForm({ ...editForm, industry: e.target.value })
                  }
                >
                  <option value="">Select industry...</option>
                  {INDUSTRIES.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>

              <div className="dd-form-group">
                <label>Bio</label>
                <textarea
                  className="dd-form-textarea"
                  placeholder="Tell us about yourself..."
                  value={editForm.bio}
                  onChange={(e) =>
                    setEditForm({ ...editForm, bio: e.target.value })
                  }
                />
              </div>

              <div className="dd-form-group">
                <label>Skills</label>
                <div className="dd-skills-input">
                  {COMMON_SKILLS.map((skill) => (
                    <span
                      key={skill}
                      className={`dd-skill-tag input ${editForm.skills.includes(skill) ? "active" : ""}`}
                      onClick={() => toggleSkill(skill)}
                      style={{
                        background: editForm.skills.includes(skill)
                          ? "rgba(201,168,76,0.3)"
                          : undefined,
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="dd-form-group">
                <div className="dd-toggle">
                  <div
                    className={`dd-toggle-switch ${editForm.isPublicProfile ? "active" : ""}`}
                    onClick={() =>
                      setEditForm({
                        ...editForm,
                        isPublicProfile: !editForm.isPublicProfile,
                      })
                    }
                  />
                  <span style={{ color: "var(--text)", fontSize: "13px" }}>
                    Make my profile visible in directory
                  </span>
                </div>
              </div>
            </div>
            <div className="dd-modal-footer">
              <button
                className="dd-btn dd-btn-secondary"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                className="dd-btn dd-btn-primary"
                onClick={handleSaveProfile}
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
