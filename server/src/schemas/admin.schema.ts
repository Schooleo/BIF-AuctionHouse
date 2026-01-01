import { z } from "zod";

export const createProductSchema = z
  .object({
    name: z.string().min(1, "Product name is required"),
    category: z.string().length(24, "Invalid category ID"),
    sellerId: z.string().length(24, "Invalid seller ID"),
    mainImage: z.url("Invalid main image URL"),
    subImages: z
      .array(z.url("Invalid sub image URL"))
      .min(3, "At least 3 sub images are required"),
    description: z.string().min(1, "Description is required"),
    endTime: z.coerce.date().refine((date) => date > new Date(), {
      message: "End time must be in the future",
    }),
    startingPrice: z.number().positive("Starting price must be positive"),
    stepPrice: z.number().positive("Step price must be positive"),
    buyNowPrice: z
      .number()
      .positive("Buy now price must be positive")
      .optional(),
    autoExtends: z.boolean().optional(),
    allowUnratedBidders: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.buyNowPrice) {
        return data.buyNowPrice > data.startingPrice;
      }
      return true;
    },
    {
      message: "Buy now price must be greater than starting price",
      path: ["buyNowPrice"],
    }
  );

  export const updateProductSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  category: z.string().length(24).optional(),
  mainImage: z.string().url().optional(),
  subImages: z.array(z.string().url()).min(3).max(10).optional(),
  description: z.string().min(1).optional(),
  endTime: z.string().datetime().optional(),
  startingPrice: z.number().positive().optional(),
  stepPrice: z.number().positive().optional(),
  buyNowPrice: z.number().positive().optional(),
  autoExtends: z.boolean().optional(),
  allowUnratedBidders: z.boolean().optional(),
});

export const extendEndTimeSchema = z.object({
  endTime: z.string().datetime(),
});