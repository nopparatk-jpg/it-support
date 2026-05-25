import mongoose, { Schema, Document } from 'mongoose';

export interface ILicenseAssignment extends Document {
  license: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  assignedBy: mongoose.Types.ObjectId;
  assignedDate: Date;
  revokedDate?: Date;
  status: 'active' | 'revoked';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LicenseAssignmentSchema = new Schema<ILicenseAssignment>(
  {
    license: { type: Schema.Types.ObjectId, ref: 'License', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedDate: { type: Date, default: Date.now },
    revokedDate: Date,
    status: { type: String, enum: ['active', 'revoked'], default: 'active' },
    notes: String,
  },
  { timestamps: true },
);

LicenseAssignmentSchema.index({ license: 1, status: 1 });
LicenseAssignmentSchema.index({ user: 1, status: 1 });

export const LicenseAssignment =
  mongoose.models.LicenseAssignment ||
  mongoose.model<ILicenseAssignment>('LicenseAssignment', LicenseAssignmentSchema);
