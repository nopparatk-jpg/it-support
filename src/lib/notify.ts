import { Notification } from '@/models/Notification';
import { User } from '@/models/User';
import mongoose from 'mongoose';

interface NotifyOptions {
  userId: string | mongoose.Types.ObjectId;
  title: string;
  message: string;
  ticketId?: string | mongoose.Types.ObjectId;
}

export async function notify(opts: NotifyOptions) {
  await Notification.create({
    user: opts.userId,
    title: opts.title,
    message: opts.message,
    ticket: opts.ticketId,
  });
}

export async function notifyUser(userId: string, title: string, message: string, ticketId?: string) {
  await notify({ userId, title, message, ticketId });
}

export async function notifyAgents(title: string, message: string, ticketId?: string, excludeUserId?: string) {
  const agents = await User.find({
    role: { $in: ['admin', 'agent'] },
    isActive: true,
    ...(excludeUserId ? { _id: { $ne: excludeUserId } } : {}),
  }).select('_id').lean();

  if (agents.length === 0) return;

  await Notification.insertMany(
    agents.map((a) => ({
      user: a._id,
      title,
      message,
      ticket: ticketId,
    })),
  );
}
