import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity-log';
import { License } from '@/models/License';

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

    const parsed: { row: number; name: string; licenseKey: string; type: string; vendor: string; totalSeats: string; expiryDate: string; cost: string; status: string }[] = dataLines.map((line: string, i: number) => {
      const cols = line.split(',').map((c: string) => c.trim());
      const [name, licenseKey, type, vendor, totalSeats, expiryDate, cost, status] = cols;
      return { row: i + 2, name, licenseKey, type, vendor, totalSeats, expiryDate, cost, status };
    });

    // Batch lookup existing license keys
    const allKeys = parsed.map((p) => p.licenseKey).filter(Boolean);
    const existingLicenses = await License.find({ licenseKey: { $in: allKeys } }).select('licenseKey').lean();
    const existingKeys = new Set(existingLicenses.map((l) => l.licenseKey));

    const toCreate = [];
    for (const p of parsed) {
      if (!p.name || !p.licenseKey) {
        results.errors.push(`Row ${p.row}: missing name or license key`);
        results.skipped++;
        continue;
      }
      if (existingKeys.has(p.licenseKey)) {
        results.errors.push(`Row ${p.row}: license key ${p.licenseKey} already exists`);
        results.skipped++;
        continue;
      }
      existingKeys.add(p.licenseKey);

      toCreate.push({
        name: p.name,
        licenseKey: p.licenseKey,
        type: p.type || 'per-seat',
        vendor: p.vendor || '',
        totalSeats: p.totalSeats ? Number(p.totalSeats) : 1,
        usedSeats: 0,
        expiryDate: p.expiryDate ? new Date(p.expiryDate) : undefined,
        cost: p.cost ? Number(p.cost) : undefined,
        status: p.status || 'active',
      });
    }

    if (toCreate.length > 0) {
      await License.insertMany(toCreate);
    }
    results.created = toCreate.length;

    await logActivity({
      action: 'license.import',
      actor: user._id.toString(),
      metadata: { created: results.created, skipped: results.skipped },
    });

    return NextResponse.json({ results }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
