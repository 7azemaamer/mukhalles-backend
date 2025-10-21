// Export all models from a single entry point
export { default as User } from "./User.model";
export { default as Office } from "./Office.model";
export { default as Review } from "./Review.model";
export { default as Bookmark } from "./Bookmark.model";
export { default as Notification } from "./Notification.model";
export { default as AdminLog } from "./AdminLog.model";
export { default as Analytics } from "./Analytics.model";
export { default as OTPSession } from "./OTPSession.model";

// Re-export interfaces
export type { IUser } from "./User.model";
export type { IOffice } from "./Office.model";
export type { IReview } from "./Review.model";
export type { IBookmark } from "./Bookmark.model";
export type { INotification } from "./Notification.model";
export type { IAdminLog } from "./AdminLog.model";
export type { IAnalytics } from "./Analytics.model";
export type { IOTPSession } from "./OTPSession.model";
