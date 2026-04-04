import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import ContextBar from "../../components/ui/ContextBar";
import Tooltip from "../../components/ui/Tooltip";
import OmegaProfileAssignmentCard from "../../components/ui/OmegaProfileAssignmentCard";
import { useTrustScore } from "../../hooks/useTrustScore";
import { API_BASE } from "../../lib/api";
import { getAuthHeaders, useAuthStore } from "../auth/authStore";
import OMEGAMorningBriefing from "../intelligence/components/OMEGAMorningBriefing";
import AgenticLoopVisualiser from "./components/AgenticLoopVisualiser";
import OMEGABriefingCard from "./components/OMEGABriefingCard";
import ResumptionCards from "./components/ResumptionCards";
import ProgressRow from "./components/ProgressRow";
import EcosystemStatusBar from "./components/EcosystemStatusBar";
import PortfolioCard from "./components/PortfolioCard";
import { getOmegaProfileContext, getOmegaProfileEntryPath, type OmegaLayerKey } from "../onboarding/omegaProfileContext";

type LayerStatus = "live" | "building" | "coming";

interface LayerCard {
  key: OmegaLayerKey | "mobile";
  icon: string;
  label: string;
  path: string;
  status: LayerStatus;
  summary: string;
  highlight: string;
}

interface HomeNavItem {
  label: string;
  path: string;
}

interface HomeBriefingRecommendation {
  label: string;
  url: string;
  priority: "high" | "medium" | "low";
}

interface HomeBriefingResponse {
  briefing: string;
  recommendations: HomeBriefingRecommendation[];
  generatedAt: string;
  expiresAt: string;
  cached: boolean;
}

interface ResumptionCard {
  layer: "academy" | "community" | "market";
  title: string;
  sub: string;
  pct?: number;
  amount?: number;
  url: string;
  cta: string;
}

const LAYERS: LayerCard[] = [
  { key: "community", icon: "👥", label: "Community", path: "/community", status: "live", summary: "Share progress, build signal, and let NOVA map your strengths.", highlight: "Conversation, reputation, and discovery all start here." },
  { key: "academy", icon: "🎓", label: "Academy", path: "/academy", status: "live", summary: "Learn with SAGE, finish paths, and earn portable proof of skill.", highlight: "Certificates and streaks compound your trust over time." },
  { key: "market", icon: "🛒", label: "Market", path: "/market", status: "building", summary: "Sell products, test offers, and let ATLAS sharpen positioning.", highlight: "Monetization unlocks faster once your signal is established." },
  { key: "work", icon: "💼", label: "Work", path: "/work", status: "building", summary: "Turn skills into contracts with CIRCUIT-guided matching.", highlight: "Portfolio depth and trust score increase job-quality matches." },
  { key: "intelligence", icon: "🤖", label: "Intelligence", path: "/intelligence", status: "live", summary: "OMEGA, ARIA, and your supervisors coordinate what to do next.", highlight: "This is where daily guidance and cross-layer insights converge." },
  { key: "cloud", icon: "☁️", label: "Cloud", path: "/cloud", status: "building", summary: "Build integrations, keys, and automation around your workflow.", highlight: "Developer surfaces deepen as your ecosystem usage matures." },
  { key: "mobile", icon: "📱", label: "Mobile", path: "/home", status: "coming", summary: "Carry the ecosystem with you through reminders, alerts, and quick returns.", highlight: "Mobile continuity is being prepared as an always-on companion layer." },
];

const HOME_NAV: HomeNavItem[] = [
  { label: "Home", path: "/home" },
  { label: "Community", path: "/community" },
  { label: "Academy", path: "/academy" },
  { label: "Market", path: "/market" },
  { label: "AI", path: "/intelligence" },
];

