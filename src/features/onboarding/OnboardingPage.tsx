import { useEffect, useRef, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../lib/api";
import { useAuthStore } from "../auth/authStore";
import { OMEGA_WELCOME_KEY, type OmegaLaunchWelcome } from "./omegaLaunchWelcome";
import { getOmegaProfileContext, getOmegaProfileEntryPath } from "./omegaProfileContext";
import { DEFAULT_ONBOARDING_PLAN, ONBOARDING_PLAN_SECTIONS, getOnboardingPlanPresentation } from "./onboardingPlanMatrix";

type MessageType = "input" | "selection" | "multiselect" | "final";
type Sender = "omega" | "user";
type Identity = "Creator" | "Freelancer" | "Entrepreneur" | "Learner" | "Vendor/Seller" | "Developer";
type ExperienceLevel =
  | "Just starting out - less than 1 year"
  | "Some experience - 1 to 3 years"
  | "Established - 3 to 7 years"
  | "Expert - 7+ years or professional-level";
type IncomeTarget =
  | "Extra income - an additional $200-$500/month"
  | "Side income - $500-$2,000/month"
  | "Full-time income - $2,000-$8,000/month"
  | "Scale income - $8,000-$25,000/month"
  | "Serious scale - $25,000+/month"
  | "Not focused on income right now";
type MarketFocus =
  | "Africa"
  | "Nigeria specifically"
  | "Kenya specifically"
  | "Ghana specifically"
  | "South Africa specifically"
  | "Tanzania specifically"
  | "Uganda specifically"
  | "West Africa broadly"
  | "East Africa broadly"
  | "UK - diaspora"
  | "USA - diaspora"
  | "Canada - diaspora"
  | "African + global markets"
  | "Global only";
type SkillOption =
  | "Design & Creative"
  | "Software Development"
  | "Marketing & Growth"
  | "Writing & Content"
  | "Video & Streaming"
  | "Music & Audio"
  | "Data & Analytics"
  | "Business & Strategy"
  | "E-commerce & Sales"
  | "Education & Teaching"
  | "Finance & Investing"
  | "Property & Real Estate"
  | "Health & Wellness"
  | "Food & Agriculture"
  | "Fashion & Beauty"
  | "Engineering"
  | "Tech Startup"
  | "Consulting";
type MainGoal = "Master a skill" | "Earn income" | "Sell offers" | "Grow an audience" | "Automate operations" | "Build with AI and APIs";
type CurrentStage = "Exploring" | "Building traction" | "Already earning" | "Scaling a team";
type FirstAction = "Learn fast" | "Find paid work" | "Launch an offer" | "Grow my community" | "Automate workflows" | "Build with APIs";
type TeamSize = "Solo" | "Small team" | "Organization";
type PlanId = "free" | "pro" | "enterprise";
type LayerName = "Academy" | "Work" | "Market" | "Community" | "Cloud" | "Intelligence";
type SupervisorName = "SAGE" | "CIRCUIT" | "ATLAS" | "NOVA" | "NEXUS" | "FORGE" | "OMEGA";
type Phase = "workspace" | "identity" | "experience" | "income" | "market" | "skills" | "team" | "classification" | "activation" | "done";
type ProfileType = "The Creator" | "The Freelancer" | "The Entrepreneur" | "The Learner" | "The Vendor" | "The Developer" | "The Marketer" | "The Explorer";
type ActivationMode = "plans" | "ceremony";
type ActivationIntent = "free" | "pro";

type Message = { id: string; sender: Sender; text: string; type?: MessageType; options?: string[] };
type Journey = {
  workspaceName: string;
  buildingFocus: string;
  buildingIntent: string[];
  goal: MainGoal | "";
  identity: Identity | "";
  experienceLevel: ExperienceLevel | "";
  incomeTarget: IncomeTarget | "";
  marketFocus: MarketFocus[];
  topSkills: string[];
  stage: CurrentStage | "";
  firstAction: FirstAction | "";
  teamSize: TeamSize | "";
  profileType: ProfileType | "";
  primaryLayer: LayerName;
  primaryPlatformLabel: string;
  secondaryPlatforms: LayerName[];
  secondaryPlatformLabels: string[];
  supervisor: SupervisorName;
  recommendedPlan: PlanId;
  selectedPlan: PlanId;
  reasoning: string[];
  welcomeMessage: string;
};

const IDENTITIES: Identity[] = ["Creator", "Freelancer", "Entrepreneur", "Learner", "Vendor/Seller", "Developer"];
const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  "Just starting out - less than 1 year",
  "Some experience - 1 to 3 years",
  "Established - 3 to 7 years",
  "Expert - 7+ years or professional-level",
];
const INCOME_TARGETS: IncomeTarget[] = [
  "Extra income - an additional $200-$500/month",
  "Side income - $500-$2,000/month",
  "Full-time income - $2,000-$8,000/month",
  "Scale income - $8,000-$25,000/month",
  "Serious scale - $25,000+/month",
  "Not focused on income right now",
];
const MARKET_OPTIONS: MarketFocus[] = [
  "Africa",
  "Nigeria specifically",
  "Kenya specifically",
  "Ghana specifically",
  "South Africa specifically",
  "Tanzania specifically",
  "Uganda specifically",
  "West Africa broadly",
  "East Africa broadly",
  "UK - diaspora",
  "USA - diaspora",
  "Canada - diaspora",
  "African + global markets",
  "Global only",
];
const SKILL_OPTIONS: SkillOption[] = [
  "Design & Creative",
  "Software Development",
  "Marketing & Growth",
  "Writing & Content",
  "Video & Streaming",
  "Music & Audio",
  "Data & Analytics",
  "Business & Strategy",
  "E-commerce & Sales",
  "Education & Teaching",
  "Finance & Investing",
  "Property & Real Estate",
  "Health & Wellness",
  "Food & Agriculture",
  "Fashion & Beauty",
  "Engineering",
  "Tech Startup",
  "Consulting",
];
const TEAM_SIZES: TeamSize[] = ["Solo", "Small team", "Organization"];
const ROUTES: Record<LayerName, string> = { Academy: "/academy", Work: "/work", Market: "/market", Community: "/community", Cloud: "/cloud", Intelligence: "/intelligence" };
const SUPERVISORS: Record<LayerName, SupervisorName> = { Academy: "SAGE", Work: "CIRCUIT", Market: "ATLAS", Community: "NOVA", Cloud: "NEXUS", Intelligence: "FORGE" };
const ROLE_CARDS: Array<{ role: Identity; icon: string; title: string; description: string }> = [
  { role: "Creator", icon: "🧑‍🏫", title: "Creator", description: "I create content, teach, or share ideas" },
  { role: "Freelancer", icon: "💼", title: "Freelancer", description: "I sell skills and services to clients" },
  { role: "Entrepreneur", icon: "🏢", title: "Entrepreneur", description: "I build a business or brand" },
  { role: "Learner", icon: "🎓", title: "Learner", description: "I want to learn skills and get certified" },
  { role: "Vendor/Seller", icon: "🛒", title: "Vendor/Seller", description: "I sell products, physical or digital" },
  { role: "Developer", icon: "👨‍💻", title: "Developer", description: "I build products or integrate APIs" },
];

const TEAM_CARDS: Array<{ value: TeamSize; icon: string; title: string; description: string }> = [
  { value: "Solo", icon: "ðŸ‘¤", title: "Solo", description: "Just me right now. I can invite people later." },
  { value: "Small team", icon: "ðŸ‘¥", title: "With a team", description: "2-10 people working together." },
  { value: "Organization", icon: "ðŸ¢", title: "Organisation", description: "A company, NGO, agency, or institution." },
];
const ACTIVATION_LAYERS = ["\u2b21", "\ud83e\uddd1\u200d\ud83e\udd1d\u200d\ud83e\uddd1", "\ud83c\udf93", "\ud83d\uded2", "\ud83e\udd16", "\ud83d\udcbc", "\ud83d\udcf1", "\u2601\ufe0f", "\ud83e\uddec"];

