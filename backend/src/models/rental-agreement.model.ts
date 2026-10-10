import { Schema, model, Document, Types } from 'mongoose';

export interface IAgreementConfirmation {
  confirmed: boolean;
  confirmedAt?: Date;
  method?: string;
  ipAddress?: string;
  notes?: string;
}

export interface IAgreementMetadata {
  eSignNotice: string;
  eSignProvider?: string;
  isDigitallySigned: boolean;
  legalNotice: string;
  generatedAt: Date;
  version: string;
  tenantConfirmation?: IAgreementConfirmation;
  ownerConfirmation?: IAgreementConfirmation;
}

export interface IRentalAgreementDocument extends Document {
  rentalId: Types.ObjectId | string;
  propertyId: Types.ObjectId | string;
  tenantId: Types.ObjectId | string;
  ownerId: Types.ObjectId | string;
  rent: number;
  deposit: number;
  startDate: Date;
  endDate: Date;
  termMonths: number;
  agreementVersion: string;
  status: 'DRAFT' | 'PENDING_CONFIRMATION' | 'CONFIRMED' | 'CANCELLED';
  confirmedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  termsSummary?: string;
  tenantConfirmed: boolean;
  ownerConfirmed: boolean;
  agreementMetadata: IAgreementMetadata;
}

const RentalAgreementSchema = new Schema<IRentalAgreementDocument>(
  {
    rentalId: { type: Schema.Types.ObjectId, ref: 'Rental', required: true, index: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    rent: { type: Number, required: true },
    deposit: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    termMonths: { type: Number, default: 11 },
    agreementVersion: { type: String, default: 'v1.0' },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_CONFIRMATION', 'CONFIRMED', 'CANCELLED'],
      default: 'PENDING_CONFIRMATION',
      index: true,
    },
    termsSummary: { type: String, default: 'Standard Grih360 Residential Rental Agreement v1.0' },
    tenantConfirmed: { type: Boolean, default: false },
    ownerConfirmed: { type: Boolean, default: false },
    confirmedAt: { type: Date },
    cancelledAt: { type: Date },
    cancellationReason: { type: String },
    agreementMetadata: {
      eSignNotice: { type: String, default: 'Digital signature integration required' },
      eSignProvider: { type: String, default: 'UNAVAILABLE' },
      isDigitallySigned: { type: Boolean, default: false },
      legalNotice: {
        type: String,
        default: 'Standard platform lease draft. Digital signature integration required for legal execution.',
      },
      generatedAt: { type: Date, default: Date.now },
      version: { type: String, default: 'v1.0' },
      tenantConfirmation: {
        confirmed: { type: Boolean, default: false },
        confirmedAt: { type: Date },
        method: { type: String, default: 'PLATFORM_CONSENT' },
        ipAddress: { type: String },
        notes: { type: String },
      },
      ownerConfirmation: {
        confirmed: { type: Boolean, default: false },
        confirmedAt: { type: Date },
        method: { type: String, default: 'PLATFORM_CONSENT' },
        ipAddress: { type: String },
        notes: { type: String },
      },
    },
  },
  { timestamps: true }
);

export const RentalAgreementModel = model<IRentalAgreementDocument>('RentalAgreement', RentalAgreementSchema);

