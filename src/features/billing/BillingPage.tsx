// src/features/billing/BillingPage.tsx
// CSS via JSX <style> tag — StrictMode safe (no document.createElement)

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useBillingStore, PLANS, getPlan } from "./billingStore";
import { useAuthStore } from "../auth/authStore";
import type { PlanId } from "./billingStore";

function usageColor(used: number, limit: number) {
  const pct = limit > 0 ? used / limit : 0;
  return pct > 0.85 ? "high" : pct > 0.6 ? "medium" : "low";
}
function usagePct(used: number, limit: number) {
  if (limit >= 999999) return 5;
  return Math.min(100, Math.round((used / limit) * 100));
}
function statusBadgeClass(status: string) {
  if (status === "active")   return "active";
  if (status === "trialing") return "trialing";
  if (status === "past_due") return "past-due";
  return "cancelled";
}

export default function BillingPage() {
  const [searchParams] = useSearchParams();
  const {
    subscription, usage, isLoading, portalLoading,
    fetchBilling, createCheckout, openPortal, cancelPlan, resumePlan,
  } = useBillingStore();
  const user = useAuthStore((s) => s.user);

  const [upgrading, setUpgrading] = useState<PlanId | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const showSuccess = searchParams.get("success") === "true";

  useEffect(() => { fetchBilling(); }, []);

  const showToast = (msg: string, type: "success" | "error") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleUpgrade = async (planId: PlanId) => {
    if (planId === "free") { await handleCancel(); return; }
    setUpgrading(planId);
    try {
      const url = await createCheckout(planId);
      window.location.href = url;
    } catch {
      showToast("Failed to start checkout. Please try again.", "error");
    } finally {
      setUpgrading(null);
    }
  };

  const handlePortal = async () => {
    try { await openPortal(); }
    catch { showToast("Failed to open billing portal. Please try again.", "error"); }
  };

  const handleCancel = async () => {
    if (!confirm("Cancel subscription? You'll be downgraded to Free at period end.")) return;
    try {
      await cancelPlan();
      showToast("Subscription cancelled. Downgrade takes effect at period end.", "success");
    } catch { showToast("Cancellation failed. Please try again.", "error"); }
  };

  const handleResume = async () => {
    try { await resumePlan(); showToast("Subscription resumed!", "success"); }
    catch { showToast("Resume failed. Please try again.", "error"); }
  };

  const currentPlanId = (subscription?.planId ?? "free") as PlanId;
  const currentPlan   = getPlan(currentPlanId);
  const canManage     = user?.role === "owner";
  const isPaid        = currentPlanId !== "free";
  const planIcon      = currentPlanId === "enterprise" ? "🏢" : currentPlanId === "pro" ? "⚡" : "🌱";

  return (
    <>
      <style>{CSS}</style>
      <div className="bp-root">
        <div className="bp-inner">

          <div className="bp-header">
            <h1 className="bp-title">Billing & <span>Plans</span></h1>
            <p className="bp-subtitle">Manage your subscription, usage and payment details</p>
          </div>

          {showSuccess && (
            <div className="bp-success-banner">
              ✓ Plan upgraded successfully! Welcome to {currentPlan.name}.
            </div>
          )}

          {/* Current plan */}
          <div className="bp-current">
            <div className="bp-current-left">
              <div className="bp-current-icon">{planIcon}</div>
              <div>
                <div className="bp-current-name">{currentPlan.name} Plan</div>
                <div className="bp-current-meta">
                  {currentPlan.price === 0 ? "Free forever" : `$${currentPlan.price}/month`}
                  {subscription?.currentPeriodEnd && ` · Renews ${subscription.currentPeriodEnd}`}
                </div>
              </div>
            </div>
            <div className="bp-current-right">
              {subscription?.cancelAtPeriodEnd
                ? <span className="bp-status-badge cancelled">Cancels at period end</span>
                : <span className={`bp-status-badge ${statusBadgeClass(subscription?.status ?? "active")}`}>
                    {subscription?.status === "trialing" ? "Trial" : subscription?.status === "past_due" ? "Past due" : "Active"}
                  </span>
              }
              {subscription?.cancelAtPeriodEnd && canManage && (
                <button className="bp-resume-btn" onClick={handleResume}>Resume</button>
              )}
              {isPaid && canManage && (
                <button className="bp-portal-btn" onClick={handlePortal} disabled={portalLoading}>
                  {portalLoading ? "Opening…" : "↗ Manage Billing"}
                </button>
              )}
            </div>
          </div>

          {/* Usage */}
          {usage && (
            <>
              <div className="bp-section-label">Usage This Month</div>
              <div className="bp-usage-grid">
                {[
                  { label: "Seats",   used: usage.seats.used,   limit: usage.seats.limit,   unit: "users"   },
                  { label: "Exports", used: usage.exports.used, limit: usage.exports.limit, unit: "exports" },
                  { label: "Records", used: usage.storage.used, limit: usage.storage.limit, unit: "records" },
                ].map((m) => (
                  <div className="bp-usage-card" key={m.label}>
                    <div className="bp-usage-label">{m.label}</div>
                    <div className="bp-usage-value" style={{ color: usageColor(m.used, m.limit) === "high" ? "#f87171" : "#E8EEF5" }}>
                      {m.used.toLocaleString()}
                      <span style={{ fontSize: 12, fontWeight: 400, color: "#5A7A96", marginLeft: 4 }}>
                        / {m.limit >= 999999 ? "∞" : m.limit.toLocaleString()}
                      </span>
                    </div>
                    <div className="bp-usage-bar-track">
                      <div className={`bp-usage-bar-fill ${usageColor(m.used, m.limit)}`} style={{ width: `${usagePct(m.used, m.limit)}%` }} />
                    </div>
                    <div className="bp-usage-caption">{m.unit}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Plans */}
          <div className="bp-section-label">Available Plans</div>
          <div className="bp-plans">
            {PLANS.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              const isUpgrade = PLANS.indexOf(plan) > PLANS.findIndex((p) => p.id === currentPlanId);
              const isPending = upgrading === plan.id;
              return (
                <div key={plan.id} className={`bp-plan ${plan.id}${isCurrent ? " current" : ""}${plan.highlighted ? " highlighted" : ""}`}>
                  {plan.highlighted && !isCurrent && <div className="bp-plan-badge popular">Most Popular</div>}
                  {isCurrent && <div className="bp-plan-badge current">Current</div>}
                  <div className="bp-plan-name">{plan.name}</div>
                  <div className="bp-plan-price">
                    <span className="bp-plan-amount">{plan.price === 0 ? "Free" : `$${plan.price}`}</span>
                    {plan.price > 0 && <span className="bp-plan-interval">/mo</span>}
                  </div>
                  <div className="bp-plan-features">
                    {plan.features.map((f) => (
                      <div className="bp-plan-feature" key={f}>
                        <span className="bp-plan-feature-check">✓</span>{f}
                      </div>
                    ))}
                  </div>
                  {isCurrent ? (
                    <button className="bp-plan-btn current-btn" disabled>Current Plan</button>
                  ) : isUpgrade && canManage ? (
                    <button
                      className={`bp-plan-btn upgrade${plan.id === "enterprise" ? " ice" : ""}`}
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={!!upgrading}
                    >
                      {isPending ? "Redirecting…" : `Upgrade to ${plan.name}`}
                    </button>
                  ) : canManage ? (
                    <button className="bp-plan-btn downgrade" onClick={() => handleUpgrade(plan.id)} disabled={!!upgrading}>
                      Downgrade
                    </button>
                  ) : (
                    <button className="bp-plan-btn current-btn" disabled>Contact Owner</button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Portal row */}
          {isPaid && canManage && (
            <div className="bp-manage-row">
              <div>
                <div className="bp-manage-title">Payment & Invoices</div>
                <div className="bp-manage-desc">Update payment method, download invoices, or manage Stripe billing details.</div>
              </div>
              <button className="bp-manage-btn" onClick={handlePortal} disabled={portalLoading}>
                {portalLoading ? "Opening portal…" : "↗ Open Stripe Portal"}
              </button>
            </div>
          )}

          {/* Danger zone */}
          {canManage && isPaid && !subscription?.cancelAtPeriodEnd && (
            <div className="bp-danger">
              <div>
                <div className="bp-danger-title">Cancel Subscription</div>
                <div className="bp-danger-desc">Your plan will downgrade to Free at the end of the billing period.</div>
              </div>
              <button className="bp-danger-btn" onClick={handleCancel}>Cancel Plan</button>
            </div>
          )}

        </div>

        {toast && (
          <div className={`bp-toast ${toast.type}`}>
            {toast.type === "success" ? "✓" : "✗"} {toast.msg}
          </div>
        )}
      </div>
    </>
  );
}

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  .bp-root {
    background: #0D1520; color: #E8EEF5;
    font-family: 'Syne', sans-serif; min-height: 100vh; padding: 32px 24px 80px;
  }
  .bp-inner { max-width: 1000px; margin: 0 auto; }

  .bp-header { margin-bottom: 36px; }
  .bp-title  { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; color: #E8EEF5; margin: 0; }
  .bp-title span { color: #C9A84C; }
  .bp-subtitle { font-family: 'Space Mono', monospace; font-size: 11px; color: #5A7A96; margin-top: 4px; }

  /* Current plan */
  .bp-current {
    background: linear-gradient(135deg, #0f1923 0%, #111D2E 100%);
    border: 1px solid rgba(201,168,76,0.2); border-radius: 16px; padding: 20px 24px;
    margin-bottom: 28px; display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: 16px; position: relative; overflow: hidden;
  }
  .bp-current::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, #C9A84C, #89C4E1, transparent); }
  .bp-current-left  { display: flex; align-items: center; gap: 14px; }
  .bp-current-icon  { font-size: 32px; }
  .bp-current-name  { font-size: 18px; font-weight: 800; color: #E8EEF5; }
  .bp-current-meta  { font-family: 'Space Mono', monospace; font-size: 10px; color: #5A7A96; margin-top: 3px; }
  .bp-current-right { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

  .bp-status-badge { font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; padding: 4px 10px; border-radius: 6px; }
  .bp-status-badge.active    { background: rgba(74,222,128,0.1);  color: #4ade80; border: 1px solid rgba(74,222,128,0.2); }
  .bp-status-badge.cancelled { background: rgba(248,113,113,0.1); color: #f87171; border: 1px solid rgba(248,113,113,0.2); }
  .bp-status-badge.trialing  { background: rgba(137,196,225,0.1); color: #89C4E1; border: 1px solid rgba(137,196,225,0.2); }
  .bp-status-badge.past-due  { background: rgba(248,113,113,0.1); color: #f87171; border: 1px solid rgba(248,113,113,0.2); }

  .bp-portal-btn { background: transparent; border: 1px solid rgba(137,196,225,0.2); color: #89C4E1; border-radius: 8px; padding: 8px 14px; font-family: 'Space Mono', monospace; font-size: 9px; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
  .bp-portal-btn:hover:not(:disabled) { border-color: #89C4E1; background: rgba(137,196,225,0.06); }
  .bp-portal-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .bp-resume-btn { background: #C9A84C; color: #0D1520; border: none; border-radius: 8px; padding: 8px 16px; font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; cursor: pointer; transition: opacity 0.15s; white-space: nowrap; }
  .bp-resume-btn:hover { opacity: 0.88; }

  /* Section label */
  .bp-section-label { font-family: 'Space Mono', monospace; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: #C9A84C; margin-bottom: 16px; display: flex; align-items: center; gap: 10px; }
  .bp-section-label::after { content: ''; flex: 1; height: 1px; background: #1E3248; }

  /* Usage */
  .bp-usage-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 36px; }
  .bp-usage-card { background: linear-gradient(135deg, #0f1923 0%, #0D1520 100%); border: 1px solid rgba(137,196,225,0.1); border-radius: 12px; padding: 16px 18px; transition: border-color 0.2s; }
  .bp-usage-card:hover { border-color: rgba(137,196,225,0.2); }
  .bp-usage-label { font-family: 'Space Mono', monospace; font-size: 10px; color: #5A7A96; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
  .bp-usage-value { font-size: 20px; font-weight: 800; margin-bottom: 8px; }
  .bp-usage-bar-track { height: 4px; background: rgba(137,196,225,0.08); border-radius: 2px; overflow: hidden; }
  .bp-usage-bar-fill { height: 100%; border-radius: 2px; transition: width 0.6s ease; }
  .bp-usage-bar-fill.low    { background: #4ade80; }
  .bp-usage-bar-fill.medium { background: #C9A84C; }
  .bp-usage-bar-fill.high   { background: #f87171; }
  .bp-usage-caption { font-family: 'Space Mono', monospace; font-size: 9px; color: #5A7A96; margin-top: 5px; }

  /* Plans */
  .bp-plans { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
  .bp-plan { background: linear-gradient(135deg, #0f1923 0%, #0D1520 100%); border: 1px solid rgba(137,196,225,0.1); border-radius: 16px; padding: 24px; position: relative; overflow: hidden; transition: border-color 0.2s, transform 0.2s; }
  .bp-plan:hover { transform: translateY(-2px); }
  .bp-plan::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
  .bp-plan.pro::before        { background: linear-gradient(90deg, transparent, #C9A84C, transparent); }
  .bp-plan.enterprise::before { background: linear-gradient(90deg, transparent, #89C4E1, transparent); }
  .bp-plan.free::before       { background: linear-gradient(90deg, transparent, rgba(137,196,225,0.3), transparent); }
  .bp-plan.current            { border-color: rgba(74,222,128,0.3); }
  .bp-plan.highlighted:not(.current) { border-color: rgba(201,168,76,0.25); }

  .bp-plan-badge { position: absolute; top: 14px; right: 14px; font-family: 'Space Mono', monospace; font-size: 9px; letter-spacing: 1px; text-transform: uppercase; padding: 3px 8px; border-radius: 6px; }
  .bp-plan-badge.popular { background: rgba(201,168,76,0.15); color: #C9A84C; border: 1px solid rgba(201,168,76,0.3); }
  .bp-plan-badge.current { background: rgba(74,222,128,0.12); color: #4ade80; border: 1px solid rgba(74,222,128,0.25); }

  .bp-plan-name { font-size: 16px; font-weight: 800; margin-bottom: 6px; color: #E8EEF5; }
  .bp-plan.pro .bp-plan-name        { color: #C9A84C; }
  .bp-plan.enterprise .bp-plan-name { color: #89C4E1; }

  .bp-plan-price { margin-bottom: 16px; }
  .bp-plan-amount { font-size: 32px; font-weight: 800; letter-spacing: -1px; color: #E8EEF5; }
  .bp-plan-interval { font-family: 'Space Mono', monospace; font-size: 11px; color: #5A7A96; }

  .bp-plan-features { margin-bottom: 20px; }
  .bp-plan-feature { display: flex; align-items: flex-start; gap: 8px; font-size: 12px; color: #5A7A96; margin-bottom: 8px; line-height: 1.4; }
  .bp-plan-feature-check { color: #4ade80; flex-shrink: 0; font-size: 11px; margin-top: 1px; }

  .bp-plan-btn { width: 100%; padding: 11px; border-radius: 8px; font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s; border: none; }
  .bp-plan-btn.upgrade { background: #C9A84C; color: #0D1520; }
  .bp-plan-btn.upgrade:hover:not(:disabled) { background: #E8C97A; transform: translateY(-1px); }
  .bp-plan-btn.upgrade.ice { background: #89C4E1; color: #0D1520; }
  .bp-plan-btn.upgrade.ice:hover:not(:disabled) { opacity: 0.9; }
  .bp-plan-btn.current-btn { background: transparent; border: 1px solid #1E3248; color: #5A7A96; cursor: default; }
  .bp-plan-btn.downgrade { background: transparent; border: 1px solid #1E3248; color: #5A7A96; }
  .bp-plan-btn.downgrade:hover { border-color: #f87171; color: #f87171; }
  .bp-plan-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none !important; }

  /* Manage row */
  .bp-manage-row { background: linear-gradient(135deg, #0f1923 0%, #0D1520 100%); border: 1px solid rgba(137,196,225,0.1); border-radius: 16px; padding: 18px 24px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
  .bp-manage-title { font-size: 13px; font-weight: 700; color: #E8EEF5; margin-bottom: 3px; }
  .bp-manage-desc  { font-family: 'Space Mono', monospace; font-size: 10px; color: #5A7A96; }
  .bp-manage-btn { background: transparent; border: 1px solid rgba(137,196,225,0.2); color: #89C4E1; border-radius: 8px; padding: 10px 20px; font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
  .bp-manage-btn:hover:not(:disabled) { border-color: #89C4E1; background: rgba(137,196,225,0.06); }
  .bp-manage-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  /* Danger */
  .bp-danger { background: linear-gradient(135deg, #0f1923 0%, #0D1520 100%); border: 1px solid rgba(248,113,113,0.15); border-radius: 16px; padding: 20px 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; }
  .bp-danger-title { font-size: 13px; font-weight: 700; color: #f87171; margin-bottom: 4px; }
  .bp-danger-desc  { font-family: 'Space Mono', monospace; font-size: 10px; color: #5A7A96; }
  .bp-danger-btn { background: transparent; border: 1px solid rgba(248,113,113,0.25); color: #f87171; border-radius: 8px; padding: 8px 18px; font-family: 'Syne', sans-serif; font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
  .bp-danger-btn:hover { background: rgba(248,113,113,0.08); border-color: rgba(248,113,113,0.4); }

  /* Success banner */
  .bp-success-banner { background: rgba(74,222,128,0.08); border: 1px solid rgba(74,222,128,0.2); border-radius: 12px; padding: 14px 18px; margin-bottom: 24px; font-family: 'Space Mono', monospace; font-size: 11px; color: #4ade80; display: flex; align-items: center; gap: 10px; }

  /* Toast */
  .bp-toast { position: fixed; bottom: 24px; right: 24px; background: #111D2E; border: 1px solid #1E3248; border-radius: 12px; padding: 12px 18px; font-family: 'Space Mono', monospace; font-size: 11px; display: flex; align-items: center; gap: 10px; animation: bp-slide 0.3s ease forwards; z-index: 999; box-shadow: 0 8px 32px rgba(0,0,0,0.5); }
  .bp-toast.success { border-color: rgba(74,222,128,0.3);  color: #4ade80; }
  .bp-toast.error   { border-color: rgba(248,113,113,0.3); color: #f87171; }

  @keyframes bp-slide { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

  @media (max-width: 768px) {
    .bp-root { padding: 16px 14px 80px; }
    .bp-plans { grid-template-columns: 1fr; gap: 12px; }
    .bp-usage-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
    .bp-title { font-size: 22px; }
    .bp-toast { bottom: 70px; right: 14px; left: 14px; }
    .bp-plan:hover { transform: none; }
  }
  @media (max-width: 480px) {
    .bp-usage-grid { grid-template-columns: 1fr; }
    .bp-plan { padding: 18px; }
    .bp-plan-amount { font-size: 26px; }
  }
`;