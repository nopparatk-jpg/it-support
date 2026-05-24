import mongoose, { Schema, Document } from 'mongoose';

export interface ITicket extends Document {
  ticketNumber: string;
  subject: string;
  description: string;
  category: mongoose.Types.ObjectId;
  priority: string;
  status: string;
  requester: mongoose.Types.ObjectId;
  assignedTo: mongoose.Types.ObjectId | null;
  attachments: { name: string; url: string; size: number }[];
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<ITicket>(
  {
    ticketNumber: { type: String, required: true, unique: true },
    subject: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category' },
    priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
    status: { type: String, enum: ['open', 'in_progress', 'waiting', 'resolved', 'closed'], default: 'open' },
    requester: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    attachments: [{ name: String, url: String, size: Number }],
  },
  { timestamps: true },
);

TicketSchema.index({ status: 1 });
TicketSchema.index({ requester: 1 });
TicketSchema.index({ assignedTo: 1 });
TicketSchema.index({ category: 1 });

export const Ticket = mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);
