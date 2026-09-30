import { Schema, model, Document, Types } from 'mongoose';

export interface IReviewDocument extends Document {
  reviewerId: Types.ObjectId | string;
  reviewer?: Types.ObjectId | string;
  revieweeId?: Types.ObjectId | string;
  reviewee?: Types.ObjectId | string;
  targetType: 'PROPERTY' | 'PROFESSIONAL' | 'TENANT' | 'SERVICE';
  targetId: Types.ObjectId | string;
  serviceRequestId?: Types.ObjectId | string;
  serviceRequest?: Types.ObjectId | string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReviewDocument>(
  {
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    reviewer: { type: Schema.Types.ObjectId, ref: 'User' },
    revieweeId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    reviewee: { type: Schema.Types.ObjectId, ref: 'User' },
    targetType: {
      type: String,
      enum: ['PROPERTY', 'PROFESSIONAL', 'TENANT', 'SERVICE'],
      required: true,
      index: true,
      default: 'PROFESSIONAL',
    },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    serviceRequestId: { type: Schema.Types.ObjectId, ref: 'ServiceRequest', index: true },
    serviceRequest: { type: Schema.Types.ObjectId, ref: 'ServiceRequest' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

// Prevent duplicate reviews per service request by the same reviewer
ReviewSchema.index({ serviceRequestId: 1, reviewerId: 1 }, { unique: true, sparse: true });

export const ReviewModel = model<IReviewDocument>('Review', ReviewSchema);
