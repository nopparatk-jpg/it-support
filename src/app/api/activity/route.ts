import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse } from '@/lib/api-utils';
import { Activity } from '@/models/Activity';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    await requireAuth(['admin']);

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    const total = await Activity.countDocuments();
    const activities = await Activity.find()
      .populate('actor', 'name email')
      .populate('ticket', 'ticketNumber subject')
      .populate('targetUser', 'name email')
      .populate('device', 'name serialNumber')
      .populate('license', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      activities,
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
