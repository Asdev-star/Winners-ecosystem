import { create } from "zustand";

const bootStartedAt = globalThis.performance?.now?.() ?? Date.now();

function now() {
  return globalThis.performance?.now?.() ?? Date.now();
}

type PendingNavigation = {
  source: string;
  startedAt: number;
};

type QAState = {
  launchReadyMs: number | null;
  currentRoute: string;
  lastNavigationMs: number | null;
  lastNavigationSource: string | null;
  pendingNavigation: PendingNavigation | null;
  panelOpen: boolean;
  markAppReady: (route: string) => void;
  markNavigationStart: (source: string) => void;
  completeNavigation: (route: string) => void;
  togglePanel: () => void;
  closePanel: () => void;
  resetNavigationMetric: () => void;
};

export const useQAStore = create<QAState>((set) => ({
  launchReadyMs: null,
  currentRoute: "Boot",
  lastNavigationMs: null,
  lastNavigationSource: null,
  pendingNavigation: null,
  panelOpen: false,

  markAppReady: (route) =>
    set((state) => ({
      currentRoute: route,
      launchReadyMs: state.launchReadyMs ?? Math.round(now() - bootStartedAt),
    })),

  markNavigationStart: (source) =>
    set({
      pendingNavigation: {
        source,
        startedAt: now(),
      },
    }),

  completeNavigation: (route) =>
    set((state) => {
      const pending = state.pendingNavigation;

      return {
        currentRoute: route,
        lastNavigationMs: pending ? Math.round(now() - pending.startedAt) : state.lastNavigationMs,
        lastNavigationSource: pending?.source ?? state.lastNavigationSource,
        pendingNavigation: null,
      };
    }),

  togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),
  closePanel: () => set({ panelOpen: false }),
  resetNavigationMetric: () =>
    set({
      lastNavigationMs: null,
      lastNavigationSource: null,
      pendingNavigation: null,
    }),
}));
