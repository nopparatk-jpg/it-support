import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/api-utils';
import { uploadPhoto, deletePhoto, extractFileId } from '@/lib/google-drive';

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    await requireAuth();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      throw new ApiError(400, 'File is required');
    }
    if (!file.type.startsWith('image/')) {
      throw new ApiError(400, 'Only image files are allowed');
    }
    if (file.size > MAX_SIZE) {
      throw new ApiError(400, 'File is too large (max 10MB)');
    }

    const result = await uploadPhoto(file);

    return NextResponse.json({
      url: result.url,
      name: result.name,
      size: file.size,
      fileId: result.fileId,
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    await requireAuth();

    const { url } = await req.json();
    if (!url) {
      throw new ApiError(400, 'url is required');
    }

    const fileId = extractFileId(url);
    if (fileId) {
      await deletePhoto(fileId);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return errorResponse(error);
  }
}
