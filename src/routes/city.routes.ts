import { Router, type Router as IRouter } from "express";
import {
  getAllCities,
  getCityById,
  createCity,
  updateCity,
  deleteCity,
  getAllCitiesAdmin,
} from "../controllers/city.controller";
import { authenticate, authorize } from "../middleware/auth.middleware";
import { UserRole } from "../types";

const router: IRouter = Router();

// Public routes
router.get("/", getAllCities);
router.get("/:id", getCityById);

// Admin only routes
router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  createCity
);
router.put(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  updateCity
);
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  deleteCity
);

// Admin endpoint to get all cities (including inactive)
router.get(
  "/admin/all",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MODERATOR),
  getAllCitiesAdmin
);

export default router;
