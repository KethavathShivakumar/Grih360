import { Schema, model, Document } from 'mongoose';

export type OtpPurpose = 'LOGIN' | 'PASSWORD_RESET' | 'VERIFICATION';

export interface IOtpDocument extends Document {
  identifier: string; // Email or phone
  purpose: OtpPurpose;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  maxAttempts: number;
  isUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OtpSchema = new Schema<IOtpDocument>(
  {
    identifier: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ['LOGIN', 'PASSWORD_RESET', 'VERIFICATION'],
      default: 'LOGIN',
      required: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
      select: false, // Never expose hashed OTP in queries
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // Auto-purge expired OTPs from MongoDB
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
  },
  {
    timestamps: true,
  }
);

export const OtpModel = model<IOtpDocument>('Otp', OtpSchema);
