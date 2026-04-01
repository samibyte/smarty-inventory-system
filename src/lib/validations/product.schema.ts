import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  categoryId: z.string().min(1, 'Category is required'),
  price: z.number({ error: 'Price must be a number' }).positive('Price must be positive'),
  stockQuantity: z.number({ error: 'Stock must be a number' }).int().min(0, 'Stock cannot be negative'),
  minStockThreshold: z.number({ error: 'Threshold must be a number' }).int().min(1, 'Threshold must be at least 1'),
  status: z.enum(['active', 'out_of_stock']),
});

export type ProductInput = z.infer<typeof productSchema>;
