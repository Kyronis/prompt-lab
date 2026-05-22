import type { FastifyInstance } from 'fastify';
import { db } from '../db.js';
import { authenticate } from '../auth/authenticate.js';
import { executePromptSchema } from '@prompt-lab/shared';
import { callLlm } from '../llm/service.js';

export async function executionRoutes(app: FastifyInstance) {
  // Execute a prompt against a model
  app.post('/', { preHandler: [authenticate] }, async (request) => {
    const data = executePromptSchema.parse(request.body);

    // If promptId is given, verify ownership
    if (data.promptId) {
      const prompt = await db.prompt.findFirst({
        where: { id: data.promptId, userId: request.user!.sub },
      });
      if (!prompt) {
        return { error: 'Prompt not found' };
      }
    }

    const llmResult = await callLlm({
      modelId: data.modelId,
      promptContent: data.promptContent,
      userInput: data.userInput,
      temperature: data.temperature,
      maxTokens: data.maxTokens,
    });

    // Persist execution record
    const execution = await db.promptExecution.create({
      data: {
        promptContent: data.promptContent,
        userInput: data.userInput ?? null,
        modelId: data.modelId,
        temperature: data.temperature,
        maxTokens: data.maxTokens ?? null,
        result: llmResult.result,
        error: llmResult.error,
        durationMs: llmResult.durationMs,
        promptId: data.promptId ?? null,
        userId: request.user!.sub,
      },
      include: { model: { include: { provider: true } }, prompt: true },
    });

    return execution;
  });

  // List executions for current user
  app.get('/', { preHandler: [authenticate] }, async (request) => {
    const executions = await db.promptExecution.findMany({
      where: { userId: request.user!.sub },
      include: { model: { include: { provider: true } }, prompt: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return executions;
  });

  // List executions for a specific prompt
  app.get('/by-prompt/:promptId', { preHandler: [authenticate] }, async (request) => {
    const { promptId } = request.params as { promptId: string };
    const executions = await db.promptExecution.findMany({
      where: { promptId, userId: request.user!.sub },
      include: { model: { include: { provider: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return executions;
  });

  // Get single execution
  app.get('/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const execution = await db.promptExecution.findFirst({
      where: { id, userId: request.user!.sub },
      include: { model: { include: { provider: true } }, prompt: true },
    });
    if (!execution) return reply.status(404).send({ error: 'Execution not found' });
    return execution;
  });
}
