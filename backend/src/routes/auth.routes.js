import { Router } from 'express';
import argon2 from 'argon2';
import { z } from 'zod';
import { pool } from '../db/pool.js';
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
  return { id: user.id, email: user.email, name: user.display_name };
}

async function issueSession(userId, req, res) {
  const token = createSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + env.sessionTtlDays * 86400_000);

  await pool.query(
    `INSERT INTO sessions (user_id, token_hash, expires_at, user_agent, ip_address)
     VALUES ($1, $2, $3, $4, $5)`,
    [userId, tokenHash, expiresAt, req.get('user-agent')?.slice(0, 500) || null, req.ip],
  );
  res.cookie(env.cookieName, token, sessionCookieOptions);
}

router.post('/register', asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Please provide a valid name, email and password.' });

  const { name, email, password } = parsed.data;
  const passwordHash = await argon2.hash(password, { type: argon2.argon2id });

  try {
    const result = await pool.query(
      'INSERT INTO users (email, display_name, password_hash) VALUES ($1, $2, $3) RETURNING id, email, display_name',
      [email, name, passwordHash],
    );
    const user = result.rows[0];
    await issueSession(user.id, req, res);
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ message: 'An account with this email already exists.' });
    throw error;
  }
}));

router.post('/login', asyncHandler(async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: 'Enter a valid email and password.' });

  const { email, password } = parsed.data;
  const result = await pool.query(
    'SELECT id, email, display_name, password_hash FROM users WHERE email = $1 AND disabled_at IS NULL',
    [email],
  );
  const user = result.rows[0];
  const valid = user ? await argon2.verify(user.password_hash, password).catch(() => false) : false;
  if (!valid) return res.status(401).json({ message: 'Invalid email or password.' });

  await pool.query('DELETE FROM sessions WHERE user_id = $1', [user.id]);
  await issueSession(user.id, req, res);
  return res.json({ user: publicUser(user) });
}));

router.post('/logout', asyncHandler(async (req, res) => {
  const token = req.cookies?.[env.cookieName];
  if (token) {
    await pool.query('DELETE FROM sessions WHERE token_hash = $1', [hashSessionToken(token)]);
  }
  res.clearCookie(env.cookieName, { httpOnly: true, secure: env.isProduction, sameSite: 'lax', path: '/' });
  return res.status(204).end();
}));

router.get('/session', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

export default router;
