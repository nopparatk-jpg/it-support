import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity-log';
import { License } from '@/models/License';
import { LicenseAssignment } from '@/models/LicenseAssignment';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    await requireAuth(['admin', 'agent']);

    const { id } = await params;
    const license = await License.findById(id);
    if (!license) {
      throw new ApiError(404, 'License not found');
    }

    const assignments = await LicenseAssignment.find({ license: id })
      .populate('user', 'name email employeeId department')
      .sort({ assignedDate: -1 });

    return NextResponse.json({ license, assignments });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const user = await requireAuth(['admin', 'agent']);

    const { id } = await params;
    const body = await req.json();

    const allowedFields = ['name', 'licenseKey', 'type', 'vendor', 'totalSeats', 'usedSeats', 'expiryDate', 'purchaseDate', 'cost', 'status', 'notes'];
    const update: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) update[key] = body[key];
    }

    const license = await License.findByIdAndUpdate(id, update, { new: true });
    if (!license) {
      throw new ApiError(404, 'License not found');
    }

    await logActivity({
      action: 'license.update',
      actor: user._id.toString(),
      license: license._id.toString(),
    });

    return NextResponse.json({ license });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const user = await requireAuth(['admin', 'agent']);

    const { id } = await params;
    const license = await License.findByIdAndDelete(id);
    if (!license) {
      throw new ApiError(404, 'License not found');
    }

    await logActivity({
      action: 'license.delete',
      actor: user._id.toString(),
      license: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
