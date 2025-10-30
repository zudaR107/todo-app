import type { RequestHandler } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import createError from "http-errors";
import { env } from "../config/env.js"

type Role = 'superadmin' | 'user';

type TokenSubject = {
    sub: string;
    role: Role;
}

export type JWTPayload = JwtPayload & TokenSubject; 

function isJWTPayload(val: unknown): val is JWTPayload {
    if (!val || typeof val !== 'object') return false;
    const p = val as Partial<JwtPayload & { role?: unknown }>;
    return typeof p.sub === 'string' && (p.role === 'superadmin' || p.role === 'user');
}

function ttlToMs(ttl: NonNullable<import('jsonwebtoken').SignOptions['expiresIn']>): number {
    if (typeof ttl === 'number') return ttl * 1000; // seconds -> ms
    // "15m", "7d", "3600"
    if (/^\d+$/.test(ttl)) return Number(ttl) * 1000;
    const m = /^(\d+)([smhd])$/.exec(ttl);
    if (!m) throw new Error(`Unsupported expiresIn format: ${ttl}`);
    const n = Number(m[1]);
    const unit = m[2] as 's' | 'm' | 'h' | 'd';
    const mult = { s: 1_000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
    return n * mult;
}

export function signAccessToken(payload: TokenSubject) {
    return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TTL });
}

export function signRefreshToken(payload: TokenSubject) {
    return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.REFRESH_TTL });
}

export function verifyAccess(token: string): JWTPayload {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    if (!isJWTPayload(decoded)) throw createError(401, 'Invalid token payload');
    return decoded;
}

export function verifyRefresh(token: string): JWTPayload {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
    if (!isJWTPayload(decoded)) throw createError(401, 'Invalid token payload');
    return decoded;
}

declare module 'express-serve-static-core' {
    interface Request {
        user?: JWTPayload;
    }
} 

export const authGuard: RequestHandler = (req, _res, next) => {
    const header = req.get('authorization') || '';
    const token = header.toLowerCase().startsWith('bearer ') ? header.slice(7) : null;
    if (!token) return next(createError(401, 'Missing Authorization header'));

    try {
        const payload = verifyAccess(token);
        req.user = payload;
        next();
    } catch {
        next(createError(401, 'Invalid or expired token'));
    }
};

export function requireRole(role: Role): RequestHandler {
    return (req, _res, next) => {
        if (!req.user) return next(createError(401, 'Unauthorized'));
        if (req.user.role !== role) return next(createError(403, 'Forbidden'));
        next();
    };
}

export function setRefreshCookie(res: import("express").Response, token: string) {
    const secure = process.env.NODE_ENV === 'production';
    res.cookie('refresh_token', token, {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        path: '/api/auth/refresh',
        maxAge: ttlToMs(env.REFRESH_TTL)
    });
}

export function clearRefreshCookie(res: import("express").Response) {
    const secure = process.env.NODE_ENV === 'production';
    res.clearCookie('refresh_token', {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        path: '/api/auth/refresh'
    });
}
