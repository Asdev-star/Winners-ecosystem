import { create } from "zustand";
import { getAuthHeaders } from "../auth/authStore";
import { API_BASE } from "../../lib/api";
import { typedFetch } from "../../lib/typedFetch";

export type PlanId = "free" | "pro" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  price: number;
  interval: "month";
  seats: number;
  features: string[];
  highlighted: boolean;
  stripePriceId: string;
}

export interface Subscription {
  id: string;
  planId: PlanId;
  status: "active" | "cancelled" | "past_due" | "trialing";
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  seats: number;
  portalUrl?: string;
  stripeCustomerId?: string;
}

export interface UsageSummary {
  seats: { used: number; limit: number };
  exports: { used: number; limit: number };
  storage: { used: number; limit: number };
}

interface BillingState {
  subscription: Subscription | null;
  usage: UsageSummary | null;
  isLoading: boolean;
  portalLoading: boolean;
  error: string | null;
  fetchBilling: () => Promise<void>;
  createCheckout: (planId: PlanId) => Promise<string>;
  openPortal: () => Promise<void>;
  cancelPlan: () => Promise<void>;
  resumePlan: () => Promise<void>;
}

export const PLANS: Plan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    interval: "month",
    seats: 3,
    highlighted: false,
    stripePriceId: "",
    features: ["Up to 3 seats", "30-day analytics", "CSV & JSON export", "Basic AI insights", "Community access"],
  },
  {
    id: "pro",
    name: "Pro",
    price: 99,
    interval: "month",
    seats: 10,
    highlighted: true,
    stripePriceId: import.meta.env.VITE_STRIPE_PRO_PRICE_ID ?? "",
    features: [
      "Up to 10 seats",
      "90-day analytics",
      "All export formats (PDF, Excel, CSV)",
      "AI insights + forecasting",
      "Community - full creator tools",
      "Academy - course enrollment",
      "Priority support",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: 299,
    interval: "month",
    seats: 999,
    highlighted: false,
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

export const useBillingStore = create<BillingState>((set, get) => ({
  subscription: null,
  usage: null,
  isLoading: false,
  portalLoading: false,
  error: null,

  fetchBilling: async () => {
    set({ isLoading: true, error: null });
    try {
      const [subscription, usage] = await Promise.all([
        typedFetch<Subscription | null>(`${API_BASE}/billing/subscription`, { headers: getAuthHeaders() }),
        typedFetch<UsageSummary | null>(`${API_BASE}/billing/usage`, { headers: getAuthHeaders() }),
      ]);
      set({ subscription, usage, isLoading: false });
    } catch (error: unknown) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : "Failed to load billing data",
      });
    }
  },

  createCheckout: async (planId) => {
    const { url } = await typedFetch<{ url: string }>(`${API_BASE}/billing/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify({
        planId,
        stripePriceId: getPlan(planId).stripePriceId,
        successUrl: `${window.location.origin}/billing?success=true`,
        cancelUrl: `${window.location.origin}/billing`,
      }),
    });
    return url;
  },

  openPortal: async () => {
    set({ portalLoading: true });
    try {
      const cached = get().subscription?.portalUrl;
      if (cached) {
        window.location.href = cached;
        return;
      }

      const { url } = await typedFetch<{ url: string }>(`${API_BASE}/billing/portal`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body: JSON.stringify({ returnUrl: `${window.location.origin}/billing` }),
      });

      set((state) => ({
        subscription: state.subscription ? { ...state.subscription, portalUrl: url } : null,
      }));

      window.location.href = url;
    } finally {
      set({ portalLoading: false });
    }
  },

  cancelPlan: async () => {
    await typedFetch(`${API_BASE}/billing/cancel`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    set((state) => ({
      subscription: state.subscription ? { ...state.subscription, cancelAtPeriodEnd: true } : null,
    }));
  },

  resumePlan: async () => {
    await typedFetch(`${API_BASE}/billing/resume`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
    set((state) => ({
      subscription: state.subscription ? { ...state.subscription, cancelAtPeriodEnd: false } : null,
    }));
  },
}));
