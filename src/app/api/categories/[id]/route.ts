import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/api-utils';
import { Category } from '@/models/Category';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    await requireAuth(['admin']);

    const { id } = await params;
    const body = await req.json();
    const update: Record<string, unknown> = {};

    if (body.name !== undefined) update.name = body.name;
    if (body.isActive !== undefined) update.isActive = body.isActive;

    const category = await Category.findByIdAndUpdate(id, update, { new: true });
    if (!category) {
      throw new ApiError(404, 'Category not found');
    }

    return NextResponse.json({ category });
  } catch (error) {
    return errorResponse(error);
  }
}
