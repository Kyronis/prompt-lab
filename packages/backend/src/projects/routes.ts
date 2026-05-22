import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { authenticate } from '../auth/authenticate.js';
import { createProjectSchema } from '@prompt-lab/shared';

export async function projectRoutes(app: FastifyInstance) {
  app.get('/', async () => {
    const projects = await db.project.findMany({
      include: { _count: { select: { prompts: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return projects;
  });

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const project = await db.project.findUnique({
      where: { id },
      include: { prompts: true },
    });
    if (!project) return reply.status(404).send({ error: 'Project not found' });
    return project;
  });

  app.post('/', { preHandler: [authenticate] }, async (request) => {
    const data = createProjectSchema.parse(request.body);
    const project = await db.project.create({ data });
    return project;
  });

  app.patch('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const data = createProjectSchema.partial().parse(request.body);
    const project = await db.project.update({ where: { id }, data });
    return project;
  });

  app.delete('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    await db.project.delete({ where: { id } });
    return { success: true };
  });
}
