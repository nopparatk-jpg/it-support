import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { env } from './env';
import { connectDB } from './mongodb';
import { User, type IUser, type UserRole } from '@/models/User';
import { ApiError } from './api-utils';

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: JWTPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
}

export async function getCurrentUser(): Promise<IUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    if (!token) return null;

    const payload = verifyToken(token);
    await connectDB();
    const user = await User.findById(payload.userId);
    if (!user || !user.isActive) return null;
    return user;
  } catch {
    return null;
  }
}

export async function requireAuth(allowedRoles?: UserRole[]): Promise<IUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, 'Unauthorized');
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new ApiError(403, 'Forbidden');
  }
  return user;
}
