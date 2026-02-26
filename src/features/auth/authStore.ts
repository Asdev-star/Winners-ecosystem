// src/features/auth/authStore.ts

import { create } from "zustand";


import { API_BASE } from "../../lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthUser {
  id:         string;
  email:      string;
  name:       string;
  role:       "owner" | "admin" | "member" | "viewer";
  tenantId:   string;
  tenantName: string;
  twoFactorEnabled?: boolean;
  avatarUrl?:        string;
}

export type TwoFactorMethod = "totp" | "email_otp";

interface AuthState {
  user:              AuthUser | null;
  token:             string | null;
  isLoading:         boolean;
  isRestoring:       boolean;

  // 2FA pending state — set after login when server requires 2FA
  pendingTwoFactor:  { userId: string; method: TwoFactorMethod } | null;

  login:             (email: string, password: string) => Promise<void>;
  verifyTwoFactor:   (code: string) => Promise<void>;
  loginWithGoogle:   (googleToken: string) => Promise<void>;
  logout:            () => void;
  restoreSession:    () => Promise<void>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOKEN_KEY = "we_token";        // we = Winners Ecosystem
const USER_KEY  = "we_user";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function persist(token: string, user: AuthUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearPersisted() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.message ?? `Request failed: ${res.status}`);
  return body;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>((set, get) => ({
  user:             null,
  token:            null,
  isLoading:        false,
  isRestoring:      true,
  pendingTwoFactor: null,

  // ── Email / Password Login ─────────────────────────────────────────────────
  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const body = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      // Server requires 2FA — store pending state, don't set user yet
      if (body.requiresTwoFactor) {
        set({
          isLoading: false,
          pendingTwoFactor: {
            userId: body.userId,
            method: body.method as TwoFactorMethod,
          },
        });
        return;
      }

      const { token, user }: { token: string; user: AuthUser } = body;
      persist(token, user);
      set({ token, user, isLoading: false, pendingTwoFactor: null });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  // ── 2FA Verification ───────────────────────────────────────────────────────
  verifyTwoFactor: async (code) => {
    const { pendingTwoFactor } = get();
    if (!pendingTwoFactor) throw new Error("No pending 2FA session");

    set({ isLoading: true });
    try {
      const body = await apiFetch("/auth/2fa/verify", {
        method: "POST",
        body: JSON.stringify({ userId: pendingTwoFactor.userId, code }),
      });

      const { token, user }: { token: string; user: AuthUser } = body;
      persist(token, user);
      set({ token, user, isLoading: false, pendingTwoFactor: null });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  // ── Google OAuth ───────────────────────────────────────────────────────────
  // Completes OAuth login using a backend-issued JWT access token.
  loginWithGoogle: async (googleToken) => {
    set({ isLoading: true });
    try {
      const body = await apiFetch("/auth/me", {
        headers: { Authorization: `Bearer ${googleToken}` },
      });
      const user: AuthUser = body.user ?? body;
      persist(googleToken, user);
      set({ token: googleToken, user, isLoading: false, pendingTwoFactor: null });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  // ── Logout ─────────────────────────────────────────────────────────────────
  logout: () => {
    clearPersisted();
    set({ user: null, token: null, pendingTwoFactor: null });
  },

  // ── Restore Session ────────────────────────────────────────────────────────
  // Reads persisted token, then verifies it server-side via /auth/me.
  // If the token is expired or revoked, clears storage and forces re-login.
  restoreSession: async () => {
    set({ isRestoring: true });
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        set({ isRestoring: false });
        return;
      }

      // Verify token server-side — get fresh user data
      const body = await apiFetch("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const user: AuthUser = body.user ?? body;
      persist(token, user);
      set({ token, user, isRestoring: false });
    } catch {
      // Token invalid or expired — clear everything
      clearPersisted();
      set({ user: null, token: null, isRestoring: false });
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

/** Returns true if the current user has at least the given role */
export function hasRole(minimum: AuthUser["role"]): boolean {
  const role = useAuthStore.getState().user?.role;
  if (!role) return false;
  const hierarchy: AuthUser["role"][] = ["viewer", "member", "admin", "owner"];
  return hierarchy.indexOf(role) >= hierarchy.indexOf(minimum);
}
