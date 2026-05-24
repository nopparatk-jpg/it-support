import mongoose, { Schema, Document } from 'mongoose';

export interface ISetting extends Document {
  key: string;
  values: string[];
}

const SettingSchema = new Schema<ISetting>({
  key: { type: String, required: true, unique: true },
  values: [{ type: String }],
});

export const Setting = mongoose.models.Setting || mongoose.model<ISetting>('Setting', SettingSchema);
