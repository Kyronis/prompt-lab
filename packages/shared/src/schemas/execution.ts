import { z } from 'zod';

export const promptExecutionSchema = z.object({
  id: z.string().uuid(),
  promptContent: z.string(),
  userInput: z.string().nullable(),
  modelId: z.string().uuid(),
  temperature: z.number().min(0).max(2),
  maxTokens: z.number().int().min(1).nullable(),
  result: z.string().nullable(),
  error: z.string().nullable(),
  durationMs: z.number().int().nullable(),
  promptVersion: z.number().int().nullable(),
  promptId: z.string().uuid().nullable(),
  userId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
});

export type PromptExecution = z.infer<typeof promptExecutionSchema>;

export const executePromptSchema = z.object({
  promptId: z.string().uuid().optional(),
  promptContent: z.string().min(1).max(10000),
  userInput: z.string().max(10000).optional(),
  modelId: z.string().uuid(),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().int().min(1).max(128000).optional(),
});

export type ExecutePromptInput = z.infer<typeof executePromptSchema>;
