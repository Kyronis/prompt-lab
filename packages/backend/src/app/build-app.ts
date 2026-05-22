import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

import { authRoutes } from '../auth/routes.js';
import { promptRoutes } from '../prompts/routes.js';
import { projectRoutes } from '../projects/routes.js';
import { modelProviderRoutes } from '../model-providers/routes.js';
import { modelRoutes } from '../models/routes.js';
import { executionRoutes } from '../executions/routes.js';
import { optimizationRoutes } from '../optimizations/routes.js';
import { errorHandler } from '../middleware/error-handler.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: { level: 'info' } });

  app.setErrorHandler(errorHandler);

  await app.register(cors, {
    origin: [/^http:\/\/localhost:300\d$/],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: { title: 'Prompt Lab API', version: '1.0.0', description: 'Prompt tuning and evaluation platform API' },
      components: {
        securitySchemes: {
          bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        },
      },
    },
  });
  await app.register(swaggerUi, { routePrefix: '/documentation' });

  // Health check
  app.get('/health', async () => ({ status: 'ok', timestamp: new Date().toISOString() }));

  // API routes
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(promptRoutes, { prefix: '/api/prompts' });
  await app.register(projectRoutes, { prefix: '/api/projects' });
  await app.register(modelProviderRoutes, { prefix: '/api/model-providers' });
  await app.register(modelRoutes, { prefix: '/api/models' });
  await app.register(executionRoutes, { prefix: '/api/executions' });
  await app.register(optimizationRoutes, { prefix: '/api/optimizations' });

  return app;
}
