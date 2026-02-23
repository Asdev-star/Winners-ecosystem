// src/features/billing/BillingPage.tsx
// Phase 1 — Core Engine | UI Layer
// Full rebuild: ecosystem design system, Stripe integration, plan cards, usage meters

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useBillingStore, PLANS, getPlan } from "./billingStore";
import { useAuthStore } from "../auth/authStore";
import type { PlanId } from "./billingStore";

const css = `
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Space+Mono:wght@400;700&family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&display=swap');

.bp-root {
  min-height: 100vh; background: var(--bg); color: var(--text);
  font-family: 'Syne', sans-serif; padding: 32px 32px 80px; max-width: 960px;
}

/* Context Bar */
.bp-context-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 28px; flex-wrap: wrap; }
.bp-context-item {
  font-family: 'Space Mono', monospace; font-size: 9px;
  letter-spacing: 0.15em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 2px;
}
.bp-context-item.live    { background: rgba(45,212,160,0.1); color: var(--green); border: 1px solid rgba(45,212,160,0.2); }
.bp-context-item.planned { background: rgba(90,122,150,0.08); color: var(--text-dim); border: 1px solid var(--border); }
.bp-context-sep { color: var(--border); font-size: 10px; }

/* Page Header */
.bp-header { margin-bottom: 32px; }
.bp-eyebrow { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 0.25em; text-transform: uppercase; color: var(--gold); margin-bottom: 6px; }
.bp-title { font-family: 'Cormorant Garamond', serif; font-size: clamp(28px, 4vw, 40px); font-weight: 300; color: var(--text); line-height: 1.1; margin: 0 0 6px; }
.bp-title em { font-style: italic; color: var(--gold); }
.bp-subtitle { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); letter-spacing: 0.05em; }

/* Current Plan Banner */
.bp-current-plan {
  display: flex; align-items: center; justify-content: space-between;
  padding: 20px 24px; border-radius: 6px; flex-wrap: wrap; gap: 16px;
  margin-bottom: 24px; position: relative; overflow: hidden;
  background: linear-gradient(135deg, rgba(201,168,76,0.07), rgba(137,196,225,0.03));
  border: 1px solid rgba(201,168,76,0.25);
}
.bp-current-plan::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, var(--gold), var(--ice)); }
.bp-plan-info { display: flex; align-items: center; gap: 16px; }
.bp-plan-icon { font-size: 28px; }
.bp-plan-name { font-size: 18px; font-weight: 800; margin-bottom: 3px; }
.bp-plan-meta { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }
.bp-plan-actions { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
.bp-status-badge {
  font-family: 'Space Mono', monospace; font-size: 9px;
  letter-spacing: 0.1em; text-transform: uppercase;
  padding: 4px 10px; border-radius: 2px;
}
.bp-status-badge.active { background: rgba(45,212,160,0.1); color: var(--green); border: 1px solid rgba(45,212,160,0.2); }
.bp-status-badge.trialing { background: rgba(155,111,255,0.1); color: var(--purple); border: 1px solid rgba(155,111,255,0.2); }
.bp-status-badge.past_due { background: rgba(224,90,78,0.1); color: var(--red); border: 1px solid rgba(224,90,78,0.2); }

/* Success / Cancel Banners */
.bp-banner {
  border-radius: 6px; padding: 14px 20px; margin-bottom: 20px;
  font-family: 'Space Mono', monospace; font-size: 11px; display: flex; align-items: center; gap: 10px;
}
.bp-banner.success { background: rgba(45,212,160,0.08); border: 1px solid rgba(45,212,160,0.25); color: var(--green); }
.bp-banner.warning { background: rgba(224,90,78,0.08); border: 1px solid rgba(224,90,78,0.25); color: var(--red); }

/* Usage Grid */
.bp-usage-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
.bp-usage-card {
  background: var(--surface); border: 1px solid var(--border); border-radius: 6px; padding: 20px;
}
.bp-usage-label  { font-family: 'Space Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.12em; color: var(--text-dim); margin-bottom: 8px; }
.bp-usage-value  { font-size: 22px; font-weight: 800; color: var(--gold); margin-bottom: 10px; }
.bp-usage-track  { height: 4px; background: rgba(137,196,225,0.1); border-radius: 2px; overflow: hidden; }
.bp-usage-fill   { height: 100%; border-radius: 2px; background: linear-gradient(90deg, var(--gold), var(--ice)); transition: width 0.6s ease; }
.bp-usage-fill.danger { background: linear-gradient(90deg, var(--red), rgba(224,90,78,0.5)); }
.bp-usage-meta   { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); margin-top: 6px; }

/* Plan Cards Grid */
.bp-plans-label { font-family: 'Space Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.2em; color: var(--text-dim); margin-bottom: 16px; }
.bp-plans-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
.bp-plan-card {
  background: var(--surface); border: 2px solid var(--border);
  border-radius: 6px; padding: 24px; position: relative; overflow: hidden;
  transition: transform 0.2s, border-color 0.2s;
  cursor: default;
}
.bp-plan-card:hover { transform: translateY(-2px); }
.bp-plan-card.current { border-color: rgba(201,168,76,0.5); }
.bp-plan-card.pro { border-color: rgba(201,168,76,0.3); }
.bp-plan-card.enterprise { border-color: rgba(43,95,142,0.4); }
.bp-plan-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
.bp-plan-card.free::before       { background: var(--ice); }
.bp-plan-card.pro::before        { background: linear-gradient(90deg, var(--gold), var(--ice)); }
.bp-plan-card.enterprise::before { background: linear-gradient(90deg, var(--blue), var(--ice)); }

.bp-plan-badge {
  font-family: 'Space Mono', monospace; font-size: 8px; letter-spacing: 0.12em;
  text-transform: uppercase; padding: 3px 8px; border-radius: 2px; display: inline-block; margin-bottom: 12px;
}
.bp-plan-badge.current-badge { background: rgba(45,212,160,0.1); color: var(--green); border: 1px solid rgba(45,212,160,0.25); }
.bp-plan-badge.popular-badge { background: rgba(201,168,76,0.1); color: var(--gold);  border: 1px solid rgba(201,168,76,0.25); }

.bp-plan-card-name  { font-size: 15px; font-weight: 800; margin-bottom: 8px; }
.bp-plan-card-price { font-family: 'Cormorant Garamond', serif; font-size: 36px; font-weight: 300; color: var(--gold); margin-bottom: 4px; }
.bp-plan-card-price span { font-size: 14px; color: var(--text-dim); font-family: 'Space Mono', monospace; }
.bp-plan-card-desc  { font-family: 'Space Mono', monospace; font-size: 9px; color: var(--text-dim); line-height: 1.7; margin-bottom: 16px; }

.bp-plan-features { list-style: none; padding: 0; margin: 0 0 20px; }
.bp-plan-features li {
  font-size: 12px; padding: 6px 0; border-bottom: 1px solid var(--border);
  display: flex; align-items: flex-start; gap: 8px;
  font-family: 'Space Mono', monospace;
}
.bp-plan-features li:last-child { border-bottom: none; }
.bp-plan-features .check { color: var(--green); flex-shrink: 0; }
.bp-plan-features .dim   { color: var(--text-dim); font-size: 10px; }

/* Buttons */
.bp-btn {
  width: 100%; background: var(--gold); color: #080B10; border: none;
  border-radius: 4px; padding: 11px; font-family: 'Syne', sans-serif;
  font-size: 13px; font-weight: 700; cursor: pointer; transition: opacity 0.15s;
}
.bp-btn:hover:not(:disabled) { opacity: 0.85; }
.bp-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.bp-btn.ghost { background: transparent; border: 1px solid var(--border); color: var(--text-dim); width: auto; padding: 8px 18px; font-size: 12px; }
.bp-btn.ghost:hover { border-color: var(--gold); color: var(--gold); }
.bp-btn.ice { background: transparent; border: 1px solid rgba(43,95,142,0.4); color: var(--ice); }
.bp-btn.ice:hover { background: rgba(43,95,142,0.1); }
.bp-btn.current-btn { background: var(--surface2); color: var(--text-dim); cursor: default; }
.bp-btn.current-btn:hover { opacity: 1; }
.bp-btn.resume { background: transparent; border: 1px solid rgba(45,212,160,0.4); color: var(--green); width: auto; padding: 8px 18px; font-size: 12px; }
.bp-btn.resume:hover { background: rgba(45,212,160,0.08); }

/* Card */
.bp-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 6px; margin-bottom: 16px; position: relative; overflow: hidden;
}
.bp-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
.bp-card.red::before    { background: linear-gradient(90deg, var(--red), transparent); }
.bp-card-header { padding: 18px 24px 16px; border-bottom: 1px solid var(--border); }
.bp-card-title { font-size: 14px; font-weight: 700; margin-bottom: 3px; }
.bp-card-desc  { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); }
.bp-card-body  { padding: 24px; }

/* Danger */
.bp-danger-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.bp-danger-title { font-weight: 700; font-size: 13px; color: var(--red); margin-bottom: 4px; }
.bp-danger-desc  { font-family: 'Space Mono', monospace; font-size: 10px; color: var(--text-dim); line-height: 1.6; }
.bp-cancel-btn {
  background: transparent; border: 1px solid rgba(224,90,78,0.35); color: var(--red);
  border-radius: 4px; padding: 8px 18px; font-family: 'Syne', sans-serif;
  font-size: 12px; font-weight: 700; cursor: pointer; transition: background 0.15s; white-space: nowrap;
}
.bp-cancel-btn:hover { background: rgba(224,90,78,0.08); }

/* Responsive */
@media (max-width: 820px) {
  .bp-root { padding: 16px 16px 80px; }
  .bp-plans-grid { grid-template-columns: 1fr; }
  .bp-usage-grid { grid-template-columns: 1fr; }
}
@media (max-width: 600px) {
  .bp-current-plan { flex-direction: column; }
}
`;

