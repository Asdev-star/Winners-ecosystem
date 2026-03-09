// src/features/work/FreelancerProfilePage.tsx
// Phase 6 — Winners Work — Freelancer Profile Management
// Create / edit your freelancer profile + portfolio items

import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../features/auth/authStore";
import ContextBar from "../../components/ui/ContextBar";
import AssistantPanel from "../../components/ui/AssistantPanel";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  url: string | null;
  imageUrl: string | null;
  toolsUsed: string[];
  createdAt: string;
}

interface FreelancerProfile {
  id: string;
  title: string | null;
  bio: string | null;
  hourlyRate: number | null;
  availability: string;
  yearsExperience: number | null;
  skills: string[];
  languages: string[];
  country: string | null;
  timezone: string | null;
  portfolioUrl: string | null;
  linkedInUrl: string | null;
  githubUrl: string | null;
  trustScore: number;
  totalJobs: number;
  successRate: number;
  badges: string[];
  certificates: string[];
  portfolioItems: PortfolioItem[];
  user: { id: string; name: string; email: string };
}

const COUNTRIES = [
  "Nigeria", "Ghana", "Kenya", "South Africa", "Ethiopia", "Tanzania",
  "Uganda", "Rwanda", "Senegal", "Ivory Coast", "Cameroon", "Egypt",
  "Morocco", "United Kingdom", "United States", "Canada", "Germany", "France",
];

