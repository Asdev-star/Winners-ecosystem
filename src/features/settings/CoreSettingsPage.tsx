import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE } from "../../lib/api";
import { getAuthHeaders } from "../auth/authStore";
import { PLATFORM_SETTINGS } from "./sections/PlatformBehaviorSettings";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&family=Cormorant+Garamond:wght@500;600;700&display=swap');

.cse-root{max-width:1360px;margin:0 auto;padding:26px 22px 88px;color:var(--text);font-family:'Syne',sans-serif}
.cse-shell{border:1px solid rgba(201,168,76,.18);border-radius:28px;overflow:hidden;background:radial-gradient(circle at top right,rgba(201,168,76,.14),transparent 34%),radial-gradient(circle at bottom left,rgba(137,196,225,.08),transparent 28%),linear-gradient(180deg,rgba(8,14,23,.99),rgba(12,20,31,.97));box-shadow:0 28px 90px rgba(0,0,0,.34)}
.cse-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;flex-wrap:wrap;padding:24px;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(6,12,20,.82)}
.cse-kicker,.cse-mini{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold)}
.cse-title{margin:10px 0 0;font-family:'Cormorant Garamond',serif;font-size:clamp(34px,5vw,54px);line-height:.95;color:#f6efdc}
.cse-sub{margin:12px 0 0;max-width:780px;color:var(--text-dim);font-size:14px;line-height:1.7}
.cse-actions,.cse-chip-row{display:flex;gap:10px;flex-wrap:wrap}
.cse-link,.cse-chip{display:inline-flex;align-items:center;justify-content:center;min-height:42px;padding:0 16px;border-radius:999px;border:1px solid rgba(201,168,76,.22);background:rgba(201,168,76,.08);color:var(--gold);font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;text-decoration:none}
.cse-link.ghost,.cse-chip{border-color:var(--border);background:rgba(255,255,255,.03);color:var(--text-dim)}
.cse-body{padding:24px;display:grid;gap:18px}
.cse-hero{padding:22px;border-radius:24px;border:1px solid rgba(201,168,76,.18);background:radial-gradient(circle at top right,rgba(201,168,76,.12),transparent 36%),linear-gradient(135deg,rgba(18,28,40,.95),rgba(10,17,27,.96))}
.cse-hero-title{margin:10px 0 0;font-size:24px;font-weight:800}
.cse-hero-copy{margin:10px 0 0;font-size:14px;line-height:1.7;color:var(--text-dim)}
.cse-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.cse-card{padding:18px;border-radius:22px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(18,27,39,.94),rgba(9,15,24,.96))}
.cse-card h3{margin:0;font-size:17px}
.cse-card p{margin:10px 0 0;color:var(--text-dim);font-size:13px;line-height:1.65}
.cse-list{display:grid;gap:8px;margin-top:14px}
.cse-item{padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);font-size:12px;color:var(--text-dim)}
.cse-status{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.cse-stat{padding:16px;border-radius:18px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03)}
.cse-stat-label{font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:var(--text-dim)}
.cse-stat-value{margin-top:10px;font-size:28px;font-weight:800;color:var(--gold)}
.cse-engine{padding:22px;border-radius:24px;border:1px solid rgba(201,168,76,.18);background:linear-gradient(180deg,rgba(15,23,33,.98),rgba(8,14,23,.98))}
.cse-engine-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap}
.cse-engine-title{margin:8px 0 0;font-size:24px;font-weight:800}
.cse-engine-copy{margin:10px 0 0;max-width:900px;color:var(--text-dim);font-size:14px;line-height:1.75}
.cse-badge{display:inline-flex;align-items:center;min-height:28px;padding:0 10px;border-radius:999px;border:1px solid rgba(224,90,78,.28);background:rgba(224,90,78,.08);color:#f5b8b1;font-family:'Space Mono',monospace;font-size:10px;letter-spacing:.12em;text-transform:uppercase}
.cse-reco-wrap{margin-top:18px;padding:18px;border-radius:20px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03)}
.cse-reco-title{font-size:15px;font-weight:700}
.cse-reco-list{display:grid;gap:14px;margin-top:14px}
.cse-reco{padding:16px;border-radius:18px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(18,27,39,.94),rgba(9,15,24,.96))}
.cse-reco-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap}
.cse-reco-name{font-size:14px;font-weight:800}
.cse-reco-sub{margin-top:6px;color:var(--text-dim);font-size:13px;line-height:1.7}
.cse-reco-meta{display:grid;gap:8px;margin-top:12px}
.cse-reco-line{padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);font-size:12px;color:var(--text-dim)}
.cse-actions-row{display:flex;gap:10px;flex-wrap:wrap;margin-top:14px}
.cse-button{display:inline-flex;align-items:center;justify-content:center;min-height:40px;padding:0 14px;border-radius:999px;border:1px solid rgba(201,168,76,.22);background:rgba(201,168,76,.08);color:var(--gold);font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase}
.cse-button.ghost{border-color:var(--border);background:rgba(255,255,255,.03);color:var(--text-dim)}
.cse-button.green{border-color:rgba(45,212,160,.22);background:rgba(45,212,160,.08);color:var(--green)}
.cse-button:disabled{opacity:.45}
.cse-auto{display:grid;grid-template-columns:1.2fr .8fr;gap:16px;margin-top:18px}
.cse-toggle-list{display:grid;gap:10px}
.cse-toggle{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:14px 16px;border-radius:18px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03)}
.cse-toggle-title{font-size:13px;font-weight:700}
.cse-toggle-copy{margin-top:4px;color:var(--text-dim);font-size:12px;line-height:1.6}
.cse-switch{display:inline-flex;align-items:center;justify-content:center;min-width:62px;min-height:34px;padding:0 12px;border-radius:999px;border:1px solid var(--border);background:rgba(255,255,255,.03);font-family:'Space Mono',monospace;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-dim)}
.cse-switch.on{border-color:rgba(45,212,160,.26);background:rgba(45,212,160,.1);color:var(--green)}
.cse-ask{padding:18px;border-radius:18px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03)}
.cse-input{width:100%;box-sizing:border-box;margin-top:14px;padding:12px 14px;border-radius:14px;border:1px solid var(--border);background:rgba(255,255,255,.04);color:var(--text);font-family:'Space Mono',monospace;font-size:12px;outline:none}
.cse-input:focus{border-color:var(--gold)}
.cse-answer{margin-top:14px;padding:14px;border-radius:16px;border:1px solid rgba(201,168,76,.16);background:rgba(201,168,76,.06);color:var(--text-dim);font-size:13px;line-height:1.75}
.cse-option-list{display:grid;gap:8px;margin-top:12px}
.cse-option{padding:10px 12px;border-radius:14px;border:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.03);font-size:12px;color:var(--text-dim)}
.cse-option.active{border-color:rgba(201,168,76,.22);background:rgba(201,168,76,.08);color:#f6efdc}
@media (max-width:1100px){.cse-grid{grid-template-columns:1fr 1fr}.cse-status,.cse-auto{grid-template-columns:1fr 1fr}}
@media (max-width:760px){.cse-root{padding:18px 14px 84px}.cse-head,.cse-body{padding:16px}.cse-grid,.cse-status,.cse-auto{grid-template-columns:1fr}.cse-title{font-size:38px}}
`;

type AdminSettingOption = string | { value: string; label: string; desc?: string };
type AdminSetting = {
  label: string;
  description?: string;
  type?: string;
  options?: AdminSettingOption[];
  current?: string | number | boolean;
  forgeNote?: string;
  warning?: string;
};

function getAdminOptionValue(option: AdminSettingOption) {
  return typeof option === "string" ? option : option.value;
}

function getAdminOptionLabel(option: AdminSettingOption) {
  return typeof option === "string" ? option : option.label;
}

const ADMIN_SECTIONS = [
  {
    title: "FORGE Intelligent Settings Engine",
    description: "FORGE should be able to reason across every global setting, detect risky combinations, and recommend or apply changes with operator approval.",
    items: ["Cross-surface configuration synthesis", "Risk-aware recommendations", "Operator approval path", "Settings drift detection"],
  },
  {
    title: "Platform Behavior",
    description: "Global product defaults that shape how the ecosystem behaves before layer-specific overrides apply.",
    items: ["Launch defaults", "Workspace inheritance", "Cross-layer visibility", "Governance switches"],
  },
  {
    title: "Authentication & Security",
    description: "Identity, session, token, and trust protections that govern access to the full platform.",
    items: ["JWT policy", "2FA posture", "Session revocation", "Tenant boundary controls"],
  },
  {
    title: "Billing & Plans",
    description: "Centralized control of plan logic, billing state, conversion gates, and subscription rules.",
    items: ["Plan entitlements", "Upgrade logic", "Trial controls", "Billing governance"],
  },
  {
    title: "Email & Notifications",
    description: "System-wide outbound communication defaults, delivery controls, and alert routing.",
    items: ["Email provider defaults", "System notification policies", "Digest cadence", "Broadcast governance"],
  },
  {
    title: "AI Supervisors",
    description: "Global defaults for FORGE, NOVA, SAGE, ATLAS, CIRCUIT, OMEGA, and ARIA behavior.",
    items: ["Prompt policies", "Autonomy limits", "Interaction style", "Cost and credit guardrails"],
  },
  {
    title: "Rate Limits",
    description: "Global throttling and abuse controls across API, auth, admin, and AI routes.",
    items: ["Auth routes", "Admin routes", "AI routes", "Per-surface ceilings"],
  },
  {
    title: "Experimental Features",
    description: "Rollout gates for preview features, internal flags, and controlled launches.",
    items: ["Feature flags", "Operator-only previews", "Staged activation", "Rollback toggles"],
  },
  {
    title: "Developer / API",
    description: "API posture, connector governance, and developer-facing controls managed at the engine layer.",
    items: ["API key policies", "Webhook defaults", "Connector governance", "Developer surface controls"],
  },
];

type Recommendation = {
  id: string;
  category: string;
  title: string;
  current: string;
  recommended: string;
  why: string;
  secondaryAction: string;
};

type AutoMode = {
  key: string;
  title: string;
  description: string;
  enabled: boolean;
};

type CoreSettingsSnapshot = {
  generatedAt: string;
  activeSettings: number;
  recommendations: Recommendation[];
  autoModes: AutoMode[];
  askPlaceholder: string;
  recommendationCount: number;
};

const INITIAL_RECOMMENDATIONS: Recommendation[] = [
  {
    id: "rate-limit",
    category: "RATE LIMIT",
    title: "/api/v1/ai/chat is hitting limits 340 times/day",
    current: "20 req/min per user",
    recommended: "35 req/min for PRO users (they use it 2.4x more)",
    why: "FORGE sees sustained friction among higher-value users. Raising the PRO ceiling reduces unnecessary retries without weakening abuse protection for FREE traffic.",
    secondaryAction: "Ask FORGE why",
  },
  {
    id: "email",
    category: "EMAIL",
    title: "Welcome email open rate dropped to 34% (was 58%)",
    current: 'Subject: "Welcome to Winners Ecosystem"',
    recommended: "Personalise by OMEGA profile type (8 variants)",
    why: "The current subject line is too generic. FORGE recommends profile-aware subject variants to recover intent and improve first-week activation.",
    secondaryAction: "View Variants",
  },
  {
    id: "credits",
    category: "AI CREDITS",
    title: "Free plan users exhaust credits in 4.2 days avg",
    current: "100 credits/month FREE",
    recommended: "150 credits/month FREE (conversion rate up 18% in A/B)",
    why: "Early exhaustion suppresses onboarding momentum. A moderate free-plan increase appears to improve retained exploration and later conversion.",
    secondaryAction: "View A/B Data",
  },
];

const AUTO_DEFAULTS: AutoMode[] = [
  {
    key: "rateLimits",
    title: "Auto-manage rate limits",
    description: "Let FORGE tune low-risk threshold changes when usage patterns materially shift.",
    enabled: false,
  },
  {
    key: "cacheTtls",
    title: "Auto-manage cache TTLs",
    description: "Allow FORGE to optimize cache lifetimes for stable performance improvements.",
    enabled: true,
  },
  {
    key: "emailTiming",
    title: "Auto-manage email timing",
    description: "Let FORGE shift send windows when engagement data suggests a better cadence.",
    enabled: false,
  },
  {
    key: "aiCredits",
    title: "Auto-manage AI credit limits",
    description: "Allow FORGE to adjust credit ceilings based on plan performance and churn signals.",
    enabled: false,
  },
];

export function CoreSettingsPage() {
  const [recommendations, setRecommendations] = useState(INITIAL_RECOMMENDATIONS);
  const [autoModes, setAutoModes] = useState(AUTO_DEFAULTS);
  const [forgeQuestion, setForgeQuestion] = useState("");
  const [forgeAnswer, setForgeAnswer] = useState("");
  const [activeSettings, setActiveSettings] = useState(847);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const appliedCount = useMemo(
    () => autoModes.filter((item) => item.enabled).length,
    [autoModes],
  );

  const fetchSnapshot = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const res = await fetch(`${API_BASE}/admin/settings/core`, {
        headers: getAuthHeaders(),
      });
      if (!res.ok) {
        throw new Error(`Failed to load snapshot (${res.status})`);
      }
      const snapshot = (await res.json()) as CoreSettingsSnapshot;
      setActiveSettings(snapshot.activeSettings);
      setRecommendations(snapshot.recommendations);
      setAutoModes(snapshot.autoModes);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load core settings snapshot.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSnapshot();
  }, [fetchSnapshot]);

  const handleApply = async (id: string) => {
    setPendingAction(id);
    try {
      const res = await fetch(`${API_BASE}/admin/settings/core/recommendations/${id}/apply`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      });
      if (!res.ok) {
        throw new Error("Failed to apply recommendation.");
      }
      setRecommendations((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to apply recommendation.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleDismiss = async (id: string) => {
    setPendingAction(id);
    try {
      const res = await fetch(`${API_BASE}/admin/settings/core/recommendations/${id}/dismiss`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
      });
      if (!res.ok) {
        throw new Error("Failed to dismiss recommendation.");
      }
      setRecommendations((current) => current.filter((item) => item.id !== id));
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to dismiss recommendation.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleToggle = async (key: string) => {
    const current = autoModes.find((item) => item.key === key);
    if (!current) return;
    setPendingAction(key);
    try {
      const res = await fetch(`${API_BASE}/admin/settings/core/auto`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ modeKey: key, enabled: !current.enabled }),
      });
      if (!res.ok) {
        throw new Error("Failed to update auto mode.");
      }
      setAutoModes((items) =>
        items.map((item) => (item.key === key ? { ...item, enabled: !item.enabled } : item)),
      );
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to update auto mode.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleAskForge = async (prompt: string) => {
    const question = prompt.trim() || forgeQuestion.trim();
    if (!question) return;
    setForgeQuestion(question);
    setPendingAction("ask");
    try {
      const res = await fetch(`${API_BASE}/admin/settings/core/ask`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) {
        throw new Error("Failed to ask FORGE.");
      }
      const data = (await res.json()) as { question: string; answer: string };
      setForgeAnswer(data.answer);
    } catch (err) {
      setForgeAnswer("");
      setLoadError(err instanceof Error ? err.message : "Failed to ask FORGE.");
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <div className="cse-root">
      <style>{css}</style>
      <div className="cse-shell">
        <div className="cse-head">
          <div>
            <div className="cse-kicker">Admin / Settings / Core Engine</div>
            <h1 className="cse-title">Core Engine Settings</h1>
            <p className="cse-sub">
              Sovereign control over the settings hierarchy. This route is the admin-only source of truth for engine-wide behavior, security, billing, AI supervisor policy, developer controls, and the FORGE intelligent settings layer.
            </p>
          </div>
          <div className="cse-actions">
            <Link className="cse-link ghost" to="/settings">User Settings Hub</Link>
            <Link className="cse-link ghost" to="/admin/overview">Admin Overview</Link>
          </div>
        </div>

        <div className="cse-body">
          <section className="cse-hero">
            <div className="cse-kicker">FORGE Intelligent Settings Engine</div>
            <h2 className="cse-hero-title">AI manages everything, but never silently.</h2>
            <p className="cse-hero-copy">
              FORGE should sit above the entire settings graph, understand how Core Engine policies cascade into Community, Academy, Market, Work, Intelligence, and Account branches, and surface safe, operator-readable recommendations before anything high-impact changes.
            </p>
            <div className="cse-chip-row" style={{ marginTop: 14 }}>
              <span className="cse-chip">Route: /settings/core</span>
              <span className="cse-chip">Access: Admin only</span>
              <span className="cse-chip">API base: {API_BASE}</span>
            </div>
          </section>

          <section className="cse-status">
            <div className="cse-stat">
              <div className="cse-stat-label">Active Settings</div>
              <div className="cse-stat-value">{activeSettings}</div>
            </div>
            <div className="cse-stat">
              <div className="cse-stat-label">Core Branches</div>
              <div className="cse-stat-value">9</div>
            </div>
            <div className="cse-stat">
              <div className="cse-stat-label">Recommendations</div>
              <div className="cse-stat-value">{recommendations.length}</div>
            </div>
            <div className="cse-stat">
              <div className="cse-stat-label">Auto Modes Live</div>
              <div className="cse-stat-value">{appliedCount}</div>
            </div>
          </section>

          <section className="cse-engine">
            <div className="cse-engine-head">
              <div>
                <div className="cse-kicker">FORGE Intelligent Settings Engine</div>
                <h2 className="cse-engine-title">Experimental ecosystem-wide settings supervision</h2>
                <p className="cse-engine-copy">
                  FORGE monitors all active settings across the ecosystem and surfaces recommendations. It can apply low-risk changes with operator approval, explain why a settings combination is suboptimal, and expose the operational tradeoff before anything shifts.
                </p>
              </div>
              <span className="cse-badge">Experimental</span>
            </div>

            <div className="cse-reco-wrap">
              <div className="cse-reco-title">Current Intelligence</div>
              <div className="cse-engine-copy" style={{ marginTop: 8 }}>
                {recommendations.length} settings recommendations ready.
              </div>
              {isLoading && (
                <div className="cse-engine-copy" style={{ marginTop: 8 }}>
                  Loading core settings snapshot...
                </div>
              )}
              {loadError && (
                <div className="cse-reco-line" style={{ marginTop: 8, color: "var(--red)" }}>
                  {loadError}
                </div>
              )}
              <div className="cse-reco-list">
                {recommendations.map((recommendation, index) => (
                  <article key={recommendation.id} className="cse-reco">
                    <div className="cse-reco-top">
                      <div>
                        <div className="cse-mini">
                          {index + 1}. {recommendation.category}
                        </div>
                        <div className="cse-reco-name">{recommendation.title}</div>
                        <div className="cse-reco-sub">{recommendation.why}</div>
                      </div>
                    </div>
                    <div className="cse-reco-meta">
                      <div className="cse-reco-line">Current: {recommendation.current}</div>
                      <div className="cse-reco-line">Recommended: {recommendation.recommended}</div>
                    </div>
                    <div className="cse-actions-row">
                      <button
                        className="cse-button green"
                        type="button"
                        onClick={() => handleApply(recommendation.id)}
                        disabled={pendingAction === recommendation.id}
                      >
                        Apply
                      </button>
                      <button
                        className="cse-button ghost"
                        type="button"
                        onClick={() => handleDismiss(recommendation.id)}
                        disabled={pendingAction === recommendation.id}
                      >
                        Dismiss
                      </button>
                      <button
                        className="cse-button ghost"
                        type="button"
                        onClick={() => handleAskForge(recommendation.title)}
                        disabled={pendingAction === "ask"}
                      >
                        {recommendation.secondaryAction}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="cse-auto">
              <div className="cse-ask">
                <div className="cse-reco-title">Auto-Management Mode</div>
                <p className="cse-engine-copy" style={{ marginTop: 8 }}>
                  FORGE can automatically apply low-risk settings changes such as rate limits, cache TTLs, email timing, and credit posture when the risk profile stays bounded.
                </p>
                <div className="cse-toggle-list" style={{ marginTop: 14 }}>
                  {autoModes.map((mode) => (
                    <div key={mode.key} className="cse-toggle">
                      <div>
                        <div className="cse-toggle-title">{mode.title}</div>
                        <div className="cse-toggle-copy">{mode.description}</div>
                      </div>
                      <button
                        className={`cse-switch${mode.enabled ? " on" : ""}`}
                        type="button"
                        onClick={() => handleToggle(mode.key)}
                        disabled={pendingAction === mode.key}
                      >
                        {mode.enabled ? "ON" : "OFF"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="cse-ask">
                <div className="cse-reco-title">Ask FORGE about any setting</div>
                <p className="cse-engine-copy" style={{ marginTop: 8 }}>
                  Query a setting combination, drift pattern, or policy tradeoff and FORGE will frame the next action.
                </p>
                <input
                  className="cse-input"
                  value={forgeQuestion}
                  onChange={(event) => setForgeQuestion(event.target.value)}
                  placeholder="Ask FORGE about any setting"
                />
                <div className="cse-actions-row">
                  <button className="cse-button" type="button" onClick={() => handleAskForge("")} disabled={pendingAction === "ask"}>
                    Ask FORGE
                  </button>
                </div>
                {forgeAnswer ? <div className="cse-answer">{forgeAnswer}</div> : null}
              </div>
            </div>
          </section>

          <section className="cse-engine">
            <div className="cse-engine-head">
              <div>
                <div className="cse-kicker">Admin / Platform Behavior Settings</div>
                <h2 className="cse-engine-title">Global product defaults</h2>
                <p className="cse-engine-copy">
                  These settings shape how the ecosystem behaves before layer-specific overrides apply.
                </p>
              </div>
            </div>

            <div className="cse-reco-list" style={{ marginTop: 18 }}>
              {Object.entries(PLATFORM_SETTINGS).map(([key, setting]: [string, AdminSetting]) => (
                <article key={key} className="cse-reco">
                  <div className="cse-reco-top">
                    <div>
                      <div className="cse-reco-name">{setting.label}</div>
                      {setting.description && <div className="cse-reco-sub">{setting.description}</div>}
                    </div>
                    {setting.type === 'toggle' ? (
                      <button className={`cse-switch${setting.current ? " on" : ""}`} type="button">
                        {setting.current ? "ON" : "OFF"}
                      </button>
                    ) : setting.options ? (
                      <div className="cse-chip">{setting.current}</div>
                    ) : null}
                  </div>
                  {(setting.forgeNote || setting.warning) && (
                    <div className="cse-reco-meta">
                      {setting.forgeNote && <div className="cse-reco-line" style={{ color: 'var(--gold)' }}>FORGE: {setting.forgeNote}</div>}
                      {setting.warning && <div className="cse-reco-line" style={{ color: 'var(--red)' }}>WARNING: {setting.warning}</div>}
                    </div>
                  )}
                  {setting.options ? (
                    <div className="cse-option-list">
                      {setting.options.map((option) => {
                        const value = getAdminOptionValue(option);
                        return (
                          <div key={value} className={`cse-option${value === setting.current ? " active" : ""}`}>
                            {getAdminOptionLabel(option)}
                          </div>
                        );
                      })}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>

          <section className="cse-grid">
            {ADMIN_SECTIONS.map((section) => (
              <article key={section.title} className="cse-card">
                <div className="cse-mini">Core Engine Branch</div>
                <h3>{section.title}</h3>
                <p>{section.description}</p>
                <div className="cse-list">
                  {section.items.map((item) => (
                    <div key={item} className="cse-item">{item}</div>
                  ))}
                </div>
              </article>
            ))}
          </section>
        </div>
      </div>
    </div>
  );
}
