import jwt from "jsonwebtoken";
import { UserRole } from "../types";

interface JWTPayload {
  userId: string;
  phone: string;
  role: UserRole;
  permissions: string[];
}

export const generateAccessToken = (payload: JWTPayload): string => {
  const expiresIn = process.env.JWT_ACCESS_EXPIRATION || "15m";
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn } as any);
};

export const generateRefreshToken = (payload: JWTPayload): string => {
  const expiresIn = process.env.JWT_REFRESH_EXPIRATION || "7d";
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn,
  } as any);
};

export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
};

export const verifyRefreshToken = (token: string): JWTPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as JWTPayload;
};

export const generateTokens = (payload: JWTPayload) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};
