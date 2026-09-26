import { Schema, model, Document } from 'mongoose';
import { IServiceCategory } from '../types/service.types';

export interface IServiceCategoryDocument extends Omit<IServiceCategory, '_id'>, Document {}

const ServiceCategorySchema = new Schema<IServiceCategoryDocument>(
  {
    name: { type: String, required: true, trim: true },
    code: {
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
      unique: true,
      index: true,
    },
    description: { type: String, required: true },
    icon: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ServiceCategoryModel = model<IServiceCategoryDocument>('ServiceCategory', ServiceCategorySchema);
