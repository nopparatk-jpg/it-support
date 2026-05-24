import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity-log';
import { Ticket } from '@/models/Ticket';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const user = await requireAuth();

    const { id } = await params;
    const { status } = await req.json();

    if (!status) {
      throw new ApiError(400, 'Status is required');
    }

    const ticket = await Ticket.findById(id);
    if (!ticket) {
      throw new ApiError(404, 'Ticket not found');
    }

    // Requester can only close a resolved ticket
    if (user.role === 'requester') {
      if (status !== 'closed' || ticket.status !== 'resolved') {
        throw new ApiError(403, 'Requester can only close a resolved ticket');
      }
      if (ticket.requester.toString() !== user._id.toString()) {
        throw new ApiError(403, 'You can only close your own tickets');
      }
    }

    const oldStatus = ticket.status;
    ticket.status = status;
    await ticket.save();

    await logActivity({
      action: 'ticket.status_change',
      actor: user._id.toString(),
      ticket: ticket._id.toString(),
      metadata: { from: oldStatus, to: status },
    });

    return NextResponse.json({ ticket });
  } catch (error) {
    return errorResponse(error);
  }
}
