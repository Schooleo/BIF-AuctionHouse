import { z } from "zod";

export const requestOtpSchema = z.object({
  email: z.email(),
  from: z.enum(["register", "reset-password"]),
});

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.email(),
  password: z.string().min(8),
  address: z.string().min(1),
  otp: z.string().length(6),
  recaptchaToken: z.string().min(1),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const requestPasswordResetSchema = z.object({
  email: z.email(),
});

export const resetPasswordSchema = z.object({
  email: z.email(),
  otp: z.string().length(6),
  password: z.string().min(8),
});
