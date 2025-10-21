import { Router, type Router as IRouter } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getUserReviews,
  updateReview,
  deleteReview,
  likeReview,
} from "../controllers/review.controller";

const router: IRouter = Router();

router.get("/", authenticate, getUserReviews);
router.put("/:id", authenticate, updateReview);
router.delete("/:id", authenticate, deleteReview);
router.post("/:id/like", authenticate, likeReview);

export default router;
