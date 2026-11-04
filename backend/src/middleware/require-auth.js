import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { env } from '../config/env.js';
import { hashSessionToken } from '../utils/session.js';

export async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[env.cookieName];
    if (!token) return res.status(401).json({ message: 'Authentication required.' });

    const session = await Session.findOne({
      tokenHash: hashSessionToken(token),
      expiresAt: { $gt: new Date() },
    }).select('+tokenHash').lean();

    if (!session) {
      res.clearCookie(env.cookieName, { httpOnly: true, secure: env.isProduction, sameSite: 'lax', path: '/' });
      return res.status(401).json({ message: 'Session expired. Please sign in again.' });
    }

    const user = await User.findOne({ _id: session.userId, disabledAt: null })
      .select('_id email displayName')
      .lean();

    if (!user) {
      await Session.deleteOne({ _id: session._id });
      res.clearCookie(env.cookieName, { httpOnly: true, secure: env.isProduction, sameSite: 'lax', path: '/' });
      return res.status(401).json({ message: 'Session expired. Please sign in again.' });
    }

    req.user = { id: user._id.toString(), email: user.email, display_name: user.displayName };
    return next();
  } catch (error) {
    return next(error);
  }
}
