import 'dotenv/config';
import type { SignOptions } from 'jsonwebtoken';

type JwtExpiresIn = Exclude<SignOptions['expiresIn'], undefined>;

interface Env {
  PORT: number;
  MONGO_URI: string;
  CORS_ORIGIN: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  ACCESS_TTL: JwtExpiresIn;
  REFRESH_TTL: JwtExpiresIn;
  ALLOW_BOOTSTRAP: boolean;
  BOOTSTRAP_SUPERADMIN_EMAIL: string;
  BOOTSTRAP_SUPERADMIN_PASSWORD: string;
}

export const env: Env = {
  PORT: Number(process.env.PORT ?? 8080),
  MONGO_URI: process.env.MONGO_URI ?? 'mongodb://localhost:27017/todo',
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? '*',

  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? 'dev_access',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? 'dev_refresh',

  ACCESS_TTL: (process.env.ACCESS_TTL ?? '5m') as JwtExpiresIn,
  REFRESH_TTL: (process.env.REFRESH_TTL ?? '1d') as JwtExpiresIn,

  ALLOW_BOOTSTRAP: process.env.ALLOW_BOOTSTRAP === 'true',
  BOOTSTRAP_SUPERADMIN_EMAIL: process.env.BOOTSTRAP_SUPERADMIN_EMAIL ?? '',
  BOOTSTRAP_SUPERADMIN_PASSWORD: process.env.BOOTSTRAP_SUPERADMIN_PASSWORD ?? '',
};
