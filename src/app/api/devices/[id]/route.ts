import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity-log';
import { Device } from '@/models/Device';
import { Assignment } from '@/models/Assignment';
import { deletePhotosByUrls } from '@/lib/google-drive';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    await requireAuth(['admin', 'agent']);

    const { id } = await params;
    const device = await Device.findById(id);
    if (!device) {
      throw new ApiError(404, 'Device not found');
    }

    const assignments = await Assignment.find({ device: id })
      .populate('user', 'name email employeeId department')
      .sort({ assignedDate: -1 });

    const active = assignments.find((a) => a.status === 'active');
    const currentAssignee = active?.user ?? null;

    return NextResponse.json({ device, assignments, currentAssignee });
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

    const allowedFields = ['name', 'type', 'brand', 'model', 'serialNumber', 'status', 'purchaseDate', 'purchasePrice', 'warrantyExpiry', 'supplier', 'assetTag', 'photos', 'notes'];
    const update: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in body) update[key] = body[key];
    }

    if ('photos' in body) {
      const existing = await Device.findById(id);
      if (existing) {
        const incomingUrls = new Set(
          ((body.photos ?? []) as { url: string }[]).map((p) => p.url),
        );
        const removedUrls = existing.photos
          .filter((p: { url: string }) => !incomingUrls.has(p.url))
          .map((p: { url: string }) => p.url);
        if (removedUrls.length) {
          await deletePhotosByUrls(removedUrls);
        }
      }
    }

    const device = await Device.findByIdAndUpdate(id, update, { new: true });
    if (!device) {
      throw new ApiError(404, 'Device not found');
    }

    await logActivity({
      action: 'device.update',
      actor: user._id.toString(),
      device: device._id.toString(),
    });

    return NextResponse.json({ device });
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

    const activeAssignments = await Assignment.countDocuments({ device: id, status: 'active' });
    if (activeAssignments > 0) {
      throw new ApiError(400, 'Cannot delete device with active assignments');
    }

    const device = await Device.findByIdAndDelete(id);
    if (!device) {
      throw new ApiError(404, 'Device not found');
    }

    if (device.photos?.length) {
      await deletePhotosByUrls(device.photos.map((p: { url: string }) => p.url));
    }

    await logActivity({
      action: 'device.delete',
      actor: user._id.toString(),
      device: id,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
