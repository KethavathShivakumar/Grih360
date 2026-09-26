import { Schema, model, Document, Types } from 'mongoose';

export interface IRentRecordDocument extends Document {
  rentalId: Types.ObjectId | string;
  tenantId: Types.ObjectId | string;
  ownerId: Types.ObjectId | string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: 'UPCOMING' | 'DUE' | 'PAID' | 'OVERDUE';
  notes?: string;
}

const RentRecordSchema = new Schema<IRentRecordDocument>(
  {
    rentalId: { type: Schema.Types.ObjectId, ref: 'Rental', required: true, index: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    amount: { type: Number, required: true },
    dueDate: { type: Date, required: true, index: true },
    paidDate: { type: Date },
    status: {
      type: String,
      enum: ['UPCOMING', 'DUE', 'PAID', 'OVERDUE'],
      default: 'UPCOMING',
      index: true,
    },
    notes: { type: String },
  },
  { timestamps: true }
);

export const RentRecordModel = model<IRentRecordDocument>('RentRecord', RentRecordSchema);
