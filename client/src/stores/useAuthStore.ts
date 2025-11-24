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
    if (!token) return;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_APP_API_URL}/api/auth/me`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      set({ user: data.user });
    } catch {
      set({ user: null });
    } finally {
      set({ loading: false });
    }
  },
}));
