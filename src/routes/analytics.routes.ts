import { Router, type Router as IRouter } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { UserRole } from "../types";
import {
  getCompanyAnalytics,
  getPlatformAnalytics,
} from "../controllers/analytics.controller";

const router: IRouter = Router();

router.get("/company/:id", authenticate, getCompanyAnalytics);
router.get(
  "/admin",
  authenticate,
  authorize(UserRole.ADMIN),
  getPlatformAnalytics
);

export default router;
