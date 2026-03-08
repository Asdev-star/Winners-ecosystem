// src/features/work/WorkPage.tsx
// Phase 6 — Winners Work: Freelancer Marketplace
// Work Platform V1.0 — Job board and freelancer matching

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthStore } from "../../features/auth/authStore";
import AIInsightBanner from "../../components/ui/AIInsightBanner";
import AssistantPanel from "../../components/ui/AssistantPanel";
import ContextBar from "../../components/ui/ContextBar";
import { useAssistant } from "../../hooks/useAssistant";
import "./WorkPage.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: "remote" | "onsite" | "hybrid";
  budget: string;
  skills: string[];
  description: string;
  postedAt: string;
}

const MOCK_JOBS: Job[] = [
  {
    id: "1",
    title: "Senior React Developer",
    company: "TechStart Africa",
    location: "Remote",
    type: "remote",
    budget: "$80-120/hr",
    skills: ["React", "TypeScript", "Node.js"],
    description: "Build scalable web applications for African fintech solutions",
    postedAt: "2026-03-05",
  },
  {
    id: "2",
    title: "Digital Marketing Specialist",
    company: "Brand Builders Co",
    location: "Lagos, Nigeria",
    type: "hybrid",
    budget: "$40-60/hr",
    skills: ["SEO", "Social Media", "Google Ads"],
    description: "Drive growth for e-commerce brands across Africa",
    postedAt: "2026-03-04",
  },
  {
    id: "3",
    title: "UI/UX Designer",
    company: "DesignHub",
    location: "Remote",
    type: "remote",
    budget: "$50-80/hr",
    skills: ["Figma", "UI Design", "User Research"],
    description: "Create beautiful, accessible designs for mobile-first products",
    postedAt: "2026-03-03",
  },
  {
    id: "4",
    title: "Content Writer",
    company: "AfroMedia",
    location: "Nairobi, Kenya",
    type: "remote",
    budget: "$25-40/hr",
    skills: ["Copywriting", "SEO Writing", "Blogging"],
    description: "Write engaging content for tech and lifestyle brands",
    postedAt: "2026-03-02",
  },
];

const JOB_CATEGORIES = [
  { icon: "💻", label: "Software Dev", count: 245 },
  { icon: "📱", label: "Mobile Dev", count: 89 },
  { icon: "🎨", label: "Design", count: 156 },
  { icon: "📝", label: "Content", count: 178 },
  { icon: "📊", label: "Marketing", count: 203 },
  { icon: "💰", label: "Finance", count: 67 },
];

export default function WorkPage() {
  const { user, token } = useAuthStore();
  const [jobs, setJobs] = useState<Job[]>(MOCK_JOBS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [jobType, setJobType] = useState<string | null>(null);

  // AI Assistant hook - CIRCUIT for work/freelancer intelligence
  const { isLoading: aiLoading } = useAssistant({
    supervisor: "CIRCUIT",
    context: {
      page: "work",
      userId: user?.id,
      jobCount: jobs.length
    }
  });

  useEffect(() => {
    // In production, fetch from API
    // fetchJobs();
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      !searchQuery ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.skills.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = !jobType || job.type === jobType;

    return matchesSearch && matchesType;
  });

  function getTypeColor(type: string) {
    switch (type) {
      case "remote":
        return "var(--green)";
      case "onsite":
        return "var(--ice)";
      case "hybrid":
        return "var(--purple)";
      default:
        return "var(--text-dim)";
    }
  }

  return (
    <div className="work-page">
      <div className="work-container">
        <ContextBar
          activeLayer="work"
          statusOverrides={{ work: "active", market: "building" }}
        />

        {/* AI Insight Banner - CIRCUIT provides job matching intelligence */}
        <AIInsightBanner
          page="work"
          assistant="circuit"
          userId={user?.id}
        />

        {/* Hero Section */}
        <div className="work-hero">
          <div className="work-hero-content">
            <h1>Find Your Next Opportunity</h1>
            <p>
              Connect with African businesses and global clients. CIRCUIT matches
              your skills to the perfect projects.
            </p>
            <div className="work-hero-cta">
              {user ? (
                <Link to="/work/browse" className="hero-btn primary">
                  Browse Jobs
                </Link>
              ) : (
                <Link to="/login" className="hero-btn primary">
                  Sign In to Apply
                </Link>
              )}
              <Link to="/work/freelancers" className="hero-btn">
                For Clients
              </Link>
            </div>
          </div>
          <div className="work-hero-stats">
            <div className="stat-item">
              <span className="stat-value">12K+</span>
              <span className="stat-label">Freelancers</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">2.5K+</span>
              <span className="stat-label">Jobs Posted</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">$2M+</span>
              <span className="stat-label">Paid Out</span>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="work-categories">
          <h2>Browse by Category</h2>
          <div className="categories-grid">
            {JOB_CATEGORIES.map((cat) => (
              <button
                key={cat.label}
                className={`category-card ${
                  selectedCategory === cat.label ? "selected" : ""
                }`}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === cat.label ? null : cat.label
                  )
                }
              >
                <span className="category-icon">{cat.icon}</span>
                <span className="category-label">{cat.label}</span>
                <span className="category-count">{cat.count} jobs</span>
              </button>
            ))}
          </div>
        </div>

        {/* Search & Filters */}
        <div className="work-filters">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search jobs, skills, or companies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="filter-tabs">
            <button
              className={`filter-tab ${jobType === null ? "active" : ""}`}
              onClick={() => setJobType(null)}
            >
              All
            </button>
            <button
              className={`filter-tab ${jobType === "remote" ? "active" : ""}`}
              onClick={() => setJobType("remote")}
            >
              Remote
            </button>
            <button
              className={`filter-tab ${jobType === "hybrid" ? "active" : ""}`}
              onClick={() => setJobType("hybrid")}
            >
              Hybrid
            </button>
            <button
              className={`filter-tab ${jobType === "onsite" ? "active" : ""}`}
              onClick={() => setJobType("onsite")}
            >
              On-site
            </button>
          </div>
        </div>

        {/* Jobs List */}
        <div className="work-jobs">
          <h2>
            {filteredJobs.length} {filteredJobs.length === 1 ? "Job" : "Jobs"}{" "}
            Available
          </h2>
          <div className="jobs-list">
            {filteredJobs.map((job) => (
              <div key={job.id} className="job-card">
                <div className="job-header">
                  <div className="job-info">
                    <h3>{job.title}</h3>
                    <span className="job-company">{job.company}</span>
                  </div>
                  <span
                    className="job-type"
                    style={{ color: getTypeColor(job.type) }}
                  >
                    {job.type}
                  </span>
                </div>
                <div className="job-details">
                  <span className="job-location">📍 {job.location}</span>
                  <span className="job-budget">💰 {job.budget}</span>
                </div>
                <p className="job-description">{job.description}</p>
                <div className="job-skills">
                  {job.skills.map((skill) => (
                    <span key={skill} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="job-footer">
                  <span className="job-posted">Posted {job.postedAt}</span>
                  <button className="apply-btn">Apply Now</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* For Clients CTA */}
        <div className="work-cta-section">
          <div className="cta-card">
            <h3>Need to Hire?</h3>
            <p>
              Post a job and CIRCUIT will match you with the best African
              talent for your project.
            </p>
            <Link to="/work/post-job" className="cta-btn">
              Post a Job
            </Link>
          </div>
          <div className="cta-card">
            <h3>Become a Verified Freelancer</h3>
            <p>
              Complete Academy certifications to boost your profile and get
              matched with premium clients.
            </p>
            <Link to="/academy" className="cta-btn secondary">
              Get Certified
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

