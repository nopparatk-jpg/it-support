import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity-log';
import { Device } from '@/models/Device';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await requireAuth(['admin', 'agent']);

    const { csv } = await req.json();
    if (!csv) {
      throw new ApiError(400, 'CSV data is required');
    }

    const lines = csv.split('\n').filter((line: string) => line.trim());
    if (lines.length < 2) {
      throw new ApiError(400, 'CSV must have a header row and at least one data row');
    }

    const dataLines = lines.slice(1);
    const results = { created: 0, skipped: 0, errors: [] as string[] };

    // Parse all rows first
    const parsed: { row: number; name: string; type: string; brand: string; model: string; serialNumber: string; status: string }[] = dataLines.map((line: string, i: number) => {
      const cols = line.split(',').map((c: string) => c.trim());
      const [name, type, brand, model, serialNumber, status] = cols;
      return { row: i + 2, name, type, brand, model, serialNumber, status };
    });

    // Batch lookup existing serial numbers
    const allSerials = parsed.map((p) => p.serialNumber).filter(Boolean);
    const existingDevices = await Device.find({ serialNumber: { $in: allSerials } }).select('serialNumber').lean();
    const existingSerials = new Set(existingDevices.map((d) => d.serialNumber));

    const toCreate = [];
    for (const p of parsed) {
      if (!p.type || !p.brand || !p.model || !p.serialNumber) {
        results.errors.push(`Row ${p.row}: missing required fields`);
        results.skipped++;
        continue;
      }
      if (existingSerials.has(p.serialNumber)) {
        results.errors.push(`Row ${p.row}: serial number ${p.serialNumber} already exists`);
        results.skipped++;
        continue;
      }
      existingSerials.add(p.serialNumber);

      toCreate.push({
        name: p.name || '',
        type: p.type,
        brand: p.brand,
        model: p.model,
        serialNumber: p.serialNumber,
        status: p.status || 'available',
      });
    }

    if (toCreate.length > 0) {
      await Device.insertMany(toCreate);
    }
    results.created = toCreate.length;

    await logActivity({
      action: 'device.import',
      actor: user._id.toString(),
      metadata: { created: results.created, skipped: results.skipped },
    });

    return NextResponse.json({ results }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
