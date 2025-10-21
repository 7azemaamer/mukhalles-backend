import mongoose, { Schema, Document } from "mongoose";
import { NotificationType } from "../types";

interface ITitle {
  ar: string;
  en: string;
}

interface IMessage {
  ar: string;
  en: string;
}

interface IData {
  officeId?: mongoose.Types.ObjectId;
  officeName?: string;
  [key: string]: any;
}

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: NotificationType;
  title: ITitle;
  message: IMessage;
  data?: IData;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

const TitleSchema = new Schema<ITitle>(
  {
    ar: { type: String, required: true },
    en: { type: String, required: true },
  },
  { _id: false }
);

const MessageSchema = new Schema<IMessage>(
  {
    ar: { type: String, required: true },
    en: { type: String, required: true },
  },
  { _id: false }
);

const NotificationSchema = new Schema<INotification>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    title: { type: TitleSchema, required: true },
    message: { type: MessageSchema, required: true },
    data: { type: Schema.Types.Mixed },
    isRead: { type: Boolean, default: false },
    readAt: { type: Date },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Indexes
NotificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ type: 1 });

// TTL index - automatically delete notifications after 30 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model<INotification>(
  "Notification",
  NotificationSchema
);
