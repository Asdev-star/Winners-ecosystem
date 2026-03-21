import { create } from 'zustand';

// Placeholder for shared store implementation
export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  login: (user: any, token: string) => set({ user, token }),
  logout: () => set({ user: null, token: null }),
}));