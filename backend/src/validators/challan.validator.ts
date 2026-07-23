import { z } from 'zod';

const challanItemSchema = z.object({
  productId: z.string().uuid('A valid product is required'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
});

export const createChallanSchema = z.object({
  body: z.object({
    customerId: z.string().uuid('A valid customer is required'),
    status: z.enum(['DRAFT', 'CONFIRMED']).optional(),
    items: z.array(challanItemSchema).min(1, 'At least one product line is required'),
  }),
  query: z.any().optional(),
  params: z.any().optional(),
});

export const updateChallanStatusSchema = z.object({
  body: z.object({
    status: z.enum(['DRAFT', 'CONFIRMED', 'CANCELLED']),
  }),
  query: z.any().optional(),
  params: z.object({ id: z.string().uuid() }),
});
