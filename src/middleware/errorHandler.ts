import { Request, Response, NextFunction } from "express";
import logger from "../utils/logger";

interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // Log error
  logger.error(`Error: ${message}`, {
    statusCode,
    url: req.url,
    method: req.method,
    ip: req.ip,
    stack: err.stack,
  });

  // Mongoose validation error
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Validation Error";
  }

  // Mongoose duplicate key error
  if (err.name === "MongoServerError" && (err as any).code === 11000) {
    statusCode = 400;
    message = "Duplicate field value entered";
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // Send error response
  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
