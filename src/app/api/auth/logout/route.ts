import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { getCurrentUser } from '@/lib/auth';
import { errorResponse } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity-log';

export async function POST() {
  try {
    await connectDB();
    const user = await getCurrentUser();

    if (user) {
      await logActivity({ action: 'logout', actor: user._id.toString() });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
