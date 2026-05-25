import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity-log';
import { License } from '@/models/License';
import { LicenseAssignment } from '@/models/LicenseAssignment';

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

    const license = await License.findById(id);
    if (!license) {
      throw new ApiError(404, 'License not found');
    }

    if (license.usedSeats >= license.totalSeats) {
      throw new ApiError(400, 'No available seats');
    }

    // Check if user already has an active assignment for this license
    const existing = await LicenseAssignment.findOne({
      license: id,
      user: userId,
      status: 'active',
    });
    if (existing) {
      throw new ApiError(400, 'User already has this license assigned');
    }

    await LicenseAssignment.create({
      license: id,
      user: userId,
      assignedBy: user._id,
      notes,
    });

    license.usedSeats += 1;
    await license.save();

    await logActivity({
      action: 'license.assign',
      actor: user._id.toString(),
      license: id,
      metadata: { userId },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const user = await requireAuth(['admin', 'agent']);

    const { id } = await params;
    const { assignmentId } = await req.json();

    if (!assignmentId) {
      throw new ApiError(400, 'assignmentId is required');
    }

    const assignment = await LicenseAssignment.findOne({
      _id: assignmentId,
      license: id,
      status: 'active',
    });
    if (!assignment) {
      throw new ApiError(404, 'Assignment not found');
    }

    assignment.status = 'revoked';
    assignment.revokedDate = new Date();
    await assignment.save();

    await License.findByIdAndUpdate(id, { $inc: { usedSeats: -1 } });

    await logActivity({
      action: 'license.revoke',
      actor: user._id.toString(),
      license: id,
      metadata: { userId: assignment.user.toString() },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
