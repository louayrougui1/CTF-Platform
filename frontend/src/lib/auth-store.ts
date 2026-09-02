import { create } from "zustand";

export type AuthUser = {
  id: string;
  email: string;
  username: string;
  googleId?: string | null;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
};

const TOKEN_KEY = "ctf.access_token";
const USER_KEY = "ctf.user";

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  hydrated: boolean;
  setSession: (token: string, user?: AuthUser | null) => void;
  setUser: (user: AuthUser) => void;
  setToken: (token: string | null) => void;
  clear: () => void;
  hydrate: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  hydrated: false,
  setSession: (token, user) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(TOKEN_KEY, token);
      if (user) window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    set((s) => ({ token, user: user ?? s.user }));
  },
  setUser: (user) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
    set({ user });
  },
  setToken: (token) => {
    if (typeof window !== "undefined") {
      if (token) window.localStorage.setItem(TOKEN_KEY, token);
      else window.localStorage.removeItem(TOKEN_KEY);
    }
    set({ token });
  },
  clear: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_KEY);
      window.localStorage.removeItem(USER_KEY);
    }
    set({ token: null, user: null });
  },
  hydrate: () => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem(TOKEN_KEY);
    const rawUser = window.localStorage.getItem(USER_KEY);
    let user: AuthUser | null = null;
    try {
      user = rawUser ? (JSON.parse(rawUser) as AuthUser) : null;
    } catch {
      user = null;
    }
    set({ token, user, hydrated: true });
  },
}));

/** Non-reactive accessors used by the axios interceptors. */
export const authTokens = {
  get: () => useAuthStore.getState().token,
  set: (token: string | null) => useAuthStore.getState().setToken(token),
  clear: () => useAuthStore.getState().clear(),
};