const PLAN_ICONS: Record<string, string> = {
  free: "⬡",
  pro:  "🏆",
  enterprise: "💎",
};

export default function BillingPage() {
  const { subscription, isLoading, fetchSubscription, createCheckout, cancelSubscription, openPortal, portalLoading } = useBillingStore();
  const user       = useAuthStore((s) => s.user);
  const navigate   = useNavigate();
  const [params]   = useSearchParams();

  const [checkoutLoading, setCheckoutLoading] = useState<PlanId | null>(null);
  const [cancelling, setCancelling]           = useState(false);

  useEffect(() => {
    const id = "bp-styles";
    if (!document.getElementById(id)) {
      const tag = document.createElement("style");
      tag.id = id; tag.textContent = css;
      document.head.appendChild(tag);
    }
    return () => { document.getElementById(id)?.remove(); };
  }, []);

  useEffect(() => { fetchSubscription(); }, []);

  const successParam = params.get("success");
  const cancelParam  = params.get("canceled");

  const currentPlanId = (subscription?.plan ?? "free") as PlanId;
  const currentPlan   = getPlan(currentPlanId);
  const planIcon      = PLAN_ICONS[currentPlanId] ?? "⬡";

  const handleUpgrade = async (planId: PlanId) => {
    if (planId === currentPlanId) return;
    if (planId === "enterprise")  { navigate("/contact"); return; }
    setCheckoutLoading(planId);
    try { await createCheckout(planId); }
    catch (e: any) { alert(e.message ?? "Checkout failed"); }
    finally { setCheckoutLoading(null); }
  };

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel your subscription? Your plan will remain active until the end of the billing period.")) return;
    setCancelling(true);
    try { await cancelSubscription(); }
    catch (e: any) { alert(e.message); }
    finally { setCancelling(false); }
  };

  const usageItems = [
    { label: "Team Members",  value: 1,   limit: currentPlan?.seats ?? 3,   unit: "seats" },
    { label: "API Calls",     value: 0,   limit: currentPlanId === "pro" ? 10000 : currentPlanId === "enterprise" ? 999999 : 1000, unit: "/mo" },
    { label: "Data Exports",  value: 0,   limit: currentPlanId === "free" ? 5 : 999, unit: "/mo" },
  ];

  return (
    <div className="bp-root">
      {/* Context Bar */}
      <div className="bp-context-bar">
        <span className="bp-context-item live">⬡ Core Engine</span>
        <span className="bp-context-sep">›</span>
        <span className="bp-context-item live">Billing</span>
        <span className="bp-context-sep">›</span>
        <span className="bp-context-item planned">Phase 1</span>
      </div>

      {/* Header */}
      <div className="bp-header">
        <div className="bp-eyebrow">Subscription</div>
        <h1 className="bp-title">Billing & <em>Plans</em></h1>
        <div className="bp-subtitle">Manage your subscription, usage, and payment methods</div>
      </div>

      {/* Success / Cancel Banners */}
      {successParam && (
        <div className="bp-banner success">
          ✓ Payment successful — your plan has been activated. Welcome to the next level.
        </div>
      )}
      {cancelParam && (
        <div className="bp-banner warning">
          ✗ Checkout was cancelled. No charge was made. Your current plan remains active.
        </div>
      )}

      {/* Current Plan Banner */}
      {!isLoading && (
        <div className="bp-current-plan">
          <div className="bp-plan-info">
            <div className="bp-plan-icon">{planIcon}</div>
            <div>
              <div className="bp-plan-name">{currentPlan?.name ?? currentPlanId.toUpperCase()} Plan</div>
              <div className="bp-plan-meta">
                {subscription?.status
                  ? `Status: ${subscription.status} · ${subscription.renewalDate ? `Renews ${subscription.renewalDate}` : "No renewal date"}`
                  : "No active subscription"
                }
              </div>
            </div>
          </div>
          <div className="bp-plan-actions">
            {subscription?.status && (
              <span className={`bp-status-badge ${subscription.status}`}>
                ● {subscription.status === "active" ? "Active" : subscription.status}
              </span>
            )}
            {subscription?.cancelAtPeriodEnd ? (
              <button className="bp-btn resume" onClick={() => {}}>Resume Plan</button>
            ) : (
              <button className="bp-btn ghost" onClick={openPortal} disabled={portalLoading}>
                {portalLoading ? "Opening…" : "Manage Billing →"}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Usage */}
      <div className="bp-usage-grid">
        {usageItems.map((item) => {
          const pct     = Math.min(100, Math.round((item.value / item.limit) * 100));
          const danger  = pct >= 90;
          const limitStr = item.limit >= 999999 ? "∞" : String(item.limit);
          return (
            <div className="bp-usage-card" key={item.label}>
              <div className="bp-usage-label">{item.label}</div>
              <div className="bp-usage-value">
                {item.value} <span style={{ fontSize: 14, fontWeight: 400, color: "var(--text-dim)", fontFamily: "Space Mono, monospace" }}>/ {limitStr}</span>
              </div>
              <div className="bp-usage-track">
                <div className={`bp-usage-fill${danger ? " danger" : ""}`} style={{ width: `${pct}%` }} />
              </div>
              <div className="bp-usage-meta">{pct}% used · {item.unit}</div>
            </div>
          );
        })}
      </div>

      {/* Plans */}
      <div className="bp-plans-label">Available Plans</div>
      <div className="bp-plans-grid">
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlanId;
          const loading   = checkoutLoading === plan.id;

          const featureMap: Record<string, string[]> = {
            free:       ["Core Engine access", "Community access", `${plan.seats} team members`, "Basic analytics", "CSV exports"],
            pro:        ["Everything in Free", "Advanced analytics", "AI recommendations", "All export formats", "Email reports", "Stripe revenue sync"],
            enterprise: ["Everything in Pro", "Unlimited members", "AI agents", "API access", "White-label option", "Custom contract"],
          };
          const features = featureMap[plan.id] ?? [];

          return (
            <div className={`bp-plan-card ${plan.id}${isCurrent ? " current" : ""}`} key={plan.id}>
              {isCurrent
                ? <span className="bp-plan-badge current-badge">● Current Plan</span>
                : plan.id === "pro" && <span className="bp-plan-badge popular-badge">Most Popular</span>
              }
              <div className="bp-plan-card-name">{plan.name}</div>
              <div className="bp-plan-card-price">
                {plan.price === 0 ? "$0" : plan.id === "enterprise" ? "Custom" : `$${plan.price}`}
                {plan.price > 0 && plan.id !== "enterprise" && <span>/mo</span>}
              </div>
              <div className="bp-plan-card-desc">{plan.description}</div>
              <ul className="bp-plan-features">
                {features.map((f) => (
                  <li key={f}><span className="check">✓</span><span>{f}</span></li>
                ))}
              </ul>
              {isCurrent ? (
                <button className="bp-btn current-btn" disabled>Current Plan</button>
              ) : plan.id === "enterprise" ? (
                <button className="bp-btn ice" onClick={() => handleUpgrade(plan.id)}>Contact Sales →</button>
              ) : (
                <button className="bp-btn" onClick={() => handleUpgrade(plan.id)} disabled={!!checkoutLoading}>
                  {loading ? "Redirecting…" : `Upgrade to ${plan.name} →`}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Cancel */}
      {currentPlanId !== "free" && !subscription?.cancelAtPeriodEnd && (
        <div className="bp-card red">
          <div className="bp-card-header">
            <div className="bp-card-title">Cancel Subscription</div>
            <div className="bp-card-desc">Your plan remains active until the end of the billing period</div>
          </div>
          <div className="bp-card-body">
            <div className="bp-danger-row">
              <div>
                <div className="bp-danger-title">Cancel {currentPlan?.name} Plan</div>
                <div className="bp-danger-desc">
                  You'll keep access until your current period ends. After that, you'll be downgraded
                  to the Free plan. Your data is never deleted.
                </div>
              </div>
              <button className="bp-cancel-btn" onClick={handleCancel} disabled={cancelling}>
                {cancelling ? "Cancelling…" : "Cancel Subscription"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}