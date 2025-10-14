import 'dotenv/config';

export const env = {
    PORT: Number(process.env.PORT ?? 8080),
    MONGO_URI: process.env.MONGO_URI ?? 'mongodb://localhost:27017/todo',
    CORS_ORIGIN: process.env.CORS_ORIGIN ?? '*',
    JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET ?? 'dev_access',
    JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET ?? 'dev_refresh',
    ACCESS_TTL: process.env.ACCESS_TTL ?? '5m',
    REFRESH_TTL: process.env.REFRESH_TTL ?? '1d',
    ALLOW_BOOTSTRAP: process.env.ALLOW_BOOTSTRAP === 'true'
};