import type { Express } from "express";
import swaggerUi from "swagger-ui-express";
import { buildOpenApiDoc } from "./openapi.js";

export function mountSwagger(app: Express) {
    const doc = buildOpenApiDoc();
    app.get('/api/openapi.json', (_req, res) => res.json(doc));
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(doc, {
        swaggerOptions: { persistAuthorization: true }
    }));
}
