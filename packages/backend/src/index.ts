import { buildApp } from './app/build-app.js';

export { buildApp } from './app/build-app.js';

if (process.env['NODE_ENV'] !== 'test') {
  const app = await buildApp();
  const port = Number(process.env['PORT'] ?? 4000);
  await app.listen({ port, host: '0.0.0.0' });
  app.log.info(`Prompt Lab backend running on http://0.0.0.0:${port}`);
}
