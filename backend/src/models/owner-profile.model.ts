import { Schema, model, Document, Types } from 'mongoose';

export interface IOwnerProfileDocument extends Document {
  userId: Types.ObjectId | string;
  companyName?: string;
  verifiedPropertiesCount: number;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
}

const OwnerProfileSchema = new Schema<IOwnerProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    companyName: { type: String, trim: true },
    verifiedPropertiesCount: { type: Number, default: 0 },
    bankDetails: {
      accountName: { type: String },
      accountNumber: { type: String },
      ifscCode: { type: String },
      bankName: { type: String },
    },
  },
  { timestamps: true }
);

export const OwnerProfileModel = model<IOwnerProfileDocument>('OwnerProfile', OwnerProfileSchema);
