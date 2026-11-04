import 'dotenv/config';

const required = ['DATABASE_URL'];
for (const key of required) {
  if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}

const paypalMode = process.env.PAYPAL_MODE || 'sandbox';
const paypalBaseUrl = process.env.PAYPAL_BASE_URL || 'https://api-m.sandbox.paypal.com';
if (paypalMode === 'sandbox' && !paypalBaseUrl.startsWith('https://api-m.sandbox.paypal.com')) {
  throw new Error('PayPal Sandbox mode must use https://api-m.sandbox.paypal.com');
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL,
  sessionTtlDays: Math.max(1, Math.min(30, Number(process.env.SESSION_TTL_DAYS || 7))),
  cookieName: process.env.COOKIE_NAME || 'buypal_session',
  isProduction: process.env.NODE_ENV === 'production',
  paypal: {
    mode: paypalMode,
    baseUrl: paypalBaseUrl,
    clientId: process.env.PAYPAL_CLIENT_ID || '',
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || '',
    currency: process.env.PAYPAL_CURRENCY || 'USD',
  },
};
