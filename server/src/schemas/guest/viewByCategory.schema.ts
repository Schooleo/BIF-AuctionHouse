import { z } from "zod";
import { paginationSchema } from "./pagination.schema";

export const viewByCategoryQuerySchema = paginationSchema.extend({
  category: z.string().min(1, "Category is required"),
});

export type ViewByCategoryQuery = z.infer<typeof viewByCategoryQuerySchema>;
