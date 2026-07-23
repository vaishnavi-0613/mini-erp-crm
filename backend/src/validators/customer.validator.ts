import { z } from 'zod';

const customerBase = {
  name: z.string().min(2, 'Customer name must be at least 2 characters'),
  mobile: z.string().min(7, 'A valid mobile number is required').max(15),
  email: z.string().email().optional().or(z.literal('')).optional(),
  businessName: z.string().optional(),
  gstNumber: z.string().optional(),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']).optional(),
  address: z.string().optional(),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']).optional(),
  followUpDate: z.string().datetime().optional().or(z.literal('')).optional(),
};

export const createCustomerSchema = z.object({
  body: z.object(customerBase),
  query: z.any().optional(),
  params: z.any().optional(),
});

export const updateCustomerSchema = z.object({
  body: z.object(customerBase).partial(),
  query: z.any().optional(),
  params: z.object({ id: z.string().uuid() }),
});

export const addNoteSchema = z.object({
  body: z.object({
    note: z.string().min(1, 'Note text is required'),
  }),
  query: z.any().optional(),
  params: z.object({ id: z.string().uuid() }),
});
