import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const Category = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
