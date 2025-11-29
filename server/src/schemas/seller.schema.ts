import { z } from "zod";

export const createProductSchema = z
  .object({
    name: z.string().min(1, "Product name is required"),
    category: z.string().length(24, "Invalid category ID"),
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

export const appendDescriptionSchema = z.object({
  description: z.string().min(1, "Description content is required"),
});
