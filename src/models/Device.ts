import mongoose, { Schema } from 'mongoose';

export interface IDevice {
  _id: mongoose.Types.ObjectId;
  name: string;
  type: string;
  brand: string;
  model: string;
  serialNumber: string;
  status: 'available' | 'assigned' | 'maintenance' | 'retired';
  purchaseDate?: Date;
  purchasePrice?: number;
  warrantyExpiry?: Date;
  supplier?: string;
  assetTag?: string;
  photos: { name: string; url: string }[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DeviceSchema = new Schema<IDevice>(
  {
    name: { type: String, default: '' },
    type: { type: String, required: true },
    brand: { type: String, required: true },
    model: { type: String, required: true },
    serialNumber: { type: String, required: true, unique: true },
    status: { type: String, enum: ['available', 'assigned', 'maintenance', 'retired'], default: 'available' },
    purchaseDate: Date,
    purchasePrice: Number,
    warrantyExpiry: Date,
    supplier: String,
    assetTag: String,
    photos: [{ name: String, url: String }],
    notes: String,
  },
  { timestamps: true },
);

DeviceSchema.index({ type: 1 });
DeviceSchema.index({ status: 1 });

export const Device = mongoose.models.Device || mongoose.model<IDevice>('Device', DeviceSchema);
