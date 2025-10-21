import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import mongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import path from "path";

import logger from "./utils/logger";
import errorHandler from "./middleware/errorHandler";
import notFoundHandler from "./middleware/notFoundHandler";

// Import routes
import authRoutes from "./routes/auth.routes";
import userRoutes from "./routes/user.routes";
import companyRoutes from "./routes/company.routes";
import officeRoutes from "./routes/office.routes";
import reviewRoutes from "./routes/review.routes";
import bookmarkRoutes from "./routes/bookmark.routes";
import notificationRoutes from "./routes/notification.routes";
import adminRoutes from "./routes/admin.routes";
import uploadRoutes from "./routes/upload.routes";
import searchRoutes from "./routes/search.routes";
import analyticsRoutes from "./routes/analytics.routes";
import categoryRoutes from "./routes/category.routes";
import cityRoutes from "./routes/city.routes";

const app: Application = express();

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || "*",
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Prevent parameter pollution
app.use(hpp());

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(
    morgan("combined", {
      stream: { write: (message) => logger.info(message.trim()) },
    })
  );
}

// Serve static files (uploads)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Health check endpoint
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/company", companyRoutes);
app.use("/api/offices", officeRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/cities", cityRoutes);

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

export default app;
