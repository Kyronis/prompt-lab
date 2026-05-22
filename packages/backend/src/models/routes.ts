import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { authenticate } from '../auth/authenticate.js';
import { createModelSchema, updateModelSchema } from '@prompt-lab/shared';

export async function modelRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    const models = await db.model.findMany({
      include: { provider: true },
      orderBy: { updatedAt: 'desc' },
    });
    return models;
  });

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const model = await db.model.findUnique({
      where: { id },
      include: { provider: true },
    });
    if (!model) return reply.status(404).send({ error: 'Model not found' });
    return model;
  });

  app.post('/', { preHandler: [authenticate] }, async (request) => {
    const data = createModelSchema.parse(request.body);
    const model = await db.model.create({
      data,
      include: { provider: true },
    });
    return model;
  });

  app.patch('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = updateModelSchema.parse(request.body);
    const model = await db.model.update({
      where: { id },
      data,
      include: { provider: true },
    });
    return model;
  });

  app.delete('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await db.model.delete({ where: { id } });
    return { success: true };
  });
}
