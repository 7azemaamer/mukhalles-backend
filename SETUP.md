# Mukhalis Backend - Setup Guide

## Prerequisites

- Node.js v18+ installed
- MongoDB v6+ installed and running
- npm or yarn package manager

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Update the `.env` file with your configuration:

- MongoDB connection string
- JWT secrets (generate secure random strings)
- Twilio credentials (for OTP SMS)
- SendGrid API key (for emails)
- File storage settings

### 3. Create Required Directories

```bash
mkdir -p uploads/avatars uploads/documents uploads/services uploads/covers uploads/licenses
mkdir -p logs
```

### 4. Start MongoDB

Make sure MongoDB is running:

```bash
# If using MongoDB locally
mongod

# Or if using MongoDB as a service
sudo systemctl start mongod
```

### 5. Development Mode

Run the server in development mode with hot reload:

```bash
npm run dev
```

The server will start on `http://localhost:5000`

### 6. Production Build

For production deployment:

```bash
npm run build
npm start
```

## Testing the API

### Health Check

```bash
curl http://localhost:5000/health
```

Expected response:

```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Test Authentication

1. Send OTP:

```bash
curl -X POST http://localhost:5000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "501234567", "countryCode": "+966"}'
```

2. Verify OTP (use the OTP from console logs in dev mode):

```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "501234567", "countryCode": "+966", "otp": "123456", "sessionId": "session_id_here"}'
```

## API Documentation

All endpoints are documented in `backend-api-documentation.md`

### Main API Routes

- **Authentication**: `/api/auth/*`
- **Users**: `/api/users/*`
- **Companies**: `/api/company/*`
- **Offices**: `/api/offices/*`
- **Reviews**: `/api/reviews/*`
- **Bookmarks**: `/api/bookmarks/*`
- **Notifications**: `/api/notifications/*`
- **Admin**: `/api/admin/*`
- **Upload**: `/api/upload/*`
- **Search**: `/api/search/*`
- **Analytics**: `/api/analytics/*`

## Database Indexes

MongoDB indexes are automatically created on server start via Mongoose schemas. For optimal performance, ensure these indexes are created:

```javascript
// Users
db.users.createIndex({ phone: 1 });
db.users.createIndex({ "companyProfile.crNumber": 1 });

// Offices
db.offices.createIndex({ location: "2dsphere" });
db.offices.createIndex({ city: 1, category: 1, isActive: 1 });
db.offices.createIndex({ name: "text", summary: "text" });

// Reviews
db.reviews.createIndex({ officeId: 1, isApproved: 1, createdAt: -1 });

// Bookmarks
db.bookmarks.createIndex({ userId: 1, officeId: 1 });
```

## Troubleshooting

### MongoDB Connection Issues

If you see "MongoDB connection failed":

1. Check if MongoDB is running
2. Verify MONGODB_URI in .env file
3. Ensure MongoDB port (27017) is not blocked

### Port Already in Use

If port 5000 is already in use:

1. Change PORT in .env file
2. Or stop the process using port 5000

### File Upload Issues

If file uploads fail:

1. Ensure uploads directory exists with proper permissions
2. Check MAX_FILE_SIZE in .env
3. Verify disk space availability

## Production Deployment

### Environment Variables

Update production environment variables:

- Set `NODE_ENV=production`
- Use strong JWT secrets
- Configure production MongoDB (MongoDB Atlas recommended)
- Set up Twilio and SendGrid for production
- Update ALLOWED_ORIGINS for CORS

### Security Checklist

- ✅ Strong JWT secrets
- ✅ HTTPS enabled
- ✅ Rate limiting configured
- ✅ CORS properly configured
- ✅ MongoDB authentication enabled
- ✅ File upload validation
- ✅ Input sanitization enabled

### Monitoring

Logs are stored in:

- `logs/error.log` - Error logs
- `logs/combined.log` - All logs
- `logs/exceptions.log` - Unhandled exceptions

## Support

For issues or questions, refer to the API documentation or contact the development team.

---

**Last Updated**: 2024-01-15
