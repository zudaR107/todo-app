import createError from 'http-errors';
import bcrypt from 'bcryptjs';
import type { Request, RequestHandler } from 'express';
import type { ObjectId } from 'mongodb';

import { UserModel } from '../users/user.model.js';
import {
  signAccessToken,
  signRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
  verifyRefresh,
} from '../../common/auth.js';
import { LoginBody } from './auth.schemas.js';
import { asyncHandler } from '../../common/async.js';
import type { JWTPayload } from '../../common/auth.js';
import type { infer as ZodInfer } from 'zod';

type LoginBodyInput = ZodInfer<typeof LoginBody>;

function readCookie(req: Request, name: string): string | undefined {
  const c: unknown = (req as unknown as { cookies?: unknown }).cookies;
  if (c && typeof c === 'object' && name in (c as Record<string, unknown>)) {
    const v = (c as Record<string, unknown>)[name];
    return typeof v === 'string' ? v : undefined;
  }
  return undefined;
}

export const login: RequestHandler = asyncHandler(async (req, res) => {
  const rawBody: unknown = (req as unknown as { body?: unknown }).body;
  const body: LoginBodyInput = LoginBody.parse(rawBody);

  type UserWithPassword = {
    _id: ObjectId;
    email: string;
    displayName: string;
    role: 'superadmin' | 'user';
    password: string;
  };

  const user = await UserModel.findOne({ email: body.email })
    .select('+password')
    .lean<UserWithPassword>()
    .exec();

  if (!user) throw createError(401, 'Invalid credentials');

  const ok = await bcrypt.compare(body.password, user.password);
  if (!ok) throw createError(401, 'Invalid credentials');

  const userId = String(user._id);
  const payload = { sub: userId, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  setRefreshCookie(res, refreshToken);

  res.json({
    accessToken,
    user: { id: userId, email: user.email, displayName: user.displayName, role: user.role },
  });
});

export const refresh: RequestHandler = asyncHandler((req, res) => {
  const token = readCookie(req, 'refresh_token');
  if (!token) throw createError(401, 'Missing refresh cookie');

  const decoded: JWTPayload = verifyRefresh(token);
  const accessToken = signAccessToken({ sub: decoded.sub, role: decoded.role });
  res.json({ accessToken });
});

export const logout: RequestHandler = (_req, res) => {
  clearRefreshCookie(res);
  res.status(204).send();
};

export const me: RequestHandler = asyncHandler(async (req, res) => {
  const userId = req.user?.sub;
  if (!userId) throw createError(401, 'Unauthorized');

  type PublicUser = {
    _id: ObjectId;
    email: string;
    displayName: string;
    role: 'superadmin' | 'user';
  };

  const user = await UserModel.findById(userId).lean<PublicUser>().exec();
  if (!user) throw createError(404, 'User not found');

  res.json({
    id: String(user._id),
    email: user.email,
    displayName: user.displayName,
    role: user.role,
  });
});
