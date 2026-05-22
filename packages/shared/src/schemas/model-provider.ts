import { z } from 'zod';

export const modelProviderSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  providerId: z.string().min(1).max(100),
  baseUrl: z.string().url(),
  apiKey: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ModelProvider = z.infer<typeof modelProviderSchema>;

export const createModelProviderSchema = modelProviderSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateModelProviderInput = z.infer<typeof createModelProviderSchema>;

export const updateModelProviderSchema = createModelProviderSchema.partial();

export type UpdateModelProviderInput = z.infer<typeof updateModelProviderSchema>;
