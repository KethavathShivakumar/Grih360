import { Schema, model, Document, Types } from 'mongoose';
import { IServiceRequest, ServiceCategoryCode, ServiceRequestStatus } from '../types/service.types';

export interface IServiceRequestDocument
  extends Omit<
    IServiceRequest,
    '_id' | 'requesterId' | 'propertyId' | 'rentalId' | 'categoryId' | 'professionalId' | 'cancellation'
  >,
    Document {
  requesterId: Types.ObjectId | string;
  propertyId?: Types.ObjectId | string;
  rentalId?: Types.ObjectId | string;
  categoryId: Types.ObjectId | string;
  categoryCode: ServiceCategoryCode;
  professionalId?: Types.ObjectId | string;
  cancellation?: {
    cancelledBy: Types.ObjectId | string;
    cancelledAt: Date;
    reason: string;
  };
}

const ServiceRequestSchema = new Schema<IServiceRequestDocument>(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', index: true },
    rentalId: { type: Schema.Types.ObjectId, ref: 'Rental', index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'ServiceCategory', required: true, index: true },
    categoryCode: {
      type: String,
      enum: [
        'PLUMBING',
        'ELECTRICAL',
        'CARPENTRY',
        'PAINTING',
        'CLEANING',
        'AC_APPLIANCE',
        'WATER_FILTER',
        'GENERAL_MAINTENANCE',
      ],
      required: true,
      index: true,
    },
    professionalId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    status: {
      type: String,
      enum: [
        'REQUESTED',
        'MATCHING',
        'ASSIGNED',
        'ACCEPTED',
        'REJECTED',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
      ],
      default: 'REQUESTED',
      index: true,
    },
    description: { type: String, required: true },
    scheduledDate: { type: Date, required: true },
    preferredTimeWindow: { type: String, default: 'Flexible' },
    serviceLocation: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      pincode: { type: String, required: true },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    images: [{ type: String }],
    estimatedCost: { type: Number },
    customerCareContact: { type: String, default: '6300063704' },
    cancellation: {
      cancelledBy: { type: Schema.Types.ObjectId, ref: 'User' },
      cancelledAt: { type: Date },
      reason: { type: String },
    },
    completion: {
      completedAt: { type: Date },
      notes: { type: String },
    },
  },
  { timestamps: true }
);

export const ServiceRequestModel = model<IServiceRequestDocument>('ServiceRequest', ServiceRequestSchema);

