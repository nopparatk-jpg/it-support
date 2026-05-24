import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse } from '@/lib/api-utils';
import { Assignment } from '@/models/Assignment';

export async function GET() {
  try {
    await connectDB();
    const user = await requireAuth();

    const assignments = await Assignment.find({
      user: user._id,
      status: 'active',
    })
      .populate('device')
      .populate('assignedBy', 'name email')
      .sort({ assignedDate: -1 });

    return NextResponse.json({ assignments });
  } catch (error) {
    return errorResponse(error);
  }
}
