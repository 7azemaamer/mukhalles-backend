import mongoose, { Schema, Document } from "mongoose";
import { UserRole, VerificationStatus, UploadStatus } from "../types";

interface IDocument {
  documentType: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadStatus: UploadStatus;
  uploadedBy?: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
  uploadedAt: Date;
}

interface IDelegate {
  fullName: string;
  nationalId: string;
  position: string;
  phone: string;
  whatsapp?: string;
  email: string;
}

interface ICompanyProfile {
  nameAr: string;
  nameEn: string;
  crNumber: string;
  vatNumber?: string;
  city: string;
  nationalAddress?: string;
  website?: string;
  activity: string;
  licenseNumber: string;
  verificationStatus: VerificationStatus;
  isFeatured: boolean;
  featuredPriority: number;
  delegate: IDelegate;
  documents: IDocument[];
  approvedBy?: mongoose.Types.ObjectId;
  approvedAt?: Date;
}

interface IIndividualProfile {
  fullName: string;
  email?: string;
  city?: string;
  avatarUrl?: string;
  notificationChannel?: string;
  termsAccepted: boolean;
}

interface INotificationPreferences {
  offices: string;
  updates: string;
  categories: string;
  enablePush: boolean;
  enableEmail: boolean;
  enableWhatsApp: boolean;
  enableSMS: boolean;
}

export interface IUser extends Document {
  phone: string;
  email?: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  individualProfile?: IIndividualProfile;
  companyProfile?: ICompanyProfile;
  notificationPreferences: INotificationPreferences;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>({
  documentType: {
    type: String,
    required: true,
    enum: ["cr", "power_of_attorney", "chamber_certificate", "delegate_id"],
  },
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  fileSize: { type: Number, required: true },
  mimeType: { type: String, required: true },
  uploadStatus: {
    type: String,
    enum: Object.values(UploadStatus),
    default: UploadStatus.PENDING,
  },
  uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
  approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  approvedAt: { type: Date },
  uploadedAt: { type: Date, default: Date.now },
});

const DelegateSchema = new Schema<IDelegate>({
  fullName: { type: String, required: true },
  nationalId: { type: String, required: true },
  position: { type: String, required: true },
  phone: { type: String, required: true },
  whatsapp: { type: String },
  email: { type: String, required: true },
});

const CompanyProfileSchema = new Schema<ICompanyProfile>({
  nameAr: { type: String, required: true },
  nameEn: { type: String, required: true },
  crNumber: { type: String, required: true, unique: true },
  vatNumber: { type: String },
  city: { type: String, required: true },
  nationalAddress: { type: String },
  website: { type: String },
  activity: { type: String, required: true },
  licenseNumber: { type: String, required: true },
  verificationStatus: {
    type: String,
    enum: Object.values(VerificationStatus),
    default: VerificationStatus.PENDING,
  },
  isFeatured: { type: Boolean, default: false },
  featuredPriority: { type: Number, default: 0 },
  delegate: { type: DelegateSchema, required: true },
  documents: [DocumentSchema],
  approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  approvedAt: { type: Date },
});

const IndividualProfileSchema = new Schema<IIndividualProfile>({
  fullName: { type: String },
  email: { type: String },
  city: { type: String },
  avatarUrl: { type: String },
  notificationChannel: {
    type: String,
    enum: ["email", "whatsapp"],
    default: "email",
  },
  termsAccepted: { type: Boolean, default: false },
});

const NotificationPreferencesSchema = new Schema<INotificationPreferences>({
  offices: {
    type: String,
    enum: ["all", "followed", "none"],
    default: "all",
  },
  updates: {
    type: String,
    enum: ["all", "important", "none"],
    default: "important",
  },
  categories: {
    type: String,
    enum: ["all", "selected", "none"],
    default: "all",
  },
  enablePush: { type: Boolean, default: true },
  enableEmail: { type: Boolean, default: true },
  enableWhatsApp: { type: Boolean, default: false },
  enableSMS: { type: Boolean, default: false },
});

const UserSchema = new Schema<IUser>(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.INDIVIDUAL,
    },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    individualProfile: IndividualProfileSchema,
    companyProfile: CompanyProfileSchema,
    notificationPreferences: {
      type: NotificationPreferencesSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ phone: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ "companyProfile.verificationStatus": 1 });
UserSchema.index({ "companyProfile.crNumber": 1 });
UserSchema.index({ "individualProfile.city": 1 });

export default mongoose.model<IUser>("User", UserSchema);
