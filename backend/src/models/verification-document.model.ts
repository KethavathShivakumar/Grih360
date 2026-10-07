import { Schema, model, Document } from 'mongoose';

export interface IVerificationDocument extends Document {
  storageKey: string;
  tenantId: string;
  documentType: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  dataBase64: string;
  maskedNumber?: string;
  uploadedAt: Date;
}

const VerificationDocumentSchema = new Schema<IVerificationDocument>(
  {
    storageKey: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },
    documentType: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileSize: { type: Number, required: true },
    dataBase64: { type: String, required: true },
    maskedNumber: { type: String },
    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const VerificationDocumentModel = model<IVerificationDocument>(
  'VerificationDocument',
  VerificationDocumentSchema
);
