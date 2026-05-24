import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity-log';
import { Assignment } from '@/models/Assignment';
import { Device } from '@/models/Device';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const user = await requireAuth(['admin', 'agent']);

    const { id } = await params;
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      throw new ApiError(404, 'Assignment not found');
    }

    if (assignment.status === 'returned') {
      throw new ApiError(400, 'Assignment already returned');
    }

    assignment.status = 'returned';
    assignment.returnDate = new Date();
    await assignment.save();

    await Device.findByIdAndUpdate(assignment.device, { status: 'available' });

    await logActivity({
      action: 'assignment.return',
      actor: user._id.toString(),
      device: assignment.device.toString(),
      targetUser: assignment.user.toString(),
    });

    return NextResponse.json({ assignment });
  } catch (error) {
    return errorResponse(error);
  }
}
