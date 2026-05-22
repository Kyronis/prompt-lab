import { z } from 'zod';

export const promptSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  description: z.string().max(2000).optional(),
  tags: z.array(z.string()).default([]),
  projectId: z.string().uuid().optional(),
  version: z.number().int().min(1).default(1),
  isPublic: z.boolean().default(false),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Prompt = z.infer<typeof promptSchema>;

export const createPromptSchema = promptSchema.omit({
  id: true,
  version: true,
  createdAt: true,
  updatedAt: true,
});

export type CreatePromptInput = z.infer<typeof createPromptSchema>;

export const updatePromptSchema = createPromptSchema.partial();

export type UpdatePromptInput = z.infer<typeof updatePromptSchema>;

export const projectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Project = z.infer<typeof projectSchema>;

export const createProjectSchema = projectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
