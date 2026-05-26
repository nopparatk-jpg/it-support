import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth, hashPassword, verifyPassword } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await requireAuth();

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      throw new ApiError(400, 'Current password and new password are required');
    }

    if (newPassword.length < 6) {
      throw new ApiError(400, 'New password must be at least 6 characters');
    }

    const valid = await verifyPassword(currentPassword, user.password);
    if (!valid) {
      throw new ApiError(400, 'Current password is incorrect');
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
