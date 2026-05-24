import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity-log';
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

    return NextResponse.json({ ticket });
  } catch (error) {
    return errorResponse(error);
  }
}
