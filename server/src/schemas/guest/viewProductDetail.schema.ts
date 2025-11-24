// src/schemas/guest/viewProductDetail.schema.ts
import { z } from "zod";

export const viewProductDetailParamsSchema = z.object({
  id: z.string().regex(/^[a-fA-F0-9]{24}$/, "Invalid product ID"),
});

export const viewProductDetailQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(20),
});
