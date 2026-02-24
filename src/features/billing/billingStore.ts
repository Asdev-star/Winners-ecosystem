// src/features/billing/billingStore.ts

import { create } from "zustand";
import { getAuthHeaders } from "../auth/authStore";

import { API_BASE } from "../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PlanId = "free" | "pro" | "enterprise";

export interface Plan {
  id:            PlanId;
  name:          string;
  price:         number;
  interval:      "month";
  seats:         number;
  features:      string[];
  highlighted:   boolean;
  stripePriceId: string; // Stripe Price ID (price_xxx)
}

export interface Subscription {
  id:                string;
  planId:            PlanId;
  status:            "active" | "cancelled" | "past_due" | "trialing";
  currentPeriodEnd:  string;
  cancelAtPeriodEnd: boolean;
  seats:             number;
  portalUrl?:        string; // Stripe Customer Portal URL
  stripeCustomerId?: string;
}

export interface UsageSummary {
  seats:   { used: number; limit: number };
  exports: { used: number; limit: number };
  storage: { used: number; limit: number };
}

interface BillingState {
  subscription:  Subscription | null;
  usage:         UsageSummary | null;
  isLoading:     boolean;
  portalLoading: boolean;
  error:         string | null;

  fetchBilling:   () => Promise<void>;
  createCheckout: (planId: PlanId) => Promise<string>; // returns Stripe checkout URL
  openPortal:     () => Promise<void>;                 // opens Stripe Customer Portal
  cancelPlan:     () => Promise<void>;
  resumePlan:     () => Promise<void>;
}

// ─── Plans Config ─────────────────────────────────────────────────────────────
// Prices match Master Roadmap V2 monetization: Free / $99 Pro / $299 Enterprise
// Set VITE_STRIPE_PRO_PRICE_ID and VITE_STRIPE_ENTERPRISE_PRICE_ID in Railway env vars

export const PLANS: Plan[] = [
  {
    id:            "free",
    name:          "Free",
    price:         0,
    interval:      "month",
    seats:         3,
    highlighted:   false,
    stripePriceId: "",
    features: [
      "Up to 3 seats",
      "30-day analytics",
      "CSV & JSON export",
      "Basic AI insights",
      "Community access",
    ],
  },
  {
    id:            "pro",
    name:          "Pro",
    price:         99,
    interval:      "month",
    seats:         10,
    highlighted:   true,
    stripePriceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID ?? "",
    features: [
      "Up to 10 seats",
      "90-day analytics",
      "All export formats (PDF, Excel, CSV)",
      "AI insights + forecasting",
      "Community — full creator tools",
      "Academy — course enrollment",
      "Priority support",
    ],
  },
  {
    id:            "enterprise",
    name:          "Enterprise",
    price:         299,
    interval:      "month",
    seats:         999,
    highlighted:   false,
    stripePriceId: import.meta.env.VITE_STRIPE_ENTERPRISE_PRICE_ID ?? "",
    features: [
      "Unlimited seats",
      "Unlimited analytics history",
      "All export formats",
      "AI agents + smart automation",
      "Full ecosystem access",
      "Custom integrations + API access",
      "Dedicated account manager",
      "SLA guarantee",
      "White-label option",
    ],
  },
];

export const getPlan = (id: PlanId): Plan => PLANS.find((p) => p.id === id) ?? PLANS[0];

// ─── Store ────────────────────────────────────────────────────────────────────

export const useBillingStore = create<BillingState>((set, get) => ({
  subscription:  null,
  usage:         null,
  isLoading:     false,
  portalLoading: false,
  error:         null,

  // ── Fetch subscription + usage ───────────────────────────────────────────
  fetchBilling: async () => {
    set({ isLoading: true, error: null });
    try {
      const [subRes, usageRes] = await Promise.all([
        fetch(`${API_BASE}/billing/subscription`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/billing/usage`,         { headers: getAuthHeaders() }),
      ]);

      const subscription: Subscription | null = subRes.ok   ? await subRes.json()   : null;
      const usage:        UsageSummary | null  = usageRes.ok ? await usageRes.json() : null;

      set({ subscription, usage, isLoading: false });
    } catch {
      // Dev fallback — remove before production
      set({
        subscription: {
          id:                "sub_mock",
          planId:            "pro",
          status:            "active",
          currentPeriodEnd:  "2026-04-19",
          cancelAtPeriodEnd: false,
          seats:             10,
          portalUrl:         undefined,
        },
        usage: {
          seats:   { used: 4,   limit: 10   },
          exports: { used: 12,  limit: 100  },
          storage: { used: 240, limit: 5000 },
        },
        isLoading: false,
      });
    }
  },

  // ── Stripe Checkout ──────────────────────────────────────────────────────
  // Backend creates a Stripe Checkout Session and returns the URL
  createCheckout: async (planId) => {
    const res = await fetch(`${API_BASE}/billing/checkout`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body:    JSON.stringify({
        planId,
        stripePriceId: getPlan(planId).stripePriceId,
        successUrl: `${window.location.origin}/billing?success=true`,
        cancelUrl:  `${window.location.origin}/billing`,
      }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.message ?? "Failed to create checkout session");
    }
    const { url } = await res.json();
    return url;
  },

  // ── Stripe Customer Portal ───────────────────────────────────────────────
  // Lets the customer manage payment method, invoices, and cancel themselves
  openPortal: async () => {
    set({ portalLoading: true });
    try {
      // Use cached portal URL if available (valid for 5 min from Stripe)
      const cached = get().subscription?.portalUrl;
      if (cached) { window.location.href = cached; return; }

      const res = await fetch(`${API_BASE}/billing/portal`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body:    JSON.stringify({ returnUrl: `${window.location.origin}/billing` }),
      });
      if (!res.ok) throw new Error("Failed to open billing portal");
      const { url } = await res.json();

      // Cache on subscription object for this session
      set((s) => ({
        subscription: s.subscription ? { ...s.subscription, portalUrl: url } : null,
      }));

      window.location.href = url;
    } finally {
      set({ portalLoading: false });
    }
  },

  // ── Cancel ───────────────────────────────────────────────────────────────
  cancelPlan: async () => {
    const res = await fetch(`${API_BASE}/billing/cancel`, {
      method:  "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Cancellation failed");
    set((s) => ({
      subscription: s.subscription
        ? { ...s.subscription, cancelAtPeriodEnd: true }
        : null,
    }));
  },

  // ── Resume ───────────────────────────────────────────────────────────────
  resumePlan: async () => {
    const res = await fetch(`${API_BASE}/billing/resume`, {
      method:  "POST",
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Resume failed");
    set((s) => ({
      subscription: s.subscription
        ? { ...s.subscription, cancelAtPeriodEnd: false }
        : null,
    }));
  },
}));