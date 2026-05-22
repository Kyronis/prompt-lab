import { z } from 'zod';

export const optimizePromptRequestSchema = z.object({
  promptContent: z.string().min(1).max(10000),
  modelId: z.string().uuid(),
  context: z.string().max(5000).optional(),
});

export type OptimizePromptRequest = z.infer<typeof optimizePromptRequestSchema>;

export const optimizePromptResponseSchema = z.object({
  original: z.string(),
  optimized: z.string(),
  suggestions: z.array(z.string()),
});

export type OptimizePromptResponse = z.infer<typeof optimizePromptResponseSchema>;