function getGreeting(now: Date) {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function layerTone(status: LayerStatus) {
  if (status === "live") return "var(--green)";
  if (status === "building") return "var(--gold)";
  return "var(--ice)";
}

function layerLabel(status: LayerStatus) {
  if (status === "live") return "Live now";
  if (status === "building") return "In build";
  return "Coming next";
}

function formatBriefingDate(now: Date) {
  return now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function titleCase(value: string) {
  return value
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function trustTierLabelForScore(score: number) {
  if (score >= 90) return "Platinum";
  if (score >= 80) return "Gold";
  if (score >= 60) return "Silver";
  if (score >= 40) return "Bronze";
  return "Starter";
}

export default function UserHomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { score, tier, breakdown, isLoading: trustLoading } = useTrustScore();
  const [now, setNow] = useState(new Date());
  const [apiBriefing, setApiBriefing] = useState<HomeBriefingResponse | null>(null);
  const [resumptionCards, setResumptionCards] = useState<ResumptionCard[]>([]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const headers = getAuthHeaders();
    if (!headers.Authorization) return;

    let active = true;

    Promise.all([
      fetch(`${API_BASE}/omega/briefing`, { headers }).then((res) => (res.ok ? res.json() : null)),
      fetch(`${API_BASE}/omega/resumption`, { headers }).then((res) => (res.ok ? res.json() : null)),
    ])
      .then(([briefing, resumption]) => {
        if (!active) return;
        if (briefing) setApiBriefing(briefing);
        if (Array.isArray(resumption?.cards)) setResumptionCards(resumption.cards);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [user?.id]);

  const firstName = user?.name?.split(" ")[0] ?? "Winner";
  const profileContext = useMemo(() => getOmegaProfileContext(user?.onboardingProfileType), [user?.onboardingProfileType]);
  const resumePath = getOmegaProfileEntryPath(user?.onboardingProfileType, user?.onboardingPrimaryPath);
  const supervisor = user?.onboardingAssignedSupervisor ?? profileContext?.primarySupervisor ?? "OMEGA";
  const primaryLayer = profileContext?.primaryLayer ?? "core";
  const planLabel = (user?.onboardingSelectedPlan ?? "FREE").replaceAll("_", " ");

  const prioritizedLayers = useMemo(() => {
    const order = profileContext?.sidebarOrder ?? [];
    return [...LAYERS].sort((left, right) => {
      const leftIndex = order.indexOf(left.key as OmegaLayerKey);
      const rightIndex = order.indexOf(right.key as OmegaLayerKey);
      return (leftIndex === -1 ? 99 : leftIndex) - (rightIndex === -1 ? 99 : rightIndex);
    });
  }, [profileContext]);

  const profileCompletion = Math.min(
    96,
    28 + (user?.onboardingProfileType ? 18 : 0) + (user?.onboardingPrimaryPath ? 14 : 0) + (user?.onboardingAssignedSupervisor ? 14 : 0) + Math.round(score * 0.32),
  );
  const nextTrustMilestone = [40, 60, 80, 90].find((value) => value > score) ?? 100;
  const trustGap = Math.max(0, nextTrustMilestone - score);
  const certificates = Math.max(1, Math.round(breakdown.academy / 9));
  const milestones = Math.max(1, Math.round((breakdown.community + breakdown.work) / 6));
  const topMatchScore = Math.min(95, score + 18);
  const contractValue = 3200 + score * 5;
  const courseCompletionAverage = Math.min(96, Math.max(24, Math.round((breakdown.academy / 30) * 100 + 18)));
  const activeCourses = Math.max(1, Math.round(breakdown.academy / 9) + 1);
  const portfolioSkills = (user?.skills?.length ? user.skills : profileContext?.preActivatedFeatures ?? [])
    .map((item) => item.replace(/^Community feed \+ |Basic freelancer profile \+ |Browse products \+ |Free launch state across every layer|SAGE AI tutor \(20 queries\/month on Free\)|NOVA skill detection \(passive on Free\)|ATLAS product research \(3 queries\/month on Free\)|API access by request only on Free|@winners\/sdk docs access|Webhook catalogue preview|NEXUS AI chat unlocks on Pro/g, "").trim())
    .filter(Boolean)
    .slice(0, 5);
  const loopStages = [
    { id: "community", label: "Community", status: score >= 20 ? "done" : "current" },
    { id: "academy", label: "Academy", status: breakdown.academy >= 12 ? "done" : score >= 20 ? "current" : "future" },
    { id: "work", label: "Work", status: breakdown.work >= 14 ? "current" : "future" },
    { id: "market", label: "Market", status: breakdown.work >= 18 ? "future" : "future" },
    { id: "intelligence", label: "Intelligence", status: breakdown.community >= 10 ? "done" : "future" },
    { id: "scale", label: "Scale", status: "future" },
  ] as const;
  const currentLoopIndex = Math.min(5, Math.max(0, Math.round((breakdown.community + breakdown.academy + breakdown.work) / 18)));
  const loopStageNumber = Math.min(6, Math.max(1, currentLoopIndex + 1));
  const currentLoopLabel = ["Community", "Academy", "Work", "Market", "Intelligence", "Scale"][loopStageNumber - 1];
  const nextLoopStep = ["Build stronger signal", "Complete one more course", "Win first contract", "Activate Market revenue", "Turn insight into scale", "Compound the ecosystem loop"][Math.min(5, loopStageNumber)];
  const ecosystemStatuses = [
    { icon: "⬡", label: "Core Engine", state: "live", note: "Always active for your account", cta: "Open", path: "/home" },
    { icon: "👥", label: "Community", state: "live", note: "Profiles, posts, replies, and DMs", cta: "Open", path: "/community", ssoSourcePath: "/community" },
    { icon: "🎓", label: "Academy", state: "live", note: "Courses, certificates, and SAGE", cta: "Open", path: "/academy", ssoSourcePath: "/academy" },
    { icon: "🤖", label: "Intelligence", state: "live", note: "OMEGA, ARIA, and supervisor guidance", cta: "Open", path: "/intelligence" },
    { icon: "🛒", label: "Market", state: "preview", note: "Coming soon for your route", cta: "Preview", path: "/market" },
    { icon: "💼", label: "Work", state: score >= 70 ? "preview" : "locked", note: score >= 70 ? "Opening as your trust strengthens" : "Depends on your Academy + trust progress", cta: "Learn more", path: "/work" },
    { icon: "📱", label: "Mobile", state: "locked", note: "App download and continuity layer", cta: "Learn more", path: "/home" },
    { icon: "☁️", label: "Cloud", state: profileContext?.primaryLayer === "cloud" ? "preview" : "locked", note: profileContext?.primaryLayer === "cloud" ? "Developer APIs are warming up for you" : "Developer API and automation surfaces", cta: "Learn more", path: "/cloud" },
  ] as const;
  const portfolioHeadline = [
    user?.industry,
    profileContext?.profileType?.replace("The ", ""),
    user?.city ? `Based in ${user.city}` : user?.country ? `Based in ${user.country}` : null,
  ].filter(Boolean).join(" · ");
  const initials = (user?.name ?? "Winner").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const fallbackBriefingMessage = profileContext
    ? `You are building momentum on the ${profileContext.profileType} route. ${supervisor} has identified ${Math.max(3, Math.round(breakdown.work / 4) + 3)} promising opportunities connected to your current signal, and ${Math.max(1, Math.round(breakdown.academy / 8))} certificate milestone${certificates > 1 ? "s" : ""} is already strengthening your next handoff. Your strongest opening right now is inside ${profileContext.primaryLayer}, and ${trustGap === 0 ? "your trust tier is already in a strong position for the next unlock." : `one more focused push could move your Trust Score ${trustGap} points closer to the next tier.`}`
    : "OMEGA is watching your first meaningful signals across the ecosystem. A single completed action today will sharpen your route, your recommendations, and the layers that unlock next.";
  const fallbackBriefingRecommendations: HomeBriefingRecommendation[] = [
    {
      label: `Review ${supervisor}'s best match`,
      action: "View Match",
      path: profileContext?.primaryLayer === "work" ? "/work/jobs" : resumePath,
    },
    {
      label: profileContext?.primaryLayer === "academy" ? "Complete your next SAGE module" : "Continue your strongest learning path",
      action: "Continue Course",
      path: "/academy",
    },
    {
      label: `Act on the highest-priority opportunity before Friday`,
      action: "View Contract",
      path: profileContext?.primaryLayer === "work" ? "/work/contracts" : "/intelligence",
    },
  ].map((item, index) => ({
    label: item.label,
    url: item.path,
    priority: index === 0 ? "high" as const : index === 1 ? "medium" as const : "low" as const,
  }));
  const briefingMessage = apiBriefing?.briefing ?? fallbackBriefingMessage;
  const briefingRecommendations = apiBriefing?.recommendations?.length
    ? apiBriefing.recommendations
    : fallbackBriefingRecommendations;
  const quickActions = [
    { label: "Resume your route", note: resumePath, path: resumePath },
    { label: "Ask OMEGA", note: "Open Intelligence", path: "/intelligence" },
    { label: "Review notifications", note: "Alerts and approvals", path: "/notifications" },
    { label: "Tune your profile", note: "Account and preferences", path: "/settings/account" },
  ];

  return (
    <>
      <style>{`
        .omega-home{min-height:100vh;padding:40px 40px 100px;color:var(--text);background:radial-gradient(circle at top right,rgba(137,196,225,.08),transparent 30%),radial-gradient(circle at top left,rgba(201,168,76,.08),transparent 30%),var(--bg)}
        .omega-shell{max-width:1320px;margin:0 auto;display:grid;gap:32px}
        .omega-panel{background:var(--surface);border:1px solid var(--border);border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.12);overflow:hidden}
        .omega-topbar{position:sticky;top:0;z-index:100;display:flex;align-items:center;justify-content:space-between;gap:20px;padding:16px 24px;background:rgba(10,16,28,.9);backdrop-filter:blur(20px);border-bottom:1px solid var(--border)}
        .omega-brand,.omega-topnav,.omega-toptools,.omega-meta-row,.omega-actions,.omega-section-header,.omega-layer-top,.omega-ring-row{display:flex;gap:16px;align-items:center;flex-wrap:wrap}
        .omega-brand-mark{width:28px;height:28px;display:grid;place-items:center;border-radius:10px;background:linear-gradient(135deg,rgba(201,168,76,.22),rgba(137,196,225,.22));color:var(--gold);font-weight:800}
        .omega-brand-name{font-weight:800;letter-spacing:-.03em}
        .omega-topnav-btn,.omega-tool-btn,.omega-button,.omega-inline-link{font:inherit;cursor:pointer}
        .omega-topnav-btn,.omega-tool-btn{border:none;background:none;color:rgba(244,248,252,.74);padding:0}
        .omega-topnav-btn.active{color:var(--text);font-weight:700}
        .omega-tool-btn{width:38px;height:38px;border-radius:12px;background:rgba(190,220,241,.08);border:1px solid rgba(190,220,241,.14);display:grid;place-items:center}
        .omega-hero,.omega-quick-grid,.omega-status-grid,.omega-achievement-grid,.omega-progress-row,.omega-ecosystem-grid,.omega-portfolio-grid,.omega-loop-strip{display:grid;gap:20px}
        .omega-hero{grid-template-columns:minmax(0,1.5fr) minmax(280px,.65fr)}
        .omega-briefing-card,.omega-side,.omega-resume-card,.omega-achievement-card,.omega-showcase-card,.omega-stat-card,.omega-focus-card,.omega-quick-card{padding:20px}
        .omega-section,.omega-stack,.omega-stats-grid,.omega-showcase-grid,.omega-achievement-grid,.omega-trust-block,.omega-breakdown,.omega-briefing-card,.omega-side,.omega-portfolio-meta,.omega-portfolio-columns,.omega-loop-story{display:grid;gap:18px}
        .omega-status-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
        .omega-stats-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
        .omega-achievement-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
        .omega-progress-row{grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
        .omega-ecosystem-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
        .omega-portfolio-grid{grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:18px}
        .omega-loop-strip{grid-template-columns:repeat(6,minmax(0,1fr));gap:10px}
        .omega-showcase-grid{grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
        .omega-quick-grid{grid-template-columns:minmax(0,1.15fr) minmax(260px,.85fr)}
        .omega-kicker,.omega-micro,.omega-card-label,.omega-focus-label,.omega-layer-tag,.omega-briefing-badge,.omega-stat-chip,.omega-resume-path,.omega-briefing-date,.omega-rec-number{margin:0;font-family:"Space Mono",monospace;text-transform:uppercase}
        .omega-kicker{font-size:11px;color:var(--gold);letter-spacing:.14em}
        .omega-micro,.omega-card-label,.omega-focus-label{font-size:10px;color:rgba(220,232,242,.76);letter-spacing:.12em}
        .omega-headline,.omega-section-title,.omega-resume-title,.omega-stat-value,.omega-layer-title,.omega-focus-value{margin:0;letter-spacing:-.04em}
        .omega-headline{font-size:clamp(34px,5vw,56px);line-height:.96}
        .omega-section-title{font-size:clamp(24px,3vw,34px)}
        .omega-resume-title{font-size:28px;line-height:1.05}
        .omega-stat-value{font-size:28px;font-weight:800}
        .omega-layer-title{font-size:20px;line-height:1.15}
        .omega-focus-value{font-size:18px;font-weight:700;line-height:1.3}
        .omega-copy,.omega-section-copy,.omega-side-copy,.omega-card-copy,.omega-layer-copy,.omega-layer-highlight,.omega-focus-note,.omega-list,.omega-briefing-message{margin:0;color:rgba(232,240,247,.82);font-size:14px;line-height:1.75}
        .omega-briefing-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}
        .omega-briefing-title{display:flex;gap:12px;align-items:flex-start}
        .omega-omega-mark{width:42px;height:42px;display:grid;place-items:center;border-radius:14px;background:linear-gradient(135deg,rgba(45,212,160,.18),rgba(201,168,76,.18));font-size:22px}
        .omega-briefing-message{padding:18px 0;border-top:1px solid rgba(190,220,241,.12);border-bottom:1px solid rgba(190,220,241,.12);font-size:15px;color:var(--text);font-style:italic}
        .omega-recommend-box{padding:16px;border-radius:18px;background:rgba(190,220,241,.06);border:1px solid rgba(190,220,241,.12);display:grid;gap:12px}
        .omega-rec-row{display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center}
        .omega-rec-number{font-size:10px;color:var(--gold);letter-spacing:.12em}
        .omega-rec-copy{margin:0;font-size:13px;color:var(--text)}
        .omega-rec-btn{border:1px solid rgba(201,168,76,.22);background:rgba(201,168,76,.08);color:var(--gold);padding:9px 12px;border-radius:999px;font:inherit;font-weight:700;cursor:pointer}
        .omega-list{padding-left:18px}
        .omega-list li+li{margin-top:8px}
        .omega-section-header,.omega-layer-top{justify-content:space-between;align-items:flex-end}
        .omega-button{border:1px solid rgba(190,220,241,.18);border-radius:999px;padding:12px 18px;background:rgba(190,220,241,.07);color:var(--text);font-weight:700}
        .omega-button.primary{background:linear-gradient(135deg,rgba(201,168,76,.92),rgba(237,206,112,.86));color:#10151d;border-color:rgba(201,168,76,.55)}
        .omega-briefing-badge,.omega-stat-chip,.omega-resume-path,.omega-layer-tag{display:inline-flex;width:fit-content;padding:6px 10px;border-radius:999px;letter-spacing:.08em}
        .omega-briefing-badge{background:rgba(45,212,160,.1);border:1px solid rgba(45,212,160,.18);color:var(--green)}
        .omega-stat-chip{background:rgba(137,196,225,.1);border:1px solid rgba(137,196,225,.18);color:var(--ice)}
        .omega-resume-path{background:rgba(201,168,76,.08);border:1px solid rgba(201,168,76,.22);color:var(--gold)}
        .omega-focus-card,.omega-stat-card,.omega-achievement-card,.omega-showcase-card,.omega-quick-card{background:rgba(190,220,241,.06);border:1px solid rgba(190,220,241,.12);border-radius:18px}
        .omega-breakdown-row{display:grid;grid-template-columns:90px 1fr auto;gap:10px;align-items:center;font-size:12px;color:rgba(220,232,242,.76)}
        .omega-breakdown-bar{height:8px;border-radius:999px;background:rgba(190,220,241,.08);overflow:hidden}
        .omega-breakdown-fill{height:100%;border-radius:inherit;background:linear-gradient(90deg,rgba(201,168,76,.88),rgba(137,196,225,.88))}
        .omega-inline-link{background:none;border:none;color:var(--gold);padding:0;font-weight:700}
        .omega-mini-track{height:10px;border-radius:999px;background:rgba(190,220,241,.08);overflow:hidden}
        .omega-mini-fill{height:100%;border-radius:inherit;background:linear-gradient(90deg,rgba(45,212,160,.92),rgba(137,196,225,.88))}
        .omega-mini-fill.gold{background:linear-gradient(90deg,rgba(201,168,76,.96),rgba(255,227,136,.9))}
        .omega-mini-fill.purple{background:linear-gradient(90deg,rgba(155,111,255,.92),rgba(137,196,225,.84))}
        .omega-progress-copy{display:grid;gap:8px}
        .omega-ecosystem-card{padding:18px;border-radius:18px;background:rgba(190,220,241,.06);border:1px solid rgba(190,220,241,.12);display:grid;gap:10px}
        .omega-ecosystem-top{display:flex;justify-content:space-between;gap:10px;align-items:center}
        .omega-state-badge{display:inline-flex;align-items:center;gap:6px;font-family:"Space Mono",monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase}
        .omega-state-badge.live{color:var(--green)}
        .omega-state-badge.preview{color:var(--gold)}
        .omega-state-badge.locked{color:var(--text-dim)}
        .omega-portfolio-hero{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap}
        .omega-avatar{width:72px;height:72px;border-radius:24px;display:grid;place-items:center;background:linear-gradient(135deg,rgba(201,168,76,.24),rgba(137,196,225,.24));border:1px solid rgba(190,220,241,.14);font-size:24px;font-weight:800;color:var(--text)}
        .omega-portfolio-head{display:flex;gap:16px;align-items:center;flex-wrap:wrap}
        .omega-portfolio-title{margin:0;font-size:32px;letter-spacing:-.05em}
        .omega-portfolio-columns{grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
        .omega-pill-row{display:flex;gap:8px;flex-wrap:wrap}
        .omega-skill-pill{padding:6px 10px;border-radius:999px;background:rgba(137,196,225,.1);border:1px solid rgba(137,196,225,.18);font-size:12px;color:var(--ice)}
        .omega-loop-step{padding:14px 10px;border-radius:16px;border:1px solid rgba(190,220,241,.12);background:rgba(190,220,241,.06);text-align:center;display:grid;gap:6px}
        .omega-loop-step.current{border-color:rgba(201,168,76,.3);background:rgba(201,168,76,.07)}
        .omega-loop-step.done{border-color:rgba(45,212,160,.26);background:rgba(45,212,160,.06)}
        .omega-loop-icon{font-size:20px}
        .omega-loop-label{font-family:"Space Mono",monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:rgba(220,232,242,.72)}
        .omega-loop-status{font-size:12px;color:var(--text)}
        @media (max-width:1120px){.omega-hero,.omega-quick-grid,.omega-status-grid,.omega-achievement-grid,.omega-showcase-grid,.omega-stats-grid,.omega-progress-row,.omega-ecosystem-grid,.omega-portfolio-grid,.omega-portfolio-columns{grid-template-columns:1fr}}
        @media (max-width:720px){.omega-home{padding:18px 16px 72px}.omega-headline{font-size:34px}.omega-topbar{top:8px;padding:12px 14px}.omega-topnav{display:none}.omega-rec-row{grid-template-columns:1fr}}
      `}</style>
      <div className="omega-home">
        <div className="omega-shell">
          <header className="omega-topbar">
            <div className="omega-brand">
              <div className="omega-brand-mark">⬡</div>
              <div className="omega-brand-name">Winners</div>
            </div>
            <nav className="omega-topnav" aria-label="Home navigation">
              {HOME_NAV.map((item) => (
                <button
                  key={item.path}
                  className={`omega-topnav-btn${item.path === "/home" ? " active" : ""}`}
                  onClick={() => navigate(item.path)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <div className="omega-toptools">
              <button className="omega-tool-btn" onClick={() => navigate("/notifications")} aria-label="Notifications">🔔</button>
              <button className="omega-tool-btn" onClick={() => navigate("/settings/account")} aria-label="Profile">👤</button>
            </div>
          </header>

          <ContextBar activeLayer="core" />
          
          {score < 15 && (
            <section
              className="omega-panel"
              style={{
                padding: "24px",
                marginBottom: "24px",
                border: "1px solid rgba(201,168,76,0.42)",
                background:
                  "linear-gradient(135deg, rgba(201,168,76,0.11), rgba(137,196,225,0.08))",
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "16px",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ fontSize: "32px" }}>✨</div>
                <div>
                  <h3
                    style={{ margin: 0, fontSize: "18px", color: "var(--gold)" }}
                  >
                    Welcome to your Sovereign Journey
                  </h3>
                  <p
                    style={{
                      margin: "4px 0 0",
                      fontSize: "14px",
                      color: "rgba(242,247,252,0.82)",
                      maxWidth: "800px",
                      lineHeight: 1.7,
                    }}
                  >
                    Winners Ecosystem is a Digital OS that grows with you. Post in <strong>Community</strong> to build signal, learn in <strong>Academy</strong> to earn proof, and <strong>OMEGA</strong> will orchestrate your commercial unlocks.
                  </p>
                </div>
                <button
                  className="omega-button primary"
                  style={{ marginLeft: "auto" }}
                  onClick={() => navigate("/onboarding")}
                >
                  View Roadmap
                </button>
              </div>
            </section>
          )}

          <section className="omega-hero">
            <OMEGABriefingCard
              greeting={`OMEGA · ${getGreeting(now)}, ${firstName}.`}
              title="Personal briefing for your next move."
              dateLabel={formatBriefingDate(now)}
              message={briefingMessage}
              recommendations={briefingRecommendations}
              onNavigate={navigate}
            />

            <aside className="omega-panel omega-side">
              <div className="omega-briefing-badge">Quick actions</div>
              <p className="omega-side-copy">
                Jump straight into the action OMEGA considers highest leverage right now.
              </p>
              {quickActions.map((item) => (
                <div className="omega-quick-card" key={item.label}>
                  <p className="omega-card-label">{item.label}</p>
                  <p className="omega-focus-value">{item.note}</p>
                  <button className="omega-inline-link" onClick={() => navigate(item.path)}>Open</button>
                </div>
              ))}
            </aside>
          </section>

          <section className="omega-stack">
            <div className="omega-section">
              <div className="omega-section-header">
                <div>
                  <h2 className="omega-section-title">
                    <Tooltip content="Smart resumption keeps your place, highlights the fastest return path, and shows the signals OMEGA is tracking before your next unlock.">
                      Where You Left Off
                    </Tooltip>
                  </h2>
                  <p className="omega-section-copy">
                    OMEGA tracks your signal across all layers to ensure you never lose momentum.
                  </p>
                </div>
              </div>

              <ResumptionCards
                summaryPoints={[
                  `Trust score is ${score}. ${trustGap === 0 ? "You are at the top visible tier." : `${trustGap} more points reaches the next unlock threshold.`}`,
                  `${profileContext?.primarySupervisor ?? "OMEGA"} is prioritizing ${profileContext?.primaryLayer ?? "core"} as your strongest next-signal layer.`,
                  profileContext?.secondarySupervisor
                    ? `${profileContext.secondarySupervisor} is ready for the next cross-layer handoff once momentum builds.`
                    : "Your route is being kept intentionally focused so the first wins are easier to secure.",
                ]}
                resumePath={resumePath}
                resumeTitle={`Return to ${profileContext?.primaryLayer ?? "your next step"} with one click.`}
                resumeCopy={profileContext?.firstAction ?? "OMEGA recommends one high-signal action today so the route becomes more accurate and more valuable."}
                cards={resumptionCards.length ? resumptionCards : [
                  { layer: "academy", title: "Resume your current Academy track", sub: "Pick up from your latest lesson", url: resumePath, cta: "Continue", pct: profileCompletion },
                  { layer: "community", title: "Review your latest interactions", sub: "Community is waiting for your reply", url: "/community", cta: "View Replies" },
                  { layer: "market", title: "Saved opportunities in Market", sub: "Return to your cart and next purchase", url: "/market/cart", cta: "Checkout" },
                ]}
                onNavigate={navigate}
              />

              <OmegaProfileAssignmentCard layer={primaryLayer} />
            </div>

            <div className="omega-section">
              <div className="omega-section-header">
                <div>
                  <h2 className="omega-section-title">
                    <Tooltip content="Your Progress Row tracks your trust level and learning milestones. As these grow, new ecosystem layers will unlock.">
                      Progress Row
                    </Tooltip>
                  </h2>
                  <p className="omega-section-copy">
                    The core metrics that govern your route and unlocks.
                  </p>
                </div>
              </div>

              <ProgressRow
                loopStageNumber={loopStageNumber}
                nextLoopStep={nextLoopStep}
                score={score}
                trustTierLabel={titleCase(tier)}
                trustGapLabel={trustGap === 0 ? "Top visible tier reached." : `+${trustGap} to ${trustTierLabelForScore(nextTrustMilestone)}`}
                certificates={certificates}
                activeCourses={activeCourses}
                courseCompletionAverage={courseCompletionAverage}
                onNavigate={navigate}
              />
            </div>

            <div className="omega-section">
              <div className="omega-section-header">
                <div>
                  <h2 className="omega-section-title">Your Ecosystem</h2>
                  <p className="omega-section-copy">
                    What is already live for you, what is opening next, and which surfaces still
                    depend on trust, plan, or profile progress.
                  </p>
                </div>
              </div>

              <EcosystemStatusBar items={ecosystemStatuses} onNavigate={navigate} />
            </div>

            <div className="omega-section">
              <div className="omega-section-header">
                <div>
                  <h2 className="omega-section-title">Your Ecosystem Portfolio</h2>
                  <p className="omega-section-copy">
                    Your public Winners profile in one card: trust, learning, verified skills,
                    work proof, and community signal.
                  </p>
                </div>
              </div>

              <PortfolioCard
                initials={initials}
                name={user?.name ?? "Winner"}
                planLabel={planLabel}
                score={score}
                trustTierLabel={titleCase(tier)}
                headline={portfolioHeadline || "Ecosystem member building signal across Winners."}
                skills={portfolioSkills.length ? portfolioSkills : ["React", "TypeScript", "Node.js"]}
                certificates={certificates}
                earned={Math.round(contractValue * 1.5)}
                contractsCompleted={Math.max(1, Math.round(breakdown.work / 5))}
                followers={Math.max(47, breakdown.community * 11)}
                posts={Math.max(12, breakdown.community * 4)}
                endorsements={Math.max(8, breakdown.community * 2)}
                onNavigate={navigate}
              />
            </div>

            <div className="omega-section">
              <div className="omega-section-header">
                <div>
                  <h2 className="omega-section-title">Agentic Loop Visualiser</h2>
                  <p className="omega-section-copy">
                    A visual explanation of your current place in the ecosystem journey and what
                    OMEGA expects to happen next.
                  </p>
                </div>
              </div>

              <div className="omega-achievement-grid">
                <article className="omega-panel omega-achievement-card">
                  <p className="omega-card-label">Loop map</p>
                  <AgenticLoopVisualiser
                    currentStage={["community", "academy", "work", "market", "intelligence"][Math.min(loopStageNumber - 1, 4)]}
                    completedStages={loopStages.filter((stage) => stage.status === "done").map((stage) => stage.id)}
                    loopCount={milestones}
                    pendingAction={`You are here: Stage ${loopStageNumber} - ${currentLoopLabel} (${nextLoopStep})`}
                    size={260}
                  />
                </article>

                <article className="omega-panel omega-achievement-card">
                  <p className="omega-card-label">Journey states</p>
                  <div className="omega-loop-strip">
                    {loopStages.map((stage) => (
                      <div key={stage.id} className={`omega-loop-step ${stage.status === "done" ? "done" : stage.status === "current" ? "current" : ""}`}>
                        <div className="omega-loop-icon">
                          {stage.status === "done" ? "✅" : stage.status === "current" ? "🔄" : "⏳"}
                        </div>
                        <div className="omega-loop-label">{stage.label}</div>
                        <div className="omega-loop-status">{stage.status === "done" ? "Complete" : stage.status === "current" ? "You are here" : "Waiting"}</div>
                      </div>
                    ))}
                  </div>

                  <div className="omega-loop-story">
                    <p className="omega-focus-value">You are here: Stage {loopStageNumber} — {currentLoopLabel}</p>
                    <p className="omega-card-copy">
                      NOVA detected your signal, SAGE strengthened it with learning, and OMEGA is now pushing toward the next commercial unlock.
                    </p>
                    <p className="omega-card-copy">
                      Next: {nextLoopStep} → trust growth → richer recommendations → broader ecosystem access.
                    </p>
                    <button className="omega-inline-link" onClick={() => navigate("/intelligence")}>Open OMEGA guidance →</button>
                  </div>
                </article>
              </div>
            </div>

            <div className="omega-section">
              <div className="omega-section-header">
                <div>
                  <h2 className="omega-section-title">Full OMEGA Briefing</h2>
                  <p className="omega-section-copy">
                    The detailed autonomous report still lives here when you want the deeper overnight context.
                  </p>
                </div>
              </div>
              <OMEGAMorningBriefing />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
