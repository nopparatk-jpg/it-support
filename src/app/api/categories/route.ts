import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity-log';
import { Category } from '@/models/Category';

export async function GET() {
  try {
    await connectDB();
    await requireAuth();

    const categories = await Category.find().sort({ name: 1 });
    return NextResponse.json({ categories });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await requireAuth(['admin']);

    const { name } = await req.json();
    if (!name) {
      throw new ApiError(400, 'Name is required');
    }

    const existing = await Category.findOne({ name });
    if (existing) {
      throw new ApiError(409, 'Category already exists');
    }

    const category = await Category.create({ name });

    await logActivity({
      action: 'category.create',
      actor: user._id.toString(),
      metadata: { name },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
