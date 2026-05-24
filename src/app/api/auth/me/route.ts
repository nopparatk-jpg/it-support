import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse } from '@/lib/api-utils';

export async function GET() {
  try {
    await connectDB();
    const user = await requireAuth();
    return NextResponse.json({ user });
  } catch (error) {
    return errorResponse(error);
  }
}
