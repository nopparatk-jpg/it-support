import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity-log';
import { User } from '@/models/User';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const currentUser = await requireAuth(['admin']);

    const { id } = await params;
    const body = await req.json();
    const allowedFields = ['name', 'email', 'role', 'employeeId', 'department', 'position', 'tel', 'isActive'];

    const update: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        update[field] = body[field];
      }
    }

    if (update.email) {
      update.email = (update.email as string).toLowerCase();
      const existing = await User.findOne({ email: update.email, _id: { $ne: id } });
      if (existing) {
        throw new ApiError(409, 'Email already exists');
      }
    }

    const user = await User.findByIdAndUpdate(id, update, { new: true });
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    await logActivity({
      action: 'user.update',
      actor: currentUser._id.toString(),
      targetUser: user._id.toString(),
      metadata: update,
    });

    return NextResponse.json({ user });
  } catch (error) {
    return errorResponse(error);
  }
}
