import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export type MobileUser = {
  id: string;
  name: string;
  email: string;
  role: "member" | "admin" | "owner";
};

type AuthState = {
  user: MobileUser | null;
  token: string | null;
  isRestoring: boolean;
  hasCompletedOnboarding: boolean;
  login: (mode: "biometric" | "password") => Promise<void>;
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

const SESSION_KEY = "winners-mobile-session";
const ONBOARDING_KEY = "winners-mobile-onboarding";

async function persistSession(user: MobileUser, token: string) {
  await SecureStore.setItemAsync(
    SESSION_KEY,
    JSON.stringify({
      user,
      token,
    }),
  );
}

async function readSession() {
  const raw = await SecureStore.getItemAsync(SESSION_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as { user: MobileUser; token: string };
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

  login: async (mode) => {
    const token = `demo-${mode}-token`;
    await persistSession(DEMO_USER, token);
    set({
      user: DEMO_USER,
      token,
    });
  },

  logout: () => {
    void SecureStore.deleteItemAsync(SESSION_KEY);
    void AsyncStorage.removeItem(ONBOARDING_KEY);
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
