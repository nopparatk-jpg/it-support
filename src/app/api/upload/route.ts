import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/api-utils';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    await requireAuth();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      throw new ApiError(400, 'File is required');
    }

    const blob = await put(file.name, file, {
      access: 'public',
    });

    return NextResponse.json({
      url: blob.url,
      name: file.name,
      size: file.size,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
