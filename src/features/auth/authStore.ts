// src/features/auth/authStore.ts

import { create } from "zustand";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "member" | "viewer";
  tenantId: string;
  tenantName: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  restoreSession: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOKEN_KEY = "winners_token";
const USER_KEY  = "winners_user";
const API_BASE  = import.meta.env.VITE_API_URL ?? "https://winners-empire-eco.up.railway.app";

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set) => ({
  user:      null,
  token:     null,
  isLoading: false,

  // ── Login ──────────────────────────────────────────────────────────────────
  login: async (email, password) => {
    set({ isLoading: true });

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.message ?? "Login failed");
      }

      const { token, user }: { token: string; user: AuthUser } = await res.json();

      // Persist to localStorage
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));

      set({ token, user, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  // ── Logout ─────────────────────────────────────────────────────────────────
  logout: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    set({ user: null, token: null });
  },

  // ── Restore Session ────────────────────────────────────────────────────────
  // Called once on app mount — reads token + user from localStorage.
  // If token exists, we trust it. For production, add a /auth/me
  // endpoint call here to verify the token server-side.
  restoreSession: () => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const raw   = localStorage.getItem(USER_KEY);

      if (token && raw) {
        const user: AuthUser = JSON.parse(raw);
        set({ token, user });
      }
    } catch {
      // Corrupted storage — clear it
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns auth headers for API calls: { Authorization: "Bearer <token>" } */
export function getAuthHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/** Returns the current tenant ID from the store (used in API calls) */
export function getTenantId(): string | null {
  return useAuthStore.getState().user?.tenantId ?? null;
}