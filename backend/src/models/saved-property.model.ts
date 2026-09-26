import { Schema, model, Document, Types } from 'mongoose';

export interface ISavedPropertyDocument extends Document {
  tenantId: Types.ObjectId | string;
  propertyId: Types.ObjectId | string;
  notes?: string;
}

const SavedPropertySchema = new Schema<ISavedPropertyDocument>(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true, index: true },
    notes: { type: String },
  },
  { timestamps: true }
);

SavedPropertySchema.index({ tenantId: 1, propertyId: 1 }, { unique: true });

export const SavedPropertyModel = model<ISavedPropertyDocument>('SavedProperty', SavedPropertySchema);
