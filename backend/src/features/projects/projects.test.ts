import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import { createApp } from '../../app.js';
import { UserModel } from '../users/user.model.js';
import { CreateUserBody, UserResponse } from '../users/users.schemas.js';
import { LoginResponse } from '../auth/auth.schemas.js';
import {
  createProjectSchema,
  updateProjectSchema,
  projectResponseSchema,
} from './projects.schemas.js';

let mongod: MongoMemoryServer;
const app = createApp();

function uniqueStr(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

describe('Projects endpoints', () => {
  it('401 without token (GET, POST)', async () => {
    await request(app).get('/api/projects').expect(401);
    await request(app).post('/api/projects').send({ name: 'X' }).expect(401);
  });

  it('CRUD happy-path + authz checks', async () => {
    // --- admin login
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' })
      .expect(200);
    const admin = LoginResponse.parse(adminLogin.body);

    // --- create two regular users
    const user1Email = `${uniqueStr('u1')}@example.com`;
    const user2Email = `${uniqueStr('u2')}@example.com`;

    const u1 = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send(
        CreateUserBody.parse({ email: user1Email, displayName: 'User1', password: 'secret123' }),
      )
      .expect(201);
    const createdU1 = UserResponse.parse(u1.body);
    expect(createdU1.email).toBe(user1Email);

    const u2 = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send(
        CreateUserBody.parse({ email: user2Email, displayName: 'User2', password: 'secret123' }),
      )
      .expect(201);
    const createdU2 = UserResponse.parse(u2.body);
    expect(createdU2.email).toBe(user2Email);

    // --- login both users
    const user1Login = await request(app)
      .post('/api/auth/login')
      .send({ email: user1Email, password: 'secret123' })
      .expect(200);
    const user1 = LoginResponse.parse(user1Login.body);

    const user2Login = await request(app)
      .post('/api/auth/login')
      .send({ email: user2Email, password: 'secret123' })
      .expect(200);
    const user2 = LoginResponse.parse(user2Login.body);

    // --- POST /api/projects by user1 -> 201
    const createBody = createProjectSchema.parse({ name: 'Inbox', color: '#ff8800' });
    const created = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${user1.accessToken}`)
      .send(createBody)
      .expect(201);

    const proj = projectResponseSchema.parse(created.body);
    expect(proj.name).toBe('Inbox');
    expect(proj.ownerId).toMatch(/^[0-9a-f]{24}$/i);
    const projectId = proj.id;

    // --- GET /api/projects as user1 -> sees own project
    const listMine = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${user1.accessToken}`)
      .expect(200);
    const mine = projectResponseSchema.array().parse(listMine.body);
    expect(mine.some((p) => p.id === projectId)).toBe(true);

    // --- GET /api/projects as user2 -> does NOT see user1 project
    const listOther = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${user2.accessToken}`)
      .expect(200);
    const others = projectResponseSchema.array().parse(listOther.body);
    expect(others.some((p) => p.id === projectId)).toBe(false);

    // --- PATCH /api/projects/:id by owner -> 200
    const patchBody = updateProjectSchema.parse({ name: 'Renamed', color: '#00aaee' });
    const patched = await request(app)
      .patch(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${user1.accessToken}`)
      .send(patchBody)
      .expect(200);
    const projPatched = projectResponseSchema.parse(patched.body);
    expect(projPatched.name).toBe('Renamed');
    expect(projPatched.color).toBe('#00aaee');

    // --- PATCH by another user -> 403
    await request(app)
      .patch(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${user2.accessToken}`)
      .send(updateProjectSchema.parse({ name: 'Hack' }))
      .expect(403);

    // --- PATCH invalid id -> 400
    await request(app)
      .patch('/api/projects/not-an-id')
      .set('Authorization', `Bearer ${user1.accessToken}`)
      .send(updateProjectSchema.parse({ name: 'X' }))
      .expect(400);

    // --- PATCH non-existing id -> 404
    await request(app)
      .patch('/api/projects/aaaaaaaaaaaaaaaaaaaaaaaa')
      .set('Authorization', `Bearer ${user1.accessToken}`)
      .send(updateProjectSchema.parse({ name: 'Nope' }))
      .expect(404);

    // --- DELETE by owner -> 204
    await request(app)
      .delete(`/api/projects/${projectId}`)
      .set('Authorization', `Bearer ${user1.accessToken}`)
      .expect(204);

    // --- ensure it's gone for owner
    const listAfterDelete = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${user1.accessToken}`)
      .expect(200);
    const mineAfter = projectResponseSchema.array().parse(listAfterDelete.body);
    expect(mineAfter.some((p) => p.id === projectId)).toBe(false);

    // --- create project for user2, delete by superadmin -> 204
    const p2create = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${user2.accessToken}`)
      .send(createProjectSchema.parse({ name: 'U2-Proj' }))
      .expect(201);
    const p2 = projectResponseSchema.parse(p2create.body);

    await request(app)
      .delete(`/api/projects/${p2.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(204);

    const listU2 = await request(app)
      .get('/api/projects')
      .set('Authorization', `Bearer ${user2.accessToken}`)
      .expect(200);
    const u2After = projectResponseSchema.array().parse(listU2.body);
    expect(u2After.some((p) => p.id === p2.id)).toBe(false);
  });
});
