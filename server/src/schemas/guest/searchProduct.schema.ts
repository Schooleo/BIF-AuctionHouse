import { z } from "zod";
import { paginationSchema } from "./pagination.schema";

export const searchProductsQuerySchema = paginationSchema.extend({
  q: z.string().optional(),
  category: z.string().optional(),

  sort: z
    .enum([
      "relevance",
      "endDesc",
      "endAsc",
      "priceAsc",
      "priceDesc",
      "createdDesc",
    ])
    .optional()
    .default("relevance"),

  newMinutes: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .pipe(z.number().int().min(1).max(6000).optional()),
});

export type SearchProductsQuery = z.infer<typeof searchProductsQuerySchema>;
