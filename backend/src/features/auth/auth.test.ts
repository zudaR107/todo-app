import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import request, { agent as supertestAgent } from 'supertest';
import type { Response as SupertestResponse } from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import { createApp } from '../../app.js';
import { UserModel } from '../users/user.model.js';
import { LoginBody, LoginResponse, MeResponse, AuthTokens } from './auth.schemas.js';

let mongod: MongoMemoryServer;
const app = createApp();

function getSetCookies(res: SupertestResponse): string[] {
  const raw = res.headers['set-cookie'];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') return [raw];
  return [];
}

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  // seed superadmin
  await new UserModel({
    email: 'admin@example.com',
    displayName: 'Admin',
    password: 'admin123',
    role: 'superadmin',
  }).save();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

describe('Auth endpoints', () => {
  it('login 200 sets httpOnly refresh cookie and returns access token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send(LoginBody.parse({ email: 'admin@example.com', password: 'admin123' }))
      .expect(200);

    const body = LoginResponse.parse(res.body);
    expect(body.accessToken).toBeTypeOf('string');

    const cookies = getSetCookies(res);
    expect(cookies.length).toBeGreaterThan(0);
    expect(cookies.some((c) => c.includes('refresh_token='))).toBe(true);
    expect(cookies.some((c) => /HttpOnly/i.test(c))).toBe(true);
    expect(cookies.some((c) => /Path=\/api\/auth\/refresh/i.test(c))).toBe(true);
  });

  it('login 401 on wrong password; 400 on invalid body', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'wrongpass' })
      .expect(401);

    await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: '123' })
      .expect(400);
  });

  it('me 401 without token; me 200 with Bearer', async () => {
    await request(app).get('/api/auth/me').expect(401);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' })
      .expect(200);

    const { accessToken } = LoginResponse.parse(login.body);

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const me = MeResponse.parse(meRes.body);
    expect(me.email).toBe('admin@example.com');
    expect(me.role).toBe('superadmin');
  });

  it('refresh 200 with cookie; 401 without cookie', async () => {
    const ag = supertestAgent(app);

    await ag
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' })
      .expect(200);

    const refresh = await ag.post('/api/auth/refresh').expect(200);
    const tokens = AuthTokens.parse(refresh.body);
    expect(tokens.accessToken).toBeTypeOf('string');

    await request(app).post('/api/auth/refresh').expect(401);
  });

  it('logout 204 clears cookie and subsequent refresh is 401', async () => {
    const ag = supertestAgent(app);

    await ag
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' })
      .expect(200);

    const out = await ag.post('/api/auth/logout').expect(204);
    const cookies = getSetCookies(out);
    expect(cookies.some((c) => /refresh_token=;/i.test(c))).toBe(true);

    await ag.post('/api/auth/refresh').expect(401);
  });

  it('no public /auth/register', async () => {
    await request(app).post('/api/auth/register').expect(404);
  });
});
