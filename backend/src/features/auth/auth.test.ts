import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { createApp } from '../../app.js';
import { UserModel } from '../users/user.model.js';
import { LoginResponse } from './auth.schemas.js';
import { UserResponse } from '../users/users.schemas.js';

let mongod: MongoMemoryServer;
const app = createApp();

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

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

describe('Auth + admin-only user creation', () => {
  it('admin login -> create user -> user login -> forbidden create', async () => {
    // admin login
    const loginAdmin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' })
      .expect(200);

    const adminLoginBody = LoginResponse.parse(loginAdmin.body);
    expect(adminLoginBody.accessToken).toBeTypeOf('string');

    // admin creates a user
    const createUser = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminLoginBody.accessToken}`)
      .send({ email: 'u@example.com', displayName: 'U', password: 'secret123' })
      .expect(201);

    const created = UserResponse.parse(createUser.body);
    expect(created.email).toBe('u@example.com');

    // user login
    const loginUser = await request(app)
      .post('/api/auth/login')
      .send({ email: 'u@example.com', password: 'secret123' })
      .expect(200);

    const userLoginBody = LoginResponse.parse(loginUser.body);
    expect(userLoginBody.accessToken).toBeTypeOf('string');

    // user tries to create another user -> 403
    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${userLoginBody.accessToken}`)
      .send({ email: 'u2@example.com', displayName: 'U2', password: 'secret123' })
      .expect(403);
  });

  it('no public register route', async () => {
    await request(app).post('/api/auth/register').expect(404);
  });
});
