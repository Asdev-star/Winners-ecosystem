// src/features/team/inviteStore.ts

import { create } from "zustand";
import { getAuthHeaders } from "../auth/authStore";
import { API_BASE } from "../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Role = "admin" | "member" | "viewer";

export interface TeamMember {
  id:        string;
  name:      string;
  email:     string;
  role:      "owner" | Role;
  createdAt: string;
}

export interface PendingInvite {
  id:        string;
  email:     string;
  role:      Role;
  status:    "pending";
  expiresAt: string;
}

export interface Tenant {
  id:          string;
  name:        string;
  plan:        string;
  memberCount: number;
  settings: {
    timezone:    string;
    currency:    string;
    fiscalMonth: number;
  };
}

interface InviteState {
  members:        TeamMember[];
  pendingInvites: PendingInvite[];
  tenant:         Tenant | null;
  isLoading:      boolean;
  error:          string | null;

  fetchTeam:     () => Promise<void>;
  inviteMember:  (email: string, role: Role) => Promise<void>;
  removeMember:  (userId: string) => Promise<void>;
  updateRole:    (userId: string, role: Role) => Promise<void>;
  fetchTenant:   () => Promise<void>;
  updateTenant:  (data: Partial<Tenant>) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useInviteStore = create<InviteState>((set) => ({
  members:        [],
  pendingInvites: [],
  tenant:         null,
  isLoading:      false,
  error:          null,

  fetchTeam: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/tenants/me/members`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const data = await res.json();
      set({ members: data.members, isLoading: false });
    } catch {
      set({ members: [], isLoading: false, error: "Failed to load team members" });
    }
  },

  inviteMember: async (email, role) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/users/invite`, {
        method:  "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body:    JSON.stringify({ email, role }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? "Invite failed");
      }
      const { invite } = await res.json();
      set((s) => ({
        pendingInvites: [...s.pendingInvites, invite],
        isLoading: false,
      }));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Invite failed";
      set({ isLoading: false, error: message });
    }
  },

  removeMember: async (userId) => {
    set((s) => ({ members: s.members.filter((m) => m.id !== userId) }));
    try {
      await fetch(`${API_BASE}/users/${userId}`, { method: "DELETE", headers: getAuthHeaders() });
    } catch { /* optimistic update already applied */ }
  },

  updateRole: async (userId, role) => {
    set((s) => ({ members: s.members.map((m) => m.id === userId ? { ...m, role } : m) }));
    try {
      await fetch(`${API_BASE}/users/${userId}/role`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body:    JSON.stringify({ role }),
      });
    } catch { /* optimistic update already applied */ }
  },

  fetchTenant: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${API_BASE}/tenants/me`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error();
      const tenant = await res.json();
      set({ tenant, isLoading: false });
    } catch {
      set({ tenant: null, isLoading: false });
    }
  },

  updateTenant: async (data) => {
    try {
      await fetch(`${API_BASE}/tenants/me`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        body:    JSON.stringify(data),
      });
      set((s) => ({ tenant: s.tenant ? { ...s.tenant, ...data } : s.tenant }));
    } catch { /* silent fail */ }
  },
}));
