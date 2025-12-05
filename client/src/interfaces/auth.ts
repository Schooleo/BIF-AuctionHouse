export interface User {
  id: string;
  name: string;
  email: string;
  role: "bidder" | "seller" | "admin";
  address?: string;
  createdAt: string;
  updatedAt: string;
  positiveRatings?: number;
  negativeRatings?: number;
}

export interface AuthStore {
  user: User | null;
  token: string | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setLoading: (value: boolean) => void;

  login: (data: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export interface RequestOtpDto {
  email: string;
  from: "register" | "reset-password";
}

export interface RegisterDto {
  name: string;
  email: string;
  password: string;
  address?: string;
  otp: string;
  recaptchaToken: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RequestPasswordResetDto {
  email: string;
}

export interface ResetPasswordDto {
  email: string;
  otp: string;
  password: string;
}

export interface AuthResponse {
  user?: User;
  token?: string;
  message?: string;
}
