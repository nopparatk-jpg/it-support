import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  ticket: mongoose.Types.ObjectId;
  author: mongoose.Types.ObjectId;
  content: string;
  type: 'public' | 'internal';
  attachments: { name: string; url: string; size: number }[];
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    ticket: { type: Schema.Types.ObjectId, ref: 'Ticket', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    type: { type: String, enum: ['public', 'internal'], default: 'public' },
    attachments: [{ name: String, url: String, size: Number }],
  },
  { timestamps: true },
);

CommentSchema.index({ ticket: 1, createdAt: 1 });

export const Comment = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);
