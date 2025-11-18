export interface TokenPayload {
  id: string;
  role: "bidder" | "seller" | "admin";
  email: string;
}

export interface JwtPayload {
  id: string;
  role: "bidder" | "seller" | "admin";
  email: string;
  iat?: number;
  exp?: number;
}

export interface RequestOtpBody {
  email: string;
  from: "register" | "reset-password";
}

export interface RegisterBody {
  name: string;
  email: string;
  password: string;
  address: string;
  otp: string;
  recaptchaToken: string;
}

export interface LoginBody {
  email: string;
  password: string;
}

export interface RequestPasswordResetBody {
  email: string;
}

export interface ResetPasswordBody {
  email: string;
  otp: string;
  password: string;
}
