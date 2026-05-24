import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { requireAuth, hashPassword } from '@/lib/auth';
import { errorResponse, ApiError } from '@/lib/api-utils';
import { logActivity } from '@/lib/activity-log';
import { User } from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const currentUser = await requireAuth(['admin']);

    const { csv } = await req.json();
    if (!csv) {
      throw new ApiError(400, 'CSV data is required');
    }

    const lines = csv.split('\n').filter((line: string) => line.trim());
    if (lines.length < 2) {
      throw new ApiError(400, 'CSV must have a header row and at least one data row');
    }

    // Skip header row
    const dataLines = lines.slice(1);
    const defaultPassword = await hashPassword('P@ssw0rd');

    const results = { created: 0, skipped: 0, errors: [] as string[] };

    // Parse all rows first
    const parsed: { row: number; name: string; email: string; role: string; employeeId: string; department: string; position: string; tel: string }[] = dataLines.map((line: string, i: number) => {
      const cols = line.split(',').map((c: string) => c.trim());
      const [name, email, role, employeeId, department, position, tel] = cols;
      return { row: i + 2, name, email: email?.toLowerCase(), role, employeeId, department, position, tel };
    });

    // Batch lookup existing emails
    const allEmails = parsed.map((p) => p.email).filter(Boolean);
    const existingUsers = await User.find({ email: { $in: allEmails } }).select('email').lean();
    const existingEmails = new Set(existingUsers.map((u) => u.email));

    const toCreate = [];
    for (const p of parsed) {
      if (!p.name || !p.email) {
        results.errors.push(`Row ${p.row}: missing name or email`);
        results.skipped++;
        continue;
      }
      if (existingEmails.has(p.email)) {
        results.errors.push(`Row ${p.row}: email ${p.email} already exists`);
        results.skipped++;
        continue;
      }
      existingEmails.add(p.email);

      toCreate.push({
        name: p.name,
        email: p.email,
        password: defaultPassword,
        role: p.role || 'requester',
        employeeId: p.employeeId || '',
        department: p.department || '',
        position: p.position || '',
        tel: p.tel || '',
      });
    }

    if (toCreate.length > 0) {
      await User.insertMany(toCreate);
    }
    results.created = toCreate.length;

    await logActivity({
      action: 'user.bulk_import',
      actor: currentUser._id.toString(),
      metadata: { created: results.created, skipped: results.skipped },
    });

    return NextResponse.json({ results }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
