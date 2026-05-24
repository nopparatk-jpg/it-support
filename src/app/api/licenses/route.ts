import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity-log';
import { License } from '@/models/License';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    await requireAuth(['admin', 'agent']);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { vendor: { $regex: search, $options: 'i' } },
        { licenseKey: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await License.countDocuments(filter);
    const licenses = await License.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      licenses,
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
    const { name, licenseKey, type, vendor, totalSeats, purchaseDate, expiryDate, cost, notes } = body;

    if (!name || !licenseKey || !vendor || !totalSeats) {
      throw new ApiError(400, 'Name, license key, vendor and total seats are required');
    }

    const existing = await License.findOne({ licenseKey });
    if (existing) {
      throw new ApiError(409, 'License key already exists');
    }

    const license = await License.create({
      name,
      licenseKey,
      type: type || 'per-seat',
      vendor,
      totalSeats,
      purchaseDate,
      expiryDate,
      cost,
      notes,
    });

    await logActivity({
      action: 'license.create',
      actor: user._id.toString(),
      license: license._id.toString(),
    });

    return NextResponse.json({ license }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