export default function FreelancerProfilePage() {
  const { user, token } = useAuthStore();
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeSection, setActiveSection] = useState<"profile" | "portfolio">("profile");

  const [form, setForm] = useState({
    title: "",
    bio: "",
    hourlyRate: "",
    availability: "AVAILABLE",
    yearsExperience: "",
    skills: "",
    languages: "English",
    country: "",
    timezone: "",
    portfolioUrl: "",
    linkedInUrl: "",
    githubUrl: "",
  });

  const [portfolioForm, setPortfolioForm] = useState({
    title: "",
    description: "",
    category: "",
    url: "",
    imageUrl: "",
    toolsUsed: "",
  });
  const [addingPortfolio, setAddingPortfolio] = useState(false);
  const [portfolioError, setPortfolioError] = useState("");
  const [portfolioSuccess, setPortfolioSuccess] = useState(false);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);

  const headers = useCallback((): Record<string, string> => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  }, [token]);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/work/freelancers/me`, { headers: headers() });
      if (res.ok) {
        const data: FreelancerProfile = await res.json();
        setProfile(data);
        setForm({
          title:           data.title           ?? "",
          bio:             data.bio             ?? "",
          hourlyRate:      data.hourlyRate       ? String(data.hourlyRate) : "",
          availability:    data.availability,
          yearsExperience: data.yearsExperience  ? String(data.yearsExperience) : "",
          skills:          data.skills.join(", "),
          languages:       data.languages.join(", "),
          country:         data.country          ?? "",
          timezone:        data.timezone         ?? "",
          portfolioUrl:    data.portfolioUrl     ?? "",
          linkedInUrl:     data.linkedInUrl      ?? "",
          githubUrl:       data.githubUrl        ?? "",
        });
      }
    } catch {}
    finally { setLoading(false); }
  }, [headers]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    try {
      const res = await fetch(`${API_BASE}/work/freelancers`, {
        method:  "POST",
        headers: headers(),
        body:    JSON.stringify({
          ...form,
          skills:          form.skills.split(",").map((s) => s.trim()).filter(Boolean),
          languages:       form.languages.split(",").map((s) => s.trim()).filter(Boolean),
          hourlyRate:      form.hourlyRate      || undefined,
          yearsExperience: form.yearsExperience || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to save profile");
      setSaveSuccess(true);
      fetchProfile();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddPortfolio(e: React.FormEvent) {
    e.preventDefault();
    setAddingPortfolio(true);
    setPortfolioError("");
    setPortfolioSuccess(false);
    try {
      const res = await fetch(`${API_BASE}/work/freelancers/portfolio`, {
        method:  "POST",
        headers: headers(),
        body:    JSON.stringify({
          ...portfolioForm,
          toolsUsed: portfolioForm.toolsUsed.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add portfolio item");
      setPortfolioSuccess(true);
      setPortfolioForm({ title: "", description: "", category: "", url: "", imageUrl: "", toolsUsed: "" });
      setShowPortfolioForm(false);
      fetchProfile();
    } catch (err) {
      setPortfolioError(err instanceof Error ? err.message : "Failed to add portfolio item");
    } finally {
      setAddingPortfolio(false);
    }
  }

  return (
    <>
    <style>{`
      .fp-page { min-height:100vh; background:var(--bg); padding:24px; }
      .fp-container { max-width:900px; margin:0 auto; }

      .fp-header { margin-bottom:28px; }
      .fp-title { font-family:'Cormorant Garamond',serif; font-size:2rem; font-weight:300; color:var(--text); margin:0 0 6px; }
      .fp-title span { color:var(--gold); font-style:italic; }
      .fp-subtitle { font-family:'Syne',sans-serif; font-size:14px; color:var(--text-dim); margin:0; }

      .fp-profile-card { background:var(--surface); border:1px solid var(--border); border-radius:6px;
        padding:20px; margin-bottom:20px; position:relative; overflow:hidden; display:flex;
        gap:20px; align-items:flex-start; }
      .fp-profile-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px;
        background:linear-gradient(90deg, var(--gold), var(--blue)); }
      .fp-avatar { width:60px; height:60px; border-radius:50%; background:rgba(201,168,76,.15);
        color:var(--gold); display:flex; align-items:center; justify-content:center;
        font-family:'Space Mono',monospace; font-size:20px; font-weight:700;
        border:2px solid rgba(201,168,76,.3); flex-shrink:0; }
      .fp-profile-info h3 { font-family:'Syne',sans-serif; font-size:1.1rem; font-weight:700; color:var(--text); margin:0 0 4px; }
      .fp-profile-info p { font-family:'Syne',sans-serif; font-size:13px; color:var(--text-dim); margin:0 0 8px; }
      .fp-stats-row { display:flex; gap:20px; flex-wrap:wrap; }
      .fp-stat { text-align:center; }
      .fp-stat-value { display:block; font-family:'Syne',sans-serif; font-size:1.3rem; font-weight:700; color:var(--gold); }
      .fp-stat-label { font-family:'Space Mono',monospace; font-size:8px; text-transform:uppercase; letter-spacing:.08em; color:var(--text-dim); }

      .fp-tabs { display:flex; gap:4px; margin-bottom:20px; border-bottom:1px solid var(--border); }
      .fp-tab { background:transparent; border:none; border-bottom:2px solid transparent;
        padding:10px 18px; font-family:'Space Mono',monospace; font-size:11px; text-transform:uppercase;
        letter-spacing:.08em; color:var(--text-dim); cursor:pointer; transition:all .15s; margin-bottom:-1px; }
      .fp-tab:hover { color:var(--text); }
      .fp-tab.active { color:var(--gold); border-bottom-color:var(--gold); }

      .fp-form { background:var(--surface); border:1px solid var(--border); border-radius:6px; padding:28px; }
      .fp-section { margin-bottom:28px; }
      .fp-section-title { font-family:'Space Mono',monospace; font-size:10px; text-transform:uppercase;
        letter-spacing:.1em; color:var(--text-dim); margin:0 0 14px;
        padding-bottom:8px; border-bottom:1px solid var(--border); }
      .fp-form-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
      .fp-form-group { display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
      .fp-label { font-family:'Space Mono',monospace; font-size:10px; text-transform:uppercase;
        letter-spacing:.06em; color:var(--text-dim); }
      .fp-input, .fp-textarea, .fp-select { background:var(--surface2); border:1px solid var(--border);
        border-radius:4px; padding:10px 14px; font-family:'Syne',sans-serif; font-size:14px;
        color:var(--text); width:100%; box-sizing:border-box; }
      .fp-input:focus, .fp-textarea:focus, .fp-select:focus { outline:none; border-color:var(--gold); }
      .fp-input::placeholder, .fp-textarea::placeholder { color:var(--text-dim); }
      .fp-textarea { min-height:100px; resize:vertical; line-height:1.6; }
      .fp-hint { font-family:'Space Mono',monospace; font-size:9px; color:var(--text-dim); }
      .fp-submit { background:var(--gold); border:none; border-radius:4px; padding:12px 28px;
        font-family:'Space Mono',monospace; font-size:11px; text-transform:uppercase; letter-spacing:.08em;
        color:var(--bg); cursor:pointer; transition:opacity .15s; font-weight:700; }
      .fp-submit:hover { opacity:.85; }
      .fp-submit:disabled { opacity:.5; cursor:not-allowed; }

      .fp-error { background:rgba(224,90,78,.1); border:1px solid rgba(224,90,78,.3);
        color:var(--red); border-radius:4px; padding:10px 14px; font-family:'Syne',sans-serif;
        font-size:13px; margin-bottom:16px; }
      .fp-success { background:rgba(45,212,160,.1); border:1px solid rgba(45,212,160,.3);
        color:var(--green); border-radius:4px; padding:10px 14px; font-family:'Syne',sans-serif;
        font-size:13px; margin-bottom:16px; }

      .portfolio-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(240px, 1fr)); gap:16px; margin-bottom:20px; }
      .portfolio-item { background:var(--surface2); border:1px solid var(--border); border-radius:6px;
        padding:16px; position:relative; }
      .portfolio-item-title { font-family:'Syne',sans-serif; font-size:14px; font-weight:700; color:var(--text); margin:0 0 4px; }
      .portfolio-item-cat { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase;
        color:var(--text-dim); margin:0 0 8px; }
      .portfolio-item-desc { font-family:'Syne',sans-serif; font-size:12px; color:var(--text-dim); margin:0 0 10px; line-height:1.5; }
      .portfolio-tools { display:flex; flex-wrap:wrap; gap:4px; }
      .portfolio-tool { font-family:'Space Mono',monospace; font-size:8px; padding:2px 6px;
        background:var(--surface); border:1px solid var(--border); border-radius:2px; color:var(--text-dim); }
      .portfolio-link { font-family:'Space Mono',monospace; font-size:9px; color:var(--ice);
        text-decoration:none; display:block; margin-top:8px; }
      .portfolio-link:hover { color:var(--gold); }

      .add-portfolio-btn { background:transparent; border:1px dashed var(--border); border-radius:6px;
        padding:14px 20px; font-family:'Space Mono',monospace; font-size:11px; text-transform:uppercase;
        color:var(--text-dim); cursor:pointer; transition:all .15s; width:100%; margin-bottom:20px; }
      .add-portfolio-btn:hover { border-color:var(--gold); color:var(--gold); }

      .portfolio-form { background:var(--surface); border:1px solid var(--border); border-radius:6px; padding:20px; margin-bottom:20px; }
      .portfolio-form h4 { font-family:'Syne',sans-serif; font-size:1rem; font-weight:700; color:var(--text); margin:0 0 16px; }

      .fp-avail-row { display:flex; gap:10px; flex-wrap:wrap; }
      .avail-opt { display:flex; align-items:center; gap:8px; padding:10px 14px; border-radius:4px;
        border:1px solid var(--border); cursor:pointer; transition:all .15s;
        font-family:'Syne',sans-serif; font-size:13px; color:var(--text-dim); }
      .avail-opt.selected { border-color:var(--gold); color:var(--text); background:rgba(201,168,76,.08); }
      .avail-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
      .avail-dot.AVAILABLE   { background:var(--green); }
      .avail-dot.UNAVAILABLE { background:var(--red); }
      .avail-dot.BUSY        { background:var(--gold); }

      .fp-no-profile { text-align:center; padding:60px 24px; }
      .fp-no-profile-icon { font-size:56px; margin-bottom:16px; }
      .fp-no-profile h3 { font-family:'Syne',sans-serif; font-size:1.3rem; color:var(--text); margin:0 0 8px; }
      .fp-no-profile p { font-family:'Syne',sans-serif; font-size:14px; color:var(--text-dim); margin:0 0 24px; }

      @media(max-width:640px) {
        .fp-form-row { grid-template-columns:1fr; }
        .fp-profile-card { flex-direction:column; }
        .portfolio-grid { grid-template-columns:1fr; }
      }
    `}</style>

    <div className="fp-page">
      <div className="fp-container">
        <ContextBar activeLayer="work" statusOverrides={{ work: "active" }} />

        <div className="fp-header">
          <h1 className="fp-title">Freelancer <span>Profile</span></h1>
          <p className="fp-subtitle">Build your professional identity · Showcase your work · Win contracts</p>
        </div>

        {loading ? (
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:12, color:"var(--text-dim)", textAlign:"center", padding:40 }}>
            Loading profile…
          </div>
        ) : (
          <>
            {profile && (
              <div className="fp-profile-card">
                <div className="fp-avatar">
                  {profile.user.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="fp-profile-info">
                  <h3>{profile.user.name}</h3>
                  <p>{profile.title ?? "Freelancer"}{profile.country ? ` · ${profile.country}` : ""}</p>
                  <div className="fp-stats-row">
                    <div className="fp-stat">
                      <span className="fp-stat-value">{profile.trustScore.toFixed(0)}</span>
                      <span className="fp-stat-label">Trust Score</span>
                    </div>
                    <div className="fp-stat">
                      <span className="fp-stat-value">{profile.totalJobs}</span>
                      <span className="fp-stat-label">Jobs Done</span>
                    </div>
                    <div className="fp-stat">
                      <span className="fp-stat-value">{profile.successRate.toFixed(0)}%</span>
                      <span className="fp-stat-label">Success Rate</span>
                    </div>
                    <div className="fp-stat">
                      <span className="fp-stat-value">{profile.portfolioItems.length}</span>
                      <span className="fp-stat-label">Portfolio</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!profile && (
              <div className="fp-no-profile">
                <div className="fp-no-profile-icon">💼</div>
                <h3>Create Your Freelancer Profile</h3>
                <p>Join the Winners Work marketplace and start winning contracts from African businesses and global clients.</p>
              </div>
            )}

            <div className="fp-tabs">
              <button className={`fp-tab ${activeSection === "profile" ? "active" : ""}`} onClick={() => setActiveSection("profile")}>
                Profile
              </button>
              <button className={`fp-tab ${activeSection === "portfolio" ? "active" : ""}`} onClick={() => setActiveSection("portfolio")}>
                Portfolio {profile ? `(${profile.portfolioItems.length})` : ""}
              </button>
            </div>

            {activeSection === "profile" && (
              <div className="fp-form">
                {saveSuccess && <div className="fp-success">✅ Profile saved successfully! You're now visible to clients.</div>}
                {saveError && <div className="fp-error">{saveError}</div>}

                <form onSubmit={handleSave}>
                  <div className="fp-section">
                    <div className="fp-section-title">Professional Identity</div>
                    <div className="fp-form-group">
                      <label className="fp-label">Professional Title</label>
                      <input className="fp-input" placeholder="e.g. Senior React Developer · Digital Marketing Specialist"
                        value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                    </div>
                    <div className="fp-form-group">
                      <label className="fp-label">Bio</label>
                      <textarea className="fp-textarea" placeholder="Describe your expertise, background, and what makes you valuable to clients. Be specific about industries and results."
                        value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
                    </div>
                    <div className="fp-form-row">
                      <div className="fp-form-group">
                        <label className="fp-label">Skills (comma-separated)</label>
                        <input className="fp-input" placeholder="React, TypeScript, Node.js, AWS"
                          value={form.skills} onChange={(e) => setForm({ ...form, skills: e.target.value })} />
                        <span className="fp-hint">Add up to 20 skills — CIRCUIT uses these for matching</span>
                      </div>
                      <div className="fp-form-group">
                        <label className="fp-label">Languages</label>
                        <input className="fp-input" placeholder="English, French, Swahili"
                          value={form.languages} onChange={(e) => setForm({ ...form, languages: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <div className="fp-section">
                    <div className="fp-section-title">Availability & Rate</div>
                    <div className="fp-form-group">
                      <label className="fp-label">Availability Status</label>
                      <div className="fp-avail-row">
                        {(["AVAILABLE", "BUSY", "UNAVAILABLE"] as const).map((status) => (
                          <div key={status} className={`avail-opt ${form.availability === status ? "selected" : ""}`}
                            onClick={() => setForm({ ...form, availability: status })}>
                            <span className={`avail-dot ${status}`} />
                            {status === "AVAILABLE" ? "Available for work" : status === "BUSY" ? "Busy (taking selective work)" : "Not available"}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="fp-form-row">
                      <div className="fp-form-group">
                        <label className="fp-label">Hourly Rate (USD)</label>
                        <input className="fp-input" type="number" placeholder="50"
                          value={form.hourlyRate} onChange={(e) => setForm({ ...form, hourlyRate: e.target.value })} />
                      </div>
                      <div className="fp-form-group">
                        <label className="fp-label">Years of Experience</label>
                        <input className="fp-input" type="number" placeholder="3"
                          value={form.yearsExperience} onChange={(e) => setForm({ ...form, yearsExperience: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <div className="fp-section">
                    <div className="fp-section-title">Location & Timezone</div>
                    <div className="fp-form-row">
                      <div className="fp-form-group">
                        <label className="fp-label">Country</label>
                        <select className="fp-select" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}>
                          <option value="">Select country</option>
                          {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className="fp-form-group">
                        <label className="fp-label">Timezone</label>
                        <input className="fp-input" placeholder="e.g. Africa/Nairobi, UTC+3"
                          value={form.timezone} onChange={(e) => setForm({ ...form, timezone: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <div className="fp-section">
                    <div className="fp-section-title">Online Presence</div>
                    <div className="fp-form-group">
                      <label className="fp-label">Portfolio Website</label>
                      <input className="fp-input" type="url" placeholder="https://yourportfolio.com"
                        value={form.portfolioUrl} onChange={(e) => setForm({ ...form, portfolioUrl: e.target.value })} />
                    </div>
                    <div className="fp-form-row">
                      <div className="fp-form-group">
                        <label className="fp-label">LinkedIn URL</label>
                        <input className="fp-input" type="url" placeholder="https://linkedin.com/in/yourname"
                          value={form.linkedInUrl} onChange={(e) => setForm({ ...form, linkedInUrl: e.target.value })} />
                      </div>
                      <div className="fp-form-group">
                        <label className="fp-label">GitHub URL</label>
                        <input className="fp-input" type="url" placeholder="https://github.com/yourname"
                          value={form.githubUrl} onChange={(e) => setForm({ ...form, githubUrl: e.target.value })} />
                      </div>
                    </div>
                  </div>

                  <button className="fp-submit" type="submit" disabled={saving}>
                    {saving ? "Saving…" : profile ? "Save Changes" : "Create Freelancer Profile"}
                  </button>
                </form>

                <div style={{ marginTop:24, padding:"16px 0", borderTop:"1px solid var(--border)" }}>
                  <p style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:"var(--text-dim)", margin:"0 0 8px" }}>
                    BOOST YOUR PROFILE
                  </p>
                  <p style={{ fontFamily:"'Syne',sans-serif", fontSize:13, color:"var(--text-dim)", margin:"0 0 12px" }}>
                    Complete Academy certifications to unlock the Verified badge and get 3x more views from clients.
                  </p>
                  <Link to="/academy" style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:"var(--gold)", textDecoration:"none", textTransform:"uppercase" }}>
                    Browse Courses →
                  </Link>
                </div>
              </div>
            )}

            {activeSection === "portfolio" && (
              <div>
                {!profile && (
                  <div className="fp-error">
                    Create your freelancer profile first before adding portfolio items.
                  </div>
                )}

                {profile && (
                  <>
                    {portfolioSuccess && (
                      <div className="fp-success" style={{ marginBottom:16 }}>✅ Portfolio item added!</div>
                    )}

                    {profile.portfolioItems.length > 0 && (
                      <div className="portfolio-grid">
                        {profile.portfolioItems.map((item) => (
                          <div key={item.id} className="portfolio-item">
                            <div className="portfolio-item-title">{item.title}</div>
                            {item.category && <div className="portfolio-item-cat">{item.category}</div>}
                            {item.description && <div className="portfolio-item-desc">{item.description}</div>}
                            {item.toolsUsed.length > 0 && (
                              <div className="portfolio-tools">
                                {item.toolsUsed.map((t) => <span key={t} className="portfolio-tool">{t}</span>)}
                              </div>
                            )}
                            {item.url && (
                              <a href={item.url} target="_blank" rel="noopener noreferrer" className="portfolio-link">
                                View Project →
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    <button className="add-portfolio-btn" onClick={() => {
                      setShowPortfolioForm(!showPortfolioForm);
                      setPortfolioSuccess(false);
                      setPortfolioError("");
                    }}>
                      {showPortfolioForm ? "— Cancel" : "+ Add Portfolio Item"}
                    </button>

                    {showPortfolioForm && (
                      <div className="portfolio-form">
                        <h4>Add Portfolio Item</h4>
                        {portfolioError && <div className="fp-error">{portfolioError}</div>}
                        <form onSubmit={handleAddPortfolio}>
                          <div className="fp-form-row">
                            <div className="fp-form-group">
                              <label className="fp-label">Project Title *</label>
                              <input className="fp-input" required placeholder="Winners Ecosystem Dashboard"
                                value={portfolioForm.title} onChange={(e) => setPortfolioForm({ ...portfolioForm, title: e.target.value })} />
                            </div>
                            <div className="fp-form-group">
                              <label className="fp-label">Category</label>
                              <input className="fp-input" placeholder="Web App, Mobile, Design, etc."
                                value={portfolioForm.category} onChange={(e) => setPortfolioForm({ ...portfolioForm, category: e.target.value })} />
                            </div>
                          </div>
                          <div className="fp-form-group">
                            <label className="fp-label">Description</label>
                            <textarea className="fp-textarea" style={{ minHeight:80 }} placeholder="What did you build? What was the impact?"
                              value={portfolioForm.description} onChange={(e) => setPortfolioForm({ ...portfolioForm, description: e.target.value })} />
                          </div>
                          <div className="fp-form-row">
                            <div className="fp-form-group">
                              <label className="fp-label">Tools Used (comma-separated)</label>
                              <input className="fp-input" placeholder="React, TypeScript, PostgreSQL"
                                value={portfolioForm.toolsUsed} onChange={(e) => setPortfolioForm({ ...portfolioForm, toolsUsed: e.target.value })} />
                            </div>
                            <div className="fp-form-group">
                              <label className="fp-label">Project URL</label>
                              <input className="fp-input" type="url" placeholder="https://yourproject.com"
                                value={portfolioForm.url} onChange={(e) => setPortfolioForm({ ...portfolioForm, url: e.target.value })} />
                            </div>
                          </div>
                          <button className="fp-submit" type="submit" disabled={addingPortfolio}>
                            {addingPortfolio ? "Adding…" : "Add to Portfolio"}
                          </button>
                        </form>
                      </div>
                    )}

                    {profile.portfolioItems.length === 0 && !showPortfolioForm && (
                      <div style={{ textAlign:"center", padding:"40px 0", fontFamily:"'Syne',sans-serif", fontSize:14, color:"var(--text-dim)" }}>
                        <div style={{ fontSize:40, marginBottom:12 }}>🗂</div>
                        No portfolio items yet. Add your best work to attract clients.
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <AssistantPanel assistant="circuit" page="freelancer-profile" userId={user?.id} />
    </div>
    </>
  );
}
