import { z } from 'zod';

export const categorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
});

export type CategoryInput = z.infer<typeof categorySchema>;
