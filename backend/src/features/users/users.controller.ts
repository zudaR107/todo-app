import type { RequestHandler } from 'express';
import createError from 'http-errors';
import { UserModel } from './user.model.js';
import { asyncHandler } from '../../common/async.js';
import { CreateUserBody } from './users.schemas.js';
import type { ObjectId } from 'mongodb';

function isDuplicateKeyError(e: unknown): e is { code: number } {
  return (
    typeof (e as { code?: unknown })?.code === 'number' && (e as { code: number }).code === 11000
  );
}

export const createUser: RequestHandler = asyncHandler(async (req, res) => {
  const rawBody: unknown = (req as unknown as { body?: unknown }).body;
  const data = CreateUserBody.parse(rawBody);

  const user = new UserModel({
    email: data.email,
    displayName: data.displayName,
    password: data.password,
    role: data.role ?? 'user',
  });

  try {
    await user.save();
  } catch (err: unknown) {
    if (isDuplicateKeyError(err)) {
      throw createError(409, 'Email already exists');
    }
    throw err;
  }

  const obj = user.toObject<{
    _id: ObjectId;
    email: string;
    displayName: string;
    role: 'superadmin' | 'user';
  }>();

  res.status(201).json({
    id: String(obj._id),
    email: obj.email,
    displayName: obj.displayName,
    role: obj.role,
  });
});
