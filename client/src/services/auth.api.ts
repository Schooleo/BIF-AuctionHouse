import type {
  RequestOtpDto,
  RegisterDto,
  LoginDto,
  RequestPasswordResetDto,
  ResetPasswordDto,
  AuthResponse,
} from "@interfaces/auth";
import { handleResponse } from "@utils/handleResponse";
const API_BASE = import.meta.env.VITE_APP_API_URL || "";

export const authApi = {
  requestOtp: async (data: RequestOtpDto): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE}/api/auth/request-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  register: async (data: RegisterDto): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  login: async (data: LoginDto): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  requestPasswordReset: async (
    data: RequestPasswordResetDto
  ): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  resetPassword: async (data: ResetPasswordDto): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE}/api/auth/reset-password`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },
};
