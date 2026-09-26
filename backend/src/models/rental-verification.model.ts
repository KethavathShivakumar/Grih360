import { Schema, model, Document, Types } from 'mongoose';

export interface IRentalVerificationDocument extends Document {
  tenantId: Types.ObjectId | string;
  status: 'NOT_STARTED' | 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';
  submittedAt?: Date;
  reviewedAt?: Date;
  rejectionReason?: string;
  notes?: string;
}

const RentalVerificationSchema = new Schema<IRentalVerificationDocument>(
  {
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED'],
      default: 'NOT_STARTED',
      index: true,
    },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    rejectionReason: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

export const RentalVerificationModel = model<IRentalVerificationDocument>('RentalVerification', RentalVerificationSchema);
