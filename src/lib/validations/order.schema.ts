import { z } from 'zod';

export const orderItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number({ error: 'Quantity must be a number' }).int().min(1, 'Quantity must be at least 1'),
});

export const orderSchema = z.object({
  customerName: z.string().min(2, 'Customer name must be at least 2 characters').max(100),
  items: z.array(orderItemSchema).min(1, 'Add at least one product'),
});

export type OrderInput = z.infer<typeof orderSchema>;
