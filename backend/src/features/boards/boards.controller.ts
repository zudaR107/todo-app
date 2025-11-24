import type { RequestHandler } from 'express';
import { Types } from 'mongoose';
import createError from 'http-errors';

import { Task } from '../tasks/tasks.model.js';
import { Project } from '../projects/projects.model.js';
import type { BoardParamInput } from './boards.schemas.js';
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
    .select({ ownerId: 1 })
    .lean<{ _id: Types.ObjectId; ownerId: Types.ObjectId }>()
    .exec();
  if (!proj) throw createError(404, 'Project not found');
  if (user.role !== 'superadmin' && String(proj.ownerId) !== user.sub) {
    throw createError(403, 'Forbidden');
  }
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

function toTaskDto(t: TaskLike) {
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

export const getBoard: RequestHandler = asyncHandler(async (req, res) => {
  const user = getAuth(req);
  const { projectId } = (req as unknown as { params: BoardParamInput }).params;

  await assertProjectAccess(projectId, user);

  const rawTasks = await Task.find({ projectId: new Types.ObjectId(projectId) })
    .sort({ status: 1, updatedAt: -1 })
    .lean()
    .exec();

  const tasks = rawTasks as TaskLike[];

  const columns = [
    { id: 'todo' as const, name: 'To Do', tasks: [] as ReturnType<typeof toTaskDto>[] },
    { id: 'doing' as const, name: 'Doing', tasks: [] as ReturnType<typeof toTaskDto>[] },
    { id: 'done' as const, name: 'Done', tasks: [] as ReturnType<typeof toTaskDto>[] },
  ];

  const bucket = new Map<string, ReturnType<typeof toTaskDto>[]>(
    columns.map((c) => [c.id, c.tasks]),
  );

  for (const t of tasks) {
    const arr = bucket.get(t.status);
    if (!arr) continue;
    arr.push(toTaskDto(t));
  }

  res.json({ columns });
});
