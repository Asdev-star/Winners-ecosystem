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
    page: "NOVA",
    layer: "Community Intelligence",
    confidence: 94,
    recommendations: [
      "Trending: #AfricanTech posts up 23% this week - consider pinning.",
      "Detected 3 potential creators with 500+ engagement - suggest monetization.",
      "Content moderation: 2 posts flagged for review in your groups.",
      " diaspora engagement peak detected at 8PM UTC - schedule posts accordingly.",
      "Your top content this month: behind-the-scenes (+340% reach).",
    ],
    actions: [
      { label: "Open Groups", to: "/community/groups" },
      { label: "Creator Tools", to: "/community/creator" },
      { label: "Directory", to: "/community/directory" },
    ],
  },
  {
    route: "/community/creator",
    page: "NOVA",
    layer: "Creator Economy",
    confidence: 92,
    recommendations: [
      "Your tier engagement: Pro subscribers up 15% this month.",
      "Consider adding a mid-tier at $9.99 - 67% of churn is price-related.",
      "Top benefit request: exclusive live sessions - add to your tier.",
      "Creator comparison: similar accounts earn 2.3x more with weekly newsletters.",
    ],
    actions: [
      { label: "View Analytics", to: "/community/analytics" },
      { label: "Go to Feed", to: "/community" },
    ],
  },
  {
    route: "/community/groups",
    page: "NOVA",
    layer: "Group Intelligence",
    confidence: 88,
    recommendations: [
      "#AfricanTech group grew 45 members this week - celebrate milestones.",
      "Low engagement in #DiasporaInBusiness - consider a live space.",
      "3 pending join requests from verified creators - review now.",
    ],
    actions: [
      { label: "All Groups", to: "/community/groups" },
      { label: "Go to Feed", to: "/community" },
    ],
  },
  {
    route: "/community/spaces",
    page: "NOVA",
    layer: "Live Space Insights",
    confidence: 85,
    recommendations: [
      "Your last space had 127 attendees - above average for your niche.",
      "Schedule a space on Friday 7PM UTC for peak diaspora engagement.",
      "Consider co-hosting with @creator_in_tech for cross-audience.",
    ],
    actions: [
      { label: "Start Space", to: "/community/spaces" },
      { label: "Go to Feed", to: "/community" },
    ],
  },
  {
    route: "/community/directory",
    page: "NOVA",
    layer: "Directory Insights",
    confidence: 87,
    recommendations: [
      "142 profiles viewed your directory listing this week.",
      "Top search: React developers in London - add to your skills.",
      "Update your availability status for 3x more connection requests.",
    ],
    actions: [
      { label: "Edit Profile", to: "/profile" },
      { label: "Go to Feed", to: "/community" },
    ],
  },
  {
    route: "/community/opportunities",
    page: "NOVA",
    layer: "Opportunity Radar",
    confidence: 90,
    recommendations: [
      "5 new opportunities matching your skills posted this week.",
      "Remote React contract ($5k) expires in 48h - apply now.",
      "Your application success rate: 23% - add portfolio links.",
    ],
    actions: [
      { label: "View Opportunities", to: "/community/opportunities" },
      { label: "Go to Feed", to: "/community" },
    ],
  },
  {
    route: "/community/analytics",
    page: "NOVA",
    layer: "Analytics Insights",
    confidence: 89,
    recommendations: [
      "Your reach peaked on Wednesday - post more content then.",
      "Video posts get 4x more engagement than text-only.",
      "Top referrer: #AfroTech community - cross-post there.",
      "Audience in Lagos grew 34% - consider localized content.",
    ],
    actions: [
      { label: "View Feed", to: "/community" },
      { label: "Creator Dashboard", to: "/community/creator" },
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
    if (!target || !target.recommendations?.length) return;
    setIdx(0);
    const t = setInterval(() => {
      const recs = target?.recommendations ?? [];
      setIdx((p) => (p + 1) % recs.length);
    }, 3200);
    return () => clearInterval(t);
  }, [target]);

  if (!target) return null;

  return (
    <aside className="ai-assistant open" aria-live="polite">
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
