import 'dotenv/config';

const required = ['DATABASE_URL'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL,
  sessionTtlDays: Math.max(1, Math.min(30, Number(process.env.SESSION_TTL_DAYS || 7))),
  cookieName: process.env.COOKIE_NAME || 'buypal_session',
  isProduction: process.env.NODE_ENV === 'production',
};
