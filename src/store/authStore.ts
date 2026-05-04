import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ApiUser, AuthSession, BackendUserRole, UserRole } from "@/types";

interface AuthState {
  lastActivityAt: number | null;
  lastSessionRefreshAt: number | null;
  user: ApiUser | null;
  setSession: (session: AuthSession) => void;
  setUser: (user: ApiUser) => void;
  touchSession: (at?: number) => void;
  clearSession: () => void;
}

type PersistedAuthState = Pick<AuthState, "lastActivityAt" | "lastSessionRefreshAt" | "user">;

export const mapBackendRoleToUiRole = (role: BackendUserRole): UserRole =>
  role === "FABRICA" ? "gif" : "coordinador";

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      lastActivityAt: null,
      lastSessionRefreshAt: null,
      user: null,
      setSession: (session) => {
        const now = Date.now();
        set({ lastActivityAt: now, lastSessionRefreshAt: now, user: session.user });
      },
      setUser: (user) => set({ lastActivityAt: Date.now(), user }),
      touchSession: (at = Date.now()) => set({ lastActivityAt: at }),
      clearSession: () => set({ lastActivityAt: null, lastSessionRefreshAt: null, user: null }),
    }),
    {
      name: "carga-lms-auth",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        lastActivityAt: state.lastActivityAt,
        lastSessionRefreshAt: state.lastSessionRefreshAt,
        user: state.user,
      }),
      migrate: (persistedState, version): PersistedAuthState => {
        if (version < 2) {
          return { lastActivityAt: null, lastSessionRefreshAt: null, user: null };
        }

        const state = persistedState as Partial<PersistedAuthState>;
        return {
          lastActivityAt: state.lastActivityAt ?? null,
          lastSessionRefreshAt: state.lastSessionRefreshAt ?? null,
          user: state.user ?? null,
        };
      },
    },
  ),
);
