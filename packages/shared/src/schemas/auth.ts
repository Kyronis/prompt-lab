import { z } from 'zod';

export const tokenPayloadSchema = z.object({
  sub: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['USER', 'ADMIN']),
  iat: z.number(),
  exp: z.number(),
});

export type TokenPayload = z.infer<typeof tokenPayloadSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(100),
});

export type RegisterInput = z.infer<typeof registerSchema>;
