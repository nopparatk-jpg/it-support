import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity-log';
import { Assignment } from '@/models/Assignment';
import { Device } from '@/models/Device';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    await requireAuth(['admin', 'agent']);

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('user');
    const deviceId = searchParams.get('device');
    const status = searchParams.get('status');

    const filter: Record<string, unknown> = {};
    if (userId) filter.user = userId;
    if (deviceId) filter.device = deviceId;
    if (status) filter.status = status;

    const assignments = await Assignment.find(filter)
      .populate('device')
      .populate('user', 'name email employeeId department')
      .populate('assignedBy', 'name email')
      .sort({ createdAt: -1 });

    return NextResponse.json({ assignments });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await requireAuth(['admin', 'agent']);

    const { device: deviceId, user: assignToUserId, notes } = await req.json();

    if (!deviceId || !assignToUserId) {
      throw new ApiError(400, 'Device and user are required');
    }

    const device = await Device.findById(deviceId);
    if (!device) {
      throw new ApiError(404, 'Device not found');
    }

    const assignment = await Assignment.create({
      device: deviceId,
      user: assignToUserId,
      assignedBy: user._id,
      notes: notes || '',
    });

    device.status = 'assigned';
    await device.save();

    await logActivity({
      action: 'assignment.create',
      actor: user._id.toString(),
      device: deviceId,
      targetUser: assignToUserId,
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
