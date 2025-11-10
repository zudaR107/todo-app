import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { env } from './config/env.js';
import { notFound, errorHandler } from './common/errors.js';
import authRoutes from './features/auth/auth.routes.js';
import usersRoutes from './features/users/users.routes.js';
import { mountSwagger } from './docs/swagger.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet());

  const allowList = new Set(env.CORS_ORIGINS);
  app.use(
    cors({
      credentials: true,
      origin(origin, cb) {
        if (!origin) return cb(null, true);
        if (allowList.size === 0) return cb(null, false);
        return cb(null, allowList.has(origin));
      },
      methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
  );

  app.use(express.json());
  app.use(cookieParser());
  app.use(morgan('dev'));

  app.get('/api/healthz', (_req, res) => res.json({ ok: true }));

  // API
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);

  // Docs
  mountSwagger(app);

  // 404 + errors
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
