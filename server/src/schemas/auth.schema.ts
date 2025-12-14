import { z } from "zod";

export const requestOtpSchema = z.object({
  email: z.email(),
  from: z.enum(["register", "reset-password"]),
});

export const registerSchema = z.object({
  name: z
    .string()
    .min(3)
    .max(15)
    .regex(/^[a-zA-Z0-9]+$/, "Username must contain only letters and numbers"),
  email: z.email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Password must contain at least one special character"
    ),
  address: z
    .string()
    .min(15, "Address must be at least 15 characters long")
    .optional()
    .or(z.literal("")),
  otp: z.string().length(6).regex(/^[0-9]+$/, "OTP must be numeric"),
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
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(
      /[!@#$%^&*(),.?":{}|<>]/,
      "Password must contain at least one special character"
    ),
});
