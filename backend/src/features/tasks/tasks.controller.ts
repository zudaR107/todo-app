import type { RequestHandler } from 'express';
import { Types } from 'mongoose';
import createError from 'http-errors';

import { Task } from './tasks.model.js';
import { Project } from '../projects/projects.model.js';
import type { CreateTaskInput, UpdateTaskInput, ListTasksQueryInput } from './tasks.schemas.js';
import type { JWTPayload } from '../../common/auth.js';
import { asyncHandler } from '../../common/async.js';

type JwtUser = Pick<JWTPayload, 'sub' | 'role'>;

function getAuth(req: unknown): JwtUser {
  const u = (req as { user?: JWTPayload }).user;
  if (!u?.sub || !u?.role) throw createError(401, 'Unauthorized');
  return { sub: u.sub, role: u.role };
}

async function assertProjectAccess(projectId: string, user: JwtUser) {
  const proj = await Project.findById(projectId)
    .lean<{ _id: Types.ObjectId; ownerId: Types.ObjectId }>()
    .exec();
  if (!proj) throw createError(404, 'Project not found');
  if (user.role !== 'superadmin' && String(proj.ownerId) !== user.sub) {
    throw createError(403, 'Forbidden');
  }
}

async function assertTaskAccess(taskId: string, user: JwtUser) {
  const t = await Task.findById(taskId)
    .select({ projectId: 1 })
    .lean<{ _id: Types.ObjectId; projectId: Types.ObjectId }>()
    .exec();
  if (!t) throw createError(404, 'Task not found');
  await assertProjectAccess(String(t.projectId), user);
}

type TaskLike = {
  _id: Types.ObjectId;
  projectId: Types.ObjectId;
  title: string;
  description?: string | null;
  status: 'todo' | 'doing' | 'done';
  priority: 'low' | 'normal' | 'high';
  tags?: string[] | null;
  startAt?: Date | null;
  dueAt?: Date | null;
  allDay?: boolean | null;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

function toDto(t: TaskLike) {
  return {
    id: String(t._id),
    projectId: String(t.projectId),
    title: t.title,
    description: t.description ?? undefined,
    status: t.status,
    priority: t.priority,
    tags: Array.isArray(t.tags) ? t.tags : [],
    startAt: t.startAt ? t.startAt.toISOString() : undefined,
    dueAt: t.dueAt ? t.dueAt.toISOString() : undefined,
    allDay: t.allDay ?? undefined,
    createdBy: String(t.createdBy),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

export const createTask: RequestHandler = asyncHandler(async (req, res) => {
  const user = getAuth(req);
  const { projectId } = (req as unknown as { params: { projectId: string } }).params;
  const body = (req as unknown as { body?: CreateTaskInput }).body ?? ({} as CreateTaskInput);

  await assertProjectAccess(projectId, user);

  const task = await Task.create({
    projectId: new Types.ObjectId(projectId),
    title: body.title,
    description: body.description,
    status: body.status ?? 'todo',
    priority: body.priority ?? 'normal',
    tags: body.tags ?? [],
    startAt: body.startAt ? new Date(body.startAt) : undefined,
    dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
    allDay: body.allDay,
    createdBy: new Types.ObjectId(user.sub),
  });

  const obj = task.toObject<TaskLike>();
  res.status(201).json(toDto(obj));
});

export const listTasks: RequestHandler = asyncHandler(async (req, res) => {
  const user = getAuth(req);
  const { projectId } = (req as unknown as { params: { projectId: string } }).params;
  const q =
    (req as unknown as { query?: ListTasksQueryInput }).query ?? ({} as ListTasksQueryInput);

  await assertProjectAccess(projectId, user);

  const filter: Record<string, unknown> = {
    projectId: new Types.ObjectId(projectId),
  };

  if (q.status) filter.status = q.status;
  if (q.priority) filter.priority = q.priority;
  if (q.tag) filter.tags = q.tag;
  if (q.q) filter.title = { $regex: q.q, $options: 'i' };

  if (q.dueFrom || q.dueTo) {
    const r: Record<string, Date> = {};
    if (q.dueFrom) r.$gte = new Date(q.dueFrom);
    if (q.dueTo) r.$lte = new Date(q.dueTo);
    filter.dueAt = r;
  }

  const limit = q.limit ?? 20;
  const offset = q.offset ?? 0;

  const items = await Task.find(filter)
    .sort({ updatedAt: -1 })
    .skip(offset)
    .limit(limit)
    .lean()
    .exec();

  const typedItems = items as TaskLike[];
  res.json(typedItems.map((it) => toDto(it)));
});

export const getTask: RequestHandler = asyncHandler(async (req, res) => {
  const user = getAuth(req);
  const { id } = (req as unknown as { params: { id: string } }).params;

  await assertTaskAccess(id, user);

  const t = await Task.findById(id).lean<TaskLike>().exec();
  if (!t) throw createError(404, 'Task not found');

  res.json(toDto(t));
});

export const patchTask: RequestHandler = asyncHandler(async (req, res) => {
  const user = getAuth(req);
  const { id } = (req as unknown as { params: { id: string } }).params;
  const body = (req as unknown as { body?: UpdateTaskInput }).body ?? ({} as UpdateTaskInput);

  await assertTaskAccess(id, user);

  const t = await Task.findById(id).exec();
  if (!t) throw createError(404, 'Task not found');

  if (typeof body.title === 'string') t.title = body.title;
  if (typeof body.description === 'string') t.description = body.description;
  if (typeof body.status === 'string') t.status = body.status;
  if (typeof body.priority === 'string') t.priority = body.priority;
  if (Array.isArray(body.tags)) t.tags = body.tags;
  if (typeof body.allDay === 'boolean') t.allDay = body.allDay;
  if (typeof body.startAt === 'string') t.startAt = new Date(body.startAt);
  if (typeof body.dueAt === 'string') t.dueAt = new Date(body.dueAt);

  await t.save();
  const obj = t.toObject<TaskLike>();
  res.json(toDto(obj));
});
