import { create } from "zustand";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  login: (email: string) => void;
  logout: () => void;
  restoreSession: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,

  login: (email: string) => {
    const mockUser = {
      id: "1",
      name: "Winner",
      email,
    };

    localStorage.setItem("user", JSON.stringify(mockUser));
    set({ user: mockUser });
  },

  logout: () => {
    localStorage.removeItem("user");
    set({ user: null });
  },

  restoreSession: () => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      set({ user: JSON.parse(storedUser) });
    }
  },
}));
