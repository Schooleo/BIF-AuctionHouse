import { z } from 'zod';

export const placeBidSchema = z.object({
    productId: z.string().length(24, 'Invalid product ID'),
    price: z.number().positive('Price must be a positive'),
})

export const bidHistoryQuerySchema = z.object({
  page: z.string().optional().transform(val => parseInt(val || '1')),
  limit: z.string().optional().transform(val => {
    const num = parseInt(val || '20');
    return num > 100 ? 100 : num;  // Max 100
  })
});