import { z } from "zod";
import { paginationSchema } from "./pagination.schema";

export const viewProductsSchema = paginationSchema.extend({
  q: z.string().optional(),
  category: z.string().optional(),

  sort: z
    .enum(["default", "endingSoon", "mostBidOn", "highestPriced"])
    .optional()
    .default("default"),

  newMinutes: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : undefined))
    .pipe(z.number().int().min(1).max(6000).optional()),
});

export type viewProductsSchema = z.infer<typeof viewProductsSchema>;
