// src/features/billing/billingStore.ts

import { create } from "zustand";
import { getAuthHeaders } from "../auth/authStore";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlanId = "free" | "pro" | "enterprise";

export interface Plan {
  id:          PlanId;
  name:        string;
  price:       number;
  interval:    "month";
  seats:       number;
  features:    string[];
  highlighted: boolean;
  variantId:   string; // LemonSqueezy variant ID
}

export interface Subscription {
  id:             string;
  planId:         PlanId;
  status:         "active" | "cancelled" | "past_due" | "trialing";
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  seats:          number;
  portalUrl?:     string;
}

export interface UsageSummary {
  seats:    { used: number; limit: number };
  exports:  { used: number; limit: number };
  storage:  { used: number; limit: number };
}

interface BillingState {
  subscription: Subscription | null;
  usage:        UsageSummary | null;
  isLoading:    boolean;
  error:        string | null;

  fetchBilling:   () => Promise<void>;
  createCheckout: (planId: PlanId) => Promise<string>; // returns checkout URL
  cancelPlan:     () => Promise<void>;
  resumePlan:     () => Promise<void>;
}

// ─── Plans Config ─────────────────────────────────────────────────────────────
// Replace variantId values with your real LemonSqueezy variant IDs

export const PLANS: Plan[] = [
  {
    id:          "free",
    name:        "Free",
    price:       0,
    interval:    "month",
    seats:       3,
    highlighted: false,
    variantId:   "",
    features: [
      "Up to 3 seats",
      "30-day analytics",
      "CSV & JSON export",
      "Basic insights",
    ],
  },
  {
    id:          "pro",
    name:        "Pro",
    price:       99,
    interval:    "month",
    seats:       10,
    highlighted: true,
    variantId:   import.meta.env.VITE_LS_PRO_VARIANT_ID ?? "pro_variant",
    features: [
      "Up to 10 seats",
      "90-day analytics",
      "All export formats",
      "AI insights + forecasting",
      "Priority support",
    ],
  },
  {
    id:          "enterprise",
    name:        "Enterprise",
    price:       299,
    interval:    "month",
    seats:       999,
    highlighted: false,
    variantId:   import.meta.env.VITE_LS_ENTERPRISE_VARIANT_ID ?? "enterprise_variant",
    features: [
      "Unlimited seats",
      "Unlimited history",
      "All export formats",
      "AI insights + forecasting",
      "Custom integrations",
      "Dedicated support",
      "SLA guarantee",
    ],
  },
];

export const getPlan = (id: PlanId) => PLANS.find((p) => p.id === id) ?? PLANS[0];

// ─── Store ────────────────────────────────────────────────────────────────────

export const useBillingStore = create<BillingState>((set) => ({
  subscription: null,
  usage:        null,
  isLoading:    false,
  error:        null,

  fetchBilling: async () => {
    set({ isLoading: true, error: null });
    try {
      const [subRes, usageRes] = await Promise.all([
        fetch(`${API_BASE}/billing/subscription`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/billing/usage`,        { headers: getAuthHeaders() }),
      ]);

      const subscription = subRes.ok   ? await subRes.json()   : null;
      const usage        = usageRes.ok ? await usageRes.json() : null;

      set({ subscription, usage, isLoading: false });
    } catch {
      // Mock fallback during development
      set({
        subscription: { id: "sub_mock", planId: "pro", status: "active", currentPeriodEnd: "2026-03-19", cancelAtPeriodEnd: false, seats: 10 },
        usage:        { seats: { used: 4, limit: 10 }, exports: { used: 12, limit: 100 }, storage: { used: 240, limit: 5000 } },
        isLoading: false,
      });
    }
  },

  createCheckout: async (planId) => {
    const res = await fetch(`${API_BASE}/billing/checkout`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body:    JSON.stringify({ planId }),
    });
    if (!res.ok) throw new Error("Failed to create checkout");
    const { url } = await res.json();
    return url;
  },

  cancelPlan: async () => {
    await fetch(`${API_BASE}/billing/cancel`, { method: "POST", headers: getAuthHeaders() });
    set((s) => ({
      subscription: s.subscription ? { ...s.subscription, cancelAtPeriodEnd: true } : null,
    }));
  },

  resumePlan: async () => {
    await fetch(`${API_BASE}/billing/resume`, { method: "POST", headers: getAuthHeaders() });
    set((s) => ({
      subscription: s.subscription ? { ...s.subscription, cancelAtPeriodEnd: false } : null,
    }));
  },
}));