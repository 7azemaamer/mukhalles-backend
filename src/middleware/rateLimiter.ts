import rateLimit from "express-rate-limit";

export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many authentication attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  message: {
    success: false,
    message: "Too many requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many upload attempts. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many search requests. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
});
