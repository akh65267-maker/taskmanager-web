import { create } from "zustand";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
};

type AuthState = {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
    }
    set({ user: null });
  },
}));
