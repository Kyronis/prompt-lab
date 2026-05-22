import { z } from 'zod';

export const modelSchema = z.object({
  id: z.string().uuid(),
  modelId: z.string().min(1).max(200),
  name: z.string().min(1).max(200),
  maxTokens: z.number().int().min(1),
  isMultimodal: z.boolean().default(false),
  supportsDeepThinking: z.boolean().default(false),
  providerId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Model = z.infer<typeof modelSchema>;

export const createModelSchema = modelSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateModelInput = z.infer<typeof createModelSchema>;

export const updateModelSchema = createModelSchema.partial();

export type UpdateModelInput = z.infer<typeof updateModelSchema>;
