import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Session } from '../models/Session.js';
import { PayPalOrder } from '../models/PayPalOrder.js';

export async function connectDatabase() {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongodbUri, {
    serverSelectionTimeoutMS: 10_000,
    maxPoolSize: 10,
    autoIndex: env.isProduction ? false : true,
  });

  // Ensure unique and TTL indexes exist even when automatic index creation is disabled.
  await Promise.all([User.init(), Session.init(), PayPalOrder.init()]);
  console.log(\`MongoDB connected: \${mongoose.connection.name}\`);
  return mongoose.connection;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
