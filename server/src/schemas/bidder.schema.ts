import { z } from "zod";

export const placeBidSchema = z.object({
  productId: z.string().length(24, "Invalid product ID"),
  maxPrice: z.number().positive("Max price must be a positive number"),
  stepPrice: z.number().nonnegative().optional(),
});

export const bidHistoryQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => parseInt(val || "1")),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      const num = parseInt(val || "20");
      return num > 100 ? 100 : num; // Max 100
    }),
});

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters")
    .regex(/^[a-zA-Z0-9]+$/, "Username must contain only letters and numbers")
    .optional(),
  address: z
    .string()
    .max(200, "Address must be less than 200 characters")
    .optional()
    .or(z.literal("")),
  dateOfBirth: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  contactEmail: z.email("Invalid email format").optional().or(z.literal("")),
  avatar: z.string().url("Invalid avatar URL").optional().or(z.literal("")),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});

export const rateSellerSchema = z.object({
  score: z.union([z.literal(1), z.literal(-1)]),
  comment: z.string().min(1),
});

export const updateSellerRatingSchema = z.object({
  score: z.union([z.literal(1), z.literal(-1)]),
  comment: z.string().min(1),
});
