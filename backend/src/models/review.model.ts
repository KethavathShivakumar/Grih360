import { Schema, model, Document, Types } from 'mongoose';

export interface IReviewDocument extends Document {
  reviewerId: Types.ObjectId | string;
  targetType: 'PROPERTY' | 'PROFESSIONAL' | 'TENANT';
  targetId: Types.ObjectId | string;
  serviceRequestId?: Types.ObjectId | string;
  rating: number;
  comment: string;
}

const ReviewSchema = new Schema<IReviewDocument>(
  {
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: { type: String, enum: ['PROPERTY', 'PROFESSIONAL', 'TENANT'], required: true, index: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    serviceRequestId: { type: Schema.Types.ObjectId, ref: 'ServiceRequest', index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

export const ReviewModel = model<IReviewDocument>('Review', ReviewSchema);

