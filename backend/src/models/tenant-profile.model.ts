import { Schema, model, Document, Types } from 'mongoose';

export interface ITenantProfileDocument extends Document {
  userId: Types.ObjectId | string;
  occupation?: string;
  monthlyIncome?: number;
  preferredLocations?: string[];
  identityVerificationStatus: string;
  verifiedAt?: Date;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

const TenantProfileSchema = new Schema<ITenantProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    occupation: { type: String, trim: true },
    monthlyIncome: { type: Number },
    preferredLocations: [{ type: String }],
    identityVerificationStatus: {
      type: String,
      enum: ['NOT_STARTED', 'PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED'],
      default: 'NOT_STARTED',
    },
    verifiedAt: { type: Date },
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relationship: { type: String },
    },
  },
  { timestamps: true }
);

export const TenantProfileModel = model<ITenantProfileDocument>('TenantProfile', TenantProfileSchema);
