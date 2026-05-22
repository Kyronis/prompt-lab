import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export function errorHandler(error: FastifyError, _request: FastifyRequest, reply: FastifyReply) {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: 'Validation Error',
      details: error.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
  }

  if (error.statusCode) {
    return reply.status(error.statusCode).send({ error: error.message });
  }

  reply.status(500).send({ error: 'Internal Server Error' });
}
