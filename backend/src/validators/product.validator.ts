import { z } from 'zod';

const productBase = {
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  sku: z.string().min(1, 'SKU/code is required'),
  category: z.string().optional(),
  unitPrice: z.number().nonnegative('Unit price cannot be negative'),
  minStockAlert: z.number().int().nonnegative().optional(),
  location: z.string().optional(),
};

export const createProductSchema = z.object({
  body: z.object({
    ...productBase,
    currentStock: z.number().int().nonnegative().optional(),
  }),
  query: z.any().optional(),
  params: z.any().optional(),
});

export const updateProductSchema = z.object({
  body: z.object(productBase).partial(),
  query: z.any().optional(),
  params: z.object({ id: z.string().uuid() }),
});

export const stockMovementSchema = z.object({
  body: z.object({
    quantity: z.number().int().positive('Quantity must be a positive number'),
    movementType: z.enum(['IN', 'OUT']),
    reason: z.string().optional(),
  }),
  query: z.any().optional(),
  params: z.object({ id: z.string().uuid() }),
});
