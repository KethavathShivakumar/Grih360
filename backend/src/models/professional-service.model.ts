import { Schema, model, Document, Types } from 'mongoose';
import { IProfessionalService } from '../types/service.types';

export interface IProfessionalServiceDocument extends Omit<IProfessionalService, '_id' | 'professionalId' | 'categoryId'>, Document {
  professionalId: Types.ObjectId | string;
  categoryId: Types.ObjectId | string;
}

const ProfessionalServiceSchema = new Schema<IProfessionalServiceDocument>(
  {
    professionalId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'ServiceCategory', required: true, index: true },
    serviceName: { type: String, required: true, trim: true },
    basePrice: { type: Number, required: true },
    description: { type: String, required: true },
    isBrandService: { type: Boolean, default: false },
    brandName: { type: String, trim: true },
  },
  { timestamps: true }
);

export const ProfessionalServiceModel = model<IProfessionalServiceDocument>('ProfessionalService', ProfessionalServiceSchema);
