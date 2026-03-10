// src/features/work/WorkPage.tsx
// Phase 6 — Winners Work — Freelancer Marketplace
// Work Platform V1.1 — Full job board with API integration

import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../../features/auth/authStore";
import AssistantPanel from "../../components/ui/AssistantPanel";
import ContextBar from "../../components/ui/ContextBar";
import "./WorkPage.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

interface JobListing {
  id: string;
  title: string;
  description: string;
  category: string;
  skills: string[];
  experienceLevel: string;
  jobType: string;
  budgetMin: number | null;
  budgetMax: number | null;
  currency: string;
  duration: string | null;
  location: string | null;
  status: string;
  isFeatured: boolean;
  viewCount: number;
  applicationCount: number;
  createdAt: string;
  client: { id: string; name: string; email: string };
  myApplication?: { id: string; status: string; createdAt: string } | null;
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
  trustScore: number;
  totalJobs: number;
  successRate: number;
  badges: string[];
  user: { id: string; name: string; email: string };
  portfolioItems: { id: string; title: string; category: string | null; url: string | null }[];
}

interface Contract {
  id: string;
  title: string;
  status: string;
  paymentType: string;
  amount: number;
  currency: string;
  startDate: string;
  endDate: string | null;
  client: { id: string; name: string; email: string };
  freelancer: { user: { id: string; name: string; email: string } };
  milestones: { id: string; title: string; amount: number; status: string }[];
  job: { id: string; title: string } | null;
}

interface WorkStats {
  openJobs: number;
  availableFreelancers: number;
  completedContracts: number;
}

const CATEGORIES = [
  { icon: "💻", label: "Software Dev",   value: "software_dev" },
  { icon: "📱", label: "Mobile Dev",     value: "mobile_dev" },
  { icon: "🎨", label: "Design",         value: "creative" },
  { icon: "📝", label: "Content",        value: "writing" },
  { icon: "📊", label: "Marketing",      value: "digital_marketing" },
  { icon: "💰", label: "Finance",        value: "finance" },
  { icon: "💼", label: "Business",       value: "business" },
  { icon: "🎵", label: "Music",          value: "music" },
];

const LEVEL_LABELS: Record<string, string> = {
  entry:  "Entry Level",
  mid:    "Mid Level",
  senior: "Senior",
  expert: "Expert",
};

type TabType = "jobs" | "freelancers" | "contracts" | "post" | "circuit";

interface CircuitMatch {
  jobId: string;
  score: number;
  headline: string;
  strengths: string[];
  gaps: string[];
  estimatedRate: string;
  job: JobListing & { client: { id: string; name: string } };
}

function budgetDisplay(min: number | null, max: number | null, currency: string, jobType: string) {
  if (!min && !max) return "Budget: Negotiable";
  const unit = jobType === "hourly" ? "/hr" : "";
  if (min && max) return `${currency} ${min}–${max}${unit}`;
  if (min) return `${currency} ${min}+${unit}`;
  return `Up to ${currency} ${max}${unit}`;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return `${Math.floor(days / 30)} months ago`;
}

