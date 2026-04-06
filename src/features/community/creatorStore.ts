// ─── Phase 2: Winners Community — Creator Economy Store ─────────────────────────
// creatorStore.ts - Creator subscription and tier management state

import { create } from 'zustand';
import { typedFetch } from '../../lib/typedFetch';

interface CreatorTier {
  id: string;
  name: string;
  description: string;
  benefits: string[];
  monthlyPrice: number;
  yearlyPrice: number;
  isActive: boolean;
}

interface Subscriber {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface CreatorSubscription {
  id: string;
  subscriberId: string;
  creatorId: string;
  tier: string;
  amount: number;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  startedAt: string;
  expiresAt?: string;
  subscriber?: Subscriber;
  creator?: { id: string; name: string; avatar?: string };
}

interface Earnings {
  totalEarnings: number;
  subscriberCount: number;
  monthlyEarnings: number;
  tier: {
    name: string;
    monthlyPrice: number;
    yearlyPrice: number;
  } | null;
}

interface CreatorProfile {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  country?: string;
  city?: string;
  skills: string[];
  industry?: string;
  profileViews: number;
}

interface CreatorState {
  // Current user creator data
  tier: CreatorTier | null;
  subscribers: CreatorSubscription[];
  earnings: Earnings | null;
  
  // My subscriptions (as a subscriber)
  mySubscriptions: CreatorSubscription[];
  
  // Public creator profiles
  creatorProfile: CreatorProfile | null;
  creatorTier: CreatorTier | null;
  creatorStats: { subscriberCount: number; totalEarnings: number } | null;
  
  // Loading states
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchTier: () => Promise<void>;
  createOrUpdateTier: (data: Partial<CreatorTier>) => Promise<void>;
  fetchSubscribers: () => Promise<void>;
  fetchEarnings: () => Promise<void>;
  fetchMySubscriptions: () => Promise<void>;
  subscribeToCreator: (creatorId: string, tierId: string, amount?: number) => Promise<void>;
  unsubscribeFromCreator: (creatorId: string) => Promise<void>;
  fetchCreatorProfile: (userId: string, tenantId: string) => Promise<void>;
  clearCreatorProfile: () => void;
}

const API_BASE = '/creator';

export const useCreatorStore = create<CreatorState>((set, get) => ({
  tier: null,
  subscribers: [],
  earnings: null,
  mySubscriptions: [],
  creatorProfile: null,
  creatorTier: null,
  creatorStats: null,
  loading: false,
  error: null,

  fetchTier: async () => {
    set({ loading: true, error: null });
    try {
      const data = await typedFetch<{ tier: CreatorTier | null }>(`${API_BASE}/tier`, { credentials: 'include' });
      set({ tier: data.tier, loading: false });
    } catch (error: unknown) {
      set({ error: 'Failed to fetch tier', loading: false });
    }
  },

  createOrUpdateTier: async (data) => {
    set({ loading: true, error: null });
    try {
      const result = await typedFetch<{ tier: CreatorTier }>(`${API_BASE}/tier`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include'
      });
      set({ tier: result.tier, loading: false });
    } catch (error: unknown) {
      set({ error: 'Failed to create/update tier', loading: false });
    }
  },

  fetchSubscribers: async () => {
    set({ loading: true, error: null });
    try {
      const data = await typedFetch<{ subscriptions: CreatorSubscription[] }>(`${API_BASE}/subscribers`, { credentials: 'include' });
      set({ subscribers: data.subscriptions, loading: false });
    } catch (error: unknown) {
      set({ error: 'Failed to fetch subscribers', loading: false });
    }
  },

  fetchEarnings: async () => {
    set({ loading: true, error: null });
    try {
      const data = await typedFetch<Earnings>(`${API_BASE}/earnings`, { credentials: 'include' });
      set({ earnings: data, loading: false });
    } catch (error: unknown) {
      set({ error: 'Failed to fetch earnings', loading: false });
    }
  },

  fetchMySubscriptions: async () => {
    set({ loading: true, error: null });
    try {
      const data = await typedFetch<{ subscriptions: CreatorSubscription[] }>(`${API_BASE}/my-subscriptions`, { credentials: 'include' });
      set({ mySubscriptions: data.subscriptions, loading: false });
    } catch (error: unknown) {
      set({ error: 'Failed to fetch subscriptions', loading: false });
    }
  },

  subscribeToCreator: async (creatorId, tierId, amount) => {
    set({ loading: true, error: null });
    try {
      await typedFetch(`${API_BASE}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId, tierId, amount }),
        credentials: 'include'
      });
      await get().fetchMySubscriptions();
      set({ loading: false });
    } catch (error: unknown) {
      set({ error: 'Failed to subscribe', loading: false });
    }
  },

  unsubscribeFromCreator: async (creatorId) => {
    set({ loading: true, error: null });
    try {
      await typedFetch(`${API_BASE}/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId }),
        credentials: 'include'
      });
      await get().fetchMySubscriptions();
      set({ loading: false });
    } catch (error: unknown) {
      set({ error: 'Failed to unsubscribe', loading: false });
    }
  },

  fetchCreatorProfile: async (userId, tenantId) => {
    set({ loading: true, error: null });
    try {
      const data = await typedFetch<{
        creator: CreatorProfile;
        tier: CreatorTier;
        subscriberCount: number;
        totalEarnings: number;
      }>(`${API_BASE}/${userId}?tenantId=${tenantId}`, { credentials: 'include' });
      set({ 
        creatorProfile: data.creator, 
        creatorTier: data.tier,
        creatorStats: { subscriberCount: data.subscriberCount, totalEarnings: data.totalEarnings },
        loading: false 
      });
    } catch (error: unknown) {
      set({ error: 'Failed to fetch creator profile', loading: false });
    }
  },

  clearCreatorProfile: () => {
    set({ creatorProfile: null, creatorTier: null, creatorStats: null });
  }
}));
