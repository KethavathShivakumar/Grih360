import { Schema, model, Document } from 'mongoose';

export interface IOAuthCredentialDocument extends Document {
  provider: 'GOOGLE_GMAIL';
  senderEmail: string;
  refreshToken: string;
  accessToken?: string;
  expiryDate?: number;
  scope: string[];
  createdAt: Date;
  updatedAt: Date;
}

const OAuthCredentialSchema = new Schema<IOAuthCredentialDocument>(
  {
    provider: {
      type: String,
      enum: ['GOOGLE_GMAIL'],
      required: true,
      unique: true,
      index: true,
    },
    senderEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    refreshToken: {
      type: String,
      required: true,
      select: false, // Prevents accidental leakage in queries
    },
    accessToken: {
      type: String,
      required: false,
      select: false,
    },
    expiryDate: {
      type: Number,
      required: false,
    },
    scope: {
      type: [String],
      default: ['https://www.googleapis.com/auth/gmail.send'],
    },
  },
  {
    timestamps: true,
  }
);

// Never expose refresh token or access token in JSON representation
OAuthCredentialSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.refreshToken;
  delete obj.accessToken;
  delete obj.__v;
  return obj;
};

export const OAuthCredentialModel = model<IOAuthCredentialDocument>('OAuthCredential', OAuthCredentialSchema);
