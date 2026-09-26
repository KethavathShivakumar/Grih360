import { Schema, model, Document } from 'mongoose';
import { UserRole, VerificationStatus } from '../types/auth.types';

export interface IUserDocument extends Document {
  name: string;
  email: string;
  phone: string;
  passwordHash?: string;
  role: UserRole;
  isActive: boolean;
  profileImage?: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  identityVerificationStatus: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: false,
      select: false, // Prevents accidental leakage in User.find / findById queries
    },
    role: {
      type: String,
      enum: ['TENANT', 'OWNER', 'PROFESSIONAL', 'ADMIN'],
      default: 'TENANT',
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    profileImage: {
      type: String,
      default: null, // No auto-generated profile picture per requirement #18 & #48
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    identityVerificationStatus: {
      type: String,
      enum: ['NOT_STARTED', 'PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'EXPIRED'],
      default: 'NOT_STARTED',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Method to return safe JSON representation excluding passwordHash
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

export const UserModel = model<IUserDocument>('User', UserSchema);
