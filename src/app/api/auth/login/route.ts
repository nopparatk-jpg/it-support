import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { verifyPassword, signToken } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity-log';
import { User } from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { email, password } = await req.json();

    if (!email || !password) {
      throw new ApiError(400, 'Email and password are required');
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !user.isActive) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const valid = await verifyPassword(password, user.password);
    if (!valid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const token = signToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    await logActivity({ action: 'login', actor: user._id.toString() });

    const { password: _, ...userObj } = user.toObject();

    const response = NextResponse.json({ user: userObj });
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    return errorResponse(error);
  }
}
