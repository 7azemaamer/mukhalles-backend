import { Request } from "express";

// Extend Express Request type
export interface AuthRequest extends Request {
  user?: {
    userId: string;
    phone: string;
    role: UserRole;
    permissions: string[];
  };
}

// User Roles
export enum UserRole {
  INDIVIDUAL = "individual",
  COMPANY = "company",
  ADMIN = "admin",
  MODERATOR = "moderator",
}

// Verification Status
export enum VerificationStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

// Upload Status
export enum UploadStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
}

// Notification Types
export enum NotificationType {
  OFFICE_UPDATE = "office_update",
  SYSTEM = "system",
  REVIEW = "review",
  BOOKING = "booking",
  VERIFICATION_STATUS = "verification_status",
}

// Office Categories
export enum OfficeCategory {
  IMPORT = "import",
  EXPORT = "export",
  VEHICLES = "vehicles",
  FAST = "fast",
  OTHER = "other",
}

// Document Types
export enum DocumentType {
  CR = "cr",
  POWER_OF_ATTORNEY = "power_of_attorney",
  CHAMBER_CERTIFICATE = "chamber_certificate",
  DELEGATE_ID = "delegate_id",
}

// Admin Action Types
export enum AdminActionType {
  APPROVE_COMPANY = "approve_company",
  FEATURE_OFFICE = "feature_office",
  SUSPEND_USER = "suspend_user",
  VERIFY_DOCUMENT = "verify_document",
  MODERATE_REVIEW = "moderate_review",
}

// File Upload Types
export enum FileUploadType {
  PROFILE = "profile",
  SERVICE = "service",
  DOCUMENT = "document",
  AVATAR = "avatar",
  COVER = "cover",
  LICENSE = "license",
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
