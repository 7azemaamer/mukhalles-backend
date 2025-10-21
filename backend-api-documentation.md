# Mukhalls Backend API Documentation

## Overview

Mukhalls is a comprehensive Saudi customs clearance marketplace platform connecting customers with licensed customs clearance offices. This document outlines the complete backend API requirements and architecture recommendations.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Security & Authentication](#security--authentication)
6. [File Management](#file-management)
7. [Notifications System](#notifications-system)
8. [Admin & Moderation](#admin--moderation)
9. [Analytics & Reporting](#analytics--reporting)
10. [Deployment & Infrastructure](#deployment--infrastructure)

---

## System Architecture

### Recommended Backend: Custom Node.js/Express API

**Why Custom Backend over Firebase:**

1. **Complex Business Logic**: Multi-role system with admin/moderator workflows
2. **Saudi Compliance**: Need for custom validation (CR numbers, VAT, etc.)
3. **Advanced Search**: Complex filtering, geolocation, and ranking algorithms
4. **File Management**: Document verification and approval workflows
5. **Scalability**: Better control over performance optimization
6. **Cost Efficiency**: More predictable scaling costs for large user base
7. **Data Privacy**: Full control over Saudi user data storage and compliance

### Technology Stack

- **Backend**: Node.js + Express.js + TypeScript
- **Database**: **MongoDB (primary)**
- **ODM**: Mongoose for MongoDB with schema validation
- **Authentication**: JWT + Refresh Tokens
- **File Storage**: AWS S3 or Google Cloud Storage
- **Email/SMS**: Twilio (SMS) + SendGrid (Email)
- **Real-time**: Socket.io for notifications
- **Search**: MongoDB Atlas Search + Text Indexes
- **Monitoring**: Winston + Morgan + Application monitoring

---

## User Roles & Permissions

### 1. Individual User (أفراد)
```typescript
enum UserRole {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
  ADMIN = 'admin',
  MODERATOR = 'moderator'
}
```

**Permissions:**
- Browse and search offices
- View office profiles and services
- Write reviews and ratings
- Bookmark offices
- Contact offices
- Manage profile
- Receive notifications

### 2. Company User (شركات)
**Permissions (includes all Individual permissions +):**
- Manage company profile
- Create/edit/delete services
- Set service pricing
- Manage delegate information
- Upload business documents
- View business analytics
- Manage social media profiles

### 3. Moderator (مشرف)
**Permissions:**
- Review and approve company registrations
- Moderate reviews and content
- Verify business documents
- Manage reported content
- Limited user management

### 4. Admin (مدير)
**Permissions (all permissions +):**
- Full user management
- Platform configuration
- Featured office management
- Priority and ranking control
- Full analytics access
- System administration
- Moderator management

---

## Database Schema (MongoDB Collections)

### Why MongoDB Over PostgreSQL for This Application

✅ **Document-heavy data**: User profiles, company documents, reviews with rich metadata
✅ **Evolving schema**: Business requirements will change frequently
✅ **Geospatial queries**: Location-based office search
✅ **Text search**: Arabic and English content search
✅ **Performance**: Fewer joins, embedded documents for better read performance
✅ **Scalability**: Horizontal scaling with sharding
✅ **Flexibility**: Different data types per document (JSON, arrays, nested objects)

### Users Collection
```javascript
{
  _id: ObjectId,
  phone: String, // Unique
  email: String, // Optional, unique
  role: String, // 'individual', 'company', 'admin', 'moderator'
  isVerified: Boolean,
  isActive: Boolean,
  profile: {
    // Embedded individual profile
    fullName: String,
    email: String,
    city: String,
    avatarUrl: String,
    notificationChannel: String, // 'email', 'whatsapp'
    termsAccepted: Boolean
  },
  companyProfile: {
    // Embedded company profile
    nameAr: String,
    nameEn: String,
    crNumber: String, // Unique
    vatNumber: String,
    city: String,
    nationalAddress: String,
    website: String,
    activity: String,
    licenseNumber: String,
    verificationStatus: String, // 'pending', 'approved', 'rejected'
    isFeatured: Boolean,
    featuredPriority: Number,
    delegate: {
      fullName: String,
      nationalId: String,
      position: String,
      phone: String,
      whatsapp: String,
      email: String
    },
    documents: [{
      documentType: String, // 'cr', 'power_of_attorney', 'chamber_certificate', 'delegate_id'
      fileUrl: String,
      fileName: String,
      fileSize: Number,
      mimeType: String,
      uploadStatus: String, // 'pending', 'approved', 'rejected'
      uploadedBy: ObjectId,
      approvedBy: ObjectId,
      approvedAt: Date,
      uploadedAt: Date
    }],
    approvedBy: ObjectId,
    approvedAt: Date
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Offices Collection
```javascript
{
  _id: ObjectId,
  companyId: ObjectId, // Reference to Users collection
  name: String,
  city: String,
  category: String, // 'import', 'export', 'vehicles', 'fast', 'other'
  rating: Number,
  ratingCount: Number,
  isFeatured: Boolean,
  featuredPriority: Number,
  avatarUrl: String,
  coverUrl: String,
  verified: Boolean,
  summary: String,
  licenseImageUrl: String,
  address: String,
  location: {
    type: "Point",
    coordinates: [longitude, latitude] // GeoJSON format for geospatial queries
  },
  contact: {
    phone: String,
    whatsapp: String
  },
  socials: {
    facebook: String,
    x: String,
    linkedin: String,
    snapchat: String
  },
  services: [{
    _id: ObjectId,
    title: String,
    description: String,
    imageUrl: String,
    basePrice: Number,
    isActive: Boolean,
    subServices: [{
      _id: ObjectId,
      title: String,
      price: Number,
      isActive: Boolean
    }],
    createdAt: Date,
    updatedAt: Date
  }],
  stats: {
    profileViews: Number,
    contactClicks: Number,
    bookmarks: Number
  },
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Reviews Collection
```javascript
{
  _id: ObjectId,
  officeId: ObjectId,
  userId: ObjectId,
  rating: Number, // 1-5
  text: String,
  serviceTag: String,
  likes: [{
    userId: ObjectId,
    createdAt: Date
  }],
  likesCount: Number,
  isApproved: Boolean,
  moderatedBy: ObjectId,
  moderatedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Bookmarks Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  officeId: ObjectId,
  createdAt: Date
}
```

### Notifications Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId,
  type: String, // 'office_update', 'system', 'review', 'booking', 'verification_status'
  title: {
    ar: String,
    en: String
  },
  message: {
    ar: String,
    en: String
  },
  data: {
    officeId: ObjectId,
    officeName: String,
    // Additional metadata
  },
  isRead: Boolean,
  readAt: Date,
  createdAt: Date
}
```

### AdminLogs Collection
```javascript
{
  _id: ObjectId,
  adminId: ObjectId,
  action: String, // 'approve_company', 'feature_office', 'suspend_user', 'verify_document'
  target: {
    type: String, // 'user', 'company', 'office', 'review', 'document'
    id: ObjectId
  },
  details: {
    oldValues: Object,
    newValues: Object,
    reason: String
  },
  ipAddress: String,
  userAgent: String,
  createdAt: Date
}
```

### Analytics Collection (Time-series for performance)
```javascript
{
  _id: ObjectId,
  metric: String, // 'office_views', 'contact_clicks', 'user_registrations'
  value: Number,
  dimensions: {
    officeId: ObjectId,
    city: String,
    category: String,
    userId: ObjectId
  },
  timestamp: Date,
  granularity: String // 'hour', 'day', 'week', 'month'
}
```

---
#### **Authentication Flow Status**
- ✅ SignInScreen.js - UI complete, needs `/api/auth/send-otp`
- ✅ OtpScreen.js - UI complete, needs `/api/auth/verify-otp`
- ✅ ProfileIndividualScreen.js - UI complete, needs profile endpoints
- ✅ ProfileCompanyScreen.js - UI complete, needs company registration


### **🔧 Database Schema Corrections**

Based on frontend analysis, the MongoDB schema needs these adjustments:

#### **Users Collection Updates**
```javascript
// Add to Users schema
individualProfile: {
  fullName: String,
  email: String,
  city: String,
  avatarUrl: String,
  notificationChannel: String, // 'email', 'whatsapp'
  termsAccepted: Boolean
},
notificationPreferences: {
  offices: String, // 'all', 'followed', 'none'
  updates: String, // 'all', 'important', 'none'
  categories: String, // 'all', 'selected', 'none'
  enablePush: Boolean,
  enableEmail: Boolean,
  enableWhatsApp: Boolean,
  enableSMS: Boolean
}
```

#### **Offices Collection Updates**
```javascript
// Update services sub-document to match frontend
services: [{
  _id: ObjectId,
  title: String,
  description: String,
  imageUrl: String,
  basePrice: Number,
  isActive: Boolean,
  subServices: [{
    _id: ObjectId,
    title: String,
    price: Number,
    isActive: Boolean
  }],
  createdAt: Date,
  updatedAt: Date
}]
```

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/send-otp
**Description**: Send OTP to user's phone number
**Request Body**:
```json
{
  "phone": "+966501234567",
  "countryCode": "+966"
}
```
**Response**:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "sessionId": "session_123456"
}
```

#### POST /api/auth/verify-otp
**Description**: Verify OTP and authenticate user
**Request Body**:
```json
{
  "phone": "+966501234567",
  "otp": "123456",
  "sessionId": "session_123456"
}
```
**Response**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "phone": "+966501234567",
    "role": "individual",
    "isProfileComplete": false
  },
  "tokens": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### POST /api/auth/refresh
**Description**: Refresh access token
**Request Headers**:
```
Authorization: Bearer <refresh_token>
```

#### POST /api/auth/logout
**Description**: Logout user and invalidate tokens
**Request Headers**:
```
Authorization: Bearer <access_token>
```

### User Profile Endpoints

#### GET /api/users/profile
**Description**: Get current user profile
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "phone": "+966501234567",
    "role": "individual",
    "individualProfile": {
      "fullName": "أحمد محمد",
      "email": "ahmed@example.com",
      "city": "Riyadh",
      "avatarUrl": "https://example.com/avatar.jpg",
      "notificationChannel": "email"
    }
  }
}
```

#### PUT /api/users/profile
**Description**: Update user profile
**Request Body**:
```json
{
  "fullName": "أحمد محمد",
  "email": "ahmed@example.com",
  "city": "Riyadh",
  "notificationChannel": "email"
}
```

#### POST /api/users/profile-picture
**Description**: Upload profile picture
**Request**: multipart/form-data
```
file: <image_file>
```

### Company Management Endpoints

#### POST /api/company/register
**Description**: Register new company
**Request Body**:
```json
{
  "nameAr": "شركة التخليص الجمركي",
  "nameEn": "Customs Clearance Co.",
  "crNumber": "1234567890",
  "vatNumber": "31234567890123",
  "city": "Riyadh",
  "nationalAddress": "الرياض، المملكة العربية السعودية",
  "website": "https://example.com",
  "activity": "تخليص جمركي",
  "licenseNumber": "LIC-123456",
  "delegate": {
    "fullName": "المندوب شركة",
    "nationalId": "1234567890",
    "position": "مدير عام",
    "phone": "+966501234567",
    "whatsapp": "+966501234567",
    "email": "delegate@example.com"
  }
}
```

#### GET /api/company/profile
**Description**: Get company profile
#### PUT /api/company/profile
**Description**: Update company profile
#### POST /api/company/documents
**Description**: Upload company documents
**Request**: multipart/form-data
```
documentType: cr|power_of_attorney|chamber_certificate|delegate_id
file: <document_file>
```

#### GET /api/company/services
**Description**: Get company services
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "تخليص جمركي للسيارات",
      "description": "خدمة تخليص جمركي متخصصة للسيارات",
      "imageUrl": "https://example.com/service.jpg",
      "basePrice": 1500.00,
      "subServices": [
        {
          "id": "uuid",
          "title": "سيارات sedan",
          "price": 1500.00
        }
      ],
      "isActive": true
    }
  ]
}
```

#### POST /api/company/services
**Description**: Create new service
**Request Body**:
```json
{
  "title": "خدمة تخليص جمركي جديدة",
  "description": "وصف الخدمة",
  "basePrice": 2000.00,
  "subServices": [
    {
      "title": "خدمة فرعية 1",
      "price": 500.00
    }
  ]
}
```

#### PUT /api/company/services/:id
**Description**: Update service
#### DELETE /api/company/services/:id
**Description**: Delete service

### Office Endpoints

#### GET /api/offices
**Description**: Get offices with filtering and pagination
**Query Parameters**:
```
page: number = 1
limit: number = 20
city: string
category: import|export|vehicles|fast|other
featured: boolean
search: string
sortBy: rating|created_at|featured_priority
sortOrder: asc|desc
```
**Response**:
```json
{
  "success": true,
  "data": {
    "offices": [
      {
        "id": "uuid",
        "name": "مكتب التخليص الجمركي الأول",
        "city": "Riyadh",
        "category": "import",
        "rating": 4.5,
        "ratingCount": 120,
        "isFeatured": true,
        "avatarUrl": "https://example.com/avatar.jpg",
        "verified": true
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

#### GET /api/offices/:id
**Description**: Get office details
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "مكتب التخليص الجمركي الأول",
    "city": "Riyadh",
    "category": "import",
    "rating": 4.5,
    "ratingCount": 120,
    "isFeatured": true,
    "avatarUrl": "https://example.com/avatar.jpg",
    "coverUrl": "https://example.com/cover.jpg",
    "verified": true,
    "summary": "نقدم خدمات التخليص الجمركي المتكاملة",
    "licenseImageUrl": "https://example.com/license.jpg",
    "address": "الرياض، حي النخيل",
    "location": {
      "latitude": 24.7136,
      "longitude": 46.6753
    },
    "contact": {
      "phone": "+966501234567",
      "whatsapp": "+966501234567"
    },
    "socials": {
      "facebook": "https://facebook.com/office",
      "x": "https://x.com/office",
      "linkedin": "https://linkedin.com/company/office",
      "snapchat": "https://snapchat.com/add/office"
    },
    "services": [
      {
        "id": "uuid",
        "title": "تخليص جمركي للبضائع",
        "basePrice": 1000.00,
        "subServices": [...]
      }
    ],
    "reviews": [...]
  }
}
```

#### GET /api/offices/:id/reviews
**Description**: Get office reviews
**Query Parameters**:
```
page: number = 1
limit: number = 20
rating: number
sortBy: created_at|rating
sortOrder: asc|desc
```

#### POST /api/offices/:id/reviews
**Description**: Submit review for office
**Request Body**:
```json
{
  "rating": 5,
  "text": "خدمة ممتازة وتعامل احترافي",
  "serviceTag": "تخليص سيارات"
}
```

#### POST /api/offices/:id/bookmark
**Description**: Bookmark/unbookmark office
#### DELETE /api/offices/:id/bookmark
**Description**: Remove bookmark

### Reviews Endpoints

#### GET /api/reviews
**Description**: Get user's reviews
#### POST /api/reviews/:id/like
**Description**: Like/unlike review
#### PUT /api/reviews/:id
**Description**: Update own review
#### DELETE /api/reviews/:id
**Description**: Delete own review

### Bookmarks Endpoints

#### GET /api/bookmarks
**Description**: Get user's bookmarked offices
#### DELETE /api/bookmarks/:officeId
**Description**: Remove bookmark

### Notifications Endpoints

#### GET /api/notifications
**Description**: Get user notifications
**Query Parameters**:
```
page: number = 1
limit: number = 20
type: all|office|system
isRead: boolean
```
**Response**:
```json
{
  "success": true,
  "data": {
    "notifications": [
      {
        "id": "uuid",
        "type": "office_update",
        "title": "تحديث في المكتب المفضل",
        "message": "أضاف مكتب التخليص الجمركي خدمة جديدة",
        "data": {
          "officeId": "uuid",
          "officeName": "مكتب التخليص الأول"
        },
        "isRead": false,
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "unreadCount": 5
  }
}
```

#### PUT /api/notifications/:id/read
**Description**: Mark notification as read
#### PUT /api/notifications/read-all
**Description**: Mark all notifications as read

### Admin Endpoints

#### GET /api/admin/dashboard
**Description**: Get admin dashboard statistics
**Response**:
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalUsers": 5000,
      "totalCompanies": 250,
      "totalOffices": 300,
      "pendingVerifications": 15,
      "totalReviews": 2500,
      "activeToday": 120
    },
    "recentActivities": [...],
    "topOffices": [...]
  }
}
```

#### GET /api/admin/users
**Description**: Get users with filtering
**Query Parameters**:
```
page: number = 1
limit: number = 20
role: individual|company|admin|moderator
status: active|inactive|pending
search: string
```

#### GET /api/admin/users/:id
**Description**: Get user details
#### PUT /api/admin/users/:id/status
**Description**: Update user status
**Request Body**:
```json
{
  "isActive": false,
  "reason": "Violation of terms"
}
```

#### GET /api/admin/companies
**Description**: Get companies for admin
#### PUT /api/admin/companies/:id/verify
**Description**: Approve/reject company verification
**Request Body**:
```json
{
  "status": "approved", // approved|rejected
  "reason": "All documents verified successfully"
}
```

#### GET /api/admin/offices
**Description**: Get offices for admin management
#### PUT /api/admin/offices/:id/featured
**Description**: Set office as featured
**Request Body**:
```json
{
  "isFeatured": true,
  "priority": 1
}
```

#### GET /api/admin/reviews
**Description**: Get reviews for moderation
#### PUT /api/admin/reviews/:id/approve
**Description**: Approve/reject review
#### DELETE /api/admin/reviews/:id
**Description**: Delete review

#### GET /api/admin/documents
**Description**: Get pending documents for verification
#### PUT /api/admin/documents/:id/verify
**Description**: Verify document
**Request Body**:
```json
{
  "status": "approved", // approved|rejected
  "reason": "Document verified successfully"
}
```

#### GET /api/admin/actions
**Description**: Get admin actions log
#### POST /api/admin/announcements
**Description**: Send system announcements
**Request Body**:
```json
{
  "title": "تحديث النظام",
  "message": "سيتم صيانة النظام غداً",
  "targetRoles": ["individual", "company"],
  "sendPush": true,
  "sendEmail": true
}
```

### Search Endpoints

#### GET /api/search/offices
**Description**: Advanced office search
**Query Parameters**:
```
q: string
city: string
category: string
minRating: number
maxPrice: number
verified: boolean
featured: boolean
page: number
limit: number
```

#### GET /api/search/suggestions
**Description**: Get search suggestions
**Query Parameters**:
```
q: string
limit: number = 10
```

### Analytics Endpoints

#### GET /api/analytics/company/:id
**Description**: Get company analytics (for company users)
**Response**:
```json
{
  "success": true,
  "data": {
    "overview": {
      "profileViews": 1250,
      "contactClicks": 85,
      "bookmarks": 120,
      "reviewsCount": 45,
      "averageRating": 4.6
    },
    "trends": {
      "viewsByDay": [...],
      "contactsByDay": [...],
      "bookmarksByDay": [...]
    },
    "popularServices": [...],
    "recentReviews": [...]
  }
}
```

#### GET /api/analytics/admin
**Description**: Get platform analytics (for admins)
**Query Parameters**:
```
period: 7d|30d|90d|1y
```

### 🚨 **MISSING API ENDPOINTS** (Required by Frontend Screens)

#### **Authentication Endpoints - Missing**

##### POST /api/auth/resend-otp
**Description**: Resend OTP to user's phone number
**Request Body**:
```json
{
  "phone": "+966501234567",
  "sessionId": "session_123456"
}
```
**Response**:
```json
{
  "success": true,
  "message": "OTP resent successfully",
  "retryAfter": 60
}
```

#### **User Management Endpoints - Missing**

##### GET /api/users/notification-preferences
**Description**: Get user notification preferences
**Response**:
```json
{
  "success": true,
  "data": {
    "offices": "all", // 'all', 'followed', 'none'
    "updates": "important", // 'all', 'important', 'none'
    "categories": "all", // 'all', 'selected', 'none'
    "enablePush": true,
    "enableEmail": true,
    "enableWhatsApp": false,
    "enableSMS": false
  }
}
```

##### PUT /api/users/notification-preferences
**Description**: Update user notification preferences
**Request Body**:
```json
{
  "offices": "followed",
  "updates": "important",
  "categories": "selected",
  "enablePush": true,
  "enableEmail": false,
  "enableWhatsApp": true,
  "enableSMS": false
}
```

#### **Supporting Data Endpoints - Missing**

##### GET /api/categories
**Description**: Get available office categories
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "import",
      "name": {
        "ar": "استيراد",
        "en": "Import"
      },
      "icon": "import-icon-url",
      "isActive": true
    },
    {
      "id": "export",
      "name": {
        "ar": "تصدير",
        "en": "Export"
      },
      "icon": "export-icon-url",
      "isActive": true
    }
  ]
}
```

