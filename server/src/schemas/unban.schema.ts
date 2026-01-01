import { z } from "zod";

export const createUnbanRequestSchema = z.object({
  title: z
    .string()
    .min(10, "Title must be at least 10 characters")
    .max(100, "Title must not exceed 100 characters")
    .trim(),
  details: z
    .string()
    .min(50, "Details must be at least 50 characters")
    .max(500, "Details must not exceed 500 characters")
    .trim(),
});

export const processUnbanRequestSchema = z.object({
  adminNote: z.string().trim().optional(),
});

export type CreateUnbanRequestDto = z.infer<typeof createUnbanRequestSchema>;
export type ProcessUnbanRequestDto = z.infer<typeof processUnbanRequestSchema>;
