import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { authenticate } from '../auth/authenticate.js';
import { createModelProviderSchema, updateModelProviderSchema } from '@prompt-lab/shared';

export async function modelProviderRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    const providers = await db.modelProvider.findMany({
      include: { _count: { select: { models: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return providers;
  });

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const provider = await db.modelProvider.findUnique({
      where: { id },
      include: { models: true },
    });
    if (!provider) return reply.status(404).send({ error: 'Provider not found' });
    return provider;
  });

  app.post('/', { preHandler: [authenticate] }, async (request) => {
    const data = createModelProviderSchema.parse(request.body);
    const provider = await db.modelProvider.create({ data });
    return provider;
  });

  app.patch('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = updateModelProviderSchema.parse(request.body);
    const provider = await db.modelProvider.update({ where: { id }, data });
    return provider;
  });

  app.delete('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await db.modelProvider.delete({ where: { id } });
    return { success: true };
  });
}
