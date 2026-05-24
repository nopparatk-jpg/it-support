import mongoose, { Schema, Document } from 'mongoose';

export interface ICounter {
  _id: string;
  seq: number;
}

const CounterSchema = new Schema<ICounter>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

export const Counter = mongoose.models.Counter || mongoose.model<ICounter>('Counter', CounterSchema);

export async function getNextTicketNumber(): Promise<string> {
  const now = new Date();
  const prefix = `TK-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const counter = await Counter.findByIdAndUpdate(
    prefix,
    { $inc: { seq: 1 } },
    { upsert: true, new: true },
  );
  return `${prefix}-${String(counter.seq).padStart(3, '0')}`;
}
