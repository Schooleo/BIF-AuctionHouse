import { z } from 'zod';

export const placeBidSchema = z.object({
  productId: z.string().length(24, 'Invalid product ID'),
  price: z.number().positive('Price must be a positive'),
});

export const bidHistoryQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => parseInt(val || '1')),
  limit: z
    .string()
    .optional()
    .transform((val) => {
      const num = parseInt(val || '20');
      return num > 100 ? 100 : num; // Max 100
    }),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
  dateOfBirth: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  contactEmail: z.string().email().optional().or(z.literal('')),
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
