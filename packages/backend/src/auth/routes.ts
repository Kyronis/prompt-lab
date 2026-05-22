import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { signToken } from './jwt.js';
import { loginSchema, registerSchema } from '@prompt-lab/shared';
import bcrypt from 'bcryptjs';

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const data = registerSchema.parse(request.body);
    const existing = await db.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return reply.status(409).send({ error: 'Email already registered' });
    }
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await db.user.create({
      data: { email: data.email, password: passwordHash, name: data.name },
    });
    const token = signToken({ sub: user.id, email: user.email, name: user.name, role: user.role as 'USER' | 'ADMIN' });
    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  });

  app.post('/login', async (request, reply) => {
    const data = loginSchema.parse(request.body);
    const user = await db.user.findUnique({ where: { email: data.email } });
    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }
    const valid = await bcrypt.compare(data.password, user.password);
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' });
    }
    const token = signToken({ sub: user.id, email: user.email, name: user.name, role: user.role as 'USER' | 'ADMIN' });
    return { token, user: { id: user.id, email: user.email, name: user.name, role: user.role } };
  });
}
