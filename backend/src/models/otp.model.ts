import { Schema, model, Document, Types } from 'mongoose';

export type OtpPurpose = 'LOGIN' | 'PASSWORD_RESET' | 'VERIFICATION' | 'REGISTRATION';

export interface IOtpDocument extends Document {
  userId?: Types.ObjectId | string;
  email?: string;
  identifier: string; // Email or phone (normalized)
  purpose: OtpPurpose;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  isUsed: boolean;
  verifiedAt?: Date;
  consumedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type IEmailOtpDocument = IOtpDocument;

const OtpSchema = new Schema<IOtpDocument>(
  {
    userId: {
      type: Schema.Types.Mixed,
      ref: 'User',
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    identifier: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ['LOGIN', 'PASSWORD_RESET', 'VERIFICATION', 'REGISTRATION'],
      default: 'LOGIN',
      required: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
      select: false, // Never expose hashed OTP in default queries
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Strict TTL auto-cleanup by MongoDB
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    isUsed: {
      type: Boolean,
      default: false,
      index: true,
    },
    verifiedAt: {
      type: Date,
    },
    consumedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Secondary compound indexes for rapid resolution
OtpSchema.index({ email: 1, purpose: 1, isUsed: 1 });
OtpSchema.index({ identifier: 1, purpose: 1, isUsed: 1 });

export const OtpModel = model<IOtpDocument>('Otp', OtpSchema);
export const EmailOtpModel = OtpModel;
