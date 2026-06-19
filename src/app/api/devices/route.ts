import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity-log';
import { Device } from '@/models/Device';
import { Assignment } from '@/models/Assignment';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    await requireAuth(['admin', 'agent']);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const filter: Record<string, unknown> = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { serialNumber: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Device.countDocuments(filter);
    const devices = await Device.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Attach the active assignee (if any) to each device
    const assignments = await Assignment.find({
      device: { $in: devices.map((d) => d._id) },
      status: 'active',
    })
      .populate('user', 'name email')
      .lean();
    const assigneeByDevice = new Map(assignments.map((a) => [String(a.device), a.user]));
    const devicesWithUser = devices.map((d) => ({
      ...d,
      assignedTo: assigneeByDevice.get(String(d._id)) ?? null,
    }));

    return NextResponse.json({
      devices: devicesWithUser,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await requireAuth(['admin', 'agent']);

    const body = await req.json();
    const { name, type, brand, model, serialNumber, status, purchaseDate, purchasePrice, warrantyExpiry, supplier, assetTag, notes } = body;

    if (!type || !brand || !model || !serialNumber) {
      throw new ApiError(400, 'Type, brand, model and serial number are required');
    }

    const existing = await Device.findOne({ serialNumber });
    if (existing) {
      throw new ApiError(409, 'Serial number already exists');
    }

    const device = await Device.create({
      name: name || '',
      type,
      brand,
      model,
      serialNumber,
      status: status || 'available',
      purchaseDate,
      purchasePrice,
      warrantyExpiry,
      supplier,
      assetTag,
      notes,
    });

    await logActivity({
      action: 'device.create',
      actor: user._id.toString(),
      device: device._id.toString(),
    });

    return NextResponse.json({ device }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
