// src/features/work/JobDetailPage.tsx
// 6CIRCUIT Proposal Generator — SSE Live Streaming Job Detail Page

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../features/auth/authStore";
import AssistantPanel from "../../components/ui/AssistantPanel";
import "./JobDetailPage.css";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api/v1";

interface JobDetail {
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
  circuitScore?: number | null;
  circuitHeadline?: string | null;
  circuitStrengths?: string[];
  circuitGaps?: string[];
  suggestedRate?: number | null;
  estimatedDays?: number | null;
}

interface ProposalData {
  proposal: string;
  suggestedRate: number;
  currency: string;
  estimatedDays: number;
}

interface CircuitStage {
  id: number;
  label: string;
  icon: string;
  status: "pending" | "active" | "done";
}

const CIRCUIT_STAGES: Omit<CircuitStage, "status">[] = [
  { id: 1, label: "Analyze",    icon: "🔍" },
  { id: 2, label: "Hook",       icon: "🎯" },
  { id: 3, label: "Evidence",   icon: "📋" },
  { id: 4, label: "Plan",       icon: "🗺️" },
  { id: 5, label: "Pricing",    icon: "💰" },
  { id: 6, label: "Close",      icon: "🚀" },
];

const LEVEL_LABELS: Record<string, string> = {
  entry:  "Entry Level",
  mid:    "Mid Level",
  senior: "Senior",
  expert: "Expert",
};

