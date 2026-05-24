import mongoose from 'mongoose';
import { env } from './env';

const cached = (global as Record<string, unknown>).__mongoose as {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
} | undefined;

const mongoCache = cached ?? { conn: null, promise: null };
(global as Record<string, unknown>).__mongoose = mongoCache;

export async function connectDB() {
  if (mongoCache.conn) return mongoCache.conn;
  if (!mongoCache.promise) {
    mongoCache.promise = mongoose.connect(env.MONGODB_URI);
  }
  mongoCache.conn = await mongoCache.promise;
  return mongoCache.conn;
}
