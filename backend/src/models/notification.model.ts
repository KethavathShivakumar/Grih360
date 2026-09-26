import { Schema, model, Document, Types } from 'mongoose';

export interface INotificationDocument extends Document {
  recipientId: Types.ObjectId | string;
  title: string;
  message: string;
  type: 'SYSTEM' | 'APPLICATION' | 'RENTAL' | 'SERVICE' | 'AUTH';
  isRead: boolean;
  link?: string;
}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ['SYSTEM', 'APPLICATION', 'RENTAL', 'SERVICE', 'AUTH'], default: 'SYSTEM' },
    isRead: { type: Boolean, default: false, index: true },
    link: { type: String },
  },
  { timestamps: true }
);

export const NotificationModel = model<INotificationDocument>('Notification', NotificationSchema);
