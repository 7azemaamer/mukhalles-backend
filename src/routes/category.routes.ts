import { Router, type Router as IRouter } from "express";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategoriesAdmin,
} from "../controllers/category.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { UserRole } from "../types";

const router: IRouter = Router();

// Public routes
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);

// Admin only routes
router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  createCategory
);
router.put(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  updateCategory
);
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  deleteCategory
);

// Admin endpoint to get all categories (including inactive)
router.get(
  "/admin/all",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  getAllCategoriesAdmin
);

export default router;
