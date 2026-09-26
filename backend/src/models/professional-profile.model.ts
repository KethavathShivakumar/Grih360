import { Schema, model, Document, Types } from 'mongoose';
import { ServiceCategoryCode, ProfessionalVerificationStatus } from '../types/service.types';

export interface IProfessionalProfileDocument extends Document {
  userId: Types.ObjectId | string;
  businessName: string;
  categories: ServiceCategoryCode[];
  experienceYears: number;
  rating: number;
  reviewCount: number;
  isAvailable: boolean;
  isActive: boolean;
  verificationStatus: ProfessionalVerificationStatus;
  serviceAreas: string[];
  serviceRadiusKm: number;
  profileImage?: string;
  bio?: string;
  phone?: string;
}

const ProfessionalProfileSchema = new Schema<IProfessionalProfileDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    businessName: { type: String, required: true, trim: true },
    categories: [{ type: String, index: true }],
    experienceYears: { type: Number, default: 0 },
    rating: { type: Number, default: 0 }, // Dynamically calculated from real Review records
    reviewCount: { type: Number, default: 0 },
    isAvailable: { type: Boolean, default: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    verificationStatus: {
      type: String,
      enum: ['NOT_VERIFIED', 'PENDING', 'VERIFIED'],
      default: 'NOT_VERIFIED',
      index: true,
    },
    serviceAreas: [{ type: String, index: true }],
    serviceRadiusKm: { type: Number, default: 15 },
    profileImage: { type: String },
    bio: { type: String },
    phone: { type: String },
  },
  { timestamps: true }
);

export const ProfessionalProfileModel = model<IProfessionalProfileDocument>('ProfessionalProfile', ProfessionalProfileSchema);

