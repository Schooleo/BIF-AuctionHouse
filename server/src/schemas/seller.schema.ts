import { z } from "zod";
import { SellerMessages } from "../constants/messages";

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

export const viewSellerProductsSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).optional().default(12),
  search: z.string().optional().default(""),
  sortBy: z.string().optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  status: z.enum(["all", "ongoing", "ended"]).optional().default("all"),
});

export const updateSellerProfileSchema = z.object({
  name: z.string().min(1).optional(),
  address: z.string().min(1).optional(),
});

export const changeSellerPasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});
export const rejectBidderParamsSchema = z.object({
  productId: z.string().length(24, "Invalid product ID"),
  bidderId: z.string().length(24, "Invalid bidder ID"),
});

export const answerQuestionParamsSchema = z.object({
  productId: z.string().length(24, "Invalid product ID"),
  questionId: z.string().length(24, "Invalid question ID"),
});

export const answerQuestionBodySchema = z.object({
  answer: z
    .string()
    .min(1, SellerMessages.ANSWER_REQUIRED)
    .max(2000, "Answer must be at most 2000 characters"),
});

export const productIdParamsSchema = z.object({
  productId: z.string().length(24, "Invalid product ID"),
});

export const sellerBidHistoryQuerySchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(10),
});
