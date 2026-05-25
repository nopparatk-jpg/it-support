import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse } from '@/lib/api-utils';
import { Setting } from '@/models/Setting';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    await connectDB();
    await requireAuth();

    const { key } = await params;
    const setting = await Setting.findOne({ key });
    const values = setting?.values ?? [];

    // Return both { values } and { [key] } for compatibility
    return NextResponse.json({ values, [key]: values });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ key: string }> },
) {
  try {
    await connectDB();
    await requireAuth(['admin']);

    const { key } = await params;
    const { values } = await req.json();

    const setting = await Setting.findOneAndUpdate(
      { key },
      { key, values },
      { upsert: true, new: true },
    );

    const updated = setting.values;
    return NextResponse.json({ values: updated, [key]: updated });
  } catch (error) {
    return errorResponse(error);
  }
}
