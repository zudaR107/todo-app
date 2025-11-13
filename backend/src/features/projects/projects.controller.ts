import type { RequestHandler } from 'express';
import { Types } from 'mongoose';
import createError from 'http-errors';

import { Project } from './projects.model.js';
import type { CreateProjectInput, UpdateProjectInput } from './projects.schemas.js';
import { asyncHandler } from '../../common/async.js';

type JwtUser = { sub: string; role: 'superadmin' | 'user' };

function getAuth(req: unknown): JwtUser {
  const u = (req as { user?: Partial<JwtUser> }).user;
  if (!u?.sub || !u?.role) throw createError(401, 'Unauthorized');
  return { sub: u.sub, role: u.role } as JwtUser;
}

function canMutate(user: JwtUser, ownerId: unknown) {
  return user.role === 'superadmin' || String(ownerId) === user.sub;
}

type ProjectLike = {
  _id: Types.ObjectId;
  name: string;
  color?: string | null | undefined;
  ownerId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

function toDto(p: ProjectLike) {
  return {
    id: String(p._id),
    name: p.name,
    color: p.color ?? undefined,
    ownerId: String(p.ownerId),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export const createProject: RequestHandler = asyncHandler(async (req, res) => {
  const user = getAuth(req);
  const body = (req as unknown as { body?: CreateProjectInput }).body ?? ({} as CreateProjectInput);

  const proj = await Project.create({
    name: body.name,
    color: body.color,
    ownerId: new Types.ObjectId(user.sub),
  });

  const obj = proj.toObject<ProjectLike>();
  res.status(201).json(toDto(obj));
});

export const listMyProjects: RequestHandler = asyncHandler(async (req, res) => {
  const user = getAuth(req);

  type ProjectLean = {
    _id: Types.ObjectId;
    name: string;
    color?: string | null;
    ownerId: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
  };

  const ownerId = new Types.ObjectId(user.sub);

  const items: ProjectLean[] = await Project.find({ ownerId })
    .sort({ createdAt: -1 })
    .lean()
    .exec();

  res.json(items.map((it) => toDto(it)));
});

export const patchProject: RequestHandler = asyncHandler(async (req, res) => {
  const user = getAuth(req);
  const { id } = (req as unknown as { params: { id: string } }).params;
  const body = (req as unknown as { body?: UpdateProjectInput }).body ?? ({} as UpdateProjectInput);

  const proj = await Project.findById(id).exec();
  if (!proj) throw createError(404, 'Project not found');
  if (!canMutate(user, proj.ownerId)) throw createError(403, 'Forbidden');

  if (typeof body.name === 'string') proj.name = body.name;
  if (typeof body.color === 'string') proj.color = body.color;

  await proj.save();
  const obj = proj.toObject<ProjectLike>();
  res.json(toDto(obj));
});

export const deleteProject: RequestHandler = asyncHandler(async (req, res) => {
  const user = getAuth(req);
  const { id } = (req as unknown as { params: { id: string } }).params;

  const proj = await Project.findById(id).exec();
  if (!proj) throw createError(404, 'Project not found');
  if (!canMutate(user, proj.ownerId)) throw createError(403, 'Forbidden');

  await proj.deleteOne();
  res.status(204).send();
});
