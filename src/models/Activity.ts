import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
  action: string;
  actor: mongoose.Types.ObjectId;
  ticket?: mongoose.Types.ObjectId;
  targetUser?: mongoose.Types.ObjectId;
  device?: mongoose.Types.ObjectId;
  license?: mongoose.Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    action: { type: String, required: true },
    actor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    ticket: { type: Schema.Types.ObjectId, ref: 'Ticket' },
    targetUser: { type: Schema.Types.ObjectId, ref: 'User' },
    device: { type: Schema.Types.ObjectId, ref: 'Device' },
    license: { type: Schema.Types.ObjectId, ref: 'License' },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

ActivitySchema.index({ createdAt: -1 });
ActivitySchema.index({ ticket: 1, createdAt: -1 });
ActivitySchema.index({ actor: 1, createdAt: -1 });

export const Activity = mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);