const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&family=Cormorant+Garamond:wght@300;400;600&display=swap');
.ob-root{min-height:100vh;padding:24px 16px 36px;background:radial-gradient(circle at top left,rgba(201,168,76,.12),transparent 28%),radial-gradient(circle at top right,rgba(121,170,255,.10),transparent 34%),linear-gradient(180deg,#070b14,#0c1321);color:var(--text);font-family:'Syne',sans-serif}
.ob-shell{width:min(860px,100%);min-height:calc(100vh - 60px);margin:0 auto;display:grid;align-items:center}
.ob-panel,.ob-chat{border:1px solid rgba(255,255,255,.07);border-radius:26px;background:linear-gradient(180deg,rgba(15,21,34,.98),rgba(8,12,21,.98));box-shadow:0 22px 80px rgba(0,0,0,.42)}
.ob-panel{padding:22px}
.ob-badge{display:inline-flex;align-items:center;gap:8px;padding:8px 12px;border-radius:999px;border:1px solid rgba(201,168,76,.2);background:rgba(201,168,76,.08);color:var(--gold);font:10px 'Space Mono',monospace;letter-spacing:.16em;text-transform:uppercase}
.ob-badge::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--gold);box-shadow:0 0 12px rgba(201,168,76,.7)}
.ob-title{margin:14px 0 8px;font:400 clamp(38px,5vw,54px)/.96 'Cormorant Garamond',serif}.ob-title em{font-style:normal;color:var(--gold)}
.ob-sub{margin:0;max-width:720px;font-size:14px;line-height:1.7;color:var(--text-dim)}
.ob-foundation{padding:52px 44px;text-align:center;display:grid;gap:18px}
.ob-foundation-k{font:10px 'Space Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--gold)}
.ob-foundation-title{margin:0;font:300 clamp(42px,6vw,52px)/1 'Cormorant Garamond',serif}
.ob-foundation-title em{font-style:italic;color:var(--gold)}
.ob-foundation-copy{margin:0 auto;max-width:620px;font-size:15px;line-height:1.8;color:var(--text-dim)}
.ob-foundation-box{width:min(100%,720px);margin:0 auto;padding:18px 20px;min-height:150px;border-radius:24px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);color:var(--text);font:15px/1.7 'Syne',sans-serif;resize:none;outline:none}
.ob-foundation-box::placeholder{color:var(--text-dim)}
.ob-foundation-box:focus{border-color:rgba(201,168,76,.34);box-shadow:0 0 0 3px rgba(201,168,76,.08)}
.ob-foundation-actions{display:flex;justify-content:center;gap:18px;flex-wrap:wrap;align-items:center}
.ob-skip{background:none;border:none;padding:0;color:var(--text-dim);font:12px 'Space Mono',monospace;text-decoration:underline dotted;cursor:pointer}
.ob-skip:hover{color:var(--gold)}
.ob-foundation-echo{width:min(100%,720px);margin:0 auto;padding:14px 16px;border-radius:18px;border:1px solid rgba(201,168,76,.18);background:rgba(201,168,76,.06);font-size:13px;line-height:1.7;color:var(--text)}
.ob-progress{margin-top:16px}.ob-progress-row{display:flex;justify-content:space-between;gap:12px;font:10px 'Space Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--text-dim);margin-bottom:8px}
.ob-progress-track{height:10px;border-radius:999px;background:rgba(255,255,255,.06);overflow:hidden}.ob-progress-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,var(--gold),#f1df8c);transition:width .2s ease}
.ob-signals{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.ob-signal{padding:14px;border-radius:18px;border:1px solid var(--border);background:rgba(255,255,255,.02)}
.ob-signal-k{font:9px 'Space Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim)}.ob-signal-v{margin-top:8px;font-size:14px;font-weight:700;line-height:1.5}.ob-signal-v.active{color:var(--gold)}
.ob-chat{overflow:hidden;position:relative}.ob-chat::before{content:"";position:absolute;inset:0 0 auto 0;height:3px;background:linear-gradient(90deg,var(--gold),#f1df8c,var(--ice))}
.ob-messages{min-height:560px;max-height:calc(100vh - 310px);overflow:auto;padding:24px 22px 16px;display:flex;flex-direction:column;gap:16px}
.ob-message{max-width:88%;display:grid;gap:10px}.ob-message.omega{align-self:flex-start}.ob-message.user{align-self:flex-end}.ob-row{display:flex;align-items:flex-end;gap:10px}.ob-message.user .ob-row{flex-direction:row-reverse}
.ob-avatar{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,var(--gold),#f4e098);color:#10141d;font:700 11px 'Space Mono',monospace;flex-shrink:0}.ob-message.user .ob-avatar{background:linear-gradient(135deg,#6b92dd,#a8c0ff);color:#fff}
.ob-bubble{padding:15px 17px;border-radius:20px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);font-size:14px;line-height:1.75}.ob-message.user .ob-bubble{background:linear-gradient(135deg,rgba(201,168,76,.16),rgba(107,146,221,.12))}
.ob-options,.ob-multi-meta,.ob-multi-actions{margin-left:42px}.ob-options{display:flex;flex-wrap:wrap;gap:10px}
.ob-option,.ob-btn{min-height:40px;padding:0 14px;border-radius:999px;cursor:pointer;font:11px 'Space Mono',monospace;letter-spacing:.06em}
.ob-option{border:1px solid var(--border);background:rgba(255,255,255,.03);color:var(--text)}.ob-option.active,.ob-option:hover{border-color:rgba(201,168,76,.32);background:rgba(201,168,76,.1);color:var(--gold)}
.ob-role-grid{margin-left:42px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.ob-role-card{padding:16px;border-radius:18px;border:1px solid var(--border);background:rgba(255,255,255,.03);text-align:left;cursor:pointer;transition:all .16s ease;color:var(--text)}
.ob-role-card:hover{border-color:rgba(201,168,76,.28);background:rgba(201,168,76,.06)}
.ob-role-icon{font-size:22px;margin-bottom:10px}.ob-role-title{font-size:14px;font-weight:700;margin-bottom:8px}.ob-role-copy{font-size:12px;line-height:1.6;color:var(--text-dim)}
.ob-skill-input{margin-left:42px;display:flex;gap:10px;flex-wrap:wrap}
.ob-skill-input .ob-input{min-width:240px}
.ob-multi-meta,.ob-hint{font:10px 'Space Mono',monospace;line-height:1.7;color:var(--text-dim)}.ob-multi-actions{display:flex;gap:10px;flex-wrap:wrap}
.ob-summary{margin-top:14px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.ob-summary-item{padding:11px;border-radius:14px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.03)}
.ob-summary-k{display:block;font:9px 'Space Mono',monospace;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim)}.ob-summary-v{display:block;margin-top:6px;font-size:13px;font-weight:700}
.ob-reasoning{margin-top:14px;display:grid;gap:8px}.ob-reason{padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);font-size:12px;color:var(--text-dim)}
.ob-input-area{padding:18px 22px 22px;border-top:1px solid rgba(255,255,255,.06);display:grid;gap:12px;background:rgba(5,9,16,.76)}.ob-input-row{display:flex;gap:10px}
.ob-input{flex:1;min-height:48px;padding:0 14px;border-radius:16px;border:1px solid var(--border);background:rgba(255,255,255,.03);color:var(--text);font:12px 'Space Mono',monospace;outline:none}.ob-input:focus{border-color:rgba(201,168,76,.34);box-shadow:0 0 0 3px rgba(201,168,76,.08)}
.ob-btn{border:1px solid rgba(201,168,76,.22);background:rgba(201,168,76,.14);color:var(--gold);text-transform:uppercase}.ob-btn.secondary{border-color:var(--border);background:rgba(255,255,255,.03);color:var(--text-dim)}.ob-btn:disabled,.ob-option:disabled{opacity:.48;cursor:not-allowed}
.ob-classifying{display:grid;justify-items:center;gap:14px;padding:14px 10px 2px;text-align:center}
.ob-gold-pulse{width:88px;height:88px;border-radius:50%;position:relative;background:radial-gradient(circle,rgba(201,168,76,.3),rgba(201,168,76,.08) 58%,transparent 60%)}
.ob-gold-pulse::before,.ob-gold-pulse::after{content:"";position:absolute;inset:0;border-radius:50%;border:2px solid rgba(201,168,76,.48);animation:goldPulse 1.5s ease-out infinite}
.ob-gold-pulse::after{animation-delay:.22s}
.ob-classifying p{margin:0;max-width:460px;font-size:12px;line-height:1.7;color:var(--text-dim)}
.ob-activation{display:grid;gap:18px;padding:12px 6px 4px}
.ob-plan-shell{padding:24px;border-radius:26px;border:1px solid rgba(255,255,255,.07);background:linear-gradient(180deg,rgba(16,22,35,.98),rgba(8,12,21,.98));box-shadow:0 22px 80px rgba(0,0,0,.28)}
.ob-plan-k{font:10px 'Space Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--gold)}
.ob-plan-title{margin:10px 0 8px;font:300 clamp(30px,4vw,42px)/1 'Cormorant Garamond',serif;color:var(--text)}
.ob-plan-sub{margin:0;font-size:14px;line-height:1.75;color:var(--text-dim);max-width:760px}
.ob-plan-banner{margin-top:22px;padding:18px 18px 16px;border-radius:22px;border:1px solid rgba(201,168,76,.18);background:radial-gradient(circle at top right,rgba(201,168,76,.12),transparent 34%),linear-gradient(135deg,rgba(18,29,44,.96),rgba(11,17,28,.94));display:grid;gap:14px}
.ob-plan-banner-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}
.ob-plan-banner-title{margin:0;font-size:20px;font-weight:800;letter-spacing:-.03em;color:var(--text)}
.ob-plan-banner-copy{margin:0;font-size:13px;line-height:1.8;color:var(--text-dim);max-width:760px}
.ob-plan-meta{display:flex;gap:8px;flex-wrap:wrap}
.ob-plan-chip{display:inline-flex;align-items:center;padding:6px 10px;border-radius:999px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);font:10px 'Space Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--text-dim)}
.ob-plan-chip.free{border-color:rgba(201,168,76,.26);background:rgba(201,168,76,.1);color:var(--gold)}
.ob-plan-chip.recommended{border-color:rgba(137,196,225,.24);background:rgba(137,196,225,.08);color:var(--ice)}
.ob-plan-presentation{margin-top:18px;display:grid;gap:12px}
.ob-plan-presentation-head{display:grid;gap:6px;padding:0 2px}
.ob-plan-presentation-k{font:10px 'Space Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--gold)}
.ob-plan-presentation-copy{margin:0;font-size:13px;line-height:1.75;color:var(--text-dim);max-width:760px}
.ob-plan-presentation-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.ob-plan-presentation-card{padding:18px;border-radius:22px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);display:grid;gap:12px}
.ob-plan-presentation-card.free{border-color:rgba(201,168,76,.18);background:linear-gradient(180deg,rgba(201,168,76,.08),rgba(255,255,255,.02))}
.ob-plan-presentation-card.pro{border-color:rgba(137,196,225,.18);background:linear-gradient(180deg,rgba(137,196,225,.08),rgba(255,255,255,.02))}
.ob-plan-presentation-title{display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap}
.ob-plan-presentation-title strong{font:10px 'Space Mono',monospace;letter-spacing:.16em;text-transform:uppercase}
.ob-plan-presentation-list{margin:0;padding:0;list-style:none;display:grid;gap:10px}
.ob-plan-presentation-item{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:flex-start;font-size:13px;line-height:1.7;color:var(--text)}
.ob-plan-presentation-item.muted{color:var(--text-dim)}
.ob-plan-presentation-mark{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;font:700 10px 'Space Mono',monospace;flex-shrink:0}
.ob-plan-presentation-mark.included{background:rgba(45,212,160,.14);border:1px solid rgba(45,212,160,.22);color:var(--green)}
.ob-plan-presentation-mark.locked{background:rgba(224,90,78,.12);border:1px solid rgba(224,90,78,.18);color:var(--red)}
.ob-plan-presentation-mark.upgrade{background:rgba(137,196,225,.12);border:1px solid rgba(137,196,225,.2);color:var(--ice)}
.ob-pro-pitch{margin-top:18px;padding:18px 18px 16px;border-radius:22px;border:1px solid rgba(255,255,255,.07);background:linear-gradient(180deg,rgba(255,255,255,.04),rgba(255,255,255,.02));display:grid;gap:12px}
.ob-pro-pitch-k{font:10px 'Space Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--gold)}
.ob-pro-pitch-copy{margin:0;font:11px/1.95 'Space Mono',monospace;color:var(--text-dim);white-space:pre-line}
.ob-onboarding-promise{margin-top:18px;padding:20px 18px;border-radius:22px;border:1px solid rgba(201,168,76,.16);background:radial-gradient(circle at top right,rgba(201,168,76,.08),transparent 34%),linear-gradient(180deg,rgba(255,255,255,.03),rgba(255,255,255,.015));display:grid;gap:10px}
.ob-onboarding-promise-k{font:10px 'Space Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:var(--gold)}
.ob-onboarding-promise-copy{margin:0;font-size:13px;line-height:1.8;color:var(--text)}
.ob-onboarding-promise-copy.dim{color:var(--text-dim)}
.ob-cta-row{display:flex;gap:12px;flex-wrap:wrap;align-items:center}
.ob-enter-btn.soft{border:none;background:transparent;color:var(--text-dim);box-shadow:none;padding:0 4px;min-height:auto;font:700 14px 'Syne',sans-serif;letter-spacing:0;text-transform:none}
.ob-enter-btn.soft:hover:not(:disabled){transform:none;color:var(--text)}
.ob-ceremony{padding:42px 24px;min-height:660px;display:grid;align-content:center;justify-items:center;gap:22px;text-align:center}
.ob-ceremony-ring{width:190px;height:190px;border-radius:50%;position:relative;display:grid;place-items:center}
.ob-ceremony-ring::before{content:"";position:absolute;inset:24px;border-radius:50%;border:2px solid rgba(201,168,76,.78);box-shadow:0 0 0 10px rgba(201,168,76,.08),0 0 32px rgba(201,168,76,.24);animation:ceremonyRing .6s ease-out forwards}
.ob-ceremony-ring::after{content:"";position:absolute;inset:0;border-radius:50%;background:radial-gradient(circle,rgba(201,168,76,.18),rgba(201,168,76,.04) 48%,transparent 70%);animation:ceremonyHalo .6s ease-out forwards}
.ob-ceremony-core{width:62px;height:62px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,rgba(201,168,76,.26),rgba(137,196,225,.16));border:1px solid rgba(201,168,76,.28);color:var(--gold);font-size:24px;box-shadow:0 0 24px rgba(201,168,76,.18)}
.ob-ceremony-dots{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;max-width:520px}
.ob-ceremony-dot{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);font-size:18px;opacity:0;transform:translateY(10px) scale(.72);animation:ceremonyDot .42s ease-out forwards;animation-delay:calc(var(--i) * 150ms + 220ms)}
.ob-ceremony-dot::after{content:"";position:absolute}
.ob-ceremony-title{margin:0;font:300 clamp(40px,5vw,52px)/1 'Cormorant Garamond',serif;color:var(--text)}
.ob-ceremony-title em{font-style:italic;color:var(--gold)}
.ob-ceremony-copy{display:grid;gap:8px;max-width:700px;font:11px/1.9 'Space Mono',monospace;color:var(--text-dim)}
.ob-ceremony-line{margin:0}
.ob-ceremony-chip{display:inline-flex;align-items:center;padding:7px 11px;border-radius:999px;border:1px solid rgba(137,196,225,.22);background:rgba(137,196,225,.08);font:10px 'Space Mono',monospace;letter-spacing:.08em;text-transform:uppercase;color:var(--ice)}
.ob-plan-sections{margin-top:18px;display:grid;gap:14px}
.ob-plan-section{border-radius:22px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03);overflow:hidden}
.ob-plan-section-head{padding:16px 18px 14px;border-bottom:1px solid rgba(255,255,255,.06);display:grid;gap:6px}
.ob-plan-section-title{margin:0;font:10px 'Space Mono',monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--gold)}
.ob-plan-section-sub{margin:0;font-size:12px;line-height:1.7;color:var(--text-dim)}
.ob-plan-table-wrap{overflow-x:auto}
.ob-plan-table{width:100%;border-collapse:collapse;min-width:760px}
.ob-plan-table th,.ob-plan-table td{padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.05);text-align:left;vertical-align:top}
.ob-plan-table thead th{font:10px 'Space Mono',monospace;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim);background:rgba(255,255,255,.02)}
.ob-plan-table thead th:first-child{min-width:220px}
.ob-plan-table tbody th{font-size:13px;font-weight:700;color:var(--text);background:rgba(255,255,255,.015)}
.ob-plan-table tbody td{font-size:13px;line-height:1.7;color:var(--text-dim)}
.ob-plan-table .tier-free{background:rgba(201,168,76,.06);color:var(--text)}
.ob-plan-tier{display:inline-flex;align-items:center;padding:5px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04)}
.ob-plan-tier.free{border-color:rgba(201,168,76,.24);background:rgba(201,168,76,.1);color:var(--gold)}
.ob-plan-tier.pro{border-color:rgba(137,196,225,.24);background:rgba(137,196,225,.08);color:var(--ice)}
.ob-plan-tier.enterprise{border-color:rgba(255,255,255,.12);background:rgba(255,255,255,.06);color:var(--text)}
.ob-plan-footer{margin-top:22px;display:flex;justify-content:space-between;gap:14px;align-items:center;flex-wrap:wrap}
.ob-plan-note{font-size:12px;line-height:1.7;color:var(--text-dim);max-width:540px}
.ob-enter-btn{min-height:48px;padding:0 18px;border-radius:999px;border:1px solid rgba(201,168,76,.22);background:linear-gradient(135deg,var(--gold),#f3df8e);color:#0f1420;font:700 11px 'Space Mono',monospace;letter-spacing:.12em;text-transform:uppercase;cursor:pointer;transition:transform .16s ease,opacity .16s ease}
.ob-enter-btn:hover:not(:disabled){transform:translateY(-1px)}
.ob-enter-btn:disabled{opacity:.6;cursor:not-allowed}
@keyframes goldPulse{from{opacity:.8;transform:scale(.84)}to{opacity:0;transform:scale(1.18)}}@keyframes ring{from{opacity:.76;transform:scale(.92)}to{opacity:0;transform:scale(1.16)}}@keyframes ceremonyRing{from{opacity:.1;transform:scale(.26)}to{opacity:1;transform:scale(1)}}@keyframes ceremonyHalo{from{opacity:0;transform:scale(.46)}to{opacity:1;transform:scale(1)}}@keyframes ceremonyDot{from{opacity:0;transform:translateY(10px) scale(.72)}to{opacity:1;transform:translateY(0) scale(1)}}
@media(max-width:820px){.ob-signals{grid-template-columns:repeat(2,minmax(0,1fr))}.ob-summary{grid-template-columns:1fr}.ob-role-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ob-plan-banner-top{align-items:stretch}.ob-plan-presentation-grid{grid-template-columns:1fr}}
@media(max-width:640px){.ob-signals{grid-template-columns:1fr}.ob-messages{padding:20px 16px 14px;max-height:none}.ob-message{max-width:100%}.ob-options,.ob-multi-meta,.ob-multi-actions,.ob-role-grid,.ob-skill-input{margin-left:0}.ob-input-row,.ob-cta-row{flex-direction:column}.ob-foundation{padding:38px 20px}.ob-foundation-box{min-height:190px}.ob-role-grid{grid-template-columns:1fr}.ob-plan-shell{padding:18px}.ob-plan-footer{align-items:stretch}.ob-enter-btn{width:100%}.ob-enter-btn.soft{width:100%;padding:12px 14px;border-radius:999px;background:rgba(255,255,255,.03)}}
`;

const id = () => Math.random().toString(36).slice(2, 10);
const firstName = (name?: string | null) => (name ?? "").trim().split(" ")[0] || "there";
const primaryLayer = (action: FirstAction): LayerName => action === "Learn fast" ? "Academy" : action === "Find paid work" ? "Work" : action === "Launch an offer" ? "Market" : action === "Grow my community" ? "Community" : action === "Automate workflows" ? "Intelligence" : "Cloud";
const list = (items: string[]) => items.length < 2 ? (items[0] ?? "none") : items.length === 2 ? `${items[0]} and ${items[1]}` : `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
const unique = (items: LayerName[]) => Array.from(new Set(items));
const isBeginnerExperience = (level: ExperienceLevel | "") => level === "Just starting out - less than 1 year";
const uniqueMarkets = (items: MarketFocus[]) => Array.from(new Set(items)).slice(0, 3);
const uniqueSkills = (items: string[]) => Array.from(new Set(items.map((item) => item.trim()).filter(Boolean))).slice(0, 5);
const AFRICAN_MARKETS: MarketFocus[] = ["Africa", "Nigeria specifically", "Kenya specifically", "Ghana specifically", "South Africa specifically", "Tanzania specifically", "Uganda specifically", "West Africa broadly", "East Africa broadly", "African + global markets"];
const PROFILE_PRIORITY: ProfileType[] = ["The Creator", "The Freelancer", "The Entrepreneur", "The Learner", "The Vendor", "The Developer", "The Marketer", "The Explorer"];
const PROFILE_BLUEPRINTS: Record<ProfileType, { primaryLayer: LayerName; primaryPlatformLabel: string; secondaryPlatforms: LayerName[]; secondaryPlatformLabels: string[]; goal: MainGoal; firstAction: FirstAction }> = {
  "The Creator": { primaryLayer: "Community", primaryPlatformLabel: "Community", secondaryPlatforms: ["Academy", "Market"], secondaryPlatformLabels: ["Academy", "Market (4C Stream)"], goal: "Grow an audience", firstAction: "Grow my community" },
  "The Freelancer": { primaryLayer: "Work", primaryPlatformLabel: "Work", secondaryPlatforms: ["Community", "Academy", "Market"], secondaryPlatformLabels: ["Community", "Academy", "Market (4C Stream)"], goal: "Earn income", firstAction: "Find paid work" },
  "The Entrepreneur": { primaryLayer: "Market", primaryPlatformLabel: "Market", secondaryPlatforms: ["Community", "Work", "Intelligence"], secondaryPlatformLabels: ["Community", "Work", "Intelligence"], goal: "Sell offers", firstAction: "Launch an offer" },
  "The Learner": { primaryLayer: "Academy", primaryPlatformLabel: "Academy", secondaryPlatforms: ["Community", "Work"], secondaryPlatformLabels: ["Community", "Work"], goal: "Master a skill", firstAction: "Learn fast" },
  "The Vendor": { primaryLayer: "Market", primaryPlatformLabel: "Market", secondaryPlatforms: ["Community", "Intelligence"], secondaryPlatformLabels: ["Community", "Intelligence"], goal: "Sell offers", firstAction: "Launch an offer" },
  "The Developer": { primaryLayer: "Cloud", primaryPlatformLabel: "Cloud", secondaryPlatforms: ["Intelligence", "Work"], secondaryPlatformLabels: ["Intelligence", "Work"], goal: "Build with AI and APIs", firstAction: "Build with APIs" },
  "The Marketer": { primaryLayer: "Market", primaryPlatformLabel: "Market (4B Hub)", secondaryPlatforms: ["Community", "Academy"], secondaryPlatformLabels: ["Community", "Academy"], goal: "Sell offers", firstAction: "Launch an offer" },
  "The Explorer": { primaryLayer: "Community", primaryPlatformLabel: "Community", secondaryPlatforms: ["Academy"], secondaryPlatformLabels: ["Academy"], goal: "Master a skill", firstAction: "Learn fast" },
};

function deriveMarketSignals(markets: MarketFocus[]) {
  const has = (value: MarketFocus) => markets.includes(value);
  const currencies = new Set<string>();
  const payments = new Set<string>();
  const languages = new Set<string>(["English"]);
  const seasonalSignals = new Set<string>();
  const communitySuggestions = new Set<string>();

  if (has("Nigeria specifically")) {
    currencies.add("NGN");
    payments.add("Flutterwave");
    payments.add("Paystack");
    payments.add("OPay");
    languages.add("Pidgin");
    seasonalSignals.add("Eid");
    seasonalSignals.add("year-end demand");
    communitySuggestions.add("Nigeria Builders");
  }
  if (has("Kenya specifically")) {
    currencies.add("KES");
    payments.add("M-Pesa (Safaricom)");
    payments.add("Flutterwave");
    languages.add("Swahili");
    seasonalSignals.add("KCSE season");
    seasonalSignals.add("year-end demand");
    communitySuggestions.add("Nairobi Builders");
  }
  if (has("Ghana specifically")) {
    currencies.add("GHS");
    payments.add("MTN MoMo");
    payments.add("Flutterwave");
    seasonalSignals.add("WASSCE season");
    seasonalSignals.add("Detty December");
    communitySuggestions.add("Accra Builders");
  }
  if (has("South Africa specifically")) {
    currencies.add("ZAR");
    payments.add("Ozow");
    payments.add("Flutterwave");
    payments.add("Stripe");
    seasonalSignals.add("year-end demand");
    communitySuggestions.add("Johannesburg Operators");
  }
  if (has("Tanzania specifically")) {
    currencies.add("TZS");
    payments.add("Flutterwave");
    languages.add("Swahili");
    communitySuggestions.add("Dar Builders");
  }
  if (has("Uganda specifically")) {
    currencies.add("UGX");
    payments.add("Flutterwave");
    communitySuggestions.add("Kampala Builders");
  }
  if (has("UK - diaspora")) {
    currencies.add("GBP");
    payments.add("Stripe");
    payments.add("Wise transfer");
    seasonalSignals.add("year-end demand");
    communitySuggestions.add("London Diaspora Builders");
  }
  if (has("USA - diaspora")) {
    currencies.add("USD");
    payments.add("Stripe");
    payments.add("Flutterwave");
    seasonalSignals.add("holiday spend");
    communitySuggestions.add("US Diaspora Operators");
  }
  if (has("Canada - diaspora")) {
    currencies.add("CAD");
    payments.add("Stripe");
    payments.add("Wise transfer");
    seasonalSignals.add("holiday spend");
    communitySuggestions.add("Canada Diaspora Builders");
  }
  if (has("Africa") || has("West Africa broadly") || has("East Africa broadly") || has("African + global markets")) {
    payments.add("Flutterwave");
    seasonalSignals.add("Eid");
    seasonalSignals.add("year-end demand");
  }
  if (has("West Africa broadly")) {
    currencies.add("NGN");
    currencies.add("GHS");
    communitySuggestions.add("West Africa Operators");
  }
  if (has("East Africa broadly")) {
    currencies.add("KES");
    currencies.add("TZS");
    communitySuggestions.add("East Africa Builders");
    languages.add("Swahili");
  }
  if (has("African + global markets") || has("Global only")) {
    currencies.add("USD");
    payments.add("Stripe");
    payments.add("Wise transfer");
  }

  if (currencies.size === 0) currencies.add("USD");
  if (payments.size === 0) payments.add("Stripe");

  const jobMatchingPool =
    has("UK - diaspora") || has("USA - diaspora") || has("Canada - diaspora") || has("Global only")
      ? "diaspora and global clients"
      : has("Nigeria specifically") || has("Kenya specifically") || has("Ghana specifically") || has("South Africa specifically") || has("Tanzania specifically") || has("Uganda specifically") || has("West Africa broadly") || has("East Africa broadly") || has("Africa")
        ? "African remote clients and regional operators"
        : "African and global mixed clients";

  return {
    currencies: Array.from(currencies),
    primaryCurrency: Array.from(currencies)[0] ?? "USD",
    paymentRecommendations: Array.from(payments).slice(0, 4),
    jobMatchingPool,
    communitySuggestions: Array.from(communitySuggestions).slice(0, 3),
    languageOptions: Array.from(languages).slice(0, 4),
    seasonalSignals: Array.from(seasonalSignals).slice(0, 4),
  };
}

function incomeReply(target: IncomeTarget | "") {
  if (!target) {
    return "No problem. I will keep the early route flexible and avoid locking forecasts to a revenue target yet.";
  }
  if (target === "Not focused on income right now") {
    return "Understood. I will not force revenue pressure into your early route. OMEGA can set a target later the moment income becomes the goal.";
  }
  return "Understood. OMEGA will calibrate every recommendation to that target. When you earn your first dollar through this ecosystem, the briefing will tell you what percentage of the journey is complete.";
}

function marketReply(markets: MarketFocus[]) {
  const signals = deriveMarketSignals(markets);
  if (!markets.length) {
    return "No problem. I will start with broad African and global assumptions until your market signal gets sharper.";
  }
  return `Understood. I will calibrate pricing, jobs, payments, and community signals around ${list(markets)}. ${signals.primaryCurrency} stays in view, and ${list(signals.paymentRecommendations)} sit near the top of the payment stack.`;
}

function skillsReply(skills: string[], markets: MarketFocus[]) {
  const marketLabel = markets.length ? list(markets) : "your market";
  if (!skills.length) {
    return "No problem. NOVA will start from live behavior and community activity signals first while your skill graph forms over time.";
  }
  return `${list(skills)} are in demand right now in ${marketLabel}. NOVA will watch for opportunities across the community. SAGE has courses that map to what you've listed. CIRCUIT already has 3 jobs open that match.`;
}

function experienceReply(level: ExperienceLevel) {
  switch (level) {
    case "Just starting out - less than 1 year":
      return "Noted. I will explain more, celebrate smaller wins, and keep your first route teachable.";
    case "Some experience - 1 to 3 years":
      return "Understood. I will keep the guidance practical, with enough context to move quickly without guessing.";
    case "Established - 3 to 7 years":
      return "Good. I can assume stronger foundations and focus on sharper leverage points.";
    case "Expert - 7+ years or professional-level":
      return "Understood. I will skip the basics, move faster, and keep the recommendations commercially direct.";
  }
}

function isAfricanFocus(markets: MarketFocus[]) {
  return markets.some((market) => AFRICAN_MARKETS.includes(market));
}

function inferStage(level: ExperienceLevel | "", incomeTarget: IncomeTarget | ""): CurrentStage {
  if (incomeTarget === "Serious scale - $25,000+/month") return "Scaling a team";
  if (incomeTarget === "Scale income - $8,000-$25,000/month" || incomeTarget === "Full-time income - $2,000-$8,000/month") return "Already earning";
  if (level === "Established - 3 to 7 years" || level === "Expert - 7+ years or professional-level") return "Building traction";
  return "Exploring";
}

function recommendPlan(profileType: ProfileType, teamSize: TeamSize | "", incomeTarget: IncomeTarget | ""): PlanId {
  if (teamSize === "Organization" || incomeTarget === "Serious scale - $25,000+/month") return "enterprise";
  if (
    teamSize === "Small team" ||
    incomeTarget === "Full-time income - $2,000-$8,000/month" ||
    incomeTarget === "Scale income - $8,000-$25,000/month" ||
    ["The Freelancer", "The Entrepreneur", "The Vendor", "The Developer", "The Marketer"].includes(profileType)
  ) {
    return "pro";
  }
  return "free";
}

function welcomeFor(supervisor: SupervisorName, name: string | null | undefined, experienceLevel: ExperienceLevel | "") {
  const hello = firstName(name);
  const beginner = isBeginnerExperience(experienceLevel);
  const expert = experienceLevel === "Expert - 7+ years or professional-level";

  if (supervisor === "OMEGA") {
    return `${hello}, you do not need a fixed direction yet. I will keep the next steps gentle, visible, and pressure-free while the ecosystem learns what pulls your attention.`;
  }
  if (supervisor === "SAGE") {
    return beginner
      ? `${hello}, Academy is open. Start with one guided path and one clear win. SAGE will explain the steps and keep the pace steady.`
      : `${hello}, Academy is open. Start with the path that gets you to a real skill win fastest.`;
  }
  if (supervisor === "CIRCUIT") {
    return expert
      ? `${hello}, Work is ready. CIRCUIT will skip the basics and move straight into market-rate positioning, proposal edge, and stronger contract math.`
      : `${hello}, Work is ready. Open the strongest opportunity surface first and build momentum from there.`;
  }
  if (supervisor === "ATLAS") {
    return expert
      ? `${hello}, Market is live. ATLAS will go straight into pricing, margin analysis, and the fastest path to revenue.`
      : `${hello}, Market is live. Launch your first commercial surface and shape it into revenue.`;
  }
  if (supervisor === "NOVA") {
    return beginner
      ? `${hello}, Community is open. Publish your first signal, learn what resonates, and build your first circle with momentum.`
      : `${hello}, Community is open. Publish your first signal and build your first circle.`;
  }
  if (supervisor === "NEXUS") {
    return beginner
      ? `${hello}, Cloud is ready. Build one useful connector first and let NEXUS remove the friction step by step.`
      : `${hello}, Cloud is ready. Build the first connector or automation that removes friction immediately.`;
  }
  return beginner
    ? `${hello}, Intelligence is waiting. Start with one workflow you want off your plate first, and FORGE will make the path clear.`
    : `${hello}, Intelligence is waiting. Start with the workflow you want off your plate first.`;
}

function foundationReply(answer: string) {
  const normalized = answer.trim().toLowerCase();
  if (!normalized || normalized.includes("skip")) {
    return "Exploring is how all great things start. OMEGA will light the path.";
  }
  if (/(fashion|brand|clothing|apparel|beauty|cosmetic)/.test(normalized)) {
    return "Understood. ATLAS is already thinking about your market. Let me ask a few more things.";
  }
  if (/(startup|tech startup|saas|app|platform|software)/.test(normalized)) {
    return "A startup. CIRCUIT will help you find talent, and ATLAS will help you launch. Good.";
  }
  if (/(freelance|developer|designer|engineer|contract|consult)/.test(normalized)) {
    return "Freelance momentum. CIRCUIT is already looking for matching work. Let me calibrate the rest.";
  }
  if (/(youtube|channel|creator|content|podcast|food|media)/.test(normalized)) {
    return "Creator economy. NOVA is your first stop, and ATLAS will help you monetise it.";
  }
  if (/(school|education|course|teach|academy|learning|students?)/.test(normalized)) {
    return "Education is high-leverage work. SAGE and ATLAS both have a role here.";
  }
  if (/(nothing yet|not sure|exploring|just exploring|just looking)/.test(normalized)) {
    return "Exploring is how all great things start. OMEGA will light the path.";
  }
  return `Understood. OMEGA is calibrating the ecosystem around ${answer.trim()}. Let me ask a few more things.`;
}

function roleReply(role: Identity) {
  switch (role) {
    case "Creator":
      return "NOVA will build your audience. Community is where you begin.";
    case "Freelancer":
      return "CIRCUIT has your first matches. Work is ready for you.";
    case "Entrepreneur":
      return "ATLAS and OMEGA are working together. Market is your engine.";
    case "Learner":
      return "SAGE is waiting. Academy is the fastest path forward.";
    case "Vendor/Seller":
      return "ATLAS has product ideas already. Market opens everything.";
    case "Developer":
      return "NEXUS will get you to hello world in 30 seconds. Cloud is your layer.";
  }
}

function classifyJourney(name: string | null | undefined, journey: Journey) {
  const skillSet = new Set(journey.topSkills);
  const buildingIntent = new Set(journey.buildingIntent);
  const creativeSignal = ["Design & Creative", "Video & Streaming", "Writing & Content", "Music & Audio"].some((skill) => skillSet.has(skill));
  const freelanceSignal = ["Software Development", "Design & Creative", "Writing & Content", "Consulting", "Engineering"].some((skill) => skillSet.has(skill));
  const developerSignal = ["Software Development", "Engineering", "Tech Startup"].some((skill) => skillSet.has(skill));
  const marketerSignal = skillSet.has("Marketing & Growth");
  const commerceSignal = skillSet.has("E-commerce & Sales") || buildingIntent.has("commerce");
  const businessIntent = marketerSignal && (buildingIntent.has("brand") || buildingIntent.has("startup") || buildingIntent.has("commerce") || ["Entrepreneur", "Vendor/Seller", "Freelancer"].includes(journey.identity));
  const highIncomeSignal = ["Full-time income - $2,000-$8,000/month", "Scale income - $8,000-$25,000/month", "Serious scale - $25,000+/month"].includes(journey.incomeTarget);
  const exploringSignal = !journey.buildingFocus || buildingIntent.has("exploring") || /(just exploring|exploring|not sure|just looking|skip)/i.test(journey.buildingFocus);
  const scores: Array<{ type: ProfileType; score: number }> = [
    { type: "The Creator", score: (journey.identity === "Creator" ? 6 : 0) + (creativeSignal ? 4 : 0) + (buildingIntent.has("creator") ? 2 : 0) },
    { type: "The Freelancer", score: (journey.identity === "Freelancer" ? 6 : 0) + (freelanceSignal ? 4 : 0) + (journey.teamSize === "Solo" ? 1 : 0) },
    { type: "The Entrepreneur", score: (journey.identity === "Entrepreneur" ? 6 : 0) + (highIncomeSignal ? 4 : 0) + ((buildingIntent.has("startup") || buildingIntent.has("brand")) ? 2 : 0) },
    { type: "The Learner", score: (journey.identity === "Learner" ? 6 : 0) + (isBeginnerExperience(journey.experienceLevel) ? 4 : 0) },
    { type: "The Vendor", score: (journey.identity === "Vendor/Seller" ? 6 : 0) + (isAfricanFocus(journey.marketFocus) ? 3 : 0) + (commerceSignal ? 2 : 0) },
    { type: "The Developer", score: (journey.identity === "Developer" ? 6 : 0) + (developerSignal ? 5 : 0) + (buildingIntent.has("developer") ? 2 : 0) },
    { type: "The Marketer", score: (marketerSignal ? 5 : 0) + (businessIntent ? 4 : 0) + ((journey.identity === "Entrepreneur" || journey.identity === "Vendor/Seller") ? 1 : 0) },
    { type: "The Explorer", score: (exploringSignal ? 6 : 0) + (!journey.topSkills.length ? 1 : 0) + (!journey.incomeTarget ? 1 : 0) },
  ];
  scores.sort((left, right) => right.score - left.score || PROFILE_PRIORITY.indexOf(left.type) - PROFILE_PRIORITY.indexOf(right.type));
  const leader = scores[0] ?? { type: "The Explorer" as ProfileType, score: 0 };
  const profileType = exploringSignal && leader.type !== "The Explorer" && leader.score < 9 ? "The Explorer" : leader.score < 6 ? "The Explorer" : leader.type;
  const blueprint = PROFILE_BLUEPRINTS[profileType];
  const supervisor = profileType === "The Explorer" ? "OMEGA" : SUPERVISORS[blueprint.primaryLayer];
  const recommendedPlan = recommendPlan(profileType, journey.teamSize, journey.incomeTarget);
  const welcomeMessage = welcomeFor(supervisor, name, journey.experienceLevel);
  const triggerLine =
    profileType === "The Creator" ? "Role Creator plus creative, video, or writing signals points OMEGA toward the creator path." :
    profileType === "The Freelancer" ? "Role Freelancer plus service-driven skills makes Work the clearest first platform." :
    profileType === "The Entrepreneur" ? "Entrepreneur intent plus a $2K+ income target signals a business-building route." :
    profileType === "The Learner" ? "Learner signals and beginner calibration make Academy the strongest first move." :
    profileType === "The Vendor" ? "Vendor intent plus African market focus routes you into the commerce engine." :
    profileType === "The Developer" ? "Developer signals and software depth make Cloud the natural launch surface." :
    profileType === "The Marketer" ? "Marketing skill plus business intent routes you into the market growth hub." :
    "You are still exploring, so OMEGA is keeping the path gentle and flexible.";
  return {
    profileType,
    primaryLayer: blueprint.primaryLayer,
    primaryPlatformLabel: blueprint.primaryPlatformLabel,
    secondaryPlatforms: unique(blueprint.secondaryPlatforms),
    secondaryPlatformLabels: blueprint.secondaryPlatformLabels,
    supervisor,
    recommendedPlan,
    welcomeMessage,
    goal: blueprint.goal,
    firstAction: blueprint.firstAction,
    stage: inferStage(journey.experienceLevel, journey.incomeTarget),
    reasoning: [
      journey.buildingFocus ? `"${journey.buildingFocus}" is the signal OMEGA kept at the center of the assignment.` : "No building focus was locked in yet, so OMEGA kept the assignment adaptable.",
      triggerLine,
      journey.marketFocus.length ? `${list(journey.marketFocus)} shaped the regional routing and payment assumptions.` : "No explicit market was selected, so OMEGA used a broad African + global baseline.",
      journey.topSkills.length ? `${list(journey.topSkills)} gave NOVA, SAGE, and CIRCUIT an early skill graph to work from.` : "Skill routing will start from live activity until your graph becomes clearer.",
      `${profileType} opens with ${blueprint.primaryPlatformLabel}. ${list(blueprint.secondaryPlatformLabels)} stay close behind.`,
      `${supervisor} owns the first welcome, and ${recommendedPlan === "free" ? "Free remains your default starting plan." : `${recommendedPlan === "enterprise" ? "Enterprise" : "Pro"} is the first honest upgrade path if you need more surface area.`}`,
    ],
  };
}

function welcomePayload(journey: Journey): OmegaLaunchWelcome {
  const profileContext = getOmegaProfileContext(journey.profileType);
  const entryPath = getOmegaProfileEntryPath(journey.profileType, ROUTES[journey.primaryLayer]);
  return {
    pathPrefix: entryPath,
    supervisor: journey.supervisor,
    layer: journey.primaryLayer,
    title: `${journey.supervisor} has opened ${profileContext?.primaryPlatformHost ?? journey.primaryPlatformLabel}`,
    message: journey.welcomeMessage,
    selectedPlan: journey.selectedPlan,
    profileType: journey.profileType,
    entryPath,
    briefingFocus: profileContext?.briefingFocus,
    firstAction: profileContext?.firstAction,
  };
}

function planLabel(plan: PlanId) {
  return plan === "enterprise" ? "Enterprise" : plan === "pro" ? "Pro" : "Free";
}

function profileLabel(profileType: ProfileType | "") {
  return profileType ? profileType.replace(/^The\s+/, "") : "Member";
}

function normalizedBuildingFocus(buildingFocus: string) {
  const trimmed = buildingFocus.trim();
  return trimmed || "something real";
}

function primarySkillLabel(skills: string[]) {
  return skills[0]?.trim() || "your strongest skill";
}

function marketLabel(markets: MarketFocus[]) {
  if (markets.includes("Kenya specifically")) return "the Kenyan market";
  if (markets.includes("Nigeria specifically")) return "the Nigerian market";
  if (markets.includes("Ghana specifically")) return "the Ghanaian market";
  if (markets.includes("South Africa specifically")) return "the South African market";
  if (markets.includes("Tanzania specifically")) return "the Tanzanian market";
  if (markets.includes("Uganda specifically")) return "the Ugandan market";
  if (markets.includes("East Africa broadly")) return "East Africa";
  if (markets.includes("West Africa broadly")) return "West Africa";
  if (markets.includes("African + global markets")) return "African and global markets";
  if (markets.includes("Global only")) return "global markets";
  return "your selected market";
}

function activationTaskFor(journey: Journey) {
  switch (journey.profileType) {
    case "The Creator":
      return `write one post about ${normalizedBuildingFocus(journey.buildingFocus)}. NOVA will begin building your skill graph.`;
    case "The Freelancer":
      return "complete your profile. Takes about 4 minutes.";
    case "The Entrepreneur":
      return `open Market -> Vendor Dashboard. ATLAS is calibrating around ${marketLabel(journey.marketFocus)}.`;
    case "The Learner":
      return "start Course 1 in your SAGE learning path.";
    case "The Vendor":
      return "open Market -> Vendor Dashboard and list your first offer.";
    case "The Developer":
      return "open Cloud, review the SDK quickstart, and request API access.";
    case "The Marketer":
      return "write one positioning post and let NOVA map audience response.";
    default:
      return "spend 10 focused minutes in Community and notice what pulls your attention first.";
  }
}

function activationLeadFor(journey: Journey) {
  switch (journey.profileType) {
    case "The Freelancer":
      return `OMEGA is active. You are building a freelance path in ${primarySkillLabel(journey.topSkills)}.`;
    case "The Entrepreneur":
      return `OMEGA is active. You are building a business for ${marketLabel(journey.marketFocus)}.`;
    case "The Learner":
      return "OMEGA is active. You want to learn, get certified, and build real leverage.";
    case "The Developer":
      return "OMEGA is active. You are a developer and NEXUS has your build path ready.";
    default:
      return `OMEGA is active. You said you are building ${normalizedBuildingFocus(journey.buildingFocus)}.`;
  }
}

function proPitchCopy() {
  return [
    "The Free plan gives you a real start \u2014 not a demo.",
    "You can post, learn, browse, and apply without spending anything.",
    "",
    "Pro unlocks the parts of the ecosystem that generate income:",
    "vendor payouts, unlimited applications, creator subscriptions, CIRCUIT proposals.",
    "",
    "Most users who generate their first income through Winners",
    "upgrade within 30 days \u2014 after they've seen what the platform can do.",
    "",
    "There's no rush. The Free plan doesn't expire. OMEGA will tell you",
    "when upgrading makes financial sense for your specific situation.",
  ].join("\n");
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const token = useAuthStore((s) => s.token);
  const updateUser = useAuthStore((s) => s.updateUser);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [phase, setPhase] = useState<Phase>("workspace");
  const [draftMarkets, setDraftMarkets] = useState<MarketFocus[]>([]);
  const [draftSkills, setDraftSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState("");
  const [foundationEcho, setFoundationEcho] = useState("");
  const [activationMode, setActivationMode] = useState<ActivationMode>("plans");
  const [activationIntent, setActivationIntent] = useState<ActivationIntent>("free");
  const [journey, setJourney] = useState<Journey>({
    workspaceName: user?.name ? `${firstName(user.name)} Workspace` : "My Workspace",
    buildingFocus: "",
    goal: "",
    identity: "",
    experienceLevel: "",
    incomeTarget: "",
    marketFocus: [],
    topSkills: [],
    stage: "",
    firstAction: "",
    teamSize: "",
    buildingIntent: [],
    profileType: "",
    primaryLayer: "Community",
    primaryPlatformLabel: "Community",
    secondaryPlatforms: [],
    secondaryPlatformLabels: [],
    supervisor: "NOVA",
    recommendedPlan: "free",
    selectedPlan: DEFAULT_ONBOARDING_PLAN,
    reasoning: [],
    welcomeMessage: "",
  });
  const timersRef = useRef<number[]>([]);
  const startedRef = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);
  const last = messages[messages.length - 1];
  const planPresentation = getOnboardingPlanPresentation(journey.profileType);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, draftSkills, saving, phase]);
  useEffect(() => () => timersRef.current.forEach((t) => window.clearTimeout(t)), []);
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    if (!token) return void navigate("/login", { replace: true });
    if (user?.onboardingCompleted) return void navigate("/home", { replace: true });
  }, [navigate, token, user]);

  function later(fn: () => void, delay: number) { const t = window.setTimeout(fn, delay); timersRef.current.push(t); }
  function pushUser(text: string) { setMessages((m) => [...m, { id: id(), sender: "user", text }]); }
  function pushOmega(text: string, type: MessageType = "input", options?: string[]) {
    return new Promise<void>((resolve) => {
      setIsTyping(true);
      later(() => { setMessages((m) => [...m, { id: id(), sender: "omega", text, type, options }]); setIsTyping(false); resolve(); }, 500);
    });
  }

  async function fetchFoundationResponse(answer: string) {
    const fallback = foundationReply(answer);
    try {
      const res = await fetch(`${API_BASE}/onboarding/omega-response`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ question: 1, answer }),
      });
      if (!res.ok) throw new Error("omega foundation response failed");
      const body = await res.json() as { omegaResponse?: unknown; detectedIntent?: unknown };
      return {
        omegaResponse: typeof body.omegaResponse === "string" && body.omegaResponse.trim() ? body.omegaResponse.trim() : fallback,
        detectedIntent: Array.isArray(body.detectedIntent) ? body.detectedIntent.filter((item): item is string => typeof item === "string").slice(0, 4) : [],
      };
    } catch {
      return { omegaResponse: fallback, detectedIntent: [] as string[] };
    }
  }

  async function saveOnboarding(current: Journey) {
    const res = await fetch(`${API_BASE}/profile/onboarding`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        workspaceName: current.workspaceName,
        buildingFocus: current.buildingFocus,
        profileType: current.profileType,
        identity: current.identity,
        experienceLevel: current.experienceLevel,
        incomeTarget: current.incomeTarget,
        marketFocus: current.marketFocus,
        topSkills: current.topSkills,
        primaryGoal: current.goal,
        primaryLayer: current.primaryLayer,
        secondaryLayers: current.secondaryPlatforms,
        teamSize: current.teamSize,
        currentStage: current.stage,
        firstAction: current.firstAction,
        selectedPlan: DEFAULT_ONBOARDING_PLAN,
        recommendedPlan: current.recommendedPlan,
        assignedSupervisor: current.supervisor,
        welcomeMessage: current.welcomeMessage,
        reasoning: current.reasoning,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(typeof body?.message === "string" ? body.message : "Failed to save onboarding");
    }
  }

  function launch(current: Journey) {
    sessionStorage.setItem(OMEGA_WELCOME_KEY, JSON.stringify(welcomePayload(current)));
    navigate(getOmegaProfileEntryPath(current.profileType, ROUTES[current.primaryLayer] ?? "/home"), { replace: true });
  }

  async function beginActivation(current: Journey) {
    setSaving(true);
    setSaveError("");
    setPhase("classification");
    setActivationMode("plans");
    setActivationIntent("free");
    try {
      await pushOmega("Reading your answers. One moment.");
      await new Promise<void>((resolve) => later(resolve, 1500));
      setJourney(current);
      await pushOmega("Your ecosystem is ready.", "final");
      setPhase("activation");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to prepare activation");
      setPhase("done");
      await pushOmega("I could not prepare your activation screen yet, so I paused here. Retry once and I will continue from this point.", "final");
    } finally {
      setSaving(false);
    }
  }

  async function finalize(current: Journey, intent: ActivationIntent = "free") {
    setSaving(true);
    setSaveError("");
    try {
      const nextJourney: Journey = { ...current, selectedPlan: DEFAULT_ONBOARDING_PLAN };
      await saveOnboarding(nextJourney);
      updateUser({
        onboardingCompleted: true,
        onboardingPrimaryLayer: nextJourney.primaryLayer,
        onboardingPrimaryPath: getOmegaProfileEntryPath(nextJourney.profileType, ROUTES[nextJourney.primaryLayer] ?? "/home"),
        onboardingProfileType: nextJourney.profileType,
        onboardingAssignedSupervisor: nextJourney.supervisor,
        onboardingSelectedPlan: DEFAULT_ONBOARDING_PLAN,
      });
      setJourney(nextJourney);
      setActivationIntent(intent);
      setActivationMode("ceremony");
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save onboarding");
      setPhase("done");
      await pushOmega("I could not persist your onboarding signals yet, so I paused the launch. Retry once and I will continue from here.", "final");
    } finally {
      setSaving(false);
    }
  }

  function enterEcosystem() {
    launch({ ...journey, selectedPlan: DEFAULT_ONBOARDING_PLAN });
  }

  async function answer(raw?: string) {
    const value = (raw ?? inputValue).trim();
    if (!value || saving || isTyping) return;
    if (phase === "workspace") {
      const { omegaResponse, detectedIntent } = await fetchFoundationResponse(value);
      const buildingFocus = value === "Skip for now" ? "" : value;
      setInputValue("");
      setFoundationEcho(omegaResponse);
      setJourney((j) => ({ ...j, buildingFocus, buildingIntent: detectedIntent }));
      later(() => {
        setMessages((m) => [
          ...m,
          { id: id(), sender: "user", text: value },
          { id: id(), sender: "omega", text: omegaResponse },
        ]);
      }, 120);
      later(() => {
        setPhase("identity");
        setFoundationEcho("");
        void pushOmega("Question 2 of 7. Which of these describes you best right now?", "selection", IDENTITIES);
      }, 1200);
      return;
    }
    pushUser(value); setInputValue("");
    if (phase === "identity") { setJourney((j) => ({ ...j, identity: value as Identity })); setPhase("experience"); await pushOmega(roleReply(value as Identity)); return pushOmega("Question 3 of 7. How long have you been doing this? I use this to calibrate supervisor tone and recommendation depth.", "selection", EXPERIENCE_LEVELS); }
    if (phase === "experience") { setJourney((j) => ({ ...j, experienceLevel: value as ExperienceLevel })); setPhase("income"); await pushOmega(experienceReply(value as ExperienceLevel)); return pushOmega("Question 4 of 7. What's your income target from this platform?", "selection", INCOME_TARGETS); }
    if (phase === "income") { const incomeTarget = value === "Skip for now" ? "" : value as IncomeTarget; setJourney((j) => ({ ...j, incomeTarget })); setDraftMarkets([]); setPhase("market"); await pushOmega(incomeReply(incomeTarget)); return pushOmega("Question 5 of 7. Where are you primarily building? Pick up to three markets so ATLAS, CIRCUIT, and NOVA calibrate correctly.", "multiselect", MARKET_OPTIONS); }
    if (phase === "team") {
      const next: Journey = {
        ...journey,
        teamSize: value as TeamSize,
        selectedPlan: DEFAULT_ONBOARDING_PLAN,
        ...classifyJourney(user?.name, { ...journey, teamSize: value as TeamSize }),
      };
      setJourney(next);
      return beginActivation(next);
    }
  }

  async function continueMarkets() {
    if (phase !== "market" || saving || isTyping) return;
    pushUser(draftMarkets.length ? list(draftMarkets) : "Let OMEGA infer the market surface.");
    setJourney((j) => ({ ...j, marketFocus: uniqueMarkets(draftMarkets) }));
    setDraftSkills([]);
    setCustomSkill("");
    setPhase("skills");
    await pushOmega(marketReply(uniqueMarkets(draftMarkets)));
    await pushOmega("Question 6 of 7. What are your top skills? Pick up to five, or type your own.", "multiselect", SKILL_OPTIONS);
  }

  async function continueSkills() {
    if (phase !== "skills" || saving || isTyping) return;
    const selectedSkills = uniqueSkills(draftSkills);
    pushUser(selectedSkills.length ? list(selectedSkills) : "Let NOVA infer my skills over time.");
    setJourney((j) => ({ ...j, topSkills: selectedSkills }));
    setPhase("team");
    await pushOmega(skillsReply(selectedSkills, journey.marketFocus));
    await pushOmega("Question 7 of 7. Are you building alone or with a team?", "selection", TEAM_SIZES);
  }

  function skipFoundation() {
    if (phase !== "workspace" || saving || isTyping) return;
    void answer("Skip for now");
  }

  function toggleMarket(market: MarketFocus) {
    setDraftMarkets((current) => current.includes(market) ? current.filter((x) => x !== market) : current.length >= 3 ? [...current.slice(1), market] : [...current, market]);
  }

  function toggleSkill(skill: string) {
    setDraftSkills((current) => current.includes(skill) ? current.filter((x) => x !== skill) : current.length >= 5 ? [...current.slice(1), skill] : [...current, skill]);
  }

  function addCustomSkill() {
    const value = customSkill.trim();
    if (!value) return;
    setDraftSkills((current) => uniqueSkills([...current, value]));
    setCustomSkill("");
  }

  return (
    <div className="ob-root">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="ob-shell">
        <section className="ob-chat">
          {phase === "workspace" ? (
            <div className="ob-foundation">
              <div className="ob-foundation-k">Question 1 of 7</div>
              <h1 className="ob-foundation-title">What are you <em>building</em>?</h1>
              <p className="ob-foundation-copy">
                OMEGA remembers your answer for your entire time here. Every recommendation, every briefing, every match,
                all of it is shaped by what you write next.
              </p>
              <textarea
                className="ob-foundation-box"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="I am building..."
              />
              {foundationEcho ? <div className="ob-foundation-echo">{foundationEcho}</div> : null}
              <div className="ob-foundation-actions">
                <button type="button" className="ob-btn" onClick={() => void answer()} disabled={!inputValue.trim() || saving || isTyping}>
                  {"Continue ->"}
                </button>
                <button type="button" className="ob-skip" onClick={skipFoundation} disabled={saving || isTyping}>
                  Skip for now
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="ob-messages">
                {messages.map((m, index) => {
                  const isLast = index === messages.length - 1;
                  const showSelect = isLast && m.sender === "omega" && m.type === "selection" && phase !== "classification" && phase !== "activation";
                  const showMulti = isLast && m.sender === "omega" && m.type === "multiselect" && (phase === "market" || phase === "skills");
                  return (
                    <div key={m.id} className={`ob-message ${m.sender}`}>
                      <div className="ob-row">
                        <div className="ob-avatar">{m.sender === "omega" ? "OM" : "YOU"}</div>
                        <div className="ob-bubble">
                          {m.text}
                          {m.type === "final" ? (
                            <>
                              <div className="ob-summary">
                                <div className="ob-summary-item"><span className="ob-summary-k">Profile Type</span><span className="ob-summary-v">{journey.profileType || "Pending"}</span></div>
                                <div className="ob-summary-item"><span className="ob-summary-k">Experience Level</span><span className="ob-summary-v">{journey.experienceLevel || "Pending"}</span></div>
                                <div className="ob-summary-item"><span className="ob-summary-k">Income Target</span><span className="ob-summary-v">{journey.incomeTarget || "Flexible"}</span></div>
                                <div className="ob-summary-item"><span className="ob-summary-k">Primary Markets</span><span className="ob-summary-v">{journey.marketFocus.length ? list(journey.marketFocus) : "Broad African + global"}</span></div>
                                <div className="ob-summary-item"><span className="ob-summary-k">Top Skills</span><span className="ob-summary-v">{journey.topSkills.length ? list(journey.topSkills) : "To be inferred"}</span></div>
                                <div className="ob-summary-item"><span className="ob-summary-k">Workspace Mode</span><span className="ob-summary-v">{journey.teamSize || "Pending"}</span></div>
                                <div className="ob-summary-item"><span className="ob-summary-k">Primary Platform</span><span className="ob-summary-v">{journey.primaryPlatformLabel}</span></div>
                                <div className="ob-summary-item"><span className="ob-summary-k">Secondary Platforms</span><span className="ob-summary-v">{list(journey.secondaryPlatformLabels)}</span></div>
                                <div className="ob-summary-item"><span className="ob-summary-k">Assigned Supervisor</span><span className="ob-summary-v">{journey.supervisor}</span></div>
                              </div>
                              <div className="ob-reasoning">{journey.reasoning.map((r) => <div key={r} className="ob-reason">{r}</div>)}</div>
                            </>
                          ) : null}
                        </div>
                      </div>
                      {showSelect ? (
                        phase === "identity" || phase === "team" ? (
                          <div className="ob-role-grid">
                            {(phase === "identity" ? ROLE_CARDS : TEAM_CARDS).map((card) => (
                              <button key={phase === "identity" ? (card as typeof ROLE_CARDS[number]).role : (card as typeof TEAM_CARDS[number]).value} type="button" className="ob-role-card" onClick={() => void answer(phase === "identity" ? (card as typeof ROLE_CARDS[number]).role : (card as typeof TEAM_CARDS[number]).value)} disabled={saving || isTyping}>
                                <div className="ob-role-icon">{card.icon}</div>
                                <div className="ob-role-title">{card.title}</div>
                                <div className="ob-role-copy">{card.description}</div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <>
                            <div className="ob-options">{m.options?.map((o) => <button key={o} type="button" className="ob-option" onClick={() => void answer(o)} disabled={saving || isTyping}>{o}</button>)}</div>
                            {phase === "income" ? (
                              <div className="ob-multi-actions">
                                <button type="button" className="ob-btn secondary" onClick={() => void answer("Skip for now")} disabled={saving || isTyping}>Skip for now</button>
                              </div>
                            ) : null}
                          </>
                        )
                      ) : null}
                      {showMulti ? (
                        <>
                          {phase === "market" ? (
                            <>
                              <div className="ob-options">{m.options?.map((o) => <button key={o} type="button" className={`ob-option${draftMarkets.includes(o as MarketFocus) ? " active" : ""}`} onClick={() => toggleMarket(o as MarketFocus)} disabled={saving || isTyping}>{o}</button>)}</div>
                              <div className="ob-multi-meta">{draftMarkets.length ? `${draftMarkets.length} markets selected. OMEGA will calibrate currency, payments, and opportunity matching around them.` : "No markets picked yet. You can continue and let OMEGA begin with broad African + global assumptions."}</div>
                              <div className="ob-multi-actions">
                                <button type="button" className="ob-btn" onClick={() => void continueMarkets()} disabled={saving || isTyping}>Continue</button>
                                <button type="button" className="ob-btn secondary" onClick={() => setDraftMarkets([])} disabled={saving || isTyping || !draftMarkets.length}>Clear</button>
                              </div>
                            </>
                          ) : phase === "skills" ? (
                            <>
                              <div className="ob-options">{m.options?.map((o) => <button key={o} type="button" className={`ob-option${draftSkills.includes(o) ? " active" : ""}`} onClick={() => toggleSkill(o)} disabled={saving || isTyping}>{o}</button>)}</div>
                              <div className="ob-skill-input">
                                <input className="ob-input" value={customSkill} onChange={(e) => setCustomSkill(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomSkill(); } }} placeholder="Type a skill not listed above" disabled={saving || isTyping} />
                                <button type="button" className="ob-btn secondary" onClick={addCustomSkill} disabled={saving || isTyping || !customSkill.trim()}>Add Skill</button>
                              </div>
                              <div className="ob-multi-meta">{draftSkills.length ? `${draftSkills.length} skills selected. NOVA will pre-seed the skill graph from them.` : "No skills picked yet. You can continue and let NOVA infer the graph from behavior later."}</div>
                              <div className="ob-multi-actions">
                                <button type="button" className="ob-btn" onClick={() => void continueSkills()} disabled={saving || isTyping}>Continue</button>
                                <button type="button" className="ob-btn secondary" onClick={() => { setDraftSkills([]); setCustomSkill(""); }} disabled={saving || isTyping || (!draftSkills.length && !customSkill.trim())}>Clear</button>
                              </div>
                            </>
                          ) : null}
                        </>
                      ) : null}
                    </div>
                  );
                })}
                {isTyping ? <div className="ob-message omega"><div className="ob-row"><div className="ob-avatar">OM</div><div className="ob-bubble">OMEGA is aligning the next question...</div></div></div> : null}
                <div ref={endRef} />
              </div>

              <div className="ob-input-area">
                {phase === "classification" ? (
                  <div className="ob-classifying">
                    <div className="ob-gold-pulse" />
                    <p>OMEGA is silently assigning your profile, platforms, and first supervisor route.</p>
                  </div>
                ) : phase === "activation" ? (
                  <div className="ob-activation">
                    {activationMode === "ceremony" ? (
                      <div className="ob-plan-shell">
                        <div className="ob-ceremony">
                          <div className="ob-ceremony-ring">
                            <div className="ob-ceremony-core">OM</div>
                          </div>

                          <div className="ob-ceremony-dots">
                            {ACTIVATION_LAYERS.map((icon, index) => (
                              <div key={`${icon}-${index}`} className="ob-ceremony-dot" style={{ ["--i" as const]: index } as CSSProperties}>
                                {icon}
                              </div>
                            ))}
                          </div>

                          <h2 className="ob-ceremony-title">Welcome to the <em>Ecosystem</em>.</h2>

                          <div className="ob-ceremony-copy">
                            <p className="ob-ceremony-line">{activationLeadFor(journey)}</p>
                            <p className="ob-ceremony-line">Your profile: {profileLabel(journey.profileType)}.</p>
                            <p className="ob-ceremony-line">Your supervisor: {journey.supervisor}.</p>
                            <p className="ob-ceremony-line">Your first task: {activationTaskFor(journey)}</p>
                          </div>

                          {activationIntent === "pro" ? <div className="ob-ceremony-chip">Pro interest logged. Free launch stays active first.</div> : null}

                          <button type="button" className="ob-enter-btn" onClick={enterEcosystem} disabled={saving}>
                            Enter the Ecosystem {"\u2192"}
                          </button>
                        </div>
                      </div>
                    ) : (
                    <div className="ob-plan-shell">
                      <div className="ob-plan-k">OMEGA Activation</div>
                      <h2 className="ob-plan-title">One last thing before we begin.</h2>
                      <p className="ob-plan-sub">
                        Free is the launch plan for every new user. No exceptions. Pro and Enterprise stay visible here so your upgrade path is clear when you need more surface area later.
                      </p>

                      <div className="ob-plan-banner">
                        <div className="ob-plan-banner-top">
                          <div style={{ display: "grid", gap: 8 }}>
                            <h3 className="ob-plan-banner-title">Free launches every workspace and every user.</h3>
                            <p className="ob-plan-banner-copy">
                              OMEGA will save this onboarding on Free and route you into the ecosystem immediately. Billing upgrades happen later, inside the platform, after you have real usage context.
                            </p>
                          </div>
                          <div className="ob-plan-meta">
                            <span className="ob-plan-chip free">Launch now: Free</span>
                            <span className="ob-plan-chip">Selected plan: {planLabel(DEFAULT_ONBOARDING_PLAN)}</span>
                            <span className="ob-plan-chip recommended">
                              Honest upgrade path later: {journey.recommendedPlan === "free" ? "Optional" : planLabel(journey.recommendedPlan)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="ob-plan-presentation">
                        <div className="ob-plan-presentation-head">
                          <div className="ob-plan-presentation-k">{planPresentation.label}</div>
                          <p className="ob-plan-presentation-copy">{planPresentation.intro}</p>
                        </div>

                        <div className="ob-plan-presentation-grid">
                          <section className="ob-plan-presentation-card free">
                            <div className="ob-plan-presentation-title">
                              <strong>Free includes</strong>
                              <span className="ob-plan-chip free">Launch now</span>
                            </div>
                            <ul className="ob-plan-presentation-list">
                              {planPresentation.freeItems.map((item) => (
                                <li key={item.text} className={`ob-plan-presentation-item${item.included ? "" : " muted"}`}>
                                  <span className={`ob-plan-presentation-mark ${item.included ? "included" : "locked"}`}>
                                    {item.included ? "OK" : "NO"}
                                  </span>
                                  <span>{item.text}</span>
                                </li>
                              ))}
                            </ul>
                          </section>

                          <section className="ob-plan-presentation-card pro">
                            <div className="ob-plan-presentation-title">
                              <strong>Pro unlocks</strong>
                              <span className="ob-plan-chip recommended">Upgrade later</span>
                            </div>
                            <ul className="ob-plan-presentation-list">
                              {planPresentation.proItems.map((item) => (
                                <li key={item} className="ob-plan-presentation-item">
                                  <span className="ob-plan-presentation-mark upgrade">UP</span>
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </section>
                        </div>
                      </div>

                      <div className="ob-pro-pitch">
                        <div className="ob-pro-pitch-k">OMEGA's honest take</div>
                        <p className="ob-pro-pitch-copy">{proPitchCopy()}</p>
                      </div>

                      <div className="ob-onboarding-promise">
                        <div className="ob-onboarding-promise-k">The OMEGA onboarding promise</div>
                        <p className="ob-onboarding-promise-copy">7 questions. 3 minutes. Zero friction. Every answer makes OMEGA smarter. Every answer makes the platform more personal.</p>
                        <p className="ob-onboarding-promise-copy dim">You never have to configure anything. You never have to decide which layer to start with. OMEGA decides based on who you are and what you want.</p>
                        <p className="ob-onboarding-promise-copy dim">You arrive at the right place, with the right supervisor, on the right plan, ready to begin. Free. Always. Until you decide otherwise.</p>
                      </div>

                      <div className="ob-plan-sections">
                        {ONBOARDING_PLAN_SECTIONS.map((section) => (
                          <section key={section.title} className="ob-plan-section">
                            <div className="ob-plan-section-head">
                              <h3 className="ob-plan-section-title">{section.title}</h3>
                              {section.subtitle ? <p className="ob-plan-section-sub">{section.subtitle}</p> : null}
                            </div>

                            <div className="ob-plan-table-wrap">
                              <table className="ob-plan-table">
                                <thead>
                                  <tr>
                                    <th scope="col">Feature</th>
                                    <th scope="col"><span className="ob-plan-tier free">Free</span></th>
                                    <th scope="col"><span className="ob-plan-tier pro">Pro</span></th>
                                    <th scope="col"><span className="ob-plan-tier enterprise">Enterprise</span></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {section.rows.map((row) => (
                                    <tr key={`${section.title}-${row.feature}`}>
                                      <th scope="row">{row.feature}</th>
                                      <td className="tier-free">{row.free}</td>
                                      <td>{row.pro}</td>
                                      <td>{row.enterprise}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </section>
                        ))}
                      </div>

                      <div className="ob-plan-footer">
                        <div className="ob-plan-note">
                          Free is already locked in for launch. Your recommended upgrade path is still saved so OMEGA, NOVA, SAGE, CIRCUIT, ATLAS, and NEXUS know when to suggest the next step honestly.
                        </div>
                        <div className="ob-cta-row">
                          <button type="button" className="ob-enter-btn" onClick={() => void finalize(journey, "free")} disabled={saving}>
                            {saving ? "Activating..." : `Enter the Ecosystem as ${profileLabel(journey.profileType)} (Free) \u2192`}
                          </button>
                          <button type="button" className="ob-enter-btn soft" onClick={() => void finalize(journey, "pro")} disabled={saving}>
                            Start Pro - $29/month
                          </button>
                        </div>
                      </div>
                    </div>
                    )}
                  </div>
                ) : phase === "done" && saveError ? (
                  <>
                    <div className="ob-hint">Launch paused: {saveError}</div>
                    <div className="ob-input-row">
                      <button type="button" className="ob-btn" onClick={() => void finalize(journey)}>Retry activation</button>
                      <button type="button" className="ob-btn secondary" onClick={() => navigate("/login", { replace: true })}>Back to login</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="ob-input-row">
                      <input className="ob-input" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && last?.type === "input") void answer(); }} placeholder={last?.type === "input" ? "Type your answer" : last?.type === "selection" ? "Choose one of the options above" : last?.type === "multiselect" ? "Pick your options above" : "OMEGA is processing"} disabled={last?.type !== "input" || saving || isTyping} />
                      <button type="button" className="ob-btn" onClick={() => void answer()} disabled={last?.type !== "input" || !inputValue.trim() || saving || isTyping}>Send</button>
                    </div>
                    <div className="ob-hint">OMEGA asks one question at a time, responds in context, and only then reveals the next step.</div>
                  </>
                )}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
