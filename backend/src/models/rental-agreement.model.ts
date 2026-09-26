import { Schema, model, Document, Types } from 'mongoose';

export interface IRentalAgreementDocument extends Document {
  rentalId: Types.ObjectId | string;
  propertyId: Types.ObjectId | string;
  tenantId: Types.ObjectId | string;
  ownerId: Types.ObjectId | string;
  agreementVersion: string;
  status: 'DRAFT' | 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'CANCELLED';
  confirmedAt?: Date;
  termsSummary?: string;
}

const RentalAgreementSchema = new Schema<IRentalAgreementDocument>(
  {
    rentalId: { type: Schema.Types.ObjectId, ref: 'Rental', required: true, index: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    agreementVersion: { type: String, default: 'v1.0' },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_CONFIRMATION', 'CONFIRMED', 'CANCELLED'],
      default: 'DRAFT',
      index: true,
    },
    confirmedAt: { type: Date },
    termsSummary: { type: String },
  },
  { timestamps: true }
);

export const RentalAgreementModel = model<IRentalAgreementDocument>('RentalAgreement', RentalAgreementSchema);
