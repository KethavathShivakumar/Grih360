import { Schema, model, Document, Types } from 'mongoose';

export type VerificationStatus = 'NOT_STARTED' | 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'EXPIRED';

export interface IVerificationStep {
  stepId: string;
  name: string;
  category: 'IDENTITY' | 'INCOME' | 'RENTAL_HISTORY' | 'POLICE_VERIFICATION';
  status: 'NOT_STARTED' | 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED' | 'UNAVAILABLE';
  isExternalProvider?: boolean;
  providerNotice?: string;
  data?: any;
  completedAt?: Date;
}

export interface IVerificationDocumentItem {
  documentType: string;
  documentName?: string;
  maskedIdentifier?: string;
  storageKey?: string;
  uploadedAt: Date;
  status: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
  notes?: string;
}

export interface IVerificationSubmittedInfo {
  fullName?: string;
  phone?: string;
  email?: string;
  currentAddress?: string;
  employerName?: string;
  designation?: string;
  monthlyIncome?: number;
  previousLandlordContact?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  declarationAccepted?: boolean;
  notes?: string;
}

export interface IRentalVerificationDocument extends Document {
  applicationId?: Types.ObjectId | string;
  propertyId?: Types.ObjectId | string;
  ownerId?: Types.ObjectId | string;
  tenantId: Types.ObjectId | string;
  status: VerificationStatus;
  steps: IVerificationStep[];
  documents: IVerificationDocumentItem[];
  submittedInfo?: IVerificationSubmittedInfo;
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: Types.ObjectId | string;
  rejectionReason?: string;
  notes?: string;
  adminNotes?: string;
  nextAction?: string;
}

const VerificationStepSchema = new Schema<IVerificationStep>(
  {
    stepId: { type: String, required: true },
    name: { type: String, required: true },
    category: {
      type: String,
      enum: ['IDENTITY', 'INCOME', 'RENTAL_HISTORY', 'POLICE_VERIFICATION'],
      required: true,
    },
    status: {
      type: String,
      enum: ['NOT_STARTED', 'PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'UNAVAILABLE'],
      default: 'NOT_STARTED',
    },
    isExternalProvider: { type: Boolean, default: false },
    providerNotice: { type: String, default: 'Verification provider integration required' },
    data: { type: Schema.Types.Mixed },
    completedAt: { type: Date },
  },
  { _id: false }
);

const VerificationDocumentItemSchema = new Schema<IVerificationDocumentItem>(
  {
    documentType: { type: String, required: true },
    documentName: { type: String },
    maskedIdentifier: { type: String },
    storageKey: { type: String },
    uploadedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED'],
      default: 'PENDING',
    },
    notes: { type: String },
  },
  { _id: false }
);

const SubmittedInfoSchema = new Schema<IVerificationSubmittedInfo>(
  {
    fullName: { type: String },
    phone: { type: String },
    email: { type: String },
    currentAddress: { type: String },
    employerName: { type: String },
    designation: { type: String },
    monthlyIncome: { type: Number },
    previousLandlordContact: { type: String },
    emergencyContactName: { type: String },
    emergencyContactPhone: { type: String },
    declarationAccepted: { type: Boolean, default: false },
    notes: { type: String },
  },
  { _id: false }
);

const RentalVerificationSchema = new Schema<IRentalVerificationDocument>(
  {
    applicationId: {
      type: Schema.Types.ObjectId,
      ref: 'Application',
      index: true,
    },
    propertyId: {
      type: Schema.Types.ObjectId,
      ref: 'Property',
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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
      enum: ['NOT_STARTED', 'PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED'],
      default: 'NOT_STARTED',
      index: true,
    },
    steps: {
      type: [VerificationStepSchema],
      default: [],
    },
    documents: {
      type: [VerificationDocumentItemSchema],
      default: [],
    },
    submittedInfo: {
      type: SubmittedInfoSchema,
    },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
    notes: { type: String },
    adminNotes: { type: String },
    nextAction: { type: String },
  },
  { timestamps: true }
);

// Gracefully drop old single tenantId unique index if it exists in MongoDB
RentalVerificationSchema.index({ tenantId: 1, applicationId: 1 });

export const RentalVerificationModel = model<IRentalVerificationDocument>(
  'RentalVerification',
  RentalVerificationSchema
);