export default function WorkPage() {
  const { user, token } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = (searchParams.get("tab") as TabType) || "jobs";
  const [activeTab, setActiveTab] = useState<TabType>(tabParam);

  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobsTotal, setJobsTotal] = useState(0);

  const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([]);
  const [freelancersLoading, setFreelancersLoading] = useState(false);

  const [contracts, setContracts] = useState<Contract[]>([]);
  const [contractsLoading, setContractsLoading] = useState(false);

  const [stats, setStats] = useState<WorkStats | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedJobType, setSelectedJobType] = useState("");

  const [applyModal, setApplyModal] = useState<JobListing | null>(null);
  const [applyForm, setApplyForm] = useState({ coverLetter: "", proposedRate: "", estimatedDays: "" });
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState(false);

  const [postForm, setPostForm] = useState({
    title: "", description: "", requirements: "", category: "software_dev",
    skills: "", experienceLevel: "mid", jobType: "fixed",
    budgetMin: "", budgetMax: "", currency: "USD", duration: "", location: "",
  });
  const [posting, setPosting] = useState(false);
  const [postError, setPostError] = useState("");
  const [postSuccess, setPostSuccess] = useState(false);

  const [circuitMatches, setCircuitMatches] = useState<CircuitMatch[]>([]);
  const [circuitLoading, setCircuitLoading] = useState(false);
  const [circuitMessage, setCircuitMessage] = useState("");
  const [proposalJobId, setProposalJobId] = useState<string | null>(null);
  const [proposalData, setProposalData] = useState<{ proposal: string; suggestedRate: number; currency: string; estimatedDays: number } | null>(null);
  const [proposalLoading, setProposalLoading] = useState(false);
  const [proposalTone, setProposalTone] = useState("professional");

  const headers = useCallback((): Record<string, string> => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    return h;
  }, [token]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/work/stats`, { headers: headers() });
      if (res.ok) setStats(await res.json());
    } catch {}
  }, [headers]);

  const fetchJobs = useCallback(async () => {
    setJobsLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery)    params.set("search",   searchQuery);
      if (selectedCategory) params.set("category", selectedCategory);
      if (selectedLevel)  params.set("level",    selectedLevel);
      if (selectedJobType) params.set("jobType", selectedJobType);
      const res = await fetch(`${API_BASE}/work/jobs?${params}`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setJobs(data.jobs ?? []);
        setJobsTotal(data.total ?? 0);
      }
    } catch {
      setJobs([]);
    } finally {
      setJobsLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedLevel, selectedJobType, headers]);

  const fetchFreelancers = useCallback(async () => {
    setFreelancersLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      const res = await fetch(`${API_BASE}/work/freelancers?${params}`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setFreelancers(data.freelancers ?? []);
      }
    } catch {
      setFreelancers([]);
    } finally {
      setFreelancersLoading(false);
    }
  }, [searchQuery, headers]);

  const fetchContracts = useCallback(async () => {
    setContractsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/work/contracts`, { headers: headers() });
      if (res.ok) {
        const data = await res.json();
        setContracts(data.contracts ?? []);
      }
    } catch {
      setContracts([]);
    } finally {
      setContractsLoading(false);
    }
  }, [headers]);

  const fetchCircuitMatches = useCallback(async () => {
    setCircuitLoading(true);
    setCircuitMessage("");
    try {
      const res = await fetch(`${API_BASE}/work/circuit/recommendations`, { headers: headers() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setCircuitMatches(data.matches ?? []);
      if (data.message) setCircuitMessage(data.message);
    } catch (err) {
      setCircuitMessage(err instanceof Error ? err.message : "CIRCUIT AI unavailable");
      setCircuitMatches([]);
    } finally {
      setCircuitLoading(false);
    }
  }, [headers]);

  const generateProposal = useCallback(async (jobId: string) => {
    setProposalJobId(jobId);
    setProposalData(null);
    setProposalLoading(true);
    try {
      const res = await fetch(`${API_BASE}/work/circuit/proposal/${jobId}`, {
        method:  "POST",
        headers: headers(),
        body:    JSON.stringify({ tone: proposalTone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setProposalData(data);
    } catch (err) {
      setCircuitMessage(err instanceof Error ? err.message : "Proposal generation failed");
    } finally {
      setProposalLoading(false);
    }
  }, [headers, proposalTone]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  useEffect(() => {
    if (activeTab === "jobs")        fetchJobs();
    if (activeTab === "freelancers") fetchFreelancers();
    if (activeTab === "contracts")   fetchContracts();
    if (activeTab === "circuit")     fetchCircuitMatches();
  }, [activeTab, fetchJobs, fetchFreelancers, fetchContracts, fetchCircuitMatches]);

  function changeTab(tab: TabType) {
    setActiveTab(tab);
    setSearchParams({ tab });
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!applyModal) return;
    setApplying(true);
    setApplyError("");
    try {
      const res = await fetch(`${API_BASE}/work/jobs/${applyModal.id}/apply`, {
        method:  "POST",
        headers: headers(),
        body:    JSON.stringify({
          coverLetter:  applyForm.coverLetter,
          proposedRate: applyForm.proposedRate || undefined,
          estimatedDays: applyForm.estimatedDays || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to apply");
      setApplySuccess(true);
      fetchJobs();
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : "Failed to apply");
    } finally {
      setApplying(false);
    }
  }

  async function handlePostJob(e: React.FormEvent) {
    e.preventDefault();
    setPosting(true);
    setPostError("");
    try {
      const res = await fetch(`${API_BASE}/work/jobs`, {
        method:  "POST",
        headers: headers(),
        body:    JSON.stringify({
          ...postForm,
          skills:    postForm.skills.split(",").map((s) => s.trim()).filter(Boolean),
          budgetMin: postForm.budgetMin || undefined,
          budgetMax: postForm.budgetMax || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to post job");
      setPostSuccess(true);
      setPostForm({
        title: "", description: "", requirements: "", category: "software_dev",
        skills: "", experienceLevel: "mid", jobType: "fixed",
        budgetMin: "", budgetMax: "", currency: "USD", duration: "", location: "",
      });
      fetchStats();
    } catch (err) {
      setPostError(err instanceof Error ? err.message : "Failed to post job");
    } finally {
      setPosting(false);
    }
  }

  const contractStatusColor: Record<string, string> = {
    ACTIVE:    "var(--green)",
    COMPLETED: "var(--ice)",
    PAUSED:    "var(--gold)",
    CANCELLED: "var(--red)",
    DISPUTED:  "var(--red)",
  };

  return (
    <>
    <style>{`
      .work-page { min-height:100vh; background:var(--bg); padding:24px; }
      .work-container { max-width:1200px; margin:0 auto; }

      .work-header { margin-bottom:28px; }
      .work-title { font-family:'Cormorant Garamond',serif; font-size:2.2rem; font-weight:300; color:var(--text); margin:0 0 6px; }
      .work-title span { color:var(--gold); font-style:italic; }
      .work-subtitle { font-family:'Syne',sans-serif; font-size:14px; color:var(--text-dim); margin:0 0 20px; }

      .work-stats-row { display:flex; gap:16px; flex-wrap:wrap; margin-bottom:24px; }
      .work-stat { background:var(--surface); border:1px solid var(--border); border-radius:6px;
        padding:14px 20px; position:relative; overflow:hidden; flex:1; min-width:140px; }
      .work-stat::before { content:''; position:absolute; top:0; left:0; right:0; height:2px;
        background:linear-gradient(90deg, var(--blue), transparent); }
      .work-stat-value { display:block; font-family:'Syne',sans-serif; font-size:1.6rem; font-weight:700; color:var(--gold); }
      .work-stat-label { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase;
        letter-spacing:.08em; color:var(--text-dim); }

      .work-tabs { display:flex; gap:4px; margin-bottom:24px; border-bottom:1px solid var(--border); padding-bottom:0; }
      .work-tab { background:transparent; border:none; border-bottom:2px solid transparent;
        padding:10px 18px; font-family:'Space Mono',monospace; font-size:11px; text-transform:uppercase;
        letter-spacing:.08em; color:var(--text-dim); cursor:pointer; transition:all .15s;
        margin-bottom:-1px; }
      .work-tab:hover { color:var(--text); }
      .work-tab.active { color:var(--gold); border-bottom-color:var(--gold); }

      .work-filters-row { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:20px; }
      .work-search-input { flex:1; min-width:220px; background:var(--surface); border:1px solid var(--border);
        border-radius:6px; padding:10px 16px; font-family:'Syne',sans-serif; font-size:14px;
        color:var(--text); }
      .work-search-input:focus { outline:none; border-color:var(--blue); }
      .work-search-input::placeholder { color:var(--text-dim); }
      .work-select { background:var(--surface); border:1px solid var(--border); border-radius:6px;
        padding:10px 14px; font-family:'Space Mono',monospace; font-size:11px; color:var(--text-dim);
        cursor:pointer; }
      .work-select:focus { outline:none; border-color:var(--blue); }

      .work-filter-btn { background:var(--surface); border:1px solid var(--border); border-radius:6px;
        padding:10px 16px; font-family:'Space Mono',monospace; font-size:11px; text-transform:uppercase;
        color:var(--text-dim); cursor:pointer; transition:all .15s; }
      .work-filter-btn:hover { border-color:var(--blue); color:var(--text); }
      .work-filter-btn.active { background:var(--blue); border-color:var(--blue); color:var(--text); }

      .jobs-list { display:flex; flex-direction:column; gap:16px; }
      .job-card { background:var(--surface); border:1px solid var(--border); border-radius:6px;
        padding:20px; position:relative; overflow:hidden; transition:border-color .2s; }
      .job-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px;
        background:linear-gradient(90deg, var(--blue), transparent); }
      .job-card:hover { border-color:var(--blue); }
      .job-card.featured::before { background:linear-gradient(90deg, var(--gold), transparent); }
      .job-card.featured { border-color:rgba(201,168,76,.3); }

      .job-card-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:10px; gap:12px; }
      .job-card-title { font-family:'Syne',sans-serif; font-size:1.05rem; font-weight:700; color:var(--text); margin:0 0 4px; }
      .job-card-meta { font-family:'Space Mono',monospace; font-size:10px; color:var(--text-dim); }
      .job-card-badges { display:flex; gap:6px; align-items:center; flex-wrap:wrap; flex-shrink:0; }
      .job-badge { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase;
        letter-spacing:.06em; padding:3px 8px; border-radius:3px; border:1px solid; }
      .job-badge.type-fixed  { color:var(--ice);    border-color:rgba(137,196,225,.3);  background:rgba(137,196,225,.08); }
      .job-badge.type-hourly { color:var(--green);  border-color:rgba(45,212,160,.3);   background:rgba(45,212,160,.08); }
      .job-badge.level       { color:var(--text-dim); border-color:var(--border);        background:var(--surface2); }
      .job-badge.featured    { color:var(--gold);   border-color:rgba(201,168,76,.3);   background:rgba(201,168,76,.08); }
      .job-badge.applied     { color:var(--green);  border-color:rgba(45,212,160,.3);   background:rgba(45,212,160,.08); }

      .job-card-desc { font-family:'Syne',sans-serif; font-size:13px; color:var(--text-dim);
        margin:0 0 12px; line-height:1.6; display:-webkit-box; -webkit-line-clamp:2;
        -webkit-box-orient:vertical; overflow:hidden; }
      .job-card-skills { display:flex; flex-wrap:wrap; gap:6px; margin-bottom:14px; }
      .skill-chip { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase;
        padding:3px 8px; background:var(--surface2); border:1px solid var(--border);
        border-radius:3px; color:var(--text-dim); }
      .job-card-footer { display:flex; justify-content:space-between; align-items:center; }
      .job-card-budget { font-family:'Space Mono',monospace; font-size:11px; color:var(--gold); }
      .job-card-info { font-family:'Space Mono',monospace; font-size:10px; color:var(--text-dim); }
      .job-card-actions { display:flex; gap:8px; }
      .btn-apply { background:var(--blue); border:none; border-radius:4px; padding:8px 18px;
        font-family:'Space Mono',monospace; font-size:10px; text-transform:uppercase; color:var(--text);
        cursor:pointer; transition:background .15s; }
      .btn-apply:hover { background:var(--ice); }
      .btn-apply:disabled { opacity:.5; cursor:not-allowed; }
      .btn-view { background:transparent; border:1px solid var(--border); border-radius:4px;
        padding:8px 14px; font-family:'Space Mono',monospace; font-size:10px; text-transform:uppercase;
        color:var(--text-dim); cursor:pointer; transition:all .15s; text-decoration:none; display:inline-block; }
      .btn-view:hover { border-color:var(--blue); color:var(--text); }

      .freelancers-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(300px, 1fr)); gap:16px; }
      .freelancer-card { background:var(--surface); border:1px solid var(--border); border-radius:6px;
        padding:20px; position:relative; overflow:hidden; transition:border-color .2s; }
      .freelancer-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px;
        background:linear-gradient(90deg, var(--gold), transparent); }
      .freelancer-card:hover { border-color:var(--gold); }
      .freelancer-avatar { width:44px; height:44px; border-radius:50%; background:rgba(201,168,76,.15);
        color:var(--gold); display:flex; align-items:center; justify-content:center;
        font-family:'Space Mono',monospace; font-size:14px; font-weight:700;
        border:2px solid rgba(201,168,76,.3); flex-shrink:0; }
      .freelancer-top { display:flex; gap:12px; margin-bottom:14px; align-items:flex-start; }
      .freelancer-info { flex:1; min-width:0; }
      .freelancer-name { font-family:'Syne',sans-serif; font-size:14px; font-weight:700; color:var(--text); margin:0 0 2px; }
      .freelancer-title { font-family:'Syne',sans-serif; font-size:12px; color:var(--text-dim); margin:0 0 4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .freelancer-rate { font-family:'Space Mono',monospace; font-size:11px; color:var(--gold); }
      .freelancer-trust { font-family:'Space Mono',monospace; font-size:10px; color:var(--text-dim); }
      .freelancer-skills { display:flex; flex-wrap:wrap; gap:5px; margin-bottom:14px; }
      .freelancer-footer { display:flex; justify-content:space-between; align-items:center; }
      .avail-badge { font-family:'Space Mono',monospace; font-size:9px; padding:3px 8px;
        border-radius:3px; border:1px solid; }
      .avail-badge.AVAILABLE   { color:var(--green); border-color:rgba(45,212,160,.3);  background:rgba(45,212,160,.08); }
      .avail-badge.UNAVAILABLE { color:var(--red);   border-color:rgba(224,90,78,.3);   background:rgba(224,90,78,.08); }
      .avail-badge.BUSY        { color:var(--gold);  border-color:rgba(201,168,76,.3);  background:rgba(201,168,76,.08); }

      .contracts-list { display:flex; flex-direction:column; gap:16px; }
      .contract-card { background:var(--surface); border:1px solid var(--border); border-radius:6px;
        padding:20px; position:relative; overflow:hidden; }
      .contract-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px;
        background:linear-gradient(90deg, var(--purple), transparent); }
      .contract-top { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px; }
      .contract-title { font-family:'Syne',sans-serif; font-size:1rem; font-weight:700; color:var(--text); margin:0 0 4px; }
      .contract-meta { font-family:'Space Mono',monospace; font-size:10px; color:var(--text-dim); }
      .contract-status { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase;
        padding:4px 10px; border-radius:3px; border:1px solid rgba(255,255,255,.08); }
      .contract-milestones { display:flex; gap:8px; flex-wrap:wrap; margin-top:12px; }
      .milestone-chip { font-family:'Space Mono',monospace; font-size:9px; padding:3px 8px;
        border-radius:3px; background:var(--surface2); border:1px solid var(--border); color:var(--text-dim); }
      .milestone-chip.APPROVED, .milestone-chip.PAID { color:var(--green); border-color:rgba(45,212,160,.3); }
      .milestone-chip.SUBMITTED { color:var(--gold); border-color:rgba(201,168,76,.3); }

      .work-empty { text-align:center; padding:60px 24px; }
      .work-empty-icon { font-size:48px; margin-bottom:16px; }
      .work-empty h3 { font-family:'Syne',sans-serif; font-size:1.2rem; color:var(--text); margin:0 0 8px; }
      .work-empty p { font-family:'Syne',sans-serif; font-size:14px; color:var(--text-dim); margin:0 0 20px; }

      .work-skeleton { background:var(--surface); border:1px solid var(--border); border-radius:6px;
        padding:20px; margin-bottom:16px; }
      .skel-line { height:12px; background:var(--surface2); border-radius:4px; margin-bottom:10px;
        animation:shimmer 1.5s infinite; }
      @keyframes shimmer { 0%,100%{opacity:.6} 50%{opacity:1} }

      .post-job-form { background:var(--surface); border:1px solid var(--border); border-radius:6px; padding:28px; }
      .post-job-form h2 { font-family:'Syne',sans-serif; font-size:1.3rem; font-weight:700; color:var(--text); margin:0 0 24px; }
      .form-section { margin-bottom:28px; }
      .form-section-title { font-family:'Space Mono',monospace; font-size:10px; text-transform:uppercase;
        letter-spacing:.1em; color:var(--text-dim); margin:0 0 14px;
        padding-bottom:8px; border-bottom:1px solid var(--border); }
      .form-row { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
      .form-group { display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
      .form-label { font-family:'Space Mono',monospace; font-size:10px; text-transform:uppercase;
        letter-spacing:.06em; color:var(--text-dim); }
      .form-input, .form-textarea, .form-select-field { background:var(--surface2); border:1px solid var(--border);
        border-radius:4px; padding:10px 14px; font-family:'Syne',sans-serif; font-size:14px;
        color:var(--text); width:100%; box-sizing:border-box; }
      .form-input:focus, .form-textarea:focus, .form-select-field:focus { outline:none; border-color:var(--blue); }
      .form-input::placeholder, .form-textarea::placeholder { color:var(--text-dim); }
      .form-textarea { min-height:120px; resize:vertical; line-height:1.6; }
      .form-submit { background:var(--gold); border:none; border-radius:4px; padding:12px 24px;
        font-family:'Space Mono',monospace; font-size:11px; text-transform:uppercase; letter-spacing:.08em;
        color:var(--bg); cursor:pointer; transition:opacity .15s; font-weight:700; }
      .form-submit:hover { opacity:.85; }
      .form-submit:disabled { opacity:.5; cursor:not-allowed; }
      .form-error { background:rgba(224,90,78,.1); border:1px solid rgba(224,90,78,.3);
        color:var(--red); border-radius:4px; padding:10px 14px; font-family:'Syne',sans-serif;
        font-size:13px; margin-bottom:16px; }
      .form-success { background:rgba(45,212,160,.1); border:1px solid rgba(45,212,160,.3);
        color:var(--green); border-radius:4px; padding:10px 14px; font-family:'Syne',sans-serif;
        font-size:13px; margin-bottom:16px; }

      .modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,.75); z-index:200;
        display:flex; align-items:center; justify-content:center; padding:24px; }
      .modal-box { background:var(--surface); border:1px solid var(--border); border-radius:8px;
        padding:28px; width:100%; max-width:560px; max-height:80vh; overflow-y:auto; position:relative; }
      .modal-box::before { content:''; position:absolute; top:0; left:0; right:0; height:2px;
        background:linear-gradient(90deg, var(--blue), var(--ice)); }
      .modal-title { font-family:'Syne',sans-serif; font-size:1.2rem; font-weight:700; color:var(--text); margin:0 0 4px; }
      .modal-subtitle { font-family:'Space Mono',monospace; font-size:10px; color:var(--text-dim); margin:0 0 20px; }
      .modal-close { position:absolute; top:16px; right:16px; background:transparent; border:none;
        color:var(--text-dim); font-size:20px; cursor:pointer; }

      .circuit-panel { display:flex; flex-direction:column; gap:16px; }
      .circuit-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:12px; }
      .circuit-title { font-family:'Syne',sans-serif; font-size:1.1rem; font-weight:700; color:var(--text); margin:0; }
      .circuit-meta { font-family:'Space Mono',monospace; font-size:9px; color:var(--text-dim); }
      .circuit-refresh { background:transparent; border:1px solid var(--border); border-radius:4px;
        padding:8px 14px; font-family:'Space Mono',monospace; font-size:10px; text-transform:uppercase;
        color:var(--text-dim); cursor:pointer; transition:all .15s; }
      .circuit-refresh:hover { border-color:var(--purple); color:var(--purple); }

      .circuit-match-card { background:var(--surface); border:1px solid var(--border); border-radius:6px;
        padding:20px; position:relative; overflow:hidden; transition:border-color .2s; }
      .circuit-match-card::before { content:''; position:absolute; top:0; left:0; right:0; height:2px;
        background:linear-gradient(90deg, var(--purple), transparent); }
      .circuit-match-card:hover { border-color:var(--purple); }

      .circuit-score-row { display:flex; align-items:center; gap:12px; margin-bottom:12px; }
      .circuit-score-ring { width:52px; height:52px; flex-shrink:0; }
      .circuit-score-info { flex:1; }
      .circuit-score-label { font-family:'Space Mono',monospace; font-size:8px; text-transform:uppercase;
        letter-spacing:.1em; color:var(--text-dim); margin:0 0 2px; }
      .circuit-score-value { font-family:'Syne',sans-serif; font-size:1.5rem; font-weight:800; color:var(--purple); margin:0; }
      .circuit-match-title { font-family:'Syne',sans-serif; font-size:.95rem; font-weight:700; color:var(--text); margin:0 0 4px; }
      .circuit-headline { font-family:'Syne',sans-serif; font-size:13px; color:var(--text-dim); margin:0 0 12px; line-height:1.5; }

      .circuit-tags-row { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:12px; }
      .circuit-tag { font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase;
        padding:3px 8px; border-radius:3px; border:1px solid; }
      .circuit-tag.strength { color:var(--green);  border-color:rgba(45,212,160,.3);  background:rgba(45,212,160,.08); }
      .circuit-tag.gap      { color:var(--gold);   border-color:rgba(201,168,76,.3);  background:rgba(201,168,76,.08); }

      .circuit-footer { display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; }
      .circuit-rate { font-family:'Space Mono',monospace; font-size:11px; color:var(--gold); }
      .circuit-actions { display:flex; gap:8px; }
      .btn-circuit { padding:8px 16px; border-radius:4px; font-family:'Space Mono',monospace;
        font-size:10px; text-transform:uppercase; cursor:pointer; transition:all .15s; border:none; }
      .btn-circuit.primary { background:var(--purple); color:var(--text); }
      .btn-circuit.primary:hover { opacity:.85; }
      .btn-circuit.secondary { background:transparent; border:1px solid var(--border); color:var(--text-dim); }
      .btn-circuit.secondary:hover { border-color:var(--purple); color:var(--purple); }
      .btn-circuit:disabled { opacity:.5; cursor:not-allowed; }

      .proposal-modal-box { background:var(--surface); border:1px solid var(--border); border-radius:8px;
        padding:28px; width:100%; max-width:680px; max-height:85vh; overflow-y:auto; position:relative; }
      .proposal-modal-box::before { content:''; position:absolute; top:0; left:0; right:0; height:2px;
        background:linear-gradient(90deg, var(--purple), var(--ice)); }
      .proposal-text { font-family:'Syne',sans-serif; font-size:14px; color:var(--text); line-height:1.8;
        background:var(--surface2); border:1px solid var(--border); border-radius:6px;
        padding:20px; margin-bottom:16px; white-space:pre-wrap; }
      .proposal-copy { background:var(--purple); border:none; border-radius:4px; padding:10px 20px;
        font-family:'Space Mono',monospace; font-size:10px; text-transform:uppercase;
        color:var(--text); cursor:pointer; transition:opacity .15s; }
      .proposal-copy:hover { opacity:.85; }
      .circuit-tone-row { display:flex; gap:8px; margin-bottom:16px; align-items:center; }
      .circuit-tone-label { font-family:'Space Mono',monospace; font-size:10px; color:var(--text-dim); margin-right:4px; }
      .tone-btn { background:transparent; border:1px solid var(--border); border-radius:3px;
        padding:4px 12px; font-family:'Space Mono',monospace; font-size:9px; text-transform:uppercase;
        color:var(--text-dim); cursor:pointer; transition:all .15s; }
      .tone-btn.active { background:rgba(155,111,255,.15); border-color:var(--purple); color:var(--purple); }
      .circuit-empty { text-align:center; padding:48px 24px; background:var(--surface);
        border:1px solid var(--border); border-radius:6px; }
      .circuit-empty p { font-family:'Syne',sans-serif; font-size:14px; color:var(--text-dim); margin:0 0 16px; }

      .cta-row { display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:16px; margin-top:32px; }
      .cta-card-work { background:var(--surface); border:1px solid var(--border); border-radius:6px;
        padding:24px; text-align:center; position:relative; overflow:hidden; }
      .cta-card-work::before { content:''; position:absolute; top:0; left:0; right:0; height:2px;
        background:linear-gradient(90deg, var(--gold), transparent); }
      .cta-card-work h3 { font-family:'Syne',sans-serif; font-size:1rem; font-weight:700; color:var(--text); margin:0 0 8px; }
      .cta-card-work p { font-family:'Syne',sans-serif; font-size:13px; color:var(--text-dim); margin:0 0 16px; }
      .cta-btn-work { display:inline-block; padding:10px 22px; border-radius:4px;
        font-family:'Space Mono',monospace; font-size:10px; text-transform:uppercase;
        text-decoration:none; cursor:pointer; border:none; transition:all .15s; }
      .cta-btn-work.primary { background:var(--gold); color:var(--bg); }
      .cta-btn-work.primary:hover { opacity:.85; }
      .cta-btn-work.secondary { background:transparent; border:1px solid var(--border); color:var(--text-dim); }
      .cta-btn-work.secondary:hover { border-color:var(--gold); color:var(--text); }

      @media(max-width:640px) {
        .work-stats-row { gap:10px; }
        .form-row { grid-template-columns:1fr; }
        .freelancers-grid { grid-template-columns:1fr; }
      }
    `}</style>

    <div className="work-page">
      <div className="work-container">
        <ContextBar activeLayer="work" statusOverrides={{ work: "active" }} />

        <div className="work-header">
          <h1 className="work-title">Winners <span>Work</span></h1>
          <p className="work-subtitle">African freelancers · Global clients · CIRCUIT AI matching</p>
        </div>

        {stats && (
          <div className="work-stats-row">
            <div className="work-stat">
              <span className="work-stat-value">{stats.openJobs.toLocaleString()}</span>
              <span className="work-stat-label">Open Jobs</span>
            </div>
            <div className="work-stat">
              <span className="work-stat-value">{stats.availableFreelancers.toLocaleString()}</span>
              <span className="work-stat-label">Freelancers</span>
            </div>
            <div className="work-stat">
              <span className="work-stat-value">{stats.completedContracts.toLocaleString()}</span>
              <span className="work-stat-label">Completed</span>
            </div>
            <div className="work-stat">
              <span className="work-stat-value">8–12%</span>
              <span className="work-stat-label">Platform Fee</span>
            </div>
          </div>
        )}

        <div className="work-tabs">
          {([
            { id: "jobs",        label: "💼 Browse Jobs" },
            { id: "freelancers", label: "🧑‍💻 Find Talent" },
            { id: "contracts",   label: "📄 My Contracts" },
            { id: "post",        label: "+ Post a Job" },
            { id: "circuit",     label: "🤖 CIRCUIT AI" },
          ] as { id: TabType; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              className={`work-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => changeTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {(activeTab === "jobs" || activeTab === "freelancers") && (
          <div className="work-filters-row">
            <input
              className="work-search-input"
              placeholder={activeTab === "jobs" ? "Search jobs, skills…" : "Search freelancers…"}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (activeTab === "jobs" ? fetchJobs() : fetchFreelancers())}
            />
            {activeTab === "jobs" && (
              <>
                <select className="work-select" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                  <option value="">All Categories</option>
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                </select>
                <select className="work-select" value={selectedLevel} onChange={(e) => setSelectedLevel(e.target.value)}>
                  <option value="">All Levels</option>
                  {Object.entries(LEVEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <button
                  className={`work-filter-btn ${selectedJobType === "fixed" ? "active" : ""}`}
                  onClick={() => setSelectedJobType(selectedJobType === "fixed" ? "" : "fixed")}
                >Fixed</button>
                <button
                  className={`work-filter-btn ${selectedJobType === "hourly" ? "active" : ""}`}
                  onClick={() => setSelectedJobType(selectedJobType === "hourly" ? "" : "hourly")}
                >Hourly</button>
              </>
            )}
            <button className="work-filter-btn active" onClick={() => activeTab === "jobs" ? fetchJobs() : fetchFreelancers()}>
              Search
            </button>
          </div>
        )}

        {activeTab === "jobs" && (
          <div>
            {jobsLoading ? (
              [1,2,3].map((i) => (
                <div key={i} className="work-skeleton">
                  <div className="skel-line" style={{ width: "60%" }} />
                  <div className="skel-line" style={{ width: "40%" }} />
                  <div className="skel-line" style={{ width: "80%" }} />
                </div>
              ))
            ) : jobs.length === 0 ? (
              <div className="work-empty">
                <div className="work-empty-icon">💼</div>
                <h3>No jobs found</h3>
                <p>Try different filters or check back soon for new listings.</p>
                <button className="cta-btn-work primary" onClick={() => changeTab("post")}>Post a Job</button>
              </div>
            ) : (
              <>
                <p style={{ fontFamily:"'Space Mono',monospace", fontSize:11, color:"var(--text-dim)", marginBottom:16 }}>
                  {jobsTotal} job{jobsTotal !== 1 ? "s" : ""} found
                </p>
                <div className="jobs-list">
                  {jobs.map((job) => (
                    <div key={job.id} className={`job-card ${job.isFeatured ? "featured" : ""}`}>
                      <div className="job-card-top">
                        <div>
                          <h3 className="job-card-title">{job.title}</h3>
                          <span className="job-card-meta">
                            by {job.client.name} · {timeAgo(job.createdAt)}
                            {job.location ? ` · 📍 ${job.location}` : ""}
                          </span>
                        </div>
                        <div className="job-card-badges">
                          {job.isFeatured && <span className="job-badge featured">⭐ Featured</span>}
                          <span className={`job-badge type-${job.jobType}`}>{job.jobType}</span>
                          <span className="job-badge level">{LEVEL_LABELS[job.experienceLevel] ?? job.experienceLevel}</span>
                          {job.myApplication && <span className="job-badge applied">✓ Applied</span>}
                        </div>
                      </div>

                      <p className="job-card-desc">{job.description}</p>

                      {job.skills.length > 0 && (
                        <div className="job-card-skills">
                          {job.skills.slice(0, 6).map((s) => <span key={s} className="skill-chip">{s}</span>)}
                          {job.skills.length > 6 && <span className="skill-chip">+{job.skills.length - 6}</span>}
                        </div>
                      )}

                      <div className="job-card-footer">
                        <div>
                          <div className="job-card-budget">
                            {budgetDisplay(job.budgetMin, job.budgetMax, job.currency, job.jobType)}
                          </div>
                          <div className="job-card-info">
                            {job.applicationCount} applicant{job.applicationCount !== 1 ? "s" : ""}
                            {job.duration ? ` · ${job.duration}` : ""}
                          </div>
                        </div>
                        <div className="job-card-actions">
                          {!job.myApplication ? (
                            <button className="btn-apply" onClick={() => {
                              setApplyModal(job);
                              setApplySuccess(false);
                              setApplyError("");
                              setApplyForm({ coverLetter: "", proposedRate: "", estimatedDays: "" });
                            }}>
                              Apply
                            </button>
                          ) : (
                            <span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:"var(--green)" }}>
                              Applied · {job.myApplication.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="cta-row">
              <div className="cta-card-work">
                <h3>Need to Hire?</h3>
                <p>Post a job and CIRCUIT will match you with the best African talent.</p>
                <button className="cta-btn-work primary" onClick={() => changeTab("post")}>Post a Job</button>
              </div>
              <div className="cta-card-work">
                <h3>Become a Verified Freelancer</h3>
                <p>Complete Academy certifications to boost your profile and match with premium clients.</p>
                <Link to="/academy" className="cta-btn-work secondary">Get Certified</Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === "freelancers" && (
          <div>
            {freelancersLoading ? (
              <div className="freelancers-grid">
                {[1,2,3,4,5,6].map((i) => (
                  <div key={i} className="work-skeleton">
                    <div className="skel-line" style={{ width: "50%" }} />
                    <div className="skel-line" style={{ width: "70%" }} />
                    <div className="skel-line" style={{ width: "90%" }} />
                  </div>
                ))}
              </div>
            ) : freelancers.length === 0 ? (
              <div className="work-empty">
                <div className="work-empty-icon">🧑‍💻</div>
                <h3>No freelancers found</h3>
                <p>Be the first to create a freelancer profile and start landing contracts.</p>
                <Link to="/work/profile" className="cta-btn-work primary">Create Profile</Link>
              </div>
            ) : (
              <div className="freelancers-grid">
                {freelancers.map((f) => (
                  <div key={f.id} className="freelancer-card">
                    <div className="freelancer-top">
                      <div className="freelancer-avatar">
                        {f.user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="freelancer-info">
                        <div className="freelancer-name">{f.user.name}</div>
                        <div className="freelancer-title">{f.title ?? "Freelancer"}</div>
                        {f.hourlyRate && (
                          <div className="freelancer-rate">${f.hourlyRate}/hr</div>
                        )}
                      </div>
                    </div>

                    {f.bio && (
                      <p style={{ fontFamily:"'Syne',sans-serif", fontSize:13, color:"var(--text-dim)", margin:"0 0 12px", lineHeight:1.5, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
                        {f.bio}
                      </p>
                    )}

                    {f.skills.length > 0 && (
                      <div className="freelancer-skills">
                        {f.skills.slice(0, 5).map((s) => <span key={s} className="skill-chip">{s}</span>)}
                        {f.skills.length > 5 && <span className="skill-chip">+{f.skills.length - 5}</span>}
                      </div>
                    )}

                    <div className="freelancer-footer">
                      <span className={`avail-badge ${f.availability}`}>{f.availability.toLowerCase()}</span>
                      <div className="freelancer-trust">
                        ⭐ {f.trustScore.toFixed(0)} trust · {f.totalJobs} jobs
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="cta-row">
              <div className="cta-card-work">
                <h3>Are You a Freelancer?</h3>
                <p>Create your profile, showcase your skills, and start winning contracts.</p>
                <Link to="/work/profile" className="cta-btn-work primary">Create Your Profile</Link>
              </div>
            </div>
          </div>
        )}

        {activeTab === "contracts" && (
          <div>
            {contractsLoading ? (
              [1,2].map((i) => (
                <div key={i} className="work-skeleton">
                  <div className="skel-line" style={{ width: "60%" }} />
                  <div className="skel-line" style={{ width: "40%" }} />
                </div>
              ))
            ) : contracts.length === 0 ? (
              <div className="work-empty">
                <div className="work-empty-icon">📄</div>
                <h3>No contracts yet</h3>
                <p>Apply to jobs or post a listing to start working with clients and freelancers.</p>
                <button className="cta-btn-work primary" onClick={() => changeTab("jobs")}>Browse Jobs</button>
              </div>
            ) : (
              <div className="contracts-list">
                {contracts.map((c) => (
                  <div key={c.id} className="contract-card">
                    <div className="contract-top">
                      <div>
                        <div className="contract-title">{c.title}</div>
                        <div className="contract-meta">
                          {c.client.name} ↔ {c.freelancer.user.name} · Started {new Date(c.startDate).toLocaleDateString()}
                          {c.job ? ` · ${c.job.title}` : ""}
                        </div>
                      </div>
                      <span className="contract-status" style={{ color: contractStatusColor[c.status] ?? "var(--text-dim)" }}>
                        {c.status}
                      </span>
                    </div>

                    <div style={{ display:"flex", gap:20, fontFamily:"'Space Mono',monospace", fontSize:11 }}>
                      <span style={{ color:"var(--gold)" }}>
                        {c.currency} {c.amount.toLocaleString()}
                        {c.paymentType === "hourly" ? "/hr" : ""}
                      </span>
                      <span style={{ color:"var(--text-dim)" }}>{c.paymentType}</span>
                      {c.endDate && <span style={{ color:"var(--text-dim)" }}>Due {new Date(c.endDate).toLocaleDateString()}</span>}
                    </div>

                    {c.milestones.length > 0 && (
                      <div className="contract-milestones">
                        {c.milestones.map((m) => (
                          <span key={m.id} className={`milestone-chip ${m.status}`}>
                            {m.title} · ${m.amount}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "post" && (
          <div className="post-job-form">
            <h2>Post a Job</h2>
            {postSuccess && (
              <div className="form-success">
                ✅ Job posted successfully! Freelancers can now apply.
                <button style={{ marginLeft:12, background:"none", border:"none", color:"var(--green)", cursor:"pointer", fontFamily:"'Space Mono',monospace", fontSize:11 }} onClick={() => { setPostSuccess(false); changeTab("jobs"); }}>
                  View Jobs →
                </button>
              </div>
            )}
            {postError && <div className="form-error">{postError}</div>}

            <form onSubmit={handlePostJob}>
              <div className="form-section">
                <div className="form-section-title">Job Details</div>
                <div className="form-group">
                  <label className="form-label">Job Title *</label>
                  <input className="form-input" required placeholder="e.g. Senior React Developer"
                    value={postForm.title} onChange={(e) => setPostForm({ ...postForm, title: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category *</label>
                    <select className="form-select-field" value={postForm.category} onChange={(e) => setPostForm({ ...postForm, category: e.target.value })}>
                      {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Experience Level *</label>
                    <select className="form-select-field" value={postForm.experienceLevel} onChange={(e) => setPostForm({ ...postForm, experienceLevel: e.target.value })}>
                      {Object.entries(LEVEL_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Description *</label>
                  <textarea className="form-textarea" required placeholder="Describe the project, deliverables, and what success looks like…"
                    value={postForm.description} onChange={(e) => setPostForm({ ...postForm, description: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Requirements</label>
                  <textarea className="form-textarea" style={{ minHeight:80 }} placeholder="List specific skills, certifications, or experience required…"
                    value={postForm.requirements} onChange={(e) => setPostForm({ ...postForm, requirements: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Required Skills (comma-separated)</label>
                  <input className="form-input" placeholder="React, TypeScript, Node.js"
                    value={postForm.skills} onChange={(e) => setPostForm({ ...postForm, skills: e.target.value })} />
                </div>
              </div>

              <div className="form-section">
                <div className="form-section-title">Budget & Timeline</div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Payment Type *</label>
                    <select className="form-select-field" value={postForm.jobType} onChange={(e) => setPostForm({ ...postForm, jobType: e.target.value })}>
                      <option value="fixed">Fixed Price</option>
                      <option value="hourly">Hourly Rate</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Currency</label>
                    <select className="form-select-field" value={postForm.currency} onChange={(e) => setPostForm({ ...postForm, currency: e.target.value })}>
                      <option value="USD">USD</option>
                      <option value="GBP">GBP</option>
                      <option value="EUR">EUR</option>
                      <option value="KES">KES</option>
                      <option value="NGN">NGN</option>
                      <option value="GHS">GHS</option>
                      <option value="ZAR">ZAR</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Budget Min ({postForm.currency})</label>
                    <input className="form-input" type="number" placeholder="500"
                      value={postForm.budgetMin} onChange={(e) => setPostForm({ ...postForm, budgetMin: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Budget Max ({postForm.currency})</label>
                    <input className="form-input" type="number" placeholder="2000"
                      value={postForm.budgetMax} onChange={(e) => setPostForm({ ...postForm, budgetMax: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Duration Estimate</label>
                    <input className="form-input" placeholder="e.g. 2 weeks, 3 months"
                      value={postForm.duration} onChange={(e) => setPostForm({ ...postForm, duration: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input className="form-input" placeholder="Remote, Lagos, or Worldwide"
                      value={postForm.location} onChange={(e) => setPostForm({ ...postForm, location: e.target.value })} />
                  </div>
                </div>
              </div>

              <button className="form-submit" type="submit" disabled={posting}>
                {posting ? "Posting…" : "Post Job Listing"}
              </button>
            </form>
          </div>
        )}
      </div>

      {applyModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setApplyModal(null)}>
          <div className="modal-box">
            <button className="modal-close" onClick={() => setApplyModal(null)}>×</button>
            <div className="modal-title">{applyModal.title}</div>
            <div className="modal-subtitle">by {applyModal.client.name} · {budgetDisplay(applyModal.budgetMin, applyModal.budgetMax, applyModal.currency, applyModal.jobType)}</div>

            {applySuccess ? (
              <div className="form-success">
                ✅ Application submitted! The client will review your proposal.
                <br /><br />
                <button className="btn-view" onClick={() => setApplyModal(null)}>Close</button>
              </div>
            ) : (
              <form onSubmit={handleApply}>
                {applyError && <div className="form-error">{applyError}</div>}
                <div className="form-group">
                  <label className="form-label">Cover Letter *</label>
                  <textarea className="form-textarea" required placeholder="Why are you the best fit for this project? Include relevant experience and how you'd approach it…"
                    value={applyForm.coverLetter} onChange={(e) => setApplyForm({ ...applyForm, coverLetter: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Proposed Rate ({applyModal.currency})</label>
                    <input className="form-input" type="number" placeholder={applyModal.jobType === "hourly" ? "Rate/hr" : "Total"}
                      value={applyForm.proposedRate} onChange={(e) => setApplyForm({ ...applyForm, proposedRate: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Estimated Days</label>
                    <input className="form-input" type="number" placeholder="14"
                      value={applyForm.estimatedDays} onChange={(e) => setApplyForm({ ...applyForm, estimatedDays: e.target.value })} />
                  </div>
                </div>
                <button className="btn-apply" type="submit" disabled={applying} style={{ width:"100%", padding:"12px" }}>
                  {applying ? "Submitting…" : "Submit Application"}
                </button>
                <p style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"var(--text-dim)", marginTop:10, textAlign:"center" }}>
                  You need a freelancer profile to apply. <Link to="/work/profile" style={{ color:"var(--ice)" }}>Create one here</Link>
                </p>
              </form>
            )}
          </div>
        </div>
      )}

      {activeTab === "circuit" && (
        <div className="circuit-panel">
          <div className="circuit-header">
            <div>
              <h2 className="circuit-title">💼 CIRCUIT AI — Job Matching</h2>
              <p className="circuit-meta">AI-ranked matches based on your skills, certificates, and profile</p>
            </div>
            <div style={{ display:"flex", gap:8, alignItems:"center" }}>
              <span className="circuit-tone-label">Proposal tone:</span>
              {["professional", "confident", "warm"].map((t) => (
                <button key={t} className={`tone-btn ${proposalTone === t ? "active" : ""}`} onClick={() => setProposalTone(t)}>{t}</button>
              ))}
              <button className="circuit-refresh" onClick={fetchCircuitMatches} disabled={circuitLoading}>
                {circuitLoading ? "Analysing…" : "↺ Refresh"}
              </button>
            </div>
          </div>

          {circuitMessage && (
            <div style={{ background:"rgba(201,168,76,.08)", border:"1px solid rgba(201,168,76,.25)", borderRadius:6, padding:"12px 16px", fontFamily:"'Syne',sans-serif", fontSize:13, color:"var(--gold)" }}>
              {circuitMessage}
            </div>
          )}

          {circuitLoading ? (
            [1,2,3].map((i) => (
              <div key={i} className="work-skeleton">
                <div className="skel-line" style={{ width:"60%", height:16, marginBottom:12 }} />
                <div className="skel-line" style={{ width:"90%" }} />
                <div className="skel-line" style={{ width:"75%" }} />
              </div>
            ))
          ) : circuitMatches.length === 0 ? (
            <div className="circuit-empty">
              <div style={{ fontSize:48, marginBottom:16 }}>🤖</div>
              <p>No matches yet — make sure you have a freelancer profile with skills listed.</p>
              <Link to="/work/profile" className="cta-btn-work primary">Set Up Profile →</Link>
            </div>
          ) : (
            circuitMatches.map((match) => {
              const score = match.score;
              const r = 22;
              const circ = 2 * Math.PI * r;
              const dash = (score / 100) * circ;
              const scoreColor = score >= 80 ? "var(--green)" : score >= 60 ? "var(--gold)" : "var(--ice)";

              return (
                <div key={match.jobId} className="circuit-match-card">
                  <div className="circuit-score-row">
                    <svg className="circuit-score-ring" viewBox="0 0 52 52">
                      <circle cx="26" cy="26" r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
                      <circle cx="26" cy="26" r={r} fill="none" stroke={scoreColor} strokeWidth="4"
                        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
                        transform="rotate(-90 26 26)" />
                      <text x="26" y="30" textAnchor="middle" fontSize="11" fontWeight="700"
                        fill={scoreColor} fontFamily="'Space Mono',monospace">{score}</text>
                    </svg>
                    <div className="circuit-score-info">
                      <p className="circuit-score-label">Match Score</p>
                      <h3 className="circuit-match-title">{match.job?.title}</h3>
                    </div>
                    <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, color:"var(--text-dim)", textAlign:"right" }}>
                      <div>{match.job?.category?.replace(/_/g, " ")}</div>
                      <div style={{ marginTop:3 }}>{budgetDisplay(match.job?.budgetMin ?? null, match.job?.budgetMax ?? null, match.job?.currency ?? "USD", match.job?.jobType ?? "fixed")}</div>
                    </div>
                  </div>

                  <p className="circuit-headline">{match.headline}</p>

                  <div className="circuit-tags-row">
                    {match.strengths?.map((s) => <span key={s} className="circuit-tag strength">✓ {s}</span>)}
                    {match.gaps?.map((g) => <span key={g} className="circuit-tag gap">△ {g}</span>)}
                  </div>

                  <div className="circuit-footer">
                    <div className="circuit-rate">💡 Suggested bid: {match.estimatedRate}</div>
                    <div className="circuit-actions">
                      <button
                        className="btn-circuit primary"
                        onClick={() => generateProposal(match.jobId)}
                        disabled={proposalLoading && proposalJobId === match.jobId}
                      >
                        {proposalLoading && proposalJobId === match.jobId ? "Writing…" : "✍ Generate Proposal"}
                      </button>
                      <button className="btn-circuit secondary" onClick={() => setApplyModal(match.job as unknown as JobListing)}>
                        Apply
                      </button>
                    </div>
                  </div>

                  {proposalData && proposalJobId === match.jobId && (
                    <div style={{ marginTop:16, padding:"16px", background:"var(--surface2)", borderRadius:6, border:"1px solid rgba(155,111,255,.2)" }}>
                      <div style={{ fontFamily:"'Space Mono',monospace", fontSize:9, textTransform:"uppercase", letterSpacing:".1em", color:"var(--purple)", marginBottom:10 }}>
                        🤖 CIRCUIT Proposal — {proposalTone} tone
                      </div>
                      <div className="proposal-text">{proposalData.proposal}</div>
                      <div style={{ display:"flex", gap:12, alignItems:"center", flexWrap:"wrap" }}>
                        <button className="proposal-copy" onClick={() => navigator.clipboard.writeText(proposalData.proposal)}>
                          Copy Proposal
                        </button>
                        <span style={{ fontFamily:"'Space Mono',monospace", fontSize:10, color:"var(--gold)" }}>
                          Rate: {proposalData.currency} {proposalData.suggestedRate} · Est. {proposalData.estimatedDays} days
                        </span>
                        <button className="btn-circuit secondary" onClick={() => {
                          setApplyForm({ ...applyForm, coverLetter: proposalData.proposal, proposedRate: String(proposalData.suggestedRate), estimatedDays: String(proposalData.estimatedDays) });
                          setApplyModal(match.job as unknown as JobListing);
                        }}>
                          Apply with this Proposal →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      <AssistantPanel assistant="circuit" page="work" userId={user?.id} />
    </div>
    </>
  );
}
