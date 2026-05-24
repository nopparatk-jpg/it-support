import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth, hashPassword } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity-log';
import { User } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    await requireAuth(['admin']);

    const { searchParams } = new URL(req.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');

    const filter: Record<string, unknown> = {};
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({ users });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const currentUser = await requireAuth(['admin']);

    const body = await req.json();
    const { name, email, password, role, employeeId, department, position, tel } = body;

    if (!name || !email || !password) {
      throw new ApiError(400, 'Name, email and password are required');
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      throw new ApiError(409, 'Email already exists');
    }

    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role || 'requester',
      employeeId: employeeId || '',
      department: department || '',
      position: position || '',
      tel: tel || '',
    });

    await logActivity({
      action: 'user.create',
      actor: currentUser._id.toString(),
      targetUser: user._id.toString(),
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
