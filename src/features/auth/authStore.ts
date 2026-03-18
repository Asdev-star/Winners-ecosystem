import { create } from "zustand";
import { API_BASE } from "../../lib/api";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "member" | "viewer";
  tenantId: string;
  tenantName: string;
  isImpersonation?: boolean;
  impersonatedByAdminId?: string;
  twoFactorEnabled?: boolean;
  avatarUrl?: string;
  country?: string | null;
  city?: string | null;
  bio?: string | null;
  skills?: string[] | null;
  industry?: string | null;
  isPublicProfile?: boolean;
  profileViews?: number;
}

export type TwoFactorMethod = "totp" | "email_otp";

export interface ImpersonationSession {
  originalToken: string;
  originalUser: AuthUser;
  adminId: string;
  targetTenantId: string;
  targetUserId: string;
  startedAt: string;
  returnToPath?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  impersonation: ImpersonationSession | null;
  isLoading: boolean;
  isRestoring: boolean;
  pendingTwoFactor: { userId: string; method: TwoFactorMethod } | null;
  login: (email: string, password: string) => Promise<void>;
  verifyTwoFactor: (code: string) => Promise<void>;
  loginWithGoogle: (googleToken: string) => Promise<void>;
  beginImpersonation: (
    token: string,
    user: AuthUser,
    session: Omit<ImpersonationSession, "originalToken" | "originalUser" | "startedAt">,
  ) => void;
  endImpersonation: () => void;
  logout: () => void;
  restoreSession: () => Promise<void>;
}

const TOKEN_KEY = "we_token";
const USER_KEY = "we_user";
const IMPERSONATION_KEY = "we_impersonation";

function persist(token: string, user: AuthUser, impersonation?: ImpersonationSession | null) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));

  if (impersonation === undefined) return;

  if (impersonation) {
    localStorage.setItem(IMPERSONATION_KEY, JSON.stringify(impersonation));
    return;
  }

  localStorage.removeItem(IMPERSONATION_KEY);
}

function clearPersisted() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(IMPERSONATION_KEY);
}

function readPersistedImpersonation(): ImpersonationSession | null {
  const raw = localStorage.getItem(IMPERSONATION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as ImpersonationSession;
    if (!parsed.originalToken || !parsed.originalUser?.id || !parsed.targetTenantId || !parsed.targetUserId) {
      localStorage.removeItem(IMPERSONATION_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(IMPERSONATION_KEY);
    return null;
  }
}

function matchesImpersonationSession(user: AuthUser, impersonation: ImpersonationSession | null) {
  if (!impersonation) return false;
  return user.id === impersonation.targetUserId && user.tenantId === impersonation.targetTenantId;
}

function applyImpersonationMetadata(user: AuthUser, impersonation: ImpersonationSession | null): AuthUser {
  if (!matchesImpersonationSession(user, impersonation)) return user;

  return {
    ...user,
    isImpersonation: true,
    impersonatedByAdminId: user.impersonatedByAdminId ?? impersonation.adminId,
  };
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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  impersonation: null,
  isLoading: false,
  isRestoring: true,
  pendingTwoFactor: null,

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const body = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

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
      persist(token, user, null);
      set({ token, user, impersonation: null, isLoading: false, pendingTwoFactor: null });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

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
      persist(token, user, null);
      set({ token, user, impersonation: null, isLoading: false, pendingTwoFactor: null });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  loginWithGoogle: async (googleToken) => {
    set({ isLoading: true });
    try {
      const body = await apiFetch("/auth/me", {
        headers: { Authorization: `Bearer ${googleToken}` },
      });

      const user: AuthUser = body.user ?? body;
      persist(googleToken, user, null);
      set({ token: googleToken, user, impersonation: null, isLoading: false, pendingTwoFactor: null });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  beginImpersonation: (token, user, session) => {
    const state = get();
    const originalToken = state.impersonation?.originalToken ?? state.token;
    const originalUser = state.impersonation?.originalUser ?? state.user;

    if (!originalToken || !originalUser) {
      throw new Error("No admin session available to start impersonation");
    }

    const impersonation: ImpersonationSession = {
      originalToken,
      originalUser,
      adminId: session.adminId,
      targetTenantId: session.targetTenantId,
      targetUserId: session.targetUserId,
      startedAt: new Date().toISOString(),
      returnToPath: session.returnToPath,
    };

    const impersonationUser = applyImpersonationMetadata(user, impersonation);
    persist(token, impersonationUser, impersonation);
    set({
      token,
      user: impersonationUser,
      impersonation,
      pendingTwoFactor: null,
      isLoading: false,
      isRestoring: false,
    });
  },

  endImpersonation: () => {
    const { impersonation } = get();
    if (!impersonation) return;

    persist(impersonation.originalToken, impersonation.originalUser, null);
    set({
      token: impersonation.originalToken,
      user: impersonation.originalUser,
      impersonation: null,
      pendingTwoFactor: null,
      isLoading: false,
      isRestoring: false,
    });
  },

  logout: () => {
    clearPersisted();
    set({ user: null, token: null, impersonation: null, pendingTwoFactor: null });
  },

  restoreSession: async () => {
    set({ isRestoring: true });
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const impersonation = readPersistedImpersonation();

      if (!token) {
        clearPersisted();
        set({ isRestoring: false });
        return;
      }

      const body = await apiFetch("/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const user: AuthUser = applyImpersonationMetadata(body.user ?? body, impersonation);
      const activeImpersonation = matchesImpersonationSession(user, impersonation) ? impersonation : null;

      persist(token, user, activeImpersonation);
      set({ token, user, impersonation: activeImpersonation, isRestoring: false });
    } catch {
      clearPersisted();
      set({ user: null, token: null, impersonation: null, isRestoring: false });
    }
  },
}));

export function getAuthHeaders(): Record<string, string> {
  const token = useAuthStore.getState().token;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function getTenantId(): string | null {
  return useAuthStore.getState().user?.tenantId ?? null;
}

export function hasRole(minimum: AuthUser["role"]): boolean {
  const role = useAuthStore.getState().user?.role;
  if (!role) return false;
  const hierarchy: AuthUser["role"][] = ["viewer", "member", "admin", "owner"];
  return hierarchy.indexOf(role) >= hierarchy.indexOf(minimum);
}
