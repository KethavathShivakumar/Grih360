import { Schema, model, Document, Types } from 'mongoose';
import { IRental } from '../types/rental.types';

export interface IRentalDocument extends Omit<IRental, '_id' | 'propertyId' | 'tenantId' | 'ownerId' | 'applicationId'>, Document {
  propertyId: Types.ObjectId | string;
  tenantId: Types.ObjectId | string;
  ownerId: Types.ObjectId | string;
  applicationId: Types.ObjectId | string;
}

const RentalSchema = new Schema<IRentalDocument>(
  {
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      required: true,
      index: true,
    },
    tenantId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_CONFIRMATION', 'REVIEW', 'CONFIRMED', 'ACTIVE', 'TERMINATED', 'EXPIRED'],
      default: 'PENDING_CONFIRMATION',
      index: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    monthlyRent: {
      type: Number,
      required: true,
    },
    depositPaid: {
      type: Number,
      required: true,
    },
    rentStatus: {
      type: String,
      enum: ['UPCOMING', 'DUE', 'PAID', 'OVERDUE'],
      default: 'UPCOMING',
      index: true,
    },
    agreementVersion: {
      type: String,
      default: 'v1.0',
    },
    handoverChecklist: {
      conditionRecordVerified: { type: Boolean, default: false },
      moveInReadinessCompleted: { type: Boolean, default: false },
      activatedAt: { type: Date },
    },
  },
  {
    timestamps: true,
  }
);

export const RentalModel = model<IRentalDocument>('Rental', RentalSchema);
