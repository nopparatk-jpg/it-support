import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'admin' | 'agent' | 'requester';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  employeeId: string;
  department: string;
  position: string;
  tel: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['admin', 'agent', 'requester'], default: 'requester' },
    employeeId: { type: String, default: '' },
    department: { type: String, default: '' },
    position: { type: String, default: '' },
    tel: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
