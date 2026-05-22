import type { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from './jwt.js';
import type { TokenPayload } from '@prompt-lab/shared';

declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload;
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
  const token = authHeader.slice(7);
  try {
    request.user = verifyToken(token);
  } catch {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}
