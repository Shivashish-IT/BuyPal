import { Router } from 'express';
import argon2 from 'argon2';
import { z } from 'zod';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/async-handler.js';
import { createSessionToken, hashSessionToken, sessionCookieOptions } from '../utils/session.js';
import { requireAuth } from '../middleware/require-auth.js';

const router = Router();
const credentialsSchema = z.object({
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  password: z.string().min(8).max(128),
});
const registerSchema = credentialsSchema.extend({
  name: z.string().trim().min(2).max(80),
});

function publicUser(user) {
  return { id: user._id.toString(), email: user.email, name: user.displayName };
}

async function issueSession(userId, req, res) {
  const token = createSessionToken();
  const expiresAt = new Date(Date.now() + env.sessionTtlDays * 86400_000);

  await Session.create({
    userId,
    tokenHash: hashSessionToken(token),
    expiresAt,
    userAgent: req.get('user-agent')?.slice(0, 500) || null,
    ipAddress: req.ip || null,
  });
  res.cookie(env.cookieName, token, sessionCookieOptions);
}

router.post('/register', asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Please provide a valid name, email and password.' });

  const { name, email, password } = parsed.data;
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  try {
    const user = await User.create({ email, displayName: name, passwordHash });
    await issueSession(user._id, req, res);
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ message: 'An account with this email already exists.' });
    throw error;
  }
}));

router.post('/login', asyncHandler(async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Enter a valid email and password.' });

  const { email, password } = parsed.data;
  const user = await User.findOne({ email, disabledAt: null }).select('+passwordHash');
  const valid = user ? await argon2.verify(user.passwordHash, password).catch(() => false) : false;
  if (!valid) return res.status(401).json({ message: 'Invalid email or password.' });

  await Session.deleteMany({ userId: user._id });
  await issueSession(user._id, req, res);
  return res.json({ user: publicUser(user) });
}));

router.post('/logout', asyncHandler(async (req, res) => {
  const token = req.cookies?.[env.cookieName];
  if (token) await Session.deleteOne({ tokenHash: hashSessionToken(token) });
  res.clearCookie(env.cookieName, { httpOnly: true, secure: env.isProduction, sameSite: 'lax', path: '/' });
  return res.status(204).end();
}));

router.get('/session', requireAuth, (req, res) => {
  res.json({ user: { id: req.user.id, email: req.user.email, name: req.user.display_name } });
});

export default router;
