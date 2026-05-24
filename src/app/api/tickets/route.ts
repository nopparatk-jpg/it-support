import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity-log';
import { Ticket } from '@/models/Ticket';
import { getNextTicketNumber } from '@/models/Counter';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const user = await requireAuth();

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const assignedTo = searchParams.get('assignedTo');
    const search = searchParams.get('search');

    const filter: Record<string, unknown> = {};

    if (user.role === 'requester') {
      filter.requester = user._id;
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (assignedTo) filter.assignedTo = assignedTo;
    if (search) {
      filter.$or = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Ticket.countDocuments(filter);
    const tickets = await Ticket.find(filter)
      .populate('requester', 'name email employeeId department tel')
      .populate('assignedTo', 'name email')
      .populate('category')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const user = await requireAuth();

    const body = await req.json();
    const { subject, description, category, priority, attachments } = body;

    if (!subject || !description) {
      throw new ApiError(400, 'Subject and description are required');
    }

    const ticketNumber = await getNextTicketNumber();

    const ticket = await Ticket.create({
      ticketNumber,
      subject,
      description,
      category: category || undefined,
      priority: priority || 'medium',
      requester: user._id,
      attachments: attachments || [],
    });

    await logActivity({
      action: 'ticket.create',
      actor: user._id.toString(),
      ticket: ticket._id.toString(),
    });

    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
