import { create } from "zustand";
import type { AuthUser } from "@/lib/api/types";
import { clearToken, setToken } from "@/lib/api/session";
import type { UserRole } from "@/lib/constants/enums";

interface AuthState {
  user: AuthUser | null;
  role: UserRole | null;
  status: "idle" | "loading" | "authenticated" | "guest";
  signIn: (payload: { token: string; user: AuthUser; role: UserRole }) => void;
  setUser: (user: AuthUser, role: UserRole) => void;
  signOut: () => void;
  setStatus: (status: AuthState["status"]) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  status: "idle",
  signIn: ({ token, user, role }) => {
    setToken(token);
    set({ user, role, status: "authenticated" });
  },
  setUser: (user, role) => set({ user, role, status: "authenticated" }),
  signOut: () => {
    clearToken();
    set({ user: null, role: null, status: "guest" });
  },
  setStatus: (status) => set({ status }),
}));
