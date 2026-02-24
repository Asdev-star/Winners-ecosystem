import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type TargetConfig = {
  route: string;
  page: string;
  layer: string;
  confidence: number;
  recommendations: string[];
  actions: Array<{ label: string; to: string }>;
};

const TARGETS: TargetConfig[] = [
  {
    route: "/dashboard",
    page: "Dashboard",
    layer: "Core Intelligence",
    confidence: 92,
    recommendations: [
      "Push onboarding workflow for low-activation users.",
      "Prioritize community growth loop in next sprint.",
      "Audit churn alerts before weekly planning.",
    ],
    actions: [
      { label: "Open Analytics", to: "/analytics" },
      { label: "Open Community", to: "/community" },
    ],
  },
  {
    route: "/analytics",
    page: "Analytics",
    layer: "Decision Engine",
    confidence: 90,
    recommendations: [
      "Enable forecast mode for executive weekly report.",
      "Investigate anomaly band around high-revenue days.",
      "Compare 30d against 90d baseline for retention trend.",
    ],
    actions: [
      { label: "Go Billing", to: "/billing" },
      { label: "Go Dashboard", to: "/dashboard" },
    ],
  },
  {
    route: "/billing",
    page: "Billing",
    layer: "Revenue Optimizer",
    confidence: 88,
    recommendations: [
      "Upsell candidates detected from high seat utilization.",
      "Trigger upgrade prompt at 80% usage threshold.",
      "Promote annual plan for stable cash-flow profile.",
    ],
    actions: [
      { label: "Review Team", to: "/team" },
      { label: "Review Analytics", to: "/analytics" },
    ],
  },
  {
    route: "/community",
    page: "Community",
    layer: "Engagement Intelligence",
    confidence: 91,
    recommendations: [
      "Pin high-performing post format for 24h cycle.",
      "Prompt creators to tag by niche for better feed routing.",
      "Launch retention challenge for low-frequency members.",
    ],
    actions: [
      { label: "Open Groups", to: "/community/groups" },
      { label: "Open Dashboard", to: "/dashboard" },
    ],
  },
  {
    route: "/settings",
    page: "Settings",
    layer: "Governance Advisor",
    confidence: 86,
    recommendations: [
      "Validate timezone + fiscal month for reporting accuracy.",
      "Review integration posture and permissions monthly.",
      "Enforce owner/admin governance checklist.",
    ],
    actions: [
      { label: "Open Billing", to: "/billing" },
      { label: "Open Security", to: "/2fa" },
    ],
  },
];

export default function AIPageAssistant() {
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);
  const [idx, setIdx] = useState(0);

  const target = useMemo(
    () => TARGETS.find((t) => location.pathname === t.route || location.pathname.startsWith(`${t.route}/`)),
    [location.pathname],
  );

  useEffect(() => {
    if (!target) return;
    setIdx(0);
    const t = setInterval(() => {
      setIdx((p) => (p + 1) % target.recommendations.length);
    }, 3200);
    return () => clearInterval(t);
  }, [target]);

  if (!target) return null;

  return (
    <aside className={`ai-assistant${open ? " open" : ""}`} aria-live="polite">
      <button className="ai-assistant-toggle" onClick={() => setOpen((v) => !v)}>
        {open ? "AI -" : "AI +"}
      </button>

      {open && (
        <div className="ai-assistant-body">
          <div className="ai-assistant-top">
            <small>{target.layer}</small>
            <span>{target.page}</span>
          </div>

          <div className="ai-assistant-signal">
            <b>{target.confidence}%</b>
            <em>Confidence</em>
          </div>

          <p>{target.recommendations[idx]}</p>

          <div className="ai-assistant-actions">
            {target.actions.map((a) => (
              <button key={a.label} onClick={() => navigate(a.to)}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

