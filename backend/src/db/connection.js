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
    autoIndex: !env.isProduction,
  });
  await Promise.all([User.createIndexes(), Session.createIndexes(), PayPalOrder.createIndexes()]);
  console.log('MongoDB connected: ' + mongoose.connection.name);
  return mongoose.connection;
}

export async function disconnectDatabase() {
  await mongoose.disconnect();
}
