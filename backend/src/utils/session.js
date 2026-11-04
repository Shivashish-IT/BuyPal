import { createHash, randomBytes } from 'node:crypto';
import { env } from '../config/env.js';

export const createSessionToken = () => randomBytes(32).toString('base64url');
export const hashSessionToken = token =>
  createHash('sha256').update(token).digest('hex');

export const sessionCookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'lax',
  path: '/',
  maxAge: env.sessionTtlDays * 24 * 60 * 60 * 1000,
};
