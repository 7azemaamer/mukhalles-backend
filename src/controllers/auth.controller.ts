import { Request, Response } from "express";
import { User } from "../models";
import {
  createOTPSession,
  verifyOTP,
  resendOTP,
} from "../services/otp.service";
import { generateTokens, verifyRefreshToken } from "../utils/jwt";
import { AuthRequest, UserRole } from "../types";
import logger from "../utils/logger";

export const sendOTP = async (req: Request, res: Response) => {
  try {
    const { phone, countryCode } = req.body;

    if (!phone) {
      return res.status(400).json({
        success: false,
        message: "Phone number is required",
      });
    }

    const fullPhone = `${countryCode || "+966"}${phone}`;
    const { sessionId, otp } = await createOTPSession(fullPhone);

    logger.info(`OTP sent to ${fullPhone}`);

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      sessionId,
      ...(process.env.NODE_ENV === "development" && { otp }),
    });
  } catch (error) {
    logger.error("Send OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP",
    });
  }
};

export const verifyOTPController = async (req: Request, res: Response) => {
  try {
    const { phone, otp, sessionId, countryCode } = req.body;

    if (!phone || !otp || !sessionId) {
      return res.status(400).json({
        success: false,
        message: "Phone, OTP, and sessionId are required",
      });
    }

    const fullPhone = `${countryCode || "+966"}${phone}`;
    const isValid = await verifyOTP(fullPhone, otp, sessionId);

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }

    let user = await User.findOne({ phone: fullPhone });

    if (!user) {
      user = await User.create({
        phone: fullPhone,
        role: UserRole.INDIVIDUAL,
        isVerified: true,
        isActive: true,
      });
    }

    const tokens = generateTokens({
      userId: user._id.toString(),
      phone: user.phone,
      role: user.role,
      permissions: [],
    });

    const isProfileComplete =
      user.role === UserRole.INDIVIDUAL
        ? !!user.individualProfile?.fullName
        : !!user.companyProfile?.nameAr;

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        phone: user.phone,
        role: user.role,
        isProfileComplete,
      },
      tokens,
    });
  } catch (error) {
    logger.error("Verify OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to verify OTP",
    });
  }
};

export const resendOTPController = async (req: Request, res: Response) => {
  try {
    const { phone, sessionId, countryCode } = req.body;

    if (!phone || !sessionId) {
      return res.status(400).json({
        success: false,
        message: "Phone and sessionId are required",
      });
    }

    const fullPhone = `${countryCode || "+966"}${phone}`;
    const success = await resendOTP(fullPhone, sessionId);

    if (!success) {
      return res.status(400).json({
        success: false,
        message: "Failed to resend OTP. Session may have expired.",
      });
    }

    res.status(200).json({
      success: true,
      message: "OTP resent successfully",
      retryAfter: 60,
    });
  } catch (error) {
    logger.error("Resend OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend OTP",
    });
  }
};

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Refresh token required",
      });
    }

    const decoded = verifyRefreshToken(token);
    const user = await User.findById(decoded.userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const tokens = generateTokens({
      userId: user._id.toString(),
      phone: user.phone,
      role: user.role,
      permissions: [],
    });

    res.status(200).json({
      success: true,
      tokens,
    });
  } catch (error) {
    logger.error("Refresh token error:", error);
    res.status(401).json({
      success: false,
      message: "Invalid or expired refresh token",
    });
  }
};

export const logout = async (req: AuthRequest, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    logger.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
};
