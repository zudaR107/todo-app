import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registry } from './registry.js';

export function buildOpenApiDoc() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: '3.0.3',
    info: {
      title: 'Todo API',
      version: '1.0.0',
      description:
        'Backend API for todo-app. Auth: Bearer access token; refresh via httpOnly cookie.',
    },
    servers: [{ url: '/api' }],
    security: [{ bearerAuth: [] }],
  });
}
