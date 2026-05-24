import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse } from '@/lib/api-utils';
import { Device } from '@/models/Device';

export async function GET() {
  try {
    await connectDB();
    await requireAuth(['admin', 'agent']);

    const devices = await Device.find().sort({ createdAt: -1 });

    const header = 'name,type,brand,model,serialNumber,status,purchaseDate,purchasePrice,warrantyExpiry,supplier,assetTag';
    const rows = devices.map((d) =>
      [
        d.name,
        d.type,
        d.brand,
        d.model,
        d.serialNumber,
        d.status,
        d.purchaseDate ? d.purchaseDate.toISOString().split('T')[0] : '',
        d.purchasePrice ?? '',
        d.warrantyExpiry ? d.warrantyExpiry.toISOString().split('T')[0] : '',
        d.supplier ?? '',
        d.assetTag ?? '',
      ].join(','),
    );

    const csvContent = [header, ...rows].join('\n');

    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="devices.csv"',
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
