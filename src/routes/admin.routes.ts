import { Router, type Router as IRouter } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { UserRole } from "../types";
import {
  getDashboard,
  getUsers,
  getUserById,
  updateUserStatus,
  verifyCompany,
  featureOffice,
  getReviewsForModeration,
  approveReview,
  deleteReview,
} from "../controllers/admin.controller";

const router: IRouter = Router();

router.get(
  "/dashboard",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  getDashboard
);
router.get("/users", authenticate, authorize(UserRole.ADMIN), getUsers);
router.get("/users/:id", authenticate, authorize(UserRole.ADMIN), getUserById);
router.put(
  "/users/:id/status",
  authenticate,
  authorize(UserRole.ADMIN),
  updateUserStatus
);
router.put(
  "/companies/:id/verify",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  verifyCompany
);
router.put(
  "/offices/:id/featured",
  authenticate,
  authorize(UserRole.ADMIN),
  featureOffice
);
router.get(
  "/reviews",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  getReviewsForModeration
);
router.put(
  "/reviews/:id/approve",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  approveReview
);
router.delete(
  "/reviews/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  deleteReview
);

export default router;
