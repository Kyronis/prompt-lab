import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { authenticate } from '../auth/authenticate.js';
import { createPromptSchema, updatePromptSchema } from '@prompt-lab/shared';

export async function promptRoutes(app: FastifyInstance) {
  // List prompts (public + own)
  app.get('/', async (request) => {
    const userId = request.user?.sub;
    const prompts = await db.prompt.findMany({
      where: userId ? { OR: [{ isPublic: true }, { userId }] } : { isPublic: true },
      include: { project: true, user: { select: { id: true, name: true } } },
      orderBy: { updatedAt: 'desc' },
    });
    return prompts;
  });

  // Get single prompt
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const prompt = await db.prompt.findUnique({
      where: { id },
      include: { project: true, versions: { orderBy: { version: 'desc' } } },
    });
    if (!prompt) return reply.status(404).send({ error: 'Prompt not found' });
    return prompt;
  });

  // Create prompt (auth required)
  app.post('/', { preHandler: [authenticate] }, async (request) => {
    const data = createPromptSchema.parse(request.body);
    const prompt = await db.prompt.create({
      data: {
        name: data.name,
        content: data.content,
        description: data.description,
        tags: data.tags,
        isPublic: data.isPublic,
        projectId: data.projectId,
        userId: request.user!.sub,
        versions: {
          create: { content: data.content, version: 1 },
        },
      },
      include: { project: true },
    });
    return prompt;
  });

  // Update prompt (auth required)
  app.patch('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await db.prompt.findFirst({
      where: { id, userId: request.user!.sub },
    });
    if (!existing) return reply.status(404).send({ error: 'Prompt not found' });

    const data = updatePromptSchema.parse(request.body);
    const newVersion = existing.version + 1;

    const prompt = await db.prompt.update({
      where: { id },
      data: {
        ...data,
        version: newVersion,
        versions: {
          create: { content: data.content ?? existing.content, version: newVersion },
        },
      },
      include: { project: true, versions: { orderBy: { version: 'desc' } } },
    });
    return prompt;
  });

  // Delete prompt (auth required)
  app.delete('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const existing = await db.prompt.findFirst({
      where: { id, userId: request.user!.sub },
    });
    if (!existing) return reply.status(404).send({ error: 'Prompt not found' });
    await db.prompt.delete({ where: { id } });
    return { success: true };
  });
}
