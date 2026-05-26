import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity-log';
import { Device } from '@/models/Device';
import { Assignment } from '@/models/Assignment';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const user = await requireAuth(['admin', 'agent']);

    const { id } = await params;
    const { userId, notes } = await req.json();

    if (!userId) {
      throw new ApiError(400, 'userId is required');
    }

    const device = await Device.findById(id);
    if (!device) {
      throw new ApiError(404, 'Device not found');
    }

    // Check for existing active assignment
    const existing = await Assignment.findOne({ device: id, status: 'active' });
    if (existing) {
      throw new ApiError(400, 'Device is already assigned');
    }

    await Assignment.create({
      device: id,
      user: userId,
      assignedBy: user._id,
      notes,
    });

    device.status = 'assigned';
    await device.save();

    await logActivity({
      action: 'assignment.create',
      actor: user._id.toString(),
      device: id,
      metadata: { userId },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
