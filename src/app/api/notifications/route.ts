import { NextRequest, NextResponse } from 'next/server';
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

export async function PATCH(req: NextRequest) {
  try {
    await connectDB();
    const user = await requireAuth();

    const { ids } = await req.json();

    if (ids && Array.isArray(ids)) {
      await Notification.updateMany(
        { _id: { $in: ids }, user: user._id },
        { isRead: true },
      );
    } else {
      // Mark all as read
      await Notification.updateMany(
        { user: user._id, isRead: false },
        { isRead: true },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
