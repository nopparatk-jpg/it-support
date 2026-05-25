import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse } from '@/lib/api-utils';
import { Ticket } from '@/models/Ticket';
import { Device } from '@/models/Device';
import { License } from '@/models/License';
import { Assignment } from '@/models/Assignment';

export async function GET() {
  try {
    await connectDB();
    await requireAuth(['admin', 'agent']);

    const [
      ticketsByStatus,
      devicesByStatus,
      devicesByType,
      licensesByStatus,
      licenseSeats,
      activeAssignmentsCount,
      unassignedTicketsCount,
    ] = await Promise.all([
      Ticket.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Device.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Device.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ]),
      License.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      License.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: null, totalSeats: { $sum: '$totalSeats' }, usedSeats: { $sum: '$usedSeats' } } },
      ]),
      Assignment.countDocuments({ status: 'active' }),
      Ticket.countDocuments({
        assignedTo: null,
        status: { $in: ['open', 'in_progress', 'waiting'] },
      }),
    ]);

    const seats = licenseSeats[0] ?? { totalSeats: 0, usedSeats: 0 };

    return NextResponse.json({
      ticketsByStatus: Object.fromEntries(ticketsByStatus.map((r: { _id: string; count: number }) => [r._id, r.count])),
      devicesByStatus: Object.fromEntries(devicesByStatus.map((r: { _id: string; count: number }) => [r._id, r.count])),
      devicesByType: Object.fromEntries(devicesByType.map((r: { _id: string; count: number }) => [r._id, r.count])),
      licensesByStatus: Object.fromEntries(licensesByStatus.map((r: { _id: string; count: number }) => [r._id, r.count])),
      licenseSeats: { total: seats.totalSeats, used: seats.usedSeats },
      activeAssignmentsCount,
      unassignedTicketsCount,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
