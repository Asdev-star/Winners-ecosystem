import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import { AUTH_TOKEN_KEY, clearAuthToken, getAuthToken, setAuthToken } from "../services/api";

export type MobileUser = {
  id: string;
  name: string;
  email: string;
  role: "member" | "admin" | "owner";
  tenantId?: string;
  tenantName?: string;
};

type AuthState = {
  user: MobileUser | null;
  token: string | null;
  isRestoring: boolean;
  hasCompletedOnboarding: boolean;
  login: (token: string, user: MobileUser) => Promise<void>;
  setToken: (token: string | null) => Promise<void>;
  logout: () => void;
  completeOnboarding: () => void;
  restoreSession: () => Promise<void>;
};

const DEMO_USER: MobileUser = {
  id: "mobile-demo-user",
  name: "Amina Njeri",
  email: "amina@winnersempire.com",
  role: "owner",
};

const SESSION_KEY = AUTH_TOKEN_KEY;
const ONBOARDING_KEY = "winners-mobile-onboarding";

async function persistSession(user: MobileUser, token: string) {
  await setAuthToken(token);
  await AsyncStorage.setItem("winners-mobile-user", JSON.stringify(user));
}

function normalizeUser(user: MobileUser): MobileUser {
  return {
    ...user,
    role: user.role.toLowerCase() as MobileUser["role"],
  };
}

async function readSession() {
  const token = await getAuthToken();
  if (!token) {
    return null;
  }

  try {
    const rawUser = await AsyncStorage.getItem("winners-mobile-user");
    const user = rawUser ? (JSON.parse(rawUser) as MobileUser) : DEMO_USER;
    return { user, token };
  } catch {
    await SecureStore.deleteItemAsync(SESSION_KEY);
    return null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isRestoring: false,
  hasCompletedOnboarding: false,

  login: async (token, user) => {
    const normalizedUser = normalizeUser(user);
    await persistSession(normalizedUser, token);
    set({
      user: normalizedUser,
      token,
    });
  },

  setToken: async (token) => {
    if (!token) {
      await clearAuthToken();
      set({ token: null, user: null });
      return;
    }

    await persistSession(DEMO_USER, token);
    set({
      token,
      user: DEMO_USER,
    });
  },

  logout: () => {
    void clearAuthToken();
    void AsyncStorage.removeItem(ONBOARDING_KEY);
    void AsyncStorage.removeItem("winners-mobile-user");
    set({
      user: null,
      token: null,
      hasCompletedOnboarding: false,
    });
  },

  completeOnboarding: () => {
    void AsyncStorage.setItem(ONBOARDING_KEY, "true");
    set({ hasCompletedOnboarding: true });
  },

  restoreSession: async () => {
    set({ isRestoring: true });
    const [session, onboardingFlag] = await Promise.all([
      readSession(),
      AsyncStorage.getItem(ONBOARDING_KEY),
    ]);

    set({
      user: session?.user ?? null,
      token: session?.token ?? null,
      hasCompletedOnboarding: onboardingFlag === "true",
      isRestoring: false,
    });
  },
}));
