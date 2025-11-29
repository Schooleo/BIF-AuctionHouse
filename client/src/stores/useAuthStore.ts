import { create } from "zustand";
import type {
  AuthStore,
  AuthResponse,
  LoginDto,
  RegisterDto,
} from "@interfaces/auth";
import { authApi } from "@services/auth.api";

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: localStorage.getItem("token"),
  loading: true,

  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setLoading: (loading) => set({ loading }),

  login: async (data: LoginDto) => {
    const res: AuthResponse = await authApi.login(data);
    if (res.token && res.user) {
      localStorage.setItem("token", res.token);
      set({ token: res.token, user: res.user });
    }
  },

  register: async (data: RegisterDto) => {
    const res: AuthResponse = await authApi.register(data);
    if (res.token && res.user) {
      localStorage.setItem("token", res.token);
      set({ token: res.token, user: res.user });
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    set({ token: null, user: null });
  },

  refreshUser: async () => {
    const token = get().token;
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      console.log("Refreshing user with token:", token);
      const res = await fetch(
        `${import.meta.env.VITE_APP_API_URL}/api/auth/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log("Refresh user response status:", res.status);
      if (!res.ok) {
        throw new Error("Failed to fetch user");
      }
      const data = await res.json();
      console.log("Refresh user data:", data);
      set({ user: data.user });
    } catch (error) {
      console.error("Refresh user error:", error);
      set({ user: null });
    } finally {
      set({ loading: false });
    }
  },
}));
