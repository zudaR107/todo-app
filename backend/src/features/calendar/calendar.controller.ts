import type { RequestHandler } from 'express';
import { Types } from 'mongoose';
import createError from 'http-errors';

import { Task } from '../tasks/tasks.model.js';
import { Project } from '../projects/projects.model.js';
import type { CalendarQueryInput } from './calendar.schemas.js';
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

function toEvent(t: TaskLike) {
  const startDate = t.startAt ?? t.dueAt;
  if (!startDate) {
    throw new Error('Task without startAt/dueAt leaked into calendar');
  }

  const endDate = t.startAt && t.dueAt ? t.dueAt : undefined;

  return {
    id: String(t._id),
    title: t.title,
    start: startDate.toISOString(),
    end: endDate ? endDate.toISOString() : undefined,
    allDay: t.allDay ?? undefined,
    projectId: String(t.projectId),
    status: t.status,
    priority: t.priority,
  };
}

export const getCalendar: RequestHandler = asyncHandler(async (req, res) => {
  const user = getAuth(req);
  const q = (req as unknown as { query?: CalendarQueryInput }).query as CalendarQueryInput;

  const from = new Date(q.from);
  const to = new Date(q.to);

  const filter: Record<string, unknown> = {
    $or: [{ startAt: { $gte: from, $lte: to } }, { dueAt: { $gte: from, $lte: to } }],
  };

  if (q.projectId) {
    await assertProjectAccess(q.projectId, user);
    filter.projectId = new Types.ObjectId(q.projectId);
  } else if (user.role !== 'superadmin') {
    const rawProjects = await Project.find({ ownerId: new Types.ObjectId(user.sub) })
      .select({ _id: 1 })
      .lean()
      .exec();

    const projects = rawProjects as { _id: Types.ObjectId }[];

    if (projects.length === 0) {
      res.json([]);
      return;
    }

    filter.projectId = { $in: projects.map((p) => p._id) };
  }

  const rawTasks = await Task.find(filter)
    .sort({ startAt: 1, dueAt: 1, updatedAt: -1 })
    .lean()
    .exec();

  const tasks = rawTasks as TaskLike[];

  res.json(tasks.map((t) => toEvent(t)));
});
