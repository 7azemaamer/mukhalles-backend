import mongoose, { Schema, Document } from "mongoose";

export interface IOTPSession extends Document {
  phone: string;
  otp: string;
  sessionId: string;
  attempts: number;
  verified: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const OTPSessionSchema = new Schema<IOTPSession>(
  {
    phone: {
      type: String,
      required: true,
      index: true,
    },
    otp: {
      type: String,
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// TTL index - automatically delete expired sessions
OTPSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IOTPSession>("OTPSession", OTPSessionSchema);
