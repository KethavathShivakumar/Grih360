import { Schema, model, Document, Types } from 'mongoose';
import { IApplication } from '../types/rental.types';

export interface IApplicationDocument extends Omit<IApplication, '_id' | 'propertyId' | 'tenantId'>, Document {
  propertyId: Types.ObjectId | string;
  tenantId: Types.ObjectId | string;
}

const ApplicationSchema = new Schema<IApplicationDocument>(
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
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'PENDING', 'UNDER_REVIEW', 'VERIFICATION_REQUIRED', 'VERIFICATION_PENDING', 'SHORTLISTED', 'APPROVED', 'REJECTED', 'WITHDRAWN'],
      default: 'SUBMITTED',
      index: true,
    },
    moveInDate: {
      type: Date,
      required: true,
    },
    proposedRent: {
      type: Number,
      required: true,
    },
    message: {
      type: String,
    },
    verificationStatusAtSubmission: {
      type: String,
      enum: ['NOT_STARTED', 'PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED'],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const ApplicationModel = model<IApplicationDocument>('Application', ApplicationSchema);
