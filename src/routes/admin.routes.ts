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
  updateUserRole,
  bulkUpdateRoles,
  getRoleHistory,
  getRoleStatistics,
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

// Role Management Routes
router.put(
  "/users/:id/role",
  authenticate,
  authorize(UserRole.ADMIN),
  updateUserRole
);
router.post(
  "/users/bulk-role-update",
  authenticate,
  authorize(UserRole.ADMIN),
  bulkUpdateRoles
);
router.get(
  "/role-history",
  authenticate,
  authorize(UserRole.ADMIN),
  getRoleHistory
);
router.get(
  "/role-statistics",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  getRoleStatistics
);

export default router;
