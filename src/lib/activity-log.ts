import { connectDB } from './mongodb';
import { Activity } from '@/models/Activity';

interface LogParams {
  action: string;
  actor: string;
  ticket?: string;
  targetUser?: string;
  device?: string;
  license?: string;
  metadata?: Record<string, unknown>;
}

export async function logActivity(params: LogParams) {
  await connectDB();
  await Activity.create(params);
}
