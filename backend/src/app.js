import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit';
import { env } from './config/env.js';
import authRoutes from './routes/auth.routes.js';
import paypalRoutes from './routes/paypal.routes.js';
import circleRoutes from './routes/circle.routes.js';
import approvalRoutes from './routes/approval.routes.js';
import productRoutes from './routes/product.routes.js';

export const app = express();

app.disable('x-powered-by');
app.set('trust proxy', env.isProduction ? 1 : false);
app.use(helmet());
app.use(cors({
  origin: env.frontendOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Idempotency-Key'],
}));
app.use(express.json({ limit: '32kb' }));
app.use(cookieParser());

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'buypal-api' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many authentication attempts. Please try again later.' },
});
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many payment requests. Please try again later.' },
});
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/paypal', paymentLimiter, paypalRoutes);
app.use('/api/v1/circles', circleRoutes);
app.use('/api/v1/approvals', approvalRoutes);
app.use('/api/v1/products', productRoutes);

app.use((_req, res) => res.status(404).json({ message: 'Route not found.' }));

app.use((error, _req, res, _next) => {
  console.error('API request failed:', error.message);
  res.status(error.status || 500).json({
    message: error.status ? error.message : 'An unexpected server error occurred.',
  });
});
