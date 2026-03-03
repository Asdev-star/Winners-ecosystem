// src/features/community/OpportunityBoardPage.tsx

import { useState, useEffect } from "react";
import { useAuthStore } from "../auth/authStore";
import { API_BASE } from "../../lib/api";

const API = API_BASE;

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .ob-root {
    display: flex; gap: 0; min-height: 100vh;
    background: var(--bg); font-family: 'Syne', sans-serif; padding-bottom: 80px;
  }

  .ob-container { flex: 1; max-width: 1000px; margin: 0 auto; padding: 28px 20px; }

  .ob-header {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 28px;
  }

  .ob-title-section h1 {
    font-size: 28px; font-weight: 800; color: var(--text); margin: 0 0 8px 0;
  }
  .ob-subtitle { color: var(--text-dim); font-size: 14px; }

  .ob-create-btn {
    background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dim) 100%);
    border: none; border-radius: 10px; padding: 12px 24px;
    color: var(--bg); font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600;
    cursor: pointer; transition: all 0.2s;
  }
  .ob-create-btn:hover { transform: scale(1.02); box-shadow: 0 4px 16px rgba(201,168,76,0.3); }

  .ob-tabs {
    display: flex; gap: 8px; margin-bottom: 24px; border-bottom: 1px solid var(--border); padding-bottom: 12px;
  }

  .ob-tab {
    background: none; border: none; color: var(--text-dim);
    font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 600;
    padding: 8px 16px; border-radius: 8px; cursor: pointer; transition: all 0.2s;
  }
  .ob-tab:hover { background: rgba(201,168,76,0.1); color: var(--gold); }
  .ob-tab.active { background: rgba(201,168,76,0.15); color: var(--gold); }

  .ob-filters {
    display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 24px;
  }

  .ob-filter-select {
    background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
    padding: 10px 16px; color: var(--text); font-family: 'Syne', sans-serif;
    font-size: 13px; min-width: 150px; cursor: pointer;
  }
  .ob-filter-select:focus { outline: none; border-color: var(--gold); }

  .ob-search {
    flex: 1; min-width: 200px;
    background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
    padding: 10px 16px; color: var(--text); font-family: 'Syne', sans-serif;
    font-size: 13px;
  }
  .ob-search:focus { outline: none; border-color: var(--gold); }

  .ob-list { display: flex; flex-direction: column; gap: 16px; }

  .ob-card {
    background: var(--surface); border: 1px solid var(--border); border-radius: 12px;
    padding: 20px; position: relative; overflow: hidden;
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .ob-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
  }
  .ob-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0,0,0,0.3);
  }

  .ob-card-header {
    display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;
  }

  .ob-type-badge {
    font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.1em;
    text-transform: uppercase; padding: 4px 10px; border-radius: 20px;
  }
  .ob-type-badge.job { background: rgba(137,196,225,0.1); color: var(--ice); }
  .ob-type-badge.collab { background: rgba(155,111,255,0.1); color: var(--purple); }
  .ob-type-badge.mentorship { background: rgba(45,212,160,0.1); color: var(--green); }
  .ob-type-badge.investment { background: rgba(201,168,76,0.1); color: var(--gold); }

  .ob-card-title {
    font-size: 18px; font-weight: 700; color: var(--text); margin: 8px 0;
  }

  .ob-card-desc {
    font-size: 14px; color: var(--text-dim); line-height: 1.6; margin-bottom: 16px;
    display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
  }

  .ob-card-meta {
    display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 12px;
  }

  .ob-meta-item {
    font-family: 'Space Mono', monospace; font-size: 11px; color: var(--text-dim);
    display: flex; align-items: center; gap: 4px;
  }

  .ob-skills {
    display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 16px;
  }

  .ob-skill-tag {
    background: rgba(155,111,255,0.1); color: var(--purple);
    font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.05em;
    padding: 4px 8px; border-radius: 4px;
  }

  .ob-card-footer {
    display: flex; justify-content: space-between; align-items: center;
    padding-top: 12px; border-top: 1px solid var(--border);
  }

  .ob-author {
    display: flex; align-items: center; gap: 10px;
  }

  .ob-author-avatar {
    width: 32px; height: 32px; border-radius: 50%;
    background: rgba(201,168,76,0.12); display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: var(--gold);
  }

  .ob-author-info { font-size: 12px; color: var(--text-dim); }
  .ob-author-name { color: var(--text); font-weight: 600; }

  .ob-apply-btn {
    background: transparent; border: 1px solid var(--gold); border-radius: 8px;
    padding: 8px 16px; color: var(--gold); font-family: 'Syne', sans-serif;
    font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.2s;
  }
  .ob-apply-btn:hover { background: rgba(201,168,76,0.1); }

  .ob-empty {
    text-align: center; padding: 60px 20px; color: var(--text-dim);
  }
  .ob-empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.5; }
  .ob-empty h3 { font-size: 18px; color: var(--text); margin-bottom: 8px; }

  @media (max-width: 768px) {
    .ob-header { flex-direction: column; align-items: flex-start; gap: 16px; }
    .ob-filters { flex-direction: column; }
    .ob-filter-select, .ob-search { width: 100%; }
  }
