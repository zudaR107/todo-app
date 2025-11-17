import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import { createApp } from '../../app.js';
import { UserModel } from '../users/user.model.js';
import { LoginResponse } from '../auth/auth.schemas.js';
import { CreateUserBody, UserResponse } from '../users/users.schemas.js';
import { createProjectSchema, projectResponseSchema } from '../projects/projects.schemas.js';
import { createTaskBody, updateTaskBody, listTasksQuery, taskResponse } from './tasks.schemas.js';

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

describe('Tasks endpoints', () => {
  it('401 without token', async () => {
    await request(app).get('/api/projects/aaaaaaaaaaaaaaaaaaaaaaaa/tasks').expect(401);
    await request(app)
      .post('/api/projects/aaaaaaaaaaaaaaaaaaaaaaaa/tasks')
      .send({ title: 'X' })
      .expect(401);
    await request(app).get('/api/tasks/aaaaaaaaaaaaaaaaaaaaaaaa').expect(401);
    await request(app)
      .patch('/api/tasks/aaaaaaaaaaaaaaaaaaaaaaaa')
      .send({ title: 'X' })
      .expect(401);
  });

  it('CRUD + filters + authz', async () => {
    // admin login
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' })
      .expect(200);
    const admin = LoginResponse.parse(adminLogin.body);

    // create two users
    const email1 = `${unique('u1')}@example.com`;
    const email2 = `${unique('u2')}@example.com`;

    const u1 = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send(CreateUserBody.parse({ email: email1, displayName: 'U1', password: 'secret123' }))
      .expect(201);
    const user1 = UserResponse.parse(u1.body);
    expect(user1.email).toBe(email1);

    const u2 = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send(CreateUserBody.parse({ email: email2, displayName: 'U2', password: 'secret123' }))
      .expect(201);
    const user2 = UserResponse.parse(u2.body);
    expect(user2.email).toBe(email2);

    // login users
    const l1 = await request(app)
      .post('/api/auth/login')
      .send({ email: email1, password: 'secret123' })
      .expect(200);
    const t1 = LoginResponse.parse(l1.body);

    const l2 = await request(app)
      .post('/api/auth/login')
      .send({ email: email2, password: 'secret123' })
      .expect(200);
    const t2 = LoginResponse.parse(l2.body);

    // create project for user1
    const p1c = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .send(createProjectSchema.parse({ name: 'Inbox' }))
      .expect(201);
    const p1 = projectResponseSchema.parse(p1c.body);

    // create two tasks in project (user1)
    const tA = await request(app)
      .post(`/api/projects/${p1.id}/tasks`)
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .send(
        createTaskBody.parse({
          title: 'Buy milk',
          priority: 'high',
          tags: ['home', 'errands'],
          dueAt: new Date(Date.now() + 24 * 3600e3).toISOString(),
        }),
      )
      .expect(201);
    const task1 = taskResponse.parse(tA.body);

    const tB = await request(app)
      .post(`/api/projects/${p1.id}/tasks`)
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .send(createTaskBody.parse({ title: 'Task two', status: 'doing', tags: ['work'] }))
      .expect(201);
    const task2 = taskResponse.parse(tB.body);

    // list by owner (filters: q, tag, status, priority, dueFrom/dueTo, limit/offset)
    const listAll = await request(app)
      .get(`/api/projects/${p1.id}/tasks`)
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .query(listTasksQuery.parse({}))
      .expect(200);
    const all = taskResponse.array().parse(listAll.body);
    expect(all.length).toBeGreaterThanOrEqual(2);

    const listQ = await request(app)
      .get(`/api/projects/${p1.id}/tasks`)
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .query(listTasksQuery.parse({ q: 'buy' }))
      .expect(200);
    const qres = taskResponse.array().parse(listQ.body);
    expect(qres.some((x) => x.id === task1.id)).toBe(true);

    const listTag = await request(app)
      .get(`/api/projects/${p1.id}/tasks`)
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .query(listTasksQuery.parse({ tag: 'work' }))
      .expect(200);
    const tagRes = taskResponse.array().parse(listTag.body);
    expect(tagRes.some((x) => x.id === task2.id)).toBe(true);

    const listStatus = await request(app)
      .get(`/api/projects/${p1.id}/tasks`)
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .query(listTasksQuery.parse({ status: 'doing' }))
      .expect(200);
    const statusRes = taskResponse.array().parse(listStatus.body);
    expect(statusRes.every((x) => x.status === 'doing')).toBe(true);

    const listPrio = await request(app)
      .get(`/api/projects/${p1.id}/tasks`)
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .query(listTasksQuery.parse({ priority: 'high' }))
      .expect(200);
    const prioRes = taskResponse.array().parse(listPrio.body);
    expect(prioRes.every((x) => x.priority === 'high')).toBe(true);

    const listDue = await request(app)
      .get(`/api/projects/${p1.id}/tasks`)
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .query(
        listTasksQuery.parse({
          dueFrom: new Date(Date.now() + 1 * 3600e3).toISOString(),
          dueTo: new Date(Date.now() + 48 * 3600e3).toISOString(),
        }),
      )
      .expect(200);
    const dueRes = taskResponse.array().parse(listDue.body);
    expect(dueRes.some((x) => x.id === task1.id)).toBe(true);

    const listPaged = await request(app)
      .get(`/api/projects/${p1.id}/tasks`)
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .query(listTasksQuery.parse({ limit: 1, offset: 1 }))
      .expect(200);
    const paged = taskResponse.array().parse(listPaged.body);
    expect(paged.length).toBe(1);

    // get by id (owner)
    const getOne = await request(app)
      .get(`/api/tasks/${task1.id}`)
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .expect(200);
    const one = taskResponse.parse(getOne.body);
    expect(one.id).toBe(task1.id);

    // patch by owner
    const pat = await request(app)
      .patch(`/api/tasks/${task1.id}`)
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .send(updateTaskBody.parse({ status: 'done', title: 'Buy milk & bread' }))
      .expect(200);
    const patched = taskResponse.parse(pat.body);
    expect(patched.status).toBe('done');
    expect(patched.title).toBe('Buy milk & bread');

    // authz: user2 cannot list/create/patch in user1 project
    await request(app)
      .get(`/api/projects/${p1.id}/tasks`)
      .set('Authorization', `Bearer ${t2.accessToken}`)
      .expect(403);

    await request(app)
      .post(`/api/projects/${p1.id}/tasks`)
      .set('Authorization', `Bearer ${t2.accessToken}`)
      .send(createTaskBody.parse({ title: 'Should fail' }))
      .expect(403);

    await request(app)
      .patch(`/api/tasks/${task1.id}`)
      .set('Authorization', `Bearer ${t2.accessToken}`)
      .send(updateTaskBody.parse({ status: 'doing' }))
      .expect(403);

    // 400 invalid inputs
    await request(app)
      .post(`/api/projects/${p1.id}/tasks`)
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .send({ title: '' })
      .expect(400);

    await request(app)
      .patch(`/api/tasks/${task1.id}`)
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .send({})
      .expect(400);

    await request(app)
      .get('/api/tasks/not-an-id')
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .expect(400);

    // 404 non-existing ids
    const fakeId = 'aaaaaaaaaaaaaaaaaaaaaaaa';
    await request(app)
      .get(`/api/tasks/${fakeId}`)
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .expect(404);

    await request(app)
      .get(`/api/projects/${fakeId}/tasks`)
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .expect(404);
  });
});
