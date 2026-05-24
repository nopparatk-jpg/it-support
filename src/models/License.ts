import mongoose, { Schema, Document } from 'mongoose';

export interface ILicense extends Document {
  name: string;
  licenseKey: string;
  type: 'per-seat' | 'per-device' | 'site' | 'subscription';
  vendor: string;
  totalSeats: number;
  usedSeats: number;
  purchaseDate?: Date;
  expiryDate?: Date;
  cost?: number;
  status: 'active' | 'expired' | 'cancelled';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const LicenseSchema = new Schema<ILicense>(
  {
    name: { type: String, required: true },
    licenseKey: { type: String, required: true, unique: true },
    type: { type: String, enum: ['per-seat', 'per-device', 'site', 'subscription'], default: 'per-seat' },
    vendor: { type: String, required: true },
    totalSeats: { type: Number, required: true, min: 1 },
    usedSeats: { type: Number, default: 0 },
    purchaseDate: Date,
    expiryDate: Date,
    cost: Number,
    status: { type: String, enum: ['active', 'expired', 'cancelled'], default: 'active' },
    notes: String,
  },
  { timestamps: true },
);

export const License = mongoose.models.License || mongoose.model<ILicense>('License', LicenseSchema);
