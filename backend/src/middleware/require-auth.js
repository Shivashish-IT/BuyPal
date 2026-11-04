import { pool } from '../db/pool.js';
import { env } from '../config/env.js';
import { hashSessionToken } from '../utils/session.js';

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[env.cookieName];
    if (!token) return res.status(401).json({ message: 'Authentication required.' });

    const result = await pool.query(
      `SELECT u.id, u.email, u.display_name
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > NOW() AND u.disabled_at IS NULL`,
      [hashSessionToken(token)],
    );

    if (!result.rowCount) {
      res.clearCookie(env.cookieName, { httpOnly: true, secure: env.isProduction, sameSite: 'lax', path: '/' });
      return res.status(401).json({ message: 'Session expired. Please sign in again.' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    next(error);
  }
}