function budgetDisplay(min: number | null, max: number | null, currency: string, jobType: string) {
  const unit = jobType === "hourly" ? "/hr" : "";
  if (min && max) return `${currency} ${min.toLocaleString()}–${max.toLocaleString()}${unit}`;
  if (min)        return `${currency} ${min.toLocaleString()}+${unit}`;
  if (max)        return `Up to ${currency} ${max.toLocaleString()}${unit}`;
  return "Budget open";
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export default function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user, token } = useAuthStore();

  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Proposal state
  const [proposalTone, setProposalTone] = useState("professional");
  const [proposalLoading, setProposalLoading] = useState(false);
  const [proposalData, setProposalData] = useState<ProposalData | null>(null);
  const [proposalError, setProposalError] = useState("");
  const [stages, setStages] = useState<CircuitStage[]>(
    CIRCUIT_STAGES.map((s) => ({ ...s, status: "pending" as const })),
  );
  const [liveText, setLiveText] = useState("");
  const streamAbortRef = useRef<AbortController | null>(null);

  // Apply state
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyForm, setApplyForm] = useState({ coverLetter: "", proposedRate: "", estimatedDays: "" });
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState(false);

  const headers = useCallback((): Record<string, string> => {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  // Fetch job detail
  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`${API_BASE}/work/jobs/${jobId}`, { headers: headers() });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message || "Job not found");
        }
        const data = await res.json();
        if (!cancelled) {
          setJob(data);
          setApplyForm({
            coverLetter: "",
            proposedRate: data.suggestedRate ? String(data.suggestedRate) : "",
            estimatedDays: data.estimatedDays ? String(data.estimatedDays) : "",
          });
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load job");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [jobId, headers]);

  // Advance CIRCUIT stages based on text length milestones
  const advanceStages = useCallback((textLen: number) => {
    setStages((prev) => prev.map((s) => {
      if (textLen === 0) return { ...s, status: "pending" as const };
      // Stage activation thresholds (approximate word counts)
      const thresholds = [0, 30, 80, 140, 200, 250];
      const idx = s.id - 1;
      if (textLen > thresholds[idx] + 120) return { ...s, status: "done" as const };
      if (textLen > thresholds[idx]) return { ...s, status: "active" as const };
      return s;
    }));
  }, []);

  // 6CIRCUIT SSE Proposal Generator
  const generateProposal = useCallback(async () => {
    if (!jobId) return;

    // Abort any in-flight stream
    streamAbortRef.current?.abort();
    const controller = new AbortController();
    streamAbortRef.current = controller;

    setProposalLoading(true);
    setProposalData({ proposal: "", suggestedRate: 0, currency: "USD", estimatedDays: 7 });
    setProposalError("");
    setLiveText("");
    setStages(CIRCUIT_STAGES.map((s) => ({ ...s, status: "pending" as const })));

    try {
      const res = await fetch(`${API_BASE}/work/circuit/proposal/${jobId}`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          Accept: "text/event-stream",
          ...headers(),
        },
        body: JSON.stringify({ tone: proposalTone }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Proposal generation failed");
      }

      // Activate first stage immediately
      setStages((prev) => prev.map((s) => (s.id === 1 ? { ...s, status: "active" } : s)));

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          const line = event.split("\n").find((entry) => entry.startsWith("data: "));
          if (!line) continue;

          const payload = JSON.parse(line.slice(6)) as {
            token?: string;
            meta?: { suggestedRate: number; currency: string; estimatedDays: number };
            proposal?: string;
            done?: boolean;
            error?: string;
            suggestedRate?: number;
            currency?: string;
            estimatedDays?: number;
          };

          if (payload.error) throw new Error(payload.error);

          if (payload.meta) {
            setProposalData((current) => ({
              proposal: current?.proposal ?? "",
              suggestedRate: payload.meta?.suggestedRate ?? current?.suggestedRate ?? 0,
              currency: payload.meta?.currency ?? current?.currency ?? "USD",
              estimatedDays: payload.meta?.estimatedDays ?? current?.estimatedDays ?? 7,
            }));
          }

          if (payload.token) {
            setProposalData((current) => {
              const updated = `${current?.proposal ?? ""}${payload.token ?? ""}`;
              advanceStages(updated.length);
              return {
                proposal: updated,
                suggestedRate: current?.suggestedRate ?? 0,
                currency: current?.currency ?? "USD",
                estimatedDays: current?.estimatedDays ?? 7,
              };
            });
            setLiveText((prev) => prev + payload.token);
          }

          if (payload.done) {
            setProposalData((current) => ({
              proposal: payload.proposal ?? current?.proposal ?? "",
              suggestedRate: payload.suggestedRate ?? current?.suggestedRate ?? 0,
              currency: payload.currency ?? current?.currency ?? "USD",
              estimatedDays: payload.estimatedDays ?? current?.estimatedDays ?? 7,
            }));
            setStages((prev) => prev.map((s) => ({ ...s, status: "done" as const })));
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setProposalError(err instanceof Error ? err.message : "Proposal generation failed");
        setProposalData(null);
      }
    } finally {
      setProposalLoading(false);
      streamAbortRef.current = null;
    }
  }, [jobId, headers, proposalTone, advanceStages]);

  // Cleanup on unmount
  useEffect(() => () => { streamAbortRef.current?.abort(); }, []);

  // Apply handler
  const handleApply = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId) return;
    setApplying(true);
    setApplyError("");
    try {
      const res = await fetch(`${API_BASE}/work/jobs/${jobId}/apply`, {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({
          coverLetter: applyForm.coverLetter,
          proposedRate: Number(applyForm.proposedRate) || undefined,
          estimatedDays: Number(applyForm.estimatedDays) || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Application failed");
      }
      setApplySuccess(true);
      if (job) setJob({ ...job, myApplication: { id: "new", status: "pending", createdAt: new Date().toISOString() } });
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : "Application failed");
    } finally {
      setApplying(false);
    }
  }, [jobId, headers, applyForm, job]);

  // ── Render ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="job-detail-page">
        <div className="job-detail-container">
          <div className="jd-skeleton">
            <div className="skel-line" style={{ width: "40%", height: 24, marginBottom: 16 }} />
            <div className="skel-line" style={{ width: "70%" }} />
            <div className="skel-line" style={{ width: "90%" }} />
            <div className="skel-line" style={{ width: "60%" }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="job-detail-page">
        <div className="job-detail-container">
          <div className="jd-error-card">
            <h2>Job unavailable</h2>
            <p>{error || "This role could not be found."}</p>
            <Link to="/work" className="jd-back-link">← Back to Work</Link>
          </div>
        </div>
      </div>
    );
  }

  const scoreColor = (job.circuitScore ?? 0) >= 80 ? "var(--green)" : (job.circuitScore ?? 0) >= 60 ? "var(--gold)" : "var(--ice)";
  const r = 26;
  const circ = 2 * Math.PI * r;
  const dash = ((job.circuitScore ?? 0) / 100) * circ;

  return (
    <div className="job-detail-page">
      <div className="job-detail-container">
        {/* Breadcrumb */}
        <div className="jd-breadcrumb">
          <Link to="/work" className="jd-back-link">← Work</Link>
          <span className="jd-breadcrumb-sep">/</span>
          <Link to="/work/jobs" className="jd-back-link">Jobs</Link>
          <span className="jd-breadcrumb-sep">/</span>
          <span className="jd-breadcrumb-current">{job.title}</span>
        </div>

        {/* Header */}
        <div className="jd-header-card">
          <div className="jd-header-top">
            <div className="jd-header-info">
              <div className="jd-badges">
                {job.isFeatured && <span className="jd-badge featured">Featured</span>}
                <span className="jd-badge type">{job.jobType}</span>
                <span className="jd-badge level">{LEVEL_LABELS[job.experienceLevel] || job.experienceLevel}</span>
                {job.myApplication && <span className="jd-badge applied">Applied</span>}
              </div>
              <h1 className="jd-title">{job.title}</h1>
              <p className="jd-client">by {job.client.name}</p>
            </div>
            {job.circuitScore != null && (
              <div className="jd-score-ring-wrap">
                <svg className="jd-score-ring" viewBox="0 0 60 60">
                  <circle cx="30" cy="30" r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
                  <circle cx="30" cy="30" r={r} fill="none" stroke={scoreColor} strokeWidth="4"
                    strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
                    transform="rotate(-90 30 30)" />
                  <text x="30" y="34" textAnchor="middle" fontSize="13" fontWeight="700"
                    fill={scoreColor} fontFamily="'Space Mono',monospace">{job.circuitScore}</text>
                </svg>
                <span className="jd-score-label">CIRCUIT Match</span>
              </div>
            )}
          </div>

          <div className="jd-stats-row">
            <div className="jd-stat">
              <span className="jd-stat-label">Budget</span>
              <span className="jd-stat-value">{budgetDisplay(job.budgetMin, job.budgetMax, job.currency, job.jobType)}</span>
            </div>
            <div className="jd-stat">
              <span className="jd-stat-label">Duration</span>
              <span className="jd-stat-value">{job.duration || "Flexible"}</span>
            </div>
            <div className="jd-stat">
              <span className="jd-stat-label">Location</span>
              <span className="jd-stat-value">{job.location || "Remote"}</span>
            </div>
            <div className="jd-stat">
              <span className="jd-stat-label">Posted</span>
              <span className="jd-stat-value">{timeAgo(job.createdAt)}</span>
            </div>
            <div className="jd-stat">
              <span className="jd-stat-label">Applications</span>
              <span className="jd-stat-value">{job.applicationCount}</span>
            </div>
            <div className="jd-stat">
              <span className="jd-stat-label">Views</span>
              <span className="jd-stat-value">{job.viewCount}</span>
            </div>
          </div>
        </div>

        <div className="jd-two-col">
          {/* Left column — Job details */}
          <div className="jd-left">
            <div className="jd-section-card">
              <h2 className="jd-section-title">Description</h2>
              <p className="jd-description">{job.description}</p>
            </div>

            <div className="jd-section-card">
              <h2 className="jd-section-title">Required Skills</h2>
              <div className="jd-skills-row">
                {job.skills.map((skill) => (
                  <span key={skill} className="jd-skill-tag">{skill}</span>
                ))}
              </div>
            </div>

            {job.circuitHeadline && (
              <div className="jd-section-card circuit-accent">
                <h2 className="jd-section-title">🤖 CIRCUIT Analysis</h2>
                <p className="jd-circuit-headline">{job.circuitHeadline}</p>
                <div className="jd-circuit-signals">
                  {job.circuitStrengths?.length ? (
                    <div className="jd-signal-group">
                      <span className="jd-signal-label strengths">Strengths</span>
                      <div className="jd-signal-tags">
                        {job.circuitStrengths.map((s) => (
                          <span key={s} className="jd-signal-tag strength">✓ {s}</span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {job.circuitGaps?.length ? (
                    <div className="jd-signal-group">
                      <span className="jd-signal-label gaps">Gaps</span>
                      <div className="jd-signal-tags">
                        {job.circuitGaps.map((g) => (
                          <span key={g} className="jd-signal-tag gap">△ {g}</span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* Right column — 6CIRCUIT Proposal Generator */}
          <div className="jd-right">
            <div className="jd-proposal-card">
              <div className="jd-proposal-header">
                <h2 className="jd-section-title">6CIRCUIT Proposal Generator</h2>
                <p className="jd-proposal-subtitle">AI-powered proposal in 6 stages</p>
              </div>

              {/* Tone selector */}
              <div className="jd-tone-row">
                <span className="jd-tone-label">Tone:</span>
                {["professional", "confident", "warm"].map((t) => (
                  <button
                    key={t}
                    className={`jd-tone-btn ${proposalTone === t ? "active" : ""}`}
                    onClick={() => setProposalTone(t)}
                    disabled={proposalLoading}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* 6-Stage Pipeline */}
              <div className="jd-stages-pipeline">
                {stages.map((stage) => (
                  <div key={stage.id} className={`jd-stage ${stage.status}`}>
                    <span className="jd-stage-icon">{stage.icon}</span>
                    <span className="jd-stage-label">{stage.label}</span>
                    {stage.status === "active" && <span className="jd-stage-pulse" />}
                    {stage.status === "done" && <span className="jd-stage-check">✓</span>}
                  </div>
                ))}
              </div>

              {/* Generate button */}
              <button
                className="jd-generate-btn"
                onClick={generateProposal}
                disabled={proposalLoading}
              >
                {proposalLoading ? (
                  <span className="jd-generating">
                    <span className="jd-spinner" />
                    CIRCUIT is writing…
                  </span>
                ) : (
                  "✍ Generate Proposal"
                )}
              </button>

              {/* Live streaming text */}
              {proposalData && (
                <div className="jd-proposal-output">
                  <div className="jd-proposal-meta-label">
                    🤖 6CIRCUIT Proposal — {proposalTone} tone
                  </div>
                  <div className="jd-proposal-text">
                    {proposalData.proposal || (proposalLoading ? "CIRCUIT is drafting your proposal…" : "")}
                    {proposalLoading && <span className="jd-cursor">▊</span>}
                  </div>
                  {proposalData.suggestedRate > 0 && (
                    <div className="jd-proposal-meta">
                      Rate: {proposalData.currency} {proposalData.suggestedRate} · Est. {proposalData.estimatedDays} days
                    </div>
                  )}
                  <div className="jd-proposal-actions">
                    <button
                      className="jd-action-btn copy"
                      onClick={() => navigator.clipboard.writeText(proposalData.proposal)}
                      disabled={!proposalData.proposal}
                    >
                      Copy Proposal
                    </button>
                    <button
                      className="jd-action-btn apply"
                      onClick={() => {
                        setApplyForm({
                          coverLetter: proposalData.proposal,
                          proposedRate: String(proposalData.suggestedRate),
                          estimatedDays: String(proposalData.estimatedDays),
                        });
                        setShowApplyForm(true);
                      }}
                      disabled={proposalLoading}
                    >
                      Apply with this Proposal →
                    </button>
                  </div>
                </div>
              )}

              {proposalError && (
                <div className="jd-proposal-error">{proposalError}</div>
              )}
            </div>

            {/* Apply Section */}
            <div className="jd-apply-card">
              {applySuccess ? (
                <div className="jd-apply-success">
                  <span className="jd-apply-success-icon">✅</span>
                  <p>Application submitted! The client will review your proposal.</p>
                  <button className="jd-back-btn" onClick={() => setShowApplyForm(false)}>Close</button>
                </div>
              ) : showApplyForm || job.myApplication ? (
                <form onSubmit={handleApply} className="jd-apply-form">
                  <h3 className="jd-section-title">
                    {job.myApplication ? "Application Submitted" : "Apply Now"}
                  </h3>
                  {applyError && <div className="jd-apply-error">{applyError}</div>}
                  {!job.myApplication && (
                    <>
                      <div className="jd-form-group">
                        <label className="jd-form-label">Cover Letter *</label>
                        <textarea
                          className="jd-form-textarea"
                          required
                          rows={6}
                          placeholder="Why are you the best fit for this project?"
                          value={applyForm.coverLetter}
                          onChange={(e) => setApplyForm({ ...applyForm, coverLetter: e.target.value })}
                        />
                      </div>
                      <div className="jd-form-row">
                        <div className="jd-form-group">
                          <label className="jd-form-label">Proposed Rate ({job.currency})</label>
                          <input
                            className="jd-form-input"
                            type="number"
                            placeholder={job.jobType === "hourly" ? "Rate/hr" : "Total"}
                            value={applyForm.proposedRate}
                            onChange={(e) => setApplyForm({ ...applyForm, proposedRate: e.target.value })}
                          />
                        </div>
                        <div className="jd-form-group">
                          <label className="jd-form-label">Estimated Days</label>
                          <input
                            className="jd-form-input"
                            type="number"
                            placeholder="14"
                            value={applyForm.estimatedDays}
                            onChange={(e) => setApplyForm({ ...applyForm, estimatedDays: e.target.value })}
                          />
                        </div>
                      </div>
                      <button className="jd-submit-btn" type="submit" disabled={applying}>
                        {applying ? "Submitting…" : "Submit Application"}
                      </button>
                    </>
                  )}
                  {job.myApplication && (
                    <p className="jd-applied-note">
                      Applied {timeAgo(job.myApplication.createdAt)} · Status: {job.myApplication.status}
                    </p>
                  )}
                </form>
              ) : (
                <div className="jd-apply-cta">
                  <h3 className="jd-section-title">Ready to apply?</h3>
                  <p className="jd-apply-hint">Generate a CIRCUIT proposal first, or apply directly with your own cover letter.</p>
                  <button className="jd-apply-open-btn" onClick={() => setShowApplyForm(true)}>
                    Open Application Form
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <AssistantPanel assistant="circuit" page="work" userId={user?.id} />
      </div>
    </div>
  );
}