##### GET /api/cities
**Description**: Get list of Saudi cities
**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "riyadh",
      "name": {
        "ar": "الرياض",
        "en": "Riyadh"
      },
      "isActive": true
    },
    {
      "id": "jeddah",
      "name": {
        "ar": "جدة",
        "en": "Jeddah"
      },
      "isActive": true
    }
  ]
}
```

#### **Bookmark System Endpoints - Missing**

##### GET /api/bookmarks
**Description**: Get user's bookmarked offices
**Query Parameters**:
```
page: number = 1
limit: number = 20
city: string (optional)
category: string (optional)
```
**Response**:
```json
{
  "success": true,
  "data": {
    "bookmarks": [
      {
        "id": "bookmark_id",
        "officeId": "office_uuid",
        "office": {
          "id": "office_uuid",
          "name": "مكتب التخليص الجمركي",
          "city": "Riyadh",
          "rating": 4.5,
          "avatarUrl": "url"
        },
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

##### POST /api/offices/:id/bookmark
**Description**: Bookmark an office
**Response**:
```json
{
  "success": true,
  "message": "Office bookmarked successfully",
  "isBookmarked": true
}
```

##### DELETE /api/offices/:id/bookmark
**Description**: Remove bookmark from office
**Response**:
```json
{
  "success": true,
  "message": "Bookmark removed successfully",
  "isBookmarked": false
}
```

#### **Review Management Endpoints - Missing**

##### POST /api/reviews/:id/like
**Description**: Like or unlike a review
**Response**:
```json
{
  "success": true,
  "isLiked": true,
  "likesCount": 25
}
```

##### PUT /api/reviews/:id
**Description**: Update own review
**Request Body**:
```json
{
  "rating": 5,
  "text": "Updated review text",
  "serviceTag": "تخليص سيارات"
}
```

##### DELETE /api/reviews/:id
**Description**: Delete own review
**Response**:
```json
{
  "success": true,
  "message": "Review deleted successfully"
}
```

#### **Company Management Endpoints - Missing**

##### GET /api/company/profile (Detailed)
**Description**: Get detailed company profile for editing
**Response**:
```json
{
  "success": true,
  "data": {
    "basicInfo": {
      "nameAr": "شركة التخليص الجمركي",
      "nameEn": "Customs Clearance Co.",
      "crNumber": "1234567890",
      "vatNumber": "31234567890123",
      "city": "riyadh",
      "nationalAddress": "الرياض، المملكة العربية السعودية",
      "website": "https://example.com",
      "activity": "تخليص جمركي",
      "licenseNumber": "LIC-123456"
    },
    "delegate": {
      "fullName": "المندوب شركة",
      "nationalId": "1234567890",
      "position": "مدير عام",
      "phone": "+966501234567",
      "whatsapp": "+966501234567",
      "email": "delegate@example.com"
    },
    "verificationStatus": "approved",
    "documents": [...]
  }
}
```

##### PUT /api/company/profile
**Description**: Update company profile
**Request Body**: Same structure as GET response above

##### GET /api/companies/delegates
**Description**: Get company delegate information
**Response**:
```json
{
  "success": true,
  "data": {
    "fullName": "المندوب شركة",
    "jobTitle": "مدير عام",
    "email": "delegate@example.com",
    "mobile": "+966501234567",
    "whatsapp": "+966501234567",
    "birthDate": "1980-01-01",
    "cityId": "riyadh",
    "addressDetail": "العنوان التفصيلي",
    "nationalIdFiles": [
      {
        "id": "file_id",
        "url": "https://example.com/file.pdf",
        "fileName": "national-id.pdf",
        "uploadedAt": "2024-01-15T10:30:00Z"
      }
    ]
  }
}
```

##### POST /api/companies/delegates
**Description**: Create or update delegate information
**Request**: multipart/form-data
```
fullName: string
jobTitle: string
email: string
mobile: string
whatsapp: string (optional)
birthDate: string (optional)
cityId: string
addressDetail: string (optional)
nationalIdFiles: file[] (max 2 files)
```

##### GET /api/companies/social-media
**Description**: Get company social media accounts
**Response**:
```json
{
  "success": true,
  "data": {
    "socialMedia": [
      {
        "id": 1,
        "platform": "twitter",
        "url": "https://twitter.com/company"
      },
      {
        "id": 2,
        "platform": "instagram",
        "url": "https://instagram.com/company"
      }
    ]
  }
}
```

##### POST /api/companies/social-media
**Description**: Save company social media accounts
**Request Body**:
```json
{
  "socialMedia": [
    {
      "platform": "twitter",
      "url": "https://twitter.com/company"
    },
    {
      "platform": "instagram",
      "url": "https://instagram.com/company"
    }
  ]
}
```

#### **File Management Endpoints - Missing**

##### POST /api/upload/image
**Description**: Upload image file
**Request**: multipart/form-data
```
file: image file
type: string ('profile', 'service', 'document', 'avatar')
```
**Response**:
```json
{
  "success": true,
  "data": {
    "id": "file_id",
    "url": "https://example.com/uploads/image.jpg",
    "fileName": "image.jpg",
    "fileSize": 1024000,
    "mimeType": "image/jpeg",
    "uploadedAt": "2024-01-15T10:30:00Z"
  }
}
```

##### POST /api/upload/document
**Description**: Upload document file
**Request**: multipart/form-data
```
file: document file
type: string ('cr', 'power_of_attorney', 'chamber_certificate', 'delegate_id')
```

---

## Security & Authentication

### JWT Token Structure
```typescript
interface JWTPayload {
  userId: string;
  phone: string;
  role: UserRole;
  permissions: string[];
  iat: number;
  exp: number;
}
```

### Authentication Flow
1. **Phone Verification**: OTP-based authentication
2. **Token Generation**: JWT access token + refresh token
3. **Token Refresh**: Automatic refresh using refresh token
4. **Permission Check**: Role-based access control

### Security Measures
- **Rate Limiting**: Prevent OTP abuse
- **Input Validation**: Comprehensive validation using Zod schemas
- **NoSQL Injection Prevention**: Mongoose validation and parameterized queries
- **XSS Protection**: Input sanitization and output encoding
- **CORS Configuration**: Proper CORS setup
- **HTTPS Only**: Enforce SSL/TLS
- **Passwordless**: No password storage for better security
- **MongoDB Security**: Role-based access control, field-level encryption for sensitive data

---

## File Management

### File Upload System
```typescript
interface FileUploadResponse {
  id: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}
```

### File Types & Validation
- **Images**: JPEG, PNG, WebP (max 5MB)
- **Documents**: PDF, DOC, DOCX (max 10MB)
- **Validation**: File type, size, virus scanning

### Image Optimization
- **Resizing**: Multiple sizes generated
- **Compression**: WebP format support
- **CDN**: Fast delivery globally
- **Watermarking**: Optional for documents

---

## Notifications System

### Notification Types
```typescript
enum NotificationType {
  OFFICE_UPDATE = 'office_update',
  NEW_REVIEW = 'new_review',
  BOOKMARK_ADDED = 'bookmark_added',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  VERIFICATION_STATUS = 'verification_status',
  FEATURED_OFFICE = 'featured_office'
}
```

### Delivery Channels
- **In-App**: Real-time via Socket.io
- **Push Notifications**: Firebase Cloud Messaging
- **Email**: SendGrid for important updates
- **SMS**: Twilio for critical notifications

### Notification Templates
```typescript
interface NotificationTemplate {
  type: NotificationType;
  title: {
    ar: string;
    en: string;
  };
  message: {
    ar: string;
    en: string;
  };
  channels: ('app' | 'push' | 'email' | 'sms')[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}
```

### Real-time Features
- **Live Notifications**: Socket.io integration
- **Read Status**: Track read/unread status
- **Batch Operations**: Mark multiple as read
- **Preferences**: User notification preferences

---

## Admin & Moderation

### Admin Dashboard Features
- **User Management**: View, edit, suspend users
- **Company Verification**: Document review and approval
- **Content Moderation**: Review and moderate content
- **Featured Offices**: Manage featured listings
- **Analytics Dashboard**: Platform statistics and trends
- **Announcement System**: Send system-wide messages
- **Action Logs**: Track all admin actions

### Moderation Workflow
1. **Company Registration**: Document verification required
2. **Review Moderation**: Flagged reviews review
3. **Content Review**: User-generated content moderation
4. **Dispute Resolution**: Handle user complaints

### Approval Processes
```typescript
interface ApprovalProcess {
  type: 'company_verification' | 'document_upload' | 'review_moderation';
  status: 'pending' | 'approved' | 'rejected';
  submittedBy: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  reason?: string;
  metadata?: Record<string, any>;
}
```

### Featured Office Management
- **Priority System**: Numerical priority ranking
- **Manual Selection**: Admin can feature offices
- **Automated Criteria**: Based on rating, activity, verification
- **Geographic Distribution**: Ensure fair representation

---

## Analytics & Reporting

### Company Analytics
- **Profile Views**: Track profile visibility
- **Contact Metrics**: Phone/email/SMS clicks
- **Bookmark Trends**: User interest over time
- **Review Analysis**: Rating trends and feedback
- **Service Performance**: Popular services identification

### Platform Analytics
- **User Growth**: Registration trends
- **Geographic Distribution**: User locations
- **Category Performance**: Popular service categories
- **Revenue Tracking**: Platform revenue metrics
- **Engagement Metrics**: Active users, session duration

### Reporting Features
- **Export Capabilities**: CSV, PDF report generation
- **Scheduled Reports**: Automated email reports
- **Custom Date Ranges**: Flexible time period selection
- **Comparative Analysis**: Period-over-period comparisons

### Performance Monitoring
- **API Performance**: Response time tracking
- **Error Rates**: Monitor system errors
- **Database Performance**: Query optimization
- **CDN Performance**: Asset delivery metrics

---

## Deployment & Infrastructure
### MongoDB-Specific Architecture
- **MongoDB Atlas**: Managed MongoDB with automatic backups
- **Replica Set**: Primary + 2 secondary nodes for high availability
- **Sharding**: Horizontal scaling by office location/city
- **Atlas Search**: Built-in full-text search for Arabic/English
- **Change Streams**: Real-time data synchronization
- **Data Lake**: Analytics on operational data
- **Backup**: Continuous backups with point-in-time recovery

### Environment Configuration
```typescript
interface EnvironmentConfig {
  NODE_ENV: 'development' | 'staging' | 'production';
  PORT: number;

  // Database
  MONGODB_URI: string; // MongoDB  

  // Authentication
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;

  // External Services
  TWILIO_ACCOUNT_SID: string;
  TWILIO_AUTH_TOKEN: string;
  SENDGRID_API_KEY: string;

  // Storage
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;
  AWS_S3_BUCKET: string;
  AWS_REGION: string;

  // Firebase
  FCM_SERVICE_ACCOUNT_KEY: string;

  // MongoDB Atlas
  MONGODB_ATLAS_PUBLIC_KEY: string;
  MONGODB_ATLAS_PRIVATE_KEY: string;
  MONGODB_ATLAS_GROUP_ID: string;

  // CORS
  ALLOWED_ORIGINS: string[];
}
```

### Monitoring & Logging
- **Application Logs**: Winston with structured logging
- **Error Tracking**: Sentry for error monitoring
- **Performance Monitoring**: APM tools
- **Health Checks**: Endpoint monitoring
- **Alerting**: Automated alert system

### Backup & Recovery
- **Database Backups**: MongoDB Atlas continuous backups
- **Point-in-time Recovery**: 35-day retention with Atlas
- **File Backups**: S3 versioning enabled
- **Disaster Recovery**: Multi-region replication with Atlas Global Clusters

---

## API Rate Limiting

### Rate Limiting Strategy
```typescript
interface RateLimitConfig {
  auth: {
    sendOtp: '5 per hour per IP',
    verifyOtp: '10 per minute per phone'
  },
  general: {
    default: '1000 requests per hour per user',
    search: '100 requests per minute per user',
    upload: '10 requests per minute per user'
  },
  admin: {
    bulkActions: '100 requests per hour per admin',
    exports: '10 requests per hour per admin'
  }
}
```

### Implementation
- **Sliding Window**: Fair rate limiting
- **Burst Protection**: Handle traffic spikes
- **Whitelist**: Admin and system endpoints

---

## MongoDB Indexing Strategy

### Critical Indexes for Performance

#### Users Collection
```javascript
// Authentication queries
db.users.createIndex({ "phone": 1 }, { unique: true })
db.users.createIndex({ "email": 1 }, { unique: true, sparse: true })

// Admin queries
db.users.createIndex({ "role": 1, "isActive": 1 })
db.users.createIndex({ "companyProfile.verificationStatus": 1 })

// Search queries
db.users.createIndex({ "profile.city": 1 })
```

#### Offices Collection
```javascript
// Geographic queries (CRITICAL)
db.offices.createIndex({ "location": "2dsphere" })

// Search and filtering
db.offices.createIndex({ "city": 1, "category": 1, "isActive": 1 })
db.offices.createIndex({ "isFeatured": 1, "featuredPriority": -1 })
db.offices.createIndex({ "rating": -1, "ratingCount": -1 })

// Text search (Arabic + English)
db.offices.createIndex({
  "name": "text",
  "summary": "text",
  "city": "text"
}, {
  weights: { "name": 10, "summary": 5, "city": 3 },
  name: "office_text_search"
})

// Company queries
db.offices.createIndex({ "companyId": 1 })
```

#### Reviews Collection
```javascript
// Office reviews display
db.reviews.createIndex({ "officeId": 1, "isApproved": 1, "createdAt": -1 })
db.reviews.createIndex({ "officeId": 1, "rating": -1 })

// User review history
db.reviews.createIndex({ "userId": 1 }, { unique: false })

// Review likes
db.reviews.createIndex({ "likes.userId": 1 })

// Moderation
db.reviews.createIndex({ "isApproved": 1 })
```

#### Bookmarks Collection
```javascript
// User bookmarks
db.bookmarks.createIndex({ "userId": 1, "officeId": 1 }, { unique: true })
db.bookmarks.createIndex({ "userId": 1, "createdAt": -1 })
```

#### Notifications Collection
```javascript
// User notifications
db.notifications.createIndex({ "userId": 1, "isRead": 1, "createdAt": -1 })
db.notifications.createIndex({ "type": 1 })

// Cleanup old notifications
db.notifications.createIndex({ "createdAt": 1 }, { expireAfterSeconds: 2592000 }) // 30 days
```

#### Analytics Collection
```javascript
// Time-series queries
db.analytics.createIndex({ "metric": 1, "timestamp": -1 })
db.analytics.createIndex({ "dimensions.officeId": 1, "timestamp": -1 })
db.analytics.createIndex({ "dimensions.city": 1, "metric": 1, "timestamp": -1 })
```

### Compound Indexes for Common Query Patterns

```javascript
// Office search with filters
db.offices.createIndex({
  "city": 1,
  "category": 1,
  "isActive": 1,
  "isFeatured": -1,
  "rating": -1
})

// Admin company verification
db.users.createIndex({
  "role": 1,
  "companyProfile.verificationStatus": 1,
  "createdAt": -1
})

// Popular offices by city
db.offices.createIndex({
  "city": 1,
  "rating": -1,
  "ratingCount": -1,
  "isFeatured": -1
})
```

---

## MongoDB Query Optimization Patterns

### 1. Office Search with Geospatial + Filters
```javascript
// Find nearby offices with filters
const nearbyOffices = await db.offices.find({
  location: {
    $near: {
      $geometry: { type: "Point", coordinates: [longitude, latitude] },
      $maxDistance: 50000 // 50km
    }
  },
  isActive: true,
  category: { $in: ['import', 'export'] },
  rating: { $gte: 4.0 }
}).sort({ isFeatured: -1, rating: -1 }).limit(20)
```

### 2. Aggregation Pipeline for Analytics
```javascript
// Office analytics dashboard
const officeStats = await db.offices.aggregate([
  { $match: { isActive: true } },
  { $lookup: {
    from: 'reviews',
    localField: '_id',
    foreignField: 'officeId',
    as: 'reviews'
  }},
  { $addFields: {
    avgRating: { $avg: '$reviews.rating' },
    totalReviews: { $size: '$reviews' }
  }},
  { $group: {
    _id: '$city',
    totalOffices: { $sum: 1 },
    avgRating: { $avg: '$avgRating' },
    featuredOffices: {
      $sum: { $cond: ['$isFeatured', 1, 0] }
    }
  }},
  { $sort: { avgRating: -1 } }
])
```

### 3. Text Search with Arabic Support
```javascript
// Full-text search
const searchResults = await db.offices.find({
  $text: { $search: "تخليص جمركي" },
  isActive: true
}).sort({ score: { $meta: 'textScore' } })
```

### 4. Pagination with Efficient Cursor
```javascript
// Efficient pagination using _id
const getOffices = async (lastId = null, limit = 20) => {
  const query = lastId ? { _id: { $gt: lastId } } : {}
  return await db.offices
    .find(query)
    .sort({ _id: 1 })
    .limit(limit)
    .toArray()
}
```

---

## MongoDB Change Streams for Real-time Features

### Real-time Notifications
```javascript
const watchOfficeChanges = () => {
  const changeStream = db.offices.watch([
    { $match: { 'operationType': { $in: ['update', 'insert'] } } }
  ])

  changeStream.on('change', (change) => {
    if (change.fullDocument.isFeatured) {
      // Send notification to subscribed users
      notifyOfficeFeatured(change.fullDocument)
    }
  })
}
```

### Real-time Review Updates
```javascript
const watchReviewChanges = () => {
  const changeStream = db.reviews.watch([
    { $match: {
      'operationType': 'insert',
      'fullDocument.isApproved': true
    }}
  ])

  changeStream.on('change', (change) => {
    // Notify office about new review
    notifyOfficeReview(change.fullDocument)
  })
}