import { Schema, model, Document, Types } from 'mongoose';

export interface ILoginChallengeDocument extends Document {
  challengeId: string;
  userId: Types.ObjectId | string;
  email: string;
  isCompleted: boolean;
  totalAttempts: number;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const LoginChallengeSchema = new Schema<ILoginChallengeDocument>(
  {
    challengeId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: Schema.Types.Mixed,
      required: true,
      ref: 'User',
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    totalAttempts: {
      type: Number,
      default: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // 10-minute maximum lifespan automatic TTL cleanup
    },
  },
  {
    timestamps: true,
  }
);

export const LoginChallengeModel = model<ILoginChallengeDocument>('LoginChallenge', LoginChallengeSchema);
