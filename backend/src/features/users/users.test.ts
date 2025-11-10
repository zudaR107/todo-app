import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import { createApp } from '../../app.js';
import { UserModel } from './user.model.js';
import { LoginResponse } from '../auth/auth.schemas.js';
import { CreateUserBody, UserResponse } from './users.schemas.js';

let mongod: MongoMemoryServer;
const app = createApp();

function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}@example.com`;
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

describe('Users endpoints (admin-only create)', () => {
  it('401 without token', async () => {
    await request(app)
      .post('/api/users')
      .send({ email: uniqueEmail('noauth'), displayName: 'X', password: 'secret123' })
      .expect(401);
  });

  it('403 with user token; 201 with admin token', async () => {
    // admin login
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' })
      .expect(200);
    const admin = LoginResponse.parse(adminLogin.body);

    // create user as admin -> 201
    const email = uniqueEmail('user');
    const createOk = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send(CreateUserBody.parse({ email, displayName: 'U', password: 'secret123' }))
      .expect(201);

    const created = UserResponse.parse(createOk.body);
    expect(created.email).toBe(email);

    // login as regular user
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'secret123' })
      .expect(200);
    const user = LoginResponse.parse(userLogin.body);

    // try to create another user -> 403
    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${user.accessToken}`)
      .send({ email: uniqueEmail('u2'), displayName: 'U2', password: 'secret123' })
      .expect(403);
  });

  it('400 invalid body; 409 duplicate email', async () => {
    // admin login
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' })
      .expect(200);
    const admin = LoginResponse.parse(adminLogin.body);

    // 400 invalid body
    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ email: 'not-an-email', displayName: 'Bad', password: '123' })
      .expect(400);

    // 409 duplicate
    const dup = uniqueEmail('dup');
    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ email: dup, displayName: 'Dup', password: 'secret123' })
      .expect(201);

    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ email: dup, displayName: 'Dup2', password: 'secret123' })
      .expect(409);
  });
});