`;

const TABS = ["All", "Jobs", "Collaborations", "Mentorship", "Investment"];

const TYPE_MAP: Record<string, string> = {
  "All": "",
  "Jobs": "JOB",
  "Collaborations": "COLLABORATION",
  "Mentorship": "MENTORSHIP",
  "Investment": "INVESTMENT",
};

interface Opportunity {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  budget?: string | null;
  skills?: string[] | null;
  location?: string | null;
  createdAt: string;
  user: { id: string; name: string; country?: string | null; city?: string | null };
}

export default function OpportunityBoardPage() {
  const { user } = useAuthStore();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [filterType, setFilterType] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchOpportunities();
  }, [activeTab, filterType, filterCategory, search]);

  const fetchOpportunities = async () => {
    try {
      const params = new URLSearchParams();
      if (TYPE_MAP[activeTab]) params.append("type", TYPE_MAP[activeTab]);
      if (filterType && TYPE_MAP[filterType]) params.append("type", TYPE_MAP[filterType]);
      if (filterCategory) params.append("category", filterCategory);
      if (search) params.append("search", search);

      const res = await fetch(`${API}/opportunities?${params}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOpportunities(data.opportunities || []);
      }
    } catch (err) {
      console.error("Failed to fetch opportunities:", err);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <>
      <style>{css}</style>
      <div className="ob-root">
        <div className="ob-container">
          <div className="ob-header">
            <div className="ob-title-section">
              <h1>🔗 Opportunity Board</h1>
              <p className="ob-subtitle">Jobs, collaborations, mentorship, and investment opportunities</p>
            </div>
            {user && (
              <button className="ob-create-btn">
                + Post Opportunity
              </button>
            )}
          </div>

          <div className="ob-tabs">
            {TABS.map(tab => (
              <button
                key={tab}
                className={`ob-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="ob-filters">
            <input
              type="text"
              className="ob-search"
              placeholder="Search opportunities..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="ob-filter-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="tech">Technology</option>
              <option value="marketing">Marketing</option>
              <option value="design">Design</option>
              <option value="finance">Finance</option>
              <option value="education">Education</option>
              <option value="creative">Creative</option>
            </select>
          </div>

          {loading ? (
            <div className="ob-empty">Loading opportunities...</div>
          ) : opportunities.length === 0 ? (
            <div className="ob-empty">
              <div className="ob-empty-icon">🔗</div>
              <h3>No opportunities found</h3>
              <p>Be the first to post an opportunity!</p>
            </div>
          ) : (
            <div className="ob-list">
              {opportunities.map(opp => (
                <div key={opp.id} className="ob-card">
                  <div className="ob-card-header">
                    <span className={`ob-type-badge ${opp.type.toLowerCase()}`}>
                      {opp.type}
                    </span>
                  </div>

                  <h3 className="ob-card-title">{opp.title}</h3>
                  <p className="ob-card-desc">{opp.description}</p>

                  <div className="ob-card-meta">
                    {opp.budget && (
                      <span className="ob-meta-item">💰 {opp.budget}</span>
                    )}
                    {opp.location && (
                      <span className="ob-meta-item">📍 {opp.location}</span>
                    )}
                    <span className="ob-meta-item">📅 {formatDate(opp.createdAt)}</span>
                  </div>

                  {opp.skills && opp.skills.length > 0 && (
                    <div className="ob-skills">
                      {opp.skills.slice(0, 6).map(skill => (
                        <span key={skill} className="ob-skill-tag">{skill}</span>
                      ))}
                    </div>
                  )}

                  <div className="ob-card-footer">
                    <div className="ob-author">
                      <div className="ob-author-avatar">
                        {getInitials(opp.user.name)}
                      </div>
                      <div className="ob-author-info">
                        <span className="ob-author-name">{opp.user.name}</span>
                        {opp.user.country && <span> • {opp.user.country}</span>}
                      </div>
                    </div>
                    <button className="ob-apply-btn">View Details</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
