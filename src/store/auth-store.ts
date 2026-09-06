import { create } from "zustand";
import { persist } from "zustand/middleware";

type AuthState = {
  token: string | null;
  expiresAtUtc: string | null;
  setSession: (token: string, expiresAtUtc: string) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      expiresAtUtc: null,
      setSession: (token, expiresAtUtc) => set({ token, expiresAtUtc }),
      logout: () => set({ token: null, expiresAtUtc: null }),
      isAuthenticated: () => {
        const { token, expiresAtUtc } = get();
        if (!token || !expiresAtUtc) return false;
        return new Date(expiresAtUtc).getTime() > Date.now();
      },
    }),
    { name: "tm-auth" },
  ),
);
