import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse } from '@/lib/api-utils';
import { Notification } from '@/models/Notification';

export async function GET() {
  try {
    await connectDB();
    const user = await requireAuth();

    const notifications = await Notification.find({ user: user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    return NextResponse.json({ notifications });
  } catch (error) {
    return errorResponse(error);
  }
}
