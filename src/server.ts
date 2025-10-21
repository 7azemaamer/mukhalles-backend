import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import connectDB from "./config/database";
import logger from "./utils/logger";

const PORT = process.env.PORT || 5000;

// Connect to Database
connectDB()
  .then(() => {
    // Start server
    const server = app.listen(PORT, () => {
      logger.info(
        `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
      );
    });

    // Handle unhandled promise rejections
    process.on("unhandledRejection", (err: Error) => {
      logger.error("Unhandled Rejection:", err);
      server.close(() => process.exit(1));
    });

    // Handle uncaught exceptions
    process.on("uncaughtException", (err: Error) => {
      logger.error("Uncaught Exception:", err);
      process.exit(1);
    });

    // Graceful shutdown
    process.on("SIGTERM", () => {
      logger.info("SIGTERM received. Shutting down gracefully...");
      server.close(() => {
        logger.info("Process terminated");
      });
    });
  })
  .catch((error) => {
    logger.error("Database connection failed:", error);
    process.exit(1);
  });
