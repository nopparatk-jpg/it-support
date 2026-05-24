import mongoose, { Schema, Document } from 'mongoose';

export interface IAssignment extends Document {
  device: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  assignedDate: Date;
  returnDate?: Date;
  status: 'active' | 'returned';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
  {
    device: { type: Schema.Types.ObjectId, ref: 'Device', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedDate: { type: Date, default: Date.now },
    returnDate: Date,
    status: { type: String, enum: ['active', 'returned'], default: 'active' },
    notes: String,
  },
  { timestamps: true },
);

AssignmentSchema.index({ device: 1, status: 1 });
AssignmentSchema.index({ user: 1, status: 1 });

export const Assignment = mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', AssignmentSchema);
