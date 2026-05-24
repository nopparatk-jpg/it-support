import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity-log';
import { Comment } from '@/models/Comment';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const user = await requireAuth();

    const { id } = await params;
    const filter: Record<string, unknown> = { ticket: id };

    // Requesters can only see public comments
    if (user.role === 'requester') {
      filter.type = 'public';
    }

    const comments = await Comment.find(filter)
      .populate('author', 'name email role')
      .sort({ createdAt: 1 });

    return NextResponse.json({ comments });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const user = await requireAuth();

    const { id } = await params;
    const { content, type = 'public', attachments = [] } = await req.json();

    if (!content) {
      throw new ApiError(400, 'Content is required');
    }

    // Only admin/agent can write internal notes
    if (type === 'internal' && user.role === 'requester') {
      throw new ApiError(403, 'Only admin/agent can write internal notes');
    }

    const comment = await Comment.create({
      ticket: id,
      author: user._id,
      content,
      type,
      attachments,
    });

    await comment.populate('author', 'name email role');

    await logActivity({
      action: 'ticket.comment',
      actor: user._id.toString(),
      ticket: id,
      metadata: { type },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
