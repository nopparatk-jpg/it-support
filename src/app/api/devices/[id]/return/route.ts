import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity-log';
import { Device } from '@/models/Device';
import { Assignment } from '@/models/Assignment';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const user = await requireAuth(['admin', 'agent']);

    const { id } = await params;

    const device = await Device.findById(id);
    if (!device) {
      throw new ApiError(404, 'Device not found');
    }

    const assignment = await Assignment.findOne({ device: id, status: 'active' });
    if (!assignment) {
      throw new ApiError(400, 'Device is not currently assigned');
    }

    assignment.status = 'returned';
    assignment.returnDate = new Date();
    await assignment.save();

    device.status = 'available';
    await device.save();

    await logActivity({
      action: 'assignment.return',
      actor: user._id.toString(),
      device: id,
      metadata: { userId: assignment.user.toString() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
