import { Router, type Router as IRouter } from "express";
import {
  sendOTP,
  verifyOTPController,
  resendOTPController,
  refreshToken,
  logout,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { authLimiter } from "../middleware/rateLimiter";

const router: IRouter = Router();

router.post("/send-otp", authLimiter, sendOTP);
router.post("/verify-otp", authLimiter, verifyOTPController);
router.post("/resend-otp", authLimiter, resendOTPController);
router.post("/refresh", refreshToken);
router.post("/logout", authenticate, logout);

export default router;
