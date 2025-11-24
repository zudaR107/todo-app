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
import { calendarQuerySchema, calendarEventSchema } from './calendar.schemas.js';

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

describe('Calendar endpoint', () => {
  it('401 without token', async () => {
    const now = Date.now();
    const from = new Date(now).toISOString();
    const to = new Date(now + 24 * 3600e3).toISOString();

    await request(app).get('/api/calendar').query({ from, to }).expect(401);
  });

  it('400 on invalid/missing query params', async () => {
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@example.com', password: 'admin123' })
      .expect(200);
    const admin = LoginResponse.parse(adminLogin.body);

    await request(app)
      .get('/api/calendar')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .expect(400);

    const now = Date.now();
    const from = new Date(now + 48 * 3600e3).toISOString();
    const to = new Date(now + 24 * 3600e3).toISOString();

    await request(app)
      .get('/api/calendar')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .query({ from, to })
      .expect(400);
  });

  it('returns tasks in range and respects projectId & ownership', async () => {
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
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .send(createProjectSchema.parse({ name: 'P2' }))
      .expect(201);
    const p2 = projectResponseSchema.parse(p2c.body);

    const p3c = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${t2.accessToken}`)
      .send(createProjectSchema.parse({ name: 'P3' }))
      .expect(201);
    const p3 = projectResponseSchema.parse(p3c.body);

    const now = Date.now();
    const from = new Date(now + 1 * 3600e3);
    const to = new Date(now + 3 * 24 * 3600e3);

    const inStart = new Date(now + 2 * 3600e3).toISOString();
    const inDue = new Date(now + 2 * 24 * 3600e3).toISOString();
    const beforeDue = new Date(now - 24 * 3600e3).toISOString();
    const afterStart = new Date(now + 5 * 24 * 3600e3).toISOString();

    await request(app)
      .post(`/api/projects/${p1.id}/tasks`)
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .send(
        createTaskBody.parse({
          title: 'Inside by start',
          startAt: inStart,
          priority: 'normal',
        }),
      )
      .expect(201);

    await request(app)
      .post(`/api/projects/${p1.id}/tasks`)
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .send(
        createTaskBody.parse({
          title: 'Inside by due',
          dueAt: inDue,
          priority: 'high',
        }),
      )
      .expect(201);

    await request(app)
      .post(`/api/projects/${p1.id}/tasks`)
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .send(
        createTaskBody.parse({
          title: 'Overlap range',
          startAt: beforeDue,
          dueAt: inDue,
          priority: 'low',
        }),
      )
      .expect(201);

    await request(app)
      .post(`/api/projects/${p1.id}/tasks`)
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .send(
        createTaskBody.parse({
          title: 'Before range',
          dueAt: beforeDue,
        }),
      )
      .expect(201);

    await request(app)
      .post(`/api/projects/${p1.id}/tasks`)
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .send(
        createTaskBody.parse({
          title: 'After range',
          startAt: afterStart,
        }),
      )
      .expect(201);

    await request(app)
      .post(`/api/projects/${p2.id}/tasks`)
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .send(
        createTaskBody.parse({
          title: 'P2 in range',
          dueAt: inDue,
        }),
      )
      .expect(201);

    await request(app)
      .post(`/api/projects/${p3.id}/tasks`)
      .set('Authorization', `Bearer ${t2.accessToken}`)
      .send(
        createTaskBody.parse({
          title: 'Other user in range',
          dueAt: inDue,
        }),
      )
      .expect(201);

    const q = calendarQuerySchema.parse({
      from: from.toISOString(),
      to: to.toISOString(),
    });

    const resUser1 = await request(app)
      .get('/api/calendar')
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .query(q)
      .expect(200);

    const eventsUser1 = calendarEventSchema.array().parse(resUser1.body);

    expect(eventsUser1.length).toBeGreaterThanOrEqual(4);
    expect(eventsUser1.every((e) => e.projectId === p1.id || e.projectId === p2.id)).toBe(true);
    expect(eventsUser1.some((e) => e.title === 'Before range')).toBe(false);
    expect(eventsUser1.some((e) => e.title === 'After range')).toBe(false);
    expect(eventsUser1.some((e) => e.projectId === p3.id)).toBe(false);

    const resUser1P1 = await request(app)
      .get('/api/calendar')
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .query(calendarQuerySchema.parse({ ...q, projectId: p1.id }))
      .expect(200);

    const eventsUser1P1 = calendarEventSchema.array().parse(resUser1P1.body);
    expect(eventsUser1P1.every((e) => e.projectId === p1.id)).toBe(true);

    await request(app)
      .get('/api/calendar')
      .set('Authorization', `Bearer ${t2.accessToken}`)
      .query(calendarQuerySchema.parse({ ...q, projectId: p1.id }))
      .expect(403);

    const resAdmin = await request(app)
      .get('/api/calendar')
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .query(q)
      .expect(200);

    const eventsAdmin = calendarEventSchema.array().parse(resAdmin.body);
    expect(eventsAdmin.some((e) => e.projectId === p3.id)).toBe(true);

    const fakeId = 'aaaaaaaaaaaaaaaaaaaaaaaa';

    await request(app)
      .get('/api/calendar')
      .set('Authorization', `Bearer ${t1.accessToken}`)
      .query(calendarQuerySchema.parse({ ...q, projectId: fakeId }))
      .expect(404);
  });
});
