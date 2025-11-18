export interface RequestOtpDto {
  email: string;
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
  token?: string;
  message?: string;
}
