import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import { createApp } from '../../app.js';
import { UserModel } from '../users/user.model.js';
import { LoginResponse } from '../auth/auth.schemas.js';
import { CreateUserBody, UserResponse } from '../users/users.schemas.js';
import { createProjectSchema, projectResponseSchema } from '../projects/projects.schemas.js';
import { createTaskBody } from '../tasks/tasks.schemas.js';
import { boardResponseSchema } from './boards.schemas.js';

let mongod: MongoMemoryServer;
const app = createApp();

function unique(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

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

describe('Boards endpoint', () => {
  it('401 without token', async () => {
    await request(app).get('/api/boards/aaaaaaaaaaaaaaaaaaaaaaaa').expect(401);
  });

  it('400 on invalid projectId', async () => {
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' })
      .expect(200);
    const admin = LoginResponse.parse(adminLogin.body);

    await request(app)
      .get('/api/boards/not-an-id')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(400);
  });

  it('groups tasks by status and enforces access rules', async () => {
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' })
      .expect(200);
    const admin = LoginResponse.parse(adminLogin.body);

    const email1 = `${unique('u1')}@example.com`;
    const email2 = `${unique('u2')}@example.com`;

    const u1 = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send(CreateUserBody.parse({ email: email1, displayName: 'U1', password: 'secret123' }))
      .expect(201);
    const user1 = UserResponse.parse(u1.body);

    const u2 = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send(CreateUserBody.parse({ email: email2, displayName: 'U2', password: 'secret123' }))
      .expect(201);
    const user2 = UserResponse.parse(u2.body);

    const l1 = await request(app)
      .post('/api/auth/login')
      .send({ email: user1.email, password: 'secret123' })
      .expect(200);
    const t1 = LoginResponse.parse(l1.body);

    const l2 = await request(app)
      .post('/api/auth/login')
      .send({ email: user2.email, password: 'secret123' })
      .expect(200);
    const t2 = LoginResponse.parse(l2.body);

    const p1c = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .send(createProjectSchema.parse({ name: 'P1' }))
      .expect(201);
    const p1 = projectResponseSchema.parse(p1c.body);

    const p2c = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${t2.accessToken}`)
      .send(createProjectSchema.parse({ name: 'P2' }))
      .expect(201);
    const p2 = projectResponseSchema.parse(p2c.body);

    await request(app)
      .post(`/api/projects/${p1.id}/tasks`)
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .send(createTaskBody.parse({ title: 'Todo 1', status: 'todo' }))
      .expect(201);

    await request(app)
      .post(`/api/projects/${p1.id}/tasks`)
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .send(createTaskBody.parse({ title: 'Todo 2', status: 'todo' }))
      .expect(201);

    await request(app)
      .post(`/api/projects/${p1.id}/tasks`)
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .send(createTaskBody.parse({ title: 'Doing 1', status: 'doing' }))
      .expect(201);

    await request(app)
      .post(`/api/projects/${p1.id}/tasks`)
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .send(createTaskBody.parse({ title: 'Done 1', status: 'done' }))
      .expect(201);

    await request(app)
      .post(`/api/projects/${p2.id}/tasks`)
      .set('Authorization', `Bearer ${t2.accessToken}`)
      .send(createTaskBody.parse({ title: 'Other project task', status: 'todo' }))
      .expect(201);

    const resUser1 = await request(app)
      .get(`/api/boards/${p1.id}`)
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .expect(200);

    const boardUser1 = boardResponseSchema.parse(resUser1.body);

    expect(boardUser1.columns.length).toBe(3);

    const byId = Object.fromEntries(boardUser1.columns.map((c) => [c.id, c]));

    expect(byId.todo.name).toBe('To Do');
    expect(byId.doing.name).toBe('Doing');
    expect(byId.done.name).toBe('Done');

    expect(byId.todo.tasks.every((t) => t.status === 'todo')).toBe(true);
    expect(byId.doing.tasks.every((t) => t.status === 'doing')).toBe(true);
    expect(byId.done.tasks.every((t) => t.status === 'done')).toBe(true);

    const totalTasks = boardUser1.columns.reduce((acc, c) => acc + c.tasks.length, 0);
    expect(totalTasks).toBeGreaterThanOrEqual(4);
    expect(boardUser1.columns.some((c) => c.tasks.some((t) => t.projectId === p2.id))).toBe(false);

    const todoDates = byId.todo.tasks.map((t) => Date.parse(t.updatedAt));
    for (let i = 1; i < todoDates.length; i += 1) {
      expect(todoDates[i]).toBeLessThanOrEqual(todoDates[i - 1]);
    }

    await request(app)
      .get(`/api/boards/${p1.id}`)
      .set('Authorization', `Bearer ${t2.accessToken}`)
      .expect(403);

    const resAdmin = await request(app)
      .get(`/api/boards/${p1.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(200);

    const boardAdmin = boardResponseSchema.parse(resAdmin.body);
    expect(boardAdmin.columns.some((c) => c.tasks.some((t) => t.projectId === p1.id))).toBe(true);

    const fakeId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
    await request(app)
      .get(`/api/boards/${fakeId}`)
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .expect(404);
  });
});
