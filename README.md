# Mukhalis Backend API

Backend API for Mukhalis - Saudi Customs Clearance Marketplace Platform

## Tech Stack

- **Backend**: Node.js + Express.js + TypeScript
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT + OTP (Twilio)
- **File Storage**: Local filesystem
- **Real-time**: Socket.io
- **Email**: SendGrid

## Getting Started

### Prerequisites

- Node.js >= 18.x
- MongoDB >= 6.x
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd backend
```

2. Install dependencies

```bash
npm install
```

3. Create environment file

```bash
cp .env.example .env
```

4. Configure environment variables in `.env`

5. Create required directories

```bash
mkdir -p uploads/{avatars,documents,services,covers,licenses}
mkdir -p logs
```

### Development

Run in development mode with hot reload:

```bash
npm run dev
```

### Production

Build and run:

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/          # Mongoose models
├── routes/          # API routes
├── services/        # Business logic
├── utils/           # Utility functions
├── validators/      # Input validation schemas
├── types/           # TypeScript types
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

## API Documentation

See [backend-api-documentation.md](./backend-api-documentation.md) for complete API documentation.

## Environment Variables

See `.env.example` for all required environment variables.

## License

Private - All rights reserved
