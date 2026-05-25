import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity-log';
import { notifyUser } from '@/lib/notify';
import { Ticket } from '@/models/Ticket';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    await requireAuth();

    const { id } = await params;
    const ticket = await Ticket.findById(id)
      .populate('requester', 'name email employeeId department tel')
      .populate('assignedTo', 'name email')
      .populate('category');

    if (!ticket) {
      throw new ApiError(404, 'Ticket not found');
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const user = await requireAuth(['admin', 'agent']);

    const { id } = await params;
    const body = await req.json();
    const { priority, assignedTo, category } = body;

    const oldTicket = await Ticket.findById(id);
    if (!oldTicket) {
      throw new ApiError(404, 'Ticket not found');
    }

    const update: Record<string, unknown> = {};
    if (priority) update.priority = priority;
    if (assignedTo !== undefined) update.assignedTo = assignedTo || null;
    if (category !== undefined) update.category = category || null;

    const ticket = await Ticket.findByIdAndUpdate(id, update, { new: true })
      .populate('requester', 'name email employeeId department tel')
      .populate('assignedTo', 'name email')
      .populate('category');

    if (!ticket) {
      throw new ApiError(404, 'Ticket not found');
    }

    await logActivity({
      action: 'ticket.update',
      actor: user._id.toString(),
      ticket: ticket._id.toString(),
      metadata: update,
    });

    // Notify assigned agent when newly assigned
    if (assignedTo && assignedTo !== oldTicket.assignedTo?.toString() && assignedTo !== user._id.toString()) {
      await notifyUser(
        assignedTo,
        'Ticket Assigned',
        `${ticket.ticketNumber}: ${ticket.subject} has been assigned to you`,
        ticket._id.toString(),
      );
    }

    // Notify requester about updates
    if (ticket.requester._id.toString() !== user._id.toString()) {
      const changes: string[] = [];
      if (priority && priority !== oldTicket.priority) changes.push(`priority → ${priority}`);
      if (assignedTo && assignedTo !== oldTicket.assignedTo?.toString()) changes.push(`assigned to ${ticket.assignedTo?.name || 'agent'}`);
      if (changes.length > 0) {
        await notifyUser(
          ticket.requester._id.toString(),
          'Ticket Updated',
          `${ticket.ticketNumber}: ${changes.join(', ')}`,
          ticket._id.toString(),
        );
      }
    }

    return NextResponse.json({ ticket });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const user = await requireAuth(['admin']);

    const { id } = await params;
    const ticket = await Ticket.findByIdAndDelete(id);
    if (!ticket) {
      throw new ApiError(404, 'Ticket not found');
    }

    await logActivity({
      action: 'ticket.delete',
      actor: user._id.toString(),
      metadata: { ticketNumber: ticket.ticketNumber, subject: ticket.subject },
    });

    return NextResponse.json({ message: 'Ticket deleted' });
  } catch (error) {
    return errorResponse(error);
  }
}
